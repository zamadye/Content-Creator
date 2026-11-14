# Spesifikasi UI Content Studio

Dokumen ini merancang UI yang akan dibangun agen, bukan UI yang sudah tersedia.
Bahasa utama Indonesia; desktop menjadi workspace editing utama; mobile mendukung
upload, status, review, dan unduh. Pengguna tidak perlu terminal untuk jalur normal.

## 1. Struktur navigasi

| Route UI | Fungsi | Komponen utama |
|---|---|---|
| `/login` | Masuk melalui provider auth | LoginPanel, AuthError |
| `/projects` | Daftar project dan mulai baru | ProjectGrid/List, SearchFilter, NewProjectDialog |
| `/projects/new` | Buat project | ProjectBriefForm, OutputPresetPicker, StylePicker |
| `/projects/:id/import` | VO + timestamp | VoiceUpload, TimestampInput, ImportPreview, ValidationSummary |
| `/projects/:id/alignment` | Koreksi transkrip dan cue | Waveform, TranscriptList, RangeEditor, ConfidenceBadge |
| `/projects/:id/storyboard` | Review rencana visual | SceneList, StoryboardCanvas, IntentPanel, ContinuityPanel |
| `/projects/:id/scenes/:sceneId` | Edit satu scene | ScenePreview, ObjectTree, ActionTimeline, Inspector |
| `/projects/:id/review` | Preview penuh dan temuan | EpisodePlayer, FindingsList, ReviewChecklist, EvidenceNotes |
| `/projects/:id/renders` | Antrean dan riwayat render | RenderSetup, JobProgress, StageList, AttemptsHistory |
| `/projects/:id/exports` | Download hasil | ArtifactCard, RevisionSummary, DownloadAction |
| `/projects/:id/settings` | Style/output/budget project | ProjectSettings, BudgetPanel, RetentionSettings |
| `/settings/providers` | Koneksi AI/storage/ASR | ProviderStatus, SecretInput, ConnectionTest |
| `/settings/styles` | Profil visual tersimpan | StyleProfileList, TokenEditor, MotionRulesEditor |

ProjectShell memiliki project name, revision selector, breadcrumb, stage indicator,
status penyimpanan, dan menu bantuan. Navigasi tahap tidak menghapus pekerjaan.
Stage yang belum siap menampilkan kebutuhan yang kurang; deep-link tetap punya empty
state yang menjelaskan tindakan berikutnya.

## 2. Jalur utama pengguna

1. Klik **Project baru**, isi judul; default explainer teknis dan output landscape.
   Pilih 16:9 atau 9:16 sebelum perencanaan karena layout berbeda.
2. Unggah VO; unggah timestamp DOCX/TXT/SRT/VTT/JSON atau paste teks.
3. Sistem membaca durasi dan timestamp, menampilkan preview serta peringatan.
4. Pengguna mengonfirmasi mapping; transkripsi/alignment berjalan jika perlu.
5. Klik **Buat storyboard**; tampilkan estimasi biaya dan budget tersisa.
6. Review scene: pesan, objek, aksi, cue, dan continuity. Revisi scene tertentu bila perlu.
7. Klik **Buat preview**; draft beresolusi rendah dapat diputar penuh.
8. Tinjau temuan teknis/editorial; simpan review untuk revisi aktual.
9. Klik **Render final** setelah gate terpenuhi; progres tetap hidup setelah tab ditutup.
10. Unduh MP4 pada halaman Ekspor; versi, durasi, ukuran, dan status QA terlihat.

Dengan style/provider tersimpan dan input bersih, langkah pengaturan tidak perlu
diulang untuk setiap episode. Mode **Draft otomatis** boleh melewati review storyboard
untuk membuat animatic privat; tidak boleh menyatakan sudah lolos review final.

## 3. Wireframe desktop

```text
┌ Project: Demo   Revisi 4   Tersimpan          Budget: tersedia ┐
│ Input → Alignment → Storyboard → Review → Render → Ekspor     │
├─────────────┬─────────────────────────────┬───────────────────┤
│ Daftar scene│                             │ Pesan scene       │
│ 01 00–12    │       Preview scene         │ Objek dan aksi    │
│ 02 12–28 !  │                             │ Cue narasi        │
│ 03 28–40    │                             │ Sumber/disclosure │
│ ...        ├─────────────────────────────┤ Temuan            │
│            │ Waveform / timeline / cue   │ Revisi scene      │
├─────────────┴─────────────────────────────┴───────────────────┤
│ Draft • preview revisi 4       Buat preview | Lanjut review   │
└─────────────────────────────────────────────────────────────┘
```

Aplikasi produksi memiliki panel kerja; video yang dihasilkan tetap menggunakan
komposisi explainer. Jangan menjadikan screenshot dashboard sebagai default visual
video. Thumbnail scene harus berasal dari hasil scene/evaluator, bukan gambar hias.

