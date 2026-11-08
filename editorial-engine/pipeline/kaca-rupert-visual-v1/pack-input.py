#!/usr/bin/env python3
"""Pack exact private backgrounds and voice take, without credentials."""
import hashlib,json,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'deliverables/kaca-rupert-visual-v1'
media=['assets/generated/kaca-rupert/ruang-lab.png','assets/generated/kaca-rupert/dalam-kaca.png','audio/voiceovers/kaca-rupert/narasi-utuh.mp3']
spec=json.loads((R/'content/recovered/kaca-pangeran-rupert-visual-v1.json').read_text(encoding='utf-8'))
data={n:(R/n).read_bytes() for n in media};data['NARASI.txt']=(' '.join(s['narration'] for s in spec['scenes'])+'\n').encode()
manifest={n:hashlib.sha256(v).hexdigest() for n,v in data.items()};D.mkdir(parents=True,exist_ok=True);out=D/'01-INPUT-PRIVAT.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for n,v in data.items():z.writestr(n,v)
 z.writestr('MANIFEST-SHA256.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(out) as z:
 if z.testzip() is not None:raise ValueError('Input CRC mismatch')
 for n,h in manifest.items():
  if hashlib.sha256(z.read(n)).hexdigest()!=h:raise ValueError(f'Bad SHA {n}')
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'md5':hashlib.md5(out.read_bytes()).hexdigest(),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()},indent=2))
