#!/usr/bin/env python3
"""Original staircase-story animatic, PRIVATE ROUGH ONLY.

The shot recipes/character rigs are original to this story. Existing bag/Chicago
utilities are used only for input binding, timing, captions, score and FFmpeg.
No reference footage is read. A rough is not a prevoice or release approval.
Source drawings are 12fps, held as pairs in the 24fps H.264 container.
"""
from __future__ import annotations
import argparse
import importlib.util
from functools import lru_cache
import json
import math
from pathlib import Path
import subprocess

from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[3]
CONTENT=ROOT/'editorial-engine/content/tangga-masih-licin'
OLD=ROOT/'editorial-engine/pipeline/tas-yang-kukembalikan/render_private.py'
spec=importlib.util.spec_from_file_location('reusable_private_tools',OLD)
bag=importlib.util.module_from_spec(spec);spec.loader.exec_module(bag)
rough=bag.rough
bag.CONTENT=CONTENT
rough.CONTENT=CONTENT
FPS=24
DRAW_FPS=12
OUT_SIZES=bag.OUT_SIZES
FONT=bag.REGULAR
BOLD=bag.BOLD
INK='#183c40'; DARK='#173f44'; TEAL='#357c79'; MIST='#cce0db'
CORAL='#c86c58'; GOLD='#e8ba65'; CREAM='#f7eedb'; NAVY='#34535c'
SKIN_N='#bd7d61'; SKIN_B='#bb886d'; SKIN_E='#a77058'

# The keywords change at dramatic beats, not as a repeated generic label. Each
# scene has a deliberately selected shot category rather than a phone template.
RECIPES={
 'S01':('macro','TANGGA ITU\nMASIH LICIN'),
 'S02':('phone','SUDAH\nDIINGATKAN'),
 'S03':('introduce','BAYANGKAN\nJADI NARA'),
 'S04':('exterior','PAGI SETELAH\nHUJAN'),
 'S05':('descent','TURUN\nPELAN-PELAN'),
 'S06':('slip','NYARIS\nTERGELINCIR'),
 'S07':('compose','USUL NARA\nDI GRUP'),
 'S08':('reply','JAWABAN\nBIMA'),
 'S09':('replynote','USULNYA\nDITUTUP'),
 'S10':('group','SEMUA BAHAS\nIURAN'),
 'S11':('drift','PESAN YANG\nTENGGELAM'),
 'S12':('split','TANGGANYA\nBELUM DIJAWAB'),
 'S12a':('memory','NIATNYA\nMENJAGA'),
 'S12b':('shame','MALAH\nDIPERMALUKAN'),
 'S12c':('calendar','BUKAN\nYANG PERTAMA'),
 'S12d':('lamp','MINGGU\nLALU'),
 'S13':('feel','INGIN\nMEMBELA DIRI'),
 'S13a':('hesitate','ATAU TAKUT\nMELAPOR LAGI'),
 'S14':('draft','KETIK...\nLALU BERHENTI'),
 'S15':('ledger','BIMA SALAH\nSOAL IURAN?'),
 'S16':('ledger_mark','NGGAK.'),
 'S17':('envelope','TUNGGAKAN\nTETAP ADA'),
 'S18':('cost','BIAYA\nBERSAMA'),
 'S19':('stair_far','MALU TAK\nMENGERINGKAN'),
 'S20':('compare','IURAN =\nTANGGA AMAN?'),
 'S21':('magnify','PERIKSA\nTERPISAH'),
 'S21a':('term','AD HOMINEM'),
 'S21b':('compare_coin','ALASAN &\nKESIMPULAN'),
 'S21c':('pattern','JIKA JADI\nKEBIASAAN'),
 'S21d':('chairs','BUKAN VONIS\nSIFAT BIMA'),
 'S22':('proposal','USUL BISA\nSAJA KELIRU'),
 'S23':('alternatives','CARI CARA\nLAIN?'),
 'S24':('possible','BISA DIMINTA\nMEMERIKSA'),
 'S25':('mirror','SEKARANG\nBALIK POSISI'),
 'S26':('funds_offer','BIMA INGIN\nMEMEGANG DANA'),
 'S27':('funds_hurt','NARA\nMERASA KESAL'),
 'S28':('funds_question','KESAL =\nSALAH URUS?'),
 'S29':('decision','BELUM\nTENTU'),
 'S30':('report','BUKTI YANG\nRELEVAN'),
 'S31':('roles','SIAPA PEGANG\nDANA?'),
 'S32':('redraft','PESAN LAMA\nDIHAPUS'),
 'S33':('message_dues','IURANKU\nAKU URUS'),
 'S34':('message_stair','TANGGANYA\nDIPERIKSA?'),
 'S35':('inspect','PEMERIKSAAN\nDI CERITA'),
 'S36':('result','HASILNYA:\nLICIN SAAT BASAH'),
 'S37':('two_issues','DUA MASALAH\nTETAP ADA'),
 'S38':('two_cards','SATU TAK\nMENGHAPUS LAIN'),
 'S38a':('quiet','NIAT BAIK\nTAK MENJAMIN'),
 'S39':('empty_chair','KAMU JAWAB\nYANG MANA DULU?'),
 'T01':('macro','TANGGA ITU\nMASIH LICIN'),
 'T02':('introduce','BAYANGKAN\nJADI NARA'),
 'T03':('descent_message','NYARIS JATUH,\nLALU MELAPOR'),
 'T04':('replynote','JAWABAN\nBIMA'),
 'T04a':('memory','NIATNYA\nMENJAGA'),
 'T04b':('lamp','MINGGU\nLALU'),
 'T05':('envelope','TUNGGAKAN\nTETAP ADA'),
 'T06':('cost','BIAYA\nBERSAMA'),
 'T07':('compare','IURAN =\nTANGGA AMAN?'),
 'T08':('magnify','PERIKSA\nTERPISAH'),
 'T08a':('term','AD HOMINEM'),
 'T08b':('pattern','JIKA JADI\nKEBIASAAN'),
 'T08c':('chairs','BUKAN VONIS\nSIFAT BIMA'),
 'T08d':('hesitate','RAGU\nBICARA LAGI'),
 'T09':('proposal','USUL BISA\nSAJA KELIRU'),
 'T10':('mirror','SEKARANG\nBALIK POSISI'),
 'T11':('funds_question','KESAL =\nSALAH URUS?'),
 'T12':('report','BUKTI YANG\nRELEVAN'),
 'T13':('message_stair','IURAN DAN\nTANGGA'),
 'T14':('result','HASILNYA:\nLICIN SAAT BASAH'),
 'T15':('empty_chair','KAMU JAWAB\nYANG MANA DULU?'),
}
bag.RECIPES=RECIPES


