#!/usr/bin/env node
/** Schedule the explicitly approved blind-spot prototype via Buffer.
 *
 * A push of the request file triggers either a read-only preflight or, only
 * when action is exactly "schedule", two approved createPost calls. Never
 * retry an uncertain create: inspect the encrypted result first. This file
 * does not contain credentials or the MP4. It runs on a GitHub Actions runner
 * because Buffer is inaccessible from the local sandbox.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const mission = 'titik-buta-2026';
const expectedSha = 'a468fe300f7e898e8787e44eecbde9e983fede183cb1b269ac46395e77b4714d';
const expectedBytes = 9062523;
const approvedTimes = {facebook:'2026-11-07T15:00:00+07:00', youtube:'2026-11-07T20:00:00+07:00'};
const minGapMs = 2 * 60 * 60 * 1000;
const normalize = s => String(s ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const due = s => Date.parse(s);
const assert = (ok, message) => {if (!ok) throw new Error(message);};

export function validateRequest(req, now = Date.now()) {
  assert(req && req.schemaVersion === 1 && req.mission === mission, 'Invalid mission/schema');
  assert(['preflight','schedule'].includes(req.action), 'Invalid action');
  assert(req.media?.sha256 === expectedSha && req.media?.sizeBytes === expectedBytes, 'Unapproved media checksum or size');
  let url; try {url = new URL(req.media.url);} catch {throw new Error('Invalid media URL');}
  assert(url.protocol === 'https:' && ['drive.google.com','drive.usercontent.google.com','docs.google.com'].includes(url.hostname), 'Media host must be the approved public Drive copy');
  assert(Array.isArray(req.posts) && req.posts.length === 2, 'Exactly two requested posts required');
  assert(new Set(req.posts.map(p => p.platform)).size === 2, 'Duplicate or missing platform');
  for (const p of req.posts) {
    assert(Object.hasOwn(approvedTimes,p.platform), 'Unapproved platform');
    assert(p.dueAt === approvedTimes[p.platform], `Unapproved publication time for ${p.platform}`);
    assert(Number.isFinite(due(p.dueAt)) && due(p.dueAt) > now + 5*60*1000, `Publication time no longer safely in future: ${p.platform}`);
    assert(typeof p.text === 'string' && p.text.trim() && p.text.length <= 5000, `Invalid caption for ${p.platform}`);
    assert(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(p.text), 'Invalid control character');
    if (p.platform === 'youtube') {
      assert(typeof p.title === 'string' && p.title.length > 0 && p.title.length <= 100, 'Invalid YouTube title');
      assert(!/[<>]/.test(p.title + p.text), 'YouTube title/description contains forbidden angle brackets');
    }
  }
  assert(Math.abs(due(req.posts[0].dueAt)-due(req.posts[1].dueAt)) >= minGapMs, 'Requested posts violate two-hour rule');
  return true;
}

export function buildPayload(req, post, channelId) {
  const payload = {
    channelId,
    schedulingType:'automatic', mode:'customScheduled', dueAt:post.dueAt,
    text:post.text, aiAssisted:true,
    assets:[{video:{url:req.media.url}}],
  };
  payload.metadata = post.platform === 'facebook'
    ? {facebook:{type:'reel'}}
    : {youtube:{title:post.title, categoryId:'27', privacy:'public', madeForKids:false, isAiGenerated:true}};
  return payload;
}

export function selectChannels(list) {
  const selected = {};
  for (const platform of ['facebook','youtube']) {
    let matches = list.filter(c => String(c.service ?? c.channelType ?? c.type ?? '').toLowerCase().includes(platform));
    matches = matches.filter(c => c.id || c.channelId);
    if (matches.length > 1) {
      const wanted = platform === 'facebook' ? 'facebookreels' : 'knottheory';
      matches = matches.filter(c => [c.name,c.displayName,c.handle].some(n=>normalize(n)===wanted));
    }
    assert(matches.length === 1, `Cannot resolve a unique ${platform} channel`);
    const c = matches[0];
    assert(c.isDisconnected !== true && c.isLocked !== true && c.isQueuePaused !== true, `${platform} channel is disconnected, locked, or paused`);
    selected[platform] = {id:String(c.id ?? c.channelId), name:String(c.displayName ?? c.name ?? ''), service:String(c.service ?? c.channelType ?? c.type ?? '')};
  }
  assert(selected.facebook.id !== selected.youtube.id, 'Different platforms resolved to the same channel');
  return selected;
}

// Reject unknown post states and do not silently reschedule. All other scheduled
// posts across the organization are checked, not just the two target channels.
export function inspectQueue(existing, posts, channels) {
  const mine = {};
  for (const p of posts) {
    const same = existing.filter(e => String(e.channelId ?? e.channel?.id ?? '') === channels[p.platform].id && String(e.text ?? '').trim() === p.text.trim());
    assert(same.length <= 1, `More than one matching ${p.platform} post; manual review required`);
    if (same.length) {
      const old = same[0];
      assert(old.status === 'scheduled' && due(old.dueAt) === due(p.dueAt) && old.id, `Existing ${p.platform} post has different status/time; manual review required`);
      mine[p.platform] = old;
    }
  }
  const collisions = [];
  for (const p of posts) for (const old of existing) {
    if (!['scheduled','sending'].includes(String(old.status ?? '').toLowerCase()) || !Number.isFinite(due(old.dueAt))) continue;
    if (mine[p.platform] && String(old.id) === String(mine[p.platform].id)) continue;
    if (posts.some(q => mine[q.platform] && String(old.id) === String(mine[q.platform].id))) continue;
    if (Math.abs(due(old.dueAt)-due(p.dueAt)) < minGapMs)
      collisions.push({requested:p.platform, dueAt:old.dueAt, channelService:old.channelService ?? old.channel?.service ?? 'unknown', idHash:crypto.createHash('sha256').update(String(old.id ?? '')).digest('hex').slice(0,12)});
  }
  return {mine,collisions};
}

function findObject(root, predicate, depth=0) {
  if (!root || typeof root !== 'object' || depth>10) return null;
  if (predicate(root)) return root;
  for (const v of Object.values(root)) {const found=findObject(v,predicate,depth+1);if(found) return found;}
  return null;
}
function buffer(args) {
  const r = spawnSync('buffer',[...args,'--output','json','--quiet'], {encoding:'utf8',timeout:90_000,maxBuffer:8*1024*1024,env:{...process.env,NO_COLOR:'1'}});
  let value;try {value=JSON.parse((r.stdout ?? '').trim());} catch {value=null;}
  return {ok:r.status===0 && value !== null, value, status:r.status, diagnostic:String(r.stderr || r.stdout || r.error?.message || '').slice(0,2000)};
}
function needBuffer(args) {
  const r=buffer(args);
  if (!r.ok) throw new Error(`Buffer ${args.slice(0,2).join(' ')} failed (exit ${r.status}): ${r.diagnostic}`);
  return r.value;
}
function listOrganizations() {
  const j=needBuffer(['account','--fields','organizations.id,organizations.name']);
  return findObject(j,x=>Array.isArray(x.organizations))?.organizations ?? [];
}
function listChannels(org) {
  const j=needBuffer(['channels','list','--organization-id',org,'--fields','id,name,displayName,service,isDisconnected,isLocked,isQueuePaused']);
  if (Array.isArray(j)) return j;
  return j.items ?? j.channels ?? findObject(j,x=>Array.isArray(x.channels))?.channels ?? findObject(j,x=>Array.isArray(x.items))?.items ?? [];
}
function listPosts(org) {
  let cursor;const items=[];const seen=new Set();
  for (let page=0;page<25;page++) {
    const args=['posts','list','--organization-id',org,'--limit','100','--fields','items.id,items.text,items.channelId,items.channelService,items.dueAt,items.status,pageInfo.hasNextPage,pageInfo.endCursor'];
    if (cursor) args.push('--after',cursor);
    const j=needBuffer(args);
    const obj = (j.items && j.pageInfo) ? j : (j.posts?.items && j.posts?.pageInfo) ? j.posts : findObject(j,x=>Array.isArray(x.items) && x.pageInfo);
    assert(obj && Array.isArray(obj.items) && typeof obj.pageInfo?.hasNextPage === 'boolean', 'Could not read paginated Buffer queue safely');
    items.push(...obj.items);
    if (!obj.pageInfo.hasNextPage) return items;
    cursor=obj.pageInfo.endCursor;
    assert(typeof cursor === 'string' && cursor && !seen.has(cursor), 'Invalid Buffer queue cursor');
    seen.add(cursor);
  }
  throw new Error('Queue has too many pages to verify safely');
}
function findPost(j) {
  if (!j || typeof j !== 'object') return null;
  if (j.post && typeof j.post === 'object') return j.post;
  if (j.id && (j.status || j.dueAt || j.channelId)) return j;
  return findObject(j,x=>x.post && typeof x.post==='object')?.post ?? findObject(j,x=>x.id && (x.status || x.dueAt || x.channelId));
}
function inspectPost(id, expected, channel) {
  const j=needBuffer(['posts','get','--id',String(id),'--fields','id,text,status,dueAt,channelId,channelService,metadata.title,assets.source,assets.type']);
  const p=findPost(j);
  assert(p?.id && String(p.id)===String(id), `Could not retrieve ${expected.platform} post`);
  assert(String(p.channelId ?? p.channel?.id ?? '')===channel.id, `${expected.platform} channel mismatch`);
  assert(String(p.status ?? '').toLowerCase()==='scheduled', `${expected.platform} post is not scheduled`);
  assert(due(p.dueAt) === due(expected.dueAt), `${expected.platform} schedule mismatch`);
  assert(String(p.text ?? '').trim() === expected.text.trim(), `${expected.platform} caption mismatch`);
  assert(Array.isArray(p.assets) && p.assets.length > 0, `${expected.platform} has no visible media asset`);
  if (expected.platform==='youtube') assert(p.metadata?.title === expected.title, 'YouTube title mismatch');
  return {id:String(p.id),channelId:channel.id,status:p.status,dueAt:p.dueAt,title:expected.title ?? null,assets:p.assets.map(a=>({type:a.type ?? null,hasSource:!!a.source}))};
}
export async function verifyMedia(media, fetcher=fetch) {
  const r=await fetcher(media.url,{redirect:'follow',signal:AbortSignal.timeout(120_000)});
  if (!r.ok) {
    let snippet='';
    try {const reader=r.body?.getReader();if(reader) {const first=await reader.read();snippet=Buffer.from(first.value ?? []).toString('utf8').replace(/\s+/g,' ').slice(0,200);await reader.cancel();}} catch {}
    let host='unknown';try {host=new URL(r.url).hostname;} catch {}
    throw new Error(`Public media HTTP ${r.status}; final host=${host}; server=${r.headers.get('server') ?? 'unknown'}; body=${snippet}`);
  }
  const type=(r.headers.get('content-type') ?? '').toLowerCase();
  assert(type.startsWith('video/') || type.includes('octet-stream'), `Public media is not a direct video (content-type ${type})`);
  assert(r.body, 'Public media has no response body');
  const hash=crypto.createHash('sha256');let bytes=0;
  for await (const part of r.body) {bytes+=part.length;assert(bytes<=expectedBytes,'Public media larger than approved file');hash.update(part);}
  const sha=hash.digest('hex');
  assert(bytes===media.sizeBytes && sha===media.sha256, 'Public media bytes/checksum do not match approved video');
  return {status:'PASS',bytes,sha256:sha,contentType:type};
}

async function checkMedia(req, report) {
  const initial=new URL(req.media.url);
  const id=initial.searchParams.get('id');
  assert(id && /^[A-Za-z0-9_-]+$/.test(id), 'Drive media ID is missing');
  const candidates=[req.media.url];
  if (req.action==='preflight') {
    // Probe only alternate direct-download forms of the same approved copy.
    // A different successful URL is reported, not silently written to Git.
    candidates.push(`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`);
    candidates.push(`https://drive.google.com/uc?export=download&id=${id}&confirm=t`);
    candidates.push(`https://docs.google.com/uc?export=download&id=${id}`);
  }
  report.mediaProbes=[];
  for (const url of [...new Set(candidates)]) {
    try {
      const verified=await verifyMedia({...req.media,url});
      report.mediaProbes.push({url,...verified});
      req.media.url=url;
      return verified;
    } catch (e) {report.mediaProbes.push({url,status:'FAIL',error:String(e?.message ?? e)});}
  }
  throw new Error('No approved Drive direct-download URL could be verified anonymously');
}

async function main() {
  const requestPath=process.argv[2];
  const reportPath=process.env.KNOT_REPORT_PATH || '/tmp/knot-titik-buta-schedule-report.json';
  const report={mission, action:null, status:'FAIL', events:[], posts:[], error:null, at:new Date().toISOString()};
  const write=()=>{fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});};
  try {
    assert(requestPath,'Request file argument is required');
    const req=JSON.parse(fs.readFileSync(requestPath,'utf8'));report.action=req.action;
    validateRequest(req);
    assert(process.env.BUFFER_API_KEY, 'BUFFER_API_KEY missing in runner');
    report.events.push({name:'request',status:'PASS'});
    report.events.push({name:'public_media',...(await checkMedia(req,report))});
    const orgs=listOrganizations().filter(x=>x.id);
    const configured=process.env.BUFFER_ORGANIZATION_ID;
    let org;
    if (configured) {assert(orgs.some(x=>String(x.id)===String(configured)),'Configured organization not present');org=String(configured);}
    else {assert(orgs.length===1,`Expected one organization; found ${orgs.length}`);org=String(orgs[0].id);}
    const channels=selectChannels(listChannels(org));report.channels=channels;
    report.events.push({name:'channels',status:'PASS'});
    const queue=listPosts(org);const inspection=inspectQueue(queue,req.posts,channels);
    report.queue={checkedPosts:queue.length,collisions:inspection.collisions,existing:Object.keys(inspection.mine)};
    assert(!inspection.collisions.length,'Existing scheduled posts violate the two-hour gap; no new posts created');
    for (const p of req.posts) {
      const dr=buffer(['posts','create','--json',JSON.stringify(buildPayload(req,p,channels[p.platform].id)),'--dry-run']);
      assert(dr.ok, `Buffer dry-run rejected ${p.platform}: ${dr.diagnostic}`);
    }
    report.events.push({name:'payload_dry_run',status:'PASS'});
    if (req.action==='preflight') {
      report.status='PREFLIGHT_PASS';
      console.log('Preflight passed. No Buffer posts created.');
      write();return;
    }
    for (const p of req.posts) {
      if (inspection.mine[p.platform]) {
        const checked=inspectPost(inspection.mine[p.platform].id,p,channels[p.platform]);
        report.posts.push({platform:p.platform,outcome:'ALREADY_SCHEDULED',...checked});write();continue;
      }
      // posts.create is NOT idempotent. Persist that an attempt began before
      // making it; on any timeout/ambiguous response stop immediately, no retry.
      report.posts.push({platform:p.platform,outcome:'CREATE_IN_PROGRESS',dueAt:p.dueAt});write();
      const r=buffer(['posts','create','--json',JSON.stringify(buildPayload(req,p,channels[p.platform].id)),'--fields','post.id,post.status,post.dueAt,post.channelId']);
      if (!r.ok) {report.posts.at(-1).outcome='CREATE_UNCERTAIN';throw new Error(`Create ${p.platform} failed or timed out; inspect Buffer before retry: ${r.diagnostic}`);}
      const created=findPost(r.value);
      if (!created?.id) {report.posts.at(-1).outcome='CREATE_UNCERTAIN';throw new Error(`Create ${p.platform} returned no post ID; inspect Buffer before retry`);}
      report.posts.at(-1).id=String(created.id);report.posts.at(-1).outcome='CREATED_NOT_YET_VERIFIED';write();
      const checked=inspectPost(created.id,p,channels[p.platform]);
      report.posts[report.posts.length-1]={platform:p.platform,outcome:'SCHEDULED_VERIFIED',...checked};write();
    }
    report.status='SCHEDULED_VERIFIED';
    console.log('Both requested Buffer posts were verified scheduled.');
    write();
  } catch (e) {
    report.error=String(e?.stack ?? e);write();
    console.error('Request stopped; details are available only in the encrypted report. Do not blindly retry.');
    process.exitCode=1;
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
