#!/usr/bin/env node
/** Create per-chunk encrypted, unreferenced Git blobs and an encrypted manifest.
 * Run only locally after explicit user approval. State/private keys/capability
 * remain outside the repo. The GitHub API receives ciphertext only. The Drive
 * session file is removed after the manifest has been sealed. No secret or
 * plaintext is written to output, Git, process arguments, or runner logs.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {encryptBytes,gitBlobSha} from '../coverr-transfer/transfer.mjs';
import {validateSecret,CHUNK,REPO} from './relay-upload.mjs';
const dir=process.env.RELAY_STATE_DIR || '/home/user/.cache/ump-relay';
const scratch=path.join(dir,'blob-request.json');
let fd;
try {
 const cfg=JSON.parse(fs.readFileSync(path.join(dir,'server-config.json'),'utf8'));
 if(!/^[a-f0-9]{32}$/.test(cfg.nonce||''))throw Error('BAD_NONCE');
 const publicKey=fs.readFileSync(path.join(dir,'runner-public.pem'));
 const sessionPath=path.join(dir,'drive-session-uri');
 const drive_uri=fs.readFileSync(sessionPath,'utf8').trim();
 const size=fs.statSync(cfg.file_path).size;if(!Number.isSafeInteger(size)||size<1||size>1024*1024*1024)throw Error('BAD_SIZE');
 const chunks=[], hash=crypto.createHash('sha256');fd=fs.openSync(cfg.file_path,'r');let offset=0;
 while(offset<size) {
  const length=Math.min(CHUNK,size-offset),buf=Buffer.allocUnsafe(length);let n=0;
  while(n<length){const k=fs.readSync(fd,buf,n,length-n,offset+n);if(k<=0)throw Error('FILE_READ_FAILED');n+=k;}
  hash.update(buf);const encrypted=encryptBytes(buf,publicKey), expected=gitBlobSha(encrypted);
  fs.writeFileSync(scratch,JSON.stringify({content:encrypted.toString('base64'),encoding:'base64'}),{mode:0o600});
  const r=spawnSync('gh',['api','--method','POST',`repos/${REPO}/git/blobs`,'--input',scratch],{encoding:'utf8',maxBuffer:1024*1024,timeout:180000});
  try{fs.unlinkSync(scratch);}catch{}
  if(r.status!==0){const text=String(r.stderr||'');if(/authentication|not logged in|HTTP 401/i.test(text))throw Error('GITHUB_AUTH_FAILED');throw Error('GITHUB_BLOB_CREATE_FAILED');}
  let sha;try{sha=JSON.parse(r.stdout).sha;}catch{throw Error('GITHUB_BLOB_RESPONSE_INVALID');}
  if(sha!==expected)throw Error('GITHUB_BLOB_HASH_MISMATCH');
  chunks.push({git_sha:sha,size:length});offset+=length;
  console.log(`ENCRYPTED_TRANSFER_PROGRESS=${offset}/${size}`);
 }
 fs.closeSync(fd);fd=undefined;
 const sha256=hash.digest('hex');validateSecret({size,sha256,drive_uri,chunks});
 const plaintext=Buffer.from(JSON.stringify({nonce:cfg.nonce,size,sha256,drive_uri,chunks}));
 const envelope_b64=encryptBytes(plaintext,publicKey).toString('base64');
 const dest='editorial-engine/pipeline/drive-relay/payload.json',tmp=dest+'.tmp';
 fs.writeFileSync(tmp,JSON.stringify({nonce:cfg.nonce,envelope_b64},null,2)+'\n',{mode:0o600});fs.renameSync(tmp,dest);
 fs.unlinkSync(sessionPath);console.log(JSON.stringify({status:'SEALED',nonce:cfg.nonce,size,sha256,chunks:chunks.length}));
} catch(e) {
 const allowed=['BAD_NONCE','BAD_SIZE','FILE_READ_FAILED','GITHUB_AUTH_FAILED','GITHUB_BLOB_CREATE_FAILED','GITHUB_BLOB_RESPONSE_INVALID','GITHUB_BLOB_HASH_MISMATCH'];
 console.error(allowed.includes(e?.message)?e.message:'SEAL_FAILED');process.exitCode=1;
} finally {if(fd!==undefined)fs.closeSync(fd);try{fs.unlinkSync(scratch);}catch{}}
