#!/usr/bin/env node
/* Read-only compatibility probe for the generic Buffer adapter. It never
 * calls create, update, delete, publish, or even a create dry-run. Its JSON
 * must be encrypted before leaving the runner because counts are private. */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BatchError, validateQueue} from './core.mjs';
import {BufferAdapter} from './buffer-adapter.mjs';

const ensure = (condition, code) => { if (!condition) throw new BatchError(code); };
export async function inspectAdapter(io) {
  const result = {schemaVersion:1, retrievedAt:new Date().toISOString(), status:'STARTING', stage:'CHANNELS', checks:{}, counts:{}};
  try {
    const channels = await io.listChannels();
    ensure(Array.isArray(channels), 'BUFFER_CHANNELS_INVALID');
    result.counts.channels = channels.length; result.checks.channels = 'PASS';
    result.stage = 'QUEUE';
    const queue = await io.listPosts();
    ensure(Array.isArray(queue), 'BUFFER_QUEUE_INVALID');
    result.counts.posts = queue.length;
    result.counts.statuses = {};
    for (const post of queue) {
      const status = String(post?.status ?? '').toLowerCase();
      // Only allow short fixed vocabulary in the encrypted result.
      const bucket = ['scheduled','sending','needs_approval','draft','error','sent'].includes(status) ? status : 'other';
      result.counts.statuses[bucket] = (result.counts.statuses[bucket] ?? 0) + 1;
    }
    result.checks.queue = 'PASS'; result.stage = 'QUEUE_SAFETY';
    validateQueue([], queue); result.checks.queueSafety = 'PASS';
    result.stage = 'POST_GET';
    const sample = queue.find(p => p?.id);
    if (sample) {
      const actual = await io.getPost(String(sample.id));
      ensure(actual && String(actual.id ?? '') === String(sample.id) && typeof actual.status === 'string', 'BUFFER_POST_SHAPE_INVALID');
      result.checks.getPost = 'PASS';
    } else result.checks.getPost = 'SKIP_NO_POSTS';
    result.stage = 'COMPLETE'; result.status = 'PASS';
  } catch (err) {
    result.status = 'FAIL'; result.error = err instanceof BatchError ? err.code : 'UNEXPECTED_ERROR';
  }
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await inspectAdapter(new BufferAdapter());
  process.stdout.write(JSON.stringify(result));
  if (result.status !== 'PASS') process.exitCode = 1;
}
