#!/usr/bin/env node
/** Compress and encrypt stdin for a private, read-only diagnostic on a public repo.
 * Only the one-time public key is stored in Git. The matching private key remains
 * on the operator's machine and must never enter Actions, Git or logs.
 * Output: a GitHub Actions notice containing a base64-encoded JSON envelope.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import { gzipSync } from 'node:zlib';

const [publicPath] = process.argv.slice(2);
if (!publicPath) throw new Error('public key file argument missing');
const parts = [];
for await (const chunk of process.stdin) parts.push(chunk);
const plain = gzipSync(Buffer.concat(parts), { level: 9 });
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
const envelope = {
  version: 1,
  encryption: 'RSA-OAEP-SHA256/AES-256-GCM',
  compression: 'gzip',
  key: crypto.publicEncrypt({ key: fs.readFileSync(publicPath), padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key).toString('base64'),
  iv: iv.toString('base64'),
  tag: cipher.getAuthTag().toString('base64'),
  ciphertext: ciphertext.toString('base64'),
};
const payload = Buffer.from(JSON.stringify(envelope)).toString('base64');
// GitHub truncates long annotation messages. Number chunks so the receiver can
// reassemble them; no individual message contains plaintext.
const chunkSize = 3000;
const count = Math.ceil(payload.length / chunkSize);
if (count > 10) throw new Error('Encrypted diagnostic exceeds ten annotation chunks');
for (let i = 0; i < count; i++) {
  const title = `Encrypted Buffer performance ${String(i + 1).padStart(2, '0')}-${String(count).padStart(2, '0')}`;
  process.stdout.write(`::notice title=${title}::${payload.slice(i * chunkSize, (i + 1) * chunkSize)}\n`);
}
