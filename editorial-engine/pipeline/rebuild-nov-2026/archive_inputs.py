#!/usr/bin/env python3
"""Archive one episode's private input art and voice for Drive backup, without posting."""
import hashlib
import json
import sys
import zipfile
from pathlib import Path
import os
ROOT=Path(__file__).resolve().parents[2]
os.chdir(ROOT)
ID=sys.argv[1]
records=json.loads(Path('content/recovered/week-2026-11-11-narration.json').read_text())['episodes']
ep=next(e for e in records if e['id']==ID)
out=Path('deliverables/rebuild-2026-11-11')/ID/'00-ASSET-INPUTS-PRIVAT.zip'
out.parent.mkdir(parents=True,exist_ok=True)
files={'narasi-voice05.mp3':Path('audio/voiceovers/rebuild-2026-11-11')/f'{ID}.mp3','ilustrasi-asli.png':Path('assets/generated/rebuild-2026-11-11')/f'{ID}.png'}
if not all(p.is_file() for p in files.values()):sys.exit('Missing private voice or image')
manifest=[]
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=7) as z:
 for name,p in files.items():
  data=p.read_bytes();z.writestr(name,data);manifest.append((hashlib.sha256(data).hexdigest(),name))
 text=json.dumps(ep,ensure_ascii=False,indent=2).encode();z.writestr('naskah-dan-sumber.json',text);manifest.append((hashlib.sha256(text).hexdigest(),'naskah-dan-sumber.json'))
 z.writestr('BACA-DULU.txt','Cadangan input privat, bukan video selesai. Voice-05; pelafalan, subtitle, visual dan hak penggunaan perlu ditinjau manusia. Belum dijadwalkan. Source nonrahasia tersimpan di Git branch sesi.\n')
 z.writestr('SHA256SUMS.txt',''.join(f'{h}  {n}\n' for h,n in manifest))
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
raw=out.read_bytes()
print(json.dumps({'file':str(out),'bytes':len(raw),'md5':hashlib.md5(raw).hexdigest(),'sha256':hashlib.sha256(raw).hexdigest()}))
