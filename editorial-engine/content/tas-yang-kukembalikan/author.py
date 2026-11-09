#!/usr/bin/env python3
"""Single editorial source for a PRIVATE fictional animation draft.

The customer POV and characters are original. Fiction is not study data.
Mechanical checks do not imply creative, rights, platform or release approval.
"""
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent

def L(text,purpose,question,action,evidence,payoff,word):
    return dict(text=text,purpose=purpose,viewerQuestion=question,visualAction=action,
                evidence=evidence,nextOrPayoff=payoff,wordChoice=word)

def S(sid,beat,framing,connection,objects,*lines):
    return dict(id=sid,beat=beat,framing=framing,connection=connection,
                objects=[dict(object=o,action=a) for o,a in objects],lines=lines)

# One separately reasoned item per spoken sentence.
master=[
S('S01','B6','Kilas maju: Maya menyerahkan tas ke arah kamera; label ILUSTRASI terlihat sejak frame 0.',
  'Pengembalian sebuah benda yang belum dijual memunculkan teka-teki.', [('tas sampel','diserahkan kembali oleh Maya'),('tangan Maya','melepaskan pegangan tas')],
 L('Aku mengembalikan tas ini.','Membuka dari akibat tanpa menjelaskan sebabnya.','Mengapa tas itu dikembalikan?','Tas mendekat ke kamera lalu berhenti.','Fiksi — benda dan kejadian rekaan.','S02–S12 memberi konteks dan alasan.','Mengembalikan adalah tindakan tokoh, bukan tuduhan produk pihak nyata.')),
S('S02','B1','Maya memperkenalkan diri; kartu nama Nisa dan penanda ILUSTRASI muncul.',
  'Identitas dan batas fiksi ditampilkan sebelum cerita berkembang.', [('kartu Maya','muncul di samping narator'),('kartu Nisa','muncul di samping pembuat tas')],
 L('Aku Maya; aku dan Nisa dalam cerita ini adalah tokoh ilustrasi.','Membuat sudut pandang pelanggan dan disclosure jelas.','Apa hubungan Maya dengan tas Nisa?','Kartu nama muncul pada dua tokoh yang berbeda.','Fiksi — kedua tokoh bukan orang atau peserta studi nyata.','S03 memperkenalkan usaha Nisa.','Aku menandai bahwa cerita dipandu calon pelanggan, bukan pemilik usaha.')),
S('S03','B1','Nisa menempel sketsa tas di meja kerja, dengan gambar halte di belakang.',
  'Tujuan kecil pembuat tas terhubung pada kebutuhan perjalanan sehari-hari.', [('sketsa tas','diletakkan di meja Nisa'),('kartu halte','menunjukkan konteks pengguna')],
 L('Sebulan sebelumnya, Nisa ingin membuat tas untuk orang yang sering naik angkutan umum.','Memperkenalkan usaha dan calon pengguna secara konkret.','Mengapa Nisa belum mulai menjualnya?','Sketsa tas disandingkan dengan tanda halte.','Fiksi — tujuan, waktu, dan usaha dikarang.','S04 menunjukkan keterbatasan modal.','Ingin menyatakan niat, bukan bukti ada permintaan pasar.')),
S('S04','B1','Amplop tabungan, kain gulung, dan label sampel di atas meja.',
  'Keterbatasan modal adalah taruhan nyata bagi banyak usaha kecil, tanpa menganggap semua kondisinya sama.', [('amplop tabungan','dibuka untuk menghitung modal'),('gulungan kain','diukur untuk sampel')],
 L('Tabungannya cukup untuk beberapa sampel, bukan untuk memproduksi banyak tas yang belum tentu dibutuhkan.','Memberi alasan konkret untuk berhati-hati.','Bagaimana ia memilih rancangan tanpa mempertaruhkan seluruh uangnya?','Kain untuk sampel dipisahkan dari amplop modal.','Fiksi — jumlah dan situasi modal hanya milik cerita ini.','S05 memperlihatkan perencanaan.','Belum tentu dibutuhkan menjaga ketidakpastian permintaan.')),
S('S05','B2','Sketsa bentuk dan swatch warna semakin memenuhi meja.',
  'Rencana membantu, tetapi meja yang terus penuh menunjukkan keputusan yang tertunda.', [('sketsa tas','bertambah di meja'),('contoh warna','berpindah di atas kain')],
 L('Di meja Nisa, sketsa bentuk dan pilihan warna terus bertambah.','Menunjukkan perencanaan melalui benda, bukan menghakimi pelakunya.','Apakah Nisa siap memotong kain?','Kartu warna ditumpuk di atas sketsa.','Fiksi — proses rancangan rekaan.','S06 memperlihatkan keputusan yang tertahan.','Terus bertambah adalah aksi, bukan diagnosis perfeksionisme.')),
S('S06','B2','Gunting berhenti di atas kain saat Nisa menatap rancangan.',
  'Kecemasan untuk tidak membuang modal terlihat lewat gerak yang tertahan.', [('gunting','berhenti sebelum memotong kain'),('kain','tetap utuh di bawah gunting')],
 L('Setiap kali hampir memotong kain, ia menemukan detail baru yang ingin disempurnakan.','Membangun hambatan dari proses yang masuk akal bagi Nisa.','Apa yang akhirnya ia lakukan?','Gunting bergerak maju, lalu tertahan.','Fiksi — perasaan dan tindakan tokoh.','S07 memulai uji terbatas.','Ingin disempurnakan tidak menyatakan riset atau perencanaan itu buruk.')),
S('S07','B3','Nisa menjahit satu tas dan meminjamkannya kepada Maya.',
  'Langkah awal bukan produksi besar atau transaksi barang belum layak.', [('mesin jahit','menjahit satu sampel'),('tas sampel','berpindah dari Nisa kepada Maya')],
 L('Akhirnya ia menjahit satu sampel dan meminjamkannya kepadaku tanpa biaya.','Memperkenalkan percobaan kecil yang disetujui.','Apakah tas ini benar-benar berguna saat dipakai?','Tas bergerak dari meja jahit ke tangan Maya.','Fiksi — peminjaman sukarela tanpa biaya.','S08 membawa tas keluar studio.','Satu sampel tidak menjanjikan bahwa semua risiko hilang.')),
S('S08','B3','Maya memegang tas dan berjalan menuju halte.',
  'Reaksi positif awal menimbulkan pertanyaan apakah tampilan sama dengan kegunaan.', [('tas sampel','dipakai di bahu Maya'),('tanda halte','muncul di ujung jalan')],
 L('Aku suka warna tasnya, jadi kupakai ke halte keesokan pagi.','Memberi pandangan pelanggan sebelum masalah muncul.','Apa yang terjadi ketika ia membutuhkan sesuatu dari tas?','Maya membawa tas menuju halte.','Fiksi — kesan Maya adalah satu pendapat, bukan survei.','S09 menempatkan kendala kedua tangan.','Suka warna tidak disamakan dengan kesediaan semua orang membeli.')),
S('S09','B3','Maya memegang payung di halte; kartu perjalanan tersimpan di dalam tas.',
  'Kendala tangan dan kebutuhan mengambil kartu adalah situasi yang bisa dibayangkan.', [('payung','dipegang tangan kiri Maya'),('kartu perjalanan','tersimpan di kantong dalam tas')],
 L('Di halte, tangan kiriku memegang payung; kartu perjalanan ada di kantong dalam tas.','Menempatkan kendala fisik yang relevan.','Bagaimana ia mengambil kartunya?','Payung dan kartu terlihat dalam satu komposisi.','Fiksi — peristiwa ilustrasi.','S10 menunjukkan hambatan.','Kantong dalam menyebut lokasi, bukan mengklaim semua tas punya masalah yang sama.')),
S('S10','B4','Maya menurunkan tas untuk meraih ritsleting saat antre.',
  'Ketidaknyamanan sederhana menjadi alasan pengembalian sampel.', [('tas','diturunkan dari bahu'),('ritsleting','dibuka dengan kedua tangan')],
 L('Aku harus menurunkan tas untuk membuka ritsleting sambil antre.','Memperlihatkan gesekan yang tidak terlihat di sketsa.','Apa yang Maya sampaikan kepada Nisa?','Tas turun dan tangan menarik ritsleting.','Fiksi — tidak menggeneralisasi pengalaman seluruh pelanggan.','S11 kembali ke adegan pembuka.','Harus menerangkan kebutuhan tokoh dalam kejadian rekaan.')),
S('S11','B4','Maya mengembalikan tas bersama secarik catatan.',
  'Membayar sebagian teka-teki awal, sambil menyisakan apakah sarannya benar.', [('tas sampel','dikembalikan kepada Nisa'),('catatan Maya','berisi usul lebih banyak kantong')],
 L('Saat mengembalikannya, aku menulis: “Mungkin perlu lebih banyak kantong.”','Menunjukkan interpretasi awal pelanggan.','Apakah banyak kantong sungguh memecahkan masalahnya?','Catatan diletakkan di atas tas.','Fiksi — tulisan rekaan, bukan kutipan riset.','S12 menunjukkan respons Nisa.','Mungkin membatasi saran sebagai dugaan seorang pengguna.')),
S('S12','B4','Nisa menggambar beberapa kantong pada sketsa tas.',
  'Pemilik usaha dapat tergoda segera melaksanakan solusi pertama yang disebut.', [('sketsa tas','menerima gambar kantong tambahan'),('pensil Nisa','bergerak menuju sketsa')],
 L('Nisa hampir menambahkan tiga kantong lagi.','Memperlihatkan pilihan awal yang tampak masuk akal.','Apakah saran pelanggan lain sama?','Pensil menggambar tiga garis kantong.','Fiksi — rencana desain tokoh.','S13 memperlihatkan masukan lain.','Hampir berarti belum diputuskan.')),
S('S13','B4','Catatan peminjam lain meminta ruang lebih lega.',
  'Dua masukan yang berbeda menciptakan keputusan yang tidak bisa diselesaikan dengan mengiyakan semuanya.', [('catatan peminjam lain','meminta ruang yang lebih lega'),('tas terbuka','menunjukkan ruang bagian dalam')],
 L('Tapi peminjam lain justru ingin bagian dalam tas lebih lega.','Menghadirkan perspektif lain, bukan pasar tunggal.','Usul mana yang seharusnya didahulukan?','Catatan kedua muncul di dekat bagian dalam tas.','Fiksi — peminjam lain dan masukan adalah ilustrasi.','S14 menahan solusi serentak.','Peminjam lain bukan angka statistik atau populasi.')),
S('S14','B5','Sketsa dengan banyak kantong berhadapan dengan tas terbuka.',
  'Mengubah banyak hal sekaligus membuat penyebab perbaikan sulit dipahami.', [('sketsa banyak kantong','ditandai dengan tanda tanya'),('sampel tas','tetap tersedia untuk dibandingkan')],
 L('Kalau semua usul dijahit sekaligus, Nisa akan sulit tahu masalah mana yang terselesaikan.','Membangun pilihan pengujian yang lebih terarah.','Apakah dua pendapat sudah cukup untuk mewakili pembeli?','Pensil berhenti di antara dua usul.','Penalaran cerita — bukan hasil uji kausal pada tas nyata.','S15 memberi batas sampel kecil.','Sulit tahu menghindari klaim bahwa perubahan bersamaan selalu gagal.')),
S('S15','B5','Dua catatan kecil terlihat di depan siluet pelanggan yang beragam.',
  'Sinyal awal berguna untuk pertanyaan, bukan bukti seluruh pasar.', [('dua catatan','dikelompokkan sebagai masukan awal'),('siluet calon pembeli','menunjukkan keragaman kebutuhan')],
 L('Dua pendapat itu juga belum mewakili semua calon pembeli.','Mencegah satu-dua komentar disalahartikan sebagai validasi pasar.','Apa yang bisa Nisa pelajari dari situasi Maya?','Dua catatan tetap terpisah dari kerumunan.','R1 — sampel dan konteks riset tidak membenarkan generalisasi pelanggan fiktif.','S16 meminta penjelasan perilaku.','Belum mewakili bukan berarti masukan awal tidak berguna.')),
S('S16','B5','Nisa menunjuk catatan dan meminta Maya memperagakan masalah.',
  'Pertanyaan terbuka memberi pelanggan ruang menjelaskan, bukan sekadar disuruh menyukai produk.', [('catatan Maya','ditunjuk Nisa'),('tas sampel','disiapkan untuk dicoba')],
 L('Nisa bertanya kapan aku kesulitan, lalu memintaku menunjukkan caraku mengambil kartu.','Memindahkan cerita dari solusi ke pengamatan kebutuhan.','Apa yang Nisa lihat saat Maya mencoba?','Tangan Nisa menunjuk kartu dan tas.','Fiksi — interaksi sukarela rekaan.','S17–S19 memperagakan petunjuk.','Bertanya kapan tidak menyamakan satu demonstrasi dengan eksperimen ilmiah formal.')),
S('S17','B5','Kursi mewakili halte di samping meja jahit; Maya memegang payung.',
  'Dua benda sederhana menghidupkan simulasi tanpa mengklaim data riset asli.', [('kursi','menjadi pengganti halte'),('payung','dipegang Maya saat mencoba')],
 L('Di dekat meja kerjanya, sebuah kursi jadi halte dan payung kembali kupegang.','Menyiapkan pengulangan situasi secara visual.','Bagian mana dari gerakan Maya yang tertahan?','Kursi bergeser ke sisi meja dan payung terbuka.','Fiksi — simulasi adalah adegan rekaan.','S18 menunjukkan proses mengambil kartu.','Jadi halte memberi tahu bahwa ini pengganti, bukan terminal sesungguhnya.')),
S('S18','B5','Maya menurunkan tas dan menjepit payung untuk membuka ritsleting.',
  'Pengulangan aksi memungkinkan penonton menemukan masalah bersama Nisa.', [('payung','dijepit agar kedua tangan bebas'),('ritsleting tas','dibuka setelah tas diturunkan')],
 L('Aku menurunkan tas, menjepit payung, lalu menarik ritsleting dengan dua tangan.','Menampilkan bukti perilaku dalam cerita.','Apa yang berbeda dari saran menambah banyak kantong?','Tangan dan payung berganti posisi di dekat tas.','Fiksi — demonstrasi satu tokoh, bukan statistik.','S19 membingkai titik balik.','Dengan dua tangan adalah pengamatan adegan, tidak berlaku bagi semua.')),
S('S19','B6','Kamera mendekat pada kartu di dalam tas; Nisa melihat gerakan tangan Maya.',
  'Titik balik muncul dari perilaku pelanggan yang berbeda dengan permintaan awalnya.', [('kartu perjalanan','sulit dijangkau dari tas'),('mata Nisa','mengikuti gerakan tangan Maya')],
 L('Di situ Nisa melihat sesuatu yang tidak tertulis dalam saranku.','Membuka pertanyaan tepat sebelum makna berubah.','Apa kebutuhan yang belum tertulis?','Mata Nisa bergerak dari catatan ke tangan Maya.','Fiksi — kesimpulan tokoh bukan temuan peserta studi.','S20 mengungkap kebutuhan Maya.','Sesuatu sengaja menyimpan satu pertanyaan sampai adegan berikut.')),
S('S20','B6','Kartu berpindah dari dalam tas ke bayangan kantong luar.',
  'Perubahan makna bukan penambahan sebanyak mungkin fitur, melainkan akses ketika tangan lain sibuk.', [('kartu perjalanan','mendekati kantong luar'),('kantong luar','muncul sebagai dugaan solusi')],
 L('Mungkin aku tidak butuh lebih banyak kantong.','Menggoyang solusi pertama tokoh.','Apa yang ia butuhkan sebagai gantinya?','Sketsa tiga kantong memudar menjadi satu tanda tanya.','Fiksi — refleksi Maya sendiri.','Kalimat berikut membayar pertanyaan.','Mungkin mempertahankan kebutuhan sebagai hipotesis pribadi.'),
 L('Mungkin aku hanya perlu satu yang mudah kuraih.','Mengungkap kebutuhan dari sudut pembeli.','Bagaimana Nisa mengujinya tanpa produksi massal?','Satu kantong luar disorot dekat tangan Maya.','Fiksi — kebutuhan satu peminjam, belum mewakili pasar.','S21 membuat sampel yang berubah.','Mudah kuraih tidak mengklaim semua orang dapat mengaksesnya.')),
S('S21','B7','Nisa menulis dugaan lalu menjahit kantong luar pada satu sampel.',
  'Menyambungkan rencana pada tindakan yang skala dan tujuannya jelas.', [('kartu dugaan','mencatat kantong luar untuk akses kartu'),('kantong luar','dijahit pada satu sampel')],
 L('Ia mencatat dugaan itu dan menjahit satu kantong luar pada sampel berikutnya.','Menunjukkan satu perubahan yang dapat diuji.','Apakah perubahan itu bekerja dengan baik?','Jarum jahit membentuk satu kantong.','Fiksi; R1 membahas perumusan dan pengujian dugaan secara umum, bukan tas Nisa.','S22 menguji lagi.','Satu sampel bukan resep universal atau jaminan aman.')),
S('S22','B7','Maya meraih kartu, tetapi kesulitan memegang tarikan ritsleting kecil.',
  'Percobaan memberikan hasil campuran, bukan kemenangan instan.', [('kartu perjalanan','dapat diraih dari kantong luar'),('tarikan ritsleting','terlihat terlalu kecil bagi tangan Maya')],
 L('Aku bisa meraih kartu tanpa menurunkan tas, tetapi tarikan ritsletingnya terlalu kecil.','Memberikan payoff parsial dan masalah baru.','Apa yang Nisa ubah selanjutnya?','Kartu keluar sementara jari berhenti pada tarikan.','Fiksi — hasil percobaan tokoh.','S23 menyesuaikan dan mencoba ulang.','Bisa dan tetapi menjaga dua sisi hasil.')),
S('S23','B7','Nisa memasang tarikan ritsleting lebih besar dan Maya mencoba ulang.',
  'Masukan dipakai untuk memperbaiki produk, bukan sekadar dikumpulkan.', [('tarikan ritsleting','diganti dengan versi lebih besar'),('tangan Maya','mencoba ritsleting lagi')],
 L('Nisa mengganti tarikannya, lalu memintaku mencoba lagi.','Menunjukkan siklus perbaikan dan pengujian ulang.','Apakah hasil untuk Maya berarti semua orang cocok?','Tarikan baru bergerak bersama tangan Maya.','Fiksi — perubahan yang khusus untuk cerita.','S24 melibatkan orang lain.','Mencoba lagi tidak mengklaim sudah lolos semua uji kualitas.')),
S('S24','B7','Satu peminjam lain memegang tas; Maya berdiri dekat meja.',
  'Kebutuhan pengguna dapat berbeda menurut tangan, bawaan, dan kebiasaan.', [('sampel tas','dicoba peminjam lain'),('daftar pertanyaan','digunakan untuk mencatat kesulitan')],
 L('Setelah itu ia meminta orang lain mencoba juga.','Menambah sudut tanpa mengklaim representasi.','Mengapa tidak berhenti pada jawaban Maya?','Tas dipinjamkan ke peminjam lain.','Fiksi — peminjam lain bukan responden penelitian.','Kalimat berikut menyebut variasi pengguna.','Orang lain tidak menjanjikan sampel memadai.'),
 L('Tidak setiap orang punya tangan, barang bawaan, dan kebiasaan yang sama.','Mengakui variasi pengguna.','Apakah beberapa tes sudah menjamin penjualan?','Tiga kartu kebiasaan bergeser di samping tas.','Penalaran umum tentang variasi, bukan hitungan prevalensi.','S25 membatasi hasilnya.','Tidak setiap orang menghindari asumsi aksesibilitas yang seragam.')),
S('S25','B8','Nisa menghitung biaya; daftar pertanyaan tetap terbuka.',
  'Pertimbangan biaya dan kebutuhan bukti lebih besar tetap penting.', [('kalkulator','menghitung ongkos produksi'),('daftar masukan','diberi tanda untuk riset lanjutan')],
 L('Ia masih menghitung ongkos dan mencari masukan; beberapa percobaan bukan jaminan tasnya akan laku.','Menghindari akhir kemenangan yang menyesatkan.','Apa yang Maya lakukan setelah perubahan?','Kalkulator dan daftar bergerak bersamaan.','R1 menguji pelatihan dalam konteks tertentu; tidak menjamin hasil usaha individu.','S26 menyelesaikan tindakan Maya.','Bukan jaminan menjaga risiko, biaya dan ketidakpastian.')),
S('S26','B8','Maya membeli satu tas dengan nota kecil; Nisa tetap memegang catatan.',
  'Hasil emosional berupa satu transaksi, bukan klaim tiga cabang atau kekayaan.', [('nota pembelian','menunjukkan satu tas'),('tas versi baru','berpindah ke Maya')],
 L('Dua minggu kemudian, aku membeli satu tas darinya.','Membayar perjalanan tokoh dari peminjam menjadi pembeli.','Apa arti satu pembelian itu bagi usaha Nisa?','Maya menerima tas di depan nota.','Fiksi — waktu dan transaksi bukan hasil studi.','Kalimat berikut mempertahankan batas.','Satu sengaja mencegah kesan antrean atau sukses besar.'),
 L('Itu satu pembelian, bukan bukti usahanya pasti sukses.','Menghindari janji usaha.','Apa sebenarnya yang berubah dari pertanyaan awal?','Nota satu tas tetap di samping tanda tanya usaha.','R1 dan R2 tidak memungkinkan jaminan individu.','S27 merangkum perubahan makna.','Bukan bukti membatasi keberhasilan individual.')),
S('S27','B8','Catatan lebih banyak kantong berubah menjadi gambar kartu dan payung.',
  'Perubahan pertanyaan menunjukkan manfaat melihat dari sisi pengguna.', [('catatan awal','menyebut banyak kantong'),('kartu dan payung','menunjukkan tugas yang ingin dilakukan')],
 L('Aku datang dengan permintaan lebih banyak kantong.','Mengikat akhir pada petunjuk awal.','Apa pertanyaan yang lebih jelas setelah dicoba?','Catatan lama muncul di samping tas.','Fiksi — dialog berasal dari kisah ini.','Kalimat berikut memberi pertanyaan baru.','Datang menandai sudut pandang aku sebagai pengguna.'),
 L('Kami mendapat pertanyaan yang lebih jelas: bagaimana mengambil kartu saat tangan lain sibuk?','Membayar perubahan sudut pandang.','Apakah perencanaan perlu dibuang?','Kartu dan payung berada bersebelahan.','Fiksi — pertanyaan hasil adegan, bukan temuan semua pelanggan.','S28 menegaskan keseimbangan.','Pertanyaan tidak mengklaim solusi akhir sudah sempurna.')),
S('S28','B9','Sketsa dan satu sampel di meja yang sama.',
  'Perencanaan dan pengujian dini saling melengkapi bila risiko dan biaya diperhitungkan.', [('sketsa dan kalkulator','menunjukkan perencanaan dan biaya'),('sampel tas','menunjukkan dugaan yang diuji')],
 L('Perencanaan tetap penting, termasuk menghitung modal dan menjaga kualitas.','Mencegah dikotomi palsu rencana versus aksi.','Apa yang bisa uji kecil tambahkan?','Kalkulator ditempatkan di dekat sketsa.','R1/R2 — pendekatan ilmiah menggabungkan dugaan dan pengujian; syarat sektor tetap berlaku.','Kalimat berikut menyambungkan tindakan.','Tetap menolak pesan anti-riset.'),
 L('Uji kecil yang terjangkau bisa memberi petunjuk sebelum membuat terlalu banyak.','Menghubungkan langkah dengan taruhan modal secara bersyarat.','Kapan suatu ide sudah cukup siap untuk dicoba?','Satu tas bergerak ke depan beberapa sketsa.','R1/R2 mendukung pengujian dugaan dalam konteks studi, bukan jaminan bisnis individu.','S29 mengundang pilihan.','Bisa dan terjangkau menahan klaim serta risiko.')),
S('S29','B9','Maya dan Nisa melihat sampel serta tiga kartu pilihan di meja.',
  'Pertanyaan memancing pertimbangan nyata, bukan meminta komentar kosong.', [('tas sampel','terletak di antara dua tokoh'),('kartu pilihan','menampilkan kapan mencoba dan memeriksa kualitas')],
 L('Menurutmu, kapan sebuah ide sudah cukup siap untuk dicoba orang lain?','Mengundang pengalaman dan batas risiko yang berbeda.','Kondisi apa yang perlu aman sebelum mencoba?','Kartu pilihan muncul dekat meja.','N/A — pertanyaan normatif tentang keputusan usaha.','S30 memberi nilai berbagi dan alasan kembali.','Cukup siap tidak menyarankan menjual sesuatu yang tidak aman.')),
S('S30','B9','Tas yang sudah berubah menutup cerita; nama kanal tampil lowercase.',
  'Berbagi berguna untuk mengajak teman membahas ide dan trade-off.', [('tas versi baru','kembali ke tangan Maya'),('nama kanal','muncul lowercase di area aman')],
 L('Kalau cerita ini dekat, boleh tekan suka dan bagikan ke teman yang sedang membangun sesuatu.','Menyediakan alasan berbagi yang spesifik.','Pertanyaan apa yang ingin teman itu uji lebih dulu?','Tas berpindah ke samping kartu ajakan.','N/A — ajakan opsional, bukan janji hasil.','Kalimat penutup memberikan alasan kembali.','Kalau menjaga ajakan tetap bersyarat.'),
 L('ikuti knot theory untuk cerita lain tentang ide yang berubah saat bertemu kenyataan.','Menjanjikan kisah berikutnya dengan sudut yang konsisten.','Cerita sehari-hari apa berikutnya yang mengubah pandangan?','Nama kanal lowercase muncul di samping tas.','N/A — janji editorial.','Cerita selesai.','Nama kanal ditulis lowercase dan dibaca sebagai dua kata.')),
]

