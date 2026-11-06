import React from "react";
import { AbsoluteFill, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";
import { sceneOffsets } from "@the-last-signal/contracts";
import { theme } from "../lib/theme";

/**
 * Subtitle di TENGAH layar (arahan pemilik kanal, 2026-11-06).
 *
 * Dulu subtitle menempel di bawah dengan satu kalimat utuh berwarna putih.
 * Di layar ponsel, mata penonton Shorts berhenti di tengah — teks di bawah
 * sering tertutup ibu jari dan UI YouTube. Sekarang:
 *
 *  - posisi tengah (50% tinggi), bukan dasar layar,
 *  - huruf jauh lebih besar dengan garis luar tebal supaya tetap terbaca di
 *    atas gambar yang terang,
 *  - kata yang sedang diucapkan menyala kuning; kata yang belum diucapkan
 *    redup. Penonton jadi punya alasan mengikuti teks, bukan hanya mendengar.
 *
 * Penyorotan per kata memakai pembagian rata panjang kata di dalam cue:
 * alignment kita per kalimat, bukan per kata, jadi ini perkiraan yang jujur —
 * kata panjang dapat porsi waktu lebih besar.
 */

const HIGHLIGHT = "#f5c451";
const TEXT = "#f7f4ec";

const splitWords = (text: string) => text.split(/(\s+)/).filter((part) => part.trim().length > 0);

const Cue: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const landscape = width > height;

  // Geometri dua orientasi. Vertikal: teks besar di tengah. Lanskap: sedikit
  // lebih kecil supaya tidak menutupi wajah/adegan di 16:9.
  const geometry = landscape
    ? { size: 58, maxWidth: 1360, padding: "0 96px", stroke: 9 }
    : { size: theme.subtitle.size, maxWidth: 900, padding: "0 44px", stroke: 12 };

  const fade = Math.min(6, Math.floor(durationInFrames / 5));
  const opacity = interpolate(
    frame,
    [0, fade, Math.max(fade + 1, durationInFrames - fade), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const pop = spring({ frame, fps, config: { damping: 18, stiffness: 220, mass: 0.6 }, durationInFrames: 10 });
  const scale = 0.94 + 0.06 * Math.min(1, pop);

  // Kata mana yang sedang diucapkan. Bobot = panjang kata, supaya "kamu" tidak
  // memakan waktu yang sama dengan "memperhatikan".
  const words = splitWords(text);
  const weights = words.map((word) => Math.max(2, word.replace(/[^\p{L}\p{N}]/gu, "").length));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0) || 1;
  const progress = Math.min(0.999, Math.max(0, frame / Math.max(1, durationInFrames - 1)));
  let spokenUntil = progress * totalWeight;
  let activeIndex = 0;
  let running = 0;
  for (let index = 0; index < weights.length; index += 1) {
    running += weights[index];
    if (spokenUntil <= running) {
      activeIndex = index;
      break;
    }
    activeIndex = index;
  }
  let weightCursor = 0;
  const wordProgress = words.map((_, index) => {
    weightCursor += weights[index];
    return weightCursor / totalWeight;
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: geometry.padding,
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          maxWidth: geometry.maxWidth,
          textAlign: "center",
          textWrap: "balance" as never,
          fontFamily: theme.font.sans,
          fontSize: geometry.size,
          lineHeight: 1.18,
          fontWeight: 900,
          letterSpacing: -0.2,
          // Garis luar tebal: satu-satunya cara teks tetap terbaca di atas
          // gambar terang tanpa kotak hitam di belakangnya.
          WebkitTextStroke: `${geometry.stroke}px rgba(4,4,6,0.94)`,
          paintOrder: "stroke fill" as never,
          textShadow: "0 6px 26px rgba(0,0,0,0.85)",
        }}
      >
        {words.map((word, index) => {
          const spoken = progress >= wordProgress[index] - 1e-6;
          const active = index === activeIndex && !spoken;
          return (
            <span
              key={`${word}-${index}`}
              style={{
                color: spoken ? HIGHLIGHT : active ? HIGHLIGHT : TEXT,
                opacity: spoken ? 1 : active ? 1 : 0.82,
                transition: "none",
                marginRight: "0.26em",
                display: "inline-block",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
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
