#!/usr/bin/env python3
"""Focused tests for the coarse cue-energy check; no claim of word alignment."""
import importlib.util, math, struct, subprocess, tempfile, unittest, wave
from pathlib import Path

spec=importlib.util.spec_from_file_location('turbine_qa',Path(__file__).with_name('qa.py'))
qa=importlib.util.module_from_spec(spec);spec.loader.exec_module(qa)

class ActivityTests(unittest.TestCase):
 def test_visual_change_metric_checks_actual_decoded_frames(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'cut.mp4';frame=bytes(36*64*3)
   cmd=[str(qa.FF),'-nostdin','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','36x64','-r','30','-i','pipe:0','-frames:v','2','-c:v','libx264','-pix_fmt','yuv420p',str(p)]
   subprocess.run(cmd,input=frame+bytes([255])*len(frame),check=True,capture_output=True)
   self.assertGreater(qa.visual_cut_delta(p,1),100)
   subprocess.run(cmd,input=frame+frame,check=True,capture_output=True)
   self.assertLess(qa.visual_cut_delta(p,1),1)
 def test_srt_matches_text_and_estimated_timing(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/'captions.srt';cue=[{'start':1.23,'end':2.5,'lines':['satu baris']}]
   p.write_text('1\n00:00:01,230 --> 00:00:02,500\nsatu baris\n',encoding='utf8')
   self.assertTrue(qa.srt_matches(p,cue))
   p.write_text('1\n00:00:01,231 --> 00:00:02,500\nsatu baris\n',encoding='utf8')
   self.assertFalse(qa.srt_matches(p,cue))
   p.write_text('1\n00:00:01,230 --> 00:00:02,500\nkata lain\n',encoding='utf8')
   self.assertFalse(qa.srt_matches(p,cue))
 def test_energy_inside_and_outside_estimated_cues(self):
  with tempfile.TemporaryDirectory() as tmp:
   old=qa.D;qa.D=Path(tmp)
   try:
    rate=48000;buf=bytearray()
    for i in range(rate):
     t=i/rate
     value=int(10000*math.sin(2*math.pi*300*t)) if .10<=t<.40 or .70<=t<.80 else 0
     buf.extend(struct.pack('<h',value))
    with wave.open(str(qa.D/'narasi-utuh.wav'),'wb') as f:
     f.setparams((1,2,rate,rate,'NONE','not compressed'));f.writeframes(buf)
    result=qa.activity([{'start':.08,'end':.42,'lines':['alpha']},{'start':.5,'end':.6,'lines':['silent']}])
    self.assertAlmostEqual(result['active_seconds'],.4,places=2)
    self.assertAlmostEqual(result['active_outside_any_cue_seconds'],.1,places=2)
    self.assertEqual(result['cues_without_detected_energy'],[2])
    self.assertIn('not speech recognition',result['interpretation'])
   finally:qa.D=old

if __name__=='__main__':unittest.main()
