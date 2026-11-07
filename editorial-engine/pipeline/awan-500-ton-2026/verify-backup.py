#!/usr/bin/env python3
"""Verify a backup and recreate representative assets in an isolated temp checkout.

Reuses local node_modules; DOES NOT render the entire video or test npm installation.
"""
import hashlib,json,os,shutil,subprocess,tempfile,zipfile
from pathlib import Path, PurePosixPath
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'deliverables/awan-500-ton-2026'
BACKUP=D/'cadangan-privat-awan-500-ton.zip'

def sha(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()

def verify():
    with zipfile.ZipFile(BACKUP) as z:
        names=z.namelist();manifest=json.loads(z.read('MANIFEST-SHA256.json'))
        if len(names)!=len(set(names)) or set(names)!=set(manifest)|{'MANIFEST-SHA256.json'}:raise ValueError('Duplicate, missing or unexpected ZIP entry')
        if z.testzip() is not None:raise ValueError('ZIP CRC failure')
        for name,expected in manifest.items():
            parts=PurePosixPath(name)
            if parts.is_absolute() or '..' in parts.parts:raise ValueError('Unsafe ZIP path')
            h=hashlib.sha256()
            with z.open(name) as f:
                for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
            if h.hexdigest()!=expected:raise ValueError(f'SHA mismatch: {name}')
        with tempfile.TemporaryDirectory(prefix='restore-check-',dir=D) as td:
            base=Path(td)
            for name in names:
                if not name.startswith('source/editorial-engine/'):continue
                target=base/Path(name).relative_to('source');target.parent.mkdir(parents=True,exist_ok=True)
                with z.open(name) as src,target.open('wb') as out:shutil.copyfileobj(src,out)
            engine=base/'editorial-engine';out=engine/'deliverables/awan-500-ton-2026';out.mkdir(parents=True)
            with z.open('input/01-INPUT-PRIVAT-AWAN.zip') as src,(out/'01-INPUT-PRIVAT-AWAN.zip').open('wb') as dst:shutil.copyfileobj(src,dst)
            os.symlink(ROOT/'node_modules',engine/'node_modules',target_is_directory=True)
            for cmd in [
                ['python3','pipeline/awan-500-ton-2026/restore-input.py'],
                ['python3','pipeline/awan-500-ton-2026/prepare.py'],
                ['python3','pipeline/awan-500-ton-2026/captions.py'],
                ['python3','pipeline/awan-500-ton-2026/storyboard.py'],
                ['./node_modules/.bin/tsx','pipeline/awan-500-ton-2026/render.tsx','--stills'],
            ]:
                subprocess.run(cmd,cwd=engine,check=True,capture_output=True,text=True,timeout=120)
            names_to_compare=['qa-sample-00.png','awan-500-ton-thumbnail.png','awan-500-ton-poster-4x5.png','caption-4-platform.txt','STORYBOARD.md']
            results={name:sha(out/name)==sha(D/name) for name in names_to_compare}
            if not all(results.values()):raise ValueError(f'Recreated artifacts differ: {results}')
    report='''# Verifikasi pemulihan parsial\n\nPASS: daftar entri, CRC dan SHA-256 tiap entri ZIP.\nPASS: ekstraksi source dan input ke direktori sementara terisolasi, validasi input, prepare, caption, storyboard dan render gambar diam.\nPASS: hash frame nol, thumbnail, poster, caption dan storyboard yang dihasilkan ulang cocok dengan hasil produksi lokal.\nNOT TESTED: instalasi npm di sistem baru, render penuh MP4 dari arsip, review manusia, lisensi, pemutaran platform dan ponsel. Test ini memakai node_modules dari lingkungan produksi yang sama.\n'''
    (D/'RESTORE-CHECK.md').write_text(report,encoding='utf8')
    return results
if __name__=='__main__':print(json.dumps({'status':'PASS for partial restore only','files':verify()},ensure_ascii=False))
