#!/usr/bin/env python3
"""PRIVATE ROUGH ONLY: build two watermarked animatics from bound private inputs.

This is deliberately not a final or publication renderer. It verifies text-only
mechanical gates, input hashes and an explicit private destination. Timing uses
silence-informed heuristics, not forced alignment. See README.md.
"""
from __future__ import annotations
import argparse
import concurrent.futures
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import textwrap
import wave

try:
    import numpy as np
    import imageio_ffmpeg
    from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
except ImportError as exc:
    raise SystemExit(f'Missing private rough dependency: {exc}. See README.md.')

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / 'editorial-engine/content/chicago-banjir-bawah-1992'
FONTS = ROOT / 'editorial-engine/assets/fonts'
SANS = str(FONTS / 'archivo-latin-600-normal.ttf')
SANS_BOLD = str(FONTS / 'archivo-latin-700-normal.ttf')
DISPLAY = str(FONTS / 'permanent-marker-latin-400-normal.ttf')
FF = imageio_ffmpeg.get_ffmpeg_exe()
FPS = 24
SR = 44100
INK = '#102c31'
DARK = '#0a252a'
TEAL = '#256c70'
CREAM = '#f4ead4'
GOLD = '#f1be67'
RUST = '#be704d'
MINT = '#a9d5c8'

