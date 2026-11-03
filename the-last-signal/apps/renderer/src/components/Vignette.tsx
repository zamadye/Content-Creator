import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

/** Vignette sinematik + sedikit "lens breathing" supaya tepi frame terasa optik. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.85 }) => {
  const frame = useCurrentFrame();
  const breathe = 1 + Math.sin(frame * 0.03) * 0.015;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        background: `radial-gradient(ellipse ${105 * breathe}% ${78 * breathe}% at 50% 47%, rgba(0,0,0,0) 38%, rgba(0,0,0,${0.45 * strength}) 72%, rgba(0,0,0,${0.92 * strength}) 100%)`,
      }}
    />
  );
};
