import React, {useEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {ASSETS} from './asset-catalog';
import {validateStage} from './stage-schema';

function disposeRoots(roots){
 const materials=new Set(),geometries=new Set(),textures=new Set();
 for(const root of roots)root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v)}});
 for(const t of textures)t.dispose();for(const m of materials)m.dispose();for(const g of geometries)g.dispose();
}
export const stageMetadata=({props})=>validateStage(props.stage);
export const ModularStage=({stage})=>{
 validateStage(stage);
 const canvas=useRef(null),state=useRef(null);const frame=useCurrentFrame(),{width,height}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Loading modular assets'));
 const [ready,setReady]=useState(false);
 useEffect(()=>{
  let disposed=false,renderer,scene; const loaded=[];
  (async()=>{
   renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});
   renderer.setSize(width,height,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   scene=new THREE.Scene();scene.background=new THREE.Color('#273b42');
   scene.add(new THREE.HemisphereLight('#dce9ee','#50504c',2));
   const sun=new THREE.DirectionalLight('#fff4d9',3);sun.position.set(5,10,8);scene.add(sun);
   const camera=new THREE.PerspectiveCamera(stage.camera.fov,width/height,.1,200);
   const loader=new GLTFLoader(), cache=new Map();
   for(const inst of stage.instances){
    if(!cache.has(inst.asset))cache.set(inst.asset,loader.loadAsync(staticFile(ASSETS[inst.asset].uri)));
    const gltf=await cache.get(inst.asset);
    if(disposed){if(!loaded.includes(gltf.scene))disposeRoots([gltf.scene]);return;}
    if(!loaded.includes(gltf.scene))loaded.push(gltf.scene);
    const node=gltf.scene.clone(true);node.position.fromArray(inst.position);node.rotation.y=inst.rotationY;node.scale.setScalar(inst.scale);scene.add(node);
   }
   if(disposed)return;state.current={renderer,scene,camera};setReady(true);continueRender(handle);
  })().catch(e=>{if(!disposed)cancelRender(e)});
  return ()=>{disposed=true;state.current=null;disposeRoots(loaded);renderer?.dispose();};
 },[handle,height,width,stage]);
 useEffect(()=>{if(!ready||!state.current)return;const {renderer,scene,camera}=state.current;const a=new THREE.Vector3().fromArray(stage.camera.from),b=new THREE.Vector3().fromArray(stage.camera.to);camera.position.lerpVectors(a,b,stage.duration>1?frame/(stage.duration-1):0);camera.lookAt(...stage.camera.target);renderer.render(scene,camera)},[ready,frame,stage]);
 return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
