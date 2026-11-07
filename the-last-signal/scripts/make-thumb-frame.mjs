#!/usr/bin/env node
/**
 * make-thumb-frame.mjs — frame thumbnail (background) untuk satu episode.
 *
 * publishing.thumbnail.image menunjuk ke images/thumb.jpg dan validator
 * menganggapnya aset wajib. Berkas ini sebelumnya dibuat manual, dan akibatnya
 * episode baru gagal di gerbang aset dengan pesan "images/thumb.jpg".
 *
 * Yang dibuat di sini HANYA latar: headline/kicker digambar oleh komposisi
 * Remotion dari publishing.thumbnail. Jadi frame ini tidak boleh memuat teks —
 * kalau teks ikut terbakar di JPEG, hasil akhirnya teks dua kali.
 *
 * Pakai ffmpeg, bukan ImageMagick: runner CI menjamin ffmpeg (workflow
 * memasangnya), sedangkan `convert` tidak dijamin ada. Path diambil dari
 * FFMPEG_PATH kalau bootstrap menyetelnya, karena di sandbox kerja binary
 * ffmpeg tidak ada di PATH.
 *
 *   node scripts/make-thumb-frame.mjs --episode LS-0012
 *   node scripts/make-thumb-frame.mjs --episode LS-0012 --scene 3
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

const episodeId = arg("episode", "LS-0001");
const dir = join(ROOT, "projects", "episodes", episodeId);
const episode = JSON.parse(readFileSync(join(dir, "episode.json"), "utf8"));
const width = episode.width ?? 1080;
const height = episode.height ?? 1920;

// Scene yang dipilih: yang paling "bercerita" kalau tidak ditentukan, yaitu
// scene dengan intensitas tertinggi — bukan selalu scene pertama, karena
// scene pertama biasanya establishing shot yang kosong.
const byIntensity = [...episode.scenes].sort((a, b) => (b.visual?.intensity ?? 0) - (a.visual?.intensity ?? 0));
const chosen = Number(arg("scene", 0)) || episode.scenes.indexOf(byIntensity[0]) + 1;
const source = join(dir, episode.scenes[chosen - 1]?.image ?? "images/scene-01.jpg");

if (!existsSync(source)) {
  console.error(`✖ gambar sumber tidak ada: ${source}`);
  process.exit(1);
}

const out = join(dir, "images", "thumb.jpg");
// scale ke "cover" lalu crop tengah: tanpa letterbox, tanpa bingkai.
execFileSync(process.env.FFMPEG_PATH || "ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", source,
  "-vf", `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`,
  "-q:v", "3",
  out,
]);
console.log(`✔ thumbnail frame ${episodeId}: scene ${chosen} -> images/thumb.jpg (${width}×${height})`);
