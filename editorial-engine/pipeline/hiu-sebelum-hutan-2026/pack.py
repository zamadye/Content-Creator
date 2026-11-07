#!/usr/bin/env python3
"""Create and verify one private, self-describing backup. No upload/publication."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'deliverables/shark-2026-11-07';OUT=D/'cadangan-privat-hiu-sebelum-hutan.zip'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
outputs=['hiu-sebelum-hutan.mp4','hiu-sebelum-hutan-thumbnail.png','hiu-sebelum-hutan-poster-4x5.png','caption-4-platform.txt','subtitle-perkiraan.srt','narasi-gabungan.mp3','musik-tonal-original.wav','QA-DAN-SUMBER.md','SHA256SUMS.txt']
files={f'hasil/{n}':D/n for n in outputs};files['input/01-INPUT-PRIVAT-HIU.zip']=D/'01-INPUT-PRIVAT-HIU.zip'
for name in ['README.md','build.sh','captions.py','host.tsx','prepare.py','qa.py','render.tsx','restore-input.py','pack.py']:
 files[f'source/editorial-engine/pipeline/hiu-sebelum-hutan-2026/{name}']=ROOT/'pipeline/hiu-sebelum-hutan-2026'/name
for name in ['package.json','package-lock.json','content/recovered/hiu-sebelum-hutan-2026-11-07.json']:
 files[f'source/editorial-engine/{name}']=ROOT/name
for name in ['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf']:
 files[f'source/editorial-engine/assets/fonts/{name}']=ROOT/'assets/fonts'/name
for name,p in files.items():
 if not p.is_file():raise FileNotFoundError(f'{name}: {p}')
prepared=json.loads((D/'prepared.json').read_text(encoding='utf8'));timeline={k:prepared[k] for k in ['id','timeline','cues','duration','fps','speechTempo','narrationSHA256','timingNote']}
notes=f'''CADANGAN PRIVAT — HIU SEBELUM HUTAN
Source branch arena/54cb36c6-content-creator; Git HEAD saat pengepakan: {commit}.
Input berisi ilustrasi dan segmen suara privat, naskah, dan manifest sendiri.
Hasil memuat MP4, thumbnail dan poster mandiri, caption, SRT perkiraan, satu master
narasi, musik asli dan QA. Pulihkan checkout commit, salin input ZIP ke path di
README, lalu jalankan build.sh. Dependency tidak disertakan; npm ci membutuhkan
akses registry. Hasil byte dapat berbeda; audit ulang sebelum penggunaan.
Build ulang penuh, mendengarkan manusia, subtitle word-level, gerak penuh, ponsel,
platform, dan hak suara/citra belum diuji. ZIP ini tidak membuktikan publikasi.
MANIFEST-SHA256.json memuat hash setiap entri lainnya.
'''
extras={'TIMELINE-TANPA-PATH.json':json.dumps(timeline,ensure_ascii=False,indent=2).encode(),'BACA-DULU.txt':notes.encode()};manifest={}
with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
 for name,p in files.items():
  raw=p.read_bytes();manifest[name]=hashlib.sha256(raw).hexdigest();z.writestr(name,raw)
 for name,raw in extras.items():manifest[name]=hashlib.sha256(raw).hexdigest();z.writestr(name,raw)
 z.writestr('MANIFEST-SHA256.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(OUT) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(manifest)|{'MANIFEST-SHA256.json'}
 for name,digest in manifest.items():assert hashlib.sha256(z.read(name)).hexdigest()==digest,name
raw=OUT.read_bytes();print(json.dumps({'file':str(OUT),'entries':len(manifest),'bytes':len(raw),'md5':hashlib.md5(raw).hexdigest(),'sha256':hashlib.sha256(raw).hexdigest(),'commit':commit}))
