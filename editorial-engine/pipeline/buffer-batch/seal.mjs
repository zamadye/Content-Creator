#!/usr/bin/env node
/* Read the runner's public handshake, encrypt private input to an unreferenced
 * Git blob, and print only a nonsecret commit marker. Never commit plaintext. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {encryptBytes, gitBlobSha} from '../coverr-transfer/transfer.mjs';
import {BatchError} from './core.mjs';
import {markerFor, validateTrigger} from './relay.mjs';
import {resolvePrivateFile} from './prepare.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const REPO = 'zamadye/Content-Creator';
const ensure = (condition, code) => { if (!condition) throw new BatchError(code); };
function gh(args) {
  const r = spawnSync('gh', ['api',...args], {cwd:ROOT,encoding:'utf8',timeout:60_000,maxBuffer:5_000_000});
  ensure(r.status === 0, 'GITHUB_API_FAILED');
  try { return JSON.parse(r.stdout); } catch { throw new BatchError('GITHUB_RESPONSE_INVALID'); }
}
export async function seal(session, triggerSha) {
  ensure(/^[a-f0-9]{40}$/.test(triggerSha ?? ''), 'BAD_TRIGGER_SHA');
  const trigger = JSON.parse(fs.readFileSync(path.join(ROOT,'.github/buffer-batch-trigger.json'),'utf8'));
  validateTrigger(trigger);
  const requestPath = resolvePrivateFile(path.join(session,'request.json'));
  ensure(path.basename(path.dirname(requestPath)) === trigger.nonce, 'SESSION_MISMATCH');
  const request = fs.readFileSync(requestPath);
  ensure(crypto.createHash('sha256').update(request).digest('hex') === trigger.requestSha256, 'REQUEST_HASH_MISMATCH');
  let pub; const deadline=Date.now()+5*60_000;
  while (Date.now()<deadline) {
    const result=gh([`repos/${REPO}/commits/${triggerSha}/check-runs?per_page=100`]);
    const checks=Array.isArray(result.check_runs)?result.check_runs:[];
    for(const check of checks) {
      if(check.name!=='Buffer batch secure input' || check.status!=='in_progress'
        || check.head_sha!==triggerSha || check.app?.slug!=='github-actions') continue;
      let data;try{data=JSON.parse(check.output?.summary ?? '');}catch{continue;}
      if(data.nonce!==trigger.nonce)continue;
      try{pub=crypto.createPublicKey(Buffer.from(data.public_key_b64,'base64'));}catch{throw new BatchError('BAD_RUNNER_PUBLIC_KEY');}
      ensure(pub.asymmetricKeyType==='rsa' && pub.asymmetricKeyDetails?.modulusLength>=2048,'BAD_RUNNER_PUBLIC_KEY');break;
    }
    if(pub)break;
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  ensure(pub,'HANDSHAKE_TIMED_OUT');
  const ciphertext=encryptBytes(request,pub);ensure(ciphertext.length<=2_000_000,'INPUT_TOO_LARGE');
  const scratch=path.join(path.dirname(requestPath),'blob-input.json');
  fs.writeFileSync(scratch,JSON.stringify({content:ciphertext.toString('base64'),encoding:'base64'}),{flag:'wx',mode:0o600});
  let result;
  try { result=gh(['--method','POST',`repos/${REPO}/git/blobs`,'--input',scratch]); }
  finally { fs.unlinkSync(scratch); }
  const blobSha=String(result.sha ?? '');
  ensure(blobSha===gitBlobSha(ciphertext),'BLOB_HASH_MISMATCH');
  return {nonce:trigger.nonce,blobSha,marker:markerFor(trigger.nonce,blobSha)};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [session,sha,...extra]=process.argv.slice(2);ensure(session && sha && !extra.length,'USAGE');
    console.log(JSON.stringify(await seal(session,sha)));
  } catch(err) {console.error(`Sealing stopped: ${err instanceof BatchError ? err.code : 'PRIVATE_INPUT_ERROR'}`);process.exitCode=1;}
}