@lru_cache(maxsize=128)
def font(size, bold=True):return ImageFont.truetype(str(BOLD if bold else FONT),int(size))
def box(d,xy,r,fill,outline=None,width=1):bag.box(d,xy,r,fill,outline,width)
def lerp(a,b,x):return a+(b-a)*x
def smooth(x):return bag.smooth(x)
def label(d,text,xy,size=24,color=INK):d.text(xy,text,font=font(size),fill=color)
def center(d,text,x,y,size=24,color=INK):
    f=font(size);d.text((x-d.textlength(text,font=f)/2,y),text,font=f,fill=color)


def actor(d,who,x,ground,s=1,phase=0,emotion='neutral',target=None,target_left=None):
    """Reusable two-arm rig. Nara's coral/ponytail and Bima's teal/short hair stay fixed."""
    skin={'nara':SKIN_N,'bima':SKIN_B,'neighbor':SKIN_E,'inspector':'#bd8f72','owner':'#c79376'}[who]
    shirt={'nara':CORAL,'bima':NAVY,'neighbor':'#c48f4e','inspector':'#849a7c','owner':'#8a7288'}[who]
    hair={'nara':'#2a3030','bima':'#302e2c','neighbor':'#64605d','inspector':'#373d3c','owner':'#56505c'}[who]
    # subtle physical anticipation + alternating feet
    bob=math.sin(phase*.7)*2*s;ground+=bob
    line=lambda pts,col,w:d.line(pts,fill=col,width=max(2,int(w*s)),joint='curve')
    line([(x-25*s,ground-150*s),(x-35*s,ground-18*s)],INK,29)
    line([(x+25*s,ground-150*s),(x+38*s,ground-18*s)],INK,29)
    d.ellipse((x-62*s,ground-24*s,x-13*s,ground+5*s),fill=INK)
    d.ellipse((x+15*s,ground-24*s,x+65*s,ground+5*s),fill=INK)
    box(d,(x-69*s,ground-282*s,x+69*s,ground-122*s),25*s,shirt,INK,max(2,int(4*s)))
    # stable clothing identifiers rather than logos
    if who=='nara':
        d.line((x-41*s,ground-265*s,x,ground-242*s,x+41*s,ground-265*s),fill='#f0b098',width=max(2,int(5*s)))
        box(d,(x+17*s,ground-196*s,x+49*s,ground-166*s),4*s,'#aa5548')
    elif who=='bima':
        d.line((x-50*s,ground-235*s,x+51*s,ground-235*s),fill='#7ba39d',width=max(2,int(5*s)))
        d.line((x-50*s,ground-216*s,x+51*s,ground-216*s),fill='#7ba39d',width=max(2,int(4*s)))
    else:
        box(d,(x+16*s,ground-211*s,x+46*s,ground-179*s),4*s,'#dfc18e')
    # left arm relaxes; right hand reaches toward a real prop if requested.
    shoulder1=(x-60*s,ground-242*s);end1=(x-88*s,ground-135*s+math.sin(phase)*8*s)
    shoulder2=(x+60*s,ground-242*s);end2=(x+98*s,ground-149*s-math.sin(phase)*6*s)
    def reach(start,goal):
        dx=goal[0]-start[0];dy=goal[1]-start[1];dist=math.hypot(dx,dy)
        fac=min(1,150*s/max(.001,dist));return (start[0]+dx*fac,start[1]+dy*fac)
    if target:end2=reach(shoulder2,target)
    if target_left:end1=reach(shoulder1,target_left)
    for a,b in [(shoulder1,end1),(shoulder2,end2)]:
        mid=((a[0]+b[0])/2,(a[1]+b[1])/2+12*s)
        line([a,mid,b],INK,25);line([a,mid,b],shirt,18)
        d.ellipse((b[0]-11*s,b[1]-11*s,b[0]+11*s,b[1]+11*s),fill=skin,outline=INK,width=max(1,int(2*s)))
    box(d,(x-17*s,ground-318*s,x+17*s,ground-275*s),7*s,skin)
    if who=='nara':
        d.ellipse((x+33*s,ground-417*s,x+83*s,ground-328*s),fill=hair,outline=INK,width=max(2,int(3*s)))
    d.ellipse((x-66*s,ground-430*s,x+66*s,ground-300*s),fill=hair,outline=INK,width=max(2,int(3*s)))
    d.ellipse((x-50*s,ground-410*s,x+50*s,ground-311*s),fill=skin,outline=INK,width=max(2,int(3*s)))
    d.pieslice((x-53*s,ground-425*s,x+53*s,ground-360*s),180,356,fill=hair)
    if who=='bima':d.polygon([(x-49*s,ground-392*s),(x-15*s,ground-412*s),(x-22*s,ground-383*s)],fill=hair)
    blink=math.sin(phase*.43+{'nara':0,'bima':2,'neighbor':3,'inspector':1,'owner':4}[who])>.985
    for ex in (-18,18):
        if blink:d.line((x+(ex-6)*s,ground-371*s,x+(ex+6)*s,ground-371*s),fill=INK,width=max(1,int(3*s)))
        else:d.ellipse((x+(ex-4)*s,ground-377*s,x+(ex+4)*s,ground-362*s),fill=INK)
    if emotion in ('sad','worried'):
        d.line((x-28*s,ground-384*s,x-9*s,ground-380*s),fill=INK,width=max(1,int(2*s)))
        d.line((x+9*s,ground-380*s,x+28*s,ground-384*s),fill=INK,width=max(1,int(2*s)))
        d.arc((x-13*s,ground-348*s,x+13*s,ground-330*s),190,350,fill=INK,width=max(1,int(3*s)))
    elif math.sin(phase*2.1)>.20 and who in ('nara','bima'):
        d.ellipse((x-6*s,ground-346*s,x+6*s,ground-335*s),fill=INK)
    else:d.arc((x-12*s,ground-350*s,x+12*s,ground-332*s),5,175,fill=INK,width=max(1,int(3*s)))


