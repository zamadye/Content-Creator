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
function main(){
 try{
  const opts=args(process.argv.slice(2));
  const sb=fs.readFileSync(scriptPath),ab=fs.readFileSync(auditPath),pb=fs.readFileSync(planPath),script=JSON.parse(sb),plan=JSON.parse(pb),manifest=JSON.parse(fs.readFileSync(manifestPath));
  const check=spawnSync('python3',[path.join(root,'editorial-engine/pipeline/script-review/audit.py'),'--script',scriptPath,'--review',auditPath],{encoding:'utf8',timeout:10000});
  let audit;try{audit=JSON.parse(check.stdout)}catch{throw new Error('Sentence audit did not run correctly')}
  const issues=validatePlan(script,plan,manifest);if(check.status!==0||audit.mechanical!=='PASS')issues.push('Sentence audit coverage failed.');
  let approval=null;if(opts.review)approval=JSON.parse(fs.readFileSync(opts.review,'utf8'));
  const human=checkHumanReview(approval,sb,ab,pb),media=inspectMedia(manifest,opts.mediaDir);
  const out={stage:opts.stage,structure:issues.length?'FAIL':'PASS',issues,sentence_audit:audit.mechanical,
   human_review:human.allowed?'PASS':'NOT TESTED / NEEDS REVIEW',human_issues:human.issues,
   audience_response:'NOT TESTED',rights_and_attribution:manifest.rights,media,
   implementation:'Motion/layout and review gate only; production renderer NOT IMPLEMENTED.',
   script_sha256:sha256(sb),audit_sha256:sha256(ab),plan_sha256:sha256(pb)};
  if(opts.stage==='voice'&&!human.allowed)issues.push('Voice blocked until real human review of exact script, audit and storyboard.');
  if(opts.stage==='render')issues.push('Render blocked: production renderer, voice, timings and full human review not completed.');
  if(opts.stage!=='planning'&&media.some(x=>x.status!=='PASS HASH'))issues.push('Required private source footage missing or changed.');
  out.issues=issues;if(issues.length)out.structure='FAIL';console.log(JSON.stringify(out,null,2));if(issues.length)process.exitCode=1;
 }catch(e){console.error(`Preflight failed: ${e.message}`);process.exitCode=2}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main();
