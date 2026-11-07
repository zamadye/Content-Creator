#!/usr/bin/env python3
"""Generate platform text and a readable storyboard from the private local spec."""
import json
from pathlib import Path
R=Path.cwd(); D=R/'deliverables/awan-rig-v2'; spec=json.loads((R/'content/recovered/awan-500-ton-rig-v2.json').read_text()); prep=json.loads((D/'prepared.json').read_text())
captions='''FACEBOOK REELS
500 ton air bisa melayang di langit? ☁️

Itu hasil perkiraan massa air dalam satu contoh awan, bukan berat semua awan. Rahasianya bukan tangki terbang: ada banyak tetesan kecil dan udara yang terus bergerak.

Sebelumnya kamu membayangkan awan seperti apa? Ceritakan di komentar, dan ikuti knot theory untuk cerita dunia yang terasa kebalik.

#KnotTheory #DuniaKebalik #Awan #Sains #FaktaMenarik

====================
TIKTOK
Awan bukan tangki terbang ☁️ Contoh 500 ton ini menghitung air pada satu awan imajiner, bukan semua awan. Kok bisa tetap melayang? Tonton sampai akhir, lalu ceritakan bayangan awanmu di komentar!

#KnotTheory #DuniaKebalik #Awan #BelajarDiTikTok #Sains

====================
YOUTUBE SHORTS
Judul: 500 Ton Air di Langit? Kok Bisa Melayang? ☁️

Sebuah contoh perhitungan USGS memperkirakan massa air awan sekitar 500 ton metrik. Itu bukan massa semua awan, dan bukan massa udaranya. Di balik angkanya ada tetesan kecil, gravitasi, dan udara yang bergerak naik.

Kamu sebelumnya membayangkan awan seperti apa? Tulis di komentar dan ikuti knot theory.

Sumber: https://www.usgs.gov/water-science-school/science/how-much-does-a-cloud-weigh
https://www.noaa.gov/jetstream/atmosphere/precipitation

#Shorts #KnotTheory #DuniaKebalik #Awan #Sains

====================
INSTAGRAM REELS
500 ton air di langit—tapi bukan satu tangki terbang. ☁️

Angka ini berasal dari satu contoh perhitungan air dalam awan. Tetesnya kecil, gravitasi tetap bekerja, dan arus udara bisa membawa sebagian tetes naik.

Kalau kamu membayangkan awan seperti apa sebelumnya? Tulis di komentar dan ikuti knot theory.

#KnotTheory #DuniaKebalik #Awan #Sains #FaktaMenarik #ReelsIndonesia
'''
(D/'caption-empat-platform.txt').write_text(captions,encoding='utf-8')
lines=['# Storyboard — Awan bukan tangki terbang, revisi rig V2','',f'Durasi: {prep["duration"]:.1f} detik; {prep["fps"]} fps. Satu rekaman narasi dan satu timeline untuk visual, subtitle, dan audio.','',
'Hook: “500 ton air?” menjadi pertanyaan sejak frame 0; ini satu contoh massa air, bukan semua awan.','',
'**Catatan:** waktu subtitle mendekati jeda dan pemisahan dalam kalimat masih estimasi, bukan forced alignment. Dialog, pengucapan, dan timing perlu didengarkan manusia.','']
for scene,t in zip(spec['scenes'],prep['timeline']):
 lines += [f'## {scene["id"]} · {t["start"]:.2f}–{t["end"]:.2f} dtk · {scene["beat"]}',f'**Narasi:** {scene["narration"]}',f'**Aksi:** {scene["action"]}',f'**Objek:** {", ".join(scene["objectMap"])}','']
lines+=['## Verifikasi fakta','- 1 km³ × 0,5 g/m³ = 500.000 kg = 500 ton metrik air dalam contoh USGS; tidak termasuk massa udara dan tidak berlaku untuk seluruh awan.','- Tetesan kecil mengalami gravitasi; di udara tenang bisa turun perlahan, dan udara yang naik dapat membawanya.','- Hujan hangat dapat terjadi ketika tetes bergabung dan membesar; tidak semua awan menghasilkan hujan.','', '## Sumber']
for src in spec['sources']:lines.append(f"- {src['label']}: {src['url']} — {src['supports']}")
lines+=['','**Status:** draft privat, belum dijadwalkan/dipublikasikan. Skema, perbesaran, kipas model, dan analogi tangki bukan pengukuran langsung.','']
(D/'storyboard-rig-v2.md').write_text('\n'.join(lines),encoding='utf-8')
print('Wrote captions and storyboard to',D)
