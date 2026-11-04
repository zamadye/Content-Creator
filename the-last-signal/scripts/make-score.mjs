/**
 * Synthesizer skor musik + stinger jump scare (tanpa sample eksternal).
 *
 * Kenapa ada: versi sebelumnya hanya punya ambience drone. Di konten horor,
 * yang membuat takut adalah SKOR — denyut yang naik, harmoni yang tidak nyaman,
 * dan keheningan tepat sebelum scare. Semua di sini deterministik: seed tetap,
 * panjang mengikuti episode, jadi render bisa diubah tanpa skor ikut berubah.
 *
 *   node scripts/make-score.mjs --episode LS-0001
 *
 * Output:
 *   audio/score.wav   (stereo, panjang = durasi episode)
 *   audio/sfx/scare.wav (stinger untuk jumpscare)
 *   audio/sfx/whoosh.wav (transisi)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const argIndex = process.argv.indexOf("--episode");
const EPISODE_ID = argIndex !== -1 ? process.argv[argIndex + 1] : "LS-0001";
const EPISODE_DIR = join(ROOT, "projects", "episodes", EPISODE_ID);

const SR = 48000;
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- utilitas
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo = -1, hi = 1) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (t) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

function writeWavStereo(filePath, left, right) {
  const frames = left.length;
  const dataSize = frames * 4; // 2 channel × 16-bit
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22); // stereo
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 4, 28);
  buffer.writeUInt16LE(4, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < frames; i++) {
    buffer.writeInt16LE(Math.round(clamp(left[i]) * 32767), 44 + i * 4);
    buffer.writeInt16LE(Math.round(clamp(right[i]) * 32767), 44 + i * 4 + 2);
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, buffer);
  console.log(`  ${filePath.replace(ROOT + "/", "")}  ${(buffer.length / 1048576).toFixed(1)} MB`);
}

function normalize(left, right, peak = 0.86) {
  let max = 0;
  for (let i = 0; i < left.length; i++) max = Math.max(max, Math.abs(left[i]), Math.abs(right[i]));
  if (max === 0) return;
  const gain = peak / max;
  for (let i = 0; i < left.length; i++) {
    left[i] *= gain;
    right[i] *= gain;
  }
}

// ------------------------------------------------------------------ episode
const episode = JSON.parse(readFileSync(join(EPISODE_DIR, "episode.json"), "utf8"));
const fps = episode.targetFps ?? 30;
const totalFrames = episode.scenes.reduce((sum, s) => sum + s.durationFrames, 0);
const duration = totalFrames / fps;
const totalSamples = Math.ceil(duration * SR);

let cursor = 0;
const sceneWindows = episode.scenes.map((scene) => {
  const start = cursor / fps;
  cursor += scene.durationFrames;
  return { start, end: cursor / fps, intensity: scene.visual?.intensity ?? 0.5 };
});

const scareFrames = (episode.jumpscares ?? []).map((s) => s.atFrame);
// Klimaks skor mengikuti scare TERAKHIR (yang paling besar), bukan yang pertama.
const climax = scareFrames.length ? Math.max(...scareFrames) / fps : duration * 0.9;

// Bagian skor: [mulai, selesai, nama]
const t1 = duration * 0.18; // intro
const t2 = duration * 0.52; // build
const t3 = duration * 0.78; // tension
const revealStart = Math.max(t3, climax - 4.2);

// `gain` wajib ada: dulu bagian ini hanya mengembalikan {name, energy}, tapi
// loop di bawah mengalikan sampel dengan section.gain. Karena undefined,
// seluruh skor menjadi NaN → ditulis sebagai nol → empat episode terbit tanpa
// musik sama sekali. Sekarang tiap bagian punya gain eksplisit.
function sectionAt(time) {
  if (time < t1) return { name: "intro", energy: 0.25 + (time / t1) * 0.15, gain: 0.55 };
  if (time < t2) return { name: "build", energy: 0.42 + ((time - t1) / (t2 - t1)) * 0.18, gain: 0.72 };
  if (time < t3) return { name: "tension", energy: 0.62 + ((time - t2) / (t3 - t2)) * 0.2, gain: 0.86 };
  return { name: "reveal", energy: time > climax ? 0.55 : 0.95, gain: time > climax ? 0.62 : 1 };
}

console.log(`Skor ${EPISODE_ID}: ${duration.toFixed(1)}s, scare di ${climax.toFixed(1)}s`);

const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

// State filter & reverb sederhana (dua tap delay + lowpass) untuk ruang.
let lpL = 0;
let lpR = 0;
let hpPrev = 0;
const delayLen = Math.round(SR * 0.19);
const delayBuf = new Float32Array(delayLen);
let delayIdx = 0;

const rnd = mulberry32(20261104);

// Frekuensi dasar: D minor-ish dengan tritone yang bikin gelisah.
const ROOT_HZ = 73.42; // D2
const TRITONE = ROOT_HZ * Math.SQRT2; // ~103.8 (Ab2)
const PAD_NOTES = [146.83, 174.61, 207.65, 293.66]; // D3, F3, Ab3, D4

const beat = 60 / 58; // 58 BPM: lambat, seperti jantung yang tenang sebelum panik

for (let i = 0; i < totalSamples; i++) {
  const time = i / SR;
  const section = sectionAt(time);
  const energy = section.energy;

  // ---- drone: dua osilator detune + tritone pelan
  const drone =
    Math.sin(TAU * ROOT_HZ * time) * 0.16 +
    Math.sin(TAU * ROOT_HZ * 1.004 * time) * 0.12 +
    Math.sin(TAU * TRITONE * time) * (0.03 + energy * 0.05);

  // ---- pad: gelombang gigi gergaji "string" dengan lowpass dan vibrato
  let pad = 0;
  for (let n = 0; n < PAD_NOTES.length; n++) {
    const freq = PAD_NOTES[n];
    const vib = Math.sin(TAU * 4.6 * time + n) * 0.0035;
    const saw = 2 * ((time * freq * (1 + vib)) % 1) - 1;
    pad += saw * (0.026 - n * 0.004);
  }
  lpL = lpL + (pad - lpL) * 0.06;
  lpR = lpR + (pad * 0.98 - lpR) * 0.06;

  // ---- denyut: kick rendah tiap beat, makin rapat saat reveal
  const beatPhase = (time % beat) / beat;
  const kickEnv = Math.pow(1 - beatPhase, 5);
  const kickFreq = lerp(78, 42, Math.min(1, beatPhase * 3));
  const kick = Math.sin(TAU * kickFreq * time) * kickEnv * (0.16 * energy);

  // denyut ganda khas horor (lub-dub) di bagian tension
  const halfBeat = (time % (beat / 2)) / (beat / 2);
  const doubleHit =
    section.name === "tension" || section.name === "reveal"
      ? Math.sin(TAU * 48 * time) * Math.pow(1 - halfBeat, 7) * 0.09 * energy
      : 0;

  // ---- tekstur napas: noise difilter dengan swell lambat
  const noise = rnd() * 2 - 1;
  const swell = 0.5 + 0.5 * Math.sin(TAU * 0.08 * time + 1.3);
  hpPrev = hpPrev + (noise - hpPrev) * 0.35;
  const breath = (noise - hpPrev) * 0.016 * (0.4 + energy) * swell;

  // ---- cluster disonan (D5 + Eb5) hanya di bagian tegang
  let cluster = 0;
  if (section.name === "tension" || (section.name === "reveal" && time < climax)) {
    const tremolo = 0.5 + 0.5 * Math.sin(TAU * 7.2 * time);
    cluster =
      (Math.sin(TAU * 587.33 * time) + Math.sin(TAU * 622.25 * time)) * 0.018 * tremolo * energy;
  }

  // ---- riser menuju scare: noise yang naik selama 4 detik terakhir
  let riser = 0;
  const riserStart = climax - 4.2;
  if (time > riserStart && time < climax) {
    const p = (time - riserStart) / 4.2;
    const riseNoise = noise * Math.pow(p, 2.4) * 0.16;
    const riseTone = Math.sin(TAU * lerp(120, 900, p * p) * time) * Math.pow(p, 3) * 0.05;
    riser = riseNoise + riseTone;
  }

  // ---- keheningan setelah scare: 0.7 detik nyaris senyap (kontras = takut)
  const silence = time > climax && time < climax + 0.7 ? 0.06 : 1;

  // ---- akhir: fade out
  const tail = Math.min(1, Math.max(0, (duration - time) / 1.6));

  // Kontras dinamis: bagian awal sengaja lebih pelan supaya klimaks terasa.
  let sample =
    (drone + lpL + kick + doubleHit + breath + cluster + riser) * silence * tail * section.gain;

  // reverb sederhana
  const readAt = (delayIdx + 1) % delayLen;
  const delayed = delayBuf[readAt] * 0.32;
  delayBuf[delayIdx] = sample;
  delayIdx = (delayIdx + 1) % delayLen;
  sample += delayed;

  // stereo width: kanal kanan sedikit lebih lambat (detune halus)
  const wide = Math.sin(TAU * 0.05 * time) * 0.08;
  left[i] = clamp(sample * (1 + wide));
  right[i] = clamp(sample * (1 - wide) + lpR * 0.5);
}

normalize(left, right, 0.62);

// Penjaga: skor yang senyap tidak boleh lolos diam-diam.
function assertAudible(label, channel) {
  let max = 0;
  for (let i = 0; i < channel.length; i++) max = Math.max(max, Math.abs(channel[i]));
  if (!(max > 0.2)) {
    throw new Error(`${label} senyap (puncak ${max.toFixed(3)}) — periksa perhitungan sampel, jangan tulis berkas kosong.`);
  }
}
assertAudible("score.wav", left);
writeWavStereo(join(EPISODE_DIR, "audio", "score.wav"), left, right);

// --------------------------------------------------------- stinger & whoosh
function makeScare() {
  const seconds = 1.9;
  const n = Math.round(seconds * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const r = mulberry32(777);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 0.004);
    const decay = Math.exp(-t * 2.1);
    const env = attack * decay;
    // cluster disonan tinggi + sub drop + noise burst: resep stinger klasik
    const cluster =
      (Math.sin(TAU * 932 * t) + Math.sin(TAU * 988 * t) + Math.sin(TAU * 1244 * t)) * 0.24;
    const sub = Math.sin(TAU * lerp(120, 28, Math.min(1, t * 2)) * t) * 0.5 * Math.exp(-t * 1.4);
    const burst = (r() * 2 - 1) * Math.exp(-t * 16) * 0.6;
    const values = (cluster + sub + burst) * env;
    L[i] = clamp(values);
    R[i] = clamp(values * 0.92 + (r() * 2 - 1) * Math.exp(-t * 20) * 0.15);
  }
  normalize(L, R, 0.45); // stinger dibiarkan jauh di bawah 0 dBFS: tanpa limiter di ffmpeg, puncak mix-lah yang menentukan loudness akhir
  return { L, R };
}

function makeWhoosh() {
  const seconds = 1.1;
  const n = Math.round(seconds * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const r = mulberry32(313);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const p = t / seconds;
    const env = Math.sin(Math.PI * p) ** 1.6;
    const noise = r() * 2 - 1;
    lp = lp + (noise - lp) * lerp(0.5, 0.05, p);
    const v = (noise - lp) * env * 0.5;
    L[i] = clamp(v);
    R[i] = clamp(v * 0.8);
  }
  normalize(L, R, 0.5);
  return { L, R };
}

const scare = makeScare();
writeWavStereo(join(EPISODE_DIR, "audio", "sfx", "scare.wav"), scare.L, scare.R);
const whoosh = makeWhoosh();
writeWavStereo(join(EPISODE_DIR, "audio", "sfx", "whoosh.wav"), whoosh.L, whoosh.R);
console.log("Selesai.");
