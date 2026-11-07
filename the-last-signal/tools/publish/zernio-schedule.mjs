#!/usr/bin/env node
/**
 * zernio-schedule.mjs — kirim JADWAL tayang ke Zernio, bukan menahannya di repo.
 *
 * Kenapa berubah (arahan pemilik kanal, 8 Nov 2026):
 * jadwal yang disimpan sebagai berkas `held` di repo hanya bisa ditayangkan oleh
 * cron GitHub — dan cron hanya berjalan dari branch default. Itu membuat repo
 * jadi penjadwal, padahal Zernio sudah punya penjadwal: video diunggah sekarang,
 * Zernio menyimpannya di cloud, lalu menayangkannya pada waktu yang diminta.
 * Setelah jadwal terkirim, berkas di repo boleh hilang tanpa efek apa pun.
 *
 * Satu kali jalan bisa mengirim puluhan jadwal.
 *
 *   node zernio-schedule.mjs --plan ../../schedule.json --dry-run
 *   node zernio-schedule.mjs --plan ../../schedule.json
 *
 * Bentuk berkas rencana:
 * {
 *   "timezone": "Asia/Makassar",
 *   "items": [
 *     { "request": "the-last-signal/publish-queue/2026-11-08T12-05-LS-0012.json",
 *       "scheduledFor": "2026-11-08T04:05:00Z" }
 *   ]
 * }
 *
 * Waktu boleh ditulis sebagai ISO dengan zona (04:05Z) atau ISO lokal tanpa
 * zona (12:05:00) — yang tanpa zona dibaca memakai `timezone` di atas.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SIGNAL_ROOT = resolve(HERE, "../..");
const REPO_ROOT = resolve(SIGNAL_ROOT, "..");
const REPORT_DIR = join(SIGNAL_ROOT, "report");

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
};

/**
 * Berkas rencana boleh ditulis relatif terhadap direktori kerja (cara workflow
 * memanggilnya: `--plan ../../schedule.json`) atau terhadap akar repo. Dua
 * kandidat dicoba berurutan — dulu hanya akar repo, sehingga panggilan dari
 * tools/publish mencari berkas di tempat yang salah.
 */
function resolvePlanPath(value) {
  if (value.startsWith("/")) return value;
  const fromCwd = resolve(process.cwd(), value);
  if (existsSync(fromCwd)) return fromCwd;
  return resolve(REPO_ROOT, value);
}
const planPath = resolvePlanPath(arg("plan", "the-last-signal/schedule.json"));
const dryRun = process.argv.includes("--dry-run");

const log = (message) => console.log(`[jadwal] ${message}`);
const notice = (message) => console.log(`::notice::${String(message).replace(/\r?\n/g, " | ")}`);
const warn = (message) => console.log(`::warning::${String(message).replace(/\r?\n/g, " | ")}`);

if (!existsSync(planPath)) {
  console.error(`::error::Rencana jadwal tidak ada: ${planPath}`);
  process.exit(2);
}

const plan = JSON.parse(readFileSync(planPath, "utf8"));
const timezone = plan.timezone ?? "Asia/Makassar";
const items = Array.isArray(plan.items) ? plan.items : [];
if (!items.length) {
  notice("Rencana tidak berisi item — tidak ada yang dijadwalkan.");
  process.exit(0);
}

/** ISO lokal (tanpa Z/offset) dibaca memakai zona kanal. */
function toInstant(value, tz) {
  const raw = String(value);
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(raw)) return new Date(raw).toISOString();
  // "2026-11-08T12:05:00" di WITA = 04:05Z. Offset dihitung lewat Intl, bukan
  // dipaku +8, supaya tetap benar kalau zona kanal berubah.
  const naive = new Date(`${raw}Z`); // anggap UTC dulu
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(naive);
  const get = (type) => parts.find((part) => part.type === type)?.value ?? "00";
  const asLocal = Date.UTC(
    Number(get("year")),
    Number(get("month")) - 1,
    Number(get("day")),
    Number(get("hour")),
    Number(get("minute")),
    Number(get("second")),
  );
  const offsetMs = asLocal - naive.getTime();
  return new Date(naive.getTime() - offsetMs).toISOString();
}

const results = [];
let failed = 0;

