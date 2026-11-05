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
 *
 * Format panjang mengubah masalahnya: satu gambar bertahan 6–10 detik dan
 * penonton menonton sembilan menit. Dorongan 1,02 → 1,055 yang cukup untuk
 * Shorts 4 detik di sini terbaca sebagai gambar mati, jadi:
 *   1. amplitudo naik seiring panjang shot (shot panjang butuh gerak lebih besar),
 *   2. ada napas kamera (breath) di semua gerakan — dua osilasi lambat yang
 *      tidak pernah berulang tepat, sehingga frame tidak pernah identik,
 *   3. kosakata gerak ditambah (dolly, arc, tilt, drift) supaya dua shot
 *      berurutan dari gambar yang sama tidak terlihat seperti salinan.
 */
export function computeCameraTransform(
  camera: CameraMove,
  frame: number,
  durationInFrames: number,
  intensity: number,
  seed = 0,
): CameraTransform {
  const t = interpolate(frame, [0, Math.max(1, durationInFrames - 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  // Shot 3 detik: 0,75×. Shot 8 detik: 1,15×. Shot 20 detik: 1,6× (batas atas).
  const lengthGain = Math.min(1.6, Math.max(0.75, Math.sqrt(durationInFrames / 170)));
  const amp = (0.4 + intensity * 0.6) * lengthGain;

  // Napas: periode 11 detik dan 6,4 detik, fase digeser seed supaya tiap shot
  // berbeda tanpa Math.random (render harus deterministik).
  const phase = seed * 1.7;
  const breathX = Math.sin(frame / 330 + phase) * 1.8 + Math.sin(frame / 190 + phase * 2) * 0.9;
  const breathY = Math.cos(frame / 300 + phase) * 1.6 + Math.cos(frame / 210 + phase * 3) * 0.8;
  const breathScale = 1 + Math.sin(frame / 260 + phase) * 0.0022;
  const breathRotate = Math.sin(frame / 420 + phase) * 0.06;

  const withBreath = (transform: CameraTransform): CameraTransform => ({
    scale: transform.scale * breathScale,
    translateX: transform.translateX + breathX,
    translateY: transform.translateY + breathY,
    rotate: transform.rotate + breathRotate,
  });

  const move = (): CameraTransform => {
    switch (camera) {
      case "push_in":
        return {
          scale: interpolate(t, [0, 1], [1.02, 1.02 + 0.16 * amp]),
          translateX: 0,
          translateY: interpolate(t, [0, 1], [0, -14 * amp]),
          rotate: 0,
        };
      case "pull_out":
        return {
          scale: interpolate(t, [0, 1], [1.02 + 0.16 * amp, 1.02]),
          translateX: 0,
          translateY: interpolate(t, [0, 1], [-14 * amp, 0]),
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
        // Goyangan naik-turun napas kamera tangan: dua frekuensi lambat + satu
        // frekuensi cepat, supaya gerak terasa organik, bukan osilasi mesin.
        const shake = 1 + intensity * 3.2;
        return {
          scale: 1.07,
          translateX: Math.sin(frame * 0.21) * 6 * shake + Math.sin(frame * 0.07) * 11 * shake,
          translateY: Math.cos(frame * 0.17) * 5 * shake + Math.cos(frame * 0.05) * 9 * shake,
          rotate: Math.sin(frame * 0.09) * 0.35 * shake,
        };
      }
      // Dolly: maju/mundur tanpa mengubah sumbu pandang, dengan rotasi kecil.
      // Terbaca seperti kamera yang dipasang di dolly, bukan zoom digital.
      case "dolly_in":
        return {
          scale: interpolate(t, [0, 1], [1.0, 1.0 + 0.22 * amp]),
          translateX: interpolate(t, [0, 1], [0, 8 * amp]),
          translateY: interpolate(t, [0, 1], [0, -10 * amp]),
          rotate: interpolate(t, [0, 1], [0.15, -0.15]),
        };
      case "dolly_out":
        return {
          scale: interpolate(t, [0, 1], [1.0 + 0.22 * amp, 1.0]),
          translateX: interpolate(t, [0, 1], [8 * amp, 0]),
          translateY: interpolate(t, [0, 1], [-10 * amp, 0]),
          rotate: interpolate(t, [0, 1], [-0.15, 0.15]),
        };
      // Arc: kamera menyusur setengah lingkaran tipis di depan subjek.
      case "arc_left":
        return {
          scale: 1.16 + 0.03 * amp,
          translateX: interpolate(t, [0, 1], [48 * amp, -18 * amp]),
          translateY: interpolate(t, [0, 1], [10 * amp, -6 * amp]),
          rotate: interpolate(t, [0, 1], [0.5 * amp, -0.5 * amp]),
        };
      case "arc_right":
        return {
          scale: 1.16 + 0.03 * amp,
          translateX: interpolate(t, [0, 1], [-48 * amp, 18 * amp]),
          translateY: interpolate(t, [0, 1], [10 * amp, -6 * amp]),
          rotate: interpolate(t, [0, 1], [-0.5 * amp, 0.5 * amp]),
        };
      case "tilt_up":
        return {
          scale: 1.18 + 0.02 * amp,
          translateX: 0,
          translateY: interpolate(t, [0, 1], [60 * amp, -30 * amp]),
          rotate: interpolate(t, [0, 1], [0.4, -0.2]),
        };
      case "tilt_down":
        return {
          scale: 1.18 + 0.02 * amp,
          translateX: 0,
          translateY: interpolate(t, [0, 1], [-30 * amp, 60 * amp]),
          rotate: interpolate(t, [0, 1], [-0.4, 0.2]),
        };
      // Drift: kamera mengambang diagonal, seperti tripod yang tidak dikunci.
      case "drift":
        return {
          scale: 1.1 + 0.02 * amp,
          translateX: interpolate(t, [0, 1], [-30 * amp, 30 * amp]) + Math.sin(frame / 150) * 4,
          translateY: interpolate(t, [0, 1], [22 * amp, -22 * amp]) + Math.cos(frame / 137) * 3,
          rotate: interpolate(t, [0, 1], [0.3, -0.3]),
        };
      case "static":
      default:
        return {
          scale: interpolate(t, [0, 1], [1.02, 1.02 + 0.09 * amp]),
          translateX: 0,
          translateY: interpolate(t, [0, 1], [6, -6]),
          rotate: 0,
        };
    }
  };

  return withBreath(move());
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
