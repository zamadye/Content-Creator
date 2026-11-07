/* GitHub-runner adapter. Buffer has no direct media upload through this API:
 * the approved source URL must remain reachable until every post is sent. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {Readable, Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
import {allowedMediaUrl, BatchError, MAX_MEDIA_BYTES} from './core.mjs';

const ensure = (condition, code) => { if (!condition) throw new BatchError(code); };
function findObject(root, predicate, depth = 0) {
  if (!root || typeof root !== 'object' || depth > 10) return null;
  if (predicate(root)) return root;
  for (const value of Object.values(root)) {
    const found = findObject(value, predicate, depth + 1);
    if (found) return found;
  }
  return null;
}
function findPost(value) {
  return value?.post ?? (value?.id ? value : null)
    ?? findObject(value, x => x.post && typeof x.post === 'object')?.post
    ?? findObject(value, x => x.id && (x.status || x.channelId));
}
function cli(args) {
  const result = spawnSync('buffer', [...args, '--output', 'json', '--quiet'], {
    encoding: 'utf8', timeout: 90_000, maxBuffer: 8 * 1024 * 1024,
    env: {...process.env, NO_COLOR: '1'},
  });
  // Do not print stderr or command arguments: they may include a media URL or
  // content. The caller marks create failures uncertain, even on timeout.
  ensure(result.status === 0, 'BUFFER_CALL_FAILED');
  try { return JSON.parse((result.stdout ?? '').trim()); }
  catch { throw new BatchError('BUFFER_RESPONSE_INVALID'); }
}
export function validateProbe(value, platforms) {
  const video = value?.streams?.find(s => s.codec_type === 'video');
  const audio = value?.streams?.find(s => s.codec_type === 'audio');
  const duration = Number(value?.format?.duration), width = Number(video?.width), height = Number(video?.height);
  ensure(video && audio && Number.isFinite(duration) && duration >= 3, 'BAD_MEDIA_STREAMS');
  ensure(width >= 1080 && height >= 1920 && Math.abs(width / height - 9 / 16) <= 0.02, 'BAD_VERTICAL_VIDEO_SIZE');
  if (platforms.includes('facebook')) ensure(duration <= 90, 'FACEBOOK_REEL_TOO_LONG');
  if (platforms.includes('youtube')) ensure(duration <= 180, 'YOUTUBE_SHORT_TOO_LONG');
  return {duration, width, height};
}
function probe(filename, platforms) {
  const run = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height', '-of', 'json', filename], {
    encoding: 'utf8', timeout: 45_000, maxBuffer: 1024 * 1024,
  });
  ensure(run.status === 0, 'FFPROBE_FAILED_OR_MISSING');
  let value;
  try { value = JSON.parse(run.stdout); } catch { throw new BatchError('FFPROBE_BAD_RESPONSE'); }
  return validateProbe(value, platforms);
}

/** Verify the anonymous media bytes at scheduling time. This cannot guarantee
 * that the host remains available later; preserve the URL until publication. */
export async function verifyMedia(video, platforms, fetcher = fetch, probeFile = probe) {
  let current = video.url, response;
  for (let i = 0; i < 5; i++) {
    ensure(allowedMediaUrl(current), 'MEDIA_REDIRECT_BLOCKED');
    try { response = await fetcher(current, {redirect: 'manual', signal: AbortSignal.timeout(120_000)}); }
    catch { throw new BatchError('MEDIA_NETWORK_ERROR'); }
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      ensure(location, 'MEDIA_REDIRECT_MISSING');
      try { current = new URL(location, current).toString(); } catch { throw new BatchError('MEDIA_REDIRECT_INVALID'); }
      await response.body?.cancel();
      response = null;
      continue;
    }
    break;
  }
  ensure(response?.ok && response.body, 'MEDIA_UNAVAILABLE');
  const contentType = String(response.headers.get('content-type') ?? '').toLowerCase();
  ensure(contentType.startsWith('video/') || contentType.includes('octet-stream'), 'MEDIA_NOT_VIDEO');
  const declared = Number(response.headers.get('content-length') || 0);
  ensure(!declared || declared === video.sizeBytes, 'MEDIA_SIZE_HEADER_MISMATCH');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'buffer-batch-'));
  const file = path.join(directory, 'input.mp4');
  const hash = crypto.createHash('sha256'); let bytes = 0;
  const limiter = new Transform({transform(chunk, _encoding, done) {
    bytes += chunk.length;
    if (bytes > video.sizeBytes || bytes > MAX_MEDIA_BYTES) return done(new BatchError('MEDIA_TOO_LARGE'));
    hash.update(chunk); done(null, chunk);
  }});
  try {
    await pipeline(Readable.fromWeb(response.body), limiter, fs.createWriteStream(file, {flags: 'wx', mode: 0o600}));
    ensure(bytes === video.sizeBytes && hash.digest('hex') === video.sha256, 'MEDIA_HASH_MISMATCH');
    return probeFile(file, platforms);
  } catch (err) {
    if (err instanceof BatchError) throw err;
    throw new BatchError('MEDIA_DOWNLOAD_FAILED');
  } finally {
    fs.rmSync(directory, {recursive: true, force: true});
  }
}

