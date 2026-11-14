# Fase pengembangan, backlog, dan acceptance

Tidak ada estimasi token/jam yang dijanjikan. Scope dipecah menjadi hasil yang dapat
diuji dan dikomit; agen tidak boleh menyelesaikan UI palsu lalu mengklaim seluruh
sistem siap. Satu fase dapat memiliki beberapa PR/commit kecil pada branch kerja yang
ditentukan pemilik. Publish/deploy production bukan bagian otomatis dari push source.

## Dependency dan milestone

```text
P0 discovery + keputusan engine/stack
  └ P1 fondasi workspace + auth + data + job + storage
      └ P2 ingest + UI input + alignment
          └ P3 scene-kit + preview deterministik
              └ P4 planner + storyboard + revisi
                  └ P5 review + gate + final render + export   [MVP lokal lengkap]
                      └ P6 recovery + cache + operasi         [beta andal]
                          └ P7 deployment + backup/restore   [siap deploy privat]
                              └ P8 plugin generatif/3D       [opsional]
```

UI shell berjalan sejak P1, halaman import terhubung pada P2, editor/preview pada P3–4.
Pekerjaan UI tidak ditunda sampai akhir. QA tumbuh setiap fase; P6 bukan alasan
mengabaikan correctness pada fase sebelumnya. P8 tidak menghalangi MVP.

## P0 — Discovery, baseline, dan keputusan teknis

**Task:**

- P0-01: baca standar repo; inventaris tracked/untracked, legacy dependencies, media
  yang tersedia, command, gate dan batas privasi. Jangan menghapus file tak dikenal.
- P0-02: catat runtime/binary/browser/hardware yang ada. Bedakan Chrome GUI lokal
  pengguna dari kemampuan sandbox agen dan deployment headless.
- P0-03: jalankan spike renderer sesuai dokumen integrasi dengan fixture sintetis.
- P0-04: verifikasi versi Node/package manager/stack, pilih auth library/OIDC strategy,
  provider AI awal, storage production target atau contract-only jika belum diketahui.
- P0-05: tulis ADR engine/stack, inventory lisensi awal, risk register, dan keputusan
  budget/limit. Pin satu versi engine dan browser kompatibel.

**Hasil:** laporan baseline; input+generator fixture; hasil benchmark; ADR dengan
alasan/pilihan yang ditunda; daftar capability yang benar-benar diuji. Hasil media
besar tetap di storage privat atau artifact CI terbatas, bukan Git publik.

**Acceptance:** keputusan engine memakai bukti; jika baseline lokal tidak tersedia
ada catatan jujur dan perbandingan kandidat yang tersedia. Tidak ada episode privat
atau file `.scratch` yang menjadi dependency CI. Versi/lisensi belum diketahui dicatat
sebagai blocker spesifik, tidak ditebak. Jangan lanjut ke implementasi adapter besar
sebelum engine dipilih.

## P1 — Fondasi aplikasi dan data

**Task:**

- P1-01: root workspace, scripts lint/typecheck/test/build, lockfile, package boundaries;
  legacy `editorial-engine` tetap terpisah dan tidak di-upgrade massal.
- P1-02: contracts/time/domain, schema Prisma+migrations, seed sintetis, ETag revisions.
- P1-03: API auth/session/workspace ACL, project CRUD, error envelope, request ID.
- P1-04: storage local+S3 interface, signed access, upload intent/complete, limits.
- P1-05: job table, outbox, dispatcher, worker heartbeat, basic retry/cancel.
- P1-06: UI shell/login/project list/new project/settings; provider secret write-only.
- P1-07: Compose dev, `.env.example`, health checks dan cara menjalankan tanpa secret.

**Acceptance:** login nyata dan project persistence; pengguna/workspace lain tidak
bisa mengakses project/upload/job/artifact; migrasi berjalan pada DB kosong; restart
API tidak menghapus data; enqueue tidak hilang saat Redis terputus setelah transaksi;
UI empty/error/loading nyata. Test fixture auth tidak boleh aktif di production.

