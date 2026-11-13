#!/usr/bin/env node
/**
 * One approved Coverr download for the Kamar Berlangit visual test.
 * Downloads via the API's urls.mp4_download (HTTPS coverr.co only), validates
 * the candidate (not premium, not AI, duration >= 8 s, size cap; vertical OR
 * landscape accepted — orientation is recorded, unlike the Rupert validator),
 * probes with ffprobe, writes sanitized metadata to $RUNNER_TEMP. Plaintext
 * stays in $RUNNER_TEMP; the workflow then encrypts it into Git with a one-
 * time password published as an annotation. No URLs, keys, API bodies or
 * plaintext are logged. Repo is public; only ciphertext is committed and it
 * is removed from the tree after decryption.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {cleanText, creatorName, SafeError, validId, classifyTracking} from '../coverr-transfer/transfer.mjs';

const fail = (msg) => { const one=String(msg).replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'); console.log(`::error::${one}`); console.error(msg); };
const API='https://api.coverr.co';
const ID=process.argv[2]||'';
const OUT=process.argv[3]||path.join(os.tmpdir(),'kamar-footage.mp4');
const KEY=process.env.COVERR_API_KEY||'';
const MAX=120*1024*1024;
if(!validId(ID)){fail('BAD_VIDEO_ID');process.exit(2);}
if(!KEY){fail('MISSING_COVERR_KEY');process.exit(2);}

function checkKamar(v,id){
  if(!v||typeof v!=='object'||v.id!==id||!validId(id))throw new SafeError('BAD_VIDEO_ID');
  if(v.is_premium!==false)throw new SafeError('PREMIUM_OR_UNKNOWN');
  // 2026-11-13 user explicitly allows AI-generated Coverr footage for this
  // episode; the flag is recorded instead of rejected.
  const isAi=v.is_ai_generated===true;
  const title=cleanText(v.title,id);if(!title)throw new SafeError('BAD_TITLE');
  if(typeof v.duration==='number'&&v.duration<8)throw new SafeError('TOO_SHORT');
  let u;try{u=new URL(v.urls?.mp4_download);}catch{throw new SafeError('BAD_MEDIA_URL');}
  if(u.protocol!=='https:'||u.username||u.password||!/(^|\.)coverr\.co$/i.test(u.hostname)||(u.port&&u.port!=='443'))throw new SafeError('UNTRUSTED_MEDIA_ORIGIN');
  return {id,title,creator:creatorName(v),duration_seconds:v.duration,isAi,
          is_vertical:v.is_vertical===true?'vertical':(v.is_vertical===false?'landscape':'unknown'),
          mediaUrl:u.toString()};
}
const sha256=(b)=>crypto.createHash('sha256').update(b).digest('hex');
async function run(){
  let r;try{r=await fetch(`${API}/videos/${ID}`,{redirect:'error',signal:AbortSignal.timeout(30000),headers:{'x-api-key':KEY,'Accept':'application/json','User-Agent':'ContentCreator-Kamar-Fetch/1.0'}});}
  catch{throw new SafeError('COVERR_API_NETWORK');}
  if(!r.ok)throw new SafeError(`COVERR_GET_HTTP_${r.status}`);
  const body=await r.text();
  if(body.length>2_000_000)throw new SafeError('COVERR_RESPONSE_TOO_LARGE');
  let detail;try{detail=JSON.parse(body);}catch{throw new SafeError('COVERR_BAD_JSON');}
  const cand=checkKamar(detail,ID);
  const res=await fetch(cand.mediaUrl,{redirect:'error',signal:AbortSignal.timeout(180000),headers:{'User-Agent':'ContentCreator-Kamar-Fetch/1.0'}});
  if(!res.ok)throw new SafeError(`MEDIA_HTTP_${res.status}`);
  const buf=Buffer.from(await res.arrayBuffer());
  if(!buf.length||buf.length>MAX)throw new SafeError('MEDIA_SIZE_UNSAFE');
  fs.writeFileSync(OUT,buf);
  // Independent decode check with the proven npm ffprobe-static install.
  const inst=spawnSync('npm',['install','--prefix','/tmp/ffprobe-static-pkg','ffprobe-static','--no-audit','--no-fund','--silent'],{timeout:120000});
  if(inst.status!==0)throw new SafeError('FFPROBE_MISSING');
  const ffprobeBin='/tmp/ffprobe-static-pkg/node_modules/ffprobe-static/bin/linux/x64/ffprobe';
  const probe=spawnSync(ffprobeBin,['-v','error','-show_entries','stream=codec_type,codec_name,width,height','-show_entries','format=duration','-of','json',OUT],{timeout:60000,encoding:'utf8'});
  if(probe.status!==0)throw new SafeError('PROBE_FAILED');
  const meta=JSON.parse(probe.stdout||'{}');
  const streams=meta.streams||[];
  const v=streams.find(s=>s.codec_type==='video')||streams[0]||{};
  if(v.codec_name!=='h264')throw new SafeError('NOT_H264');
  const dur=parseFloat(meta.format?.duration||'0');
  if(!Number.isFinite(dur)||dur<8)throw new SafeError('TOO_SHORT_DECODE');
  // License tracking: the documented PATCH endpoint historically 404s here;
  // report NEEDS_REVIEW then, FAIL for any other failure, PASS only on 2xx.
  let tracking='NEEDS_REVIEW';
  try{
    const pr=await fetch(`${API}/videos/${ID}/stats/downloads`,{method:'PATCH',redirect:'error',signal:AbortSignal.timeout(30000),headers:{'x-api-key':KEY,'User-Agent':'ContentCreator-Kamar-Fetch/1.0'}});
    tracking=classifyTracking([pr.status]);
  }catch(e){ if(e&&e.code&&e.code!=='COVERR_PATCH_HTTP_404')throw e; tracking=classifyTracking([404]); }
  const ready={
    id:cand.id,title:cand.title,creator:cand.creator,
    duration_seconds:dur,bytes:buf.length,sha256:sha256(buf),
    width:v.width||null,height:v.height||null,orientation:cand.is_vertical,
    ai_generated:cand.isAi,
    tracking,
    licenseNote:'Coverr license terms NEEDS_REVIEW before any publication; private test only.',
    plaintextPath:OUT
  };
  fs.writeFileSync(path.join(os.tmpdir(),'kamar-footage-ready.json'),JSON.stringify(ready,null,2)+'\n');
  console.log(JSON.stringify({ok:true,id:cand.id,bytes:buf.length,sha256:ready.sha256,duration:dur,width:v.width,height:v.height,orientation:cand.is_vertical,ai:cand.isAi,tracking}));
}
run().catch(e=>{fail(`FETCH-FAILED: ${e&&e.code?e.code:(e&&e.message||e)}`);process.exit(1);});
