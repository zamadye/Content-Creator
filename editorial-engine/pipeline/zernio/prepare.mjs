#!/usr/bin/env node
/* Generate a nonsecret Zernio trigger and per-batch response key. Source input
 * must be within the ignored private directory. No commit or push is performed.
 * The encrypted request carries the media URL; the public trigger carries only
 * a nonce, digest and public key (same relay contract as the Buffer batch). */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {allowedMediaUrl, MAX_MEDIA_BYTES, BatchError} from '../buffer-batch/core.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PRIVATE = path.join(ROOT, 'editorial-engine/deliverables/buffer-batch/private');
const TRIGGER = path.join(ROOT, '.github/zernio-batch-trigger.json');
const BRANCH = 'arena/54cb36c6-content-creator';
const SHA256 = /^[a-f0-9]{64}$/;
const ensure = (condition, code) => { if (!condition) throw new BatchError(code); };
const hash = data => crypto.createHash('sha256').update(data).digest('hex');

export function resolvePrivateFile(candidate) {
  const root = fs.realpathSync(PRIVATE), real = fs.realpathSync(candidate);
  ensure(real.startsWith(root + path.sep) && fs.statSync(real).isFile(), 'PRIVATE_FILE_REQUIRED');
  return real;
}

/* One Facebook video post, published immediately. The affiliate link rides in
 * platformSpecificData.firstComment (the closest documented field to a product
 * slot; Facebook has no product-attachment field through the Zernio API). */
export function validateZernioRequest(request) {
  ensure(request && typeof request === 'object' && !Array.isArray(request), 'BAD_REQUEST');
  ensure(request.action === 'post', 'ACTION_MUST_BE_POST');
  ensure(request.authorization?.postApproved === true, 'POST_NOT_APPROVED');
  const video = request.video ?? {};
  ensure(allowedMediaUrl(video.url), 'UNAPPROVED_MEDIA_URL');
  ensure(SHA256.test(video.sha256 ?? ''), 'BAD_MEDIA_FINGERPRINT');
  ensure(Number.isSafeInteger(video.sizeBytes) && video.sizeBytes >= 1_000
    && video.sizeBytes <= MAX_MEDIA_BYTES, 'BAD_MEDIA_FINGERPRINT');
  ensure(request.platform === 'facebook', 'PLATFORM_UNSUPPORTED');
  ensure(/^[A-Za-z0-9_-]{1,100}$/.test(request.accountId ?? ''), 'BAD_ACCOUNT_ID');
  ensure(typeof request.content === 'string' && request.content.trim().length > 0
    && request.content.length <= 5000, 'BAD_CONTENT');
  ensure(request.firstComment === undefined || (typeof request.firstComment === 'string'
    && request.firstComment.trim().length > 0 && request.firstComment.length <= 2000), 'BAD_FIRST_COMMENT');
  ensure(request.publishNow === true, 'ONLY_PUBLISH_NOW');
  ensure(request._requestSalt === undefined && request.nonce === undefined, 'RESERVED_FIELDS_PRESENT');
}

export function prepare(source) {
  fs.mkdirSync(PRIVATE, {recursive:true, mode:0o700});
  const branch = spawnSync('git', ['branch','--show-current'], {cwd:ROOT,encoding:'utf8'});
  ensure(branch.status === 0 && branch.stdout.trim() === BRANCH, 'WRONG_BRANCH');
  const status = spawnSync('git', ['status','--porcelain=v1','--untracked-files=all','--','.github/zernio-batch-trigger.json'], {cwd:ROOT,encoding:'utf8'});
  ensure(status.status === 0 && !status.stdout.trim(), 'TRIGGER_HAS_UNCOMMITTED_CHANGES');
  const bytes = fs.readFileSync(resolvePrivateFile(source));
  ensure(bytes.length > 0 && bytes.length < 1_000_000, 'BAD_PRIVATE_REQUEST_SIZE');
  let request;
  try { request = JSON.parse(bytes.toString('utf8')); } catch { throw new BatchError('BAD_PRIVATE_REQUEST'); }
  validateZernioRequest(request);
  request.nonce = crypto.randomBytes(16).toString('hex');
  request._requestSalt = crypto.randomBytes(32).toString('hex');
  const plain = Buffer.from(JSON.stringify(request) + '\n');
  const keys = crypto.generateKeyPairSync('rsa', {modulusLength:3072,
    publicKeyEncoding:{type:'spki',format:'pem'}, privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  const session = path.join(PRIVATE, request.nonce);
  fs.mkdirSync(session, {mode:0o700});
  fs.writeFileSync(path.join(session,'request.json'), plain, {flag:'wx',mode:0o600});
  fs.writeFileSync(path.join(session,'owner-private.pem'), keys.privateKey, {flag:'wx',mode:0o600});
  const trigger = {schemaVersion:1, nonce:request.nonce, requestSha256:hash(plain),
    ownerPublicKeyB64:Buffer.from(keys.publicKey).toString('base64')};
  fs.writeFileSync(TRIGGER, JSON.stringify(trigger,null,2) + '\n', {mode:0o644});
  return {nonce:request.nonce, session: path.relative(ROOT,session)};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [source, ...extra] = process.argv.slice(2);
    ensure(source && !extra.length, 'USAGE');
    console.log(JSON.stringify(prepare(source)));
  } catch (err) {
    console.error(`Preparation stopped: ${err instanceof BatchError ? err.code : 'PRIVATE_INPUT_ERROR'}`); process.exitCode = 1;
  }
}
