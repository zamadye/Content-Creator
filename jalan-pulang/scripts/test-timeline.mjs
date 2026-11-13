import assert from 'node:assert/strict';
import {storyShots,validateShots} from '../src/story-timeline.js';
assert.equal(validateShots(),543);
const reveal=storyShots.find(s=>s.shot==='entity-reveal');
assert.deepEqual([reveal.from,reveal.to],[295,305]);
assert.throws(()=>validateShots([{from:0,to:1},{from:2,to:3}]),/Gap or overlap/);
assert.throws(()=>validateShots([{from:0,to:0}]),/Invalid duration/);
console.log(`${storyShots.length} shots, contiguous 0–543 s; face-reveal 295–305 s`);
