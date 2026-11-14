# Integrasi tools, link sumber, dan keputusan

Diperiksa berdasarkan dokumentasi publik pada 15 November 2026. Ini evaluasi desain,
bukan benchmark kinerja. Agen pelaksana wajib memverifikasi README, LICENSE, versi,
API, dan kompatibilitas saat implementasi. Jangan menganggap semua repo harus diinstal.

## 1. Registry seluruh tools yang diminta

| Tool dan link GitHub penuh | Posisi dalam sistem | Keputusan / deliverable integrasi |
|---|---|---|
| Rea-Video — https://github.com/JuneYaooo/rea-video | Analisis shot dan metode rekonstruksi video referensi | Opsional fase 8: importer hasil analisis ke ReferenceStyleBrief; tidak menerima instruksi/kode langsung sebagai executable |
| Lemo-Opuscar — https://github.com/lemomo-ai/lemo-opuscar | Pedoman director, style, ritme, teknik pembuatan film berbasis kode | Studi prioritas fase 0/4; adaptasi konsep ke planner/style sendiri. Bukan dependency runtime wajib; review lisensi sebelum menyalin resource |
| EffectCraft — https://github.com/storytold/effectcraft | Compositor motion graphics dengan kontrol programatis | Tunda; masih alpha menurut repo. Pilot export/edit bridge setelah MVP jika kebutuhan polish manual terbukti |
| PixelFX — https://github.com/patch-gg/pixelfx | Efek pixel art JavaScript | Tunda; plugin style pixel opsional, tidak cocok sebagai default explainer teknis |
| Awesome Opus 5.5 Videos — https://github.com/yihui-dev/awesome-opus5-5-videos | Koleksi contoh dan prompt | Referensi visual saja; bukan engine, SDK, atau otomatisasi. Jangan menganggap contoh bebas diambil asetnya |
| HyperFrames — https://github.com/heygen-com/hyperframes | HTML/CSS/media menjadi video melalui workflow agent/CLI/Studio | Kandidat renderer utama fase 0. Buat adapter hanya jika lolos seek, cancellation, browser, QA dan biaya. Framework inti terbuka; fitur Pro terpisah |
| Remotion — https://github.com/remotion-dev/remotion | React video composition dan render berbasis parameter | Kandidat alternatif fase 0; repo legacy sudah memiliki dependency. Pilih jika hasil dan lisensi lebih sesuai; bukan kewajiban mempertahankan dua engine |
| Remotion Skills — https://github.com/remotion-dev/skills | Petunjuk agen untuk ekosistem Remotion | Dipakai agen hanya jika Remotion dipilih; pin snapshot dan cakupan, bukan library runtime terpisah |
| MCP for Blender — https://github.com/ahujasid/mcp-for-blender | Agen mengendalikan Blender dan membuat aset/scene 3D | Opsional fase 8, worker terisolasi; hasil dibake menjadi aset dan provenance. Bukan plugin resmi Blender Foundation |
| Three.js — https://github.com/mrdoob/three.js | Objek, kamera, material 3D dalam browser | Opsional fase 8; registry `technical-3d`; waktu deterministik; jangan menambah GPU requirement sebelum ada scene yang memerlukannya |
| GSAP — https://github.com/greensock/GSAP | Timeline, easing dan animasi SVG/DOM/Canvas | Prioritas fase 3 jika kompatibel renderer terpilih. Timeline paused/seek; review lisensi bila UI berkembang menjadi animation builder |
| ComfyUI — https://github.com/Comfy-Org/ComfyUI | Workflow generasi aset gambar/video | Opsional fase 8; service API terpisah, workflow/model dipin, budget/provenance/cancel. Tidak menjadi dependency jalur render SVG dasar |
| Unslop — https://github.com/heydamir/unslop | Panduan agen desain UI | Opsional saat membangun UI; tidak menilai kebenaran scene atau menggantikan director |
| Impeccable — https://github.com/pbakaus/impeccable | Kritik dan penyempurnaan desain antarmuka | Opsional review UI; ikuti lisensi/version pin jika diadopsi. Jangan otomatis menjalankan semua perintahnya |
| Anthropic Skills — https://github.com/anthropics/skills | Pola instruksi/resources untuk workflow agen | Referensi struktur skill produksi milik proyek. Model/provider tetap adapter independen |

