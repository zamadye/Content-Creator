#!/usr/bin/env python3
import hashlib,importlib.util,json,tempfile,unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location('progress',Path(__file__).with_name('pack-progress.py'))
progress=importlib.util.module_from_spec(spec);spec.loader.exec_module(progress)
sha=lambda b:hashlib.sha256(b).hexdigest()

class ProgressTests(unittest.TestCase):
 def fixture(self,root):
  root=Path(root);d=root/'render';d.mkdir()
  blobs={'human-review.json':b'review','original-review.json':b'prior review','Review-perubahan-naskah-audit.md':b'diff','narasi-voice-05.wav':b'raw','narration.txt':b'text'}
  for n,b in blobs.items():(root/n).write_bytes(b)
  for n,b in {'narasi-utuh.wav':b'voice','musik-original.wav':b'music','subtitle-perkiraan.srt':b'srt'}.items():(d/n).write_bytes(b)
  prepared={'reviewSha256':sha(b'review'),'voiceSourceSha256':sha(b'raw'),'narrationSha256':sha(b'voice'),'scoreSha256':sha(b'music'),
   'timeline':[{'id':'S01','startFrame':0,'endFrame':30},{'id':'S02','startFrame':30,'endFrame':60}]}
  (d/'prepared.json').write_text(json.dumps(prepared))
  for n in (1,2):
   data=f'scene{n}'.encode();p=d/f'scene-S{n:02}.mp4';p.write_bytes(data)
   (d/(p.name+'.json')).write_text(json.dumps({'scene':f'S{n:02}','frames':30,'sha256':sha(data),'fingerprint':'a'*64}))
  return root
 def test_collect_and_detect_changed_scene(self):
  with tempfile.TemporaryDirectory() as temp:
   root=self.fixture(temp);files,fp=progress.collect(root,2)
   self.assertEqual(fp,'a'*64);self.assertIn('private-runtime/render/scene-S02.mp4',files)
   (root/'render/scene-S01.mp4').write_bytes(b'changed')
   with self.assertRaises(ValueError):progress.collect(root,2)
 def test_rejects_changed_audio_or_invalid_range(self):
  with tempfile.TemporaryDirectory() as temp:
   root=self.fixture(temp)
   with self.assertRaises(ValueError):progress.collect(root,3)
   (root/'render/musik-original.wav').write_bytes(b'changed')
   with self.assertRaises(ValueError):progress.collect(root,1)

if __name__=='__main__':unittest.main()
