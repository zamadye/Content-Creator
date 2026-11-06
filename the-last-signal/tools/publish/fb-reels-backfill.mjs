#!/usr/bin/env node
/**
 * fb-reels-backfill.mjs — pindahkan katalog Shorts yang sudah terbit di YouTube
 * ke Reels Facebook, satu per satu, dengan jeda tetap antar-unggahan.
 *
 * Kenapa berupa penggerak, bukan satu perintah: Zernio hanya bisa dihubungi
 * dari runner GitHub, dan setiap unggahan = satu push berkas antrean. Jadi
 * skrip ini yang mengatur jam: menulis permintaan, push, menunggu workflow,
 * membaca hasil, lalu tidur sampai jeda berikutnya habis.
 *
 * Aturan main:
 *   - Permintaan ditulis dengan `platforms: ["facebook"]` — YouTube TIDAK
 *     diterbitkan ulang, jadi tidak ada video ganda di kanal.
 *   - Media yang belum ada di releases/ dirender dulu (render + encode), lalu
 *     ikut di-commit, karena runner mengunggah dari hasil checkout.
 *   - Status disimpan di knowledge/fb-reels-state.json, bukan di folder antrean,
 *     supaya push status tidak pernah terlihat sebagai permintaan baru.
 *   - Episode yang belum terbit di YouTube tidak boleh ikut (LS-0010 dijadwalkan
 *     6 Nov 13.00 UTC) — kalau tidak, Reels Facebook mendahului kanal utama.
 *
 *   node tools/publish/fb-reels-backfill.mjs --gap-minutes 120
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SIGNAL_ROOT = resolve(HERE, "../..");
const REPO_ROOT = resolve(SIGNAL_ROOT, "..");
const QUEUE_DIR = join(SIGNAL_ROOT, "publish-queue");
const STATE_FILE = join(SIGNAL_ROOT, "knowledge", "fb-reels-state.json");
const BRANCH = "arena/479de245-content-creator";

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const gapMinutes = Number(arg("gap-minutes", "120"));
const only = arg("only"); // uji: satu episode saja
const log = (message) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${message}`);

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * Kunci berkas. Dua proses backfill pernah berjalan bersamaan (sisa proses lama
 * yang belum benar-benar mati) dan masing-masing membuat permintaan untuk
 * episode yang sama — hasilnya satu Reel terbit dua kali.
 */
const LOCK_PATH = join(SIGNAL_ROOT, "knowledge", ".fb-reels.lock");
function takeLock() {
  if (existsSync(LOCK_PATH)) {
    const pid = Number(readFileSync(LOCK_PATH, "utf8").trim());
    let alive = false;
    try {
      alive = pid > 0 && process.kill(pid, 0);
    } catch {
      alive = false;
    }
    if (alive) {
      log(`proses lain masih berjalan (pid ${pid}) — keluar supaya tidak ada dua penjadwal`);
      process.exit(0);
    }
    log(`kunci basi dari pid ${pid} — diambil alih`);
  }
  writeFileSync(LOCK_PATH, String(process.pid));
  const release = () => {
    try {
      if (readFileSync(LOCK_PATH, "utf8").trim() === String(process.pid)) unlinkSync(LOCK_PATH);
    } catch {
      /* sudah hilang */
    }
  };
  process.on("exit", release);
  process.on("SIGTERM", () => process.exit(0));
  process.on("SIGINT", () => process.exit(0));
}
// Penanda versi: setiap perubahan di berkas ini memicu pemeriksaan Zernio,
// jadi commit kecil di sini juga berfungsi sebagai pemicu saat verifikasi manual.

function sh(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: REPO_ROOT, encoding: "utf8", ...options });
  return { code: result.status, out: `${result.stdout ?? ""}`, err: `${result.stderr ?? ""}` };
}

