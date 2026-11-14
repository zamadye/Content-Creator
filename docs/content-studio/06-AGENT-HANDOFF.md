# Handoff kepada agen implementasi di Git sandbox

## Mandat

Bangun Content Studio sesuai paket rencana ini, bertahap dan dengan bukti. Pengguna
meminta arsitektur, UI input VO/timestamp, visual otomatis, revisi, dan MP4 yang dapat
dideploy di kemudian hari. Pembuat rencana tidak mengimplementasikan aplikasi dalam
commit dokumentasi ini. Jangan menganggap dependency atau file lokal dari sesi pembuat
rencana otomatis tersedia di sandbox Anda.

## Urutan awal yang wajib

1. Baca `README.md` repo dan `docs/content-studio/README.md`, lalu enam dokumen detail.
2. Cari dan baca AGENTS.md yang benar-benar ada pada checkout/ancestor. Saat perencanaan
   tidak ditemukan AGENTS.md dalam tree yang diperiksa; kondisi remote dapat berubah.
3. Periksa `git status`, branch, remotes, file tracked, lockfile, dan runtime. Jangan
   membersihkan working tree pengguna, mengubah branch tanpa alasan, atau force-push.
4. Baca standar editorial/story gate yang ditautkan. Gate bukan pengganti review manusia.
5. Mulai P0 dengan fixture sintetis dan laporan capability. Jangan clone/install semua
   15 tools. Pilih minimal stack dan satu renderer produksi melalui ADR.
6. Buat progress tracker berisi task ID, status, dependency, evidence, limitation dan
   commit SHA. Update setelah setiap unit selesai. Jangan menandai tahap selesai
   hanya karena folder atau UI mock sudah ada.

## Output dokumentasi yang agen harus tambahkan

```text
docs/content-studio/
  adr/0001-renderer-selection.md
  adr/0002-runtime-auth-and-storage.md
  reports/environment-baseline.md
  reports/renderer-benchmark.md
  reports/license-inventory.md
  reports/progress.md
  reports/acceptance-evidence.md
  runbooks/local-development.md
  runbooks/private-deployment.md
  runbooks/backup-restore-and-rollback.md
  USER-GUIDE-ID.md
```

Nama output adalah target, **belum tersedia** dalam paket ini. Evidence publik hanya
berisi data sintetis, angka agregat, hash dan catatan nonrahasia. Bukti yang berisi
media/narasi/credential pengguna disimpan privat dan dirujuk dengan ID yang aman.

## Penghematan konteks dan token

Kerjakan satu vertical slice per siklus. Baca kontrak relevan, implementasikan, jalankan
checks sesuai risiko, commit hasil. Pakai fixture/provider palsu deterministik untuk
iterasi murah, lalu satu verifikasi provider nyata privat ketika diperlukan. Cache
transkripsi dan aset; jangan regenerate semua scene karena satu label berubah.

Jangan mengirim seluruh video/transkrip ke model berulang kali jika scene subset cukup.
Simpan ringkasan progress/ADR agar sesi berikutnya bisa melanjutkan. Jangan menulis
tes yang hanya mencerminkan struktur fungsi; fokus invariants waktu, state, ACL,
recovery, artifact dan keputusan kreatif yang perlu review.

Jika API key, media privat, GPU, Chrome lokal atau domain tidak tersedia, lanjutkan
pekerjaan yang independen, berikan fixture mode berlabel, dan laporkan bagian yang
belum diuji. Jangan menggunakan credential dari repo lain atau mengarang hasil tes.

## Perintah target yang perlu disediakan implementasi

Berikut nama script **target**, bukan command yang sudah dapat dijalankan sekarang:

