#!/usr/bin/env node
/**
 * User-approved, one-off large Drive upload through an ephemeral Actions runner.
 * The public preview server is accessed only with a random per-run bearer;
 * the Drive resumable URI and bearer arrive inside an RSA/AES-GCM envelope.
 * No key, token, signed URI, media bytes, or exception messages enter logs/git.
 * A new run requires an explicit approval and a trigger-marker commit.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {encryptBytes,decryptBytes} from '../coverr-transfer/transfer.mjs';
import {pathToFileURL} from 'node:url';

export class RelayError extends Error { constructor(code) { super(code); this.code=code; } }
export function validateHost(host) {
  if(typeof host!=='string' || !/^https:\/\/[0-9]{2,5}-[a-z0-9-]+\.e2b\.app$/i.test(host)) throw new RelayError('BAD_PREVIEW_HOST');
  const port=Number(host.slice(8).split('-')[0]); if(port<1024 || port>65535) throw new RelayError('BAD_PREVIEW_PORT');
  return host;
}
export function validateRequest(obj) {
  if(!obj || !/^[a-f0-9]{32}$/.test(obj.nonce || '')) throw new RelayError('BAD_NONCE');
  if(!['test','master'].includes(obj.mode)) throw new RelayError('BAD_MODE');
  if(typeof obj.owner_public_key_b64!=='string' || obj.owner_public_key_b64.length>1500 || !/^[A-Za-z0-9+/=]+$/.test(obj.owner_public_key_b64)) throw new RelayError('BAD_OWNER_KEY');
  let ownerKey; try{ownerKey=crypto.createPublicKey(Buffer.from(obj.owner_public_key_b64,'base64').toString('utf8'));}catch{throw new RelayError('BAD_OWNER_KEY');}
  if(ownerKey.asymmetricKeyType!=='rsa' || (ownerKey.asymmetricKeyDetails?.modulusLength||0)<2048)throw new RelayError('BAD_OWNER_KEY');
  return {host:validateHost(obj.host),nonce:obj.nonce,mode:obj.mode,ownerKey};
}
export function validateSecret(obj) {
  if(!obj || typeof obj!=='object' || !/^[A-Za-z0-9_-]{48,128}$/.test(obj.bearer||'')) throw new RelayError('BAD_BEARER');
  if(!Number.isSafeInteger(obj.size)||obj.size<1||obj.size>1024*1024*1024) throw new RelayError('BAD_SIZE');
  if(!/^[a-f0-9]{64}$/.test(obj.sha256||'')) throw new RelayError('BAD_SHA256');
  let u; try {u=new URL(obj.drive_uri);} catch {throw new RelayError('BAD_DRIVE_URI');}
  if(u.protocol!=='https:' || u.hostname!=='www.googleapis.com' || u.pathname!=='/upload/drive/v3/files' || u.username || u.password || u.port || u.searchParams.get('uploadType')!=='resumable' || !u.searchParams.get('upload_id')) throw new RelayError('BAD_DRIVE_URI');
  return {bearer:obj.bearer,size:obj.size,sha256:obj.sha256,drive_uri:u.toString()};
}
export function checkUploadStatus(status,last) {
  if(last && status==='final') return true;
  if(!last && status==='active') return true;
  throw new RelayError(last?'FINAL_STATUS_UNCONFIRMED':'UPLOAD_STATUS_NOT_ACTIVE');
}
function emit(obj) {
  const line=JSON.stringify(obj); console.log('DRIVE_RELAY_RESULT='+line);
  if(process.env.GITHUB_ACTIONS==='true')console.log('::notice title=Drive relay::'+line.replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'));
}
async function safeFetch(url,options,timeout=60000) {
  try { return await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(timeout)}); }
  catch { throw new RelayError('NETWORK_OR_TIMEOUT'); }
}
async function getEnvelope(host,nonce,privateKey) {
  const deadline=Date.now()+10*60*1000;
  while(Date.now()<deadline) {
    let r;
    try {r=await safeFetch(`${host}/envelope/${nonce}`,{},15000);} catch {await new Promise(x=>setTimeout(x,5000)); continue;}
    if(r.status===404){await new Promise(x=>setTimeout(x,5000));continue;}
    if(!r.ok)throw new RelayError(`ENVELOPE_HTTP_${r.status}`);
    const n=Number(r.headers.get('content-length')||0); if(!n||n>10000)throw new RelayError('BAD_ENVELOPE_SIZE');
    const buf=Buffer.from(await r.arrayBuffer());
    let value; try {value=JSON.parse(decryptBytes(buf,privateKey).toString('utf8'));} catch {throw new RelayError('ENVELOPE_DECRYPT_FAILED');}
    if(value.nonce!==nonce) throw new RelayError('NONCE_MISMATCH');
    return validateSecret(value);
  }
  throw new RelayError('ENVELOPE_WAIT_TIMEOUT');
}
async function upload(host,secret) {
  const chunkBytes=8*1024*1024; // multiple of 256 KiB except last chunk
  let offset=0; const digest=crypto.createHash('sha256'); let finalResult=null, sha=null;
  while(offset<secret.size) {
    const end=Math.min(offset+chunkBytes,secret.size)-1, expected=end-offset+1;
    const media=await safeFetch(`${host}/media`,{headers:{'Authorization':`Bearer ${secret.bearer}`,'Range':`bytes=${offset}-${end}`}},90000);
    if(media.status!==206 || Number(media.headers.get('content-length'))!==expected || media.headers.get('content-range')!==`bytes ${offset}-${end}/${secret.size}`) throw new RelayError('MEDIA_RANGE_INVALID');
    const bytes=Buffer.from(await media.arrayBuffer()); if(bytes.length!==expected)throw new RelayError('MEDIA_LENGTH_INVALID');
    digest.update(bytes); const last=end+1===secret.size;
    if(last) { sha=digest.digest('hex'); if(sha!==secret.sha256) throw new RelayError('MEDIA_SHA256_MISMATCH'); }
    const r=await safeFetch(secret.drive_uri,{method:'PUT',headers:{
      'Content-Type':'application/octet-stream','Content-Length':String(bytes.length),
      'X-Goog-Upload-Command':last?'upload, finalize':'upload',
      'X-Goog-Upload-Offset':String(offset),'X-Goog-Upload-Total-Size':String(secret.size),
    },body:bytes},180000);
    const upStatus=r.headers.get('x-goog-upload-status');
    // Drive's resumable protocol uses this header as authority, not just HTTP.
    checkUploadStatus(upStatus,last);
    if(last){
      const raw=await r.text(); if(raw.length>100000)throw new RelayError('DRIVE_RESPONSE_TOO_LARGE');
      let obj; try{obj=JSON.parse(raw);}catch{throw new RelayError('DRIVE_RESPONSE_INVALID');}
      if(!/^[A-Za-z0-9_-]{10,200}$/.test(obj.id||''))throw new RelayError('DRIVE_FILE_ID_MISSING');
      finalResult={id:obj.id,size:secret.size};
    }
    offset=end+1;
    console.log(`DRIVE_RELAY_PROGRESS=${offset}/${secret.size}`);
  }
  return {...finalResult,sha256:sha};
}
async function main() {
  try {
    const req=validateRequest(JSON.parse(fs.readFileSync('editorial-engine/pipeline/drive-relay/run-request.json','utf8')));
    const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
    emit({status:'READY',nonce:req.nonce,mode:req.mode,public_key_b64:Buffer.from(publicKey).toString('base64')});
    const secret=await getEnvelope(req.host,req.nonce,privateKey);
    const result=await upload(req.host,secret);
    const ciphertext=encryptBytes(Buffer.from(JSON.stringify(result)),req.ownerKey).toString('base64');
    // Even the private Drive file ID stays encrypted in publicly visible logs.
    emit({status:'PASS_UPLOAD',nonce:req.nonce,mode:req.mode,result_ciphertext_b64:ciphertext});
  } catch(e) {
    emit({status:'FAIL',code:e instanceof RelayError?e.code:'UNEXPECTED_FAILURE'});
    process.exitCode=1;
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await main();
