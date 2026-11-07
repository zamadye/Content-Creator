import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {validateRequest,validateSecret,selectChannels,inspectQueue,payload,recordCreated} from './runner.mjs';
const key=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}).publicKey;
const at='2026-11-07T19:00:00+07:00';const now=Date.parse('2026-11-07T16:00:00+07:00');
const request={mission:'shark-forest-2026-11-07-1900',schemaVersion:1,action:'preflight',dueAt:at,media:{sha256:'f'.repeat(64),sizeBytes:100000,durationSeconds:87.47},nonce:'a'.repeat(32),approvals:{schedule1900BothChannels:true,exceptionForTitikButa20AndBothChannels:true,temporaryPublicCopy:true},owner_public_key_b64:Buffer.from(key).toString('base64')};
const posts=[{platform:'youtube',title:'Hiu sebelum pohon?',text:'Fosil hiu dan hutan. ikuti knot theory'}, {platform:'facebook',text:'Fosil dan sejarah. ikuti knot theory'}];
const secret={nonce:request.nonce,mediaId:'testId1234567890',posts};const channels={facebook:{id:'fb'},youtube:{id:'yt'}};
test('enforces exact target, future cutoff, media fingerprint and explicit sharing exception',()=>{
 assert.ok(validateRequest(request,now));assert.throws(()=>validateRequest({...request,approvals:{...request.approvals,temporaryPublicCopy:false}},now));
 assert.throws(()=>validateRequest({...request,dueAt:'2026-11-07T20:00:00+07:00'},now));assert.throws(()=>validateRequest(request,Date.parse('2026-11-07T18:56:00+07:00')));assert.throws(()=>validateRequest({...request,media:{sha256:'x',sizeBytes:100}},now));assert.throws(()=>validateRequest({...request,media:{...request.media,durationSeconds:91}},now));
 assert.ok(validateRequest({...request,action:'inspect'},Date.parse('2026-11-08T00:00:00+07:00')));
});
test('requires approved platforms, nonempty captions and lowercase CTA',()=>{
 assert.equal(validateSecret(secret,request),secret);assert.throws(()=>validateSecret({...secret,posts:[posts[0],posts[0]]},request));assert.throws(()=>validateSecret({...secret,posts:[posts[0],{...posts[1],text:'ikuti KNOT'}]},request));
});
test('resolves two distinct channels and rejects disconnected channels',()=>{
 assert.deepEqual(selectChannels([{id:'fb',name:'FACEBOOK REELS',service:'facebook'},{id:'yt',name:'Knot Theory',service:'youtube'}]),{facebook:{id:'fb',name:'FACEBOOK REELS'},youtube:{id:'yt',name:'Knot Theory'}});assert.throws(()=>selectChannels([{id:'fb',service:'facebook',isDisconnected:true},{id:'yt',service:'youtube'}]));
});
test('only known Titik Buta YT is exempt from two-hour rule',()=>{
 const known={id:'6aedcadaf6d00f3472b03ee4',status:'scheduled',dueAt:'2026-11-07T20:00:00+07:00'};
 assert.equal(inspectQueue([known],posts,channels).collisions.length,0);assert.equal(inspectQueue([known,{...known,id:'other'}],posts,channels).collisions.length,1);assert.equal(inspectQueue([{id:'unknown',status:'sent'}],posts,channels).unknownTimes.length,1);
 assert.equal(inspectQueue([{id:'boundary',status:'scheduled',dueAt:'2026-11-07T21:00:00+07:00'}],posts,channels).collisions.length,0);
});
test('recognizes exact matching scheduled post and refuses different target or status',()=>{
 const prior={id:'existing',status:'scheduled',channelId:'yt',text:posts[0].text,dueAt:at};assert.equal(inspectQueue([prior],posts,channels).mine.youtube.id,'existing');assert.throws(()=>inspectQueue([{...prior,dueAt:'2026-11-07T20:00:00+07:00'}],posts,channels));assert.throws(()=>inspectQueue([{...prior,status:'error'}],posts,channels));
});
test('records the returned id before verification',()=>{const r={posts:[{platform:'youtube',outcome:'CREATE_IN_PROGRESS'}]};recordCreated(r,'youtube','abc123');assert.deepEqual(r.posts[0],{platform:'youtube',outcome:'CREATED_NOT_VERIFIED',id:'abc123'});});
test('customScheduled payload fixes target, FB reel and YouTube public metadata',()=>{
 const yt=payload(secret,posts[0],'yt','https://drive.google.com/video');assert.equal(yt.mode,'customScheduled');assert.equal(yt.dueAt,at);assert.equal(yt.metadata.youtube.privacy,'public');assert.equal(yt.metadata.youtube.isAiGenerated,true);const fb=payload(secret,posts[1],'fb','https://drive.google.com/video');assert.equal(fb.metadata.facebook.type,'reel');assert.equal(fb.dueAt,at);
});
