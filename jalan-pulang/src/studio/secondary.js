/**
 * Gerak sekunder prosedural.
 *
 * Klip di rig `studio-humanoid-v1` cuma punya satu lapis gerak: tulang punggung
 * dan lengan mengikuti kurva yang dibangkitkan `human.py`. Tubuh manusia tidak
 * begitu — kepala dan tangan selalu datang **terlambat** dari dada, dan dada
 * selalu naik-turun sedikit karena napas. Berkas ini menambahkan lapisan itu di
 * atas klip, tanpa menyentuh GLB, tanpa state, tanpa simulasi.
 *
 * Kenapa fungsi murni: Remotion merender frame secara acak dan paralel. Setiap
 * frame harus bisa dihitung sendiri dari waktu lokal shot. Jadi tidak ada
 * integrator atau pegas yang menyimpan keadaan — yang ada fase sinus dengan
 * keterlambatan tetap per tulang, yaitu bentuk analitik dari "massa yang
 * ditarik pegas" pada gerak periodik.
 *
 * Statusnya jujur: ini **bukan** simulasi kain/fisika (langkah 40 masih ⛔).
 * Ini overlap/follow-through (langkah 38) yang ditambahkan tangan.
 */

/** Klip yang punya irama langkah, beserta besar ayunan relatifnya. */
const GAIT = {
  walk: 1,
  run: 1.9,
};

/**
 * Tulang yang ikut bergerak sekunder, dengan gain relatif terhadap amplitudo
 * ayunan dasar. `lag` = keterlambatan dalam detik (makin ke ujung rantai makin
 * lambat, itu yang membuat gerak terlihat "berat"). `counter` = putaran balik
 * supaya pandangan tetap datar walau dada bergoyang.
 */
const CHAIN = [
  {bone: 'spine02', axis: 'z', gain: 1, lag: 0.0},
  {bone: 'spine03', axis: 'z', gain: 0.8, lag: 0.02},
  {bone: 'spine04', axis: 'z', gain: 0.6, lag: 0.04},
  {bone: 'neck02', axis: 'z', gain: -0.45, lag: 0.08},
  {bone: 'head', axis: 'z', gain: -0.25, lag: 0.11},
  {bone: 'upperarm01.L', axis: 'x', gain: 0.5, lag: 0.06},
  {bone: 'upperarm01.R', axis: 'x', gain: 0.5, lag: 0.06},
  {bone: 'lowerarm01.L', axis: 'x', gain: 0.8, lag: 0.12},
  {bone: 'lowerarm01.R', axis: 'x', gain: 0.8, lag: 0.12},
];

/** Ayunan dasar langkah (radian, sebelum dikali gain). */
const SWAY = 0.022;

/** Napas: satu tarikan tiap ~3,6 detik. Berlaku untuk semua klip. */
const BREATH_PERIOD = 3.6;
const BREATH = [
  {bone: 'spine03', axis: 'x', gain: 0.35},
  {bone: 'spine04', axis: 'x', gain: 0.55},
  {bone: 'clavicle.L', axis: 'z', gain: 0.3},
  {bone: 'clavicle.R', axis: 'z', gain: -0.3},
  {bone: 'neck02', axis: 'x', gain: -0.25},
];
const BREATH_AMP = 0.011;

/** Goyangan berat badan yang sangat lambat, bikin diam tidak terlihat kaku. */
const DRIFT_PERIOD = 7.3;
const DRIFT = [
  {bone: 'spine01', axis: 'x', gain: 0.6},
  {bone: 'head', axis: 'y', gain: 0.5},
];
const DRIFT_AMP = 0.006;

/**
 * Daftar gerak sekunder pada detik lokal shot.
 *
 * @param {number} seconds  waktu lokal shot (detik)
 * @param {object} p
 * @param {string} [p.clip]      nama klip yang sedang diputar
 * @param {number} [p.duration]  durasi satu siklus klip (detik), dari AnimationClip
 * @param {number} [p.speed]     kecepatan putar klip
 * @param {number} [p.intensity] 0 = mati, 1 = normal, 2 = dilebihkan (default 1)
 * @returns {{bone: string, axis: 'x'|'y'|'z', angle: number}[]}
 */
