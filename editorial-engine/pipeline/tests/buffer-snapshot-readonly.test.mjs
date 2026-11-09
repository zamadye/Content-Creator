import test from 'node:test';
import assert from 'node:assert/strict';
import {snapshotReadOnly} from '../buffer-batch/snapshot-readonly.mjs';
import {probeReadbackFields} from '../buffer-batch/probe-readback-readonly.mjs';

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

test('readback probe checks only query shape and reports absent channels separately', async () => {
  const calls=[];
  const io={
    async listChannels(){calls.push('channels');return [{id:'fb',service:'facebook'},{id:'yt',service:'youtube'}];},
    async listPosts(){calls.push('queue');return [{id:'f',channelId:'fb'},{id:'y',channelId:'yt'}];},
    async getPost(id){calls.push('get');return {id,schedulingType:'automatic',shareMode:'customScheduled',isCustomScheduled:true,
      metadata:{isAiGenerated:false},text:'PRIVATE CAPTION',assets:[{source:'PRIVATE URL'}]};},
    async createPost(){throw Error('WRITE_FORBIDDEN');},
  };
  const report=await probeReadbackFields(io);
  assert.equal(report.status,'PASS');assert.equal(report.services.facebook.status,'PASS');
  assert.equal(report.services.youtube.status,'PASS');assert.equal(report.services.tiktok.status,'SKIP_NO_CHANNEL');
  assert.equal(JSON.stringify(report).includes('PRIVATE'),false);
  assert.deepEqual(calls,['channels','queue','get','get']);
});

test('readback probe fails safely if a required field is missing',async()=>{
  const io={async listChannels(){return [{id:'yt',service:'youtube'}];},async listPosts(){return [{id:'p',channelId:'yt'}];},
    async getPost(){return {id:'p',schedulingType:'automatic',shareMode:'customScheduled',isCustomScheduled:true,metadata:{}};}};
  const report=await probeReadbackFields(io);assert.equal(report.status,'FAIL');assert.equal(report.error,'READBACK_PROBE_FIELDS_MISSING');
});
