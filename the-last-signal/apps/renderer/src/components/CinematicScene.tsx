import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Scene } from "@the-last-signal/contracts";
import { computeCameraTransform } from "../lib/camera";
import { FilmGrain } from "./FilmGrain";
import { LightFlicker } from "./LightFlicker";
import { Scanlines } from "./Scanlines";
import { Vignette } from "./Vignette";

const has = (scene: Scene, effect: string) => scene.visual.effects.includes(effect as never);

/**
 * Satu master image + gerakan kamera + lapisan efek.
 * Inilah yang membedakan "slideshow gambar AI" dari rekaman sinematik.
 */
export const CinematicScene: React.FC<{ scene: Scene; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  // PENTING: useVideoConfig() mengembalikan durasi komposisi (1500 frame),
  // bukan durasi scene. Gerakan kamera harus memakai durasi scene ini sendiri.
  const durationInFrames = scene.durationFrames;
  const intensity = scene.visual.intensity;

  const cam = computeCameraTransform(scene.visual.camera, frame, durationInFrames, intensity);

  // Potongan antar-kamera terasa seperti pindah feed CCTV: frame pertama
  // sedikit "over-exposed", lalu stabil.
  const cutFlash = interpolate(frame, [0, 3], [0.35, 0], {
    extrapolateRight: "clamp",
  });

  // Guncangan tambahan kalau shot ditandai camera_shake.
  const shake = has(scene, "camera_shake") ? Math.sin(frame * 1.9) * 3 * intensity : 0;

  const isCctv = scene.visual.shot === "cctv";

  const filter = [
    isCctv ? "saturate(0.42) contrast(1.16) brightness(0.9)" : "saturate(0.78) contrast(1.1) brightness(0.94)",
    has(scene, "flashlight") ? "brightness(1.02)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <AbsoluteFill style={{ backgroundColor: "#050506", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${cam.translateX + shake}px, ${cam.translateY}px) scale(${cam.scale}) rotate(${cam.rotate}deg)`,
          filter,
        }}
      >
        <Img
          src={staticFile(scene.image)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Color grade dingin khas found footage */}
      <AbsoluteFill
        style={{
          mixBlendMode: "soft-light",
          background: "linear-gradient(160deg, rgba(36,58,74,0.55), rgba(10,10,12,0.35) 60%, rgba(74,52,32,0.35))",
        }}
      />

      {/* Sorot lampu senter (opsional) */}
      {has(scene, "flashlight") ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(circle at ${50 + Math.sin(frame * 0.02) * 8}% ${45 + Math.cos(frame * 0.017) * 6}%, rgba(255,236,196,0.22), rgba(255,236,196,0) 45%)`,
          }}
        />
      ) : null}

      {/* Kabut volumetrik ringan (overlay, bukan volumetric sungguhan) */}
      {has(scene, "volumetric_fog") ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 80%, rgba(160,166,172,${0.10 + 0.03 * Math.sin(frame * 0.05)}), rgba(160,166,172,0) 65%)`,
          }}
        />
      ) : null}

      {has(scene, "light_flicker") ? <LightFlicker intensity={intensity} seed={index * 31} /> : null}
      {has(scene, "vignette") ? <Vignette /> : null}
      {isCctv || has(scene, "scanlines") ? <Scanlines opacity={0.14} /> : null}
      {has(scene, "film_grain") ? <FilmGrain opacity={isCctv ? 0.26 : 0.18} /> : null}

      {/* Kedipan cut */}
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: cutFlash * 0.12 }} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: cutFlash }} />
    </AbsoluteFill>
  );
};
