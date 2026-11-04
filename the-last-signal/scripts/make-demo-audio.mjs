/**
 * Placeholder audio generator — Phase 1.
 *
 * Pipeline nyata akan memakai TTS (narasi) + library SFX/music berlisensi.
 * Sampai itu tersedia, script ini membuat ambience dan SFX deterministik
 * supaya timeline audio Remotion bisa diuji end-to-end tanpa layanan eksternal.
 *
 * Output: projects/episodes/LS-0001/audio/**.wav (16-bit PCM mono, 44.1 kHz)
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const EPISODE_DIR = join(HERE, "..", "projects", "episodes", "LS-0001");
const AUDIO_DIR = join(EPISODE_DIR, "audio");
const SFX_DIR = join(AUDIO_DIR, "sfx");

const SAMPLE_RATE = 44100;

const clamp = (v) => Math.max(-1, Math.min(1, v));

function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const s = clamp(samples[i]);
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, buffer);
  console.log(`  wrote ${filePath.replace(HERE, ".")} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

/** PRNG deterministik supaya hasil audio selalu sama. */
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

/** Low-pass satu kutub sederhana. */
function lowpass(samples, cutoff) {
  const dt = 1 / SAMPLE_RATE;
  const rc = 1 / (2 * Math.PI * cutoff);
  const alpha = dt / (rc + dt);
  let last = 0;
  return samples.map((s) => {
    last = last + alpha * (s - last);
    return last;
  });
}

const seconds = (s) => Math.round(s * SAMPLE_RATE);

// ---------------------------------------------------------------- ambience
function makeAmbience(durationSec = 20) {
  const n = seconds(durationSec);
  const rnd = mulberry32(20261103);
  const out = new Float32Array(n);
  const noise = lowpass(Array.from({ length: n }, () => (rnd() * 2 - 1) * 0.5), 240);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    // Drone: sub-bass untuk ruang, TAPI juga hum 100/200 Hz dan desis tinggi —
    // tanpa komponen mid/high, ambience ini praktis tidak terdengar di speaker HP.
    const sub = Math.sin(2 * Math.PI * 41 * t) * 0.14 + Math.sin(2 * Math.PI * 55 * t) * 0.09;
    const hum =
      Math.sin(2 * Math.PI * 100 * t) * 0.045 +
      Math.sin(2 * Math.PI * 200 * t) * 0.028 +
      Math.sin(2 * Math.PI * 300 * t) * 0.012;
    const air = noise[i] * 0.3;
    const breathing = 0.75 + 0.25 * Math.sin(2 * Math.PI * (t / durationSec) * 2);
    out[i] = (sub + hum + air) * breathing;
  }

  // Crossfade 0.5s di ujung supaya loop tidak "klik".
  const fade = seconds(0.5);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] *= g;
    out[n - 1 - i] *= g;
  }

  let peak = 0;
  for (const s of out) peak = Math.max(peak, Math.abs(s));
  return out.map((s) => (s / peak) * 0.72);
}

// ----------------------------------------------------------------- SFX
function makeKnock() {
  const n = seconds(0.75);
  const out = new Float32Array(n);
  const rnd = mulberry32(7);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 22);
    const body = Math.sin(2 * Math.PI * 92 * t) * 0.8 + Math.sin(2 * Math.PI * 147 * t) * 0.35;
    const click = (rnd() * 2 - 1) * Math.exp(-t * 90) * 0.6;
    out[i] = (body + click) * env * 0.9;
  }
  return out;
}

function makeImpact() {
  const n = seconds(2.4);
  const out = new Float32Array(n);
  const rnd = mulberry32(31);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 1.9);
    const sweep = 70 * Math.exp(-t * 2.2) + 26; // sub drop
    phase += (2 * Math.PI * sweep) / SAMPLE_RATE;
    const sub = Math.sin(phase) * 0.95;
    const transient = (rnd() * 2 - 1) * Math.exp(-t * 55) * 0.45;
    const tail = (rnd() * 2 - 1) * Math.exp(-t * 6) * 0.08;
    out[i] = (sub + transient + tail) * env;
  }
  return lowpass(Array.from(out), 9000);
}

function makeDoorCreak() {
  const n = seconds(1.6);
  const out = new Float32Array(n);
  const rnd = mulberry32(99);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / 1.6;
    const freq = 120 + Math.sin(progress * Math.PI) * 260 + (rnd() * 2 - 1) * 18;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const grit = (rnd() * 2 - 1) * 0.5;
    const env = Math.sin(progress * Math.PI) ** 1.4;
    out[i] = (Math.sin(phase) * 0.35 + grit * 0.4) * env * 0.7;
  }
  return lowpass(Array.from(out), 3200);
}

/** Riser: noise yang naik intensitasnya menuju impact. */
function makeRiser(durationSec = 2.4) {
  const n = seconds(durationSec);
  const out = new Float32Array(n);
  const rnd = mulberry32(451);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / n;
    // Nada naik + noise yang makin keras: "tarikan napas" sebelum kejadian.
    const freq = 90 * Math.pow(6, progress);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const tone = Math.sin(phase) * 0.22 * progress;
    const hiss = (rnd() * 2 - 1) * 0.28 * Math.pow(progress, 2.2);
    out[i] = (tone + hiss) * Math.pow(progress, 0.8);
  }
  return out;
}

function makeHeartbeat() {
  const n = seconds(1.4);
  const out = new Float32Array(n);
  const beat = (startSec, gain) => {
    const start = seconds(startSec);
    const len = seconds(0.34);
    for (let i = 0; i < len && start + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 14);
      out[start + i] += Math.sin(2 * Math.PI * 52 * t) * env * gain;
    }
  };
  beat(0.02, 0.95);
  beat(0.36, 0.62);
  return out;
}

console.log("Generating placeholder audio for LS-0001 …");
writeWav(join(AUDIO_DIR, "ambience_drone.wav"), makeAmbience(20));
writeWav(join(SFX_DIR, "knock.wav"), makeKnock());
writeWav(join(SFX_DIR, "impact.wav"), makeImpact());
writeWav(join(SFX_DIR, "door_creak.wav"), makeDoorCreak());
writeWav(join(SFX_DIR, "heartbeat.wav"), makeHeartbeat());
writeWav(join(SFX_DIR, "riser.wav"), makeRiser());
console.log("Done.");
