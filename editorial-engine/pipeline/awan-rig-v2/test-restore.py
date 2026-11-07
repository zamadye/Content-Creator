#!/usr/bin/env python3
import importlib.util,json,tempfile,unittest,zipfile
from pathlib import Path
R=Path(__file__).resolve().parents[2]; spec=importlib.util.spec_from_file_location('restore',R/'pipeline/awan-rig-v2/restore-input.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
SOURCE=R/'content/recovered/awan-500-ton-rig-v2.json';ARCHIVE=R/'deliverables/awan-rig-v2/01-INPUT-PRIVAT-RIG-V2.zip'
class RestoreTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name);p=self.root/'content/recovered/awan-500-ton-rig-v2.json';p.parent.mkdir(parents=True);p.write_bytes(SOURCE.read_bytes())
 def tearDown(self):self.temp.cleanup()
 def test_exact_restore(self):
  out=mod.restore(ARCHIVE,self.root);self.assertEqual(len(out),4)
  self.assertTrue((self.root/'audio/voiceovers/awan-rig-v2/narasi-utuh.mp3').is_file())
 def test_refuses_overwrite(self):
  dest=self.root/mod.MEDIA[0];dest.parent.mkdir(parents=True);dest.write_text('different')
  with self.assertRaisesRegex(ValueError,'Refusing'):mod.restore(ARCHIVE,self.root)
  self.assertEqual(dest.read_text(),'different')
 def test_rejects_extra_entries(self):
  bad=self.root/'bad.zip'
  with zipfile.ZipFile(ARCHIVE) as src,zipfile.ZipFile(bad,'w') as dst:
   for name in src.namelist():dst.writestr(name,src.read(name))
   dst.writestr('../unexpected.txt','x')
  with self.assertRaisesRegex(ValueError,'Unexpected'):mod.restore(bad,self.root)
if __name__=='__main__':unittest.main()
