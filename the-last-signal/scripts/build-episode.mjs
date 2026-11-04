/**
 * build-episode.mjs — dari naskah cerita ke episode.json yang siap dirender.
 *
 * Blueprint §2: agent kreatif menulis JSON, bukan kode. File ini penerjemah
 * naskah (stories/*.json) menjadi kontrak episode: durasi scene perkiraan dari
 * jumlah kata, framing cut, subtitle sementara, kartu teks, dan jumpscare.
 * Setelah audio TTS ada, `align-narration.ts` mengganti semua angka perkiraan
 * itu dengan timing yang benar-benar terukur.
 *
 *   node scripts/build-episode.mjs --story LS-0002
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;

/** Tempo TTS Indonesia ±2,3 kata/detik. Hanya estimasi awal; alignment
 *  mengoreksinya dengan durasi audio nyata. */
const WORDS_PER_SECOND = 2.3;
const LEAD_IN_FRAMES = 6;
const TAIL_FRAMES = 12;
const CARD_FRAMES = 60;

const BASE_SFX = ["knock.wav", "heartbeat.wav", "impact.wav", "door_creak.wav", "riser.wav", "whoosh.wav"];

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const storyId = arg("story");
const slatePath = resolve(ROOT, arg("slate", "stories/slate-2026-11-04.json"));

if (!storyId) {
  console.error("Pakai: node scripts/build-episode.mjs --story LS-0002");
  process.exit(1);
}

const slate = JSON.parse(readFileSync(slatePath, "utf8"));
const entry = slate.episodes.find((item) => item.episodeId === storyId);
if (!entry) {
  console.error(`✖ ${storyId} tidak ada di ${slatePath}`);
  process.exit(1);
}

const episodeDir = join(ROOT, "projects", "episodes", storyId);
for (const dir of ["images", "audio/narration", "audio/sfx", "overlays"]) {
  mkdirSync(join(episodeDir, dir), { recursive: true });
}

const pad = (value) => String(value).padStart(2, "0");
const estimateSeconds = (text) => Math.max(4.5, text.trim().split(/\s+/).length / WORDS_PER_SECOND + 1.2);

function splitSentences(text) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function distribute(sentences, startFrame, endFrame) {
  const weights = sentences.map((item) => Math.max(1, item.split(/\s+/).length));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const span = endFrame - startFrame;
  let cursor = startFrame;
  return sentences.map((text, index) => {
    const share = Math.round((weights[index] / total) * span);
    const cueStart = cursor;
    const cueEnd = index === sentences.length - 1 ? endFrame : cursor + share;
    cursor = cueEnd;
    return { startFrame: cueStart, endFrame: cueEnd, text };
  });
}

const scenes = entry.scenes.map((scene, index) => {
  const sentences = splitSentences(scene.narration);
  const seconds = estimateSeconds(scene.narration);
  const narrationFrames = Math.ceil(seconds * FPS);
  const durationFrames = LEAD_IN_FRAMES + narrationFrames + TAIL_FRAMES;

  // Tiga cut per scene = empat shot. Dengan 55 detik per episode itu ~2,4 s per
  // shot; dua cut (tiga shot) sudah terbukti gagal QC di LS-0002 (3,12 s).
  const cutA = Math.round(durationFrames * 0.28);
  const cutB = Math.round(durationFrames * 0.56);
  const cutC = Math.round(durationFrames * 0.82);
  const counterMove =
    scene.camera === "push_in" ? "handheld" : scene.camera === "handheld" ? "pan_left" : "push_in";

  return {
    id: `scene_${pad(index + 1)}`,
    order: index,
    durationFrames,
    image: `images/scene-${pad(index + 1)}.png`,
    narration: scene.narration,
    narrationAudio: `audio/narration/scene-${pad(index + 1)}.mp3`,
    cuts: [
      { atFrame: cutA, camera: scene.camera, scale: 1.22, offsetY: -55 },
      { atFrame: cutB, camera: counterMove, scale: 1.5, offsetX: 30, offsetY: 20 },
      { atFrame: cutC, camera: "push_in", scale: 1.72, offsetX: -25, offsetY: 70 },
    ],
    subtitles: distribute(sentences, LEAD_IN_FRAMES, LEAD_IN_FRAMES + narrationFrames),
    visual: {
      prompt: scene.imagePrompt,
      locationId: `${storyId.toLowerCase()}_main`,
      characterIds: [],
      camera: scene.camera,
      shot: scene.shot,
      lighting: scene.lighting,
      intensity: scene.intensity,
      effects: scene.effects,
    },
    audio: {
      ambienceId: "audio/ambience_drone.wav",
      ambienceVolume: 0.32,
      sfx: [
        { assetId: "audio/sfx/knock.wav", startFrame: Math.round(durationFrames * 0.62), volume: 0.5 },
        { assetId: "audio/sfx/heartbeat.wav", startFrame: Math.round(durationFrames * 0.82), volume: 0.4 },
      ],
    },
  };
});

