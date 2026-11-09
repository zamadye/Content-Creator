import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotReadOnly} from '../buffer-batch/snapshot-readonly.mjs';

const NOW = Date.parse('2026-11-09T12:00:00Z');

test('snapshot uses only read calls and keeps relevant queue times without captions', async () => {
  const calls = [];
  const io = {
    async listChannels() { calls.push('channels'); return [{id: 'c1', name: 'Test', service: 'tiktok', isDisconnected: false}]; },
    async listPosts() { calls.push('queue'); return [
      {id:'p1', channelId:'c1', status:'scheduled', dueAt:'2026-11-11T00:30:00Z', text:'PRIVATE CAPTION'},
      {id:'p2', channelId:'c1', status:'sent', sentAt:'2026-10-01T00:00:00Z'},
      {id:'p3', channelId:'c1', status:'draft', text:'ANOTHER PRIVATE CAPTION'},
      {id:'p4', channelId:'c1', status:'sent', sentAt:'2026-11-09T11:00:00Z'},
    ]; },
    async createPost() { throw new Error('WRITE_FORBIDDEN'); },
  };
  const report = await snapshotReadOnly(io, NOW);
  assert.equal(report.status, 'PASS');
  assert.equal(report.channels[0].service, 'tiktok');
  assert.equal(report.queue.total, 4);
  assert.deepEqual(report.queue.relevant.map(p => p.id), ['p1', 'p4']);
  assert.equal(report.queue.relevantTruncated, false);
  assert.equal(JSON.stringify(report).includes('PRIVATE CAPTION'), false);
  assert.deepEqual(calls, ['channels', 'queue']);
});

test('unknown statuses and sent posts without a valid time are retained', async () => {
  const io = {async listChannels(){return [];}, async listPosts(){return [
    {id:'a', status:'mystery'}, {id:'b', status:'sent'},
  ];}};
  const report = await snapshotReadOnly(io, NOW);
  assert.equal(report.queue.counts.unknown, 1);
  assert.deepEqual(report.queue.relevant.map(p => p.id), ['a', 'b']);
});

test('bounded queue summary explicitly reports truncation', async () => {
  const io = {async listChannels(){return [];}, async listPosts(){return Array.from({length:201}, (_, i) => ({id:String(i), status:'scheduled'}));}};
  const report = await snapshotReadOnly(io, NOW);
  assert.equal(report.queue.relevantTotal, 201);
  assert.equal(report.queue.relevant.length, 200);
  assert.equal(report.queue.relevantTruncated, true);
});

test('snapshot fails closed without leaking arbitrary errors', async () => {
  const io = {async listChannels(){return [];}, async listPosts(){throw Error('SECRET_URL_OR_TOKEN');}};
  const report = await snapshotReadOnly(io, NOW);
  assert.equal(report.status, 'FAIL');
  assert.equal(report.stage, 'QUEUE');
  assert.equal(report.error, 'UNEXPECTED_ERROR');
  assert.equal(JSON.stringify(report).includes('SECRET'), false);
});
