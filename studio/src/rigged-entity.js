import * as THREE from 'three';

// Deterministic, low-contrast pore and tonal variation shared by all rigs.
// The UV material is procedural (not a scan); maps are cached per browser
// instance to avoid regenerating them for every character in a busy set.
let skinMaps;
function getSkinMaps(){
 if(typeof document==='undefined')return {};
 if(skinMaps)return skinMaps;
 const size=256,albedo=document.createElement('canvas'),normal=document.createElement('canvas'),rough=document.createElement('canvas');
 for(const c of [albedo,normal,rough])c.width=c.height=size;
 const ac=albedo.getContext('2d'),nc=normal.getContext('2d'),rc=rough.getContext('2d');
 const a=ac.createImageData(size,size),n=nc.createImageData(size,size),r=rc.createImageData(size,size),heights=new Float32Array(size*size);
 let seed=72841;for(let i=0;i<heights.length;i++){seed=(seed*1664525+1013904223)>>>0;heights[i]=(seed>>>16)/65535;}
 const h=(x,y)=>heights[((y+size)%size)*size+(x+size)%size];
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const i=(y*size+x)*4,v=h(x,y),m=.965+.035*v;
  a.data[i]=255*m;a.data[i+1]=252*m;a.data[i+2]=248*m;a.data[i+3]=255;
  const dx=(h(x-1,y)-h(x+1,y))*.12,dy=(h(x,y-1)-h(x,y+1))*.12;
  const len=Math.hypot(dx,dy,1);n.data[i]=128+127*dx/len;n.data[i+1]=128+127*dy/len;n.data[i+2]=128+127/len;n.data[i+3]=255;
  r.data[i]=r.data[i+1]=r.data[i+2]=205+Math.round(v*22);r.data[i+3]=255;
 }
 ac.putImageData(a,0,0);nc.putImageData(n,0,0);rc.putImageData(r,0,0);
 const map=new THREE.CanvasTexture(albedo);map.colorSpace=THREE.SRGBColorSpace;
 const normalMap=new THREE.CanvasTexture(normal),roughnessMap=new THREE.CanvasTexture(rough);
 skinMaps={map,normalMap,roughnessMap,normalScale:new THREE.Vector2(.32,.32)};return skinMaps;
}

