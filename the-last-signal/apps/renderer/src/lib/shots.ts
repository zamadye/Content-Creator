import type { CameraMove, Scene } from "@the-last-signal/contracts";

export type Shot = {
  /** Frame awal (relatif ke scene). */
  from: number;
  duration: number;
  image: string;
  camera: CameraMove;
  /** Zoom framing tambahan (1 = tanpa crop). */
  scale: number;
  offsetX: number;
  offsetY: number;
};

/**
 * Mengubah satu scene + daftar cut menjadi rangkaian shot.
 *
 * Tanpa cut: scene = 1 shot. Dengan cut: satu master image bisa dipakai
 * berulang dengan framing berbeda, sehingga terasa seperti beberapa shot
 * yang diedit, bukan satu gambar yang di-zoom pelan.
 */
export function buildShots(scene: Scene): Shot[] {
  const cuts = [...scene.cuts].sort((a, b) => a.atFrame - b.atFrame);
  const boundaries = [0, ...cuts.map((cut) => cut.atFrame), scene.durationFrames];

  const shots: Shot[] = [];
  let current: Shot = {
    from: 0,
    duration: scene.durationFrames,
    image: scene.image,
    camera: scene.visual.camera,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  };

  for (let index = 0; index < boundaries.length - 1; index++) {
    const from = boundaries[index];
    const to = boundaries[index + 1];
    if (to <= from) continue;

    if (index > 0) {
      const cut = cuts[index - 1];
      current = {
        ...current,
        image: cut.image ?? current.image,
        camera: cut.camera ?? current.camera,
        scale: cut.scale ?? current.scale,
        offsetX: cut.offsetX ?? current.offsetX,
        offsetY: cut.offsetY ?? current.offsetY,
      };
    }

    shots.push({ ...current, from, duration: to - from });
  }

  return shots;
}

/** Shot yang sedang tampil pada frame tertentu (frame relatif ke scene). */
export function shotAt(shots: Shot[], frame: number): Shot {
  for (let index = shots.length - 1; index >= 0; index--) {
    if (frame >= shots[index].from) return shots[index];
  }
  return shots[0];
}

/** Rata-rata panjang shot — dipakai QC untuk mendeteksi "slideshow". */
export function averageShotSeconds(scene: Scene, fps = 30): number {
  return scene.durationFrames / fps / buildShots(scene).length;
}
