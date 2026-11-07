#!/usr/bin/env node
/* One Action, one batch. It never waits for publication and has no cron.
 * A batch is either preflight-only or sent to Buffer with customScheduled.
 * Incomplete or ambiguous creates must be reconciled, never blindly retried. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {BatchError, runBatch} from './core.mjs';
import {BufferAdapter} from './buffer-adapter.mjs';
import {validateTrigger, publishHandshake, waitForBatch, closeHandshake} from './relay.mjs';

function simulationAdapter(batch) {
  // Only synthetic preflight; never connects to Buffer, media hosts, or calls create.
  return {
    async listChannels() { return [...new Map(batch.posts.map(p => [p.channelId, {id:p.channelId,service:p.platform}])).values()]; },
    async listPosts() { return []; },
    async verifyMedia() {}, async dryRun() {},
    async createPost() { throw new BatchError('SIMULATION_FORBIDS_CREATE'); },
    async getPost() { throw new BatchError('SIMULATION_FORBIDS_READBACK'); },
  };
}

export async function main() {
  const reportPath = process.env.KNOT_REPORT_PATH ?? '/tmp/knot-buffer-batch-report.json';
  const report = {schemaVersion:1, status:'STARTING', simulation:null, posts:[], error:null, startedAt:new Date().toISOString()};
  const persist = () => fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', {mode:0o600});
  let checkId, success = false;
  try {
    persist();
    const trigger = JSON.parse(fs.readFileSync('.github/buffer-batch-trigger.json', 'utf8'));
    validateTrigger(trigger); report.simulation = trigger.simulation; persist();
    if (!process.env.GITHUB_TOKEN) throw new BatchError('GITHUB_TOKEN_MISSING');
    if (!trigger.simulation && !process.env.BUFFER_API_KEY) throw new BatchError('BUFFER_KEY_MISSING');
    const keys = crypto.generateKeyPairSync('rsa', {modulusLength:3072,
      publicKeyEncoding:{type:'spki',format:'pem'}, privateKeyEncoding:{type:'pkcs8',format:'pem'}});
    checkId = await publishHandshake(process.env.GITHUB_TOKEN, trigger, keys.publicKey);
    console.log('Secure input ready; waiting for one encrypted batch.');
    const batch = await waitForBatch(process.env.GITHUB_TOKEN, trigger, keys.privateKey);
    if (trigger.simulation && batch.action !== 'preflight') throw new BatchError('SIMULATION_REQUIRES_PREFLIGHT');
    await runBatch(batch, trigger.simulation ? simulationAdapter(batch) : new BufferAdapter(), {report,persist});
    success = true;
    console.log(trigger.simulation ? 'Simulation complete; no Buffer calls or posts were made.'
      : batch.action === 'preflight' ? 'Preflight complete; no post created.'
      : 'Batch submitted and read back. Publication will be handled by Buffer.');
  } catch (err) {
    if (!report.error) report.error = err instanceof BatchError ? err.code : 'RUNNER_ERROR';
    if (!['PARTIAL_OR_UNCERTAIN','STOPPED_BEFORE_CREATION'].includes(report.status)) report.status = 'STOPPED_BEFORE_CREATION';
    persist();
    console.error('Batch stopped. Inspect the encrypted report and reconcile before any retry.');
    process.exitCode = 1;
  } finally {
    if (checkId) await closeHandshake(process.env.GITHUB_TOKEN, checkId, success);
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
