#!/usr/bin/env python3
"""Bundle one reviewed-for-mechanical-integrity pilot; no uploads or posting."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
D=ROOT/'deliverables/interactive-revision-2026-11-11/antartika'
OUT=D/'cadangan-pilot-antartika-v2.zip'
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
rel_outputs=['antartika-revisi-v2.mp4','antartika-revisi-v2-thumbnail.png','caption-4-platform.txt','subtitle-perkiraan.srt','narasi-gabungan.mp3','musik-tonal-original.wav','QA-DAN-SUMBER.md','SHA256SUMS.txt']
files={f'hasil/{n}':D/n for n in rel_outputs}
files['input/01-INPUT-PRIVAT-REV2.zip']=D/'01-INPUT-PRIVAT-REV2.zip'
for name in ['README.md','build.sh','captions.py','host.tsx','prepare.py','qa.py','render.tsx','pack.py']:
 files[f'source/editorial-engine/pipeline/interactive-antartika-v2/{name}']=ROOT/'pipeline/interactive-antartika-v2'/name
for name in ['package.json','package-lock.json','content/recovered/antartika-revisi-interaktif.json']:
 files[f'source/editorial-engine/{name}']=ROOT/name
for name in ['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf']:
 files[f'source/editorial-engine/assets/fonts/{name}']=ROOT/'assets/fonts'/name
for name,p in files.items():
 if not p.is_file():raise FileNotFoundError(f'{name}: {p}')
prepared=json.loads((D/'prepared.json').read_text(encoding='utf8'))
timeline={k:prepared[k] for k in ['id','timeline','cues','duration','fps','narrationSHA256','timingNote']}
notes=f'''CADANGAN PRIVAT — PILOT ANTARTIKA REVISI V2, BELUM DISETUJUI PUBLIKASI
Source branch arena/54cb36c6-content-creator; commit saat pengepakan: {commit}.
Input ZIP berisi ilustrasi/narasi privat dan naskah beserta manifest sendiri.
Hasil mencakup MP4, thumbnail mandiri, caption, SRT perkiraan, satu master narasi,
musik asli dan laporan QA. Untuk membangun ulang, pulihkan checkout branch/commit,
salin ZIP input ke path yang disebutkan README pada folder source dan ikuti petunjuk.
Dependency Node tidak disertakan; npm ci memerlukan registry. Hasil byte bisa berbeda.
Belum diuji: build penuh dari cadangan yang dipulihkan. Audio, sinkronisasi subtitle,
review gerak penuh, uji ponsel/platform, hak dan persetujuan kreatif masih diperlukan.
Tidak ada jadwal atau publikasi yang dibuat. MANIFEST-SHA256.json memuat hash setiap
entri lain. Periksa ZIP dan semua hash sebelum memakai atau memulihkan.
'''
extras={'TIMELINE-TANPA-PATH.json':json.dumps(timeline,ensure_ascii=False,indent=2).encode('utf8'), 'BACA-DULU.txt':notes.encode('utf8')}
manifest={}
with zipfile.ZipFile(OUT,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
 for arc,p in files.items():
  data=p.read_bytes();manifest[arc]=hashlib.sha256(data).hexdigest();z.writestr(arc,data)
 for arc,data in extras.items():
  manifest[arc]=hashlib.sha256(data).hexdigest();z.writestr(arc,data)
 z.writestr('MANIFEST-SHA256.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(OUT) as z:
 assert z.testzip() is None
 assert set(z.namelist())==set(manifest)|{'MANIFEST-SHA256.json'}
 for arc,digest in manifest.items():assert hashlib.sha256(z.read(arc)).hexdigest()==digest,arc
raw=OUT.read_bytes()
print(json.dumps({'file':str(OUT),'entries':len(manifest),'bytes':len(raw),'md5':hashlib.md5(raw).hexdigest(),'sha256':hashlib.sha256(raw).hexdigest(),'commit':commit},ensure_ascii=False))
