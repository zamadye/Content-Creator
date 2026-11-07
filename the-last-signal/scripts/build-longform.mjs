/**
 * build-longform.mjs — dari naskah panjang ke episode.json 16:9.
 *
 * Kenapa ada berkas sendiri: `build-episode.mjs` mengasumsikan 6 scene, 45–57
 * detik, dan 1080×1920. Memaksakan format panjang ke sana akan mengubah kontrak
 * Short yang sudah terbukti. Di sini kontraknya terpisah: 10 segmen, 5–11
 * menit, 1920×1080, dan tempo gambar lambat (≈ 20–25 detik per shot).
 *
 *   node scripts/build-longform.mjs --plan stories/longform/LL-0001/plan.json
 *
 * Naskah asalnya `plan.json`; setelah audio ada, `align-narration.ts`
 * mengganti semua durasi perkiraan dengan durasi terukur.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FPS = 30;
/** Tempo TTS Indonesia yang terukur di episode sebelumnya: ±2,2 kata/detik. */
const WORDS_PER_SECOND = 2.2;
const LEAD_IN_FRAMES = 4;
const TAIL_FRAMES = 8;
const WIDTH = 1920;
const HEIGHT = 1080;

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const planPath = resolve(ROOT, arg("plan", "stories/longform/LL-0001/plan.json"));
if (!existsSync(planPath)) {
  console.error(`✖ naskah tidak ada: ${planPath}`);
  process.exit(1);
}

const plan = JSON.parse(readFileSync(planPath, "utf8"));
const episodeId = plan.episodeId;
const episodeDir = join(ROOT, "projects", "episodes", episodeId);
for (const sub of ["", "images", "audio", "audio/narration", "audio/sfx"]) {
  mkdirSync(join(episodeDir, sub), { recursive: true });
}

const pad = (n) => String(n).padStart(2, "0");
const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Subjudul dipotong per kalimat, lalu per ±9 kata. Batas 9 kata dipakai karena
 * di layar 16:9 satu baris subjudul sudah selebar ±1.300 px.
 */
function cuesOf(narration) {
  const sentences = narration
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const cues = [];
  for (const sentence of sentences) {
    const tokens = sentence.split(/\s+/);
    if (tokens.length <= 9) {
      cues.push(sentence);
      continue;
    }
    for (let i = 0; i < tokens.length; i += 9) {
      const slice = tokens.slice(i, i + 9).join(" ");
      if (slice.trim()) cues.push(slice.trim());
    }
  }
  return cues.length > 0 ? cues : [narration];
}

/** Bagi rentang frame sesuai panjang teks tiap cue (bukan rata). */
function distribute(cues, startFrame, endFrame) {
  const totalChars = cues.reduce((sum, cue) => sum + cue.length, 0) || 1;
  let cursor = startFrame;
  return cues.map((text, index) => {
    const span =
      index === cues.length - 1
        ? endFrame - cursor
        : Math.max(8, Math.round(((endFrame - startFrame) * text.length) / totalChars));
    const cue = { startFrame: cursor, endFrame: cursor + span, text };
    cursor += span;
    return cue;
  });
}

const scenes = plan.segments.map((segment, index) => {
  const narrationFrames = Math.max(
    Math.round((words(segment.narration) / WORDS_PER_SECOND) * FPS),
    FPS * 4,
  );
  const durationFrames = LEAD_IN_FRAMES + narrationFrames + TAIL_FRAMES;
  const shots = segment.shots ?? [];
  if (shots.length === 0) {
    throw new Error(`segmen ${index + 1} tidak punya shot`);
  }
  const cutFrames = shots.slice(1).map((_, i) =>
    Math.round(durationFrames * ((i + 1) / shots.length)),
  );

  return {
    id: `scene_${pad(index + 1)}`,
    order: index,
    durationFrames,
    image: shots[0].image,
    narration: segment.narration,
    narrationAudio: `audio/narration/scene-${pad(index + 1)}.mp3`,
    cuts: shots.slice(1).map((shot, i) => ({
      atFrame: cutFrames[i],
      image: shot.image ?? shots[0].image,
      camera: shot.camera ?? "static",
      scale: shot.scale ?? 1.1,
      offsetX: shot.offsetX ?? 0,
      offsetY: shot.offsetY ?? 0,
    })),
    subtitles: distribute(cuesOf(segment.narration), LEAD_IN_FRAMES, LEAD_IN_FRAMES + narrationFrames),
    visual: {
      prompt: segment.imagePrompt ?? segment.narration.slice(0, 120),
      locationId: `${episodeId.toLowerCase()}_main`,
      characterIds: [],
      camera: shots[0].camera ?? "static",
      shot: shots[0].shot ?? "wide",
      lighting: segment.lighting ?? "low_key_practical",
      intensity: segment.intensity ?? 0.55,
      effects: segment.effects ?? ["film_grain", "vignette"],
    },
    audio: {
      ambienceId: "audio/ambience_drone.wav",
      ambienceVolume: segment.ambienceVolume ?? 0.28,
      sfx: segment.sfx ?? [],
    },
  };
});

