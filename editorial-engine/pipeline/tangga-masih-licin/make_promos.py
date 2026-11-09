#!/usr/bin/env python3
"""Create three independent private key-art compositions from a bound original art file.

No reference footage or frames from video are used. This composes a separately
AI-generated illustration, supplied as --art from the private checkpoint; the
illustration and results stay out of Git. Fonts are the bundled Archivo family.
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps

ROOT=Path(__file__).resolve().parents[3]
SCRATCH=(ROOT/'.scratch').resolve()
FONT=ROOT/'editorial-engine/assets/fonts/archivo-latin-700-normal.ttf'

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def ft(n):return ImageFont.truetype(str(FONT),n)
def badge(d,x,y):
    d.rounded_rectangle((x,y,x+190,y+40),radius=8,fill='#f6ead2')
    d.text((x+12,y+10),'CERITA FIKTIF',font=ft(17),fill='#163a3e')

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--art',type=Path,required=True);ap.add_argument('--out-dir',type=Path,required=True);a=ap.parse_args()
    if not a.art.resolve().is_relative_to(SCRATCH) or not a.out_dir.resolve().is_relative_to(SCRATCH):ap.error('Art and private outputs must be in .scratch')
    a.out_dir.mkdir(parents=True,exist_ok=True)
    art=Image.open(a.art).convert('RGB');files=[]
    # Wide layout: supplied independent artwork has safe negative space left.
    im=ImageOps.fit(art,(1280,720),method=Image.Resampling.LANCZOS,centering=(.5,.5)).convert('RGBA')
    overlay=Image.new('RGBA',im.size);od=ImageDraw.Draw(overlay)
    for x in range(540):od.line((x,0,x,720),fill=(6,28,31,int(100*(1-x/540))))
    im=Image.alpha_composite(im,overlay);d=ImageDraw.Draw(im);badge(d,50,43)
    for i,line in enumerate(('NIAT BAIK,','MALAH','DISERANG')):d.text((49,151+i*78),line,font=ft(65),fill='#fff2dc',stroke_width=1,stroke_fill='#173b3e')
    d.text((52,405),'Tangganya tetap licin.',font=ft(28),fill='#f2af83')
    d.text((52,654),'DRAF PRIVAT',font=ft(17),fill='#d1dfd5')
    p=a.out_dir/'thumbnail-master.png';im.convert('RGB').save(p,optimize=True);files.append(p)
    # Two tall layouts: their artwork has been reframed rather than using a video frame.
    for name,w,h in [('thumbnail-short',720,1280),('poster-4x5',864,1080)]:
        im=Image.new('RGB',(w,h),'#112f32');d=ImageDraw.Draw(im)
        d.rectangle((0,0,12,h),fill='#c96c58');badge(d,50,43)
        fs=54 if w==720 else 57;tx=51
        d.text((tx,132),'NIAT BAIK,',font=ft(fs),fill='#fff0d8')
        d.text((tx,132+int(fs*1.2)),'MALAH DISERANG',font=ft(fs),fill='#fff0d8')
        d.text((tx,132+int(fs*2.4)+12),'Tangganya tetap licin.',font=ft(25),fill='#f0ab80')
        top=340 if h==1280 else 330;bottom=h-100
        panel=ImageOps.fit(art,(w,bottom-top),method=Image.Resampling.LANCZOS,centering=(.76,.5))
        im.paste(panel,(0,top));d=ImageDraw.Draw(im)
        d.text((50,h-62),'DRAF PRIVAT',font=ft(17),fill='#d4e1d7')
        p=a.out_dir/(name+'.png');im.save(p,optimize=True);files.append(p)
    meta={'status':'PRIVATE DRAFT; no rights or release approval','artSha256':sha(a.art),'files':{p.name:sha(p) for p in files},'artNote':'Independent synthetic illustration, not a video frame; label and text typeset separately.'}
    (a.out_dir/'promo-manifest.json').write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
    print('Created private promotional drafts:',', '.join(p.name for p in files))

if __name__=='__main__':main()
