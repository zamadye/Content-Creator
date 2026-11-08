#!/usr/bin/env python3
"""Synthetic tests for private rough guardrails; not creative/quality tests."""
from __future__ import annotations
import copy
import hashlib
import importlib.util
import json
import shutil
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from types import SimpleNamespace

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('render_rough',HERE/'render_rough.py')
r=importlib.util.module_from_spec(spec)
spec.loader.exec_module(r)

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

class RoughTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.root=Path(self.tmp.name)
        self.voices=self.root/'voices';self.voices.mkdir()
        self.assets=self.root/'assets';self.assets.mkdir()
        self.meta=json.loads((r.CONTENT/'render-meta.json').read_text())
        files={s['asset'] for key in ('master','short') for s in self.meta[key]}
        hashes={}
        for name in files:
            path=self.assets/name;path.write_bytes(('fake image '+name).encode());hashes[name]=sha(path)
        self.man={'format':1,'voiceId':'voice-05','assets':hashes,'scripts':{}}
        for name in ('master','short'):
            script=r.CONTENT/f'{name}.script.json';data=json.loads(script.read_text())
            audio=self.voices/f'{name}.mp3';audio.write_bytes(('fake '+name).encode())
            self.man['scripts'][name]={'sha256':sha(script),'chunks':[{'audio':audio.name,'sha256':sha(audio),
                'sceneIds':[s['id'] for s in data['scenes']],
                'narration':' '.join(s['narration'] for s in data['scenes'])}]}
    def tearDown(self):self.tmp.cleanup()
    def test_honest_timing_allocation(self):
        lines=['Pertama.','Kedua cukup panjang.','Ketiga.']
        spans=r.allocate_sentences(lines,10,[(2,.4),(7,.7)])
        self.assertEqual(len(spans),3);self.assertEqual(spans[0][0],0);self.assertEqual(spans[-1][1],10)
        for a,b in spans:self.assertLess(a,b)
        for a,b in zip(spans,spans[1:]):self.assertEqual(a[1],b[0])
    def test_no_pauses_fallback_monotonic(self):
        spans=r.allocate_sentences(['Satu.','Dua.','Tiga.'],5,[])
        self.assertEqual(spans[0][0],0);self.assertEqual(spans[-1][1],5)
        self.assertTrue(all(a<b for a,b in spans))
    def test_private_mode_and_private_path_required(self):
        with self.assertRaises(ValueError):r.validate_mode(False,r.ROOT/'.scratch/output')
        with self.assertRaises(ValueError):r.validate_mode(True,r.ROOT/'editorial-engine/deliverables')
        r.validate_mode(True,r.ROOT/'.scratch/output')
    def test_matching_bound_inputs(self):
        scripts,_=r.validate_inputs(self.man,self.voices,self.assets)
        self.assertEqual(len(scripts['master']['scenes']),32)
    def test_changed_script_hash_fails(self):
        self.man['scripts']['master']['sha256']='bad'
        with self.assertRaisesRegex(ValueError,'script hash changed'):r.validate_inputs(self.man,self.voices,self.assets)
    def test_voice_content_binding_fails(self):
        self.man['scripts']['short']['chunks'][0]['narration']+=' kata'
        with self.assertRaisesRegex(ValueError,'does not match exact script'):r.validate_inputs(self.man,self.voices,self.assets)
    def test_scene_order_and_coverage_fail(self):
        c=self.man['scripts']['master']['chunks'][0];c['sceneIds'].reverse()
        scene={s['id']:s['narration'] for s in json.loads((r.CONTENT/'master.script.json').read_text())['scenes']}
        c['narration']=' '.join(scene[x] for x in c['sceneIds'])
        with self.assertRaisesRegex(ValueError,'cover scenes exactly'):r.validate_inputs(self.man,self.voices,self.assets)
    def test_tampered_voice_fails(self):
        (self.voices/'master.mp3').write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError,'modified voice'):r.validate_inputs(self.man,self.voices,self.assets)
    def test_path_traversal_is_rejected(self):
        c=self.man['scripts']['master']['chunks'][0];c['audio']='../escape.mp3';(self.root/'escape.mp3').write_bytes(b'escape');c['sha256']=sha(self.root/'escape.mp3')
        with self.assertRaisesRegex(ValueError,'missing, moved or modified voice'):r.validate_inputs(self.man,self.voices,self.assets)
    def test_tampered_art_fails(self):
        name=next(iter(self.man['assets']));(self.assets/name).write_bytes(b'changed')
        with self.assertRaisesRegex(ValueError,'modified image'):r.validate_inputs(self.man,self.voices,self.assets)
    def test_short_needs_two_distinct_objects_and_actions(self):
        fake=self.root/'content';fake.mkdir()
        for name in ('master.script.json','short.script.json'):shutil.copy(r.CONTENT/name,fake/name)
        meta=copy.deepcopy(self.meta)
        meta['short'][0]['objectMap']=[{'object':'air','action':'masuk'},{'object':' AIR ','action':'diam'}]
        (fake/'render-meta.json').write_text(json.dumps(meta))
        with patch.object(r,'CONTENT',fake):
            with self.assertRaisesRegex(ValueError,'distinct visual objects'):r.validate_inputs(self.man,self.voices,self.assets)
        meta['short'][0]['objectMap']=[{'object':'air','action':'masuk'},{'object':'kursi','action':' '}]
        (fake/'render-meta.json').write_text(json.dumps(meta))
        with patch.object(r,'CONTENT',fake):
            with self.assertRaisesRegex(ValueError,'incomplete object/action'):r.validate_inputs(self.man,self.voices,self.assets)
    def test_static_overlays_are_single_frame_not_unbounded_loops(self):
        task={'scene':{'id':'S12','start':0.,'end':8.},'base':Path('base.png'),'head':Path('head.png'),
              'cues':[{'path':Path('sub1.png'),'start':0.,'end':4.},{'path':Path('sub2.png'),'start':4.,'end':8.}],
              'vdir':self.root,'hostdir':self.root,'w':1280,'h':720}
        with patch.object(r.subprocess,'run',return_value=SimpleNamespace(returncode=0,stderr='')) as call:
            r.render_segment(task,self.root/'out.mp4')
        cmd=call.call_args.args[0]
        self.assertEqual(cmd.count('-loop'),1)
        filters=cmd[cmd.index('-filter_complex')+1]
        self.assertIn('eof_action=repeat:shortest=0',filters)
        with patch.object(r.subprocess,'run',return_value=SimpleNamespace(returncode=-9,stderr='')):
            with self.assertRaisesRegex(RuntimeError,r'exit -9'):r.render_segment(task,self.root/'out.mp4')
    def test_subtitle_dates_stay_together_and_question_breaks_at_clause(self):
        f=r.font(36,bold=True)
        pages=r.sentence_pages('Pengadilan banding membatalkan pemecatannya pada seribu sembilan ratus sembilan puluh delapan.',f,int(720*.84))
        self.assertIn('1998',' '.join(pages))
        self.assertNotIn('puluh delapan',' '.join(pages))
        self.assertTrue(all(len(p.splitlines())<=2 for p in pages))
        pages=r.sentence_pages('Kalau laporan seperti ini muncul di tempatmu, siapa yang bisa mengambil tindakan sementara?',f,int(720*.84))
        self.assertGreater(len(pages),1)
        self.assertTrue(pages[0].endswith(','))
        pages=r.sentence_pages('Tapi dua temuan administratif tentang tindakannya sebelum menemukan titik itu tetap berlaku.',f,int(720*.84))
        self.assertTrue(all(len(p.split())>1 for p in pages))
        self.assertGreater(r.subtitle_weight('1998'),len('1998'))
    def test_cues_are_ordered_and_contained(self):
        time=[{'id':'S01','start':0.,'end':4.,'sentences':[{'text':'Banjir datang dari bawah.','start':0.,'end':4.}]}]
        c=r.make_cues(time,720,1280)
        self.assertTrue(c);self.assertEqual(c[0]['start'],0.);self.assertAlmostEqual(c[-1]['end'],4.)
        self.assertTrue(all(0<=x['start']<x['end']<=4 for x in c))

if __name__=='__main__':unittest.main()