def shasum(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

def run(cmd, *, capture=False):
    return subprocess.run([str(c) for c in cmd], check=True,
                          stdout=subprocess.PIPE if capture else subprocess.DEVNULL,
                          stderr=subprocess.PIPE if capture else subprocess.DEVNULL)

def validate_mode(private_rough: bool, output: Path) -> None:
    if not private_rough:
        raise ValueError('Only --private-rough is supported; final rendering is not implemented.')
    scratch = (ROOT / '.scratch').resolve()
    if not output.resolve().is_relative_to(scratch):
        raise ValueError('Rough output must be under the ignored .scratch directory.')

def validate_inputs(manifest: dict, voice_dir: Path, asset_dir: Path) -> tuple[dict, dict]:
    if manifest.get('format') != 1 or manifest.get('voiceId') != 'voice-05':
        raise ValueError('Unsupported or wrong-voice rough manifest.')
    scripts = {}
    for name in ('master', 'short'):
        p = CONTENT / f'{name}.script.json'
        doc = json.loads(p.read_text(encoding='utf-8'))
        data = manifest['scripts'][name]
        if shasum(p) != data['sha256']:
            raise ValueError(f'{name} script hash changed after voice generation; regenerate/rebind voice.')
        by_id = {s['id']: s['narration'] for s in doc['scenes']}
        seen = []
        for chunk in data['chunks']:
            ids = chunk['sceneIds']
            if not ids or any(i not in by_id for i in ids):
                raise ValueError(f'{name}: invalid audio scene IDs.')
            if ' '.join(by_id[i] for i in ids) != chunk['narration']:
                raise ValueError(f'{name}: audio text does not match exact script.')
            audio = (voice_dir / chunk['audio']).resolve()
            if not audio.is_relative_to(voice_dir.resolve()) or not audio.is_file() or shasum(audio) != chunk['sha256']:
                raise ValueError(f'{name}: missing, moved or modified voice file {chunk["audio"]}.')
            seen.extend(ids)
        if seen != [s['id'] for s in doc['scenes']]:
            raise ValueError(f'{name}: audio chunks do not cover scenes exactly in order.')
        scripts[name] = doc
    for filename, h in manifest['assets'].items():
        asset = (asset_dir / filename).resolve()
        if not asset.is_relative_to(asset_dir.resolve()) or not asset.is_file() or shasum(asset) != h:
            raise ValueError(f'Missing, moved or modified image asset: {filename}')
    meta = json.loads((CONTENT / 'render-meta.json').read_text(encoding='utf-8'))
    for name in ('master', 'short'):
        if [s['id'] for s in meta[name]] != [s['id'] for s in scripts[name]['scenes']]:
            raise ValueError(f'{name}: scene metadata mismatches script.')
        if any(s['asset'] not in manifest['assets'] for s in meta[name]):
            raise ValueError(f'{name}: unbound media referenced.')
        for scene in meta[name]:
            objects=scene.get('objectMap')
            if not isinstance(objects,list) or len(objects)<2:
                raise ValueError(f"{name} {scene['id']}: at least two visual objects required.")
            names=[]
            for obj in objects:
                if not isinstance(obj,dict) or not isinstance(obj.get('object'),str) or not obj['object'].strip() or not isinstance(obj.get('action'),str) or not obj['action'].strip():
                    raise ValueError(f"{name} {scene['id']}: incomplete object/action.")
                names.append(obj['object'].strip().casefold())
            if len(set(names))<2:
                raise ValueError(f"{name} {scene['id']}: distinct visual objects required.")
    return scripts, meta

def mechanical_gates() -> None:
    gate = ROOT / 'editorial-engine/pipeline/story-engine/story_gate.py'
    audit = ROOT / 'editorial-engine/pipeline/script-review/audit.py'
    cmds = [
        [sys.executable, gate, '--stage','outline','--brief',CONTENT/'brief.json',
         '--script',CONTENT/'master.script.json','--review',CONTENT/'master.audit.json'],
        *[[sys.executable,audit,'--script',CONTENT/f'{n}.script.json','--review',CONTENT/f'{n}.audit.json'] for n in ('master','short')],
    ]
    for cmd in cmds:
        p = subprocess.run([str(x) for x in cmd], capture_output=True, text=True)
        if p.returncode:
            raise ValueError('Mechanical preflight failed: ' + p.stdout + p.stderr)
    print('Mechanical outline + two coverage checks PASS (not human review).', flush=True)

def decode_wav(source: Path, target: Path) -> tuple[np.ndarray, int]:
    run([FF,'-loglevel','error','-y','-i',source,'-ac','1','-ar',str(SR),'-c:a','pcm_s16le',target])
    with wave.open(str(target),'rb') as w:
        if w.getnchannels()!=1 or w.getframerate()!=SR or w.getsampwidth()!=2:
            raise ValueError('Unexpected decoded voice format.')
        samples = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').copy()
    return samples, SR

def silence_candidates(samples: np.ndarray, rate: int) -> list[tuple[float,float]]:
    # 20ms RMS windows; this finds likely pauses only, not spoken-word alignment.
    win = rate // 50
    count = len(samples)//win
    if not count:
        return []
    arr = samples[:count*win].astype(np.float32).reshape(count, win)
    rms = np.sqrt(np.mean(arr*arr,axis=1))
    quiet = rms < 580
    changes = np.diff(np.r_[False,quiet,False].astype(np.int8))
    starts, ends = np.where(changes==1)[0], np.where(changes==-1)[0]
    result=[]
    for a,b in zip(starts,ends):
        duration=(b-a)*win/rate
        midpoint=(a+b)*win/(2*rate)
        if duration >= .14 and .25 < midpoint < len(samples)/rate-.20:
            result.append((float(midpoint),float(duration)))
    return result

def allocate_sentences(texts: list[str], duration: float, pauses: list[tuple[float,float]]) -> list[tuple[float,float]]:
    """Estimate sentence borders using text weights and quiet intervals.

    The result is intentionally reported as estimated; no transcription or human
    listening is performed. It always returns ordered bounded spans.
    """
    if not texts or duration <= 0:
        raise ValueError('Empty text or duration.')
    if len(texts)==1:
        return [(0.,duration)]
    weights = [max(1, len(t) + 8*t.count(',') + 7*t.count(';') + 4*t.count(':')) for t in texts]
    total = sum(weights)
    expected=[duration*w/total for w in weights]
    candidates=[(0.,0.)] + sorted((t,l) for t,l in pauses if .20<t<duration-.15) + [(duration,0.)]
    # Add proportional fallback candidates in case a sentence has no clear silence.
    cum=0.
    for v in expected[:-1]:
        cum+=v
        candidates.append((cum,0.))
    candidates=sorted(set(candidates),key=lambda v:v[0])
    n,m=len(texts),len(candidates)
    inf=float('inf')
    dp=[[inf]*m for _ in range(n+1)]
    parent=[[-1]*m for _ in range(n+1)]
    start=min(range(m),key=lambda j:abs(candidates[j][0]))
    end=min(range(m),key=lambda j:abs(candidates[j][0]-duration))
    dp[0][start]=0.
    for i in range(1,n+1):
        js = [end] if i==n else range(1,m-1)
        ideal_cum=sum(expected[:i])
        for j in js:
            t,pause = candidates[j]
            if i<n and not (.30 < t < duration-.30): continue
            if abs(t-ideal_cum) > max(9., duration*.28) and i<n: continue
            for k in range(j):
                if not math.isfinite(dp[i-1][k]): continue
                elapsed=t-candidates[k][0]
                if elapsed < .45: continue
                relative=(elapsed-expected[i-1])/max(1.0,expected[i-1])
                # Prefer real natural pauses, but do not let pause length dominate.
                score=dp[i-1][k]+relative*relative+.035*((t-ideal_cum)/max(2.,duration/n))**2
                if i<n: score-=min(pause,1.)*.28
                if score<dp[i][j]: dp[i][j]=score;parent[i][j]=k
    if parent[n][end] == -1:
        borders=[0.]; cumulative=0.
        for e in expected[:-1]: cumulative+=e; borders.append(cumulative)
        borders.append(duration)
    else:
        borders=[duration]; j=end
        for i in range(n,0,-1):
            j=parent[i][j]; borders.append(candidates[j][0])
        borders=list(reversed(borders))
    return [(max(0.,borders[i]), min(duration,borders[i+1])) for i in range(n)]

def make_timeline(name, script, manifest, voice_dir, working):
    audits=json.loads((CONTENT/f'{name}.audit.json').read_text(encoding='utf-8'))['items']
    line_map={}
    for a in audits: line_map.setdefault(a['sceneId'],[]).append(a['text'])
    all_scenes=[]; all_samples=[]; offset_samples=0
    for i,chunk in enumerate(manifest['scripts'][name]['chunks']):
        samples,rate=decode_wav(voice_dir/chunk['audio'], working/f'{name}-chunk-{i}.wav')
        all_samples.append(samples)
        lines=[(sid,t) for sid in chunk['sceneIds'] for t in line_map[sid]]
        spans=allocate_sentences([t for _,t in lines],len(samples)/rate,silence_candidates(samples,rate))
        chunk_offset=offset_samples/rate
        byscene={}
        for (sid,text),(start,end) in zip(lines,spans):
            byscene.setdefault(sid,[]).append(dict(text=text,start=chunk_offset+start,end=chunk_offset+end))
        for sid in chunk['sceneIds']:
            l=byscene[sid]
            all_scenes.append(dict(id=sid,start=l[0]['start'],end=l[-1]['end'],sentences=l))
        offset_samples+=len(samples)
    wavepath=working/f'{name}-narration.wav'
    with wave.open(str(wavepath),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR)
        for arr in all_samples:w.writeframes(arr.astype('<i2').tobytes())
    return all_scenes,wavepath,offset_samples/SR

def wrap_pixels(text: str, font: ImageFont.FreeTypeFont, maxw: int) -> list[str]:
    words=text.split(); lines=[]; current=''
    for word in words:
        trial=(current+' '+word).strip()
        if current and font.getlength(trial)>maxw:
            lines.append(current);current=word
        else: current=trial
    if current: lines.append(current)
    return lines

def display_text(text: str) -> str:
    # The narrator speaks years as words; compact digits make the entire date
    # readable together and avoid splitting e.g. "sembilan puluh / delapan".
    years = {'seribu sembilan ratus sembilan puluh satu':'1991',
             'seribu sembilan ratus sembilan puluh dua':'1992',
             'seribu sembilan ratus sembilan puluh delapan':'1998',
             'tiga belas Maret':'13 Maret', 'dua April':'2 April'}
    for spoken,digits in years.items():
        text=re.sub(r'\b'+re.escape(spoken)+r'\b',digits,text,flags=re.IGNORECASE)
    return text

def sentence_pages(text, font, maxw):
    # Choose the fewest 2-line pages, then balance text across those pages and
    # prefer clause boundaries. Avoids isolated final words such as "berlaku".
    # This is still an estimate, not transcription or forced alignment.
    words=display_text(text).split()
    if not words:return [text]
    n=len(words);counts=[10**6]*(n+1);counts[n]=0;valid={}
    for i in range(n-1,-1,-1):
        valid[i]=[]
        for j in range(i+1,n+1):
            if len(wrap_pixels(' '.join(words[i:j]),font,maxw))>2:break
            valid[i].append(j)
            counts[i]=min(counts[i],1+counts[j])
    pages_needed=counts[0]
    target=sum(len(x) for x in words)/pages_needed
    starts={'yang','dan','tapi','tetapi','namun','sebelum','setelah','sambil',
            'ketika','sehingga','sementara','karena','untuk','lalu','dengan'}
    costs=[float('inf')]*(n+1);chosen=[None]*(n+1);costs[n]=0
    for i in range(n-1,-1,-1):
        for j in valid[i]:
            if counts[i]!=1+counts[j]:continue
            length=sum(len(x) for x in words[i:j]);balance=((length-target)/max(target,1))**2*2
            singleton=1.2 if j-i==1 and n>1 else 0
            punctuation=bool(re.search(r'[,;:]$',words[j-1])) if j<n else False
            connective=j<n and words[j].strip('.,;:?!').casefold() in starts
            dangling={'dan','yang','ke','di','dari','pada','untuk','tentang','sebelum','setelah',
                      'sehingga','sementara','karena','dengan','membatalkan','menemukan',
                      'merekam','meminta','melaporkan','mengambil','mendengar','melihat'}
            lastword=words[j-1].strip('.,;:?!').casefold()
            boundary=(-.24 if punctuation else 0) + (-.10 if connective else 0)
            if j<n and not punctuation and lastword in dangling:boundary+=1.0
            cost=balance+singleton+boundary+costs[j]
            if cost<costs[i]:costs[i]=cost;chosen[i]=j
    pages=[];i=0
    while i<n:
        j=chosen[i]
        if j is None:raise ValueError('Could not create bounded subtitle pages.')
        pages.append('\n'.join(wrap_pixels(' '.join(words[i:j]),font,maxw)));i=j
    return pages

def subtitle_weight(text: str) -> int:
    # Dates are compact on screen but the narration speaks their longer form.
    expanded=text.replace('1991','seribu sembilan ratus sembilan puluh satu')
    expanded=expanded.replace('1992','seribu sembilan ratus sembilan puluh dua')
    expanded=expanded.replace('1998','seribu sembilan ratus sembilan puluh delapan')
    expanded=expanded.replace('13 Maret','tiga belas Maret').replace('2 April','dua April')
    return max(1,len(expanded.replace('\n',' ')))

def srt_clock(t):
    ms=max(0,round(t*1000)); h=ms//3600000;m=(ms//60000)%60;s=(ms//1000)%60;return f'{h:02}:{m:02}:{s:02},{ms%1000:03}'

def make_cues(timeline,w,h):
    vertical=h>w
    fs=36 if vertical else 40
    font=ImageFont.truetype(SANS_BOLD,fs)
    result=[]
    for s in timeline:
        for sent in s['sentences']:
            pages=sentence_pages(sent['text'],font,int(w*.84))
            weights=[subtitle_weight(x) for x in pages]; total=sum(weights)
            t=sent['start']; d=sent['end']-t
            for idx,(page,weight) in enumerate(zip(pages,weights)):
                end=sent['end'] if idx==len(pages)-1 else t+d*weight/total
                result.append(dict(sceneId=s['id'],text=page,start=t,end=end))
                t=end
    return result

def write_srt(cues,path):
    blocks=[]
    for i,c in enumerate(cues,1): blocks.append(f"{i}\n{srt_clock(c['start'])} --> {srt_clock(c['end'])}\n{c['text']}\n")
    path.write_text('\n'.join(blocks),encoding='utf-8')

def font(size,bold=False,display=False):
    return ImageFont.truetype(DISPLAY if display else SANS_BOLD if bold else SANS,max(10,int(size)))

def draw_centered(draw,xy,text,f,fill,spacing=4):
    x,y=xy
    draw.multiline_text((x,y),text,font=f,fill=fill,anchor='ma',align='center',spacing=spacing,stroke_width=0)

def gradient_overlay(base, top=True, bottom=True):
    w,h=base.size
    mask=Image.new('L',(1,h));m=mask.load()
    for y in range(h):
        a=0
        if top and y<h*.34:a=max(a,round(145*(1-y/(h*.34))))
        if bottom and y>h*.68:a=max(a,round(170*(y-h*.68)/(h*.32)))
        m[0,y]=a
    shade=Image.new('RGBA',(w,h),INK)
    shade.putalpha(mask.resize((w,h)))
    return Image.alpha_composite(base.convert('RGBA'),shade)

def make_cutaway(w,h,mode):
    """Conceptual diagram; not a map or scaled hydraulic simulation."""
    im=Image.new('RGB',(w,h),DARK);d=ImageDraw.Draw(im)
    def R(x0,y0,x1,y1,fill,outline=None,width=1,r=0):
        d.rounded_rectangle((int(x0*w),int(y0*h),int(x1*w),int(y1*h)),radius=int(r*w),fill=fill,outline=outline,width=width)
    horizon=.44
    d.rectangle((0,int(horizon*h),w,h),fill='#715e4c')
    d.rectangle((0,int(.35*h),int(.48*w),int(.44*h)),fill='#2d8587')
    for i in range(4):
        xx=int((.52+i*.115)*w); y=int((.23+(.035 if i%2 else 0))*h);bw=int(.085*w)
        d.rectangle((xx,y,xx+bw,int(horizon*h)),fill='#466461')
        for x in range(xx+int(.012*w),xx+bw-int(.008*w),max(5,int(.026*w))):
            for yy in range(y+int(.018*h),int(.42*h),max(8,int(.034*h))):
                d.rectangle((x,yy,x+max(2,int(.008*w)),yy+max(3,int(.013*h))),fill='#d8c7a3')
    # River bank and utility line, stylized not accurate geography.
    d.line((int(.03*w),int(.44*h),int(.97*w),int(.44*h)),fill='#e7c896',width=max(2,int(w*.004)))
    y0,y1=.64,.76
    R(.08,y0,.93,y1, '#173941',outline='#d4c09b',width=max(3,int(w*.004)),r=.025)
    R(.75,.44,.85,.76,'#294850',outline='#d4c09b',width=max(2,int(w*.003)),r=.012)
    # restore interior in tunnel to clearly show its connection to basement
    d.rectangle((int(.755*w),int(.64*h),int(.845*w),int(.75*h)),fill='#173941')
    d.line((int(.12*w),int(.715*h),int(.9*w),int(.715*h)),fill='#9aa79b',width=max(2,int(w*.003)))
    f=font(w*.018,bold=True)
    d.text((int(.07*w),int(.355*h)),'SUNGAI',font=f,fill=CREAM)
    d.text((int(.105*w),int(.675*h)),'TEROWONGAN',font=f,fill=CREAM)
    d.text((int(.72*w),int(.47*h)),'BASEMENT',font=f,fill=CREAM)
    if mode in ('leak','flood','pump'):
        x=int(.32*w)
        d.line((x,int(.44*h),x-int(.01*w),int(.64*h)),fill=RUST,width=max(4,int(w*.006)))
        for k in range(4):
            yy=int((.46+k*.045)*h);d.ellipse((x-3,yy-3,x+3,yy+3),fill=GOLD)
    if mode in ('flood','pump'):
        R(.095,.715,.91,.752,'#319292',r=.01)
        d.line((int(.15*w),int(.73*h),int(.88*w),int(.73*h)),fill=MINT,width=max(3,int(w*.004)))
        d.polygon([(int(.88*w),int(.71*h)),(int(.92*w),int(.73*h)),(int(.88*w),int(.75*h))],fill=MINT)
    if mode=='pump':
        for x in (.26,.44):R(x,.62,x+.025,.77,GOLD,r=.003)
        R(.65,.54,.73,.64,RUST,r=.008)
        d.line((int(.69*w),int(.54*h),int(.69*w),int(.47*h),int(.92*w),int(.47*h)),fill=CREAM,width=max(4,int(w*.005)))
    return gradient_overlay(im)

def make_map(w,h,phase):
    im=Image.new('RGB',(w,h),'#173d40');d=ImageDraw.Draw(im)
    # A conceptual route rather than a real map.
    d.rounded_rectangle((int(.07*w),int(.27*h),int(.93*w),int(.82*h)),radius=int(.025*w),fill='#e7dfc9')
    c='#4f7b75'; width=max(5,int(.012*w))
    pts=[(.13,.67),(.29,.67),(.37,.57),(.57,.57),(.67,.46),(.87,.46)]
    d.line([(int(x*w),int(y*h)) for x,y in pts],fill=c,width=width,joint='curve')
    d.line([(int(.20*w),int(.36*h)),(int(.45*w),int(.52*h)),(int(.84*w),int(.68*h))],fill='#77a7a5',width=max(6,int(.018*w)))
    x,y=(.32,.67) if phase=='early' else (.65,.50)
    rr=max(8,int(.025*w));d.ellipse((int(x*w)-rr,int(y*h)-rr,int(x*w)+rr,int(y*h)+rr),fill=RUST,outline=CREAM,width=3)
    d.text((int(.12*w),int(.31*h)),'SKEMA LOKASI',font=font(w*.022,bold=True),fill=INK)
    d.text((int(.12*w),int(.75*h)), 'PENCARIAN AWAL' if phase=='early' else 'TITIK DITEMUKAN',font=font(w*.022,bold=True),fill=INK)
    return gradient_overlay(im)

def make_calendar(w,h):
    im=Image.new('RGB',(w,h),'#173d40');d=ImageDraw.Draw(im)
    for x,label in [(.10,'FEBRUARI'),(.56,'MARET')]:
        x0,y0,x1,y1=int(x*w),int(.30*h),int((x+.34)*w),int(.72*h)
        d.rounded_rectangle((x0,y0,x1,y1),radius=int(.02*w),fill=CREAM)
        d.rectangle((x0,y0,x1,y0+int(.07*h)),fill=RUST)
        d.text((x0+int(.02*w),y0+int(.014*h)),label,font=font(w*.018,bold=True),fill=CREAM)
        for row in range(3):
            for col in range(4):
                xx=x0+int((.05+col*.065)*w);yy=y0+int((.14+row*.09)*h)
                d.ellipse((xx,yy,xx+int(.018*w),yy+int(.018*w)),fill='#9bb2a2')
    d.line((int(.46*w),int(.50*h),int(.54*w),int(.50*h)),fill=GOLD,width=max(4,int(.006*w)))
    d.polygon([(int(.54*w),int(.48*h)),(int(.57*w),int(.50*h)),(int(.54*w),int(.52*h))],fill=GOLD)
    return gradient_overlay(im)

def make_legal(w,h,phase):
    im=Image.new('RGB',(w,h),'#193b3e');d=ImageDraw.Draw(im)
    top=.31 if h>w else .29
    labels=['PEMECATAN\nDIBATALKAN']
    if phase=='both':labels+=['DUA TEMUAN\nTETAP ADA']
    for i,txt in enumerate(labels):
        if h>w:
            x0,x1=.13,.87;y0=top+i*.21;y1=y0+.17
        else:
            x0=.10+i*.42;x1=x0+.36;y0=top;y1=y0+.38
        d.rounded_rectangle((int(x0*w),int(y0*h),int(x1*w),int(y1*h)),radius=int(.018*w),fill=CREAM,outline=GOLD,width=max(3,int(.004*w)))
        f=font(w*(.037 if h>w else .026),bold=True)
        draw_centered(d,((x0+x1)*w/2,(y0+y1)*h/2-f.size),txt,f,INK,spacing=int(.012*h))
    return gradient_overlay(im)

def make_chain(w,h):
    im=Image.new('RGB',(w,h),'#174247');d=ImageDraw.Draw(im)
    if h>w:
        boxes=[(.17,.28,.83,.41),(.17,.46,.83,.59),(.17,.64,.83,.77)]
    else: boxes=[(.06,.38,.32,.67),(.37,.38,.63,.67),(.68,.38,.94,.67)]
    for (x0,y0,x1,y1),label in zip(boxes,['KAMERA','PETA','MEMO']):
        d.rounded_rectangle((int(x0*w),int(y0*h),int(x1*w),int(y1*h)),radius=int(.018*w),fill=CREAM,outline=GOLD,width=max(3,int(w*.004)))
        f=font(w*(.040 if h>w else .025),bold=True);draw_centered(d,((x0+x1)*w/2,(y0+y1)*h/2-f.size/2),label,f,INK)
    return gradient_overlay(im)

DIAGRAM = {'S08':('cut','normal'),'S11':('map','early'),'S12':('cal',''),
           'S13':('map','found'),'S15':('cut','leak'),'S19':('cut','flood'),
           'S24':('cut','pump'),'S27':('legal','first'),'S28':('legal','both'),
           'S30':('chain',''),'T02':('cut','flood'),'T04':('map','found'),
           'T07':('legal','both'),'T08':('chain','')}
HEADLINES={'S01':'BANJIR DARI\nBAWAH','S02':'CHICAGO  •  1992','S06':'KOTA DI BAWAH KOTA','S09':'1991  •  PROYEK JEMBATAN',
           'S10':'JANUARI 1992','S13':'13 MARET  •  TITIK DITEMUKAN','S16':'2 APRIL  •  PERINGATAN',
           'S19':'13 APRIL  •  DINDING JEBOL','S24':'SEKAT DAN POMPA','S27':'1998  •  BANDING',
           'S29':'1999  •  KEMBALI BEKERJA','S32':'ikuti knot theory',
           'T01':'BANJIR DARI\nBAWAH','T02':'CHICAGO  •  1992','T05':'PERINGATAN SUDAH ADA',
           'T07':'PUTUSAN  •  1998','T09':'ikuti knot theory'}

FOCAL={'01-basement.jpg':(.37,.50),'02-fish.jpg':(.65,.54),'03-old-tunnel.jpg':(.55,.5),
       '04-river-piling.jpg':(.60,.52),'05-leak.jpg':(.51,.52),'06-map.jpg':(.55,.53),
       '07-memo.jpg':(.52,.52),'08-vortex.jpg':(.50,.53),'09-evacuate.jpg':(.53,.55),
       '10-repair.jpg':(.58,.53)}

def make_background(sid,asset_path,w,h):
    if sid in DIAGRAM:
        typ,phase=DIAGRAM[sid]
        if typ=='cut':return make_cutaway(w,h,phase)
        if typ=='map':return make_map(w,h,phase)
        if typ=='cal':return make_calendar(w,h)
        if typ=='legal':return make_legal(w,h,phase)
        if typ=='chain':return make_chain(w,h)
    image=Image.open(asset_path).convert('RGB')
    fit=ImageOps.fit(image,(w,h),method=Image.Resampling.LANCZOS,centering=FOCAL.get(asset_path.name,(.5,.5)))
    return gradient_overlay(fit)

def head_layer(sid,w,h):
    vertical=h>w;hh=int(h*.31)
    im=Image.new('RGBA',(w,hh),(0,0,0,0));d=ImageDraw.Draw(im)
    top=20 if vertical else 17
    # One persistent, honest provenance banner; no official seal or fake logo.
    d.rounded_rectangle((int(.035*w),top,int(.965*w),top+int(.045*h)),radius=max(6,int(.008*w)),fill=(7,27,31,220))
    f=font(22 if vertical else 23,bold=True)
    d.text((int(.052*w),top+int(.01*h)), 'KNOT / DUNIA KEBALIK',font=f,fill=CREAM)
    label='REKONSTRUKSI  •  DRAF PRIVAT'
    d.text((int(.948*w)-f.getlength(label),top+int(.01*h)),label,font=f,fill=GOLD)
    title=HEADLINES.get(sid)
    if title:
        base=57 if vertical else (58 if sid=='S01' else 44)
        # Permanent Marker renders lowercase as uppercase; use Archivo for the
        # required lowercase CTA so the screen genuinely reads "ikuti knot theory".
        use_display = sid not in ('S32','T09')
        ff=font(base,bold=not use_display,display=use_display)
        maxwidth=w*.89
        while max(ff.getlength(line) for line in title.split('\n'))>maxwidth and base>25:
            base-=2;ff=font(base,bold=not use_display,display=use_display)
        y=top+int(.072*h)
        for line in title.split('\n'):
            d.text((int(.055*w),y),line,font=ff,fill=CREAM,stroke_width=2,stroke_fill=INK)
            y+=int(base*1.15)
    return im

def subtitle_layer(text,w,h):
    vertical=h>w; zone=int(h*(.19 if vertical else .19))
    im=Image.new('RGBA',(w,zone),(0,0,0,0));d=ImageDraw.Draw(im)
    fs=36 if vertical else 40;f=font(fs,bold=True)
    lines=text.split('\n'); heights=[d.textbbox((0,0),line,font=f)[3] for line in lines]; lh=int(fs*1.3)
    maxwidth=max(f.getlength(line) for line in lines)
    boxw=min(int(.92*w),int(maxwidth+int(.09*w))); boxh=len(lines)*lh+int(.026*h)
    x=(w-boxw)//2;y=zone-boxh-int(.025*h)
    d.rounded_rectangle((x,y,x+boxw,y+boxh),radius=max(8,int(w*.012)),fill=(8,27,29,222))
    for i,line in enumerate(lines):
        d.text((w/2,y+int(.010*h)+i*lh),line,font=f,fill='#fff8e8',anchor='mt',stroke_width=1,stroke_fill='#162f2e')
    return im

def make_sprite(path,which):
    im=Image.new('RGBA',(100,100),(0,0,0,0));d=ImageDraw.Draw(im)
    if which=='dot':
        d.ellipse((22,22,78,78),fill=(139,230,217,75),outline=(232,252,238,190),width=4)
        d.ellipse((39,39,61,61),fill=(242,254,237,255))
    elif which=='arrow':
        d.line((50,10,50,66),fill=(252,199,100,235),width=7)
        d.polygon([(30,55),(50,82),(70,55)],fill=(252,199,100,235))
    elif which=='ring':
        d.ellipse((15,28,85,70),outline=(250,203,112,190),width=6)
    im.save(path)

def make_host_frame(path,idx,size):
    """Small illustrated host inspired by the user's existing Danau rig, not a real person."""
    w,h=size; im=Image.new('RGBA',(w,h),(0,0,0,0));d=ImageDraw.Draw(im)
    def xy(x,y):return (int(x*w),int(y*h))
    # scarf behind face and torso, using the same rust/sage palette as prior rig
    d.polygon([xy(.26,.20),xy(.29,.06),xy(.5,.015),xy(.71,.06),xy(.74,.20),xy(.84,.67),xy(.16,.67)],fill='#8b3f2b')
    d.polygon([xy(.30,.20),xy(.33,.07),xy(.5,.03),xy(.67,.07),xy(.70,.20),xy(.77,.62),xy(.23,.62)],fill='#b85738')
    d.polygon([xy(.32,.50),xy(.68,.50),xy(.76,.87),xy(.24,.87)],fill='#9eae8b')
    d.polygon([xy(.28,.85),xy(.72,.85),xy(.77,.99),xy(.23,.99)],fill='#9c6b42')
    # shoulder, elbows, hands: jointed and animated rather than static cutout
    wave=math.sin(idx*math.tau/24)*.05
    left=[xy(.32,.55),xy(.20,.64-wave),xy(.10,.58-wave)]
    right=[xy(.68,.55),xy(.79,.60+wave),xy(.90,.49+wave)]
    for pts in (left,right):
        d.line(pts,fill='#9eae8b',width=max(4,int(w*.095)),joint='curve')
        x,y=pts[-1];r=int(w*.055);d.ellipse((x-r,y-r,x+r,y+r),fill='#d7a479')
    d.ellipse((int(.33*w),int(.09*h),int(.67*w),int(.45*h)),fill='#d7a479')
    d.arc((int(.32*w),int(.07*h),int(.68*w),int(.25*h)),180,360,fill='#b85738',width=max(4,int(w*.04)))
    blink=idx in (20,21)
    for x in (.43,.57):
        cx,cy=xy(x,.27);rx=max(2,int(w*.025));ry=max(1,int(h*(.003 if blink else .018)))
        d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=INK)
    cx,cy=xy(.50,.37);d.ellipse((cx-int(w*.025),cy-int(h*(.008+.006*abs(math.sin(idx)))),cx+int(w*.025),cy+int(h*(.008+.006*abs(math.sin(idx))))),fill='#8b3f2b')
    im.save(path)

