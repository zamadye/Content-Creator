#!/usr/bin/env node
/**
 * plan-design.mjs — menegakkan "desain baru" pada satu episode.
 *
 * Empat hal yang diminta pemilik kanal (2026-11-06) tidak bisa muncul sendiri
 * dari renderer; semuanya harus ditulis ke episode.json:
 *
 *   1. visual karakter   → gambar adegan dari <imageDir> (tokoh tetap + entitas)
 *   2. visual setan      → entitas muncul tiga kali, makin dekat (beats)
 *   3. suara SFX         → satu suara makhluk per kemunculan, bukan ketukan acak
 *   4. subtitle di tengah → sudah diurus SubtitleTrack (1–3 kata), tidak di sini
 *
 * Ditambah dua angka yang diukur dari video pembanding
 * (knowledge/reference-design.md):
 *
 *   • shot pendek  1,2–1,8 detik (pembanding: 1,0 detik)
 *   • bed musik     tanpa jeda; skor adalah satu berkas sepanjang episode
 *
 * Sumber kebenaran episode-spesifik ada di projects/episodes/<id>/design.json,
 * bukan di skrip ini. Skrip hanya menerapkan.
 *
 *   node scripts/plan-design.mjs --episode LS-0010 --dry-run
 *   node scripts/plan-design.mjs --episode LS-0010
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}
const flag = (name) => process.argv.includes(`--${name}`);
const dryRun = flag("dry-run");

const episodeId = arg("episode");
if (!episodeId) {
  console.error("Pakai: node scripts/plan-design.mjs --episode LS-0010 [--dry-run]");
  process.exit(1);
}

const episodeDir = join(ROOT, "projects", "episodes", episodeId);
const episodeFile = join(episodeDir, "episode.json");
const designFile = join(episodeDir, "design.json");

if (!existsSync(episodeFile)) {
  console.error(`✖ episode.json tidak ada: ${episodeFile}`);
  process.exit(1);
}

const episode = JSON.parse(readFileSync(episodeFile, "utf8"));
const design = existsSync(designFile) ? JSON.parse(readFileSync(designFile, "utf8")) : {};
const shotPlan = { target: 1.5, min: 1.25, max: 1.85, ...(design.shot ?? {}) };
const imageDir = design.imageDir ?? null;

/* ------------------------------------------------------------------ framing */

/**
 * Tangga framing. Angka berselang-seling lebar/sempit dengan selisih minimal
 * 0,25 skala, karena mata baru membaca "shot baru" kalau ukuran bingkainya
 * berubah. Selisih 0,05 terbaca sebagai gambar yang bergeser, bukan potongan.
 */
const FRAMING = [
  { scale: 1.0, offsetX: 0, offsetY: 0 },
  { scale: 1.34, offsetX: 70, offsetY: -45 },
  { scale: 1.12, offsetX: -85, offsetY: 35 },
  { scale: 1.48, offsetX: -45, offsetY: -70 },
  { scale: 1.22, offsetX: 95, offsetY: 55 },
  { scale: 1.42, offsetX: 25, offsetY: -95 },
];

/** Kamera juga diputar supaya dua shot berdampingan tidak bergerak sama. */
const CAMERAS = ["push_in", "drift", "pan_left", "pull_out", "handheld", "tilt_up"];

const cueBoundaries = (scene) => {
  const frames = new Set();
  for (const cue of scene.subtitles ?? []) {
    frames.add(cue.startFrame);
    frames.add(cue.endFrame);
  }
  return [...frames].sort((a, b) => a - b);
};

/**
 * Titik potong: kelipatan target, lalu digeser ke batas kalimat terdekat supaya
 * cut jatuh bersama pergantian subtitle — persis kebiasaan video pembanding,
 * di mana kartu teks berganti bersamaan dengan gambar.
 */
