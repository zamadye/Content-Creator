#!/usr/bin/env node
// AES-256-GCM streaming envelope, RSA-OAEP-SHA256 wrapped one-time key.
// The private key never leaves the local workspace; artifact contains no media
// in plaintext. Authentication is verified before the output is moved into place.
import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';import {pipeline} from 'node:stream/promises';import {pathToFileURL} from 'node:url';
export const MAGIC=Buffer.from('CVR01'),MAX=250*1024*1024;
export async function encrypt(input,output,publicKey){
 const size=fs.statSync(input).size;if(!size||size>MAX)throw new Error('SIZE');
 const key=crypto.randomBytes(32),iv=crypto.randomBytes(12),wrapped=crypto.publicEncrypt({key:publicKey,padding:crypto.constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key),len=Buffer.alloc(2);len.writeUInt16BE(wrapped.length);
 const header=Buffer.concat([MAGIC,len,wrapped,iv]);fs.writeFileSync(output,header,{mode:0o600});const cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
 try{await pipeline(fs.createReadStream(input),cipher,fs.createWriteStream(output,{flags:'a',mode:0o600}));fs.appendFileSync(output,cipher.getAuthTag());}
 catch(e){fs.rmSync(output,{force:true});throw e}
 return fs.statSync(output).size;
}
export async function decrypt(input,output,privateKey){
 const n=fs.statSync(input).size;if(n<MAGIC.length+2+128+12+16+1||n>MAX+2048)throw new Error('SIZE');
 const fd=fs.openSync(input,'r');let prefix,wrapped,iv,tag,start;
 try{prefix=Buffer.alloc(MAGIC.length+2);fs.readSync(fd,prefix,0,prefix.length,0);if(!prefix.subarray(0,MAGIC.length).equals(MAGIC))throw new Error('MAGIC');
  const l=prefix.readUInt16BE(MAGIC.length);if(l<128||l>1024)throw new Error('KEYSIZE');start=MAGIC.length+2+l+12;if(start+16>=n)throw new Error('HEADER');
  wrapped=Buffer.alloc(l);iv=Buffer.alloc(12);tag=Buffer.alloc(16);fs.readSync(fd,wrapped,0,l,MAGIC.length+2);fs.readSync(fd,iv,0,12,MAGIC.length+2+l);fs.readSync(fd,tag,0,16,n-16);
 }finally{fs.closeSync(fd)}
 const key=crypto.privateDecrypt({key:privateKey,padding:crypto.constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},wrapped),decipher=crypto.createDecipheriv('aes-256-gcm',key,iv);decipher.setAuthTag(tag);
 const tmp=output+'.pending';fs.rmSync(tmp,{force:true});
 try{await pipeline(fs.createReadStream(input,{start,end:n-17}),decipher,fs.createWriteStream(tmp,{mode:0o600}));fs.renameSync(tmp,output)}catch(e){fs.rmSync(tmp,{force:true});throw e}
 return fs.statSync(output).size;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const [cmd,input,output,keyPath]=process.argv.slice(2);
 try{if(!['encrypt','decrypt'].includes(cmd)||!input||!output||!keyPath)throw new Error('ARGS');const key=fs.readFileSync(keyPath);const n=cmd==='encrypt'?await encrypt(input,output,key):await decrypt(input,output,key);console.log(JSON.stringify({status:'PASS',mode:cmd,bytes:n}));}
 catch{console.error('Encrypted transfer failed (no secret or signed URL logged).');process.exitCode=1}
}
