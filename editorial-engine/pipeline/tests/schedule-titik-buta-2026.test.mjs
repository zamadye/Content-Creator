import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {validateRequest, buildPayload, selectChannels, inspectQueue, verifyMedia} from '../schedule-titik-buta-2026.mjs';

const sha='a468fe300f7e898e8787e44eecbde9e983fede183cb1b269ac46395e77b4714d';
const req={schemaVersion:1,mission:'titik-buta-2026',action:'preflight',media:{url:'https://drive.google.com/uc?export=download&id=offline-test-only',sha256:sha,sizeBytes:9062523},posts:[
  {platform:'facebook',dueAt:'2026-11-07T15:00:00+07:00',text:'Facebook test'},
  {platform:'youtube',dueAt:'2026-11-07T20:00:00+07:00',title:'Youtube title',text:'Youtube test'},
]};
const now=Date.parse('2026-11-06T12:00:00Z');
const originalChannels=[{id:'fb-offline',name:'FACEBOOK REELS',service:'facebook'}, {id:'yt-offline',name:'Knot Theory',service:'youtube'}];
const channels=selectChannels(originalChannels);
const clone=()=>structuredClone(req);

test('only approved mission, hashes, date and platforms accepted',()=>{
  assert.equal(validateRequest(req,now),true);
  const bad=clone();bad.media.sha256='bad';assert.throws(()=>validateRequest(bad,now),/checksum/);
  const badTime=clone();badTime.posts[1].dueAt='2026-11-07T19:00:00+07:00';assert.throws(()=>validateRequest(badTime,now),/Unapproved publication time/);
  const badHost=clone();badHost.media.url='https://example.org/no.mp4';assert.throws(()=>validateRequest(badHost,now),/Media host/);
  const badPlatform=clone();badPlatform.posts[1].platform='instagram';assert.throws(()=>validateRequest(badPlatform,now),/Unapproved platform/);
  const tooLate=Date.parse('2026-11-07T08:56:00Z');assert.throws(()=>validateRequest(req,tooLate),/future/);
});

test('payloads are platform-specific, with no unsupported thumbnail and with AI disclosure',()=>{
  const fb=buildPayload(req,req.posts[0],channels.facebook.id);
  const yt=buildPayload(req,req.posts[1],channels.youtube.id);
  assert.deepEqual(fb.metadata,{facebook:{type:'reel'}});assert.equal(fb.schedulingType,'automatic');
  assert.equal(yt.metadata.youtube.title,'Youtube title');assert.equal(yt.metadata.youtube.isAiGenerated,true);
  assert.equal(yt.aiAssisted,true);assert.equal(yt.assets[0].video.url,req.media.url);
  assert.equal(yt.assets[0].video.metadata,undefined);
});

test('no ambiguous, disconnected or mismatched channels',()=>{
  assert.equal(channels.facebook.id,'fb-offline');
  assert.throws(()=>selectChannels(originalChannels.filter(x=>x.service!=='youtube')),/unique youtube/);
  assert.throws(()=>selectChannels([{...originalChannels[0],isDisconnected:true},originalChannels[1]]),/disconnected/);
  assert.throws(()=>selectChannels([...originalChannels,{id:'fb2',name:'Other',service:'facebook'},{id:'fb3',name:'Other',service:'facebook'},{...originalChannels[0],id:'fb4'}]),/unique facebook/);
});

test('detect collisions cross-platform and allow precisely two-hour gap',()=>{
  const unrelated={id:'other-offline',channelId:'other',status:'scheduled',dueAt:'2026-11-07T16:59:59+07:00',text:'other'};
  const collision=inspectQueue([unrelated],req.posts,channels);assert.equal(collision.collisions.length,1);
  const twoHours={...unrelated,dueAt:'2026-11-07T17:00:00+07:00'};
  assert.equal(inspectQueue([twoHours],req.posts,channels).collisions.length,0);
  assert.equal(inspectQueue([{...unrelated,status:'needs_approval'}],req.posts,channels).collisions.length,1);
  assert.throws(()=>inspectQueue([{...unrelated,dueAt:null}],req.posts,channels),/no usable publication time/);
  assert.throws(()=>inspectQueue([{...unrelated,status:'unrecognized'}],req.posts,channels),/Unknown Buffer post state/);
});

test('matching posts are reused only when status and time are verified',()=>{
  const p={id:'existing-offline',channelId:channels.facebook.id,status:'scheduled',dueAt:req.posts[0].dueAt,text:req.posts[0].text};
  assert.equal(inspectQueue([p],req.posts,channels).mine.facebook.id,p.id);
  assert.throws(()=>inspectQueue([{...p,status:'draft'}],req.posts,channels),/different status/);
  assert.throws(()=>inspectQueue([p,{...p,id:'second-offline'}],req.posts,channels),/More than one matching/);
});

const localVideo=fileURLToPath(new URL('../../deliverables/B_titik-buta-2026_1080x1920.mp4',import.meta.url));
test('public media verifier accepts approved bytes, rejects HTML or altered bytes', {skip:!fs.existsSync(localVideo)}, async()=>{
  const bytes=fs.readFileSync(localVideo);
  const good=async()=>new Response(bytes,{status:200,headers:{'content-type':'video/mp4'}});
  assert.equal((await verifyMedia(req.media,good)).status,'PASS');
  const html=async()=>new Response('login required',{status:200,headers:{'content-type':'text/html'}});
  await assert.rejects(()=>verifyMedia(req.media,html),/not a direct video/);
  const changed=Buffer.from(bytes);changed[128]^=1;
  const corrupt=async()=>new Response(changed,{status:200,headers:{'content-type':'video/mp4'}});
  await assert.rejects(()=>verifyMedia(req.media,corrupt),/checksum/);
});
