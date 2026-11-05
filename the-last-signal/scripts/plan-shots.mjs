/**
 * plan-shots.mjs — menyusun cut dari kalimat, bukan dari durasi bulat.
 *
 * Masalah yang diperbaiki: LL-0001 pertama punya 21 shot untuk 558 detik
 * (26,6 detik per gambar) sedangkan 93 kalimat harus divisualisasikan. Satu
 * gambar yang bertahan setengah menit terbaca sebagai slideshow, apa pun
 * gerakan kameranya.
 *
 * Yang dilakukan skrip ini, per scene:
 *   1. memotong pada batas kalimat (cue subtitle) mendekati target durasi shot,
 *   2. memberi tiap shot gambar berbeda dari kolam scene (gambar utama +
 *      insert dari peta cerita), jadi kalimat yang belum punya visual dapat
 *      insert-nya sendiri,
 *   3. memutar kosakata kamera + skala framing supaya dua shot berurutan tidak
 *      terlihat seperti salinan,
 *   4. melaporkan cakupan: berapa kalimat per shot sebelum dan sesudah.
 *
 * Pemakaian:
 *   node scripts/plan-shots.mjs --episode LL-0001 --map stories/longform/LL-0001/shots.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode", "LL-0001");
const mapPath = arg("map");
const target = Number(arg("target", "9")); // detik per shot
const minSeconds = Number(arg("min", "5"));
const maxSeconds = Number(arg("max", "14"));

const episodeFile = join(ROOT, "projects", "episodes", episodeId, "episode.json");
const episode = JSON.parse(readFileSync(episodeFile, "utf8"));
const map = mapPath ? JSON.parse(readFileSync(resolve(ROOT, mapPath), "utf8")) : { scenes: {} };

const FPS = episode.targetFps ?? 30;

/** Kamera diputar berurutan; dua shot berdampingan tidak boleh sama. */
const CAMERA_CYCLE = [
  "dolly_in",
  "arc_left",
  "pan_right",
  "drift",
  "tilt_up",
  "dolly_out",
  "arc_right",
  "pan_left",
  "tilt_down",
  "push_in",
  "pull_out",
];

/** Tiga ukuran framing yang terbaca sebagai wide / medium / close. */
const FRAMING = [
  { scale: 1.0, offsetX: 0, offsetY: 0 },
  { scale: 1.16, offsetX: 70, offsetY: -30 },
  { scale: 1.3, offsetX: -90, offsetY: 40 },
  { scale: 1.1, offsetX: -60, offsetY: -50 },
];

const sentences = (text) =>
  (text ?? "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

let totalShots = 0;
let totalSeconds = 0;
const report = [];

episode.scenes.forEach((scene, sceneIndex) => {
  const cues = [...(scene.subtitles ?? [])].sort((a, b) => a.startFrame - b.startFrame);
  const sceneEnd = scene.durationFrames;
  const sceneMap = map.scenes?.[scene.id] ?? {};
  const pool = [scene.image, ...(sceneMap.inserts ?? [])];

  // Titik potong selalu jatuh di akhir sebuah cue (akhir kalimat), jadi tidak
  // ada potongan yang memotong kata di tengah subtitle.
  const cutPoints = [];
  let shotStart = 0;
  for (const cue of cues) {
    const elapsed = (cue.endFrame - shotStart) / FPS;
    if (elapsed < minSeconds) continue;
    if (elapsed >= target) {
      cutPoints.push(cue.endFrame);
      shotStart = cue.endFrame;
    }
  }
  // Scene yang sangat panjang tanpa cue mendekati target: paksa potong terakhir.
  if (sceneEnd - shotStart > maxSeconds * FPS) {
    cutPoints.push(Math.min(sceneEnd - 1, shotStart + Math.round(target * FPS)));
  }

  const boundaries = [0, ...cutPoints.filter((frame) => frame > 0 && frame < sceneEnd), sceneEnd];
  const shots = [];
  const cameras = [];
  for (let index = 0; index < boundaries.length - 1; index++) {
    const from = boundaries[index];
    const to = boundaries[index + 1];
    if (to <= from) continue;

    const image = pool[index % pool.length];
    const camera = CAMERA_CYCLE[(sceneIndex * 3 + index) % CAMERA_CYCLE.length];
    const framing = FRAMING[(sceneIndex + index * 2) % FRAMING.length];
    shots.push({
      from,
      to,
      image,
      camera,
      ...framing,
      cameraLabel: cameras.at(-1) === camera ? CAMERA_CYCLE[(index + 2) % CAMERA_CYCLE.length] : camera,
    });
    cameras.push(shots.at(-1).cameraLabel);
  }

  // Shot pertama memakai gambar scene itu sendiri supaya penonton tahu tempatnya
  // dulu; insert masuk setelah itu.
  if (shots.length > 0) {
    shots[0].image = scene.image;
    shots[0].scale = 1.0;
    shots[0].offsetX = 0;
    shots[0].offsetY = 0;
  }

  scene.cuts = shots.slice(1).map((shot) => ({
    atFrame: shot.from,
    image: shot.image,
    camera: shot.cameraLabel,
    scale: shot.scale,
    offsetX: shot.offsetX,
    offsetY: shot.offsetY,
  }));

  // Efek atmosfer dari peta cerita: cuaca ditentukan naskah, bukan renderer.
  if (sceneMap.effects?.length) {
    const keep = new Set(scene.visual.effects ?? []);
    for (const effect of sceneMap.effects) keep.add(effect);
    scene.visual.effects = [...keep];
  }
  if (sceneMap.camera) scene.visual.camera = sceneMap.camera;
  if (typeof sceneMap.intensity === "number") scene.visual.intensity = sceneMap.intensity;

  const sceneSentences = sentences(scene.narration).length;
  const sceneSeconds = sceneEnd / FPS;
  const avg = shots.length ? sceneSeconds / shots.length : sceneSeconds;
  totalShots += shots.length;
  totalSeconds += sceneSeconds;
  report.push({
    scene: scene.id,
    seconds: Number(sceneSeconds.toFixed(1)),
    shots: shots.length,
    avgShot: Number(avg.toFixed(1)),
    sentences: sceneSentences,
    sentencesPerShot: Number((sceneSentences / Math.max(1, shots.length)).toFixed(2)),
    images: [...new Set(shots.map((shot) => shot.image.split("/").pop()))],
  });
});

writeFileSync(episodeFile, `${JSON.stringify(episode, null, 2)}\n`);

console.log(`\nRencana shot — ${episodeId}`);
console.log(`  ${totalShots} shot untuk ${totalSeconds.toFixed(0)} s → rata-rata ${(totalSeconds / totalShots).toFixed(1)} s/shot`);
console.log(`  ${report.reduce((sum, row) => sum + row.sentences, 0)} kalimat → ${(report.reduce((sum, row) => sum + row.sentences, 0) / totalShots).toFixed(1)} kalimat/shot\n`);
for (const row of report) {
  console.log(
    `  ${row.scene}: ${row.seconds}s · ${row.shots} shot · ${row.avgShot}s/shot · ${row.sentences} kalimat (${row.sentencesPerShot}/shot) · ${row.images.join(", ")}`,
  );
}
console.log(`\n✔ cuts ditulis ke projects/episodes/${episodeId}/episode.json\n`);
