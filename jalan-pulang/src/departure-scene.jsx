import React,{useEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {createMotorcycle} from './motorcycle';
import {createRiggedEntity,loadRidingGarments,poseSeated} from './rigged-entity';
import {holdMotorcycleGrips} from './arm-ik';

// Departure from Dimas's boarding house, timed to the opening narration.
export const DepartureScene=({resolutionScale=1})=>{
 const canvas=useRef(null),state=useRef(null),frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Load departure')),[ready,setReady]=useState(false);
 useEffect(()=>{let dead=false,renderer,scene;
  (async()=>{
   renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});renderer.setSize(Math.round(width*resolutionScale),Math.round(height*resolutionScale),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   scene=new THREE.Scene();scene.background=new THREE.Color('#14262b');const camera=new THREE.PerspectiveCamera(40,width/height,.1,100);
   scene.add(new THREE.HemisphereLight('#a3c2c0','#1b241b',.8));const moon=new THREE.DirectionalLight('#98b9b8',1);moon.position.set(-5,8,5);scene.add(moon);
   const load=async(n,c=false,repeat=[1,1])=>{const t=await new THREE.TextureLoader().loadAsync(staticFile('pbr/'+n));t.colorSpace=c?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t};
   const [wall,wallN,wallR,road,roadN,roadR,wood,woodN,woodR,response,garments]=await Promise.all([
    load('wall_plaster_dirty_Color.png',true,[3,2]),load('wall_plaster_dirty_NormalGL.jpg',false,[3,2]),load('wall_plaster_dirty_Roughness.jpg',false,[3,2]),
    load('street_asphalt_Color.png',true,[3,10]),load('street_asphalt_NormalGL.jpg',false,[3,10]),load('street_asphalt_Roughness.jpg',false,[3,10]),
    load('wood_planks_diffuse.jpg',true),load('wood_planks_normal.jpg'),load('wood_planks_rough.jpg'),fetch(staticFile('makehuman/rigged-body.json')),loadRidingGarments(staticFile)]);
   if(!response.ok)throw Error('Departure character rig unavailable');const data=await response.json();if(dead)return;
   const material=(map,normalMap,roughnessMap,color)=>new THREE.MeshStandardMaterial({map,normalMap,roughnessMap,color,roughness:1});
   const plaster=material(wall,wallN,wallR,'#9da39b'),asphalt=material(road,roadN,roadR,'#7c8981'),timber=material(wood,woodN,woodR,'#7f6650'),dark=new THREE.MeshStandardMaterial({color:'#293431',roughness:.8});
   const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o};
   box(28,.12,36,asphalt,0,-.06,-8);box(7,3.6,.22,plaster,-4,1.8,-5);box(7,.18,2,timber,-4,3.4,-4);box(.15,3.3,.15,timber,-.7,1.65,-3.1);
   box(1.3,2.5,.14,timber,-4,1.25,-4.84);for(let x of [-6,-2]){box(1.3,1.1,.1,timber,x,1.9,-4.83);box(1.1,.9,.05,new THREE.MeshStandardMaterial({color:'#bd9c5f',emissive:'#754a18',emissiveIntensity:.65}),x,1.9,-4.74)}
   const bulb=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),new THREE.MeshBasicMaterial({color:'#ffe1a3'}));bulb.position.set(-4,3,-3.7);scene.add(bulb);const lamp=new THREE.PointLight('#ffc277',14,9,2);lamp.position.copy(bulb.position);scene.add(lamp);
   const bike=new THREE.Group();scene.add(bike);const generated=createMotorcycle();bike.add(generated.model);const spot=new THREE.SpotLight('#ffe3ab',25,20,Math.PI/7,.7,1.5);spot.position.set(0,1,-.8);spot.target.position.set(0,0,-10);bike.add(spot,spot.target);
   const outfit=garments.map(g=>({data:g.data,material:g.material.clone()})),dimas=createRiggedEntity(data,null,outfit);dimas.mesh.material.color.set('#967765');dimas.mesh.scale.setScalar(.105);bike.add(dimas.mesh);
   state.current={scene,renderer,camera,bike,bikeModel:generated.model,wheels:generated.wheels,dimas,spot};setReady(true);continueRender(handle);
  })().catch(e=>{if(!dead)cancelRender(e)});
  return()=>{dead=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()});renderer?.dispose()};
 },[handle,width,height,resolutionScale]);
 useEffect(()=>{if(!ready||!state.current)return;const {scene,renderer,camera,bike,bikeModel,wheels,dimas,spot}=state.current,t=frame/fps;
  const clamp=x=>Math.min(1,Math.max(0,x)),mount=clamp((t-1)/3),departure=Math.max(0,t-5);
  bike.position.z=-departure*departure*.16;bike.rotation.z=-.08*(1-clamp(departure));
  for(const wheel of wheels)wheel.rotation.z=departure*departure*.16/.34;
  poseSeated(dimas.bones,mount);dimas.mesh.position.set(-.8*(1-mount),.86+.18*mount,.8*(1-mount)+.05);dimas.mesh.rotation.y=.35+(Math.PI-.35)*mount;
  dimas.bones.spine01.rotation.x=.35*mount;dimas.bones.neck01.rotation.x=-.16*mount;dimas.bones.head.rotation.x=-.16*mount;
  dimas.bones['upperarm01.L'].rotation.set(0,0,-.62-.03*mount);dimas.bones['upperarm01.R'].rotation.set(0,0,.62+.03*mount);
  holdMotorcycleGrips(dimas,bikeModel,mount);spot.intensity=t>=4?25:0;
  camera.position.set(3.9,2.05,5.1-Math.min(departure*.12,.6));camera.lookAt(-.8,1.15,bike.position.z-.5);renderer.render(scene,camera);
 },[ready,frame,fps]);
 return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