function cutPointsFor(scene, phase) {
  const minF = Math.round(shotPlan.min * FPS);
  const maxF = Math.round(shotPlan.max * FPS);
  const targetF = Math.round(shotPlan.target * FPS);
  const boundaries = cueBoundaries(scene).filter((frame) => frame > 0 && frame < scene.durationFrames);

  const points = [];
  let cursor = 0;
  let index = 0;
  while (scene.durationFrames - cursor > maxF) {
    const wanted = cursor + targetF + ((index + phase) % 3 === 1 ? 6 : (index + phase) % 3 === 2 ? -6 : 0);
    let best = wanted;
    let bestDistance = 9; // geser hanya kalau batas kalimat memang dekat
    for (const boundary of boundaries) {
      const distance = Math.abs(boundary - wanted);
      if (boundary > cursor + minF && boundary < cursor + maxF && distance < bestDistance) {
        best = boundary;
        bestDistance = distance;
      }
    }
    if (best <= cursor + minF - 1) best = cursor + targetF;
    if (best > scene.durationFrames - minF) break;
    points.push(best);
    cursor = best;
    index += 1;
  }

  /**
   * Rapikan sisa: perulangan di atas bisa meninggalkan satu shot ekor yang
   * panjang (mis. 2,6 s) karena cut terakhir tidak boleh melewati batas bawah.
   * Shot itu dibelah di tengah — tetap di batas kalimat kalau ada yang dekat.
   */
  for (let pass = 0; pass < 4; pass++) {
    const edges = [0, ...points, scene.durationFrames];
    let changed = false;
    for (let i = 0; i < edges.length - 1; i++) {
      const length = edges[i + 1] - edges[i];
      if (length <= maxF) continue;
      const middle = edges[i] + Math.round(length / 2);
      const snapped = boundaries.find((frame) => Math.abs(frame - middle) <= 8) ?? middle;
      if (snapped - edges[i] < minF || edges[i + 1] - snapped < minF) continue;
      points.push(snapped);
      changed = true;
    }
    points.sort((a, b) => a - b);
    if (!changed) break;
  }
  return points;
}

/* --------------------------------------------------------------------- sfx */

const audioRoot = join(ROOT, "assets", "audio", "horror");
const sfxDir = join(episodeDir, "audio", "sfx");

/**
 * ffmpeg build lengkap (punya ffprobe-alternatif lewat -i) dicari dengan urutan
 * yang sama seperti scripts/lib/ffmpeg.ts. Skrip ini .mjs sehingga tidak bisa
 * mengimpor modul TypeScript itu.
 */
const FFMPEG = [
  process.env.FFMPEG_PATH,
  "/tmp/ffmpeg-full",
  "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2",
]
  .filter(Boolean)
  .find((candidate) => existsSync(candidate));