def room(t, variant='nara'):
    im=Image.new('RGB',(1000,800),'#e8dcca');d=ImageDraw.Draw(im)
    if variant in ('nara','bima','table'):
        d.rectangle((0,0,1000,565),fill='#e9ddca' if variant!='bima' else '#d7e1d7')
        d.rectangle((0,565,1000,800),fill='#c9ae8f')
        d.line((0,565,1000,565),fill='#9e8b77',width=8)
        box(d,(72,95,262,327),8,'#bad5d1','#866d5c',8)
        d.line((168,99,168,323),fill='#8b7765',width=6);d.line((78,206,256,206),fill='#8b7765',width=6)
        for i in range(9):
            x=80+(i*47)%165;y=112+(i*73+int(t*75))%202
            d.line((x,y,x-4,y+15),fill='#8bb9b2',width=2)
        box(d,(750,123,917,363),7,'#c59670','#755a4c',5)
        d.rectangle((779,149,889,337),fill='#aa765d');d.ellipse((864,235,879,250),fill=GOLD)
        d.line((325,140,590,140),fill='#92775e',width=9)
        for x,c in [(347,GOLD),(409,TEAL),(470,CORAL),(532,'#82978a')]:box(d,(x,99,x+31,137),4,c,INK,2)
    else:
        d.rectangle((0,0,1000,800),fill=MIST)
    for i in range(35):d.point(((i*149+51)%1000,(i*137+63)%548),fill='#d3cbb9')
    return im


def table(d):
    box(d,(70,584,932,625),9,'#9d6e51',INK,5)
    d.polygon([(108,625),(128,625),(111,800),(91,800)],fill='#795640')
    d.polygon([(876,625),(898,625),(920,800),(900,800)],fill='#795640')
    d.line((82,595,919,595),fill='#d4a581',width=4)


def stair(d,t=0,variant='normal',xoff=0,yoff=0):
    """A consistent ascending three-step staircase with handrail and puddles."""
    ox,oy=xoff,yoff
    poly=[(80,678),(80,618),(290,618),(290,526),(515,526),(515,432),(753,432),(753,356),(920,356),(920,677)]
    poly=[(x+ox,y+oy) for x,y in poly];d.polygon(poly,fill='#74908a',outline=INK,width=6)
    for points in [[(80,618),(290,618)],[(290,526),(515,526)],[(515,432),(753,432)],[(753,356),(920,356)]]:
        d.line([(x+ox,y+oy) for x,y in points],fill='#c8d8c7',width=9)
    for x,y in [(170,609),(390,518),(650,424)]:
        d.ellipse((x-42+ox,y-8+oy,x+45+ox,y+4+oy),fill='#83bdbb')
        d.line((x-30+ox,y-5+oy,x+18+ox,y-5+oy),fill='#e5f5df',width=3)
    # handrail in the same direction in all scenes
    d.line((108+ox,450+oy,840+ox,160+oy),fill=INK,width=18)
    d.line((110+ox,445+oy,840+ox,155+oy),fill='#b8c8b6',width=7)
    for x,y,base in [(200,413,600),(444,316,520),(700,214,420)]:
        d.line((x+ox,y+oy,x+ox,base+oy),fill=INK,width=9)
    return poly


def sandal(d,x,y,s=1,tilt=0):
    # Side view of a foot in an open sandal: sole, skin and two diagonal straps.
    # Keeping straps below the upper silhouette avoids making it read like a bag handle.
    skin='#c28d72'
    foot=[(x-91*s,y+2*s),(x-78*s,y-20*s),(x-47*s,y-26*s),(x+35*s,y-26*s),
          (x+59*s,y-69*s),(x+98*s,y-69*s),(x+86*s,y+4*s),(x+54*s,y+17*s),(x-83*s,y+17*s)]
    d.polygon(foot,fill=skin,outline=INK,width=max(2,int(4*s)))
    box(d,(x-100*s,y+9*s,x+102*s,y+35*s),13*s,'#a46c45',INK,max(2,int(4*s)))
    d.line((x-44*s,y-21*s,x-18*s,y+11*s,x+5*s,y-24*s),fill='#6e4b39',width=max(2,int(8*s)),joint='curve')
    d.line((x+26*s,y-25*s,x+45*s,y+11*s),fill='#805039',width=max(2,int(7*s)))
    d.line((x-85*s,y+22*s,x+80*s,y+22*s),fill='#e6b881',width=max(1,int(3*s)))


def phone(d,x,y,s=1,kind='blank',progress=1):
    box(d,(x-115*s,y-190*s,x+115*s,y+190*s),23*s,INK)
    box(d,(x-101*s,y-165*s,x+101*s,y+157*s),13*s,'#f8f1de')
    box(d,(x-101*s,y-165*s,x+101*s,y-122*s),7*s,TEAL)
    d.ellipse((x-9*s,y+168*s,x+9*s,y+184*s),fill='#84a7a0')
    def bubble(y0,col,w=150):box(d,(x-84*s,y+(y0)*s,x+(-84+w)*s,y+(y0+40)*s),8*s,col)
    bubble(-98,'#d2e5dd',160)
    for j in range(2):d.line((x-68*s,y+(-87+j*15)*s,x+52*s,y+(-87+j*15)*s),fill='#8ba69c',width=max(1,int(3*s)))
    if kind in ('reply','chat','draft','response'):
        yy=-30+int((1-progress)*65);bubble(yy,'#eec1ae',162)
        for j in range(2):d.line((x-70*s,y+(yy+12+j*13)*s,x+44*s,y+(yy+12+j*13)*s),fill='#a66e5c',width=max(1,int(3*s)))
    if kind in ('chat','response'):
        bubble(35,'#e1d5b6',140);bubble(85,'#d2e5dd',170)
    if kind=='draft':
        box(d,(x-86*s,y+107*s,x+82*s,y+143*s),6*s,'#e8dabb')
        d.line((x-71*s,y+125*s,x+35*s,y+125*s),fill='#998a6e',width=max(1,int(3*s)))
        d.line((x+47*s,y+115*s,x+47*s,y+134*s),fill=CORAL,width=max(1,int(3*s)))


