#!/usr/bin/env python3
"""Write four paste-ready captions, without posting to any platform."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'deliverables/shark-2026-11-07/caption-4-platform.txt'
sections={
'FACEBOOK REELS': '''Hiu lebih tua daripada hutan? 🌊🌳

Sisik hiu yang terkonfirmasi dari Siberia diperkirakan berumur sekitar 420 juta tahun. Jejak hutan fosil di Inggris yang diteliti ilmuwan berumur sekitar 390 juta tahun.

Ini perbandingan dua catatan fosil, bukan umur seekor hiu atau tanggal pasti kemunculan setiap pohon. Temuan baru bisa memperbarui catatan, dan hiu modern terus berevolusi.

Kamu lebih ingin menjelajahi laut purba atau hutan purba? Tulis di komentar, dan ikuti knot theory!

Sumber: Smithsonian Ocean dan Davies dkk., Journal of the Geological Society (2024): https://doi.org/10.1144/jgs2023-204

#KnotTheory #DuniaKebalik #FaktaUnik #Hiu #Fosil #Sains''',
'TIKTOK': '''Hiu sebelum hutan? 🦈🌳 Dua petunjuk fosil punya selisih sekitar 30 juta tahun! Ini catatan yang ditemukan, bukan usia satu hiu—dan bisa berubah jika ada temuan baru.

Tim laut purba atau hutan purba? Komentar, dan ikuti knot theory!

#KnotTheory #DuniaKebalik #FaktaUnik #Hiu #Fosil #BelajarDiTikTok''',
'YOUTUBE SHORTS': '''Judul: Hiu Lebih Tua dari Pohon? Jejak Fosilnya Mengejutkan

Deskripsi:
Sisik hiu yang terkonfirmasi dari Siberia diperkirakan berumur sekitar 420 juta tahun. Penelitian menemukan hutan fosil di Inggris yang berumur sekitar 390 juta tahun. Ini perbandingan dua catatan fosil, bukan usia satu hiu atau tanggal pasti asal setiap pohon. Catatan dapat berubah dengan penemuan baru.

Kamu pilih laut purba atau hutan purba? Tulis di komentar, dan ikuti knot theory!

Sumber:
Smithsonian Ocean: https://ocean.si.edu/ocean-life/sharks-rays/sharks
Davies dkk. (2024), Journal of the Geological Society: https://doi.org/10.1144/jgs2023-204

#Shorts #KnotTheory #DuniaKebalik #Hiu #Fosil''',
'INSTAGRAM REELS': '''Bayangkan membuka dua arsip Bumi: satu dari laut purba, satu dari hutan purba. 🦈🌳

Menurut Smithsonian, sisik hiu yang terkonfirmasi dari Siberia berumur sekitar 420 juta tahun; hutan fosil di Inggris yang diteliti tim ilmuwan sekitar 390 juta tahun. Dua catatan, bukan usia seekor hiu—dan penemuan baru bisa mengubahnya.

Kamu mau menjelajahi yang mana? Tulis di komentar, dan ikuti knot theory!

#KnotTheory #DuniaKebalik #FaktaUnik #Hiu #Fosil #Sains'''
}
out.write_text(''.join(f'======== {name} ========\n{value}\n\n' for name,value in sections.items()),encoding='utf8')
print(out)