/** Durasi berkas (detik) lewat ffmpeg; dipakai supaya cue tidak terpotong. */
function durationOf(file) {
  if (!FFMPEG) return null;
  const result = spawnSync(FFMPEG, ["-hide_banner", "-i", file], { encoding: "utf8" });
  const match = `${result.stderr ?? ""}${result.stdout ?? ""}`.match(/Duration:\s(\d+):(\d+):(\d+\.\d+)/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

/** Salin aset dari perpustakaan ke folder episode (publicDir renderer). */
function ensureSfx(name) {
  const source = join(audioRoot, `${name}.mp3`);
  if (!existsSync(source)) throw new Error(`aset tidak ada: ${source}`);
  const target = join(sfxDir, `${name}.mp3`);
  if (!existsSync(target) || statSync(target).mtimeMs < statSync(source).mtimeMs) {
    mkdirSync(sfxDir, { recursive: true });
    copyFileSync(source, target);
  }
  return `audio/sfx/${name}.mp3`;
}

/** Letak cue: nomor frame tetap, atau awal subtitle yang memuat potongan teks. */
function frameOf(scene, cue) {
  if (typeof cue.frame === "number") return cue.frame;
  if (!cue.cue) return 0;
  const needle = cue.cue.toLowerCase();
  const found = (scene.subtitles ?? []).find((item) => item.text.toLowerCase().includes(needle));
  if (!found) throw new Error(`${scene.id}: subtitle "${cue.cue}" tidak ditemukan`);
  return Math.max(0, found.startFrame + (cue.offset ?? 0));
}

/* ------------------------------------------------------------------- terapkan */

const scenes = episode.scenes;
const report = [];
let totalShots = 0;
let totalSeconds = 0;

scenes.forEach((scene, sceneIndex) => {
  // 1. Gambar desain baru (tokoh + entitas) menggantikan plate kosong.
  if (imageDir) {
    const next = `${imageDir}/${scene.image.split("/").pop()}`;
    if (existsSync(join(episodeDir, next))) scene.image = next;
    else console.warn(`  ⚠ ${scene.id}: ${next} tidak ada, gambar lama dipakai`);
  }

  // 2. Cut pendek.
  const points = cutPointsFor(scene, sceneIndex % 3);
  scene.cuts = points.map((atFrame, index) => {
    const framing = FRAMING[(sceneIndex * 2 + index + 1) % FRAMING.length];
    return {
      atFrame,
      image: scene.image,
      camera: CAMERAS[(sceneIndex + index) % CAMERAS.length],
      ...framing,
    };
  });

  // 3. SFX dari design.json: mengganti daftar lama, bukan menambah di atasnya.
  //    Ketukan yang sama di tujuh scene adalah bunyi templat, bukan cerita.
  const cues = (design.sfx ?? []).filter((item) => item.scene === scene.id);
  scene.audio.sfx = cues.map((item) => {
    const assetId = ensureSfx(item.asset);
    const frames = item.frames ?? Math.round((durationOf(join(sfxDir, `${item.asset}.mp3`)) ?? 4) * FPS);
    return {
      assetId,
      startFrame: frameOf(scene, item),
      volume: item.volume ?? 0.45,
      durationFrames: frames,
    };
  });

  // 4. Efek yang menyertai kemunculan entitas.
  const effects = new Set(scene.visual.effects ?? []);
  if (design.creatureScenes?.includes(scene.id)) effects.add("creature_reveal");
  scene.visual.effects = [...effects];

  const seconds = scene.durationFrames / FPS;
  const shots = scene.cuts.length + 1;
  totalShots += shots;
  totalSeconds += seconds;
  report.push({
    scene: scene.id,
    image: scene.image,
    seconds: Number(seconds.toFixed(1)),
    shots,
    avg: Number((seconds / shots).toFixed(2)),
    sfx: scene.audio.sfx.map((cue) => `${cue.assetId.split("/").pop()}@${cue.startFrame}`).join(" "),
  });
});

// 5. Kartu teks "tanda baca" — tetap 2–3 kata, bukan kalimat.
if (Array.isArray(design.cards) && design.cards.length > 0) {
  episode.onScreenText = design.cards.map((card) => ({
    text: card.text,
    startFrame: card.atFrame,
    endFrame: card.atFrame + (card.frames ?? 60),
  }));
}

// 6. Jumpscare memakai wajah entitas yang sama dengan scene-nya.
if (imageDir) {
  const scare = `${imageDir}/scare-face.png`;
  if (existsSync(join(episodeDir, scare))) {
    for (const jump of episode.jumpscares ?? []) jump.image = scare;
  }
}

// 7. Tidak ada shot yang lebih panjang dari batas — kalau ada, laporan jujur.
const longShots = scenes.flatMap((scene) => {
  const boundaries = [0, ...scene.cuts.map((cut) => cut.atFrame), scene.durationFrames];
  return boundaries.slice(1).map((frame, index) => ({
    scene: scene.id,
    seconds: Number(((frame - boundaries[index]) / FPS).toFixed(2)),
  }));
});
const longest = longShots.reduce((a, b) => (a.seconds >= b.seconds ? a : b), { seconds: 0 });
const shortest = longShots.reduce((a, b) => (a.seconds <= b.seconds ? a : b), { seconds: 99 });
const overLimit = longShots.filter((shot) => shot.seconds > shotPlan.max + 0.05);

if (!dryRun) writeFileSync(episodeFile, `${JSON.stringify(episode, null, 2)}\n`);

console.log(`\nDesain ${episodeId} — ${episode.title}${dryRun ? " (dry run)" : ""}`);
console.log(`  ${totalShots} shot untuk ${totalSeconds.toFixed(1)} s → rata-rata ${(totalSeconds / totalShots).toFixed(2)} s/shot`);
console.log(`  shot terpendek ${shortest.seconds}s · terpanjang ${longest.seconds}s (${longest.scene})`);
console.log(`  target ${shotPlan.min}–${shotPlan.max} s\n`);
for (const row of report) {
  console.log(`  ${row.scene}: ${row.seconds}s · ${row.shots} shot · ${row.avg}s/shot · ${row.image}`);
  if (row.sfx) console.log(`      sfx: ${row.sfx}`);
}
if (overLimit.length > 0) {
  console.log(`\n  ⚠ ${overLimit.length} shot melewati batas: ${overLimit.map((s) => `${s.scene} ${s.seconds}s`).join(", ")}`);
}
console.log(`\n${dryRun ? "○ tidak ditulis" : `✔ ditulis ke ${episodeFile}`}\n`);