def sheet(d,x,y,s=1,kind='lines',word=None):
    box(d,(x-87*s,y-105*s,x+87*s,y+105*s),7*s,'#fff8e8','#a78b70',max(2,int(3*s)))
    for j in range(4):
        yy=y+(-53+j*29)*s;d.line((x-61*s,yy,x+(52-j*7)*s,yy),fill='#b3aa95',width=max(1,int(3*s)))
    if kind=='ledger':
        d.line((x,y-72*s,x,y+48*s),fill=TEAL,width=max(1,int(3*s)))
        for j in range(2):d.ellipse((x+25*s,y+(-44+j*31)*s,x+37*s,y+(-32+j*31)*s),fill=CORAL)
    elif kind=='question':center(d,'?',x,y-68*s,int(48*s),CORAL)
    elif kind=='check':
        for j in range(3):d.rectangle((x-67*s,y+(-60+j*29)*s,x-56*s,y+(-49+j*29)*s),outline=TEAL,width=max(1,int(2*s)))
    if word:center(d,word,x,y+65*s,max(13,int(18*s)),INK)


def book(d,x,y,s=1,word='CATATAN'):
    # Spine and facing pages distinguish a bound notebook from a loose sheet.
    box(d,(x-115*s,y-85*s,x+115*s,y+85*s),8*s,'#c98164',INK,max(2,int(4*s)))
    d.polygon([(x-108*s,y-74*s),(x-5*s,y-68*s),(x-5*s,y+72*s),(x-108*s,y+65*s)],fill='#fff8e8')
    d.polygon([(x+5*s,y-68*s),(x+108*s,y-74*s),(x+108*s,y+65*s),(x+5*s,y+72*s)],fill='#fff8e8')
    d.line((x,y-70*s,x,y+72*s),fill=INK,width=max(1,int(3*s)))
    for k in range(3):
        yy=y+(-38+k*27)*s
        d.line((x-92*s,yy,x-24*s,yy),fill='#a7aa96',width=max(1,int(3*s)))
        d.line((x+22*s,yy,x+88*s,yy),fill='#a7aa96',width=max(1,int(3*s)))
    center(d,word,x,y+88*s,max(12,int(16*s)),INK)


def envelope(d,x,y,s=1):
    box(d,(x-108*s,y-65*s,x+108*s,y+65*s),7*s,'#e9c891',INK,max(2,int(4*s)))
    d.line((x-105*s,y-61*s,x,y+8*s,x+105*s,y-61*s),fill='#a77750',width=max(2,int(4*s)))
    label(d,'IURAN',(x-35*s,y+26*s),max(13,int(17*s)),INK)


def fundbox(d,x,y,s=1):
    box(d,(x-105*s,y-62*s,x+105*s,y+86*s),10*s,'#d39a55',INK,max(2,int(5*s)))
    box(d,(x-117*s,y-87*s,x+117*s,y-52*s),7*s,'#e3b06c',INK,max(2,int(4*s)))
    d.line((x-29*s,y-72*s,x+29*s,y-72*s),fill=INK,width=max(2,int(6*s)))
    center(d,'DANA',x,y-18*s,max(14,int(20*s)),INK)


def pencil(d,x,y,s=1,phase=0):
    pts=[(x-8*s,y-80*s),(x+8*s,y-80*s),(x+8*s,y+58*s),(x,y+77*s),(x-8*s,y+58*s)]
    d.polygon(pts,fill=GOLD,outline=INK,width=max(2,int(3*s)))
    d.polygon([(x-8*s,y+58*s),(x+8*s,y+58*s),(x,y+77*s)],fill='#926545')


def magnifier(d,x,y,s=1):
    d.ellipse((x-64*s,y-64*s,x+64*s,y+64*s),fill='#d7e8df',outline=INK,width=max(3,int(11*s)))
    d.line((x+44*s,y+44*s,x+111*s,y+111*s),fill=INK,width=max(3,int(19*s)))
    d.arc((x-46*s,y-46*s,x+45*s,y+45*s),205,270,fill='white',width=max(1,int(5*s)))


def chair(d,x,y,s=1):
    box(d,(x-62*s,y-140*s,x+62*s,y-25*s),12*s,'#cf9b70',INK,max(2,int(4*s)))
    box(d,(x-72*s,y-32*s,x+72*s,y+3*s),7*s,'#a87351',INK,max(2,int(4*s)))
    d.line((x-53*s,y,x-60*s,y+107*s),fill=INK,width=max(2,int(6*s)))
    d.line((x+53*s,y,x+60*s,y+107*s),fill=INK,width=max(2,int(6*s)))


def calendar(d,x,y,s=1,prev=False):
    box(d,(x-94*s,y-101*s,x+94*s,y+101*s),8*s,'#fff8e9',INK,max(2,int(4*s)))
    box(d,(x-94*s,y-101*s,x+94*s,y-60*s),7*s,CORAL)
    center(d,'MINGGU LALU' if prev else 'JIKA BERULANG',x,y-91*s,max(12,int(16*s)),'#fff7e9')
    for row in range(3):
        for col in range(4):
            xx=x+(-64+col*40)*s;yy=y+(-35+row*37)*s
            d.rectangle((xx,yy,xx+18*s,yy+18*s),outline='#a7b5a5',width=max(1,int(2*s)))
    d.line((x-28*s,y+4*s,x-13*s,y+18*s),fill=CORAL,width=max(2,int(4*s)))


def lamp(d,x,y,s=1,on=False):
    d.line((x,y-125*s,x,y-65*s),fill=INK,width=max(2,int(5*s)))
    d.pieslice((x-70*s,y-90*s,x+70*s,y+35*s),180,360,fill=GOLD if on else '#9da9a0',outline=INK,width=max(2,int(4*s)))
    d.ellipse((x-18*s,y+5*s,x+18*s,y+38*s),fill='#e2c78a' if on else '#c0c6b8',outline=INK,width=max(1,int(3*s)))
    if not on:
        d.line((x-50*s,y+75*s,x+54*s,y-8*s),fill=CORAL,width=max(2,int(5*s)))


