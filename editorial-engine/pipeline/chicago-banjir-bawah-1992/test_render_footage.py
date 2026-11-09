#!/usr/bin/env python3
"""Offline, private-footage preflight and synthetic FFmpeg integration tests."""
from __future__ import annotations
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from PIL import Image
import render_rough as rough
import render_footage as footage


class PlanTests(unittest.TestCase):
    def setUp(self):
        self.catalog = footage.read_catalog()
        self.plans = footage.read_plan()
        self.scripts = {k: json.loads((rough.CONTENT/f'{k}.script.json').read_text()) for k in ('master','short')}
        self.assets = {shot['asset']: 'irrelevant-for-this-structural-test'
                       for edition in self.plans.values() for shots in edition.values()
                       for shot in shots if 'asset' in shot}

    def test_current_plan_covers_both_stories_and_known_sources(self):
        used = footage.validate_plan(self.scripts,self.plans,self.catalog,self.assets)
        self.assertEqual(used, {'chicago1974','river2014','metrospain2017','metra1992','water2011'})

    def test_missing_scene_or_reordered_scene_fails(self):
        bad=copy.deepcopy(self.plans);bad['master'].pop('S21')
        with self.assertRaises(ValueError):footage.validate_plan(self.scripts,bad,self.catalog,self.assets)
        bad=copy.deepcopy(self.plans);first=bad['short'].pop('T01');bad['short']['T01']=first
        with self.assertRaises(ValueError):footage.validate_plan(self.scripts,bad,self.catalog,self.assets)

    def test_unknown_source_missing_asset_and_bad_weight_fail(self):
        for mutation in ('source','asset','weight','nan','offset'):
            bad=copy.deepcopy(self.plans);shot=bad['master']['S01'][0]
            if mutation=='source':shot['source']='not-an-approved-source'
            if mutation=='asset':shot['asset']='unbound.jpg'
            if mutation=='weight':shot['weight']=.7
            if mutation=='nan':shot['weight']=float('nan')
            if mutation=='offset':shot['in']=-1
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):
                footage.validate_plan(self.scripts,bad,self.catalog,self.assets)

    def test_frame_splits_are_exact(self):
        for n in range(3,500):
            shots=[{'weight':.31},{'weight':.40},{'weight':.29}]
            counts=footage.split_frames(n,shots)
            self.assertEqual(sum(counts),n)
            self.assertTrue(all(x>0 for x in counts))
        with self.assertRaises(ValueError):footage.split_frames(1,[{'weight':.5},{'weight':.5}])

    def test_original_end_guard_and_media_disclosures(self):
        with self.assertRaises(ValueError):
            footage.check_bounds('S01',[{'source':'metrospain2017','in':6.0}],[24],self.catalog)
        self.assertIn('2014',' '.join(footage.disclosure_for('S02',{'source':'river2014'},self.catalog)))
        self.assertIn('BUKAN', ' '.join(footage.disclosure_for('S22',{'source':'chicago1974','in':400},self.catalog)))
        self.assertIn('SKEMA',' '.join(footage.disclosure_for('S13',{'source':'still'},self.catalog)))
        self.assertIn('REKONSTRUKSI',' '.join(footage.disclosure_for('S13',{'source':'still','asset':'05-leak.jpg'},self.catalog)))
        self.assertIn('LOKASI TAK DIKETAHUI',' '.join(footage.disclosure_for('S01',{'source':'hybrid'},self.catalog)))

    def test_diagram_variant_is_bounded_and_not_an_unbound_asset(self):
        bad=copy.deepcopy(self.plans);bad['master']['S28'][0]['diagram']='false-court-document'
        with self.assertRaises(ValueError):footage.validate_plan(self.scripts,bad,self.catalog,self.assets)
        legal=footage.disclosure_for('T07',{'source':'chicago1974','in':225},self.catalog)
        self.assertIn('BUKAN SIDANG', ' '.join(legal))

    def test_incomplete_source_credit_rejected(self):
        data=copy.deepcopy(self.catalog);data['sources']['river2014']['license_url']=''
        with tempfile.TemporaryDirectory(dir=rough.ROOT/'.scratch') as temp:
            p=Path(temp)/'catalog.json';p.write_text(json.dumps(data))
            with self.assertRaises(ValueError):footage.read_catalog(p)

    def test_source_integrity_and_path_guard(self):
        with tempfile.TemporaryDirectory(dir=rough.ROOT/'.scratch') as temp:
            root=Path(temp);(root/'x.webm').write_bytes(b'test-source')
            catalog={'sources':{'x':{'file':'x.webm','sha256':hashlib.sha256(b'test-source').hexdigest()}}}
            self.assertEqual(footage.check_source_files(catalog,root,{'x'})['x'],(root/'x.webm').resolve())
            (root/'x.webm').write_bytes(b'tampered')
            with self.assertRaises(ValueError):footage.check_source_files(catalog,root,{'x'})
            catalog['sources']['x']['file']='../outside.webm'
            with self.assertRaises(ValueError):footage.check_source_files(catalog,root,{'x'})
        with self.assertRaises(ValueError):footage.check_source_files(catalog,rough.ROOT,{'x'})

    def test_private_mode_guard(self):
        with self.assertRaises(ValueError):rough.validate_mode(False,rough.ROOT/'.scratch/test')
        with self.assertRaises(ValueError):rough.validate_mode(True,rough.ROOT/'public-output')

    def test_portrait_subtitles_have_a_lower_margin(self):
        w,h=720,1280
        for text in ('Banjir datang dari bawah.', 'Dua kalimat cukup panjang\nuntuk dua baris terbaca.'):
            layer=rough.subtitle_layer(text,w,h)
            box=layer.getbbox()
            absolute_top=h-layer.height-footage.subtitle_lift(w,h)+box[1]
            absolute_bottom=h-layer.height-footage.subtitle_lift(w,h)+box[3]
            self.assertGreater(absolute_top,int(.70*h))
            self.assertLessEqual(absolute_bottom,int(.83*h))
        self.assertEqual(footage.subtitle_lift(1280,720),0)


