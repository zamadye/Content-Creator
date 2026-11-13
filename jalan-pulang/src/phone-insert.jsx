import React,{useEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';

// Diegetic 3D prop, not a full-screen HUD or still image.
export const PhoneClockInsert=({resolutionScale=1})=>{
 const canvas=useRef(null),state=useRef(null),frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Build phone insert')),[ready,setReady]=useState(false);
 useEffect(()=>{
  let renderer,scene;
  try {
   renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});renderer.setSize(Math.round(width*resolutionScale),Math.round(height*resolutionScale),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   scene=new THREE.Scene();scene.background=new THREE.Color('#101d1d');const camera=new THREE.PerspectiveCamera(38,width/height,.1,100);camera.position.set(0,1.8,4.7);camera.lookAt(0,.8,0);
   scene.add(new THREE.HemisphereLight('#90b7b5','#14221b',1.2));const light=new THREE.DirectionalLight('#ffe1ad',2);light.position.set(-2,5,3);scene.add(light);
   const phone=new THREE.Group();phone.position.set(0,.8,0);phone.rotation.z=-.18;scene.add(phone);
   const body=new THREE.Mesh(new THREE.BoxGeometry(1.15,2.2,.14),new THREE.MeshStandardMaterial({color:'#15191a',metalness:.5,roughness:.45}));phone.add(body);
   const c=document.createElement('canvas');c.width=512;c.height=1024;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,512,1024);g.addColorStop(0,'#233c49');g.addColorStop(1,'#07141c');x.fillStyle=g;x.fillRect(0,0,512,1024);x.fillStyle='#dcebe9';x.textAlign='center';x.font='100px sans-serif';x.fillText('23:47',256,340);x.font='29px sans-serif';x.fillText('Jumat',256,398);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;
   const screen=new THREE.Mesh(new THREE.PlaneGeometry(1.02,2.02),new THREE.MeshBasicMaterial({map}));screen.position.z=.075;phone.add(screen);
   const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:'#202e26',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.4;scene.add(ground);
   state.current={renderer,scene,camera,phone};setReady(true);continueRender(handle);
  }catch(e){cancelRender(e)}
  return()=>{state.current=null;scene?.traverse(o=>{o.geometry?.dispose();o.material?.map?.dispose();o.material?.dispose()});renderer?.dispose()};
 },[width,height,handle,resolutionScale]);
 useEffect(()=>{if(!ready||!state.current)return;const {renderer,scene,camera,phone}=state.current,t=frame/fps;phone.rotation.y=Math.sin(t*.5)*.045;phone.position.y=.8+Math.sin(t*.8)*.015;camera.position.x=Math.sin(t*.2)*.08;camera.lookAt(0,.8,0);renderer.render(scene,camera)},[ready,frame,fps]);
 return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
