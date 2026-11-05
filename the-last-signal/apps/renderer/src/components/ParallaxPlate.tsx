import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";

/**
 * Parallax semu tanpa depth map.
 *
 * Depth map asli tidak tersedia di pipeline ini (model segmentasi/depth tidak
 * bisa diunduh dari sandbox), jadi lapisan "dekat" dibentuk dari gambar yang
 * sama: salinan yang sedikit lebih besar, dipotong mask elips lembut di sekitar
 * titik fokus, dan digeser lebih cepat daripada lapisan dasar. Selisih 4–8 px
 * dengan tepi yang di-feather 60% tidak terbaca sebagai gambar ganda; yang
 * terbaca adalah ruang.
 *
 * Kalau suatu saat depth map tersedia, ganti `maskImage` di bawah dengan PNG
 * depth dan sisa komponen ini tetap dipakai.
 */
export const ParallaxPlate: React.FC<{
  src: string;
  /** Titik fokus dalam persen (0–100). */
  focusX?: number;
  focusY?: number;
  /** Kekuatan geser lapisan dekat, px. */
  strength?: number;
  filter?: string;
  style?: React.CSSProperties;
}> = ({ src, focusX = 50, focusY = 52, strength = 7, filter, style }) => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame / 210) * strength;
  const driftY = Math.cos(frame / 260) * strength * 0.6;
  const mask = `radial-gradient(ellipse 46% 52% at ${focusX}% ${focusY}%, #000 42%, rgba(0,0,0,0.55) 68%, transparent 88%)`;

  return (
    <AbsoluteFill style={{ overflow: "hidden", ...style }}>
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover", filter }}
      />
      <AbsoluteFill
        style={{
          transform: `translate(${driftX}px, ${driftY}px) scale(1.045)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{ width: "100%", height: "100%", objectFit: "cover", filter }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
