/**
 * Lapisan "hidup" untuk aktor studio: napas, tumpuan berat badan, kedip,
 * gestur bicara, sikap mendengarkan, dan fidget.
 *
 * Kenapa berkas ini ada
 * ---------------------
 * Klip kita punya satu sumbu waktu (satu pose per detik) dan hanya sebagian
 * tulang yang ditulis. Aktor yang duduk memakai klip `sit` — pose duduk statis
 * satu frame — jadi tanpa lapisan tambahan ia benar-benar membeku: yang tersisa
 * hanya `secondaryTurns` dengan amplitudo ±0,6° yang tidak terbaca di layar.
 * Hasilnya "berat" dan tidak hidup.
 *
 * Dasar praktik animasi yang dipakai di sini (semua bisa diperiksa ulang):
 *
 * 1. **Napas** — siklus 3–4 detik, dada dan bahu naik-turun; kepala praktis
 *    tidak ikut naik-turun (kepala stabil saat bernapas). Gerak ini yang
 *    membuat tokoh terlihat "ada" walau tidak berbuat apa-apa.
 * 2. **Pergeseran berat badan** — panggul bergeser sedikit ke samping dan
 *    ditahan di ujung ayunan (*moving hold*), bukan sinus rata. Tanpa ini pose
 *    diam terbaca kaku.
 * 3. **Anticipation → action → follow-through** — setiap gestur diawali gerak
 *    kecil ke arah berlawanan, lalu aksi cepat, lalu berhenti dengan sedikit
 *    *overshoot* sebelum settle. Lihat `beatWave()`.
 * 4. **Overlapping action / drag** — tulang ujung bergerak terlambat dari
 *    pangkal (kepala terlambat dari dada, tangan terlambat dari bahu).
 *    Diterapkan sebagai `lag` per tulang.
 * 5. **Arcs** — gestur lengan tidak lurus: ada komponen sumbu kedua yang
 *    membuat ujung tangan bergerak di busur, bukan garis.
 * 6. **Idle variation** — diam yang sama terus-menerus terasa mati setelah
 *    beberapa detik, jadi ada fidget jarang (menoleh, menggeser bahu) dengan
 *    jadwal tidak rata dari hash, bukan acak per frame.
 * 7. **Bicara** — rahang membuka-tutup mengikuti suku kata semu, kepala
 *    mengangguk pada frasa, tangan memberi *beat gesture*. Ini yang membuat
 *    dialog terbaca sebagai dua orang yang benar-benar bicara.
 *
 * Semua fungsi murni terhadap waktu lokal shot: Remotion merender frame dalam
 * urutan acak dan paralel, jadi tidak boleh ada state yang menumpuk.
 */

const TAU = Math.PI * 2;

/** Hash deterministik 0..1 — dipakai untuk jadwal kedip/fidget per aktor. */
export function hash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const clamp01 = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t);

/** Smoothstep — dasar ease-in/ease-out (bukan linear). */
const smooth = (t) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/**
 * Ayunan dengan *dwell* di ujung: hasilnya berhenti sejenak di posisi ekstrem
 * (moving hold) lalu berbalik. Sinus biasa terasa seperti mesin.
 */
const holdWave = (phase) => {
  const s = Math.sin(phase);
  return Math.sign(s) * Math.pow(Math.abs(s), 0.55);
};

/**
 * Gelombang gestur: 0.16 * antisipasi (arah berlawanan) → naik cepat →
 * ditahan (*moving hold*) → *overshoot* melewati nol → settle.
 * Mengembalikan ±1 dengan 0 = pose netral.
 */
function beatWave(t, period, seed, duty = 1) {
  const p = (((t / period) + hash01(seed)) % 1 + 1) % 1;
  const at = (u) => p < u;
  if (at(0.16)) return -0.18 * smooth(p / 0.16) * duty;
  if (at(0.3)) return (-0.18 + 1.18 * smooth((p - 0.16) / 0.14)) * duty;
  if (at(0.52)) return (1 - 0.1 * smooth((p - 0.3) / 0.22)) * duty;
  if (at(0.74)) return (0.9 - 1.02 * smooth((p - 0.52) / 0.22)) * duty;
  return (-0.12 + 0.12 * smooth((p - 0.74) / 0.26)) * duty;
}

