/**
 * Validator mandiri: dipakai sebelum render, sebelum upload, dan oleh CI.
 * Exit code 1 kalau ada pelanggaran kontrak.
 */
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { safeParseEpisode, totalFrames } from "@the-last-signal/contracts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const episodeId = (() => {
  const index = process.argv.indexOf("--episode");
  return index !== -1 ? process.argv[index + 1] : "LS-0001";
})();

const episodeDir = join(ROOT, "projects", "episodes", episodeId);

async function main() {
  const raw = JSON.parse(await readFile(join(episodeDir, "episode.json"), "utf8"));
  const result = safeParseEpisode(raw);

  if (!result.success) {
    console.error(`✖ ${episodeId} gagal validasi (${result.error.issues.length} masalah)\n`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".") || "<root>"}: ${issue.message}`);
    }
    process.exit(1);
  }

  const episode = result.data;
  const frames = totalFrames(episode);
  const missing = [
    ...episode.scenes.map((s) => s.image),
    ...episode.scenes.flatMap((s) => s.audio.sfx.map((c) => c.assetId)),
    ...episode.scenes.flatMap((s) => (s.audio.ambienceId ? [s.audio.ambienceId] : [])),
  ].filter((p) => !existsSync(join(episodeDir, p)));

  console.log(`✔ ${episode.episodeId} — ${episode.title}`);
  console.log(`  scene      : ${episode.scenes.length}`);
  console.log(`  durasi     : ${frames} frame / ${(frames / episode.targetFps).toFixed(1)}s`);
  console.log(`  resolusi   : ${episode.width}×${episode.height} @ ${episode.targetFps}fps`);
  console.log(`  subtitle   : ${episode.scenes.reduce((n, s) => n + s.subtitles.length, 0)} cue`);
  console.log(`  sfx        : ${episode.scenes.reduce((n, s) => n + s.audio.sfx.length, 0)} cue`);
  console.log(`  disclosure : ${episode.publishing.syntheticDisclosure ? "aktif" : "TIDAK AKTIF"}`);

  if (missing.length > 0) {
    console.error(`\n✖ aset belum tersedia:\n  - ${missing.join("\n  - ")}`);
    process.exit(1);
  }
  console.log("  aset       : lengkap");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
