# Content Studio — rencana implementasi dan handoff agen

Status: **DESIGN / BELUM DIIMPLEMENTASIKAN**. Tanggal: 15 November 2026.
Pemilik implementasi: agen pengguna di Git sandbox. Paket ini adalah spesifikasi kerja;
keberadaan dokumen bukan bukti aplikasi, integrasi, UI, deployment, atau renderer telah dibuat.

## Tujuan produk

Pengguna memasukkan VO dan timestamp melalui UI, memilih gaya tersimpan, kemudian
sistem membuat storyboard, visual, animasi tersinkron, preview yang dapat direvisi,
dan MP4 penuh. Episode baru memakai data baru tanpa mengubah source komponen.
Default kreatif: **explainer teknis, ilustrasi presisi, diagram, transformasi objek,
dan hubungan sebab-akibat**. Long-form menjadi master; Shorts adalah turunan terkontrol.

Target awal adalah aplikasi privat satu pemilik yang dapat dideploy. Fondasi data
memiliki workspace agar otorisasi tidak perlu ditambahkan secara tambal sulam kelak.
Pembuatan produk SaaS publik, penagihan pelanggan, kolaborasi realtime, dan publikasi
ke media sosial berada di luar MVP. Ekspor MP4 tidak berarti izin publikasi.

## Cara membaca

1. [Arsitektur dan perubahan struktur](01-ARCHITECTURE.md): keputusan stack,
   komponen, boundary, migrasi, penyimpanan, deployment, dan failure recovery.
2. [Kontrak data dan API](02-CONTRACTS-AND-API.md): waktu, scene, revisi, job,
   persistence, endpoint, event, dan invalidasi cache.
3. [Spesifikasi UI](03-UI-SPEC.md): route, komponen, state, interaksi, aksesibilitas,
   storyboard, revisi, render, dan ekspor.
4. [Integrasi dan keputusan tools](04-INTEGRATIONS.md): seluruh 15 repo yang diteliti,
   link GitHub, penggunaan wajib/opsional, lisensi, dan evaluasi renderer.
5. [Fase implementasi dan backlog](05-PHASES-AND-ACCEPTANCE.md): urutan pembangunan,
   dependency, hasil per fase, pengujian, dan definition of done.
6. [Instruksi untuk agen pelaksana](06-AGENT-HANDOFF.md): langkah awal, batas scope,
   cara menghemat token, pelaporan, dan prompt siap pakai.

## Keputusan pokok

- Bangun **modular monolith + worker proses terpisah**, bukan mikroservis penuh.
- UI Next.js/React/TypeScript; API Fastify/TypeScript; PostgreSQL; antrean BullMQ/Redis;
  object storage privat; worker Node untuk orchestration/render, Python terisolasi
  untuk transkripsi/alignment bila diperlukan. Semua pilihan harus dipin setelah spike.
- Gunakan satu kontrak renderer. Uji HyperFrames sebagai kandidat utama terhadap
  OpenFilm baseline dan Remotion alternatif. Pilih satu renderer produksi di fase 0;
  jangan mengimplementasikan tiga editor atau tiga renderer lengkap sekaligus.
- Simpan VO, timestamp asli, aset, thumbnail, dan output di storage privat. Git publik
  hanya menyimpan source, dokumentasi, schema, dan fixture sintetis nonrahasia.
- Rencana visual dipisahkan dari kode render. Model menghasilkan data scene yang
  divalidasi; MVP tidak menjalankan JavaScript arbitrer hasil model.
- Setiap hasil terikat revisi, hash input, versi style, versi planner, dan renderer.
  Review lama tidak otomatis berlaku setelah perubahan.
- Seluruh UI dalam Bahasa Indonesia; pesan error memberi tindakan pemulihan.
- Jalur lokal menggunakan **Chrome standar** yang dapat dikonfigurasi; deployment
  menggunakan browser worker yang dipin dan diuji. GUI tidak menjadi syarat server.

## Batas kemampuan otomatis

Timestamp yang berisi narasi dapat langsung dinormalisasi. Timestamp angka saja
memerlukan transkripsi VO untuk memperoleh makna. Scene timing kasar perlu alignment
kata/frasa untuk cue animasi; confidence rendah ditampilkan untuk review. Sistem tidak
boleh mengarang kata yang tidak ada atau mengubah kecepatan VO agar cocok dengan visual.

Pemeriksaan geometri, waktu, decode, dan kelengkapan aset bisa otomatis. Akurasi fakta,
kejelasan ilustrasi, kenyamanan gerak, dan kualitas cerita tetap memiliki status review
tersendiri. Label `PASS` mekanis tidak boleh dipromosikan menjadi `profesional` otomatis.

## Dasar yang harus tetap berlaku

- [Fondasi editorial](../../EDITORIAL-FONDATION.md).
- [Standar produksi minimum](../../STANDARD-MINIMAL-CONTENT-PRODUCTION.md).
- [Sistem cerita long-form](../../editorial-engine/docs/SISTEM-CERITA-LONG-FORM.md).
- [Metode visual sebab-akibat](../../editorial-engine/docs/METODE-VISUAL-SEBAB-AKIBAT.md).
- [Story gate yang sudah ada](../../editorial-engine/pipeline/story-engine/README.md).
- [Kebijakan media privat dan cadangan](../../KEBIJAKAN-CADANGAN-ANTI-RESET.md).

Input VO yang sudah jadi tetap melewati pemeriksaan pra-final yang ekuivalen dengan
`prevoice`; nama tahap lama tidak mengizinkan bypass. Animatic privat boleh dibuat
lebih awal dan harus ditandai draft. Jika input tidak cukup untuk brief/audit, UI
meminta isian yang kurang sebelum final, sambil tetap membolehkan draft.

## Gambaran keberhasilan

Setelah implementasi selesai, tiga episode sintetis berbeda topik dapat dibuat lewat
UI tanpa mengedit source; render tahan restart; revisi satu scene tidak mengulang AI
untuk seluruh episode; MP4 penuh dapat diunduh dari artifact yang tervalidasi; aset
privat tidak masuk Git/log publik. Kriteria terukur dan tahapan ada di dokumen fase.
