#!/usr/bin/env python3
# LL-0003 — "Meteran yang Berputar di Rumah Kosong"
# Menulis naskah.md, narration.json, visual-map.json, dan image-prompts.json.
#
# Hukum yang dipakai (knowledge/NASKAH.md):
#   - klimaks di depan, potong di pertanyaan (S1)
#   - setiap segmen berakhir dengan satu pertanyaan yang mengundang teori
#   - frame "bukan 100% fiksi": cerita disusun dari kisah lapangan, nama diubah
#   - 5 petunjuk (2 visual, 2 audio, 1 teks), 3 loop, 2 reda
#   - gambar 16:9 dengan elemen yang menyambung (kiri → tengah → kanan)
#   - kamera tidak pernah sama dua shot berurutan: zoom, geser kiri-kanan, atas-bawah
import json, pathlib

OUT = pathlib.Path("stories/longform/LL-0003")
OUT.mkdir(parents=True, exist_ok=True)

SEGMEN = [
    {
        'id': 'S1',
        'judul': 'Temuan',
        'paragraf': [
            'Sebelas bulan, meteran rumah kosong itu mencatat angka rumah saya.',
            'Bukan mirip. Sama, sampai digit terakhir.',
            'Rumahnya di ujung RT empat. Pagarnya digembok dari dalam, jendelanya ditutup kardus, dan tidak ada yang tinggal di situ sejak dua ribu empat belas. Tapi meterannya berputar. Setiap bulan, tanpa gagal.',
            'Saya petugas pencatat meter. Tiga ribu tujuh ratus rumah sudah lewat di buku saya, dan tidak satu pun membuat saya berhenti mengangkat kepala seperti itu.',
            'Bulan lalu angkanya empat ratus satu. Rumah saya juga empat ratus satu. Angka itu saya tulis dengan tangan saya sendiri. Saya baca ulang di rumah, dengan lampu dapur menyala, dan angkanya tidak berubah.',
            'Selisih nol. Dan nol itu yang membuat saya tidak bisa tidur tiga malam.',
            'Kalau rumahnya kosong sebelas tahun, dan pemiliknya tidak pernah kembali, kenapa yang tercatat di meterannya adalah pemakaian rumah saya?',
        ],
        'fungsi': 'Klimaks di depan: temuan mustahil, dua angka identik, lalu potong di pertanyaan.',
    },
    {
        'id': 'S2',
        'judul': 'Rute dan rumah terakhir',
        'paragraf': [
            'Saya bekerja untuk pihak ketiga yang ditugaskan PLN. Rute saya RT satu sampai RT enam, enam puluh rumah sehari, dari pukul delapan pagi sampai jam tiga.',
            'Upahnya tiga ribu lima ratus rupiah satu rumah. Kalau sehari enam puluh rumah dan tidak ada yang terlewat, sehari dua ratus sepuluh ribu. Kontrakan saya sembilan ratus ribu sebulan, dan saya tidak pernah berani mengambil cuti.',
            'Aplikasi di ponsel mencatat setiap rumah yang sudah saya kunjungi. Kalau lewat pukul tiga, rumah yang belum dicatat dihitung terlambat, dan potongannya masuk ke gaji bulan berikutnya.',
            'Rumah di ujung RT empat selalu jadi yang terakhir. Bukan karena jauh, tapi karena saya mencatatnya paling lama.',
            'Pemiliknya pindah keluar kota tahun dua ribu empat belas. Katanya.',
            'Pagarnya digembok dari dalam, dan gemboknya berkarat, tidak pernah basah karena hujan.',
            'Meterannya menempel di dinding samping, setinggi dada, kaca yang sudah keruh. Saya bersihkan dengan lap sendiri, karena kalau kotor angkanya tidak terbaca.',
            'Seri meterannya dua dua satu empat. Saya ingat betul, karena seri meteran di rumah saya juga dua dua satu empat. Sampai sekarang saya belum bisa menjawab satu hal: kalau dua meteran itu memang sekembar itu, siapa yang mengirimkannya ke dua rumah ini?',
            'Di grup petugas, cerita rumah kosong yang meternya tetap jalan muncul lebih dari sekali. Nama dan tempat selalu diganti, karena yang punya cerita tidak mau dikenal.',
        ],
        'fungsi': 'Kerja, uang, tempat; petunjuk visual #1 (seri meteran). Frame "bukan 100% fiksi" ditanam di akhir segmen.',
    },
    {
        'id': 'S3',
        'judul': 'Pola',
        'paragraf': [
            'Bulan pertama saya kira kebetulan. Angka rumah kosong itu tiga ratus delapan puluh, angka rumah saya juga.',
            'Bulan kedua saya catat di buku: selisihnya nol. Bulan ketiga nol lagi.',
            'Saya sempat menunjukkan fotonya ke rekan kerja. Dia melihat dua detik, lalu bilang mungkin sistemnya salah, dan kembali ke motornya. Sesudah itu saya berhenti bertanya ke orang.',
            'Saya lanjut memotret sendiri, karena foto tidak bisa membantah.',
            'Setiap bulan dua foto: meteran rumah kosong, lalu meteran rumah saya. Di ponsel saya sekarang ada dua puluh tujuh pasang, dan semuanya sama.',
            'Yang paling tidak masuk akal bukan angkanya. Rumah saya cuma memakai dua ratus watt. Menurut catatan lama, rumah kosong itu punya pendingin ruangan dan pemanas. Ada juga pompa air. Kalau alat-alat itu masih hidup, angkanya tidak mungkin serendah ini.',
            'Coba pikirkan sebentar. Rumah yang kosong seharusnya lebih hemat dari rumah yang ditinggali. Di sini kebalikannya, dan yang tercatat justru rumah saya.',
            'Malam itu saya berhenti di depan rumah kosong tanpa alasan yang jelas, dan baru sadar saya menahan napas.',
        ],
        'fungsi': 'Membuktikan pola; pertanyaan diturunkan ke penonton. Ditutup reda #1.',
    },
    {
        'id': 'S4',
        'judul': 'Nama di kotak',
        'paragraf': [
            'Bu Ratna, ketua RT, bilang rumah itu sudah lama tidak ada yang tinggal. Yang punya, katanya, keluarga yang pindah.',
            'Saya tanya siapa namanya. Dia tidak ingat. Dia cuma bilang yang mengurus rumah itu orang suruhan, datang setahun sekali untuk memeriksa pagar.',
            'Saya tanya ke kelurahan. Arsip program penggantian meteran tahun dua ribu sembilan ada, tapi berkas pelanggan untuk rumah itu fotokopinya sudah hilang.',
            'Jadi saya lihat sendiri kotak meterannya. Di sampingnya ada stiker lama, sudah pudar, ditempel kelurahan waktu program itu.',
            'Di stiker itu ada nama pelanggan. Namanya sama dengan nama ibu saya sebelum menikah.',
            'Saya pulang, buka akta lahir saya, dan membaca ulang nama itu sampai tiga kali.',
            'Ibu saya tidak punya rumah di RT empat. Ibu saya lahir di kota lain, dan menurut semua orang, tidak pernah tinggal di sini.',
            'Kalau nama ibu saya ada di rumah yang tidak pernah ia tinggali, siapa yang memakai namanya selama sebelas tahun ini?',
        ],
        'fungsi': 'Petunjuk visual #2 (nama di stiker); cerita bergeser dari salah catat ke warisan.',
    },
    {
        'id': 'S5',
        'judul': 'Di jendela',
        'paragraf': [
            'Rumah itu saya datangi malam. Bukan untuk masuk. Saya hanya ingin mendengar.',
            'Radio di dalam menyala. Frekuensinya sama dengan radio di dapur saya, yang selalu saya nyalakan pagi sebelum berangkat.',
            'Pukul sembilan lewat ada bunyi klik dari dalam. Logam kecil, seperti tombol ketel listrik yang dimatikan sendiri. Ketel di rumah saya berbunyi persis seperti itu.',
            'Saya menghitung sampai lima puluh. Tidak ada suara lain. Tidak ada langkah, tidak ada batuk, tidak ada pintu.',
            'Saya merekam sebelas menit di ponsel. Waktu saya putar ulang di rumah, yang terdengar hanya radio dan satu klik. Sisanya napas saya sendiri, yang makin cepat di menit kesembilan.',
            'Saya pulang. Di dapur, ketel saya sudah dalam posisi mati, padahal pagi tadi saya menyalakannya.',
            'Pertanyaannya bukan lagi siapa yang ada di dalam. Pertanyaannya, kenapa semua yang ada di dalam sama dengan yang ada di rumah saya?',
        ],
        'fungsi': 'Dua petunjuk audio: radio dan klik ketel. Ditutup reda #2.',
    },
    {
        'id': 'S6',
        'judul': 'Yang membayar',
        'paragraf': [
            'Tagihan listrik rumah itu tidak pernah nunggak. Sebelas tahun, tanpa satu bulan kosong.',
            'Saya minta rekap ke kantor. Semua dibayar tunai, di loket yang sama, tanggal yang sama setiap bulan.',
            'Loket itu tidak menyimpan salinan. Yang tersisa hanya kolom tanda tangan penerima setoran.',
            'Namanya Bu Yati. Dia bilang setoran rumah itu selalu datang paling pagi, sebelum loket dibuka, ditaruh di bawah pintu bersama amplop lain. Dia tidak pernah melihat orangnya, dan yang dia ingat hanya satu hal: amplop itu ditulis tangan, bukan dicetak.',
            'Dia mengirim tiga potong kertas hasil pindai.',
            'Tanda tangannya miring ke kanan, dengan garis penutup yang ditarik cepat ke bawah.',
            'Saya punya tanda tangan yang persis begitu: di KTP, di buku tabungan, dan di slip gaji. Padahal sejak mulai mencatat rumah itu, saya belum pernah sekali pun ke loket itu.',
            'Kalau bukan saya yang membayar, kenapa tanda tangannya tangan saya?',
        ],
        'fungsi': 'Pertanyaan bergeser ke siapa yang membayar, dan kenapa atas nama narator.',
    },
    {
        'id': 'S7',
        'judul': 'Uji',
        'paragraf': [
            'Juli lalu saya memotong listrik rumah saya sendiri. Saklar utama saya turunkan, dan saya menginap di rumah kakak dua hari.',
            'Kalau angka rumah kosong itu benar-benar mengikuti rumah saya, meterannya harus berhenti juga.',
            'Hari ketiga saya kembali. Meteran rumah saya: nol.',
            'Meteran rumah kosong: naik empat kilowatt jam.',
            'Persis pemakaian harian rumah saya, dikali dua hari, tanpa satu watt lebih.',
            'Saya tidak melapor ke kantor. Saya tidak memotong listrik lagi. Sekarang saya mencatat dua meteran sekaligus, karena keduanya menunjuk ke satu rumah yang sama.',
            'Di kotak surat kakak ada amplop tanpa perangko. Di dalamnya selembar kertas bergaris, tulisan miring ke kanan, sama seperti tanda tangan itu: bulan depan jangan dipotong lagi.',
            'Saya tidak tahu siapa yang membayar rumah itu sebelum saya mulai mencatatnya. Saya juga tidak tahu, kalau nanti rumah kamu kosong, siapa yang akan mencatat angka rumah kamu.',
        ],
        'fungsi': 'Payoff: dua meteran mengukur satu rumah. Loop ketiga dibiarkan terbuka.',
    },
]