// ---------------------------------------------------------------------------
// Katalog: semua Shorts terbit, urut tanggal tayang.
// ---------------------------------------------------------------------------
function publishedShorts() {
  return readdirSync(QUEUE_DIR)
    // Berkas permintaan Reels yang dibuat skrip ini juga cocok dengan pola
    // "-LS-####.json"; kalau tidak disaring, setelah percobaan pertama katalog
    // berisi episode yang sama dua kali dan satu Shorts terunggah dua kali.
    .filter((file) => /^.*-LS-\d{4}\.json$/.test(file) && !file.includes("FBREEL"))
    .map((file) => {
      try {
        return { file, entry: JSON.parse(readFileSync(join(QUEUE_DIR, file), "utf8")) };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .filter(({ entry }) => /^LS-\d{4}$/.test(String(entry.episodeId ?? "")))
    .filter(({ entry }) => ["published", "requested"].includes(entry.status))
    .map(({ entry }) => ({
      episodeId: entry.episodeId,
      media: entry.media ?? `the-last-signal/releases/${entry.episodeId}.mp4`,
      youtube: entry.youtube ?? {},
      scheduledFor: entry.scheduledFor ?? entry.createdAt ?? "",
    }))
    // Yang berkasnya sudah ada didahulukan: unggahan bisa mulai jalan sementara
    // episode lain yang medianya sudah dibuang masih dirender ulang.
    .filter((item, index, list) => list.findIndex((other) => other.episodeId === item.episodeId) === index)
    .sort((a, b) => {
      const haveA = existsSync(resolve(REPO_ROOT, a.media)) ? 0 : 1;
      const haveB = existsSync(resolve(REPO_ROOT, b.media)) ? 0 : 1;
      if (haveA !== haveB) return haveA - haveB;
      return String(a.scheduledFor).localeCompare(String(b.scheduledFor));
    });
}

// Episode yang belum tayang di YouTube tidak boleh masuk Reels lebih dulu.
function notYetOnYoutube(episodeId) {
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

function loadState() {
  if (existsSync(STATE_FILE)) {
    try {
      return JSON.parse(readFileSync(STATE_FILE, "utf8"));
    } catch {
      /* state rusak: mulai dari kosong, riwayat unggahan tetap ada di laporan */
    }
  }
  return { lastPostAt: null, items: {} };
}

function saveState(state) {
  writeFileSync(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`);
  sh("git", ["add", STATE_FILE]);
  sh("git", ["commit", "-q", "-m", "status(fb-reels): perbarui riwayat unggahan Reels"]);
  if (sh("git", ["push", "-q", "origin", BRANCH]).code !== 0) {
    sh("git", ["pull", "--rebase", "-q", "origin", BRANCH]);
    sh("git", ["push", "-q", "origin", BRANCH]);
  }
}

async function ensureMedia(item) {
  const absolute = resolve(REPO_ROOT, item.media);
  if (existsSync(absolute)) return true;

  log(`media ${item.episodeId} belum ada — render ulang dulu`);
  const render = sh("npx", ["tsx", "scripts/render.ts", "--episode", item.episodeId, "--crf", "20", "--concurrency", "2"], {
    cwd: SIGNAL_ROOT,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: "/tmp/chromelibs",
      REMOTION_BROWSER_EXECUTABLE: "/tmp/chromium",
    },
  });
  if (render.code !== 0) {
    log(`render ${item.episodeId} gagal: ${render.err.slice(-300)}`);
    return false;
  }
  const encode = sh("npx", // Short lama hanya diunggah ulang ke Facebook, bukan dinaikkan ke YouTube:
// 1,2M/crf 30 memberi ±9 MB, cukup untuk Reel dan tidak membengkakkan repo.
    ["tsx", "scripts/encode-delivery.ts", "--episode", item.episodeId, "--maxrate", "1.2M", "--crf", "30", "--tp", "-3"], {
    cwd: SIGNAL_ROOT,
  });
  if (encode.code !== 0) {
    log(`encode ${item.episodeId} gagal: ${encode.err.slice(-300)}`);
    return false;
  }
  const built = join(SIGNAL_ROOT, "renders", `${item.episodeId}-delivery.mp4`);
  if (!existsSync(built)) return false;
  execFileSync("cp", [built, absolute]);
  sh("git", ["add", item.media]);
  sh("git", ["commit", "-q", "-m", `aset(${item.episodeId}): release untuk Reels Facebook`]);
  log(`release ${item.episodeId} dibuat`);
  return true;
}

function writeRequest(item) {
  // Berkas permintaan bersifat sekali pakai: setiap perubahan pada berkas
  // berstatus "requested" memicu satu jalan workflow = satu unggahan tambahan.
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
    reason: "memindahkan katalog Shorts yang sudah terbit di YouTube ke Reels Facebook",
  };
  writeFileSync(path, `${JSON.stringify(request, null, 2)}\n`);
  return { path, relative: path.replace(`${REPO_ROOT}/`, "") };
}

function repoSlug() {
  const url = sh("git", ["remote", "get-url", "origin"]).out.trim();
  const match = url.match(/github\.com[:/]([^/]+\/[^/.]+)(?:\.git)?$/);
  return match ? match[1] : "zamadye/Content-Creator";
}

/**
 * Kebenaran soal "terbit atau tidak" ada di anotasi check-run, bukan di kode
 * keluar. Percobaan pertama LS-0008: proses keluar 6 (dianggap gagal) padahal
 * Reel-nya benar-benar terbit — pembacaan respons createPost yang salah.
 * Jadi hasil dibaca dari JSON PUBLISH-RESULT di anotasi.
 */
function publishedFromAnnotations(sha) {
  const slug = repoSlug();
  const checks = sh("gh", ["api", `repos/${slug}/commits/${sha}/check-runs`, "--jq",
    '.check_runs[] | select(.name|test("upload")) | .id']);
  if (checks.code !== 0) return null;
  const id = checks.out.trim().split("\n")[0];
  if (!id) return null;
  const annotations = sh("gh", ["api", `repos/${slug}/check-runs/${id}/annotations`, "--jq", '.[] | .message']);
  if (annotations.code !== 0) return null;
  for (const line of annotations.out.split("\n")) {
    const start = line.indexOf('{"episodeId"');
    if (start === -1) continue;
    try {
      return JSON.parse(line.slice(start));
    } catch {
      /* bukan JSON utuh, lanjut */
    }
  }
  return null;
}

async function waitForRun(headSha, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = sh("gh", [
      "run", "list", "--workflow=zernio-publish.yml", "-L", "5",
      "--json", "databaseId,headSha,status,conclusion",
    ]);
    if (result.code === 0) {
      try {
        const runs = JSON.parse(result.out || "[]");
        const run = runs.find((entry) => String(entry.headSha ?? "").startsWith(headSha.slice(0, 12)));
        if (run && run.status === "completed") {
          return { ...run, published: publishedFromAnnotations(run.headSha) };
        }
      } catch {
        /* keluaran belum bisa diparse, coba lagi */
      }
    }
    await sleep(30000);
  }
  return null;
}

function currentHead() {
  return sh("git", ["rev-parse", "HEAD"]).out.trim();
}

async function main() {
  const catalog = publishedShorts().filter((item) => !notYetOnYoutube(item.episodeId));
  const state = loadState();
  const queue = only ? catalog.filter((item) => item.episodeId === only) : catalog;

  takeLock();

  // Jangan pernah membuat permintaan baru selama masih ada permintaan yang
  // belum selesai: dua berkas "requested" dalam satu push ditolak workflow, dan
  // kalau lolos, dua Short terbit berdekatan tanpa jeda.
  const outstanding = readdirSync(QUEUE_DIR)
    .filter((file) => file.includes("FBREEL") && file.endsWith(".json"))
    .filter((file) => {
      try {
        return JSON.parse(readFileSync(join(QUEUE_DIR, file), "utf8")).status === "requested";
      } catch {
        return false;
      }
    });
  if (outstanding.length) {
    log(`masih ada permintaan terbuka: ${outstanding.join(", ")} — keluar dulu`);
    process.exit(0);
  }

  log(`${queue.length} Shorts dalam katalog: ${queue.map((item) => item.episodeId).join(", ")}`);

  for (const item of queue) {
    const record = state.items[item.episodeId] ?? { status: "pending" };
    if (record.status === "posted") {
      log(`${item.episodeId} sudah pernah diunggah ke Reels (${record.postedAt ?? "-"}) — dilewati`);
      continue;
    }

    // Jeda: dihitung dari unggahan Reels TERAKHIR yang berhasil.
    if (state.lastPostAt) {
      const due = Date.parse(state.lastPostAt) + gapMinutes * 60 * 1000;
      const waitMs = due - Date.now();
      if (waitMs > 0) {
        log(`menunggu ${Math.round(waitMs / 60000)} menit sampai jeda ${gapMinutes} menit terpenuhi`);
        // Tidur per menit, bukan sekali tidur panjang: di lingkungan ini proses
        // bisa tertidur lebih lama dari timer-nya saat mesin tidak aktif, dan
        // satu timer raksasa berarti tidak ada jejak sampai alarm itu berbunyi.
        const deadline = Date.now() + waitMs;
        let lastNote = 0;
        while (Date.now() < deadline) {
          await sleep(60000);
          const sisa = Math.round((deadline - Date.now()) / 60000);
          if (sisa > 0 && Date.now() - lastNote > 15 * 60000) {
            lastNote = Date.now();
            log(`masih menunggu ${sisa} menit`);
          }
        }
      }
    }

    if (!(await ensureMedia(item))) {
      state.items[item.episodeId] = { status: "error", note: "media tidak bisa disiapkan", at: new Date().toISOString() };
      saveState(state);
      continue;
    }

    const { path, relative } = writeRequest(item);
    sh("git", ["add", relative]);
    const commit = sh("git", ["commit", "-q", "-m", `terbit-reel(${item.episodeId}): Facebook Reels, jadwal backfill`]);
    if (commit.code !== 0) {
      log(`tidak ada perubahan untuk ${item.episodeId} — dilewati`);
      continue;
    }
    const head = currentHead();
    if (sh("git", ["push", "-q", "origin", BRANCH]).code !== 0) {
      sh("git", ["pull", "--rebase", "-q", "origin", BRANCH]);
      if (sh("git", ["push", "-q", "origin", BRANCH]).code !== 0) {
        log(`push gagal untuk ${item.episodeId}`);
        state.items[item.episodeId] = { status: "error", note: "push gagal", at: new Date().toISOString() };
        saveState(state);
        continue;
      }
    }
    log(`${item.episodeId}: permintaan ${path.split("/").pop()} di-push, menunggu workflow`);

    const run = await waitForRun(head, 25 * 60 * 1000);
    const published = run?.published ?? null;
    const ok = Boolean(published?.facebook?.ok) || run?.conclusion === "success";
    state.items[item.episodeId] = {
      status: ok ? "posted" : "error",
      runId: run?.databaseId ?? null,
      conclusion: run?.conclusion ?? "timeout",
      request: relative,
      postedAt: ok ? new Date().toISOString() : null,
      url: published?.facebook?.url ?? null,
      conclusion_was: run?.conclusion ?? null,
      at: new Date().toISOString(),
    };
    if (ok) state.lastPostAt = state.items[item.episodeId].postedAt;
    saveState(state);
    log(`${item.episodeId}: ${ok ? "Reels terbit" : `gagal (${run?.conclusion ?? "timeout"})`}`);
  }

  log("selesai — semua Shorts dalam katalog sudah diproses");
}

main().catch((error) => {
  log(`berhenti karena error: ${error?.stack ?? error}`);
  process.exit(1);
});
