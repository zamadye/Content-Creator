#!/usr/bin/env python3
"""Full-decode, streams, subtitle coverage and decoded samples; never a release gate."""
import argparse
from io import BytesIO
import hashlib
import importlib.util
import json
import math
from pathlib import Path
import re
import subprocess
from PIL import Image,ImageChops,ImageDraw

HERE=Path(__file__).resolve().parent
sp=importlib.util.spec_from_file_location('stair_renderer_qa',HERE/'render_private.py')
r=importlib.util.module_from_spec(sp);sp.loader.exec_module(r)

def digest(path,method='sha256'):
    h=hashlib.new(method)
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
    return h.hexdigest()

def probe(ffprobe,path):
    p=subprocess.run([str(ffprobe),'-v','error','-show_streams','-show_format','-of','json',str(path)],capture_output=True,text=True,check=True)
    return json.loads(p.stdout)

def frame(path,t):
    p=subprocess.run([r.rough.FF,'-v','error','-ss',f'{t:.5f}','-i',str(path),'-frames:v','1','-f','image2pipe','-vcodec','png','pipe:1'],capture_output=True,check=True)
    return Image.open(BytesIO(p.stdout)).convert('RGB')

def sheet(path,timeline,edition,dest):
    frames=[]
    for entry in timeline['scenes']:
        t=entry['start']+(entry['end']-entry['start'])*.42
        im=frame(path,t);im.thumbnail((320,180) if edition=='master' else (180,320))
        frames.append((entry['id'],im))
    cols=4;cw=330 if edition=='master' else 190;ch=210 if edition=='master' else 350
    out=Image.new('RGB',(cols*cw,math.ceil(len(frames)/cols)*ch),'white');d=ImageDraw.Draw(out)
    for i,(sid,im) in enumerate(frames):
        x=(i%cols)*cw;y=(i//cols)*ch;out.paste(im,(x,y+25));d.text((x+4,y+2),sid,font=r.font(17),fill=r.INK)
    out.save(dest,quality=90)

def selected_sheet(path,timeline,dest):
    """Eight named examples from decoded portrait master; not full playback."""
    ids=['S01','S06','S12d','S21a','S21c','S25','S35','S39']
    out=Image.new('RGB',(760,700),'white');d=ImageDraw.Draw(out)
    for i,sid in enumerate(ids):
        s=next(v for v in timeline['scenes'] if v['id']==sid)
        t=s['start']+(s['end']-s['start'])*.42
        im=frame(path,t);im.thumbnail((180,320))
        x=(i%4)*190;y=(i//4)*350
        out.paste(im,(x,y+25));d.text((x+4,y+2),sid,font=r.font(17),fill=r.INK)
    out.save(dest,quality=92)

def check_subtitles(edition,timeline,cues):
    source='master' if edition=='master-vertical' else edition
    script=json.loads((r.CONTENT/f'{source}.script.json').read_text())['scenes']
    if [s['id'] for s in script] != [s['id'] for s in timeline['scenes']]:raise ValueError(f'{edition}: timeline IDs mismatch')
    last=0
    for cue in cues:
        if not (cue['start']>=last-1e-4 and cue['end']>cue['start'] and cue['end']<=timeline['duration']+.01):raise ValueError(f'{edition}: cue ordering/range')
        if len(cue['text'].split('\n'))>2:raise ValueError(f'{edition}: too many subtitle lines')
        last=cue['end']
    norm=lambda s:re.sub(r'\s+',' ',s).strip()
    for s in script:
        actual=norm(' '.join(c['text'] for c in cues if c['sceneId']==s['id']))
        if actual!=norm(s['narration']):raise ValueError(f'{edition}: missing or altered subtitle words for {s["id"]}')
    return {'textCoverage':'PASS (script words, not speech recognition)', 'cueCount':len(cues),
            'shortestCueSeconds':round(min(c['end']-c['start'] for c in cues),3),
            'estimatedTiming':'NEEDS HUMAN LISTENING; silence-weight heuristic, not forced alignment'}

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out-dir',type=Path,required=True);ap.add_argument('--work-dir',type=Path,required=True);ap.add_argument('--ffprobe',type=Path,required=True);a=ap.parse_args()
    r.rough.validate_mode(True,a.out_dir);r.rough.validate_mode(True,a.work_dir)
    results={'status':'TESTED — technical checks only','limits':'No full human playback, intelligibility, object/shot effectiveness, rights, disclosure or release approval.',
             'drawingRate':'12 drawings/second, held in 24 fps output; not 24 unique drawings','outputs':{}}
    for ed in ('master','master-vertical','short'):
        p=a.out_dir/f'{ed}-DRAF-PRIVAT.mp4';tl=json.loads((a.work_dir/'timing'/f'{ed}-timeline.json').read_text());cues=json.loads((a.work_dir/'timing'/f'{ed}-cues.json').read_text())
        data=probe(a.ffprobe,p);vs=[x for x in data['streams'] if x['codec_type']=='video'];au=[x for x in data['streams'] if x['codec_type']=='audio']
        if len(vs)!=1 or len(au)!=1:raise ValueError(f'{ed}: expected exactly one video and one mixed audio stream')
        v=vs[0];auds=au[0];w,h=r.OUT_SIZES[ed];dur=float(data['format']['duration'])
        if (v['width'],v['height'])!=(w,h) or v['codec_name']!='h264' or auds['codec_name']!='aac':raise ValueError(f'{ed}: unexpected streams')
        if v['r_frame_rate']!='24/1' or abs(dur-tl['duration'])>.20:raise ValueError(f'{ed}: fps/duration unexpected')
        ret=subprocess.run([r.rough.FF,'-v','error','-xerror','-threads','2','-i',str(p),'-map','0:v:0','-map','0:a:0','-f','null','-'],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
        if ret.returncode:raise RuntimeError(f'{ed}: full decode failed: {ret.stderr[-2000:]}')
        frame(p,0).save(a.out_dir/f'{ed}-decoded-frame0.png')
        sheet(p,tl,ed,a.out_dir/f'{ed}-decoded-contact.jpg')
        if ed=='master-vertical':selected_sheet(p,tl,a.out_dir/'selected-decoded-frames.jpg')
        s=next(x for x in tl['scenes'] if x['id']==('S06' if ed!='short' else 'T03'))
        f1=frame(p,s['start']+(s['end']-s['start'])*.2);f2=frame(p,s['start']+(s['end']-s['start'])*.8)
        crop=(390,16,1270,520) if ed=='master' else (0,193,720,790)
        if not ImageChops.difference(f1.crop(crop),f2.crop(crop)).getbbox():raise ValueError(f'{ed}: two sampled action frames identical')
        firstcut=math.ceil(tl['scenes'][0]['end']*r.DRAW_FPS)/r.DRAW_FPS
        cut_before=frame(p,max(0,firstcut-1/r.FPS));cut_after=frame(p,firstcut+.001)
        if not ImageChops.difference(cut_before,cut_after).getbbox():raise ValueError(f'{ed}: opening cut not seen at expected time')
        result={'file':p.name,'sha256':digest(p),'md5':digest(p,'md5'),'sizeBytes':p.stat().st_size,
                'durationSeconds':dur,'narrationSeconds':tl['duration'],'dimensions':[w,h],
                'videoCodec':v['codec_name'],'containerFps':v['r_frame_rate'],'audioCodec':auds['codec_name'],'audioStreams':len(au),
                'fullDecode':'PASS','sceneMidpointsDecoded':len(tl['scenes']),'sampledMotion':'PASS (difference, not quality)',
                'openingCutSeconds':round(firstcut,3),'openingCutTarget':'PASS' if 1<=firstcut<=3 else 'NEEDS REVIEW',
                'subtitles':check_subtitles(ed,tl,cues),
                'fbReelsDuration':'within previously documented 3–90s range; re-check platform' if 3<=dur<=90 else 'outside previously documented 3–90s range'}
        results['outputs'][ed]=result;print(ed,json.dumps(result,ensure_ascii=False),flush=True)
    dest=a.out_dir/'technical-qa.json';dest.write_text(json.dumps(results,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print('Saved',dest,flush=True)

if __name__=='__main__':main()
