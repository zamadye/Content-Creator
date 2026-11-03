import { Easing, interpolate } from "remotion";
import type { CameraMove } from "@the-last-signal/contracts";

export type CameraTransform = {
  scale: number;
  translateX: number;
  translateY: number;
  rotate: number;
};

const ease = Easing.inOut(Easing.sin);

/**
 * Kamera tidak pernah benar-benar diam. Scene "static" tetap mendapat
 * dorongan sangat halus supaya video tidak terasa seperti slideshow.
 */
export function computeCameraTransform(
  camera: CameraMove,
  frame: number,
  durationInFrames: number,
  intensity: number,
): CameraTransform {
  const t = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const amp = 0.4 + intensity * 0.6;

  switch (camera) {
    case "push_in":
      return {
        scale: interpolate(t, [0, 1], [1.02, 1.02 + 0.14 * amp]),
        translateX: 0,
        translateY: interpolate(t, [0, 1], [0, -12 * amp]),
        rotate: 0,
      };
    case "pull_out":
      return {
        scale: interpolate(t, [0, 1], [1.02 + 0.14 * amp, 1.02]),
        translateX: 0,
        translateY: interpolate(t, [0, 1], [-12 * amp, 0]),
        rotate: 0,
      };
    case "pan_left":
      return {
        scale: 1.14 + 0.02 * amp,
        translateX: interpolate(t, [0, 1], [55 * amp, -55 * amp]),
        translateY: 0,
        rotate: 0,
      };
    case "pan_right":
      return {
        scale: 1.14 + 0.02 * amp,
        translateX: interpolate(t, [0, 1], [-55 * amp, 55 * amp]),
        translateY: 0,
        rotate: 0,
      };
    case "handheld": {
      const shake = 1 + intensity * 2.2;
      return {
        scale: 1.06,
        translateX: Math.sin(frame * 0.21) * 5 * shake + Math.sin(frame * 0.07) * 9 * shake,
        translateY: Math.cos(frame * 0.17) * 4 * shake + Math.cos(frame * 0.05) * 7 * shake,
        rotate: Math.sin(frame * 0.09) * 0.25 * shake,
      };
    }
    case "static":
    default:
      return {
        scale: interpolate(t, [0, 1], [1.02, 1.055]),
        translateX: 0,
        translateY: interpolate(t, [0, 1], [4, -4]),
        rotate: 0,
      };
  }
}

/**
 * Flicker lampu fluorescent: gelombang deterministik berbasis frame,
 * bukan Math.random(), supaya render bisa diulang frame-per-frame.
 */
export function flickerAmount(frame: number, intensity: number, seed = 0): number {
  const base = Math.sin((frame + seed) * 0.9) * 0.5 + 0.5;
  const buzz = Math.sin((frame + seed) * 7.3) * 0.08;
  const dropout = (frame + seed) % 97 < 2 ? 0.55 : 0;
  return Math.min(1, Math.max(0, (base * 0.12 + buzz) * intensity * 2 + dropout * intensity));
}
