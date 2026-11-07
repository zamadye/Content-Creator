import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {allowedMediaUrl, assertSafeToRevoke, BatchError, buildPayload, checkReadback, runBatch, validateBatch, validateChannels, validateQueue, wibTime} from '../buffer-batch/core.mjs';
import {validateProbe, verifyMedia} from '../buffer-batch/buffer-adapter.mjs';

const now = Date.parse('2026-11-08T00:00:00+07:00');
const sampleVideo = () => ({
  id:'video1', url:'https://res.cloudinary.com/example/video.mp4', sha256:'a'.repeat(64), sizeBytes:10000,
  publicCopyApproved:true, aiAssisted:true, qa:{facts:'PASS',rights:'PASS',technical:'PASS',human:'PASS'},
  disclosure:{facebook:'optional',youtube:'optional'},
});
const batch = () => ({
  schemaVersion:1, nonce:'b'.repeat(32), action:'schedule', authorization:{scheduleApproved:true},
  videos:[sampleVideo()], posts:[
    {id:'post-fb',videoId:'video1',platform:'facebook',channelId:'fb1',dueAt:'2026-11-08T07:30:00+07:00',text:'Fakta menarik dan ikuti knot theory.'},
    {id:'post-yt',videoId:'video1',platform:'youtube',channelId:'yt1',dueAt:'2026-11-08T09:30:00+07:00',title:'Fakta menarik',text:'Fakta menarik dan ikuti knot theory.'},
  ],
});
const channels = [{id:'fb1',service:'facebook'}, {id:'yt1',service:'youtube'}];
function fakeAdapter({queue=[], failCreate=false, badReadback=false}={}) {
  const events = [], payloadById = new Map(); let calls = 0;
  return {events, get calls(){return calls;},
    async listChannels(){events.push('channels');return channels;},
    async listPosts(){events.push('queue');return queue;},
    async verifyMedia(video,platforms){events.push(`media:${video.id}:${platforms.join(',')}`);},
    async dryRun(payload){events.push(`dry:${payload.channelId}`);},
    async createPost(payload){
      calls++; events.push(`create:${payload.channelId}`);
      if (failCreate && calls === 2) throw Error('timeout after potential create');
      const id=`buffer${calls}`; payloadById.set(id,payload); return id;
    },
    async getPost(id){
      events.push(`read:${id}`); const p=payloadById.get(id);
      return {id,status:badReadback?'draft':'scheduled',channelId:p.channelId,text:p.text,dueAt:p.dueAt,
        metadata:{title:p.metadata.youtube?.title},assets:[{type:'video',source:'https://remote.example/video'}]};
    },
  };
}