export function secondaryTurns(seconds, {clip, duration, speed = 1, intensity = 1} = {}) {
  if (!(intensity > 0) || !Number.isFinite(seconds)) return [];
  const t = Number.isFinite(seconds) ? seconds : 0;
  const ops = [];

  // 1. Napas — selalu ada, karena orang hidup tidak pernah benar-benar diam.
  const bPhase = (2 * Math.PI * t) / BREATH_PERIOD;
  for (const b of BREATH) {
    ops.push({bone: b.bone, axis: b.axis, angle: BREATH_AMP * b.gain * intensity * Math.sin(bPhase)});
  }

  // 2. Ayunan badan mengikuti langkah + keterlambatan berantai.
  const gait = GAIT[clip] ?? 0;
  if (gait && Number.isFinite(duration) && duration > 0.05) {
    const cycle = duration / Math.max(0.05, speed); // detik per siklus klip
    for (const c of CHAIN) {
      // fase dihitung dari (t - lag), jadi tulang ujung selalu tertinggal
      const phase = (2 * Math.PI * (t - c.lag)) / cycle;
      ops.push({bone: c.bone, axis: c.axis, angle: SWAY * gait * c.gain * intensity * Math.sin(phase)});
    }
  }

  // 3. Goyangan lambat, supaya pose diam tidak terasa seperti patung.
  const dPhase = (2 * Math.PI * t) / DRIFT_PERIOD;
  for (const d of DRIFT) {
    ops.push({bone: d.bone, axis: d.axis, angle: DRIFT_AMP * d.gain * intensity * Math.sin(dPhase)});
  }

  return ops;
}

/** Nama node tiga yang dipakai untuk mencari tulang (titik dibuang three.js). */
const sanitize = (name) => String(name).replace(/[.[\]:/ ]/g, '');

function resolveBone(root, name) {
  return root.getObjectByName(name) ?? root.getObjectByName(sanitize(name)) ?? null;
}

/**
 * Siapkan lapisan sekunder pada satu instans.
 *
 * Wajib dipanggil sekali setelah instans dibuat. `animated` adalah himpunan nama
 * node yang ditulis klip (lihat `clip-sample.js`): klip kita hanya menulis
 * sebagian tulang, dan tulang yang tidak ditulis tidak pernah dikembalikan ke
 * pose awal. Tanpa daftar ini, putaran tambahan akan menumpuk tiap frame sampai
 * model terpelintir.
 *
 * @param {import('three').Object3D} root
 * @param {Set<string>} [animated]
 */
export function prepareSecondary(root, animated = new Set()) {
  const bones = new Map();
  const rest = new Map();
  for (const name of SECONDARY_BONES) {
    const bone = resolveBone(root, name);
    if (!bone) continue;
    bones.set(name, bone);
    rest.set(name, bone.quaternion.clone());
  }
  const animatedNames = new Set();
  for (const name of bones.keys()) {
    // `animated` berisi nama node three (titik sudah dibuang saat impor glTF)
    if (animated.has(name) || animated.has(sanitize(name))) animatedNames.add(name);
  }
  root.userData.secondary = {bones, rest, animated: animatedNames};
  return root.userData.secondary;
}

/**
 * Terapkan hasil `secondaryTurns` ke pohon tulang three.js.
 *
 * Harus dipanggil **setelah** pose klip ditulis (`sampler.apply(...)`). Tulang yang dianimasikan klip
 * sudah ditulis ulang oleh mixer, jadi cukup dikalikan; tulang yang tidak
 * dianimasikan dikembalikan ke pose awal dulu supaya tidak menumpuk. Tulang yang
 * tidak ada di rig dilewati diam-diam.
 *
 * @param {import('three').Object3D} root
 * @param {{bone: string, axis: string, angle: number}[]} turns
 */
export function applySecondary(root, turns) {
  if (!root || !turns?.length) return;
  const state = root.userData?.secondary ?? prepareSecondary(root);
  for (const op of turns) {
    if (!Number.isFinite(op.angle)) continue;
    const bone = state.bones.get(op.bone);
    if (!bone) continue;
    if (!state.animated.has(op.bone)) bone.quaternion.copy(state.rest.get(op.bone));
    if (op.axis === 'x') bone.rotateX(op.angle);
    else if (op.axis === 'y') bone.rotateY(op.angle);
    else if (op.axis === 'z') bone.rotateZ(op.angle);
  }
}

/** Nama tulang yang dipakai, untuk test dan dokumentasi. */
export const SECONDARY_BONES = [...new Set([...CHAIN, ...BREATH, ...DRIFT].map((c) => c.bone))];

/** Kembalikan tulang sekunder ke pose awal (dipakai saat instans tidak tampil). */
export function resetSecondary(root) {
  const state = root.userData?.secondary;
  if (!state) return;
  for (const [name, bone] of state.bones) {
    if (!state.animated.has(name)) bone.quaternion.copy(state.rest.get(name));
  }
}
