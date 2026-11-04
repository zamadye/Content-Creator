#!/usr/bin/env node
/**
 * queue-request.mjs — tandai satu episode siap diunggah, setelah memastikan
 * jeda satu jam benar-benar terpenuhi dan hanya satu berkas antrean yang berubah.
 *
 * Dua kegagalan nyata yang dicegah skrip ini:
 *   1. Push yang menyentuh dua berkas antrean ditolak workflow (sengaja), jadi
 *      mengubah judul episode lain di push yang sama membatalkan unggahan.
 *   2. Jeda antar-unggahan mudah salah hitung kalau mengandalkan ingatan.
 *
 *   node scripts/queue-request.mjs --episode LS-0006
 *   node scripts/queue-request.mjs --episode LS-0006 --dry-run
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const QUEUE = join(ROOT, "publish-queue");
const MIN_GAP_MINUTES = 60;

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode");
const dryRun = process.argv.includes("--dry-run");

if (!episodeId) {
  console.error("Pakai: node scripts/queue-request.mjs --episode LS-0006 [--dry-run]");
  process.exit(1);
}

const files = readdirSync(QUEUE).filter((file) => file.endsWith(".json"));
const entries = files.map((file) => ({ file, data: JSON.parse(readFileSync(join(QUEUE, file), "utf8")) }));

const target = entries.find((entry) => entry.data.episodeId === episodeId);
if (!target) {
  console.error(`Tidak ada berkas antrean untuk ${episodeId}.`);
  process.exit(1);
}

if (target.data.status === "published" || target.data.status === "requested") {
  console.error(`${episodeId} sudah berstatus "${target.data.status}" — tidak ada yang perlu ditandai.`);
  process.exit(1);
}

// --- Jeda sejak unggahan sukses terakhir -------------------------------------
const published = entries
  .filter((entry) => entry.data.status === "published" && entry.data.publishedAt)
  .sort((a, b) => new Date(b.data.publishedAt) - new Date(a.data.publishedAt));

if (published.length > 0) {
  const last = published[0];
  const gapMinutes = (Date.now() - new Date(last.data.publishedAt).getTime()) / 60000;
  const readyAt = new Date(new Date(last.data.publishedAt).getTime() + MIN_GAP_MINUTES * 60000);
  console.log(`Unggahan terakhir: ${last.data.episodeId} ${last.data.publishedAt} (${Math.floor(gapMinutes)} menit lalu)`);
  if (gapMinutes < MIN_GAP_MINUTES) {
    console.error(
      `Jeda belum cukup: ${Math.floor(gapMinutes)} menit, minimum ${MIN_GAP_MINUTES}. Siap setelah ${readyAt.toISOString()}.`,
    );
    process.exit(1);
  }
}

// --- Hanya satu berkas antrean yang boleh berubah ----------------------------
try {
  const dirty = execFileSync("git", ["status", "--porcelain", "--", "the-last-signal/publish-queue"], {
    cwd: resolve(ROOT, "..", ".."),
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean)
    .map((line) => line.slice(3).trim());

  const others = dirty.filter((path) => !path.endsWith(target.file));
  if (others.length > 0) {
    console.error("Berkas antrean lain sedang berubah — workflow akan menolak push ini:");
    for (const path of others) console.error(`  - ${path}`);
    console.error("Commit atau kembalikan dulu berkas itu, lalu jalankan lagi.");
    process.exit(1);
  }
} catch (error) {
  console.warn(`Pemeriksaan git dilewati: ${error.message}`);
}

// --- Tandai ----------------------------------------------------------------
target.data.status = "requested";
target.data.requestedAt = new Date().toISOString().replace(/\.\d+Z$/, "Z");
if (!dryRun) writeFileSync(join(QUEUE, target.file), JSON.stringify(target.data, null, 2) + "\n");

console.log(`${dryRun ? "[dry-run] " : ""}${episodeId} → requested (${target.file})`);
console.log(`Judul: ${target.data.youtube?.title ?? "(tidak ada)"}`);
if (dryRun) console.log("Tidak ada berkas yang benar-benar diubah.");
