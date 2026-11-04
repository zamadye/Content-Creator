# Kunci suara narasi

Masalah yang dicatat 4 November 2026: **narasi tiap misi terdengar berbeda** karena tiap misi
memilih suara sendiri di sesi yang berbeda. Dokumen ini mengunci aturannya.

## Aturan

1. **Satu suara untuk satu sesi produksi.** Suara dipilih sekali (audisi), lalu dipakai untuk
   *semua* segmen di semua misi yang dikerjakan pada sesi itu. Jangan pernah memilih ulang
   di tengah misi.
2. **Pilih sebelum menulis audio pertama.** Setelah klip pertama dibuat, suara tidak boleh
   berganti — kalau berganti, seluruh klip misi itu harus dibuat ulang.
3. **Rantai pengolahan yang sama untuk semua klip:**

   ```
   silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.06
   silenceremove=stop_periods=-1:stop_duration=0.18:stop_threshold=-42dB
   areverse,silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.14,areverse
   ```

   Tanpa rantai ini, TTS menghasilkan jeda 0,3–0,55 detik di dalam kalimat. **`atempo` tidak
   dipakai lagi** (dipakai 1.20 sekali pada 3 Nov 2026 dan hasilnya terdengar terburu-buru).
   Kalau total narasi meleset dari target, yang diperbaiki adalah *naskahnya*, bukan tempo
   suara. Batas yang dipakai: ±2,1–3,0 kata per detik.
4. **Simpan satu berkas utuh** di `audio/voiceovers/<misi>/narasi-lengkap.mp3` — klip per segmen
   digabung dengan jeda 0,35 detik. Ini rujukan "suara misi ini" yang bisa diperdengarkan ke
   siapa pun tanpa harus merender video.
5. **Klip asli TTS tidak dihapus**: disimpan di `<misi>/raw/` supaya rantai olah bisa diuji ulang.

## Catatan lintas sesi

Id suara dari audisi Arena terikat pada sesi percakapan, bukan pada repo. Karena itu:

- **kalau ada video yang sudah tayang, suara video itu yang dipakai** — bukan hasil audisi
  baru. Ini koreksi pengguna 4 Nov 2026: voice-06 hasil audisi baru ditolak karena terdengar
  berbeda dari katalog; seluruh misi BSU dibuat ulang dengan voice-05;

- seluruh narasi sebuah misi **harus dibuat dalam satu sesi**;
- kalau sebuah misi dilanjutkan di sesi lain dan suaranya berbeda, audio misi itu harus
  dibuat ulang seluruhnya, bukan ditambal sebagian;
- rujukan karakter suara yang paling bisa diandalkan adalah `narasi-lengkap.mp3` dari misi
  terakhir — mintakan audisi dengan karakter yang sama (perempuan, tenor laporan, tenang,
  tidak menuduh) sebelum membuat klip pertama.

## Riwayat

| Misi | Tanggal | Suara | Catatan |
|---|---|---|---|
| mbg-gizi-anak | 2 Nov 2026 | perempuan (sesi 1) | — |
| karhutla-angka-turun-2026 | 2 Nov 2026 | perempuan (sesi 1) | — |
| judol-taruhan-kecil-2026 | 2 Nov 2026 | perempuan (sesi 1) | — |
| pinjol-bunga-harian-2026 | 3 Nov 2026 | perempuan voice-05 | 77,65 detik, tanpa atempo |
| **bsu-9-dari-100-2026** | **4 Nov 2026** | **perempuan voice-05** (suara yang sama dengan video sebelumnya) | 81,85 detik murni · 83,72 detik termasuk jeda · tanpa atempo · mean −19 dB |
