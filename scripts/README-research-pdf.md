# PDF aturan dan riset — cara membuat ulang

Empat PDF aktif dibangun dari source Markdown nonrahasia, secara lokal/offline, memakai ReportLab dan dua keluarga font yang tersedia di repo. Output dan cadangan harus berada di Google Drive privat atau lokasi kerja yang diabaikan Git; jangan commit PDF, media, kunci, atau data analitik privat ke repo publik. Dokumen lama dipertahankan sebagai arsip dan tidak boleh dianggap mengalahkan arah cerita panjang.

## Build edisi cerita panjang

Dari root repo pada Python 3:

```bash
python3 -m venv .venv-research
.venv-research/bin/pip install -r scripts/requirements-research-pdf.txt
.venv-research/bin/python scripts/build-story-pdfs.py \
  --output-dir google_drive/KNOT-Cerita-Panjang-AKTIF
```

Input dan output:

1. `editorial-engine/docs/SISTEM-CERITA-LONG-FORM.md` → `01-SISTEM-CERITA-PANJANG.pdf`.
2. `RISET-STORYTELLING-DUNIA-KEBALIK.md` → `02-RISET-DAN-CONTOH-CERITA.pdf`.
3. `RISET-RETENSI-DAN-PERTUMBUHAN-KNOT-THEORY.md` → `03-DISTRIBUSI-DAN-PERCAKAPAN.pdf`.
4. `editorial-engine/docs/AUDIT-ATURAN-DAN-PENERAPAN.md` → `04-AUDIT-PENERAPAN.pdf`.

Builder hanya menerima direktori output privat yang diabaikan Git (`google_drive/`, `.scratch/` atau `editorial-engine/deliverables/retensi-research/private/`). Tautan relatif ke source repo diubah menjadi URL file di branch sesi agar anotasi PDF dapat dibuka setelah source dipush; tautan sumber publik tetap dipertahankan. Builder tidak melakukan panggilan jaringan. Kesalahan link relatif yang tidak ada, keluar dari repo, tabel, fenced code, token Markdown yang tidak didukung, font, atau dependency menghentikan build. Judul dan footer khusus diberikan untuk tiap dokumen; tidak memakai identitas laporan Shorts lama.

Renderer mendukung heading, paragraf, kutipan, daftar, emphasis, inline code dan tautan HTTP(S)/mailto. Font Latin bawaan tidak memiliki panah kanan; baik teks biasa maupun inline code mengubah `→` menjadi pemisah `›` yang terbaca. Perubahan ini hanya untuk presentasi PDF, bukan perubahan makna source.

## Pemeriksaan

```bash
.venv-research/bin/python -m unittest scripts/test_research_pdf.py scripts/test_story_pdfs.py
.venv-research/bin/python - <<'PY'
from pathlib import Path
from pypdf import PdfReader
for p in sorted(Path('google_drive/KNOT-Cerita-Panjang-AKTIF').glob('*.pdf')):
    r = PdfReader(str(p))
    print(p.name, 'halaman:', len(r.pages),
          'karakter:', sum(len(x.extract_text() or '') for x in r.pages),
          'anotasi:', sum(len(x.get('/Annots', [])) for x in r.pages))
PY
```

Tes memeriksa parser, link aman, metadata, teks, jumlah file, blok yang ditolak dan batas direktori output. Tes tidak membuktikan seluruh PDF terlihat benar: render sampel halaman dan periksa secara visual untuk glyph, potongan kalimat, kontras, link, dan layout; catat cakupan pemeriksaan. Kesuksesan PDF juga tidak membuktikan cerita disukai audiens atau izin publikasi. Lihat [kebijakan backup](../KEBIJAKAN-CADANGAN-ANTI-RESET.md).

## Renderer umum

Untuk laporan Markdown lain yang memiliki format didukung, panggil `render-research-pdf.py` langsung dengan `--footer`, `--title`, dan `--subject` yang benar. Renderer umum menerima link absolut; input bertabel atau blok lain harus disederhanakan atau renderer diperluas dan diuji. Default identitas lama dipertahankan hanya untuk reproduksi; jangan menggunakannya untuk dokumen baru. `ModuleNotFoundError` berarti dependency belum dipasang di environment itu.
