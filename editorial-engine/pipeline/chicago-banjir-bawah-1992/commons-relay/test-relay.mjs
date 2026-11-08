import {test} from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
import {SOURCES,OUTPUT_IDS,SPLIT_AT,RelayError,validateBatch,validateDownloadURL,verifyIdentity,validatePointer} from './relay.mjs';
import {encryptBytes,decryptBytes,gitBlobSha} from '../../coverr-transfer/transfer.mjs';
const uri=n=>`https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=test-${n}`;
const ready=()=>({nonce:'a'.repeat(32),run_id:'123',items:OUTPUT_IDS.map((id,i)=>({id,size:2000+i,sha256:'b'.repeat(64)}))});
const good=()=>{const r=ready();return {...r,items:r.items.map((x,i)=>({...x,drive_uri:uri(i)}))}};
test('unique sessions are bound to exact order, run, nonce, size and hash',()=>{
 assert.deepEqual(Object.keys(validateBatch(good(),ready())),OUTPUT_IDS);
 for(const bad of [null,{...good(),nonce:'x'}, {...good(),run_id:'124'}, {...good(),items:good().items.slice(1)}, {...good(),items:good().items.map((v,i)=>({...v,size:i===2?1:v.size}))}, {...good(),items:good().items.map(v=>({...v,drive_uri:uri(1)}))}, {...good(),items:good().items.map((v,i)=>({...v,drive_uri:i===0?'https://www.googleapis.com.evil.example/upload/drive/v3/files?uploadType=resumable&upload_id=x':v.drive_uri}))}])assert.throws(()=>validateBatch(bad,ready()),RelayError);
});
test('only direct HTTPS Wikimedia Commons paths allowed',()=>{
 for(const s of SOURCES)assert.ok(validateDownloadURL(s.url));
 for(const s of ['https://upload.wikimedia.org.evil.example/wikipedia/commons/x','http://upload.wikimedia.org/wikipedia/commons/x','https://user:pass@upload.wikimedia.org/wikipedia/commons/x','https://upload.wikimedia.org/wikipedia/commons/x?redirect=1','https://upload.wikimedia.org/other'])assert.throws(()=>validateDownloadURL(s),RelayError);
});
test('exact original byte size and Commons SHA-1, valid split under 100MiB',()=>{
 for(const s of SOURCES){assert.ok(verifyIdentity(s,s.size,s.sha1));assert.throws(()=>verifyIdentity(s,s.size-1,s.sha1),RelayError);assert.throws(()=>verifyIdentity(s,s.size,'0'.repeat(40)),RelayError);}
 assert.ok(SPLIT_AT < 100*1024*1024);assert.ok(SOURCES[0].size-SPLIT_AT < 100*1024*1024);assert.ok(SOURCES[1].size < 100*1024*1024);
});
test('pointer only accepts current run and ciphertext SHA; envelope authenticates',()=>{
 const r=ready(),p={nonce:r.nonce,run_id:r.run_id,git_blob_sha:'f'.repeat(40)};assert.deepEqual(validatePointer(p,r),p);
 for(const change of [{nonce:'b'.repeat(32)},{run_id:'2'},{git_blob_sha:'../evil'}])assert.throws(()=>validatePointer({...p,...change},r),RelayError);
 const k=crypto.generateKeyPairSync('rsa',{modulusLength:3072});const data=Buffer.from(JSON.stringify(good()));const e=encryptBytes(data,k.publicKey);
 assert.equal(e.includes(Buffer.from('upload_id')),false);assert.deepEqual(decryptBytes(e,k.privateKey),data);assert.match(gitBlobSha(e),/^[a-f0-9]{40}$/);e[e.length-1]^=1;assert.throws(()=>decryptBytes(e,k.privateKey));
});
