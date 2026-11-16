import assert from 'node:assert/strict';
import {ENDING_SHOTS, endingFrame} from '../src/ending-timeline.js';
const VO2_START=16309, FULL_DURATION=20398;
assert.equal(ENDING_SHOTS[0].start, 0);
assert.equal(new Set(ENDING_SHOTS.map(s=>s.id)).size, ENDING_SHOTS.length);
for (let i=0;i<ENDING_SHOTS.length;i++) {
 const shot=ENDING_SHOTS[i];
 assert.ok(shot.end>shot.start, shot.id);
 if(i) assert.equal(endingFrame(shot.start),endingFrame(ENDING_SHOTS[i-1].end),`gap at ${shot.id}`);
}
assert.equal(VO2_START+endingFrame(ENDING_SHOTS.at(-1).end),FULL_DURATION);
assert.equal(ENDING_SHOTS.find(s=>s.id==='home').start,49);
console.log(`${ENDING_SHOTS.length} VO02 shots contiguous through frame ${FULL_DURATION}; home begins at 49 s`);