**Tes bermakna:** ownership negative tests, revision conflict, upload MIME/limit,
outbox replay idempotent, job state transition, storage path containment.

## P2 — Input VO, timestamp, dan alignment

**Task:**

- P2-01: FFmpeg probe, waveform/metadata, validasi duration/codec; asset hashing server.
- P2-02: parser TXT/SRT/VTT/JSON dan DOCX text/table, raw preservation, diagnostics.
- P2-03: Import UI lengkap, mapping kolom/range dan konfirmasi ke revision.
- P2-04: pilih satu adapter ASR/alignment; optional local Python runner via envelope
  JSON, health check, pin model/version dan cache. Verifikasi bahasa Indonesia nyata.
- P2-05: transcript/cue editor; confidence, manual corrections, split audio clips.
- P2-06: cancellation/timeouts dan cost reservation bagi provider berbayar.

**Acceptance:** VO+DOCX dengan teks bisa dinormalisasi dari UI; timestamp angka saja
memicu ASR atau permintaan transkrip; input ambigu tidak diubah diam-diam; correction
menghasilkan revision; pipeline offline fixture bisa berjalan tetapi berlabel demo.

**Tes:** negative/out-of-order/overlap/gap ranges; locale/timecode; DOCX malformed dan
expansion limit; audio duration mismatch; split VO tanpa gap; alignment cache invalid
ketika audio berubah; cancel child process; failure tidak menghilangkan raw input.

**Bukti manual:** sekurangnya 10 cue frasa Indonesia dicek terhadap audio dengan
selisih yang dicatat, termasuk confidence rendah. Target awal cue kunci <=150 ms dari
penandaan reviewer; kegagalan memerlukan correction/review. Target ini perlu dikalibrasi,
bukan klaim semua ucapan akan otomatis akurat.

## P3 — Scene-kit dan renderer terpilih

**Task:**

- P3-01: style profile technical-explainer, font lokal terpin, palette/layout/motion rules.
- P3-02: primitive object/anchor/connector/label/camera/subtitle dengan parameter schema.
- P3-03: action registry dan enam komposisi awal sesuai arsitektur; identity continuity.
- P3-04: renderer contract/manifest, adapter terpilih, readiness asset/font, seek evaluator.
- P3-05: preview scene dan episode beresolusi rendah; UI play/seek/timecode/safe-area.
- P3-06: frame-boundary diagnostics, empty video placeholder/network stall detection,
  FFmpeg decode/mux smoke test; browser executable configurable.

**Acceptance:** fixture scene dapat dirender tanpa LLM; setiap aksi mengubah keadaan
objek sesuai spec; seek bolak-balik konsisten; output MP4 lengkap dapat diputar dengan
audio. Preview dan final menggunakan evaluator/clock sama. Tidak ada scene bergantung
nomor episode, path home pengguna, internet fonts, atau wall-clock playback.

**Tes:** attach/contact invariants, cue boundaries, 16:9/9:16 safe area, seed, random
seek order, font missing failure, duration/frame/audio count, black/freeze heuristic
dengan pengecualian scene hening yang disengaja. Snapshot dipakai pada frame penting,
bukan ribuan golden file yang hanya menyalin implementation.

## P4 — Perencana visual dan editor storyboard

**Task:**

- P4-01: prompt/versioned planner dari brief+transcript+style+source refs -> SceneSpec.
- P4-02: schema/semantic validators, bounded repair, fallback berlabel, budget guard.
- P4-03: intent/object/action/continuity planning, asset resolver lokal, reference registry.
- P4-04: Storyboard UI, inspector, cue timeline, lock/regenerate, revision diff/apply.
- P4-05: reorder/duplicate/trim/hook composition edit dan audio policy yang eksplisit.
- P4-06: style reuse antarproject, targeted replan tanpa menimpa scene terkunci.

