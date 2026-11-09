#!/usr/bin/env python3
"""Mechanical private-renderer tests. Not creative or publication approval."""
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from PIL import ImageChops

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('stair_private_renderer',HERE/'render_private.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

class StairRendererTests(unittest.TestCase):
    def test_every_script_scene_has_an_original_recipe(self):
        ids=[]
        for edition in ('master','short'):
            scenes=json.loads((r.CONTENT/f'{edition}.script.json').read_text())['scenes']
            ids.extend(s['id'] for s in scenes)
        self.assertEqual(set(ids),set(r.RECIPES))
        self.assertEqual(len(ids),len(set(ids)))

    def test_all_recipes_render_without_missing_modes(self):
        for sid,(mode,title) in r.RECIPES.items():
            with self.subTest(scene=sid):
                img=r.scene(mode,sid,.7,3.0)
                self.assertEqual(img.size,(1000,800));self.assertTrue(title.strip())

    def test_key_actions_change_pixels_over_time(self):
        for sid in ('S01','S06','S09','T03','T08b'):
            mode,_=r.RECIPES[sid]
            a=r.scene(mode,sid,0,3);b=r.scene(mode,sid,2,3)
            with self.subTest(scene=sid):self.assertIsNotNone(ImageChops.difference(a,b).getbbox())

    def test_dimensions_and_subtitles_for_both_aspects(self):
        scene={'id':'S01'};cue={'text':'Tangga itu masih licin.'}
        for ed,size in r.OUT_SIZES.items():
            self.assertEqual(r.render_frame(ed,scene,0,2,cue).size,size)
        self.assertEqual((r.FPS,r.DRAW_FPS),(24,12))

    def test_caption_pagination_preserves_words(self):
        f=r.font(36)
        for edition in ('master','short'):
            script=json.loads((r.CONTENT/f'{edition}.script.json').read_text())
            for s in script['scenes']:
                pages=r.bag.caption_pages(s['narration'],f,562)
                with self.subTest(edition=edition,scene=s['id']):
                    self.assertEqual(' '.join(' '.join(p.split()) for p in pages),' '.join(s['narration'].split()))
                    self.assertTrue(all(len(p.split('\n'))<=2 for p in pages))

    def make_manifest(self,dir):
        data={'voiceId':'voice-05','scripts':{}}
        for name in ('master','short'):
            script_path=r.CONTENT/f'{name}.script.json';scenes=json.loads(script_path.read_text())['scenes']
            audio=dir/f'{name}.wav';audio.write_bytes(b'fake test wav bytes '+name.encode())
            data['scripts'][name]={'sha256':sha(script_path),'chunks':[{
                'audio':audio.name,'sha256':sha(audio),'sceneIds':[s['id'] for s in scenes],
                'narration':' '.join(s['narration'] for s in scenes)}]}
        return data

    def test_voice_hash_voice_id_and_order_fail_closed(self):
        with tempfile.TemporaryDirectory() as td:
            d=Path(td);m=self.make_manifest(d);r.bag.validate(d,m,['master','short'])
            bad=copy.deepcopy(m);bad['voiceId']='other'
            with self.assertRaises(ValueError):r.bag.validate(d,bad,['master'])
            bad=copy.deepcopy(m);bad['scripts']['master']['chunks'][0]['sceneIds'].reverse()
            with self.assertRaises(ValueError):r.bag.validate(d,bad,['master'])
            bad=copy.deepcopy(m);bad['scripts']['master']['sha256']='0'*64
            with self.assertRaises(ValueError):r.bag.validate(d,bad,['master'])
            (d/'master.wav').write_bytes(b'changed')
            with self.assertRaises(ValueError):r.bag.validate(d,m,['master'])

    def test_path_traversal_and_nonprivate_output_rejected(self):
        with tempfile.TemporaryDirectory() as td:
            d=Path(td);m=self.make_manifest(d);m['scripts']['master']['chunks'][0]['audio']='../outside.wav'
            with self.assertRaises(ValueError):r.bag.validate(d,m,['master'])
        with self.assertRaises(ValueError):r.rough.validate_mode(False,r.ROOT/'.scratch')
        with self.assertRaises(ValueError):r.rough.validate_mode(True,r.ROOT/'not-scratch')

if __name__=='__main__':unittest.main(verbosity=2)