## 4. Upload dan normalisasi

### VoiceUpload

Drag/drop dan tombol browse setara; nama, jenis, ukuran, durasi, progress, cancel,
retry terlihat. Upload langsung ke private storage melalui URL sementara. Jika
upload resumable dipilih, implementasikan provider yang benar; jangan hanya menyebut
resumable sementara retry mengulang seluruh file tanpa penjelasan.

Batas awal usulan: 500 MB VO, 30 menit durasi, timestamp 10 MB dan 500 scene. Semua
batas configurable di server dan ditampilkan sebelum upload; benchmark dapat mengubah
angka melalui ADR. Batas client tidak menggantikan validasi server.

### TimestampInput

Tab **Unggah file** dan **Tempel teks**. Contoh format sintetis tersedia. DOCX parser
menampilkan teks/tabel yang dikenali. ImportPreview memuat scene ID, mulai, akhir,
narasi, status dan diagnostics. Pengguna dapat membetulkan kolom/range sebelum commit.
Jangan otomatis menggeser seluruh scene agar valid tanpa memperlihatkan diff.

Kasus UI khusus: timestamp angka saja -> tawarkan transkripsi; audio tanpa timestamp
-> auto-segmentation opsional berlabel perkiraan; timestamp tanpa audio -> simpan
project tetapi tombol alignment/render nonaktif; beda durasi -> tampilkan selisih;
silent scene -> pilihan eksplisit; overlap -> bedakan transisi yang dimaksud dari error.

Parser error menyebut baris/sel yang gagal, format yang diharapkan, dan cara memperbaiki.
Raw input tidak hilang saat parsing gagal. Ganti file menghasilkan revisi import baru.

## 5. Alignment dan review narasi

Waveform memiliki zoom, play/pause, loop range, keyboard seek dan timecode. TranscriptList
menyorot kata saat diputar; confidence rendah diberi teks/status selain warna. Koreksi
teks dan drag cue menyimpan revisi; tampilkan perbedaan dari alignment mesin.

CueEditor membatasi range pada source audio yang sesuai dan scene terkait. Edit global
atau lokal harus jelas. Tombol **Gunakan timing manual** menyimpan asal cue `manual`;
sistem tidak menganggap confidence mesin setelah perubahan. Split VO kontinu tetap
terlihat sebagai clip yang sah. Undo/redo berlaku untuk draft edit; save menciptakan
revision immutable. Audio sumber tidak ditimpa atau diperpanjang otomatis.

## 6. Storyboard dan perencana visual

SceneCard menampilkan thumbnail, range, durasi, narasi ringkas, intent, jenis komposisi,
status asset/cue/QA. Detail menunjukkan sebelum -> tindakan -> sesudah, objectMap,
sourceRefs, continuity, dan alasan bentuk visual dipilih.

Operasi MVP:

- Ubah pesan/label/objek yang didukung registry.
- Pilih komposisi alternatif yang kompatibel dengan makna scene.
- Regenerate scene dengan instruksi terbatas, misalnya "perjelas proses penggantian".
- Lock scene agar planner ulang tidak menggantinya; lock melindungi spec, bukan menutupi
  invalidasi bila timing/style berubah. Tampilkan kebutuhan revalidasi.
- Reorder/duplicate/trim clip instance; jadikan potongan sebagai hook. Dialog hook
  meminta range, lokasi, dan kebijakan audio, lalu memperlihatkan durasi sebelum/sesudah.
- Bandingkan revisi; restore menghasilkan revisi baru, bukan menghapus sejarah.

Regenerate memperlihatkan scope terdampak, estimasi budget, dan diff hasil sebelum
apply. Revision conflict meminta reload/merge perubahan; jangan overwrite edit tab lain.
Planner gagal -> diagnostics + retry/manual composition. Tidak menaruh placeholder
seolah scene selesai. Fallback diagram statis berstatus **Perlu ditinjau**.

## 7. Editor scene MVP

Editor adalah inspector untuk scene-kit, bukan clone After Effects atau freeform
no-code animation builder. Ini membatasi scope dan memudahkan validasi/lisensi.

| Komponen | Tanggung jawab | Tidak boleh |
|---|---|---|
| ScenePreview | Play, seek, safe-area, bounds overlay | Menjalankan kode bebas dari prompt |
| ObjectTree | Pilih objek, identity key, parent/anchor | Mengganti ID diam-diam dan memutus action |
| PropertyInspector | Label, warna token, posisi, scale, state | Menyimpan properti di luar schema |
| ActionTimeline | Range action, cue, easing whitelist | Mempercepat VO untuk mengejar animasi |
| CueInspector | Frasa, waktu, asal, confidence | Mengarang frasa yang tidak ada |
| ContinuityPanel | Objek kembali dan dependensi | Menyatakan konsisten tanpa evaluasi |
| RevisionDiff | Spec/visual diff, apply/restore | Mengubah snapshot lama |