narasi_kata = sum(len(p.split()) for s in SEGMEN for p in s['paragraf'])
estimasi = round(narasi_kata / 2.2)

narration = {
    'episode': 'LL-0003',
    'judul': 'Meteran yang Berputar di Rumah Kosong',
    'total_kata': narasi_kata,
    'estimasi_detik': estimasi,
    'segmen': [
        {'id': s['id'], 'segmen': i + 1, 'judul': s['judul'], 'paragraf': s['paragraf'], 'fungsi': s['fungsi']}
        for i, s in enumerate(SEGMEN)
    ],
}

ATMO = {
    'S1': {'waktu': 'pagi, matahari baru naik', 'palet': ['#c8bfa8', '#6f7a6a', '#2b2b28', '#e9e4d6'],
           'cahaya': 'matahari rendah dari kiri, kontras tinggi, debu di udara',
           'catatan': 'terang, hari kerja biasa — kejanggalan datang dari angka, bukan dari gelap'},
    'S2': {'waktu': 'pagi sampai siang', 'palet': ['#d6c49a', '#7d8464', '#38352b', '#f1ece0'],
           'cahaya': 'terik penuh, bayangan pendek', 'catatan': 'paling terang, kontras untuk malam nanti'},
    'S3': {'waktu': 'sore', 'palet': ['#c9a476', '#7a6a52', '#332e26', '#efe6d4'],
           'cahaya': 'keemasan rendah, bayangan memanjang', 'catatan': 'hangat, satu sudut frame selalu lebih gelap'},
    'S4': {'waktu': 'siang menjelang sore', 'palet': ['#cbb894', '#77806a', '#35322a', '#ece5d5'],
           'cahaya': 'terik lembut, langit pucat', 'catatan': 'wajah Bu Ratna setengah bayangan'},
    'S5': {'waktu': 'malam', 'palet': ['#3a4a48', '#1f2a2c', '#0d1214', '#c3ccc4'],
           'cahaya': 'satu lampu jalan jauh, sisanya gelap',
           'catatan': 'paling gelap; radio satu-satunya sumber suara'},
    'S6': {'waktu': 'siang, dalam ruangan', 'palet': ['#d9d3c2', '#8d9a92', '#3b4340', '#f4f0e6'],
           'cahaya': 'neon putih kantor, rata', 'catatan': 'datar dan administratif — justru itu yang mencekam'},
    'S7': {'waktu': 'pagi', 'palet': ['#cfc7ae', '#7c8570', '#2e302a', '#efeade'],
           'cahaya': 'pagi cerah, sedikit kabut', 'catatan': 'kembali terang: dunia terlihat normal, padahal tidak'},
}

