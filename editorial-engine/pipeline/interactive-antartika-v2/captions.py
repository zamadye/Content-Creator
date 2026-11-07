#!/usr/bin/env python3
"""Local platform captions; no publishing or posting side effects."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]
d=json.loads((ROOT/'content/recovered/antartika-revisi-interaktif.json').read_text(encoding='utf8'))
out=ROOT/'deliverables/interactive-revision-2026-11-11/antartika/caption-4-platform.txt'
refs='\n'.join(x['url'] for x in d['sources'])
body='Antartika hampir seluruhnya tertutup es, tetapi termasuk gurun karena presipitasi yang rendah. Salju yang bertahan dapat tertimbun dan memadat menjadi es selama waktu yang sangat lama. Kondisi pesisir dan pedalaman bisa berbeda.'
question='Kamu lebih kaget dengan esnya atau fakta gurunnya?'
tags='#Antartika #FaktaSains #GurunDingin #DuniaKebalik #KnotTheory'
sections=[
 ('FACEBOOK REELS',f'Antartika itu gurun? ❄️\n\n{body}\n\n{question} Tulis di komentar dan ikuti knot theory.\n\nSumber:\n{refs}\n\n{tags}'),
 ('TIKTOK',f'Gurun yang penuh es? 🤯\n\n{body}\n\n{question} Komentar dan ikuti knot theory!\n\n{tags} #FaktaUnik\nSumber:\n{refs}'),
 ('YOUTUBE SHORTS',f'Judul: Antartika Itu Gurun? #Shorts\n\nDeskripsi:\n{body}\n\n{question} Tulis di komentar dan ikuti knot theory.\n\nSumber:\n{refs}\n\n{tags} #Shorts'),
 ('INSTAGRAM REELS',f'Antartika: es luas, tapi gurun dingin ❄️\n\n{body}\n\n{question} Ceritakan di komentar dan ikuti knot theory.\n\n{tags} #FaktaUnik\n\nSumber:\n{refs}'),
]
out.write_text('\n\n'.join(f'======== {name} ========\n{copy}' for name,copy in sections)+'\n',encoding='utf8')
print(out)
