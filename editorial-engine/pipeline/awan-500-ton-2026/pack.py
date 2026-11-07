#!/usr/bin/env python3
"""Pack source, exact private inputs and outputs; verify every ZIP member."""
import hashlib,json,subprocess,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'deliverables/awan-500-ton-2026';OUT=D/'cadangan-privat-awan-500-ton.zip'
try:commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
except (subprocess.CalledProcessError, FileNotFoundError):commit='UNKNOWN (source archive, no Git)'
outputs=['awan-500-ton.mp4','awan-500-ton-thumbnail.png','awan-500-ton-poster-4x5.png','caption-4-platform.txt','STORYBOARD.md','subtitle-perkiraan.srt','musik-tonal-original.wav','QA-DAN-SUMBER.md','SHA256SUMS.txt']
files={f'hasil/{n}':D/n for n in outputs};files['input/01-INPUT-PRIVAT-AWAN.zip']=D/'01-INPUT-PRIVAT-AWAN.zip'
files['hasil/narasi-utuh.mp3']=ROOT/'audio/voiceovers/awan-500-ton-2026/narasi-utuh.mp3'
for name in ['README.md','build.sh','captions.py','host.tsx','prepare.py','qa.py','render.tsx','restore-input.py','storyboard.py','test_pipeline.py','verify-backup.py','pack.py']:
    files[f'source/editorial-engine/pipeline/awan-500-ton-2026/{name}']=ROOT/'pipeline/awan-500-ton-2026'/name
for name in ['package.json','package-lock.json','content/recovered/awan-500-ton-2026.json']:
    files[f'source/editorial-engine/{name}']=ROOT/name
for name in ['archivo-latin-400-normal.ttf','archivo-latin-600-normal.ttf','archivo-latin-700-normal.ttf','permanent-marker-latin-400-normal.ttf']:
    files[f'source/editorial-engine/assets/fonts/{name}']=ROOT/'assets/fonts'/name
for name,p in files.items():
    if not p.is_file():raise FileNotFoundError(f'{name}: {p}')
p=json.loads((D/'prepared.json').read_text(encoding='utf8'));timeline={k:p[k] for k in ['id','timeline','cues','duration','voiceDuration','fps','speechTempo','voiceSHA256','timingNote']}
notes=f'''CADANGAN PRIVAT — AWAN 500 TON
Source branch arena/54cb36c6-content-creator; Git HEAD saat pengepakan: {commit}.
Input ZIP berisi ilustrasi AI dan satu take voice-05, naskah, serta checksum.
Hasil berisi MP4, thumbnail dan poster mandiri, caption, SRT perkiraan, narasi,
musik tonal asli, dan QA. Untuk memulihkan: checkout commit tersebut atau
salin source/, tempatkan input ZIP di path yang dijelaskan pada README, lalu
jalankan build.sh. npm ci membutuhkan akses registry; node_modules tidak ada
di arsip. Output byte dapat berbeda; QA ulang sebelum penggunaan.
Review manusia untuk suara, pelafalan, timing, gerak, hak, dan perangkat tetap
NEEDS REVIEW. Build penuh dari backup belum diuji. Ini bukan izin publikasi.
MANIFEST-SHA256.json memuat hash setiap entri lainnya.
'''
extras={'TIMELINE-TANPA-PATH.json':json.dumps(timeline,ensure_ascii=False,indent=2).encode(),'BACA-DULU.txt':notes.encode()};manifest={}
with zipfile.ZipFile(OUT,'w',zipfile.ZIP_DEFLATED,compresslevel=6,allowZip64=True) as z:
    for name,p in files.items():
        raw=p.read_bytes();manifest[name]=hashlib.sha256(raw).hexdigest();z.writestr(name,raw)
    for name,raw in extras.items():manifest[name]=hashlib.sha256(raw).hexdigest();z.writestr(name,raw)
    z.writestr('MANIFEST-SHA256.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(OUT) as z:
    assert z.testzip() is None and set(z.namelist())==set(manifest)|{'MANIFEST-SHA256.json'}
    for name,digest in manifest.items():assert hashlib.sha256(z.read(name)).hexdigest()==digest,name
raw=OUT.read_bytes();print(json.dumps({'file':str(OUT),'entries':len(manifest),'bytes':len(raw),'md5':hashlib.md5(raw).hexdigest(),'sha256':hashlib.sha256(raw).hexdigest(),'commit':commit}))
