import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ParsedEpisode } from "@the-last-signal/contracts";

/**
 * Semua file yang dirujuk episode.json. Satu tempat, supaya render worker dan
 * validator tidak pernah berbeda pendapat soal aset mana yang wajib ada.
 */
export function collectRequiredAssets(episode: ParsedEpisode): string[] {
  const required = new Set<string>();

  for (const scene of episode.scenes) {
    required.add(scene.image);
    if (scene.narrationAudio) required.add(scene.narrationAudio);
    if (scene.audio.ambienceId) required.add(scene.audio.ambienceId);
    for (const cut of scene.cuts) {
      if (cut.image) required.add(cut.image);
    }
    for (const cue of scene.audio.sfx) required.add(cue.assetId);
  }

  if (episode.narrationAudio) required.add(episode.narrationAudio);
  if (episode.score) required.add(episode.score.assetId);

  // Frame 0 = thumbnail kanal. Dulu tidak ikut diperiksa, sehingga validator
  // bilang "aset lengkap" padahal render gagal 404 di tengah jalan
  // (`images/thumb.png` tidak pernah dibuat untuk LL-0002).
  const thumbnailImage = episode.publishing.thumbnail?.image;
  if (thumbnailImage) required.add(thumbnailImage);

  for (const scare of episode.jumpscares) {
    required.add(scare.assetId);
    if (scare.image) required.add(scare.image);
  }

  // Overlay tekstur selalu dipakai komposisi (grain & scanline).
  for (const overlay of [
    "overlays/grain-01.png",
    "overlays/grain-02.png",
    "overlays/grain-03.png",
    "overlays/grain-04.png",
    "overlays/scanlines.png",
  ]) {
    required.add(overlay);
  }

  return [...required];
}

export function findMissingAssets(episode: ParsedEpisode, episodeDir: string): string[] {
  return collectRequiredAssets(episode).filter((path) => !existsSync(join(episodeDir, path)));
}

/** Rata-rata panjang shot (detik) — ukuran kasar "ini slideshow atau bukan". */
export function averageShotLength(episode: ParsedEpisode): number {
  const shots = episode.scenes.reduce((total, scene) => total + 1 + scene.cuts.length, 0);
  const frames = episode.scenes.reduce((total, scene) => total + scene.durationFrames, 0);
  return frames / episode.targetFps / shots;
}
