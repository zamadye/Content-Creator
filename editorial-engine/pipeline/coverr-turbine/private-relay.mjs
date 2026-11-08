#!/usr/bin/env node
/**
 * One approved, bounded batch of original Coverr turbine clips -> the owner's
 * private Drive. Runs only on a marker-gated GitHub Action. Original bytes,
 * signed URLs, Drive upload capabilities, API key and private RSA key never
 * enter Git or logs. Each write uses its own one-use session; ambiguous Drive
 * writes stop the whole batch, with no automatic retries.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Transform,Readable} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {pathToFileURL} from 'node:url';
import {checkCandidate,cleanText,decryptBytes,SafeError} from '../coverr-transfer/transfer.mjs';
import {validateSession,validateProbe,validateDriveResponse,MEDIA_LIMIT,CHUNK,REPO,BRANCH} from '../coverr-rupert/direct-drive-relay.mjs';

export const IDS=Object.freeze(['9Y8kk5xCuY','WuuebDPmKg','oaw1EMLhFi','k6GEFHq7u4']);
const PAYLOAD='editorial-engine/pipeline/coverr-turbine/drive-session-envelope.json';
class BatchError extends Error {constructor(code){super(code);this.code=code}}
const shaOk=s=>typeof s==='string' && /^[a-f0-9]{64}$/.test(s);
const nonceOk=s=>typeof s==='string' && /^[a-f0-9]{32}$/.test(s);

/** Check exact list, ordering, metadata binding and distinct Drive sessions. */
export function validateBatchSecret(obj,ready){
 if(!obj || !ready || !nonceOk(ready.nonce) || obj.nonce!==ready.nonce ||
   obj.run_id!==ready.run_id || !/^[0-9]+$/.test(obj.run_id||'') ||
   !Array.isArray(ready.items) || !Array.isArray(obj.items) ||
   ready.items.length!==IDS.length || obj.items.length!==IDS.length) throw new BatchError('BATCH_METADATA_MISMATCH');
 const sessions=[],uris=new Set();
 for(let i=0;i<IDS.length;i++){
  const r=ready.items[i],v=obj.items[i];
  if(!r || !v || r.id!==IDS[i] || v.id!==r.id || v.size!==r.size || v.sha256!==r.sha256 ||
     !Number.isSafeInteger(r.size) || r.size<1000 || r.size>MEDIA_LIMIT || !shaOk(r.sha256)) throw new BatchError('BATCH_ITEM_MISMATCH');
  let checked;try{checked=validateSession({nonce:obj.nonce,run_id:obj.run_id,id:v.id,size:v.size,sha256:v.sha256,drive_uri:v.drive_uri},
     {nonce:ready.nonce,run_id:ready.run_id,id:r.id,size:r.size,sha256:r.sha256});}catch{throw new BatchError('BAD_DRIVE_SESSION')}
  if(uris.has(checked.drive_uri))throw new BatchError('DUPLICATE_DRIVE_SESSION');
  uris.add(checked.drive_uri);sessions.push(checked);
 }
 return sessions;
}
function emit(obj){
 const line=JSON.stringify(obj);console.log('TURBINE_PRIVATE_RELAY='+line);
 if(process.env.GITHUB_ACTIONS==='true')console.log('::notice title=Coverr turbine private relay::'+line.replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'));
}
async function safeFetch(url,opts={},ms=30000,redirect='error'){
 try{return await fetch(url,{...opts,redirect,signal:AbortSignal.timeout(ms)})}catch{throw new BatchError('NETWORK_OR_TIMEOUT')}
}
function ghHeaders(token){return {'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Knot-Turbine-Private/1.0'}}
async function coverrApi(id,key,method='GET',auth='x-api-key'){
 if(!IDS.includes(id))throw new BatchError('UNAPPROVED_VIDEO');
 const headers={'Accept':'application/json','User-Agent':'Knot-Turbine-Private/1.0'};
 if(auth==='x-api-key')headers['x-api-key']=key;else headers.Authorization=`Bearer ${key}`;
 const r=await safeFetch(`https://api.coverr.co/videos/${id}${method==='PATCH'?'/stats/downloads':''}`,{method,headers});
 if(method==='PATCH')return r.status;
 if(!r.ok)throw new BatchError(`COVERR_GET_HTTP_${r.status}`);
 const text=await r.text();if(text.length>2000000)throw new BatchError('COVERR_RESPONSE_TOO_LARGE');
 try{return JSON.parse(text)}catch{throw new BatchError('COVERR_BAD_JSON')}
}
async function track(id,key){
 const statuses=[];
 for(const auth of ['x-api-key','bearer']){
  const s=await coverrApi(id,key,'PATCH',auth);statuses.push(s);
  if(s>=200&&s<300)return {status:'PASS',http_statuses:statuses};
  if(s!==404)throw new BatchError(`COVERR_PATCH_HTTP_${s}`);
 }
 return {status:'NEEDS_REVIEW',http_statuses:statuses};
}
async function download(url,dest){
 let next=new URL(url),r;
 for(let i=0;i<5;i++){
  if(next.protocol!=='https:' || !/(^|\.)coverr\.co$/i.test(next.hostname) || next.username || next.password || (next.port&&next.port!=='443'))throw new BatchError('MEDIA_REDIRECT_BLOCKED');
  try{r=await fetch(next,{redirect:'manual',signal:AbortSignal.timeout(180000)})}catch{throw new BatchError('MEDIA_NETWORK')}
  if(r.status>=300&&r.status<400){const loc=r.headers.get('location');if(!loc)throw new BatchError('MEDIA_REDIRECT_MISSING');try{next=new URL(loc,next)}catch{throw new BatchError('MEDIA_REDIRECT_INVALID')}continue}
  break;
 }
 if(!r?.ok||!r.body)throw new BatchError(`COVERR_MEDIA_HTTP_${r?.status||0}`);
 if(Number(r.headers.get('content-length')||0)>MEDIA_LIMIT)throw new BatchError('MEDIA_OVER_100_MB');
 let size=0;const sha=crypto.createHash('sha256'),md5=crypto.createHash('md5');
 const limiter=new Transform({transform(chunk,enc,done){size+=chunk.length;if(size>MEDIA_LIMIT)return done(new BatchError('MEDIA_OVER_100_MB'));sha.update(chunk);md5.update(chunk);done(null,chunk)}});
 try{await pipeline(Readable.fromWeb(r.body),limiter,fs.createWriteStream(dest,{mode:0o600}))}catch(e){if(e instanceof BatchError)throw e;throw new BatchError('MEDIA_STREAM_FAILED')}
 if(size<1000)throw new BatchError('MEDIA_TOO_SMALL');
 return {size,sha256:sha.digest('hex'),md5:md5.digest('hex')};
}
function probe(source){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,width,height,avg_frame_rate:format=duration','-of','json',source],{encoding:'utf8',timeout:30000});
 if(p.error?.code==='ENOENT')throw new BatchError('FFPROBE_MISSING');if(p.status!==0)throw new BatchError('SOURCE_PROBE_FAILED');
 try{return validateProbe(JSON.parse(p.stdout))}catch{throw new BatchError('SOURCE_PROBE_INVALID')}
}
async function handshake(token,ready){
 const head=process.env.GITHUB_SHA||'';if(!/^[a-f0-9]{40}$/.test(head))throw new BatchError('BAD_HEAD_SHA');
 const body={name:'Coverr turbine private relay',head_sha:head,status:'in_progress',output:{title:'Private turbine transfer ready',summary:JSON.stringify(ready)}};
 const r=await safeFetch(`https://api.github.com/repos/${REPO}/check-runs`,{method:'POST',headers:{...ghHeaders(token),'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!r.ok)throw new BatchError(`CHECK_CREATE_HTTP_${r.status}`);
 const o=await r.json();if(!Number.isSafeInteger(o.id))throw new BatchError('CHECK_RESPONSE_INVALID');return o.id;
}
async function closeHandshake(token,id,success){
 if(!id)return;try{await safeFetch(`https://api.github.com/repos/${REPO}/check-runs/${id}`,{method:'PATCH',headers:{...ghHeaders(token),'Content-Type':'application/json'},body:JSON.stringify({status:'completed',conclusion:success?'success':'failure',output:{title:'Private transfer closed',summary:'Ephemeral key expired.'}})})}catch{}
}
async function getSessions(token,privateKey,ready){
 const url=`https://api.github.com/repos/${REPO}/contents/${PAYLOAD}?ref=${encodeURIComponent(BRANCH)}`,deadline=Date.now()+20*60*1000;
 while(Date.now()<deadline){
  const r=await safeFetch(url,{headers:ghHeaders(token)});
  if(r.status===404){await new Promise(ok=>setTimeout(ok,5000));continue}
  if(!r.ok)throw new BatchError(`MANIFEST_HTTP_${r.status}`);
  let payload;try{const o=await r.json();payload=JSON.parse(Buffer.from(o.content,'base64').toString('utf8'))}catch{throw new BatchError('MANIFEST_INVALID')}
  if(payload.nonce!==ready.nonce){await new Promise(ok=>setTimeout(ok,5000));continue}
  if(typeof payload.envelope_b64!=='string'||payload.envelope_b64.length>50000)throw new BatchError('BAD_ENVELOPE');
  let value;try{value=JSON.parse(decryptBytes(Buffer.from(payload.envelope_b64,'base64'),privateKey).toString('utf8'))}catch{throw new BatchError('ENVELOPE_DECRYPT_FAILED')}
  return validateBatchSecret(value,ready);
 }
 throw new BatchError('ENVELOPE_WAIT_TIMEOUT');
}
async function upload(session,source){
 let offset=0,fd=fs.openSync(source,'r');const hash=crypto.createHash('sha256');
 try{
  while(offset<session.size){
   const len=Math.min(CHUNK,session.size-offset),buf=Buffer.allocUnsafe(len);let n=0;
   while(n<len){const k=fs.readSync(fd,buf,n,len-n,offset+n);if(k<=0)throw new BatchError('SOURCE_READ_FAILED');n+=k}
   hash.update(buf);const last=offset+len===session.size;
   if(last && hash.digest('hex')!==session.sha256)throw new BatchError('SOURCE_SHA_MISMATCH');
   const r=await safeFetch(session.drive_uri,{method:'PUT',headers:{'Content-Type':'application/octet-stream','Content-Length':String(len),'X-Goog-Upload-Command':last?'upload, finalize':'upload','X-Goog-Upload-Offset':String(offset),'X-Goog-Upload-Total-Size':String(session.size)},body:buf},180000,'manual');
   validateDriveResponse(r.status,r.headers.get('x-goog-upload-status'),last);
   if(last){let o;try{o=await r.json()}catch{throw new BatchError('DRIVE_RESPONSE_INVALID')}if(!/^[A-Za-z0-9_-]{10,200}$/.test(o.id||''))throw new BatchError('DRIVE_FILE_ID_MISSING')}
   offset+=len;
  }
 }finally{fs.closeSync(fd)}
 return {id:session.id,size:session.size,sha256:session.sha256};
}
async function main(){
 const key=process.env.COVERR_API_KEY||'',token=process.env.GITHUB_TOKEN||'',run_id=process.env.GITHUB_RUN_ID||'';
 let dir,checkId,success=false,completed=[];
 try{
  if(!key||!token||process.env.GITHUB_REPOSITORY!==REPO||!/^[0-9]+$/.test(run_id))throw new BatchError('MISSING_INPUT');
  if(spawnSync('ffprobe',['-version'],{stdio:'ignore',timeout:10000}).status!==0)throw new BatchError('FFPROBE_MISSING');
  dir=fs.mkdtempSync(path.join(os.tmpdir(),'turbine-coverr-private-'));fs.chmodSync(dir,0o700);
  const items=[];
  // Serial on purpose: on access, authentication or rate-limit failure stop
  // before making any further Coverr request; never retry denied media.
  for(const id of IDS){
   const original=await coverrApi(id,key),candidate=checkCandidate(original,id,key),tracking=await track(id,key);
   const source=path.join(dir,`${id}.mp4`),bytes=await download(candidate.mediaUrl,source),video=probe(source);
   items.push({id,...bytes,probe:video,title:candidate.title,creator:candidate.creator,
     description:cleanText(original.description,key,200),tracking});
   emit({status:'SOURCE_READY',id,probe:video,size:bytes.size,tracking});
  }
  const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const ready={status:'READY',nonce:crypto.randomBytes(16).toString('hex'),run_id,items,
   public_key_b64:Buffer.from(publicKey).toString('base64')};
  checkId=await handshake(token,ready);
  emit({status:'READY',run_id,count:items.length});
  const sessions=await getSessions(token,privateKey,ready);
  for(const session of sessions){
   const result=await upload(session,path.join(dir,`${session.id}.mp4`));completed.push(result);
   emit({status:'PASS_UPLOAD_ITEM',run_id,...result});
  }
  emit({status:'PASS_UPLOAD',run_id,count:completed.length});success=true;
 }catch(e){
  const code=e instanceof BatchError||e instanceof SafeError?e.code:'UNEXPECTED_FAILURE';
  emit({status:completed.length?'PARTIAL_OR_UNCERTAIN':'FAIL',code,completed_count:completed.length});process.exitCode=1;
 }finally{await closeHandshake(token,checkId,success);if(dir)fs.rmSync(dir,{recursive:true,force:true})}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
