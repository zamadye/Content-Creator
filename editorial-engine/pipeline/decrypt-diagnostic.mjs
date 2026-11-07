#!/usr/bin/env node
/** Decrypt numbered read-only diagnostic annotations without printing plaintext. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import crypto from 'node:crypto';
import { gunzipSync } from 'node:zlib';

const RE = /^Encrypted Buffer performance (\d{2})-(\d{2})$/;
const MAX_BYTES = 20 * 1024 * 1024;

export function decryptAnnotations(annotations, privateKey) {
  if (!Array.isArray(annotations)) throw new Error('Expected an annotations array');
  const chunks = annotations.flatMap((annotation) => {
    const match = RE.exec(String(annotation?.title ?? ''));
    if (!match) return [];
    return [{ number: Number(match[1]), total: Number(match[2]), message: annotation.message }];
  });
  if (!chunks.length) throw new Error('No encrypted diagnostic chunks');
  const total = chunks[0].total;
  if (total < 1 || total > 10 || chunks.length !== total) throw new Error('Incomplete diagnostic chunks');
  chunks.sort((a, b) => a.number - b.number);
  for (let i = 0; i < total; i++) {
    const chunk = chunks[i];
    if (chunk.total !== total || chunk.number !== i + 1 || typeof chunk.message !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(chunk.message)) {
      throw new Error('Invalid diagnostic chunk sequence');
    }
  }
  const envelope = JSON.parse(Buffer.from(chunks.map((c) => c.message).join(''), 'base64').toString('utf8'));
  if (envelope.version !== 1 || envelope.encryption !== 'RSA-OAEP-SHA256/AES-256-GCM' || envelope.compression !== 'gzip') {
    throw new Error('Unsupported diagnostic envelope');
  }
  const key = crypto.privateDecrypt({ key: privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(envelope.key, 'base64'));
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  if (key.length !== 32 || iv.length !== 12 || tag.length !== 16) throw new Error('Invalid diagnostic envelope lengths');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const compressed = Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]);
  const raw = gunzipSync(compressed, { maxOutputLength: MAX_BYTES });
  // Parse to verify format before writing anything. Never print the data.
  return JSON.parse(raw.toString('utf8'));
}

function assertPrivatePath(candidate, privateDir, mustExist) {
  const resolved = path.resolve(candidate);
  const actual = mustExist ? fs.realpathSync(resolved) : path.join(fs.realpathSync(path.dirname(resolved)), path.basename(resolved));
  if (!actual.startsWith(privateDir + path.sep)) throw new Error('All files must stay inside the ignored private directory');
  return actual;
}

function main() {
  const [annotations, key, output, ...extra] = process.argv.slice(2);
  if (!annotations || !key || !output || extra.length) {
    throw new Error('Usage: node decrypt-diagnostic.mjs <annotations.json> <private-key.pem> <output.json>');
  }
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const privateDir = fs.realpathSync(path.join(root, 'editorial-engine/deliverables/retensi-research/private'));
  const annotationPath = assertPrivatePath(annotations, privateDir, true);
  const keyPath = assertPrivatePath(key, privateDir, true);
  const outputPath = assertPrivatePath(output, privateDir, false);
  const result = decryptAnnotations(JSON.parse(fs.readFileSync(annotationPath, 'utf8')), fs.readFileSync(keyPath));
  // wx: never overwrite a previous diagnostic; mode 0600: owner only.
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log('Decrypted diagnostic saved in private directory. Inspect it locally; do not publish it.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { main(); }
  catch {
    // Avoid leaking snippets of JSON or paths in exceptions to a public log.
    console.error('Diagnostic decryption failed; verify paths, chunk sequence, envelope and private key locally.');
    process.exitCode = 1;
  }
}
