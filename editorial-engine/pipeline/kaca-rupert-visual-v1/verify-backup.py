#!/usr/bin/env python3
"""Verify private archive and recreate outputs in isolation using existing deps.
Not a full MP4 rebuild or fresh installation.
"""
import hashlib,json,shutil,subprocess,zipfile
from pathlib import Path,PurePosixPath
R=Path(__file__).resolve().parents[2];D=R/'deliverables/kaca-rupert-visual-v1';Z=D/'cadangan-privat-kaca-rupert.zip';T=D/'restore-check'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(cmd,cwd):subprocess.run([str(x) for x in cmd],cwd=cwd,check=True,stdout=subprocess.DEVNULL)
if T.exists():shutil.rmtree(T)
T.mkdir(parents=True)
try:
 with zipfile.ZipFile(Z) as z:
  names=z.namelist()
  if len(names)!=len(set(names)) or any(PurePosixPath(n).is_absolute() or '..' in PurePosixPath(n).parts for n in names):raise ValueError('Unsafe or duplicate ZIP entries')
  manifest=json.loads(z.read('MANIFEST-SHA256.json'))
  if set(names)!=set(manifest)|{'MANIFEST-SHA256.json'} or z.testzip() is not None:raise ValueError('ZIP manifest/CRC mismatch')
  for n,h in manifest.items():
   if hashlib.sha256(z.read(n)).hexdigest()!=h:raise ValueError(f'Bad SHA: {n}')
  for n in names:
   if n.startswith('source/') or n.startswith('input/'):z.extract(n,T)
 root=T/'source/editorial-engine';(root/'node_modules').symlink_to(R/'node_modules',target_is_directory=True)
 run(['python3','pipeline/kaca-rupert-visual-v1/restore-input.py',T/'input/01-INPUT-PRIVAT.zip'],root)
 run(['python3','pipeline/kaca-rupert-visual-v1/prepare.py'],root)
 run(['node','--test','pipeline/kaca-rupert-visual-v1/test-story.mjs','pipeline/awan-rig-v2/test-rig.mjs'],root)
 run(['python3','pipeline/kaca-rupert-visual-v1/test-prepare.py'],root);run(['python3','pipeline/kaca-rupert-visual-v1/test-restore.py'],root)
 run([root/'node_modules/.bin/tsx','pipeline/kaca-rupert-visual-v1/render.tsx','--still-zero'],root)
 run(['python3','pipeline/kaca-rupert-visual-v1/write-deliverables.py'],root)
 out=root/'deliverables/kaca-rupert-visual-v1';checks={}
 for n in ['qa-sample-00.png','kaca-rupert-thumbnail.png','kaca-rupert-poster-4x5.png','caption-empat-platform.txt','storyboard-dan-sumber.md','subtitle-perkiraan.srt','musik-original.wav']:checks[n]=sha(out/n)==manifest['hasil/'+n]
 if not all(checks.values()):raise ValueError(f'Restore differences: {checks}')
 result={'backup':str(Z),'sha256':sha(Z),'manifest_entries':len(manifest),'recreated_matching_files':checks,'limitations':'Used existing node_modules; frame 0, thumbnail/poster, text and music only. Full MP4 rebuild, fresh npm installation, human AV, playback and rights NOT TESTED.'}
 (D/'RESTORE-CHECK.md').write_text('# Restore check — Kaca Rupert\n\nPASS: CRC and all manifest SHA-256; restore input; prepare; unit tests; exact SHA-256 match for frame 0, thumbnail, poster, captions, storyboard, SRT and original music in isolated tree.\n\nNOT TESTED: full MP4 rebuild, new npm install, human AV, platform/device playback and rights. Existing node_modules linked into temporary tree.\n',encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2))
finally:shutil.rmtree(T,ignore_errors=True)
