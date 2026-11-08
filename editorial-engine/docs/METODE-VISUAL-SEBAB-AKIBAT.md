# Metode visual sebab-akibat — Dunia Kebalik

Panduan pendukung [sistem cerita panjang](SISTEM-CERITA-LONG-FORM.md); Awan V3 adalah contoh historis, bukan master long-form aktif. Ini standar desain
dan pengujian, bukan bukti bahwa penonton akan bertahan lebih lama.

## Dari daftar objek menjadi rangkaian tindakan

1. Pilih objek utama yang benar-benar tampak dari frame 0. Pada kilas puncak,
   tunjukkan fragmen peristiwa asli lalu cut di titik pertanyaan; jangan
   menampilkan puncak palsu yang tidak dijawab.
2. Pada storyboard, setiap adegan tetap memuat sedikitnya dua objek dan
   `objectMap`, tetapi tambahan wajibnya adalah **hubungan**: siapa/apa yang
   bergerak, apa yang disentuh atau diubah, dan apa akibatnya. Beri keadaan
   sebelum → peristiwa → sesudah, termasuk waktu perkiraan pada satu clock.
3. Buat satu identitas visual untuk objek yang kembali lintas adegan.
   Ubah keadaan objeknya (mis. utuh → retak → pecahan, atau luar → penampang)
   sambil mempertahankan bentuk/warna/posisi yang membuat callback dikenali.
4. Gunakan gerakan untuk menyampaikan sebab-akibat: mendekat → kontak →
   reaksi; panah hanya untuk proses yang tak terlihat dan diberi label
   **skema/ilustrasi**. Jelaskan jika animasi diperlambat, tidak berskala atau
   tidak merekam peristiwa nyata. Jangan mengorbankan akurasi demi efek.
5. Hubungkan tangan/alat melalui titik pegangan dan jaga kontinuitas ukuran,
   arah, latar, tatapan dan konsekuensi. Satu gerakan yang bermakna lebih baik
   daripada zoom, bounce, label, atau perubahan latar yang berulang tanpa
   fungsi. Rig Host tetap konsisten; ekspresi dan posisi tangan menanggapi aksi.
6. Bagi perhatian: satu fokus utama, judul ringkas, dua keluarga font paling
   banyak, subtitle jelas tanpa menutup wajah; cek posisi aman di perangkat
   dan platform, bukan hanya pada kanvas 1080×1920.
7. Gunakan lingkungan konkret yang cocok dan palet yang bervariasi, tetapi
   jangan mengganti latar untuk menyamarkan kurangnya aksi. Adegan berisiko
   memerlukan batas keselamatan dan tidak boleh menjadi instruksi percobaan.

## Format catatan per adegan

- Narasi / klaim dan sumber primer.
- Objek dan relasi: `pelaku → tindakan → objek → perubahan`.
- `t0` keadaan awal, `t1` kontak/petunjuk, `t2` akibat, `t3` peralihan.
- Apa yang konsisten saat kembali ke adegan (identitas, prop, arah, konteks).
- Apakah angka/warna/motion berupa skema, perkiraan, atau observasi.
- Status tes: model matematika, gambar sampel, video penuh, suara, perangkat,
  hak, dan penilaian penonton adalah pemeriksaan yang berbeda.

## Gate yang jujur

- **PASS numerik**: lintasan/IK, titik kontak yang dimodelkan, arah transformasi,
  urutan peristiwa, timeline dan decode dapat diuji otomatis.
- **PASS sampel** hanya jika gambar yang diambil dari hasil benar-benar
  diperiksa; jangan menggeneralisasi sampel menjadi seluruh animasi.
- **NEEDS REVIEW / NOT TESTED** untuk audio, subtitle terhadap ucapan,
  kenyamanan gerak, keterbacaan di ponsel, kualitas cerita, hak atau playback
  yang belum diperiksa. Mintalah review manusia sebelum izin tayang.
- Setelah QA dan persetujuan, Buffer tetap menjadi pengelola antrian; metode
  ini tidak membuat atau mengubah jadwal dan bukan jaminan performa.

Contoh implementasi khusus: `pipeline/kaca-rupert-visual-v1/` memakai satu
siluet kaca, lintasan palu di sekitar pergelangan, retak dari ekor ke kepala,
pecahan, dan penampang tegangan. Tes matematika bukan bukti eksperimen kaca
nyata, keamanan praktik, ataupun bahwa video sudah ditonton dari awal sampai
akhir.
