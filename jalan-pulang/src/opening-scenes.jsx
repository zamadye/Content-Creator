import React, {useEffect,useRef,useState} from 'react';
import {AbsoluteFill,Audio,Sequence,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {createRiggedEntity,loadGarments,loadRidingGarments} from './rigged-entity';
import {RideTest} from './ride';

// Blockout for the opening sequence. Sets, props and characters are real 3D;
// character styling, detailed acting, audio alignment and lookdev remain WIP.
export const OpeningSet=({set='warehouse',resolutionScale=1})=>{
  const canvas=useRef(null),state=useRef(null),frame=useCurrentFrame(),{fps,width,height}=useVideoConfig();
  const [handle]=useState(()=>delayRender('Load opening characters')),[ready,setReady]=useState(false);
  useEffect(()=>{
    let scene,renderer,dead=false;
    const setup=async()=>{
      renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});renderer.setSize(Math.round(width*resolutionScale),Math.round(height*resolutionScale),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
      scene=new THREE.Scene();scene.background=new THREE.Color(set==='warehouse'?'#273638':'#101b20');
      scene.add(new THREE.HemisphereLight('#a7c0bf','#17201a',1.2));const dir=new THREE.DirectionalLight('#b4cacc',1.5);dir.position.set(-3,9,5);scene.add(dir);
      const camera=new THREE.PerspectiveCamera(42,width/height,.1,90);
      const m=(c,r=.8,metalness=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness});
      const concrete=m('#4e5752'),metal=m('#4a5a57',.5,.6),wood=m('#82694b'),card=m('#92764e'),dark=m('#172320'),white=m('#c8c5ad');
      const box=(par,w,h,d,mat,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);par.add(o);return o};
      const tex=new THREE.TextureLoader();
      const load=async(name,color=false,repeat=[1,1])=>{const t=await tex.loadAsync(staticFile('pbr/'+name));t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t};
      const [floorColor,floorNormal,floorRough,wallColor,wallNormal,wallRough,roadColor,roadNormal,roadRough]=await Promise.all([
        load('sidewalk_concrete_Color.png',true,[8,8]),load('sidewalk_concrete_NormalGL.jpg',false,[8,8]),load('sidewalk_concrete_Roughness.jpg',false,[8,8]),
        load('wall_plaster_dirty_Color.png',true,[4,2]),load('wall_plaster_dirty_NormalGL.jpg',false,[4,2]),load('wall_plaster_dirty_Roughness.jpg',false,[4,2]),
        load('street_asphalt_Color.png',true,[6,12]),load('street_asphalt_NormalGL.jpg',false,[6,12]),load('street_asphalt_Roughness.jpg',false,[6,12])]);
      const floorMat=new THREE.MeshStandardMaterial({map:floorColor,normalMap:floorNormal,roughnessMap:floorRough,roughness:1,color:'#88958c'});
      const wallMat=new THREE.MeshStandardMaterial({map:wallColor,normalMap:wallNormal,roughnessMap:wallRough,roughness:1,color:'#a0aaa2'});
      const roadMat=new THREE.MeshStandardMaterial({map:roadColor,normalMap:roadNormal,roughnessMap:roadRough,roughness:1,color:'#7c8781'});
      box(scene,35,.1,65,set==='warehouse'?floorMat:roadMat,0,-.07,-13);
      const response=await fetch(staticFile('makehuman/rigged-body.json'));if(!response.ok)throw Error(`Character rig HTTP ${response.status}`);
      const data=await response.json();const garments=await loadGarments(staticFile);const ridingGarments=set==='traffic'?await loadRidingGarments(staticFile):garments;if(dead)return;
      const people=[];
      const person=(x,z,outfit=garments)=>{
        const entity=createRiggedEntity(data,null,outfit);
        entity.mesh.material.color.set('#a68770');entity.mesh.scale.setScalar(.105);
        entity.mesh.position.set(x,.86,z);scene.add(entity.mesh);
        entity.bones['upperarm01.L'].rotation.z=-.62;entity.bones['upperarm01.R'].rotation.z=.62;
        people.push({o:entity.mesh,bones:entity.bones});return entity.mesh;
      };
      let lightRed,lightBlue,phone;
      if(set==='warehouse'){
        box(scene,20,6,.25,wallMat,0,3,-8);box(scene,.25,6,15,wallMat,-8,3,-1);box(scene,.25,6,15,wallMat,8,3,-1);
        const shelfAsset=await new GLTFLoader().loadAsync(staticFile('models/steel_frame_shelves_01/steel_frame_shelves_01_1k.gltf'));if(dead)return;
        for(let x of [-5,5])for(let z of [-6,0,5]){
          const shelf=shelfAsset.scene.clone();shelf.position.set(x,0,z);shelf.scale.setScalar(.18);scene.add(shelf);
          for(let y of [.24,1.15,2.06,2.97])for(let k=0;k<2;k++)box(scene,.48,.46,.56,card,x-.32+k*.64,y+.23,z);
        }
        for(const z of [-4,1,6]){const strip=box(scene,3,.07,.17,white,0,5.3,z);strip.material=new THREE.MeshBasicMaterial({color:'#c6d8c8'});const lamp=new THREE.PointLight('#c1d4c4',12,13,2);lamp.position.set(0,5,z);scene.add(lamp)}
        person(0,-1);const bench=box(scene,2.4,.1,1.1,metal,2,.95,0);for(let x of [1,3])for(let z of [-.4,.4])box(scene,.08,.9,.08,metal,x,.45,z);
        phone=box(scene,.18,.30,.025,dark,.7,1.1,0);const screen=box(scene,.15,.26,.01,new THREE.MeshBasicMaterial({color:'#7aa5a6'}),.7,1.1,.02);
      }else{
        // Stopped traffic, overturned truck and pulsing emergency lights.
        box(scene,1,.03,55,m('#bcb595'),0,.01,-14);
        const truck=new THREE.Group();scene.add(truck);truck.position.set(-1,0,-13);truck.rotation.z=Math.PI/2;
        box(truck,2.5,2.5,5.2,m('#64726a'),0,1.4,0);box(truck,2.4,1.8,1.8,m('#bdc1af'),0,1,-3.3);
        for(let x of [-1.3,1.3])for(let z of [-2.7,1.5]){let wh=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.28,16),dark);wh.rotation.z=Math.PI/2;wh.position.set(x,.4,z);truck.add(wh)}
        const car=(x,z,color)=>{let g=new THREE.Group();scene.add(g);g.position.set(x,0,z);box(g,2,.7,3.5,m(color,.45,.2),0,.75,0);box(g,1.65,.65,1.7,m('#273c3e',.2,.1),0,1.38,-.2);for(let side of [-1,1])for(let zz of [-1.1,1.1]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.22,14),dark);w.rotation.z=Math.PI/2;w.position.set(side, .36,zz);g.add(w)}return g};
        car(-1.4,-5,'#62584c');car(1.4,-1,'#737674');car(-1.4,4,'#343a3c');car(1.4,-8,'#d4d4ca');
        const redMat=new THREE.MeshBasicMaterial({color:'#b3262e'}),blueMat=new THREE.MeshBasicMaterial({color:'#2a4fa8'});
        box(scene,.35,.16,.28,redMat,1.1,1.9,-8);box(scene,.35,.16,.28,blueMat,1.7,1.9,-8);
        lightRed=new THREE.PointLight('#b3262e',10,15);lightRed.position.set(1.1,2,-8);scene.add(lightRed);lightBlue=new THREE.PointLight('#2a4fa8',10,15);lightBlue.position.set(1.7,2,-8);scene.add(lightBlue);
        person(3,0,ridingGarments);person(3.8,-3);for(let z of [-11,-7,-3]){const cone=new THREE.Mesh(new THREE.ConeGeometry(.23,.65,12),m('#cc6c30'));cone.position.set(4,.33,z);scene.add(cone)}
      }
      state.current={scene,renderer,camera,people,lightRed,lightBlue,phone};setReady(true);continueRender(handle);
    };setup().catch(e=>{if(!dead)cancelRender(e)});
    return()=>{dead=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose()});renderer?.dispose()};
  },[handle,width,height,set,resolutionScale]);
  useEffect(()=>{if(!ready||!state.current)return;const s=state.current,t=frame/fps;
    if(set==='warehouse'){
      const p=s.people[0];p.o.position.z=-1+Math.min(t*.08,1.6);p.o.rotation.y=.2;p.bones['spine01'].rotation.z=Math.sin(t*.65)*.025;p.bones['head'].rotation.x=t>14?.18:.03;
      s.camera.position.set(3.5-Math.min(t*.025,.8),2.3,6.4-Math.min(t*.04,1.5));s.camera.lookAt(.2,1.35,-1);
    }else{
      s.people[0].o.position.z=Math.max(-1.5,-.05*t);s.people[0].o.rotation.y=Math.PI;s.people[0].bones['upperarm01.R'].rotation.z=.62+Math.sin(t)*.08;
      s.people[1].bones['head'].rotation.z=Math.sin(t*.4)*.04;s.people[1].o.rotation.y=-.8;
      s.lightRed.intensity=(Math.sin(t*5)>0?18:1);s.lightBlue.intensity=(Math.sin(t*5)>0?1:18);
      s.camera.position.set(5.7,2.7,7.5-t*.035);s.camera.lookAt(0,1,-5);
    }
    s.renderer.render(s.scene,s.camera);
  },[frame,fps,ready,set]);
  return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
// Absolute VO time and scene-local frames are deliberately separate.
// This is a rough assembly, not an editorially verified final cut.
export const OpeningAssembly=()=> <AbsoluteFill>
  <Sequence from={0} durationInFrames={11*30}><RideTest/></Sequence>
  <Sequence from={11*30} durationInFrames={38*30}><OpeningSet set="warehouse"/></Sequence>
  <Sequence from={49*30} durationInFrames={22*30}><RideTest/></Sequence>
  <Sequence from={71*30} durationInFrames={30*30}><OpeningSet set="traffic"/></Sequence>
  <Audio src={staticFile('vo/VO-Jalan-Pulang_01.mp3')}/>
</AbsoluteFill>;
