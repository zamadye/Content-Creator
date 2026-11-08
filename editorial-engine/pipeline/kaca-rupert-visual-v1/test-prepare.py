#!/usr/bin/env python3
"""Tests estimated timing; not a substitute for human AV review."""
import importlib.util,json,re,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];p=Path(__file__).with_name('prepare.py')
s=importlib.util.spec_from_file_location('p',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class PrepareTest(unittest.TestCase):
 def test_cut_after_estimated_question_before_next_line(self):
  self.assertLess(m.mapped(2.870),m.HOOK_FRAME/m.FPS)
  self.assertLess(m.HOOK_FRAME/m.FPS,m.mapped(3.527))
  self.assertLessEqual(m.HOOK_FRAME/m.FPS,3)
 def test_only_leading_silence_trimmed(self):self.assertLess(m.LEAD_TRIM,.267)
 def test_cues_match_source_concise_and_monotone(self):
  s=json.loads((ROOT/'content/recovered/kaca-pangeran-rupert-visual-v1.json').read_text(encoding='utf-8'))
  norm=lambda x:re.sub(r'\s+',' ',x).strip()
  self.assertEqual(norm(' '.join(x['narration'] for x in s['scenes'])),norm(' '.join(' '.join(x[2]) for x in m.RAW_CUES)))
  self.assertTrue(all(a<b and len(lines)<=2 and max(map(len,lines))<=36 for a,b,lines in m.RAW_CUES))
  self.assertTrue(all(a[1]<=b[0] for a,b in zip(m.RAW_CUES,m.RAW_CUES[1:])))
if __name__=='__main__':unittest.main()