# (pemicu, offset_frame, ukuran, kamera, isi)
SHOTS = {
    'S1': [
        ('Sebelas bulan', 2, 'full', 'pan_left', 'satu frame gang RT: di kiri tetangga menyapu, di tengah pagar besi bergembok, di kanan rumah ujung yang jendelanya ditutup kardus'),
        ('Sama, sampai digit terakhir', 4, 'close', 'dolly_in', 'kotak meteran berdebu di dinding semen, kaca keruh, debu bergerak di cahaya pagi'),
        ('Rumahnya di ujung RT empat', 3, 'wide', 'tilt_down', 'dari atap seng dan pohon mangga turun ke pagar, kardus penutup jendela, dan genangan kecil di tanah'),
        ('Saya petugas pencatat meter', 4, 'medium', 'push_in', 'buku catatan di pangkuan, tangan memegang pulpen, latar gang perumahan samar'),
        ('Bulan lalu angkanya empat ratus satu', 3, 'insert', 'pan_right', 'deret angka meteran dari kiri ke kanan, pelat logam berdebu'),
        ('kenapa yang tercatat di meterannya', 4, 'close', 'zoom_punch_placeholder', 'kaca meteran dengan pantulan jendela rumah di belakangnya'),
    ],
    'S2': [
        ('Rute saya RT satu sampai RT enam', 3, 'wide', 'pan_right', 'gang perumahan menyambung: di kiri warung, di tengah motor dinas berhenti, di kanan deretan pagar rumah'),
        ('Rumah di ujung RT empat', 4, 'full', 'static', 'rumah kosong dari kejauhan, pohon, langit putih panas'),
        ('Pagarnya digembok dari dalam', 3, 'close', 'push_in', 'gembok karat pada pagar besi, dilihat dari sisi dalam halaman'),
        ('Meterannya menempel di dinding samping', 4, 'medium', 'tilt_up', 'dari kotak meteran setinggi dada naik ke kabel dan atap seng'),
        ('Saya bersihkan dengan lap sendiri', 3, 'close', 'handheld', 'tangan mengelap kaca meteran, debu terbang di berkas cahaya'),
        ('Seri meterannya dua dua satu empat', 4, 'insert', 'dolly_in', 'pelat logam bernomor seri, sangat dekat, goresan halus'),
        ('Di grup petugas', 3, 'medium', 'pan_left', 'layar ponsel dengan percakapan grup, dari kanan ke kiri, teks tidak terbaca'),
    ],
    'S3': [
        ('Bulan pertama saya kira kebetulan', 3, 'medium', 'push_in', 'buku catatan dengan dua kolom angka, tinta berbeda, jari menunjuk baris'),
        ('Bulan kedua saya catat di buku', 3, 'close', 'tilt_down', 'dari judul halaman turun ke baris angka yang makin rapat'),
        ('Saya sempat menunjukkan fotonya', 4, 'insert', 'pan_right', 'ponsel di tangan, galeri foto dua meteran berdampingan'),
        ('dua puluh tujuh pasang', 3, 'close', 'pan_left', 'layar ponsel penuh foto meteran, jempol menggulir dari kanan ke kiri'),
        ('Rumah saya cuma memakai dua ratus watt', 4, 'wide', 'tilt_down', 'dari langit sore turun ke rumah narator, teras, meteran kecil di dinding'),
        ('pendingin ruangan dan pemanas', 4, 'insert', 'dolly_in', 'kertas pudar berisi daftar alat listrik, tulisan tangan tidak terbaca'),
        ('Malam itu saya berhenti', 3, 'medium', 'drift', 'punggung narator dari belakang, berhenti di depan pagar, sore berubah gelap'),
    ],
    'S4': [
        ('Bu Ratna, ketua RT', 3, 'medium', 'push_in', 'perempuan tua di teras, wajah setengah bayangan, tangan memegang gelas'),
        ('Saya tanya siapa namanya', 4, 'close', 'static', 'wajah Bu Ratna setengah frame, mata melihat ke samping'),
        ('Jadi saya lihat sendiri kotak meterannya', 3, 'medium', 'tilt_down', 'dari stiker pudar di dinding turun ke kotak meteran di bawahnya'),
        ('Di stiker itu ada nama pelanggan', 4, 'insert', 'dolly_in', 'stiker pudar dengan nama pelanggan, sangat dekat, huruf mulai hilang'),
        ('buka akta lahir saya', 3, 'close', 'pan_right', 'akta lahir di meja kayu, dari nama ibu ke kolom tanggal'),
        ('Ibu saya lahir di kota lain', 4, 'wide', 'pan_right', 'ruang tamu narator: di kiri foto keluarga, di tengah meja, di kanan pintu ke dapur'),
        ('siapa yang memakai namanya', 3, 'close', 'push_in', 'mata narator tidak terlihat penuh, hanya sebagian wajah di cermin'),
    ],
    'S5': [
        ('Rumah itu saya datangi malam', 3, 'wide', 'tilt_up', 'dari jalan gelap naik ke pagar, jendela berkardus, atap, langit malam'),
        ('Radio di dalam menyala', 4, 'close', 'push_in', 'celah jendela berkardus dengan cahaya radio menembus, gelap pekat'),
        ('bunyi klik dari dalam', 3, 'insert', 'dolly_in', 'ketel listrik di dapur gelap, tombol sudah turun, uap tipis'),
        ('Saya menghitung sampai lima puluh', 4, 'medium', 'pan_left', 'dinding rumah kosong dari kiri ke kanan, retak halus, gelap'),
        ('pada jam yang sama setiap malam', 3, 'close', 'static', 'jam dinding terlihat lewat celah jendela, jarum tidak jelas'),
        ('ketel saya sudah dalam posisi mati', 4, 'insert', 'tilt_down', 'dari tombol ketel turun ke dasar ketel, uap tipis di dapur terang'),
    ],
    'S6': [
        ('Tagihan listrik rumah itu tidak pernah nunggak', 3, 'medium', 'push_in', 'rekap tagihan tercetak, kolom tanggal dan angka, meja kantor'),
        ('Saya minta rekap ke kantor', 4, 'wide', 'pan_right', 'ruang loket: di kiri antrean kosong, di tengah loket, di kanan pintu keluar'),
        ('Semua dibayar tunai', 3, 'close', 'tilt_down', 'dari tumpukan amplop turun ke kertas setoran'),
        ('kolom tanda tangan penerima setoran', 4, 'insert', 'dolly_in', 'tanda tangan miring dengan garis penutup cepat, sangat dekat'),
        ('Dia mengirim tiga potong kertas', 3, 'close', 'pan_left', 'tiga lembar hasil pindai di layar, dari kanan ke kiri'),
        ('Saya punya tanda tangan yang persis begitu', 4, 'insert', 'push_in', 'KTP dan buku tabungan di meja, tanda tangan di keduanya'),
        ('Kalau bukan saya yang membayar', 3, 'medium', 'static', 'tangan narator di atas kertas setoran, bayangan lampu kantor'),
    ],
    'S7': [
        ('Saklar utama saya turunkan', 3, 'close', 'push_in', 'kotak saklar rumah, tangan menurunkan tuas sampai bunyi klik'),
        ('menginap di rumah kakak dua hari', 4, 'wide', 'pan_left', 'halaman rumah kakak pagi hari: sepeda di kiri, jemuran di tengah, pintu di kanan'),
        ('Hari ketiga saya kembali', 3, 'medium', 'tilt_up', 'dari meteran rumah narator naik ke dinding dan atap, angka nol terlihat'),
        ('naik empat kilowatt jam', 4, 'close', 'dolly_in', 'meteran rumah kosong, angka bertambah, kaca berembun pagi'),
        ('amplop tanpa perangko', 3, 'close', 'push_in', 'kotak surat, amplop putih di dalamnya, tanpa perangko'),
        ('bulan depan jangan dipotong lagi', 4, 'insert', 'dolly_in', 'kertas bergaris dengan tulisan tangan miring, sangat dekat'),
        ('siapa yang akan mencatat angka rumah kamu', 3, 'wide', 'pan_right', 'jalan perumahan pagi: di kiri rumah narator, di tengah jalan kosong, di kanan rumah ujung yang pagarnya tertutup'),
    ],
}

