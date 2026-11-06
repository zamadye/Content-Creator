import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {validateRequest,validateSecret,checkUploadStatus,RelayError,CHUNK} from './relay-upload.mjs';
import {encryptBytes,decryptBytes,gitBlobSha} from '../coverr-transfer/transfer.mjs';
const owner=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const owner_public_key_b64=Buffer.from(owner.publicKey).toString('base64');
const goodSecret=()=>({size:CHUNK+1,sha256:'b'.repeat(64),drive_uri:'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=fake-id&session_crd=fake-value',chunks:[{git_sha:'a'.repeat(40),size:CHUNK},{git_sha:'b'.repeat(40),size:1}]});
test('request allows only known mode, fixed nonce and RSA owner public key',()=>{
 assert.equal(validateRequest({nonce:'a'.repeat(32),mode:'test',owner_public_key_b64}).mode,'test');
 for(const bad of [{nonce:'../x',mode:'test',owner_public_key_b64},{nonce:'a'.repeat(32),mode:'other',owner_public_key_b64},{nonce:'a'.repeat(32),mode:'test',owner_public_key_b64:'bad'}])assert.throws(()=>validateRequest(bad),RelayError);
});
test('Drive URI is restricted to expected Google resumable endpoint',()=>{
 assert.equal(validateSecret(goodSecret()).size,CHUNK+1);
 for(const u of ['https://www.googleapis.com.evil.example/upload/drive/v3/files?uploadType=resumable&upload_id=x','http://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=x','https://www.googleapis.com/other?uploadType=resumable&upload_id=x','https://www.googleapis.com/upload/drive/v3/files?uploadType=media&upload_id=x','https://user:pass@www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=x'])assert.throws(()=>validateSecret({...goodSecret(),drive_uri:u}),RelayError);
 for(const change of [{size:0},{size:2**40},{sha256:'bad'},{chunks:[]}])assert.throws(()=>validateSecret({...goodSecret(),...change}),RelayError);
});
test('chunk lengths, SHA identifiers and total are constrained',()=>{
 const a=goodSecret();a.chunks[0].size=1;assert.throws(()=>validateSecret(a),RelayError);
 const b=goodSecret();b.chunks[1].git_sha='../bad';assert.throws(()=>validateSecret(b),RelayError);
 const c=goodSecret();c.size=9;assert.throws(()=>validateSecret(c),RelayError);
});
test('resumable status checks active then final, not HTTP code',()=>{
 assert.equal(checkUploadStatus('active',false),true);assert.equal(checkUploadStatus('final',true),true);
 for(const [s,last] of [['active',true],['final',false],[null,true],['cancelled',false]])assert.throws(()=>checkUploadStatus(s,last),RelayError);
});
test('envelope encrypts and authenticates test-only capabilities and chunks',()=>{
 const {publicKey,privateKey}=crypto.generateKeyPairSync('rsa',{modulusLength:3072});const plain=Buffer.from(JSON.stringify(goodSecret()));
 const ciphertext=encryptBytes(plain,publicKey);assert.equal(ciphertext.includes(Buffer.from('session_crd')),false);
 assert.deepEqual(decryptBytes(ciphertext,privateKey),plain);assert.match(gitBlobSha(ciphertext),/^[a-f0-9]{40}$/);
 ciphertext[ciphertext.length-1]^=1;assert.throws(()=>decryptBytes(ciphertext,privateKey));
});
