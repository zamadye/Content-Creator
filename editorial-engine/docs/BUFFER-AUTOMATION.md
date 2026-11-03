# Otomasi unggah ke Buffer — status jujur

Diuji 3 November 2026 di sandbox. **Kesimpulan: CLI terpasang dan skripnya sudah jadi serta tervalidasi, tetapi panggilan API-nya tidak bisa keluar dari sandbox ini.** Bukan karena kunci ditolak — kuncinya belum pernah sampai ke Buffer.

---

## 1. Apa yang terpasang dan terverifikasi

```
npm install -g @bufferapp/cli   →  @bufferapp/cli 2.2.0
which buffer                    →  /usr/local/bin/buffer
buffer --version                →  2.2.0
```

`buffer init` dijalankan. Ia menemukan `BUFFER_API_KEY` di environment, bertanya "Save this API key to config?", dijawab Ya, lalu **berhenti** dengan:

```json
{"error":"API_ERROR","code":3,"message":"fetch failed"}
```

`buffer doctor` (bukti paling ringkas):

```json
{"checks":[
  {"name":"config-file","status":"fail","message":"No config file found"},
  {"name":"default-organization","status":"fail","message":"No default organization set"},
  {"name":"api-reachable","status":"fail","message":"Could not reach https://api.buffer.com: fetch failed"}
],"summary":{"passed":3,"failed":3,"skipped":2,"total":8}}
```

Uji koneksi langsung:

| Host | Kode |
|---|---|
| `api.buffer.com` | **000** |
| `api.bufferapp.com` | **000** |
| `developers.buffer.com` | **000** |

`000` = koneksi ditolak di tingkat jaringan. Sandbox ini hanya boleh keluar ke github.com, npm dan PyPI. Jadi `buffer` bisa dijalankan, tapi tidak bisa menelepon rumah.

## 2. Perintah yang diminta perlu satu argumen tambahan

Perintah aslinya:

```bash
buffer ideas create --text "My first idea from the Buffer CLI"
```

Hasilnya, bahkan **sebelum** menyentuh jaringan:

```json
{"error":"USAGE_ERROR","code":2,"message":"Missing required flag: `--organization-id`"}
```

Versi yang benar (dry-run, jalan offline):

```bash
buffer ideas create --organization-id <ORG_ID> --text "My first idea from the Buffer CLI" --dry-run
```

`--dry-run` mengembalikan payload GraphQL yang sudah tervalidasi tanpa memanggil API. Itu bukti CLI-nya sehat.

## 3. Skrip otomasi yang sudah dibuat

`pipeline/publish-buffer.mjs` — mengambil paket hasil misi dan menjadikannya post Buffer.

```bash
export BUFFER_API_KEY=...            # kunci tidak pernah ditulis ke repo
cd editorial-engine

# validasi saja (offline, tidak mengirim apa pun)
MISSION=pinjol-bunga-harian-2026 PLATFORM=instagram node pipeline/publish-buffer.mjs

# kirim sungguhan (butuh jaringan + URL video publik)
MISSION=pinjol-bunga-harian-2026 PLATFORM=instagram \
  MEDIA_URL=https://…/B_pinjol-bunga-harian-2026_1080x1920.mp4 \
  MODE=shareNow node pipeline/publish-buffer.mjs --send
```

Yang sudah diuji offline (semua **PASS**): pemotongan caption per platform dari `deliverables/caption_<misi>.txt`

| Platform | Panjang teks | Validasi payload |
|---|---|---|
| Instagram | 441 karakter | OK |
| TikTok | 246 karakter | OK |
| YouTube | 588 karakter | OK |
| Facebook | 952 karakter | OK |

Yang **belum** teruji: pemanggilan API sungguhan. Percobaan `--send` berhenti di:

```
[buffer posts] exit 3
{"error":"API_ERROR","code":3,"message":"fetch failed"}
```

## 4. Dua batasan Buffer yang harus diketahui sebelum berharap "sekali klik"

1. **Video harus sudah ada di internet.** Schema Buffer menerima `assets[].video.url` — sebuah URL. Buffer yang mengunduh sendiri. Skrip ini **tidak** bisa mengunggah file lokal dari disk; itu batasan API, bukan pilihan saya.
2. **Thumbnail tidak bisa ditempel ke post video.** Field `video.thumbnailUrl` ada di schema tapi deskripsinya berbunyi: *"Do not use: social networks do not accept custom video thumbnail images, and the API rejects video assets that set this field."* Untuk memilih bingkai sampul, hanya tersedia `metadata.thumbnailOffset` (detik) dan hanya untuk Instagram, TikTok, Pinterest. Jadi `T_…png` tetap diunggah manual di aplikasi.

Selain itu `posts create` **tidak idempoten** — kalau gagal di tengah dan diulang tanpa memeriksa, post bisa dobel. Skrip berhenti dan menyuruh memeriksa `buffer posts list` lebih dulu, bukan mengulang otomatis.

## 5. Dua cara menjalankannya untuk sungguhan

### A. Di mesin Anda (paling cepat, 1 menit)

```bash
npm i -g @bufferapp/cli
export BUFFER_API_KEY=<kunci>
buffer init                     # simpan kunci + organizationId + timezone
cd editorial-engine
MISSION=pinjol-bunga-harian-2026 PLATFORM=instagram \
  MEDIA_URL=<url-mp4-publik> MODE=addToQueue \
  node pipeline/publish-buffer.mjs --send
```

### B. GitHub Actions (otomatis, tanpa menyalakan komputer)

Runner GitHub punya internet penuh. Resepnya — **belum saya pasang**, karena repo ini aturannya: tidak ada workflow GitHub tanpa izin eksplisit Anda.

```yaml
# .github/workflows/buffer-publish.yml
name: publish-to-buffer
on:
  workflow_dispatch:
    inputs:
      mission:   { required: true }
      platform:  { required: true, default: instagram }
      media_url: { required: true }
      mode:      { required: true, default: addToQueue }
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm i -g @bufferapp/cli
      - run: cd editorial-engine && npm ci
      - env:
          BUFFER_API_KEY: ${{ secrets.BUFFER_API_KEY }}
          MISSION: ${{ inputs.mission }}
          PLATFORM: ${{ inputs.platform }}
          MEDIA_URL: ${{ inputs.media_url }}
          MODE: ${{ inputs.mode }}
        run: cd editorial-engine && node pipeline/publish-buffer.mjs --send
```

Syaratnya: (1) Anda set secret `BUFFER_API_KEY`, (2) mp4 sudah punya URL publik, (3) workflow-nya dipasang — dan untuk itu token GitHub yang ada di sandbox ini kemungkinan belum punya izin `workflow`.

## 6. Keamanan kunci

- Kunci **tidak** pernah ditulis ke repo, tidak masuk commit, tidak masuk file konfigurasi.
- `buffer init` berhenti sebelum menyimpan, jadi di disk hanya ada `~/.config/buffer/update-check.json` (bukan kunci).
- Setiap perintah di sesi ini memakai `BUFFER_API_KEY` lewat environment, sekali pakai.
- Karena kunci sudah pernah dikirim di chat, anggap ia sudah "terlihat". Kalau nanti sudah selesai dipakai, cabut dan buat baru di **Buffer → Settings → API**; skrip ini tidak perlu diubah, hanya nilainya.
