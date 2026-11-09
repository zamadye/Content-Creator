#!/usr/bin/env python3
"""Technical QA and decoded frame sampling; not an editorial release gate."""
import argparse
from io import BytesIO
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageChops, ImageDraw

HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('tas_renderer_qa',HERE/'render_private.py')
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)


def digest(path,method='sha256'):
    h=hashlib.new(method)
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()


def probe(ffprobe, path):
    p=subprocess.run([str(ffprobe),'-v','error','-show_streams','-show_format','-of','json',str(path)],capture_output=True,text=True,check=True)
    return json.loads(p.stdout)


def frame(path,time):
    p=subprocess.run([r.rough.FF,'-v','error','-ss',f'{time:.3f}','-i',str(path),'-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'],capture_output=True,check=True)
    return Image.open(BytesIO(p.stdout)).convert('RGB')


def sample_sheet(path, timeline, edition, dest):
    imgs=[]
    for scene in timeline['scenes']:
        t=scene['start']+(scene['end']-scene['start'])*.42
        im=frame(path,t); im.thumbnail((320,180) if edition=='master' else (180,320))
        imgs.append((scene['id'],im.copy()))
    cols=4;cw=330 if edition=='master' else 190;ch=210 if edition=='master' else 350
    sheet=Image.new('RGB',(cols*cw,math.ceil(len(imgs)/cols)*ch),'white');d=ImageDraw.Draw(sheet);f=r.font(r.BOLD,17)
    for i,(sid,im) in enumerate(imgs):
        x=i%cols*cw;y=i//cols*ch;sheet.paste(im,(x,y+25));d.text((x+4,y+2),sid,font=f,fill=r.INK)
    sheet.save(dest,quality=90)


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out-dir',type=Path,required=True);ap.add_argument('--work-dir',type=Path,required=True);ap.add_argument('--ffprobe',type=Path,required=True)
    a=ap.parse_args()
    r.rough.validate_mode(True,a.out_dir);r.rough.validate_mode(True,a.work_dir)
    results={'status':'TESTED — technical checks only','interpretation':'No creative, audience, rights, disclosure, full listening or release approval.', 'outputs':{}}
    for ed in ('master','master-vertical','short'):
        path=a.out_dir/f'{ed}-DRAF-PRIVAT.mp4'; tl=json.loads((a.work_dir/'timing'/f'{ed}-timeline.json').read_text(encoding='utf-8'))
        data=probe(a.ffprobe,path); streams=data['streams'];video=[x for x in streams if x['codec_type']=='video'];audio=[x for x in streams if x['codec_type']=='audio']
        if len(video)!=1 or len(audio)!=1:raise ValueError(f'{ed}: expected exactly one video and one mixed audio stream')
        v=video[0];au=audio[0];w,h=r.OUT_SIZES[ed];duration=float(data['format']['duration'])
        if (v['width'],v['height'])!=(w,h) or v['codec_name']!='h264' or au['codec_name']!='aac':raise ValueError(f'{ed}: unexpected codec/dimensions')
        if v['r_frame_rate']!='24/1' or abs(duration-tl['duration'])>.20:raise ValueError(f'{ed}: unexpected fps/duration')
        proc=subprocess.run([r.rough.FF,'-v','error','-xerror','-threads','2','-i',str(path),'-map','0:v:0','-map','0:a:0','-f','null','-'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
        if proc.returncode:raise RuntimeError(f'{ed}: full decode failed: {proc.stderr[-2000:]}')
        first=frame(path,0);first.save(a.out_dir/f'{ed}-decoded-frame0.png')
        sample_sheet(path,tl,ed,a.out_dir/f'{ed}-decoded-contact.jpg')
        # Check motion inside representative scene by comparing encoded frames.
        candidate=next(s for s in tl['scenes'] if s['id'] in ('S10','T04'))
        start=candidate['start'];dur=candidate['end']-start
        f1=frame(path,start+dur*.24);f2=frame(path,start+dur*.70)
        if not ImageChops.difference(f1,f2).getbbox():raise ValueError(f'{ed}: sampled motion frames are identical')
        first_cut=math.ceil(tl['scenes'][0]['end']*r.FPS)/r.FPS
        results['outputs'][ed]={'file':path.name,'sha256':digest(path),'md5':digest(path,'md5'),
             'sizeBytes':path.stat().st_size,'durationSeconds':duration,'narrationDurationSeconds':tl['duration'],
             'dimensions':[w,h],'videoCodec':v['codec_name'],'fps':v['r_frame_rate'],'audioCodec':au['codec_name'],
             'audioStreams':len(audio),'fullDecode':'PASS','sceneMidpointsSampled':len(tl['scenes']),
             'sampledMotionDifference':'PASS (not quality)','openingCutSeconds':round(first_cut,3),
             'openingCutTarget':'PASS by frame count' if 1<=first_cut<=3 else 'NEEDS REVIEW',
             'subtitleTiming':'NEEDS HUMAN LISTENING — silence estimate only'}
        print(ed,json.dumps(results['outputs'][ed],ensure_ascii=False),flush=True)
    path=a.out_dir/'technical-qa.json';path.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Technical-only QA saved to',path)

if __name__=='__main__':main()
