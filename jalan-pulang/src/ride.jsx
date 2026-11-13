import React, {useEffect, useRef, useState} from 'react';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import {makeMap} from './forest';
import {createRiggedEntity,poseSeated,loadGarments} from './rigged-entity';

// Stylised work-in-progress, not a representation of the final Dimas or Supra.
export const RideTest = ({showWarung = false, warungScene = "", detailCamera = false, resolutionScale = 1}) => {
  const canvas=useRef(null), state=useRef(null), frame=useCurrentFrame();
  const {fps,width,height}=useVideoConfig();
  const [handle]=useState(()=>delayRender('Load Kenney vegetation'));
  const [ready,setReady]=useState(false);
  useEffect(()=>{
    let disposed=false, scene, renderer, mirrorTarget;
    try {
      renderer=new THREE.WebGLRenderer({canvas:canvas.current,antialias:true,preserveDrawingBuffer:true});
      renderer.setSize(Math.round(width*resolutionScale),Math.round(height*resolutionScale),false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
      scene=new THREE.Scene();scene.background=new THREE.Color('#14262b');scene.fog=null; // Clear visibility requested across the ride and warung shots.
      const camera=new THREE.PerspectiveCamera(40,width/height,.1,100);camera.position.set(3.4,2.55,6.8);camera.lookAt(0,1,-3);
      scene.add(new THREE.HemisphereLight('#9bbdc0','#24332e',1.1));const moon=new THREE.DirectionalLight('#a6c1c6',1.6);moon.position.set(-4,8,4);scene.add(moon);
      const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
      const black=mat('#151b1a'), rubber=mat('#1d2020',.95), maroon=mat('#6d2b31',.5,.16), steel=mat('#909c97',.35,.7), cloth=mat('#35413f',.98), pants=mat('#27363d'), skin=mat('#a8846b'), glow=new THREE.MeshBasicMaterial({color:'#ffe3a0'}), red=new THREE.MeshBasicMaterial({color:'#b73129'});
      // Deterministic procedural surface maps: color and relief share the same
      // pattern, while roughness varies at a finer scale. No external images.
      const surface=(kind,base)=>{
        const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
        ctx.fillStyle=base;ctx.fillRect(0,0,256,256);
        let seed=kind==='wood'?739:kind==='cloth'?182:481;
        const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
        if(kind==='wood'){
          for(let i=0;i<300;i++){const x=rand()*256;ctx.strokeStyle=`rgba(${rand()>.5?20:220},${rand()>.5?20:180},${rand()>.5?15:135},${.02+rand()*.09})`;ctx.lineWidth=.3+rand()*2;ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+rand()*8-4,85,x+rand()*8-4,175,x+rand()*8-4,256);ctx.stroke()}
          for(let y=0;y<256;y+=64){ctx.fillStyle='rgba(10,8,6,.35)';ctx.fillRect(0,y,256,2)}
        } else if(kind==='cloth'){
          for(let i=0;i<256;i+=2){ctx.fillStyle='rgba(220,225,215,.035)';ctx.fillRect(i,0,1,256);ctx.fillStyle='rgba(0,0,0,.035)';ctx.fillRect(0,i,256,1)}
          for(let i=0;i<1400;i++){ctx.fillStyle=`rgba(210,210,200,${rand()*.05})`;ctx.fillRect(rand()*256,rand()*256,1,1)}
          // Uneven age stains and fine creases over the woven base.
          for(let i=0;i<24;i++){const x=rand()*256,y=rand()*256,r=3+rand()*18;const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(48,37,23,${.06+rand()*.10})`);g.addColorStop(1,'rgba(48,37,23,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,2*r,2*r)}
          for(let i=0;i<30;i++){let x=rand()*256;ctx.strokeStyle='rgba(55,53,42,.08)';ctx.lineWidth=.5+rand();ctx.beginPath();ctx.moveTo(x,0);ctx.bezierCurveTo(x+8*rand(),70,x-8*rand(),160,x+3*rand(),256);ctx.stroke()}
        }else{
          for(let x=0;x<256;x+=22){ctx.fillStyle='rgba(20,23,20,.22)';ctx.fillRect(x,0,4,256);ctx.fillStyle='rgba(230,220,190,.10)';ctx.fillRect(x+5,0,3,256)}
          for(let i=0;i<1200;i++){ctx.fillStyle=`rgba(40,25,10,${rand()*.15})`;ctx.fillRect(rand()*256,rand()*256,1+rand()*3,1+rand()*3)}
        }
        const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
        // Derive tangent-space normals and a separate linear roughness map from
        // the surface height variation. These are procedural, not scan data.
        const pixels=ctx.getImageData(0,0,256,256).data;
        const n=document.createElement('canvas'),r=document.createElement('canvas');n.width=n.height=r.width=r.height=256;
        const nc=n.getContext('2d'),rc=r.getContext('2d'),ni=nc.createImageData(256,256),ri=rc.createImageData(256,256);
        const h=(x,y)=>{const i=(((y+256)%256)*256+(x+256)%256)*4;return (pixels[i]+pixels[i+1]+pixels[i+2])/765};
        for(let y=0;y<256;y++)for(let x=0;x<256;x++){
          const i=(y*256+x)*4, dx=(h(x-1,y)-h(x+1,y))*1.7,dy=(h(x,y-1)-h(x,y+1))*1.7;
          const v=new THREE.Vector3(dx,dy,1).normalize();ni.data[i]=128+127*v.x;ni.data[i+1]=128+127*v.y;ni.data[i+2]=128+127*v.z;ni.data[i+3]=255;
          const rough=Math.max(0,Math.min(255,(kind==='metal'?150:207)+(h(x,y)-.4)*60));ri.data[i]=ri.data[i+1]=ri.data[i+2]=rough;ri.data[i+3]=255;
        }
        nc.putImageData(ni,0,0);rc.putImageData(ri,0,0);
        const normalMap=new THREE.CanvasTexture(n),roughnessMap=new THREE.CanvasTexture(r);
        normalMap.wrapS=normalMap.wrapT=roughnessMap.wrapS=roughnessMap.wrapT=THREE.RepeatWrapping;
        return new THREE.MeshStandardMaterial({map,normalMap,normalScale:new THREE.Vector2(.7,.7),roughnessMap,roughness:1,metalness:kind==='metal'?.65:0});
      };
      const woodSurface=surface('wood','#695845'),clothSurface=surface('cloth','#d2cbb6'),roofSurface=surface('metal','#777b6d');
      const addBox=(parent,w,h,d,m,x,y,z)=>{let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);parent.add(o);return o};
      const addSphere=(parent,r,m,x,y,z)=>{let o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);o.position.set(x,y,z);parent.add(o);return o};
      const link=(parent,a,b,r,m)=>{const d=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a));let o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d.length(),8),m);o.position.copy(new THREE.Vector3(...a).add(new THREE.Vector3(...b)).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());parent.add(o);return o};
      const roadMap=makeMap('road');const floor=new THREE.Mesh(new THREE.PlaneGeometry(60,95),mat('#283a2f'));floor.rotation.x=-Math.PI/2;floor.position.set(0,-.03,-25);scene.add(floor);
      const road=new THREE.Mesh(new THREE.PlaneGeometry(5.5,90),new THREE.MeshStandardMaterial({color:'#6e7b75',map:roadMap,bumpMap:roadMap,bumpScale:.025,roughness:.85,metalness:.02}));road.rotation.x=-Math.PI/2;road.position.set(0,.001,-25);scene.add(road);
      const trunkMat=mat('#665b4b'), leafMat=mat('#304d3e');const trunkGeom=new THREE.CylinderGeometry(.12,.23,8,9), crownGeom=new THREE.IcosahedronGeometry(1,1);
      let trees=[]; for(let i=0;i<32;i++){let row=Math.floor(i/2),side=i%2?1:-1,g=new THREE.Group();g.position.set(side*(3.6+(row%3)*.8),0,4-row*2.5);let tr=new THREE.Mesh(trunkGeom,trunkMat);tr.position.y=4;g.add(tr);for(let k=0;k<3;k++){let l=new THREE.Mesh(crownGeom,leafMat);l.position.set((k-1)*.8,7.5+(k%2)*.5,0);l.scale.set(1.7,1.1,1.6);g.add(l)}scene.add(g);trees.push({g,base:row*2.5,side});}
      // Modular closed warung, positioned to the left of the road. Kept as one
      // movable set so the exact same geometry can be reused for later loops.
      const warung=new THREE.Group();warung.position.set(-6,0,-22);scene.add(warung);
      const timber=woodSurface, wall=woodSurface, roof=roofSurface, dark=mat('#171f1b');
      // Individual boards provide real seams and thickness rather than a
      // single texture painted across a box.
      for(let i=0;i<14;i++)addBox(warung,5,.16,.216,timber,0,.08,-1.42+i*.218);
      for(let i=0;i<21;i++)addBox(warung,.23,2.2,.14,wall,-2.38+i*.238,1.2,-1.45);
      for(let y of [.25,1.12,2.13])addBox(warung,4.85,.10,.12,timber,0,y,-1.34);
      addBox(warung,.14,2.2,3,wall,-2.45,1.2,0);
      addBox(warung,.14,2.2,3,wall,2.45,1.2,0);
      for(const x of [-2.35,2.35]) for(const z of [-1.35,1.35])addBox(warung,.15,2.65,.15,timber,x,1.32,z);
      // Roof ribs read as corrugated metal even in low-light.
      const roofMain=addBox(warung,5.8,.12,3.7,roof,0,2.65,0);roofMain.rotation.x=.07;
      for(let k=0;k<25;k++)addBox(warung,.025,.055,3.65,roof,-2.75+k*.23,2.75,0);
      addBox(warung,1.35,1.3,.06,dark,0,1.25,-1.36);
      // Closed shop: a table and upturned stools underneath the roof.
      const tableBlockout=new THREE.Group();warung.add(tableBlockout);
      addBox(tableBlockout,1.65,.11,.9,timber,0,.83,.1);
      for(const x of [-.7,.7])for(const z of [-.28,.48])addBox(tableBlockout,.09,.8,.09,timber,x,.42,z);
      for(const x of [-.45,.45]){addBox(warung,.48,.08,.43,timber,x,.93,.08);for(const dx of [-.17,.17])for(const dz of [-.14,.14])addBox(warung,.05,.4,.05,timber,x+dx,1.17,.08+dz)}
      // Banyan trunk and aerial roots are distinct meshes, not a flat plate.
      const banyan=new THREE.Group();banyan.position.set(-3.25,0,-1.2);warung.add(banyan);
      for(let i=0;i<6;i++){let root=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,3,6),trunkMat);root.position.set(Math.cos(i*Math.PI/3)*.8,3.5,Math.sin(i*Math.PI/3)*.8);banyan.add(root)}
      warung.visible=showWarung || Boolean(warungScene);
      const bulbPivot=new THREE.Group();bulbPivot.position.set(1.6,2.60,1.22);warung.add(bulbPivot);
      addBox(bulbPivot,.025,.50,.025,black,0,-.25,0);
      const bulbMat=new THREE.MeshStandardMaterial({color:'#ffe5a0',emissive:'#e2a43d',emissiveIntensity:2,roughness:.3});
      const bulbMesh=addSphere(bulbPivot,.12,bulbMat,0,-.54,0);
      const bulbLight=new THREE.PointLight('#ffbe57',16,7,2);bulbLight.position.y=-.54;bulbPivot.add(bulbLight);
      bulbPivot.visible=Boolean(warungScene);
      if(warungScene){renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;bulbLight.castShadow=true;bulbLight.shadow.mapSize.set(512,512);bulbLight.shadow.bias=-.0004;}

      // Sculpted low-poly human proportions; articulated transforms remain
      // procedural (not a skeletal rig). Body and limbs are 3D curved meshes.
      const figure=new THREE.Group();figure.position.set(1.45,0,.75);figure.rotation.y=Math.PI;warung.add(figure);
      const figureHair=mat('#111714',.93), figureSkin=mat('#a59882',.95), trouser=mat('#29302c',.96);
      addBox(figure,.58,.10,.55,timber,0,.55,0);
      for(const x of [-.22,.22])for(const z of [-.2,.2])addBox(figure,.07,.5,.07,timber,x,.28,z);
      const body=new THREE.Group();body.position.set(0,.94,0);figure.add(body);
      const figureTorso=new THREE.Mesh(new THREE.CylinderGeometry(.20,.25,.58,16,3),clothSurface);figureTorso.scale.z=.62;figureTorso.position.y=.05;figureTorso.rotation.x=.12;body.add(figureTorso);
      const collar=new THREE.Mesh(new THREE.TorusGeometry(.105,.018,8,20),mat('#858779'));collar.rotation.x=Math.PI/2;collar.position.set(0,.35,0);body.add(collar);
      const headPivot=new THREE.Group();headPivot.position.set(0,.37,0);headPivot.rotation.x=.52;body.add(headPivot);
      // Anatomical head from CC0 MakeHuman source, with generated rough skin;
      // this head is not yet rigged and the face is deliberately not revealed.
      const hair=addSphere(headPivot,.145,figureHair,0,.34,-.005);hair.scale.set(1,.55,.95);
      for(let i=0;i<20;i++){const a=i*Math.PI*2/20, lock=new THREE.Mesh(new THREE.CapsuleGeometry(.012,.09+(i%4)*.025,4,7),figureHair);lock.position.set(Math.cos(a)*.125,.27,Math.sin(a)*.12);lock.rotation.z=Math.cos(a)*.17;headPivot.add(lock)}
      for(const side of [-1,1]){
        addSphere(body,.095,clothSurface,side*.21,.26,0);
        link(body,[side*.21,.25,0],[side*.25,-.12,.06],.075,clothSurface);
        link(body,[side*.25,-.12,.06],[side*.28,-.36,.02],.058,clothSurface);
        const hand=addSphere(body,.052,figureSkin,side*.28,-.40,.02);hand.scale.set(.7,1.55,.7);
        for(let f=0;f<4;f++)link(body,[side*.28+(f-1.5)*.018,-.43,.02],[side*.28+(f-1.5)*.02,-.52-(f%2)*.016,.025],.009,figureSkin);
        link(figure,[side*.13,.68,0],[side*.15,.54,.34],.105,trouser);
        addSphere(figure,.102,trouser,side*.15,.54,.34);
        link(figure,[side*.15,.54,.34],[side*.15,.16,.36],.077,trouser);
        const shoe=addSphere(figure,.10,black,side*.15,.11,.41);shoe.scale.set(.8,.55,1.45);
      }
      figure.visible=warungScene==='seated';
      let standingEntity=null, dimas=null, skinnedRider=null, shadowActor=null, mirror=null, mirrorCamera=null;
      const bike=new THREE.Group();scene.add(bike);bike.visible=!warungScene || ['call','brake','mirror','shadow','release','aftermath'].includes(warungScene);
      const shadow=new THREE.Mesh(new THREE.CircleGeometry(.65,32),new THREE.MeshBasicMaterial({color:'#000000',transparent:true,opacity:.24,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.scale.set(1,2,1);shadow.position.y=.012;bike.add(shadow);
      const wheels=[];for(let z of [-.8,.8]){const wheel=new THREE.Group();wheel.position.set(0,.38,z);wheel.rotation.y=Math.PI/2;bike.add(wheel);const tyre=new THREE.Mesh(new THREE.TorusGeometry(.34,.075,10,24),rubber);wheel.add(tyre);const rim=new THREE.Mesh(new THREE.TorusGeometry(.27,.025,8,24),steel);wheel.add(rim);for(let j=0;j<6;j++){let spoke=new THREE.Mesh(new THREE.BoxGeometry(.54,.018,.015),steel);spoke.rotation.z=j*Math.PI/6;wheel.add(spoke)}wheels.push(wheel);}
      addBox(bike,.45,.35,1.25,maroon,0,.71,0);addBox(bike,.38,.17,.76,black,0,1.01,.25);addBox(bike,.3,.55,.34,maroon,0,.9,-.65);link(bike,[0,.65,-.1],[0,.39,-.8],.06,steel);link(bike,[0,.82,-.68],[0,.38,-.8],.045,steel);link(bike,[-.42,1.1,-.68],[.42,1.1,-.68],.035,steel);
      addSphere(bike,.16,glow,0,1.02,-.85);addBox(bike,.3,.12,.05,red,0,.98,.93);addBox(bike,.42,.25,.3,black,0,1.16,.72);
      const lamp=new THREE.SpotLight('#ffe4a6',32,22,Math.PI/7,.65,1.5);lamp.position.set(0,1,-.9);lamp.target.position.set(0,0,-10);bike.add(lamp,lamp.target);
      // Visible headlight wash on road, subtle and independent of screen-space overlays.
      const lightCanvas=document.createElement('canvas');lightCanvas.width=lightCanvas.height=128;const lx=lightCanvas.getContext('2d');const gradient=lx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,224,150,0.40)');gradient.addColorStop(.35,'rgba(255,224,150,0.16)');gradient.addColorStop(1,'rgba(255,224,150,0)');lx.fillStyle=gradient;lx.fillRect(0,0,128,128);const washMap=new THREE.CanvasTexture(lightCanvas);washMap.colorSpace=THREE.SRGBColorSpace;const wash=new THREE.Mesh(new THREE.PlaneGeometry(5,9),new THREE.MeshBasicMaterial({map:washMap,transparent:true,depthWrite:false}));wash.rotation.x=-Math.PI/2;wash.position.set(0,.015,-5);bike.add(wash);
      const rider=new THREE.Group();bike.add(rider);let torso=addBox(rider,.52,.72,.32,cloth,0,1.48,.15);torso.rotation.x=-.18;addSphere(rider,.21,skin,0,1.98,.09);let helmet=addSphere(rider,.24,black,0,2.04,.1);helmet.scale.set(1,.75,1);
      for(let side of [-1,1]){link(rider,[side*.28,1.72,.12],[side*.36,1.45,-.2],.10,cloth);link(rider,[side*.36,1.45,-.2],[side*.39,1.1,-.67],.075,cloth);addSphere(rider,.075,skin,side*.39,1.1,-.67);link(rider,[side*.17,1.14,.26],[side*.35,.90,-.03],.11,pants);link(rider,[side*.35,.90,-.03],[side*.32,.6,.35],.085,pants);addBox(rider,.17,.12,.27,black,side*.32,.56,.28)}
      if(['call','mirror','shadow','release','aftermath'].includes(warungScene)){rider.visible=false;lamp.intensity=0;wash.visible=false;}
      const loader=new GLTFLoader();loader.load(staticFile('kenney-nature/plant_bush.glb'),gltf=>{
        if(disposed)return;let bushes=[];for(let i=0;i<18;i++){let b=gltf.scene.clone();let side=i%2?1:-1,row=Math.floor(i/2);b.position.set(side*(3.2+(row%2)*.65),0,4-row*4);b.scale.setScalar(.8+(row%3)*.2);scene.add(b);bushes.push({g:b,base:row*4});}
        new OBJLoader().load(staticFile('makehuman/entity-head.obj'),async head=>{
          try {
            if(disposed)return;
            head.traverse(o=>{if(o.isMesh){o.material=figureSkin;o.geometry.computeVertexNormals()}});headPivot.add(head);
            // Load licensed photo-derived PBR maps before releasing the frame.
            const textures=new THREE.TextureLoader();
            const load=(name,color=false,repeat=[1,1])=>textures.loadAsync(staticFile('pbr/'+name)).then(t=>{t.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);return t});
            const [metalColor,metalNormal,metalRough,metalness,asphaltColor,asphaltNormal,asphaltRough,woodColor,woodNormal,woodRough]=await Promise.all([
              load('metal_rusty_paint_Color.png',true),load('metal_rusty_paint_NormalGL.jpg'),load('metal_rusty_paint_Roughness.jpg'),load('metal_rusty_paint_Metalness.jpg'),
              load('street_asphalt_Color.png',true,[2,25]),load('street_asphalt_NormalGL.jpg',false,[2,25]),load('street_asphalt_Roughness.jpg',false,[2,25]),
              load('wood_planks_diffuse.jpg',true,[1,.125]),load('wood_planks_normal.jpg',false,[1,.125]),load('wood_planks_rough.jpg',false,[1,.125])]);
            Object.assign(timber,{map:woodColor,normalMap:woodNormal,roughnessMap:woodRough,roughness:1,metalness:0});timber.needsUpdate=true;
            Object.assign(roof,{map:metalColor,normalMap:metalNormal,roughnessMap:metalRough,metalnessMap:metalness,roughness:1,metalness:1});roof.needsUpdate=true;
            Object.assign(road.material,{color:new THREE.Color('#949d98'),map:asphaltColor,normalMap:asphaltNormal,roughnessMap:asphaltRough,bumpMap:null,roughness:1,metalness:0});road.material.needsUpdate=true;
            // Replace blockout crowns with authored 3D vegetation. Each model
            // keeps its original mesh; the material clone is darkened for night.
            const [treeAsset,fernAsset,tableAsset]=await Promise.all([
              loader.loadAsync(staticFile('nature-cc0/tree.glb')),
              loader.loadAsync(staticFile('nature-cc0/fern.glb')),
              loader.loadAsync(staticFile('models/wooden_table_02/wooden_table_02_1k.gltf'))]);
            tableBlockout.visible=false;const authoredTable=tableAsset.scene;authoredTable.scale.set(1.45,1.04,1.28);authoredTable.position.set(0,.03,.1);warung.add(authoredTable);
            const darken=(root)=>root.traverse(o=>{if(o.isMesh&&o.material){o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const c=m.clone();c.color?.multiplyScalar(.38);c.roughness=.95;return c});if(o.material.length===1)o.material=o.material[0]}});
            darken(treeAsset.scene);darken(fernAsset.scene);
            const giant=treeAsset.scene.clone();giant.scale.setScalar(.85);banyan.add(giant);
            for(const item of trees){while(item.g.children.length)item.g.remove(item.g.children[0]);const model=treeAsset.scene.clone();model.scale.setScalar(.7+(item.base%3)*.08);item.g.add(model)}
            if(warungScene){
              for(const [x,z,scale] of [[-12,-10,.65],[1,-10,.65],[-12,-17,.8],[5,-18,.85]]){const tree=treeAsset.scene.clone();tree.position.set(x,0,z);tree.scale.setScalar(scale);scene.add(tree)}
              for(const [x,z,scale] of [[-8,-3,.18],[-9,-4,.16],[1,-5,.20],[3,-7,.17]]){const fern=fernAsset.scene.clone();fern.position.set(x,0,z);fern.scale.setScalar(scale);scene.add(fern)}
            }
            if(!warungScene || warungScene==='brake'){
              const response=await fetch(staticFile('makehuman/rigged-body.json'));if(!response.ok)throw Error(`Rider rig HTTP ${response.status}`);
              const data=await response.json();const clothes=await loadGarments(staticFile);if(disposed)return;
              const outfit=clothes.map(g=>({data:g.data,material:g.material.clone()}));outfit[0].material.color.set('#596a61');
              skinnedRider=createRiggedEntity(data,null,outfit);skinnedRider.mesh.material.color.set('#967765');
              poseSeated(skinnedRider.bones);skinnedRider.mesh.scale.setScalar(.105);
              skinnedRider.mesh.position.set(0,1.04,.15);skinnedRider.mesh.rotation.y=Math.PI;bike.add(skinnedRider.mesh);
              // Helmet is a separate rigid accessory; clothing is the same CC0 outfit as the standing rig.
              const helmet=new THREE.Mesh(new THREE.SphereGeometry(1.02,24,16),black);helmet.scale.set(1,.8,1);helmet.position.set(0,1,.1);skinnedRider.bones.head.add(helmet);
              rider.visible=false;
            }
            if(warungScene==='seated'){
              const response=await fetch(staticFile('makehuman/rigged-body.json'));if(!response.ok)throw Error(`Entity rig HTTP ${response.status}`);
              const data=await response.json();if(disposed)return;
              const entity=createRiggedEntity(data,clothSurface);poseSeated(entity.bones);entity.mesh.scale.setScalar(.105);entity.mesh.position.set(1.45,.58,.75);entity.mesh.rotation.y=Math.PI;warung.add(entity.mesh);
              // Keep only the chair from the original figure group.
              figure.children.slice(5).forEach(child=>{child.visible=false});
              // Slatted backrest, placed behind the seated figure (towards road).
              for(const x of [-.23,.23])addBox(figure,.055,.72,.055,timber,x,.91,-.23);
              for(const y of [.78,1.03,1.24])addBox(figure,.51,.07,.055,timber,0,y,-.23);
            }
            if(['standing','call','brake','mirror','shadow','release','aftermath'].includes(warungScene)){
              const response=await fetch(staticFile('makehuman/rigged-body.json'));if(!response.ok)throw Error(`Entity rig HTTP ${response.status}`);
              const data=await response.json();if(disposed)return;
              const garments=await loadGarments(staticFile);if(disposed)return;
              standingEntity=createRiggedEntity(data,clothSurface,garments);
              // Standing on the road shoulder, facing approaching Dimas.
              standingEntity.mesh.scale.setScalar(.105);standingEntity.mesh.position.set(2.9,.86,2.8);standingEntity.mesh.rotation.y=0;warung.add(standingEntity.mesh);
              standingEntity.bones['neck01'].rotation.x=.12;
              if(['call','brake','mirror','shadow','release','aftermath'].includes(warungScene)){
                // Dimas is alongside the stopped bike; the phone appears only during the call.
                const dimasClothes=garments.map(g=>({data:g.data,material:g.material.clone()}));dimasClothes[0].material.color.set('#596a61');
                dimas=createRiggedEntity(data,null,dimasClothes);
                dimas.mesh.material.color.set('#967765');dimas.mesh.scale.setScalar(.105);
                dimas.mesh.position.set(-1.0,.86,1.0);dimas.mesh.rotation.y=.35;scene.add(dimas.mesh);
                dimas.bones['upperarm01.L'].rotation.z=-.62;
                dimas.bones['upperarm01.R'].rotation.z=-.35;
                dimas.bones['lowerarm01.R'].rotation.z=-2.1;
                const phoneGroup=new THREE.Group();phoneGroup.position.set(-.18,-.25,.13);phoneGroup.visible=!['brake','aftermath'].includes(warungScene);dimas.bones['wrist.R'].add(phoneGroup);
                addBox(phoneGroup,.85,1.45,.14,black,0,0,0);
                const screenCanvas=document.createElement('canvas');screenCanvas.width=256;screenCanvas.height=512;const sx=screenCanvas.getContext('2d');sx.fillStyle='#122c33';sx.fillRect(0,0,256,512);sx.fillStyle='#deede6';sx.textAlign='center';sx.font='32px sans-serif';sx.fillText('Ibu',128,190);sx.font='16px sans-serif';sx.fillText('Panggilan',128,230);const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;
                const screen=new THREE.Mesh(new THREE.PlaneGeometry(.72,1.3),new THREE.MeshBasicMaterial({map:screenTexture}));screen.position.z=.075;phoneGroup.add(screen);
              }
              if(['mirror','shadow','release'].includes(warungScene)){
                shadowActor=createRiggedEntity(data);const shade=new THREE.MeshBasicMaterial({color:'#101c1d',transparent:true,opacity:.88,depthWrite:false});
                shadowActor.mesh.traverse(o=>{if(o.isMesh)o.material=shade});shadowActor.mesh.scale.setScalar(.105);
                if(warungScene==='mirror'){
                  poseSeated(shadowActor.bones);shadowActor.mesh.position.set(0,1.04,.5);bike.add(shadowActor.mesh);
                  mirrorTarget=new THREE.WebGLRenderTarget(512,512);mirrorTarget.texture.colorSpace=THREE.SRGBColorSpace;
                  mirrorCamera=new THREE.PerspectiveCamera(40,1,.05,30);mirrorCamera.position.set(0,1.85,-1.55);mirrorCamera.lookAt(0,1.4,.55);scene.add(mirrorCamera);
                  mirror=new THREE.Group();mirror.position.set(-.63,1.63,-.65);bike.add(mirror);
                  const edge=new THREE.Mesh(new THREE.CircleGeometry(.37,48),black);edge.scale.set(1,.73,1);mirror.add(edge);
                  const surface=new THREE.Mesh(new THREE.CircleGeometry(.325,48),new THREE.MeshBasicMaterial({map:mirrorTarget.texture}));surface.scale.set(1,.73,1);surface.position.z=.012;mirror.add(surface);
                  link(bike,[-.39,1.1,-.67],[-.63,1.63,-.65],.022,steel);
                }else{
                  shadowActor.mesh.position.set(-1.5,.90,.65);shadowActor.mesh.rotation.y=.35;scene.add(shadowActor.mesh);
                  shadowActor.bones['neck01'].rotation.x=.38;shadowActor.bones['head'].rotation.x=.25;
                  shadowActor.bones['upperarm01.L'].rotation.z=-.52;shadowActor.bones['upperarm01.R'].rotation.z=.52;
                }
              }
              // Black eyes parented to the head, with geometry rather than a screen overlay.
              const blackEyes=new THREE.MeshStandardMaterial({color:'#050706',roughness:.15});
              for(const side of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.19,16,10),blackEyes);eye.position.set(side*.32,.52,.81);eye.scale.set(1,.68,.38);standingEntity.bones.head.add(eye)}
            }
            if(warungScene){scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});bulbMesh.castShadow=false;wash.castShadow=false;}
            state.current={renderer,scene,camera,bike,rider,wheels,trees,bushes,roadMap,asphaltColor,asphaltNormal,asphaltRough,warung,bulbPivot,bulbLight,figure,body,headPivot,standingEntity,dimas,skinnedRider,shadowActor,mirror,mirrorCamera,mirrorTarget};setReady(true);continueRender(handle);
          } catch(error){cancelRender(error)}
        },undefined,error=>cancelRender(error));
      },undefined,error=>cancelRender(error));
    }catch(error){cancelRender(error)}
    return()=>{disposed=true;state.current=null;if(scene)scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of (Array.isArray(o.material)?o.material:[o.material])){m.map?.dispose();m.dispose()}}});mirrorTarget?.dispose();renderer?.dispose()};
  },[handle,width,height,showWarung,warungScene,resolutionScale]);
  useEffect(()=>{if(!ready||!state.current)return;const s=state.current,t=frame/fps,travel=t*2.5;
    const stopped=['call','brake','mirror','shadow','release','aftermath'].includes(warungScene);
    const brakeDistance=Math.min(t,3)*1.5-Math.min(t,3)**2*.25;
    s.bike.position.y=stopped?0:Math.sin(t*7)*.018;
    s.bike.rotation.z=warungScene==='brake'?(-.08*Math.min(t/3,1)):stopped?-.08:Math.sin(t*.8)*.025;
    s.bike.position.z=warungScene==='brake' ? 1.5-brakeDistance*.67 : 0;
    s.rider.visible=!s.skinnedRider && (warungScene==='brake'?t<4:!stopped) && !['call','mirror','shadow','release','aftermath'].includes(warungScene);
    if(s.skinnedRider){s.skinnedRider.mesh.visible=warungScene==='brake'?t<4:!stopped;s.skinnedRider.bones.spine01.rotation.z=Math.sin(t*.8)*.025;}
    s.rider.rotation.z=Math.sin(t*.8)*.012;
    for(const w of s.wheels)w.rotation.z=warungScene==='brake'?brakeDistance/.34:stopped?0:travel/.34;
    for(const item of s.trees)item.g.position.z=4-((item.base-travel+40)%40);
    for(const item of s.bushes)item.g.position.z=4-((item.base-travel+36)%36);
    for(const map of [s.asphaltColor,s.asphaltNormal,s.asphaltRough])map.offset.y=stopped?0:-travel/6;
    if(warungScene){
      s.warung.position.z=-6;s.body.rotation.z=0;s.headPivot.rotation.x=.52;s.bulbPivot.rotation.z=Math.sin(t*Math.PI*2/3)*Math.PI/30;
      s.bulbLight.intensity=16+(Math.sin(t*4)*.5);
      if(s.dimas){
        s.standingEntity.bones.head.rotation.z=Math.sin(t*.25)*.02;
        s.dimas.bones.spine01.rotation.z=Math.sin(t*.65)*.018;
        s.dimas.bones.head.rotation.x=.12+Math.sin(t*.35)*.025;
        s.dimas.bones['wrist.R'].rotation.z=Math.sin(t*1.5)*.025;
        if(warungScene==='brake'){
          const steps=Math.min(Math.max((t-4)/3,0),1);
          s.dimas.mesh.visible=t>=4;s.dimas.mesh.position.set(-.35-.65*steps,.86,.45+.55*steps);
          s.dimas.bones['upperarm01.R'].rotation.z=.62;s.dimas.bones['lowerarm01.R'].rotation.z=0;
          s.dimas.bones['upperleg01.L'].rotation.x=Math.sin((t-4)*5)*.25*(1-steps);
          s.dimas.bones['upperleg01.R'].rotation.x=-Math.sin((t-4)*5)*.25*(1-steps);
          s.camera.position.set(3.8,2.25,5.4);s.camera.lookAt(-.8,1,-.8);
        }else if(warungScene==='aftermath'){
          s.standingEntity.mesh.visible=t<12.5;s.bulbLight.intensity=t<11.5?16:0;s.bulbPivot.visible=t<11.5;
          s.standingEntity.bones['upperarm01.R'].rotation.z=-.6*(1-Math.min(t/3,1));
          s.dimas.bones['upperarm01.R'].rotation.z=.62;s.dimas.bones['lowerarm01.R'].rotation.z=0;
          s.camera.position.set(2.2+Math.sin(t*.1)*.1,1.95,4.8);s.camera.lookAt(-2,1.3,-2.5);
        }else if(warungScene==='mirror'){
          s.camera.position.set(-1.5,1.83,.8);s.camera.lookAt(-.6,1.58,-.65);s.mirror.lookAt(s.camera.position);
        }else if(warungScene==='shadow'||warungScene==='release'){
          const fade=warungScene==='release'?Math.min(t/10,1):0;
          s.shadowActor.mesh.position.z=.65-fade*.4;s.shadowActor.mesh.position.y=.88+fade*.08;
          s.shadowActor.mesh.traverse(o=>{if(o.isMesh)o.material.opacity=.88*(1-fade)});
          s.camera.position.set(.65+Math.sin(t*.15)*.09,1.75,3.6);s.camera.lookAt(-1,1.38,.85);
        }else if(detailCamera){s.camera.position.set(.8+Math.sin(t*.12)*.08,1.75,3.3);s.camera.lookAt(-1,1.45,1);}else{s.camera.position.set(3.8+Math.sin(t*.12)*.2,2.25,5.4-Math.min(t*.012,1));s.camera.lookAt(-.8,1.0,-.8);}
      }else if(s.standingEntity){
        const b=s.standingEntity.bones;
        // The hand slowly rises, then waves; animation is deterministic at every frame.
        const raise=Math.min(1,Math.max(0,(t-11)/2));
        b['upperarm01.R'].rotation.z=-raise*1.1;
        b['lowerarm01.R'].rotation.z=-raise*.4;
        b['wrist.R'].rotation.z=raise*Math.sin(t*1.9)*.22;
        b['head'].rotation.z=Math.sin(t*.6)*.035;
        s.camera.position.set(-1.7,1.55,1.5-t*.045);s.camera.lookAt(-3.1,1.2,-3.2);
      }else if(detailCamera){s.camera.position.set(-3.55,1.52,-1.1-t*.03);s.camera.lookAt(-4.55,1.03,-5.2)}else{s.camera.position.set(-1.8,1.95,3.6-t*.08);s.camera.lookAt(-4.9,1.32,-5.0);}
      for(const item of s.trees)item.g.visible=false;
      for(const item of s.bushes)item.g.visible=false;
    }else{s.warung.position.z=-22+travel;s.camera.position.x=3.4+Math.sin(t*.25)*.15;s.camera.lookAt(showWarung ? -Math.min(t/9,1)*1.5 : 0,1,-3);}
    if(s.mirror){
      // Render a real second viewpoint into the mirror, excluding its own plane.
      s.mirror.visible=false;s.shadowActor.mesh.visible=true;s.dimas.mesh.visible=false;
      s.renderer.setRenderTarget(s.mirrorTarget);s.renderer.render(s.scene,s.mirrorCamera);s.renderer.setRenderTarget(null);
      s.mirror.visible=true;s.shadowActor.mesh.visible=false;s.dimas.mesh.visible=true;
    }
    s.renderer.render(s.scene,s.camera);
  },[fps,frame,ready,showWarung,warungScene,detailCamera]);
  return <AbsoluteFill style={{backgroundColor:'#14262b'}}><canvas ref={canvas} style={{width:'100%',height:'100%'}}/></AbsoluteFill>;
};
