/**
 * Render worker untuk satu episode (Phase 1).
 *
 * Alur: baca episode.json → validasi schema → cek aset → bundle Remotion →
 * render H.264 → tulis laporan render.
 *
 * Tidak ada AI di sini. Ini deterministic execution layer.
 *
 * Pemakaian:
 *   tsx scripts/render.ts --episode LS-0001
 *   tsx scripts/render.ts --episode LS-0001 --crf 18 --concurrency 2
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { safeParseEpisode, totalFrames } from "@the-last-signal/contracts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string, fallback?: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode", "LS-0001")!;
const crf = Number(arg("crf", "20"));
/** Draft render: skala < 1 untuk QC cepat, final selalu skala 1. */
const scale = Number(arg("scale", "1"));
/** Render sebagian timeline (mis. --frames 0-59) untuk uji visual cepat. */
const frameRange = arg("frames");
const framesOption = frameRange
  ? (() => {
      const [start, end] = frameRange.split("-").map(Number);
      return [start, end] as [number, number];
    })()
  : null;
const frameRangeTuple = framesOption;
const concurrency = Number(arg("concurrency", "2"));
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE || undefined;

const episodeDir = join(ROOT, "projects", "episodes", episodeId);
const entryPoint = join(ROOT, "apps", "renderer", "src", "index.ts");
const outDir = join(ROOT, "renders");
const outFile = join(
  outDir,
  `${episodeId}${scale !== 1 ? `-draft-x${scale}` : ""}${framesOption ? `-f${framesOption[0]}-${framesOption[1]}` : ""}.mp4`,
);

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

async function main() {
  const startedAt = Date.now();

  // 1. Baca + validasi kontrak episode
  const raw = JSON.parse(await readFile(join(episodeDir, "episode.json"), "utf8"));
  const parsed = safeParseEpisode(raw);
  if (!parsed.success) {
    console.error("✖ episode.json tidak lolos validasi:\n");
    for (const issue of parsed.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }
  const episode = parsed.data;
  const frames = totalFrames(episode);
  console.log(
    `▶ ${episode.episodeId} · "${episode.title}" · ${episode.scenes.length} scene · ${frames} frame · ${(frames / episode.targetFps).toFixed(1)}s`,
  );

  // 2. Pastikan semua aset yang dirujuk benar-benar ada
  const required = [
    ...episode.scenes.map((s) => s.image),
    ...episode.scenes.flatMap((s) => s.audio.sfx.map((c) => c.assetId)),
    ...episode.scenes.flatMap((s) => (s.audio.ambienceId ? [s.audio.ambienceId] : [])),
    ...(episode.narrationAudio ? [episode.narrationAudio] : []),
  ];
  const missing = [...new Set(required)].filter((p) => !existsSync(join(episodeDir, p)));
  if (missing.length > 0) {
    fail(`aset hilang di ${episodeDir}:\n  - ${missing.join("\n  - ")}`);
  }

  // 3. Bundle Remotion sekali, lalu render
  console.log("▶ bundling renderer …");
  const serveUrl = await bundle({
    entryPoint,
    publicDir: episodeDir, // aset episode disajikan lewat staticFile()
    onProgress: (percent) => {
      if (percent % 25 === 0) console.log(`  bundle ${percent}%`);
    },
  });

  const composition = await selectComposition({
    serveUrl,
    id: "HorrorShort",
    inputProps: { episode },
    browserExecutable,
  });
  console.log(
    `▶ composition: ${composition.width}×${composition.height} @ ${composition.fps}fps · ${composition.durationInFrames} frame`,
  );

  await mkdir(outDir, { recursive: true });
  let lastLogged = -1;

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    audioCodec: "aac",
    outputLocation: outFile,
    inputProps: { episode },
    crf: Math.round(crf),
    concurrency,
    scale,
    frameRange: frameRangeTuple,
    browserExecutable,
    chromiumOptions: { gl: "swangle" },
    onProgress: ({ progress, renderedFrames }) => {
      const percent = Math.floor(progress * 100);
      if (percent >= lastLogged + 10) {
        lastLogged = percent;
        console.log(`  render ${percent}% (${renderedFrames}/${composition.durationInFrames} frame)`);
      }
    },
  });

  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  const report = {
    episodeId: episode.episodeId,
    output: outFile.replace(ROOT + "/", ""),
    width: composition.width,
    height: composition.height,
    fps: composition.fps,
    durationFrames: composition.durationInFrames,
    durationSeconds: composition.durationInFrames / composition.fps,
    crf: Math.round(crf),
    concurrency,
    scale,
    frameRange: frameRangeTuple,
    renderSeconds: Number(elapsed),
    renderedAt: new Date().toISOString(),
  };

  await writeFile(join(episodeDir, "reports", "render.json"), JSON.stringify(report, null, 2), "utf8").catch(
    async () => {
      await mkdir(join(episodeDir, "reports"), { recursive: true });
      await writeFile(join(episodeDir, "reports", "render.json"), JSON.stringify(report, null, 2), "utf8");
    },
  );

  console.log(`\n✔ selesai dalam ${elapsed}s → ${report.output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
