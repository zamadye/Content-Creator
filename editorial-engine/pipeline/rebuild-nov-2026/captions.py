#!/usr/bin/env python3
"""Generate distinct platform copy and hashtags. No publishing side effects."""
import json
import os
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
os.chdir(ROOT)
ID=sys.argv[1]
ep=next(x for x in json.loads(Path('content/recovered/week-2026-11-11-narration.json').read_text())['episodes'] if x['id']==ID)
texts={
 'antartika-gurun-2026':('Antartika itu gurun?','Gurun tidak harus panas: yang penting adalah sedikitnya presipitasi. Di Antartika, kondisi dan jumlahnya berbeda antarwilayah.','Baru tahu kalau gurun bisa sedingin ini?','#Antartika #FaktaSains #DuniaKebalik'),
 'merkurius-ada-es-2026':('Dekat Matahari, kok ada es?','Ada bukti es air di kawah kutub Merkurius yang dasarnya terus teduh. Ini bukan berarti seluruh planet membeku.','Fakta planet apa lagi yang bikin kamu penasaran?','#Merkurius #FaktaPlanet #DuniaKebalik'),
 'sisi-jauh-bulan-2026':('Sisi jauh Bulan selalu gelap?','Sisi jauh juga mengalami siang dan malam. Saat Bulan baru, sisi jauh justru mendapat sinar Matahari.','Kamu dulu membayangkan sisi jauh selalu gelap?','#Bulan #FaktaAntariksa #DuniaKebalik'),
 'gratis-ongkir-lebih-mahal-2026':('Gratis ongkir, kok totalnya naik?','Dalam contoh ini, menambah barang yang tidak dibutuhkan membuat total jadi Rp105.000, bukan Rp95.000. Kalau barangnya memang dibutuhkan, nilainya tentu bisa berbeda.','Pernah ikut menambah barang demi gratis ongkir?','#GratisOngkir #BelanjaBijak #DuniaKebalik'),
 'pelangi-lingkaran-2026':('Pelangi sebenarnya bisa bulat?','Pelangi penuh berbentuk lingkaran. Dari pesawat, lingkaran lengkap bisa terlihat ketika posisinya tepat—meski tidak selalu.','Pernah melihat pelangi bulat?','#Pelangi #FaktaSains #DuniaKebalik'),
 'musim-poros-bumi-2026':('Musim panas bukan terutama karena jarak?','Kemiringan poros mengubah sudut sinar dan panjang siang. Di Indonesia, pola hujan dan kemarau juga dipengaruhi cuaca regional.','Kamu tim hujan atau cerah?','#Musim #Bumi #DuniaKebalik'),
 'darah-biru-belangkas-2026':('Darahnya biru, tapi bukan kepiting sejati?','Belangkas lebih dekat dengan laba-laba dan kalajengking. Komponen darahnya membantu pengujian endotoksin; kelestarian hewan ini tetap penting.','Hewan unik apa yang harus kita bahas lagi?','#Belangkas #HewanUnik #DuniaKebalik'),
 'nol-koma-sembilan-2026':('0,999... sama persis dengan 1?','Dalam bilangan real, sembilan yang berlanjut tanpa akhir punya nilai tepat satu. Desimal dengan jumlah sembilan terbatas masih lebih kecil.','Masuk akal, atau masih bikin bingung?','#Matematika #FaktaMatematika #DuniaKebalik'),
 'saturnus-mengapung-2026':('Saturnus bisa mengapung?','Massa jenis rata-ratanya lebih rendah daripada air. Bak raksasa ini hanya eksperimen pikiran, bukan percobaan realistis.','Planet mana yang mau dibahas lagi?','#Saturnus #FaktaPlanet #DuniaKebalik'),
}
hook,body,question,tags=texts[ID]
refs='\n'.join(ep['sources'])
sections=[
 ('FACEBOOK REELS',f'{hook}\n\n{body}\n\n{question} Tulis di komentar dan ikuti knot theory.\n\nSumber: {refs}\n\n{tags} #KnotTheory'),
 ('TIKTOK',f'{hook} 🤯\n\n{body}\n\n{question} Komentar dan ikuti knot theory!\n\n{tags} #KnotTheory #FaktaUnik\nSumber: {refs}'),
 ('YOUTUBE SHORTS',f'Judul: {hook} #Shorts\n\nDeskripsi:\n{body}\n\n{question} Komentar dan ikuti knot theory.\n\nSumber:\n{refs}\n\n{tags} #Shorts #KnotTheory'),
 ('INSTAGRAM REELS',f'{hook} ✨\n\n{body}\n\n{question} Ceritakan di komentar dan ikuti knot theory.\n\n{tags} #KnotTheory #FaktaUnik\n\nSumber: {refs}'),
]
out=Path('deliverables/rebuild-2026-11-11')/ID/f'{ID}-caption-4-platform.txt'
out.write_text('\n\n'.join(f'======== {name} ========\n{copy}' for name,copy in sections)+'\n',encoding='utf8')
print(out)
