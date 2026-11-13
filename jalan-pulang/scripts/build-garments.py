#!/usr/bin/env python3
"""Fit CC0 MakeHuman garments to the unmodified MakeHuman base + default rig.

Inputs: assets/makehuman/{base.obj,default_weights.mhw,default.mhskel};
assets/garments-src/{name}.json and .bin.gz from the pinned upstream release.
This generates runtime JSON; numpy/Blender is not required. Fitting math follows
MakeHuman's three-reference .mhclo barycentric fit; weights are transferred
and reduced to four per vertex. Inspect deformation before production use.
"""
import gzip, json, struct
from pathlib import Path
from collections import defaultdict
base=Path('assets/makehuman');src=Path('assets/garments-src');out=Path('public/garments')
v=[]
for line in (base/'base.obj').read_text().splitlines():
 if line.startswith('v '):v.append(list(map(float,line.split()[1:4])))
rig=json.loads((base/'default.mhskel').read_text());names=list(rig['bones']);lookup={n:i for i,n in enumerate(names)}
weights=json.loads((base/'default_weights.mhw').read_text())['weights']; influences=[[] for _ in v]
for name,vals in weights.items():
 if name in lookup:
  for vi,w in vals:
   if 0<=vi<len(v) and w>0:influences[vi].append((lookup[name],w))
for name in ['namuhekam_male_polo_shirt','cortu_cargo_pants','shoes01']:
 info=json.loads((src/(name+'.json')).read_text());raw=gzip.decompress((src/(name+'.bin.gz')).read_bytes())
 def arr(key):
  off,count,typ,*rest=info['layout'][key]
  if rest:raise ValueError('Unexpected packed layout')
  return list(struct.unpack_from('<'+str(count)+typ,raw,off))
 refs=arr('refs');w=arr('weights');offset=arr('offsets');uv=arr('uv');source=arr('source');indices=arr('indices');hidden=arr('delete')
 scales=[]
 for k,axis in enumerate('xyz'):
  spec=info['scale'].get(axis)
  scales.append(abs(v[spec[0]][k]-v[spec[1]][k])/spec[2] if spec else 1)
 fitted=[];sk=[];sw=[]
 for i in range(info['vertexCount']):
  r=refs[3*i:3*i+3];ww=w[3*i:3*i+3]
  if any(x>=len(v) for x in r):raise ValueError('Reference outside base mesh')
  fitted.extend([sum(ww[j]*v[r[j]][k] for j in range(3))+offset[3*i+k]*scales[k] for k in range(3)])
  mix=defaultdict(float)
  for j in range(3):
   for bone,weight in influences[r[j]]:mix[bone]+=weight*ww[j]
  best=sorted(((z,b) for b,z in mix.items() if z>0),reverse=True)[:4] or [(1,lookup['root'])]
  total=sum(z for z,b in best);sk.append([b for z,b in best]+[0]*(4-len(best)));sw.append([z/total for z,b in best]+[0]*(4-len(best)))
 # source maps UV-seam vertices to the fitted garment vertices.
 result={'positions':[fitted[3*i+k] for i in source for k in range(3)],'uv':uv,'indices':indices,
         'skinIndex':[b for i in source for b in sk[i]],'skinWeight':[w for i in source for w in sw[i]],'hidden':hidden,'texture':info['texture']}
 assert len(result['positions'])//3==len(uv)//2 and all(i<len(source) for i in indices)
 (out/(name+'.json')).write_text(json.dumps(result,separators=(',',':')))
 print(name,'render vertices',len(source),'triangles',len(indices)//3,'hidden',len(hidden))
