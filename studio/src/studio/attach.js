/**
 * Menempelkan properti ke tangan aktor (field `hold`).
 *
 * Kenapa ke tulang, bukan ke `anchor.hand.*`: anchor adalah node statis di akar
 * scene — posisinya benar (setelah bug di commit 86f1317 diperbaiki), tapi ia
 * tidak ikut berputar saat lengan mengayun. Properti yang ditempelkan ke anchor
 * akan melayang di tempat sementara tangan bergerak.
 *
 * Tulang yang dipakai: `metacarpal1` (tengah telapak), cadangan `wrist`. Titik
 * asal properti dijatuhkan tepat di tulang, orientasinya mengikuti tangan, jadi
 * tidak perlu angka ajaib per properti.
 */

/** Nama tulang tangan; titik dibuang karena three.js membersihkan nama node glTF. */
const HAND_BONES = {
  L: ['metacarpal1.L', 'wrist.L', 'metacarpal1L', 'wristL'],
  R: ['metacarpal1.R', 'wrist.R', 'metacarpal1R', 'wristR'],
};

/**
 * @param {import('three').Object3D} root  akar aktor (hasil cloneSkeleton)
 * @param {'L'|'R'} [hand]
 * @returns {import('three').Object3D|null}
 */
export function handBone(root, hand = 'R') {
  const names = HAND_BONES[hand] ?? HAND_BONES.R;
  for (const name of names) {
    const bone = root.getObjectByName(name);
    if (bone) return bone;
  }
  return null;
}

/**
 * Tempelkan `propRoot` ke tangan aktor. Transform lokal direset supaya properti
 * duduk tepat di telapak dan ikut setiap gerak tangan — hasilnya sama di setiap
 * render, tidak bergantung pada urutan frame.
 *
 * @param {import('three').Object3D} root  akar aktor
 * @param {import('three').Object3D} propRoot  instans properti (sudah di-clone)
 * @param {'L'|'R'} [hand]
 * @param {number[]} [offset]  geseran di ruang tangan (mis. [0,-0.1,0] supaya
 *                             pegangan properti pas di telapak)
 * @returns {import('three').Object3D|null}
 */
export function attachToHand(root, propRoot, hand = 'R', offset = [0, 0, 0]) {
  const bone = handBone(root, hand);
  if (!bone) return null;
  propRoot.position.set(offset[0] ?? 0, offset[1] ?? 0, offset[2] ?? 0);
  propRoot.quaternion.identity();
  propRoot.scale.setScalar(1);
  bone.add(propRoot);
  return propRoot;
}
