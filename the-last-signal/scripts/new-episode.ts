/**
 * Scaffold episode baru.
 *
 *   pnpm exec tsx scripts/new-episode.ts --id LS-0002 --title "Kamar 307"
 *
 * Yang dibuat: folder episode, episode.json yang sudah lolos schema, folder
 * images/audio/sfx/overlays, dan overlay tekstur siap pakai. Master image tetap
 * harus diisi manusia (atau image generator di Phase 3) — script ini sengaja
 * tidak membuat gambar palsu yang bisa lolos QC tanpa disadari.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { FPS, safeParseEpisode } from "@the-last-signal/contracts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string, fallback?: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId: string | undefined = arg("id");
const title = arg("title", "Tanpa Judul");
const durationSeconds = Number(arg("duration", "50"));
const sceneCount = Number(arg("scenes", "6"));

if (!episodeId) {
  console.error("Pemakaian: tsx scripts/new-episode.ts --id LS-0002 --title \"Judul\"");
  process.exit(1);
}
const episodeCode: string = episodeId;
if (!/^LS-\d{4}$/.test(episodeId)) {
  console.error("✖ id harus berbentuk LS-0001");
  process.exit(1);
}

const episodeDir = join(ROOT, "projects", "episodes", episodeCode);
if (existsSync(episodeDir)) {
  console.error(`✖ folder ${episodeDir} sudah ada`);
  process.exit(1);
}

const totalFrames = Math.round(durationSeconds * FPS);
const perScene = Math.floor(totalFrames / sceneCount);
const remainder = totalFrames - perScene * sceneCount;

const scenes = Array.from({ length: sceneCount }, (_, index) => {
  const id = `scene_${String(index + 1).padStart(2, "0")}`;
  return {
    id,
    order: index,
    // Scene terakhir menyerap sisa frame supaya total tepat.
    durationFrames: perScene + (index === sceneCount - 1 ? remainder : 0),
    image: `images/${id}.png`,
    narration: "",
    subtitles: [],
    visual: {
      prompt: "TODO: tulis prompt visual yang spesifik — lokasi, lensa, lighting, objek",
      locationId: "location_01",
      characterIds: [],
      camera: "push_in",
      shot: "wide",
      lighting: "low_key_fluorescent",
      intensity: 0.5,
      effects: ["film_grain", "vignette", "light_flicker"],
    },
    audio: {
      ambienceId: undefined,
      ambienceVolume: 0.3,
      sfx: [],
    },
  };
});

const episode = {
  episodeId: episodeCode,
  title,
  language: "id-ID",
  category: "fictional_horror",
  format: "found_footage",
  targetFps: FPS,
  width: 1080,
  height: 1920,
  targetDurationSeconds: durationSeconds,
  story: {
    hook: "TODO",
    premise: "TODO",
    twist: "TODO",
    ending: "TODO",
  },
  scenes,
  publishing: {
    title: "TODO",
    description: "TODO — baris pertama harus hook, bukan pengumuman.",
    tags: ["cerita horor", "horor indonesia", "found footage"],
    categoryId: "24",
    privacyStatus: "public",
    selfDeclaredMadeForKids: false,
    syntheticDisclosure: true,
  },
};

async function main() {
  await mkdir(join(episodeDir, "images"), { recursive: true });
  await mkdir(join(episodeDir, "audio", "sfx"), { recursive: true });
  await writeFile(join(episodeDir, "episode.json"), JSON.stringify(episode, null, 2) + "\n", "utf8");

  spawnSync(process.execPath, [join(ROOT, "scripts", "make-overlays.mjs"), "--episode", episodeCode], {
    stdio: "inherit",
  });

  const check = safeParseEpisode(episode);
  if (!check.success) {
    console.error("✖ skeleton gagal validasi (ini bug di script):");
    for (const issue of check.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    process.exit(1);
  }

  console.log(`\n✔ ${episodeId} dibuat di ${episodeDir.replace(ROOT + "/", "")}`);
  console.log("  langkah berikutnya:");
  console.log(`   1. isi ${sceneCount} klip footage/animasi bergerak di video/ dan tetapkan motionVideo per scene`);
  console.log("      Foto diam, pan/zoom, grain, partikel, dan transisi saja tidak lolos gerbang video.");
  console.log("   2. tulis narasi + subtitle (frame-exact) di episode.json");
  console.log(`   3. pnpm validate -- --episode ${episodeId}`);
  console.log(`   4. pnpm render -- --episode ${episodeId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
