#!/usr/bin/env python3
"""Partial isolated restore and still/text reproduction, not a fresh install or MP4 rebuild."""
import hashlib,json,subprocess,tempfile,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'deliverables/awan-rig-v2';Z=D/'cadangan-privat-awan-rig-v2.zip'
sha=lambda data:hashlib.sha256(data).hexdigest()
with zipfile.ZipFile(Z) as z:
 names=z.namelist();manifest=json.loads(z.read('MANIFEST-SHA256.json'))
 if len(names)!=len(set(names)) or set(names)!=set(manifest)|{'MANIFEST-SHA256.json'} or z.testzip() is not None:raise ValueError('ZIP structure/CRC failure')
 for name,digest in manifest.items():
  if sha(z.read(name))!=digest:raise ValueError(f'SHA mismatch {name}')
 with tempfile.TemporaryDirectory(prefix='restore-awan-v2-',dir=D) as tmp:
  root=Path(tmp)/'editorial-engine';root.mkdir()
  prefix='source/editorial-engine/'
  for name in names:
   if not name.startswith(prefix):continue
   rel=Path(name[len(prefix):])
   if rel.is_absolute() or '..' in rel.parts:raise ValueError('Unsafe path')
   target=root/rel;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(name))
  inp=root/'deliverables/awan-rig-v2/01-INPUT-PRIVAT-RIG-V2.zip';inp.parent.mkdir(parents=True);inp.write_bytes(z.read('input/01-INPUT-PRIVAT-RIG-V2.zip'))
  (root/'node_modules').symlink_to(R/'node_modules',target_is_directory=True)
  def run(args):
   p=subprocess.run(args,cwd=root,capture_output=True,text=True)
   if p.returncode:raise RuntimeError(f'FAIL {args}: {p.stderr[-2000:]}')
  run(['python3','pipeline/awan-rig-v2/restore-input.py'])
  run(['python3','pipeline/awan-rig-v2/prepare.py'])
  run(['node_modules/.bin/tsx','pipeline/awan-rig-v2/render.tsx','--stills'])
  run(['python3','pipeline/awan-rig-v2/write-deliverables.py'])
  compared=['qa-sample-00.png','awan-rig-v2-thumbnail.png','awan-rig-v2-poster-4x5.png','caption-empat-platform.txt','storyboard-rig-v2.md','subtitle-perkiraan.srt']
  for name in compared:
   if sha((root/'deliverables/awan-rig-v2'/name).read_bytes())!=sha(z.read('hasil/'+name)):raise ValueError(f'Regenerated mismatch: {name}')
report={'status':'PASS PARTIAL ONLY','checks':['ZIP CRC and all entry SHA-256','allowlisted input restored in isolated tree','regenerated six still/text outputs match exactly'],'compared':compared,'using_existing_node_modules':True,'full_MP4_rebuild':'NOT TESTED','fresh_npm_install':'NOT TESTED','human_playback':'NOT TESTED','backup_sha256':sha(Z.read_bytes())}
(D/'RESTORE-CHECK.txt').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');print(json.dumps(report,ensure_ascii=False,indent=2))
