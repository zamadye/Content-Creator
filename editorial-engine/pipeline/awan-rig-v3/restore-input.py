#!/usr/bin/env python3
"""Restore SHA-verified private V3 inputs without overwriting different files."""
import argparse,hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
MEDIA=[f'assets/generated/awan-rig-v2/{n}.png' for n in ['rooftop','microcloud','rainstreet']]+['audio/voiceovers/awan-rig-v3/narasi-utuh.mp3']
EXPECTED=set(MEDIA+['NARASI.txt','MANIFEST-SHA256.json'])
def restore(archive:Path,root:Path):
 spec=json.loads((root/'content/recovered/awan-500-ton-rig-v3.json').read_text(encoding='utf-8'))
 expected_narration=' '.join(s['narration'] for s in spec['scenes'])
 with zipfile.ZipFile(archive) as z:
  names=z.namelist()
  if len(names)!=len(set(names)) or set(names)!=EXPECTED:raise ValueError('Unexpected, duplicate, or missing ZIP entries')
  if z.testzip() is not None:raise ValueError('Input ZIP CRC failure')
  manifest=json.loads(z.read('MANIFEST-SHA256.json'))
  if set(manifest)!=(EXPECTED-{'MANIFEST-SHA256.json'}):raise ValueError('Unexpected manifest entries')
  for name in manifest:
   if hashlib.sha256(z.read(name)).hexdigest()!=manifest[name]:raise ValueError(f'Bad SHA-256: {name}')
  if z.read('NARASI.txt').decode('utf-8').strip()!=expected_narration:raise ValueError('Narration differs from V3 source')
  # Preflight all destinations; do not rewrite even identical existing V2 assets.
  for name in MEDIA:
   p=root/name
   if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()!=manifest[name]:raise ValueError(f'Refusing to overwrite different local file: {name}')
  for name in MEDIA:
   p=root/name
   if not p.exists():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))
 return {name:manifest[name] for name in MEDIA}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('archive',nargs='?',type=Path,default=ROOT/'deliverables/awan-rig-v3/01-INPUT-PRIVAT-RIG-V3.zip');args=p.parse_args()
 print(json.dumps({'restored':restore(args.archive,ROOT),'status':'SHA-256 verified; human audio and video review required'},ensure_ascii=False,indent=2))