test('accepts an explicit WIB schedule and validates an exact two-hour boundary',()=>{
  const b=batch();assert.equal(validateBatch(b,now).size,1);
  assert.equal(wibTime('2026-11-08T07:30+07:00'),Date.parse('2026-11-08T00:30:00Z'));
  assert.ok(Number.isNaN(wibTime('2026-02-30T07:30:00+07:00')));
  assert.ok(Number.isNaN(wibTime('2026-11-08T07:30:00Z')));
  b.posts[1].dueAt='2026-11-08T09:29:59+07:00';assert.throws(()=>validateBatch(b,now),/BATCH_GAP_CONFLICT/);
});
test('requires real authorization, QA, per-platform disclosure review and public-copy approval',()=>{
  for (const modify of [
    b=>b.authorization.scheduleApproved=false,
    b=>b.videos[0].publicCopyApproved=false,
    b=>b.videos[0].qa.human='NOT TESTED',
    b=>b.videos[0].qa.rights='UNKNOWN',
    b=>b.videos[0].disclosure.youtube='mandatory',
    b=>delete b.videos[0].aiAssisted,
    b=>b.exceptions=[{ignore:true}],
  ]) {const b=batch();modify(b);assert.throws(()=>validateBatch(b,now),BatchError);}
});
test('fails closed on unknown or unapproved media hosts and URL tricks',()=>{
  assert.ok(allowedMediaUrl('https://drive.google.com/uc?id=example'));
  assert.ok(allowedMediaUrl('https://example.r2.dev/video.mp4'));
  for (const s of ['http://res.cloudinary.com/a','https://res.cloudinary.com@127.0.0.1/a',
    'https://127.0.0.1/a','https://evil.example/a','https://res.cloudinary.com.evil.example/a',
    'https://res.cloudinary.com:444/a','https://res.cloudinary.com/a#secret',
    'https://example.r2.dev/a?X-Amz-Signature=temporary','https://res.cloudinary.com/a?expires=60']) assert.equal(allowedMediaUrl(s),false,s);
});
test('batch supports dozens without moving schedule storage to GitHub',()=>{
  const b=batch(); b.videos=[]; b.posts=[];const start=Date.parse('2026-11-08T07:30:00+07:00');
  for(let i=0;i<60;i++){
    b.videos.push({...sampleVideo(),id:`video${i}`});
    const dueAt=new Date(start+i*120*60_000+7*60*60_000).toISOString().replace('Z','+07:00');
    b.posts.push({id:`post${i}`,videoId:`video${i}`,platform:'facebook',channelId:'fb1',dueAt,text:`Cerita ${i}`});
  }
  assert.equal(validateBatch(b,now).size,60);
  b.posts.push({...b.posts[0],id:'extra',dueAt:'2027-01-01T07:30:00+07:00'});
  assert.throws(()=>validateBatch(b,now),/DUPLICATE_BATCH_CAPTION/);
});
test('requires matching unlocked channels and rejects duplicates, unknown status and nearby posts',()=>{
  const b=batch(); validateChannels(b.posts,channels);validateQueue(b.posts,[]);
  assert.throws(()=>validateChannels(b.posts,[{...channels[0],isLocked:true},channels[1]]),/CHANNEL_UNAVAILABLE/);
  assert.throws(()=>validateChannels(b.posts,[{...channels[0],service:'youtube'},channels[1]]),/CHANNEL_PLATFORM_MISMATCH/);
  assert.throws(()=>validateQueue(b.posts,[{id:'old',status:'draft',channelId:'fb1',text:b.posts[0].text}]),/POSSIBLE_EXISTING_DUPLICATE/);
  assert.throws(()=>validateQueue(b.posts,[{id:'old',status:'scheduled',dueAt:'2026-11-08T06:30:00+07:00'}]),/EXISTING_GAP_CONFLICT/);
  assert.throws(()=>validateQueue(b.posts,[{status:'sent'}]),/EXISTING_TIME_UNKNOWN/);
  assert.throws(()=>validateQueue(b.posts,[{status:'mystery'}]),/UNKNOWN_EXISTING_STATUS/);
  validateQueue(b.posts,[{status:'sent',sentAt:'2026-11-08T05:30:00+07:00'}]);
});
test('payload schedules in Buffer with truthfully declared AI assistance and reviewed optional disclosure',()=>{
  const b=batch(),fb=buildPayload(b.posts[0],b.videos[0]),yt=buildPayload(b.posts[1],b.videos[0]);
  assert.equal(fb.mode,'customScheduled');assert.equal(fb.schedulingType,'automatic');assert.equal(fb.dueAt,'2026-11-08T00:30:00.000Z');
  assert.equal(fb.metadata.facebook.type,'reel');assert.equal(yt.metadata.youtube.isAiGenerated,false);assert.equal(yt.aiAssisted,true);
});
test('preflight-only performs zero creates',async()=>{
  const b=batch();b.action='preflight';const io=fakeAdapter(),report={};
  await runBatch(b,io,{now,report});assert.equal(report.status,'PREFLIGHT_PASS');assert.equal(io.calls,0);
});
test('one mocked batch submits and reads back thirty distinct scheduled posts',async()=>{
  const b=batch();b.videos=[];b.posts=[];const start=Date.parse('2026-11-08T07:30:00+07:00');
  for(let i=0;i<30;i++){
    b.videos.push({...sampleVideo(),id:`video${i}`});
    const dueAt=new Date(start+i*120*60_000+7*60*60_000).toISOString().replace('Z','+07:00');
    b.posts.push({id:`post${i}`,videoId:`video${i}`,platform:'facebook',channelId:'fb1',dueAt,text:`Cerita unik ${i}`});
  }
  const io=fakeAdapter(),report={};await runBatch(b,io,{now,report});
  assert.equal(io.calls,30);assert.equal(report.status,'SUBMITTED');
  assert.equal(report.posts.filter(p=>p.outcome==='SCHEDULED_VERIFIED').length,30);
});
test('all preflights run before the first create; each created post is read back',async()=>{
  const io=fakeAdapter(),report={},snapshots=[];
  await runBatch(batch(),io,{now,report,persist:x=>snapshots.push(structuredClone(x))});
  assert.equal(report.status,'SUBMITTED');assert.equal(io.calls,2);
  assert.ok(io.events.indexOf('dry:yt1') < io.events.indexOf('create:fb1'));
  assert.deepEqual(report.posts.map(x=>x.outcome),['SCHEDULED_VERIFIED','SCHEDULED_VERIFIED']);
  assert.ok(snapshots.some(s=>s.posts.some(p=>p.outcome==='CREATE_IN_PROGRESS')));
});
test('media or queue preflight failure causes no writes',async()=>{
  const io=fakeAdapter();io.verifyMedia=async()=>{throw new BatchError('MEDIA_UNAVAILABLE');};const report={};
  await assert.rejects(runBatch(batch(),io,{now,report}),/MEDIA_UNAVAILABLE/);
  assert.equal(io.calls,0);assert.equal(report.status,'STOPPED_BEFORE_CREATION');
});
test('a newly conflicting queue item stops the remaining batch without another write',async()=>{
  const io=fakeAdapter(),report={};let queueReads=0;
  io.listPosts=async()=>{queueReads++;return queueReads<3?[]:[
    {id:'buffer1',status:'scheduled',channelId:'fb1',text:batch().posts[0].text,dueAt:batch().posts[0].dueAt},
    {id:'external',status:'scheduled',channelId:'different',text:'lain',dueAt:'2026-11-08T09:00:00+07:00'}
  ];};
  await assert.rejects(runBatch(batch(),io,{now,report}),/EXISTING_GAP_CONFLICT/);
  assert.equal(io.calls,1);assert.equal(report.status,'PARTIAL_OR_UNCERTAIN');
  assert.deepEqual(report.posts.map(x=>x.outcome),['SCHEDULED_VERIFIED','NOT_ATTEMPTED']);
});
test('queue rechecks exclude IDs verified earlier in this same batch',async()=>{
  const io=fakeAdapter(),report={};let queueReads=0;
  io.listPosts=async()=>{queueReads++;return queueReads<3?[]:[
    {id:'buffer1',status:'scheduled',channelId:'fb1',text:batch().posts[0].text,dueAt:batch().posts[0].dueAt}
  ];};
  await runBatch(batch(),io,{now,report});assert.equal(io.calls,2);assert.equal(report.status,'SUBMITTED');
});
test('a schedule that becomes too close during preflight never starts a create',async()=>{
  const io=fakeAdapter(),report={};let reads=0;
  const clock=()=>reads++===0?now:Date.parse('2026-11-08T07:26:00+07:00');
  await assert.rejects(runBatch(batch(),io,{clock,report}),/SCHEDULE_WINDOW_EXPIRED/);
  assert.equal(io.calls,0);assert.equal(report.status,'STOPPED_BEFORE_CREATION');
});
test('ambiguous create stops the batch without a retry and preserves earlier ID',async()=>{
  const io=fakeAdapter({failCreate:true}),report={};
  await assert.rejects(runBatch(batch(),io,{now,report}),/CREATE_UNCERTAIN_RECONCILE/);
  assert.equal(io.calls,2);assert.equal(report.status,'PARTIAL_OR_UNCERTAIN');
  assert.deepEqual(report.posts.map(x=>x.outcome),['SCHEDULED_VERIFIED','CREATE_UNCERTAIN']);assert.equal(report.posts[0].id,'buffer1');
});
test('failed readback never reports scheduled success or starts another create',async()=>{
  const io=fakeAdapter({badReadback:true}),report={};
  await assert.rejects(runBatch(batch(),io,{now,report}),/READBACK_NOT_SCHEDULED/);
  assert.equal(io.calls,1);assert.deepEqual(report.posts.map(x=>x.outcome),['CREATED_NOT_VERIFIED','NOT_ATTEMPTED']);
});
test('release guard keeps source available until every known linked post is sent',()=>{
  const good={allDependenciesKnown:true,retrievedAt:new Date(now).toISOString(),expectedPostIds:['abc','def'],observedPosts:[
    {id:'abc',status:'sent',externalLink:'https://youtube.com/shorts/abc'},
    {id:'def',status:'sent',externalLink:'https://facebook.com/reel/def'}]};
  assert.equal(assertSafeToRevoke(good,now),true);
  assert.throws(()=>assertSafeToRevoke({...good,allDependenciesKnown:false},now),/DEPENDENCIES_UNKNOWN/);
  assert.throws(()=>assertSafeToRevoke(good,now+16*60_000),/PUBLICATION_STATUS_STALE/);
  assert.throws(()=>assertSafeToRevoke({...good,observedPosts:good.observedPosts.slice(0,1)},now),/MEDIA_STILL_NEEDED/);
  assert.throws(()=>assertSafeToRevoke({...good,observedPosts:[good.observedPosts[0],{...good.observedPosts[1],status:'scheduled'}]},now),/MEDIA_STILL_NEEDED/);
  assert.throws(()=>assertSafeToRevoke({...good,observedPosts:[good.observedPosts[0],{...good.observedPosts[1],externalLink:''}]},now),/MEDIA_STILL_NEEDED/);
});
test('probe validates full-HD vertical video with audio and Facebook duration',()=>{
  const info={streams:[{codec_type:'video',width:1080,height:1920},{codec_type:'audio'}],format:{duration:'69.0'}};
  assert.equal(validateProbe(info,['facebook','youtube']).duration,69);
  assert.throws(()=>validateProbe({...info,format:{duration:'90.1'}},['facebook']),/FACEBOOK_REEL_TOO_LONG/);
  assert.throws(()=>validateProbe({...info,streams:[{codec_type:'video',width:1080,height:1920}]},['facebook']),/BAD_MEDIA_STREAMS/);
  assert.throws(()=>validateProbe({...info,streams:[{codec_type:'video',width:1920,height:1080},{codec_type:'audio'}]},['youtube']),/BAD_VERTICAL_VIDEO_SIZE/);
});
test('media fetch verifies length and digest, cleans the temporary file, and rejects unsafe redirects',async()=>{
  const bytes=Buffer.alloc(1024,5),video={...sampleVideo(),sizeBytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
  let seenPath;
  const result=await verifyMedia(video,['youtube'],async()=>new Response(bytes,{headers:{'content-type':'video/mp4'}}),(file)=>{seenPath=file;assert.equal(fs.readFileSync(file).length,bytes.length);return {duration:69};});
  assert.equal(result.duration,69);assert.equal(fs.existsSync(seenPath),false);
  await assert.rejects(verifyMedia({...video,sha256:'b'.repeat(64)},['youtube'],async()=>new Response(bytes,{headers:{'content-type':'video/mp4'}}),()=>{}),/MEDIA_HASH_MISMATCH/);
  await assert.rejects(verifyMedia(video,['youtube'],async()=>new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}}),()=>{}),/MEDIA_REDIRECT_BLOCKED/);
});
