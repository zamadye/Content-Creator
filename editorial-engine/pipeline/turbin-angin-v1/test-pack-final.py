#!/usr/bin/env python3
import hashlib, importlib.util, json, tempfile, unittest, warnings, zipfile
from pathlib import Path

spec=importlib.util.spec_from_file_location('private_pack',Path(__file__).with_name('pack-private-final.py'))
pack=importlib.util.module_from_spec(spec);spec.loader.exec_module(pack)

class PrivateArchiveTests(unittest.TestCase):
 def create(self,path,name='private-runtime/test.txt',payload=b'hello',sha=None,scope='PRIVATE DRAFT ONLY'):
  digest=sha or hashlib.sha256(payload).hexdigest()
  with zipfile.ZipFile(path,'w') as z:
   z.writestr(name,payload)
   z.writestr('MANIFEST.json',json.dumps({'scope':scope,'files':{name:{'size':len(payload),'sha256':digest}}}))
 def test_valid(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.zip';self.create(p)
   self.assertEqual(pack.verify(p)['scope'],'PRIVATE DRAFT ONLY')
 def test_detects_byte_mismatch(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.zip';self.create(p,sha='0'*64)
   with self.assertRaises(ValueError):pack.verify(p)
 def test_unsafe_names_and_non_private_scope_are_rejected(self):
  with tempfile.TemporaryDirectory() as d:
   for name in ('../escape','/absolute','private/../escape','private\\escape','private//double'):
    p=Path(d)/'test.zip';self.create(p,name=name)
    with self.assertRaises(ValueError):pack.verify(p)
   p=Path(d)/'test.zip';self.create(p,scope='PUBLIC')
   with self.assertRaises(ValueError):pack.verify(p)
 def test_rejects_unlisted_or_duplicate_entries(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.zip';self.create(p)
   with zipfile.ZipFile(p,'a') as z:z.writestr('extra','x')
   with self.assertRaises(ValueError):pack.verify(p)
   self.create(p)
   with warnings.catch_warnings():
    warnings.simplefilter('ignore',UserWarning)
    with zipfile.ZipFile(p,'a') as z:z.writestr('private-runtime/test.txt','again')
   with self.assertRaises(ValueError):pack.verify(p)

if __name__=='__main__':unittest.main()
