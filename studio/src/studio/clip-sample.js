/**
 * Pemutar klip satu-lapis, pengganti `THREE.AnimationMixer`.
 *
 * Kenapa tidak pakai mixer: Remotion merender frame dalam urutan acak dan
 * beberapa frame sekaligus, jadi pose seekor aktor **harus** hanya fungsi dari
 * waktu lokal shot. `AnimationMixer.setTime()` tidak memenuhi itu — ia menyimpan
 * `loopCount` dan waktu aksi, sehingga hasil untuk waktu yang sama bergantung
 * pada urutan pemanggilan sebelumnya. Diukur di
 * `scripts/test-studio-three.mjs`: `walk` menyimpang sampai 13,8 cm antara
 * "langsung ke t=2,0" dan "melangkah 120 frame lalu ke t=2,0". `update(0)` juga
 * tidak bisa dipakai karena three melewati penulisan pose saat delta = 0.
 *
 * Yang kita butuhkan jauh lebih kecil dari mixer: satu klip, tanpa fade, tanpa
 * bobot, tanpa pencampuran. Jadi evaluasi interpolant-nya sendiri, tulis hasilnya
 * ke node, selesai. Hasilnya deterministik menurut konstruksi.
 */
const localName = (name) => String(name).replace(/[.[\]:/ ]/g, '');

/**
 * @param {import('three').Object3D} root
 * @param {import('three').AnimationClip} clip
 */
export function createClipSampler(root, clip) {
  const byName = new Map();
  root.traverse((o) => {
    if (o.name) byName.set(o.name, o);
  });

  const channels = [];
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.');
    const nodeName = track.name.slice(0, dot);
    const prop = track.name.slice(dot + 1);
    const node = byName.get(nodeName) ?? byName.get(localName(nodeName)) ?? null;
    if (!node) continue;
    if (prop !== 'quaternion' && prop !== 'position' && prop !== 'scale') continue;
    const size = track.getValueSize();
    const buffer = new Float32Array(size);
    channels.push({node, prop, interpolant: track.createInterpolant(buffer), buffer});
  }

  const duration = clip.duration > 0 ? clip.duration : 1;

  return {
    clip: clip.name,
    duration,
    channels: channels.length,
    /** Nama node yang ditulis klip; dipakai lapisan gerak sekunder. */
    animatedNodes: new Set(channels.map((c) => c.node.name)),
    /**
     * Node yang **skalanya** ditulis klip. Dipisah dari `animatedNodes` karena
     * lapisan hidup mengalikan skala wajah: kalau node-nya hanya dianimasikan
     * rotasinya, pengali akan menumpuk tiap frame dan kelopak mata menyusut
     * sampai mata tertutup permanen (bug yang tertangkap `qc-life`).
     */
    scaleNodes: new Set(channels.filter((c) => c.prop === 'scale').map((c) => c.node.name)),
    /**
     * Tulis pose pada detik ke-`seconds` (boleh di luar 0..duration; diputar
     * ulang seperti animasi berulang).
     */
    apply(seconds) {
      const t = ((seconds % duration) + duration) % duration;
      for (const c of channels) {
        c.interpolant.evaluate(t);
        if (c.prop === 'quaternion') c.node.quaternion.fromArray(c.buffer).normalize();
        else if (c.prop === 'position') c.node.position.fromArray(c.buffer);
        else c.node.scale.fromArray(c.buffer);
      }
    },
  };
}