# kamera "zoom_punch_placeholder" bukan nama sah di kontrak; ganti ke push_in
for sid in SHOTS:
    SHOTS[sid] = [tuple(('push_in' if x == 'zoom_punch_placeholder' else x) if not isinstance(x, tuple) else x for x in shot) for shot in SHOTS[sid]]

peta_segmen = []
for s in SEGMEN:
    sid = s['id']
    shots = []
    for j, (pemicu, offset, ukuran, kamera, isi) in enumerate(SHOTS[sid]):
        shots.append({
            'id': '%s-%02d' % (sid, j + 1),
            'pemicu': pemicu,
            'offset_frame': offset,
            'ukuran': ukuran,
            'kamera': kamera,
            'isi': isi,
            'entitas': None,
            'sfx': None,
        })
    peta_segmen.append({
        'id': sid,
        'judul': s['judul'],
        'mulai_detik': None,
        'atmosfer': ATMO[sid],
        'shots': shots,
        'reda': sid in ('S3', 'S5'),
        'catatan': s['fungsi'],
    })

visual = {
    'episode': 'LL-0003',
    'judul': 'Meteran yang Berputar di Rumah Kosong',
    'format': 'longform_16x9',
    'fps': 30,
    'resolusi': [1920, 1080],
    'total_kata_narasi': narasi_kata,
    'estimasi_durasi_detik': estimasi,
    'hook_card': {
        'teks': 'SEBELAS BULAN',
        'tampil': 'frame 0-27',
        'catatan': 'maksimal 3 kata; muncul bersamaan dengan kalimat pertama',
    },
    'aturan_sinkron': {
        'dasar': 'knowledge/ATURAN.md bagian III.3 — visual tidak boleh mendahului kata',
        'offset_masuk_frame': [2, 4],
        'artinya': 'shot baru dipotong 2-4 frame SETELAH onset kata pemicu',
    },
    'irama': {
        'target_rata_rata_detik': 11,
        'larangan': 'tidak ada dua shot berturut-turut dengan ukuran dan arah yang sama',
        'reda': ['S3', 'S5'],
    },
    'komposisi': {
        'dasar': 'gambar 16:9 harus memuat elemen yang menyambung: kiri → tengah → kanan, atau bawah → atas',
        'alasan': 'satu gambar yang punya jalur mata membuat gerakan kamera punya arah cerita, bukan sekadar zoom',
        'contoh': 'gang di kiri, pagar bergembok di tengah, rumah berjendela kardus di kanan',
    },
    'karakter_tetap': {
        'protagonis': 'pria Indonesia akhir 20-an, kemeja dinas biru pudar, celana gelap, topi proyek, wajah tidak pernah terlihat penuh',
        'entitas': 'tidak ada entitas berwujud — kejanggalan datang dari benda, angka, dan suara',
    },
    'petunjuk': [
        {'jenis': 'visual', 'di': 'S2-06', 'dibayar': 'S7', 'isi': 'seri meteran 2214 sama dengan meteran rumah narator'},
        {'jenis': 'visual', 'di': 'S4-04', 'dibayar': 'S7', 'isi': 'nama pelanggan di stiker = nama ibu sebelum menikah'},
        {'jenis': 'audio', 'di': 'S5-02', 'dibayar': 'S7', 'isi': 'frekuensi radio sama dengan radio dapur'},
        {'jenis': 'audio', 'di': 'S5-03', 'dibayar': 'S7', 'isi': 'klik ketel pada jam yang sama setiap malam'},
        {'jenis': 'teks', 'di': 'deskripsi + komentar sematan', 'dibayar': '-', 'isi': 'menyebut seri meteran yang muncul dua kali'},
    ],
    'qc_khusus_episode': {
        'wajib_terang': ['S1', 'S2', 'S7'],
        'reda': ['S3 akhir', 'S5 akhir'],
        'larangan': ['HUD kamera pengawas', 'entitas berwujud', 'teks terbaca di dokumen hasil generate'],
    },
    'segmen': peta_segmen,
}

