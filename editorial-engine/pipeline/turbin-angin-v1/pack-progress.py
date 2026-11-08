#!/usr/bin/env python3
"""Save verified completed scenes as a PRIVATE, resumable checkpoint.

This is not a final video or approval to publish. Source footage and code are
backed up separately. Each scene receipt and all prepared audio/input hashes
must match before the partial checkpoint is created.
"""
from __future__ import annotations
import argparse, importlib.util, json, os, re, sys, zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
PIPE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('private_pack',PIPE/'pack-private-final.py')
if spec is None or spec.loader is None:raise RuntimeError('Cannot load private backup verifier')
pack=importlib.util.module_from_spec(spec);spec.loader.exec_module(pack)

def collect(runtime:Path,through:int)->tuple[dict[str,Path],str]:
 d=runtime/'render';prepared=json.loads((d/'prepared.json').read_text(encoding='utf8'))
 scenes=prepared['timeline']
 if not 1<=through<=len(scenes):raise ValueError('Scene count is out of range')
 expected=[('human-review.json','reviewSha256'),('narasi-voice-05.wav','voiceSourceSha256')]
 for rel,key in expected:
  f=runtime/rel
  if not f.is_file() or pack.sha_file(f)!=prepared[key]:raise ValueError(f'Private input hash mismatch: {rel}')
 for rel,key in [('narasi-utuh.wav','narrationSha256'),('musik-original.wav','scoreSha256')]:
  f=d/rel
  if not f.is_file() or pack.sha_file(f)!=prepared[key]:raise ValueError(f'Prepared audio hash mismatch: {rel}')
 result={f'private-runtime/{name}':runtime/name for name in ['human-review.json','narration.txt','narasi-voice-05.wav']}
 for name in ['prepared.json','narasi-utuh.wav','musik-original.wav','subtitle-perkiraan.srt']:
  result[f'private-runtime/render/{name}']=d/name
 fingerprint=None
 for scene in scenes[:through]:
  name=f"scene-{scene['id']}.mp4";file=d/name;receipt=d/(name+'.json')
  if not file.is_file() or not receipt.is_file():raise ValueError(f"Scene not complete: {scene['id']}")
  r=json.loads(receipt.read_text(encoding='utf8'));count=scene['endFrame']-scene['startFrame']
  if r.get('scene')!=scene['id'] or r.get('frames')!=count or r.get('sha256')!=pack.sha_file(file) or not re.fullmatch('[0-9a-f]{64}',r.get('fingerprint','')):
   raise ValueError(f"Invalid scene receipt: {scene['id']}")
  if fingerprint and r['fingerprint']!=fingerprint:raise ValueError('Scene fingerprints differ')
  fingerprint=r['fingerprint'];result[f'private-runtime/render/{name}']=file;result[f'private-runtime/render/{name}.json']=receipt
 for name,file in result.items():
  if not pack.safe_name(name) or file.is_symlink() or not file.is_file():raise ValueError(f'Unsafe/missing checkpoint input: {name}')
 return result,fingerprint

def main():
 p=argparse.ArgumentParser();p.add_argument('--through',required=True,type=int,help='Count of finished, consecutive scenes')
 args=p.parse_args();runtime=ROOT/'.scratch/turbine';files,fingerprint=collect(runtime,args.through)
 out=runtime/f'Checkpoint-Turbin-scenes-01-{args.through:02}-privat.zip';partial=out.with_suffix('.zip.partial')
 if out.exists() or partial.exists():raise ValueError('Checkpoint or partial already exists; inspect before retrying')
 metadata={n:{'size':f.stat().st_size,'sha256':pack.sha_file(f)} for n,f in files.items()}
 try:
  with zipfile.ZipFile(partial,'x',allowZip64=True) as z:
   for name,file in files.items():
    method=zipfile.ZIP_STORED if file.suffix.lower()=='.mp4' else zipfile.ZIP_DEFLATED
    z.write(file,name,compress_type=method,compresslevel=4 if method==zipfile.ZIP_DEFLATED else None)
   z.writestr('MANIFEST.json',json.dumps({'scope':'PRIVATE DRAFT ONLY','stage':'INCOMPLETE SCENE CHECKPOINT',
    'through':args.through,'fingerprint':fingerprint,'files':metadata},ensure_ascii=False,indent=2),compress_type=zipfile.ZIP_DEFLATED)
  pack.verify(partial);os.replace(partial,out)
 except Exception:
  partial.unlink(missing_ok=True);raise
 print(json.dumps({'file':str(out.relative_to(ROOT)),'bytes':out.stat().st_size,'sha256':pack.sha_file(out),
  'completed_scenes':args.through,'verification':'PASS','scope':'PRIVATE INCOMPLETE CHECKPOINT'},indent=2))

if __name__=='__main__':
 try:main()
 except (OSError,ValueError,KeyError,zipfile.BadZipFile) as exc:
  print(f'Scene checkpoint failed: {exc}',file=sys.stderr);sys.exit(1)
