#!/usr/bin/env node
/** Offline plan checks and human-review gate. It does not generate media. */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {checkHumanReview,sha256} from './review-gate.mjs';
import {fitsNativeLandscape,openingPeak,returnPeak} from './motion.mjs';
const root=path.resolve(process.cwd()),scriptPath=path.join(root,'editorial-engine/content/proposals/turbin-angin-draf-v1.json'),auditPath=path.join(root,'editorial-engine/content/proposals/turbin-angin-audit-kalimat-v1.json');
const planPath=path.join(root,'editorial-engine/pipeline/turbin-angin-v1/shot-plan.json'),manifestPath=path.join(root,'editorial-engine/pipeline/turbin-angin-v1/footage-manifest.json');
function args(argv){
 const out={stage:'planning',review:null,mediaDir:path.join(root,'google_drive')};
 for(let i=0;i<argv.length;i++){
  if(!['--stage','--review','--media-dir'].includes(argv[i])||i+1>=argv.length)throw new Error('Unknown or incomplete argument');
  const name=argv[i].slice(2);out[name==='media-dir'?'mediaDir':name]=argv[++i];
 }
 if(!['planning','voice','render'].includes(out.stage))throw new Error('Stage must be planning, voice or render');
 return out;
}
export function validatePlan(script,plan,manifest){
 const issues=[];
 if(!Array.isArray(script?.scenes)||!script.scenes.length||!Array.isArray(plan?.shots))return ['Missing scenes or shots.'];
 const ids=script.scenes.map(x=>x.id),shotIds=plan.shots.map(x=>x.sceneId);
 if(new Set(ids).size!==ids.length||ids.some((id,i)=>id!==shotIds[i])||ids.length!==shotIds.length)issues.push('Scenes and shots must match exactly in order.');
 const known=new Set((manifest?.items||[]).map(x=>x.id));
 for(const scene of script.scenes){
  if(!Array.isArray(scene.objectMap)||scene.objectMap.length<2)issues.push(`${scene.id}: at least two mapped objects required.`);
  if(typeof scene.narration!=='string'||!scene.narration.trim())issues.push(`${scene.id}: narration is missing.`);
 }
 for(const shot of plan.shots)if(shot.footage!==null&&!known.has(shot.footage))issues.push(`${shot.sceneId}: footage is not in manifest.`);
 if(!fitsNativeLandscape())issues.push('Footage window is not a native-resolution 16:9 fit.');
 if(JSON.stringify(openingPeak(1))!==JSON.stringify(returnPeak(0)))issues.push('Peak preview and return do not join.');
 return issues;
}
export function inspectMedia(manifest,dir){
 return (manifest.items||[]).map(item=>{
  const expected=path.basename(item.localFilename||''),f=path.join(dir,expected);
  if(expected!==item.localFilename || !expected || !fs.existsSync(f))return {id:item.id,status:'NOT FOUND'};
  const b=fs.readFileSync(f);return {id:item.id,status:b.length===item.size&&sha256(b)===item.sha256?'PASS HASH':'FAIL HASH',bytes:b.length};
 });
}
// This validates timing/data integrity for a PRIVATE draft, not a publication
// decision. It cannot establish pronunciation, sync, factual expertise or rights.
export function validatePrepared(data,script,plan,manifest,hashes){
 const issues=[];
 if(!data||typeof data!=='object')return ['Prepared metadata is missing.'];
 for(const key of ['scriptSha256','auditSha256','planSha256','reviewSha256'])
  if(!hashes[key]||data[key]!==hashes[key])issues.push(`Prepared ${key} does not match reviewed input.`);
 if(data.fps!==30||data.speechTempo!==1||!Number.isInteger(data.totalFrames)||data.totalFrames<=0||!Number.isFinite(data.duration)||Math.abs(data.duration-data.totalFrames/data.fps)>1e-6)issues.push('Invalid frame rate, duration, or changed narration tempo.');
 const scenes=script.scenes||[],shots=plan.shots||[],timeline=data.timeline;
 if(!Array.isArray(timeline)||timeline.length!==scenes.length||timeline.length!==shots.length)issues.push('Prepared timeline does not match script and shot count.');
 else {
  let previous=0;
  for(let i=0;i<timeline.length;i++){
   const t=timeline[i],shot=shots[i],item=(manifest.items||[]).find(x=>x.id===shot.footage);
   if(t.id!==scenes[i].id||t.footage!==shot.footage||!Number.isInteger(t.startFrame)||!Number.isInteger(t.endFrame)||!Number.isFinite(t.start)||!Number.isFinite(t.end)||t.startFrame!==previous||t.endFrame<=t.startFrame||Math.abs(t.start-t.startFrame/data.fps)>1e-6||Math.abs(t.end-t.endFrame/data.fps)>1e-6)issues.push(`${scenes[i].id}: invalid timeline or footage assignment.`);
   if(!Number.isFinite(t.sourceOffset)||t.sourceOffset<0||(!shot.footage&&t.sourceOffset!==0))issues.push(`${scenes[i].id}: invalid source offset.`);
   if(shot.footage&&(!item||!Number.isFinite(item.probe?.duration_seconds)||item.probe.duration_seconds+1e-4<t.sourceOffset+(t.endFrame-t.startFrame)/data.fps))issues.push(`${scenes[i].id}: source missing or shorter than its chosen offset and scene.`);
   previous=t.endFrame;
  }
  if(previous!==data.totalFrames)issues.push('Timeline does not end at totalFrames.');
  if(!Number.isInteger(data.openingVisualCutFrame)||data.openingVisualCutFrame<=0||data.openingVisualCutFrame>=timeline[0].endFrame)issues.push('Opening teaser cut must fall inside the first scene.');
 }
 if(!Array.isArray(data.cues)||!data.cues.length)issues.push('Subtitle cues are missing.');
 else {
  let previous=0;const text=[];
  for(const c of data.cues){
   if(!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<previous||c.end<=c.start||c.end>data.duration||!Array.isArray(c.lines)||c.lines.length<1||c.lines.length>2||c.lines.some(l=>typeof l!=='string'||!l.trim()||l.length>36))issues.push('Invalid or overlapping subtitle cue.');
   previous=c.end;text.push(...(Array.isArray(c.lines)?c.lines:[]));
  }
  const normalize=s=>s.replace(/\s+/g,' ').trim();
  if(normalize(text.join(' '))!==normalize(scenes.map(s=>s.narration).join(' ')))issues.push('Subtitle text differs from approved narration.');
 }
 return issues;
}
function main(){
 try{
  const opts=args(process.argv.slice(2));
  const sb=fs.readFileSync(scriptPath),ab=fs.readFileSync(auditPath),pb=fs.readFileSync(planPath),script=JSON.parse(sb),plan=JSON.parse(pb),manifest=JSON.parse(fs.readFileSync(manifestPath));
  const check=spawnSync('python3',[path.join(root,'editorial-engine/pipeline/script-review/audit.py'),'--script',scriptPath,'--review',auditPath],{encoding:'utf8',timeout:10000});
  let audit;try{audit=JSON.parse(check.stdout)}catch{throw new Error('Sentence audit did not run correctly')}
  const issues=validatePlan(script,plan,manifest);if(check.status!==0||audit.mechanical!=='PASS')issues.push('Sentence audit coverage failed.');
  let rb=null,approval=null;if(opts.review){rb=fs.readFileSync(opts.review);approval=JSON.parse(rb)}
  const human=checkHumanReview(approval,sb,ab,pb),media=inspectMedia(manifest,opts.mediaDir);
  const out={stage:opts.stage,structure:issues.length?'FAIL':'PASS',issues,sentence_audit:audit.mechanical,
   human_review:human.allowed?'PASS':'NOT TESTED / NEEDS REVIEW',human_issues:human.issues,
   audience_response:'NOT TESTED',rights_and_attribution:manifest.rights,media,
   implementation:'Private draft renderer implemented; this preflight is not publication approval.',
   human_audio_video_review:'NOT TESTED',mobile_playback:'NOT TESTED',subtitle_alignment:'ESTIMATED / NEEDS REVIEW',
   script_sha256:sha256(sb),audit_sha256:sha256(ab),plan_sha256:sha256(pb)};
  if(opts.stage!=='planning'&&!human.allowed)issues.push('Voice/render blocked until real human review of exact script, audit and storyboard.');
  if(opts.stage!=='planning'&&media.some(x=>x.status!=='PASS HASH'))issues.push('Required private source footage missing or changed.');
  if(opts.stage==='render'){
   const dir=path.join(root,'.scratch/turbine/render'),file=path.join(dir,'prepared.json');
   const data=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
   issues.push(...validatePrepared(data,script,plan,manifest,{scriptSha256:sha256(sb),auditSha256:sha256(ab),planSha256:sha256(pb),reviewSha256:rb&&sha256(rb)}));
   if(data){
    if(path.resolve(opts.mediaDir)!==path.join(root,'google_drive'))issues.push('Renderer requires the verified media in the root google_drive/ directory.');
    for(const scene of data.timeline||[]){
     const item=(manifest.items||[]).find(x=>x.id===scene.footage);
     const expected=item?path.join(root,'google_drive',item.localFilename):null;
     if(scene.source!==expected)issues.push(`${scene.id}: prepared source path does not match the manifest.`);
    }
    const inputFiles=[['raw narration',path.join(root,'.scratch/turbine/narasi-voice-05.wav'),data.voiceSourceSha256],['prepared narration',path.join(dir,'narasi-utuh.wav'),data.narrationSha256],['score',path.join(dir,'musik-original.wav'),data.scoreSha256]];
    if(data.narration!==inputFiles[1][1]||data.score!==inputFiles[2][1])issues.push('Prepared audio paths do not match private output directory.');
    for(const [label,f,expected] of inputFiles)if(!expected||!fs.existsSync(f)||sha256(fs.readFileSync(f))!==expected)issues.push(`${label}: missing or changed.`);
    const cut=data.openingVisualCutFrame/data.fps,storyStart=data.timeline?.[1]?.start;
    out.visual_teaser_cut_seconds=cut;out.visual_teaser_1_to_3_seconds=Number.isFinite(cut)&&cut>=1&&cut<=3?'PASS':'NEEDS REVIEW';
    out.story_starts_after_full_spoken_question_seconds=storyStart;
    out.full_spoken_opening_length='NEEDS REVIEW: question continues beyond 3 seconds even if the visual teaser cuts earlier';
   }
   if(!fs.existsSync(path.join(root,'editorial-engine/pipeline/turbin-angin-v1/render.tsx')))issues.push('Private renderer missing.');
  }
  out.issues=issues;if(issues.length)out.structure='FAIL';console.log(JSON.stringify(out,null,2));if(issues.length)process.exitCode=1;
 }catch(e){console.error(`Preflight failed: ${e.message}`);process.exitCode=2}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main();