for (const item of items) {
  const requestPath = resolve(REPO_ROOT, item.request);
  const episodeId = item.request.match(/((?:LS|LL)-\d{4})\.json$/)?.[1] ?? item.request;
  if (!existsSync(requestPath)) {
    warn(`${episodeId}: berkas permintaan tidak ada — dilewati (${item.request})`);
    results.push({ episodeId, ok: false, error: "request tidak ada" });
    failed += 1;
    continue;
  }

  // Jangan menjadwalkan ulang. Berkas berstatus `scheduled` sudah punya waktu
  // di Zernio; mengirimnya lagi berarti dua post untuk satu video.
  try {
    const existing = JSON.parse(readFileSync(requestPath, "utf8"));
    if (["scheduled", "published"].includes(String(existing.status))) {
      log(`${episodeId}: sudah ${existing.status} (${existing.scheduledFor ?? "-"}) — dilewati`);
      results.push({ episodeId, ok: true, skipped: true, scheduledFor: existing.scheduledFor ?? null });
      continue;
    }
  } catch {
    /* berkas rusak: biarkan zernio-publish yang melaporkan */
  }

  let scheduledFor;
  try {
    scheduledFor = toInstant(item.scheduledFor, timezone);
  } catch {
    warn(`${episodeId}: scheduledFor tidak sah (${item.scheduledFor})`);
    results.push({ episodeId, ok: false, error: "scheduledFor tidak sah" });
    failed += 1;
    continue;
  }

  if (Date.parse(scheduledFor) < Date.now() - 60_000) {
    warn(`${episodeId}: jadwal sudah lewat (${scheduledFor}) — dilewati`);
    results.push({ episodeId, ok: false, error: "jadwal lewat" });
    failed += 1;
    continue;
  }

  if (dryRun) {
    log(`${episodeId}: akan dijadwalkan ${scheduledFor} (${timezone}) — dry-run, tidak ada API call`);
    results.push({ episodeId, ok: true, scheduledFor, dryRun: true });
    continue;
  }

  log(`${episodeId}: unggah + jadwalkan ${scheduledFor}`);

  // Gerbang QC, presign, upload, dan createPost semuanya tetap di
  // zernio-publish.mjs — berkas ini hanya menyuplai waktu.
  let exitCode = 0;
  try {
    execFileSync(process.execPath, [join(HERE, "zernio-publish.mjs"), "--request", requestPath, "--schedule", scheduledFor, "--timezone", timezone], {
      cwd: HERE,
      stdio: "inherit",
    });
  } catch (error) {
    exitCode = typeof error?.status === "number" ? error.status : 1;
  }

  const reportPath = join(REPORT_DIR, `publish-${episodeId}.json`);
  let report = null;
  if (existsSync(reportPath)) {
    try {
      report = JSON.parse(readFileSync(reportPath, "utf8"));
    } catch {
      report = null;
    }
  }

  const confirmed = report?.schedule?.confirmedFor ?? report?.schedule?.requestedFor ?? null;
  const ok = Boolean(report?.ok);

  if (ok) {
    // Berkas antrean ditandai `scheduled` supaya tidak pernah ikut jalur
    // tayang-sekarang dan tidak dijadwalkan dua kali.
    try {
      const entry = JSON.parse(readFileSync(requestPath, "utf8"));
      entry.status = "scheduled";
      entry.scheduledFor = confirmed ?? scheduledFor;
      entry.scheduledTimezone = timezone;
      entry.zernioPostId = report?.post?.id ?? null;
      entry.scheduledAt = new Date().toISOString();
      writeFileSync(requestPath, `${JSON.stringify(entry, null, 2)}\n`);
    } catch (error) {
      warn(`${episodeId}: jadwal terkirim tetapi berkas antrean gagal ditandai (${error.message})`);
    }
    notice(`${episodeId}: terjadwal ${confirmed ?? scheduledFor} · post ${report?.post?.id}`);
    results.push({ episodeId, ok: true, scheduledFor: confirmed ?? scheduledFor, postId: report?.post?.id ?? null });
  } else {
    warn(`${episodeId}: GAGAL dijadwalkan (exit ${exitCode}) — jangan dianggap tayang`);
    results.push({ episodeId, ok: false, exitCode, error: report?.post?.error ?? "tidak dikonfirmasi" });
    failed += 1;
  }
}

const summaryPath = join(SIGNAL_ROOT, "knowledge", "jadwal-zernio.json");
const previous = existsSync(summaryPath)
  ? (() => {
      try {
        return JSON.parse(readFileSync(summaryPath, "utf8"));
      } catch {
        return { items: [] };
      }
    })()
  : { items: [] };
const merged = new Map((previous.items ?? []).map((entry) => [entry.episodeId, entry]));
for (const entry of results) {
  merged.set(entry.episodeId, { ...entry, updatedAt: new Date().toISOString() });
}
writeFileSync(
  summaryPath,
  `${JSON.stringify({ timezone, updatedAt: new Date().toISOString(), items: [...merged.values()] }, null, 2)}\n`,
);

log(`selesai: ${results.filter((entry) => entry.ok).length} terjadwal, ${failed} gagal`);
process.exit(failed ? 1 : 0);
