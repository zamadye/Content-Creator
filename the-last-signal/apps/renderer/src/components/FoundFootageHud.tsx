import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../lib/theme";

/**
 * Overlay kamera pengawas: REC, identitas kamera, dan timestamp yang
 * benar-benar berjalan. HUD ini bagian dari bahasa visual channel, bukan
 * sekadar dekorasi.
 *
 * Label "ARSIP FIKSI" di sudut kanan bawah DIHAPUS pada 2026-11-06 (arahan
 * pemilik kanal). Pengungkapan konten sintetis tetap ada, tetapi lewat flag
 * platform saat unggah — bukan teks yang menempel di setiap frame.
 */
export const FoundFootageHud: React.FC<{
  cameraLabel?: string;
  startSeconds?: number;
}> = ({ cameraLabel = "CAM 07", startSeconds = 3 * 3600 + 17 * 60 + 4 }) => {
  const frame = useCurrentFrame();
  const totalSeconds = Math.floor(startSeconds + frame / 30);
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  const recVisible = Math.floor(frame / 15) % 2 === 0;

  const textShadow = "0 2px 10px rgba(0,0,0,0.9)";

  return (
    <AbsoluteFill style={{ pointerEvents: "none", fontFamily: theme.font.mono }}>
      {/* Sudut atas: status rekaman */}
      <div
        style={{
          position: "absolute",
          top: 96,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: theme.colors.bone,
          fontSize: theme.hud.labelSize,
          letterSpacing: 4,
          textShadow,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: theme.colors.signal,
              opacity: recVisible ? 1 : 0.15,
              boxShadow: recVisible ? `0 0 18px ${theme.colors.signal}` : "none",
            }}
          />
          <span>REC</span>
        </div>
        <span style={{ opacity: 0.85 }}>{cameraLabel}</span>
      </div>

      {/* Sudut bawah: timestamp */}
      <div
        style={{
          position: "absolute",
          bottom: 96,
          left: 64,
          color: theme.colors.bone,
          fontSize: theme.hud.timestampSize,
          letterSpacing: 5,
          opacity: 0.92,
          textShadow,
        }}
      >
        {`${hh}:${mm}:${ss}`}
        <div style={{ fontSize: 22, letterSpacing: 3, opacity: 0.6, marginTop: 6 }}>
          03 NOV 2026 · SINYAL 42%
        </div>
      </div>

    </AbsoluteFill>
  );
};
