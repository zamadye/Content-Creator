#!/usr/bin/env python3
"""Restore private media only after whitelist, CRC and per-file SHA-256 checks."""
import hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
D=ROOT/'deliverables/shark-2026-11-07'
ARCHIVE=D/'01-INPUT-PRIVAT-HIU.zip'
ART=ROOT/'assets/generated/episode-shark-2026-11-07'
VOICE=ROOT/'audio/voiceovers/episode-shark-2026-11-07'
STORY=ROOT/'content/recovered/hiu-sebelum-hutan-2026-11-07.json'
expected={f'gambar/{n}.png' for n in ('hero','lab','forest')}|{f'narasi-segmen/S{i:02}.mp3' for i in range(1,10)}|{'naskah-storyboard.json'}
with zipfile.ZipFile(ARCHIVE) as z:
 if z.testzip() is not None:raise ValueError('input ZIP CRC mismatch')
 names=z.namelist()
 if len(names)!=len(set(names)) or set(names)!=expected|{'MANIFEST-SHA256.json'}:raise ValueError('unexpected or duplicate entries')
 manifest=json.loads(z.read('MANIFEST-SHA256.json'))
 if set(manifest)!=expected:raise ValueError('manifest entries mismatch')
 for name,digest in manifest.items():
  if hashlib.sha256(z.read(name)).hexdigest()!=digest:raise ValueError(f'hash mismatch: {name}')
 if z.read('naskah-storyboard.json')!=STORY.read_bytes():raise ValueError('story in source and archive differ')
 ART.mkdir(parents=True,exist_ok=True);VOICE.mkdir(parents=True,exist_ok=True)
 for name in expected:
  if name.startswith('gambar/'):(ART/Path(name).name).write_bytes(z.read(name))
  if name.startswith('narasi-segmen/'):(VOICE/Path(name).name).write_bytes(z.read(name))
print('PASS input archive whitelist, CRC, per-entry SHA-256 and story consistency')