meta = {
    'title': 'Meteran yang Berputar di Rumah Kosong',
    'subgenre': 'Long-form narration',
    'experiment': 'Dua meteran, satu rumah. Kejanggalan dibuktikan dengan angka; tidak ada penampakan, dan ceritanya berdiri di atas laporan lapangan yang mirip.',
    'structure': 'temuan → rute → pola → warisan → suara → pembayaran → uji',
    'story': {
        'hook': 'Sebelas bulan, meteran rumah kosong itu mencatat angka rumah saya.',
        'premise': 'Petugas pencatat meter menemukan rumah kosong sebelas tahun yang angka meterannya selalu persis sama dengan rumahnya sendiri.',
        'twist': 'Bukan salah catat dan bukan hantu: dua meteran itu mengukur satu rumah, dan tagihannya dibayar atas namanya sendiri oleh orang yang tidak pernah ia lihat.',
        'ending': 'Ia memotong listriknya sendiri untuk menguji; meteran rumah kosong justru naik. Sampai akhir ia tidak tahu siapa yang membayar sebelum ia mulai mencatat.',
    },
    'youtube': {
        'title': 'Setiap Bulan, Meteran Rumah Kosong Itu Mencatat Angka Rumah Saya',
        'description': 'Sebelas bulan, angka meteran rumah kosong di ujung RT empat sama persis dengan meteran rumah saya. Bukan mirip, sama sampai digit terakhir. Saya petugas pencatat meter, dan ini yang terjadi waktu saya memotong listrik rumah saya sendiri. Cerita ini disusun dari kisah lapangan yang beredar di antara petugas catat meter: nama dan tempat diubah, angkanya dibulatkan.',
        'tags': ['cerita horor', 'horor indonesia', 'cerita seram', 'kisah nyata', 'rumah kosong', 'meteran listrik'],
        'pinComment': 'Seri meteran yang muncul dua kali di video ini: dua dua satu empat. Kalau kamu jadi saya: lapor ke kantor, atau terus mencatat dua meteran itu diam-diam?',
    },
    'thumbnail': {'headline': 'SEBELAS BULAN', 'kicker': 'angkanya sama persis'},
    'cta': {'card': 'Siapa yang membayar rumah itu sebelum saya?', 'holdFrames': 90},
    'transisi': ['zoom_punch', 'whip_left', 'whip_up', 'dip_black', 'flash_white', 'zoom_punch'],
    'transitionFrames': 12,
    'segmen': {
        'S1': {'lighting': 'warm_morning', 'intensity': 0.68, 'ambienceVolume': 0.3},
        'S2': {'lighting': 'hard_daylight', 'intensity': 0.82, 'ambienceVolume': 0.32},
        'S3': {'lighting': 'golden_low', 'intensity': 0.6, 'ambienceVolume': 0.28},
        'S4': {'lighting': 'soft_daylight', 'intensity': 0.66, 'ambienceVolume': 0.28},
        'S5': {'lighting': 'low_key_practical', 'intensity': 0.34, 'ambienceVolume': 0.24},
        'S6': {'lighting': 'flat_office_neon', 'intensity': 0.58, 'ambienceVolume': 0.26},
        'S7': {'lighting': 'clear_morning', 'intensity': 0.72, 'ambienceVolume': 0.3},
    },
}

