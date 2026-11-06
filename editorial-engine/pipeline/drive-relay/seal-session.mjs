#!/usr/bin/env node
/** Prepare one authenticated envelope on the local sandbox, never the runner.
 * All input/output files live in RELAY_STATE_DIR outside the git repository.
 * The Drive session file is removed immediately after the sealed envelope is
 * written atomically. Do not print capabilities or private media.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {encryptBytes} from '../coverr-transfer/transfer.mjs';
import {validateSecret} from './relay-upload.mjs';
const dir=process.env.RELAY_STATE_DIR || '/home/user/.cache/ump-relay';
async function digestFile(file) {
 const h=crypto.createHash('sha256');for await(const chunk of fs.createReadStream(file))h.update(chunk);return h.digest('hex');
}
try {
 const cfg=JSON.parse(fs.readFileSync(path.join(dir,'server-config.json'),'utf8'));
 if(!/^[a-f0-9]{32}$/.test(cfg.nonce||''))throw Error('BAD_NONCE');
 const publicKey=fs.readFileSync(path.join(dir,'runner-public.pem'));
 const bearer=fs.readFileSync(path.join(dir,'token'),'utf8').trim();
 const sessionPath=path.join(dir,'drive-session-uri');
 const drive_uri=fs.readFileSync(sessionPath,'utf8').trim();
 const size=fs.statSync(cfg.file_path).size, sha256=await digestFile(cfg.file_path);
 validateSecret({bearer,drive_uri,size,sha256});
 const sealed=encryptBytes(Buffer.from(JSON.stringify({nonce:cfg.nonce,bearer,drive_uri,size,sha256})),publicKey);
 const temporary=path.join(dir,'envelope.tmp'),final=path.join(dir,'envelope.bin');
 fs.writeFileSync(temporary,sealed,{mode:0o600,flag:'wx'});fs.renameSync(temporary,final);
 fs.unlinkSync(sessionPath);
 console.log(JSON.stringify({status:'SEALED',nonce:cfg.nonce,size,sha256}));
} catch { console.error('SEAL_FAILED');process.exitCode=1; }
