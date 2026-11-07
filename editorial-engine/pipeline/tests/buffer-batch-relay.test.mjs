import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {saveReport} from '../buffer-batch/decrypt-report.mjs';
import {encryptBytes,gitBlobSha} from '../coverr-transfer/transfer.mjs';
import {validateTrigger,markerFor,extractMarker,openEnvelope} from '../buffer-batch/relay.mjs';

const keypair=crypto.generateKeyPairSync('rsa',{modulusLength:2048,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const nonce='a'.repeat(32), data=Buffer.from(JSON.stringify({nonce,caption:'PRIVATE_EXAMPLE',url:'https://private.invalid/test'}));
const trigger=()=>({schemaVersion:1,nonce,requestSha256:digest(data),ownerPublicKeyB64:Buffer.from(keypair.publicKey).toString('base64'),simulation:true});

test('trigger contains only nonce, digest, mode and a sufficiently strong public key',()=>{
  assert.ok(validateTrigger(trigger()));
  assert.throws(()=>validateTrigger({...trigger(),ownerPublicKeyB64:'bad'}),/BAD_OWNER_PUBLIC_KEY/);
  assert.throws(()=>validateTrigger({...trigger(),requestSha256:'x'}),/BAD_TRIGGER/);
  assert.throws(()=>validateTrigger({...trigger(),simulation:'false'}),/BAD_TRIGGER_MODE/);
});
test('an unreferenced ciphertext blob is authenticated by SHA, RSA-GCM, request hash and nonce',()=>{
  const encrypted=encryptBytes(data,keypair.publicKey),sha=gitBlobSha(encrypted);
  assert.equal(encrypted.includes(Buffer.from('PRIVATE_EXAMPLE')),false);
  assert.equal(openEnvelope(encrypted,sha,trigger(),keypair.privateKey).caption,'PRIVATE_EXAMPLE');
  assert.throws(()=>openEnvelope(encrypted,'b'.repeat(40),trigger(),keypair.privateKey),/BLOB_HASH_MISMATCH/);
  assert.throws(()=>openEnvelope(encrypted,sha,{...trigger(),requestSha256:'b'.repeat(64)},keypair.privateKey),/REQUEST_HASH_MISMATCH/);
  const wrongKey=crypto.generateKeyPairSync('rsa',{modulusLength:2048}).privateKey;
  assert.throws(()=>openEnvelope(encrypted,sha,trigger(),wrongKey),/ENVELOPE_DECRYPT_FAILED/);
  assert.throws(()=>openEnvelope(encrypted,sha,{...trigger(),nonce:'b'.repeat(32)},keypair.privateKey),/REQUEST_NONCE_MISMATCH/);
});
test('signal marker accepts only the matching nonce and a full git blob SHA',()=>{
  const marker=markerFor(nonce,'c'.repeat(40));assert.equal(extractMarker(marker,nonce),'c'.repeat(40));
  assert.equal(extractMarker(marker,'b'.repeat(32)),null);
  assert.equal(extractMarker(marker+' extra',nonce),null);
  assert.equal(extractMarker('prefix '+marker,nonce),null);
  assert.throws(()=>markerFor(nonce,'bad'),/BAD_MARKER/);
});

test('report decryption is private, authenticated, and never overwrites an existing result',()=>{
  const root=fileURLToPath(new URL('../../../',import.meta.url));
  const privateRoot=path.join(root,'editorial-engine/deliverables/buffer-batch/private');
  fs.mkdirSync(privateRoot,{recursive:true,mode:0o700});const dir=fs.mkdtempSync(path.join(privateRoot,'test-report-'));
  try {
    const pub=path.join(dir,'owner-public.pem'),priv=path.join(dir,'owner-private.pem'),annotations=path.join(dir,'annotations.json'),output=path.join(dir,'report.json');
    fs.writeFileSync(pub,keypair.publicKey);fs.writeFileSync(priv,keypair.privateKey,{mode:0o600});
    const run=spawnSync(process.execPath,[path.join(root,'editorial-engine/pipeline/encrypt-diagnostic.mjs'),pub],{input:JSON.stringify({status:'PREFLIGHT_PASS'}),encoding:'utf8'});
    assert.equal(run.status,0);const rows=run.stdout.trim().split('\n').map(line=>{
      const m=/^::notice title=(.*?)::(.*)$/.exec(line);assert.ok(m);return {title:m[1],message:m[2]};
    });
    fs.writeFileSync(annotations,JSON.stringify(rows));assert.equal(saveReport(annotations,priv,output),true);
    assert.equal(JSON.parse(fs.readFileSync(output,'utf8')).status,'PREFLIGHT_PASS');
    assert.throws(()=>saveReport(annotations,priv,output),/EEXIST/);
    assert.throws(()=>saveReport(annotations,priv,path.join(root,'report.json')),/PRIVATE_OUTPUT_REQUIRED/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
