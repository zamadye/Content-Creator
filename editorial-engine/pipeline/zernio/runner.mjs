#!/usr/bin/env node
/* One-shot Zernio publisher. Runs on GitHub Actions: handshakes an ephemeral
 * key, waits for one encrypted request, verifies the media bytes itself, then
 * creates exactly one Facebook post via the Zernio API. Every failure stops
 * before creation or is reported as uncertain; never retry blindly. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {BatchError, allowedMediaUrl} from '../buffer-batch/core.mjs';
import {validateTrigger, waitForBatch, publishHandshake, closeHandshake} from '../buffer-batch/relay.mjs';
import {validateZernioRequest} from './prepare.mjs';

const ZERNIO_BASE = 'https://zernio.com/api/v1';

export async function runZernio(batch, apiKey, {report, persist, fetcher = fetch} = {}) {
  const out = report ?? {schemaVersion:1, status:'INITIALIZING', posts:[], error:null, startedAt:new Date().toISOString()};
  const save = () => persist?.(out);
  try {
    validateZernioRequest(batch);
    out.platform = batch.platform; save();
    if (!apiKey) throw new BatchError('ZERNIO_KEY_MISSING');
    /* Verify the exact media bytes before asking Zernio to publish. */
    const response = await fetcher(batch.video.url, {redirect:'follow', signal:AbortSignal.timeout(300_000)});
    if (!response.ok) throw new BatchError('MEDIA_UNAVAILABLE');
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared && declared !== batch.video.sizeBytes) throw new BatchError('MEDIA_SIZE_HEADER_MISMATCH');
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== batch.video.sizeBytes) throw new BatchError('MEDIA_SIZE_MISMATCH');
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    if (digest !== batch.video.sha256) throw new BatchError('MEDIA_HASH_MISMATCH');
    out.verified = {sha256:digest, sizeBytes:bytes.length}; save();
    const entry = {platform:batch.platform, accountId:batch.accountId, outcome:'NOT_ATTEMPTED'};
    out.posts = [entry]; save();
    const body = {
      content: batch.content,
      mediaItems: [{type:'video', url: batch.video.url}],
      platforms: [{platform: batch.platform, accountId: batch.accountId,
        ...(batch.firstComment ? {platformSpecificData:{firstComment: batch.firstComment}} : {})}],
      publishNow: true,
    };
    const created = await fetcher(`${ZERNIO_BASE}/posts`, {
      method:'POST',
      headers:{'Authorization':`Bearer ${apiKey}`, 'Content-Type':'application/json',
        'Idempotency-Key': batch.nonce},
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(300_000),
    });
    let payload;
    const text = await created.text();
    try { payload = text ? JSON.parse(text) : {}; } catch { payload = {raw: text.slice(0,400)}; }
    out.httpStatus = created.status; save();
    if (created.status === 200 || created.status === 201) {
      entry.outcome = 'SUCCEEDED';
      entry.id = payload?.post?._id ?? payload?.post?.id ?? null;
      const plat = payload?.post?.platforms?.[0];
      entry.status = plat?.status ?? null;
      entry.platformPostUrl = plat?.platformPostUrl ?? null;
      out.status = 'SUBMITTED'; save();
      return out;
    }
    if (created.status === 207) {
      const plat = payload?.post?.platforms?.[0];
      entry.outcome = 'PARTIAL_OR_UNCERTAIN';
      entry.id = payload?.post?._id ?? null;
      entry.status = plat?.status ?? null;
      entry.platformPostUrl = plat?.platformPostUrl ?? null;
      out.status = 'PARTIAL_OR_UNCERTAIN'; out.error = 'ZERNIO_PARTIAL'; save();
      return out;
    }
    entry.outcome = 'NOT_ATTEMPTED';
    out.error = `ZERNIO_HTTP_${created.status}`;
    out.zernioError = (payload?.error ?? payload?.message ?? '').toString().slice(0,200) || null;
    out.status = created.status >= 500 ? 'PARTIAL_OR_UNCERTAIN' : 'STOPPED_BEFORE_CREATION';
    save();
    return out;
  } catch (err) {
    if (!out.error) out.error = err instanceof BatchError ? err.code : 'RUNNER_ERROR';
    if (!['PARTIAL_OR_UNCERTAIN'].includes(out.status ?? '')) out.status = 'STOPPED_BEFORE_CREATION';
    save();
    return out;
  }
}

export async function main() {
  const reportPath = process.env.KNOT_REPORT_PATH ?? '/tmp/knot-zernio-report.json';
  const report = {schemaVersion:1, status:'STARTING', posts:[], error:null, startedAt:new Date().toISOString()};
  const persist = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', {mode:0o600});
  let checkId, success = false;
  try {
    persist();
    const trigger = JSON.parse(fs.readFileSync('.github/zernio-batch-trigger.json', 'utf8'));
    validateTrigger(trigger); report.simulation = false; persist();
    if (!process.env.GITHUB_TOKEN) throw new BatchError('GITHUB_TOKEN_MISSING');
    if (!process.env.ZERNIO_API_KEY) throw new BatchError('ZERNIO_KEY_MISSING');
    const keys = crypto.generateKeyPairSync('rsa', {modulusLength:3072,
      publicKeyEncoding:{type:'spki',format:'pem'}, privateKeyEncoding:{type:'pkcs8',format:'pem'}});
    checkId = await publishHandshake(process.env.GITHUB_TOKEN, trigger, keys.publicKey);
    console.log('Secure input ready; waiting for one encrypted Zernio request.');
    const batch = await waitForBatch(process.env.GITHUB_TOKEN, trigger, keys.privateKey);
    const result = await runZernio(batch, process.env.ZERNIO_API_KEY, {report, persist});
    if (result.status === 'SUBMITTED') success = true;
    console.log(result.status === 'SUBMITTED' ? 'Zernio post created and acknowledged.' : 'Zernio run stopped; inspect the encrypted report before any retry.');
  } catch (err) {
    if (!report.error) report.error = err instanceof BatchError ? err.code : 'RUNNER_ERROR';
    if (!['PARTIAL_OR_UNCERTAIN','STOPPED_BEFORE_CREATION'].includes(report.status)) report.status = 'STOPPED_BEFORE_CREATION';
    persist();
    console.error('Zernio run stopped. Inspect the encrypted report and reconcile before any retry.');
    process.exitCode = 1;
  } finally {
    if (checkId) await closeHandshake(process.env.GITHUB_TOKEN, checkId, success);
  }
}
if (process.argv[1] && process.argv[1].endsWith('runner.mjs')) await main();
