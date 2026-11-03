# Arsitektur — peta blueprint ke kode

Dokumen ini menjawab satu pertanyaan: dari blueprint §1–16, bagian mana yang sudah
punya wujud di repo, dan bagian mana yang masih rencana. Tujuannya supaya kita tidak
membangun sepuluh agent sebelum mesin videonya terbukti.

## Alur yang sudah konkret

```
episode.json  →  validasi Zod  →  Remotion HorrorShort  →  MP4 H.264/AAC
     ↑                                     ↑
  (Phase 3:                          (master image, tile grain,
   Story/Director Agent)              audio ambience + SFX)
```

Tidak ada AI di jalur ini. Semua keputusan kreatif sudah "dibekukan" menjadi data.

## Status per bagian blueprint

| Blueprint | Isi | Kondisi sekarang |
| --- | --- | --- |
| §2 Arsitektur agent | 5 agent spesialis + service deterministik | Belum ada agent. Service deterministik (validate, render) sudah ada. |
| §3 Kontrak agent | Idea/Story/Director/Continuity/QC JSON | Kontrak episode (keluaran akhir Director) sudah ketat; kontrak Idea/Story belum. |
| §4 Visual effects | push-in, pan, grain, flicker, vignette, scanline, fog, shake | **Sudah**: camera moves, grain, flicker, vignette, scanline, fog ringan, shake, flashlight, HUD. **Belum**: parallax depth, creature reveal berbasis mask, volumetric lighting. |
| §5 Audio engine | 4 layer audio + alignment TTS | 3 layer sudah jalan (ambience, SFX, impact). Layer narasi menunggu TTS. Alignment belum. |
| §6 Struktur project | monorepo apps+packages | Sebagian: `apps/renderer`, `packages/contracts`. `apps/api`, `apps/worker`, `packages/ai-providers`, dll belum dibuat — sengaja, belum ada isinya. |
| §7 Database & schema | PostgreSQL + Prisma, lifecycle episode | Schema episode ✅. Database ❌ (belum ada job yang perlu di-retry). |
| §8 Render workflow | bundler + selectComposition + renderMedia | ✅ persis alur ini, ditambah laporan `reports/render.json`. |
| §9 Orchestration | BullMQ, retry, idempotency | ❌ Phase 4. |
| §10 Publishing | YouTube Data API, disclosure, analytics | ❌ Phase 5. Field `publishing` di schema sudah menyiapkan metadata + disclosure. |
| §11 Infrastruktur | VPS tunggal, alokasi resource | `docker-compose.yml` menyiapkan Postgres + Redis untuk phase berikutnya (belum dipakai kode). |
| §12 Roadmap | 6 phase | Phase 1 selesai, Phase 2 sebagian besar ikut selesai. |
| §13 MVP criteria | satu input → satu episode layak tonton | Semua kriteria visual terpenuhi; narasi bersuara belum. |
| §14 Dashboard | panel operasional | ❌ setelah MVP. |
| §15 Risiko | continuity, TTS sync, render RAM, upload duplikat | Risiko render RAM sudah dikendalikan (satu render aktif, concurrency 1–2). Sisanya mengikuti phase. |

## Kenapa urutannya begini

Blueprint §16 menyebut urutannya: bangun video engine dulu, AI production di atasnya.
Itu yang diikuti. Konsekuensinya:

- Kalau nanti Story Agent menghasilkan JSON yang buruk, kita tahu persis itu masalah
  cerita, bukan masalah render — karena render engine-nya sudah stabil dan teruji.
- Setiap agent baru cukup menghasilkan `episode.json` yang lolos `pnpm validate`.
  Tidak ada agent yang butuh akses ke Remotion.

## Batas yang harus dijaga saat menambah code berikutnya

1. `packages/contracts` tetap satu-satunya sumber bentuk data. Agent mengimpor tipe
   dari sini; tidak boleh mendefinisikan ulang bentuk episode.
2. Remotion tidak boleh mengimpor SDK AI atau melakukan network call. Composition
   hanya menerima props.
3. Semua timing dalam frame. Konversi dari detik/milidetik terjadi sekali, di batas
   sistem (agent atau script), bukan di dalam komponen.
4. Setiap langkah pipeline harus idempotent: hasil yang sudah ada dan valid dipakai
   ulang, bukan dibuat ulang (blueprint §7).
