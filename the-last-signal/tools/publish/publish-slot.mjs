#!/usr/bin/env node
/**
 * publish-slot.mjs — satu slot tayang per hari, di dalam jendela 12.00–18.00.
 *
 * Kenapa ada: berkas di `publish-queue/` yang berstatus `requested` langsung
 * diunggah begitu di-push, kapan pun itu. Akibatnya dua hal pernah terjadi:
 * unggahan keluar di luar jendela tayang, dan tiga video bisa tayang berdekatan
 * hanya karena tiga berkas ikut satu push.
 *
 * Alur sekarang:
 *   1. Naskah disiapkan dengan status `held` — menyimpan berkas ini TIDAK
 *      mengunggah apa pun (`zernio-publish.mjs` melewati status selain requested).
 *   2. Sekali sehari, di dalam jendela, skrip ini mengambil SATU berkas `held`
 *      paling lama, menjadikannya `requested`, lalu menjalankan zernio-publish.
 *   3. Kalau berhasil, statusnya ditulis `published` + `publishedAt`. Kalau
 *      gagal, kembali ke `held` supaya dicoba lagi di slot berikutnya — bukan
 *      hilang diam-diam.
 *
 * Status akhir hanya di-push sekali per slot, dan karena berkas itu sudah
 * `published`, push tersebut tidak memicu unggahan kedua.
 *
 *   node tools/publish/publish-slot.mjs --dry-run
 *   node tools/publish/publish-slot.mjs             # dipakai workflow
 *   node tools/publish/publish-slot.mjs --force     # abaikan jam (uji manual)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SIGNAL_ROOT = resolve(HERE, "..", "..");
const QUEUE_DIR = join(SIGNAL_ROOT, "publish-queue");
const REPORT_DIR = join(SIGNAL_ROOT, "report");

const dryRun = process.argv.includes("--dry-run");
const force = process.argv.includes("--force");

/** Jendela tayang, waktu lokal kanal (WITA, UTC+8). */
const TZ = "Asia/Kuching";
const WINDOW_START = 12;
const WINDOW_END = 18; // eksklusif: sampai 17.59

const log = (message) => console.log(`[slot] ${message}`);

function localHour() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date());
  return Number(parts);
}

const hour = localHour();
if (!force && (hour < WINDOW_START || hour >= WINDOW_END)) {
  log(`jam lokal ${hour}:00 di luar jendela ${WINDOW_START}.00–${WINDOW_END}.00 — tidak ada yang ditayangkan.`);
  process.exit(0);
}

const files = readdirSync(QUEUE_DIR)
  .filter((name) => /-LS-\d{4}\.json$/.test(name))
  .sort();

const readEntry = (name) => {
  try {
    return JSON.parse(readFileSync(join(QUEUE_DIR, name), "utf8"));
  } catch {
    return null;
  }
};

// Jangan pernah menayangkan dua video berdekatan: kalau masih ada permintaan
// berstatus `requested` yang belum selesai, slot ini berhenti.
const pending = files.filter((name) => readEntry(name)?.status === "requested");
if (pending.length) {
  log(`masih ada permintaan belum selesai (${pending.join(", ")}) — slot dilewati.`);
  process.exit(0);
}

const held = files
  .map((name) => ({ name, entry: readEntry(name) }))
  .filter((item) => item.entry?.status === "held")
  // Paling lama dulu: nama berkas memakai cap waktu ISO, jadi urutan abjad = urutan waktu.
  .sort((a, b) => a.name.localeCompare(b.name));

if (!held.length) {
  log("tidak ada berkas berstatus held — tidak ada yang ditayangkan.");
  process.exit(0);
}

const chosen = held[0];
const path = join(QUEUE_DIR, chosen.name);
log(`dipilih ${chosen.entry.episodeId} (${chosen.name})`);

if (dryRun) {
  log(`dry-run: ${chosen.entry.episodeId} akan dilepas ke requested dan diunggah.`);
  process.exit(0);
}

// 1. Lepas statusnya, lalu jalankan gerbang QC + unggah yang sudah ada.
chosen.entry.status = "requested";
chosen.entry.releasedAt = new Date().toISOString();
writeFileSync(path, `${JSON.stringify(chosen.entry, null, 2)}\n`);

let exitCode = 0;
try {
  execFileSync(process.execPath, [join(HERE, "zernio-publish.mjs"), "--request", path], { stdio: "inherit" });
} catch (error) {
  exitCode = typeof error?.status === "number" ? error.status : 1;
}
log(`zernio-publish keluar dengan kode ${exitCode}`);

// 2. Hasil sebenarnya dibaca dari laporan, bukan dari kode keluar: unggahan
//    bisa berhasil di YouTube tetapi gagal di Facebook, dan sebaliknya.
const reportPath = join(REPORT_DIR, `publish-${chosen.entry.episodeId}.json`);
let report = null;
if (existsSync(reportPath)) {
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8"));
  } catch {
    report = null;
  }
}

const youtubeOk = Boolean(report?.youtube?.url);
const facebookOk = Boolean(report?.facebook?.url);
const ok = Boolean(report?.ok) || youtubeOk;

if (ok) {
  chosen.entry.status = "published";
  chosen.entry.publishedAt = new Date().toISOString();
  chosen.entry.youtubeUrl = report?.youtube?.url ?? null;
  chosen.entry.facebookUrl = report?.facebook?.url ?? null;
  chosen.entry.catatan = [
    `slot otomatis ${TZ} jam ${hour}.xx`,
    youtubeOk ? "YouTube ok" : null,
    facebookOk ? "Facebook ok" : "Facebook belum terbit",
  ]
    .filter(Boolean)
    .join(" · ");
  log(`terbit: ${chosen.entry.episodeId} → ${report?.youtube?.url ?? "(tanpa URL YouTube)"}`);
} else {
  // Kembali ke held supaya slot berikutnya mencoba lagi. Jangan pernah
  // meninggalkan berkas berstatus requested yang gagal — itu akan memblokir
  // slot selamanya lewat pemeriksaan `pending` di atas.
  chosen.entry.status = "held";
  chosen.entry.lastAttemptAt = new Date().toISOString();
  chosen.entry.lastAttemptExit = exitCode;
  log(`gagal: ${chosen.entry.episodeId} dikembalikan ke held`);
}

writeFileSync(path, `${JSON.stringify(chosen.entry, null, 2)}\n`);
process.exit(ok ? 0 : 1);