// Skinned MakeHuman CC0 mesh. Coordinates in the data remain in original
// model units; the root scale controls the character's world height.
export function createRiggedEntity(data, shirtMaterial = null, garments = null) {
 const geom=new THREE.BufferGeometry();
 if(garments && !data.sourceVertex)throw Error('Rig is missing original vertex mapping for garment masks');
 geom.setAttribute('position',new THREE.Float32BufferAttribute(data.positions,3));
 geom.setAttribute('uv',new THREE.Float32BufferAttribute(data.uv,2));
 geom.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(data.skinIndex,4));
 geom.setAttribute('skinWeight',new THREE.Float32BufferAttribute(data.skinWeight,4));
 if(garments){
  const hidden=new Set(garments.flatMap(g=>g.data.hidden));const visible=[];
  for(let i=0;i<data.indices.length;i+=3){const tri=data.indices.slice(i,i+3);if(tri.every(v=>!hidden.has(data.sourceVertex[v])))visible.push(...tri)}
  geom.setIndex(visible);
 }else geom.setIndex(data.indices);
 geom.computeVertexNormals();
 const mesh=new THREE.SkinnedMesh(geom,new THREE.MeshStandardMaterial({color:'#8b9086',roughness:.93,...getSkinMaps()}));
 const bones=data.bones.map(b=>{const o=new THREE.Bone();o.name=b.name;return o});
 data.bones.forEach((b,i)=>{if(b.parent<0){mesh.add(bones[i]);bones[i].position.fromArray(b.p)}else{bones[b.parent].add(bones[i]);bones[i].position.fromArray(b.p).sub(new THREE.Vector3().fromArray(data.bones[b.parent].p))}});
 mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));
 const byName=Object.fromEntries(bones.map(b=>[b.name,b]));
 // Trousers and sleeves follow original vertex weights; their shapes are
 // temporary inflated shells, not simulated or production-fitted clothing.
 if(!garments){
 function bodyShell(test,color,offset){
  const g=geom.clone(),p=g.getAttribute('position'),n=g.getAttribute('normal');
  for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*offset,p.getY(i)+n.getY(i)*offset,p.getZ(i)+n.getZ(i)*offset);
  const faces=[];for(let i=0;i<data.indices.length;i+=3){const tri=data.indices.slice(i,i+3);if(tri.every(k=>test(...data.positions.slice(k*3,k*3+3))))faces.push(...tri)}
  g.setIndex(faces);g.computeVertexNormals();const m=new THREE.SkinnedMesh(g,new THREE.MeshStandardMaterial({color,roughness:.98,side:THREE.DoubleSide}));mesh.add(m);m.bind(mesh.skeleton,mesh.bindMatrix);
 }
 bodyShell((x,y)=>y<.35,'#242b2a',.18);
 bodyShell((x,y)=>y>1.0&&y<5.7&&Math.abs(x)>1.32&&Math.abs(x)<4.15,'#b3aea0',.22);
 // Loose shirt is independent 3D geometry. Skin weights are transferred from
 // nearest body vertices; the method is approximate, requiring fitting QA.
 const pos=[],uv=[],idx=[],si=[],sw=[];const rows=14,cols=28;
 for(let j=0;j<=rows;j++)for(let k=0;k<=cols;k++){
  const y=-.5+j*6.25/rows,a=k*2*Math.PI/cols;
  const rx=y>4.5?1.66:y<1?1.58:1.53,rz=y>4.5?.92:1.08;
  const fold=(.045*Math.sin(a*9+y*2.3)+.025*Math.sin(a*15-y*1.8))*(1-j/rows*.35);
  const x=(rx+fold)*Math.cos(a),z=.05+(rz+fold)*Math.sin(a);pos.push(x,y,z);uv.push(k/cols,j/rows);
  let best=0,dist=Infinity;for(let v=0;v<data.positions.length/3;v++){const dx=x-data.positions[v*3],dy=y-data.positions[v*3+1],dz=z-data.positions[v*3+2],d=dx*dx+dy*dy+dz*dz;if(d<dist){dist=d;best=v}}
  si.push(...data.skinIndex.slice(best*4,best*4+4));sw.push(...data.skinWeight.slice(best*4,best*4+4));
 }
 for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){let a=j*(cols+1)+k,b=a+cols+1;idx.push(a,b,a+1,b,b+1,a+1)}
 const shirt=new THREE.BufferGeometry();shirt.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));shirt.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));shirt.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));shirt.setAttribute('skinWeight',new THREE.Float32BufferAttribute(sw,4));shirt.setIndex(idx);shirt.computeVertexNormals();
 const cloth=new THREE.SkinnedMesh(shirt,shirtMaterial || new THREE.MeshStandardMaterial({color:'#b3aea0',roughness:.97,side:THREE.DoubleSide}));mesh.add(cloth);cloth.bind(mesh.skeleton,mesh.bindMatrix);
 } else {
  for(const item of garments){
   const d=item.data,g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(d.positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(d.uv,2));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(d.skinIndex,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(d.skinWeight,4));g.setIndex(d.indices);g.computeVertexNormals();
   const garment=new THREE.SkinnedMesh(g,item.material);mesh.add(garment);garment.bind(mesh.skeleton,mesh.bindMatrix);
  }
 }
 const hair=new THREE.Mesh(new THREE.SphereGeometry(.88,24,16),new THREE.MeshStandardMaterial({color:'#141916',roughness:1}));hair.scale.set(1,.65,1);hair.position.set(0,1.1,.2);byName.head.add(hair);
 // Irregular sparse locks break up the smooth helmet-like hair silhouette.
 const hairMat=hair.material;for(let i=0;i<26;i++){const a=i*2*Math.PI/26;const strand=new THREE.Mesh(new THREE.CapsuleGeometry(.035,.34+(i%4)*.06,3,6),hairMat);strand.position.set(Math.cos(a)*.74,.75,Math.sin(a)*.75+.2);strand.rotation.z=-Math.cos(a)*.12;byName.head.add(strand)}
 return {mesh,bones:byName};
}
export function poseSeated(b,amount=1){
 b['upperleg01.L'].rotation.x=-1.35*amount;b['upperleg01.R'].rotation.x=-1.35*amount;
 b['lowerleg01.L'].rotation.x=1.25*amount;b['lowerleg01.R'].rotation.x=1.25*amount;
 b['upperarm01.L'].rotation.z=-.65*amount;b['upperarm01.R'].rotation.z=.65*amount;
 b['spine01'].rotation.x=.12*amount;b['neck01'].rotation.x=.32*amount;b['head'].rotation.x=.20*amount;
}

