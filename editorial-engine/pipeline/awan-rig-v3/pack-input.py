#!/usr/bin/env python3
"""Create private V3 input package; no credentials or publishing."""
import hashlib,json,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[2]; D=R/'deliverables/awan-rig-v3'
media=[f'assets/generated/awan-rig-v2/{n}.png' for n in ['rooftop','microcloud','rainstreet']]+['audio/voiceovers/awan-rig-v3/narasi-utuh.mp3']
spec=json.loads((R/'content/recovered/awan-500-ton-rig-v3.json').read_text(encoding='utf-8'))
data={n:(R/n).read_bytes() for n in media}
data['NARASI.txt']=(' '.join(s['narration'] for s in spec['scenes'])+'\n').encode()
manifest={n:hashlib.sha256(raw).hexdigest() for n,raw in data.items()}
D.mkdir(parents=True,exist_ok=True);p=D/'01-INPUT-PRIVAT-RIG-V3.zip'
with zipfile.ZipFile(p,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for n,raw in data.items():z.writestr(n,raw)
 z.writestr('MANIFEST-SHA256.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(p) as z:
 if z.testzip() is not None:raise ValueError('bad input archive CRC')
 for n,d in manifest.items():
  if hashlib.sha256(z.read(n)).hexdigest()!=d:raise ValueError(f'Bad hash {n}')
print(json.dumps({'file':str(p),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'entries':len(manifest)+1},indent=2))
