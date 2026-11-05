# Audit revisi dan pembelajaran metrik — KNOT THEORY

Berlaku 5 November 2026. Tambahan pada doktrin 04 dan strategi 05. Laporan lengkap dengan angka performa dan draf koreksi disimpan privat di folder KNOT THEORY di Drive, bukan di repo publik.

## 1. Prinsip pembacaan performa

- **VERIFIED:** snapshot Buffer dapat memiliki `metricsUpdatedAt` yang jauh lebih lama dari waktu permintaan dan usia unggahan yang berbeda. Status `sent` tidak membuktikan visibilitas publik, distribusi feed atau retensi.
- **UNKNOWN:** penyebab perbedaan performa tanpa data tampil di feed, memilih menonton vs menggeser, retensi, sumber traffic dan pembatasan per video.
- **HYPOTHESIS:** pinjol membuka dengan masalah personal dan kalimat sehari-hari, sedangkan BSU dan APBN memulai dengan angka agregat; cara pembingkaian ini mungkin memengaruhi minat. Jangan menganggapnya sebab yang terbukti.
- Ukur per platform, tanggal pembaruan dan umur video yang sama; jangan simpulkan shadowban atau menyalahkan jarak dua jam tanpa bukti. Sampel kecil menghasilkan ketidakpastian besar.
- Video vertikal/persegi lebih dari tiga menit bukan YouTube Shorts. Arahan 3–5 menit tetap berlaku: gunakan format video yang sesuai dan hanya buat versi pendek terpisah atas arahan.

## 2. Temuan teknis — bukan diagnosis sebab tayangan

- **FAIL:** MP4 lokal pinjol, BSU dan APBN memiliki satu frame hitam pada frame 0; teks BSU/APBN belum lengkap pada detik pertama. Pinjol juga memiliki frame hitam, jadi temuan ini sendiri tidak menjelaskan performanya. PHK v2 menampilkan headline lengkap di frame 0.
- **NEEDS REVIEW:** PNG thumbnail APBN lokal memiliki baris kedua terpotong. Belum diverifikasi apakah PNG tersebut menjadi cover di platform.
- Standar episode mendatang: frame 0 langsung berisi thumbnail dan headline yang utuh serta terbaca di ponsel, tanpa fade-in; bukan screenshot. Visual pertama menampilkan objek konkret yang disebut dalam narasi. Periksa area aman dan playback final.

## 3. Integritas informasi lebih penting daripada optimasi kemasan

- **PHK — NEEDS CORRECTION:** 72.336 adalah angka Kemnaker Januari–Oktober yang dikutip Bloomberg Technoz; >90.000 adalah perkiraan KSPI untuk akhir tahun menurut Bisnis Insight, bukan realisasi pada periode yang sama. Jangan menyebutnya dua angka resmi yang saling bertentangan tanpa menyatakan perbedaan periode dan sifat data sejak hook. Klaim tentang sebab selisih dan mekanisme pelaporan perlu sumber primer. Teks koreksi hanya diterbitkan setelah persetujuan pemilik.
- **APBN — NEEDS CORRECTION:** perbandingan defisit total dengan defisit primer adalah identitas akuntansi; itu bukan bukti bahwa seluruh pembiayaan defisit dialokasikan khusus untuk bunga. Sumber yang tersedia tidak membuktikan klaim bahwa bunga dibayar sebelum semua program dimulai. Verifikasi postur APBN pada dokumen primer dan nyatakan hitungan sendiri sebelum menayangkan koreksi.
- **BSU — CAUTION:** sasaran penerima dibanding seluruh orang bekerja bukan persentase orang yang memenuhi syarat. Sebut pembilang, penyebut dan periodenya.
- Jangan menghapus, mengunggah ulang atau mengubah posting yang sudah tayang tanpa arahan eksplisit.

## 4. Revisi kreatif yang layak diuji

Mulai dari masalah atau pertanyaan yang relevan dengan seseorang, lalu jelaskan angka dan dampaknya tanpa kehilangan konteks. Contoh arah (bukan klaim baru): bantuan upah dan siapa yang memenuhi syarat; dampak beban bunga pada ruang kebijakan; nasib pekerja yang mungkin tidak tercatat. Pakai benda konkret, percakapan langsung dan payoff bertahap. CTA like, komentar dan subscribe/follow tetap natural dalam cerita serta di penutup. Jangan mengklaim formula CTA, kata kunci atau durasi tertentu pasti menaikkan view.

## 5. Privasi dan keselamatan operasional

Repo ini publik. Jangan masukkan kunci, metrik privat mentah atau screenshot analitik ke log Actions, anotasi publik, commit atau artefak publik. Workflow analitik ini read-only dan mengenkripsi hasil sebelum anotasi; kunci privat sesaat tidak boleh berada di repo atau runner. Kunci publik yang pernah dipakai tidak cukup untuk membaca hasil lama; audit baru memerlukan pasangan kunci baru dan persetujuan/push branch yang berlaku. Workflow ini tidak boleh diberi operasi create/update/delete/publish.
