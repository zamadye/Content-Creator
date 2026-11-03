import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";

/** Scanline CCTV + band rollover lambat, memakai tile 8×8 px yang diulang. */
export const Scanlines: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => {
  const frame = useCurrentFrame();
  const roll = (frame * 1.7) % 1920;

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          opacity,
          backgroundImage: `url(${staticFile("overlays/scanlines.png")})`,
          backgroundRepeat: "repeat",
          backgroundSize: "8px 8px",
        }}
      />
      <AbsoluteFill
        style={{
          opacity: opacity * 0.5,
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 55%, rgba(255,255,255,0) 100%)",
          height: 260,
          transform: `translateY(${roll - 260}px)`,
        }}
      />
    </AbsoluteFill>
  );
};
