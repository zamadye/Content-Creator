import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { validId, validRepository, cleanText, creatorName, checkCandidate, encryptBytes, decryptBytes, gitBlobSha, classifyTracking, validateSourceProbe, buildTrimArgs, SafeError, MAX_TRANSFER_BYTES } from './transfer.mjs';
const good=()=>({id:'e7tw4gtksn',title:'Woman counting her money',creator:{name:'A Creator'},is_premium:false,is_ai_generated:false,is_vertical:false,duration:35,urls:{mp4_download:'https://storage.coverr.co/a?token=TOP_SECRET'}});
test('id and repo allowlist',()=>{assert.equal(validId('e7tw4gtksn'),true);assert.equal(validId('../bad'),false);assert.equal(validRepository('zamadye/Content-Creator'),true);assert.equal(validRepository('../other'),false);});
test('safe metadata excludes signed URL',()=>{const c=checkCandidate(good(),'e7tw4gtksn','TOP_SECRET');assert.equal(c.creator,'A Creator');assert.equal(cleanText('https://a.test/?token=x','x'),null);assert.equal(cleanText('abc TOP_SECRET','TOP_SECRET'),null);assert.equal(creatorName({creator:'Name'},''),'Name');const {mediaUrl,...safe}=c;assert.ok(mediaUrl.includes('TOP_SECRET'));assert.equal(JSON.stringify(safe).includes('TOP_SECRET'),false);});
test('reject premium, synthetic, vertical or unknown',()=>{for(const f of ['is_premium','is_ai_generated','is_vertical'])for(const x of [true,null,undefined]){const v=good();v[f]=x;assert.throws(()=>checkCandidate(v,v.id),SafeError);}});
test('reject unsafe media domains and id mismatch',()=>{for(const u of ['http://storage.coverr.co/a','https://coverr.co.evil.example/a','https://evil.example/a','https://user:pass@coverr.co/a']){const v=good();v.urls.mp4_download=u;assert.throws(()=>checkCandidate(v,v.id),SafeError);}assert.throws(()=>checkCandidate(good(),'different'),SafeError);});
test('reject bad title and known short content; allow unknown duration for independent ffprobe',()=>{const a=good();a.title='';assert.throws(()=>checkCandidate(a,a.id),SafeError);const b=good();b.duration=3;assert.throws(()=>checkCandidate(b,b.id),SafeError);const c=good();delete c.duration;assert.equal(checkCandidate(c,c.id).id,c.id);});
test('encrypts with authenticity and verifies integrity',()=>{const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});const message=Buffer.from('sample not a real video');const a=encryptBytes(message,publicKey),b=encryptBytes(message,publicKey);assert.notDeepEqual(a,b);assert.deepEqual(decryptBytes(a,privateKey),message);const bad=Buffer.from(a);bad[bad.length-1]^=1;assert.throws(()=>decryptBytes(bad,privateKey));assert.throws(()=>decryptBytes(Buffer.from('bad'),privateKey),SafeError);});
test('caps size and verifies git blob hash',()=>{const {publicKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});assert.throws(()=>encryptBytes(Buffer.alloc(MAX_TRANSFER_BYTES+1),publicKey),SafeError);assert.equal(gitBlobSha(Buffer.from('test content\n')),'d670460b4b4aece5915caf5c68d12f560a9fe3e4');});
test('tracking 404 is explicitly review, not a pass; auth and quota errors fail',()=>{assert.equal(classifyTracking([204]),'PASS');assert.equal(classifyTracking([404,204]),'PASS');assert.equal(classifyTracking([404,404]),'NEEDS_REVIEW');assert.equal(classifyTracking([404,401]),'FAIL');assert.equal(classifyTracking([429]),'FAIL');assert.equal(classifyTracking([]),'FAIL');});
test('native 1080p source requirement rejects upscaling and narrow crops',()=>{
  const source=(width,height,duration='10')=>({streams:[{width,height}],format:{duration}});
  assert.deepEqual(validateSourceProbe(source(1920,1080)),{width:1920,height:1080,duration_seconds:10});
  assert.deepEqual(validateSourceProbe(source(3840,2160)),{width:3840,height:2160,duration_seconds:10});
  for(const [w,h] of [[1280,720],[1920,800],[1280,1080],[1080,1920]])assert.throws(()=>validateSourceProbe(source(w,h)),SafeError);
  assert.throws(()=>validateSourceProbe(source(1920,1080,'6')),SafeError);
  assert.throws(()=>validateSourceProbe({}),SafeError);
});
test('HQ excerpt is six seconds, 1080p, CRF 17 and contains no audio',()=>{
 const args=buildTrimArgs('source.mp4','dest.mp4');
 assert.equal(args[args.indexOf('-t')+1],'6');
 assert.equal(args[args.indexOf('-crf')+1],'17');
 assert.ok(args.includes('-an'));
 assert.ok(args[args.indexOf('-vf')+1].includes('scale=1920:1080'));
});