OpenFilm adalah baseline lokal yang sudah digunakan proyek, bukan integrasi GitHub baru
yang URL upstream-nya diasumsikan benar. Agen mencatat asal dan lisensi dependency
aktual jika tersedia. Ketidakhadiran tool/cache lokal tidak boleh menggagalkan app baru.

## 2. Infrastruktur pendukung yang diperlukan

Link berikut adalah sumber utama untuk stack rancangan; versi dan paket persis dipilih
fase 0. Semua perlu inventory lisensi, lockfile, dan pemeriksaan kompatibilitas.

| Komponen | GitHub / dokumentasi resmi | Integrasi |
|---|---|---|
| Next.js | https://github.com/vercel/next.js | Web routes dan UI; bukan render serverless panjang |
| React | https://github.com/facebook/react | Komponen UI dan opsional composition Remotion |
| TypeScript | https://github.com/microsoft/TypeScript | Tipe lintas kontrak/API/worker |
| Fastify | https://github.com/fastify/fastify | API, auth hooks, OpenAPI integration |
| Zod | https://github.com/colinhacks/zod | Runtime schema dan generation JSON Schema sesuai versi terpilih |
| Prisma | https://github.com/prisma/prisma | DB schema/migrations; jangan auto migrate production saat request |
| PostgreSQL | https://github.com/postgres/postgres | Metadata/revision/job state |
| BullMQ | https://github.com/taskforcesh/bullmq | Job processors, attempts, progress, cancellation bridge |
| Redis | https://github.com/redis/redis | Broker queue; verifikasi lisensi distribusi yang dipilih |
| AWS SDK for JavaScript v3 | https://github.com/aws/aws-sdk-js-v3 | S3-compatible storage, presigned operations |
| FFmpeg | https://github.com/FFmpeg/FFmpeg | Decode/probe/mix/encode; lisensi bergantung konfigurasi build/codec |
| Playwright | https://github.com/microsoft/playwright | E2E UI, browser automation dan diagnostic; adapter menentukan pemakaiannya |
| WhisperX | https://github.com/m-bain/whisperX | Kandidat alignment opsional; verifikasi dukungan bahasa Indonesia dan model/license, bukan pilihan otomatis |
| faster-whisper | https://github.com/SYSTRAN/faster-whisper | Kandidat ASR lokal; uji akurasi, VRAM/CPU, model dan performance |
| Vitest | https://github.com/vitest-dev/vitest | Unit/contract tests workspace baru |
| pnpm | https://github.com/pnpm/pnpm | Workspace dan dependency pinning |

Auth memakai OIDC via implementasi terawat yang dipilih dan dicatat pada ADR fase 0;
identity provider production milik pengguna dapat disambungkan kemudian. Library dan
provider auth belum ditetapkan, sehingga agen harus memilih satu dan menunjukkan
login/logout/session/ACL nyata sebelum UI dinyatakan deployable.

Storage production cukup menggunakan layanan S3-compatible yang dipilih pengguna;
tidak wajib menambah self-hosted object store baru. Dev memakai filesystem adapter
privat untuk mengurangi kebutuhan layanan. Kontrak upload/download sama di kedua mode.

## 3. Makna biaya dan lisensi

Repo gratis tidak menjamin produksi $0. Pisahkan code license, model/API, GPU/CPU,
storage/egress, aset/font/music rights, dan operasional. Jangan hardcode biaya layanan
ke UI; simpan provider pricing version dan estimasi yang dapat diperbarui.

- Remotion gratis bagi individu/perusahaan hingga tiga orang sesuai eligibility;
  skala di luar itu memerlukan lisensi. Sumber: https://www.remotion.dev/docs/license/pricing
  dan https://www.remotion.dev/docs/license . Cek kondisi produk otomatis sebelum scale.
- HyperFrames memiliki core/Studio gratis dan fitur Studio Pro yang berbeda cakupan.
  Sumber: https://github.com/heygen-com/hyperframes . Integrasi awal jangan mengasumsikan
  fitur Pro tersedia tanpa subscription.
- GSAP memiliki lisensi sendiri dengan pembatasan pada kategori produk tertentu.
  Sumber: https://gsap.com/community/standard-license/ . Scope inspector scene MVP
  harus tetap diperiksa; dokumen ini bukan kesimpulan legal penggunaan tertentu.
