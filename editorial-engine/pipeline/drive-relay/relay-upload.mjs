#!/usr/bin/env node
/**
 * User-approved one-off large Drive relay through encrypted, unreferenced Git
 * blobs. Public repo storage receives ciphertext only; GitHub GC is uncertain.
 * The runner generates an ephemeral RSA key, polls a branch manifest for an
 * encrypted session envelope, verifies/decrypts each blob in memory and sends
 * byte-aligned chunks to the one-time Drive resumable URI. The Drive ID in the
 * result is encrypted to the local owner's public key. No credential, signed
 * URI, private key, exception message or plaintext media is logged or committed.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {encryptBytes,decryptBytes,gitBlobSha} from '../coverr-transfer/transfer.mjs';
import {pathToFileURL} from 'node:url';
export class RelayError extends Error { constructor(code) { super(code); this.code=code; } }
export const REPO='zamadye/Content-Creator', BRANCH='arena/54cb36c6-content-creator', CHUNK=8*1024*1024;
export function validateRequest(obj) {
  if(!obj || !/^[a-f0-9]{32}$/.test(obj.nonce || '')) throw new RelayError('BAD_NONCE');
  if(!['test','master'].includes(obj.mode)) throw new RelayError('BAD_MODE');
  if(typeof obj.owner_public_key_b64!=='string' || obj.owner_public_key_b64.length>1500 || !/^[A-Za-z0-9+/=]+$/.test(obj.owner_public_key_b64)) throw new RelayError('BAD_OWNER_KEY');
  let ownerKey; try{ownerKey=crypto.createPublicKey(Buffer.from(obj.owner_public_key_b64,'base64').toString('utf8'));}catch{throw new RelayError('BAD_OWNER_KEY');}
  if(ownerKey.asymmetricKeyType!=='rsa' || (ownerKey.asymmetricKeyDetails?.modulusLength||0)<2048)throw new RelayError('BAD_OWNER_KEY');
  return {nonce:obj.nonce,mode:obj.mode,ownerKey};
}
export function validateSecret(obj) {
  if(!obj || !Number.isSafeInteger(obj.size)||obj.size<1||obj.size>1024*1024*1024) throw new RelayError('BAD_SIZE');
  if(!/^[a-f0-9]{64}$/.test(obj.sha256||'')) throw new RelayError('BAD_SHA256');
  let u; try {u=new URL(obj.drive_uri);} catch {throw new RelayError('BAD_DRIVE_URI');}
  if(u.protocol!=='https:' || u.hostname!=='www.googleapis.com' || u.pathname!=='/upload/drive/v3/files' || u.username || u.password || u.port || u.searchParams.get('uploadType')!=='resumable' || !u.searchParams.get('upload_id')) throw new RelayError('BAD_DRIVE_URI');
  if(!Array.isArray(obj.chunks)||obj.chunks.length<1||obj.chunks.length>128)throw new RelayError('BAD_CHUNKS');
  let count=0;
  for(const [i,c] of obj.chunks.entries()) {
    if(!/^[a-f0-9]{40}$/.test(c.git_sha||'')||!Number.isSafeInteger(c.size)||c.size<1||c.size>CHUNK|| (i<obj.chunks.length-1&&c.size!==CHUNK)) throw new RelayError('BAD_CHUNK');
    count+=c.size;
  }
  if(count!==obj.size)throw new RelayError('CHUNK_TOTAL_MISMATCH');
  return {size:obj.size,sha256:obj.sha256,drive_uri:u.toString(),chunks:obj.chunks};
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
function headers(token,raw=false) {return {'Authorization':`Bearer ${token}`,'Accept':raw?'application/vnd.github.raw+json':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'ContentCreator-Drive-Relay/1.0'};}
async function getEnvelope(nonce,privateKey,token) {
  const url=`https://api.github.com/repos/${REPO}/contents/editorial-engine/pipeline/drive-relay/payload.json?ref=${encodeURIComponent(BRANCH)}`;
  const deadline=Date.now()+20*60*1000;
  while(Date.now()<deadline) {
    const r=await safeFetch(url,{headers:headers(token)},30000);
    if(r.status===404){await new Promise(x=>setTimeout(x,5000));continue;}
    if(!r.ok)throw new RelayError(`MANIFEST_HTTP_${r.status}`);
    const raw=await r.text(); if(raw.length>100000)throw new RelayError('MANIFEST_TOO_LARGE');
    let payload;
    try{const outer=JSON.parse(raw);payload=JSON.parse(Buffer.from(outer.content,'base64').toString('utf8'));}catch{throw new RelayError('MANIFEST_INVALID');}
    if(payload.nonce!==nonce){await new Promise(x=>setTimeout(x,5000));continue;}
    if(typeof payload.envelope_b64!=='string'||payload.envelope_b64.length>50000)throw new RelayError('BAD_ENVELOPE');
    let value;try{value=JSON.parse(decryptBytes(Buffer.from(payload.envelope_b64,'base64'),privateKey).toString('utf8'));}catch{throw new RelayError('ENVELOPE_DECRYPT_FAILED');}
    if(value.nonce!==nonce)throw new RelayError('NONCE_MISMATCH');
    return validateSecret(value);
  }
  throw new RelayError('ENVELOPE_WAIT_TIMEOUT');
}
async function upload(secret,privateKey,token) {
  let offset=0;const digest=crypto.createHash('sha256');let result=null,sha=null;
  for(const [i,chunk] of secret.chunks.entries()) {
    const media=await safeFetch(`https://api.github.com/repos/${REPO}/git/blobs/${chunk.git_sha}`,{headers:headers(token,true)},180000);
    if(!media.ok)throw new RelayError(`BLOB_HTTP_${media.status}`);
    if(Number(media.headers.get('content-length')||0)>CHUNK+2048)throw new RelayError('BLOB_TOO_LARGE');
    const encrypted=Buffer.from(await media.arrayBuffer());
    if(encrypted.length>CHUNK+2048||gitBlobSha(encrypted)!==chunk.git_sha)throw new RelayError('BLOB_HASH_MISMATCH');
    let bytes;try{bytes=decryptBytes(encrypted,privateKey);}catch{throw new RelayError('BLOB_DECRYPT_FAILED');}
    if(bytes.length!==chunk.size)throw new RelayError('CHUNK_LENGTH_MISMATCH');
    digest.update(bytes);const last=i===secret.chunks.length-1;
    if(last){sha=digest.digest('hex');if(sha!==secret.sha256)throw new RelayError('MEDIA_SHA256_MISMATCH');}
    const r=await safeFetch(secret.drive_uri,{method:'PUT',headers:{
      'Content-Type':'application/octet-stream','Content-Length':String(bytes.length),
      'X-Goog-Upload-Command':last?'upload, finalize':'upload',
      'X-Goog-Upload-Offset':String(offset),'X-Goog-Upload-Total-Size':String(secret.size),
    },body:bytes},180000);
    checkUploadStatus(r.headers.get('x-goog-upload-status'),last);
    if(last){
      const raw=await r.text();if(raw.length>100000)throw new RelayError('DRIVE_RESPONSE_TOO_LARGE');
      let obj;try{obj=JSON.parse(raw);}catch{throw new RelayError('DRIVE_RESPONSE_INVALID');}
      if(!/^[A-Za-z0-9_-]{10,200}$/.test(obj.id||''))throw new RelayError('DRIVE_FILE_ID_MISSING');
      result={id:obj.id,size:secret.size};
    }
    offset+=bytes.length;console.log(`DRIVE_RELAY_PROGRESS=${offset}/${secret.size}`);
  }
  return {...result,sha256:sha};
}
async function main() {
  try {
    const req=validateRequest(JSON.parse(fs.readFileSync('editorial-engine/pipeline/drive-relay/run-request.json','utf8')));
    const token=process.env.GITHUB_TOKEN||'';if(!token||process.env.GITHUB_REPOSITORY!==REPO)throw new RelayError('MISSING_GITHUB_INPUT');
    const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
    emit({status:'READY',nonce:req.nonce,mode:req.mode,public_key_b64:Buffer.from(publicKey).toString('base64')});
    const secret=await getEnvelope(req.nonce,privateKey,token);
    const result=await upload(secret,privateKey,token);
    emit({status:'PASS_UPLOAD',nonce:req.nonce,mode:req.mode,result_ciphertext_b64:encryptBytes(Buffer.from(JSON.stringify(result)),req.ownerKey).toString('base64')});
  } catch(e) {emit({status:'FAIL',code:e instanceof RelayError?e.code:'UNEXPECTED_FAILURE'});process.exitCode=1;}
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await main();