/** Gerbang frasa: bicara bergelombang, ada jeda pendek di ujung frasa. */
function speechGate(t, seed) {
  const phrase = 2.4 + 1.1 * hash01(seed + 5);
  const phase = (t / phrase + hash01(seed + 7)) % 1;
  return smooth(phase / 0.12) * smooth((1 - phase) / 0.12);
}

/** Suku kata semu: dua osilator berbeda laju, di-*gate* per frasa. */
function mouthOpen(t, seed, gate) {
  const rate = 4.4 + 0.8 * hash01(seed + 13);
  const a = 0.5 + 0.5 * Math.sin(TAU * rate * t + seed * 1.3);
  const b = 0.5 + 0.5 * Math.sin(TAU * rate * 1.63 * t + seed * 2.7);
  return gate * Math.min(1, 0.62 * a + 0.5 * b);
}

/** Kedip: tutup 0,07 s, tahan, buka 0,10 s; jadwal tidak rata. */
function blinkAmount(t, seed) {
  const period = 2.6 + 1.8 * hash01(seed + 41);
  const span = 0.2 / period;
  const p = (((t / period) + hash01(seed + 43)) % 1 + 1) % 1;
  if (p > span) return 0;
  const u = p / span;
  if (u < 0.3) return smooth(u / 0.3);
  if (u < 0.5) return 1;
  return 1 - smooth((u - 0.5) / 0.5);
}

/** Fidget jarang: pulsa 0..1 dengan jadwal 8–14 detik per aktor. */
function fidget(t, seed, base = 8.5, spread = 5.5) {
  const period = base + spread * hash01(seed + 31);
  const p = (((t / period) + hash01(seed + 37)) % 1 + 1) % 1;
  const open = 0.16; // bagian periode yang dipakai untuk fidget
  if (p > open) return 0;
  const u = p / open;
  if (u < 0.22) return smooth(u / 0.22);
  if (u < 0.62) return 1;
  return 1 - smooth((u - 0.62) / 0.38);
}

/** Tulang yang dipakai lapisan ini (supaya reset pose tahu batasnya). */
export const LIFE_BONES = [
  'spine01',
  'spine03',
  'spine04',
  'spine05',
  'neck02',
  'neck03',
  'head',
  'clavicle.L',
  'clavicle.R',
  'upperarm01.L',
  'upperarm01.R',
  'upperarm02.L',
  'upperarm02.R',
  'lowerarm01.L',
  'lowerarm01.R',
  'lowerarm02.L',
  'lowerarm02.R',
  'wrist.L',
  'wrist.R',
  'jaw',
  'oris01',
  'oris02',
  'oris05',
  'orbicularis03.L',
  'orbicularis03.R',
  'orbicularis04.L',
  'orbicularis04.R',
  'oculi01.L',
  'oculi01.R',
  'eye.L',
  'eye.R',
];

/** Amplitudo dasar (radian). Dipilih supaya terbaca di frame 0,4× (768 px). */
const A = {
  breathChest: 0.034,
  breathShoulder: 0.017,
  breathBob: 0.0028, // meter, naik-turun halus seluruh badan
  weightRoll: 0.032,
  weightShift: 0.017, // meter, geser panggul ke samping
  headNod: 0.045,
  headTurn: 0.06,
  headTilt: 0.024,
  shimmer: 0.0075,
  jaw: 0.055,
  mouthOpen: 0.78,
  mouthWideScale: 0.1,
  eyelidClose: 0.94,
  armBeat: 0.46,
  armBeatUpper: 0.16,
  armBeatWrist: 0.13,
  leanIn: 0.02,
  shoulderRoll: 0.05,
};