def stairs_scene(t):
    im=Image.new('RGB',(1000,800),'#c7dad3');d=ImageDraw.Draw(im)
    d.rectangle((0,0,1000,655),fill='#b9d1cb');d.rectangle((0,655,1000,800),fill='#a6bdb2')
    d.polygon([(0,115),(1000,78),(1000,300),(0,340)],fill='#d2ded4')
    for x in (75,780):
        box(d,(x,168,x+152,428),5,'#b87f64',INK,4)
        d.rectangle((x+18,193,x+134,406),fill='#9d6c58');d.ellipse((x+114,287,x+125,298),fill=GOLD)
    # gutter and falling rain, no stock or official logos
    d.line((50,145,930,145),fill='#738e86',width=13)
    d.line((896,148,896,322),fill='#738e86',width=10)
    for i in range(26):
        xx=(i*113+31)%1000;yy=(i*67+int(t*140))%665
        d.line((xx,yy,xx-6,yy+22),fill='#a2c3bd',width=3)
    stair(d,t)
    return im


def scene(mode,sid,t,dur):
    """Draw a story-specific stage with action tied to the scene, not reference footage."""
    p=t*3.0;u=smooth(t/max(.3,dur*.8));
    outdoor={'macro','exterior','descent','slip','memory','stair_far','magnify','inspect','result','descent_message'}
    if mode in outdoor:im=stairs_scene(t)
    else:im=room(t,'bima' if mode in ('reply','replynote') else 'nara')
    d=ImageDraw.Draw(im)
    if mode=='macro':
        # Large angled step, wet surface, sandal; visible from frame zero.
        d.rectangle((0,0,1000,800),fill='#b6d4d0')
        d.polygon([(0,250),(1000,145),(1000,450),(0,540)],fill='#77938d',outline=INK,width=7)
        d.polygon([(0,530),(1000,450),(1000,800),(0,800)],fill='#506f6c')
        d.ellipse((178,337,702,416),fill='#95cfcb');d.arc((238,348,651,405),185,340,fill='#e7f5e6',width=5)
        dx=lerp(0,130,u);sandal(d,725-dx,324,1.15)
        d.line((829-dx,294,968-dx,201),fill='#c18c71',width=64)
        d.arc((170,290,718,440),190,325,fill='#73b1ad',width=3)
    elif mode=='exterior':
        d.ellipse((476,130,618,205),fill='#d9e7df')
        d.ellipse((516,108,657,196),fill='#d9e7df')
        # building, gutter and stairs already visible and moving rain
    elif mode in ('descent','descent_message'):
        actor(d,'neighbor',565,475,.67,p,'worried',target=(620,280))
        sandal(d,495-50*u,491,.38)
        if mode=='descent_message':phone(d,770,492,.75,'draft',u)
    elif mode in ('slip','memory'):
        # A foot moves sideways, and a hand remains on the handrail.
        sandal(d,477-110*u,534,1.0)
        d.line((571,370,501-100*u,514),fill='#bb876e',width=76)
        d.line((776,180,640,245),fill=INK,width=17)
        d.line((843,143,700,212),fill=SKIN_E,width=37)
        d.ellipse((674,200,718,243),fill=SKIN_E,outline=INK,width=4)
        for off in (0,30,60):d.line((310+off,550,335+off,565),fill='#e7f6ed',width=5)
        if mode=='memory':box(d,(105,110,420,160),12,'#f7eedb');center(d,'NYARIS JATUH',260,118,21,TEAL)
    elif mode=='phone':
        table(d);phone(d,550,410,1.22,'draft',u);pencil(d,776,510,.7)
        # Nara's finger points to an unanswered draft.
        d.line((244,590,407,485),fill=SKIN_N,width=66)
        d.ellipse((389,460,441,512),fill=SKIN_N,outline=INK,width=4)
    elif mode=='introduce':
        actor(d,'nara',340,701,1.15,p,'worried',target=(570,465));phone(d,620,455,.74,'blank')
        box(d,(487,214,794,270),12,'#fff8e8',INK,3);center(d,'NARA',638,221,31,CORAL)
        sheet(d,796,535,.5,'lines')
    elif mode in ('compose','redraft','message_dues','message_stair','draft'):
        actor(d,'nara',245,705,.84,p,'worried',target=(494,475));table(d)
        phone(d,530,407,1.10,'draft' if mode in ('compose','draft','redraft') else 'response',u)
        if mode in ('compose','message_stair'):
            # Small clear inset of the actual wet stair, not an app logo.
            box(d,(686,335,925,547),14,'#c5ded5',INK,4)
            d.polygon([(710,516),(710,464),(764,464),(764,416),(820,416),(820,368),(897,368),(897,516)],fill='#76948c',outline=INK,width=4)
            d.ellipse((727,455,771,465),fill='#8bc7c3')
        elif mode=='message_dues':sheet(d,797,487,.72,'ledger')
        else:pencil(d,789,503,.72,p)
        if mode=='redraft':d.line((464,539,593,539),fill=CORAL,width=5)
    elif mode in ('reply','replynote'):
        actor(d,'bima',280,705,1.0,p,'neutral',target=(523,461));table(d)
        phone(d,565,420,.95,'reply',u)
        box(d,(752,471,855,568),9,'#d7a26e',INK,4);d.arc((836,486,882,550),270,90,fill=INK,width=6)
        if mode=='replynote':sheet(d,777,455,.72,'ledger')
    elif mode=='group':
        table(d);phone(d,430,400,.94,'chat',u);sheet(d,750,473,.8,'ledger')
        for i,(x,c) in enumerate([(240,'#d1997d'),(650,'#c58e73'),(823,'#b57d64')]):
            d.ellipse((x-30,175,x+30,235),fill=c,outline=INK,width=3)
            box(d,(x-50,249,x+50,282),12,'#f7eedb',INK,2)
            d.line((x-31,266,x+31,266),fill=CORAL,width=3)
    elif mode=='drift':
        # Bird's-eye layout: one stairs note drifts down as dues notes rise.
        d.rectangle((0,0,1000,800),fill='#c1d8d0')
        phone(d,492,405,1.26,'chat',u)
        sheet(d,195,462+65*u,.72,'lines','TANGGA')
        # Tiny concrete stair sketch on the displaced note, not just a label.
        yy=462+65*u
        d.line((161,yy+24,161,yy+9,177,yy+9,177,yy-7,194,yy-7,194,yy-24,216,yy-24),fill=TEAL,width=4)
        sheet(d,791,459-45*u,.72,'ledger','IURAN')
        d.line((252,457,335,479),fill=CORAL,width=7)
    elif mode=='split':
        d.rectangle((0,0,500,800),fill='#e9dac3');d.rectangle((500,0,1000,800),fill='#b9d4cd')
        phone(d,261,402,1.0,'chat',u)
        d.polygon([(540,650),(540,560),(642,560),(642,480),(744,480),(744,400),(858,400),(858,320),(945,320),(945,650)],fill='#6e8f87',outline=INK,width=6)
        d.ellipse((745,469,832,485),fill='#9ed3cf');center(d,'?',764,215,78,CORAL)
    elif mode in ('shame','feel','hesitate','quiet'):
        chair(d,272,601,.90);actor(d,'nara',281,704,1.0,p,'sad',target=(490,505));table(d)
        phone(d,548,449,.78,'chat' if mode in ('shame','feel') else 'draft',u)
        if mode=='hesitate':sheet(d,775,478,.72,'lines','PERINGATAN')
        elif mode=='quiet':book(d,775,478,.70)
        else:envelope(d,780,519,.72)
        if mode=='hesitate':
            # The hand stops short of the warning note, not a guaranteed reaction.
            d.arc((397,300,676,525),210,285,fill=CORAL,width=5)
    elif mode in ('calendar','pattern'):
        calendar(d,328,393,1.22,mode=='calendar');phone(d,699,425,.95,'chat',u)
        if mode=='pattern':
            box(d,(243,590,781,650),10,'#fff8e8',INK,3);center(d,'PERILAKU MERENDAHKAN',512,607,22,CORAL)
    elif mode=='lamp':
        d.rectangle((0,0,1000,800),fill='#748f88')
        box(d,(95,110,361,630),8,'#9ab3a6',INK,5);box(d,(603,124,918,625),8,'#9ab3a6',INK,5)
        lamp(d,405,261,1.35,False);phone(d,742,432,.95,'reply',u)
        box(d,(142,171,309,221),9,'#fff3dc');center(d,'MINGGU LALU',225,180,20,CORAL)
        box(d,(458,320,512,393),5,'#e8ddc5',INK,3);d.line((484,330,484,356),fill=INK,width=5)
    elif mode in ('ledger','ledger_mark','envelope','cost'):
        table(d)
        if mode in ('ledger','ledger_mark'):
            sheet(d,481,404,1.5,'ledger','IURAN');pencil(d,724,481,.95,p)
            if mode=='ledger_mark':
                d.line((460,431,479,451,516,410),fill=CORAL,width=8)
        elif mode=='envelope':
            envelope(d,435,437,1.35);sheet(d,742,423,1.0,'ledger')
        else:
            fundbox(d,412,455,1.27);sheet(d,712,408,1.12,'check','BIAYA')
            d.ellipse((602,562,648,588),fill=GOLD,outline=INK,width=3)
    elif mode=='stair_far':
        actor(d,'nara',824,590,.58,p,'sad');sandal(d,650,431,.35)
    elif mode in ('compare','compare_coin'):
        d.rectangle((0,0,500,800),fill='#f0dfc8');d.rectangle((500,0,1000,800),fill='#c3ddd4')
        sheet(d,250,410,1.25,'ledger','IURAN')
        if mode=='compare_coin':
            for i in range(3):d.ellipse((310+i*30,548,349+i*30,571),fill=GOLD,outline=INK,width=3)
        d.polygon([(555,592),(555,530),(633,530),(633,467),(712,467),(712,405),(804,405),(804,342),(914,342),(914,592)],fill='#73968c',outline=INK,width=5)
        d.ellipse((705,458,805,474),fill='#a4d8d3')
        # Draw the not-equal sign as geometry; the bundled Latin font lacks it.
        d.line((471,351,527,351),fill=CORAL,width=9);d.line((471,380,527,380),fill=CORAL,width=9)
        d.line((483,398,519,333),fill=CORAL,width=7)
    elif mode=='magnify':
        magnifier(d,445+75*u,460,1.42);sheet(d,795,491,.72,'check')
    elif mode=='term':
        phone(d,280,428,.95,'reply',u)
        box(d,(465,262,890,465),20,'#fff8e8',INK,5)
        center(d,'AD HOMINEM',677,305,45,TEAL)
        center(d,'ORANGNYA',677,371,26,CORAL)
        center(d,'BUKAN USULNYA',677,411,23,INK)
        d.line((373,449,453,414),fill=CORAL,width=7)
    elif mode=='chairs':
        chair(d,265,599,.95);chair(d,738,599,.95);table(d)
        book(d,510,465,.70)
        actor(d,'nara',252,703,.63,p,'sad');actor(d,'bima',742,703,.63,p,'neutral')
    elif mode in ('proposal','alternatives','decision','report','roles'):
        table(d)
        if mode=='proposal':sheet(d,458,420,1.33,'question','USUL');pencil(d,739,475,.9,p)
        elif mode=='alternatives':
            sheet(d,707,416,1.18,'check','PILIHAN');sandal(d,320,496,.82)
            d.line((385,427,528,393),fill=TEAL,width=6)
        elif mode=='decision':sheet(d,469,416,1.28,'check','KEPUTUSAN');pencil(d,696,462,.85,p)
        elif mode=='report':
            sheet(d,353,414,1.20,'check','LAPORAN');book(d,698,422,1.0,'PENGALAMAN')
        else:
            sheet(d,411,411,1.2,'check','PERAN');fundbox(d,728,476,1.15)
            d.line((276,545,340,494),fill=SKIN_N,width=39)
    elif mode in ('possible','inspect'):
        if mode=='possible':
            # A hypothetical insert; no result is claimed at this point.
            box(d,(132,112,864,670),28,'#e9efe2',INK,4)
            box(d,(167,137,405,178),9,'#fff8e8');center(d,'KEMUNGKINAN',286,145,20,TEAL)
        actor(d,'inspector',380,707,.90,p,'neutral',target=(572,490))
        sheet(d,624,430,.82,'check');box(d,(750,514,920,600),10,'#b88861',INK,4)
        d.line((775,509,890,509),fill=INK,width=7)
        if mode=='inspect':
            d.line((657,345,892,265),fill=INK,width=12)
            box(d,(624,128,881,251),9,'#e9dcc3',INK,4)
            center(d,'PEMERIKSAAN',752,150,20,TEAL)
            d.line((651,196,851,196),fill='#aa9e84',width=4)
    elif mode=='mirror':
        d.rectangle((0,0,1000,800),fill='#d8e1d6')
        box(d,(331,132,665,610),95,'#a9c9c4',INK,9)
        actor(d,'nara',210,695,.78,p,'worried',target=(356,470))
        actor(d,'bima',789,695,.78,p,'neutral',target=(674,465))
        chair(d,372,590,.60);chair(d,631,590,.60)
        fundbox(d,502,482,.55)
        d.arc((314,225,688,570),210,329,fill=CORAL,width=9)
        d.polygon([(638,245),(691,248),(663,288)],fill=CORAL)
    elif mode in ('funds_offer','funds_hurt','funds_question'):
        actor(d,'bima',215,708,.86,p,'neutral',target=(432,507))
        actor(d,'nara',779,708,.86,p,'worried',target_left=(602,500))
        table(d);fundbox(d,497,500,1.0)
        if mode=='funds_offer':sheet(d,731,455,.63,'ledger','KAS')
        elif mode=='funds_hurt':sheet(d,701,449,.65,'lines','PENGELOLA')
        else:
            book(d,705,448,.60,'LAPORAN');envelope(d,788,555,.42);center(d,'?',500,190,75,CORAL)
    elif mode=='result':
        sheet(d,662,409,1.13,'check','HASIL')
        box(d,(250,155,777,228),12,'#fff8e8',INK,3);center(d,'LICIN SAAT BASAH',512,172,29,TEAL)
        magnifier(d,310,465,.75)
    elif mode=='two_issues':
        d.rectangle((0,0,500,800),fill='#f0dfc8');d.rectangle((500,0,1000,800),fill='#c3ddd4')
        envelope(d,254,466,1.2)
        d.polygon([(545,617),(545,540),(645,540),(645,465),(745,465),(745,390),(855,390),(855,321),(934,321),(934,617)],fill='#78958b',outline=INK,width=5)
        d.ellipse((745,457,843,473),fill='#a4d8d3')
    elif mode in ('two_cards','empty_chair'):
        chair(d,501,413,1.04);table(d)
        sheet(d,309,460,.80,'ledger','IURAN');sheet(d,694,460,.80,'lines','TANGGA')
        if mode=='two_cards':envelope(d,500,540,.55)
    else:raise ValueError('Unknown story recipe '+mode)
    return im


