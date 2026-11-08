#!/usr/bin/env python3
"""Generate editable text deliverables for the private Awan V3 render."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[2]; D=R/'deliverables/awan-rig-v3'
spec=json.loads((R/'content/recovered/awan-500-ton-rig-v3.json').read_text(encoding='utf-8'))
prep=json.loads((D/'prepared.json').read_text(encoding='utf-8'))
captions='''FACEBOOK REELS
500 ton air melayang di langit? ☁️

Itu perkiraan massa air dalam satu contoh awan, bukan berat semua awan. Airnya tersebar menjadi tetes kecil, dan udara yang bergerak naik dapat membawa sebagian tetes itu.

Sebelumnya kamu membayangkan awan seperti apa? Ceritakan di komentar, dan ikuti knot theory untuk cerita dunia yang terasa kebalik.

#KnotTheory #DuniaKebalik #Awan #Sains #FaktaMenarik

====================
TIKTOK
500 ton air bisa melayang? ☁️ Angka ini berasal dari satu contoh hitungan USGS, bukan semua awan. Coba tebak: kenapa tetes-tetes kecil itu tidak langsung jatuh? Ceritakan bayanganmu di komentar, dan ikuti knot theory.

#KnotTheory #DuniaKebalik #Awan #BelajarDiTikTok #Sains

====================
YOUTUBE SHORTS
Judul: 500 Ton Air di Langit? Kok Bisa Melayang? ☁️

Satu contoh perhitungan USGS memperkirakan massa tetesan air dalam awan sekitar 500 ton metrik. Ini bukan massa semua awan dan tidak termasuk udara. Tetesan kecil tetap mengalami gravitasi, sementara udara yang bergerak naik dapat membawa sebagian tetesan.

Sebelumnya kamu membayangkan awan seperti apa? Ceritakan di komentar dan ikuti knot theory.

Sumber: https://www.usgs.gov/water-science-school/science/how-much-does-a-cloud-weigh
https://www.noaa.gov/jetstream/atmosphere/precipitation
https://psl.noaa.gov/people/matthew.shupe/publications/Shupeetal.JTECH2008.pdf

#Shorts #KnotTheory #DuniaKebalik #Awan #Sains

====================
INSTAGRAM REELS
Awan bukan tangki terbang. ☁️

Perkiraan 500 ton ini menghitung air dalam satu contoh awan. Di dalamnya ada tetesan kecil yang tetap dipengaruhi gravitasi dan dapat terbawa udara yang bergerak naik.

Kalau kamu sebelumnya membayangkan awan seperti apa? Tulis di komentar, dan ikuti knot theory.

#KnotTheory #DuniaKebalik #Awan #Sains #FaktaMenarik #ReelsIndonesia
'''
(D/'caption-empat-platform.txt').write_text(captions,encoding='utf-8')
lines=['# Storyboard — Awan 500 ton, rig V3','',
 f'Durasi {prep["duration"]:.2f} detik; {prep["fps"]} fps; satu timeline. Draft privat, belum disetujui publikasi.', '',
 'Frame 0 menampilkan awan dan awal cuplikan puncak; cut pada frame 89, sekitar 2,97 detik. S04 kembali ke tata letak awan, tangan dan lensa yang sama dan menyelesaikan transformasi.', '',
 f'**Timing:** {prep["timingNote"]}', '']
for s,t in zip(spec['scenes'],prep['timeline']):
 lines += [f'## {s["id"]} · {t["start"]:.2f}–{t["end"]:.2f} detik · {s["beat"]}',f'**Narasi:** {s["narration"]}',f'**Aksi:** {s["action"]}',f'**Objek:** {", ".join(s["objectMap"])}','']
lines += ['## Batas fakta', '- 500 ton metrik adalah perkiraan **air** dalam satu contoh, 1 km³ × 0,5 g/m³. Bukan massa semua awan dan tidak termasuk massa udara.', '- Tetes kecil tetap mengalami gravitasi; sebagian bisa terbawa arus naik. Pada sebagian awan tetes dapat bergabung dan menjadi hujan.', '', '## Sumber']
for s in spec['sources']: lines.append(f'- {s["id"]}: {s["url"]} — {s["supports"]}')
lines += ['', '**Status:** DRAF PRIVAT. Playback penuh, suara/CTA, subtitle, interaksi, perangkat, hak, serta persetujuan publikasi masih memerlukan review manusia.', '']
(D/'storyboard-rig-v3.md').write_text('\n'.join(lines),encoding='utf-8')
print('Wrote 4-platform captions and storyboard:',D)
