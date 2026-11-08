#!/usr/bin/env python3
"""Offline restore safety tests with synthetic bytes; not media playback QA."""
import hashlib,importlib.util,json,tempfile,unittest,zipfile
from pathlib import Path
module=Path(__file__).with_name('restore-input.py');spec=importlib.util.spec_from_file_location('restore_v3',module)
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
class RestoreV3Test(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name)
  specpath=self.root/'content/recovered/awan-500-ton-rig-v3.json';specpath.parent.mkdir(parents=True);specpath.write_text(json.dumps({'scenes':[{'narration':'Satu kalimat.'}]}))
  self.data={n:('synthetic '+n).encode() for n in r.MEDIA};self.data['NARASI.txt']=b'Satu kalimat.\n'
  self.manifest={n:hashlib.sha256(v).hexdigest() for n,v in self.data.items()}
  self.zpath=self.root/'input.zip'
 def tearDown(self):self.tmp.cleanup()
 def makezip(self,extra=None,bad=False):
  with zipfile.ZipFile(self.zpath,'w') as z:
   for n,v in self.data.items():z.writestr(n,v)
   if extra:z.writestr(extra,b'x')
   m=dict(self.manifest)
   if bad:m['NARASI.txt']='0'*64
   z.writestr('MANIFEST-SHA256.json',json.dumps(m))
 def test_restore_and_idempotent_existing_identical(self):
  self.makezip();r.restore(self.zpath,self.root);p=self.root/r.MEDIA[0];before=p.stat().st_mtime_ns
  r.restore(self.zpath,self.root);self.assertEqual(before,p.stat().st_mtime_ns)
  self.assertEqual(p.read_bytes(),self.data[r.MEDIA[0]])
 def test_reject_conflict_before_any_writes(self):
  self.makezip();p=self.root/r.MEDIA[-1];p.parent.mkdir(parents=True);p.write_bytes(b'different')
  with self.assertRaises(ValueError):r.restore(self.zpath,self.root)
  self.assertFalse((self.root/r.MEDIA[0]).exists());self.assertEqual(p.read_bytes(),b'different')
 def test_reject_unsafe_or_mismatched(self):
  self.makezip(extra='../escape');
  with self.assertRaises(ValueError):r.restore(self.zpath,self.root)
  self.makezip(bad=True)
  with self.assertRaises(ValueError):r.restore(self.zpath,self.root)
if __name__=='__main__':unittest.main()
