# Kontrak data, waktu, API, dan job

Semua struktur di bawah adalah **kontrak usulan v1 yang harus diimplementasikan dan
divalidasi**. Contoh sintetis tidak menyatakan fakta dunia nyata. Nama provider dan
versi konkret diisi setelah spike; schema version bukan versi package.

## 1. Aturan umum

- ID opaque UUID/ULID, selalu terikat workspace. Tidak menerima path filesystem dari UI.
- Timestamp tersimpan sebagai integer mikrodetik `*Us`; durasi ffprobe dikonversi
  sekali dengan aturan pembulatan terdokumentasi. Frame dan sample index dihitung
  dengan rational arithmetic, bukan floating point berulang.
- FPS berupa `{ numerator, denominator }`, default MVP 30/1. Audio mix default 48 kHz.
- Interval `[startUs, endUs)`; akhir scene terakhir tepat duration composition.
  Tidak ada overlap tak disengaja atau gap terselubung. Transisi punya definisi eksplisit.
- Target frame count `ceil(durationUs * fpsNum / (1e6 * fpsDen))`.
  Toleransi frame padding maksimal satu frame; audio sample rounding maksimal satu sample.
- Clip audio mempunyai `sourceStartUs`, `sourceEndUs`, `timelineStartUs`, gain dan mute.
  Split kontinu sah; overlap harus tercatat sebagai mix. Jangan asumsi satu file=one clip.
- Timecode UI `HH:MM:SS.mmm` dan raw input disimpan. Range tanpa teks tetap bisa
  diimport lalu dihubungkan ke transkripsi; tidak diklaim memahami angka saja.
- Semua JSON memakai strict schema, enum, range, batas panjang, dan migrasi versioned.
  Unknown field ditolak untuk input API atau ditangani versi schema secara eksplisit.

## 2. Entitas persistence

| Entitas | Field inti | Invariant |
|---|---|---|
| Workspace / Membership | owner, role, quota | Default owner; ACL setiap request |
| Project | title, workspaceId, currentRevisionId, status | Pointer revisi berubah via transaksi |
| Asset | kind, storageKey, sha256, bytes, MIME, metadata, provenance | Immutable blob; tidak ada public URL permanen |
| Import | sourceAssetIds, rawText, parserVersion, diagnostics, normalizedAssetId | Raw input tetap ada untuk traceability |
| EpisodeRevision | parentId, schemaVersion, composition, styleVersion, input hashes | Snapshot immutable; edit membuat revisi baru |
| SceneRevision | stableSceneId, previousRevisionId, spec, contentHash | Stable identity terpisah dari urutan scene |
| ClipInstance | sceneRevisionId, range, placement, audioPolicy | Hook/copy menjadi instance, bukan overwrite sumber |
| Alignment | audio/transcript hashes, words, confidence, providerVersion | Invalid ketika salah satu dependency berubah |
| Review | revisionHash, scope, reviewer, criteria, evidence, status | Tidak diwariskan menjadi PASS ke revisi lain |
| Job / JobAttempt | type, revisionId, state, lease, stage, progress, timestamps | Idempotency key scoped workspace+operation |
| Artifact | jobId, manifestHash, kind, storageKey, checks, bytes | Complete hanya setelah object tersedia dan tervalidasi |
| ProviderUsage | requestId, stage, reserved/actual cost, units, outcome | Tidak menyimpan credential atau prompt privat di log publik |
| OutboxEvent | payloadRef, eventType, publishedAt, retryAt | Ditulis dalam transaksi metadata; dapat replay |
| AuditEvent | actor, resource, action, revisionId, timestamp | Immutable; redacted metadata |

Indeks: workspace+project, project+createdAt, job state+leaseExpiresAt, asset hash scoped
workspace, artifact job+kind; unique idempotency key dan event sequence per job.
Foreign key deletion dibatasi; cleanup dilakukan setelah lifecycle disetujui.

## 3. Contoh snapshot episode

ID contoh memakai label agar terbaca; fixture executable wajib memakai ID valid sesuai schema.

