#!/usr/bin/env python3
"""
ORIGINAL SCORE + SOUND DESIGN (procedural, deterministic)
----------------------------------------------------------
Generates the music bed and the sound effects used by the editorial mix.

Why procedural: the engine must run without sample libraries or licensed music.
The bed is a slow, unresolved drone with a restrained pulse — it supports the
argument (a held breath) instead of turning a policy story into a trailer.

Output (48 kHz, 24-bit WAV):
  audio/processing/generated/bed.wav        music bed, exact length of the film
  audio/processing/generated/sfx_*.wav      whoosh / impact / stamp / tick / paper

Usage: python3 audio/processing/synth_score.py --duration 72.5 [--out DIR]
"""
from __future__ import annotations

import argparse
import json
import math
import os
import wave

import numpy as np

SR = 48000


# ----------------------------------------------------------------------------- helpers
def db(x: float) -> float:
    return 10 ** (x / 20.0)


def adsr(n: int, attack: float, decay: float, sustain: float, release: float) -> np.ndarray:
    a = int(attack * SR)
    d = int(decay * SR)
    r = int(release * SR)
    s = max(0, n - a - d - r)
    env = np.concatenate([
        np.linspace(0, 1, max(1, a)),
        np.linspace(1, sustain, max(1, d)),
        np.full(s, sustain),
        np.linspace(sustain, 0, max(1, r)),
    ])
    return env[:n] if len(env) >= n else np.pad(env, (0, n - len(env)))


def sine(freq: float, dur: float) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    return np.sin(2 * np.pi * freq * t)


def saw(freq: float, dur: float, harmonics: int = 12) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    out = np.zeros_like(t)
    for k in range(1, harmonics + 1):
        out += np.sin(2 * np.pi * freq * k * t) / k
    return out / np.max(np.abs(out) + 1e-9)


def onepole_lowpass(x: np.ndarray, cutoff: float, order: float = 2.0) -> np.ndarray:
    """Frequency-domain low-pass (vectorised): the procedural score is rendered offline,
    so an FFT filter is both faster and more predictable than a sample loop."""
    X = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1.0 / SR)
    H = 1.0 / np.sqrt(1.0 + (freqs / max(20.0, cutoff)) ** (2 * order))
    return np.fft.irfft(X * H, n=len(x))


def noise(dur: float, seed: int = 7) -> np.ndarray:
    rng = np.random.default_rng(seed)
    return rng.standard_normal(int(dur * SR))


def place(dst: np.ndarray, src: np.ndarray, at_sec: float, gain: float = 1.0):
    i = int(at_sec * SR)
    if i >= len(dst):
        return
    n = min(len(src), len(dst) - i)
    dst[i:i + n] += src[:n] * gain


def write_wav(path: str, x: np.ndarray, channels: int = 2):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    x = np.clip(x, -1.0, 1.0)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    pcm = (x * 8388607).astype(np.int32)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# ----------------------------------------------------------------------------- music bed
NOTE = {"A1": 55.0, "A2": 110.0, "C3": 130.81, "E3": 164.81, "F3": 174.61, "G3": 196.0, "B3": 246.94,
        "C4": 261.63, "D4": 293.66, "E4": 329.63, "A3": 220.0, "F2": 87.31, "G2": 98.0, "D3": 146.83}


