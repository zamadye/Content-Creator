# PDF riset — cara membuat ulang

Renderer `render-research-pdf.py` mengubah Markdown riset menjadi PDF A4 dengan tautan aktif, menggunakan font Archivo dan Instrument Serif yang tersedia di repo. Input dan output lokal; tidak ada panggilan jaringan di script. Renderer sengaja mendukung heading, paragraf, kutipan, daftar, emphasis, inline code dan tautan HTTP(S)/mailto; blok atau token lain menyebabkan error agar isi tidak hilang diam-diam. Font Latin bawaan tidak memiliki panah kanan, sehingga tanda `→` dalam teks PDF diganti dengan pemisah `›` yang terbaca.

```bash
python3 -m venv .venv-research
.venv-research/bin/pip install -r scripts/requirements-research-pdf.txt
.venv-research/bin/python scripts/render-research-pdf.py \
  RISET-RETENSI-DAN-PERTUMBUHAN-KNOT-THEORY.md \
  editorial-engine/deliverables/retensi-research/private/RISET-RETENSI-KNOT-THEORY.pdf
```

`.venv-research` dan folder `private/` diabaikan oleh Git. Output riset untuk sesi ini disimpan di Drive privat; `private/` dapat mencakup analitik akun yang tidak boleh dipublikasikan. Jangan masukkan kunci, data privat, media, PDF hasil build, atau kredensial ke repo publik.

Verifikasi contoh (tidak menggantikan pemeriksaan visual):

```bash
.venv-research/bin/python -m unittest scripts/test_research_pdf.py
.venv-research/bin/python - <<'PY'
from pypdf import PdfReader
p = 'editorial-engine/deliverables/retensi-research/private/RISET-RETENSI-KNOT-THEORY.pdf'
r = PdfReader(p)
print('halaman:', len(r.pages))
print('karakter per halaman:', [len(x.extract_text() or '') for x in r.pages])
print('tautan anotasi:', sum(len(x.get('/Annots', [])) for x in r.pages))
PY
```

Error `ModuleNotFoundError` berarti dependency belum diinstal pada environment yang dipakai. Error font menunjukkan aset font repo belum lengkap. Error `Unsupported block/inline token` berarti format Markdown harus disederhanakan atau renderer diperluas dan diuji. Script tidak melakukan QA visual otomatis; periksa tampilan PDF dan tautan setelah dirender.
