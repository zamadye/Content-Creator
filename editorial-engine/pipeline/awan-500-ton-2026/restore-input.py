#!/usr/bin/env python3
"""Restore only allowlisted inputs after CRC, SHA-256 and story checks."""
import hashlib,json,zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DEFAULT_ZIP=ROOT/'deliverables/awan-500-ton-2026/01-INPUT-PRIVAT-AWAN.zip'
MEDIA=[f'assets/generated/awan-di-langit/{n}.png' for n in ['rooftop','microcloud','rainstreet']]+['audio/voiceovers/awan-500-ton-2026/narasi-utuh.mp3']
STORY='content/recovered/awan-500-ton-2026.json'
EXPECTED=set(MEDIA+[STORY,'BACA-DULU.txt','MANIFEST-SHA256.json'])

def restore(zpath:Path, root:Path):
    with zipfile.ZipFile(zpath) as z:
        names=z.namelist()
        if len(names)!=len(set(names)) or set(names)!=EXPECTED:raise ValueError('Unexpected, duplicate, or missing ZIP entries')
        if z.testzip() is not None:raise ValueError('Input ZIP CRC failure')
        manifest=json.loads(z.read('MANIFEST-SHA256.json'))
        if set(manifest)!=(EXPECTED-{'MANIFEST-SHA256.json'}):raise ValueError('Unexpected manifest entries')
        for name in manifest:
            if hashlib.sha256(z.read(name)).hexdigest()!=manifest[name]:raise ValueError(f'Bad SHA-256: {name}')
        if z.read(STORY)!=(root/STORY).read_bytes():raise ValueError('Private input story differs from source checkout')
        for name in MEDIA:
            p=root/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))

if __name__=='__main__':
    restore(DEFAULT_ZIP, ROOT)
    print('Input restored and SHA-256 verified; subtitle timing still requires human review.')
