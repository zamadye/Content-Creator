import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {createMotorcycle} from '../src/motorcycle.js';
import {createRiggedEntity,poseSeated} from '../src/rigged-entity.js';
import {holdMotorcycleGrips} from '../src/arm-ik.js';
const data=JSON.parse(fs.readFileSync('public/makehuman/rigged-body.json','utf8'));
const scene=new THREE.Scene(),bike=new THREE.Group();scene.add(bike);
const {model}=createMotorcycle();bike.add(model);
const rider=createRiggedEntity(data,null,[]);rider.mesh.scale.setScalar(.105);rider.mesh.position.set(0,1.04,.05);rider.mesh.rotation.y=Math.PI;bike.add(rider.mesh);
function pose(){
 poseSeated(rider.bones);rider.bones.spine01.rotation.x=.35;
 rider.bones['upperarm01.L'].rotation.set(0,0,-.65);rider.bones['upperarm01.R'].rotation.set(0,0,.65);
 holdMotorcycleGrips(rider,model);
 const result={};for(const [side,z] of [['L',-.26],['R',.26]]){
  const target=model.localToWorld(new THREE.Vector3(.45,1.2944,z));
  const end=rider.bones[`wrist.${side}`].getWorldPosition(new THREE.Vector3());result[side]=end.distanceTo(target);
 }
 return result;
}
const a=pose(),b=pose();for(const side of ['L','R']){
 assert.ok(Number.isFinite(a[side]));assert.ok(Math.abs(a[side]-b[side])<1e-8,`pose drift ${side}`);
 assert.ok(a[side]<.10,`Wrist too far from handlebar: ${side} ${a[side]}`);
}
console.log('Wrist/handlebar errors (metres):',a);
