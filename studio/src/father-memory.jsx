import React,{useEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {createRiggedEntity,loadGarments} from './rigged-entity';
import {solveArm} from './arm-ik';

// Memory prompted by the mother's account, not a literal historical photograph.
export const FatherMemory=({resolutionScale=1})=>{
 const canvas=useRef(null),state=useRef(null),frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Load father memory')),[ready,setReady]=useState(false);
 useEffect(()=>{let scene,renderer,dead=false;
  (async()=>{
   renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});renderer.setSize(width*resolutionScale,height*resolutionScale,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   scene=new THREE.Scene();scene.background=new THREE.Color('#201d17');const camera=new THREE.PerspectiveCamera(38,width/height,.1,50);
   scene.add(new THREE.HemisphereLight('#b2a88f','#2c2319',.8));const lamp=new THREE.PointLight('#ffbd6d',13,8,2);lamp.position.set(2,2.6,-1);scene.add(lamp);
   const tex=new THREE.TextureLoader();const load=async(n,c=false)=>{const t=await tex.loadAsync(staticFile('pbr/'+n));t.colorSpace=c?THREE.SRGBColorSpace:THREE.NoColorSpace;return t};
   const [wall,wallN,wood,woodN,response,clothes]=await Promise.all([load('wall_plaster_dirty_Color.png',true),load('wall_plaster_dirty_NormalGL.jpg'),load('wood_planks_diffuse.jpg',true),load('wood_planks_normal.jpg'),fetch(staticFile('makehuman/rigged-body.json')),loadGarments(staticFile)]);
   if(!response.ok)throw Error('Father rig unavailable');const data=await response.json();if(dead)return;
   const plaster=new THREE.MeshStandardMaterial({map:wall,normalMap:wallN,color:'#968978',roughness:1});const timber=new THREE.MeshStandardMaterial({map:wood,normalMap:woodN,color:'#88745a',roughness:.9});const bedding=new THREE.MeshStandardMaterial({color:'#b4aa90',roughness:1});
   const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o};
   box(8,.15,7,timber,0,-.08,0);box(8,4,.2,plaster,0,2,-3);box(.2,4,7,plaster,-4,2,.5);
   box(1.8,.3,3.4,timber,0,.35,0);box(1.7,.2,3.1,bedding,0,.60,0);box(1.7,.8,.12,timber,0,.85,-1.65);box(.7,.17,.5,bedding,0,.76,-1.18);
   for(const x of [-.72,.72])for(const z of [-1.3,1.3])box(.15,.4,.15,timber,x,.18,z);
   box(.65,.65,.65,timber,1.6,.325,-1.1);const shade=new THREE.Mesh(new THREE.ConeGeometry(.22,.38,16,1,true),new THREE.MeshStandardMaterial({color:'#d6c198',emissive:'#775333',emissiveIntensity:.8,side:THREE.DoubleSide}));shade.position.set(1.6,1.18,-1.1);scene.add(shade);
   const figure=createRiggedEntity(data,null,clothes);figure.mesh.material.color.set('#8c7f70');figure.mesh.scale.setScalar(.105);figure.mesh.position.set(0,.82,-.1);figure.mesh.rotation.x=-Math.PI/2;scene.add(figure.mesh);
   figure.bones['upperarm01.L'].rotation.z=-.62;figure.bones['upperarm01.R'].rotation.z=.62;
   solveArm(figure,'L',new THREE.Vector3(-.48,.81,.15));solveArm(figure,'R',new THREE.Vector3(.48,.81,.15));
   state.current={renderer,scene,camera,figure};setReady(true);continueRender(handle);
  })().catch(e=>{if(!dead)cancelRender(e)});
  return()=>{dead=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()});renderer?.dispose()};
 },[handle,width,height,resolutionScale]);
 useEffect(()=>{if(!ready||!state.current)return;const {renderer,scene,camera,figure}=state.current,t=frame/fps;figure.bones.spine01.rotation.x=.015*Math.sin(t*1.6);camera.position.set(3.8-t*.025,2.25,3.7-t*.04);camera.lookAt(0,.85,-.3);renderer.render(scene,camera)},[ready,frame,fps]);
 return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%',filter:'sepia(0.32) saturate(0.65)'}}/></AbsoluteFill>;
};
