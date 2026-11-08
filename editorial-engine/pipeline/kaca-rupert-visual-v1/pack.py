#!/usr/bin/env python3
"""Create a hash-manifested PRIVATE backup (no credentials)."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'deliverables/kaca-rupert-visual-v1';OUT=D/'cadangan-privat-kaca-rupert.zip'
try:commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True,stderr=subprocess.DEVNULL).strip()
except (subprocess.CalledProcessError,FileNotFoundError):commit='UNKNOWN'
outputs=['kaca-rupert-visual-v1.mp4','kaca-rupert-thumbnail.png','kaca-rupert-poster-4x5.png','caption-empat-platform.txt','storyboard-dan-sumber.md','subtitle-perkiraan.srt','musik-original.wav','QA-DAN-SUMBER.md','PEMERIKSAAN-VISUAL-SAMPEL.md','SHA256SUMS.txt','qa-sample-00.png']
files={f'hasil/{n}':D/n for n in outputs};files['input/01-INPUT-PRIVAT.zip']=D/'01-INPUT-PRIVAT.zip'
for p in sorted((R/'pipeline/kaca-rupert-visual-v1').iterdir()):
 if p.is_file():files[f'source/editorial-engine/pipeline/kaca-rupert-visual-v1/{p.name}']=p
for n in ['rig.tsx','rig-math.mjs','rig-math.d.mts','poses.mjs','poses.d.mts','test-rig.mjs']:
 files[f'source/editorial-engine/pipeline/awan-rig-v2/{n}']=R/'pipeline/awan-rig-v2'/n
for n in ['package.json','package-lock.json','tsconfig.json','content/recovered/kaca-pangeran-rupert-visual-v1.json','docs/METODE-VISUAL-SEBAB-AKIBAT.md']:
 files[f'source/editorial-engine/{n}']=R/n
for n in ['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf']:
 files[f'source/editorial-engine/assets/fonts/{n}']=R/'assets/fonts'/n
for family in ['archivo','permanent-marker']:files[f'lisensi/font-{family}.txt']=R/f'node_modules/@fontsource/{family}/LICENSE'
for name,p in files.items():
 if not p.is_file():raise FileNotFoundError(f'{name}: {p}')
prep=json.loads((D/'prepared.json').read_text());timeline={k:prep[k] for k in ['id','timeline','cues','duration','voiceDuration','fps','speechTempo','voiceSHA256','timingNote']}
notes=f'''CADANGAN PRIVAT — KACA RUPERT VISUAL V1\nGit HEAD saat pengepakan: {commit}; branch sesi arena/54cb36c6-content-creator.\nSalin source/editorial-engine sebagai proyek terpisah, letakkan input/01-INPUT-PRIVAT.zip di editorial-engine/deliverables/kaca-rupert-visual-v1/, ikuti pipeline/kaca-rupert-visual-v1/README.md. node_modules dan FFmpeg tidak disertakan; butuh npm dan Linux x64 kompatibel. MP4 dari lingkungan berbeda bisa berbeda byte dan perlu QA ulang.\nQA manusia untuk audio, pelafalan, subtitle, gerak, perangkat dan hak belum selesai; bukan persetujuan publikasi. MANIFEST-SHA256.json memverifikasi semua entri lain.\n'''
extras={'TIMELINE-TANPA-PATH.json':json.dumps(timeline,ensure_ascii=False,indent=2).encode(),'BACA-DULU.txt':notes.encode()};manifest={}
with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
 for name,p in files.items():raw=p.read_bytes();manifest[name]=hashlib.sha256(raw).hexdigest();z.writestr(name,raw)
 for name,raw in extras.items():manifest[name]=hashlib.sha256(raw).hexdigest();z.writestr(name,raw)
 z.writestr('MANIFEST-SHA256.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(OUT) as z:
 if z.testzip() is not None or set(z.namelist())!=set(manifest)|{'MANIFEST-SHA256.json'}:raise ValueError('Bad ZIP CRC/entries')
 for name,digest in manifest.items():
  if hashlib.sha256(z.read(name)).hexdigest()!=digest:raise ValueError(f'Bad SHA {name}')
raw=OUT.read_bytes();print(json.dumps({'file':str(OUT),'entries':len(manifest),'bytes':len(raw),'md5':hashlib.md5(raw).hexdigest(),'sha256':hashlib.sha256(raw).hexdigest(),'commit':commit},indent=2))