export class BufferAdapter {
  constructor() { this.org = null; }
  organization() {
    if (this.org) return this.org;
    const result = cli(['account', '--fields', 'organizations.id,organizations.name']);
    const organizations = findObject(result, x => Array.isArray(x.organizations))?.organizations ?? [];
    const configured = process.env.BUFFER_ORGANIZATION_ID;
    if (configured) {
      ensure(organizations.some(o => String(o.id) === String(configured)), 'BUFFER_ORGANIZATION_MISMATCH');
      this.org = String(configured);
    } else {
      ensure(organizations.filter(o => o.id).length === 1, 'BUFFER_ORGANIZATION_AMBIGUOUS');
      this.org = String(organizations.find(o => o.id).id);
    }
    return this.org;
  }
  async listChannels() {
    const value = cli(['channels', 'list', '--organization-id', this.organization(), '--fields', 'id,name,displayName,service,isDisconnected,isLocked,isQueuePaused']);
    const channels = Array.isArray(value) ? value : (value.items ?? value.channels ?? findObject(value, x => Array.isArray(x.items))?.items);
    ensure(Array.isArray(channels), 'BUFFER_CHANNELS_INVALID'); return channels;
  }
  async listPosts() {
    const items = [], seen = new Set(); let cursor;
    // Complete pagination is mandatory for duplicate and two-hour checks.
    for (let page = 0; page < 100; page++) {
      const args = ['posts', 'list', '--organization-id', this.organization(), '--limit', '100', '--fields', 'items.id,items.text,items.status,items.channelId,items.channelService,items.sentAt,items.dueAt,items.externalLink,pageInfo.hasNextPage,pageInfo.endCursor'];
      if (cursor) args.push('--after', cursor);
      const value = cli(args);
      const pageValue = value?.items && value?.pageInfo ? value : value?.posts?.items && value?.posts?.pageInfo ? value.posts : findObject(value, x => Array.isArray(x.items) && x.pageInfo);
      ensure(Array.isArray(pageValue?.items) && typeof pageValue?.pageInfo?.hasNextPage === 'boolean', 'BUFFER_QUEUE_INVALID');
      items.push(...pageValue.items);
      if (!pageValue.pageInfo.hasNextPage) return items;
      cursor = pageValue.pageInfo.endCursor;
      ensure(typeof cursor === 'string' && cursor && !seen.has(cursor), 'BUFFER_CURSOR_INVALID'); seen.add(cursor);
    }
    throw new BatchError('BUFFER_QUEUE_TOO_LARGE_TO_CHECK');
  }
  async verifyMedia(video, platforms) { return verifyMedia(video, platforms); }
  async dryRun(payload) { cli(['posts', 'create', '--json', JSON.stringify(payload), '--dry-run']); }
  async createPost(payload) {
    const value = cli(['posts', 'create', '--json', JSON.stringify(payload), '--fields', 'post.id,post.status,post.dueAt,post.channelId']);
    return findPost(value)?.id ?? null;
  }
  async getPost(id) {
    const fields = 'id,text,status,dueAt,sentAt,externalLink,channelId,channelService,metadata.title,assets.source,assets.type';
    const post = findPost(cli(['posts', 'get', '--id', String(id), '--fields', fields]));
    ensure(post, 'BUFFER_POST_NOT_FOUND'); return post;
  }
}