| Command target | Hasil yang harus disediakan |
|---|---|
| `pnpm install --frozen-lockfile` | Install reproducible setelah lockfile dibuat |
| `pnpm dev` | Web/API dev; dependency services via runbook |
| `pnpm worker` | Worker orchestration/render lokal |
| `pnpm db:migrate` | Apply migration eksplisit pada environment yang dipilih |
| `pnpm lint` / `pnpm typecheck` | Static checks workspace baru |
| `pnpm test` | Unit/domain/contract tests sintetis |
| `pnpm test:integration` | API/DB/queue/storage dengan service test terisolasi |
| `pnpm test:e2e` | Jalur UI input -> preview -> export fixture |
| `pnpm test:render-smoke` | MP4 pendek decode penuh dan timing |
| `pnpm test:acceptance` | Multi-topic + 24-scene long-form + recovery evidence |
| `pnpm build` | Build artifacts web/API/worker |

Command lama `editorial-engine` tidak diganti diam-diam. CI dan runbook harus memakai
script yang benar-benar ada setelah implementasi. Test yang membutuhkan GPU/provider
riil dibedakan dari offline tests, dengan hasil skip/blocked yang eksplisit.

## Hal yang tidak boleh disimpulkan

- README upstream menjanjikan profesional berarti kualitas scene kita sudah terbukti.
- Video dapat tampil di Chrome berarti MP4 sudah dirender.
- Snapshot/52 detik preview berarti video 7 menit telah ditinjau penuh.
- PASS schema/story gate mekanis berarti fakta, daya tarik, atau hak aset benar.
- Skill gratis berarti model, GPU, API, storage dan distribusi gratis.
- Build UI sukses berarti worker produksi, auth, backup dan deployment siap.
- Legacy source yang tidak ada di checkout boleh direkonstruksi dari asumsi pribadi.

## Aturan perubahan dan delivery

Utamakan branch yang diinstruksikan pemilik. Dalam sesi perencanaan branch aktif adalah
`arena/54cb36c6-content-creator`; agen harus memeriksa branch aktual saat mulai.
Jangan merge ke default branch, membuka publikasi, menjadwalkan konten, atau deploy
production tanpa instruksi pemilik. Commit source/dokumen nonrahasia mengikuti kebijakan
repo; review staged diff dan jalankan filename/privacy guard sebelum push.

Pisahkan commit dokumentasi, fondasi aplikasi, ingest, renderer, planner, UI workflow,
dan deployment sesuai vertical slice. Commit jangan memasukkan pekerjaan lokal pengguna
yang tidak terkait. Hook privasi tidak boleh dilewati dengan `--no-verify`.

Laporan akhir per siklus: task selesai, perilaku yang bekerja, tests+hasil, evidence,
risiko/batas, commit SHA/branch, next task. Jika push gagal, laporkan sebab dan local SHA;
jangan mengklaim remote sinkron. Jika remote bergerak, fetch dan rekonsiliasi tanpa
menimpa perubahan pengguna atau force-push.

## Prompt siap diberikan kepada agen

> Implementasikan Content Studio dari `docs/content-studio/README.md` pada repo ini.
> Baca seluruh spesifikasi dan aturan repo terlebih dahulu. Mulai P0: baseline,
> benchmark renderer sintetis, lisensi dan ADR stack. Setelah keputusan terdokumentasi,
> lanjutkan fase berurutan sesuai dependency dan acceptance. Bangun UI yang benar-benar
> terhubung ke API/worker agar VO dan timestamp masuk dari browser, scene dapat direvisi,
> dan MP4 penuh dapat diunduh. Pertahankan media/secret privat, legacy pipeline dan gate
> editorial. Gunakan satu renderer produksi dan provider adapter, jangan install seluruh
> tools. Buat progress tracker dan commit unit kerja teruji. Jangan mengklaim mock sebagai
> integrasi nyata atau preview sebagai full render. Jika sesuatu memerlukan credential/
> hardware/domain yang tidak tersedia, lanjutkan bagian independen dan laporkan batas
> pengujian secara eksplisit. Jangan deploy/publish production tanpa instruksi saya.
