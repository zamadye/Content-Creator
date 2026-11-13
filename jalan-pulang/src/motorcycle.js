import * as THREE from 'three';
import {buildMotorcycle} from './vendor/motorcycle/adapter/builder.js';

// A deterministic step-through stand-in. The generator is MIT-licensed, see
// vendor/motorcycle/LICENSE and public/models/PROVENANCE.md. This is not an
// exact Honda Supra; no brand or photo textures are implied.
export function createMotorcycle(){
 const p={form:'scooter',wheelbase:1.10,wheelR:.42,rake:.25,stance:.64,detailVersion:1,wheelType:'spoke',mirrorsOn:true,brakesOn:true,coolingOn:true,fendersOn:true,lightsOn:true,screenOn:false,fairingOn:false,luggageOn:false};
 const mat=(color,roughness=.7,metalness=0,extra={})=>new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});
 const m={body:mat('#6d2b31',.42,.35),frame:mat('#232c2b',.7,.45),engine:mat('#454b49',.6,.55),seat:mat('#191e1d',.92),tire:mat('#181b1b',.96),rim:mat('#9ba4a1',.42,.7),chrome:mat('#a7b1af',.3,.8),glass:mat('#ffe7b0',.35,0,{emissive:'#e0aa5a',emissiveIntensity:1}),tail:mat('#a91b23',.5,0,{emissive:'#7a1010',emissiveIntensity:.8}),signal:mat('#d98c31',.5),screen:mat('#829395',.4,.1)};
 const model=buildMotorcycle(p,m);model.rotation.y=Math.PI/2;
 const wheels=[model.getObjectByName('Front wheel'),model.getObjectByName('Rear wheel')];
 if(wheels.some(w=>!w))throw Error('Motorcycle generator did not create both wheel pivots');
 return {model,wheels};
}
