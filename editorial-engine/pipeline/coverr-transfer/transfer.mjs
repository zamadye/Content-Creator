#!/usr/bin/env node
/** One approved Coverr download per job. GitHub receives only ciphertext as an
 * unreferenced Git blob. No URLs, keys, API bodies or plaintext are logged.
 * The repo is public; unreferenced blobs may persist until garbage collection.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { pathToFileURL } from 'node:url';

export class SafeError extends Error { constructor(code) { super(code); this.code=code; } }
export const MAGIC=Buffer.from('UMPF1');
export const MAX_DOWNLOAD_BYTES=250*1024*1024, MAX_TRANSFER_BYTES=32*1024*1024;
export function validId(id) { return typeof id==='string' && /^[A-Za-z0-9_-]{1,80}$/.test(id); }
export function validRepository(repo) { return /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(repo || '') && !repo.includes('..'); }
export function cleanText(value,key='',limit=160) {
  if(typeof value!=='string') return null;
  const t=value.replace(/\s+/g,' ').trim().slice(0,limit);
  return !t || (key && t.includes(key)) || /https?:\/\/|(?:token|api[_-]?key)\s*[=:]/i.test(t) ? null : t;
}
export function creatorName(v,key) {
  for(const k of ['creator','author','user','photographer']) {
    let value=v[k]; if(value && typeof value==='object') value=value.name||value.display_name;
    const name=cleanText(value,key,100); if(name) return name;
  } return null;
}
export function checkCandidate(v,id,key='') {
  if(!v || typeof v!=='object' || v.id!==id || !validId(v.id)) throw new SafeError('BAD_VIDEO_ID');
  if(v.is_premium!==false) throw new SafeError('PREMIUM_OR_UNKNOWN');
  if(v.is_ai_generated!==false) throw new SafeError('AI_OR_UNKNOWN');
  if(v.is_vertical!==false) throw new SafeError('VERTICAL_OR_UNKNOWN');
  if(!cleanText(v.title,key)) throw new SafeError('BAD_TITLE');
  // Some API details omit duration. Reject a known-short candidate, then
  // independently verify the decoded excerpt with ffprobe after trimming.
  if(typeof v.duration==='number' && v.duration<8) throw new SafeError('TOO_SHORT');
  let u; try { u=new URL(v.urls?.mp4_download); } catch { throw new SafeError('BAD_MEDIA_URL'); }
  if(u.protocol!=='https:' || u.username || u.password || !/(^|\.)coverr\.co$/i.test(u.hostname) || (u.port && u.port!=='443')) throw new SafeError('UNTRUSTED_MEDIA_ORIGIN');
  return {id:v.id,title:cleanText(v.title,key),creator:creatorName(v,key),duration_seconds:v.duration,is_premium:false,is_ai_generated:false,is_vertical:false,mediaUrl:u.toString()};
}
export function encryptBytes(data,publicKey) {
  if(!Buffer.isBuffer(data) || !data.length || data.length>MAX_TRANSFER_BYTES) throw new SafeError('INVALID_PLAINTEXT');
  const key=crypto.randomBytes(32),iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
  const payload=Buffer.concat([cipher.update(data),cipher.final()]);
  const wrapped=crypto.publicEncrypt({key:publicKey,padding:crypto.constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},key);
  const length=Buffer.alloc(2); length.writeUInt16BE(wrapped.length);
  return Buffer.concat([MAGIC,length,wrapped,iv,cipher.getAuthTag(),payload]);
}
export function decryptBytes(buf,privateKey) {
  if(!Buffer.isBuffer(buf) || !buf.subarray(0,MAGIC.length).equals(MAGIC) || buf.length<MAGIC.length+2+256+28) throw new SafeError('BAD_ENVELOPE');
  let p=MAGIC.length; const n=buf.readUInt16BE(p); p+=2;
  if(n<128 || n>1024 || p+n+28>=buf.length) throw new SafeError('BAD_ENVELOPE');
  const wrapped=buf.subarray(p,p+n); p+=n; const iv=buf.subarray(p,p+12); p+=12; const tag=buf.subarray(p,p+16); p+=16;
  const key=crypto.privateDecrypt({key:privateKey,padding:crypto.constants.RSA_PKCS1_OAEP_PADDING,oaepHash:'sha256'},wrapped);
  const cipher=crypto.createDecipheriv('aes-256-gcm',key,iv); cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(buf.subarray(p)),cipher.final()]);
}
export function gitBlobSha(data) { return crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex'); }
function sha256(data) { return crypto.createHash('sha256').update(data).digest('hex'); }
async function api(p,key,method='GET') {
  if(!/^\/videos\/[A-Za-z0-9_-]+(?:\/stats\/downloads)?$/.test(p)) throw new SafeError('BAD_API_PATH');
  let r; try { r=await fetch(`https://api.coverr.co${p}`,{method,redirect:'error',signal:AbortSignal.timeout(30000),headers:{'x-api-key':key,'Accept':'application/json','User-Agent':'ContentCreator-Coverr-Transfer/1.0'}}); }
  catch { throw new SafeError('COVERR_API_NETWORK'); }
  if(!r.ok) throw new SafeError(`COVERR_${method}_HTTP_${r.status}`);
  if(method==='PATCH') return r.status;
  const body=await r.text(); if(body.length>2_000_000) throw new SafeError('COVERR_RESPONSE_TOO_LARGE');
  try { return JSON.parse(body); } catch { throw new SafeError('COVERR_BAD_JSON'); }
}
// The current license asks for PATCH; the older official API download docs
// also say that an mp4_download request needs no additional action. If the
// documented PATCH endpoint returns 404 for both documented auth methods, we
// still use the API's mp4_download for a PRIVATE review draft and explicitly
// mark tracking NEEDS_REVIEW. Never turn an HTTP failure into a tracking PASS.
export function classifyTracking(statuses) {
  if(statuses.some(s=>s>=200 && s<300)) return 'PASS';
  if(statuses.length && statuses.every(s=>s===404)) return 'NEEDS_REVIEW';
  return 'FAIL';
}
async function track(id,key) {
  const statuses=[];
  for(const method of ['x-api-key','bearer']) {
    const headers={'Accept':'application/json','User-Agent':'ContentCreator-Coverr-Transfer/1.1'};
    if(method==='x-api-key') headers['x-api-key']=key; else headers.Authorization=`Bearer ${key}`;
    let r; try {r=await fetch(`https://api.coverr.co/videos/${id}/stats/downloads`,{method:'PATCH',headers,redirect:'error',signal:AbortSignal.timeout(30000)});}
    catch {throw new SafeError('COVERR_PATCH_NETWORK');}
    statuses.push(r.status);
    if(r.ok) break;
    if(r.status!==404) throw new SafeError(`COVERR_PATCH_HTTP_${r.status}`);
  }
  return {status:classifyTracking(statuses), http_statuses:statuses};
}
async function download(url,destination) {
  let next=new URL(url),response;
  for(let i=0;i<5;i++) {
    if(next.protocol!=='https:' || !/(^|\.)coverr\.co$/i.test(next.hostname) || next.username || next.password || (next.port && next.port!=='443')) throw new SafeError('MEDIA_REDIRECT_BLOCKED');
    try { response=await fetch(next,{redirect:'manual',signal:AbortSignal.timeout(180000)}); } catch { throw new SafeError('MEDIA_NETWORK'); }
    if(response.status>=300 && response.status<400) { const loc=response.headers.get('location'); if(!loc) throw new SafeError('MEDIA_REDIRECT_MISSING'); try {next=new URL(loc,next);} catch {throw new SafeError('MEDIA_REDIRECT_INVALID');} continue; }
    break;
  }
  if(!response || !response.ok || !response.body) throw new SafeError(`MEDIA_HTTP_${response?.status || 0}`);
  if(Number(response.headers.get('content-length')||0)>MAX_DOWNLOAD_BYTES) throw new SafeError('MEDIA_TOO_LARGE');
  let count=0; const limiter=new Transform({transform(chunk,enc,done) {count+=chunk.length; if(count>MAX_DOWNLOAD_BYTES) return done(new SafeError('MEDIA_TOO_LARGE')); done(null,chunk);}});
  try {await pipeline(Readable.fromWeb(response.body),limiter,fs.createWriteStream(destination,{mode:0o600}));} catch(e) {if(e instanceof SafeError) throw e; throw new SafeError('MEDIA_STREAM_FAILED');}
  if(count<1000) throw new SafeError('MEDIA_TOO_SMALL'); return count;
}
export function validateSourceProbe(data) {
  const stream=data?.streams?.[0], duration=Number(data?.format?.duration);
  const width=Number(stream?.width),height=Number(stream?.height);
  if(!Number.isInteger(width) || !Number.isInteger(height) || !Number.isFinite(duration)) throw new SafeError('SOURCE_PROBE_INVALID');
  // Never call an enlarged 720p source genuine 1080p. Aspect-ratio crops can
  // only reduce effective resolution further, so demand at least 16:9 area.
  if(width<1920 || height<1080 || Math.min(width, height*16/9)<1920 || Math.min(height,width*9/16)<1080) throw new SafeError('SOURCE_BELOW_1080P');
  if(duration<7.1) throw new SafeError('SOURCE_TOO_SHORT');
  return {width,height,duration_seconds:Math.round(duration*1000)/1000};
}
function probeSource(source) {
  const p=spawnSync('ffprobe',['-v','error','-select_streams','v:0','-show_entries','stream=width,height:format=duration','-of','json',source],{encoding:'utf8',timeout:30000});
  if(p.error?.code==='ENOENT') throw new SafeError('FFPROBE_MISSING');
  if(p.status!==0) throw new SafeError('SOURCE_PROBE_FAILED');
  let data; try {data=JSON.parse(p.stdout);} catch {throw new SafeError('SOURCE_PROBE_INVALID');}
  return validateSourceProbe(data);
}
export function buildTrimArgs(source,dest) {
  return ['-hide_banner','-loglevel','error','-y','-ss','1','-i',source,'-t','6','-map','0:v:0','-an','-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1,fps=30','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',dest];
}
function trim(source,dest) {
  const args=buildTrimArgs(source,dest);
  const run=spawnSync('ffmpeg',args,{encoding:'utf8',timeout:120000});
  if(run.status!==0 || !fs.existsSync(dest)) {
    if(run.error?.code==='ENOENT') throw new SafeError('FFMPEG_MISSING');
    if(run.error?.code==='ETIMEDOUT') throw new SafeError('FFMPEG_TIMEOUT');
    const err=String(run.stderr||'');
    if(/moov atom not found/i.test(err)) throw new SafeError('MEDIA_MOOV_MISSING');
    if(/Invalid data found when processing input/i.test(err)) throw new SafeError('MEDIA_INVALID_DATA');
    if(/Unknown encoder/i.test(err)) throw new SafeError('FFMPEG_ENCODER_MISSING');
    if(/No space left on device/i.test(err)) throw new SafeError('RUNNER_DISK_FULL');
    throw new SafeError(`FFMPEG_EXIT_${Number.isInteger(run.status)?run.status:'UNKNOWN'}`);
  }
  const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',dest],{encoding:'utf8',timeout:30000});
  const duration=Number((probe.stdout||'').trim());
  if(probe.status!==0 || !Number.isFinite(duration) || duration<5.95 || duration>6.1) throw new SafeError('EXCERPT_DURATION_INVALID');
  const result=fs.readFileSync(dest); if(result.length<1000 || result.length>MAX_TRANSFER_BYTES) throw new SafeError('TRIM_SIZE_INVALID'); return result;
}
async function createBlob(data,token,repo) {
  if(!validRepository(repo)) throw new SafeError('BAD_GITHUB_REPOSITORY');
  let r; try {r=await fetch(`https://api.github.com/repos/${repo}/git/blobs`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(60000),headers:{'Authorization':`Bearer ${token}`,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','Content-Type':'application/json','User-Agent':'ContentCreator-Coverr-Transfer/1.0'},body:JSON.stringify({content:data.toString('base64'),encoding:'base64'})});} catch {throw new SafeError('GITHUB_BLOB_NETWORK');}
  if(!r.ok) throw new SafeError(`GITHUB_BLOB_HTTP_${r.status}`);
  let obj; try {obj=await r.json();} catch {throw new SafeError('GITHUB_BLOB_BAD_JSON');}
  if(!/^[a-f0-9]{40}$/.test(obj.sha||'') || obj.sha!==gitBlobSha(data)) throw new SafeError('GITHUB_BLOB_HASH_MISMATCH'); return obj.sha;
}
function emit(data) {
  const s=JSON.stringify(data); console.log('COVERR_TRANSFER_RESULT='+s);
  if(process.env.GITHUB_ACTIONS==='true') console.log('::notice title=Coverr encrypted transfer::'+s.replace(/%/g,'%25').replace(/\r/g,'%0D').replace(/\n/g,'%0A'));
}
async function main() {
  const id=process.env.COVERR_VIDEO_ID||'', key=process.env.COVERR_API_KEY||'', token=process.env.GITHUB_TOKEN||'', repo=process.env.GITHUB_REPOSITORY||''; let dir;
  try {
    if(!validId(id)||!key||!token||!validRepository(repo)) throw new SafeError('MISSING_INPUT');
    dir=fs.mkdtempSync(path.join(os.tmpdir(),'coverr-transfer-')); const raw=path.join(dir,'raw.mp4'), clip=path.join(dir,'excerpt.mp4');
    const candidate=checkCandidate(await api(`/videos/${id}`,key),id,key);
    // Issue the documented API tracking request on selection, then use the
    // API's mp4_download URL (which the download docs describe as tracked).
    // A 404 is carried through as NEEDS_REVIEW, never represented as success.
    const tracking=await track(id,key);
    const originalBytes=await download(candidate.mediaUrl,raw);
    const head=Buffer.alloc(1024), fd=fs.openSync(raw,'r');
    const headLength=fs.readSync(fd,head,0,head.length,0); fs.closeSync(fd);
    const prefix=head.subarray(0,headLength);
    const looksMp4=prefix.indexOf(Buffer.from('ftyp'))>=0;
    const looksHls=prefix.toString('utf8',0,32).startsWith('#EXTM3U');
    const looksHtml=/^\s*(?:<!doctype|<html)/i.test(prefix.toString('utf8',0,80));
    emit({status:'DOWNLOADED_FOR_DIAGNOSTIC',id,tracking,original_bytes:originalBytes,container_signature:looksMp4?'MP4':looksHls?'HLS':looksHtml?'HTML':'UNKNOWN'});
    const sourceInfo=probeSource(raw);
    const trimmed=trim(raw,clip), publicKey=fs.readFileSync('editorial-engine/pipeline/coverr-transfer/session-public.pem');
    const blob=encryptBytes(trimmed,publicKey), sha=await createBlob(blob,token,repo);
    emit({status:'PASS_DOWNLOAD',video:{id:candidate.id,title:candidate.title,creator:candidate.creator,duration_seconds:candidate.duration_seconds,is_premium:false,is_ai_generated:false,is_vertical:false},tracking,download_route:'Coverr API mp4_download',source_probe:sourceInfo,original_bytes:originalBytes,excerpt_seconds:6,excerpt_resolution:'1920x1080',excerpt_crf:17,excerpt_bytes:trimmed.length,excerpt_sha256:sha256(trimmed),encrypted_blob_sha:sha,transport:'encrypted-unreferenced-git-blob'});
  } catch(e) {
    const code=e instanceof SafeError?e.code:'UNEXPECTED_FAILURE';
    emit({status:'FAIL',id:validId(id)?id:null,code});
    // Authentication, permission and quota failures must stop a batch: do not
    // hammer an API after a 401/403/429 or misrepresent it as a media failure.
    process.exitCode=/^COVERR_(?:GET|PATCH)_HTTP_(?:401|403|429)$/.test(code)||code==='MISSING_INPUT'?78:1;
  }
  finally {if(dir) fs.rmSync(dir,{recursive:true,force:true});}
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) await main();
