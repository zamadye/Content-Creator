#!/usr/bin/env python3
"""Generate four paste-ready captions without making external requests."""
from pathlib import Path
D=Path(__file__).resolve().parents[2]/'deliverables/awan-500-ton-2026'
sections={
'FACEBOOK REELS': '''Awan yang terlihat ringan bisa menyimpan ratusan ton air? ☁️

USGS memberi contoh hitungan: awan kumulus berukuran 1 km³ dengan kadar air 0,5 gram per m³ mengandung sekitar 500.000 kg air. Itu perkiraan untuk contoh tersebut, bukan berat semua awan, dan tidak menghitung udara.

Airnya tersebar sebagai tetesan kecil. Arus udara yang naik bisa membantu mempertahankannya di awan; ketika sebagian tetes bertemu dan membesar, mereka bisa jatuh sebagai hujan.

Kamu sering melihat awan berbentuk apa? Ceritakan di komentar, dan ikuti knot theory!

Sumber: https://www.usgs.gov/water-science-school/science/how-much-does-a-cloud-weigh dan https://doi.org/10.1002/qj.3042

#KnotTheory #DuniaKebalik #Awan #Sains #FaktaUnik''',
'TIKTOK': '''Awan bisa menyimpan ratusan ton air? ☁️ Ini contoh hitungan USGS, bukan berat semua awan: tetesan air kecil tersebar di udara, dan arus naik bisa membantu menahannya.

Kalau lihat awan, kamu sering menemukan bentuk apa? Komentar, dan ikuti knot theory!

#KnotTheory #DuniaKebalik #Awan #Sains #BelajarDiTikTok''',
'YOUTUBE SHORTS': '''Judul: Awan Bisa Menyimpan 500 Ton Air? Kok Tidak Langsung Jatuh?

Deskripsi:
USGS memberi contoh awan kumulus hipotetis berukuran 1 km³ yang mengandung 0,5 gram air per m³. Hasilnya sekitar 500.000 kilogram atau 500 ton air. Ini perkiraan untuk contoh tersebut, bukan massa semua awan, dan tidak menghitung udara.

Tetesan kecil turun pelan relatif terhadap udara tenang; arus naik dapat membantu mempertahankannya. Di beberapa awan tetesan bertemu, membesar, dan sebagian bisa jatuh sebagai hujan.

Kamu sering melihat awan berbentuk apa? Tulis di komentar, dan ikuti knot theory!

Sumber:
USGS: https://www.usgs.gov/water-science-school/science/how-much-does-a-cloud-weigh
Takahashi dkk. (2017): https://doi.org/10.1002/qj.3042
NASA/JPL: https://www.jpl.nasa.gov/news/nasa-solves-a-drizzle-riddle/

#Shorts #KnotTheory #DuniaKebalik #Awan #Sains''',
'INSTAGRAM REELS': '''☁️ Awan yang tampak ringan bisa menyimpan ratusan ton air.

Dalam satu contoh hitungan USGS, awan kumulus 1 km³ dengan 0,5 gram air per m³ mengandung sekitar 500 ton air. Bukan berarti semua awan seberat itu: ukuran dan kandungan airnya berbeda-beda.

Tetesan kecil tersebar di udara. Saat sebagian bergabung dan membesar, mereka bisa turun sebagai hujan.

Pernah melihat awan mirip benda atau hewan apa? Ceritakan di komentar, dan ikuti knot theory!

#KnotTheory #DuniaKebalik #Awan #FaktaUnik #Sains'''
}
D.mkdir(parents=True,exist_ok=True)
(D/'caption-4-platform.txt').write_text(''.join(f'======== {k} ========\n{v}\n\n' for k,v in sections.items()),encoding='utf8')
print(D/'caption-4-platform.txt')