def render_frame(edition, scene_info, elapsed, duration, cue=None):
    """Purposeful illustrated staging, safe labels/subtitles, no fade from frame 0."""
    W,H=OUT_SIZES[edition];portrait=edition!='master'
    mode,headline=RECIPES[scene_info['id']]
    raw=scene(mode,scene_info['id'],elapsed,duration)
    bg=Image.new('RGB',(W,H),'#f5e9d6');d=ImageDraw.Draw(bg)
    d.rectangle((0,0,11,H),fill=CORAL)
    if portrait:
        # Center crop keeps the two subjects and objects large in the mobile feed.
        art=raw.crop((100,0,900,800)).resize((720,720),Image.Resampling.BILINEAR)
        bg.paste(art,(0,193)); badge=(42,38,222,76);headline_x=45;headline_y=93;headline_w=630;sub_y=1000;sub_w=610;sub_size=36
        # One-line contextual banner, not a persistent large slide headline.
        text=' / '.join(headline.split('\n'))
        d=ImageDraw.Draw(bg);ft=font(32)
        while d.textlength(text,font=ft)>headline_w and ft.size>24:ft=font(ft.size-1)
        d.text((headline_x,headline_y),text,font=ft,fill=INK)
    else:
        art=raw.resize((880,704),Image.Resampling.BILINEAR)
        bg.paste(art,(390,16));badge=(42,34,216,71);headline_x=48;headline_y=185;headline_w=324;sub_y=616;sub_w=1030;sub_size=30
        d=ImageDraw.Draw(bg);fs=43 if len(headline)<25 else 36;ft=font(fs)
        lines=bag.wrap_width(d,headline,ft,headline_w)
        while (any(d.textlength(x,font=ft)>headline_w for x in lines) or len(lines)>3) and fs>26:
            fs-=1;ft=font(fs);lines=bag.wrap_width(d,headline,ft,headline_w)
        for i,line in enumerate(lines):d.text((headline_x,headline_y+i*int(fs*1.16)),line,font=ft,fill=INK)
        d.rounded_rectangle((headline_x,headline_y+len(lines)*int(fs*1.16)+18,headline_x+76,headline_y+len(lines)*int(fs*1.16)+24),radius=3,fill=CORAL)
    d=ImageDraw.Draw(bg,'RGBA');box(d,badge,8,INK)
    d.text((badge[0]+11,badge[1]+7),'CERITA FIKTIF',font=font(18 if portrait else 17),fill=CREAM)
    d.text((W-181 if portrait else W-180,47 if portrait else 43),'DRAF PRIVAT',font=font(16),fill=INK)
    if cue:
        ft=font(sub_size);rows=bag.wrap_width(d,cue['text'],ft,sub_w-48)
        while len(rows)>2 and sub_size>25:
            sub_size-=1;ft=font(sub_size);rows=bag.wrap_width(d,cue['text'],ft,sub_w-48)
        if len(rows)>2:raise ValueError('Subtitle overflow: '+cue['text'])
        lh=int(sub_size*1.20);bh=len(rows)*lh+28;top=int(sub_y-bh/2)
        box(d,((W-sub_w)/2,top,(W+sub_w)/2,top+bh),13,(19,51,51,240))
        for i,row in enumerate(rows):d.text(((W-d.textlength(row,font=ft))/2,top+10+i*lh),row,font=ft,fill='#fffaf0')
    return bg.convert('RGB')

