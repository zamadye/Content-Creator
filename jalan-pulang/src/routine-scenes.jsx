import React,{useEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';

// Three short 3D inserts for Dimas's daily routine. The screen graphics are
// fictional; they do not reference any real bank or personal account.
export const RoutineScene=({kind='clock',resolutionScale=1})=>{
 const canvas=useRef(null),state=useRef(null),frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();
 const [handle]=useState(()=>delayRender('Load routine insert')),[ready,setReady]=useState(false);
 useEffect(()=>{let renderer,scene,dead=false;
  (async()=>{
   renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});renderer.setSize(Math.round(width*resolutionScale),Math.round(height*resolutionScale),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   scene=new THREE.Scene();scene.background=new THREE.Color(kind==='factory'?'#17252a':'#293232');const camera=new THREE.PerspectiveCamera(36,width/height,.01,100);
   scene.add(new THREE.HemisphereLight('#adc5c3','#29312d',1));const light=new THREE.DirectionalLight('#ffe0ac',1.7);light.position.set(-3,5,4);scene.add(light);
   const loader=new THREE.TextureLoader();const load=async(n,color=false,repeat=[1,1])=>{const t=await loader.loadAsync(staticFile('pbr/'+n));t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t};
   const [wood,woodN,rough,wall,wallN,wallR]=await Promise.all([load('wood_planks_diffuse.jpg',true,[2,2]),load('wood_planks_normal.jpg',false,[2,2]),load('wood_planks_rough.jpg',false,[2,2]),load('wall_plaster_dirty_Color.png',true,[3,2]),load('wall_plaster_dirty_NormalGL.jpg',false,[3,2]),load('wall_plaster_dirty_Roughness.jpg',false,[3,2])]);if(dead)return;
   const timber=new THREE.MeshStandardMaterial({map:wood,normalMap:woodN,roughnessMap:rough,roughness:1,color:'#8d7259'}),plaster=new THREE.MeshStandardMaterial({map:wall,normalMap:wallN,roughnessMap:wallR,roughness:1,color:'#9aa8a1'}),metal=new THREE.MeshStandardMaterial({color:'#34423f',metalness:.65,roughness:.48}),black=new THREE.MeshStandardMaterial({color:'#161c1d',metalness:.25,roughness:.55});
   const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o};
   let prop;
   if(kind==='factory'){
    box(20,.1,30,plaster,0,-.08,-8);box(14,5,.25,plaster,0,2.5,-8);box(4.2,3.2,.16,metal,0,1.6,-7.84);
    for(let x=-1.8;x<=1.8;x+=.45)box(.055,3.2,.18,black,x,1.6,-7.7);
    for(const x of [-3,3])box(.3,3.7,.3,metal,x,1.85,-7.8);
    const lamp=new THREE.PointLight('#f4c175',15,12,2);lamp.position.set(0,3.5,-6.4);scene.add(lamp);
    const fixture=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshBasicMaterial({color:'#ffe1a5'}));fixture.position.copy(lamp.position);scene.add(fixture);
    camera.position.set(4,1.8,5);camera.lookAt(0,1.6,-7.8);
   }else{
    box(5,.18,3,timber,0,0,0);box(5,3,.14,plaster,0,1.5,-1.5);
    prop=new THREE.Group();scene.add(prop);prop.position.set(0,.22,0);prop.rotation.y=-.18;
    const c=document.createElement('canvas');c.width=512;c.height=512;const x=c.getContext('2d');
    if(kind==='clock'){
     const body=new THREE.Mesh(new THREE.BoxGeometry(1.05,.62,.32),black);prop.add(body);
     x.fillStyle='#101c20';x.fillRect(0,0,512,512);x.fillStyle='#a4dbd0';x.textAlign='center';x.font='bold 150px sans-serif';x.fillText('06:00',256,285);x.font='34px sans-serif';x.fillText('ALARM',256,350);
     const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const screen=new THREE.Mesh(new THREE.PlaneGeometry(.92,.47),new THREE.MeshBasicMaterial({map}));screen.position.z=.166;prop.add(screen);
     for(const px of [-.4,.4]){const foot=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.14,10),metal);foot.position.set(px,-.36,0);prop.add(foot)}
    }else{
     prop.position.y=.145;prop.rotation.x=-Math.PI/2;prop.rotation.z=-.16;const body=new THREE.Mesh(new THREE.BoxGeometry(.72,1.35,.10),black);prop.add(body);
     x.fillStyle='#122c35';x.fillRect(0,0,512,512);x.fillStyle='#e2efea';x.textAlign='center';x.font='bold 37px sans-serif';x.fillText('Transfer berhasil',256,150);x.font='30px sans-serif';x.fillText('Untuk Ibu',256,220);x.fillStyle='#6fae8f';x.beginPath();x.arc(256,335,48,0,Math.PI*2);x.fill();x.fillStyle='#effaf4';x.font='bold 50px sans-serif';x.fillText('✓',256,352);
     const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const screen=new THREE.Mesh(new THREE.PlaneGeometry(.65,1.26),new THREE.MeshBasicMaterial({map}));screen.position.z=.055;prop.add(screen);
    }
    camera.position.set(1.5,1.4,3);camera.lookAt(0,.35,0);
   }
   state.current={renderer,scene,camera,prop};setReady(true);continueRender(handle);
  })().catch(e=>{if(!dead)cancelRender(e)});
  return()=>{dead=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.dispose()}});renderer?.dispose()};
 },[handle,kind,width,height,resolutionScale]);
 useEffect(()=>{if(!ready||!state.current)return;const {renderer,scene,camera,prop}=state.current,t=frame/fps;
  if(kind==='factory'){camera.position.x=4-t*.18;camera.position.z=5-t*.22;camera.lookAt(0,1.6,-7.8)}
  else{if(kind==='transfer')camera.position.set(.3,2.65-t*.04,1.65-t*.04);else camera.position.set(1.5-t*.04,1.4-t*.035,3-t*.10);camera.lookAt(0,kind==='transfer'?.12:.25,0);if(prop&&kind==='clock')prop.rotation.y=-.18+Math.sin(t*1.5)*.015;}
  renderer.render(scene,camera);
 },[ready,frame,fps,kind]);
 return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
