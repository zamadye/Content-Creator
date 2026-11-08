import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

/**
 * Transisi antar scene. Sebelumnya semua scene disambung dengan cut keras, dan
 * pemilik kanal meminta perpindahan terasa "epik": gambarnya ikut bergerak,
 * bukan cuma berganti.
 *
 * Semua jenis di sini memakai dua gambar nyata (shot terakhir scene keluar dan
 * shot pertama scene masuk), bukan lapisan warna kosong, supaya penonton
 * melihat arah gerak — kiri ke kanan, atas ke bawah, atau dorongan ke dalam.
 * Durasi pendek (10–14 frame): kalau lebih lama, ia jadi tontonan sendiri dan
 * memutus cerita.
 */
export type TransitionKind =
  | "whip_left"
  | "whip_right"
  | "whip_up"
  | "whip_down"
  | "flash_white"
  | "dip_black"
  | "zoom_punch";

export const TRANSITION_KINDS: TransitionKind[] = [
  "whip_left",
  "whip_right",
  "whip_up",
  "whip_down",
  "flash_white",
  "dip_black",
  "zoom_punch",
];

const EASE = Easing.inOut(Easing.cubic);

export const SceneTransition: React.FC<{
  kind: TransitionKind;
  from: string;
  to: string;
  /** Panjang transisi dalam frame (10–14 disarankan). */
  frames: number;
  /** 0..1 — seberapa keras gerakannya. Scene terang cukup 0,6; malam 1. */
  intensity?: number;
}> = ({ kind, from, to, frames, intensity = 1 }) => {
  const frame = useCurrentFrame();
  const last = Math.max(1, frames - 1);
  const p = interpolate(frame, [0, last], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  const blur = (peak: number) => {
    // Puncak blur di tengah, nol di kedua ujung: gambar masuk dan keluar tetap
    // tajam, yang kabur hanya momen perpindahannya.
    const amount = Math.sin(p * Math.PI) * peak * intensity;
    return `blur(${amount.toFixed(2)}px)`;
  };

  const plate = (src: string, style: React.CSSProperties, key: string) => (
    <AbsoluteFill key={key} style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          ...style,
        }}
      />
    </AbsoluteFill>
  );

  switch (kind) {
    case "whip_left":
    case "whip_right": {
      const dir = kind === "whip_left" ? -1 : 1;
      const travel = 68 * intensity;
      return (
        <AbsoluteFill style={{ backgroundColor: "#050506", overflow: "hidden" }}>
          {plate(
            from,
            {
              transform: `translateX(${dir * travel * p}%) scale(${1.06 + 0.08 * p})`,
              filter: blur(26),
              opacity: 1 - p * 0.25,
            },
            "out",
          )}
          {plate(
            to,
            {
              transform: `translateX(${-dir * travel * (1 - p)}%) scale(${1.06 + 0.08 * (1 - p)})`,
              filter: blur(26),
            },
            "in",
          )}
        </AbsoluteFill>
      );
    }
    case "whip_up":
    case "whip_down": {
      const dir = kind === "whip_up" ? -1 : 1;
      const travel = 62 * intensity;
      return (
        <AbsoluteFill style={{ backgroundColor: "#050506", overflow: "hidden" }}>
          {plate(
            from,
            {
              transform: `translateY(${dir * travel * p}%) scale(${1.08 + 0.1 * p})`,
              filter: blur(24),
              opacity: 1 - p * 0.25,
            },
            "out",
          )}
          {plate(
            to,
            {
              transform: `translateY(${-dir * travel * (1 - p)}%) scale(${1.08 + 0.1 * (1 - p)})`,
              filter: blur(24),
            },
            "in",
          )}
        </AbsoluteFill>
      );
    }
    case "zoom_punch": {
      // Dorong ke dalam sampai gambar keluar melampaui bingkai, lalu gambar
      // berikutnya datang dari kedalaman: gerak paling "masuk ke cerita".
      return (
        <AbsoluteFill style={{ backgroundColor: "#050506", overflow: "hidden" }}>
          {plate(
            from,
            {
              transform: `scale(${1 + 0.9 * p})`,
              filter: `${blur(18)} brightness(${1 - 0.55 * p})`,
            },
            "out",
          )}
          {plate(
            to,
            {
              transform: `scale(${1.35 - 0.35 * p})`,
              filter: `${blur(18)} brightness(${0.55 + 0.45 * p})`,
              opacity: Math.min(1, p * 1.6),
            },
            "in",
          )}
        </AbsoluteFill>
      );
    }
    case "flash_white": {
      const flash = Math.sin(p * Math.PI);
      return (
        <AbsoluteFill style={{ backgroundColor: "#050506", overflow: "hidden" }}>
          {plate(from, { transform: `scale(${1.04 + 0.06 * p})`, opacity: 1 - p }, "out")}
          {plate(to, { transform: `scale(${1.04 + 0.06 * (1 - p)})`, opacity: p }, "in")}
          <AbsoluteFill
            style={{
              backgroundColor: "#f6f1e4",
              opacity: Math.min(1, flash * 0.92 * intensity),
              mixBlendMode: "screen",
            }}
          />
        </AbsoluteFill>
      );
    }
    case "dip_black":
    default: {
      // Reda ke hitam lalu naik lagi. Dipakai saat cerita berpindah tempat
      // atau waktu, dan setelah titik reda musik turun.
      const dip = Math.sin(p * Math.PI);
      return (
        <AbsoluteFill style={{ backgroundColor: "#050506", overflow: "hidden" }}>
          {plate(from, { transform: `scale(${1.04 + 0.05 * p})`, opacity: Math.max(0, 1 - p * 1.4) }, "out")}
          {plate(to, { transform: `scale(${1.04 + 0.05 * (1 - p)})`, opacity: Math.max(0, p * 1.4 - 0.4) }, "in")}
          <AbsoluteFill style={{ backgroundColor: "#050506", opacity: Math.min(1, dip * 1.15) }} />
        </AbsoluteFill>
      );
    }
  }
};
