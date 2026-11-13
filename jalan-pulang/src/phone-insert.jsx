import React,{useEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {createRiggedEntity,loadRidingGarments} from './rigged-entity';
import {solveArm} from './arm-ik';

// Diegetic phone carried by the skinned hand, in a close moving 3D shot.
export const PhoneClockInsert=({resolutionScale=1})=>{
 const canvas=useRef(null),state=useRef(null),frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Build phone insert')),[ready,setReady]=useState(false);
 useEffect(()=>{let renderer,scene,dead=false;
  (async()=>{
   renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});renderer.setSize(Math.round(width*resolutionScale),Math.round(height*resolutionScale),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   scene=new THREE.Scene();scene.background=new THREE.Color('#101d1d');const camera=new THREE.PerspectiveCamera(38,width/height,.01,100);
   scene.add(new THREE.HemisphereLight('#90b7b5','#14221b',1.2));const light=new THREE.DirectionalLight('#ffe1ad',2);light.position.set(-2,5,3);scene.add(light);
   const [response,clothes]=await Promise.all([fetch(staticFile('makehuman/rigged-body.json')),loadRidingGarments(staticFile)]);if(!response.ok)throw Error('Phone rig unavailable');const data=await response.json();if(dead)return;
   const dimas=createRiggedEntity(data,null,clothes);dimas.mesh.material.color.set('#967765');dimas.mesh.scale.setScalar(.105);dimas.mesh.position.set(0,.86,0);scene.add(dimas.mesh);
   dimas.bones['upperarm01.L'].rotation.z=-.62;dimas.bones['upperarm01.R'].rotation.z=.62;
   solveArm(dimas,'R',new THREE.Vector3(-.25,1.3,.38));
   for(let finger=2;finger<=5;finger++)for(let joint=1;joint<=3;joint++)dimas.bones[`finger${finger}-${joint}.R`].rotation.x=.6;
   const phone=new THREE.Group();phone.position.set(-.05,-.65,.16);dimas.bones['wrist.R'].add(phone);
   const body=new THREE.Mesh(new THREE.BoxGeometry(.85,1.65,.13),new THREE.MeshStandardMaterial({color:'#15191a',metalness:.5,roughness:.45}));phone.add(body);
   const c=document.createElement('canvas');c.width=512;c.height=1024;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,512,1024);g.addColorStop(0,'#233c49');g.addColorStop(1,'#07141c');x.fillStyle=g;x.fillRect(0,0,512,1024);x.fillStyle='#dcebe9';x.textAlign='center';x.font='100px sans-serif';x.fillText('23:47',256,570);x.font='29px sans-serif';x.fillText('Jumat',256,635);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
   const screen=new THREE.Mesh(new THREE.PlaneGeometry(.76,1.51),new THREE.MeshBasicMaterial({map}));screen.position.z=.07;phone.add(screen);
   const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:'#202e26',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.01;scene.add(ground);
   state.current={renderer,scene,camera,phone,dimas};setReady(true);continueRender(handle);
  })().catch(e=>{if(!dead)cancelRender(e)});
  return()=>{dead=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of (Array.isArray(o.material)?o.material:[o.material])){m.map?.dispose();m.dispose()}});renderer?.dispose()};
 },[width,height,handle,resolutionScale]);
 useEffect(()=>{if(!ready||!state.current)return;const {renderer,scene,camera,phone,dimas}=state.current,t=frame/fps;
  const wrist=dimas.bones['wrist.R'];dimas.mesh.updateWorldMatrix(true,true);const target=wrist.getWorldPosition(new THREE.Vector3());
  camera.position.copy(target).add(new THREE.Vector3(.20,.15, .50));camera.lookAt(target);camera.updateMatrixWorld();
  const parentQ=wrist.getWorldQuaternion(new THREE.Quaternion());phone.quaternion.copy(parentQ.invert().multiply(camera.quaternion));phone.rotation.z+=Math.sin(t*2)*.035;
  renderer.render(scene,camera);
 },[ready,frame,fps]);
 return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
