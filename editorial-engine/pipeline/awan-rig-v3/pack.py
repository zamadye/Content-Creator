#!/usr/bin/env python3
"""Private V3 backup with manifest, source, exact inputs, results and font licenses."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'deliverables/awan-rig-v3';OUT=D/'cadangan-privat-awan-rig-v3.zip'
try:commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True,stderr=subprocess.DEVNULL).strip()
except (subprocess.CalledProcessError,FileNotFoundError):commit='UNKNOWN'
outputs=['awan-500-ton-rig-v3.mp4','awan-rig-v3-thumbnail.png','awan-rig-v3-poster-4x5.png','caption-empat-platform.txt','storyboard-rig-v3.md','subtitle-perkiraan.srt','musik-original.wav','QA-DAN-SUMBER.md','SHA256SUMS.txt','qa-sample-00.png']
files={f'hasil/{n}':D/n for n in outputs};files['input/01-INPUT-PRIVAT-RIG-V3.zip']=D/'01-INPUT-PRIVAT-RIG-V3.zip'
for p in sorted((R/'pipeline/awan-rig-v3').iterdir()):
 if p.is_file():files[f'source/editorial-engine/pipeline/awan-rig-v3/{p.name}']=p
for n in ['rig.tsx','rig-math.mjs','rig-math.d.mts','poses.mjs','poses.d.mts','props.tsx','test-rig.mjs']:
 files[f'source/editorial-engine/pipeline/awan-rig-v2/{n}']=R/'pipeline/awan-rig-v2'/n
for n in ['package.json','package-lock.json','tsconfig.json','content/recovered/awan-500-ton-rig-v3.json']:
 files[f'source/editorial-engine/{n}']=R/n
for n in ['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf']:
 files[f'source/editorial-engine/assets/fonts/{n}']=R/'assets/fonts'/n
for family in ['archivo','permanent-marker']:files[f'lisensi/font-{family}.txt']=R/f'node_modules/@fontsource/{family}/LICENSE'
for name,p in files.items():
 if not p.is_file():raise FileNotFoundError(f'{name}: {p}')
prep=json.loads((D/'prepared.json').read_text());timeline={k:prep[k] for k in ['id','timeline','cues','duration','voiceDuration','fps','speechTempo','voiceSHA256','timingNote']}
notes=f'''CADANGAN PRIVAT — AWAN RIG V3\nBranch arena/54cb36c6-content-creator; Git HEAD saat pengepakan: {commit}.\nSalin source/editorial-engine sebagai proyek terpisah dan letakkan input/01-INPUT-PRIVAT-RIG-V3.zip di editorial-engine/deliverables/awan-rig-v3/. Ikuti pipeline/awan-rig-v3/README.md untuk restore, npm ci dan rebuild offline setelah dependencies terinstal. node_modules dan executable FFmpeg tidak disertakan; diperlukan akses npm dan Linux x64 kompatibel. Output byte MP4 dapat berbeda antar lingkungan, sehingga perlu QA ulang.\nQA manusia untuk audio, pelafalan, subtitle, gerak, hak dan perangkat belum selesai; ini bukan izin publikasi. MANIFEST-SHA256.json memverifikasi setiap entri lain.\n'''
extras={'TIMELINE-TANPA-PATH.json':json.dumps(timeline,ensure_ascii=False,indent=2).encode(),'BACA-DULU.txt':notes.encode()};manifest={}
with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
 for name,p in files.items():
  raw=p.read_bytes();manifest[name]=hashlib.sha256(raw).hexdigest();z.writestr(name,raw)
 for name,raw in extras.items():manifest[name]=hashlib.sha256(raw).hexdigest();z.writestr(name,raw)
 z.writestr('MANIFEST-SHA256.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(OUT) as z:
 if z.testzip() is not None or set(z.namelist())!=set(manifest)|{'MANIFEST-SHA256.json'}:raise ValueError('Bad ZIP CRC or entry set')
 for name,digest in manifest.items():
  if hashlib.sha256(z.read(name)).hexdigest()!=digest:raise ValueError(f'Bad hash: {name}')
raw=OUT.read_bytes();print(json.dumps({'file':str(OUT),'entries':len(manifest),'bytes':len(raw),'md5':hashlib.md5(raw).hexdigest(),'sha256':hashlib.sha256(raw).hexdigest(),'commit':commit},indent=2))
