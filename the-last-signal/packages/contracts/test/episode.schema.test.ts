import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { safeParseEpisode, sceneOffsets, totalFrames } from "../src/episode.schema";

const HERE = dirname(fileURLToPath(import.meta.url));
const EPISODE_PATH = join(HERE, "..", "..", "..", "projects", "episodes", "LS-0001", "episode.json");

const base = () => JSON.parse(readFileSync(EPISODE_PATH, "utf8"));

/** Deep clone lalu terapkan mutasi. */
const mutated = (fn: (episode: any) => void) => {
  const episode = base();
  fn(episode);
  return episode;
};

const issuePaths = (input: unknown) => {
  const result = safeParseEpisode(input);
  assert.equal(result.success, false, "seharusnya gagal validasi");
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
};

test("episode demo LS-0001 valid", () => {
  const result = safeParseEpisode(base());
  assert.equal(result.success, true, JSON.stringify(result.success ? [] : result.error.issues));
});

test("timeline: total frame dan offset scene konsisten", () => {
  const episode = safeParseEpisode(base());
  assert.ok(episode.success);

  const data = episode.data;
  assert.equal(totalFrames(data), 1500);
  assert.deepEqual(sceneOffsets(data), [0, 120, 390, 660, 960, 1260]);
});

test("durasi di luar 40–60 detik ditolak", () => {
  const paths = issuePaths(
    mutated((episode) => {
      // Perpendek semua scene jadi ~5 detik total.
      episode.scenes.forEach((scene: any) => {
        scene.durationFrames = 25;
        scene.subtitles = [];
        scene.audio.sfx = [];
      });
      episode.targetDurationSeconds = 50;
    }),
  );
  assert.ok(paths.includes("scenes"), `path issues: ${paths.join(", ")}`);
});

test("scene order yang tidak berurutan ditolak", () => {
  const paths = issuePaths(
    mutated((episode) => {
      episode.scenes[1].order = 5;
    }),
  );
  assert.ok(paths.some((path) => path.endsWith("order")));
});

test("master image yang dipakai dua scene ditolak", () => {
  const paths = issuePaths(
    mutated((episode) => {
      episode.scenes[1].image = episode.scenes[0].image;
    }),
  );
  assert.ok(paths.some((path) => path.endsWith("image")));
});

test("cue SFX di luar durasi scene ditolak", () => {
  const paths = issuePaths(
    mutated((episode) => {
      episode.scenes[0].audio.sfx[0].startFrame = 999;
    }),
  );
  assert.ok(paths.some((path) => path.includes("startFrame")));
});

test("subtitle overlap ditolak", () => {
  const paths = issuePaths(
    mutated((episode) => {
      episode.scenes[0].subtitles[1].startFrame = 40; // mulai sebelum cue 0 selesai
    }),
  );
  assert.ok(paths.some((path) => path.includes("subtitles")));
});

test("subtitle yang melewati durasi scene ditolak", () => {
  const paths = issuePaths(
    mutated((episode) => {
      episode.scenes[0].subtitles[1].endFrame = 500;
    }),
  );
  assert.ok(paths.some((path) => path.includes("subtitles")));
});

test("synthetic disclosure wajib aktif", () => {
  const paths = issuePaths(
    mutated((episode) => {
      episode.publishing.syntheticDisclosure = false;
    }),
  );
  assert.ok(paths.some((path) => path.includes("syntheticDisclosure")));
});

test("resolusi selain 1080×1920 ditolak", () => {
  const paths = issuePaths(
    mutated((episode) => {
      episode.width = 1920;
    }),
  );
  assert.ok(paths.some((path) => path.includes("width")));
});

test("efek di luar daftar resmi ditolak", () => {
  const paths = issuePaths(
    mutated((episode) => {
      episode.scenes[0].visual.effects.push("lens_flare_3d");
    }),
  );
  assert.ok(paths.some((path) => path.includes("effects")));
});
