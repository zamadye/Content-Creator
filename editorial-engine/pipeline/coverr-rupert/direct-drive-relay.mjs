#!/usr/bin/env node
/**
 * One approved Coverr original -> private Google Drive, with no media in Git.
 * Runs only in an explicitly triggered GitHub Actions job. The runner downloads
 * to a private temporary file and publishes a short-lived RSA public key and
 * sanitized metadata in a check run. The owner encrypts a one-use Drive upload
 * session to that key; only the ciphertext is committed to this fixed branch.
 * The private key, original media, API key, signed URLs and Drive URI are never
 * logged or committed. Session writes are not retried on ambiguous failures.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Transform, Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';
import { checkCandidate, cleanText, decryptBytes, SafeError } from '../coverr-transfer/transfer.mjs';
import { checkUploadStatus } from '../drive-relay/relay-upload.mjs';

export const REPO='zamadye/Content-Creator', BRANCH='arena/54cb36c6-content-creator';
export const MEDIA_LIMIT=100*1024*1024, CHUNK=2*1024*1024;
const PAYLOAD='editorial-engine/pipeline/coverr-rupert/drive-session-envelope.json';
export class RelayError extends Error { constructor(code){super(code);this.code=code;} }
const shaOk=s=>typeof s==='string' && /^[a-f0-9]{64}$/.test(s);
const nonceOk=s=>typeof s==='string' && /^[a-f0-9]{32}$/.test(s);
export function validateSession(obj,ready){
 if(!obj || !ready || obj.nonce!==ready.nonce || !nonceOk(obj.nonce) || obj.id!==ready.id ||
    obj.run_id!==ready.run_id || obj.size!==ready.size || obj.sha256!==ready.sha256 ||
    !Number.isSafeInteger(obj.size) || obj.size<1000 || obj.size>MEDIA_LIMIT || !shaOk(obj.sha256)) throw new RelayError('SESSION_METADATA_MISMATCH');
 let u;try{u=new URL(obj.drive_uri)}catch{throw new RelayError('BAD_DRIVE_URI')}
 if(u.protocol!=='https:' || u.hostname!=='www.googleapis.com' || (u.port && u.port!=='443') ||
    u.pathname!=='/upload/drive/v3/files' || u.username || u.password || u.hash ||
    u.searchParams.get('uploadType')!=='resumable' || !u.searchParams.get('upload_id')) throw new RelayError('BAD_DRIVE_URI');
 return {...obj,drive_uri:u.toString()};
}
export function validateDriveResponse(httpStatus,uploadStatus,last){
 if(!Number.isInteger(httpStatus)||httpStatus<100||httpStatus>=400||(httpStatus>=300&&httpStatus!==308))throw new RelayError(`DRIVE_UPLOAD_HTTP_${httpStatus}`);
 try{return checkUploadStatus(uploadStatus,last)}catch{throw new RelayError('DRIVE_STATUS_UNCONFIRMED')}
}
export function validateProbe(data){
 const s=data?.streams?.find(x=>x.codec_type==='video') || data?.streams?.[0];
 const width=Number(s?.width),height=Number(s?.height),duration=Number(data?.format?.duration);
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||!Number.isFinite(duration)||duration<=0) throw new RelayError('SOURCE_PROBE_INVALID');
 return {width,height,duration_seconds:Math.round(duration*1000)/1000,codec:cleanText(s?.codec_name,'',40),fps:cleanText(s?.avg_frame_rate,'',40)};
}
function emit(obj){
 const line=JSON.stringify(obj);console.log('COVERR_DIRECT_DRIVE='+line);
 if(process.env.GITHUB_ACTIONS==='true')console.log('::notice title=Coverr private Drive transfer::'+line.replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'));
}
async function safeFetch(url,opts={},ms=30000,redirect='error'){
 try{return await fetch(url,{...opts,redirect,signal:AbortSignal.timeout(ms)})}catch{throw new RelayError('NETWORK_OR_TIMEOUT')}
}
function ghHeaders(token){return {'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'ContentCreator-Coverr-Private/1.0'}}
async function coverrApi(id,key,method='GET',auth='x-api-key'){
 const headers={'Accept':'application/json','User-Agent':'ContentCreator-Coverr-Private/1.0'};
 if(auth==='x-api-key')headers['x-api-key']=key;else headers.Authorization=`Bearer ${key}`;
 const endpoint=`https://api.coverr.co/videos/${id}${method==='PATCH'?'/stats/downloads':''}`;
 const r=await safeFetch(endpoint,{method,headers},30000);
 if(method==='PATCH')return r.status;
 if(!r.ok)throw new RelayError(`COVERR_${method}_HTTP_${r.status}`);
 const text=await r.text();if(text.length>2000000)throw new RelayError('COVERR_RESPONSE_TOO_LARGE');
 try{return JSON.parse(text)}catch{throw new RelayError('COVERR_BAD_JSON')}
}
async function track(id,key){
 const statuses=[];
 for(const auth of ['x-api-key','bearer']){
  const s=await coverrApi(id,key,'PATCH',auth);statuses.push(s);
  if(s>=200&&s<300)return {status:'PASS',http_statuses:statuses};
  // A 404 is an endpoint mismatch. Never retry authentication, access, or quota denials.
  if(s!==404)throw new RelayError(`COVERR_PATCH_HTTP_${s}`);
 }
 return {status:'NEEDS_REVIEW',http_statuses:statuses};
}
async function download(url,dest){
 let next=new URL(url),r;
 for(let i=0;i<5;i++){
  if(next.protocol!=='https:' || !/(^|\.)coverr\.co$/i.test(next.hostname) || next.username || next.password || (next.port&&next.port!=='443'))throw new RelayError('MEDIA_REDIRECT_BLOCKED');
  try{r=await fetch(next,{redirect:'manual',signal:AbortSignal.timeout(180000)})}catch{throw new RelayError('MEDIA_NETWORK')}
  if(r.status>=300&&r.status<400){const loc=r.headers.get('location');if(!loc)throw new RelayError('MEDIA_REDIRECT_MISSING');try{next=new URL(loc,next)}catch{throw new RelayError('MEDIA_REDIRECT_INVALID')}continue}
  break;
 }
 if(!r?.ok||!r.body)throw new RelayError(`COVERR_MEDIA_HTTP_${r?.status||0}`);
 if(Number(r.headers.get('content-length')||0)>MEDIA_LIMIT)throw new RelayError('MEDIA_OVER_100_MB');
 let size=0;const hash=crypto.createHash('sha256'),md5=crypto.createHash('md5');
 const limiter=new Transform({transform(chunk,enc,done){size+=chunk.length;if(size>MEDIA_LIMIT)return done(new RelayError('MEDIA_OVER_100_MB'));hash.update(chunk);md5.update(chunk);done(null,chunk)}});
 try{await pipeline(Readable.fromWeb(r.body),limiter,fs.createWriteStream(dest,{mode:0o600}))}catch(e){if(e instanceof RelayError)throw e;throw new RelayError('MEDIA_STREAM_FAILED')}
 if(size<1000)throw new RelayError('MEDIA_TOO_SMALL');
 return {size,sha256:hash.digest('hex'),md5:md5.digest('hex')};
}
function probe(source){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,width,height,avg_frame_rate:format=duration','-of','json',source],{encoding:'utf8',timeout:30000});
 if(p.error?.code==='ENOENT')throw new RelayError('FFPROBE_MISSING');if(p.status!==0)throw new RelayError('SOURCE_PROBE_FAILED');
 try{return validateProbe(JSON.parse(p.stdout))}catch(e){if(e instanceof RelayError)throw e;throw new RelayError('SOURCE_PROBE_INVALID')}
}
async function publishHandshake(token,ready){
 const head=process.env.GITHUB_SHA||'';if(!/^[a-f0-9]{40}$/.test(head))throw new RelayError('BAD_HEAD_SHA');
 const body={name:'Coverr Rupert private relay',head_sha:head,status:'in_progress',output:{title:'Private transfer ready',summary:JSON.stringify(ready)}};
 const r=await safeFetch(`https://api.github.com/repos/${REPO}/check-runs`,{method:'POST',headers:{...ghHeaders(token),'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!r.ok)throw new RelayError(`CHECK_CREATE_HTTP_${r.status}`);
 const o=await r.json();if(!Number.isSafeInteger(o.id))throw new RelayError('CHECK_RESPONSE_INVALID');return o.id;
}
async function closeHandshake(token,id,success){
 if(!id)return;try{await safeFetch(`https://api.github.com/repos/${REPO}/check-runs/${id}`,{method:'PATCH',headers:{...ghHeaders(token),'Content-Type':'application/json'},body:JSON.stringify({status:'completed',conclusion:success?'success':'failure',output:{title:'Private transfer closed',summary:'Ephemeral key expired.'}})})}catch{}
}
async function getSession(token,privateKey,ready){
 const url=`https://api.github.com/repos/${REPO}/contents/${PAYLOAD}?ref=${encodeURIComponent(BRANCH)}`,deadline=Date.now()+20*60*1000;
 while(Date.now()<deadline){
  const r=await safeFetch(url,{headers:ghHeaders(token)});
  if(r.status===404){await new Promise(ok=>setTimeout(ok,5000));continue}
  if(!r.ok)throw new RelayError(`MANIFEST_HTTP_${r.status}`);
  let payload;try{const o=await r.json();payload=JSON.parse(Buffer.from(o.content,'base64').toString('utf8'))}catch{throw new RelayError('MANIFEST_INVALID')}
  if(payload.nonce!==ready.nonce){await new Promise(ok=>setTimeout(ok,5000));continue}
  if(typeof payload.envelope_b64!=='string'||payload.envelope_b64.length>50000)throw new RelayError('BAD_ENVELOPE');
  let value;try{value=JSON.parse(decryptBytes(Buffer.from(payload.envelope_b64,'base64'),privateKey).toString('utf8'))}catch{throw new RelayError('ENVELOPE_DECRYPT_FAILED')}
  return validateSession(value,ready);
 }
 throw new RelayError('ENVELOPE_WAIT_TIMEOUT');
}
async function upload(session,source){
 let offset=0,fd=fs.openSync(source,'r');const hash=crypto.createHash('sha256');
 try{
  while(offset<session.size){
   const len=Math.min(CHUNK,session.size-offset),buf=Buffer.allocUnsafe(len);let n=0;
   while(n<len){const k=fs.readSync(fd,buf,n,len-n,offset+n);if(k<=0)throw new RelayError('SOURCE_READ_FAILED');n+=k}
   hash.update(buf);const last=offset+len===session.size;
   if(last && hash.digest('hex')!==session.sha256)throw new RelayError('SOURCE_SHA_MISMATCH');
   const r=await safeFetch(session.drive_uri,{method:'PUT',headers:{'Content-Type':'application/octet-stream','Content-Length':String(len),'X-Goog-Upload-Command':last?'upload, finalize':'upload','X-Goog-Upload-Offset':String(offset),'X-Goog-Upload-Total-Size':String(session.size)},body:buf},180000,'manual');
   // The resumable protocol's status header is authoritative. A 308 can mean
   // an active session and must not be followed as a redirect or treated as
   // completion. Never follow any redirected capability URL.
   validateDriveResponse(r.status,r.headers.get('x-goog-upload-status'),last);
   if(last){let o;try{o=await r.json()}catch{throw new RelayError('DRIVE_RESPONSE_INVALID')}if(!/^[A-Za-z0-9_-]{10,200}$/.test(o.id||''))throw new RelayError('DRIVE_FILE_ID_MISSING')}
   offset+=len;console.log(`PRIVATE_DRIVE_UPLOAD_PROGRESS=${offset}/${session.size}`);
  }
 }finally{fs.closeSync(fd)}
 return {size:session.size,sha256:session.sha256};
}
async function main(){
 const id=process.env.COVERR_VIDEO_ID||'',key=process.env.COVERR_API_KEY||'',token=process.env.GITHUB_TOKEN||'',run_id=process.env.GITHUB_RUN_ID||'';
 let dir,checkId,success=false;
 try{
  if(id!=='azy1Cd1ZeQ'||!key||!token||process.env.GITHUB_REPOSITORY!==REPO||!/^[0-9]+$/.test(run_id))throw new RelayError('MISSING_OR_UNAPPROVED_INPUT');
  // Fail before consuming API requests if the runner toolchain is unavailable.
  if(spawnSync('ffprobe',['-version'],{stdio:'ignore',timeout:10000}).status!==0)throw new RelayError('FFPROBE_MISSING');
  dir=fs.mkdtempSync(path.join(os.tmpdir(),'coverr-private-'));fs.chmodSync(dir,0o700);const source=path.join(dir,'source.mp4');
  const original=await coverrApi(id,key),candidate=checkCandidate(original,id,key),tracking=await track(id,key);
  const bytes=await download(candidate.mediaUrl,source),video=probe(source);
  const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const ready={status:'READY',nonce:crypto.randomBytes(16).toString('hex'),id,run_id,...bytes,probe:video,
   title:candidate.title,creator:candidate.creator,description:cleanText(original.description,key,250),tracking,
   public_key_b64:Buffer.from(publicKey).toString('base64')};
  checkId=await publishHandshake(token,ready);
  emit({status:'READY',id,run_id,size:bytes.size,sha256:bytes.sha256,probe:video,tracking});
  const session=await getSession(token,privateKey,ready),result=await upload(session,source);
  emit({status:'PASS_UPLOAD',id,run_id,...result});success=true;
 }catch(e){
  const code=e instanceof RelayError||e instanceof SafeError?e.code:'UNEXPECTED_FAILURE';emit({status:'FAIL',id:/^[A-Za-z0-9_-]+$/.test(id)?id:null,code});process.exitCode=1;
 }finally{await closeHandshake(token,checkId,success);if(dir)fs.rmSync(dir,{recursive:true,force:true})}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
