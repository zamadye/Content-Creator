import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {validateRequest,validateSecret,selectChannels,inspectQueue,payload} from './runner.mjs';
const key=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}}).publicKey;
const request={mission:'antartika-rev2-now-2026-11-07',schemaVersion:1,action:'preflight',nonce:'a'.repeat(32),approvals:{publishAntartikaNowFbYoutube:true,exceptionForTitikButa15AndBothChannels:true},owner_public_key_b64:Buffer.from(key).toString('base64')};
const posts=[{platform:'youtube',title:'Antartika Itu Gurun? #Shorts',text:'Es dan gurun. ikuti knot theory'}, {platform:'facebook',text:'Antartika dingin. ikuti knot theory'}];
const secret={nonce:request.nonce,mediaId:'testId1234567890',posts};
const channels={facebook:{id:'fb'},youtube:{id:'yt'}};
test('requires mission, key and explicit narrow exception',()=>{assert.ok(validateRequest(request));assert.throws(()=>validateRequest({...request,approvals:{}}));assert.throws(()=>validateRequest({...request,action:'send-anything'}));});
test('requires two distinct approved platforms and lowercase CTA',()=>{assert.equal(validateSecret(secret,request),secret);assert.throws(()=>validateSecret({...secret,posts:[posts[0],posts[0]]},request));assert.throws(()=>validateSecret({...secret,posts:[posts[0],{...posts[1],text:'ikuti KNOT'}]},request));});
test('resolves configured fb and youtube channels uniquely',()=>{assert.deepEqual(selectChannels([{id:'fb',name:'FACEBOOK REELS',service:'facebook'},{id:'yt',name:'Knot Theory',service:'youtube'}]),{facebook:{id:'fb',name:'FACEBOOK REELS'},youtube:{id:'yt',name:'Knot Theory'}});assert.throws(()=>selectChannels([{id:'x',service:'facebook'}]));});
test('allows only the known Titik Buta exception and detects other collisions and unknown dates',()=>{
 const now=Date.parse('2026-11-07T15:30:00+07:00');
 const known={id:'6aedcad71fcdcefa468d7cfd',status:'sent',sentAt:'2026-11-07T15:00:00+07:00'};
 assert.equal(inspectQueue([known],posts,channels,now).collisions.length,0);
 const other={id:'other',status:'scheduled',dueAt:'2026-11-07T16:00:00+07:00'};
 assert.equal(inspectQueue([known,other],posts,channels,now).collisions.length,1);
 assert.equal(inspectQueue([{id:'unknown',status:'sent'}],posts,channels,now).unknownTimes.length,1);
});
test('existing matching post is never created again',()=>{
 const prior={id:'existing',status:'sending',channelId:'yt',text:posts[0].text,dueAt:'2026-11-07T15:30:00+07:00'};
 assert.equal(inspectQueue([prior],posts,channels,Date.parse('2026-11-07T15:30:00+07:00')).mine.youtube.id,'existing');
 assert.throws(()=>inspectQueue([{...prior,status:'error'}],posts,channels));
});
test('shareNow and FB reel/YouTube public metadata are explicit',()=>{
 const yt=payload(secret,posts[0],'yt','https://drive.google.com/video');assert.equal(yt.mode,'shareNow');assert.equal(yt.metadata.youtube.privacy,'public');assert.equal(yt.metadata.youtube.isAiGenerated,true);assert.equal(yt.dueAt,undefined);
 const fb=payload(secret,posts[1],'fb','https://drive.google.com/video');assert.equal(fb.metadata.facebook.type,'reel');
});
