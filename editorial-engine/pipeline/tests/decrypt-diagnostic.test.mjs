import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { decryptAnnotations } from '../decrypt-diagnostic.mjs';

const encrypt = fileURLToPath(new URL('../encrypt-diagnostic.mjs', import.meta.url));
const decrypt = fileURLToPath(new URL('../decrypt-diagnostic.mjs', import.meta.url));
const root = fileURLToPath(new URL('../../../', import.meta.url));

test('encrypted annotations round-trip in any order; incomplete, duplicated and wrong-key data fail', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'retensi-diagnostic-'));
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    const publicPath = path.join(tmp, 'public.pem');
    fs.writeFileSync(publicPath, publicKey);
    // Incompressible enough to require several ordered annotation chunks.
    const payload = { retrievedAt: '2026-01-01T00:00:00Z', sample: crypto.randomBytes(7000).toString('hex'), errors: [] };
    const r = spawnSync(process.execPath, [encrypt, publicPath], { input: JSON.stringify(payload), encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
    const annotations = r.stdout.trim().split('\n').map((line) => {
      const m = /^::notice title=(.*?)::(.*)$/.exec(line);
      assert.ok(m, 'expected encrypted notice');
      return { title: m[1], message: m[2] };
    });
    assert.ok(annotations.length > 1);
    assert.deepEqual(decryptAnnotations([...annotations].reverse(), privateKey), payload);
    assert.throws(() => decryptAnnotations(annotations.slice(1), privateKey), /Incomplete/);
    assert.throws(() => decryptAnnotations([...annotations, annotations[0]], privateKey), /Incomplete/);
    const wrongKey = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' },
    }).privateKey;
    assert.throws(() => decryptAnnotations(annotations, wrongKey));
    const damaged = annotations.map((a) => ({ ...a }));
    damaged[0].message = '!' + damaged[0].message.slice(1);
    assert.throws(() => decryptAnnotations(damaged, privateKey), /Invalid/);

    // Exercise the CLI with synthetic data only, inside the ignored directory.
    const privateDir = path.join(root, 'editorial-engine/deliverables/retensi-research/private');
    fs.mkdirSync(privateDir, { recursive: true, mode: 0o700 });
    const p = fs.mkdtempSync(path.join(privateDir, 'synthetic-test-'));
    try {
      const ann = path.join(p, 'annotations.json');
      const key = path.join(p, 'key.pem');
      const out = path.join(p, 'result.json');
      fs.writeFileSync(ann, JSON.stringify(annotations));
      fs.writeFileSync(key, privateKey, { mode: 0o600 });
      const cli = spawnSync(process.execPath, [decrypt, ann, key, out], { encoding: 'utf8' });
      assert.equal(cli.status, 0, cli.stderr);
      assert.ok(!cli.stdout.includes(payload.sample));
      assert.deepEqual(JSON.parse(fs.readFileSync(out, 'utf8')), payload);
      assert.equal(fs.statSync(out).mode & 0o777, 0o600);
      assert.notEqual(spawnSync(process.execPath, [decrypt, ann, key, out]).status, 0, 'must not overwrite');
      const outside = path.join(tmp, 'forbidden.json');
      assert.notEqual(spawnSync(process.execPath, [decrypt, ann, key, outside]).status, 0, 'must not write outside private');
      assert.equal(fs.existsSync(outside), false);
    } finally {
      fs.rmSync(p, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
