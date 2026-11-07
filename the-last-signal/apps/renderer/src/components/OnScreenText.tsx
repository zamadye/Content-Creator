import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";
import { theme } from "../lib/theme";

/**
 * Ukuran kartu mengikuti panjang teks, bukan angka tetap.
 *
 * Dengan 96 px, kartu dan subtitle hampir sama besar — hierarki hilang dan
 * frame pertama terasa penuh. Kartu sekarang DIDAHULUKAN (132–150 px), tapi
 * teks panjang tidak boleh membengkak jadi empat baris dan menutupi gambar:
 * 2–3 kata pendek dapat huruf terbesar, 5 kata dapat yang lebih kecil.
 */
const hookSize = (text: string): number => {
  const characters = text.length;
  if (characters <= 13) return 150;
  if (characters <= 20) return 124;
  return 104;
};

/**
 * Kartu teks 2–3 kata sebagai "tanda baca" ritme cerita.
 * Bukan subtitle: tujuannya menghentikan swipe dan menandai beat baru.
 */
const HookCard: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, 7], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const exit = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(enter, [0, 1], [1.14, 1]);
  const shake = Math.sin(frame * 3.1) * (1 - enter) * 5;

  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 430 }}>
      <div
        style={{
          opacity: Math.min(enter, exit),
          transform: `translateX(${shake}px) scale(${scale})`,
          fontFamily: theme.font.sans,
          fontWeight: 900,
          fontSize: hookSize(text),
          lineHeight: 1.02,
          letterSpacing: 1,
          textAlign: "center",
          textTransform: "uppercase",
          color: "#f5f1e6",
          padding: "0 56px",
          // Garis tepi gelap: kartu harus terbaca di atas foto apa pun.
          WebkitTextStroke: "9px rgba(3,3,5,0.92)",
          paintOrder: "stroke fill" as never,
          textShadow: "0 6px 26px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.8)",
        }}
      >
        {text}
      </div>
      <div
        style={{
          opacity: Math.min(enter, exit) * 0.9,
          marginTop: 22,
          width: 120,
          height: 3,
          backgroundColor: theme.colors.signal,
        }}
      />
    </AbsoluteFill>
  );
};

export const OnScreenTextTrack: React.FC<{ episode: ParsedEpisode }> = ({ episode }) => {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {episode.onScreenText.map((item, index) => (
        <Sequence
          key={`hook-${index}`}
          from={item.startFrame}
          durationInFrames={item.endFrame - item.startFrame}
          name={`hook ${index + 1}: ${item.text}`}
        >
          <HookCard text={item.text} durationInFrames={item.endFrame - item.startFrame} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
