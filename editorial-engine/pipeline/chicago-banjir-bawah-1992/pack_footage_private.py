#!/usr/bin/env python3
"""Checkpoint private footage-project inputs and optional non-video companions.

Large original clips and finished MP4s are deliberately stored separately in
private Drive. The accompanying restore note must identify those Drive copies.
This script never makes a file public or treats a backup as editorial approval.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile
import render_rough as rough
import render_footage as footage

ROOT=rough.ROOT
PIPE=Path(__file__).resolve().parent
PRIVATE=ROOT/'.scratch/chicago'
MAX_UPLOAD=100*1024*1024
COMPANIONS=(
    'MASTER_NARASI_DRAF_voice-05.mp3','SHORT_NARASI_DRAF_voice-05.mp3',
    'MASTER_SUBTITLE_PERKIRAAN.srt','SHORT_SUBTITLE_PERKIRAAN.srt',
    'MASTER_THUMBNAIL_DRAF.png','SHORT_THUMBNAIL_DRAF.png','POSTER_4x5_DRAF.png',
    'TIMELINE_FOOTAGE_PERKIRAAN.json','KREDIT_FOOTAGE_DRAF.txt',
    'CAPTION_FOOTAGE_DRAF.txt','LAPORAN_FOOTAGE_DRAF.txt','QA_FOOTAGE_DRAF.txt',
    'LAPORAN_FOOTAGE_DRAF.pdf','QA_FOOTAGE_DATA.json','STORYBOARD_FOOTAGE_DRAF.md',
)


def companion_files(output_dir):
    out=output_dir.resolve()
    if not out.is_relative_to((ROOT/'.scratch').resolve()):
        raise ValueError('Companions must be in the private .scratch directory.')
    files=[out/name for name in COMPANIONS]
    if any(not path.is_file() or not path.resolve().is_relative_to(out) for path in files):
        raise ValueError('One or more private companion files are missing or unsafe.')
    return files


def digest(path):
    sha=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):sha.update(chunk)
    return sha.hexdigest()


def collect(manifest_path, restore_note, include_companions, output_dir):
    if not manifest_path.resolve().is_relative_to((PRIVATE/'voice').resolve()) or not manifest_path.is_file():
        raise ValueError('The bound input manifest must be in the private voice folder.')
    manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
    scripts,_=rough.validate_inputs(manifest,PRIVATE/'voice',PRIVATE/'assets')
    catalog=footage.read_catalog();plan=footage.read_plan()
    used=footage.validate_plan(scripts,plan,catalog,manifest['assets'])
    footage.check_source_files(catalog,PRIVATE/'footage/originals',used)
    if not restore_note.resolve().is_relative_to((ROOT/'.scratch').resolve()) or not restore_note.is_file():
        raise ValueError('A private source/outputs restore note inside .scratch is required.')
    files=[]
    for base in (rough.CONTENT,PIPE,ROOT/'editorial-engine/pipeline/story-engine',
                 ROOT/'editorial-engine/pipeline/script-review',ROOT/'editorial-engine/assets/fonts'):
        files.extend(p for p in base.iterdir() if p.is_file() and p.suffix in {'.py','.json','.md','.txt','.ttf'}
                     and p.name!='session-pointer.json')
    # Source code only: the consumed encrypted session pointer is not a restore input.
    files.extend([PIPE/'commons-relay/relay.mjs',PIPE/'commons-relay/test-relay.mjs',
                  ROOT/'STANDARD-MINIMAL-CONTENT-PRODUCTION.md',ROOT/'EDITORIAL-FONDATION.md',
                  ROOT/'editorial-engine/docs/SISTEM-CERITA-LONG-FORM.md',
                  PRIVATE/'review-master-NOT-TESTED.json',PRIVATE/'footage/originals/ORIGINALS-MANIFEST.json',
                  manifest_path,restore_note])
    files.extend(PRIVATE/'assets'/x for x in manifest['assets'])
    for edition in ('master','short'):
        files.extend(PRIVATE/'voice'/chunk['audio'] for chunk in manifest['scripts'][edition]['chunks'])
    if include_companions:
        files.extend(companion_files(output_dir))
    unique={}
    for path in files:
        path=path.resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():raise ValueError(f'Missing/unsafe checkpoint input: {path}')
        unique[path.relative_to(ROOT).as_posix()]=path
    return dict(sorted(unique.items()))


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out',type=Path,required=True)
    ap.add_argument('--manifest',type=Path,required=True)
    ap.add_argument('--restore-note',type=Path,required=True)
    ap.add_argument('--include-companions',action='store_true')
    ap.add_argument('--output-dir',type=Path,default=PRIVATE/'footage/output',help='Private rendered companion folder')
    a=ap.parse_args();out=a.out.resolve()
    if not out.is_relative_to((ROOT/'.scratch').resolve()) or out.suffix!='.zip':
        raise ValueError('Checkpoint must be a ZIP inside .scratch.')
    files=collect(a.manifest,a.restore_note,a.include_companions,a.output_dir)
    notice=('PRIVATE DRAFT — NOT APPROVED FOR RELEASE\n'
            'Archive paths are relative to the repository root. Verify SHA256SUMS.txt after extraction.\n'
            'Original source clips and finished MP4s are intentionally NOT inside this archive.\n'
            'Locate and verify their private Drive copies using the included restore note and original manifest.\n'
            'Voice/assets, source, timing and companions are included only as selected by this checkpoint stage.\n'
            'Do not commit media. Human, fact, rights, disclosure, listening and release reviews remain outstanding.\n')
    hashes={name:digest(path) for name,path in files.items()}
    hashes['BACKUP-README.txt']=hashlib.sha256(notice.encode()).hexdigest()
    sums=''.join(f'{v}  {k}\n' for k,v in sorted(hashes.items()))
    out.parent.mkdir(parents=True,exist_ok=True);temp=out.with_suffix('.partial.zip')
    with zipfile.ZipFile(temp,'w',allowZip64=True) as z:
        for name,path in files.items():
            method=zipfile.ZIP_STORED if path.suffix.lower() in {'.jpg','.mp3','.mp4','.png'} else zipfile.ZIP_DEFLATED
            z.write(path,name,compress_type=method,compresslevel=6 if method==zipfile.ZIP_DEFLATED else None)
        z.writestr('BACKUP-README.txt',notice,compress_type=zipfile.ZIP_DEFLATED)
        z.writestr('SHA256SUMS.txt',sums,compress_type=zipfile.ZIP_DEFLATED)
    if temp.stat().st_size>MAX_UPLOAD:
        raise ValueError('Checkpoint exceeds the 100 MB Drive upload limit; split companions rather than bypass it.')
    with zipfile.ZipFile(temp) as z:
        if z.testzip():raise ValueError('Checkpoint ZIP failed CRC verification.')
        for name,expected in hashes.items():
            if hashlib.sha256(z.read(name)).hexdigest()!=expected:raise ValueError(f'Checkpoint hash failed: {name}')
    temp.replace(out)
    print(f'{len(files)} files + README + SHA256SUMS; {out.stat().st_size} bytes')
    print('SHA-256',digest(out))
    print('Local ZIP verified; Drive copy and private permissions still need verification.')

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,zipfile.BadZipFile,json.JSONDecodeError) as exc:
        print(f'Checkpoint failed: {exc}',file=sys.stderr);raise SystemExit(1)
