#!/usr/bin/env python3
"""Extract the head of MakeHuman CC0 base.obj; retains its authored UVs.
This is an open-neck head, not a retopologized or rigged character.
"""
from pathlib import Path
src=Path('assets/makehuman/base.obj'); out=Path('public/makehuman/entity-head.obj')
vs=[]; uvs=[]; faces=[]; group=''
for line in src.read_text().splitlines():
    bits=line.split()
    if not bits: continue
    if bits[0]=='v': vs.append(tuple(map(float,bits[1:4])))
    elif bits[0]=='vt': uvs.append(bits[1:])
    elif bits[0]=='g': group=bits[1]
    elif bits[0]=='f' and group=='body':
        face=[tuple(map(int,v.split('/')[:2])) for v in bits[1:]]
        if all(vs[v-1][1] >= 6.2 for v,_ in face): faces.append(face)
used_v=sorted({v for f in faces for v,t in f}); used_t=sorted({t for f in faces for v,t in f})
vm={v:i+1 for i,v in enumerate(used_v)};tm={v:i+1 for i,v in enumerate(used_t)}
with out.open('w') as f:
    f.write('# Head extracted from MakeHuman base mesh, CC0; see PROVENANCE.md\n')
    for v in used_v:
        x,y,z=vs[v-1]; f.write(f'v {x*.17:.6f} {(y-6.2)*.17+.03:.6f} {(z-.6)*.17:.6f}\n')
    for t in used_t: f.write('vt '+' '.join(uvs[t-1])+'\n')
    for face in faces: f.write('f '+' '.join(f'{vm[v]}/{tm[t]}' for v,t in face)+'\n')
print(f'{out}: {len(used_v)} vertices, {len(faces)} faces, {len(used_t)} UVs')
