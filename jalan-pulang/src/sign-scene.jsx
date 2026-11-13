import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

// Sign insert: same physical geometry for both loops. The second version adds
// wet lettering and animated paint trails. Camera and objects remain 3D.
export const SignScene = ({wet=false,resolutionScale=1}) => {
  const canvas=useRef(null), state=useRef(null), frame=useCurrentFrame();
  const {width,height,fps}=useVideoConfig();
  const [handle]=useState(()=>delayRender('Loading sign scene assets'));
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let stopped=false,renderer,scene;
    const setup=async()=>{
      renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});
      renderer.setSize(Math.round(width*resolutionScale),Math.round(height*resolutionScale),false); renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
      scene=new THREE.Scene();scene.background=new THREE.Color('#101d20');
      const camera=new THREE.PerspectiveCamera(38,width/height,.1,100);
      scene.add(new THREE.HemisphereLight('#95b8b9','#101913',.9));
      const moon=new THREE.DirectionalLight('#a6c4c1',1.8);moon.position.set(-4,8,5);scene.add(moon);
      const headlights=new THREE.SpotLight('#ffe2a2',60,30,Math.PI/5,.7,1.5);headlights.position.set(-3,1,7);headlights.target.position.set(1,1,-2);scene.add(headlights,headlights.target);
      const textures=new THREE.TextureLoader();
      const load=async (name,color=false,repeat=[1,1])=>{const t=await textures.loadAsync(staticFile('pbr/'+name));t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t};
      const [metal,metalN,metalR,metalM,asphalt,asphaltN,asphaltR,tree]=await Promise.all([
        load('metal_rusty_paint_Color.png',true),load('metal_rusty_paint_NormalGL.jpg'),load('metal_rusty_paint_Roughness.jpg'),load('metal_rusty_paint_Metalness.jpg'),
        load('street_asphalt_Color.png',true,[2,12]),load('street_asphalt_NormalGL.jpg',false,[2,12]),load('street_asphalt_Roughness.jpg',false,[2,12]),
        new GLTFLoader().loadAsync(staticFile('nature-cc0/tree.glb'))]);
      if(stopped)return;
      const road=new THREE.Mesh(new THREE.PlaneGeometry(5.5,65),new THREE.MeshStandardMaterial({map:asphalt,normalMap:asphaltN,roughnessMap:asphaltR,roughness:1,color:'#7c8981'}));road.rotation.x=-Math.PI/2;road.position.set(-1,0,-18);scene.add(road);
      const ground=new THREE.Mesh(new THREE.PlaneGeometry(40,65),new THREE.MeshStandardMaterial({color:'#1a2d22',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.set(0,-.03,-18);scene.add(ground);
      tree.scene.traverse(o=>{if(o.isMesh&&o.material){o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const n=m.clone();n.color?.multiplyScalar(.32);return n});if(o.material.length===1)o.material=o.material[0]}});
      for(let i=0;i<24;i++){const t=tree.scene.clone();t.scale.setScalar(.65+(i%3)*.07);t.position.set((i%2?1:-1)*(4.3+(i%3)*.5),0,5-Math.floor(i/2)*3.3);scene.add(t)}
      const sign=new THREE.Group();sign.position.set(2.35,0,-3);sign.rotation.z=.11;scene.add(sign);
      const rust=new THREE.MeshStandardMaterial({map:metal,normalMap:metalN,roughnessMap:metalR,metalnessMap:metalM,roughness:1,metalness:1});
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.052,.065,3.15,12),rust);post.position.y=1.56;sign.add(post);
      const board=new THREE.Mesh(new THREE.BoxGeometry(2.65,.94,.10),rust);board.position.y=2.65;sign.add(board);
      const c=document.createElement('canvas');c.width=1024;c.height=384;const ctx=c.getContext('2d');
      ctx.fillStyle='#b6b8a4';ctx.fillRect(0,0,1024,384);
      // Deterministic grime and scratches on the enamel surface.
      let seed=173;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
      for(let i=0;i<4000;i++){const a=rand()*.13;ctx.fillStyle=`rgba(50,42,30,${a})`;ctx.fillRect(rand()*1024,rand()*384,1+rand()*5,1+rand()*3)}
      ctx.textAlign='center';ctx.fillStyle='#202823';ctx.font='bold 76px sans-serif';ctx.fillText('DESA SUKAMAJU',512,150);ctx.font='bold 105px sans-serif';ctx.fillText('12 km',512,290);
      const labelMap=new THREE.CanvasTexture(c);labelMap.colorSpace=THREE.SRGBColorSpace;
      const label=new THREE.Mesh(new THREE.PlaneGeometry(2.54,.85),new THREE.MeshStandardMaterial({map:labelMap,roughness:wet?.27:.9,metalness:wet?.12:0}));label.position.set(0,2.65,.054);sign.add(label);
      const dripMaterial=new THREE.MeshStandardMaterial({color:'#d4d2bb',roughness:.25,metalness:.05});
      const drips=[];
      if(wet)for(let i=0;i<9;i++){let drop=new THREE.Mesh(new THREE.CapsuleGeometry(.014+(i%3)*.003,.25,4,8),dripMaterial);drop.position.set(-1.05+i*.26,2.23,.07);sign.add(drop);drips.push({drop,phase:i*.43})}
      state.current={renderer,scene,camera,drips};setReady(true);continueRender(handle);
    };setup().catch(e=>{if(!stopped)cancelRender(e)});
    return()=>{stopped=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of (Array.isArray(o.material)?o.material:[o.material])){m.map?.dispose();m.dispose()}});renderer?.dispose()};
  },[handle,width,height,wet,resolutionScale]);
  useEffect(()=>{if(!ready||!state.current)return;const {renderer,scene,camera,drips}=state.current,t=frame/fps;
    camera.position.set(-1.1+t*.11,1.85,4.4-t*.10);camera.lookAt(2.1,2.0,-3);
    for(const {drop,phase} of drips){const progress=((t*.25+phase)%1);drop.scale.y=.35+progress*1.1;drop.position.y=2.23-progress*.18}
    renderer.render(scene,camera);
  },[ready,frame,fps]);
  return <AbsoluteFill style={{background:'#101d20'}}><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
export const SignDryWithVO=()=> <AbsoluteFill><SignScene/><Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')} startFrom={127*30}/></AbsoluteFill>;
export const SignWetWithVO=()=> <AbsoluteFill><SignScene wet/><Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')} startFrom={267*30}/></AbsoluteFill>;
