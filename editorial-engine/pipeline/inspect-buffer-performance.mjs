#!/usr/bin/env node
/**
 * Read-only, privacy-conscious performance inspection.
 *
 * Calls only Buffer query commands (account, channels list, posts list and
 * aggregatedPostMetrics), never post creation/update/deletion. It limits its
 * output to channels whose name/link identifies KNOT THEORY. The JSON is meant
 * to be piped into encrypt-diagnostic.mjs; do not publish it to Actions logs.
 * Metrics are optional, may be plan/network dependent and can be stale.
 */
import { spawnSync } from 'node:child_process';

const stamp = new Date();
const result = { retrievedAt: stamp.toISOString(), version: 1, channels: [], posts: [], aggregates: [], errors: [] };
const call = (args) => {
  const r = spawnSync('buffer', [...args, '--output', 'json', '--quiet'], {
    encoding: 'utf8', timeout: 60_000, maxBuffer: 20 * 1024 * 1024,
    env: { ...process.env, NO_COLOR: '1' },
  });
  if (r.error) return { ok: false, code: r.error.code ?? 'PROCESS_ERROR' };
  if (r.status !== 0) {
    // Retain only a machine-readable code, never raw CLI errors or credentials.
    let parsed;
    try { parsed = JSON.parse(r.stderr || r.stdout || '{}'); } catch { parsed = {}; }
    const code = String(parsed.error ?? parsed.code ?? `EXIT_${r.status}`);
    return { ok: false, code: /^[A-Z0-9_]{1,80}$/.test(code) ? code : `EXIT_${r.status}` };
  }
  try { return { ok: true, value: JSON.parse(r.stdout) }; }
  catch { return { ok: false, code: 'INVALID_JSON' }; }
};
const find = (node, test, depth = 0) => {
  if (!node || typeof node !== 'object' || depth > 10) return null;
  if (test(node)) return node;
  for (const v of Object.values(node)) { const x = find(v, test, depth + 1); if (x) return x; }
  return null;
};
const array = (node, key) => {
  if (Array.isArray(node)) return node;
  return find(node, (x) => Array.isArray(x?.[key]))?.[key] ?? [];
};
const metricObject = (value) => find(value, (x) => !Array.isArray(x) && Array.isArray(x?.metrics));
const fields = 'items.id,items.text,items.status,items.channelId,items.channelService,items.sentAt,items.dueAt,items.externalLink,items.metrics.type,items.metrics.name,items.metrics.value,items.metrics.unit,items.metricsUpdatedAt,pageInfo.hasNextPage,pageInfo.endCursor';
const basicFields = 'items.id,items.text,items.status,items.channelId,items.channelService,items.sentAt,items.dueAt,items.externalLink,pageInfo.hasNextPage,pageInfo.endCursor';
const compactMetric = (m) => ({ type: m?.type ?? null, name: m?.name ?? null, value: m?.value ?? null, unit: m?.unit ?? null });

try {
  if (!process.env.BUFFER_API_KEY) throw new Error('NO_BUFFER_API_KEY');
  const acc = call(['account', '--fields', 'organizations.id,organizations.name']);
  if (!acc.ok) throw new Error(`ACCOUNT_${acc.code}`);
  const orgs = array(acc.value, 'organizations');
  if (!orgs.length) throw new Error('NO_ORGANIZATIONS');
  for (const org of orgs) {
    if (!org?.id) continue;
    const cr = call(['channels', 'list', '--organization-id', String(org.id), '--fields', 'id,name,displayName,service,externalLink,isDisconnected']);
    if (!cr.ok) { result.errors.push({ operation: 'channels.list', organizationId: org.id, code: cr.code }); continue; }
    const channels = array(cr.value, 'channels').filter((c) => {
      const normalized = `${c.name ?? ''} ${c.displayName ?? ''} ${c.externalLink ?? ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalized.includes('knottheory') && /youtube|instagram|tiktok|facebook/i.test(String(c.service ?? ''));
    });
    const ids = new Set(channels.map((c) => String(c.id)));
    result.channels.push(...channels.map((c) => ({ id: c.id, organizationId: org.id, name: c.name, displayName: c.displayName, service: c.service, isDisconnected: c.isDisconnected })));
    if (!ids.size) continue;
    let after = null;
    for (let page = 0; page < 10; page++) {
      const base = ['posts', 'list', '--organization-id', String(org.id), '--limit', '100'];
      if (after) base.push('--after', after);
      let pr = call([...base, '--fields', fields]);
      let metricsAvailable = true;
      if (!pr.ok) {
        result.errors.push({ operation: 'posts.list.metrics', organizationId: org.id, code: pr.code });
        metricsAvailable = false;
        pr = call([...base, '--fields', basicFields]);
      }
      if (!pr.ok) { result.errors.push({ operation: 'posts.list.basic', organizationId: org.id, code: pr.code }); break; }
      const block = find(pr.value, (x) => !Array.isArray(x) && Array.isArray(x?.items));
      if (!block) { result.errors.push({ operation: 'posts.list', code: 'UNEXPECTED_SHAPE' }); break; }
      for (const p of block.items) {
        if (!p?.id || !ids.has(String(p.channelId)) || p.status !== 'sent') continue;
        result.posts.push({ id: p.id, channelId: p.channelId, channelService: p.channelService, status: p.status,
          sentAt: p.sentAt ?? null, dueAt: p.dueAt ?? null, externalLink: p.externalLink ?? null,
          text: String(p.text ?? '').slice(0, 280),
          metrics: metricsAvailable && Array.isArray(p.metrics) ? p.metrics.map(compactMetric) : null,
          metricsUpdatedAt: metricsAvailable ? (p.metricsUpdatedAt ?? null) : null });
      }
      if (!block.pageInfo?.hasNextPage) break;
      after = block.pageInfo.endCursor;
      if (!after) { result.errors.push({ operation: 'posts.list', code: 'MISSING_CURSOR' }); break; }
      if (page === 9) result.errors.push({ operation: 'posts.list', code: 'PAGE_LIMIT_10' });
    }
    const end = new Date(Date.UTC(stamp.getUTCFullYear(), stamp.getUTCMonth(), stamp.getUTCDate()));
    const start = new Date(end.getTime() - 14 * 86400_000);
    for (const c of channels) {
      const payload = JSON.stringify({ organizationId: String(org.id), channelIds: [String(c.id)], startDateTime: start.toISOString(), endDateTime: end.toISOString() });
      const ar = call(['aggregatedPostMetrics', '--json', payload]);
      if (!ar.ok) { result.errors.push({ operation: 'aggregatedPostMetrics', channelId: c.id, code: ar.code }); continue; }
      const a = metricObject(ar.value);
      if (!a) { result.errors.push({ operation: 'aggregatedPostMetrics', channelId: c.id, code: 'NO_METRIC_OBJECT' }); continue; }
      result.aggregates.push({ channelId: c.id, from: start.toISOString(), through: end.toISOString(), metricsUpdatedAt: a.metricsUpdatedAt ?? null, metrics: a.metrics.map(compactMetric) });
    }
  }
  if (!result.channels.length) result.errors.push({ operation: 'scope', code: 'NO_KNOT_THEORY_CHANNELS' });
} catch (e) {
  const message = String(e?.message ?? 'UNKNOWN_FAILURE');
  result.errors.push({ operation: 'setup', code: /^[A-Z0-9_]{1,120}$/.test(message) ? message : 'UNKNOWN_FAILURE' });
}
process.stdout.write(JSON.stringify(result));
