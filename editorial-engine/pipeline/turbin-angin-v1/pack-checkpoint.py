#!/usr/bin/env python3
"""Create and independently verify a private preproduction checkpoint ZIP.

No final video is implied. The archive intentionally includes source footage,
so only upload it to private Drive, never Git. A fixed allowlist avoids secrets,
credentials, ephemeral upload sessions, node_modules and unrelated episodes.
"""
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[3]
PIPE = ROOT / 'editorial-engine/pipeline/turbin-angin-v1'
OUT = ROOT / '.scratch/turbine/Checkpoint-Turbin-DRAF.zip'


def digest_file(file: Path) -> str:
    h = hashlib.sha256()
    with file.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def files_to_pack() -> dict[str, Path]:
    paths = [
        'editorial-engine/content/proposals/turbin-angin-draf-v1.json',
        'editorial-engine/content/proposals/turbin-angin-audit-kalimat-v1.json',
        'editorial-engine/content/proposals/turbin-angin-caption-draf.txt',
        'editorial-engine/docs/STANDAR-NASKAH-PSIKOLOGI-PENONTON.md',
        'editorial-engine/pipeline/script-review/audit.py',
        'editorial-engine/pipeline/script-review/README.md',
        'editorial-engine/pipeline/awan-rig-v2/rig.tsx',
        'editorial-engine/pipeline/awan-rig-v2/rig-math.mjs',
        'editorial-engine/pipeline/awan-rig-v2/rig-math.d.mts',
        'editorial-engine/package.json', 'editorial-engine/package-lock.json',
        'editorial-engine/tsconfig.json',
        'editorial-engine/assets/fonts/archivo-latin-400-normal.ttf',
        'editorial-engine/assets/fonts/archivo-latin-600-normal.ttf',
        'editorial-engine/assets/fonts/archivo-latin-700-normal.ttf',
        'editorial-engine/assets/fonts/permanent-marker-latin-400-normal.ttf',
    ]
    result = {p: ROOT / p for p in paths}
    for file in sorted(PIPE.iterdir()):
        if file.is_file() and file.suffix in {'.mjs', '.mts', '.tsx', '.json', '.md', '.py'}:
            result[file.relative_to(ROOT).as_posix()] = file
    manifest = json.loads((PIPE / 'footage-manifest.json').read_text(encoding='utf-8'))
    for item in manifest['items']:
        name = item['localFilename']
        if name != Path(name).name:
            raise ValueError('Unsafe media filename')
        file = ROOT / 'google_drive' / name
        if not file.is_file() or file.stat().st_size != item['size'] or digest_file(file) != item['sha256']:
            raise ValueError(f'Missing or changed source {item["id"]}')
        result[f'private-media/{name}'] = file
    for name in ['Naskah-review-turbin.md', 'Audit-setiap-kalimat-DRAF.md',
                 'studi-frame-0.png', 'studi-mekanisme.png',
                 'footage-sheet-wide.png', 'footage-sheet-center-916.png']:
        result[f'private-review/{name}'] = ROOT / '.scratch/turbine' / name
    for name, file in result.items():
        if name.startswith('/') or '..' in Path(name).parts or not file.is_file():
            raise ValueError(f'Unsafe or missing checkpoint input: {name}')
    return result


def verify(archive: Path) -> None:
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        if len(names) != len(set(names)) or 'MANIFEST.json' not in names:
            raise ValueError('Duplicate entries or missing manifest')
        manifest = json.loads(z.read('MANIFEST.json'))
        if set(names) != set(manifest['files']) | {'MANIFEST.json'}:
            raise ValueError('Manifest/file list mismatch')
        for name, expected in manifest['files'].items():
            if name.startswith('/') or '..' in Path(name).parts:
                raise ValueError('Unsafe archive member')
            h = hashlib.sha256()
            size = 0
            with z.open(name) as f:
                for block in iter(lambda: f.read(1024 * 1024), b''):
                    h.update(block)
                    size += len(block)
            if size != expected['size'] or h.hexdigest() != expected['sha256']:
                raise ValueError(f'Archive integrity mismatch: {name}')


def main() -> None:
    if OUT.exists():
        raise ValueError('Checkpoint already exists; do not overwrite it')
    files = files_to_pack()
    metadata = {name: {'size': file.stat().st_size, 'sha256': digest_file(file)} for name, file in files.items()}
    partial = OUT.with_suffix('.zip.partial')
    if partial.exists():
        raise ValueError('Partial checkpoint exists; inspect it before retrying')
    try:
        with zipfile.ZipFile(partial, 'x', allowZip64=True) as z:
            for name, file in files.items():
                compression = zipfile.ZIP_STORED if file.suffix.lower() in {'.mp4', '.png'} else zipfile.ZIP_DEFLATED
                z.write(file, name, compress_type=compression)
            z.writestr('MANIFEST.json', json.dumps({'stage': 'PREPRODUCTION DRAFT, NO VOICE OR FINAL VIDEO',
                'rights': 'NEEDS REVIEW', 'human_review': 'NOT TESTED', 'files': metadata}, ensure_ascii=False, indent=2),
                compress_type=zipfile.ZIP_DEFLATED)
        verify(partial)
        os.replace(partial, OUT)
    except Exception:
        partial.unlink(missing_ok=True)
        raise
    print(json.dumps({'file': str(OUT.relative_to(ROOT)), 'bytes': OUT.stat().st_size,
                      'sha256': digest_file(OUT), 'entries': len(files), 'verification': 'PASS'}, indent=2))


if __name__ == '__main__':
    try:
        main()
    except (OSError, ValueError, KeyError, zipfile.BadZipFile) as exc:
        print(f'Checkpoint failed: {exc}', file=sys.stderr)
        sys.exit(1)
