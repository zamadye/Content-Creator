import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Checks specification only; cannot judge actual animation, audio or retention.
const file=new URL('../../content/recovered/awan-500-ton-rig-v3.json',import.meta.url);
const s=JSON.parse(fs.readFileSync(file,'utf8'));
const ix=id=>s.scenes.findIndex(x=>x.id===id);

test('V3 is a separate private draft and does not replace V2',()=>{
 assert.equal(s.id,'awan-500-ton-rig-v3'); assert.equal(s.derivedFrom,'awan-500-ton-rig-v2');
 assert.equal(s.preserveOriginal,true); assert.match(s.status,/DRAF PRIVAT/); assert.match(s.narrator,/voice-05/);
});

test('opening entity and question return to the marked climax',()=>{
 assert.equal(s.scenes.length,10); assert.equal(s.scenes[0].id,'S01');
 assert.equal(s.scenes[0].narration,'Lima ratus ton air melayang? Kok bisa?');
 assert.equal(s.scenes[0].payoffScene,'S04'); assert.match(s.scenes[0].action,/Frame 0.*awan/i);
 assert.match(s.scenes[ix('S04')].beat,/PUNCAK/); assert.match(s.scenes[ix('S04')].action,/dari S01/);
});

test('mechanism precedes the two calculation scenes',()=>{
 assert.ok(ix('S04')<ix('S05') && ix('S05')<ix('S06'));
 assert.ok(ix('S06')<ix('S07') && ix('S07')<ix('S08'));
 assert.match(s.scenes[ix('S05')].narration,/Gravitasi/);
 assert.match(s.scenes[ix('S06')].narration,/udara bergerak naik/);
});

test('every scene has actions, multiple props and valid source references',()=>{
 assert.equal(new Set(s.scenes.map(x=>x.id)).size,s.scenes.length);
 const refs=new Set(s.sources.map(x=>x.id));
 for(const scene of s.scenes){
  assert.ok(scene.action && scene.narration,scene.id); assert.ok(scene.objectMap.includes('Host'),scene.id);
  assert.ok(new Set(scene.objectMap).size>=2,scene.id);
  for(const r of scene.sourceRefs)assert.ok(refs.has(r),`${scene.id}: ${r}`);
 }
 assert.match(s.scenes.at(-1).narration,/ikuti knot theory\.$/);
 assert.match(s.scenes.at(-1).action,/ikuti knot theory/);
 assert.match(s.estimateScope,/satu contoh/); assert.match(s.estimateScope,/tidak termasuk massa udara/);
});
