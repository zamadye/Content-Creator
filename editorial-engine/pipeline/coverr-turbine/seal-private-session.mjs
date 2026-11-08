#!/usr/bin/env node
/** Encrypt separate one-use Drive upload sessions to this run's ephemeral key.
 * Ready metadata and plaintext live only in ignored, mode-0600 local files.
 * On success the plaintext is removed; the encrypted branch file must be
 * removed immediately after the Action finishes. Never print session URLs.
 */
import fs from 'node:fs';
import path from 'node:path';
import {encryptBytes} from '../coverr-transfer/transfer.mjs';
import {validateBatchSecret} from './private-relay.mjs';
const [readyPath,secretPath]=process.argv.slice(2);
const out='editorial-engine/pipeline/coverr-turbine/drive-session-envelope.json';
try{
 if(!readyPath||!secretPath)throw new Error('Usage: seal-private-session.mjs READY_JSON PRIVATE_SESSION_JSON');
 const resolved=path.resolve(secretPath),privateRoot=path.resolve('.scratch');
 if(!resolved.startsWith(privateRoot+path.sep))throw new Error('Session file must be in .scratch');
 const st=fs.statSync(resolved);if(st.mode&0o077)throw new Error('Session file must have mode 0600');
 const ready=JSON.parse(fs.readFileSync(readyPath,'utf8'));
 if(!process.env.COVERR_APPROVED_RUN||ready.run_id!==process.env.COVERR_APPROVED_RUN)throw new Error('Run ID must be explicitly approved');
 const obj=JSON.parse(fs.readFileSync(resolved,'utf8'));validateBatchSecret(obj,ready);
 const key=Buffer.from(ready.public_key_b64,'base64');if(key.length<300||key.length>1500)throw new Error('Invalid public key');
 const encrypted=encryptBytes(Buffer.from(JSON.stringify(obj)),key);
 fs.writeFileSync(out,JSON.stringify({nonce:ready.nonce,envelope_b64:encrypted.toString('base64')})+'\n',{mode:0o600,flag:'wx'});
 fs.rmSync(resolved);console.log(`Sealed ${obj.items.length} sessions for explicitly approved run ${ready.run_id}; plaintext removed.`);
}catch(e){console.error('Sealing failed:',e.message);process.exitCode=1}
