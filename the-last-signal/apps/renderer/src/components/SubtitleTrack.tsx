import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";
import { sceneOffsets } from "@the-last-signal/contracts";
import { theme } from "../lib/theme";

/**
 * Caption di TENGAH layar, satu sampai tiga kata per kartu.
 *
 * Dua arahan yang membentuk berkas ini:
 *  1. pemilik kanal (2026-11-06): subtitle harus di tengah layar, bukan di bawah;
 *  2. hasil bedah referensi "The true story of the 1876 haunted house":
 *     kartu teks berganti ±0,4 detik dengan satu kata per kartu ("HOUSE",
 *     "YOUTUBERS"), tinggi ±6% tinggi layar, di tengah, putih dengan garis luar
 *     hitam tebal, dan tidak pernah menampilkan kalimat utuh.
 *
 * Karena alignment kita per kalimat (bukan per kata), panjang tiap kata dipakai
 * sebagai bobot waktu: kata panjang mendapat porsi lebih besar. Itu perkiraan
 * yang jujur, dan hasilnya jauh lebih dekat ke irama referensi daripada satu
 * kalimat yang menggantung sepuluh detik.
 */

const TEXT = "#f7f4ec";
const HIGHLIGHT = "#f5c451";
const MAX_CHARS = 16;
const MAX_WORDS = 3;

type Chunk = { words: string[]; start: number; end: number };

const splitWords = (text: string) => text.split(/\s+/).filter((word) => word.length > 0);

export function chunkCue(text: string, durationInFrames: number): Chunk[] {
  const words = splitWords(text);
  const groups: string[][] = [];
  let current: string[] = [];

  for (const word of words) {
    const candidate = [...current, word];
    const tooLong = candidate.join(" ").length > MAX_CHARS;
    if (current.length && (tooLong || candidate.length > MAX_WORDS)) {
      groups.push(current);
      current = [word];
    } else {
      current = candidate;
    }
  }
  if (current.length) groups.push(current);

  const weights = groups.map((group) => Math.max(6, group.join(" ").replace(/[^\p{L}\p{N}]/gu, "").length));
  const total = weights.reduce((sum, value) => sum + value, 0) || 1;
  let cursor = 0;

  return groups.map((group, index) => {
    const start = Math.round((cursor / total) * durationInFrames);
    cursor += weights[index];
    const end = index === groups.length - 1 ? durationInFrames : Math.round((cursor / total) * durationInFrames);
    return { words: group, start, end: Math.max(start + 1, end) };
  });
}

const ChunkCard: React.FC<{ words: string[]; durationInFrames: number; last: boolean }> = ({
  words,
  durationInFrames,
  last,
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const landscape = width > height;
  const geometry = landscape
    ? { size: 62, maxWidth: 1380, padding: "0 96px", stroke: 9 }
    : { size: theme.subtitle.size, maxWidth: 950, padding: "0 40px", stroke: 13 };

  const fade = Math.min(3, Math.max(1, Math.floor(durationInFrames / 4)));
  const opacity = interpolate(
    frame,
    [0, fade, durationInFrames - (last ? fade : 1), durationInFrames],
    [0, 1, 1, last ? 0 : 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pop = spring({ frame, fps, config: { damping: 16, stiffness: 280, mass: 0.5 }, durationInFrames: 8 });
  const scale = 0.92 + 0.08 * Math.min(1, pop);

  // Kata di kartu ini berubah warna berurutan — sisa dari gaya karaoke, dipakai
  // halus supaya kartu tidak terasa mati.
  const wordList = words;
  const weights = wordList.map((word) => Math.max(2, word.replace(/[^\p{L}\p{N}]/gu, "").length));
  const total = weights.reduce((sum, value) => sum + value, 0) || 1;
  const progress = Math.min(0.999, Math.max(0, frame / Math.max(1, durationInFrames - 1)));
  let cursor = 0;
  const activeIndex = wordList.findIndex((_, index) => {
    cursor += weights[index];
    return progress * total <= cursor;
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: geometry.padding }}>
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          maxWidth: geometry.maxWidth,
          textAlign: "center",
          fontFamily: theme.font.sans,
          fontSize: geometry.size,
          lineHeight: 1.05,
          fontWeight: 900,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          WebkitTextStroke: `${geometry.stroke}px rgba(3,3,5,0.96)`,
          paintOrder: "stroke fill" as never,
          textShadow: "0 8px 32px rgba(0,0,0,0.92)",
        }}
      >
        {wordList.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{
              color: index === activeIndex ? HIGHLIGHT : TEXT,
              display: "inline-block",
              marginRight: "0.24em",
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** Satu cue subtitle dipecah menjadi kartu 1–3 kata. */
const Cue: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const chunks = chunkCue(text, durationInFrames);
  return (
    <AbsoluteFill>
      {chunks.map((chunk, index) => (
        <Sequence
          key={`chunk-${index}`}
          from={chunk.start}
          durationInFrames={Math.max(1, chunk.end - chunk.start)}
          name={`caption ${index + 1}`}
        >
          <ChunkCard
            words={chunk.words}
            durationInFrames={Math.max(1, chunk.end - chunk.start)}
            last={index === chunks.length - 1}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/**
 * Subtitle dibangun dari timestamp hasil alignment audio (Phase 3).
 * Untuk sekarang timestamp ditulis eksplisit di episode.json per scene.
 */
export const SubtitleTrack: React.FC<{ episode: ParsedEpisode }> = ({ episode }) => {
  const offsets = sceneOffsets(episode);

  return (
    <AbsoluteFill>
      {episode.scenes.map((scene, sceneIndex) =>
        scene.subtitles.map((cue, cueIndex) => (
          <Sequence
            key={`${scene.id}-cue-${cueIndex}`}
            from={offsets[sceneIndex] + cue.startFrame}
            durationInFrames={cue.endFrame - cue.startFrame}
            name={`subtitle ${scene.id}.${cueIndex + 1}`}
          >
            <Cue text={cue.text} durationInFrames={cue.endFrame - cue.startFrame} />
          </Sequence>
        )),
      )}
    </AbsoluteFill>
  );
};
