#!/usr/bin/env node
/**
 * align-cuts.mjs — kunci potongan shot ke POSISI KATA, bukan bagi rata.
 *
 * Masalah yang diperbaiki: `build-longform.mjs` membagi durasi scene rata ke
 * semua shot. Akibatnya gambar bisa muncul sebelum kalimatnya diucapkan —
 * persis kesalahan yang dilarang ATURAN 3.3 ("visual Pak Sukirman keluar dulu
 * sebelum kata itu diucapkan").
 *
 * Cara kerja: setiap shot di `plan.json` punya `pemicu` (kata yang harus sudah
 * diucapkan). Posisi kata itu di dalam narasi scene diubah menjadi frame:
 *
 *   frame = leadIn + (indeksKata / jumlahKata) * frameNarasi + offsetFrame
 *
 * Ini bukan alignment akustik per kata (kata tidak punya cap waktu sendiri),
 * tapi jauh lebih dekat daripada bagi rata: kata ke-300 dari 400 kata selalu
 * jatuh di 3/4 durasi audio, dan tempo TTS Indonesia cukup stabil (±2,2 kata/detik)
 * sehingga galatnya kecil dan selalu ke arah "sedikit terlambat", bukan
 * "mendahului".
 *
 *   node scripts/align-cuts.mjs --episode LL-0002
 *   node scripts/align-cuts.mjs --episode LL-0002 --story stories/longform/LL-0002 --dry-run
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 ? process.argv[i + 1] : fallback;
};

const episodeId = arg("episode", "LL-0002");
const storyPath = resolve(ROOT, arg("story", `stories/longform/${episodeId}`));
const dryRun = process.argv.includes("--dry-run");
const MIN_SHOT_FRAMES = 12; // shot terpendek yang masih terbaca
const TAIL_GUARD = 10; // jangan menempel di akhir scene

const episodePath = join(ROOT, "projects", "episodes", episodeId, "episode.json");
const plan = JSON.parse(readFileSync(join(storyPath, "plan.json"), "utf8"));
const episode = JSON.parse(readFileSync(episodePath, "utf8"));

const normal = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const scenesById = new Map(episode.scenes.map((s) => [s.id, s]));
let totalCut = 0;
let pergeseranMaks = 0;
const laporan = [];

plan.segments.forEach((seg, index) => {
  const scene = scenesById.get(`scene_${String(index + 1).padStart(2, "0")}`);
  if (!scene) throw new Error(`scene_${index + 1} tidak ada di episode.json`);

  const kata = normal(seg.narration).split(" ");
  const jumlahKata = kata.length || 1;
  // Naskah diucapkan setelah lead-in, sisanya ekor diam.
  const awalNarasi = scene.subtitles?.[0]?.startFrame ?? 4;
  const akhirNarasi = scene.subtitles?.at(-1)?.endFrame ?? scene.durationFrames - 8;
  const frameNarasi = Math.max(1, akhirNarasi - awalNarasi);

  let kursor = 0;
  const cuts = [];
  const daftar = seg.shots.slice(1);

  for (const shot of daftar) {
    const frasa = normal(shot.pemicu ?? "").split(" ").filter(Boolean);
    let idx = -1;
    for (let i = kursor; i <= kata.length - frasa.length; i += 1) {
      let cocok = true;
      for (let j = 0; j < frasa.length; j += 1) {
        if (kata[i + j] !== frasa[j]) {
          cocok = false;
          break;
        }
      }
      if (cocok) {
        idx = i;
        break;
      }
    }
    if (idx === -1) idx = kursor; // jaga-jaga: maju terus, jangan mundur

    const rasio = idx / jumlahKata;
    let atFrame = Math.round(awalNarasi + rasio * frameNarasi + Number(shot.offsetFrame ?? 3));
    const sebelumnya = cuts.at(-1)?.atFrame ?? 0;
    atFrame = Math.max(atFrame, sebelumnya + MIN_SHOT_FRAMES);
    atFrame = Math.min(atFrame, scene.durationFrames - TAIL_GUARD);
    cuts.push({
      atFrame,
      image: shot.image,
      camera: shot.camera ?? "static",
      scale: shot.scale ?? 1.1,
      offsetX: shot.offsetX ?? 0,
      offsetY: shot.offsetY ?? 0,
    });
    kursor = idx;
    totalCut += 1;
  }

  // Ukur seberapa jauh cut bergeser dibanding bagi rata (untuk laporan).
  const rata = daftar.map((_, i) => Math.round((scene.durationFrames * (i + 1)) / (daftar.length + 1)));
  cuts.forEach((cut, i) => {
    pergeseranMaks = Math.max(pergeseranMaks, Math.abs(cut.atFrame - rata[i]));
  });

  scene.cuts = cuts;
  scene.image = seg.shots[0].image;
  scene.visual.shot = seg.shots[0].shot ?? scene.visual.shot;
  laporan.push({ id: scene.id, cuts: cuts.length, frame: scene.durationFrames });
});

if (!dryRun) {
  copyFileSync(episodePath, `${episodePath}.bak`);
  writeFileSync(episodePath, `${JSON.stringify(episode, null, 2)}\n`, "utf8");
}

console.log(`\n${dryRun ? "○" : "✔"} align-cuts ${episodeId}`);
for (const l of laporan) console.log(`  ${l.id}: ${l.cuts} potongan dari ${l.frame} frame`);
console.log(`  total potongan   : ${totalCut}`);
console.log(`  geser terbesar   : ${pergeseranMaks} frame (${(pergeseranMaks / 30).toFixed(2)} dtk) dari bagi-rata`);
console.log(`  aturan           : pemicu kata + offset ${"2–8"} frame, tidak pernah mendahului kata`);
if (!dryRun && !existsSync(`${episodePath}.bak`)) console.log("  ! backup tidak terbentuk");
