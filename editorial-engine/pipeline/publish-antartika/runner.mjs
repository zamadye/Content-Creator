#!/usr/bin/env node
/* One explicitly authorised Antarctica publication. No plaintext media URL,
 * Buffer key, or full API response is committed or logged. GitHub runner uses
 * an ephemeral RSA handshake, then reads an authenticated encrypted envelope.
 * shareNow is non-idempotent: one ambiguous create stops the run; NEVER retry
 * without a separate read-only reconciliation. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {decryptBytes} from '../coverr-transfer/transfer.mjs';

const REPO='zamadye/Content-Creator',BRANCH='arena/54cb36c6-content-creator';
const REQUEST='.github/antartika-now-request.json',ENVELOPE='.github/antartika-now-envelope.json';
const SHA='3e1dcf50b09b5881d0ff42fbf75c8414038335ea2dc85d96f34fa7251ee68836',BYTES=12059844;
const KNOWN_TITIK_FB='6aedcad71fcdcefa468d7cfd',GAP=2*60*60*1000;
const ok=(c,m)=>{if(!c)throw new Error(m);};
const norm=s=>String(s??'').toLowerCase().replace(/[^a-z0-9]/g,'');
const time=s=>Date.parse(s);

export function validateRequest(req) {
 ok(req?.mission==='antartika-rev2-now-2026-11-07' && req.schemaVersion===1,'bad request');
 ok(['preflight','publish','inspect'].includes(req.action),'bad action');
 ok(/^[a-f0-9]{32}$/.test(req.nonce??''),'bad nonce');
 ok(req.approvals?.publishAntartikaNowFbYoutube===true && req.approvals?.exceptionForTitikButa15AndBothChannels===true,'explicit exception required');
 let owner;try{owner=crypto.createPublicKey(Buffer.from(req.owner_public_key_b64??'','base64').toString('utf8'));}catch{throw new Error('bad report public key');}
 ok(owner.asymmetricKeyType==='rsa' && owner.asymmetricKeyDetails.modulusLength>=2048,'weak report key');return owner;
}
export function validateSecret(obj,req) {
 ok(obj?.nonce===req.nonce && /^[A-Za-z0-9_-]{10,200}$/.test(obj.mediaId??''),'bad envelope');
 ok(Array.isArray(obj.posts) && obj.posts.length===2 && new Set(obj.posts.map(p=>p.platform)).size===2,'need both platforms');
 for(const p of obj.posts){
  ok(['facebook','youtube'].includes(p.platform) && typeof p.text==='string' && p.text.length>10 && p.text.length<=5000,'invalid caption');
  ok(p.text.includes('ikuti knot theory') && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(p.text),'invalid CTA/control character');
  if(p.platform==='youtube')ok(typeof p.title==='string' && p.title.length<=100 && p.title.length>0 && !/[<>]/.test(p.title+p.text),'invalid YouTube text');
 }
 return obj;
}
export function selectChannels(list){
 const selected={};for(const platform of ['facebook','youtube']){
  let matches=list.filter(c=>String(c.service??c.channelType??c.type??'').toLowerCase().includes(platform)).filter(c=>c.id||c.channelId);
  if(matches.length>1){const wanted=platform==='facebook'?'facebookreels':'knottheory';matches=matches.filter(c=>[c.name,c.displayName,c.handle].some(n=>norm(n)===wanted));}
  ok(matches.length===1,`cannot uniquely resolve ${platform}`);const c=matches[0];
  ok(c.isDisconnected!==true&&c.isLocked!==true&&c.isQueuePaused!==true,`${platform} unavailable`);
  selected[platform]={id:String(c.id??c.channelId),name:String(c.displayName??c.name??'')};
 }
 ok(selected.facebook.id!==selected.youtube.id,'same channel id');return selected;
}
export function inspectQueue(queue,posts,channels,now=Date.now()){
 const mine={};const collisions=[];const unknownTimes=[];
 for(const p of posts){
  const matches=queue.filter(q=>String(q.channelId??q.channel?.id??'')===channels[p.platform].id&&String(q.text??'').trim()===p.text.trim());
  ok(matches.length<=1,`multiple matching ${p.platform} posts; inspect manually`);
  if(matches.length){ok(matches[0].id && ['sent','sending','scheduled'].includes(String(matches[0].status??'').toLowerCase()),`matching ${p.platform} needs manual review`);mine[p.platform]=matches[0];}
 }
 for(const q of queue){
  const status=String(q.status??'').toLowerCase();
  ok(['scheduled','sending','needs_approval','draft','error','sent'].includes(status),'unknown Buffer post status');
  if(!['scheduled','sending','needs_approval','sent'].includes(status))continue;
  if(Object.values(mine).some(m=>String(m.id)===String(q.id)))continue;
  const when=status==='sent'?(q.sentAt??q.dueAt):q.dueAt;
  if(!Number.isFinite(time(when))){unknownTimes.push({id:String(q.id??''),status});continue;}
  if(Math.abs(time(when)-now)<GAP){
   // User's explicit exception applies to the known 15.00 Titik Buta FB post,
   // not arbitrary unrelated posts found in the queue.
   if(String(q.id)===KNOWN_TITIK_FB)continue;
   collisions.push({id:String(q.id??''),status,time:when,service:String(q.channelService??'')});
  }
 }
 return {mine,collisions,unknownTimes};
}
export function payload(secret,p,channelId,url){
 const out={channelId,schedulingType:'automatic',mode:'shareNow',text:p.text,aiAssisted:true,assets:[{video:{url}}]};
 out.metadata=p.platform==='facebook'?{facebook:{type:'reel'}}:{youtube:{title:p.title,categoryId:'27',privacy:'public',madeForKids:false,isAiGenerated:true}};
 return out;
}
function findObject(root,predicate,depth=0){if(!root||typeof root!=='object'||depth>10)return null;if(predicate(root))return root;for(const v of Object.values(root)){const f=findObject(v,predicate,depth+1);if(f)return f;}return null;}
function call(args){
 const r=spawnSync('buffer',[...args,'--output','json','--quiet'],{encoding:'utf8',timeout:90000,maxBuffer:8*1024*1024,env:{...process.env,NO_COLOR:'1'}});
 let value;try{value=JSON.parse((r.stdout??'').trim());}catch{value=null;}
 return {ok:r.status===0&&value!==null,value,code:r.status,diagnostic:String(r.stderr||r.stdout||r.error?.message||'').slice(0,2000)};
}
function need(args){const r=call(args);if(!r.ok)throw new Error(`Buffer ${args.slice(0,2).join(' ')} failed (${r.code}): ${r.diagnostic}`);return r.value;}
function listOrganizations(){const j=need(['account','--fields','organizations.id,organizations.name']);return findObject(j,x=>Array.isArray(x.organizations))?.organizations??[];}
function listChannels(org){const j=need(['channels','list','--organization-id',org,'--fields','id,name,displayName,service,isDisconnected,isLocked,isQueuePaused']);return Array.isArray(j)?j:(j.items??j.channels??findObject(j,x=>Array.isArray(x.items))?.items??[]);}
function listPosts(org){
 const items=[],seen=new Set();let cursor;
 for(let page=0;page<25;page++){
  const args=['posts','list','--organization-id',org,'--limit','100','--fields','items.id,items.text,items.status,items.channelId,items.channelService,items.sentAt,items.dueAt,items.externalLink,items.assets.source,items.assets.type,pageInfo.hasNextPage,pageInfo.endCursor'];if(cursor)args.push('--after',cursor);
  const j=need(args);const x=(j.items&&j.pageInfo)?j:(j.posts?.items&&j.posts?.pageInfo)?j.posts:findObject(j,v=>Array.isArray(v.items)&&v.pageInfo);
  ok(x&&Array.isArray(x.items)&&typeof x.pageInfo?.hasNextPage==='boolean','cannot safely read queue');items.push(...x.items);
  if(!x.pageInfo.hasNextPage)return items;cursor=x.pageInfo.endCursor;ok(typeof cursor==='string'&&cursor&&!seen.has(cursor),'invalid cursor');seen.add(cursor);
 }
 throw new Error('queue exceeded page safety limit');
}
function findPost(j){return j?.post??(j?.id?j:null)??findObject(j,x=>x.post&&typeof x.post==='object')?.post??findObject(j,x=>x.id&&(x.status||x.channelId));}
const getFields='id,text,status,dueAt,sentAt,externalLink,channelId,channelService,metadata.title,assets.source,assets.type';
function readPost(id,p,channel){
 const q=findPost(need(['posts','get','--id',String(id),'--fields',getFields]));
 ok(q?.id && String(q.id)===String(id),'cannot retrieve post');
 ok(String(q.channelId??q.channel?.id??'')===channel.id,'post channel mismatch');
 ok(String(q.text??'').trim()===p.text.trim(),'post caption mismatch');
 ok(Array.isArray(q.assets)&&q.assets.some(a=>String(a.type??'').toLowerCase()==='video'&&a.source),'post has no visible video');
 if(p.platform==='youtube')ok(q.metadata?.title===p.title,'post title mismatch');
 return {id:String(q.id),status:String(q.status??''),dueAt:q.dueAt??null,sentAt:q.sentAt??null,externalLink:q.externalLink??null};
}
async function media(id){
 const urls=[`https://drive.google.com/uc?export=download&id=${id}`,`https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,`https://drive.google.com/uc?export=download&id=${id}&confirm=t`,`https://docs.google.com/uc?export=download&id=${id}`];
 const failures=[];
 for(const url of urls){try{
  const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(120000)});ok(r.ok,`HTTP ${r.status}`);const ct=(r.headers.get('content-type')??'').toLowerCase();ok(ct.startsWith('video/')||ct.includes('octet-stream'),'not video');ok(r.body,'empty body');
  const h=crypto.createHash('sha256');let n=0;for await(const part of r.body){n+=part.length;ok(n<=BYTES,'too large');h.update(part);}ok(n===BYTES&&h.digest('hex')===SHA,'checksum mismatch');return {url,bytes:n,contentType:ct,failures};
 }catch(e){failures.push(String(e?.message??e).slice(0,200));}}
 throw new Error(`No anonymous copy URL passed: ${failures.join('; ')}`);
}
function headers(token){return {Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Knot-Antartika/1.0'};}
async function api(url,options,timeout=30000){try{return await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(timeout)});}catch{throw new Error('GitHub handshake network error');}}
async function handshake(token,nonce,pub){
 const body={name:'Antartika secure input',head_sha:process.env.GITHUB_SHA,status:'in_progress',output:{title:'Ephemeral public key',summary:JSON.stringify({nonce,public_key_b64:Buffer.from(pub).toString('base64')})}};
 const r=await api(`https://api.github.com/repos/${REPO}/check-runs`,{method:'POST',headers:{...headers(token),'Content-Type':'application/json'},body:JSON.stringify(body)});ok(r.ok,`check create HTTP ${r.status}`);const j=await r.json();ok(Number.isSafeInteger(j.id),'check id missing');return j.id;
}
async function waitEnvelope(token,req,privateKey){
 const url=`https://api.github.com/repos/${REPO}/contents/${ENVELOPE}?ref=${encodeURIComponent(BRANCH)}`, deadline=Date.now()+12*60*1000;
 while(Date.now()<deadline){
  const r=await api(url,{headers:headers(token)});if(r.status===404){await new Promise(x=>setTimeout(x,5000));continue;}ok(r.ok,`envelope HTTP ${r.status}`);
  const j=await r.json();const payload=JSON.parse(Buffer.from(j.content??'','base64').toString('utf8'));
  if(payload.nonce!==req.nonce){await new Promise(x=>setTimeout(x,5000));continue;}
  ok(typeof payload.envelope_b64==='string'&&payload.envelope_b64.length<30000,'bad ciphertext');
  return validateSecret(JSON.parse(decryptBytes(Buffer.from(payload.envelope_b64,'base64'),privateKey).toString('utf8')),req);
 }
 throw new Error('encrypted input wait timed out');
}
async function closeHandshake(token,id,success){try{await api(`https://api.github.com/repos/${REPO}/check-runs/${id}`,{method:'PATCH',headers:{...headers(token),'Content-Type':'application/json'},body:JSON.stringify({status:'completed',conclusion:success?'success':'failure',output:{title:'Handshake closed',summary:'Ephemeral key expired.'}})});}catch{}}
async function main(){
 const reportPath=process.env.KNOT_REPORT_PATH??'/tmp/knot-antartika-now-report.json';
 const report={mission:'antartika-rev2-now-2026-11-07',action:null,status:'FAIL',events:[],posts:[],error:null,at:new Date().toISOString()};
 const write=()=>fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n',{mode:0o600});let checkId,completed=false;
 try{
  const req=JSON.parse(fs.readFileSync(REQUEST,'utf8'));validateRequest(req);report.action=req.action;write();
  ok(process.env.GITHUB_REPOSITORY===REPO&&process.env.GITHUB_TOKEN,'missing GitHub context');ok(process.env.BUFFER_API_KEY,'missing Buffer key');
  const kp=crypto.generateKeyPairSync('rsa',{modulusLength:3072,publicKeyEncoding:{type:'spki',format:'pem'},privateKeyEncoding:{type:'pkcs8',format:'pem'}});
  checkId=await handshake(process.env.GITHUB_TOKEN,req.nonce,kp.publicKey);console.log('Secure input ready; waiting for encrypted envelope.');
  const secret=await waitEnvelope(process.env.GITHUB_TOKEN,req,kp.privateKey);
  const orgs=listOrganizations().filter(o=>o.id),configured=process.env.BUFFER_ORGANIZATION_ID;
  const org=configured?(ok(orgs.some(o=>String(o.id)===String(configured)),'configured org absent'),String(configured)):(ok(orgs.length===1,'organization ambiguous'),String(orgs[0].id));
  const channels=selectChannels(listChannels(org));const queue=listPosts(org);const gate=inspectQueue(queue,secret.posts,channels);
  report.channels=channels;report.queue={count:queue.length,items:queue.map(q=>({id:q.id,status:q.status,channelService:q.channelService,sentAt:q.sentAt??null,dueAt:q.dueAt??null,externalLink:q.externalLink??null})),collisions:gate.collisions,unknownTimes:gate.unknownTimes};
  if(req.action==='inspect'){
   for(const p of secret.posts)if(gate.mine[p.platform])report.posts.push({platform:p.platform,outcome:'EXISTING',...readPost(gate.mine[p.platform].id,p,channels[p.platform])});
   report.status='INSPECTED';write();completed=true;console.log('Read-only inspection complete; no posts created.');return;
  }
  ok(gate.collisions.length===0,'unapproved nearby post in queue');ok(gate.unknownTimes.length===0,'posts with unknown timing require manual review');
  const verified=await media(secret.mediaId);report.media={status:'PASS',bytes:verified.bytes,sha256:SHA,contentType:verified.contentType,failures:verified.failures};
  for(const p of secret.posts){const r=call(['posts','create','--json',JSON.stringify(payload(secret,p,channels[p.platform].id,verified.url)),'--dry-run']);ok(r.ok,`dry-run ${p.platform} failed: ${r.diagnostic}`);}
  report.events.push({name:'payload_dry_run',status:'PASS'});
  if(req.action==='preflight'){report.status='PREFLIGHT_PASS';write();completed=true;console.log('Preflight passed; no posts created.');return;}
  for(const p of secret.posts){
   if(gate.mine[p.platform]){report.posts.push({platform:p.platform,outcome:'ALREADY_EXISTS',...readPost(gate.mine[p.platform].id,p,channels[p.platform])});write();continue;}
   report.posts.push({platform:p.platform,outcome:'CREATE_IN_PROGRESS'});write();
   const r=call(['posts','create','--json',JSON.stringify(payload(secret,p,channels[p.platform].id,verified.url)),'--fields','post.id,post.status,post.channelId']);
   if(!r.ok){report.posts.at(-1).outcome='CREATE_UNCERTAIN';write();throw new Error(`Create ${p.platform} failed or timed out; reconcile before retry: ${r.diagnostic}`);}
   const created=findPost(r.value);if(!created?.id){report.posts.at(-1).outcome='CREATE_UNCERTAIN';write();throw new Error(`Create ${p.platform} returned no id; reconcile before retry`);}
   report.posts.at(-1)={platform:p.platform,outcome:'CREATED_NOT_VERIFIED',id:String(created.id)};write();
   const checked=readPost(created.id,p,channels[p.platform]);report.posts[report.posts.length-1]={platform:p.platform,outcome:'CREATED_AND_READ_BACK',...checked};write();
  }
  report.status='SUBMITTED';write();completed=true;console.log('Both posts submitted or already present; final publication is not assumed.');
 }catch(e){report.error=String(e?.stack??e);write();console.error('Stopped; encrypted report has details. Do not blindly retry.');process.exitCode=1;}
 finally{if(checkId)await closeHandshake(process.env.GITHUB_TOKEN,checkId,completed);}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
