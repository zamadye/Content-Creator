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
  const expectedTotal = data.scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);
  assert.equal(totalFrames(data), expectedTotal);

  // Offset scene = akumulasi durasi scene sebelumnya, bukan angka hafalan.
  let cursor = 0;
  const expectedOffsets = data.scenes.map((scene) => {
    const offset = cursor;
    cursor += scene.durationFrames;
    return offset;
  });
  assert.deepEqual(sceneOffsets(data), expectedOffsets);
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


// ---------------------------------------------------------------------------
// Kontrak yang sebelumnya tidak diuji: cut, kartu teks, narasi per scene,
// skor musik, dan jump scare. Semuanya bisa membuat render gagal atau merusak
// ritme kalau lolos tanpa validasi.
// ---------------------------------------------------------------------------

test("cut harus naik dan berada di dalam durasi scene", () => {
  const episode = base();
  const scene = episode.scenes[0];
  scene.cuts = [
    { atFrame: 50, camera: "push_in" },
    { atFrame: 20, camera: "handheld" },
  ];
  assert.ok(issuePaths(episode).some((path) => path.includes("cuts")));
});

test("cut di luar durasi scene ditolak", () => {
  const episode = base();
  episode.scenes[0].cuts = [{ atFrame: episode.scenes[0].durationFrames + 5, camera: "static" }];
  assert.ok(issuePaths(episode).some((path) => path.includes("cuts")));
});

test("kartu teks harus punya rentang waktu yang masuk akal", () => {
  const episode = base();
  episode.onScreenText = [{ text: "TERLAMBAT", startFrame: 400, endFrame: 400 }];
  assert.ok(issuePaths(episode).includes("onScreenText.0"));
});

test("kartu teks tidak boleh melewati akhir episode", () => {
  const episode = base();
  episode.onScreenText = [{ text: "TERLAMBAT", startFrame: 10, endFrame: 999999 }];
  assert.ok(issuePaths(episode).includes("onScreenText.0"));
});

test("narrationAudio tanpa teks narasi ditolak (alignment mustahil)", () => {
  const episode = base();
  episode.narrationAudio = "audio/narration/full.mp3";
  episode.scenes[2].narration = "";
  assert.ok(issuePaths(episode).includes("narrationAudio"));
});

test("skor musik: volume di luar 0–1 ditolak", () => {
  const episode = base();
  episode.score = { assetId: "audio/score.wav", volume: 1.4 };
  assert.ok(issuePaths(episode).some((path) => path.startsWith("score")));
});

test("jumpscare terlalu awal (di bawah detik ke-5) ditolak", () => {
  const episode = base();
  episode.jumpscares = [
    { atFrame: 60, assetId: "audio/sfx/scare.wav", durationFrames: 14 },
  ];
  assert.ok(issuePaths(episode).some((path) => path.startsWith("jumpscares")));
});

test("jumpscare berurutan wajib naik", () => {
  const episode = base();
  episode.jumpscares = [
    { atFrame: 600, assetId: "audio/sfx/scare.wav", durationFrames: 14 },
    { atFrame: 400, assetId: "audio/sfx/scare.wav", durationFrames: 14 },
  ];
  assert.ok(issuePaths(episode).some((path) => path.startsWith("jumpscares")));
});

test("jumpscare yang melewati akhir episode ditolak", () => {
  const episode = base();
  const total = episode.scenes.reduce((sum: number, scene: any) => sum + scene.durationFrames, 0);
  episode.jumpscares = [
    { atFrame: total - 4, assetId: "audio/sfx/scare.wav", durationFrames: 20 },
  ];
  assert.ok(issuePaths(episode).some((path) => path.startsWith("jumpscares")));
});

test("semua episode di projects/episodes lolos kontrak", async () => {
  const { readdirSync, existsSync } = await import("node:fs");
  const episodesDir = join(HERE, "..", "..", "..", "projects", "episodes");
  const ids = readdirSync(episodesDir).filter((entry) =>
    existsSync(join(episodesDir, entry, "episode.json")),
  );
  assert.ok(ids.length > 0, "harus ada minimal satu episode");
  for (const id of ids) {
    const data = JSON.parse(readFileSync(join(episodesDir, id, "episode.json"), "utf8"));
    const result = safeParseEpisode(data);
    assert.equal(
      result.success,
      true,
      `${id}: ${result.success ? "" : JSON.stringify(result.error.issues.slice(0, 3))}`,
    );
  }
});
