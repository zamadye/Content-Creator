#!/usr/bin/env python3
"""Offline timing/spec checks; never substitutes for listening to the take."""
import importlib.util, json, re, unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
path=Path(__file__).with_name('prepare.py')
spec=importlib.util.spec_from_file_location('prepare_v3',path)
prep=importlib.util.module_from_spec(spec); spec.loader.exec_module(prep)

class PrepareV3Test(unittest.TestCase):
 def test_hook_cut_after_estimated_question_and_before_next_sentence(self):
  cut=89/prep.FPS
  self.assertLessEqual(cut,3)
  self.assertLess(prep.mapped(3.432),cut)
  self.assertLess(cut,prep.mapped(4.158))
 def test_two_trim_ranges_are_in_observed_silences(self):
  self.assertLess(prep.LEAD_TRIM,.390)
  self.assertGreater(prep.PAUSE_IN,2.333)
  self.assertLess(prep.PAUSE_OUT,2.733)
 def test_cues_equal_script_are_monotone_and_concise(self):
  v=json.loads((ROOT/'content/recovered/awan-500-ton-rig-v3.json').read_text(encoding='utf-8'))
  norm=lambda s:re.sub(r'\s+',' ',s).strip()
  self.assertEqual(norm(' '.join(x['narration'] for x in v['scenes'])),norm(' '.join(' '.join(c[2]) for c in prep.RAW_CUES)))
  self.assertTrue(all(a<b and len(lines)<=2 and max(map(len,lines))<=36 for a,b,lines in prep.RAW_CUES))
  self.assertTrue(all(a[1]<=b[0] for a,b in zip(prep.RAW_CUES,prep.RAW_CUES[1:])))
 def test_scene_breaks_and_early_mechanism_order(self):
  starts=[0,89/prep.FPS]+[prep.mapped(t) for t in prep.RAW_BREAKS[2:]]
  self.assertEqual(len(starts),10)
  self.assertTrue(all(a<b for a,b in zip(starts,starts[1:])))
  self.assertLess(starts[5],starts[6])

if __name__=='__main__': unittest.main()