def build_bed(duration: float) -> np.ndarray:
    n = int(duration * SR)
    bed = np.zeros(n)

    # --- harmonic plan: the film never resolves to the tonic until the last chord,
    #     and even then the fifth is missing. Restraint is the point.
    chords = [
        (0.00, ["A1", "E3", "A3"], "open fifth over a low root"),
        (0.16, ["F2", "C4", "A3"], "subdominant: doubt"),
        (0.34, ["A1", "E3", "C4"], "minor colour as the count arrives"),
        (0.52, ["G2", "D4", "B3"], "lift: someone is trying"),
        (0.70, ["F2", "C4", "E4"], "the argument turns to the audience"),
        (0.86, ["A1", "E3", "G3"], "unresolved: root + 7th, no fifth"),
    ]
    for idx, (pos, notes, _why) in enumerate(chords):
        start = pos * duration
        end = (chords[idx + 1][0] * duration) if idx + 1 < len(chords) else duration
        seg_len = max(1.0, end - start + 3.0)  # overlap into the next chord
        for j, name in enumerate(notes):
            f = NOTE[name]
            voice = saw(f, seg_len, harmonics=7) * 0.5 + sine(f, seg_len) * 0.5
            # slow shimmer: two detuned copies
            voice = voice + 0.5 * saw(f * 1.0035, seg_len, harmonics=5)
            env = adsr(len(voice), attack=2.4, decay=1.2, sustain=0.75, release=2.6)
            voice = onepole_lowpass(voice * env, cutoff=760 + j * 120)
            place(bed, voice, start, gain=0.16 / (1 + j * 0.35))

    # --- pulse: a soft heartbeat, only while the argument is being built
    pulse_from, pulse_to = 0.14, 0.72
    t = pulse_from * duration
    beat = 1.85  # seconds
    while t < pulse_to * duration:
        n = int(0.5 * SR)
        env = adsr(n, 0.004, 0.16, 0.0, 0.3)
        thump = sine(52, 0.5) * env * 0.5
        burst = lowpassed_noise_burst(0.06) * 0.12
        thump[: len(burst)] += burst
        place(bed, thump, t, gain=0.5)
        t += beat

    # --- air: filtered noise floor, very quiet, keeps the mix from feeling synthetic
    air = onepole_lowpass(noise(duration, seed=3), cutoff=260) * 0.03
    bed += air

    # --- ducking automation is applied in the mix; here we only normalise
    bed = bed / (np.max(np.abs(bed)) + 1e-9) * 0.7
    return bed


def lowpassed_noise_burst(dur: float) -> np.ndarray:
    x = noise(dur, seed=11)
    env = adsr(len(x), 0.002, 0.03, 0.0, 0.02)
    return onepole_lowpass(x * env, cutoff=1800) * 0.6


# ----------------------------------------------------------------------------- sfx
def sfx_whoosh(dur: float = 0.9) -> np.ndarray:
    """Band-swept noise — used for scene transitions, never as decoration."""
    x = noise(dur, seed=21)
    n = len(x)
    out = np.zeros(n)
    acc = 0.0
    for i in range(n):
        p = i / n
        cutoff = 300 + 2400 * math.sin(math.pi * p) ** 2
        a = math.exp(-2 * math.pi * cutoff / SR)
        acc = (1 - a) * x[i] + a * acc
        out[i] = acc
    env = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return out * env * 0.5


def sfx_impact(dur: float = 1.1) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    body = np.sin(2 * np.pi * (58 - 18 * t) * t) * np.exp(-t * 4.2)
    click = noise(dur, seed=31) * np.exp(-t * 42) * 0.35
    return (body + click) * 0.8


def sfx_stamp(dur: float = 0.35) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    thud = np.sin(2 * np.pi * 96 * t) * np.exp(-t * 26)
    paper = noise(dur, seed=41) * np.exp(-t * 60) * 0.6
    return (thud * 0.7 + paper) * 0.7


def sfx_tick(dur: float = 0.09) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    return (noise(dur, seed=51) * np.exp(-t * 180) + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) * 0.3) * 0.5


def sfx_paper(dur: float = 0.7) -> np.ndarray:
    t = np.arange(int(dur * SR)) / SR
    x = noise(dur, seed=61)
    crackle = (np.abs(noise(dur, seed=62)) > 2.2).astype(float)
    env = np.exp(-t * 3.4)
    return onepole_lowpass(x * crackle * env, cutoff=5200) * 0.8


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--duration", type=float, required=True, help="film duration in seconds")
    ap.add_argument("--out", default="audio/processing/generated")
    args = ap.parse_args()

    os.makedirs(args.out, exist_ok=True)
    bed = build_bed(args.duration)
    write_wav(os.path.join(args.out, "bed.wav"), bed)

    for name, sig in {
        "whoosh": sfx_whoosh(),
        "impact": sfx_impact(),
        "stamp": sfx_stamp(),
        "tick": sfx_tick(),
        "paper": sfx_paper(),
    }.items():
        write_wav(os.path.join(args.out, f"sfx_{name}.wav"), sig)

    meta = {
        "sampleRate": SR,
        "durationSec": args.duration,
        "bed": os.path.join(args.out, "bed.wav"),
        "sfx": ["whoosh", "impact", "stamp", "tick", "paper"],
        "note": "Procedural original score — no third-party samples, no licensing dependency.",
    }
    with open(os.path.join(args.out, "score.json"), "w") as f:
        json.dump(meta, f, indent=2)
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
