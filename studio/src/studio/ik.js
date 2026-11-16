/**
 * IK ringan untuk pandangan mata (langkah 33).
 *
 * Klip kita membawa rotasi leher dan kepala yang ditulis tangan untuk satu
 * situasi. Di adegan dua orang, aktor harus **menoleh ke lawan bicaranya** —
 * dan lawan bicara itu pindah tempat, atau aktornya berjalan. Menulis klip
 * khusus untuk setiap pasangan tidak masuk akal.
 *
 * Yang dipakai di sini bukan IK penuh (tidak ada solver numerik, tidak ada
 * kontrol tangan/kaki). Ini **aim constraint** analitik: arah pandang sekarang
 * dibandingkan dengan arah ke target, lalu selisihnya dibagi ke tulang leher dan
 * kepala. Fungsi murni terhadap pose yang sudah ada — tidak menyimpan keadaan,
 * karena Remotion merender frame dalam urutan acak.
 *
 * Batasnya jelas dan diuji: sudut dipotong (`maxAngle`), jadi target di belakang
 * kepala tidak membuat leher terpelintir 180°.
 */
import * as THREE from 'three';

/** Tulang yang ikut menoleh, dengan porsi putaran masing-masing. */
const NECK_CHAIN = [
  {bone: 'neck02', share: 0.35},
  {bone: 'neck03', share: 0.25},
  {bone: 'head', share: 0.4},
];

/**
 * Arah hadap tulang kepala. Diverifikasi empiris: pada pose istirahat, sumbu
 * lokal +Z tulang `head` sejajar dunia +Z untuk karakter maupun entitas, dan
 * kotak mesh memanjang ke +Z (wajah). Anchor `anchor.eye.*` tidak dipakai untuk
 * arah karena node anchor diekspor di titik nol (lihat catatan di STATUS.md).
 */
const HEAD_FORWARD = new THREE.Vector3(0, 0, 1);

const localName = (name) => String(name).replace(/[.[\]:/ ]/g, '');
const findNode = (root, name) => root.getObjectByName(name) ?? root.getObjectByName(localName(name)) ?? null;

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _parentQ = new THREE.Quaternion();
const _inv = new THREE.Quaternion();

/**
 * Arah pandang sebuah karakter pada posenya sekarang (vektor satuan).
 * Dipakai untuk menghitung galat sebelum dan sesudah menoleh.
 */
export function gazeDirection(root) {
  const head = findNode(root, 'head');
  if (!head) return null;
  return HEAD_FORWARD.clone().applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion())).normalize();
}

/** Titik pandang karakter (tulang kepala), untuk target dan hitungan galat. */
export function gazeOrigin(root) {
  const head = findNode(root, 'head');
  return head ? head.getWorldPosition(new THREE.Vector3()) : null;
}

/**
 * Putar leher + kepala supaya arah pandang menuju `target`.
 *
 * @param {import('three').Object3D} root
 * @param {THREE.Vector3|number[]} target  titik dunia
 * @param {object} [opts]
 * @param {number} [opts.maxAngle]  batas total putaran (radian), default 1,05 (~60°)
 * @param {number} [opts.weight]    0..1, seberapa besar koreksi dipakai
 * @param {number} [opts.maxPitch]  batas naik/turun (radian), default 0,5 (~29°)
 * @returns {{applied: boolean, errorBefore: number, errorAfter: number, angle: number}}
 */
export function aimGaze(root, target, {maxAngle = 1.05, maxPitch = 0.5, weight = 1} = {}) {
  const origin = gazeOrigin(root);
  const before = gazeDirection(root);
  if (!origin || !before || !(weight > 0)) return {applied: false, errorBefore: NaN, errorAfter: NaN, angle: 0};

  const goal = Array.isArray(target) ? _v.set(target[0], target[1], target[2]) : _v.copy(target);
  const desired = goal.clone().sub(origin);
  if (desired.lengthSq() < 1e-6) return {applied: false, errorBefore: 0, errorAfter: 0, angle: 0};
  desired.normalize();

  // batasi naik/turun supaya leher tidak mendongak seperti burung hantu
  const pitch = Math.asin(THREE.MathUtils.clamp(desired.y, -1, 1));
  if (Math.abs(pitch) > maxPitch) {
    const flat = Math.cos(Math.sign(pitch) * maxPitch);
    const horizontal = new THREE.Vector3(desired.x, 0, desired.z);
    if (horizontal.lengthSq() < 1e-8) return {applied: false, errorBefore: NaN, errorAfter: NaN, angle: 0};
    horizontal.normalize().multiplyScalar(flat);
    desired.set(horizontal.x, Math.sin(Math.sign(pitch) * maxPitch), horizontal.z).normalize();
  }

  const errorBefore = before.angleTo(desired);
  const budget = Math.min(errorBefore * Math.min(1, weight), maxAngle);
  let turned = 0;

  for (const step of NECK_CHAIN) {
    const bone = findNode(root, step.bone);
    if (!bone || !bone.parent) continue;
    const current = gazeDirection(root);
    const eye = gazeOrigin(root);
    if (!current || !eye) break;
    const want = goal.clone().sub(eye).normalize();
    const need = current.angleTo(want);
    if (need < 1e-6) continue;
    // porsi putaran tulang ini, tidak melebihi sisa anggaran
    const take = Math.min(need, budget * step.share, budget - turned);
    if (take <= 1e-6) continue;
    const rot = new THREE.Quaternion().setFromUnitVectors(current, want);
    const part = new THREE.Quaternion().slerp(rot, take / need);
    // putaran dunia -> ruang lokal tulang (Ql' = Qp⁻¹ · R · Qp · Ql)
    _parentQ.copy(bone.parent.getWorldQuaternion(_q));
    _inv.copy(_parentQ).invert();
    bone.quaternion.premultiply(_inv.multiply(part).multiply(_parentQ));
    bone.updateMatrixWorld(true);
    turned += take;
  }

  const after = gazeDirection(root);
  return {applied: true, errorBefore, errorAfter: after ? after.angleTo(desired) : NaN, angle: turned};
}
