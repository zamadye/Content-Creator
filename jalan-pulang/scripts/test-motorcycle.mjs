import assert from 'node:assert/strict';
import {createMotorcycle} from '../src/motorcycle.js';
const {model,wheels}=createMotorcycle();
model.updateMatrixWorld(true);
assert.equal(wheels.length,2);assert.notEqual(wheels[0],wheels[1]);
assert.deepEqual(wheels.map(w=>w.name),['Front wheel','Rear wheel']);
let vertices=0,meshes=0;
model.traverse(o=>{
 if(!o.isMesh)return;
 meshes++;const p=o.geometry.getAttribute('position');assert.ok(p);
 for(const value of p.array)assert.ok(Number.isFinite(value),'Non-finite motorcycle vertex');
 vertices+=p.count;
});
assert.ok(meshes>0&&vertices>0);
const rear=wheels[1].rotation.z;wheels[0].rotation.z=1;
assert.equal(wheels[1].rotation.z,rear,'Wheels must rotate independently');
console.log(`Motorcycle: ${meshes} meshes, ${vertices} vertices, two independent wheel pivots`);
