import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";

/**
 * Film grain dari 4 tile PNG yang diulang dan digeser tiap frame.
 * Efek visual setara filter turbulence, tapi render puluhan kali lebih cepat
 * karena Chromium hanya perlu menggeser texture yang sudah di-cache.
 */
export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.18 }) => {
  const frame = useCurrentFrame();
  const tile = (frame % 4) + 1;
  const offsetX = (frame * 37) % 512;
  const offsetY = (frame * 91) % 512;
  const fadeIn = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        mixBlendMode: "overlay",
        opacity: opacity * fadeIn,
        backgroundImage: `url(${staticFile(`overlays/grain-0${tile}.png`)})`,
        backgroundRepeat: "repeat",
        backgroundSize: "512px 512px",
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        pointerEvents: "none",
      }}
    />
  );
};
