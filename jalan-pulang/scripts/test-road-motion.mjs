import assert from 'node:assert/strict';
import {positiveModulo,sceneryZ,rightBendX} from '../src/road-motion.js';
for(const period of [36,40])for(const travel of [0,39,40,41,120,9000])for(const base of [0,10,30]){
 const z=sceneryZ(base,travel,period);assert.ok(z<=4 && z>4-period,`tree outside cycle: ${z}`);
 assert.ok(Math.abs(positiveModulo(base-travel,period)-positiveModulo(base-travel+period,period))<1e-8);
}
assert.equal(rightBendX(0),0);assert.ok(rightBendX(-10)>0);assert.ok(rightBendX(-20)>rightBendX(-10));
console.log('Scenery wrapping and right bend pass across multiple cycles');
