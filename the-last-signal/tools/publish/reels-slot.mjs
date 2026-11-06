#!/usr/bin/env node
/**
 * reels-slot.mjs — satu ketukan jadwal Reels, dijalankan dari GitHub Actions.
 *
 * Kenapa tidak lagi mengandalkan proses panjang di sandbox: proses itu tidur
 * saat mesin tidak aktif dan baru bangun ketika ada perintah lain. Jadwal Short
 * jadi mundur diam-diam (LS-0001 sempat terbit 04.30Z padahal jatahnya 01.38Z).
 * Runner Actions tidak tidur.
 *
 * Satu kali jalan melakukan paling banyak SATU unggahan:
 *   1. baca state, katalog, dan status tayang YouTube,
 *   2. kalau jeda 2 jam belum lewat → keluar tanpa melakukan apa pun,
 *   3. tulis berkas permintaan Facebook-only,
 *   4. jalankan zernio-publish.mjs (QC + unggah + publikasi),
 *   5. catat hasilnya ke knowledge/fb-reels-state.json.
 *
 *   node tools/publish/reels-slot.mjs --dry-run
 *   node tools/publish/reels-slot.mjs            # dipakai workflow
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SIGNAL_ROOT = resolve(HERE, "..", "..");
const REPO_ROOT = resolve(SIGNAL_ROOT, "..");
const QUEUE_DIR = join(SIGNAL_ROOT, "publish-queue");
const STATE_PATH = join(SIGNAL_ROOT, "knowledge", "fb-reels-state.json");

const dryRun = process.argv.includes("--dry-run");
const gapMinutes = Number(process.env.REELS_GAP_MINUTES ?? 120);

const log = (message) => console.log(`[${new Date().toISOString().slice(11, 16)}] ${message}`);

function readState() {
  if (!existsSync(STATE_PATH)) return { lastPostAt: null, items: {} };
  const raw = JSON.parse(readFileSync(STATE_PATH, "utf8"));
  return { lastPostAt: raw.lastPostAt ?? null, items: raw.items ?? {} };
}

function saveState(state) {
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

/** Short yang sudah terbit di YouTube (atau sudah punya permintaan tayang). */
function catalog() {
  const items = new Map();
  for (const file of readdirSync(QUEUE_DIR).sort()) {
    if (!/-LS-\d{4}\.json$/.test(file) || file.includes("FBREEL")) continue;
    let entry;
    try {
      entry = JSON.parse(readFileSync(join(QUEUE_DIR, file), "utf8"));
    } catch {
      continue;
    }
    const id = String(entry.episodeId ?? "");
    if (!/^LS-\d{4}$/.test(id)) continue;
    if (!["published", "requested"].includes(entry.status)) continue;
    const media = entry.media ?? `the-last-signal/releases/${id}.mp4`;
    if (!existsSync(resolve(REPO_ROOT, media))) continue;
    const at = entry.publishedAt ?? entry.createdAt ?? entry.scheduledFor ?? "";
    const previous = items.get(id);
    if (!previous || String(at) < String(previous.at)) {
      items.set(id, { episodeId: id, media, youtube: entry.youtube ?? {}, at });
    }
  }
  return [...items.values()].sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

/** Episode yang jadwal tayang YouTube-nya belum lewat tidak boleh masuk FB. */
function heldForFutureSlot(episodeId) {
  const nowIso = new Date().toISOString();
  return readdirSync(QUEUE_DIR)
    .filter((file) => file.includes(episodeId) && file.endsWith(".json"))
    .some((file) => {
      try {
        const entry = JSON.parse(readFileSync(join(QUEUE_DIR, file), "utf8"));
        return entry.status === "held" && entry.scheduledFor && entry.scheduledFor > nowIso;
      } catch {
        return false;
      }
    });
}

function writeRequest(item) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 16);
  const path = join(QUEUE_DIR, `${stamp}-FBREEL-${item.episodeId}.json`);
  const request = {
    episodeId: item.episodeId,
    platforms: ["facebook"],
    status: "requested",
    createdAt: new Date().toISOString(),
    media: item.media,
    youtube: item.youtube,
    facebook: { title: item.youtube.title ?? item.episodeId },
    reason: "jadwal Reels: memindahkan Shorts yang sudah tayang di YouTube ke Reels Facebook",
  };
  writeFileSync(path, `${JSON.stringify(request, null, 2)}\n`);
  return path;
}

const state = readState();
const lastPostAt = state.lastPostAt ? Date.parse(state.lastPostAt) : 0;
const elapsedMinutes = (Date.now() - lastPostAt) / 60000;

if (lastPostAt && elapsedMinutes < gapMinutes) {
  log(`jeda belum terpenuhi: ${Math.round(elapsedMinutes)} dari ${gapMinutes} menit — tidak ada unggahan`);
  process.exit(0);
}

const pending = catalog()
  .filter((item) => state.items[item.episodeId]?.status !== "posted")
  .filter((item) => !heldForFutureSlot(item.episodeId));

if (!pending.length) {
  log("tidak ada Short yang menunggu — selesai");
  process.exit(0);
}

const item = pending[0];
log(`giliran ${item.episodeId} (${item.media})`);

if (dryRun) {
  log("dry-run: permintaan tidak ditulis, publikasi tidak dijalankan");
  process.exit(0);
}

const requestPath = writeRequest(item);
log(`permintaan: ${requestPath.split("/").pop()}`);

let code = 0;
try {
  execFileSync(process.execPath, [join(HERE, "zernio-publish.mjs"), "--request", requestPath], {
    cwd: HERE,
    stdio: "inherit",
  });
} catch (error) {
  code = error.status ?? 1;
  log(`zernio-publish keluar dengan kode ${code} — hasilnya dibaca dari laporan, bukan dari kode`);
}

const reportPath = join(SIGNAL_ROOT, "report", `publish-${item.episodeId}.json`);
const report = existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : null;
const facebook = report?.facebook ?? {};
const posted = Boolean(facebook.ok || facebook.accepted);

state.items[item.episodeId] = {
  status: posted ? "posted" : "error",
  postedAt: posted ? new Date().toISOString() : null,
  url: facebook.url ?? null,
  postId: facebook.postId ?? null,
  request: requestPath.replace(`${REPO_ROOT}/`, ""),
  platformStatus: facebook.status ?? null,
  note: posted ? "dijadwalkan oleh workflow, terverifikasi dari laporan publikasi" : `kode keluar ${code}`,
};
if (posted) state.lastPostAt = state.items[item.episodeId].postedAt;
saveState(state);

log(posted ? `${item.episodeId}: Reels terbit ${facebook.url ?? ""}` : `${item.episodeId}: gagal — dicoba lagi di ketukan berikutnya`);
process.exit(posted ? 0 : 1);
