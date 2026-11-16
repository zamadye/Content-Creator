import React,{useEffect,useRef,useState} from 'react';
import {AbsoluteFill,cancelRender,continueRender,delayRender,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import * as THREE from 'three';

// Diagnostic only: CC0 MakeHuman body and its original bone weights. This is
// not clothed, textured, or approved as the final entity. A neutral dark
// material and framing avoid treating the raw body as finished costume.
export function EntityRigStudy(){
 const canvas=useRef(null),state=useRef(null),frame=useCurrentFrame(),{width,height,fps}=useVideoConfig();
 const [ready,setReady]=useState(false);
 const [handle]=useState(()=>delayRender('Load MakeHuman skinned mesh'));
 useEffect(()=>{
  let disposed=false,renderer,scene;
  (async()=>{try{
   const response=await fetch(staticFile('makehuman/rigged-body.json'));if(!response.ok)throw Error(`Rig asset HTTP ${response.status}`);const data=await response.json();if(disposed)return;
   renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true});renderer.setSize(width,height,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   scene=new THREE.Scene();scene.background=new THREE.Color('#171f20');
   const camera=new THREE.PerspectiveCamera(32,width/height,.1,100);camera.position.set(0,1.55,-5.8);camera.lookAt(0,1.2,0);
   scene.add(new THREE.HemisphereLight('#c8d9dd','#252d2b',1.2));const key=new THREE.DirectionalLight('#d3e4e4',2);key.position.set(3,5,4);scene.add(key);
   const rim=new THREE.DirectionalLight('#f6c886',1.4);rim.position.set(-4,3,-2);scene.add(rim);
   const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));geom.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));geom.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(data.skinIndex,4));geom.setAttribute('skinWeight',new THREE.Float32BufferAttribute(data.skinWeight,4));geom.setIndex(data.indices);geom.computeVertexNormals();
   const mesh=new THREE.SkinnedMesh(geom,new THREE.MeshStandardMaterial({color:'#777a74',roughness:.88}));
   const bones=data.bones.map(b=>{const bone=new THREE.Bone();bone.name=b.name;return bone});
   data.bones.forEach((b,i)=>{const parent=b.parent;if(parent>=0){bones[parent].add(bones[i]);bones[i].position.fromArray(b.p).sub(new THREE.Vector3().fromArray(data.bones[parent].p));}else{mesh.add(bones[i]);bones[i].position.fromArray(b.p)}});
   mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));
   // Temporary clothing shells share the same skin weights and skeleton. They
   // are fit proxies, not tailored garments or final cloth simulation.
   function garment(test,color,offset){
     const shell=geom.clone(),p=shell.getAttribute('position'),n=shell.getAttribute('normal');
     for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*offset,p.getY(i)+n.getY(i)*offset,p.getZ(i)+n.getZ(i)*offset);
     const faces=[];for(let j=0;j<data.indices.length;j+=3){const tri=data.indices.slice(j,j+3);if(tri.every(i=>test(data.positions[i*3],data.positions[i*3+1],data.positions[i*3+2])))faces.push(...tri)}
     shell.setIndex(faces);shell.computeVertexNormals();const cloth=new THREE.SkinnedMesh(shell,new THREE.MeshStandardMaterial({color,roughness:.97,side:THREE.DoubleSide}));
     mesh.add(cloth);cloth.bind(mesh.skeleton,mesh.bindMatrix);return cloth;
   }
   garment((x,y,z)=>y>.05&&y<6.02&&Math.abs(x)<4.15,'#99998c',.16);
   garment((x,y,z)=>y<.22,'#303937',.10);
   mesh.scale.setScalar(.105);mesh.position.y=.94;scene.add(mesh);
   const floor=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshStandardMaterial({color:'#303835',roughness:1}));floor.rotation.x=-Math.PI/2;scene.add(floor);
   state.current={renderer,scene,camera,bones:Object.fromEntries(bones.map(b=>[b.name,b]))};setReady(true);continueRender(handle);
  }catch(e){cancelRender(e)}})();
  return()=>{disposed=true;state.current=null;scene?.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});renderer?.dispose()};
 },[handle,width,height]);
 useEffect(()=>{const s=state.current;if(!s)return;const t=frame/fps;const amount=Math.min(t/2,1);const b=s.bones;
   // Pose towards a slumped sitting silhouette, driven by skeletal transforms.
   b['upperleg01.L'].rotation.x=-1.05*amount;b['upperleg01.R'].rotation.x=-1.05*amount;
   b['lowerleg01.L'].rotation.x=1.05*amount;b['lowerleg01.R'].rotation.x=1.05*amount;
   b['upperarm01.L'].rotation.z=-.24*amount;b['upperarm01.R'].rotation.z=.24*amount;
   b['neck01'].rotation.x=.25*amount;b['head'].rotation.x=.12*amount;
   s.renderer.render(s.scene,s.camera);
 },[frame,fps,ready]);
 return <AbsoluteFill><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
}
