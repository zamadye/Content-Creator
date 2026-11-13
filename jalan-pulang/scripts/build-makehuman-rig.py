#!/usr/bin/env python3
"""Convert MakeHuman CC0 body + default rig to compact Three.js skin data."""
import json
from pathlib import Path
base=Path('assets/makehuman'); v=[]; uv=[]; faces=[]; group=''
for line in (base/'base.obj').read_text().splitlines():
 b=line.split()
 if not b:continue
 if b[0]=='v': v.append(list(map(float,b[1:4])))
 elif b[0]=='vt': uv.append(list(map(float,b[1:3])))
 elif b[0]=='g': group=b[1]
 elif b[0]=='f' and group=='body': faces.append([tuple(map(int,x.split('/')[:2])) for x in b[1:]])
r=json.loads((base/'default.mhskel').read_text());w=json.loads((base/'default_weights.mhw').read_text())['weights']; names=list(r['bones']); lookup={n:i for i,n in enumerate(names)}
bones=[]
for name in names:
 b=r['bones'][name]; members=r['joints'][b['head']]; p=[sum(v[i][j] for i in members)/len(members) for j in range(3)];bones.append({'name':name,'parent':lookup[b['parent']] if b['parent'] is not None else -1,'p':p})
influences=[[] for _ in v]
for n,weights in w.items():
 if n in lookup:
  for vi,value in weights:
   if vi<len(v) and value>0: influences[vi].append((value,lookup[n]))
pos=[];tex=[];skinidx=[];skinweights=[];indices=[];source=[]; lut={}; unweighted=0
for face in faces:
 for vertex,coord in face:
  key=(vertex,coord)
  if key in lut: continue
  lut[key]=len(pos)//3;source.append(vertex-1);pos.extend(v[vertex-1]);tex.extend(uv[coord-1]); inf=sorted(influences[vertex-1],reverse=True)[:4]
  if not inf: inf=[(1,lookup['root'])]; unweighted+=1
  total=sum(x[0] for x in inf); skinidx.extend([i for _,i in inf]+[0]*(4-len(inf)));skinweights.extend([round(z/total,6) for z,_ in inf]+[0]*(4-len(inf)))
 for k in range(1,len(face)-1): indices.extend([lut[face[0]],lut[face[k]],lut[face[k+1]]])
out={'positions':pos,'uv':tex,'skinIndex':skinidx,'skinWeight':skinweights,'indices':indices,'sourceVertex':source,'bones':bones}
Path('public/makehuman/rigged-body.json').write_text(json.dumps(out,separators=(',',':')))
print(f'{len(pos)//3} vertices, {len(indices)//3} triangles, {len(names)} bones, {unweighted} root fallbacks')
