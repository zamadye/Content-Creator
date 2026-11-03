# MISI 6 — "Angka yang turun" (`karhutla-angka-turun-2026`)

Status: **selesai dan lolos QA** — 89,63 s · 1080×1920 · 30 fps · 20/20 PASS.
Tanggal: 3 November 2026. Misi ini dipilih karena **potensi sebaran**, bukan hanya bobot editorial: kebakaran lahan sedang berjalan, angkanya baru, dan ada satu kontradiksi yang bisa dipotret dalam satu frame.

---

## 1. Mengapa topik ini, dan mengapa sekarang

Pada 2 November 2026 BNPB mengumumkan angka yang **turun**: Kalimantan Tengah −42 persen, Papua Selatan −56 persen. Di hari yang sama, angka lain tidak turun sama sekali: 333.470 kasus ISPA, 7,9 juta murid kehilangan kelas tatap muka, dan rekap 23 Oktober menunjukkan 41.554 hektare sudah terbakar dengan 26.681 hektare masih membara.

Media melaporkan keduanya, tapi jarang di frame yang sama. Itulah celah editorialnya — bukan "kebakaran itu buruk" (semua tahu), melainkan **"angka yang kamu lihat hari ini menjawab pertanyaan yang berbeda dari yang kamu kira."**

Tesis: *setiap hari negara mengumumkan angka yang lebih kecil, dan angka itu benar — tapi ia menghitung luas yang masih terbakar hari ini, bukan luas yang sudah jadi arang, bukan orang yang sudah terlanjur sakit, dan bukan bara yang tetap menyala di bawah tanah.*

## 2. Riset dan status bukti

Berkas sumber: `research/sources/karhutla-angka-turun-2026.sources.json` — 10 sumber, 12 butir VERIFIED, 1 turunan (D1), 1 UNKNOWN (U1).

| Kode | Isi | Sumber |
|---|---|---|
| K1 | 742 ha masih terbakar secara nasional, 2 Nov 2026 | BNPB (2 Nov 2026) |
| K2 | Kalteng 351 ha (−42 %), Papua Selatan 253 ha (−56 %) | BNPB (2 Nov 2026) |
| K3 | Papua Selatan: 1.742→695 ha; 943→379 titik panas; 263→171 titik api | BNPB (2 Nov 2026) |
| K4 | 19.708 titik panas; 41.554 ha terbakar; 26.681 ha belum padam (23 Okt) | BNPB via detikNews (25 Okt 2026) |
| K5 | 333.470 kasus ISPA di 68 kab/kota, 7 provinsi (18 Agu–21 Okt) | Kemenkes (1 Nov 2026) |
| K6 | 7,9 juta peserta didik; 61.693 satuan pendidikan berhenti tatap muka | Kemendikdasmen (15 Okt 2026) |
| K7 | 12,5 juta warga terdampak; 4 kematian terkait ISPA per 9 Sep | Kemenkes / Suara.com |
| K8 | Jarak pandang Kalteng 0,2 km; Jambi & Sumsel "berbahaya" | Dashboard BNPB (17 Okt 2026) |
| K9 | Malaysia menutup sekolah 8–9 Okt 2026 | Pemerintah Malaysia |
| K10 | 104 LP, 97 penyidikan, 29.168,78 ha, 20 tersangka korporasi (4 PMA) | Bareskrim Polri (29 Okt 2026) |
| K11 | Pasal 98/99/108 UU 32/2009: 5 tahun, denda Rp15 miliar | Bareskrim Polri |
| K12 | El Nino sangat kuat; OMC Papua Selatan sejak 31 Okt | BNPB |
| D1 | 26.681 = 64 % dari 41.554 (hitungan sendiri, tanggal sama) | turunan |
| U1 | Total luas terbakar Januari–November 2026 | **UNKNOWN — ditampilkan sebagai TIDAK ADA DATA** |

**Keputusan kejujuran yang paling penting:** 742 ha dan 41.554 ha **tidak pernah** digambar sebagai satu deret grafik. Keduanya muncul di scene berbeda (h02 dan h03) dengan label tanggal dan metode masing-masing, ditambah baris di layar: *"Dua metode pemantauan. Tidak dikurangkan."* Scene h06 melakukan hal yang sama untuk 29.168 ha milik Polri — angka itu tidak ditempelkan ke rekap BNPB.

## 3. Struktur (7 scene, 2689 frame)

| Scene | Peran | Yang terlihat | Angka di layar |
|---|---|---|---|
| h01 · 12,13 s | HOOK | Potongan tanah gambut malam: tunggul hangus, asap tipis di atas garis permukaan, bara berpijar di bawahnya | 7,9 juta murid · 333 ribu sakit |
| h02 · 14,07 s | CONTEXT | Papan rekap di dinding posko, peta iltustrasi, lampu sorot | 742 ha · Kalteng 351 (−42 %) · Papua Selatan 253 (−56 %) |
| h03 · 14,57 s | CONFLICT | Dua kartu, dua tanggal; pita bara 64 % di dalam kartu 23 Oktober | 41.554 ha · 26.681 masih membara |
| h04 · 11,79 s | DEVELOPMENT | Potongan gambut dari dekat: hujan masuk, bara tidak tersentuh | label lapisan + El Nino |
| h05 · 15,50 s | PERSPECTIVE | Kelas kosong berkabut, tas tergantung di kursi | kelas kosong · asap lintas negara |
| h06 · 11,20 s | EVIDENCE | Papan penyidikan: empat kartu tersemat, benang penghubung | 104 · 97 · 20 tersangka · 5 thn |
| h07 · 10,37 s | CLOSING | Lahan yang sama, gelap; satu bara masih menyala di bawah garis tanah | *"Yang padam dilaporkan. Yang membara tidak."* |

