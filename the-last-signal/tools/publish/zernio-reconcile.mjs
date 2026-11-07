#!/usr/bin/env node
/**
 * zernio-reconcile.mjs — cocokkan antrean repo dengan post yang benar-benar ada
 * di Zernio.
 *
 * Kenapa perlu: `createPost` bisa menjawab "Post scheduled successfully" tanpa
 * mengembalikan id post. Kalau itu dianggap gagal, jadwal yang SUDAH ada di
 * Zernio akan dikirim ulang dan video tayang dua kali pada jam yang sama.
 *
 * Skrip ini membaca daftar post dari API, mencocokkan `metadata.episodeId`,
 * lalu menuliskan id + waktu + status ke berkas antrean dan
 * `knowledge/jadwal-zernio.json`. Tidak pernah mengunggah atau menjadwalkan
 * apa pun — hanya membaca.
 *
 *   node zernio-reconcile.mjs --dry-run
 *   node zernio-reconcile.mjs
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readKey, notice, warn, fail, describeError, loadSdk } from "./lib/zernio.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const SIGNAL_ROOT = resolve(HERE, "../..");
const QUEUE_DIR = join(SIGNAL_ROOT, "publish-queue");
const SUMMARY = join(SIGNAL_ROOT, "knowledge", "jadwal-zernio.json");
const dryRun = process.argv.includes("--dry-run");

const key = readKey();
if (!key) {
  fail("ZERNIO_API_KEY / ZERNIO_KEY tidak ada di environment — rekonsiliasi tidak bisa jalan.");
  process.exit(2);
}

// Bentuk SDK: kelas yang harus diinstansiasi dengan apiKey (sama seperti
// zernio-publish.mjs). Memakai modulnya langsung membuat `posts` undefined.
const Zernio = await loadSdk();
const zernio = new Zernio({ apiKey: key.value });

let listing;
try {
  const response = await zernio.posts.listPosts({ query: { limit: 50 } });
  listing = response?.data ?? response;
} catch (error) {
  fail(`listPosts gagal: ${describeError(error)}`);
  process.exit(3);
}

const posts = listing?.posts ?? listing?.data ?? [];
notice(`Zernio mengembalikan ${posts.length} post terakhir`);

const byEpisode = new Map();
for (const post of posts) {
  const id = post?.metadata?.episodeId;
  if (!/^(LS|LL)-\d{4}$/.test(String(id ?? ""))) continue;
  const platforms = Array.isArray(post.platforms) ? post.platforms : [];
  const youtube = platforms.find((entry) => entry?.platform === "youtube");
  const facebook = platforms.find((entry) => entry?.platform === "facebook");
  byEpisode.set(id, {
    zernioPostId: post.id ?? null,
    status: post.status ?? null,
    scheduledFor: post.scheduledFor ?? null,
    createdAt: post.createdAt ?? null,
    youtube: youtube ? { status: youtube.status ?? null, url: youtube.platformPostUrl ?? youtube.url ?? null } : null,
    facebook: facebook ? { status: facebook.status ?? null, url: facebook.platformPostUrl ?? facebook.url ?? null } : null,
  });
}

const queueFiles = readdirSync(QUEUE_DIR).filter((name) => /-((LS|LL)-\d{4})\.json$/.test(name));
const updated = [];

for (const name of queueFiles) {
  const path = join(QUEUE_DIR, name);
  let entry;
  try {
    entry = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    continue;
  }
  const found = byEpisode.get(String(entry.episodeId ?? ""));
  if (!found) continue;

  const status = String(found.status ?? "").toLowerCase();
  const sudah = ["scheduled", "publishing", "published"].includes(status);
  if (!sudah) continue;

  const sebelum = JSON.stringify({ status: entry.status, id: entry.zernioPostId ?? null });
  entry.status = status === "published" ? "published" : "scheduled";
  entry.zernioPostId = found.zernioPostId;
  entry.zernioStatus = found.status;
  entry.scheduledFor = found.scheduledFor;
  if (found.youtube?.url) entry.youtubeUrl = found.youtube.url;
  if (found.facebook?.url) entry.facebookUrl = found.facebook.url;
  entry.reconciledAt = new Date().toISOString();
  // Simpan perbaikan lain yang tertinggal dari berkas lama.
  if (entry.youtube && entry.youtube.containsSyntheticMedia === true) entry.youtube.containsSyntheticMedia = false;

  const sesudah = JSON.stringify({ status: entry.status, id: entry.zernioPostId ?? null });
  if (!dryRun && sebelum !== sesudah) writeFileSync(path, `${JSON.stringify(entry, null, 2)}\n`);
  notice(`${entry.episodeId}: ${entry.status} · post ${entry.zernioPostId ?? "-"} · ${entry.scheduledFor ?? "-"}`);
  updated.push({
    episodeId: entry.episodeId,
    ok: true,
    zernioPostId: entry.zernioPostId,
    zernioStatus: entry.zernioStatus,
    scheduledFor: entry.scheduledFor,
    youtube: found.youtube,
    facebook: found.facebook,
    updatedAt: new Date().toISOString(),
  });
}

if (!updated.length) {
  warn("Tidak ada post Zernio yang cocok dengan berkas antrean — tidak ada yang ditulis.");
}

if (!dryRun) {
  const previous = existsSync(SUMMARY)
    ? (() => {
        try {
          return JSON.parse(readFileSync(SUMMARY, "utf8"));
        } catch {
          return { items: [] };
        }
      })()
    : { items: [] };
  const merged = new Map((previous.items ?? []).map((item) => [item.episodeId, item]));
  for (const item of updated) merged.set(item.episodeId, { ...(merged.get(item.episodeId) ?? {}), ...item });
  writeFileSync(
    SUMMARY,
    `${JSON.stringify({ timezone: previous.timezone ?? "Asia/Makassar", updatedAt: new Date().toISOString(), items: [...merged.values()] }, null, 2)}\n`,
  );
}

notice(`Rekonsiliasi selesai: ${updated.length} post dicocokkan${dryRun ? " (dry-run, tidak ditulis)" : ""}`);
