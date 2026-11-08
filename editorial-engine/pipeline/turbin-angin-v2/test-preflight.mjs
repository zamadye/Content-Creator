import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openingPeak,returnPeak,peakState,PEAK_CUT,FOOTAGE_WINDOW,fitsNativeLandscape} from './motion.mjs';
import {checkHumanReview,sha256} from './review-gate.mjs';
import {validatePlan,validatePrepared} from './preflight.mjs';
const script=Buffer.from('{"id":"example","scenes":[]}'),audit=Buffer.from('{"scriptId":"example","items":[]}'),plan=Buffer.from('{"shots":[]}');
const approval=()=>({decision:'PASS',reviewerRole:'human editor',reviewMethod:'review in conversation',evidence:'Actual reviewer decision, synthetic test only',reviewedAt:'2026-02-28',scriptSha256:sha256(script),auditSha256:sha256(audit),planSha256:sha256(plan),scope:['script','sentence-audit','storyboard','factual-scope']});
test('opening cuts a genuine prefix of the same continuous peak',()=>{
 assert.deepEqual(openingPeak(1),returnPeak(0));assert.equal(openingPeak(1).progress,PEAK_CUT);assert.equal(returnPeak(1).rotorSpeed,0);
 let last=-1;for(let i=0;i<=100;i++){const s=peakState(i/100);assert.ok(s.angleRadians>=last);last=s.angleRadians;assert.ok(s.pitchDegrees>=8&&s.pitchDegrees<=85)}
 assert.throws(()=>peakState(NaN),RangeError);
});
test('landscape window fits frame without upscaling or aspect-ratio distortion',()=>{
 assert.equal(fitsNativeLandscape(),true);assert.equal(FOOTAGE_WINDOW.width/FOOTAGE_WINDOW.height,16/9);
 assert.equal(fitsNativeLandscape({...FOOTAGE_WINDOW,width:2000}),false);
 assert.equal(fitsNativeLandscape({...FOOTAGE_WINDOW,height:1000}),false);
});
test('no voice approval without a real, complete human review record',()=>{
 assert.equal(checkHumanReview(null,script,audit,plan).allowed,false);
 assert.equal(checkHumanReview(approval(),script,audit,plan).allowed,true);
 for(const change of [{decision:'NOT TESTED'},{reviewerRole:'tbd'},{reviewMethod:''},{evidence:'todo'},{reviewedAt:'2026-02-31'},{scope:['script']}])assert.equal(checkHumanReview({...approval(),...change},script,audit,plan).allowed,false);
});
test('even one changed byte invalidates human review',()=>{
 assert.equal(checkHumanReview(approval(),Buffer.from(script.toString()+' '),audit,plan).allowed,false);
 assert.equal(checkHumanReview(approval(),script,Buffer.from(audit.toString()+' '),plan).allowed,false);
 assert.equal(checkHumanReview(approval(),script,audit,Buffer.from(plan.toString()+' ')).allowed,false);
});
test('plan checks scene order, object coverage and known footage',()=>{
 const s={scenes:[{id:'S01',narration:'Halo.',objectMap:['host','rotor']},{id:'S02',narration:'Lanjut.',objectMap:['bilah','angin']}]};
 const p={shots:[{sceneId:'S01',footage:null},{sceneId:'S02',footage:'known'}]},m={items:[{id:'known'}]};
 assert.deepEqual(validatePlan(s,p,m),[]);
 assert.ok(validatePlan(s,{shots:[...p.shots].reverse()},m).length);
 assert.ok(validatePlan(s,{shots:[p.shots[0],{sceneId:'S02',footage:'unknown'}]},m).length);
 const bad=structuredClone(s);bad.scenes[0].objectMap=['one'];assert.ok(validatePlan(bad,p,m).length);
});
test('prepared private draft checks hashes, contiguous frames, source duration and exact subtitles',()=>{
 const story={scenes:[{id:'S01',narration:'Halo dunia.'},{id:'S02',narration:'Lanjut lagi.'}]};
 const shotPlan={shots:[{sceneId:'S01',footage:null},{sceneId:'S02',footage:'f'}]};
 const manifest={items:[{id:'f',probe:{duration_seconds:2}}]};
 const hashes={scriptSha256:'s',auditSha256:'a',planSha256:'p',reviewSha256:'r'};
 const data={...hashes,fps:30,speechTempo:1,totalFrames:60,duration:2,openingVisualCutFrame:15,openingCueEndEstimate:.9,
  timeline:[{id:'S01',footage:null,sourceOffset:0,startFrame:0,endFrame:30,start:0,end:1},{id:'S02',footage:'f',sourceOffset:0,startFrame:30,endFrame:60,start:1,end:2}],
  cues:[{start:0,end:.9,lines:['Halo dunia.']},{start:1,end:1.9,lines:['Lanjut lagi.']}]};
 assert.deepEqual(validatePrepared(data,story,shotPlan,manifest,hashes),[]);
 const mutations=[
  d=>d.reviewSha256='wrong',d=>d.timeline[1].startFrame=29,
  d=>d.cues[1].start=.8,d=>d.cues[0].lines=['Halo salah.'],
  d=>d.speechTempo=1.1,d=>d.duration=NaN,d=>d.timeline[1].sourceOffset=1.5,d=>d.openingVisualCutFrame=31,
  d=>d.openingCueEndEstimate=.7,d=>d.cues[0].end=1.05,
 ];
 for(const mutate of mutations){const bad=structuredClone(data);mutate(bad);assert.ok(validatePrepared(bad,story,shotPlan,manifest,hashes).length)}
 assert.ok(validatePrepared(data,story,shotPlan,{items:[{id:'f',probe:{duration_seconds:.2}}]},hashes).length);
 assert.ok(validatePrepared(null,story,shotPlan,manifest,hashes).length);
});
