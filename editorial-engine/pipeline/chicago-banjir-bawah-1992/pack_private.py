#!/usr/bin/env python3
"""Back up only explicit Chicago draft inputs/sources (and optional outputs).

Output ZIP must stay in .scratch. No credentials or external links are included.
SHA256SUMS inside ZIP permits independent extracted-member verification. No
successful backup claim until the uploaded Drive copy is downloaded and tested.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import sys
import zipfile

ROOT=Path(__file__).resolve().parents[3]
CONTENT=ROOT/'editorial-engine/content/chicago-banjir-bawah-1992'
PIPE=ROOT/'editorial-engine/pipeline/chicago-banjir-bawah-1992'
PRIVATE=ROOT/'.scratch/chicago'

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda:f.read(1024*1024),b''):h.update(block)
    return h.hexdigest()

def collect(include_output):
    files=[]
    for base in (CONTENT,PIPE,ROOT/'editorial-engine/pipeline/story-engine',ROOT/'editorial-engine/pipeline/script-review',ROOT/'editorial-engine/assets/fonts'):
        files.extend(p for p in base.iterdir() if p.is_file() and p.suffix in {'.py','.json','.md','.txt','.ttf'})
    files += [ROOT/'STANDARD-MINIMAL-CONTENT-PRODUCTION.md',ROOT/'EDITORIAL-FONDATION.md',
              ROOT/'editorial-engine/docs/SISTEM-CERITA-LONG-FORM.md',
              ROOT/'scripts/render-research-pdf.py',ROOT/'scripts/requirements-research-pdf.txt',
              PRIVATE/'review-master-NOT-TESTED.json']
    manifest_path=PRIVATE/'voice/rough-input-manifest.json';man=json.loads(manifest_path.read_text())
    files.append(manifest_path)
    for name,digest in man['assets'].items():
        p=(PRIVATE/'assets'/name).resolve()
        if not p.is_relative_to((PRIVATE/'assets').resolve()) or not p.is_file() or sha(p)!=digest:
            raise ValueError(f'Image missing or changed: {name}')
        files.append(p)
    expected_voice=set()
    for name in ('master','short'):
        if sha(CONTENT/f'{name}.script.json') != man['scripts'][name]['sha256']:
            raise ValueError(f'{name} script changed after recording')
        for chunk in man['scripts'][name]['chunks']:
            p=(PRIVATE/'voice'/chunk['audio']).resolve()
            if not p.is_relative_to((PRIVATE/'voice').resolve()) or not p.is_file() or sha(p)!=chunk['sha256']:
                raise ValueError(f'Voice missing or changed: {chunk["audio"]}')
            expected_voice.add(p)
    # Preserve superseded original takes and old blank review, never substitute them.
    files.extend(expected_voice)
    for old in (PRIVATE/'voice/master-02.mp3', PRIVATE/'voice/master-03.mp3',
                PRIVATE/'review-master-v1-NOT-TESTED.json'):
        if old.is_file():files.append(old)
    if include_output:
        for n in ('MASTER_ANIMATIC_DRAF_PRIVAT.mp4','SHORT_ANIMATIC_DRAF_PRIVAT.mp4',
                  'MASTER_NARASI_DRAF_voice-05.mp3','SHORT_NARASI_DRAF_voice-05.mp3',
                  'MASTER_SUBTITLE_PERKIRAAN.srt','SHORT_SUBTITLE_PERKIRAAN.srt',
                  'MASTER_THUMBNAIL_DRAF.png','SHORT_THUMBNAIL_DRAF.png','POSTER_4x5_DRAF.png','TIMELINE_PERKIRAAN.json'):
            files.append(PRIVATE/'output'/n)
        for n in ('LAPORAN-DRAF.pdf','LAPORAN-DRAF.txt','QA-TEKNIS-DRAF.txt'):
            if (PRIVATE/'output'/n).is_file():files.append(PRIVATE/'output'/n)
    unique={}
    for p in files:
        p=p.resolve()
        if not p.is_relative_to(ROOT) or not p.is_file():raise ValueError(f'Invalid or missing input: {p}')
        key=p.relative_to(ROOT).as_posix()
        if key in unique:continue
        unique[key]=p
    return dict(sorted(unique.items()))

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--out',type=Path,required=True)
    ap.add_argument('--include-output',action='store_true',help='Require both rendered animatics and their companion files')
    a=ap.parse_args();target=a.out.resolve()
    if not target.is_relative_to((ROOT/'.scratch').resolve()) or target.suffix!='.zip':raise ValueError('Backup must be a .zip inside .scratch')
    files=collect(a.include_output);target.parent.mkdir(parents=True,exist_ok=True)
    notice=('PRIVATE DRAFT ONLY — NOT APPROVED FOR RELEASE\n'
            'Paths are relative to repository root. Restore/extract into a temporary folder, verify SHA256SUMS.txt,\n'
            'then copy only intended inputs into the matching repository/.scratch paths. Do not commit media.\n'
            'voice/master-02.mp3 and master-03.mp3 are superseded; use the revised takes named in the manifest.\n'
            'Illustrations are AI reconstructions, not archival images. Review, rights, disclosure, listening,\n'
            'subtitle alignment, audience response and release authorization are outstanding.\n')
    hashes={name:sha(path) for name,path in files.items()}
    hashes['BACKUP-README.txt']=hashlib.sha256(notice.encode()).hexdigest()
    sums=''.join(f'{digest}  {name}\n' for name,digest in sorted(hashes.items()))
    temp=target.with_suffix('.partial.zip')
    with zipfile.ZipFile(temp,'w',allowZip64=True) as z:
        for name,path in files.items():
            compression=zipfile.ZIP_STORED if path.suffix.lower() in {'.jpg','.mp3','.mp4','.png'} else zipfile.ZIP_DEFLATED
            z.write(path,name,compress_type=compression,compresslevel=6 if compression==zipfile.ZIP_DEFLATED else None)
        z.writestr('BACKUP-README.txt',notice,compress_type=zipfile.ZIP_DEFLATED)
        z.writestr('SHA256SUMS.txt',sums,compress_type=zipfile.ZIP_DEFLATED)
    with zipfile.ZipFile(temp) as z:
        bad=z.testzip()
        if bad:raise ValueError(f'ZIP integrity failed at {bad}')
        for name,digest in hashes.items():
            if hashlib.sha256(z.read(name)).hexdigest()!=digest:raise ValueError(f'ZIP member digest failed: {name}')
    temp.replace(target)
    print(f'Created {target}: {len(files)} files + README + SHA256SUMS, {target.stat().st_size} bytes')
    print('SHA-256',sha(target))
    print('Local ZIP member verification PASS; Drive upload/download verification still required.')

if __name__=='__main__':
    try:main()
    except (OSError,ValueError,KeyError,zipfile.BadZipFile,json.JSONDecodeError) as e:
        print(f'Backup failed: {e}',file=sys.stderr);sys.exit(1)
