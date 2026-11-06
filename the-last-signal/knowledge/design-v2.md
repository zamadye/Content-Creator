# Desain baru (2026-11-06) — apa yang berubah, dan di mana kodenya

Empat prioritas pemilik kanal untuk desain ini: **visual karakter**, **visual
setan/hantu**, **suara SFX**, **subtitle di tengah layar**. Ditambah dua angka
hasil bedah video pembanding (`knowledge/reference-design.md`): **shot 1,2–1,8
detik** dan **bed musik tanpa jeda**.

Dokumen ini mencatat keputusan yang sudah benar-benar masuk ke pipeline, bukan
rencana.

## 1. Di mana desain tinggal

| Unsur | Tempat | Catatan |
|---|---|---|
| Tokoh & entitas (deskripsi) | `assets/characters/characters.json` | `promptCore`, `negatif`; disalin ke setiap prompt gambar |
| Gambar scene | `projects/episodes/<id>/images-v2/` | 7 adegan + `scare-face.png`, semuanya dengan tokoh/entitas |
| Rencana desain per episode | `projects/episodes/<id>/design.json` | data cerita: beat entitas, cue SFX, kartu teks, target shot |
| Penerap rencana | `scripts/plan-design.mjs` | menulis cuts + SFX + kartu ke `episode.json` |
| Caption | `apps/renderer/src/components/SubtitleTrack.tsx` | 1–3 kata, satu baris, di tengah |
| Bed & atmosfer | `apps/renderer/src/components/Soundscape.tsx` | skor satu berkas sepanjang episode |

`design.json` sengaja berisi keputusan cerita (kapan makhluk muncul, suara apa),
sedangkan `plan-design.mjs` hanya aritmetika. Kalau nanti episode lain butuh
irama lain, yang berubah adalah datanya, bukan kodenya.

## 2. Shot 1,2–1,8 detik

`plan-design.mjs` memotong scene setiap ±1,5 detik dan **menggeser titik potong
ke batas subtitle terdekat** (toleransi 9 frame). Dua efek:

- cut terasa disengaja karena berganti bersamaan dengan kartu caption;
- tidak ada potongan yang membelah satu kata.

Tangga framing dipakai bergantian (1,00 → 1,34 → 1,12 → 1,48 → 1,22 → 1,42)
dengan kamera yang tidak pernah sama dua shot berturut-turut. Selisih skala
minimal 0,25 karena selisih kecil terbaca sebagai gambar bergeser, bukan shot
baru. Sisa ekor yang kebetulan panjang dibelah di tengah pada pass kedua.

Hasil pada LS-0010: **35 shot / 54,1 s = 1,55 s per shot**, terpendek 1,3 s,
terpanjang 2,27 s (shot penutup scene yang tidak boleh dibelah karena akan
turun di bawah 1,25 s).

## 3. Entitas tiga kali, makin dekat

Beat ditulis di `design.json` (`beats`), gambar ditentukan per scene:

| Kemunculan | Scene | Bentuk | Suara |
|---|---|---|---|
| 1 | `scene_02` | siluet di refleksi baja lift | `sfx_desahan_iblis` −16 dB |
| 2 | `scene_05` | setengah badan, wajah kosong, tangan terangkat | `sfx_riser` lalu `sfx_geraman_setan` |
| 3 | `scene_06` | utuh, paling dekat, berdiri di belakang kursimu | `sfx_desahan_iblis` |

Aturan lama tetap berlaku: makhluk tidak pernah berlari, wajah tidak pernah
tajam kecuali di jumpscare, dan jumpscare memakai wajah yang sama
(`images-v2/scare-face.png`) supaya bukan dua makhluk berbeda.

## 4. SFX: satu suara makhluk per kemunculan

Daftar SFX lama di LS-0010 adalah `knock.wav` + `heartbeat.wav` yang diulang di
ketujuh scene. Itu bunyi templat: penonton belajar bahwa bunyinya tidak berarti
apa-apa. Penggantinya 11 cue yang masing-masing menempel pada kalimat pemicu
(`cue` di `design.json`), termasuk empat suara makhluk dari
`assets/audio/horror/`:

- `sfx_desahan_iblis` 5,5 s — napas berlapis (kemunculan 1 dan 3)
- `sfx_geraman_setan` 4,2 s — geraman (kemunculan 2)
- `sfx_teriakan` 2,2 s — sekali per episode, di puncak
- `sfx_tangisan` 7,0 s — untuk cerita yang punya tokoh menangis

`plan-design.mjs` menulis `durationFrames` dari durasi berkas aslinya, jadi
tangisan 7 detik tidak lagi terpotong di 4 detik.

## 5. Subtitle: satu baris, di tengah

- 1–3 kata per kartu, maksimal 16 karakter (grup kata dipotong, bukan kalimat).
- Posisi: tengah layar (`justifyContent: center`), bukan bawah.
- **Satu kartu = satu baris.** Kalau teksnya panjang, huruf mengecil
  (92 → 79 → 68 px), bukan turun ke baris kedua. Referensi tidak pernah
  membungkus captionnya.
- Tinggi huruf 92 px pada 1080×1920 = 4,8 % layar; referensi 6 %. Batas atas
  adalah ruang aman: pada 115 px, tiga kata sudah menyentuh tepi.
- **Tanda baca dibuang** dari kata yang tampil: kartu berbunyi "TERBUKA", bukan
  "TERBUKA.". Titik dan koma pada 92 px terbaca sebagai salah ketik.

## 6. Bed musik tanpa jeda

Skor tetap **satu berkas sepanjang episode** (`audio/score.wav`, 54,13 s = tepat
durasi episode) dengan ducking otomatis saat narasi. Ambience per scene tetap
di-loop, tetapi ia lapisan kedua: turun ke nol di batas scene tidak lagi
menyisakan keheningan karena skor terus berjalan di bawahnya. Video pembanding
punya **0 celah sunyi** dalam 25,29 s.

## 7. HUD

Label kamera berubah dari `CAM 07 — LT. 07` menjadi `CAM 07`. Alasannya konkret:
episodenya terjadi di lantai 19, jadi label lantai 7 yang tercetak di pojok
layar membantah ceritanya sendiri. Nomor kamera tetap fiktif; nomor lantai
sebaiknya tidak diklaim kalau tidak dilacak per episode.
