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
import { probeFfmpeg, runFfmpeg } from "./lib/ffmpeg";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string, fallback: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode", "LS-0001");
const crf = arg("crf", "24");
const maxrate = arg("maxrate", "5M");
const loudness = arg("loudness", "-14");
// Target true peak lebih ketat dari standar: stinger jump scare sangat spiky,
// dan limiter loudnorm bisa overshoot kalau targetnya mepet.
const truePeakTarget = Number(arg("tp", "-3"));

const input = join(ROOT, "renders", `${episodeId}.mp4`);
const output = join(ROOT, "renders", `${episodeId}-delivery.mp4`);

const started = Date.now();

/** True peak sebuah berkas (dBFS) menurut loudnorm ffmpeg. */
function measureTruePeak(file: string): number {
  const raw = probeFfmpeg(["-hide_banner", "-nostats", "-i", file, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
  const match = raw.match(/"input_tp"\s*:\s*"?(-?[\d.]+)"?/);
  if (!match) throw new Error(`true peak tidak terbaca: ${file}`);
  return Number(match[1]);
}

// loudnorm sekali jalan bisa meleset di atas target (LS-0011 sempat 0,5 dBTP
// walaupun target -3 karena AAC menambah inter-sample peak). Ulangi dengan
// target yang lebih ketat sampai lolos, maksimal tiga percobaan.
// Mix horor punya crest factor tinggi (stinger tajam + narasi). loudnorm saja
// tidak bisa memenuhi loudness dan true peak sekaligus, jadi loudnorm diikuti
// limiter lookahead: loudness tetap -14 LUFS, puncak ditahan di bawah -2 dBFS.
const filter = `aresample=192000,loudnorm=I=${loudness}:TP=-1.5:LRA=11,alimiter=limit=0.79:level=disabled:attack=5:release=50`;

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
  filter,
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

const deliveredRaw = probeFfmpeg(["-hide_banner", "-nostats", "-i", output, "-vn", "-af", "loudnorm=print_format=json", "-f", "null", "-"]);
const deliveredI = Number(deliveredRaw.match(/"input_i"\s*:\s*"?(-?[\d.]+)"?/)?.[1] ?? NaN);
const deliveredTP = Number(deliveredRaw.match(/"input_tp"\s*:\s*"?(-?[\d.]+)"?/)?.[1] ?? NaN);
console.log(`  hasil  ${deliveredI.toFixed(1)} LUFS / ${deliveredTP.toFixed(1)} dBTP`);
if (!(deliveredTP <= -1)) {
  throw new Error(`true peak ${deliveredTP.toFixed(1)} dBTP masih di atas -1 — limiter tidak bekerja, cek build ffmpeg`);
}

const sizeMb = statSync(output).size / (1024 * 1024);
const seconds = ((Date.now() - started) / 1000).toFixed(0);

console.log(`✔ delivery: renders/${episodeId}-delivery.mp4`);
console.log(`  ukuran : ${sizeMb.toFixed(1)} MB`);
console.log(`  target : ${maxrate} maxrate, crf ${crf}, audio ${loudness} LUFS`);
console.log(`  waktu  : ${seconds}s`);