bag.stage_frame=scene
bag.render_frame=render_frame


def encode(edition,timeline,cues,work,out):
    W,H=OUT_SIZES[edition];total=timeline['duration'];n=math.ceil(total*DRAW_FPS)
    silent=work/f'{edition}-silent.mp4'
    command=[rough.FF,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}',
             '-r',str(DRAW_FPS),'-i','pipe:0','-an','-r',str(FPS),'-c:v','libx264','-preset','veryfast',
             '-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(silent)]
    proc=subprocess.Popen(command,stdin=subprocess.PIPE);scenes=timeline['scenes'];si=0;last=''
    try:
        for i in range(n):
            t=i/DRAW_FPS
            while si+1<len(scenes) and t>=scenes[si]['end']:si+=1
            entry=scenes[si]
            if entry['id']!=last:
                print(f'{edition} {entry["id"]}: {t:.2f}/{total:.2f}s',flush=True);last=entry['id']
            frame=render_frame(edition,entry,t-entry['start'],entry['end']-entry['start'],bag.choose_cue(cues,t))
            proc.stdin.write(frame.tobytes())
        proc.stdin.close();code=proc.wait()
        if code:raise RuntimeError(f'ffmpeg video encode exited {code}')
    except BaseException:
        try:proc.stdin.close()
        except Exception:pass
        proc.terminate();proc.wait();raise
    music=work/f'{edition}-music.wav';rough.synth_score(music,total)
    source='master' if edition=='master-vertical' else edition
    voice=work/'timing'/f'{source}-narration.wav'
    command=[rough.FF,'-y','-loglevel','error','-i',str(silent),'-i',str(voice),'-i',str(music),
             '-filter_complex','[1:a]volume=1.0[voice];[2:a]volume=0.7[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[a]',
             '-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','160k','-movflags','+faststart','-shortest',str(out)]
    subprocess.run(command,check=True)
    print(f'{edition} COMPLETE {out}',flush=True)


