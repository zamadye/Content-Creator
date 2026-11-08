# Pemeriksaan mekanis audit naskah

Alat lokal/offline untuk membantu memastikan audit mencakup teks narasi pada seluruh scene. **Ini bukan penilai psikologi penonton, fakta, izin, kualitas, keterbacaan, atau approval manusia.** Standar substantif dan contoh ada di [standar naskah](../../docs/STANDAR-NASKAH-PSIKOLOGI-PENONTON.md). Tool ini tidak dihubungkan otomatis ke renderer atau Buffer; menjalankannya tidak membuat atau menjadwalkan video.

## Input

1. JSON episode dengan `id` dan array `scenes`, masing-masing punya `id` unik dan `narration` bertipe string, seperti source episode yang sudah ada. Gunakan `"narration": ""` secara eksplisit untuk scene tanpa suara; setidaknya satu scene harus bernarasi. Semua scene yang memiliki narasi, termasuk CTA, harus diperiksa.
2. JSON audit dengan `scriptId` yang sama, `audienceAnchor` (`situation` dan `scope`), serta array `items` berurutan. Setiap item mewakili **satu kalimat lisan** dan memiliki:

| Field | Isi yang wajib ditulis reviewer |
|---|---|
| `sceneId` | ID scene sumber |
| `text` | Kalimat narasi persis, termasuk tanda bacanya |
| `purpose` | Fungsi dalam cerita |
| `viewerQuestion` | Pertanyaan/dugaan spesifik yang mungkin muncul dalam benak penonton |
| `connection` | Hubungan ke pengalaman/observasi atau konteks sebelumnya, dengan batasnya |
| `visualAction` | Objek dan aksi visual yang relevan |
| `evidence` | Sumber klaim, atau alasan bukan klaim faktual, misalnya `N/A — CTA` |
| `nextOrPayoff` | Petunjuk berikut, letak jawaban atau refleksi yang jujur |
| `wordChoice` | Alasan pilihan kata atau kata mubazir yang direvisi |

Contoh sintaks, **semua isinya ilustrasi**:

```json
{
  "scriptId": "demo",
  "audienceAnchor": {
    "situation": "Pengamatan sehari-hari yang relevan dengan topik.",
    "scope": "Analogi terbatas; tidak menganggap semua orang mengalaminya."
  },
  "items": [
    {
      "sceneId": "S01",
      "text": "Satu benda berubah.",
      "purpose": "Memperlihatkan perubahan konkret sebagai hook.",
      "viewerQuestion": "Apa penyebab benda itu berubah?",
      "connection": "Penonton bisa membayangkan melihat sebuah benda.",
      "visualAction": "Host menunjuk benda yang berubah bentuk.",
      "evidence": "N/A — kalimat fiktif untuk contoh format.",
      "nextOrPayoff": "Penjelasan akan muncul di scene berikutnya.",
      "wordChoice": "Kata benda dan aksinya dibuat jelas."
    }
  ]
}
```

Contoh itu cocok hanya dengan source demo yang memiliki `id` `demo` dan satu scene `S01` bernarasi persis `Satu benda berubah.`. Untuk naskah nyata, ganti dengan pertanyaan, bukti, aksi dan penghubung yang spesifik untuk **setiap** kalimat, bukan menyalin isian generik.

## Jalankan

```bash
python3 editorial-engine/pipeline/script-review/audit.py \
  --script /path/episode.json --review /path/audit.json
python3 editorial-engine/pipeline/script-review/test-audit.py
```

Python 3 standar saja; tidak memakai network atau dependensi tambahan. Output JSON ke stdout; status keluar `0` = pemeriksaan mekanis lulus, `1` = gagal cocok/kolom wajib, `2` = input tidak dapat dibaca/JSON tidak valid. Simpan audit nonrahasia dengan source; simpan informasi dan materi privat di Drive privat, bukan Git publik.

Pemeriksaan membandingkan gabungan `items.text` per scene dengan `narration` (spasi/line break dinormalisasi, tanda baca dan urutan dipertahankan), memastikan urutan/ID scene dan kolom terisi, serta memperingatkan sebagian kemungkinan dua kalimat tergabung. Jika naskah diubah atau ada scene/kalimat yang hilang, audit harus diperbarui. Placeholder sederhana seperti `...` dan `TBD` ditolak, tetapi tool tidak bisa mengenali semua isian kosong secara makna.

**Batas penting:** bahkan output `mechanical: PASS` selalu mengembalikan `sentence_segmentation`, `human_script_quality`, `audience_response`, dan `facts_and_rights` sebagai `NOT TESTED`. Deteksi kalimat tergabung hanyalah peringatan heuristik: singkatan atau kutipan bisa memicu alarm palsu, dan beberapa kalimat tergabung bisa tidak terdeteksi. Reviewer wajib memisahkan dan memeriksa sendiri tiap kalimat, menilai hubungan/pertanyaan/bukti/analogi, lalu mencatat hasil review manusia secara terpisah. Jangan meneruskan materi yang masih `FAIL`, `NEEDS REVIEW`, atau belum memenuhi gate produksi; hasil mekanis tidak mengubah status itu.

## Masalah umum dan perbaikan

- `scriptId` atau `sceneId` tidak cocok, urutan salah, atau teks berubah: perbarui audit berdasarkan source terbaru, lalu review kembali bagian terdampak.
- Kolom kosong: isi dengan pemikiran dan bukti spesifik. `N/A — ...` hanya tepat untuk baris yang benar-benar tidak menyatakan fakta.
- Peringatan kemungkinan beberapa kalimat dalam satu item: periksa dan pisahkan bila perlu. Jika itu hanya singkatan, jelaskan pada review manusia; jangan menganggap peringatan otomatis membuktikan kesalahan.
- Input privat hilang atau tidak dapat dibaca: pulihkan dari cadangan yang tepat. Jangan mengarang isi atau menandai pemeriksaan sebagai lulus.

Unit test memakai data sintetis dan memeriksa cakupan teks, urutan, kolom wajib, peringatan dan exit code. Test yang lulus bukan uji naskah episode atau bukti respons penonton.