short=[
S('T01','B6','Maya mengembalikan tas ke arah kamera, label ILUSTRASI.', 'Pembuka singkat mempertahankan teka-teki benda.', [('tas sampel','diserahkan kembali'),('tangan Maya','melepaskan tas')],
 L('Aku mengembalikan tas ini.','Membuka dari akibat.','Mengapa tas itu dikembalikan?','Tas mendekati kamera.','Fiksi — adegan rekaan.','T02 memperjelas tokoh.','Aku adalah sudut pelanggan.')),
S('T02','B1','Nama Maya dan Nisa muncul dengan label ilustrasi.', 'Disclosure mandiri untuk video pendek.', [('kartu Maya','memperkenalkan pengguna'),('kartu Nisa','memperkenalkan pembuat tas')],
 L('Aku Maya; aku dan Nisa dalam cerita ini adalah tokoh ilustrasi.','Membedakan fiksi dari kisah nyata.','Apa usaha Nisa?','Kartu nama kedua tokoh bergerak masuk.','Fiksi — tokoh bukan peserta studi.','T03 memberi modal dan tujuan.','Ilustrasi jelas diucapkan.')),
S('T03','B1','Kain dan tas sampel di atas meja Nisa.', 'Tujuan usaha dan modal kecil disampaikan dalam satu beat.', [('kain','diukur untuk sampel'),('tas sampel','dipinjamkan kepada Maya')],
 L('Nisa ingin menjual tas, tetapi uangnya hanya cukup untuk beberapa sampel.','Menunjukkan taruhan usaha kecil.','Apa yang Maya alami saat menggunakan sampel?','Kain dan tas terpisah dari amplop modal.','Fiksi — modal dan usaha adalah rekaan.','T04 membawa sampel ke halte.','Beberapa sampel membatasi sumber daya contoh.'),
 L('Ia meminjamkan satu sampel kepadaku tanpa biaya.','Menjelaskan mengapa Maya menerima tas sebelum penjualan.','Apa yang terjadi di halte?','Tas berpindah ke tangan Maya.','Fiksi — peminjaman sukarela.','T04 menunjukkan masalahnya.','Tanpa biaya bukan resep usaha universal.')),
S('T04','B4','Payung, tas, dan kartu di halte.', 'Masalah di dunia pelanggan menggantikan penjelasan generik.', [('payung','menyibukkan satu tangan'),('kartu perjalanan','sulit dijangkau dari dalam tas')],
 L('Di halte, aku kesulitan mengambil kartu sambil memegang payung.','Membawa konflik ke pengalaman pelanggan.','Saran apa yang ia berikan?','Maya menurunkan tas sambil memegang payung.','Fiksi — pengalaman satu tokoh.','T05 menyatakan saran awal.','Kesulitan tidak berlaku untuk semua pengguna.')),
S('T05','B4','Catatan lebih banyak kantong dan sampel terbuka.', 'Solusi yang terdengar jelas mungkin tidak menjawab masalah.', [('catatan Maya','mengusulkan lebih banyak kantong'),('tas terbuka','memperlihatkan ruangnya')],
 L('Saat mengembalikannya, aku menyarankan lebih banyak kantong.','Membayar pengembalian dan menyatakan tafsir awal.','Apakah itu yang ia butuhkan?','Catatan berada di atas tas.','Fiksi — saran rekaan.','T06 memperlihatkan observasi.','Menyarankan bukan perintah yang harus langsung dituruti.')),
S('T06','B5','Nisa mengamati Maya memperagakan tas dan payung.', 'Melihat tindakan memberi konteks yang tidak ada dalam catatan.', [('tas','diturunkan Maya'),('payung','dijepit untuk membebaskan tangan')],
 L('Nisa memintaku memperagakan caraku mengambil kartu.','Membangun perubahan perspektif.','Apa yang berbeda dari permintaan awal?','Maya memperagakan langkahnya.','Fiksi — satu demonstrasi.','T07 mengungkap masalah.','Memintaku menunjukkan ada persetujuan dalam cerita.')),
S('T07','B6','Satu kantong luar disorot di dekat tangan Maya.', 'Kebutuhan tersembunyi adalah akses, bukan jumlah.', [('kartu perjalanan','berpindah ke kantong luar'),('kantong luar','muncul sebagai dugaan')],
 L('Ternyata aku mungkin hanya butuh satu kantong yang mudah kuraih.','Membayar pembuka dan mengubah definisi masalah.','Bagaimana Nisa menguji dugaan itu?','Satu kantong muncul di dekat tangan.','Fiksi — kebutuhan Maya bukan seluruh pasar.','T08 memberi perubahan dan hasil parsial.','Mungkin menjaga ketidakpastian satu pengguna.')),
S('T08','B7','Kantong luar dan tarikan ritsleting baru.', 'Pengujian dapat memberi hasil campuran dan memicu revisi.', [('kantong luar','dipasang pada satu sampel'),('tarikan ritsleting','diganti setelah percobaan')],
 L('Nisa mengubah satu sampel; kartunya lebih mudah diambil, tapi tarikan ritsletingnya terlalu kecil.','Menunjukkan perubahan dan masalah baru.','Apakah satu percobaan menjamin produk siap?','Kartu muncul dan jari berhenti pada ritsleting.','Fiksi — hasil penggunaan Maya.','T09 memberi batas sampel.','Tapi menjaga hasil tidak terdengar sempurna.'),
 L('Ia memperbaikinya dan meminta orang lain mencoba juga.','Menunjukkan perbaikan dan sudut lain.','Apakah pasar bisa disimpulkan dari beberapa orang?','Tarikan diganti dan sampel berpindah.','Fiksi — penggunaan lain rekaan.','T09 menjelaskan batas.','Orang lain tidak berarti sampel representatif.')),
S('T09','B8','Maya membeli satu tas di samping kalkulator Nisa.', 'Payoff satu pelanggan bukan garansi usaha.', [('nota pembelian','mencatat satu tas'),('kalkulator','mewakili ongkos usaha')],
 L('Dua minggu kemudian, aku membeli satu tas, bukan bukti usahanya pasti sukses.','Memberikan hasil tokoh dengan pembatasan.','Apa peran perencanaan sesudah itu?','Nota satu pembelian diletakkan di meja.','Fiksi — satu transaksi; R1 bukan garansi individu.','T10 merangkum pelajaran.','Satu pembelian bukan angka penjualan usaha nyata.')),
S('T10','B9','Sketsa dan satu tas berdampingan.', 'Perencanaan dan percobaan adalah pelengkap.', [('sketsa','mewakili rencana'),('sampel tas','mewakili pengujian kecil')],
 L('Rencana dan uji kecil yang terjangkau bisa saling melengkapi.','Menghindari pilihan palsu antara berpikir dan bertindak.','Kapan ide siap dicoba orang lain?','Sketsa dan tas sama-sama terlihat.','R1/R2 memberi konteks pengujian, bukan jaminan hasil.','T11 mengundang pilihan.','Bisa dan terjangkau mempertahankan batas risiko.')),
S('T11','B9','Maya dan Nisa melihat tas, nama kanal muncul lowercase.', 'Pertanyaan spesifik memberi alasan diskusi dan berbagi.', [('tas','menjadi pusat pertanyaan'),('nama kanal','muncul lowercase di sisi aman')],
 L('Menurutmu, kapan ide sudah cukup siap untuk dicoba?','Mengundang pertimbangan yang berbeda.','Apa syarat keamanan dan biaya yang penting?','Kartu tanya muncul di samping tas.','N/A — pertanyaan normatif.','Penutup memberi nilai berbagi.','Cukup siap bukan ajakan menjual produk berbahaya.'),
 L('Kalau dekat, boleh suka dan bagikan ke teman yang sedang membangun sesuatu.','Menyediakan nilai berbagi yang spesifik.','Pertanyaan apa yang ingin temanmu uji?','Tas bergerak ke arah kartu teman.','N/A — ajakan bersyarat.','Nama seri memberi alasan kembali.','Kalau membuat ajakan opsional.'),
 L('ikuti knot theory untuk cerita tentang ide yang berubah saat bertemu kenyataan.','Memberi alasan kembali.','Kisah ide apa berikutnya?','Nama kanal tampil lowercase.','N/A — janji editorial.','Short selesai mandiri.','Nama kanal dibaca sebagai dua kata.')),
]

