# Audio horor — musik latar dan efek suara

> Arahan pemilik kanal, 2026-11-06: **"untuk menambah ke hororannya dan
> atmosfernya harus ada background sound dan suara lain seperti suara membuka
> pintu, suara petir, suara tawa cekikikan dll, tergantung isi cerita."**

Sebelum ini, episode hanya punya satu ambience drone dan tiga efek
(`knock`, `heartbeat`, `scare`) yang ditempel manual. Tidak ada musik, tidak ada
suara yang mengikuti apa yang sedang diceritakan.

Sekarang ada 26 aset di `assets/audio/horror/`, semuanya
disintesis sendiri oleh `tools/audio/build-horror-assets.py` — bukan diunduh.
Alasannya bukan sekadar ukuran berkas: aset yang dibuat dari rumus bebas
royalti, bisa dibangun ulang dengan hasil identik (seed tetap), dan tidak akan
memunculkan klaim Content ID di YouTube atau Facebook.

```
python3 tools/audio/build-horror-assets.py           # bangun semua (17 detik)
python3 tools/audio/build-horror-assets.py --only petir tawa
python3 tools/audio/build-horror-assets.py --list
```

## Musik latar

Dinormalkan per RMS (bukan per puncak) supaya bed yang punya dentingan tajam
tidak jadi jauh lebih pelan daripada drone.

| Aset | Durasi | Volume RMS | Dipakai untuk | Tag pemicu |
|---|---|---|---|---|
| `bed_drone_dread` | 60.0 s | -20 dB | Drone rendah bergerak, denting logam jauh. Latar default. | gelap, sunyi, ruang, umum |
| `bed_music_box` | 48.0 s | -21 dB | Kotak musik sumbang 66 bpm, satu nada meleset 30 sen. | anak, musik, lemari, kamar, umum |
| `bed_night_ambience` | 70.0 s | -22 dB | Jangkrik, angin jauh, kodok. Untuk pembuka tenang. | malam, luar, jangkrik, kos, umum |
| `bed_pulse_ritual` | 64.0 s | -20 dB | Denyut lambat 41 bpm seperti jantung gedung. | jantung, ritual, lorong, umum |
| `bed_static_tension` | 45.0 s | -22 dB | Statik radio hidup dengan crackle dan heterodyne. | radio, siaran, telepon, rekaman |
| `bed_strings_swell` | 56.0 s | -22 dB | Gesekan sumbang yang naik lalu putus di detik 48. | naik, klimaks, akhir, umum |

## Efek suara

| Aset | Durasi | Volume RMS | Dipakai untuk | Tag pemicu |
|---|---|---|---|---|
| `sfx_anak_bersenandung` | 10.0 s | -20 dB | Senandung anak tanpa kata 10 s. | anak, senandung, lemari, musik |
| `sfx_angin` | 24.0 s | -25 dB | Angin 24 s. | angin, luar, malam, jendela |
| `sfx_bisikan` | 4.2 s | -20 dB | Bisikan 4,2 s dengan forman bergerak. | bisik, suara, nama, telinga |
| `sfx_detak_jantung` | 8.0 s | -21 dB | Detak jantung 8 s. | jantung, detak, tegang, tunggu |
| `sfx_hujan` | 40.0 s | -22 dB | Hujan 40 s, loop-able. | hujan, deras, malam, luar |
| `sfx_jam_berdetak` | 12.0 s | -29 dB | Detak 12 s. | jam, detak, waktu, tunggu |
| `sfx_ketukan` | 2.4 s | -25 dB | Tiga ketukan 2,4 s. | ketuk, pintu, tok, dinding |
| `sfx_langkah_kayu` | 3.0 s | -22 dB | Lima langkah di lantai kayu 3 s. | langkah, kaki, lorong, atap |
| `sfx_logam_tergesek` | 2.0 s | -19 dB | Gesekan logam 2 s. | logam, besi, gesek, pagar |
| `sfx_nafas_berat` | 5.0 s | -23 dB | Napas 5 s. | napas, bernapas, dekat, ketakutan |
| `sfx_petir` | 7.0 s | -20 dB | Guntur 7 s: retak di depan, gemuruh panjang. | petir, hujan, badai, guntur |
| `sfx_pintu_dibanting` | 1.5 s | -22 dB | Bantingan pintu 1,5 s. | pintu, banting, kaget |
| `sfx_pintu_terbuka` | 3.6 s | -17 dB | Gesekan kayu 3,6 s — model stick-slip. | pintu, lemari, buka, kamar |
| `sfx_radio_statis` | 4.0 s | -24 dB | Burst statik 4 s. | radio, statik, siaran, putus |
| `sfx_riser` | 6.0 s | -25 dB | Riser 6 s. | naik, tegang, sebelum, klimaks |
| `sfx_stinger` | 1.4 s | -17 dB | Pukulan jumpscare 1,4 s. | kaget, jumpscare, pukul, klimaks |
| `sfx_tawa_cekikikan` | 3.4 s | -20 dB | Tawa anak 3,4 s — sengaja tidak natural. | tawa, cekikikan, anak, kaget |
| `sfx_telepon_lama` | 6.0 s | -15 dB | Dering telepon rumah tua 6 s. | telepon, dering, panggilan, kantor |
| `sfx_tetes_air` | 5.0 s | -19 dB | Tetes air 5 s dengan ruang beton. | air, tetes, bocor, beton |
| `sfx_whoosh` | 1.3 s | -23 dB | Whoosh 1,3 s. | transisi, pindah, cepat |

