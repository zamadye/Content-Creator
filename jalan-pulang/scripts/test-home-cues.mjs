import assert from 'node:assert/strict';
import fs from 'node:fs';
import {HOME_KNOCK_TIMES,cueMilliseconds} from '../src/home-cues.js';
const script=fs.readFileSync('scripts/mix-story-guide.sh','utf8');
assert.equal(HOME_KNOCK_TIMES.length,3);
for(const t of HOME_KNOCK_TIMES){const ms=cueMilliseconds(t);assert.ok(script.includes(`adelay=${ms}|${ms}[knock`),`Audio/animation mismatch at ${t}s (${ms} ms)`)}
assert.ok(HOME_KNOCK_TIMES.every((t,i)=>!i||t>HOME_KNOCK_TIMES[i-1]));
console.log('Three door knocks have matching animation and sound-design cue times');
