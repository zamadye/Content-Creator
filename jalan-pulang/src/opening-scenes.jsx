import React, {useEffect,useRef,useState} from 'react';
import {AbsoluteFill,Audio,Sequence,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {createRiggedEntity,loadGarments,loadRidingGarments,poseSeated} from './rigged-entity';
import {RideTest} from './ride';
import {createMotorcycle} from './motorcycle';
import {solveArm,holdMotorcycleGrips} from './arm-ik';

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
        people.push({o:entity.mesh,bones:entity.bones,entity});return entity;
      };
      let lightRed,lightBlue,phone,bike,parcel,bikeModel;
      if(set==='warehouse'){
        box(scene,20,6,.25,wallMat,0,3,-8);box(scene,.25,6,15,wallMat,-8,3,-1);box(scene,.25,6,15,wallMat,8,3,-1);
        const shelfAsset=await new GLTFLoader().loadAsync(staticFile('models/steel_frame_shelves_01/steel_frame_shelves_01_1k.gltf'));if(dead)return;
        for(let x of [-5,5])for(let z of [-6,0,5]){
          const shelf=shelfAsset.scene.clone();shelf.position.set(x,0,z);shelf.scale.setScalar(.18);scene.add(shelf);
          for(let y of [.24,1.15,2.06,2.97])for(let k=0;k<2;k++)box(scene,.48,.46,.56,card,x-.32+k*.64,y+.23,z);
        }
        for(const z of [-4,1,6]){const strip=box(scene,3,.07,.17,white,0,5.3,z);strip.material=new THREE.MeshBasicMaterial({color:'#c6d8c8'});const lamp=new THREE.PointLight('#c1d4c4',12,13,2);lamp.position.set(0,5,z);scene.add(lamp)}
        const dimas=person(0,-1);parcel=new THREE.Mesh(new THREE.BoxGeometry(3.5,2.6,2.2),card);parcel.position.set(0,-1,1);dimas.bones['wrist.L'].add(parcel);const bench=box(scene,2.4,.1,1.1,metal,2,.95,0);for(let x of [1,3])for(let z of [-.4,.4])box(scene,.08,.9,.08,metal,x,.45,z);
        // Phone follows the wrist; local units are scaled with the character.
        phone=new THREE.Group();phone.position.set(-.18,-.25,.13);dimas.bones['wrist.R'].add(phone);
        const phoneBody=new THREE.Mesh(new THREE.BoxGeometry(.85,1.45,.14),dark);phone.add(phoneBody);
        const phoneCanvas=document.createElement('canvas');phoneCanvas.width=256;phoneCanvas.height=512;const ctx=phoneCanvas.getContext('2d');ctx.fillStyle='#102832';ctx.fillRect(0,0,256,512);ctx.textAlign='center';ctx.fillStyle='#e4f1ed';ctx.font='bold 38px sans-serif';ctx.fillText('Ibu',128,210);ctx.font='22px sans-serif';ctx.fillText('Panggilan masuk',128,258);ctx.fillStyle='#6da58a';ctx.beginPath();ctx.arc(128,368,30,0,Math.PI*2);ctx.fill();const phoneMap=new THREE.CanvasTexture(phoneCanvas);phoneMap.colorSpace=THREE.SRGBColorSpace;
        const screen=new THREE.Mesh(new THREE.PlaneGeometry(.72,1.3),new THREE.MeshBasicMaterial({map:phoneMap}));screen.position.z=.075;phone.add(screen);
      }else{
        // Stopped traffic, overturned truck and pulsing emergency lights.
        box(scene,1,.03,55,m('#bcb595'),0,.01,-14);
        // Car Kit meshes include wheels and embedded color textures; scaling is
        // computed from their original bounds so all props share world units.
        const vehicleLoader=new GLTFLoader();
        const [truckAsset,sedanAsset,suvAsset,policeAsset,coneAsset]=await Promise.all(
          ['truck','sedan','suv','police','cone'].map(name=>vehicleLoader.loadAsync(staticFile(`kenney-car/${name}.glb`))));
        if(dead)return;
        const vehicle=(asset,x,z,length,overturned=false)=>{
          const source=asset.scene.clone(),bounds=new THREE.Box3().setFromObject(source);
          const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
          const scale=length/Math.max(size.x,size.z);source.position.sub(center);
          const group=new THREE.Group();group.add(source);group.scale.setScalar(scale);group.position.set(x,overturned?size.x*scale/2:size.y*scale/2,z);
          if(overturned)group.rotation.z=Math.PI/2;scene.add(group);return group;
        };
        vehicle(truckAsset,-1,-13,5.2,true);
        vehicle(sedanAsset,-1.4,-5,3.5);vehicle(suvAsset,-.1,-1,3.5);vehicle(sedanAsset,-1.4,4,3.5);vehicle(policeAsset,1.4,-8,3.5);
        const redMat=new THREE.MeshBasicMaterial({color:'#b3262e'}),blueMat=new THREE.MeshBasicMaterial({color:'#2a4fa8'});
        box(scene,.35,.16,.28,redMat,1.1,1.9,-8);box(scene,.35,.16,.28,blueMat,1.7,1.9,-8);
        lightRed=new THREE.PointLight('#b3262e',10,15);lightRed.position.set(1.1,2,-8);scene.add(lightRed);lightBlue=new THREE.PointLight('#2a4fa8',10,15);lightBlue.position.set(1.7,2,-8);scene.add(lightBlue);
        const rider=person(0,0,ridingGarments);person(3.8,-3);
        bike=new THREE.Group();const generatedBike=createMotorcycle();bike.add(generatedBike.model);bikeModel=generatedBike.model;bike.position.set(2.4,0,.2);bike.rotation.y=-.2;scene.add(bike);bike.add(rider.mesh);rider.mesh.position.set(0,1.04,.05);rider.mesh.rotation.y=Math.PI;poseSeated(rider.bones);for(let z of [-11,-7,-3]){const cone=coneAsset.scene.clone();const bounds=new THREE.Box3().setFromObject(cone);const size=bounds.getSize(new THREE.Vector3());cone.scale.setScalar(.65/size.y);cone.position.set(4.8,-bounds.min.y*cone.scale.y,z);scene.add(cone)}
      }
      state.current={scene,renderer,camera,people,lightRed,lightBlue,phone,bike,bikeModel,parcel};setReady(true);continueRender(handle);
    };setup().catch(e=>{if(!dead)cancelRender(e)});
    return()=>{dead=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of (Array.isArray(o.material)?o.material:[o.material]))m.dispose()});renderer?.dispose()};
  },[handle,width,height,set,resolutionScale]);
  useEffect(()=>{if(!ready||!state.current)return;const s=state.current,t=frame/fps;
    const clamp=x=>Math.max(0,Math.min(1,x));
    if(set==='warehouse'){
      const p=s.people[0],walking=t<8;
      p.o.position.z=-1+Math.min(t*.08,.64);p.o.rotation.y=.2;
      p.bones['upperleg01.L'].rotation.x=walking?Math.sin(t*5)*.25:0;p.bones['upperleg01.R'].rotation.x=walking?-Math.sin(t*5)*.25:0;
      p.bones['spine01'].rotation.z=Math.sin(t*.65)*.025;p.bones['head'].rotation.x=t>14?.18:.03;
      // Repeated warehouse work before the call: hand and parcel travel with
      // the rig instead of a floating object independent of the character.
      s.parcel.visible=t>=5&&t<12;
      const work=clamp((t-5)/1.5)*(1-clamp((t-10)/2));
      p.bones['upperarm01.L'].rotation.set(0,0,-.62+work*.6);p.bones['lowerarm01.L'].rotation.set(-work*.7,0,0);
      p.bones['upperarm01.R'].rotation.set(0,0,.62);p.bones['lowerarm01.R'].rotation.set(0,0,0);
      s.phone.visible=t>=13;
      const holding=clamp((t-13)/2)*(1-clamp((t-37)/1));
      if(holding>0){p.o.updateWorldMatrix(true,true);const target=p.bones.head.localToWorld(new THREE.Vector3(-1.05,.20,1.15));solveArm(p.entity,'R',target,holding);p.bones['wrist.R'].rotation.z=Math.PI*holding;}
      if(t<13){s.camera.position.set(3.5-t*.025,2.3,6.4-t*.04);s.camera.lookAt(.2,1.35,-1)}
      else if(t<27){s.camera.position.set(1.9,1.8,3.3-(t-13)*.025);s.camera.lookAt(0,1.42,-.5)}
      else{s.camera.position.set(-1.9,1.7,2.8);s.camera.lookAt(0,1.4,-.5)}
    }else{
      const dimas=s.people[0],attendant=s.people[1],approach=clamp((t-5)/5);
      dimas.o.rotation.y=Math.PI;poseSeated(dimas.bones);dimas.bones['spine01'].rotation.z=Math.sin(t*.5)*.02;
      dimas.bones['upperarm01.L'].rotation.set(0,0,-.65);dimas.bones['upperarm01.R'].rotation.set(0,0,.65);holdMotorcycleGrips(dimas.entity,s.bikeModel);
      // Rider turns to listen, then watches the attendant's direction.
      dimas.bones.head.rotation.y=t>=10?-.22:0;
      attendant.o.position.z=-3+2*approach;attendant.o.position.x=3.8-.35*approach;attendant.o.rotation.y=-.45;
      const step=t>=5&&t<10?Math.sin((t-5)*5)*.35:0;
      attendant.bones['upperleg01.L'].rotation.x=step;attendant.bones['upperleg01.R'].rotation.x=-step;
      attendant.bones['upperarm01.R'].rotation.z=.62-(t>=10?clamp((t-10)/2)*.95:0);
      attendant.bones['lowerarm01.R'].rotation.z=t>=10?-.3:0;
      s.lightRed.intensity=(Math.sin(t*5)>0?18:1);s.lightBlue.intensity=(Math.sin(t*5)>0?1:18);
      if(t<6){s.camera.position.set(5.7,2.7,7.5-t*.035);s.camera.lookAt(0,1,-5)}
      else if(t<17){s.camera.position.set(6.1,1.9,4.4-(t-6)*.025);s.camera.lookAt(3.0,1.25,-.4)}
      else if(t<23){s.camera.position.set(5.4,1.8,1.4);s.camera.lookAt(3.4,1.4,-.7)}
      else{s.camera.position.set(5.6,2,4);s.camera.lookAt(2.9,1.3,-.7)}
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
