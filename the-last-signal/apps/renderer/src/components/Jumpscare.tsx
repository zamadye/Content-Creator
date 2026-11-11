import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { ParsedEpisode } from "@the-last-signal/contracts";

type Scare = ParsedEpisode["jumpscares"][number];

/**
 * Jump scare yang direncanakan.
 *
 * Urutannya sengaja: (1) kedipan putih 2–3 frame, (2) gambar ancaman masuk
 * dengan zoom burst dan guncangan keras, (3) glitch bar, lalu (4) jatuh ke gelap.
 * Semua meluruh cepat — scare yang bertahan lama berubah jadi komedi.
 */
export const Jumpscare: React.FC<{ scare: Scare }> = ({ scare }) => {
  const frame = useCurrentFrame();
  const decay = Math.exp(-frame / 3.4);

  // Kilatan ditahan 2 frame penuh, baru meluruh — kalau langsung meluruh,
  // di 30fps efeknya nyaris tak terlihat.
  const flashOpacity = frame < 2 ? scare.flash : scare.flash * Math.exp(-(frame - 2) / 1.4);
  const shakeAmp = 46 * scare.shake * decay;
  const translateX = Math.sin(frame * 2.7) * shakeAmp;
  const translateY = Math.cos(frame * 3.3) * shakeAmp * 0.7;
  const zoom = 1 + (scare.zoom - 1) * Math.exp(-frame / 4.5);
  const settle = interpolate(frame, [0, 10, 26], [1, 1, 0], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {scare.motionVideo || scare.image ? (
        <AbsoluteFill
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${zoom})`,
            filter: "saturate(0.55) contrast(1.35) brightness(0.85)",
          }}
        >
          {scare.motionVideo ? (
            <OffthreadVideo
              src={staticFile(scare.motionVideo)}
              muted
              startFrom={0}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : scare.image ? (
            <Img
              src={staticFile(scare.image)}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </AbsoluteFill>
      ) : null}

      {/* Glitch bar: tiga potongan warna yang bergeser di 6 frame pertama */}
      {frame < 7
        ? [0, 1, 2].map((index) => {
            const top = ((frame * 37 + index * 611) % 1700) + 60;
            const height = 18 + ((frame * 13 + index * 29) % 46);
            const shift = Math.sin((frame + index) * 4.1) * 40;
            return (
              <AbsoluteFill
                key={index}
                style={{
                  top,
                  height,
                  transform: `translateX(${shift}px)`,
                  backgroundColor:
                    index === 0 ? "rgba(201,67,58,0.5)" : index === 1 ? "rgba(120,190,190,0.35)" : "rgba(255,255,255,0.25)",
                  mixBlendMode: "screen",
                }}
              />
            );
          })
        : null}

      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: Math.max(0, flashOpacity) }} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: settle * 0.35 }} />
    </AbsoluteFill>
  );
};
