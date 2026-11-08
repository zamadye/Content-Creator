#!/usr/bin/env python3
"""Restore verified private inputs without overwriting different local assets."""
import argparse,hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
MEDIA=['assets/generated/kaca-rupert/ruang-lab.png','assets/generated/kaca-rupert/dalam-kaca.png','audio/voiceovers/kaca-rupert/narasi-utuh.mp3']
EXPECTED=set(MEDIA+['NARASI.txt','MANIFEST-SHA256.json'])
def restore(archive:Path,root:Path):
 spec=json.loads((root/'content/recovered/kaca-pangeran-rupert-visual-v1.json').read_text(encoding='utf-8'))
 narration=' '.join(s['narration'] for s in spec['scenes'])
 with zipfile.ZipFile(archive) as z:
  names=z.namelist()
  if len(names)!=len(set(names)) or set(names)!=EXPECTED:raise ValueError('Unexpected, duplicate, or missing ZIP entries')
  if z.testzip() is not None:raise ValueError('Input ZIP CRC failure')
  manifest=json.loads(z.read('MANIFEST-SHA256.json'))
  if set(manifest)!=(EXPECTED-{'MANIFEST-SHA256.json'}):raise ValueError('Unexpected manifest entries')
  for name in manifest:
   if hashlib.sha256(z.read(name)).hexdigest()!=manifest[name]:raise ValueError(f'Bad SHA-256: {name}')
  if z.read('NARASI.txt').decode('utf-8').strip()!=narration:raise ValueError('Narration differs from source')
  for name in MEDIA:
   p=root/name
   if p.exists() and hashlib.sha256(p.read_bytes()).hexdigest()!=manifest[name]:raise ValueError(f'Refusing to overwrite different local file: {name}')
  for name in MEDIA:
   p=root/name
   if not p.exists():p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))
 return {name:manifest[name] for name in MEDIA}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('archive',nargs='?',type=Path,default=ROOT/'deliverables/kaca-rupert-visual-v1/01-INPUT-PRIVAT.zip');a=p.parse_args()
 print(json.dumps({'restored':restore(a.archive,ROOT),'status':'SHA-256 verified; human AV and rights review still required'},ensure_ascii=False,indent=2))
