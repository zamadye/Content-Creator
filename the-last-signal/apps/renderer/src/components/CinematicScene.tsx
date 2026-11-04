import React, { useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import type { Scene } from "@the-last-signal/contracts";
import { computeCameraTransform } from "../lib/camera";
import { buildShots, shotAt } from "../lib/shots";
import { FilmGrain } from "./FilmGrain";
import { LightFlicker } from "./LightFlicker";
import { Scanlines } from "./Scanlines";
import { Vignette } from "./Vignette";

const has = (scene: Scene, effect: string) => scene.visual.effects.includes(effect as never);

/**
 * Satu scene = rangkaian shot (lihat lib/shots.ts). Setiap shot punya framing,
 * gerakan kamera, dan "punch" sendiri, sehingga cut terasa disengaja
 * — bukan slideshow dengan zoom pelan.
 */
export const CinematicScene: React.FC<{ scene: Scene; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const intensity = scene.visual.intensity;

  const shots = useMemo(() => buildShots(scene), [scene]);
  const shot = shotAt(shots, frame);
  const localFrame = frame - shot.from;
  const isCctv = scene.visual.shot === "cctv";

  const cam = computeCameraTransform(shot.camera, localFrame, shot.duration, intensity);

  // Punch di awal setiap shot: kamera "mendarat" lalu menetap. Ini yang membuat
  // cut terasa punya berat, bukan potongan gambar datar.
  const punch = interpolate(localFrame, [0, 6], [1.05, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  // Guncangan di 8 frame pertama setelah cut + guncangan handheld yang sudah ada.
  const joltEnvelope = interpolate(localFrame, [0, 8], [1, 0], { extrapolateRight: "clamp" });
  const shakeEffect = has(scene, "camera_shake") ? 1.6 : 0.5;
  const jolt = Math.sin(localFrame * 2.7) * 6 * joltEnvelope * shakeEffect * intensity;

  // Kedipan cut: 2 frame gelap + sedikit over-expose, seperti pindah feed kamera.
  const cutFlash = interpolate(localFrame, [0, 3], [1, 0], { extrapolateRight: "clamp" });

  const filter = isCctv
    ? "saturate(0.42) contrast(1.16) brightness(0.9)"
    : "saturate(0.78) contrast(1.1) brightness(0.94)";

  const scale = cam.scale * punch * shot.scale;

  return (
    <AbsoluteFill style={{ backgroundColor: "#050506", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${cam.translateX + shot.offsetX + jolt}px, ${cam.translateY + shot.offsetY}px) scale(${scale}) rotate(${cam.rotate}deg)`,
          filter,
        }}
      >
        <Img
          src={staticFile(shot.image)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* Color grade dingin khas found footage */}
      <AbsoluteFill
        style={{
          mixBlendMode: "soft-light",
          background:
            "linear-gradient(160deg, rgba(36,58,74,0.55), rgba(10,10,12,0.35) 60%, rgba(74,52,32,0.35))",
        }}
      />

      {has(scene, "flashlight") ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(circle at ${50 + Math.sin(frame * 0.02) * 8}% ${45 + Math.cos(frame * 0.017) * 6}%, rgba(255,236,196,0.22), rgba(255,236,196,0) 45%)`,
          }}
        />
      ) : null}

      {has(scene, "volumetric_fog") ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 80%, rgba(160,166,172,${0.1 + 0.03 * Math.sin(frame * 0.05)}), rgba(160,166,172,0) 65%)`,
          }}
        />
      ) : null}

      {has(scene, "light_flicker") ? <LightFlicker intensity={intensity} seed={index * 31} /> : null}
      {has(scene, "vignette") ? <Vignette /> : null}
      {isCctv || has(scene, "scanlines") ? <Scanlines opacity={0.14} /> : null}
      {has(scene, "film_grain") ? <FilmGrain opacity={isCctv ? 0.2 : 0.14} /> : null}

      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: cutFlash * 0.08 }} />
      <AbsoluteFill style={{ backgroundColor: "#000", opacity: cutFlash * 0.45 }} />
    </AbsoluteFill>
  );
};
