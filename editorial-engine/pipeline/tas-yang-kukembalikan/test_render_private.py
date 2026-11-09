#!/usr/bin/env python3
"""Mechanical and motion-smoke tests only; no human/rights/release approval."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import wave

from PIL import ImageChops

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('tas_private_renderer',HERE/'render_private.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)


class RoughTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp=tempfile.TemporaryDirectory(dir=r.ROOT/'.scratch')
        cls.voice=Path(cls.temp.name)
        cls.manifest={'voiceId':'voice-05','scripts':{}}
        for ed in ('master','short'):
            p=r.CONTENT/f'{ed}.script.json';scenes=json.loads(p.read_text(encoding='utf-8'))['scenes']
            wav=cls.voice/f'{ed}.wav'
            with wave.open(str(wav),'wb') as out:
                out.setnchannels(1);out.setsampwidth(2);out.setframerate(24000);out.writeframes(b'\x00\x00'*2400)
            cls.manifest['scripts'][ed]={'sha256':r.sha(p),'chunks':[{'audio':wav.name,'sha256':r.sha(wav),
                    'sceneIds':[s['id'] for s in scenes], 'narration':' '.join(s['narration'] for s in scenes)}]}

    @classmethod
    def tearDownClass(cls):cls.temp.cleanup()

    def test_valid_manifest_and_both_editions(self):
        result=r.validate(self.voice,self.manifest,['master','short'])
        self.assertEqual(set(result),{'master','short'})
        self.assertEqual(len(result['master'][0]['sceneIds']),30)
        self.assertEqual(len(result['short'][0]['sceneIds']),11)

    def test_reject_unselected_voice(self):
        m=copy.deepcopy(self.manifest);m['voiceId']='other'
        with self.assertRaises(ValueError):r.validate(self.voice,m,['master'])

    def test_reject_audio_hash_script_hash_and_bad_text(self):
        for field in ('audio','script','text'):
            m=copy.deepcopy(self.manifest)
            if field=='audio':m['scripts']['master']['chunks'][0]['sha256']='0'*64
            if field=='script':m['scripts']['master']['sha256']='0'*64
            if field=='text':m['scripts']['master']['chunks'][0]['narration']+=' added'
            with self.subTest(field=field),self.assertRaises(ValueError):r.validate(self.voice,m,['master'])

    def test_reject_path_traversal_and_missing_or_reordered_scenes(self):
        for kind in ('path','missing','reorder'):
            m=copy.deepcopy(self.manifest);c=m['scripts']['master']['chunks'][0]
            if kind=='path':c['audio']='../bad.wav'
            else:
                scenes=json.loads((r.CONTENT/'master.script.json').read_text(encoding='utf-8'))['scenes'];by={x['id']:x['narration'] for x in scenes}
                if kind=='missing':c['sceneIds'].pop()
                if kind=='reorder':c['sceneIds'][0:2]=reversed(c['sceneIds'][0:2])
                c['narration']=' '.join(by[i] for i in c['sceneIds'])
            with self.subTest(kind=kind),self.assertRaises(ValueError):r.validate(self.voice,m,['master'])

    def test_reject_voice_symlink_outside_directory(self):
        with tempfile.TemporaryDirectory(dir=r.ROOT/'.scratch') as other:
            external=Path(other)/'outside.wav';external.write_bytes(b'outside')
            link=self.voice/'linked.wav'
            try:
                link.symlink_to(external)
                m=copy.deepcopy(self.manifest);c=m['scripts']['master']['chunks'][0]
                c['audio']=link.name;c['sha256']=r.sha(external)
                with self.assertRaises(ValueError):r.validate(self.voice,m,['master'])
            finally:
                link.unlink(missing_ok=True)

    def test_output_guard(self):
        r.rough.validate_mode(True,r.ROOT/'.scratch/tas-test-out')
        with self.assertRaises(ValueError):r.rough.validate_mode(False,r.ROOT/'.scratch/tas-test-out')
        with self.assertRaises(ValueError):r.rough.validate_mode(True,r.ROOT/'editorial-engine')

    def test_all_scenes_have_recipes_and_two_distinct_object_actions(self):
        meta=json.loads((r.CONTENT/'render-meta.json').read_text(encoding='utf-8'))
        for ed in ('master','short'):
            scenes=json.loads((r.CONTENT/f'{ed}.script.json').read_text(encoding='utf-8'))['scenes']
            self.assertEqual([s['id'] for s in scenes],[s['id'] for s in meta[ed]])
            for item in meta[ed]:
                self.assertIn(item['id'],r.RECIPES)
                self.assertGreaterEqual(len({o['object'].casefold() for o in item['objectMap']}),2)
                self.assertTrue(all(o['action'].strip() for o in item['objectMap']))

    def test_subtitles_preserve_words_and_stay_two_lines(self):
        for ed in ('master','master-vertical','short'):
            source='master' if ed=='master-vertical' else ed
            doc=json.loads((r.CONTENT/f'{source}.audit.json').read_text(encoding='utf-8'))
            size=30 if ed=='master' else 36;maxw=(1030 if ed=='master' else 610)-48
            f=r.font(r.BOLD,size)
            for item in doc['items']:
                pages=r.caption_pages(item['text'],f,maxw)
                self.assertEqual(' '.join(' '.join(pages).split()),' '.join(item['text'].split()))
                for page in pages:
                    self.assertLessEqual(len(page.split('\n')),2)
                    self.assertTrue(all(f.getlength(line)<=maxw for line in page.split('\n')))

    def test_rig_and_story_props_move_over_time(self):
        # Smoke-test pixel differences, not a claim of convincing animation.
        for sid in ('S01','S07','S10','S18','S21','S26','T03','T08'):
            a=r.stage_frame(r.RECIPES[sid][0],sid,0.05,6)
            b=r.stage_frame(r.RECIPES[sid][0],sid,3.5,6)
            with self.subTest(scene=sid):self.assertIsNotNone(ImageChops.difference(a,b).getbbox())

    def test_output_frame_dimensions_and_cue_presence(self):
        scene={'id':'S01'};cue={'text':'Aku mengembalikan tas ini.','start':0,'end':2}
        for ed in ('master','master-vertical','short'):
            frame=r.render_frame(ed,scene,0,2,cue)
            self.assertEqual(frame.size,r.OUT_SIZES[ed])
            self.assertEqual(frame.mode,'RGB')


if __name__=='__main__':unittest.main(verbosity=2)
