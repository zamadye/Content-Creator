#!/usr/bin/env python3
"""Write four paste-ready captions, without posting to any platform."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'deliverables/teleskop-2026-11-12/caption-4-platform.txt'
sections={
'FACEBOOK REELS': '''Lihat ke atas = lihat masa lalu? 🔭✨

Cahaya butuh waktu menempuh jarak. Cahaya Matahari sampai ke Bumi dalam waktu sekitar 8 menit 20 detik. Cahaya galaksi Andromeda yang kita lihat malam ini berangkat sekitar 2,5 juta tahun lalu. Dan James Webb Space Telescope, yang menangkap cahaya inframerah, telah mengonfirmasi galaksi MoM-z14 — kita melihatnya seperti keadaan sekitar 280 juta tahun setelah Big Bang, berdasarkan pengumuman konfirmasi awal 2025 yang dipublikasikan jurnalnya Januari 2026.

Garis waktu tidak berskala; semua visual adalah ilustrasi/skema, bukan foto.

Sumber:
- NASA/JWST (MoM-z14, z=14.44): https://www.jameswebbdiscovery.com/discoveries/james-webb-space-telescope-confirms-mom-z14-farthest-galaxy-ever-seen
- Open Journal of Astrophysics (publikasi Januari 2026): https://www.yahoo.com/news/articles/previously-unimaginable-james-webb-telescope-195514002.html
- Jarak 1 AU dan kecepatan cahaya (≈500 detik): https://www.sciencenewstoday.org/how-long-does-light-take-to-reach-earth

ikuti knot theory 🔭

#KnotTheory #DuniaKebalik #FaktaUnik #Teleskop #Astronomi #Sains''',
'TIKTOK': '''Lihat ke atas = lihat masa lalu? 🔭 Cahaya matahari tiba 8 menit 20 detik kemudian, cahaya Andromeda 2,5 juta tahun kemudian. Semua visual ilustrasi/skema, bukan foto.

Sekarang atau miliaran tahun lalu? Komentar, dan ikuti knot theory!

#KnotTheory #DuniaKebalik #FaktaUnik #Astronomi #Teleskop #BelajarDiTikTok''',
'YOUTUBE SHORTS': '''Judul: Lihat ke Atas, Lihat Masa Lalu? Rahasia Cahaya di Langit Malam

Deskripsi:
Cahaya butuh waktu menempuh jarak. Cahaya Matahari sampai ke Bumi dalam waktu sekitar 8 menit 20 detik. Cahaya galaksi Andromeda berangkat sekitar 2,5 juta tahun lalu. James Webb Space Telescope mengonfirmasi galaksi MoM-z14 (z=14,44) — kita melihatnya seperti keadaan sekitar 280 juta tahun setelah Big Bang; publikasi jurnalnya terbit Januari 2026. Garis waktu tidak berskala; semua visual ilustrasi/skema, bukan foto.

Sumber:
- NASA/JWST — MoM-z14: https://www.jameswebbdiscovery.com/discoveries/james-webb-space-telescope-confirms-mom-z14-farthest-galaxy-ever-seen
- Publikasi Open Journal of Astrophysics: https://www.yahoo.com/news/articles/previously-unimaginable-james-webb-telescope-195514002.html
- 1 AU ≈ 500 detik cahaya: https://www.sciencenewstoday.org/how-long-does-light-take-to-reach-earth

ikuti knot theory 🔭

#Shorts #KnotTheory #DuniaKebalik #Astronomi #Teleskop''',
'INSTAGRAM REELS': '''Malam ini langit mengirimimu foto-foto lama. 🌌✨

Cahaya Matahari butuh sekitar 8 menit 20 detik sampai ke Bumi. Cahaya Andromeda yang tiba malam ini berangkat sekitar 2,5 juta tahun lalu. Dan lewat inframerah, James Webb mengonfirmasi MoM-z14 — tampak seperti sekitar 280 juta tahun setelah Big Bang (publikasi jurnal Januari 2026). Semua visual ilustrasi/skema; garis waktu tidak berskala.

Cahaya apa yang paling membuatmu penasaran? Tulis di komentar, dan ikuti knot theory!

#KnotTheory #DuniaKebalik #FaktaUnik #Astronomi #Sains'''
}
out.write_text(''.join(f'======== {name} ========\n{value}\n\n' for name,value in sections.items()),encoding='utf8')
print(out)