def prepare_visuals(name,timeline,meta,asset_dir,work,w,h,cues):
    vdir=work/f'visual-{name}';vdir.mkdir(parents=True,exist_ok=True)
    hostdir=vdir/'host';hostdir.mkdir(exist_ok=True)
    hostsize=(int(w*.19),int(h*.44)) if w>h else (int(w*.34),int(h*.30))
    for i in range(24):make_host_frame(hostdir/f'host-{i:03}.png',i,hostsize)
    for typ in ('dot','arrow','ring'):make_sprite(vdir/f'{typ}.png',typ)
    m={s['id']:s for s in meta}; scene_cues={}
    for cue in cues:scene_cues.setdefault(cue['sceneId'],[]).append(cue)
    tasks=[]
    for s in timeline:
        sid=s['id']; base=vdir/f'{sid}-base.png';head=vdir/f'{sid}-head.png'
        make_background(sid,asset_dir/m[sid]['asset'],w,h).convert('RGB').save(base,optimize=True)
        head_layer(sid,w,h).save(head)
        cp=[]
        for i,c in enumerate(scene_cues[sid]):
            p=vdir/f'{sid}-subtitle-{i:02}.png'; subtitle_layer(c['text'],w,h).save(p)
            cp.append(dict(path=p,start=max(0,c['start']-s['start']),end=min(s['end']-s['start'],c['end']-s['start'])))
        tasks.append(dict(scene=s,base=base,head=head,cues=cp,vdir=vdir,hostdir=hostdir,w=w,h=h))
    return tasks

