/**
 * QC visual cepat: render beberapa frame sebagai still PNG tanpa harus
 * merender seluruh video. Dipakai untuk memeriksa komposisi, subtitle,
 * dan pencahayaan per scene sebelum render final.
 *
 * Pemakaian:
 *   tsx scripts/stills.ts --episode LS-0001 --frames 40,220,430,700,1010,1300
 */
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { safeParseEpisode } from "@the-last-signal/contracts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string, fallback?: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode", "LS-0001")!;
const frames = (arg("frames", "30,220,430,700,1010,1300") ?? "")
  .split(",")
  .map((value) => Number(value.trim()))
  .filter((value) => Number.isFinite(value));

const episodeDir = join(ROOT, "projects", "episodes", episodeId);
const outDir = join(ROOT, "renders", "stills", episodeId);

async function main() {
  const raw = JSON.parse(await readFile(join(episodeDir, "episode.json"), "utf8"));
  const parsed = safeParseEpisode(raw);
  if (!parsed.success) {
    throw new Error(`episode tidak valid: ${JSON.stringify(parsed.error.issues)}`);
  }

  const serveUrl = await bundle({
    entryPoint: join(ROOT, "apps", "renderer", "src", "index.ts"),
    publicDir: episodeDir,
  });

  const composition = await selectComposition({
    serveUrl,
    id: "HorrorShort",
    inputProps: { episode: parsed.data },
    browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
  });

  await mkdir(outDir, { recursive: true });

  for (const frame of frames) {
    const output = join(outDir, `frame-${String(frame).padStart(4, "0")}.png`);
    await renderStill({
      composition,
      serveUrl,
      frame,
      output,
      inputProps: { episode: parsed.data },
      browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined,
      chromiumOptions: { gl: "swangle" },
    });
    console.log(`  still ${frame} -> ${output.replace(ROOT + "/", "")}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
