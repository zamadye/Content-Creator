import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

// Procedural, deterministic material maps: no external still image plates.
export function makeMap(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = kind === 'road' ? '#6a6e68' : kind === 'bark' ? '#725e49' : '#435448';
  ctx.fillRect(0, 0, 256, 256);
  let seed = kind === 'road' ? 112 : kind === 'bark' ? 94 : 68;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i=0; i<5000; i++) {
    const shade = Math.floor(rnd()*80); ctx.fillStyle = `rgba(${shade},${shade},${shade},${0.04+rnd()*0.12})`;
    const x=rnd()*256,y=rnd()*256; ctx.fillRect(x,y,kind === 'bark' ? 1+rnd()*2 : 1+rnd()*4,kind === 'bark' ? 5+rnd()*35 : 1+rnd()*4);
  }
  if (kind === 'road') {
    ctx.strokeStyle='rgba(12,15,13,0.7)'; ctx.lineWidth=1;
    for (let i=0; i<12; i++) { let x=rnd()*256,y=rnd()*256; ctx.beginPath();ctx.moveTo(x,y);for(let j=0;j<8;j++){x+=(rnd()-.5)*14;y+=rnd()*12;ctx.lineTo(x,y);}ctx.stroke(); }
  }
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(kind === 'road' ? 2 : 1, kind === 'road' ? 12 : 2); map.anisotropy = 4; return map;
}

export const ForestTest = () => {
  const canvas = useRef(null), state = useRef(null);
  const frame = useCurrentFrame(); const {fps, width, height} = useVideoConfig();
  const [handle] = useState(() => delayRender('Load Kenney character'));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let disposed = false, renderer, scene;
    try {
      renderer = new THREE.WebGLRenderer({canvas:canvas.current, antialias:true, preserveDrawingBuffer:true});
      renderer.setSize(width,height,false); renderer.setPixelRatio(1); renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.35;
      scene = new THREE.Scene(); scene.background=new THREE.Color('#132a30'); scene.fog=new THREE.FogExp2('#132a30',0.038);
      const camera = new THREE.PerspectiveCamera(38,width/height,0.1,100);
      camera.position.set(0,2.8,10);camera.lookAt(0,1.3,-3);
      scene.add(new THREE.HemisphereLight('#9bbec2','#17231d',1.65));
      const moon=new THREE.DirectionalLight('#b7dce0',2.4);moon.position.set(-5,9,5);scene.add(moon);
      const roadMap=makeMap('road'), barkMap=makeMap('bark'), groundMap=makeMap('ground');
      const groundMat=new THREE.MeshStandardMaterial({color:'#55715d',map:groundMap,roughness:1});
      const roadMat=new THREE.MeshStandardMaterial({color:'#828e88',map:roadMap,roughness:0.8,metalness:0.02});
      const trunkMat=new THREE.MeshStandardMaterial({color:'#877665',map:barkMap,roughness:0.94});
      const leavesMat=new THREE.MeshStandardMaterial({color:'#324c3f',roughness:0.94});
      const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,75),groundMat);floor.rotation.x=-Math.PI/2;floor.position.set(0,-.03,-20);scene.add(floor);
      const road=new THREE.Mesh(new THREE.PlaneGeometry(4.6,75),roadMat);road.rotation.x=-Math.PI/2;road.position.set(0,0,-20);scene.add(road);
      const trunkGeo=new THREE.CylinderGeometry(.15,.22,7,9), foliageGeo=new THREE.IcosahedronGeometry(1,1);
      for(let i=0;i<42;i++){
        const side=i%2?1:-1,row=Math.floor(i/2), group=new THREE.Group();
        group.position.set(side*(3.3+(row%3)*.8),0,5-row*2.3);
        const trunk=new THREE.Mesh(trunkGeo,trunkMat);trunk.position.y=3.5;group.add(trunk);
        for(let k=0;k<3;k++){const crown=new THREE.Mesh(foliageGeo,leavesMat);crown.position.set((k-1)*.65,6.5+(k%2)*.5,0);crown.scale.set(1.5,1.1,1.4);group.add(crown);}scene.add(group);
      }
      // 3D sign geometry, lettering is a separately editable canvas texture.
      const post=new THREE.Mesh(new THREE.CylinderGeometry(.05,.06,2.7,8),new THREE.MeshStandardMaterial({color:'#6e5543',roughness:.85,metalness:.35}));post.position.set(2.8,1.35,-6);post.rotation.z=.12;scene.add(post);
      const board=new THREE.Mesh(new THREE.BoxGeometry(2.35,.72,.1),new THREE.MeshStandardMaterial({color:'#adb5a6',roughness:.86,metalness:.15}));board.position.set(2.96,2.45,-6);board.rotation.z=-.12;scene.add(board);
      const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=160;const sx=signCanvas.getContext('2d');sx.fillStyle='#b5bcae';sx.fillRect(0,0,512,160);sx.fillStyle='#24302b';sx.textAlign='center';sx.font='bold 42px sans-serif';sx.fillText('DESA SUKAMAJU',256,62);sx.font='bold 52px sans-serif';sx.fillText('12 km',256,123);
      const signMap=new THREE.CanvasTexture(signCanvas);signMap.colorSpace=THREE.SRGBColorSpace;
      const label=new THREE.Mesh(new THREE.PlaneGeometry(2.2,.64),new THREE.MeshBasicMaterial({map:signMap}));label.position.set(2.96,2.45,-5.94);label.rotation.z=-.12;scene.add(label);
      const loader=new GLTFLoader();loader.load(staticFile('kenney/character.glb'),gltf=>{
        if(disposed)return;const character=gltf.scene;character.scale.setScalar(1.4);scene.add(character);
        const mixer=new THREE.AnimationMixer(character);const walk=THREE.AnimationClip.findByName(gltf.animations,'walk');if(walk)mixer.clipAction(walk).play();
        state.current={renderer,scene,camera,character,mixer};setReady(true);continueRender(handle);
      },undefined,error=>cancelRender(error));
    } catch(error) {cancelRender(error);}
    return ()=>{disposed=true;state.current=null;if(scene)scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){const mats=Array.isArray(obj.material)?obj.material:[obj.material];for(const m of mats){if(m.map)m.map.dispose();m.dispose();}}});renderer?.dispose();};
  },[handle,height,width]);
  useEffect(()=>{
    if(!ready||!state.current)return;const {renderer,scene,camera,character,mixer}=state.current;const t=frame/fps;
    character.position.set(-.25+t*.04,0,1-t*.14);character.rotation.y=Math.PI;mixer.setTime(t);
    camera.position.x=Math.sin(t*.12)*.18;camera.lookAt(0,1.3,-3);renderer.render(scene,camera);
  },[fps,frame,ready]);
  return <AbsoluteFill style={{backgroundColor:'#09171c'}}><canvas ref={canvas} style={{width:'100%',height:'100%'}} /></AbsoluteFill>;
};
