#!/usr/bin/env node
/**
 * Fixed, private-only Wikimedia Commons source relay for the Chicago rough.
 * No media, Drive capability, credentials or personal data enter Git. The
 * runner downloads a fixed list, verifies Commons SHA-1 and size, splits the
 * large file, then transfers four pre-authorized one-use sessions. A short-lived
 * runner key decrypts an unreferenced GitHub blob. Only a nonsecret blob pointer
 * is committed. No media, plaintext URI or private key enters Git, and uncertain
 * writes are never retried.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {validateDriveResponse, validateSession, CHUNK, MEDIA_LIMIT, REPO, BRANCH} from '../../coverr-rupert/direct-drive-relay.mjs';
import {decryptBytes, gitBlobSha} from '../../coverr-transfer/transfer.mjs';

export class RelayError extends Error { constructor(code){super(code);this.code=code;} }
export const SOURCES=Object.freeze([
 {id:'chicago1974', url:'https://upload.wikimedia.org/wikipedia/commons/4/49/Chicago_Scenes_%28ca._1974%29.webm', size:142738394, sha1:'5c36f9d9855dd95a9c6cd9c310953536b420f1f4', ext:'webm'},
 {id:'metra1992', url:'https://upload.wikimedia.org/wikipedia/commons/0/03/Chicago_Metra_Action_1992%21.webm', size:101777599, sha1:'f1f7b52faa8e963d5666394305960453a4e043cd', ext:'webm'},
 {id:'river2014', url:'https://upload.wikimedia.org/wikipedia/commons/c/cd/Chicago_River_time_lapse.webm', size:18379137, sha1:'76b165d0c5fc58a4f0a65c6f6e219db168d854bb', ext:'webm'},
 {id:'nijmegen2018', url:'https://upload.wikimedia.org/wikipedia/commons/d/dd/Drie_straten_in_Nijmegen_blank_door_hevige_lekkage.webm', size:6962082, sha1:'0b1b5a097328f0b7cf2e58f88003c50be69a5d7d', ext:'webm'},
 {id:'night2016', url:'https://upload.wikimedia.org/wikipedia/commons/8/85/Night_view_of_Chicago.webm', size:6148552, sha1:'4fe3f491038cebe4c7a8ed347ebab7b58cffcf6e', ext:'webm'},
 {id:'metrospain2017', url:'https://upload.wikimedia.org/wikipedia/commons/d/d5/Spain_Metro_tunnel.webm', size:7107378, sha1:'fbbb09520d2a2dd645371756030ad30b75cb55e6', ext:'webm'},
 {id:'water2011', url:'https://upload.wikimedia.org/wikipedia/commons/9/9c/Water_Surface_3_--FREE_FOOTAGE--.webm', size:22565113, sha1:'502c1cde3fb9f52e5bbeec37c4ab75ccc6b078ee', ext:'webm'},
]);
export const OUTPUT_IDS=Object.freeze(['chicago1974-part1','chicago1974-part2','metra1992','other-originals']);
export const SPLIT_AT=72000000;
const POINTER='editorial-engine/pipeline/chicago-banjir-bawah-1992/commons-relay/session-pointer.json';
export function validateDownloadURL(s){
 let u;try{u=new URL(s)}catch{throw new RelayError('BAD_SOURCE_URL')}
 if(u.protocol!=='https:'||u.hostname!=='upload.wikimedia.org'||u.username||u.password||u.port||u.hash||u.search||!u.pathname.startsWith('/wikipedia/commons/'))throw new RelayError('BAD_SOURCE_URL');
 return u.toString();
}
export function validateBatch(obj,ready){
 if(!obj||!ready||!/^[a-f0-9]{32}$/.test(ready.nonce||'')||obj.nonce!==ready.nonce||obj.run_id!==ready.run_id||!/^[0-9]+$/.test(obj.run_id||'')||!Array.isArray(obj.items)||!Array.isArray(ready.items)||obj.items.length!==OUTPUT_IDS.length||ready.items.length!==OUTPUT_IDS.length)throw new RelayError('BAD_BATCH_BINDING');
 const sessions={},seen=new Set();
 for(let i=0;i<OUTPUT_IDS.length;i++){
  const id=OUTPUT_IDS[i],v=obj.items[i],r=ready.items[i];
  if(!v||!r||v.id!==id||r.id!==id)throw new RelayError('BAD_BATCH_ORDER');
  let session;try{session=validateSession({nonce:obj.nonce,run_id:obj.run_id,...v},{nonce:ready.nonce,run_id:ready.run_id,...r})}catch{throw new RelayError('BAD_SESSION_BINDING')}
  if(seen.has(session.drive_uri))throw new RelayError('DUPLICATE_SESSION');seen.add(session.drive_uri);sessions[id]=session.drive_uri;
 }
 return sessions;
}
export function verifyIdentity(expected, size, sha1){
 if(!Number.isSafeInteger(size)||size!==expected.size||sha1!==expected.sha1)throw new RelayError('COMMONS_ORIGINAL_MISMATCH');
 return true;
}
async function digestFile(file){
 const h1=crypto.createHash('sha1'),h256=crypto.createHash('sha256'),md5=crypto.createHash('md5');let size=0;
 for await(const b of fs.createReadStream(file)){size+=b.length;h1.update(b);h256.update(b);md5.update(b);}
 return {size,sha1:h1.digest('hex'),sha256:h256.digest('hex'),md5:md5.digest('hex')};
}
async function download(src,dest){
 validateDownloadURL(src.url);let r;
 try{r=await fetch(src.url,{headers:{'User-Agent':'ContentCreatorChicagoResearch/1.0 (https://github.com/zamadye/Content-Creator)'},redirect:'error',signal:AbortSignal.timeout(240000)})}catch{throw new RelayError('COMMONS_NETWORK_OR_REDIRECT')}
 if(!r.ok||!r.body)throw new RelayError(`COMMONS_HTTP_${r.status}`);
 const length=Number(r.headers.get('content-length')||0);
 if(length&&length!==src.size)throw new RelayError('COMMONS_SIZE_HEADER_MISMATCH');
 let size=0;const sha1=crypto.createHash('sha1');
 const limiter=new Transform({transform(buf,enc,done){size+=buf.length;if(size>src.size)return done(new RelayError('COMMONS_SIZE_MISMATCH'));sha1.update(buf);done(null,buf)}});
 try{await pipeline(Readable.fromWeb(r.body),limiter,fs.createWriteStream(dest,{mode:0o600}))}catch(e){if(e instanceof RelayError)throw e;throw new RelayError('COMMONS_READ_FAILED')}
 verifyIdentity(src,size,sha1.digest('hex'));
 return digestFile(dest);
}
function probe(file){
 const r=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,width,height,avg_frame_rate:format=duration','-of','json',file],{encoding:'utf8',timeout:60000,maxBuffer:1024*1024});
 if(r.status!==0)throw new RelayError('SOURCE_PROBE_FAILED');let o;try{o=JSON.parse(r.stdout)}catch{throw new RelayError('SOURCE_PROBE_INVALID')}
 const v=o.streams?.find(x=>x.codec_type==='video'),d=Number(o.format?.duration);
 if(!v||!Number.isInteger(v.width)||!Number.isInteger(v.height)||!(d>0))throw new RelayError('SOURCE_PROBE_INVALID');
 return {width:v.width,height:v.height,seconds:Math.round(d*1000)/1000,codec:v.codec_name,fps:v.avg_frame_rate};
}
async function split(original,dest1,dest2){
 const n=fs.statSync(original).size;if(n<=SPLIT_AT||n-SPLIT_AT>MEDIA_LIMIT)throw new RelayError('BAD_SPLIT_SIZE');
 await pipeline(fs.createReadStream(original,{start:0,end:SPLIT_AT-1}),fs.createWriteStream(dest1,{mode:0o600}));
 await pipeline(fs.createReadStream(original,{start:SPLIT_AT}),fs.createWriteStream(dest2,{mode:0o600}));
}
async function transfer(id,uri,file){
 const d=await digestFile(file);if(d.size<1000||d.size>MEDIA_LIMIT)throw new RelayError('RELAY_FILE_SIZE');
 let offset=0,fd=fs.openSync(file,'r'),finalId='';const sum=crypto.createHash('sha256');
 try{
  while(offset<d.size){
   const n=Math.min(CHUNK,d.size-offset),buf=Buffer.allocUnsafe(n);let got=0;
   while(got<n){const k=fs.readSync(fd,buf,got,n-got,offset+got);if(k<=0)throw new RelayError('RELAY_READ_FAILED');got+=k}
   const last=offset+n===d.size;sum.update(buf);if(last&&sum.digest('hex')!==d.sha256)throw new RelayError('RELAY_DIGEST_CHANGED');
   let r;try{r=await fetch(uri,{method:'PUT',headers:{'Content-Type':'application/octet-stream','Content-Length':String(n),'X-Goog-Upload-Command':last?'upload, finalize':'upload','X-Goog-Upload-Offset':String(offset),'X-Goog-Upload-Total-Size':String(d.size)},body:buf,redirect:'manual',signal:AbortSignal.timeout(180000)})}catch{throw new RelayError('RELAY_UNCERTAIN_NETWORK')}
   try{validateDriveResponse(r.status,r.headers.get('x-goog-upload-status'),last)}catch{throw new RelayError('RELAY_UNCERTAIN_STATUS')}
   if(last){let result;try{result=await r.json()}catch{throw new RelayError('RELAY_UNCERTAIN_FINAL')};if(!/^[A-Za-z0-9_-]{10,200}$/.test(result.id||''))throw new RelayError('RELAY_UNCERTAIN_ID');finalId=result.id;}
   offset+=n;
  }
 }finally{fs.closeSync(fd)}
 return {id,drive_file_id:finalId,size:d.size,sha256:d.sha256,md5:d.md5};
}
async function github(url,token,opts={}){
 let r;try{r=await fetch(url,{...opts,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Chicago-Private-Relay/1.0',...(opts.headers||{})},redirect:'error',signal:AbortSignal.timeout(30000)})}catch{throw new RelayError('GITHUB_NETWORK')};return r;
}
async function publishReady(token,ready){
 const head=process.env.GITHUB_SHA||'';if(!/^[a-f0-9]{40}$/.test(head))throw new RelayError('BAD_HEAD');
 const body={name:'Chicago Commons private relay',head_sha:head,status:'in_progress',output:{title:'Private relay ready',summary:JSON.stringify(ready)}};
 const r=await github(`https://api.github.com/repos/${REPO}/check-runs`,token,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(!r.ok)throw new RelayError('CHECK_CREATE_FAILED');let o;try{o=await r.json()}catch{throw new RelayError('CHECK_CREATE_INVALID')};if(!Number.isSafeInteger(o.id))throw new RelayError('CHECK_CREATE_INVALID');return o.id;
}
async function closeReady(token,id,success){
 if(!id)return;try{await github(`https://api.github.com/repos/${REPO}/check-runs/${id}`,token,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'completed',conclusion:success?'success':'failure',output:{title:'Private relay closed',summary:'Ephemeral key destroyed.'}})})}catch{}
}
export function validatePointer(p,ready){
 if(!p||p.nonce!==ready.nonce||p.run_id!==ready.run_id||!/^[a-f0-9]{40}$/.test(p.git_blob_sha||''))throw new RelayError('BAD_POINTER');return p;
}
async function waitForSessions(token,key,ready){
 const url=`https://api.github.com/repos/${REPO}/contents/${POINTER}?ref=${encodeURIComponent(BRANCH)}`,until=Date.now()+20*60*1000;
 while(Date.now()<until){
  const r=await github(url,token);
  if(r.status===404){await new Promise(ok=>setTimeout(ok,5000));continue}
  if(!r.ok)throw new RelayError('POINTER_FETCH_FAILED');
  let p;try{const o=await r.json();p=JSON.parse(Buffer.from(o.content,'base64').toString('utf8'))}catch{throw new RelayError('POINTER_INVALID')}
  if(p.nonce!==ready.nonce){await new Promise(ok=>setTimeout(ok,5000));continue}
  validatePointer(p,ready);
  const b=await github(`https://api.github.com/repos/${REPO}/git/blobs/${p.git_blob_sha}`,token);
  if(!b.ok)throw new RelayError('BLOB_FETCH_FAILED');
  let encrypted;try{const o=await b.json();encrypted=Buffer.from(o.content,'base64')}catch{throw new RelayError('BLOB_INVALID')}
  if(encrypted.length>50000||gitBlobSha(encrypted)!==p.git_blob_sha)throw new RelayError('BLOB_HASH_MISMATCH');
  let obj;try{obj=JSON.parse(decryptBytes(encrypted,key).toString('utf8'))}catch{throw new RelayError('ENVELOPE_INVALID')}
  return validateBatch(obj,ready);
 }
 throw new RelayError('POINTER_TIMEOUT');
}
function emit(o){console.log('CHICAGO_COMMONS_RELAY='+JSON.stringify(o))}
async function main(){
 let temp,completed=0,checkId,success=false;const token=process.env.GITHUB_TOKEN||'',run_id=process.env.GITHUB_RUN_ID||'';
 try{
  if(process.env.GITHUB_REPOSITORY!==REPO||process.env.GITHUB_REF!==`refs/heads/${BRANCH}`||process.env.GITHUB_ACTIONS!=='true')throw new RelayError('PRIVATE_ACTION_ONLY');
  if(!token||!/^[0-9]+$/.test(run_id))throw new RelayError('MISSING_INPUT');
  if(spawnSync('ffprobe',['-version'],{stdio:'ignore',timeout:10000}).status!==0||spawnSync('zip',['-v'],{stdio:'ignore',timeout:10000}).status!==0)throw new RelayError('TOOLCHAIN_MISSING');
  temp=fs.mkdtempSync(path.join(os.tmpdir(),'chicago-commons-'));fs.chmodSync(temp,0o700);
  const originals=[];
  for(const src of SOURCES){
   const filename=`${src.id}.${src.ext}`,file=path.join(temp,filename);
   const hash=await download(src,file),meta=probe(file);
   originals.push({id:src.id,filename,url:src.url,...hash,probe:meta});
   emit({status:'SOURCE_VERIFIED',id:src.id,size:hash.size,sha1:hash.sha1,sha256:hash.sha256,probe:meta});
  }
  fs.writeFileSync(path.join(temp,'ORIGINALS-MANIFEST.json'),JSON.stringify({version:1,originals},null,2)+'\n',{mode:0o600});
  const part1=path.join(temp,'chicago1974-part1.bin'),part2=path.join(temp,'chicago1974-part2.bin');
  await split(path.join(temp,'chicago1974.webm'),part1,part2);
  const zip=path.join(temp,'other-originals.zip');
  const z=spawnSync('zip',['-q','-0',zip,'ORIGINALS-MANIFEST.json',...SOURCES.slice(2).map(s=>`${s.id}.${s.ext}`)],{cwd:temp,timeout:120000,stdio:'ignore'});
  if(z.status!==0)throw new RelayError('ZIP_FAILED');
  const files={'chicago1974-part1':part1,'chicago1974-part2':part2,'metra1992':path.join(temp,'metra1992.webm'),'other-originals':zip};
  // No write is attempted until all originals are verified and packaged.
  const items=[];for(const id of OUTPUT_IDS){const d=await digestFile(files[id]);if(d.size<1000||d.size>MEDIA_LIMIT)throw new RelayError('PACKAGE_TOO_LARGE');items.push({id,size:d.size,sha256:d.sha256});}
  const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const ready={status:'READY',nonce:crypto.randomBytes(16).toString('hex'),run_id,items,public_key_b64:Buffer.from(publicKey).toString('base64')};
  checkId=await publishReady(token,ready);emit({status:'READY',run_id,count:items.length});
  const sessions=await waitForSessions(token,privateKey,ready);
  for(const id of OUTPUT_IDS){
   const result=await transfer(id,sessions[id],files[id]);completed++;emit({status:'UPLOADED_ITEM',...result});
  }
  emit({status:'PASS_UPLOAD',count:completed});success=true;
 }catch(e){emit({status:completed?'PARTIAL_OR_UNCERTAIN':'FAIL_OR_UNCERTAIN',completed_count:completed,code:e instanceof RelayError?e.code:'UNEXPECTED_FAILURE'});process.exitCode=1;}
 finally{await closeReady(token,checkId,success);if(temp)fs.rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