## Cara memasang ke episode

```
node scripts/plan-audio.mjs --episode LS-0012            # tulis ke episode.json
node scripts/plan-audio.mjs --episode LS-0012 --dry-run  # lihat rencananya saja
node scripts/plan-audio.mjs --episode LS-0012 --bed bed_music_box
```

Yang dilakukan skrip itu:

1. **Memilih satu bed** dari tema episode (cerita radio → statik, cerita anak →
   kotak musik, cerita luar → malam, cerita ruang dalam → denyut). Kalau tidak
   ada yang cocok, `bed_drone_dread` untuk video panjang dan
   `bed_night_ambience` untuk Short.
2. **Menaruh satu efek per scene** pada kata yang memicunya — `pintu`, `petir`,
   `tawa`, `bisikan`, `telepon`, dan seterusnya. Posisinya digeser ke dalam
   scene (bukan di frame 0) supaya tidak terdengar seperti klik di potongan.
3. **Membatasi pengulangan**: satu aset maksimal dua kali per episode, jeda
   minimal 25 detik, dan tidak ada dua efek dalam 2,5 detik.
4. **Menambah riser 6 detik** yang berhenti tepat di jumpscare. Tanpa itu,
   pukulan kaget datang dari keheningan dan terasa salah tempel.
5. Menyalin berkas yang dipakai ke `projects/episodes/<id>/audio/horror/`
   karena `publicDir` renderer adalah folder episode.

Volume bawaannya: bed 0,20 (Short) / 0,16 (panjang), efek 0,34–0,55, riser 0,34.

## Aturan mixing yang berlaku

- **Narasi selalu di depan.** `Soundscape.tsx` menekan musik ke 34% selama
  narasi berjalan dan mengembalikannya di jeda.
- **Bed harus terdengar, bukan mengganggu.** Kalau setelah didengar penonton
  baru sadar ada musik saat narasi berhenti, levelnya sudah benar.
- **Efek mengikuti isi, bukan keinginan menambah suara.** Satu efek per scene
  cukup; dua efek dalam satu kalimat membuat adegan terdengar seperti
  pameran suara.
- **Tawa dan bisikan sengaja tidak natural.** `sfx_tawa_cekikikan` dibentuk dari
  derau bernada yang salah; yang natural terdengar seperti orang lucu, yang
  salah terdengar seperti anak yang tidak seharusnya ada di sana.

## Berkas terkait

- `assets/audio/horror/manifest.json` — daftar aset, durasi, tag.
- `scripts/plan-audio.mjs` — pemasang otomatis.
- `apps/renderer/src/components/Soundscape.tsx` — pemutar; panjang cue kini
  mengikuti durasi berkas (`durationFrames`), bukan dikunci 4 detik.
- `renders/demo-audio-LS-0010.mp3` — contoh campuran 54 detik (narasi + bed +
  pintu terbuka + napas + riser).