```json
{
  "schemaVersion": "1.0",
  "projectId": "project-demo",
  "revisionId": "revision-demo-2",
  "parentRevisionId": "revision-demo-1",
  "locale": "id-ID",
  "truthMode": "fiction",
  "fictionDisclosure": "Contoh sintetis untuk pengujian sistem.",
  "output": {"width": 1920, "height": 1080, "fps": {"numerator": 30, "denominator": 1}, "sampleRate": 48000},
  "style": {"id": "technical-explainer", "version": "1.0.0"},
  "seed": 42,
  "composition": {
    "durationUs": 12000000,
    "clips": [{"id": "clip-main", "sceneRevisionId": "scene-r1", "sourceStartUs": 0, "sourceEndUs": 12000000, "timelineStartUs": 0, "audioPolicy": "external-track"}],
    "audioClips": [{"id": "audio-main", "assetId": "asset-voice", "sourceStartUs": 0, "sourceEndUs": 12000000, "timelineStartUs": 0, "gainDb": 0, "muted": false}]
  },
  "sceneRevisionIds": ["scene-r1"],
  "sourceRefs": [],
  "reviewState": "not_tested"
}
```

Ganti hook menambah clip instance dan mengubah composition duration/audio placement.
Jika hook tanpa VO, tampilkan kebijakan silence/music secara eksplisit. Jika hook
mengulang ucapan, duplikasi source range audio harus eksplisit dan terlihat di UI.
`sourceRefs` kosong hanya karena contoh fiksi sintetis; fakta harus memiliki referensi
klaim dan batas sumber sesuai story gate. Schema style menyimpan versi dan hash font,
palette, layout rules, motion rules, subtitle rules, serta asset identity registry.

## 4. Kontrak SceneSpec

```json
{
  "schemaVersion": "1.0",
  "id": "scene-r1",
  "stableSceneId": "scene-component",
  "durationUs": 12000000,
  "narration": {"text": "Bagian diganti, tetapi gangguan tetap muncul.", "startUs": 0, "endUs": 12000000},
  "intent": "Memperlihatkan penggantian yang tidak menyelesaikan sumber gangguan.",
  "compositionKind": "object-replacement",
  "stateBefore": "Bagian A terpasang; sumber gangguan berada di jalur B.",
  "stateAfter": "Bagian A2 terpasang; gangguan dari jalur B masih terjadi.",
  "objects": [
    {"id": "part", "primitive": "component", "identityKey": "main-part", "label": "Komponen", "initialState": "installed", "anchor": [0.4, 0.5]},
    {"id": "path", "primitive": "flow-path", "identityKey": "main-path", "label": "Jalur", "initialState": "fault", "anchor": [0.7, 0.5]}
  ],
  "actions": [
    {"id": "replace", "kind": "replace", "targetIds": ["part"], "startUs": 1000000, "endUs": 4000000, "cueId": "cue-replace", "fromState": "installed", "toState": "replaced", "easing": "smooth"},
    {"id": "fault", "kind": "flow", "targetIds": ["path"], "startUs": 6000000, "endUs": 10000000, "cueId": "cue-fault", "fromState": "fault", "toState": "fault-visible", "easing": "linear"}
  ],
  "cues": [
    {"id": "cue-replace", "phrase": "Bagian diganti", "startUs": 1000000, "endUs": 4000000, "confidence": 0.96, "source": "alignment"},
    {"id": "cue-fault", "phrase": "gangguan tetap muncul", "startUs": 6000000, "endUs": 10000000, "confidence": 0.92, "source": "alignment"}
  ],
  "camera": {"kind": "orthographic-2d", "focusObjectIds": ["part", "path"]},
  "continuity": {"dependsOnSceneIds": [], "identityKeys": ["main-part", "main-path"]},
  "disclosures": ["Ilustrasi skematis, bukan rekaman kejadian."],
  "sourceRefs": [],
  "acceptance": ["Komponen benar-benar berubah sebelum gangguan kembali terlihat."],
  "fallback": {"kind": "static-diagram", "requiresReview": true}
}
```

Waktu action/cue lokal terhadap scene. Placement global dihitung lewat ClipInstance.
Position normalized terhadap canvas; batas safe area style diterapkan compiler.
Shape/primitive/action memakai registry whitelist dengan parameter schema per jenis;
contoh di atas minimum, bukan izin arbitrary property atau kode.

Validator memeriksa: ID unik, referensi objek ada, urutan keadaan masuk akal menurut
state machine action, cue tidak di luar narasi, action tidak keluar scene, aset tersedia,
label tidak kosong, sourceRefs valid jika faktual, dan tidak ada circular dependency.
Semua scene harus memiliki intent, before/action/after dan objectMap yang bisa
diterjemahkan ke format gate lama. Pemeriksaan field bukan bukti makna visual benar.

## 5. Import dan alignment