/**
 * Hitung semua putaran tambahan untuk satu aktor pada detik lokal shot.
 *
 * @param {number} seconds waktu lokal shot (detik)
 * @param {object} [opts]
 * @param {number} [opts.seed]      pembeda antar aktor (jadwal napas/kedip/fidget)
 * @param {boolean} [opts.speaking] aktor ini sedang bicara di shot ini
 * @param {boolean} [opts.listening] aktor lain yang bicara
 * @param {string} [opts.clip]      klip dasar (mis. `sit`, `idle`, `walk`) — dipakai
 *                                  untuk mengecilkan gestur saat berjalan
 * @param {number} [opts.intensity] 0 = mati, 1 = normal, 2 = dilebihkan
 * @param {boolean} [opts.blink]    kedip prosedural (matikan bila klip sudah berkedip)
 * @returns {{turns: {bone: string, axis: 'x'|'y'|'z', angle: number}[], root: [number, number, number]}}
 */
export function lifeTurns(seconds, opts = {}) {
  const {seed = 0, speaking = false, listening = false, clip = '', intensity = 1, blink: allowBlink = true} = opts;
  if (!(intensity > 0) || !Number.isFinite(seconds)) return {turns: [], root: [0, 0, 0]};
  // Saat berjalan, lengan sudah mengayun dari klip; gestur bicara harus
  // subordinate (prinsip secondary action) supaya tidak tabrakan dengan ayunan.
  const gait = /^(walk|run|jalan|lari)/.test(String(clip)) ? 0.25 : 1;

  const t = seconds;
  const turns = [];
  const push = (bone, axis, angle) => {
    if (Number.isFinite(angle) && Math.abs(angle) > 1e-6) turns.push({bone, axis, angle: angle * intensity});
  };
  // Wajah memakai skala, bukan rotasi: rig kita membuka mulut dengan
  // `oris05.scale.y` dan memejamkan mata dengan `oculi01.scale.y`. Nilai di sini
  // adalah pengali pada pose klip, jadi 1 = tidak berubah.
  const scale = (bone, scaleAxis, factor) => {
    const f = 1 + (factor - 1) * intensity;
    if (Number.isFinite(f) && Math.abs(f - 1) > 1e-4) turns.push({bone, scaleAxis, scale: f});
  };
  // Lerp skala ke nilai absolut: mulut butuh bukaan yang pasti, bukan pengali
  // dari pose istirahat yang cuma 0,19.
  const scaleTo = (bone, scaleAxis, value, amount) => {
    if (!(amount > 0.001)) return;
    turns.push({bone, scaleTo: {axis: scaleAxis, value, amount: amount * intensity}});
  };

  // ---------------------------------------------------------------- napas
  // Dada mengembang, bahu ikut naik sedikit, kepala nyaris diam (kepala
  // terlambat 60 ms dari dada = overlapping action).
  const breathPeriod = 3.4 + 0.8 * hash01(seed + 1);
  const breathPhase = (TAU * t) / breathPeriod;
  const breath = Math.sin(breathPhase);
  push('spine04', 'x', A.breathChest * breath);
  push('spine03', 'x', A.breathChest * 0.45 * breath);
  push('clavicle.L', 'z', A.breathShoulder * Math.sin(breathPhase - 0.6));
  push('clavicle.R', 'z', -A.breathShoulder * Math.sin(breathPhase - 0.6));
  push('neck02', 'x', -A.breathChest * 0.35 * breath);

  // ------------------------------------------------- tumpuan berat badan
  // Panggul bergeser, tulang punggung mengoreksi, jadi seluruh badan bergoyang
  // sangat pelan dengan hold di ujung ayunan.
  const weightPeriod = 7.2 + 2.2 * hash01(seed + 2);
  const weight = holdWave((TAU * t) / weightPeriod + hash01(seed + 3) * TAU);
  push('spine01', 'z', A.weightRoll * weight);
  push('spine03', 'z', -A.weightRoll * 0.45 * weight);
  const root = [A.weightShift * weight, 0, 0];

  // ----------------------------------------------------------- kedip
  // Klip yang sudah punya kedip sendiri (kanal skala `eye.*`) tidak perlu
  // ditambah kedip prosedural — kalau ditumpuk, aktor berkedip dua kali lipat.
  const blink = allowBlink ? blinkAmount(t, seed) : 0;
  if (blink > 0) {
    const shut = 1 - A.eyelidClose * blink;
    scale('oculi01.L', 'y', 1 - 0.55 * blink);
    scale('oculi01.R', 'y', 1 - 0.55 * blink);
    scale('eye.L', 'y', shut);
    scale('eye.R', 'y', shut);
  }

  // ----------------------------------------------------------- bicara
  if (speaking) {
    const gate = speechGate(t, seed);
    const mouth = mouthOpen(t, seed, gate);
    push('jaw', 'x', A.jaw * mouth);
    scaleTo('oris05', 'y', A.mouthOpen, mouth);
    scale('oris05', 'x', 1 + A.mouthWideScale * mouth);

    // Kepala mengangguk pada beat frasa; kepala datang 70 ms setelah dada.
    const nod = beatWave(t - 0.07, 1.25 + 0.35 * hash01(seed + 17), seed + 19);
    push('head', 'x', A.headNod * nod * (0.55 + 0.45 * gate));
    push('neck03', 'x', A.headNod * 0.4 * nod * (0.55 + 0.45 * gate));

    // Badan condong sedikit ke depan saat bicara (bukan ke belakang).
    push('spine04', 'z', A.leanIn * gate);

    // Gestur tangan: busur, bukan garis lurus — sumbu x dan z berbarengan,
    // tangan 110 ms setelah bahu.
    const arm = Math.max(0, beatWave(t - 0.11, 2.6 + 0.6 * hash01(seed + 23), seed + 29, gate)) * gait;
    push('upperarm01.R', 'z', -A.armBeatUpper * arm);
    push('upperarm02.R', 'z', -A.armBeatUpper * 0.5 * arm);
    push('lowerarm01.R', 'x', -A.armBeat * arm);
    push('lowerarm02.R', 'x', -A.armBeat * 0.35 * arm);
    push('wrist.R', 'x', -A.armBeatWrist * arm);
    // lengan kiri hanya menumpu (secondary action, jangan mencuri perhatian)
    push('lowerarm01.L', 'x', -A.armBeat * 0.18 * arm);
  }

  // ------------------------------------------------------ mendengarkan
  if (listening) {
    const nod = beatWave(t - 0.05, 2.85 + 0.8 * hash01(seed + 47), seed + 53, 0.55);
    push('head', 'x', A.headNod * 0.7 * nod);
    push('neck02', 'x', A.headNod * 0.25 * nod);
    push('clavicle.L', 'z', A.breathShoulder * 0.6 * nod);
    push('clavicle.R', 'z', -A.breathShoulder * 0.6 * nod);
  }

  // ------------------------------------------------------------- fidget
  // Sesekali menoleh sedikit dan menggeser bahu — supaya diam tidak monoton.
  const fidgetAmt = fidget(t, seed);
  if (fidgetAmt > 0) {
    const dir = hash01(seed + 61) > 0.5 ? 1 : -1;
    push('head', 'y', A.headTurn * fidgetAmt * dir);
    push('neck03', 'y', A.headTurn * 0.35 * fidgetAmt * dir);
    push('head', 'z', A.headTilt * 0.6 * fidgetAmt * dir);
    push('clavicle.R', 'z', -A.shoulderRoll * 0.5 * fidgetAmt);
  }

  // 7. Mikro-gerak: dua gelombang dengan periode saling tidak berkelipatan.
  //    Tujuannya bukan terlihat, tapi memastikan tidak ada frame yang benar-benar
  //    identik — "diam" yang sempurna terbaca sebagai render yang macet.
  const shimmer =
    A.shimmer *
    (Math.sin(TAU * t / 5.13 + seed * 0.9) * 0.6 + Math.sin(TAU * t / 2.71 + seed * 1.7) * 0.4);
  push('spine05', 'x', shimmer * 0.55);
  push('head', 'z', shimmer * 0.5);
  push('head', 'y', shimmer * 0.7);

  // Napas juga mengangkat seluruh badan sedikit (bukan rotasi saja).
  root[1] = A.breathBob * Math.sin(breathPhase - 0.3);

  return {turns, root};
}