(OUT / 'narration.json').write_text(json.dumps(narration, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(OUT / 'visual-map.json').write_text(json.dumps(visual, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(OUT / 'meta.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

lines = [
    '# LL-0003 — "Meteran yang Berputar di Rumah Kosong"',
    '',
    '**Format:** panjang 16:9 · narasi **%d kata** · ±%d:%02d pada 2,2 kata/detik' % (narasi_kata, estimasi // 60, estimasi % 60),
    '**Sudut pandang:** orang pertama, petugas pencatat meter listrik, akhir 20-an',
    '**Frame:** disusun dari kisah lapangan yang beredar di antara petugas catat meter; nama dan tempat diubah, angka dibulatkan. Bukan 100% fiksi, bukan dokumenter.',
    '**Aturan cerita:** tidak ada entitas berwujud; kejanggalan dari angka, benda, dan suara; tanpa jumpscare.',
    '**Hukum baru:** klimaks di depan dan potong di pertanyaan (S1), tiap segmen ditutup satu pertanyaan untuk penonton, 5 petunjuk, 3 loop, 2 reda (S3, S5).',
    '**Dua bacaan kalimat pertama:** A — salah catat atau sistem keliru. B — dua meteran itu mengukur satu rumah yang sama.',
    '',
    '---',
    '',
]
for i, s in enumerate(SEGMEN):
    lines.append('## Segmen %d — %s' % (i + 1, s['judul']))
    lines.append('')
    for p in s['paragraf']:
        lines.append('> ' + p)
        lines.append('>')
    lines.append('**Fungsi:** ' + s['fungsi'])
    lines.append('')
    lines.append('---')
    lines.append('')
(OUT / 'naskah.md').write_text('\n'.join(lines), encoding='utf-8')

print('LL-0003: %d segmen · %d kata · ±%d detik · %d shot' % (
    len(SEGMEN), narasi_kata, estimasi, sum(len(v) for v in SHOTS.values())))