- ComfyUI lokal tetap membutuhkan komputasi; model, API partner, dan Comfy Cloud dapat
  berbayar/berlisensi terpisah. Sumber: https://github.com/Comfy-Org/ComfyUI .
- MCP for Blender menawarkan integrasi provider generatif/premium; jangan menganggap
  layanan tersebut termasuk gratis. Sumber: https://github.com/ahujasid/mcp-for-blender .
- Skill adalah instruksi, bukan model gratis. Token, model lokal, serta resource yang
  dirujuk skill tetap mempunyai biaya dan ketentuan tersendiri.

Inventory integrasi harus mencatat upstream URL, commit/tag, license file + hash,
redistribution/attribution, external service terms, optional/required flag, maintainer,
last review, model/license terpisah, dan rollback version. Belum ada hasil inventory
lengkap pada paket rencana ini; melengkapinya adalah acceptance fase 0.

## 4. Spike pemilihan renderer

Jangan migrasi seluruh episode sebelum evaluasi. Gunakan input sintetis sama sepanjang
30–60 detik dengan tiga adegan: penggantian komponen, aliran/cabang sebab-akibat, serta
perbandingan kuantitatif. Uji aspect ratio 16:9 dan satu reflow 9:16; sertakan VO/teks
Indonesia, subtitle, font, SVG, dan satu transisi yang memerlukan seek.

Bandingkan OpenFilm jika tersedia, HyperFrames, serta Remotion. Spike adapter boleh
minimal; satu produksi adapter dipilih setelah bukti terkumpul. Gunakan mesin dan
profile sama; catat browser, CPU/GPU/RAM, software rendering, versi dan concurrency.
Jangan menyamakan lama screen recording dengan kecepatan render deterministik.

| Kriteria | Bukti wajib |
|---|---|
| Benar terhadap timestamp | Expected/actual cue, frame count, duration, audio mapping |
| Seek deterministik | Snapshot urutan seek berbeda pada titik sama |
| Preview/final parity | Objek, aksi dan timing sama; toleransi raster dijelaskan |
| Render lengkap | MP4 dapat decode penuh; bukan sekadar screenshot/halaman GUI |
| Runtime | Wall time, peak RAM, fps efektif, cold/warm, bottleneck |
| Operasi | Cancel menghentikan proses, retry/resume, worker restart, missing assets |
| Integrasi | Input tanpa path episode dan browser config lokal/server |
| Kualitas | Review manusia pada scene; catatan koreksi, bukan skor AI tunggal |
| Lisensi dan biaya | Kondisi penggunaan, compute/API, fitur berbayar yang diperlukan |

Lakukan satu warmup dan dua render terukur per kandidat yang berjalan. Jika kandidat
terblokir instalasi/API, catat `NOT TESTED` beserta penyebabnya; jangan isi skor palsu.
ADR memilih berdasarkan prioritas correctness/operability terlebih dahulu, lalu
maintainability, fidelity, resource dan licensing. HyperFrames adalah hipotesis awal,
bukan hasil benchmark. Tidak ada kewajiban memilihnya jika bukti berbeda.

## 5. Integrasi planner dan provider

Pelajari Lemo untuk grammar director/style dan Rea untuk reference breakdown; jangan
menjalankan upstream agent dengan akses penuh ke secret server. Pipeline milik kita
mengubah narration/brief -> typed scene plan, memvalidasi hasil, membatasi retry dan
mengikat provenance model/prompt version. Adapter AI pertama satu provider yang
tersedia bagi pengguna; credential dikonfigurasi di lingkungan privat, bukan Git.

Tanpa key, fixture mode bisa menunjukkan UI dan pipeline sintetis. Mode tersebut
harus berlabel demo dan tidak mengklaim AI bekerja. Acceptance otomatisasi nyata
memerlukan setidaknya satu pengujian provider riil privat beserta usage metadata
nonrahasia; sandbox yang tidak punya credential melaporkan bagian itu `BLOCKED`.

Tools opsional tidak di-clone massal ke source. Integrasi menggunakan dependency/API
terkontrol, atau snapshot instruksi berlisensi dengan atribusi. Setiap plugin mempunyai
health check, capability report, timeout, budget, fallback, dan feature flag off.
