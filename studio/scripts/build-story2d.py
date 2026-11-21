import json, os

old = json.load(open('stories/saldo-8-juta/story.json'))
cast = old['cast']
for k, v in cast.items():
    v['sprite'] = v['sprite']
    v['mouth'] = {'closed': f'chars/mouth/{k}-closed.png', 'open': f'chars/mouth/{k}-open.png'}

# Pose yang dipakai saat bicara: 'speak' = pasangan badan sama, hanya mulut berganti.
SPEAK = 'speak'
backdrops = old['backdrops']
backdrops['kamar-nadin'] = {'image': 'bg/kamar-nadin.png'}
backdrops['meja-bukti'] = {'image': 'bg/meja-bukti.png'}
backdrops['meja-hp'] = {'image': 'bg/meja-hp.png'}

FPS = 30
def line(who, pose, poseAlt, text, seconds, sprite=None):
    d = {'who': who, 'pose': pose, 'poseAlt': poseAlt, 'text': text, 'duration': seconds}
    if sprite: d['sprite'] = sprite
    return d

def phone(spoken_by, listener, text, seconds):
    """Baris lewat telepon/pesan suara: yang tampil pendengar, label = pembicara."""
    poses = {'alya': ('neutral', None), 'bima': ('neutral', None)}
    pose, alt = poses.get(listener, ('neutral', None))
    return line(spoken_by, pose, alt, text, seconds, sprite=listener)

# Shot yang memang butuh gestur khusus (menunjuk, merekam, memegang HP):
# pose tetap dari character sheet, mulut tidak dianimasikan.
GESTURE_SHOTS = {'s10', 's13', 's24'}

CHIPS = {
  's03': {'label': 'Jual cepat', 'value': 'Laptop · kamera · sisa Rp 800.000'},
  's15': {'label': 'Pinjaman', 'value': 'Rp 8.000.000 cair atas nama Alya'},
  's16': {'label': 'Transfer masuk', 'value': 'Rp 8.000.000'},
  's17': {'label': 'UKT', 'value': 'Lunas'},
  's19': {'label': 'Tagihan pinjol', 'value': 'Rp 11.400.000'},
  's21': {'label': 'Video viral', 'value': '2,1 juta views'},
  's26': {'label': 'Bukti', 'value': 'Screenshot janji · tagihan · pengaduan'},
}

