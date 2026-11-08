import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {IDS,validateBatchSecret} from './private-relay.mjs';
import {encryptBytes,decryptBytes} from '../coverr-transfer/transfer.mjs';
import {MEDIA_LIMIT} from '../coverr-rupert/direct-drive-relay.mjs';
const ready={nonce:'a'.repeat(32),run_id:'42',items:IDS.map((id,i)=>({id,size:10000+i,sha256:String(i+1).repeat(64)}))};
const secret=()=>({nonce:ready.nonce,run_id:ready.run_id,items:ready.items.map((v,i)=>({...v,drive_uri:`https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=FAKE${i}`}))});
test('only the exact four approved IDs, their order, sizes and hashes are accepted',()=>{
 assert.equal(validateBatchSecret(secret(),ready).length,4);
 for(const mutate of [x=>x.items.pop(),x=>x.items.reverse(),x=>x.items[0].id='azy1Cd1ZeQ',x=>x.items[0].size++,x=>x.items[0].sha256='f'.repeat(64),x=>x.run_id='43',x=>x.nonce='b'.repeat(32)]){
  const s=secret();mutate(s);assert.throws(()=>validateBatchSecret(s,ready));
 }
});
test('each Drive upload capability is unique, Google-only and metadata-bound',()=>{
 for(const mutate of [x=>x.items[1].drive_uri=x.items[0].drive_uri,x=>x.items[0].drive_uri='https://evil.invalid/upload/drive/v3/files?uploadType=resumable&upload_id=x',x=>x.items[0].drive_uri='https://www.googleapis.com/upload/drive/v3/files?uploadType=media&upload_id=x']){
  const s=secret();mutate(s);assert.throws(()=>validateBatchSecret(s,ready));
 }
 const r=structuredClone(ready),s=secret();r.items[0].size=MEDIA_LIMIT+1;s.items[0].size=r.items[0].size;assert.throws(()=>validateBatchSecret(s,r));
});
test('the combined secret is authenticated and does not reveal capabilities',()=>{
 const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:2048});const plain=Buffer.from(JSON.stringify(secret()));
 const c=encryptBytes(plain,publicKey);assert.equal(c.includes(Buffer.from('upload_id')),false);assert.deepEqual(decryptBytes(c,privateKey),plain);
 c[c.length-1]^=1;assert.throws(()=>decryptBytes(c,privateKey));
});