const totalFrames = scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);

// Kartu teks = tanda baca ritme, bukan subtitle. Posisi 2%, 54%, 78%.
const cardRatios = [0.02, 0.54, 0.78];
const onScreenText = (entry.cards ?? []).slice(0, 3).map((text, index) => {
  const start = Math.round(totalFrames * cardRatios[index]);
  return {
    text,
    startFrame: start,
    endFrame: Math.min(totalFrames - 30, start + CARD_FRAMES),
  };
});

// Jumpscare: satu per episode, di scene yang ditentukan naskah.
let jumpscares = [];
if (entry.jumpscare) {
  const scareStart = scenes
    .slice(0, entry.jumpscare.atScene)
    .reduce((sum, scene) => sum + scene.durationFrames, 0);
  jumpscares = [
    {
      atFrame: scareStart + (entry.jumpscare.atFrameOffset ?? 60),
      image: "images/scare-face.png",
      assetId: "audio/sfx/scare.wav",
      volume: 0.95,
      flash: entry.jumpscare.flash ?? 0.85,
      shake: entry.jumpscare.shake ?? 0.9,
      zoom: entry.jumpscare.zoom ?? 1.4,
      durationFrames: entry.jumpscare.durationFrames ?? 16,
    },
  ];
}

const episode = {
  episodeId: entry.episodeId,
  title: entry.story.title,
  language: "id-ID",
  category: "fictional_horror",
  format: "found_footage",
  targetFps: FPS,
  width: 1080,
  height: 1920,
  targetDurationSeconds: Number((totalFrames / FPS).toFixed(1)),
  story: {
    hook: entry.story.hook,
    premise: entry.story.premise,
    twist: entry.story.twist,
    ending: entry.story.ending,
  },
  score: { assetId: "audio/score.wav", volume: 0.9 },
  jumpscares,
  onScreenText,
  scenes,
  publishing: {
    title: entry.youtube.title.slice(0, 100),
    description: entry.youtube.description,
    tags: (entry.youtube.tags ?? []).slice(0, 15),
    categoryId: "24",
    privacyStatus: "public",
    selfDeclaredMadeForKids: false,
    syntheticDisclosure: true,
  },
  production: {
    subgenre: entry.subgenre,
    experiment: entry.experiment,
    structure: entry.structure,
    slate: slatePath.replace(`${ROOT}/`, ""),
  },
};

writeFileSync(join(episodeDir, "episode.json"), `${JSON.stringify(episode, null, 2)}\n`, "utf8");

// Aset audio dasar: ambience + SFX prosedural disalin dari episode acuan.
const refDir = join(ROOT, "projects", "episodes", "LS-0001");
const ambience = join(refDir, "audio", "ambience_drone.wav");
if (existsSync(ambience)) {
  copyFileSync(ambience, join(episodeDir, "audio", "ambience_drone.wav"));
}
for (const file of BASE_SFX) {
  const source = join(refDir, "audio", "sfx", file);
  if (existsSync(source)) copyFileSync(source, join(episodeDir, "audio", "sfx", file));
}
const scareFace = join(refDir, "images", "scare-face.png");
if (existsSync(scareFace)) {
  copyFileSync(scareFace, join(episodeDir, "images", "scare-face.png"));
}

console.log(`\n✔ ${entry.episodeId} — ${entry.story.title}`);
console.log(`  ${scenes.length} scene · ${totalFrames} frame (${(totalFrames / FPS).toFixed(1)}s, estimasi)`);
console.log(`  kartu: ${onScreenText.map((card) => card.text).join(" → ")}`);
console.log(`  jumpscare: ${jumpscares[0]?.atFrame ?? "-"} (scene ${entry.jumpscare?.atScene ?? "-"})`);
console.log(`\n  Berikutnya:`);
console.log(`   1. gambar:  projects/episodes/${entry.episodeId}/images/scene-01..06.png (9:16)`);
console.log(`   2. TTS   :  audio/narration/scene-01..06.mp3 (voice-00)`);
console.log(`   3. align :  pnpm tsx scripts/align-narration.ts --episode ${entry.episodeId}`);
console.log(`   4. score :  node scripts/make-score.mjs --episode ${entry.episodeId}`);
console.log(`   5. render:  pnpm render --episode ${entry.episodeId}\n`);
