import test from 'node:test';
import assert from 'node:assert/strict';
import {validateZernioRequest, prepare} from '../zernio/prepare.mjs';
import {BatchError} from '../buffer-batch/core.mjs';
import {runZernio} from '../zernio/runner.mjs';

const base = () => ({
  action: 'post',
  authorization: {postApproved: true},
  video: {url: 'https://drive.google.com/uc?export=download&id=abc', sha256: 'a'.repeat(64), sizeBytes: 1419182},
  platform: 'facebook',
  accountId: '6af3c1617516a62f54776770',
  content: 'Uji semat link afiliasi.',
  firstComment: 'Tautan afiliasi Shopee: https://s.shopee.co.id/8fTqbvPbWL',
  publishNow: true,
});

test('zernio request: valid body passes', () => {
  validateZernioRequest(base());
});

test('zernio request: reject bad action, platform, hash, url, salt, publish flag', () => {
  const bad = (mut) => {
    const r = base(); mut(r);
    assert.throws(() => validateZernioRequest(r), BatchError);
  };
  bad(r => { r.action = 'schedule'; });
  bad(r => { r.platform = 'youtube'; });
  bad(r => { r.video.sha256 = 'zz'; });
  bad(r => { r.video.url = 'http://evil.example/x.mp4'; });
  bad(r => { r.nonce = 'abc'; });
  bad(r => { r.publishNow = false; });
  bad(r => { r.accountId = ''; });
  bad(r => { r.content = '   '; });
  bad(r => { r.firstComment = 'x'.repeat(2001); });
  bad(r => { delete r.authorization.postApproved; });
});

import crypto from 'node:crypto';
const buf1000 = Buffer.alloc(1000);
const sha1000 = crypto.createHash('sha256').update(buf1000).digest('hex');

const mkFetcher = (r, postStatus, body) => {
  let calls = 0;
  return async () => {
    calls += 1;
    if (calls === 1) return {ok: true, status: 200, headers: new Map([['content-length', String(r.video.sizeBytes)]]),
      arrayBuffer: async () => (r.video.sha256 === sha1000 ? buf1000.buffer.slice(0, 1000) : new ArrayBuffer(r.video.sizeBytes)),
      text: async () => ''};
    return {ok: postStatus < 400, status: postStatus, headers: new Map(),
      arrayBuffer: async () => new ArrayBuffer(0), text: async () => JSON.stringify(body)};
  };
};

test('zernio run: sealed request with nonce/_requestSalt validates (stripped before schema)', async () => {
  const r = base();
  r.nonce = 'a'.repeat(32);
  r._requestSalt = 'b'.repeat(64);
  r.video.sha256 = sha1000; r.video.sizeBytes = 1000;
  const body = {post: {_id: 'x9', platforms: [{status: 'published', platformPostUrl: 'https://fb.example/9'}]}};
  const report = {posts: [], status: 'INITIALIZING'};
  const out = await runZernio(r, 'key', {report, persist: () => {}, fetcher: mkFetcher(r, 201, body)});
  assert.equal(out.status, 'SUBMITTED');
  assert.equal(out.idempotencyKey, 'a'.repeat(32));
});

test('zernio run: hash mismatch stops before creation', async () => {
  const r = base();
  const report = {posts: [], status: 'INITIALIZING'};
  const out = await runZernio(r, 'key', {report, persist: () => {}, fetcher: mkFetcher(r, 200, {})});
  assert.equal(out.status, 'STOPPED_BEFORE_CREATION');
  assert.equal(out.error, 'MEDIA_HASH_MISMATCH');
  assert.equal(out.posts.length, 0);
});

test('zernio run: matching bytes and 201 submit succeeded', async () => {
  const r = base();
  r.video.sha256 = sha1000;
  r.video.sizeBytes = 1000;
  const body = {post: {_id: 'x1', platforms: [{status: 'published', platformPostUrl: 'https://fb.example/1'}]}};
  const report = {posts: [], status: 'INITIALIZING'};
  const out = await runZernio(r, 'key', {report, persist: () => {}, fetcher: mkFetcher(r, 201, body)});
  assert.equal(out.status, 'SUBMITTED');
  assert.equal(out.posts[0].outcome, 'SUCCEEDED');
  assert.equal(out.posts[0].platformPostUrl, 'https://fb.example/1');
  assert.equal(out.posts[0].id, 'x1');
});

test('zernio run: 4xx stops, 5xx uncertain', async () => {
  const r = base();
  r.video.sha256 = sha1000; r.video.sizeBytes = 1000;
  const reportA = {posts: [], status: 'I'};
  const a = await runZernio(r, 'key', {report: reportA, persist: () => {}, fetcher: mkFetcher(r, 403, {error: 'nope'})});
  assert.equal(a.status, 'STOPPED_BEFORE_CREATION');
  assert.equal(a.error, 'ZERNIO_HTTP_403');
  const reportB = {posts: [], status: 'I'};
  const b = await runZernio(r, 'key', {report: reportB, persist: () => {}, fetcher: mkFetcher(r, 503, {error: 'nope'})});
  assert.equal(b.status, 'PARTIAL_OR_UNCERTAIN');
});