sources=[dict(id='R1',url='https://doi.org/10.1287/mnsc.2018.3249',supports='Camuffo et al. (2020) menguji pelatihan pendekatan ilmiah pada 116 startup Italia; formulasi dan uji dugaan adalah bagian perlakuan.',limits='Konteks startup Italia dan pelatihan kelompok; tidak menguji tas atau menjamin usaha individu.'),
         dict(id='R2',url='https://doi.org/10.1002/smj.3580',supports='Camuffo et al. (2024), empat RCT mencakup 759 perusahaan, membahas pelatihan pendekatan ilmiah untuk keputusan dan penyesuaian usaha.',limits='Konteks Italia dan London; tidak menunjukkan bahwa mencoba lebih sering selalu sukses atau sampel dua orang mewakili pasar.')]

def B(bid,kind,before,event,after,next_,emotion):
 return dict(id=bid,kind=kind,before=before,event=event,after=after,causeToNext=next_,emotionHypothesis=emotion,sourceIds=['R1','R2'])
beats=[
 B('B1','context','Maya dan Nisa adalah tokoh rekaan.','Nisa punya modal terbatas dan gagasan tas untuk pengguna angkutan.','Ada tujuan dan biaya sebelum usaha dimulai.','Rancangan terus bertambah di meja.','Penonton mungkin mengenali rasa ragu dengan modal terbatas.'),
 B('B2','disruption','Sketsa dan modal berada di meja.','Nisa berulang kali menunda menggunting kain.','Keputusan kecil belum bergerak.','Ia akhirnya membuat satu sampel untuk dipinjam Maya.','Penonton bertanya apakah penundaan membantu atau menghalangi.'),
 B('B3','escalation','Sampel pertama dibuat dan dipinjamkan tanpa biaya.','Maya suka tampilannya dan menggunakannya di halte.','Warna yang disukai tidak menjawab semua kebutuhan.','Tangan sibuk dan kartu tersembunyi menciptakan masalah.','Rasa akrab pada kesulitan kecil saat bepergian.'),
 B('B4','escalation','Maya mencoba mengambil kartu saat satu tangan memegang payung.','Ia mengembalikan sampel dan menyarankan kantong lebih banyak; pengguna lain ingin ruang lebih lega.','Masukan menjadi dua dugaan yang berbeda.','Nisa perlu memilih pertanyaan yang akan diuji.','Konflik harapan yang tidak perlu menjadikan salah satu pihak jahat.'),
 B('B5','crisis','Nisa tidak bisa menyimpulkan pasar dari dua orang.','Ia meminta Maya memperagakan aktivitas memakai payung dan mengambil kartu.','Saran tertulis dapat dibandingkan dengan tindakan.','Pengamatan membuka kebutuhan yang belum terucap.','Antisipasi menemukan detail yang terlewat.'),
 B('B6','climax','Pembuka memperlihatkan pengembalian tas; tubuh cerita membawa Maya ke demonstrasi.','Nisa melihat bahwa akses ke satu kantong mungkin lebih penting daripada jumlah kantong.','Teka-teki pengembalian mendapat konteks dan makna baru.','Satu dugaan diuji melalui sampel baru.','Kejutan memahami masalah dari sisi pemakai.'),
 B('B7','turning_point','Masalah awal disangka kurang banyak kantong.','Nisa mengubah satu sampel, menerima temuan baru dan meminta orang lain mencoba.','Perencanaan dan pengamatan saling melengkapi.','Biaya dan batas hasil awal tetap perlu diperhatikan.','Kepuasan atas perbaikan tanpa kepastian palsu.'),
 B('B8','consequence','Satu sampel sudah berubah tetapi usaha belum pasti.','Nisa menghitung biaya; Maya membeli satu tas.','Satu pelanggan mendapat manfaat tanpa menjadi bukti semua orang membeli.','Pelajaran mengarah pada uji terjangkau dan kualitas.','Harapan bersahaja disertai ketidakpastian.'),
 B('B9','payoff','Kebutuhan dan keterbatasan contoh sudah jelas.','Perencanaan serta uji kecil sama-sama penting; audiens mempertimbangkan kapan mencoba.','Pertanyaan awal dibayar tanpa menyimpulkan sukses pasti.','Penonton dapat berdiskusi dan berbagi dengan orang yang sedang mengembangkan ide.','Penasaran pada pilihan nyata bukan paksaan komentar.'),
]