Format MVP: WAV/MP3/M4A VO; timestamp melalui TXT, SRT, VTT, JSON atau paste teks.
DOCX dibangun pada fase ingest karena input pengguna saat ini menggunakan DOCX.
Parser DOCX hanya teks/tabel yang didukung; image/layout/macro tidak dieksekusi.
Bila tabel ambigu, tampilkan mapping kolom dan preview sebelum konfirmasi.

Normalizer menyimpan raw offsets, scene ranges, text, warnings. Input `01:20–01:35`
dengan atau tanpa teks didukung; ambigu format atau koma desimal tidak ditebak diam-
diam. Gap, overlap, range negatif, out-of-order, scene tanpa VO, dan akhir melebihi
file audio ditandai. Pengguna bisa menyatakan scene silence/b-roll secara eksplisit.

Alignment mengeluarkan `{token,startUs,endUs,confidence,source}`; koreksi manual
menghasilkan alignment revision baru, tidak mengubah audio. Token confidence rendah
mengaktifkan review. Ambang awal usulan confidence <0.8 perlu dikalibrasi pada data
Indonesia; threshold bukan bukti akurasi. Format transkrip dan model mengikuti adapter.

## 6. Kontrak renderer

```ts
interface RendererAdapter {
  capabilities(): Promise<RendererCapabilities>;
  validate(manifest: RenderManifest): Promise<Diagnostic[]>;
  render(input: {
    manifest: RenderManifest;
    outputDirectory: string; // dibuat worker, bukan dari request UI
    signal: AbortSignal;
    onProgress: (event: RenderProgress) => void;
  }): Promise<RenderResult>;
}
```

`RenderManifest`: schema/revision/hash; scene spec immutable; resolved asset paths dan
hash; style/evaluator versions; composition; output profile; deterministic seed;
browser capabilities; expected frame count/audio sample count; color policy.
`RenderResult`: artifact paths lokal, actual duration/frame count, diagnostic, build
metadata, QA evidence. Upload artifact adalah tanggung jawab worker, bukan UI.
`RendererCapabilities`: codec, fps/resolution, transparency/3D, browser requirements,
seek, cancellation, maximum dimensions, supported schema versions.

Adapter wajib membuktikan render seek `t=8 -> 2 -> 8` menghasilkan keadaan sama dalam
toleransi renderer yang ditentukan. Determinisme lintas GPU/OS tidak diasumsikan;
pixel comparison dilakukan pada image/browser yang sama. Preview beresolusi rendah
boleh berbeda rasterisasi, tetapi keadaan, timing, dan jumlah objek harus sama.

## 7. State machine dan retry

Project display state diturunkan dari revision dan job aktif, bukan boolean `isDone`.
Pipeline stage: `ingest -> align -> plan -> assets -> preview -> review -> final-render
-> final-qa -> artifact-ready`. UI bisa memulai dari checkpoint setelah revisi.

Job states: `queued`, `running`, `retry_wait`, `blocked_review`, `blocked_budget`,
`cancel_requested`, `cancelled`, `failed`, `succeeded`. Stage terpisah dari state.
Transition dari terminal hanya melalui job baru; attempt bukan revision baru.

- Retry network/transient dengan backoff+jitter maksimum 3 attempt sebagai default.
  Validation/schema error tidak diulang tanpa perubahan input.
- Provider call memakai stable request ID bila provider mendukung. Provider timeout
  yang tidak pasti ditandai dan direkonsiliasi; jangan mengklaim exactly-once billing.
- Lease expiry membuat attempt abandoned; reconciler requeue hanya kerja idempotent.
- Save checkpoint per scene. Progress berdasarkan unit terukur; ETA unknown sampai
  cukup sampel. `100%` tidak ditampilkan sebelum manifest/upload/QA selesai.
- Cancel selesai hanya setelah child berhenti. Error menyimpan code, stage, retryable,
  requestId dan safe detail; stderr dibersihkan dari secret/path privat.

## 8. API v1 yang harus dibangun

Prefix `/api/v1`; auth wajib kecuali health non-detail dan auth handshake. Semua
mutasi memakai CSRF/session protections sesuai mekanisme auth, input validation,
workspace ACL, rate limit. Job-creating POST memerlukan `Idempotency-Key`.

