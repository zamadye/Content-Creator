#!/usr/bin/env python3
"""Package one private turbine draft and verify every byte in the ZIP.

This allowlisted archive contains source footage, one-take narration, rendered
video and review evidence. It must never be committed or made public. It does
not grant rights or publication approval. No credentials are collected.
"""
from __future__ import annotations
import hashlib, json, os, sys, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
PIPE=ROOT/'editorial-engine/pipeline/turbin-angin-v1'
OUT=ROOT/'.scratch/turbine/Turbin-DRAF-private-backup-v3.zip'

def sha_file(file:Path)->str:
 h=hashlib.sha256()
 with file.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()

def safe_name(name:str)->bool:
 return bool(name) and '\\' not in name and '\x00' not in name and not name.startswith('/') and not any(part in {'','.','..'} for part in name.split('/'))

def verify(archive:Path)->dict:
 with zipfile.ZipFile(archive) as z:
  names=z.namelist()
  if len(names)!=len(set(names)) or 'MANIFEST.json' not in names or not all(map(safe_name,names)):
   raise ValueError('Unsafe, duplicate, or missing archive entries')
  manifest=json.loads(z.read('MANIFEST.json'))
  if manifest.get('scope')!='PRIVATE DRAFT ONLY' or not isinstance(manifest.get('files'),dict):raise ValueError('Bad private-draft manifest')
  if set(names)!=set(manifest['files'])|{'MANIFEST.json'}:raise ValueError('Manifest/file list mismatch')
  for name,expected in manifest['files'].items():
   h=hashlib.sha256();size=0
   with z.open(name) as f:
    for block in iter(lambda:f.read(1024*1024),b''):h.update(block);size+=len(block)
   if size!=expected['size'] or h.hexdigest()!=expected['sha256']:raise ValueError(f'Archive integrity mismatch: {name}')
  return manifest

def inputs()->dict[str,Path]:
 project=[
  'editorial-engine/content/proposals/turbin-angin-draf-v1.json',
  'editorial-engine/content/proposals/turbin-angin-audit-kalimat-v1.json',
  'editorial-engine/content/proposals/turbin-angin-berhenti-riset.md',
  'editorial-engine/content/proposals/turbin-angin-caption-draf.txt',
  'editorial-engine/docs/STANDAR-NASKAH-PSIKOLOGI-PENONTON.md',
  'editorial-engine/pipeline/script-review/audit.py','editorial-engine/pipeline/script-review/README.md',
  'editorial-engine/pipeline/awan-rig-v2/rig.tsx','editorial-engine/pipeline/awan-rig-v2/props.tsx',
  'editorial-engine/pipeline/awan-rig-v2/poses.mjs','editorial-engine/pipeline/awan-rig-v2/poses.d.mts',
  'editorial-engine/pipeline/awan-rig-v2/rig-math.mjs','editorial-engine/pipeline/awan-rig-v2/rig-math.d.mts',
  'editorial-engine/package.json','editorial-engine/package-lock.json','editorial-engine/tsconfig.json',
  'editorial-engine/assets/fonts/archivo-latin-400-normal.ttf','editorial-engine/assets/fonts/archivo-latin-600-normal.ttf',
  'editorial-engine/assets/fonts/archivo-latin-700-normal.ttf','editorial-engine/assets/fonts/permanent-marker-latin-400-normal.ttf',
 ]
 pipeline=['README.md','footage-manifest.json','shot-plan.json','motion.mjs','motion.d.mts',
  'review-gate.mjs','review-gate.d.mts','preflight.mjs','test-preflight.mjs','prepare.py','render.tsx',
  'check-glyphs.py','test-glyphs.py','qa.py','test-qa.py','build-private.sh','pack-checkpoint.py','test-pack.py','pack-private-final.py',
  'test-pack-final.py','pack-progress.py','test-progress.py','storyboard-preview.tsx']
 result={p:ROOT/p for p in project}
 for p in pipeline:
  file=PIPE/p;result[file.relative_to(ROOT).as_posix()]=file
 meta=json.loads((PIPE/'footage-manifest.json').read_text(encoding='utf8'))
 for item in meta['items']:
  name=item['localFilename'];file=ROOT/'google_drive'/name
  if name!=Path(name).name or not file.is_file() or file.stat().st_size!=item['size'] or sha_file(file)!=item['sha256']:
   raise ValueError(f'Original source missing or changed: {item["id"]}')
  result['private-media/'+name]=file
 private=ROOT/'.scratch/turbine'
 for p in ['human-review.json','narration.txt','narasi-voice-05.wav',
  'Naskah-review-turbin.md','Audit-setiap-kalimat-DRAF.md']:
  result['private-runtime/'+p]=private/p
 outputs=['prepared.json','narasi-utuh.wav','musik-original.wav','subtitle-perkiraan.srt',
  'turbin-angin-draf-privat.mp4','turbin-thumbnail-draf.png','turbin-poster-4x5-draf.png',
  'Caption-4-platform-DRAF.txt','QA-teknis-draf.json','QA-draf-privat.md','qa-frame0-final.png','QA-contact-360.png','QA-potongan-pembuka.png','scenes.txt']
 for n in range(1,13):outputs.extend([f'scene-S{n:02}.mp4',f'scene-S{n:02}.mp4.json'])
 for p in outputs:result['private-runtime/render/'+p]=private/'render'/p
 for name,file in result.items():
  if not safe_name(name) or file.is_symlink() or not file.is_file() or not file.resolve().is_relative_to(ROOT.resolve()):
   raise ValueError(f'Unsafe or missing backup input: {name}')
 return result

def main():
 if OUT.exists():raise ValueError('Backup already exists; do not overwrite it')
 partial=OUT.with_suffix('.zip.partial')
 if partial.exists():raise ValueError('Partial backup exists; inspect it before retrying')
 files=inputs();metadata={n:{'size':f.stat().st_size,'sha256':sha_file(f)} for n,f in files.items()}
 try:
  with zipfile.ZipFile(partial,'x',allowZip64=True) as z:
   for name,file in files.items():
    method=zipfile.ZIP_STORED if file.suffix.lower() in {'.mp4','.png'} else zipfile.ZIP_DEFLATED
    z.write(file,name,compress_type=method,compresslevel=4 if method==zipfile.ZIP_DEFLATED else None)
   manifest={'scope':'PRIVATE DRAFT ONLY','rights':'NEEDS REVIEW','human_playback':'NOT TESTED',
    'schedule':'NOT AUTHORIZED','subtitle_timing':'ESTIMATED','files':metadata}
   z.writestr('MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2),compress_type=zipfile.ZIP_DEFLATED)
  verify(partial);os.replace(partial,OUT)
 except Exception:
  partial.unlink(missing_ok=True);raise
 print(json.dumps({'file':str(OUT.relative_to(ROOT)),'bytes':OUT.stat().st_size,'sha256':sha_file(OUT),
  'entries':len(files),'verification':'PASS','scope':'PRIVATE DRAFT ONLY'},indent=2))

if __name__=='__main__':
 try:main()
 except (OSError,ValueError,KeyError,zipfile.BadZipFile) as exc:
  print(f'Private backup failed: {exc}',file=sys.stderr);sys.exit(1)