**Acceptance:** tiga topik sintetis berbeda dibuat melalui UI tanpa mengedit source:
(1) penggantian komponen dan akar gangguan, (2) aliran air bercabang, (3) perbandingan
skala/kapasitas. Gaya konsisten, aksi berbeda sesuai makna. Setidaknya satu tes provider
nyata privat jika credential tersedia; mock-only tidak cukup untuk klaim otomatisasi.

**Tes:** invalid action/object refs, hallucinated cue phrase, circular continuity,
provider timeout/cost cap, malformed JSON, lock preservation, revision conflict,
regenerate scoped cache, hook copy menjaga scene sumber dan menghitung durasi/audio.

**Review:** penilai memeriksa apakah gambar memperlihatkan before/action/after dan
apakah aksi menjelaskan kalimat. Jika scene berakhir sebagai kartu teks dekoratif,
catat gagal kriteria kreatif walau schema lulus.

## P5 — Review editorial, final render, dan ekspor

**Task:**

- P5-01: bridge story_gate.py, adapter brief/script/audit dan receipt hash immutable.
  Tampilkan field yang belum tersedia; jangan mengarang review atau sumber.
- P5-02: draft versus final policy, review criteria/status/stale detection.
- P5-03: final render worker per-scene/checkpoint, composition assembly dan sample-based
  audio mix, progress/cancel/retry, artifact manifest.
- P5-04: final QA ffprobe+full decode+duration/frame count+asset/cue checks, safe-area
  evidence dan review manusia terpisah.
- P5-05: UI full preview/review/render/export, download URL expiry recovery.
- P5-06: legacy import read-only jika source tersedia; tidak bergantung arsip episode.

**Acceptance MVP:** satu episode sintetis 5–8 menit dengan **24 scene atau lebih**
berhasil dari input UI sampai MP4 penuh, ditinjau dari awal sampai akhir. Tiga contoh
pendek P4 tetap berhasil. Tidak ada edit source episode. Final gate gagal menghentikan
final tetapi draft tetap tersedia. Review yang stale tidak dianggap current. Artifact
sukses memiliki object nyata, checksum, metadata dan manifest.

**Tes:** wrapper exit code 1/2 fail closed, input/receipt hash mismatch, perubahan file
setelah validasi ditolak melalui snapshot/hash, artifact missing/corrupt, interrupted
upload, expired URL, audio split/mix, no silent gap kecuali dinyatakan. Selisih durasi
output memenuhi toleransi satu frame dan rounding audio pada kontrak.

**Batas klaim:** "MVP lokal lengkap" berarti workflow tersebut terbukti pada lingkungan
yang dicatat. Belum berarti production deploy atau video pasti menarik/siap publikasi.

## P6 — Keandalan, cache, dan observability

**Task:**

- P6-01: lease/reconciler, restart recovery, stale worker handling, orphan cleanup.
- P6-02: cache keys versioned, scene dependency invalidation, reuse alignment/assets.
- P6-03: SSE replay/snapshot recovery, safe logs, metrics dashboard/admin diagnostics.
- P6-04: budget reservations/reconciliation, token/call caps, provider request IDs.
- P6-05: concurrency/resource/disk limits, retry classification, retention jobs.

**Acceptance:** kill worker saat render lalu restart menghasilkan job recovered atau
retryable yang jelas tanpa artifact palsu; close/reopen tab mempertahankan progres;
cancel menghentikan child dan melepaskan lease; satu perubahan scene mengulang hanya
bagian yang tergantung dan final assembly. AI untuk scene lain tidak dipanggil ulang.

**Tes operasional:** Redis down, DB reconnect, provider timeout yang ambigu, disk full,
object upload failure, OOM simulated, duplicate delivery, double-click render, two tabs
editing, SSE disconnect, old worker version. Catat recovery dan batas yang belum diuji.

**Performance:** laporkan waktu ingest/alignment/planning/render, peak RAM, cost dan
cache hit pada cold/warm runs. Tidak menetapkan janji render realtime tanpa baseline.

