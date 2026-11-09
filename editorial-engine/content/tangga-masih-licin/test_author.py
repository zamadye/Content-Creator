#!/usr/bin/env python3
"""Structural checks for the evaluation draft; not an editorial-quality review."""
import json
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from shutil import copy2

ROOT=Path(__file__).resolve().parent

def load(filename):
    return json.loads((ROOT/filename).read_text(encoding='utf-8'))

class EvaluationDraftTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.brief=load('brief.json')
        cls.master=load('master.script.json')
        cls.short=load('short.script.json')
        cls.meta=load('render-meta.json')
        cls.sources=load('short-sumber-master.json')

    def test_outputs_are_reproducible_in_an_isolated_directory(self):
        artifacts=['brief.json','render-meta.json','short-sumber-master.json']
        for version in ('master','short'):
            artifacts += [f'{version}.script.json',f'{version}.audit.json',
                          f'naskah-{version}.md',f'storyboard-{version}.md']
        with tempfile.TemporaryDirectory() as td:
            d=Path(td);copy2(ROOT/'author.py',d/'author.py')
            subprocess.run([sys.executable,str(d/'author.py')],check=True,capture_output=True,text=True)
            for name in artifacts:
                with self.subTest(name=name):
                    self.assertEqual((ROOT/name).read_bytes(),(d/name).read_bytes())

    def test_script_and_scene_plan_match_master_in_order(self):
        self.assertEqual(self.brief['scriptId'],self.master['id'])
        self.assertEqual([s['id'] for s in self.master['scenes']],
                         [s['sceneId'] for s in self.brief['scenePlan']])
        self.assertGreater(len(self.master['scenes']),len(self.short['scenes']))

    def test_every_scene_has_two_distinct_named_objects_with_actions(self):
        for version in ('master','short'):
            self.assertEqual([s['id'] for s in load(f'{version}.script.json')['scenes']],
                             [s['id'] for s in self.meta[version]])
            for s in self.meta[version]:
                with self.subTest(version=version,scene=s['id']):
                    names=[o['object'].strip().casefold() for o in s['objectMap']]
                    self.assertGreaterEqual(len(set(names)),2)
                    self.assertTrue(all(n and o['action'].strip() for n,o in zip(names,s['objectMap'])))

    def test_focal_names_do_not_run_three_times(self):
        # This checks labels only: visually repetitive drawings can still have different labels.
        for version in ('master','short'):
            focals=[s['focal'].strip().casefold() for s in self.meta[version]]
            for i in range(2,len(focals)):
                with self.subTest(version=version,index=i):
                    self.assertFalse(focals[i-2]==focals[i-1]==focals[i])

    def test_short_maps_to_real_master_scenes_and_climax(self):
        masterids={s['id'] for s in self.master['scenes']}
        self.assertEqual(set(self.sources),{s['id'] for s in self.short['scenes']})
        for sid,refs in self.sources.items():
            with self.subTest(short_scene=sid):
                self.assertTrue(refs)
                self.assertTrue(set(refs)<=masterids)
        self.assertIn('S20',{r for refs in self.sources.values() for r in refs})
        self.assertIn('S36',{r for refs in self.sources.values() for r in refs})
        for s in self.meta['short']:
            self.assertEqual(s['sourceSceneIds'],self.sources[s['id']])

    def test_disclosure_and_opening_are_planned_not_measured(self):
        self.assertIn('fiksi', ' '.join(s['narration'] for s in self.master['scenes'][:3]).lower())
        self.assertIn('fiksi', ' '.join(s['narration'] for s in self.short['scenes'][:3]).lower())
        self.assertEqual(self.master['scenes'][0]['narration'],'Tangga itu masih licin.')
        self.assertEqual(self.short['scenes'][0]['narration'],'Tangga itu masih licin.')
        self.assertIsNone(self.brief['hook']['visualCutSeconds'])
        self.assertIsNone(self.brief['hook']['spokenOpeningSeconds'])

    def test_no_forced_social_cta_in_draft_narration(self):
        avoid=re.compile(r'tulis(?:kan)?\s+(?:di\s+)?komentar|jangan lupa|ikuti knot theory|follow|subscribe|bagikan video',re.I)
        for version in ('master','short'):
            narration=' '.join(s['narration'] for s in load(f'{version}.script.json')['scenes'])
            self.assertIsNone(avoid.search(narration))
            self.assertIn('?',narration)
        # Prior brand ending remains an explicit review decision, not a silently deleted rule.
        self.assertIn('konfirmasi',(ROOT/'evaluasi-arah.md').read_text(encoding='utf-8').lower())

    def test_named_concepts_follow_concrete_examples(self):
        for edition in ('master','short'):
            scenes=load(f'{edition}.script.json')['scenes']
            text=' '.join(s['narration'] for s in scenes).lower()
            with self.subTest(edition=edition):
                self.assertLess(text.index('bima membalas'),text.index('ad hominem'))
                self.assertIn('menyerang orangnya',text)
                self.assertIn('toxic',text)
                self.assertIn('sifat bima',text)
                self.assertIn('perilaku',text)
                self.assertNotIn('bima adalah orang toxic',text)
                self.assertNotIn('diagnosis',text)

    def test_intention_repeated_example_and_possible_hesitation(self):
        for edition in ('master','short'):
            text=' '.join(s['narration'] for s in load(f'{edition}.script.json')['scenes']).lower()
            with self.subTest(edition=edition):
                self.assertIn('tetangga',text)
                self.assertIn('minggu lalu',text)
                self.assertIn('lampu',text)
                self.assertTrue('ragu bicara' in text or 'takut melapor lagi' in text)

    def test_relevance_and_limits_are_preserved(self):
        for edition in ('master','short'):
            text=' '.join(s['narration'] for s in load(f'{edition}.script.json')['scenes']).lower()
            with self.subTest(edition=edition):
                self.assertIn('menunggak',text)
                self.assertIn('pengalaman',text)
                self.assertIn('belum tentu',text)
                self.assertIn('pasti benar',text)
                self.assertIn('pemeriksaan',text)

    def test_short_revision_maps_educational_beats_to_master(self):
        required={'T04a':'S12a','T04b':'S12d','T08a':'S21a','T08b':'S21c',
                  'T08c':'S21d','T08d':'S13a','T14':'S36'}
        for short,master in required.items():
            with self.subTest(short=short):self.assertIn(master,self.sources[short])

    def test_pdf_groups_validate_full_order_and_reject_omission(self):
        # The PDF builder depends on reportlab; install its documented dependency
        # to run this check. It validates actual inclusive ID ranges, not integer slices.
        try: import reportlab  # noqa: F401
        except ImportError: self.skipTest('reportlab not installed')
        import importlib.util
        spec=importlib.util.spec_from_file_location('review_pdf',ROOT/'build_review.py')
        pdf=importlib.util.module_from_spec(spec);spec.loader.exec_module(pdf)
        for edition,groups in [('master',pdf.MASTER_GROUPS),('short',pdf.SHORT_GROUPS)]:
            scenes=load(f'{edition}.script.json')['scenes']
            planned=pdf.grouped_scenes(scenes,groups)
            self.assertEqual([x['id'] for g in planned for x in g[4]],[x['id'] for x in scenes])
            with self.assertRaises(ValueError):pdf.grouped_scenes(scenes,groups[:-1])
            with self.assertRaises(ValueError):pdf.grouped_scenes(scenes,groups+groups[-1:])

    def test_audits_cover_every_script_line(self):
        for version in ('master','short'):
            script=load(f'{version}.script.json'); audit=load(f'{version}.audit.json')
            self.assertEqual(audit['scriptId'],script['id'])
            self.assertEqual([(s['id'],s['narration']) for s in script['scenes']],
                             [(i['sceneId'],i['text']) for i in audit['items']])

if __name__=='__main__':
    unittest.main(verbosity=2)
