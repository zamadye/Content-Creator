import React,{useEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {createMotorcycle} from './motorcycle';
import {createRiggedEntity,loadGarments,poseSeated} from './rigged-entity';

// Ending blocking, not a finished house or final character animation. All timing
// is relative to VO 02 (not the preceding Sequence's local start).
export const HomeScene=({resolutionScale=1,voOffset=42})=>{
 const canvas=useRef(null),state=useRef(null),frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Load home scene')),[ready,setReady]=useState(false);
 useEffect(()=>{let dead=false,scene,renderer;
  (async()=>{
   renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});renderer.setSize(Math.round(width*resolutionScale),Math.round(height*resolutionScale),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   scene=new THREE.Scene();scene.background=new THREE.Color('#111f23');const camera=new THREE.PerspectiveCamera(40,width/height,.1,100);
   scene.add(new THREE.HemisphereLight('#a3c2c0','#1b241b',.8));const moon=new THREE.DirectionalLight('#98b9b8',1);moon.position.set(-5,8,5);scene.add(moon);
   const load=async(n,color=false,repeat=[1,1])=>{const t=await new THREE.TextureLoader().loadAsync(staticFile('pbr/'+n));t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t};
   const [wall,wallN,wallR,wood,woodN,woodR,floor,floorN,floorR,response,garments]=await Promise.all([
    load('wall_plaster_dirty_Color.png',true,[3,2]),load('wall_plaster_dirty_NormalGL.jpg',false,[3,2]),load('wall_plaster_dirty_Roughness.jpg',false,[3,2]),
    load('wood_planks_diffuse.jpg',true),load('wood_planks_normal.jpg'),load('wood_planks_rough.jpg'),
    load('sidewalk_concrete_Color.png',true,[6,6]),load('sidewalk_concrete_NormalGL.jpg',false,[6,6]),load('sidewalk_concrete_Roughness.jpg',false,[6,6]),
    fetch(staticFile('makehuman/rigged-body.json')),loadGarments(staticFile)]);
   if(!response.ok)throw Error(`Home rig HTTP ${response.status}`);const data=await response.json();if(dead)return;
   const pbr=(map,normalMap,roughnessMap,color='#ffffff')=>new THREE.MeshStandardMaterial({map,normalMap,roughnessMap,color,roughness:1});
   const plaster=pbr(wall,wallN,wallR,'#a8a397'),timber=pbr(wood,woodN,woodR,'#8a6850'),concrete=pbr(floor,floorN,floorR,'#858b81'),dark=new THREE.MeshStandardMaterial({color:'#202d2c',roughness:.85});
   const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o};
   box(28,.12,24,concrete,0,-.06,1);box(9,3.8,.25,plaster,0,1.9,-3);box(9,.18,2.5,timber,0,3.4,-1.7);box(9,.25,.3,timber,0,3.65,-1.0);
   box(.16,3.3,.16,timber,-4.2,1.65,-1);box(.16,3.3,.16,timber,4.2,1.65,-1);
   box(1.5,2.65,.14,timber,0,1.325,-2.83);for(let y of [.5,1.3,2.1])box(1.27,.04,.06,dark,0,y,-2.73);
   const knob=new THREE.Mesh(new THREE.SphereGeometry(.045,12,8),new THREE.MeshStandardMaterial({color:'#bb9c58',metalness:.8,roughness:.3}));knob.position.set(.54,1.15,-2.72);scene.add(knob);
   for(const x of [-2.5,2.5]){box(1.6,1.4,.1,timber,x,1.85,-2.8);box(1.32,1.15,.05,new THREE.MeshStandardMaterial({color:'#c6a65a',emissive:'#6e4a12',emissiveIntensity:.55}),x,1.85,-2.72);box(.06,1.2,.08,timber,x,1.85,-2.66);box(1.36,.06,.08,timber,x,1.85,-2.66)}
   const bulb=new THREE.Mesh(new THREE.SphereGeometry(.12,16,12),new THREE.MeshBasicMaterial({color:'#ffe0a0'}));bulb.position.set(0,3.1,-1.8);scene.add(bulb);const lamp=new THREE.PointLight('#ffcc76',18,12,2);lamp.position.copy(bulb.position);scene.add(lamp);
   // Same generated motorcycle and wheel pivots as the forest/warung shots.
   const bike=new THREE.Group();scene.add(bike);const generatedBike=createMotorcycle();bike.add(generatedBike.model);const wheels=generatedBike.wheels;
   const outfit=garments.map(g=>({data:g.data,material:g.material.clone()}));outfit[0].material.color.set('#596a61');const dimas=createRiggedEntity(data,null,outfit);dimas.mesh.material.color.set('#967765');dimas.mesh.scale.setScalar(.105);scene.add(dimas.mesh);dimas.bones['upperarm01.L'].rotation.z=-.62;dimas.bones['upperarm01.R'].rotation.z=.62;
   const shadow=createRiggedEntity(data);const shadowMat=new THREE.MeshStandardMaterial({color:'#091411',roughness:1});shadow.mesh.traverse(o=>{if(o.isMesh)o.material=shadowMat});shadow.mesh.scale.setScalar(.105);scene.add(shadow.mesh);
   state.current={scene,renderer,camera,dimas,shadow,bike,wheels};setReady(true);continueRender(handle);
  })().catch(e=>{if(!dead)cancelRender(e)});
  return()=>{dead=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose()});renderer?.dispose()};
 },[handle,width,height,resolutionScale]);
 useEffect(()=>{if(!ready||!state.current)return;const {renderer,scene,camera,dimas,shadow}=state.current,t=frame/fps+voOffset;
  // Approximate arrival, dismount, walk and three distinct knocks. The same
  // skinned character moves throughout; arm/foot contact still needs QC.
  const {bike,wheels}=state.current;
  const clamp=x=>Math.min(Math.max(x,0),1),arrival=clamp((t-49)/5),dismount=clamp((t-57)/2),walk=clamp((t-59)/3.5);
  bike.position.set(-1.6,0,2.3-arrival*2);bike.rotation.y=0;bike.rotation.z=-.08*arrival;
  for(const wheel of wheels)wheel.rotation.z=(1-arrival)*14;
  poseSeated(dimas.bones,1-dismount);
  const startX=-1.6+.65*dismount,startZ=bike.position.z+.15;
  dimas.mesh.position.set(startX*(1-walk),1.04-.18*dismount,startZ+(-1.8-startZ)*walk);dimas.mesh.rotation.y=Math.PI;
  const stride=walk>0&&walk<1?Math.sin((t-59)*7)*.32:0;
  dimas.bones['upperleg01.L'].rotation.x+=stride;dimas.bones['upperleg01.R'].rotation.x-=stride;
  const knock= t>=62&&t<64.4 ? Math.max(0,Math.sin((t-62)*Math.PI*2.5)) : 0;
  const armUp=clamp((t-61.5)*2)*(1-clamp((t-64.4)*2));
  dimas.bones['upperarm01.L'].rotation.z=-.65*(1-dismount)-.62*dismount;
  dimas.bones['upperarm01.R'].rotation.z=.65*(1-dismount)+.62*dismount-armUp*.97;dimas.bones['lowerarm01.R'].rotation.z=armUp*(-1.7+knock*.25);
  shadow.mesh.visible=t>=110;shadow.mesh.position.set(.35,.86,-.35);shadow.mesh.rotation.y=Math.PI;shadow.bones.head.rotation.x=.2;
  if(t<60){camera.position.set(5,2.3,7.5-(t-49)*.08);camera.lookAt(-.4,1.3,-1.6)}else if(t<110){camera.position.set(2.7,1.9,2.6);camera.lookAt(0,1.45,-1.8)}else{camera.position.set(2.1,1.85,1.3);camera.lookAt(.1,1.55,-1.35)}
  renderer.render(scene,camera);
 },[ready,frame,fps,voOffset]);
 return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
