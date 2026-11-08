#!/usr/bin/env node
// Local only: read the runner's public handshake and Drive capability from a
// 0600 private scratch directory. Commit only the authenticated ciphertext.
// The Drive URI never goes into arguments, stdout, source control or logs.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {encryptBytes} from '../coverr-transfer/transfer.mjs';
import {validateSession,MEDIA_LIMIT} from './direct-drive-relay.mjs';
const dir=process.env.COVERR_RELAY_STATE_DIR||'/home/user/.cache/coverr-rupert-relay';
const dest='editorial-engine/pipeline/coverr-rupert/drive-session-envelope.json';
try{
 const ready=JSON.parse(fs.readFileSync(path.join(dir,'ready.json'),'utf8'));
 const id='azy1Cd1ZeQ',expectedRun=process.env.COVERR_APPROVED_RUN||'';
 if(ready.status!=='READY'||ready.id!==id||ready.run_id!==expectedRun||!/^[0-9]+$/.test(expectedRun)||
   !/^[a-f0-9]{32}$/.test(ready.nonce||'')||!Number.isSafeInteger(ready.size)||ready.size<1000||ready.size>MEDIA_LIMIT||!/^[a-f0-9]{64}$/.test(ready.sha256||''))throw Error('BAD_READY');
 const pem=Buffer.from(ready.public_key_b64||'','base64');const key=crypto.createPublicKey(pem);
 if(key.asymmetricKeyType!=='rsa'||(key.asymmetricKeyDetails?.modulusLength||0)<2048)throw Error('BAD_PUBLIC_KEY');
 const sessionPath=path.join(dir,'drive-session-uri'),drive_uri=fs.readFileSync(sessionPath,'utf8').trim();
 const secret=validateSession({nonce:ready.nonce,id,run_id:ready.run_id,size:ready.size,sha256:ready.sha256,drive_uri},ready);
 const ciphertext=encryptBytes(Buffer.from(JSON.stringify(secret)),key).toString('base64');
 const tmp=dest+'.tmp';fs.writeFileSync(tmp,JSON.stringify({nonce:ready.nonce,envelope_b64:ciphertext},null,2)+'\n',{mode:0o600});fs.renameSync(tmp,dest);
 fs.unlinkSync(sessionPath);
 console.log(JSON.stringify({status:'SEALED',id,run_id:ready.run_id,size:ready.size,sha256:ready.sha256}));
}catch(e){console.error(['BAD_READY','BAD_PUBLIC_KEY'].includes(e?.message)?e.message:'SEAL_FAILED');process.exitCode=1}