// Temporary material assignment for the torso beneath the imperfect shirt
// shell. This prevents exposed skin through fitting gaps; it is not a garment
// mesh or a substitute for proper clothing simulation.
export function coverTorso(entity, data, clothMaterial) {
 const skin=[],cloth=[];
 for(let i=0;i<data.indices.length;i+=3){
  const tri=data.indices.slice(i,i+3);
  const y=tri.reduce((sum,v)=>sum+data.positions[v*3+1],0)/3;
  const x=tri.reduce((sum,v)=>sum+data.positions[v*3],0)/3;
  (y>-.45&&y<5.65&&Math.abs(x)<1.75?cloth:skin).push(...tri);
 }
 const geom=entity.mesh.geometry;geom.setIndex([...skin,...cloth]);geom.clearGroups();geom.addGroup(0,skin.length,0);geom.addGroup(skin.length,cloth.length,1);
 entity.mesh.material=[entity.mesh.material,clothMaterial];
}

// Garment meshes + UV maps are pre-fitted to the matching MakeHuman base.
export async function loadGarments(staticFile, names=['namuhekam_male_polo_shirt','cortu_cargo_pants','shoes01']) {
 return Promise.all(names.map(async name=>{
  const response=await fetch(staticFile(`garments/${name}.json`));
  if(!response.ok)throw Error(`Garment ${name}: HTTP ${response.status}`);
  const data=await response.json();
  const texture=await new THREE.TextureLoader().loadAsync(staticFile(`garments/${data.texture}`));texture.colorSpace=THREE.SRGBColorSpace;
  return {data,material:new THREE.MeshStandardMaterial({map:texture,roughness:.95,side:THREE.DoubleSide})};
 }));
}

// A single full outfit avoids overlapping separate top/trouser meshes.
export const loadRidingGarments=staticFile=>loadGarments(staticFile,['male_casualsuit05','shoes01']);

// Authored CC0 MakeHuman UV skin texture. Caller awaits before rendering.
export async function loadSkin(staticFile,name='skin_young_asian_male'){
 const texture=await new THREE.TextureLoader().loadAsync(staticFile(`skin/${name}.jpg`));texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function applySkin(entity,texture){
 entity.mesh.material.map=texture;entity.mesh.material.color.set('#ffffff');entity.mesh.material.needsUpdate=true;
 // The MakeHuman base excludes separate eyeball meshes. Add eyes at their
 // anatomical eye bones rather than relying on the exposed eyelid texture.
 const sclera=new THREE.MeshStandardMaterial({color:'#dfd6c4',roughness:.42}),iris=new THREE.MeshStandardMaterial({color:'#211c18',roughness:.28});
 for(const side of ['L','R']){
  const bone=entity.bones[`eye.${side}`];if(bone.getObjectByName('authored-eye'))continue;
  const eye=new THREE.Group();eye.name='authored-eye';bone.add(eye);
  const white=new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),sclera);eye.add(white);
  const pupil=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),iris);pupil.position.z=.125;pupil.scale.z=.38;eye.add(pupil);
 }
}

