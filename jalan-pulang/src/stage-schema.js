import {ASSETS} from './asset-catalog.js';
const fail=(m)=>{throw new Error(`Stage: ${m}`)};
const obj=x=>x && typeof x==='object' && !Array.isArray(x);
const vec=x=>Array.isArray(x)&&x.length===3&&x.every(Number.isFinite);
const only=(x,keys,label)=>{for(const k of Object.keys(x))if(!keys.includes(k))fail(`${label}: unknown field ${k}`)};
export function validateStage(stage) {
 if(!obj(stage))fail('expected object');
 only(stage,['version','fps','width','height','duration','camera','instances'],'stage');
 if(stage.version!==1||stage.fps!==30)fail('version 1 and fps 30 required');
 for(const k of ['width','height']) if(!Number.isSafeInteger(stage[k])||stage[k]<=0||stage[k]%2)fail(`invalid ${k}`);
 if(!Number.isSafeInteger(stage.duration)||stage.duration<=0)fail('invalid duration');
 if(!obj(stage.camera))fail('camera required');only(stage.camera,['from','to','target','fov'],'camera');
 if(!vec(stage.camera.from)||!vec(stage.camera.to)||!vec(stage.camera.target)||!Number.isFinite(stage.camera.fov)||stage.camera.fov<10||stage.camera.fov>100)fail('invalid camera');
 if(!Array.isArray(stage.instances)||!stage.instances.length||stage.instances.length>100)fail('instances must contain 1..100 entries');
 stage.instances.forEach((x,i)=>{if(!obj(x))fail(`instance ${i}: expected object`);only(x,['asset','position','rotationY','scale'],`instance ${i}`);if(!Object.hasOwn(ASSETS,x.asset))fail(`instance ${i}: unknown asset`);if(!vec(x.position)||!Number.isFinite(x.rotationY)||!Number.isFinite(x.scale)||x.scale<=0)fail(`instance ${i}: invalid transform`)});
 return {fps:stage.fps,width:stage.width,height:stage.height,durationInFrames:stage.duration};
}
