import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {validateHost,validateRequest,validateSecret,checkUploadStatus,RelayError} from './relay-upload.mjs';
import {encryptBytes,decryptBytes} from '../coverr-transfer/transfer.mjs';
const goodHost='https://8765-test-sandbox-123.e2b.app';
const owner=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const owner_public_key_b64=Buffer.from(owner.publicKey).toString('base64');
const goodSecret=()=>({bearer:'a'.repeat(64),size:8388609,sha256:'b'.repeat(64),drive_uri:'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=fake-id&session_crd=fake-value'});
test('preview host is HTTPS, fixed e2b domain and unprivileged port',()=>{
 assert.equal(validateHost(goodHost),goodHost);
 for(const bad of ['http://8765-test.e2b.app','https://8765-test.e2b.app.evil.example','https://user:pass@8765-test.e2b.app','https://99999-test.e2b.app','https://80-test.e2b.app','https://8765-test.e2b.app/media','https://google.com'])assert.throws(()=>validateHost(bad),RelayError);
});
test('request allows only known mode and fixed-format nonce',()=>{
 assert.equal(validateRequest({host:goodHost,nonce:'a'.repeat(32),mode:'test',owner_public_key_b64}).mode,'test');
 for(const bad of [{host:goodHost,nonce:'../x',mode:'test',owner_public_key_b64},{host:goodHost,nonce:'a'.repeat(32),mode:'other',owner_public_key_b64},{host:goodHost,nonce:'a'.repeat(32),mode:'test',owner_public_key_b64:'bad'}])assert.throws(()=>validateRequest(bad),RelayError);
});
test('Drive one-time capability is restricted to expected Google upload endpoint',()=>{
 assert.equal(validateSecret(goodSecret()).size,8388609);
 for(const u of ['https://www.googleapis.com.evil.example/upload/drive/v3/files?uploadType=resumable&upload_id=x','http://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=x','https://www.googleapis.com/other?uploadType=resumable&upload_id=x','https://www.googleapis.com/upload/drive/v3/files?uploadType=media&upload_id=x','https://user:pass@www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=x'])assert.throws(()=>validateSecret({...goodSecret(),drive_uri:u}),RelayError);
 for(const change of [{bearer:'x'},{size:0},{size:2**40},{sha256:'bad'}])assert.throws(()=>validateSecret({...goodSecret(),...change}),RelayError);
});
test('resumable status checks active then final, not HTTP code',()=>{
 assert.equal(checkUploadStatus('active',false),true);assert.equal(checkUploadStatus('final',true),true);
 for(const [s,last] of [['active',true],['final',false],[null,true],['cancelled',false]])assert.throws(()=>checkUploadStatus(s,last),RelayError);
});
test('envelope encrypts and authenticates test-only session capabilities',()=>{
 const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072});const plain=Buffer.from(JSON.stringify(goodSecret()));
 const ciphertext=encryptBytes(plain,publicKey);assert.equal(ciphertext.includes(Buffer.from('session_crd')),false);
 assert.deepEqual(decryptBytes(ciphertext,privateKey),plain);
 ciphertext[ciphertext.length-1]^=1;assert.throws(()=>decryptBytes(ciphertext,privateKey));
});
