/**
 * QC deterministik untuk file hasil render (blueprint §3, Agent 5 bagian awal:
 * "gunakan aturan deterministik terlebih dahulu").
 *
 * Memeriksa hal-hal yang bisa diukur tanpa model vision:
 * resolusi, fps, durasi, loudness (LUFS), true peak, ukuran file, dan ritme cut.
 *
 *   tsx scripts/qc.ts --episode LS-0001 --file renders/LS-0001-delivery.mp4
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { safeParseEpisode, totalFrames } from "@the-last-signal/contracts";
import { averageShotLength } from "./lib/assets";
import { probeFfmpeg, runFfmpeg } from "./lib/ffmpeg";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string, fallback?: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode", "LS-0001")!;
const file = resolve(ROOT, arg("file", `renders/${episodeId}-delivery.mp4`)!);

type Check = { name: string; pass: boolean; detail: string };
const checks: Check[] = [];
const check = (name: string, pass: boolean, detail: string) => checks.push({ name, pass, detail });

if (!existsSync(file)) {
  console.error(`✖ file tidak ditemukan: ${file}`);
  process.exit(1);
}

// --- metadata kontainer -----------------------------------------------------
const probe = probeFfmpeg(["-hide_banner", "-i", file]);
const durationMatch = probe.match(/Duration:\s(\d+):(\d+):(\d+\.\d+)/);
const videoMatch = probe.match(/Video:.*?,\s(\d{3,4})x(\d{3,4}).*?,\s([\d.]+) fps/);
const audioMatch = probe.match(/Audio:\s([a-z0-9]+).*?(\d+) Hz/);

const durationSeconds = durationMatch
  ? Number(durationMatch[1]) * 3600 + Number(durationMatch[2]) * 60 + Number(durationMatch[3])
  : 0;

// --- loudness ---------------------------------------------------------------
// Catatan: ffmpeg bawaan Remotion di-build tanpa filter `ebur128`, jadi
// pengukuran loudness memakai `loudnorm` (print_format=json) yang tersedia.
const loudnessRaw = runFfmpeg(["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
const integrated = Number(loudnessRaw.match(/"input_i"\s*:\s*"(-?[\d.]+)"/)?.[1] ?? 0);
const truePeak = Number(loudnessRaw.match(/"input_tp"\s*:\s*"(-?[\d.]+)"/)?.[1] ?? 0);

// --- episode ----------------------------------------------------------------
const parsed = safeParseEpisode(JSON.parse(readFileSync(join(ROOT, "projects", "episodes", episodeId, "episode.json"), "utf8")));
const shotLength = parsed.success ? averageShotLength(parsed.data) : 0;
const expectedFrames = parsed.success ? totalFrames(parsed.data) : 0;
const sizeMb = statSync(file).size / (1024 * 1024);

// --- aturan ---------------------------------------------------------------
check(
  "resolusi 1080×1920",
  Boolean(videoMatch) && videoMatch![1] === "1080" && videoMatch![2] === "1920",
  videoMatch ? `${videoMatch[1]}×${videoMatch[2]}` : "tidak terbaca",
);
check("fps 30", Boolean(videoMatch) && Number(videoMatch![3]) === 30, videoMatch ? `${videoMatch[3]} fps` : "tidak terbaca");
check(
  "durasi 40–60 detik",
  durationSeconds >= 40 && durationSeconds <= 60.5,
  `${durationSeconds.toFixed(2)}s (kontrak ${(expectedFrames / 30).toFixed(1)}s)`,
);
check(
  "stream audio AAC",
  Boolean(audioMatch) && audioMatch![1] === "aac",
  audioMatch ? `${audioMatch[1]} ${audioMatch[2]} Hz` : "TIDAK ADA AUDIO",
);
check(
  "loudness −16…−12 LUFS",
  integrated <= -12 && integrated >= -16,
  `${integrated.toFixed(1)} LUFS (target −14)`,
);
check("true peak ≤ −1 dBTP", truePeak <= -1, `${truePeak.toFixed(1)} dBTP`);
check("ukuran ≤ 40 MB", sizeMb <= 40, `${sizeMb.toFixed(1)} MB`);
check(
  "ritme cut ≤ 3 detik/shot",
  shotLength > 0 && shotLength <= 3,
  `rata-rata ${shotLength.toFixed(2)}s per shot`,
);

// --- laporan ---------------------------------------------------------------
console.log(`\nQC — ${file.replace(ROOT + "/", "")}\n`);
for (const item of checks) {
  console.log(`  ${item.pass ? "✔" : "✖"} ${item.name.padEnd(26)} ${item.detail}`);
}

const failed = checks.filter((item) => !item.pass);
console.log(`\n${failed.length === 0 ? "✔ lolos semua cek" : `✖ ${failed.length} cek gagal`}\n`);
process.exit(failed.length === 0 ? 0 : 1);
