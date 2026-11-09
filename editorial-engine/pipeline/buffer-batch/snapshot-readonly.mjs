#!/usr/bin/env node
/*
 * Read-only snapshot of the configured Buffer organization. The CLI invokes
 * listChannels/listPosts and a post get for schema checks. Its output contains private channel IDs and
 * queue times and MUST be encrypted before leaving the runner. Never pipe its
 * plaintext into Actions logs or commit it. Creation, update and deletion are
 * intentionally absent.
 */
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BufferAdapter} from './buffer-adapter.mjs';
import {probeReadbackFields} from './probe-readback-readonly.mjs';
import {BatchError} from './core.mjs';

const MAX_RELEVANT_POSTS = 200;
const ACTIVE = new Set(['scheduled', 'sending', 'needs_approval']);
const KNOWN = new Set([...ACTIVE, 'draft', 'error', 'sent']);

export async function snapshotReadOnly(io, now = Date.now()) {
  const report = {
    schemaVersion: 1,
    retrievedAt: new Date(now).toISOString(),
    status: 'STARTING',
    stage: 'CHANNELS',
  };
  try {
    const channels = await io.listChannels();
    if (!Array.isArray(channels)) throw new BatchError('BUFFER_CHANNELS_INVALID');
    report.channels = channels.map(c => ({
      id: c.id ?? null,
      name: c.name ?? c.displayName ?? null,
      displayName: c.displayName ?? null,
      service: c.service ?? null,
      isDisconnected: c.isDisconnected ?? null,
      isLocked: c.isLocked ?? null,
      isQueuePaused: c.isQueuePaused ?? null,
    }));
    report.stage = 'QUEUE';
    const queue = await io.listPosts();
    if (!Array.isArray(queue)) throw new BatchError('BUFFER_QUEUE_INVALID');
    const counts = {};
    const relevant = [];
    for (const p of queue) {
      const status = String(p?.status ?? '').toLowerCase();
      const bucket = KNOWN.has(status) ? status : 'unknown';
      counts[bucket] = (counts[bucket] ?? 0) + 1;
      const sentTime = Date.parse(p?.sentAt ?? p?.dueAt ?? '');
      // Past posts can affect an upcoming slot only if they were sent within
      // two hours. Keep a little more margin for operator review.
      const recentlySent = status === 'sent' && (!Number.isFinite(sentTime) || sentTime >= now - 24 * 60 * 60 * 1000);
      if (ACTIVE.has(status) || recentlySent || bucket === 'unknown') {
        relevant.push({
          id: p.id ?? null,
          channelId: p.channelId ?? p.channel?.id ?? null,
          channelService: p.channelService ?? null,
          status,
          dueAt: p.dueAt ?? null,
          sentAt: p.sentAt ?? null,
        });
      }
    }
    report.queue = {
      total: queue.length,
      counts,
      relevantTotal: relevant.length,
      relevantTruncated: relevant.length > MAX_RELEVANT_POSTS,
      relevant: relevant.slice(0, MAX_RELEVANT_POSTS),
    };
    report.stage = 'COMPLETE';
    report.status = 'PASS';
  } catch (err) {
    report.status = 'FAIL';
    // Never emit arbitrary error text, stack traces, credentials or URLs.
    report.error = err instanceof BatchError ? err.code : 'UNEXPECTED_ERROR';
  }
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const io = new BufferAdapter();
  const report = await snapshotReadOnly(io);
  // Separate outcome: a channel or an old post may not exist yet.
  report.readbackProbe = report.status === 'PASS' ? await probeReadbackFields(io) : {status:'SKIP'};
  process.stdout.write(JSON.stringify(report));
  if (report.status !== 'PASS' || report.readbackProbe.status !== 'PASS') process.exitCode = 1;
}