class SyntheticRenderTests(unittest.TestCase):
    def test_footage_and_still_render_exact_frames_without_source_audio(self):
        scratch=rough.ROOT/'.scratch';scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            p=Path(temp);w,h=320,180
            source=p/'source.mp4'
            rough.run([rough.FF,'-loglevel','error','-y','-f','lavfi','-i','testsrc2=size=320x180:rate=24:duration=2',
                       '-f','lavfi','-i','sine=frequency=440:sample_rate=44100:duration=2',
                       '-c:v','libx264','-threads','1','-c:a','aac','-shortest',source])
            base=p/'base.png';Image.new('RGB',(w,h),'#735342').save(base)
            head=p/'head.png';Image.new('RGBA',(w,55),(0,0,0,0)).save(head)
            badges=[]
            for i in range(2):
                b=p/f'b{i}.png';Image.new('RGBA',(70,20),(5,25,28,230)).save(b);badges.append(b)
            shots=[{'source':'demo','in':0,'frames':24,'badge':badges[0],'badge_xy':(5,5)},
                   {'source':'still','frames':24,'base':base,'badge':badges[1],'badge_xy':(5,5)}]
            task={'scene':{'id':'S99','start':0.,'end':2.},'w':w,'h':h,'shots':shots,
                  'head':head,'cues':[],'vdir':p,'hostdir':p}
            out=p/'out.mp4';sid,n=footage.render_segment(task,out,{'demo':source})
            self.assertEqual((sid,n),('S99',48))
            info=subprocess.run([rough.FF,'-hide_banner','-i',str(out)],capture_output=True,text=True).stderr
            self.assertIn('Video:',info);self.assertNotIn('Audio:',info)
            md5=subprocess.run([rough.FF,'-loglevel','error','-i',str(out),'-map','0:v','-f','framemd5','-'],capture_output=True,text=True,check=True).stdout
            lines=[x for x in md5.splitlines() if x and not x.startswith('#')]
            self.assertEqual(len(lines),48)
            self.assertNotEqual(lines[0].split(',')[-1].strip(),lines[-1].split(',')[-1].strip())

    def test_hybrid_texture_is_moving_and_has_no_source_audio(self):
        from PIL import ImageChops
        scratch=rough.ROOT/'.scratch';scratch.mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=scratch) as temp:
            p=Path(temp);w,h=320,180;hh=int(h*.39)//2*2
            source=p/'water.mp4'
            rough.run([rough.FF,'-loglevel','error','-y','-f','lavfi','-i','testsrc2=size=320x180:rate=24:duration=2',
                       '-f','lavfi','-i','sine=frequency=440:sample_rate=44100:duration=2',
                       '-c:v','libx264','-threads','1','-c:a','aac','-shortest',source])
            base=p/'base.png';Image.new('RGB',(w,h),'#735342').save(base)
            head=p/'head.png';Image.new('RGBA',(w,55),(0,0,0,0)).save(head)
            badge=p/'badge.png';Image.new('RGBA',(70,20),(5,25,28,230)).save(badge)
            mask=p/'mask.png';Image.new('L',(w,hh),59).save(mask)
            shot={'source':'hybrid','in':0,'frames':48,'base':base,'badge':badge,'badge_xy':(5,5)}
            task={'scene':{'id':'S98','start':0.,'end':2.},'w':w,'h':h,'shots':[shot],
                  'head':head,'cues':[],'vdir':p,'hostdir':p,'water_mask':mask}
            out=p/'out.mp4';footage.render_segment(task,out,{'water2011':source})
            info=subprocess.run([rough.FF,'-hide_banner','-i',str(out)],capture_output=True,text=True).stderr
            self.assertNotIn('Audio:',info)
            stills=[]
            for i,t in enumerate((.2,1.5)):
                frame=p/f'frame{i}.png'
                rough.run([rough.FF,'-loglevel','error','-y','-ss',str(t),'-i',out,'-frames:v','1',frame])
                stills.append(Image.open(frame).convert('RGB').crop((100,140,280,175)))
            self.assertIsNotNone(ImageChops.difference(stills[0],stills[1]).getbbox())


if __name__=='__main__':unittest.main(verbosity=2)
