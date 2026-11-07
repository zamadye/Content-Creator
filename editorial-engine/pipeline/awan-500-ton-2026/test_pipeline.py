#!/usr/bin/env python3
import ast, decimal, importlib.util, json, tempfile, unittest, zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
DIR=Path(__file__).resolve().parent
STORY=json.loads((ROOT/'content/recovered/awan-500-ton-2026.json').read_text(encoding='utf8'))
spec=importlib.util.spec_from_file_location('restore_cloud',DIR/'restore-input.py')
restore=importlib.util.module_from_spec(spec);spec.loader.exec_module(restore)

def assignment(name):
    tree=ast.parse((DIR/'prepare.py').read_text(encoding='utf8'))
    return next(ast.literal_eval(node.value) for node in tree.body if isinstance(node,ast.Assign) and any(isinstance(t,ast.Name) and t.id==name for t in node.targets))

class StoryTests(unittest.TestCase):
    def test_estimate_units(self):
        d=decimal.Decimal
        water_grams=d('1000000000')*d('0.5')
        self.assertEqual(water_grams/d('1000'),d('500000'))
        self.assertEqual(water_grams/d('1000000'),d('500'))
    def test_story_and_sources(self):
        scenes=STORY['scenes'];self.assertEqual(len(scenes),9)
        self.assertTrue(all(s['narration'] and s['action'] and len(s['objectMap'])>=2 for s in scenes))
        self.assertIn('ikuti knot theory',scenes[-1]['narration'])
        self.assertIn('bukan berat setiap awan',scenes[3]['narration'])
        self.assertTrue(any('usgs.gov' in s['url'] for s in STORY['sources']))
        self.assertTrue(any('10.1002/qj.3042' in s['url'] for s in STORY['sources']))
    def test_timeline_and_cues_match_story(self):
        starts,cues=assignment('STARTS'),assignment('CUES')
        self.assertEqual(len(starts),len(STORY['scenes']))
        self.assertEqual(starts,sorted(starts))
        self.assertEqual(' '.join(s['narration'] for s in STORY['scenes']),' '.join(' '.join(c[2]) for c in cues))
        self.assertTrue(all(0<=a<b and len(lines)<=2 and max(map(len,lines))<=36 for a,b,lines in cues))
        self.assertTrue(all(a[1]<=b[0] for a,b in zip(cues,cues[1:])))
    def test_reject_zip_path_injection(self):
        with tempfile.TemporaryDirectory() as td:
            z=Path(td)/'bad.zip'
            with zipfile.ZipFile(z,'w') as out:out.writestr('../bad.txt','bad')
            with self.assertRaisesRegex(ValueError,'Unexpected'):restore.restore(z,Path(td))
            self.assertFalse((Path(td).parent/'bad.txt').exists())
    def test_actual_input_roundtrip_to_isolated_directory(self):
        z=ROOT/'deliverables/awan-500-ton-2026/01-INPUT-PRIVAT-AWAN.zip'
        if not z.exists():self.skipTest('private input not available')
        with tempfile.TemporaryDirectory() as td:
            target=Path(td);story=target/restore.STORY;story.parent.mkdir(parents=True);story.write_bytes((ROOT/restore.STORY).read_bytes())
            restore.restore(z,target)
            self.assertTrue(all((target/f).is_file() for f in restore.MEDIA))
            story.write_text('{}')
            with self.assertRaisesRegex(ValueError,'differs'):restore.restore(z,target)

if __name__=='__main__':unittest.main()
