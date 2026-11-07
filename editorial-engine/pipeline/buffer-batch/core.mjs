/* Safety gates and one-shot batch coordination for Buffer. No network or
 * filesystem access here: adapters are injected so every mutation is testable.
 * A successful run places posts in Buffer; it does not publish them itself. */
import {isIP} from 'node:net';

export class BatchError extends Error {
  constructor(code) { super(code); this.name = 'BatchError'; this.code = code; }
}
const requireSafe = (condition, code) => { if (!condition) throw new BatchError(code); };
const ID = /^[A-Za-z0-9_-]{1,100}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const MINUTE = 60_000;
export const MIN_GAP_MS = 120 * MINUTE;
export const MAX_POSTS = 100;
export const MAX_MEDIA_BYTES = 100_000_000;

// Only user-approved public copies on supported hosts are accepted. Never
// fetch arbitrary hosts, private addresses, signed user-info, or plain HTTP.
export function allowedMediaUrl(value) {
  let u;
  try { u = new URL(value); } catch { return false; }
  const host = u.hostname.toLowerCase();
  const allowed = ['drive.google.com', 'docs.google.com', 'drive.usercontent.google.com', 'res.cloudinary.com'].includes(host)
    || host.endsWith('.googleusercontent.com') || host.endsWith('.r2.dev');
  const signedOrExpiring = [...u.searchParams.keys()].some(k => /^(?:x-amz-|x-goog-|sig$|signature$|expires?$|expiry$|token$|policy$|key-pair-id$)/i.test(k));
  return u.protocol === 'https:' && allowed && !isIP(host) && !u.username && !u.password
    && (!u.port || u.port === '443') && !u.hash && !signedOrExpiring;
}

