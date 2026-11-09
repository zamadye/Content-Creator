#!/usr/bin/env python3
"""Original, non-release animatic for 'Tas yang Kukembalikan'.

This is a PRIVATE rough renderer: estimated subtitle/scene timing, original vector
characters and props, and one synthetic voice track. It deliberately cannot grant
prevoice/release approval. It never reads or embeds the supplied reference video.
See README.md for prerequisites, input hashes, limits and commands.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import subprocess
import sys
import textwrap

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / 'editorial-engine/content/tas-yang-kukembalikan'
CHICAGO = ROOT / 'editorial-engine/pipeline/chicago-banjir-bawah-1992/render_rough.py'
_spec = importlib.util.spec_from_file_location('private_timing', CHICAGO)
rough = importlib.util.module_from_spec(_spec)
assert _spec and _spec.loader
_spec.loader.exec_module(rough)
rough.CONTENT = CONTENT
FPS = 24
OUT_SIZES = {'master': (1280, 720), 'master-vertical': (720, 1280), 'short': (720, 1280)}
FONT_DIR = ROOT / 'editorial-engine/assets/fonts'
DISPLAY = FONT_DIR / 'archivo-latin-700-normal.ttf'
REGULAR = FONT_DIR / 'archivo-latin-400-normal.ttf'
BOLD = FONT_DIR / 'archivo-latin-700-normal.ttf'
SKIN_MAYA = '#b9775d'
SKIN_NISA = '#ce9072'
INK = '#183c3c'
TEAL = '#347a72'
TEAL_DARK = '#195d59'
CORAL = '#b55f4c'
MUSTARD = '#e8bd65'
CREAM = '#f7efdc'

# Each scene is paired to a concrete setting and dramatic purpose. Scene text is
# deliberately not derived from the reference and no source video is required.
RECIPES = {
 'S01': ('return','TAS INI\nKUKEMBALIKAN'),
 'S02': ('intro','INI CERITA\nMAYA & NISA'),
 'S03': ('plan','SATU IDE\nUNTUK PERJALANAN'),
 'S04': ('budget','MODALNYA\nTERBATAS'),
 'S05': ('plan','SKETSA TERUS\nBERTAMBAH'),
 'S06': ('cut','HAMPIR\nDIPOTONG'),
 'S07': ('sew','SATU SAMPEL\nDIPINJAMKAN'),
 'S08': ('transit','DICOBA\nDI HALTE'),
 'S09': ('transit','TANGAN SATU\nMEMEGANG PAYUNG'),
 'S10': ('transit','KARTUNYA\nSULIT DIRAIH'),
 'S11': ('note','SARAN MAYA:\nTAMBAH KANTONG'),
 'S12': ('many','TIGA KANTONG\nLAGI?'),
 'S13': ('many','PEMINJAM LAIN\nPUNYA USUL'),
 'S14': ('many','SEMUA USUL\nSEKALIGUS?'),
 'S15': ('many','DUA PENDAPAT\nBUKAN PASAR'),
 'S16': ('observe','NISA BERTANYA:\nKAPAN SULITNYA?'),
 'S17': ('observe','KURSI BERUBAH\nJADI HALTE'),
 'S18': ('observe','MAYA\nMEMPERAGAKAN'),
 'S19': ('insight','ADA YANG\nTAK TERTULIS'),
 'S20': ('insight','BUKAN JUMLAH,\nTAPI AKSES?'),
 'S21': ('pocket','SATU DUGAAN,\nSATU PERUBAHAN'),
 'S22': ('test','KARTUNYA MUDAH.\nRITSLETINGNYA?'),
 'S23': ('pocket','PERBAIKI,\nCOBA LAGI'),
 'S24': ('test','MINTA ORANG\nLAIN MENCOBA'),
 'S25': ('budget','HITUNG ONGKOS,\nCARI MASUKAN'),
 'S26': ('purchase','MAYA MEMBELI\nSATU TAS'),
 'S27': ('insight','PERTANYAANNYA\nBERUBAH'),
 'S28': ('budget','RENCANA +\nUJI KECIL'),
 'S29': ('question','KAPAN IDE SIAP\nDICOBA?'),
 'S30': ('end','ikuti knot theory'),
 'T01': ('return','TAS INI\nKUKEMBALIKAN'),
 'T02': ('intro','INI CERITA\nMAYA & NISA'),
 'T03': ('sew','SATU SAMPEL\nDIPINJAMKAN'),
 'T04': ('transit','KARTUNYA\nSULIT DIRAIH'),
 'T05': ('note','SARAN MAYA:\nTAMBAH KANTONG'),
 'T06': ('observe','NISA MEMINTA\nMAYA MEMPERAGAKAN'),
 'T07': ('insight','MUNGKIN YANG\nDIBUTUHKAN AKSES'),
 'T08': ('test','COBA, UBAH,\nCOBA LAGI'),
 'T09': ('purchase','SATU PEMBELIAN,\nBUKAN JAMINAN'),
 'T10': ('question','KAPAN IDE SIAP\nDICOBA?'),
 'T11': ('end','ikuti knot theory'),
}


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def validate(voice_dir: Path, manifest: dict, editions: list[str]) -> dict:
    if manifest.get('voiceId') != 'voice-05':
        raise ValueError('This draft requires the selected voice-05')
    if not (DISPLAY.is_file() and REGULAR.is_file() and BOLD.is_file()):
        raise FileNotFoundError('Bundled Archivo fonts missing')
    validated = {}
    for edition in editions:
        path = CONTENT / f'{edition}.script.json'
        spec = manifest['scripts'][edition]
        if sha(path) != spec['sha256']:
            raise ValueError(f'{edition}: script changed since voice generation')
        scenes = json.loads(path.read_text(encoding='utf-8'))['scenes']
        scene_map = {s['id']: s for s in scenes}
        if len(scene_map) != len(scenes) or set(scene_map) - set(RECIPES):
            raise ValueError(f'{edition}: missing or duplicate visual recipes')
        meta = json.loads((CONTENT / 'render-meta.json').read_text(encoding='utf-8'))[edition]
        if [x['id'] for x in meta] != [x['id'] for x in scenes]:
            raise ValueError(f'{edition}: object maps do not match scene order')
        for entry in meta:
            objects = entry.get('objectMap', [])
            names = [str(o.get('object', '')).strip().casefold() for o in objects]
            if len(set(names) - {''}) < 2 or any(not str(o.get('action', '')).strip() for o in objects):
                raise ValueError(f'{edition} {entry["id"]}: two distinct object/actions required')
        ids = []
        chunks = []
        for chunk in spec['chunks']:
            f = Path(chunk['audio'])
            if f.name != str(f) or f.suffix.lower() != '.wav':
                raise ValueError('Voice paths must be local WAV basenames')
            path = (voice_dir / f).resolve()
            if not path.is_relative_to(voice_dir.resolve()) or not path.is_file() or sha(path) != chunk['sha256']:
                raise ValueError(f'Audio missing or hash mismatch: {path}')
            group = chunk['sceneIds']
            expected = ' '.join(scene_map[i]['narration'] for i in group)
            if expected != chunk['narration']:
                raise ValueError(f'{edition}: source text does not match manifest')
            ids += group
            chunks.append({'file': str(path), 'sceneIds': group})
        if ids != [s['id'] for s in scenes]:
            raise ValueError(f'{edition}: chunk ordering/coverage invalid')
        validated[edition] = chunks
    return validated


def font(path: Path, size: int):
    return ImageFont.truetype(str(path), max(9, int(size)))


def box(draw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(tuple(int(v) for v in xy), radius=int(radius), fill=fill, outline=outline, width=int(width))


def lerp(a, b, t): return a + (b-a)*t

def clamp(v, lo=0, hi=1): return max(lo, min(hi, v))

def smooth(t):
    t = clamp(t)
    return t*t*(3-2*t)


def shadow(d, x, y, rx, ry, color='#b8a996'):
    d.ellipse((x-rx, y-ry, x+rx, y+ry), fill=color)


def draw_bag(d, x, y, s=1.0, pocket=False, tiny_zip=False, open_bag=False):
    """Teal sample tote with handles; x/y are the body centre."""
    def xy(a,b): return (x+a*s, y+b*s)
    w=max(2,int(7*s))
    # handles are behind bag
    d.arc((x-61*s,y-186*s,x+61*s,y-24*s), 190, 350, fill=INK, width=max(2,int(12*s)))
    d.arc((x-48*s,y-179*s,x+48*s,y-30*s), 190, 350, fill='#88bcb0', width=max(2,int(4*s)))
    d.polygon([xy(-99,-100),xy(99,-100),xy(108,100),xy(-108,100)],fill=TEAL_DARK,outline=INK,width=w)
    d.polygon([xy(-87,-90),xy(85,-90),xy(95,90),xy(-96,90)],fill=TEAL)
    # central seams and stitched lower edge
    for a in range(-78,82,20):
        d.line((x+a*s,y+79*s,x+(a+9)*s,y+79*s),fill='#a8cabc',width=max(1,int(2*s)))
    if open_bag:
        d.line((x-83*s,y-95*s,x+83*s,y-95*s), fill='#d6c196', width=max(3,int(13*s)))
    else:
        d.line((x-84*s,y-95*s,x+84*s,y-95*s), fill='#e5bd69', width=max(2,int(5*s)))
    pull=6 if tiny_zip else 12
    box(d,(x+54*s,y-95*s,x+(54+pull)*s,y-75*s),3*s,'#edc86f',INK,max(1,int(2*s)))
    if pocket:
        box(d,(x-55*s,y-19*s,x+56*s,y+64*s),10*s,'#296f68',INK,max(2,int(4*s)))
        d.line((x-47*s,y-10*s,x+48*s,y-10*s),fill='#e4c476',width=max(2,int(4*s)))
        d.line((x+31*s,y-10*s,x+31*s,y+6*s),fill='#f7e3a7',width=max(2,int(4*s)))
    # signature little patch, neutral, not logo
    box(d,(x-18*s,y+31*s,x+18*s,y+49*s),3*s,'#d8ba84')


def draw_card(d, x, y, s=1, angle=0):
    # Card floats/reaches; no real transit logo or number.
    box(d,(x-57*s,y-35*s,x+57*s,y+35*s),9*s,'#f6d376',INK,max(2,int(3*s)))
    d.line((x-45*s,y-9*s,x+45*s,y-9*s),fill='#ac7545',width=max(2,int(6*s)))
    d.ellipse((x-39*s,y+6*s,x-28*s,y+17*s),fill=TEAL)
    d.line((x-14*s,y+12*s,x+35*s,y+12*s),fill='#ca9e55',width=max(1,int(3*s)))


def draw_umbrella(d, x, y, s=1, phase=0):
    # x,y = top centre; canopy and crook move as one.
    wig=math.sin(phase)*4*s
    d.pieslice((x-120*s+wig,y,x+120*s+wig,y+146*s),180,360,fill=CORAL,outline=INK,width=max(2,int(5*s)))
    d.line((x+wig,y+12*s,x+wig,y+188*s),fill=INK,width=max(3,int(6*s)))
    d.arc((x-25*s+wig,y+160*s,x+25*s+wig,y+205*s),0,180,fill=INK,width=max(3,int(6*s)))
    for a in (-75,-30,30,75): d.line((x+wig,y+8*s,x+a*s+wig,y+72*s),fill='#f3a585',width=max(1,int(2*s)))


def draw_sheet(d, x, y, s=1, variant='lines', label=''):
    box(d,(x-88*s,y-112*s,x+88*s,y+112*s),6*s,'#fff9e9','#b8a990',max(1,int(3*s)))
    if variant == 'sketch':
        d.arc((x-35*s,y-70*s,x+35*s,y+2*s),190,350,fill=TEAL_DARK,width=max(2,int(4*s)))
        d.polygon([(x-48*s,y-26*s),(x+48*s,y-26*s),(x+55*s,y+70*s),(x-55*s,y+70*s)],outline=TEAL_DARK,width=max(2,int(4*s)))
        d.line((x-30*s,y+18*s,x+28*s,y+18*s),fill='#b55f4c',width=max(2,int(3*s)))
    else:
        for i in range(4):
            d.line((x-62*s,y+(-60+i*34)*s,x+(55-i*7)*s,y+(-60+i*34)*s),fill='#a99b82',width=max(1,int(4*s)))
        if variant == 'check':
            for i in range(3):
                d.rectangle((x-69*s,y+(-68+i*34)*s,x-58*s,y+(-57+i*34)*s),outline=CORAL,width=max(1,int(2*s)))
    if label:
        ft=font(BOLD,18*s)
        d.text((x-61*s,y+73*s),label,font=ft,fill=INK)


def draw_calculator(d, x, y, s=1):
    box(d,(x-64*s,y-94*s,x+64*s,y+94*s),12*s,'#d9ba79',INK,max(2,int(4*s)))
    box(d,(x-44*s,y-74*s,x+44*s,y-38*s),4*s,'#dde5c6')
    for row in range(3):
        for col in range(3):
            box(d,(x+(-40+col*30)*s,y+(-23+row*31)*s,x+(-21+col*30)*s,y+(-4+row*31)*s),3*s,INK)


def draw_scissors(d, x, y, s=1, phase=0):
    spread=(9+6*math.sin(phase))*s
    d.ellipse((x-47*s,y-30*s,x-12*s,y+5*s),outline=CORAL,width=max(2,int(8*s)))
    d.ellipse((x-47*s,y+10*s,x-12*s,y+45*s),outline=CORAL,width=max(2,int(8*s)))
    d.line((x-14*s,y-12*s,x+76*s,y+spread),fill=INK,width=max(2,int(7*s)))
    d.line((x-14*s,y+27*s,x+76*s,y-spread),fill=INK,width=max(2,int(7*s)))
    d.ellipse((x-2*s,y+3*s,x+10*s,y+15*s),fill='#e5bd69')


def draw_machine(d, x, y, s=1, phase=0):
    # stylized standalone sewing machine with changing needle position.
    box(d,(x-144*s,y+48*s,x+144*s,y+82*s),9*s,INK)
    box(d,(x-128*s,y-83*s,x+128*s,y+54*s),17*s,'#efe1bd',INK,max(2,int(6*s)))
    box(d,(x+6*s,y-6*s,x+97*s,y+55*s),4*s,'#d9c9ad')
    d.line((x+88*s,y-6*s,x+88*s,y+(41+8*math.sin(phase))*s),fill=INK,width=max(2,int(4*s)))
    d.ellipse((x-102*s,y-58*s,x-65*s,y-21*s),outline=TEAL,width=max(2,int(5*s)))
    d.line((x+38*s,y-84*s,x+38*s,y-111*s),fill=INK,width=max(2,int(5*s)))
    box(d,(x+24*s,y-112*s,x+51*s,y-93*s),3*s,CORAL)
    d.line((x-48*s,y+60*s,x+96*s,y+60*s),fill=TEAL,width=max(2,int(8*s)))


def draw_chair(d,x,y,s=1):
    box(d,(x-73*s,y-140*s,x+73*s,y-22*s),13*s,'#c98f64',INK,max(2,int(5*s)))
    box(d,(x-80*s,y-30*s,x+80*s,y+2*s),7*s,'#b87b52',INK,max(2,int(5*s)))
    d.line((x-60*s,y,x-68*s,y+126*s),fill=INK,width=max(3,int(7*s)))
    d.line((x+60*s,y,x+70*s,y+126*s),fill=INK,width=max(3,int(7*s)))


def draw_person(d, who, x, ground, scale=1, phase=0, gesture='idle', emotion='neutral', target_l=None, target_r=None):
    """Same colored rig in every scene; animated arms, eyes and mouth."""
    s=scale; p=phase
    skin = {'maya': SKIN_MAYA, 'nisa': SKIN_NISA, 'tester': '#a6775f'}[who]
    shirt = {'maya': CORAL, 'nisa': '#5a8a76', 'tester': '#72879a'}[who]
    hair = {'maya': '#292f31', 'nisa': '#473b38', 'tester': '#34323c'}[who]
    # legs and rounded shoes
    d.line((x-30*s,ground-127*s,x-43*s,ground-17*s),fill='#334b50',width=max(3,int(29*s)))
    d.line((x+31*s,ground-127*s,x+45*s,ground-17*s),fill='#334b50',width=max(3,int(29*s)))
    d.ellipse((x-66*s,ground-27*s,x-19*s,ground+4*s),fill=INK)
    d.ellipse((x+20*s,ground-27*s,x+67*s,ground+4*s),fill=INK)
    # torso and clothing details
    box(d,(x-68*s,ground-286*s,x+68*s,ground-112*s),31*s,shirt,INK,max(2,int(4*s)))
    if who == 'nisa':
        d.polygon([(x-41*s,ground-265*s),(x+41*s,ground-265*s),(x+56*s,ground-135*s),(x-56*s,ground-135*s)],fill=MUSTARD,outline=INK,width=max(2,int(3*s)))
        box(d,(x-25*s,ground-204*s,x+25*s,ground-174*s),4*s,'#d29f4e')
        d.line((x-29*s,ground-284*s,x-20*s,ground-260*s),fill=MUSTARD,width=max(2,int(7*s)))
        d.line((x+29*s,ground-284*s,x+20*s,ground-260*s),fill=MUSTARD,width=max(2,int(7*s)))
    else:
        d.line((x,ground-270*s,x,ground-130*s),fill='#e5a889',width=max(2,int(5*s)))
        box(d,(x-52*s,ground-199*s,x-18*s,ground-163*s),4*s,'#cb745d')
    # arm paths lead to the object in the scene.
    wob=math.sin(p)*8*s
    if gesture in ('point','hold','write'):
        a1=(x-62*s,ground-245*s); b1=(x-104*s,ground-202*s+wob); c1=(x-130*s,ground-190*s+wob)
        a2=(x+62*s,ground-245*s); b2=(x+108*s,ground-205*s-wob); c2=(x+157*s,ground-226*s-wob)
    else:
        a1=(x-62*s,ground-245*s); b1=(x-91*s,ground-184*s+wob); c1=(x-91*s,ground-136*s+wob)
        a2=(x+62*s,ground-245*s); b2=(x+91*s,ground-184*s-wob); c2=(x+91*s,ground-136*s-wob)
    # Optional targets aim the hands at props; cap the reach to keep limbs proportionate.
    def limited(point,shoulder):
        dx=point[0]-shoulder[0];dy=point[1]-shoulder[1];distance=math.hypot(dx,dy)
        factor=min(1.0,150*s/max(distance,.001))
        return (shoulder[0]+dx*factor,shoulder[1]+dy*factor)
    if target_l is not None:
        c1=limited(target_l,a1); b1=((a1[0]+c1[0])/2-12*s,(a1[1]+c1[1])/2+10*s)
    if target_r is not None:
        c2=limited(target_r,a2); b2=((a2[0]+c2[0])/2+12*s,(a2[1]+c2[1])/2+10*s)
    for a,b,c in ((a1,b1,c1),(a2,b2,c2)):
        d.line([a,b,c],fill=INK,width=max(3,int(26*s)),joint='curve')
        d.line([a,b,c],fill=shirt,width=max(3,int(20*s)),joint='curve')
        d.ellipse((c[0]-12*s,c[1]-12*s,c[0]+12*s,c[1]+12*s),fill=skin,outline=INK,width=max(1,int(2*s)))
    box(d,(x-18*s,ground-316*s,x+18*s,ground-272*s),8*s,skin)
    # hair silhouette behind the face, different profiles
    if who in ('maya','tester'):
        d.ellipse((x-72*s,ground-431*s,x+72*s,ground-292*s),fill=hair,outline=INK,width=max(2,int(3*s)))
        box(d,(x-72*s,ground-385*s,x+72*s,ground-302*s),12*s,hair)
    else:
        d.ellipse((x-64*s,ground-429*s,x+64*s,ground-303*s),fill=hair,outline=INK,width=max(2,int(3*s)))
        d.ellipse((x+38*s,ground-412*s,x+80*s,ground-365*s),fill=hair,outline=INK,width=max(2,int(2*s)))
    d.ellipse((x-52*s,ground-405*s,x+52*s,ground-306*s),fill=skin,outline=INK,width=max(2,int(3*s)))
    # hair fringe: distinct and stable
    d.pieslice((x-54*s,ground-417*s,x+54*s,ground-358*s),180,355,fill=hair)
    if who == 'maya':
        d.polygon([(x-52*s,ground-397*s),(x-15*s,ground-410*s),(x-42*s,ground-371*s)],fill=hair)
    else:
        d.polygon([(x+52*s,ground-396*s),(x+6*s,ground-409*s),(x+42*s,ground-373*s)],fill=hair)
    blink = (math.sin(p*0.37 + (0 if who=='maya' else 2.4)) > .985)
    for dx in (-19,19):
        if blink: d.line((x+(dx-6)*s,ground-366*s,x+(dx+6)*s,ground-366*s),fill=INK,width=max(1,int(3*s)))
        else: d.ellipse((x+(dx-4)*s,ground-373*s,x+(dx+4)*s,ground-359*s),fill=INK)
    mouth_y=ground-338*s
    if emotion == 'concern': d.arc((x-12*s,mouth_y-2*s,x+12*s,mouth_y+12*s),190,350,fill=INK,width=max(1,int(3*s)))
    else:
        if (math.sin(p*2.2)>0.25 and who == 'maya'):
            d.ellipse((x-7*s,mouth_y,x+7*s,mouth_y+10*s),fill=INK)
        else: d.arc((x-12*s,mouth_y-8*s,x+12*s,mouth_y+8*s),5,175,fill=INK,width=max(1,int(3*s)))


def stage_background(mode, t):
    """Reconstructed fictional setting; static geometry with animated ambience."""
    im=Image.new('RGB',(1000,800),'#e8dcc8');d=ImageDraw.Draw(im)
    if mode == 'transit':
        d.rectangle((0,0,1000,545),fill='#dce7df')
        d.rectangle((0,545,1000,800),fill='#aebbb0')
        for x,h in [(25,235),(125,285),(810,225),(920,300)]:
            d.rectangle((x,545-h,x+72,545),fill='#c2d3ca')
            for y in range(545-h+30,530,55): d.rectangle((x+16,y,x+28,y+18),fill='#e5eadc')
        d.rectangle((665,110,680,640),fill=INK)
        box(d,(634,100,917,132),10,INK)
        box(d,(704,160,869,350),7,'#f6ecd7',INK,4)
        d.line((727,212,847,212),fill=CORAL,width=5)
        for yy in (243,272,301):
            d.ellipse((731,yy,742,yy+11),fill=TEAL)
            d.line((755,yy+5,843,yy+5),fill='#a4a88e',width=3)
        box(d,(692,559,891,579),5,'#9a664d',INK,4)
        d.line((710,578,704,645),fill=INK,width=6);d.line((873,578,879,645),fill=INK,width=6)
        for i in range(25):
            x=(i*79+40)%1000;y=(i*91+int(t*110))%540
            d.line((x,y,x-5,y+18),fill='#aec9c2',width=2)
    else:
        d.rectangle((0,0,1000,570),fill='#e8dcc8')
        d.rectangle((0,570,1000,800),fill='#c7ad8e')
        d.rectangle((0,555,1000,574),fill='#b69d7f')
        # window: daylight, not generic decorative stock footage.
        box(d,(740,65,935,296),10,'#bed9d0','#806d58',8)
        d.line((838,70,838,291),fill='#92765c',width=7)
        d.line((745,180,930,180),fill='#92765c',width=7)
        d.ellipse((865,94,902,131),fill='#f3d698')
        # left shelf + distinct reels
        d.rectangle((47,95,386,109),fill='#8a6c55')
        for k,c in enumerate([CORAL,TEAL,MUSTARD,'#8e7e70']):
            x=79+k*68;box(d,(x,56,x+35,95),5,c,INK,2)
            d.line((x+3,66,x+32,66),fill='#f6e6ce',width=2)
        d.line((54,383,203,383),fill='#8a6c55',width=8)
        for i in range(3): box(d,(74+i*40,328,98+i*40,377),5,['#85a799','#d9b577','#cc8c72'][i])
    # subtle fixed grain-like dots, not moving/noisy static
    for i in range(90):
        x=(i*149+13)%1000;y=(i*239+17)%560
        d.point((x,y),fill='#d8c9b5' if mode!='transit' else '#c7d9cf')
    return im


def desk(d):
    box(d,(54,592,947,628),9,'#95684d',INK,5)
    d.polygon([(90,626),(111,626),(96,798),(76,798)],fill='#76523f')
    d.polygon([(891,626),(912,626),(928,798),(907,798)],fill='#76523f')
    d.line((69,600,930,600),fill='#c99771',width=4)


def stage_frame(mode: str, scene_id: str, scene_elapsed: float, scene_duration: float):
    t=scene_elapsed; phase=t*3.2; enter=smooth(t/0.65); im=stage_background(mode,t)
    d=ImageDraw.Draw(im)
    # Every recipe deliberately uses the two named objects from the storyboard.
    if mode == 'return':
        shadow(d,500,700,245,28)
        d.ellipse((229,425,361,559),fill=SKIN_MAYA,outline=INK,width=6)
        d.line((135,500,297,485),fill=CORAL,width=85)
        bx=535-38*(1-enter); draw_bag(d,bx,463,1.95,pocket=False)
        draw_sheet(d,790,505,.63,'lines')
        # Return arrow makes the action visible without borrowing a reference frame.
        d.arc((290,180,694,390),205,337,fill=CORAL,width=11)
        d.polygon([(286,251),(308,293),(331,249)],fill=CORAL)
    elif mode == 'intro':
        shadow(d,300,724,135,15);shadow(d,705,724,135,15)
        draw_person(d,'maya',300,720,1.12,phase,'hold')
        draw_person(d,'nisa',705,720,1.12,phase+.9,'hold')
        draw_bag(d,510,588,.67)
        for x,name,col in [(300,'MAYA',CORAL),(705,'NISA',TEAL)]:
            box(d,(x-75,151,x+75,195),12,col)
            ft=font(BOLD,24);bb=d.textbbox((0,0),name,font=ft);d.text((x-(bb[2]-bb[0])/2,155),name,font=ft,fill='#fff8e9')
    elif mode in ('plan','cut','budget'):
        shadow(d,285,711,130,13);draw_person(d,'nisa',285,710,.98,phase,'point')
        desk(d)
        draw_sheet(d,535,485,1.04,'sketch')
        if mode=='plan':
            for i,c in enumerate([CORAL,TEAL,MUSTARD]):box(d,(676+i*62,462,723+i*62,514),5,c,INK,3)
            draw_bag(d,802,532,.48)
        elif mode=='cut':
            d.polygon([(655,499),(888,475),(915,584),(665,586)],fill=TEAL,outline=INK,width=5)
            draw_scissors(d,755,525,.95,phase)
        else:
            draw_calculator(d,740,495,1.0)
            box(d,(822,478,924,552),5,'#ead4ae','#9b8063',3)
            d.line((836,500,908,500),fill='#b59373',width=4)
            draw_bag(d,598,550,.50,pocket=(scene_id=='S28'))
    elif mode in ('sew','pocket'):
        # Sewing turns into an actual sample handover in the same narrated scene.
        handover_scene=scene_id in ('S07','T03')
        threshold=.55 if scene_id=='T03' else .47
        lending=handover_scene and t>scene_duration*threshold
        if lending:
            k=smooth((t-scene_duration*threshold)/max(.6,scene_duration*(1-threshold)*.8))
            bx=lerp(520,460,k)
            shadow(d,280,710,100,14);shadow(d,710,710,100,14)
            draw_person(d,'nisa',280,709,.87,phase,'hold',target_r=(bx-62,478))
            # Maya steps closer and reaches for the tote.
            mx=lerp(740,700,k)
            draw_person(d,'maya',mx,709,.87,phase+.7,'hold',target_l=(bx+62,478))
            desk(d);draw_machine(d,780,510,.52,phase*2)
            draw_bag(d,bx,511,.59)
        else:
            shadow(d,258,710,120,14)
            draw_person(d,'nisa',258,709,.98,phase,'write',target_r=(447,475+8*math.sin(phase*2)))
            desk(d);draw_machine(d,580,485,.92,phase*2)
            draw_bag(d,825,525,.63,pocket=(mode=='pocket' and (scene_id!='S21' or t>min(1.2,scene_duration*.35))))
            if mode=='pocket':
                draw_sheet(d,418,485,.5,'check');d.line((720,517,755,517),fill=CORAL,width=6)
            else:
                draw_sheet(d,431,491,.49,'sketch')
                if scene_id=='T03':draw_calculator(d,740,490,.40)
    elif mode == 'transit':
        # In S10 the sample visibly lowers; Maya's two arms connect to props.
        drop=70*smooth((t-.25)/max(1.0,scene_duration*.60)) if scene_id=='S10' else 0
        by=535+drop;bx=571+5*math.sin(phase*.7)
        shadow(d,327,707,135,18)
        draw_person(d,'maya',325,701,1.04,phase,'hold','concern',target_l=(200,329),target_r=(bx-104,by-82))
        draw_umbrella(d,200,112,1.08,phase*.8)
        # Strap attaches to the shoulder; hand follows the zipper as the bag drops.
        d.line((382,430,bx-72,by-85),fill=INK,width=8)
        draw_bag(d,bx,by,1.02,open_bag=(scene_id=='S10'))
        d.ellipse((bx-114,by-93,bx-92,by-71),fill=SKIN_MAYA,outline=INK,width=2)
        draw_card(d,bx+45,by-85,.52)
    elif mode in ('note','many'):
        shadow(d,215,710,105,14);draw_person(d,'nisa',220,708,.9,phase,'point','concern')
        desk(d)
        draw_bag(d,821,530,.72,open_bag=(scene_id=='S13'))
        if mode=='note':
            draw_sheet(d,513,474,1.1,'lines', 'KANTONG?')
            draw_scissors(d,673,552,.44,phase)
        else:
            for i in range(2 if scene_id!='S12' else 3):
                draw_sheet(d,430+135*i,475+18*i,.68,'sketch' if i!=1 else 'lines')
            if scene_id=='S15':
                d.ellipse((606,291,658,343),fill=SKIN_MAYA,outline=INK,width=3)
                d.ellipse((685,291,737,343),fill=SKIN_NISA,outline=INK,width=3)
                ft=font(BOLD,32); d.text((650,275),'≠',font=ft,fill=CORAL)
    elif mode == 'observe':
        shadow(d,330,720,105,15);shadow(d,710,720,105,15)
        # First show umbrella in hand, then bring that hand toward the bag as
        # Maya tucks the handle alongside her elbow to free both hands.
        demo=scene_id=='S18'
        k=smooth((t-.25)/max(1.0,scene_duration*.65)) if demo else 0
        drop=55*k;bx=490;by=536+drop
        umbrella_x=lerp(245,235,k)
        left=(lerp(umbrella_x, bx-75,k),lerp(330,by-65,k))
        draw_person(d,'maya',330,710,.88,phase,'hold','concern',target_l=left,target_r=(bx-75,by-85))
        draw_person(d,'nisa',710,710,.88,phase+1,'point',target_l=(bx+80,by-60))
        draw_chair(d,515,594,.73)
        draw_umbrella(d,umbrella_x,175,.78,phase*.6)
        draw_bag(d,bx,by,.72,open_bag=demo)
        d.ellipse((bx-84,by-94,bx-65,by-75),fill=SKIN_MAYA,outline=INK,width=2)
        draw_card(d,bx+86+10*math.sin(phase),461+drop,.45)
    elif mode == 'insight':
        shadow(d,210,710,100,14);draw_person(d,'nisa',210,705,.89,phase,'point')
        desk(d)
        draw_bag(d,710,505,1.05,pocket=True)
        draw_card(d,711+int(12*math.sin(phase)),385,.65)
        draw_sheet(d,460,476,.8,'check')
        d.line((515,455,574,441),fill=CORAL,width=6)
        d.polygon([(572,425),(594,437),(573,453)],fill=CORAL)
        if scene_id == 'S27':draw_umbrella(d,899,196,.49,phase)
    elif mode == 'test':
        shadow(d,250,713,105,15);shadow(d,785,713,105,15)
        other_tester=scene_id=='S24' or (scene_id=='T08' and t>scene_duration*.58)
        closeup=1.26 if scene_id in ('S22','T08') else 1.05
        bx=585 if other_tester else 520
        maya_x=220 if other_tester else 245
        maya_target=(330,465) if other_tester else (bx-110,448)
        draw_person(d,'maya',maya_x,705,.84,phase,'hold',target_r=maya_target)
        draw_person(d,'nisa',790,705,.84,phase+1,'point',target_l=(bx+105,463))
        if other_tester:
            # A distinct third tester appears, with an unobstructed face.
            draw_person(d,'tester',405,665,.95,phase+.3,'hold',target_r=(bx-107,485))
        draw_bag(d,bx,525,closeup,pocket=True,tiny_zip=(scene_id in ('S22','T08') and t<scene_duration*.55))
        # The card moves vertically out of the added exterior pocket.
        reach=smooth((t-.2)/max(1.0,scene_duration*.60))
        draw_card(d,bx+10,lerp(455,367,reach),.62)
        if scene_id=='S24':draw_sheet(d,695,515,.5,'check')
    elif mode == 'purchase':
        shadow(d,300,716,110,14);shadow(d,700,716,110,14)
        handover=smooth((t-.1)/max(1.0,scene_duration*.68));bx=lerp(540,450,handover)
        draw_person(d,'maya',300,706,.94,phase,'hold',target_r=(bx-98,452))
        draw_person(d,'nisa',700,706,.94,phase+.8,'point',target_l=(bx+98,452))
        draw_bag(d,bx,520,.97,pocket=True)
        draw_sheet(d,711,525,.55,'lines','1 TAS')
    elif mode in ('question','end'):
        shadow(d,500,700,225,24)
        draw_bag(d,500,495,1.45,pocket=True)
        draw_card(d,514,333,.62)
        if mode=='question':
            for x,y,word in [(235,305,'RENCANA'),(782,305,'UJI')]:
                box(d,(x-98,y-33,x+98,y+33),18,'#fff6df',INK,3)
                ft=font(BOLD,22);bb=d.textbbox((0,0),word,font=ft);d.text((x-(bb[2]-bb[0])/2,y-17),word,font=ft,fill=INK)
        else:
            draw_person(d,'maya',182,720,.68,phase,'hold')
            draw_person(d,'nisa',818,720,.68,phase+1,'point')
    return im


def wrap_width(draw, text, ft, width):
    result=[]
    for para in text.split('\n'):
        line=''
        for word in para.split():
            cand=(line+' '+word).strip()
            if line and draw.textlength(cand,font=ft)>width:
                result.append(line);line=word
            else: line=cand
        if line:result.append(line)
    return result


def render_frame(edition, scene, elapsed, duration, cue=None):
    W,H=OUT_SIZES[edition];portrait=edition!='master'
    mode,headline=RECIPES[scene['id']]
    bg=Image.new('RGB',(W,H),'#f5e9d4');d=ImageDraw.Draw(bg)
    # Colored side stripe and strong safe frame. No fade: all branding and fiction disclosure visible at t=0.
    d.rectangle((0,0,12 if not portrait else 11,H),fill=CORAL)
    for i in range(11):
        yy=(i*113+17)%H;d.line((18,yy,W-20,yy),fill='#f1e4cf',width=1)
    if portrait:
        art_w=720;art_h=576;art_x=0;art_y=287
        headline_x=52;headline_y=124;head_width=616;head_size=54 if len(headline)>21 else 64
        badge=(48,43,236,83);sub_y=950;sub_width=610;sub_size=36
    else:
        art_w=850;art_h=680;art_x=415;art_y=29
        headline_x=59;headline_y=164;head_width=356;head_size=46 if len(headline)>22 else 53
        badge=(54,45,227,80);sub_y=611;sub_width=1030;sub_size=30
    art=stage_frame(mode,scene['id'],elapsed,duration).resize((art_w,art_h),Image.Resampling.LANCZOS)
    bg.paste(art,(art_x,art_y))
    d=ImageDraw.Draw(bg,'RGBA')
    # Header overlay gets a quiet backing where landscape illustration meets it.
    if not portrait:d.rectangle((13,0,410,H),fill=(245,233,212,255))
    box(d,badge,9,INK)
    badge_f=font(BOLD,19 if portrait else 17)
    d.text((badge[0]+12,badge[1]+7),'CERITA FIKTIF',font=badge_f,fill='#f9f2e4')
    mark_f=font(BOLD,17 if portrait else 15)
    d.text((W-202 if portrait else 1043,51 if portrait else 49),'DRAF PRIVAT',font=mark_f,fill=INK)
    # Short line separates headline visually from illustration.
    display_font=font(DISPLAY,head_size) if mode!='end' else font(BOLD,head_size-3)
    lines=wrap_width(d,headline,display_font,head_width)
    while any(d.textlength(line,font=display_font)>head_width for line in lines) and head_size>28:
        head_size-=1
        display_font=font(DISPLAY,head_size) if mode!='end' else font(BOLD,head_size-3)
        lines=wrap_width(d,headline,display_font,head_width)
    line_h=int(head_size*1.12)
    for i,line in enumerate(lines):d.text((headline_x,headline_y+i*line_h),line,font=display_font,fill=INK,stroke_width=0)
    if mode!='end':
        yy=headline_y+len(lines)*line_h+7
        d.rounded_rectangle((headline_x,yy,headline_x+80,yy+6),radius=3,fill=CORAL)
    # Source UI and subtitles remain inside safe bounds; cues are estimates.
    if cue:
        txt=cue['text'];subfont=font(BOLD,sub_size)
        rows=wrap_width(d,txt,subfont,sub_width-48)
        # Cue construction already caps rows. Scale down rather than hide words if an unusual cue wraps.
        while len(rows)>2 and sub_size>25:
            sub_size-=1;subfont=font(BOLD,sub_size);rows=wrap_width(d,txt,subfont,sub_width-48)
        if len(rows)>2: raise ValueError(f'Subtitle overflow: {txt}')
        line_h=int(sub_size*1.2);bh=len(rows)*line_h+28
        top=int(sub_y-bh/2)
        box(d,((W-sub_width)/2,top,(W+sub_width)/2,top+bh),14,(22,48,49,235))
        for j,row in enumerate(rows):
            length=d.textlength(row,font=subfont)
            d.text(((W-length)/2,top+11+j*line_h),row,font=subfont,fill='#fffaf0')
    return bg.convert('RGB')


def choose_cue(cues, t):
    # Binary-search is unnecessary for the <100 short cues, but keep stable ordering.
    for cue in cues:
        if cue['start'] <= t < cue['end']: return cue
    return None


def caption_pages(text, font_obj, maxw):
    """Balanced two-line pages with clause-aware cuts; timing remains estimated."""
    words=text.split()
    if not words:return []
    n=len(words)
    # Plan two balanced lines with no overflow. Avoid one-word lines where possible.
    def line_plan(tokens):
        joined=' '.join(tokens)
        if font_obj.getlength(joined) <= maxw:return [joined],0.0
        options=[]
        for j in range(1,len(tokens)):
            a=' '.join(tokens[:j]);b=' '.join(tokens[j:])
            la=font_obj.getlength(a);lb=font_obj.getlength(b)
            if la<=maxw and lb<=maxw:
                lone=(len(tokens[:j])==1 or len(tokens[j:])==1)*1.2
                options.append((abs(la-lb)/maxw+lone,[a,b]))
        if not options:return None
        cost,lines=min(options,key=lambda v:v[0]);return lines,cost
    plans={}
    counts=[10**6]*(n+1);counts[n]=0
    for i in range(n-1,-1,-1):
        for j in range(i+1,n+1):
            plan=line_plan(words[i:j])
            if plan is None:break
            plans[i,j]=plan
            counts[i]=min(counts[i],1+counts[j])
    if counts[0]>=10**6:raise ValueError('A subtitle word is too wide to display')
    target=sum(len(x) for x in words)/counts[0]
    starts={'dan','tapi','tetapi','namun','sebelum','setelah','sambil','ketika','karena','untuk','lalu','dengan'}
    dangling=starts|{'yang','di','ke','dari','pada','mungkin','hanya','uangnya','sangat'}
    best=[float('inf')]*(n+1);choice=[None]*(n+1);best[n]=0
    for i in range(n-1,-1,-1):
        for j in range(i+1,n+1):
            plan=plans.get((i,j))
            if plan is None:break
            if counts[i]!=1+counts[j]:continue
            length=sum(len(x) for x in words[i:j]);balance=((length-target)/max(1,target))**2*.7
            last=words[j-1].strip('.,;:?!').casefold()
            punct=words[j-1].endswith((',', ';', ':')) and j<n
            connective=j<n and words[j].strip('.,;:?!').casefold() in starts
            boundary=(-1.1 if punct else 0)+(-.25 if connective else 0)+(1.6 if j<n and last in dangling else 0)
            too_short = (2.0 + 4*(0.5-length/max(1,target))) if counts[0]>1 and length<0.5*target else 0
            cost=balance+plan[1]*.25+boundary+too_short+best[j]
            if cost<best[i]:best[i]=cost;choice[i]=j
    result=[];i=0
    while i<n:
        j=choice[i]
        if j is None:raise ValueError('Unable to paginate captions')
        result.append('\n'.join(plans[i,j][0]));i=j
    return result


def captions(timeline, edition):
    sub_size=36 if edition!='master' else 30
    width=(610 if edition!='master' else 1030)-48
    f=font(BOLD,sub_size);out=[]
    for scene in timeline:
        for sentence in scene['sentences']:
            pages=caption_pages(sentence['text'],f,width)
            weights=[max(1,len(page.replace('\n',' '))) for page in pages]
            span=sentence['end']-sentence['start']; total=sum(weights);t=sentence['start']
            for i,(page,w) in enumerate(zip(pages,weights)):
                end=sentence['end'] if i==len(pages)-1 else t+span*w/total
                out.append({'sceneId':scene['id'],'text':page,'start':t,'end':end});t=end
    return out


def make_plan(edition, manifest, voice_dir, root):
    source_edition='master' if edition=='master-vertical' else edition
    script=json.loads((CONTENT/f'{source_edition}.script.json').read_text(encoding='utf-8'))
    scenes,narration,duration=rough.make_timeline(source_edition,script,manifest,voice_dir,root)
    result={'scenes':scenes,'duration':duration,'narration':str(narration),
            'timingStatus':'estimated from silence; not forced alignment'}
    cues=captions(scenes,edition)
    rough.write_srt(cues,root/f'{edition}.srt')
    (root/f'{edition}-timeline.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (root/f'{edition}-cues.json').write_text(json.dumps(cues,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    return result,cues


def contact(edition, timeline, cues, root):
    thumbs=[]
    for scene in timeline['scenes']:
        a,b=scene['start'],scene['end'];at=a+(b-a)*.42
        frame=render_frame(edition,scene,at-a,b-a,choose_cue(cues,at))
        frame.thumbnail((320,180) if edition=='master' else (180,320))
        thumbs.append((scene['id'],frame.copy()))
    cols=4 if edition=='master' else 4;cell_w=330 if edition=='master' else 190;cell_h=210 if edition=='master' else 350
    sheet=Image.new('RGB',(cols*cell_w,math.ceil(len(thumbs)/cols)*cell_h),'#ffffff');d=ImageDraw.Draw(sheet)
    f=font(BOLD,17)
    for i,(sid,im) in enumerate(thumbs):
        x=(i%cols)*cell_w;y=(i//cols)*cell_h
        sheet.paste(im,(x,y+25));d.text((x+4,y+2),sid,font=f,fill=INK)
    sheet.save(root/f'{edition}-contact.jpg',quality=90)
    render_frame(edition,timeline['scenes'][0],0,timeline['scenes'][0]['end'],choose_cue(cues,0)).save(root/f'{edition}-frame0.png')


def encode(edition, timeline, cues, work, out):
    W,H=OUT_SIZES[edition];total=timeline['duration'];n=math.ceil(total*FPS)
    silent=work/f'{edition}-silent.mp4'
    command=[rough.FF,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p','-movflags','+faststart',str(silent)]
    proc=subprocess.Popen(command,stdin=subprocess.PIPE)
    assert proc.stdin
    scenes=timeline['scenes'];si=0;last=''
    try:
        for i in range(n):
            t=i/FPS
            while si+1<len(scenes) and t>=scenes[si]['end']:si+=1
            scene=scenes[si]
            if scene['id']!=last:
                print(f'{edition} {scene["id"]}: {t:.2f}/{total:.2f}s',flush=True);last=scene['id']
            frame=render_frame(edition,scene,t-scene['start'],scene['end']-scene['start'],choose_cue(cues,t))
            proc.stdin.write(frame.tobytes())
        proc.stdin.close()
        code=proc.wait()
        if code:raise RuntimeError(f'ffmpeg video encode exited {code}')
    except BaseException:
        try:proc.stdin.close()
        except Exception:pass
        proc.terminate();proc.wait();raise
    # Exactly one concatenated narration track plus a quiet, original generated score.
    music=work/f'{edition}-music.wav';rough.synth_score(music,total)
    source_edition='master' if edition=='master-vertical' else edition
    voice=work/'timing'/f'{source_edition}-narration.wav'
    command=[rough.FF,'-y','-loglevel','error','-i',str(silent),'-i',str(voice),'-i',str(music),'-filter_complex','[1:a]volume=1.0[voice];[2:a]volume=0.7[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[a]','-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',str(out)]
    subprocess.run(command,check=True)
    print(f'{edition} COMPLETE {out}',flush=True)


def key_art():
    """Independent poster artwork: character, returned bag and question slip."""
    im=stage_background('key',.8);d=ImageDraw.Draw(im)
    # Warm diagonal spotlights make a separate editorial composition, not a video frame.
    d.polygon([(410,25),(655,25),(990,545),(765,545)],fill='#f0dfc0')
    d.polygon([(625,25),(790,25),(995,362),(995,466)],fill='#edd6b0')
    shadow(d,265,724,145,17);shadow(d,670,724,230,24)
    draw_person(d,'maya',248,720,1.2,.8,'hold','concern')
    draw_bag(d,650,488,1.46,pocket=False)
    draw_sheet(d,867,459,.75,'lines')
    qf=font(DISPLAY,78);d.text((842,422),'?',font=qf,fill=CORAL)
    d.arc((435,157,788,350),207,329,fill=CORAL,width=10)
    d.polygon([(428,231),(450,276),(472,232)],fill=CORAL)
    return im


def poster(root):
    """Independent key-art compositions, not a frame grabbed from a video."""
    for kind,size in [('thumbnail-master',(1280,720)),('thumbnail-short',(720,1280)),('poster-4x5',(864,1080))]:
        w,h=size;im=Image.new('RGB',size,'#f5e9d4');d=ImageDraw.Draw(im)
        d.rectangle((0,0,max(11,w//70),h),fill=CORAL)
        if kind=='thumbnail-master':
            art=key_art().resize((735,588),Image.Resampling.LANCZOS);im.paste(art,(545,116));tx=62;ty=170;maxw=510;fs=66
        else:
            aw=w;ah=int(w*.8);art=key_art().resize((aw,ah),Image.Resampling.LANCZOS);im.paste(art,(0,int(h*.37)));tx=int(w*.07);ty=int(h*.12);maxw=int(w*.86);fs=int(w*.075)
        d=ImageDraw.Draw(im);box(d,(tx,35 if kind=='thumbnail-master' else int(h*.04),tx+183,72 if kind=='thumbnail-master' else int(h*.04)+37),8,INK)
        d.text((tx+11,42 if kind=='thumbnail-master' else int(h*.04)+7),'CERITA FIKTIF',font=font(BOLD,17),fill='#fff8e9')
        ft=font(DISPLAY,fs)
        lines=wrap_width(d,'DIKEMBALIKAN\nSEBELUM DIJUAL',ft,maxw)
        while any(d.textlength(line,font=ft)>maxw for line in lines) and fs>24:
            fs-=1;ft=font(DISPLAY,fs);lines=wrap_width(d,'DIKEMBALIKAN\nSEBELUM DIJUAL',ft,maxw)
        for i,line in enumerate(lines):
            d.text((tx,ty+i*int(fs*1.12)),line,font=ft,fill=INK)
        d.text((tx,ty+len(lines)*int(fs*1.12)+20),'Kenapa?',font=font(BOLD,int(fs*.55)),fill=CORAL)
        im.save(root/f'{kind}.png',optimize=True)


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--private-rough',action='store_true',help='required; never a release authorization')
    ap.add_argument('--voice-dir',type=Path,required=True)
    ap.add_argument('--work-dir',type=Path,required=True)
    ap.add_argument('--out-dir',type=Path,required=True)
    ap.add_argument('--edition',choices=['master','master-vertical','short','both','all'],default='all')
    ap.add_argument('--plan-only',action='store_true')
    args=ap.parse_args()
    if not args.private_rough:ap.error('Pass --private-rough; release output is intentionally unsupported')
    rough.validate_mode(args.private_rough,args.out_dir)
    rough.validate_mode(args.private_rough,args.work_dir)
    manifest=json.loads((args.voice_dir/'voice-manifest.json').read_text(encoding='utf-8'))
    editions=['master','master-vertical','short'] if args.edition=='all' else (['master','short'] if args.edition=='both' else [args.edition])
    required=list(dict.fromkeys('master' if e=='master-vertical' else e for e in editions))
    validate(args.voice_dir,manifest,required)
    rough.mechanical_gates()
    args.work_dir.mkdir(parents=True,exist_ok=True);args.out_dir.mkdir(parents=True,exist_ok=True)
    tdir=args.work_dir/'timing';tdir.mkdir(exist_ok=True)
    for edition in editions:
        timeline,cues=make_plan(edition,manifest,args.voice_dir,tdir)
        contact(edition,timeline,cues,args.out_dir)
        if not args.plan_only:encode(edition,timeline,cues,args.work_dir,args.out_dir/f'{edition}-DRAF-PRIVAT.mp4')
    poster(args.out_dir)
    print('PRIVATE ROUGH ONLY — timing estimates and human/rights/disclosure/prevoice review remain open.',flush=True)

if __name__=='__main__':main()
