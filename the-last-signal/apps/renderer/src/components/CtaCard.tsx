import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../lib/theme";

/**
 * Ajakan bertindak di ekor cerita.
 *
 * Kenapa di sini dan bukan di awal: penonton Shorts memutuskan bertahan atau
 * menggeser dalam 3 detik pertama, jadi detik-detik itu dipakai untuk klaim
 * cerita, bukan permintaan. Ajakan masuk setelah payoff — saat penonton masih
 * menahan napas — dan kalimatnya sudah diucapkan narasi, jadi kartu ini
 * mengulang apa yang baru didengar, bukan menambah beban baca.
 *
 * Tiga tombol saja, satu yang menyala. Terlalu banyak tombol membuat tidak ada
 * yang ditekan.
 */
export const CtaCard: React.FC<{ line: string; durationInFrames: number }> = ({
  line,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  // Masuk cepat (6 frame) supaya tidak "muncul pelan-pelan" seperti transisi,
  // lalu tetap diam sampai kartu penutup mengambil alih.
  const appear = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const rise = interpolate(frame, [0, 10], [26, 0], { extrapolateRight: "clamp" });
  const pulse = 1 + Math.sin((frame / durationInFrames) * Math.PI * 2) * 0.012;

  const pill = (label: string, active: boolean): React.ReactNode => (
    <div
      key={label}
      style={{
        padding: "14px 30px",
        borderRadius: 999,
        fontFamily: theme.font.sans,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: 2,
        backgroundColor: active ? theme.colors.signal : "rgba(11,12,14,0.62)",
        color: active ? theme.colors.bone : theme.colors.fog,
        border: active ? "2px solid rgba(231,227,218,0.35)" : "2px solid rgba(141,146,152,0.25)",
      }}
    >
      {label}
    </div>
  );

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 220 }}>
      <div
        style={{
          opacity: appear,
          transform: `translateY(${rise}px) scale(${pulse})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          width: width - 170,
        }}
      >
        <div
          style={{
            fontFamily: theme.font.sans,
            fontWeight: 700,
            fontSize: 38,
            lineHeight: 1.3,
            letterSpacing: 1,
            textAlign: "center",
            color: theme.colors.bone,
            textShadow: "0 2px 18px rgba(0,0,0,0.95)",
          }}
        >
          {line}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {pill("SUBSCRIBE", true)}
          {pill("LIKE", false)}
          {pill("KOMENTAR", false)}
        </div>
      </div>
    </AbsoluteFill>
  );
};
