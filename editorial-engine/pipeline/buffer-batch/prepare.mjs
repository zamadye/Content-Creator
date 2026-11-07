#!/usr/bin/env node
/* Generate a nonsecret trigger and per-batch response key. Source input must be
 * within the ignored private directory. No commit or push is performed. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {validateBatch, BatchError} from './core.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PRIVATE = path.join(ROOT, 'editorial-engine/deliverables/buffer-batch/private');
const TRIGGER = path.join(ROOT, '.github/buffer-batch-trigger.json');
const BRANCH = 'arena/54cb36c6-content-creator';
const ensure = (condition, code) => { if (!condition) throw new BatchError(code); };
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

export function resolvePrivateFile(candidate) {
  const root = fs.realpathSync(PRIVATE), real = fs.realpathSync(candidate);
  ensure(real.startsWith(root + path.sep) && fs.statSync(real).isFile(), 'PRIVATE_FILE_REQUIRED');
  return real;
}
export function prepare(source, simulation = false) {
  fs.mkdirSync(PRIVATE, {recursive:true, mode:0o700});
  const branch = spawnSync('git', ['branch','--show-current'], {cwd:ROOT,encoding:'utf8'});
  ensure(branch.status === 0 && branch.stdout.trim() === BRANCH, 'WRONG_BRANCH');
  const status = spawnSync('git', ['status','--porcelain=v1','--untracked-files=all','--','.github/buffer-batch-trigger.json'], {cwd:ROOT,encoding:'utf8'});
  ensure(status.status === 0 && !status.stdout.trim(), 'TRIGGER_HAS_UNCOMMITTED_CHANGES');
  const bytes = fs.readFileSync(resolvePrivateFile(source));
  ensure(bytes.length > 0 && bytes.length < 1_000_000, 'BAD_PRIVATE_REQUEST_SIZE');
  let request;
  try { request = JSON.parse(bytes.toString('utf8')); } catch { throw new BatchError('BAD_PRIVATE_REQUEST'); }
  request.nonce = crypto.randomBytes(16).toString('hex');
  if (simulation) ensure(request.action === 'preflight', 'SIMULATION_REQUIRES_PREFLIGHT');
  validateBatch(request);
  const plain = Buffer.from(JSON.stringify(request) + '\n');
  const keys = crypto.generateKeyPairSync('rsa', {modulusLength:3072,
    publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const session = path.join(PRIVATE, request.nonce);
  fs.mkdirSync(session, {mode:0o700});
  fs.writeFileSync(path.join(session,'request.json'), plain, {flag:'wx',mode:0o600});
  fs.writeFileSync(path.join(session,'owner-private.pem'), keys.privateKey, {flag:'wx',mode:0o600});
  const trigger = {schemaVersion:1,nonce:request.nonce,requestSha256:hash(plain),
    ownerPublicKeyB64:Buffer.from(keys.publicKey).toString('base64'),simulation};
  fs.writeFileSync(TRIGGER, JSON.stringify(trigger,null,2) + '\n', {mode:0o644});
  return {nonce:request.nonce, session: path.relative(ROOT,session), postCount:request.posts.length, simulation};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [source, flag, ...extra] = process.argv.slice(2);
    ensure(source && !extra.length && (flag === undefined || flag === '--simulate'), 'USAGE');
    console.log(JSON.stringify(prepare(source,flag === '--simulate')));
  } catch (err) {
    console.error(`Preparation stopped: ${err instanceof BatchError ? err.code : 'PRIVATE_INPUT_ERROR'}`); process.exitCode=1;
  }
}