def poster(root):
    """Independent designed key art—not a grabbed frame from any video."""
    for kind,(w,h) in [('thumbnail-master',(1280,720)),('thumbnail-short',(720,1280)),('poster-4x5',(864,1080))]:
        im=Image.new('RGB',(w,h),'#f2e2c9');d=ImageDraw.Draw(im)
        d.rectangle((0,0,13,h),fill=CORAL)
        # Custom poster illustration, staged separately from every video scene.
        if kind=='thumbnail-master':
            panel=(580,90,1250,710);xoff,yoff,scale=580,110,.67;tx,ty,fs=52,145,65;maxw=500
        else:
            panel=(20,int(h*.40),w-20,int(h*.88));xoff,yoff,scale=22,int(h*.40),.68*w/720;tx,ty,fs=int(w*.07),int(h*.13),int(w*.075);maxw=int(w*.86)
        box(d,panel,25,'#bcd6d0')
        # Draw illustration on an independent poster stage.
        art=Image.new('RGB',(1000,800),'#c3d9d2');ad=ImageDraw.Draw(art)
        ad.polygon([(0,0),(1000,0),(1000,800),(0,800)],fill='#c3d9d2');stair(ad)
        actor(ad,'nara',238,700,1.16,1.2,'worried',target=(465,510))
        phone(ad,507,435,.80,'reply',1);sandal(ad,715,431,.50)
        ad.line((518,202,714,148),fill=CORAL,width=12);ad.polygon([(693,134),(734,144),(711,178)],fill=CORAL)
        if kind=='thumbnail-master':art=art.resize((660,528),Image.Resampling.LANCZOS);im.paste(art,(590,163))
        else:
            ay=int(h*.44);scale=min((w-40)/1000,(h-ay-24)/800)
            aw=int(1000*scale);ah=int(800*scale)
            art=art.resize((aw,ah),Image.Resampling.LANCZOS);im.paste(art,((w-aw)//2,ay))
        d=ImageDraw.Draw(im);box(d,(tx,36,tx+191,76),9,INK);d.text((tx+12,45),'CERITA FIKTIF',font=font(18),fill=CREAM)
        headline='NIAT BAIK,\nMALAH DISERANG'
        ft=font(fs);lines=bag.wrap_width(d,headline,ft,maxw)
        while any(d.textlength(line,font=ft)>maxw for line in lines) and fs>27:
            fs-=1;ft=font(fs);lines=bag.wrap_width(d,headline,ft,maxw)
        for i,line in enumerate(lines):d.text((tx,ty+i*int(fs*1.13)),line,font=ft,fill=INK)
        d.text((tx,ty+len(lines)*int(fs*1.13)+20),'Tangganya tetap licin.',font=font(int(fs*.42)),fill=CORAL)
        im.save(root/f'{kind}.png',optimize=True)


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--private-rough',action='store_true')
    ap.add_argument('--voice-dir',type=Path,required=True);ap.add_argument('--work-dir',type=Path,required=True);ap.add_argument('--out-dir',type=Path,required=True)
    ap.add_argument('--edition',choices=['master','master-vertical','short','all'],default='all');ap.add_argument('--plan-only',action='store_true')
    a=ap.parse_args()
    if not a.private_rough:ap.error('Explicit --private-rough is required')
    rough.validate_mode(True,a.out_dir);rough.validate_mode(True,a.work_dir)
    manifest=json.loads((a.voice_dir/'voice-manifest.json').read_text(encoding='utf-8'))
    editions=['master','master-vertical','short'] if a.edition=='all' else [a.edition]
    required=list(dict.fromkeys('master' if e=='master-vertical' else e for e in editions))
    bag.validate(a.voice_dir,manifest,required);rough.mechanical_gates()
    a.work_dir.mkdir(parents=True,exist_ok=True);a.out_dir.mkdir(parents=True,exist_ok=True)
    tdir=a.work_dir/'timing';tdir.mkdir(exist_ok=True)
    for edition in editions:
        tl,cues=bag.make_plan(edition,manifest,a.voice_dir,tdir)
        bag.contact(edition,tl,cues,a.out_dir)
        if not a.plan_only:encode(edition,tl,cues,a.work_dir,a.out_dir/f'{edition}-DRAF-PRIVAT.mp4')
    poster(a.out_dir)
    print('PRIVATE ROUGH ONLY: estimated timing; human, rights, disclosure and release gates remain open.',flush=True)

if __name__=='__main__':main()
