/**
 * kb-record.mjs — catat satu episode ke Content Performance Knowledge Base.
 *
 * Satu baris JSON per episode di knowledge/episodes.jsonl. Baris lama untuk
 * episode yang sama diganti (bukan diduplikasi), jadi skrip ini aman dijalankan
 * berkali-kali: setelah QC, setelah upload, dan lagi setelah analytics masuk.
 *
 *   node scripts/kb-record.mjs --episode LS-0001
 *   node scripts/kb-record.mjs --episode LS-0001 --publish report/publish-LS-0001.json
 *   node scripts/kb-record.mjs --episode LS-0001 --analytics analytics/LS-0001.json
 *
 * Yang dicatat adalah keputusan produksi — bukan hanya hasil. Agent berikutnya
 * (Story, Director, Editor, QC) membaca file ini untuk menghindari kesalahan
 * yang sama dan mengulang pola yang terbukti.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KB_DIR = join(ROOT, "knowledge");
const KB_FILE = join(KB_DIR, "episodes.jsonl");

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode");
if (!episodeId) {
  console.error("Pakai: node scripts/kb-record.mjs --episode LS-0001 [--publish file.json] [--analytics file.json]");
  process.exit(1);
}

const episodeDir = join(ROOT, "projects", "episodes", episodeId);
const episode = JSON.parse(readFileSync(join(episodeDir, "episode.json"), "utf8"));

const readIfExists = (path) => {
  if (!path) return null;
  const absolute = resolve(ROOT, path);
  return existsSync(absolute) ? JSON.parse(readFileSync(absolute, "utf8")) : null;
};

const publish = readIfExists(arg("publish"));
const analytics = readIfExists(arg("analytics"));

mkdirSync(KB_DIR, { recursive: true });
const existing = existsSync(KB_FILE)
  ? readFileSync(KB_FILE, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line))
  : [];

const previous = existing.find((record) => record.episodeId === episodeId) ?? {};

const sceneSeconds = episode.scenes.map((scene) => Number((scene.durationFrames / episode.targetFps).toFixed(1)));
const shots = episode.scenes.reduce((sum, scene) => sum + 1 + scene.cuts.length, 0);

const record = {
  episodeId,
  title: episode.title,
  content_type: episode.production?.subgenre ?? episode.format,
  structure: episode.production?.structure ?? null,
  experiment: episode.production?.experiment ?? null,

  story: {
    hook: episode.story.hook,
    premise: episode.story.premise,
    twist: episode.story.twist,
    ending: episode.story.ending,
    hook_card: episode.onScreenText?.[0]?.text ?? null,
  },

  timing: {
    total_seconds: episode.targetDurationSeconds,
    scenes: sceneSeconds,
    shot_count: shots,
    average_shot_seconds: Number((episode.targetDurationSeconds / shots).toFixed(2)),
    jumpscares: (episode.jumpscares ?? []).map((scare) => ({
      frame: scare.atFrame,
      second: Number((scare.atFrame / episode.targetFps).toFixed(1)),
      flash: scare.flash,
      shake: scare.shake,
      zoom: scare.zoom,
    })),
    cards: (episode.onScreenText ?? []).map((card) => card.text),
  },

  visual: {
    locations: [...new Set(episode.scenes.map((scene) => scene.visual.locationId))],
    camera: [...new Set(episode.scenes.map((scene) => scene.visual.camera))],
    shots: [...new Set(episode.scenes.map((scene) => scene.visual.shot))],
    lighting: episode.scenes.map((scene) => scene.visual.lighting),
    effects: [...new Set(episode.scenes.flatMap((scene) => scene.visual.effects))],
    prompts: episode.scenes.map((scene) => scene.visual.prompt),
  },

  audio: {
    narration_voice: "voice-00 (id-ID, maskulin)",
    score: episode.score?.assetId ?? null,
    score_volume: episode.score?.volume ?? null,
    ambience: episode.scenes[0]?.audio?.ambienceId ?? null,
    sfx: [...new Set(episode.scenes.flatMap((scene) => scene.audio.sfx.map((cue) => cue.assetId)))],
  },

  tools: [
    "Remotion 4.0.540 (render)",
    "ffmpeg (encode + loudnorm)",
    "zod (kontrak episode)",
    "tsx (skrip)",
    "Zernio API (publikasi YouTube)",
  ],

  qc: publish?.qc ?? previous.qc ?? null,

  publish: publish
    ? {
        at: publish.checkedAt,
        youtube_video_id: publish.youtube?.videoId ?? null,
        url: publish.youtube?.url ?? null,
        status: publish.youtube?.status ?? null,
        ok: publish.ok,
        media_url: publish.upload?.mediaUrl ?? null,
      }
    : previous.publish ?? null,

  analytics: analytics ?? previous.analytics ?? null,

  errors: previous.errors ?? [],
  next_fixes: previous.next_fixes ?? [],
  updatedAt: new Date().toISOString(),
};

const records = existing.filter((record) => record.episodeId !== episodeId);
records.push(record);
records.sort((a, b) => a.episodeId.localeCompare(b.episodeId));
writeFileSync(KB_FILE, `${records.map((item) => JSON.stringify(item)).join("\n")}\n`, "utf8");

console.log(`✔ KB: ${episodeId} — ${record.title} (${records.length} episode tercatat)`);
console.log(`  shot ${shots} · rata-rata ${record.timing.average_shot_seconds}s · ${record.timing.jumpscares.length} jumpscare`);
if (record.publish?.url) console.log(`  YouTube: ${record.publish.url}`);
