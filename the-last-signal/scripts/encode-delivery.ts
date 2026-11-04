/**
 * Ubah master render menjadi file delivery yang layak diunggah.
 *
 * Masalah yang diselesaikan:
 *  - master crf 20 dengan grain ≈ 25 Mbps → 150 MB untuk 50 detik (tidak wajar);
 *  - loudness master belum distandarkan, jadi audio terasa pelan/tidak ada
 *    di speaker ponsel.
 *
 *   tsx scripts/encode-delivery.ts --episode LS-0001
 *   tsx scripts/encode-delivery.ts --episode LS-0001 --maxrate 4M --crf 25
 */
import { statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runFfmpeg } from "./lib/ffmpeg";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string, fallback: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode", "LS-0001");
const crf = arg("crf", "24");
const maxrate = arg("maxrate", "5M");
const loudness = arg("loudness", "-14");

const input = join(ROOT, "renders", `${episodeId}.mp4`);
const output = join(ROOT, "renders", `${episodeId}-delivery.mp4`);

const started = Date.now();

runFfmpeg([
  "-hide_banner",
  "-loglevel",
  "error",
  "-y",
  "-i",
  input,
  "-c:v",
  "libx264",
  "-preset",
  "slow",
  "-crf",
  crf,
  "-maxrate",
  maxrate,
  "-bufsize",
  String(Number.parseInt(maxrate, 10) * 2) + "M",
  "-pix_fmt",
  "yuv420p",
  "-profile:v",
  "high",
  "-level",
  "4.2",
  "-filter:a",
  `loudnorm=I=${loudness}:TP=-1.5:LRA=11`,
  "-c:a",
  "aac",
  "-b:a",
  "192k",
  "-ar",
  "48000",
  "-movflags",
  "+faststart",
  output,
]);

const sizeMb = statSync(output).size / (1024 * 1024);
const seconds = ((Date.now() - started) / 1000).toFixed(0);

console.log(`✔ delivery: renders/${episodeId}-delivery.mp4`);
console.log(`  ukuran : ${sizeMb.toFixed(1)} MB`);
console.log(`  target : ${maxrate} maxrate, crf ${crf}, audio ${loudness} LUFS`);
console.log(`  waktu  : ${seconds}s`);