def render_segment(task,out_path):
    s=task['scene'];sid=s['id'];w=task['w'];h=task['h']
    first=round(s['start']*FPS);last=round(s['end']*FPS);frames=max(1,last-first)
    # The base drives the clock. All static overlays are *single* frames;
    # overlay repeats the last frame, instead of letting disabled subtitle
    # input loops buffer thousands of unnecessary frames and exhaust RAM.
    args=[FF,'-loglevel','error','-y','-loop','1','-framerate',str(FPS),'-i',task['base'],
          '-i',task['head']]
    inputs=2
    for c in task['cues']:
        args+=['-i',c['path']];inputs+=1
    motion=None
    if sid in ('S01','S03','S04','S05','S09','S10','S14','S17','S18','S20','S21','S23','S26','S29','T01','T03','T05','T06'):
        motion='ring' if sid in ('S03','S04','S05','S18','S21','T03') else 'arrow'
    elif sid in ('S08','S15','S19','S24','T02'):
        motion='dot'
    motion_index=None
    if motion:
        motion_index=inputs;args+=['-i',task['vdir']/f'{motion}.png'];inputs+=1
    host_index=None
    if sid in ('S31','S32','T09'):
        host_index=inputs
        args+=['-stream_loop','-1','-framerate',str(FPS),'-i',task['hostdir']/'host-%03d.png'];inputs+=1
    # Zoom uses the one timebase from scene duration; no second authored timeline.
    zoom=f"[0:v]zoompan=z='min(1.035,1+on*0.00012)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={w}x{h}:fps={FPS},setsar=1[bg]"
    filters=[zoom,'[bg][1:v]overlay=0:0:format=auto:eof_action=repeat:shortest=0[h]'];prev='h'
    if motion_index is not None:
        if motion=='dot': x=f'{int(.10*w)}+mod(t*{max(18,int(w*.05))},{int(.72*w)})';y=f'{int(.67*h)}'
        elif motion=='ring':x=f'{int(.50*w)}+8*sin(t*2)';y=f'{int(.48*h)}+5*sin(t*1.4)'
        else:x=f'{int(.47*w)}';y=f'{int(.43*h)}+14*sin(t*2.4)'
        filters.append(f'[{prev}][{motion_index}:v]overlay=x=\'{x}\':y=\'{y}\':format=auto:eof_action=repeat:shortest=0[m]');prev='m'
    if host_index is not None:
        x=int(.73*w) if w>h else int(.62*w); y=int(.25*h) if w>h else int(.39*h)
        filters.append(f'[{prev}][{host_index}:v]overlay={x}:{y}:format=auto:shortest=1[host]');prev='host'
    for i,c in enumerate(task['cues']):
        out=f'c{i}'
        # place the small subtitle canvas at bottom, active only for this cue.
        filters.append(f"[{prev}][{2+i}:v]overlay=0:H-h:enable='gte(t,{c['start']:.4f})*lt(t,{c['end']:.4f})':format=auto:eof_action=repeat:shortest=0[{out}]")
        prev=out
    filters.append(f'[{prev}]format=yuv420p[v]')
    args+=['-filter_complex_threads','1','-filter_complex',';'.join(filters),'-map','[v]',
           '-frames:v',str(frames),'-r',str(FPS),'-an','-c:v','libx264','-preset','veryfast','-crf','24','-threads','2',out_path]
    result=subprocess.run([str(x) for x in args],stdout=subprocess.DEVNULL,stderr=subprocess.PIPE,text=True)
    if result.returncode:
        detail=result.stderr[-2500:] or '[no FFmpeg diagnostics; process may have been killed]'
        raise RuntimeError(f'{sid} render failed (exit {result.returncode}): {detail}')
    return sid,frames

