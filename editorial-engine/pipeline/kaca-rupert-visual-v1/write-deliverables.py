#!/usr/bin/env python3
"""Write the private captions and storyboard from the locked story and clock."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'deliverables/kaca-rupert-visual-v1'
spec=json.loads((R/'content/recovered/kaca-pangeran-rupert-visual-v1.json').read_text(encoding='utf-8'));prep=json.loads((D/'prepared.json').read_text(encoding='utf-8'))
text='''FACEBOOK REELS
Palu kecil bisa kalah sama kaca? 🔨

Kepala tetes Pangeran Rupert bisa menahan pukulan tertentu, tetapi patahnya ekor dapat membuat seluruh tetes hancur. Rahasianya ada pada tegangan tekan di permukaan dan tegangan tarik di bagian dalam.

Ini ilustrasi percobaan terkendali, bukan ajakan mencoba. Kamu lebih kaget bagian kepala atau ekornya? Tulis di komentar dan ikuti knot theory.

#KnotTheory #DuniaKebalik #Sains #KacaRupert #FaktaMenarik

====================
TIKTOK
Kepalanya bisa tahan palu kecil, tapi ekornya bisa jadi awal kehancuran. Kok bisa? 🔨 Ini tetes Pangeran Rupert—bukan kaca yang kebal semua pukulan. Ilustrasi saja, jangan ditiru. Kamu tim kepala atau ekor? Ikuti knot theory.

#KnotTheory #DuniaKebalik #Sains #KacaRupert #BelajarDiTikTok

====================
YOUTUBE SHORTS
Judul: Kaca Tahan Palu Kecil, Tapi Hancur dari Ekornya?

Tetes Pangeran Rupert punya kepala yang dapat menahan pukulan tertentu. Tetapi bila ekornya patah, retakan dapat menjalar hingga seluruh tetes hancur. Tegangan tekan pada permukaan membantu menahan retakan, sementara bagian dalam berada dalam tegangan tarik.

Visual adalah ilustrasi, bukan demonstrasi untuk ditiru. Kamu lebih kaget bagian kepala atau ekornya? Ceritakan di komentar dan ikuti knot theory.

Sumber: https://doi.org/10.1063/1.4971339
https://www.purdue.edu/research/features/stories/a-hammer-cant-break-this-tadpole-shaped-glass/

#Shorts #KnotTheory #DuniaKebalik #Sains #KacaRupert

====================
INSTAGRAM REELS
Satu kaca, dua sifat yang terasa bertolak belakang. 🔨

Kepala tetes Pangeran Rupert dapat menahan pukulan tertentu. Tapi patahnya ekor bisa memicu retakan yang menghancurkan seluruh tetes. Kuncinya ada pada tegangan yang tersimpan di dalam kaca.

Ilustrasi percobaan terkendali—jangan ditiru. Kamu lebih kaget bagian kepala atau ekornya? Tulis di komentar dan ikuti knot theory.

#KnotTheory #DuniaKebalik #Sains #KacaRupert #ReelsIndonesia
'''
(D/'caption-empat-platform.txt').write_text(text,encoding='utf-8')
lines=['# Storyboard dan sumber — Kaca Pangeran Rupert','',f'{prep["duration"]:.2f} detik, {prep["fps"]} fps. Draft privat, belum disetujui untuk publikasi.','','## Metode visual',spec['visualMethod'],'',spec['opening'],'',f'**Timing:** {prep["timingNote"]}','','## Adegan']
for s,t in zip(spec['scenes'],prep['timeline']):lines += [f'### {s["id"]} · {t["start"]:.2f}–{t["end"]:.2f} detik · {s["beat"]}',f'**Narasi:** {s["narration"]}',f'**Aksi:** {s["action"]}',f'**Objek:** {", ".join(s["objectMap"])}','']
lines+=['## Batas fakta dan keamanan',spec['accuracy'],spec['safety'],'','## Sumber']
for s in spec['sources']:lines.append(f'- {s["id"]}: {s["url"]} — {s["supports"]}')
lines+=['','**Status:** Visual, suara, CTA, gerak penuh, sinkronisasi, hak dan playback perangkat masih perlu pemeriksaan manusia.','']
(D/'storyboard-dan-sumber.md').write_text('\n'.join(lines),encoding='utf-8')
print('Wrote private captions and storyboard:',D)
