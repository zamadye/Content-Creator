import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";
import { sceneOffsets } from "@the-last-signal/contracts";
import { theme } from "../lib/theme";

const Cue: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  // Dua orientasi: 1080×1920 (Short) dan 1920×1080 (video panjang). Angka tema
  // disetel untuk vertikal; untuk 16:9 jarak bawah 300 px terlalu tinggi dan
  // lebar 920 px terlalu sempit, jadi diskalakan di sini, bukan di tema.
  const { width, height } = useVideoConfig();
  const landscape = width > height;
  const geometry = landscape
    ? { bottom: 148, maxWidth: 1380, size: 52 }
    : { bottom: theme.subtitle.bottom, maxWidth: theme.subtitle.maxWidth, size: theme.subtitle.size };
  const fade = Math.min(8, Math.floor(durationInFrames / 4));
  const opacity = interpolate(
    frame,
    [0, fade, Math.max(fade + 1, durationInFrames - fade), durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: geometry.bottom }}>
      <div
        style={{
          opacity,
          maxWidth: geometry.maxWidth,
          textAlign: "center",
          textWrap: "balance" as never,
          fontFamily: theme.font.sans,
          fontSize: geometry.size,
          lineHeight: theme.subtitle.lineHeight,
          fontWeight: 700,
          color: "#f4f1ea",
          letterSpacing: 0.4,
          textShadow: "0 3px 14px rgba(0,0,0,0.95), 0 0 42px rgba(0,0,0,0.75)",
          padding: "0 48px",
        }}
      >
        {text}
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