brief=dict(schemaVersion=1,format='long-master',storyId='tas-yang-kukembalikan',scriptId='tas-yang-kukembalikan-master-v1',truthMode='fiction',
 fictionDisclosure='Maya, Nisa, peminjam lain, usaha tas, transaksi dan seluruh dialog adalah tokoh serta adegan ilustrasi rekaan, bukan peserta penelitian atau kisah bisnis nyata.',
 premise='Seorang calon pembeli mengembalikan sampel tas; dari tindakannya pembuat menemukan kebutuhan akses yang berbeda dari usul jumlah kantong.',
 dramaticQuestion='Mengapa tas yang disukai Maya dikembalikan, dan apa yang dapat dipelajari Nisa sebelum menghabiskan modal?',
 entity='Satu tas sampel rekaan yang berpindah antara Maya si calon pembeli dan Nisa si pembuat.',
 goal='Memahami kendala pelanggan dan menguji satu perubahan dengan skala terjangkau.',
 stakes='Modal Nisa terbatas; waktu dan kenyamanan Maya saat mengambil kartu juga penting.',
 audienceAnchor='Orang yang mencoba membangun usaha atau pernah menggunakan produk yang tampak bagus tetapi menyulitkan satu aktivitas kecil.',
 sources=sources,beats=beats,
 hook=dict(entityAtFrame0='Tas sampel yang dikembalikan; label ILUSTRASI dari frame nol.',peakVisual='Tangan Maya melepas tas ke arah pembuat sebelum alasan diketahui.',openingLine='Aku mengembalikan tas ini.',cutQuestion='Mengapa Maya mengembalikan tas yang disukainya?',climaxBeatId='B6',answerBeatId='B6',visualCutSeconds=None,spokenOpeningSeconds=None),
 turn=dict(clueBeatId='B4',revealBeatId='B7',oldMeaning='Maya menyangka tas membutuhkan lebih banyak kantong.',newMeaning='Nisa menduga Maya membutuhkan akses yang lebih mudah pada satu kantong.',changedStake='Tidak setiap saran perlu dituruti secara literal; masalah dan biaya perlu ditanyakan sebelum produksi.',evidenceBoundary='Tokoh dan hasil adalah fiksi; R1/R2 tidak menguji cerita tas atau menjamin keberhasilan bisnis.'),
 interactions=dict(comment=dict(beatId='B9',storyMoment='Nisa punya modal terbatas dan menerima saran berbeda dari pengguna.',question='Kapan sebuah ide sudah cukup siap untuk dicoba orang lain?',whyDiscuss='Mengundang pertimbangan kesiapan, biaya, keamanan dan kebutuhan pengguna yang berbeda.',viewpoints=['Mulai dengan sampel kecil yang aman agar mendapat sinyal awal.','Lengkapi dulu perhitungan dan uji kualitas untuk menghindari kerugian.'],avoidFalseBalance='Jangan menyarankan produk berisiko dicoba publik tanpa standar keselamatan dan persetujuan.'),share=dict(beatId='B9',recipient='Teman yang sedang mengembangkan usaha atau proyek.',value='Pemantik membahas pertanyaan apa yang perlu diuji sebelum belanja besar.'),follow=dict(seriesPromise='Cerita fiktif tentang ide sehari-hari yang berubah ketika dilihat dari sisi orang lain.',whyReturn='Setiap cerita dimulai dari benda dan membayar pertanyaan melalui perubahan perspektif.')),
 shortPlan=dict(sourceBeatId='B6',context='Maya meminjam sampel tas Nisa dan kesulitan mengambil kartu ketika membawa payung.',miniConflict='Maya menyarankan lebih banyak kantong, sementara Nisa mengamati cara ia memakai tas.',standalonePayoff='Satu kantong yang mudah dijangkau diuji dan Maya membeli satu, tanpa janji sukses bisnis.',distortionRisk='Jangan menyiratkan cerita nyata atau satu pelanggan dapat mewakili pasar.'),
 scenePlan=[dict(sceneId=s['id'],beatId=s['beat'],objectMap=s['objects']) for s in master])