def synth_score(path,duration):
    """Original quiet tonal underscoring; no noise, rain or third-party recording."""
    chords=[(110,130.81,164.81),(87.31,130.81,174.61),(73.42,110,146.83),(82.41,123.47,164.81)]
    notes=[220,261.63,329.63,392,329.63,261.63,246.94,196]
    total=int(math.ceil(duration*SR))
    with wave.open(str(path),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(SR)
        for begin in range(0,total,SR):
            n=min(SR,total-begin);t=(np.arange(n,dtype=np.float64)+begin)/SR
            chord=chords[int(begin/SR/8)%len(chords)]
            pad=np.zeros(n,dtype=np.float64)
            for hz in chord: pad+=np.sin(2*np.pi*hz*t)*.0065
            pad*=.62+.20*np.sin(2*np.pi*.07*t)
            beat=np.floor(t/2).astype(int); hz=np.array(notes)[beat%len(notes)]
            phase=t%2; env=np.exp(-phase*3.0)*(.4+.6*(phase>.01))
            pluck=.012*env*(np.sin(2*np.pi*hz*t)+.25*np.sin(2*np.pi*2*hz*t))
            fade=np.minimum(1,np.minimum(t/1.2,np.maximum(0,(duration-t)/2)))
            samples=np.clip((pad+pluck)*fade,-.2,.2)
            f.writeframes((samples*32767).astype('<i2').tobytes())

def mux_video(name,tasks,narration,work,out,duration):
    segdir=work/f'segments-{name}';segdir.mkdir(exist_ok=True)
    jobs=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for i,t in enumerate(tasks):
            path=segdir/f'{i:03}.mp4';jobs.append((path,pool.submit(render_segment,t,path)))
        try:
            # Observe failures as soon as they complete, not only in scene order.
            for completed,fut in enumerate(concurrent.futures.as_completed([x[1] for x in jobs]),1):
                sid,frames=fut.result();print(f'  {name}: {sid} ({completed}/{len(jobs)}, {frames} frames)',flush=True)
        except Exception:
            for _,fut in jobs: fut.cancel()
            raise
    listing=work/f'{name}-concat.txt'
    listing.write_text(''.join("file '"+str(p.resolve()).replace("'","'\\''")+"'\n" for p,_ in jobs),encoding='utf-8')
    silent=work/f'{name}-silent.mp4'
    run([FF,'-loglevel','error','-y','-f','concat','-safe','0','-i',listing,'-c','copy',silent])
    music=work/f'{name}-score.wav';synth_score(music,duration)
    outpath=out/f'{name.upper()}_ANIMATIC_DRAF_PRIVAT.mp4'
    run([FF,'-loglevel','error','-y','-i',silent,'-i',narration,'-i',music,
         '-filter_complex','[1:a]volume=1.0[v];[2:a]volume=1.0[m];[v][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.96[a]',
         '-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','160k','-ac','2',
         '-movflags','+faststart','-shortest',outpath])
    # Standalone single continuous narration for editing, still draft, stays private.
    run([FF,'-loglevel','error','-y','-i',narration,'-c:a','libmp3lame','-b:a','160k',out/f'{name.upper()}_NARASI_DRAF_voice-05.mp3'])
    return outpath

def make_cover(path,asset,w,h,vertical=False,poster=False):
    hero=Image.open(asset).convert('RGB')
    fit=ImageOps.fit(hero,(w,h),method=Image.Resampling.LANCZOS,centering=(.37,.50))
    im=gradient_overlay(fit,top=True,bottom=True);d=ImageDraw.Draw(im)
    # Standalone composition, intentionally distinct from a captured video frame.
    top=int(.055*h); left=int(.06*w)
    d.rounded_rectangle((left,top,int(.94*w),top+int(.045*h)),radius=10,fill=(9,34,38,220))
    small=font(w*.026,bold=True);d.text((left+int(.015*w),top+int(.006*h)),'KNOT / DUNIA KEBALIK',font=small,fill=CREAM)
    y=int(.13*h);size=int(w*(.085 if vertical or poster else .064));f=font(size,display=True)
    for line,col in [('BANJIR',CREAM),('DARI BAWAH?',GOLD)]:
        while f.getlength(line)>w*.88:
            size-=2;f=font(size,display=True)
        d.text((left,y),line,font=f,fill=col,stroke_width=max(1,w//500),stroke_fill=INK);y+=int(size*1.22)
    if poster or vertical:
        sub='PERINGATAN SUDAH ADA'
        ff=font(w*.035,bold=True)
        d.rounded_rectangle((left,y+int(.02*h),min(int(.94*w),left+int(ff.getlength(sub))+int(.05*w)),y+int(.02*h)+int(.06*h)),radius=8,fill=CREAM)
        d.text((left+int(.018*w),y+int(.026*h)),sub,font=ff,fill=INK)
    else:
        ff=font(w*.025,bold=True);d.text((left,y+int(.03*h)),'CHICAGO  •  1992',font=ff,fill=CREAM)
    label='REKONSTRUKSI ILUSTRATIF  •  DRAF PRIVAT'
    f2=font(w*.017,bold=True); tw=int(f2.getlength(label)); bx=left;by=int(.91*h)
    d.rounded_rectangle((bx,by,bx+tw+int(.03*w),by+int(.045*h)),radius=7,fill=(7,29,32,225))
    d.text((bx+int(.015*w),by+int(.005*h)),label,font=f2,fill=CREAM)
    im.convert('RGB').save(path)

def main(argv=None):
    p=argparse.ArgumentParser(description='Build only private review animatics; final mode deliberately unsupported.')
    p.add_argument('--private-rough',action='store_true',help='Required; output contains permanent draft/provenance labels.')
    p.add_argument('--asset-dir',type=Path,required=True)
    p.add_argument('--voice-dir',type=Path,required=True)
    p.add_argument('--manifest',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--only',choices=('master','short','both'),default='both')
    args=p.parse_args(argv)
    validate_mode(args.private_rough,args.out)
    mechanical_gates()
    manifest=json.loads(args.manifest.read_text(encoding='utf-8'))
    scripts,meta=validate_inputs(manifest,args.voice_dir,args.asset_dir)
    args.out.mkdir(parents=True,exist_ok=True);work=args.out/'work';work.mkdir(exist_ok=True)
    names=('master','short') if args.only=='both' else (args.only,)
    summary={}
    for name in names:
        print(f'Building {name} private animatic...',flush=True)
        timeline,narration,duration=make_timeline(name,scripts[name],manifest,args.voice_dir,work)
        w,h=(1280,720) if name=='master' else (720,1280)
        cues=make_cues(timeline,w,h)
        write_srt(cues,args.out/f'{name.upper()}_SUBTITLE_PERKIRAAN.srt')
        tasks=prepare_visuals(name,timeline,meta[name],args.asset_dir,work,w,h,cues)
        video=mux_video(name,tasks,narration,work,args.out,duration)
        make_cover(args.out/f'{name.upper()}_THUMBNAIL_DRAF.png',args.asset_dir/'01-basement.jpg',1080 if name=='short' else 1280,1920 if name=='short' else 720,vertical=name=='short')
        summary[name]=dict(durationAudio=duration,frames=round(duration*FPS),fps=FPS,width=w,height=h,video=video.name,
                           cutFrame=round(timeline[0]['end']*FPS),visualCutSeconds=round(timeline[0]['end']*FPS)/FPS,
                           timing='Subtitle and scene boundaries are silence-informed estimates, not human verified.',
                           scenes=timeline,cues=cues)
    make_cover(args.out/'POSTER_4x5_DRAF.png',args.asset_dir/'01-basement.jpg',1080,1350,poster=True)
    (args.out/'TIMELINE_PERKIRAAN.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('PRIVATE ROUGH complete. Human, legal/disclosure, audience and final QA remain NOT TESTED.',flush=True)

if __name__=='__main__':
    try: main()
    except (ValueError,KeyError,FileNotFoundError,subprocess.CalledProcessError,RuntimeError) as e:
        print(f'ERROR: {e}',file=sys.stderr);raise SystemExit(1)