## P7 — Siap deployment privat

**Task:**

- P7-01: container reproducible web/API/worker dan optional audio worker; browser/font/
  FFmpeg pinned; proses non-root dengan resource/temp limits.
- P7-02: production config, TLS/auth/cookies/CORS, private service network, storage ACL,
  signed upload/download, network restriction render dan secret manager/env injection.
- P7-03: CI lint/typecheck/unit/contract/integration; smoke render dengan fixture kecil;
  full24-scene release check tidak harus dijalankan pada setiap edit dokumen.
- P7-04: migrasi DB sebelum rollout, compatibility contract antarversi, rollback image,
  feature flags untuk plugin, backup/restore runbook dan retention.
- P7-05: manual deployment/runbook untuk host pengguna; staging acceptance dan auth test.

**Acceptance:** staging privat dapat dibuka melalui browser, upload -> render -> download
berfungsi tanpa terminal pengguna; worker tetap berjalan setelah browser ditutup;
backup DB+asset manifest berhasil direstore ke environment terpisah; rollback build
sebelumnya teruji pada schema kompatibel. External storage tidak public. Media dan
credential tidak ada di Git maupun log CI.

"Siap deploy" memerlukan konfigurasi, image, migration, runbook, dan bukti staging;
README dengan tombol deploy saja tidak cukup. Jika domain/host/credential belum
tersedia, laporkan deploy config ready dan staging external `NOT TESTED`, jangan
membuat klaim live atau mempublikasikan layanan tanpa instruksi pemilik.

## P8 — Integrasi opsional setelah fondasi terbukti

- P8-01: Three.js scene registry dengan camera/lighting/time deterministic.
- P8-02: Blender job untuk objek/mechanism tertentu; bake/cache outputs dan provenance.
- P8-03: ComfyUI asset workflow dengan model/license/budget/version pinning.
- P8-04: Rea reference importer dan style extraction yang memisahkan referensi dari hak aset.
- P8-05: EffectCraft round-trip spike bila editing manual benar-benar diperlukan.
- P8-06: turunan Shorts dengan konteks/crop/subtitle review; bukan crop otomatis semua scene.

Setiap plugin punya feature flag, capability probe, timeout/cancel, cache, cost estimate,
license inventory dan fallback yang ditandai. Ketika plugin mati, SVG-only MVP tetap
berjalan. PixelFX/style tambahan baru dibangun berdasarkan kebutuhan episode nyata.

## Definition of done per task

1. Implementasi ada, terhubung ke jalur pengguna/API yang dimaksud, bukan dead code.
2. Schema/ownership/error/cancellation yang relevan diperiksa.
3. Tes bermakna untuk risiko perilaku lulus; bukti manual untuk aspek visual dicatat.
4. Dokumentasi command/config/limitation diperbarui, dependency dipin.
5. Tidak ada credential, media privat, output besar atau hasil generatif privat di commit.
6. Status jelas: DONE / PARTIAL / BLOCKED / NOT TESTED; tidak mengubah mock jadi bukti live.
7. Commit hanya scope tugas; laporan menyebut SHA, file, tes, dan langkah berikut.

## Release checklist akhir

- [ ] Tiga topik baru lewat UI tanpa perubahan source.
- [ ] Episode 24+ scene penuh, audio sinkron, MP4 decode penuh.
- [ ] Review visual full playback dicatat terpisah dari numeric QA.
- [ ] Hook/copy/split audio dan revision diff benar.
- [ ] Final gate terhubung dan fail-closed; draft jelas berlabel.
- [ ] Upload/revision/job/artifact terlindung workspace ACL.
- [ ] Worker restart/cancel/retry dan cache invalidation terbukti.
- [ ] API keys dan media privat tetap di storage/environment privat.
- [ ] Staging deploy dan backup/restore terbukti, atau batas NOT TESTED eksplisit.
- [ ] Runbook operator dan user guide Indonesia tersedia.
