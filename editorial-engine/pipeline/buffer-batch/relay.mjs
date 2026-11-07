/* One-shot encrypted input relay for a public repository. Only an ephemeral
 * public key, nonce, digest and an unreferenced encrypted blob ID are visible;
 * actual captions, times, media URLs and IDs are never committed or logged. */
import crypto from 'node:crypto';
import {decryptBytes, gitBlobSha} from '../coverr-transfer/transfer.mjs';
import {BatchError} from './core.mjs';

const REPO = 'zamadye/Content-Creator';
const BRANCH = 'arena/54cb36c6-content-creator';
const ensure = (condition, code) => { if (!condition) throw new BatchError(code); };
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');

export function validateTrigger(trigger) {
  ensure(trigger?.schemaVersion === 1 && /^[a-f0-9]{32}$/.test(trigger.nonce ?? '')
    && /^[a-f0-9]{64}$/.test(trigger.requestSha256 ?? ''), 'BAD_TRIGGER');
  ensure(typeof trigger.simulation === 'boolean', 'BAD_TRIGGER_MODE');
  let owner;
  try { owner = crypto.createPublicKey(Buffer.from(trigger.ownerPublicKeyB64 ?? '', 'base64')); }
  catch { throw new BatchError('BAD_OWNER_PUBLIC_KEY'); }
  ensure(owner.asymmetricKeyType === 'rsa' && owner.asymmetricKeyDetails?.modulusLength >= 2048, 'BAD_OWNER_PUBLIC_KEY');
  return owner;
}

export function markerFor(nonce, blobSha) {
  ensure(/^[a-f0-9]{32}$/.test(nonce ?? '') && /^[a-f0-9]{40}$/.test(blobSha ?? ''), 'BAD_MARKER');
  return `[buffer-envelope:${nonce}] ${blobSha}`;
}
export function extractMarker(message, nonce) {
  if (!/^[a-f0-9]{32}$/.test(nonce ?? '') || typeof message !== 'string') return null;
  const firstLine = message.split('\n', 1)[0];
  const prefix = `[buffer-envelope:${nonce}] `;
  const sha = firstLine.startsWith(prefix) ? firstLine.slice(prefix.length) : '';
  return /^[a-f0-9]{40}$/.test(sha) ? sha : null;
}
export function openEnvelope(ciphertext, blobSha, trigger, privateKey) {
  ensure(Buffer.isBuffer(ciphertext) && ciphertext.length > 0 && ciphertext.length <= 2_000_000, 'BAD_INPUT_SIZE');
  ensure(gitBlobSha(ciphertext) === blobSha, 'BLOB_HASH_MISMATCH');
  let plaintext;
  try { plaintext = decryptBytes(ciphertext, privateKey); } catch { throw new BatchError('ENVELOPE_DECRYPT_FAILED'); }
  ensure(sha256(plaintext) === trigger.requestSha256, 'REQUEST_HASH_MISMATCH');
  let batch;
  try { batch = JSON.parse(plaintext.toString('utf8')); } catch { throw new BatchError('BAD_PRIVATE_REQUEST'); }
  ensure(batch.nonce === trigger.nonce, 'REQUEST_NONCE_MISMATCH');
  return batch;
}

function headers(token, raw = false) {
  return {'Authorization':`Bearer ${token}`, 'Accept': raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28', 'User-Agent':'Knot-Buffer-Batch/1.0'};
}
async function gh(url, options, timeout = 30_000) {
  try { return await fetch(url, {...options, redirect:'error', signal:AbortSignal.timeout(timeout)}); }
  catch { throw new BatchError('GITHUB_RELAY_NETWORK_ERROR'); }
}
export async function publishHandshake(token, trigger, pub) {
  ensure(process.env.GITHUB_REPOSITORY === REPO && /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? ''), 'BAD_GITHUB_CONTEXT');
  const data = {name:'Buffer batch secure input',head_sha:process.env.GITHUB_SHA,status:'in_progress',output:{
    title:'Ephemeral public key', summary:JSON.stringify({nonce:trigger.nonce,public_key_b64:Buffer.from(pub).toString('base64')})}};
  const result = await gh(`https://api.github.com/repos/${REPO}/check-runs`, {method:'POST',headers:{...headers(token),'Content-Type':'application/json'},body:JSON.stringify(data)});
  ensure(result.ok, 'HANDSHAKE_CREATE_FAILED');
  const body = await result.json(); ensure(Number.isSafeInteger(body.id), 'HANDSHAKE_RESPONSE_INVALID'); return body.id;
}
export async function closeHandshake(token, id, success) {
  if (!id) return;
  try {
    await gh(`https://api.github.com/repos/${REPO}/check-runs/${id}`, {method:'PATCH',headers:{...headers(token),'Content-Type':'application/json'},
      body:JSON.stringify({status:'completed',conclusion:success?'success':'failure',output:{title:'Input closed',summary:'Ephemeral key expired.'}})});
  } catch { /* report retains the authoritative status */ }
}

export async function waitForBatch(token, trigger, privateKey) {
  const deadline = Date.now() + 12 * 60_000;
  const commitsUrl = `https://api.github.com/repos/${REPO}/commits?sha=${encodeURIComponent(BRANCH)}&per_page=30`;
  while (Date.now() < deadline) {
    const result = await gh(commitsUrl, {headers:headers(token)});
    ensure(result.ok, 'SIGNAL_READ_FAILED');
    const commits = await result.json(); ensure(Array.isArray(commits), 'SIGNAL_RESPONSE_INVALID');
    const marker = commits.map(c => extractMarker(c?.commit?.message, trigger.nonce)).find(Boolean);
    if (marker) {
      const blob = await gh(`https://api.github.com/repos/${REPO}/git/blobs/${marker}`, {headers:headers(token,true)}, 60_000);
      ensure(blob.ok, 'INPUT_BLOB_UNAVAILABLE');
      const declared = Number(blob.headers.get('content-length') || 0);
      ensure(!declared || declared <= 2_000_000, 'BAD_INPUT_SIZE');
      return openEnvelope(Buffer.from(await blob.arrayBuffer()), marker, trigger, privateKey);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new BatchError('INPUT_TIMED_OUT');
}