export function wibTime(value) {
  if (typeof value !== 'string') return NaN;
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?\+07:00$/.exec(value);
  if (!m) return NaN;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return NaN;
  const local = new Date(timestamp + 7 * 60 * MINUTE).toISOString().slice(0, 19);
  const expected = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}`;
  return local === expected ? timestamp : NaN;
}

/** Validate a PRIVATE batch. This is a gate, not proof that a human review
 * actually happened; the caller must record truthful QA and disclosure reviews. */
export function validateBatch(batch, now = Date.now()) {
  requireSafe(batch?.schemaVersion === 1 && /^[a-f0-9]{32}$/.test(batch?.nonce ?? ''), 'BAD_BATCH_ID');
  requireSafe(['preflight', 'schedule'].includes(batch.action), 'BAD_ACTION');
  requireSafe(batch.authorization?.scheduleApproved === true, 'SCHEDULING_NOT_AUTHORIZED');
  requireSafe(Array.isArray(batch.videos) && batch.videos.length > 0 && batch.videos.length <= MAX_POSTS, 'BAD_VIDEOS');
  requireSafe(Array.isArray(batch.posts) && batch.posts.length > 0 && batch.posts.length <= MAX_POSTS, 'BAD_POSTS');
  requireSafe(batch.exceptions === undefined || (Array.isArray(batch.exceptions) && batch.exceptions.length === 0), 'TIMING_EXCEPTION_NOT_IMPLEMENTED');
  const videos = new Map();
  for (const video of batch.videos) {
    requireSafe(ID.test(video?.id ?? '') && !videos.has(video.id), 'DUPLICATE_OR_BAD_VIDEO_ID');
    requireSafe(allowedMediaUrl(video.url), 'UNAPPROVED_MEDIA_URL');
    requireSafe(SHA256.test(video.sha256 ?? '') && Number.isSafeInteger(video.sizeBytes)
      && video.sizeBytes >= 1_000 && video.sizeBytes <= MAX_MEDIA_BYTES, 'BAD_MEDIA_FINGERPRINT');
    requireSafe(video.publicCopyApproved === true, 'PUBLIC_COPY_NOT_AUTHORIZED');
    requireSafe(['facts', 'rights', 'technical', 'human'].every(k => video.qa?.[k] === 'PASS'), 'QA_NOT_APPROVED');
    requireSafe(typeof video.aiAssisted === 'boolean', 'AI_ASSISTANCE_UNDECLARED');
    videos.set(video.id, video);
  }
  const ids = new Set();
  const usedVideos = new Set();
  for (const post of batch.posts) {
    requireSafe(ID.test(post?.id ?? '') && !ids.has(post.id), 'DUPLICATE_OR_BAD_POST_ID');
    ids.add(post.id);
    const video = videos.get(post.videoId);
    requireSafe(video, 'UNKNOWN_VIDEO'); usedVideos.add(post.videoId);
    requireSafe(['facebook', 'youtube'].includes(post.platform) && ID.test(post.channelId ?? ''), 'BAD_CHANNEL');
    requireSafe(video.disclosure?.[post.platform] === 'optional', 'DISCLOSURE_REQUIRES_REVIEW');
    const when = wibTime(post.dueAt);
    requireSafe(Number.isFinite(when) && when >= now + 5 * MINUTE, 'BAD_OR_PAST_WIB_TIME');
    requireSafe(typeof post.text === 'string' && post.text.trim().length > 0 && post.text.length <= 5000
      && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(post.text), 'BAD_CAPTION');
    if (post.platform === 'youtube') {
      requireSafe(typeof post.title === 'string' && post.title.trim().length > 0 && post.title.length <= 100
        && !/[<>]/.test(post.title + post.text), 'BAD_YOUTUBE_TEXT');
    }
  }
  requireSafe(usedVideos.size === videos.size, 'UNUSED_VIDEO');
  for (let i = 0; i < batch.posts.length; i++) {
    for (let j = i + 1; j < batch.posts.length; j++) {
      const a = batch.posts[i], b = batch.posts[j];
      requireSafe(Math.abs(wibTime(a.dueAt) - wibTime(b.dueAt)) >= MIN_GAP_MS, 'BATCH_GAP_CONFLICT');
      requireSafe(!(a.channelId === b.channelId && a.text.trim() === b.text.trim()), 'DUPLICATE_BATCH_CAPTION');
    }
  }
  return videos;
}

export function validateChannels(posts, channels) {
  requireSafe(Array.isArray(channels), 'CHANNELS_UNAVAILABLE');
  for (const post of posts) {
    const matches = channels.filter(c => String(c.id ?? c.channelId ?? '') === post.channelId);
    requireSafe(matches.length === 1, 'CHANNEL_NOT_UNIQUE');
    const channel = matches[0];
    requireSafe(String(channel.service ?? channel.channelType ?? channel.type ?? '').toLowerCase() === post.platform, 'CHANNEL_PLATFORM_MISMATCH');
    requireSafe(channel.isDisconnected !== true && channel.isLocked !== true && channel.isQueuePaused !== true, 'CHANNEL_UNAVAILABLE');
  }
}

/** Reject ambiguity rather than silently treating a matching/partial post as
 * safe to create. This includes captions in drafts or errors. */
export function validateQueue(posts, queue) {
  requireSafe(Array.isArray(queue), 'QUEUE_UNAVAILABLE');
  const allowed = new Set(['scheduled', 'sending', 'needs_approval', 'draft', 'error', 'sent']);
  for (const existing of queue) {
    const status = String(existing.status ?? '').toLowerCase();
    requireSafe(allowed.has(status), 'UNKNOWN_EXISTING_STATUS');
    for (const p of posts) {
      if (String(existing.channelId ?? existing.channel?.id ?? '') === p.channelId
        && typeof existing.text === 'string' && existing.text.trim() === p.text.trim()) {
        throw new BatchError('POSSIBLE_EXISTING_DUPLICATE');
      }
    }
    if (!['scheduled', 'sending', 'needs_approval', 'sent'].includes(status)) continue;
    const t = Date.parse(status === 'sent' ? (existing.sentAt ?? existing.dueAt) : existing.dueAt);
    requireSafe(Number.isFinite(t), 'EXISTING_TIME_UNKNOWN');
    for (const p of posts) requireSafe(Math.abs(t - wibTime(p.dueAt)) >= MIN_GAP_MS, 'EXISTING_GAP_CONFLICT');
  }
}

export function buildPayload(post, video) {
  const payload = {
    channelId: post.channelId, schedulingType: 'automatic', mode: 'customScheduled',
    dueAt: new Date(wibTime(post.dueAt)).toISOString(), text: post.text,
    aiAssisted: video.aiAssisted, assets: [{video: {url: video.url}}],
  };
  if (post.platform === 'facebook') payload.metadata = {facebook: {type: 'reel'}};
  else payload.metadata = {youtube: {title: post.title, categoryId: '27', privacy: 'public', madeForKids: false, isAiGenerated: false}};
  return payload;
}

export function checkReadback(post, actual, createdId) {
  requireSafe(actual && String(actual.id ?? '') === String(createdId), 'READBACK_ID_MISMATCH');
  requireSafe(String(actual.status ?? '').toLowerCase() === 'scheduled', 'READBACK_NOT_SCHEDULED');
  requireSafe(String(actual.channelId ?? actual.channel?.id ?? '') === post.channelId, 'READBACK_CHANNEL_MISMATCH');
  requireSafe(Date.parse(actual.dueAt) === wibTime(post.dueAt), 'READBACK_TIME_MISMATCH');
  requireSafe(String(actual.text ?? '').trim() === post.text.trim(), 'READBACK_CAPTION_MISMATCH');
  requireSafe(Array.isArray(actual.assets) && actual.assets.some(a => String(a.type ?? '').toLowerCase() === 'video' && typeof a.source === 'string' && a.source), 'READBACK_VIDEO_MISSING');
  if (post.platform === 'youtube') requireSafe(actual.metadata?.title === post.title, 'READBACK_TITLE_MISMATCH');
  return true;
}

/** A guard for our own cleanup procedures, not a claim that external deletion
 * is impossible. Caller must supply a complete dependency list. */
export function assertSafeToRevoke({allDependenciesKnown, expectedPostIds, observedPosts, retrievedAt}, now = Date.now()) {
  const observedAt = Date.parse(retrievedAt);
  requireSafe(Number.isFinite(observedAt) && observedAt <= now + MINUTE && now - observedAt <= 15 * MINUTE, 'PUBLICATION_STATUS_STALE');
  requireSafe(allDependenciesKnown === true && Array.isArray(expectedPostIds) && expectedPostIds.length > 0, 'DEPENDENCIES_UNKNOWN');
  requireSafe(expectedPostIds.every(x => ID.test(String(x))) && new Set(expectedPostIds).size === expectedPostIds.length, 'BAD_POST_DEPENDENCIES');
  requireSafe(Array.isArray(observedPosts), 'PUBLICATION_STATUS_UNKNOWN');
  for (const id of expectedPostIds) {
    const found = observedPosts.filter(p => String(p.id) === String(id));
    requireSafe(found.length === 1 && String(found[0].status ?? '').toLowerCase() === 'sent'
      && typeof found[0].externalLink === 'string' && /^https:\/\//.test(found[0].externalLink), 'MEDIA_STILL_NEEDED');
  }
  return true;
}

/** All preflights occur before first create. Writes are non-idempotent: on any
 * ambiguous create or failed readback, stop immediately; report partial state. */
export async function runBatch(batch, io, {now = Date.now(), report, persist = () => {}} = {}) {
  const out = report ?? {status: 'INITIALIZING', posts: [], error: null};
  const save = () => persist(out);
  try {
    const videos = validateBatch(batch, now);
    out.posts = batch.posts.map(p => ({clientId: p.id, videoId: p.videoId, platform: p.platform, outcome: 'NOT_ATTEMPTED'}));
    out.status = 'PREFLIGHT_IN_PROGRESS'; save();
    validateChannels(batch.posts, await io.listChannels());
    validateQueue(batch.posts, await io.listPosts());
    for (const video of videos.values()) {
      const platforms = [...new Set(batch.posts.filter(p => p.videoId === video.id).map(p => p.platform))];
      await io.verifyMedia(video, platforms);
    }
    for (const post of batch.posts) await io.dryRun(buildPayload(post, videos.get(post.videoId)));
    out.status = 'PREFLIGHT_PASS'; save();
    if (batch.action === 'preflight') return out;
    for (const post of batch.posts) {
      const record = out.posts.find(p => p.clientId === post.id);
      record.outcome = 'CREATE_IN_PROGRESS'; out.status = 'CREATING'; save();
      let id;
      try { id = await io.createPost(buildPayload(post, videos.get(post.videoId))); }
      catch { record.outcome = 'CREATE_UNCERTAIN'; save(); throw new BatchError('CREATE_UNCERTAIN_RECONCILE'); }
      if (!id || !ID.test(String(id))) { record.outcome = 'CREATE_UNCERTAIN'; save(); throw new BatchError('CREATE_UNCERTAIN_RECONCILE'); }
      record.id = String(id); record.outcome = 'CREATED_NOT_VERIFIED'; save();
      const actual = await io.getPost(id);
      checkReadback(post, actual, id);
      record.outcome = 'SCHEDULED_VERIFIED'; record.status = 'scheduled'; record.dueAt = post.dueAt; save();
    }
    out.status = 'SUBMITTED'; save();
    return out;
  } catch (err) {
    out.status = out.posts?.some(p => ['CREATE_IN_PROGRESS', 'CREATE_UNCERTAIN', 'CREATED_NOT_VERIFIED', 'SCHEDULED_VERIFIED'].includes(p.outcome)) ? 'PARTIAL_OR_UNCERTAIN' : 'STOPPED_BEFORE_CREATION';
    out.error = err instanceof BatchError ? err.code : 'ADAPTER_OR_NETWORK_ERROR'; save();
    throw err;
  }
}