Editor menampilkan waktu lokal scene serta waktu global episode. Safe-area preset
mengikuti output/platform; perubahan aspect ratio meminta reflow dan re-QA. MVP belum
memerlukan path drawing bebas, scripting UI, particle editor, atau authoring shader.

## 8. Review, gate, dan temuan

ReviewPage mempunyai player penuh dengan VO, daftar temuan bertimecode yang dapat
diklik, subtitle toggle, dan revision badge. Pisahkan:

- **Mekanis:** coverage, overlap, decode, missing asset, frame count, clipping,
  safe-area, cue bounds, audio track, freeze heuristic.
- **Perlu penilaian:** makna visual, akurasi diagram/fakta, keterbacaan ponsel,
  continuity, kenyamanan gerak, dan kejelasan hubungan sebab-akibat.
- **Editorial yang diwarisi:** brief, audit kalimat, receipt dan hash story gate.

Status `PASS`, `FAIL`, `NEEDS REVIEW`, `NOT TESTED`, `STALE` memiliki teks dan icon.
Checklist tidak otomatis tercentang oleh model. EvidenceNotes mengikat review pada
revision, scope, timestamp, reviewer, metode, dan lokasi bukti privat. Review manusia
hanya dicatat setelah orang menilai. Revisi input menandai review terkait stale.

Tombol render final menjelaskan criterion yang belum terpenuhi dan menuju field yang
perlu diperbaiki. Preview draft tetap tersedia sesuai aturan repo. Export tidak
menyediakan tombol publish/schedule dalam MVP.

## 9. Render dan ekspor

RenderSetup memilih draft/final profile, resolusi/fps yang didukung, revision, serta
menampilkan durasi terhitung. Tampilkan kemampuan worker dan biaya perkiraan. Advanced
settings tidak menampilkan perintah shell/path internal atau meminta pengguna memasang
Chromium jika Chrome lokal sudah tersedia.

JobProgress menampilkan queue/running stage, jumlah scene/frame selesai, elapsed,
ETA bila dapat dihitung, heartbeat terakhir, cancel, retry, serta safe error details.
Tab yang ditutup dapat kembali melalui daftar project dan menemukan job yang sama.
Ketika revisi baru dibuat saat job berjalan, label **Merender revisi N** tetap akurat.

ArtifactCard menampilkan thumbnail, MP4 size, duration, output profile, revision, created
at, checksum ringkas, QA state, tombol unduh. Tombol hanya aktif jika object siap.
URL kedaluwarsa -> minta URL baru, tidak render ulang. Render gagal tidak memiliki
badge sukses meski preview lama ada. Artifact lama tetap tersedia dengan label revisi.

## 10. Komponen lintas fitur

Design primitives: Button, Input, Textarea, Select, Tabs, Dialog, Drawer, Tooltip,
Badge, Progress, Table, EmptyState, ErrorState, Skeleton, Toast, ConfirmDestructive,
TimecodeInput, RevisionBadge, StatusLabel, BudgetMeter. Prefer aksesibilitas primitive
terawat; tidak perlu design-system generator pada fase ini.

State server memakai query cache dengan invalidasi eksplisit; form draft lokal terpisah
agar SSE tidak menimpa input. Optimistic UI hanya untuk metadata yang reversible;
render/upload/QA memakai hasil server otoritatif. Autosave debounce menyatakan saving,
saved, offline/failed; guard navigation jika draft belum tersimpan.

Aksesibilitas: semantic headings, label input, focus visible/trap dialog/return focus,
keyboard-only upload dan timeline dengan input waktu alternatif, error summary,
kontras memadai, prefers-reduced-motion untuk UI, status live region yang tidak spam.
Video preview tetap mempunyai kontrol pause dan subtitle; reduced-motion UI tidak
mengubah file produksi tanpa pilihan eksplisit.

## 11. State yang wajib didemokan

Empty project; upload berjalan/gagal; parser ambigu; alignment confidence rendah;
provider belum dikonfigurasi; budget habis; worker offline; job queued/retry/cancel;
scene asset hilang; revision conflict; review stale; artifact download expired;
project deleted/akses ditolak; render sukses revisi lama saat revision baru aktif.

Fase UI awal boleh memakai fixture API, tetapi wajib ada label **Demo / data sintetis**.
Tombol yang belum terhubung tidak boleh menampilkan sukses palsu. Screenshot UI dan
video hasil merupakan bukti terpisah; keduanya diperlukan pada acceptance akhir.
