import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {validateSession,validateProbe,MEDIA_LIMIT,CHUNK,RelayError} from './direct-drive-relay.mjs';
import {encryptBytes,decryptBytes} from '../coverr-transfer/transfer.mjs';
const ready={nonce:'a'.repeat(32),id:'azy1Cd1ZeQ',run_id:'42',size:9000,sha256:'b'.repeat(64)};
const good=()=>({...ready,drive_uri:'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=FAKE&session_crd=FAKE'});
test('the session is bound to a specific runner, video and exact source hash',()=>{
 assert.equal(validateSession(good(),ready).size,9000);
 for(const change of [{nonce:'c'.repeat(32)},{id:'different'},{run_id:'43'},{size:9001},{size:MEDIA_LIMIT+1},{sha256:'c'.repeat(64)}])assert.throws(()=>validateSession({...good(),...change},ready),RelayError);
});
test('only Google Drive resumable upload URLs are accepted',()=>{
 for(const url of ['http://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=x','https://www.googleapis.com.evil.invalid/upload/drive/v3/files?uploadType=resumable&upload_id=x','https://user:pass@www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=x','https://www.googleapis.com/other?uploadType=resumable&upload_id=x','https://www.googleapis.com/upload/drive/v3/files?uploadType=media&upload_id=x','https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable','https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=x#fragment'])assert.throws(()=>validateSession({...good(),drive_uri:url},ready),RelayError);
});
test('authenticated envelope conceals and protects the test capability',()=>{
 const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});
 const plain=Buffer.from(JSON.stringify(good())),enc=encryptBytes(plain,publicKey);
 assert.equal(enc.includes(Buffer.from('session_crd')),false);assert.deepEqual(decryptBytes(enc,privateKey),plain);
 enc[enc.length-1]^=1;assert.throws(()=>decryptBytes(enc,privateKey));
});
test('source probe must contain real video dimensions and finite duration',()=>{
 const obj={streams:[{codec_type:'audio'},{codec_type:'video',codec_name:'h264',width:1920,height:1080,avg_frame_rate:'30/1'}],format:{duration:'12.5'}};
 assert.deepEqual(validateProbe(obj),{width:1920,height:1080,duration_seconds:12.5,codec:'h264',fps:'30/1'});
 for(const bad of [{},{streams:[{width:0,height:100}],format:{duration:2}},{streams:[{width:200,height:100}],format:{duration:'nan'}}])assert.throws(()=>validateProbe(bad),RelayError);
});
test('Drive chunks have the required 256 KiB alignment and size cap',()=>{
 assert.equal(CHUNK%(256*1024),0);assert.equal(MEDIA_LIMIT,104857600);
});