| Method dan route | Input/hasil inti |
|---|---|
| GET `/session` | User, workspace roles, feature flags; tanpa secret |
| GET/POST `/projects` | Pagination/filter atau create title/style/output |
| GET/PATCH `/projects/:id` | Metadata; `If-Match` untuk edit |
| POST `/projects/:id/uploads` | Nama/size/type -> uploadId, URL privat sementara |
| POST `/projects/:id/uploads/:uploadId/complete` | Server cek object metadata/hash -> Asset |
| POST `/projects/:id/imports` | asset IDs atau paste -> ingest job |
| GET `/projects/:id/imports/:importId` | Raw/normalized summary dan diagnostics |
| POST `/projects/:id/imports/:importId/confirm` | Range/text mapping yang disetujui -> revision |
| POST `/projects/:id/alignments` | Audio/transcript revision -> alignment job |
| POST `/projects/:id/plans` | baseRevisionId, style, constraints -> planner job |
| GET `/projects/:id/revisions/:revisionId` | Immutable snapshot dan signed preview refs |
| PATCH `/projects/:id/scenes/:sceneId` | baseRevisionId + typed patch -> new revision |
| POST `/projects/:id/scenes/:sceneId/regenerate` | Batas scope + prompt + base revision -> job |
| POST `/projects/:id/composition-edits` | Reorder/duplicate/trim/hook/audio policy -> revision |
| POST `/projects/:id/reviews` | scope, revisionHash, criteria/evidence, decision |
| GET `/projects/:id/reviews` | Current + stale review status |
| POST `/projects/:id/renders` | revisionId, profile, draft/final -> job |
| GET `/projects/:id/jobs` | List jobs untuk recovery tab |
| GET `/jobs/:id` | Snapshot/progress/stage/diagnostics |
| GET `/jobs/:id/events` | SSE progress dan status, ACL setiap koneksi |
| POST `/jobs/:id/cancel` | Idempotent cooperative cancellation |
| POST `/jobs/:id/retry` | Failed/recoverable -> new attempt/job sesuai terminal rule |
| GET `/projects/:id/artifacts` | List by revision/kind/state |
| POST `/artifacts/:id/download-url` | ACL -> URL sementara, content disposition aman |
| GET `/styles` | Profile/version dan supported compositions |
| GET/PATCH `/settings/providers` | Status/secret reference write-only; key tidak dibaca balik |
| GET/PATCH `/projects/:id/budget` | Estimate/reservation/usage/limit |
| DELETE `/projects/:id` | Lifecycle delete, aktif job dibatalkan lebih dahulu |
| GET `/health/live`, `/health/ready` | Liveness; dependency readiness tanpa credential |

Semua resource child diverifikasi terhadap workspace dan project; path yang benar
belum membuktikan ownership. Upload complete tidak mempercayai hash client saja.
Revisi PATCH memakai ETag/If-Match atau base revision compare-and-swap; konflik
menghasilkan `409 REVISION_CONFLICT`, bukan last-write-wins diam-diam.

Error envelope: `{error:{code,message,fieldErrors,retryable,requestId}}`.
Status: 400 malformed, 401 unauthenticated, 403 denied (atau 404 untuk concealment),
404 missing, 409 conflict, 413 upload too large, 422 semantic invalid, 429 rate/budget,
503 worker/provider unavailable. Final gate gagal -> 422 dengan daftar criterion,
bukan membuat artifact palsu atau menghapus input.

## 9. Event dan cache invalidation

SSE envelope: `{eventId,jobId,sequence,type,occurredAt,payload}`.
Jenis: `job.state`, `stage.progress`, `scene.ready`, `diagnostic.added`,
`budget.updated`, `artifact.ready`. Payload tidak berisi secret/transkrip penuh.
Last-Event-ID mendukung replay terbatas. Jika event sudah kedaluwarsa, client mengambil
snapshot GET dan melanjutkan; disconnect tidak menghentikan job.

Invalidasi: audio -> alignment/cues/preview/final; timestamp -> affected ranges/cues;
scene action -> scene + continuity/transitions; style -> all visuals, bukan ASR;
composition -> placement/mix/final; review -> gate state, bukan aset; renderer version
-> preview/final, bukan transkripsi. UI selalu menampilkan revisi yang sedang dilihat
berbeda dari revisi job yang sedang dirender.

## 10. Paket handoff/export

Artifact manifest menyertakan checksum MP4, duration/fps/audio properties, revision,
input hashes, renderer/browser/font/style versions, scene list, cue mapping, QA report,
review status dan limitations. `complete` artinya file ada dan lolos checks sesuai
profile, tidak berarti sudah dipublikasikan. Export project berisi JSON + daftar aset;
opsi bundle media hanya untuk storage privat, tidak otomatis ke Git atau ZIP publik.
