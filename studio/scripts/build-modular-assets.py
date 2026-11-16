#!/usr/bin/env python3
"""Build reproducible metre-scale architectural draft meshes; textures remain shared in public/pbr."""
import json, struct
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'public/library'
# Box faces are deliberately independent for flat normals and undistorted UVs.
faces=[((1,0,0),[(1,0,0),(1,1,0),(1,1,1),(1,0,1)],(2,1)),((-1,0,0),[(0,0,1),(0,1,1),(0,1,0),(0,0,0)],(2,1)),((0,1,0),[(0,1,1),(1,1,1),(1,1,0),(0,1,0)],(0,2)),((0,-1,0),[(0,0,0),(1,0,0),(1,0,1),(0,0,1)],(0,2)),((0,0,1),[(1,0,1),(1,1,1),(0,1,1),(0,0,1)],(0,1)),((0,0,-1),[(0,0,0),(0,1,0),(1,1,0),(1,0,0)],(0,1))]
def build(name,boxes,prefix):
 pos=[];nor=[];uv=[];tan=[];indices=[]
 for center,size in boxes:
  for normal,corners,axes in faces:
   base=len(pos)//3
   tangent=tuple(corners[3][k]-corners[0][k] for k in range(3))
   bitangent=tuple(corners[1][k]-corners[0][k] for k in range(3))
   cross=(normal[1]*tangent[2]-normal[2]*tangent[1],normal[2]*tangent[0]-normal[0]*tangent[2],normal[0]*tangent[1]-normal[1]*tangent[0])
   handed=1 if sum(cross[k]*bitangent[k] for k in range(3))>0 else -1
   for j,c in enumerate(corners):
    pos.extend(center[k]+(c[k]-.5)*size[k] for k in range(3));nor.extend(normal);tan.extend((*tangent,handed))
    uv.extend(((0,0),(0,size[axes[1]]),(size[axes[0]],size[axes[1]]),(size[axes[0]],0))[j])
   indices.extend([base,base+1,base+2,base,base+2,base+3])
 blob=b''; views=[];access=[]
 def add(values,fmt,typ,comp,mins=None,maxs=None,target=34962):
  nonlocal blob
  blob+=b'\0'*((-len(blob))%4); off=len(blob); data=struct.pack('<'+str(len(values))+fmt,*values);blob+=data
  views.append({'buffer':0,'byteOffset':off,'byteLength':len(data),'target':target});a={'bufferView':len(views)-1,'componentType':comp,'count':len(values)//{'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[typ],'type':typ}
  if mins is not None:a['min']=mins;a['max']=maxs
  access.append(a);return len(access)-1
 mins=[min(pos[k::3]) for k in range(3)];maxs=[max(pos[k::3]) for k in range(3)]
 p=add(pos,'f','VEC3',5126,mins,maxs);n=add(nor,'f','VEC3',5126);u=add(uv,'f','VEC2',5126);t=add(tan,'f','VEC4',5126);ix=add(indices,'H','SCALAR',5123,[min(indices)],[max(indices)],34963)
 obj={'asset':{'version':'2.0','generator':'Content-Creator modular asset builder 1.0'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':name}],'meshes':[{'primitives':[{'attributes':{'POSITION':p,'NORMAL':n,'TANGENT':t,'TEXCOORD_0':u},'indices':ix,'material':0}]}], 'buffers':[{'uri':name+'.bin','byteLength':len(blob)}], 'bufferViews':views,'accessors':access,'samplers':[{'wrapS':10497,'wrapT':10497}], 'images':[{'uri':'../../pbr/'+prefix+'_Color.png'},{'uri':'../../pbr/'+prefix+'_NormalGL.jpg'},{'uri':'../../pbr/'+prefix+'_Roughness.jpg'}], 'textures':[{'sampler':0,'source':i} for i in range(3)],'materials':[{'name':prefix,'pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicRoughnessTexture':{'index':2},'metallicFactor':0,'roughnessFactor':1},'normalTexture':{'index':1}}]}
 d=root/name;d.mkdir(parents=True,exist_ok=True);(d/(name+'.gltf')).write_text(json.dumps(obj,indent=2)+'\n');(d/(name+'.bin')).write_bytes(blob)
build('road-straight',[((0,-.05,0),(4,.1,10))],'street_asphalt')
build('wall-plain',[((0,1.5,0),(4,3,.2))],'wall_plaster_dirty')
build('wall-door',[((-1.5,1.5,0),(1,3,.2)),((1.5,1.5,0),(1,3,.2)),((0,2.6,0),(2,.8,.2))],'wall_plaster_dirty')
