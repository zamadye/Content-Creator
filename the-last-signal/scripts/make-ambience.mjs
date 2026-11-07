#!/usr/bin/env node
/**
 * make-ambience.mjs — bed ambience sepanjang episode (deterministik).
 *
 * Kenapa ada: `build-longform.mjs` menyalin `ambience_drone.wav` dari LS-0001,
 * episode yang sudah diarsipkan. Di episode baru berkasnya tidak pernah ada,
 * jadi render gagal di gerbang aset dengan pesan "audio/ambience_drone.wav".
 * Bunyi ini dibuat di sini, bukan disalin, supaya tidak bergantung episode lain.
 *
 * Dua lapis brown noise yang di-low-pass: cukup untuk mengisi ruang tanpa
 * bertabrakan dengan skor (ATURAN 4.x: bed tanpa jeda, musik tetap dominan).
 *
 *   node scripts/make-ambience.mjs --episode LL-0002
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
};

const episodeId = arg("episode", "LL-0002");
const dir = join(ROOT, "projects", "episodes", episodeId);
const episode = JSON.parse(readFileSync(join(dir, "episode.json"), "utf8"));
const durasi = Number(episode.targetDurationSeconds) + 1;
const out = join(dir, "audio", "ambience_drone.wav");

const ffmpeg = process.env.FFMPEG_PATH || "ffmpeg";
if (!process.env.FFMPEG_PATH && !existsSync("/usr/bin/ffmpeg")) {
  console.error("✖ FFMPEG_PATH belum diset. Jalankan: eval \"$(bash scripts/bootstrap.sh --env)\"");
  process.exit(1);
}

execFileSync(
  ffmpeg,
  [
    "-hide_banner", "-loglevel", "error", "-y",
    "-f", "lavfi", "-i", `anoisesrc=color=brown:duration=${durasi.toFixed(2)}:amplitude=0.4:seed=20261106`,
    "-f", "lavfi", "-i", `anoisesrc=color=brown:duration=${durasi.toFixed(2)}:amplitude=0.4:seed=77`,
    "-filter_complex",
    "[0:a]lowpass=f=260,highpass=f=45,volume=0.5[a];" +
      "[1:a]lowpass=f=260,highpass=f=45,volume=0.5[b];" +
      "[a][b]join=inputs=2:channel_layout=stereo[out]",
    "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le", out,
  ],
  { stdio: "inherit" },
);

console.log(`✔ ambience ${episodeId}: ${durasi.toFixed(1)} s -> ${out.replace(`${ROOT}/`, "")}`);
