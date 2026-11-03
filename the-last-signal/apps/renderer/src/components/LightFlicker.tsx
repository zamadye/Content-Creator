import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { flickerAmount } from "../lib/camera";

/**
 * Lampu fluorescent yang berkedip: lapisan gelap dengan opacity berosilasi
 * ditambah dropout singkat. Semua deterministik terhadap nomor frame.
 */
export const LightFlicker: React.FC<{ intensity?: number; seed?: number }> = ({
  intensity = 0.5,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const amount = flickerAmount(frame, intensity, seed);
  const dropout = (frame + seed) % 97 < 2 ? 0.6 : 0;

  return (
    <>
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          backgroundColor: "#000",
          opacity: Math.min(0.62, amount * 0.55 + dropout),
        }}
      />
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background:
            "radial-gradient(circle at 50% 30%, rgba(216,166,87,0.10), rgba(216,166,87,0) 60%)",
          opacity: Math.min(0.5, (1 - amount) * 0.4),
          mixBlendMode: "screen",
        }}
      />
    </>
  );
};
