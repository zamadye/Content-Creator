import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {encrypt,decrypt} from './cipher.mjs';
test('streaming AEAD round-trip, tamper rejection and no plaintext in ciphertext',async()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'coverr-cipher-test-'));try{
  const keys=crypto.generateKeyPairSync('rsa',{modulusLength:2048});const raw=Buffer.from('Synthetic diagnostic only; no media.');fs.writeFileSync(path.join(d,'in'),raw);
  await encrypt(path.join(d,'in'),path.join(d,'box'),keys.publicKey);const box=fs.readFileSync(path.join(d,'box'));assert.equal(box.includes(raw),false);
  await decrypt(path.join(d,'box'),path.join(d,'out'),keys.privateKey);assert.deepEqual(fs.readFileSync(path.join(d,'out')),raw);
  box[box.length-18]^=1;fs.writeFileSync(path.join(d,'bad'),box);await assert.rejects(decrypt(path.join(d,'bad'),path.join(d,'bad-out'),keys.privateKey));assert.equal(fs.existsSync(path.join(d,'bad-out')),false);assert.equal(fs.existsSync(path.join(d,'bad-out.pending')),false);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