const totalFrames = scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);

const episode = {
  episodeId,
  title: plan.title,
  language: "id-ID",
  category: "fictional_horror",
  format: "longform_narration",
  targetFps: FPS,
  width: WIDTH,
  height: HEIGHT,
  targetDurationSeconds: Number((totalFrames / FPS).toFixed(1)),
  story: plan.story,
  score: { assetId: "audio/score.wav", volume: 0.75 },
  jumpscares: [],
  onScreenText: (plan.cards ?? []).map((card) => ({
    text: card.text,
    startFrame: Math.round(totalFrames * card.at),
    endFrame: Math.round(totalFrames * card.at) + 90,
  })),
  scenes,
  publishing: {
    title: plan.youtube.title,
    description: plan.youtube.description,
    tags: plan.youtube.tags ?? [],
    categoryId: "24",
    privacyStatus: "public",
    selfDeclaredMadeForKids: false,
    // Catatan INTERNAL, bukan label platform. Kontrak mewajibkan true karena
    // gambarnya dibuat dengan bantuan AI; saat unggah `zernio-publish.mjs`
    // memaksa containsSyntheticMedia=false (arahan 2026-11-06).
    syntheticDisclosure: true,
    pinComment: plan.youtube.pinComment,
    thumbnail: {
      headline: plan.thumbnail.headline.toUpperCase().slice(0, 42),
      kicker: plan.thumbnail.kicker,
      image: "images/thumb.jpg",
      holdFrames: 20,
    },
    cta: { card: plan.cta.card, holdFrames: plan.cta.holdFrames ?? 90 },
  },
  production: {
    subgenre: plan.subgenre ?? "Long-form narration",
    experiment: plan.experiment ?? null,
    structure: plan.structure ?? null,
    slate: planPath.replace(`${ROOT}/`, ""),
    format: "longform",
  },
};

writeFileSync(join(episodeDir, "episode.json"), `${JSON.stringify(episode, null, 2)}\n`, "utf8");

// Ambience dipinjam dari episode pertama; format panjang butuh satu drone panjang.
const ambience = join(ROOT, "projects", "episodes", "LS-0001", "audio", "ambience_drone.wav");
if (existsSync(ambience)) copyFileSync(ambience, join(episodeDir, "audio", "ambience_drone.wav"));

console.log(`\n✔ ${episodeId} — ${plan.title}`);
console.log(`  ${scenes.length} segmen · ${totalFrames} frame (${(totalFrames / FPS).toFixed(1)}s, estimasi)`);
console.log(`  ${scenes.reduce((n, s) => n + 1 + s.cuts.length, 0)} shot · ${WIDTH}×${HEIGHT}`);
console.log(`\n  Berikutnya:`);
console.log(`   1. gambar : projects/episodes/${episodeId}/images/`);
console.log(`   2. TTS    : audio/narration/scene-01..${pad(scenes.length)}.mp3 (voice-00)`);
console.log(`   3. align  : npx tsx scripts/align-narration.ts --episode ${episodeId} --lead-in 4 --tail 8`);
console.log(`   4. skor   : node scripts/make-score.mjs --episode ${episodeId}`);
console.log(`   5. render : npx tsx scripts/render.ts --episode ${episodeId}\n`);
