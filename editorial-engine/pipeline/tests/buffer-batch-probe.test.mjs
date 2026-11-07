import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectAdapter} from '../buffer-batch/probe-readonly.mjs';

test('read-only probe reads channels, all queue entries, and one post without a write',async()=>{
  const calls=[],io={
    async listChannels(){calls.push('channels');return [{id:'c1',service:'youtube'}];},
    async listPosts(){calls.push('queue');return [{id:'p1',status:'sent',sentAt:'2026-11-01T00:00:00Z'}];},
    async getPost(id){calls.push('post');return {id,status:'sent'};},
    async createPost(){throw Error('WRITE_NOT_ALLOWED');},
  };
  const r=await inspectAdapter(io);assert.equal(r.status,'PASS');assert.equal(r.checks.queueSafety,'PASS');
  assert.equal(r.checks.getPost,'PASS');assert.equal(r.counts.posts,1);assert.deepEqual(calls,['channels','queue','post']);
  assert.equal(JSON.stringify(r).includes('p1'),false);
});
test('read-only probe fails closed and does not leak arbitrary error text',async()=>{
  const io={async listChannels(){return [];},async listPosts(){throw Error('SENSITIVE_URL_OR_TOKEN');}};
  const r=await inspectAdapter(io);assert.equal(r.status,'FAIL');assert.equal(r.stage,'QUEUE');
  assert.equal(r.error,'UNEXPECTED_ERROR');assert.equal(JSON.stringify(r).includes('SENSITIVE'),false);
});
test('read-only probe reports invalid queue status and safely skips empty get',async()=>{
  const empty={async listChannels(){return [];},async listPosts(){return [];}};
  assert.equal((await inspectAdapter(empty)).checks.getPost,'SKIP_NO_POSTS');
  const bad={async listChannels(){return [];},async listPosts(){return [{id:'x',status:'mystery'}];}};
  const r=await inspectAdapter(bad);assert.equal(r.status,'FAIL');assert.equal(r.stage,'QUEUE_SAFETY');assert.equal(r.error,'UNKNOWN_EXISTING_STATUS');
});
