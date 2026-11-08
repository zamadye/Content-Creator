#!/usr/bin/env python3
import hashlib,importlib.util,json,tempfile,unittest,zipfile
from pathlib import Path
s=importlib.util.spec_from_file_location('r',Path(__file__).with_name('restore-input.py'));r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
class RestoreTest(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=Path(self.tmp.name);p=self.root/'content/recovered/kaca-pangeran-rupert-visual-v1.json';p.parent.mkdir(parents=True);p.write_text(json.dumps({'scenes':[{'narration':'Satu kalimat.'}]}))
  self.data={n:('synthetic '+n).encode() for n in r.MEDIA};self.data['NARASI.txt']=b'Satu kalimat.\n';self.man={n:hashlib.sha256(v).hexdigest() for n,v in self.data.items()};self.zip=self.root/'in.zip'
 def tearDown(self):self.tmp.cleanup()
 def make(self,extra=None,bad=False):
  with zipfile.ZipFile(self.zip,'w') as z:
   for n,v in self.data.items():z.writestr(n,v)
   if extra:z.writestr(extra,b'x')
   man=dict(self.man)
   if bad:man['NARASI.txt']='0'*64
   z.writestr('MANIFEST-SHA256.json',json.dumps(man))
 def test_restore_idempotent(self):
  self.make();r.restore(self.zip,self.root);p=self.root/r.MEDIA[0];t=p.stat().st_mtime_ns;r.restore(self.zip,self.root);self.assertEqual(p.stat().st_mtime_ns,t)
 def test_conflict_never_overwrites(self):
  self.make();p=self.root/r.MEDIA[-1];p.parent.mkdir(parents=True);p.write_bytes(b'different')
  with self.assertRaises(ValueError):r.restore(self.zip,self.root)
  self.assertFalse((self.root/r.MEDIA[0]).exists());self.assertEqual(p.read_bytes(),b'different')
 def test_reject_bad_or_unsafe(self):
  self.make(extra='../escape')
  with self.assertRaises(ValueError):r.restore(self.zip,self.root)
  self.make(bad=True)
  with self.assertRaises(ValueError):r.restore(self.zip,self.root)
if __name__=='__main__':unittest.main()
