/**
 * Alignment narasi (Phase 3, versi deterministik).
 *
 * Subtitle TIDAK boleh ditebak dari perkiraan durasi kalimat (blueprint §5).
 * Script ini mengukur audio TTS per scene, lalu:
 *   1. menetapkan ulang durationFrames tiap scene = panjang audio + jeda,
 *   2. menyebar cue subtitle secara proporsional terhadap jumlah kata di dalam
 *      window narasi,
 *   3. menulis ulang episode.json (dengan backup) dan memvalidasinya.
 *
 *   tsx scripts/align-narration.ts --episode LS-0001
 *   tsx scripts/align-narration.ts --episode LS-0002 --lead-in 8 --tail 14
 */
import { copyFile, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { EpisodeSchema, safeParseEpisode } from "@the-last-signal/contracts";
import { probeFfmpeg } from "./lib/ffmpeg";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function arg(name: string, fallback?: string) {
  const index = process.argv.indexOf(`--${name}`);
  return index !== -1 ? process.argv[index + 1] : fallback;
}

const episodeId = arg("episode", "LS-0001")!;
// Padding sunyi di ujung scene. 8 Nov 2026: 6/12 → 4/8, sama dengan
// build-episode.mjs. Sepuluh scene dengan 18 frame padding menyumbang 6 detik
// sunyi murni — cukup mendorong episode 55 detik melewati batas 60 detik Shorts,
// dan sunyi di ujung beat memperlambat irama yang sudah dihitung per kata.
const leadIn = Number(arg("lead-in", "4"));
const tailPadding = Number(arg("tail", "8"));
const dryRun = process.argv.includes("--dry-run");

const episodeDir = join(ROOT, "projects", "episodes", episodeId);
const episodePath = join(episodeDir, "episode.json");

function audioDurationSeconds(filePath: string): number {
  const output = probeFfmpeg(["-hide_banner", "-i", filePath]);
  const match = output.match(/Duration:\s(\d+):(\d+):(\d+\.\d+)/);
  if (!match) throw new Error(`durasi audio tidak terbaca: ${filePath}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

/** Bagi window narasi menjadi cue subtitle sebanding jumlah kata. */
function distributeSubtitles(
  cues: { text: string }[],
  startFrame: number,
  endFrame: number,
): { startFrame: number; endFrame: number; text: string }[] {
  const weights = cues.map((cue) => Math.max(1, cue.text.trim().split(/\s+/).length));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const span = endFrame - startFrame;
  let cursor = startFrame;

  return cues.map((cue, index) => {
    const share = Math.round((weights[index] / totalWeight) * span);
    const cueStart = cursor;
    const cueEnd = index === cues.length - 1 ? endFrame : cursor + share;
    cursor = cueEnd;
    return { startFrame: cueStart, endFrame: cueEnd, text: cue.text };
  });
}

async function main() {
  const raw = JSON.parse(await readFile(episodePath, "utf8"));

  // Sebelum alignment, timing subtitle boleh berupa placeholder — jadi validasi
  // struktural saja dulu. Hasil akhirnya tetap divalidasi penuh di bawah.
  const episode = EpisodeSchema.parse(raw);
  const fps = episode.targetFps;
  const missing = episode.scenes.filter((scene) => !scene.narrationAudio);

  if (missing.length > 0) {
    console.error("✖ scene berikut belum punya narrationAudio:");
    for (const scene of missing) console.error(`  - ${scene.id}`);
    process.exit(1);
  }

  let cursor = 0;
  const report: string[] = [];

  const scenes = episode.scenes.map((scene) => {
    const seconds = audioDurationSeconds(join(episodeDir, scene.narrationAudio!));
    const narrationFrames = Math.ceil(seconds * fps);
    const durationFrames = leadIn + narrationFrames + tailPadding;

    const narrationStart = cursor + leadIn;
    const narrationEnd = narrationStart + narrationFrames;

    const subtitles = distributeSubtitles(scene.subtitles, narrationStart, narrationEnd).map((cue) => ({
      ...cue,
      startFrame: cue.startFrame - cursor,
      endFrame: cue.endFrame - cursor,
    }));

    // SFX ikut bergeser: cue yang dulu menandai beat narasi dipetakan ulang
    // secara proporsional terhadap durasi lama → durasi baru.
    const scale = durationFrames / scene.durationFrames;
    const sfx = scene.audio.sfx.map((cue) => ({
      ...cue,
      startFrame: Math.min(durationFrames - 1, Math.round(cue.startFrame * scale)),
    }));

    report.push(
      `  ${scene.id}: audio ${seconds.toFixed(2)}s → scene ${durationFrames} frame (${(durationFrames / fps).toFixed(1)}s)`,
    );

    cursor += durationFrames;

    return {
      ...scene,
      durationFrames,
      subtitles,
      audio: { ...scene.audio, sfx },
      // Ritme cut dipertahankan: posisi cut diskalakan ke durasi scene yang baru.
      cuts: scene.cuts
        .map((cut) => ({
          ...cut,
          atFrame: Math.max(1, Math.min(durationFrames - 1, Math.round(cut.atFrame * scale))),
        }))
        .filter((cut, index, all) => index === 0 || cut.atFrame > all[index - 1].atFrame),
    };
  });

  // Kartu teks ikut diskalakan ke timeline baru.
  const totalOld = episode.scenes.reduce((sum, scene) => sum + scene.durationFrames, 0);
  const totalNew = cursor;
  const onScreenText = episode.onScreenText.map((item) => ({
    text: item.text,
    startFrame: Math.round((item.startFrame / totalOld) * totalNew),
    endFrame: Math.round((item.endFrame / totalOld) * totalNew),
  }));

  // Jumpscare ikut diskalakan: posisi scene yang dipilih tetap, panjang efek
  // dibuat proporsional terhadap scene tempat ia berada. Tanpa ini, setelah
  // audio TTS asli masuk, scare bisa mendarat di tengah kalimat.
  const sceneStarts: number[] = [];
  let acc = 0;
  for (const scene of scenes) {
    sceneStarts.push(acc);
    acc += scene.durationFrames;
  }
  const jumpscares = (episode.jumpscares ?? []).map((scare) => {
    const oldStart = (() => {
      let cursor2 = 0;
      for (const scene of episode.scenes) {
        if (scare.atFrame < cursor2 + scene.durationFrames) return { start: cursor2, index: episode.scenes.indexOf(scene) };
        cursor2 += scene.durationFrames;
      }
      return { start: 0, index: 0 };
    })();
    const oldScene = episode.scenes[oldStart.index];
    const newScene = scenes[oldStart.index];
    const ratio = oldScene ? (scare.atFrame - oldStart.start) / oldScene.durationFrames : 0.6;
    const atFrame = Math.round(sceneStarts[oldStart.index] + ratio * newScene.durationFrames);
    return {
      ...scare,
      atFrame: Math.max(150, Math.min(totalNew - scare.durationFrames - 1, atFrame)),
    };
  });

  const updated = {
    ...raw,
    scenes,
    jumpscares,
    onScreenText,
    targetDurationSeconds: Number((totalNew / fps).toFixed(1)),
  };

  const validated = safeParseEpisode(updated);
  if (!validated.success) {
    console.error("✖ hasil alignment tidak valid:");
    for (const issue of validated.error.issues) console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    process.exit(1);
  }

  console.log(`\nAlignment ${episodeId}: ${(totalOld / fps).toFixed(1)}s → ${(totalNew / fps).toFixed(1)}s\n`);
  for (const line of report) console.log(line);

  if (dryRun) {
    console.log("\n(--dry-run: episode.json tidak diubah)");
    return;
  }

  await copyFile(episodePath, `${episodePath}.bak`);
  await writeFile(episodePath, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.log(`\n✔ episode.json diperbarui (backup: episode.json.bak)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