# (id, backdrop, durasi, height, x, [baris])
SPEC = [
 ('s01','kos-kamar',5.0,0.64,0.5,[line('alya','sad','talk','Katanya mau bantu. Kok sekarang aku yang ditagih?',5.0)]),
 ('s02','kos-kamar',6.0,0.64,0.5,[line('alya','think','talk','Tiga hari lagi... delapan juta dari mana?',6.0)]),
 ('s03','meja-hp',5.0,0.0,0.5,[line('alya','sad','talk','Kalau ini dijual, masih kurang jauh.',5.0)]),
 ('s04','kos-kamar',6.0,0.64,0.5,[phone('ibu','alya','Al, UKT-nya udah dibayar?',3.2),line('alya','neutral','talk','Lagi diurus, Bu.',2.4)]),
 ('s05','rumah-ibu',6.0,0.58,0.5,[line('ibu','sad','worried','Kalau belum cukup, gelang Bapak masih ada.',6.0)]),
 ('s06','kos-kamar',5.0,0.64,0.5,[line('alya','sadHunch','talk','Jangan, Bu. Itu satu-satunya peninggalan Bapak.',5.0)]),
 ('s07','kos-pintu',5.0,0.62,0.44,[line('ratna','stern','talk','Al, kosnya kapan bisa dibayar?',3.2),line('alya','neutral','talk','Sabtu ya, Bu. Maaf.',2.2)]),
 ('s08','koridor',6.0,0.6,0.44,[line('nadin','neutral','talk','Al, aku cerita ke Kak Bima. Katanya dia bisa bantu.',4.4),line('alya','shock','talk','Kamu cerita?',1.8)]),
 ('s09','koridor',7.0,0.6,0.54,[line('bima','neutral','talk','Aku dengar UKT kamu belum lunas.',3.4),line('alya','sad','talk','Iya, Kak. Tapi aku lagi cari cara.',3.6)]),
 ('s10','koridor',6.0,0.6,0.54,[line('bima','phone','talk','Ada cara supaya kamu bisa bayar hari ini.',3.8),line('alya','think','talk','Dari mana uangnya?',2.2)]),
 ('s11','koridor',6.0,0.6,0.5,[line('alya','shock','talk','Ini utang atas nama aku, Kak?',3.0),line('bima','neutral','talk','Iya. Tapi dengerin dulu.',2.6)]),
 ('s12','koridor',7.0,0.6,0.54,[line('bima','chest','talk','Aku yang bayar cicilannya. Jumat depan uangku masuk.',5.0),line('alya','neutral','talk','Beneran, Kak?',1.8),line('bima','neutral','talk','Iya, aku janji.',2.0)]),
 ('s13','koridor',6.0,0.6,0.5,[line('alya','neutral','talk','Din, jangan direkam dulu.',2.6),line('nadin','record','talk','Kak Bima minta buat dokumentasi.',3.2)]),
 ('s14','koridor',5.0,0.6,0.54,[line('bima','neutral','talk','Buat laporan kegiatan aja. Nggak dipost.',5.0)]),
 ('s15','meja-hp',5.0,0.0,0.5,[line('alya','neutral','talk','Jumat jangan lupa, Kak.',2.4),line('bima','neutral','talk','Tenang.',1.6)]),
 ('s16','meja-hp',6.0,0.0,0.5,[line('alya','smile' if False else 'neutral','talk','Makasih, Kak. Aku nggak tahu harus bilang apa.',4.2),line('bima','neutral','talk','Yang penting kamu lanjut kuliah.',3.2)]),
 ('s17','meja-hp',5.0,0.0,0.5,[line('alya','neutral','talk','Akhirnya...',2.4)]),
 ('s18','kamar-nadin',7.0,0.62,0.5,[line('nadin','guilty','talk','Al bilang jangan dipost, Kak.',3.2),line('bima','neutral','talk','Cuma cerita bantu mahasiswa. Nggak ada yang salah.',4.0)]),
 ('s19','meja-hp',6.0,0.0,0.5,[line('alya','shock2','talk','Sebelas juta empat ratus? Kak Bima belum bayar?',5.0)]),
 ('s20','kos-kamar',7.0,0.64,0.5,[line('alya','angry','talk','Kak, kamu janji bayar. Aku yang dikejar tagihan sekarang.',6.0)]),
 ('s21','meja-hp',5.0,0.0,0.5,[line('alya','sad','talk','Jadi... ini yang kalian bikin?',4.0)]),
 ('s22','kos-pintu',6.0,0.62,0.44,[line('alya','angry','talk','Kamu tahu dia posting video ini?',3.0),line('nadin','guilty','talk','Aku yang kirim videonya ke dia.',3.0)]),
 ('s23','kos-kamar',6.0,0.64,0.5,[phone('bima','alya','Al, aku udah bantu cairin. Pinjamannya kan atas nama kamu.',5.4),line('alya','sad','talk','Tapi kamu janji bayar...',2.6)]),
 ('s24','kos-kamar',6.0,0.64,0.5,[line('alya','sadHunch','talk','Ini pesannya. Dia sendiri yang bilang.',3.6),line('nadin','guilty','talk','Aku bantu simpan buktinya, Al.',3.0)]),
 ('s25','kos-kamar',5.0,0.64,0.5,[line('alya','tearful' if False else 'sad','talk','Bu... aku salah ambil keputusan.',3.4),phone('ibu','alya','Cerita dulu, Nak. Ibu dengerin.',3.0)]),
 ('s26','meja-bukti',6.0,0.0,0.5,[line('alya','neutral','talk','Aku nggak mau jadi konten orang lagi.',5.0)]),
]

shots = []
for sid, bg, dur, height, x, lines in SPEC:
    share = round((dur - 0.5) / max(1, len(lines)), 2)
    for i, l in enumerate(lines):
        l['id'] = f'{sid}-{i+1}'
        if sid not in GESTURE_SHOTS:
            l['pose'] = SPEAK
            l['poseAlt'] = None
        l['duration'] = share
        p = f'public/vo/saldo-8-juta-v2/{sid}-{i+1}.mp3'
        if os.path.exists(p):
            l['audio'] = f'vo/saldo-8-juta-v2/{sid}-{i+1}.mp3'
    no_sprite = height == 0.0
    shot = {'id': sid, 'duration': round(dur, 2), 'backdrop': bg, 'lines': lines}
    if sid in CHIPS:
        shot['chip'] = CHIPS[sid]
    if not no_sprite:
        shot['actor'] = {'x': x, 'y': 0.97, 'height': height}
    shot['sprite'] = not no_sprite
    shots.append(shot)

story = {
  'schema': 'studio.story2d/2',
  'title': 'Saldo 8 Juta',
  'subtitle': 'Ditolong di Depan Kamera',
  'width': 720, 'height': 1280, 'fps': 30,
  'cast': cast,
  'backdrops': backdrops,
  'shots': shots,
}
json.dump(story, open('stories/saldo-8-juta/story.json','w'), indent=2, ensure_ascii=False)
print('shots', len(shots), 'durasi', round(sum(s['duration'] for s in shots),1))
print('baris tanpa audio:', sum(1 for s in shots for l in s['lines'] if 'audio' not in l))
