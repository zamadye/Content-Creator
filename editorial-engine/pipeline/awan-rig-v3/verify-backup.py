#!/usr/bin/env python3
"""Verify backup and regenerate frame 0/poster/text in a temporary clean tree.

This uses the existing node_modules, not a clean npm install or a full MP4 rebuild.
"""
import hashlib,json,shutil,subprocess,zipfile
from pathlib import Path,PurePosixPath
R=Path(__file__).resolve().parents[2];D=R/'deliverables/awan-rig-v3';Z=D/'cadangan-privat-awan-rig-v3.zip';T=D/'restore-check'
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
 run(['python3','pipeline/awan-rig-v3/restore-input.py',T/'input/01-INPUT-PRIVAT-RIG-V3.zip'],root)
 run(['python3','pipeline/awan-rig-v3/prepare.py'],root)
 run(['node','--test','pipeline/awan-rig-v3/test-story.mjs','pipeline/awan-rig-v2/test-rig.mjs'],root)
 run(['python3','pipeline/awan-rig-v3/test-prepare.py'],root)
 run(['python3','pipeline/awan-rig-v3/test-restore.py'],root)
 run([root/'node_modules/.bin/tsx','pipeline/awan-rig-v3/render.tsx','--still-zero'],root)
 run(['python3','pipeline/awan-rig-v3/write-deliverables.py'],root)
 out=root/'deliverables/awan-rig-v3';checks={}
 for n in ['qa-sample-00.png','awan-rig-v3-thumbnail.png','awan-rig-v3-poster-4x5.png','caption-empat-platform.txt','storyboard-rig-v3.md','subtitle-perkiraan.srt','musik-original.wav']:
  checks[n]=sha(out/n)==manifest['hasil/'+n]
 if not all(checks.values()):raise ValueError(f'Restore differences: {checks}')
 result={'backup':str(Z),'sha256':sha(Z),'manifest_entries':len(manifest),'recreated_matching_files':checks,'limitations':'Existing node_modules; only frame 0, thumbnail/poster, text and music recreated. Full MP4 rebuild, fresh npm installation, human AV, playback, rights NOT TESTED.'}
 (D/'RESTORE-CHECK.md').write_text('# Restore check — Awan V3\n\nPASS: archive CRC and all manifest SHA-256; restore inputs; prepare; unit tests; exact SHA-256 match for frame 0, thumbnail, 4:5 poster, captions, storyboard, SRT and original music in an isolated tree.\n\nNOT TESTED: full MP4 rebuild, new npm install, human AV, platform/device playback and rights. Existing node_modules was linked into the temporary tree.\n',encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False,indent=2))
finally:shutil.rmtree(T,ignore_errors=True)
