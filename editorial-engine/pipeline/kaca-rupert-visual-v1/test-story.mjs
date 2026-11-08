import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {hammer,crackPath,shard,step} from './motion.mjs';
const s=JSON.parse(fs.readFileSync(new URL('../../content/recovered/kaca-pangeran-rupert-visual-v1.json',import.meta.url),'utf8'));

test('private source has first question, real payoff callback and 12 object-mapped scenes',()=>{
 assert.match(s.status,/DRAF PRIVAT/);assert.match(s.narrator,/voice-05/);assert.equal(s.scenes.length,12);
 assert.equal(s.scenes[0].narration,'Palu kalah sama kaca? Kok bisa?');assert.equal(s.scenes[0].payoffScene,'S04');
 assert.match(s.scenes[0].action,/Frame 0/);assert.match(s.scenes[3].action,/S01/);
 const ids=new Set(s.sources.map(x=>x.id));for(const x of s.scenes){assert.ok(x.action&&x.narration&&new Set(x.objectMap).size>=2,x.id);for(const id of x.sourceRefs)assert.ok(ids.has(id),id)}
 assert.match(s.scenes.at(-1).narration,/ikuti knot theory\.$/);assert.match(s.safety,/Jangan meniru/);
});
test('hammer has a fixed radius and reaches the designed contact point',()=>{
 const w=[380,900],target=[535,735];let r;
 for(const p of [0,.25,.5,.75,1]){const v=hammer(w,target,p);const dist=Math.hypot(v.x-w[0],v.y-w[1]);r??=dist;assert.ok(Math.abs(dist-r)<1e-9)}
 const end=hammer(w,target,1);assert.ok(Math.hypot(end.x-target[0],end.y-target[1])<1e-9);
});
test('fracture starts at tail and progressively reaches head',()=>{
 const first=crackPath(0),middle=crackPath(.5),last=crackPath(1);
 assert.match(first,/^M338\.00 -24\.00/);assert.ok(middle.length>first.length);assert.match(last,/L-78\.00 35\.00$/);assert.ok(last.length>middle.length);
});
test('shards move deterministically and diverge after fracture',()=>{
 for(let i=0;i<26;i++){const a=shard(i,0),b=shard(i,1);assert.deepEqual(b,shard(i,1));assert.ok(Math.hypot(b.x-a.x,b.y-a.y)>1)}
 assert.equal(step(0,0,2),0);assert.equal(step(2,0,2),1);
});