Perubahan visual besar tiap 3–5 detik; tidak ada shot statis lebih dari 5 detik.

## 4. Keputusan visual

- **Api tidak pernah digambar sebagai kobaran.** Yang tampil adalah *bara*: titik pijar di dalam lapisan tanah. Ini bukan penghalusan — inti argumennya memang api yang hidup di bawah permukaan.
- Satu ruang konkret per scene (tanah gambut, papan posko, dinding data, kelas, papan penyidikan). Tidak ada latar abstrak.
- Palet bumi: arang `#141713`, tanah `#221B12`, bara bata `#B23A2C`, mustard untuk label. Satu sumber cahaya per scene.
- Tipografi tetap dua keluarga. Perbaikan font (lihat §6) membuat subtitle akhirnya benar-benar Archivo, bukan serif.
- Sampul: bukan potongan frame. Gambar sinematik hasil model gambar — seorang lelaki berdasi memegang papan bergambar panah turun, berdiri di atas tanah hangus yang masih membara. Tagline: *"Angkanya turun. / Tanahnya menyala."*

## 5. Artefak

| Berkas | Ukuran |
|---|---|
| `deliverables/B_karhutla-angka-turun-2026_1080x1920.mp4` | 9,48 MB (2689 frame, h264 high, crf 18, faststart) |
| `deliverables/T_karhutla-angka-turun-2026_1080x1920.png` | 2,05 MB |
| `deliverables/A_karhutla-angka-turun-2026_1080x1350.png` | 1,49 MB |
| `deliverables/C_karhutla-angka-turun-2026.srt` / `.vtt` | 28 cue |
| `deliverables/caption_karhutla-angka-turun-2026.txt` | 8,97 kB — 4 platform + komentar pertama + 5 balasan + catatan unggah |
| `qa/QA-TECHNICAL-karhutla-angka-turun-2026.md` | laporan QA |
| `audio/mix/karhutla-angka-turun-2026.master.wav` | −14,1 LUFS / −3,4 dBTP |

Semua diunggah ke folder Drive konten (paket 3 berkas: `.mp4` + thumbnail `.png` + `caption_….txt`).

## 6. Perubahan mesin (lima bug nyata)

1. **Font sans tidak pernah terpakai.** TTF Archivo mendaftar sebagai keluarga "Archivo SemiBold"; resvg gagal menemukannya dan jatuh ke Instrument Serif, sehingga **subtitle dan label di misi 1–5 tampil serif**. Diperbaiki di `design/tokens.ts`. Misi lama tidak dirender ulang.
2. `build-timeline.ts` menulis `topic: 'mbg-gizi-anak'` untuk semua misi → sekarang `MISSION`.
3. `render-thumbnail.ts` mengunci copy judul misi 5 → sekarang membaca `content/thumbnails/<misi>.json`.
4. `ThumbAI` memaksa penanda "KODE ILUSTRASI · TIDAK AKTIF" → sekarang opsional (`plate`).
5. Pelat dengan `filter="url(#blur-soft)"` (filter tidak pernah didefinisikan) tampil sebagai pita keras pada gambar terang → dihapus, scrim diganti lima stop.

Ditambah: gate **CP2** di `qa.ts` digeneralisasi — tidak lagi mencari string "PPATK, 4 Agustus 2026", tapi membaca penerbit pertama dari `research/sources/<misi>.sources.json`.

## 7. Batasan yang masih ada

- **UNKNOWN yang dibiarkan UNKNOWN:** total luas terbakar Januari–November 2026. Video tidak mengarang angka setahun.
- **Angka bergerak:** status penyidikan Polri (97/20) bisa berubah; caption mencantumkan "per 29 Oktober 2026".
- **Kelas h05 adalah ilustrasi suasana**, bukan potret sekolah tertentu — karena itu diberi label ILUSTRASI di setiap frame.
- **Rasio bicara** 1,75–2,53 kata/detik: masih di bawah tempo konten retensi tinggi (±2,6–3,0). Kalau targetnya murni sebaran, hook h01 bisa dipadatkan 1,5 detik tanpa mengubah isi.
- Voice memakai `voice-04` (perempuan) — sama dengan misi 5, bukan voice misi 1–4 yang hilang saat reset.

## 8. Langkah berikutnya

1. Unggah manual di jendela waktu yang disarankan (TikTok 18.00–21.00 Rabu–Kamis).
2. Catat retensi 3 detik dan simpan/like setelah 48 jam ke `qa/` — baseline akun masih **UNKNOWN**.
3. Kalau retensi <50 %: ganti tiga detik pertama (mulai dari angka 742, bukan dari 7,9 juta murid), badan video tidak diubah.
4. Kandidat misi 7 dari riset yang sama: **pinjol "0,3 persen sehari = 109 persen setahun"** (SEOJK 19/2025) — angka tunggal, mudah dipotret, belum dipakai.
