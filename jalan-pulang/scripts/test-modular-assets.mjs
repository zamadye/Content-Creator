import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import validator from 'gltf-validator';
import {ASSETS} from '../src/asset-catalog.js';
import {validateStage} from '../src/stage-schema.js';
const publicDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../public');
const props=JSON.parse(await fs.readFile(new URL('../stories/modular-stage.json',import.meta.url),'utf8'));
assert.equal(validateStage(props.stage).durationInFrames,150);
for(const mutate of [s=>s.instances[0].asset='missing',s=>s.instances[0].scale=0,s=>s.camera.from=[0,1],s=>s.instances[0].unknown=1]) {
 const s=structuredClone(props.stage);mutate(s);assert.throws(()=>validateStage(s));
}
for(const [id,asset] of Object.entries(ASSETS)){
 const filename=path.resolve(publicDir,asset.uri);assert.ok(filename.startsWith(publicDir+path.sep));
 const gltf=JSON.parse(await fs.readFile(filename,'utf8'));
 assert.ok(gltf.materials.every(m=>m.pbrMetallicRoughness?.baseColorTexture && m.pbrMetallicRoughness?.metallicRoughnessTexture && m.normalTexture));
 const report=await validator.validateString(JSON.stringify(gltf),{uri:asset.uri,externalResourceFunction:async uri=>{
  const resolved=path.resolve(path.dirname(filename),decodeURIComponent(uri));
  if(!resolved.startsWith(publicDir+path.sep))throw Error('Asset dependency outside public');
  return new Uint8Array(await fs.readFile(resolved));
 }});
 if(report.issues.numErrors)console.error(report.issues.messages);
 assert.equal(report.issues.numErrors,0,`${id}: glTF validator errors`);
 console.log(`${id}: glTF validation OK (${report.issues.numWarnings} warnings), status ${asset.status}`);
}
console.log('Stage schema tests passed');