def package(items,name,script_id):
 script=dict(id=script_id,status='DRAF PRIVAT — bukan persetujuan editorial, prevoice atau tayang',scenes=[dict(id=s['id'],narration=' '.join(x['text'] for x in s['lines'])) for s in items])
 audit=dict(scriptId=script_id,audienceAnchor=dict(situation='Calon pembeli mencoba sampel usaha kecil dalam rutinitas sehari-hari.',scope='Seluruh tokoh, peristiwa dan transaksi adalah fiksi; masukan kecil bukan bukti seluruh pasar.'),items=[dict(sceneId=s['id'],**line,connection=s['connection']) for s in items for line in s['lines']])
 for kind,doc in [('script',script),('audit',audit)]: (ROOT/f'{name}.{kind}.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 def script_md():
  lines=[f'# Naskah {name.title()} — Tas yang Kukembalikan','','DRAF PRIVAT: Maya, Nisa, usaha dan kejadian adalah ilustrasi rekaan.','']
  for s in items: lines.extend([f"## {s['id']}",' '.join(x['text'] for x in s['lines']),''])
  return '\n'.join(lines)
 def storyboard_md():
  lines=[f'# Storyboard {name.title()} — Tas yang Kukembalikan','','Ilustrasi rekaan. Waktu dan gerak final perlu diperiksa pada video.','','| Scene | Beat | Narasi | Visual | ObjectMap |','|---|---|---|---|---|']
  for s in items: lines.append(f"| {s['id']} | {s['beat']} | {' '.join(x['text'] for x in s['lines'])} | {s['framing']} | "+'; '.join(f"{x['object']} → {x['action']}" for x in s['objects'])+' |')
  return '\n'.join(lines)+'\n'
 (ROOT/f'naskah-{name}.md').write_text(script_md(),encoding='utf-8')
 (ROOT/f'storyboard-{name}.md').write_text(storyboard_md(),encoding='utf-8')

package(master,'master',brief['scriptId']);package(short,'short','tas-yang-kukembalikan-short-v1')
(ROOT/'brief.json').write_text(json.dumps(brief,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
meta={k:[dict(id=s['id'],beat=s['beat'],framing=s['framing'],objectMap=s['objects']) for s in arr] for k,arr in [('master',master),('short',short)]}
(ROOT/'render-meta.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f"Wrote {len(master)} master scenes/{sum(len(s['lines']) for s in master)} sentences, {len(short)} short scenes/{sum(len(s['lines']) for s in short)} sentences.")
