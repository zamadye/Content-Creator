#!/usr/bin/env python3
"""
build-horror-assets.py — perpustakaan audio horor THE LAST SIGNAL.

Semua berkas di assets/audio/horror/ dihasilkan skrip ini, bukan diunduh.
Alasannya: EP yang sudah jadi butuh suara yang persis sama tiap render, dan
mengunduh sampel berlisensi campur aduk membuat kanal ini rawan klaim. Di sini
setiap suara disintesis dari rumus, jadi bebas royalti dan bisa dibuat ulang
kapan pun dengan hasil identik (seed tetap).

    python3 tools/audio/build-horror-assets.py            # bangun semua
    python3 tools/audio/build-horror-assets.py --only petir tawa
    python3 tools/audio/build-horror-assets.py --list

Hasil:
    assets/audio/horror/<nama>.mp3      (dimainkan renderer / ffmpeg)
    assets/audio/horror/manifest.json   (durasi, jenis, tag pemicu, peak)
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "assets" / "audio" / "horror"
FFMPEG = "/tmp/ffmpeg-full"
RNG = np.random.default_rng(1876)  # 1876: tahun rumah hantu di video referensi


# ── Alat dasar ────────────────────────────────────────────────────────────────
def t(seconds: float) -> np.ndarray:
    return np.arange(int(seconds * SR), dtype=np.float64) / SR


def noise(seconds: float) -> np.ndarray:
    return RNG.standard_normal(int(seconds * SR))


def sine(freq, seconds: float, phase: float = 0.0) -> np.ndarray:
    if np.isscalar(freq):
        return np.sin(2 * np.pi * freq * t(seconds) + phase)
    freq = np.asarray(freq, dtype=np.float64)  # frekuensi berubah terhadap waktu
    return np.sin(2 * np.pi * np.cumsum(freq) / SR + phase)


def saw(freq, seconds: float) -> np.ndarray:
    if np.isscalar(freq):
        freq = np.full(int(seconds * SR), float(freq))
    phase = np.cumsum(np.asarray(freq, dtype=np.float64)) / SR
    return 2 * (phase - np.floor(phase + 0.5))


def env(seconds: float, attack=0.01, decay=None, curve=2.0) -> np.ndarray:
    n = int(seconds * SR)
    a = max(1, int(attack * SR))
    out = np.ones(n)
    out[:a] = np.linspace(0, 1, a) ** 0.6
    if decay:
        d = max(1, int(decay * SR))
        d = min(d, n)
        out[-d:] *= np.linspace(1, 0, d) ** curve
    return out


def lowpass(x, fc, order=4):
    sos = signal.butter(order, fc / (SR / 2), "low", output="sos")
    return signal.sosfilt(sos, x)


def highpass(x, fc, order=4):
    sos = signal.butter(order, fc / (SR / 2), "high", output="sos")
    return signal.sosfilt(sos, x)


def bandpass(x, lo, hi, order=4):
    sos = signal.butter(order, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos")
    return signal.sosfilt(sos, x)


def reverb(x, seconds=1.6, wet=0.25, seed=1):
    """Reverb murah: konvolusi dengan derau yang meluruh. Cukup untuk ruang kos."""
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-3.0 * np.arange(n) / n)
    ir = lowpass(ir, 6000)
    ir /= np.abs(ir).max() + 1e-9
    wet_signal = signal.fftconvolve(x, ir, mode="full")[: len(x)]
    return (1 - wet) * x + wet * wet_signal * 0.6


def normalize_rms(x, rms_db=-20.0, ceiling_db=-2.0):
    """Bed dinormalkan per RMS, bukan per puncak: kalau per puncak, bed yang
    punya dentingan tajam (statik, jangkrik) jadi jauh lebih pelan daripada
    drone, dan campurannya jadi tidak rata. Puncak tetap dibatasi."""
    rms = np.sqrt(np.mean(x ** 2)) + 1e-12
    x = x / rms * (10 ** (rms_db / 20))
    peak = np.abs(x).max()
    limit = 10 ** (ceiling_db / 20)
    if peak > limit:
        x = x / peak * limit
    return x


def normalize(x, peak_db=-3.0):
    peak = np.abs(x).max()
    if peak < 1e-9:
        return x
    return x / peak * (10 ** (peak_db / 20))


def stereo(x, width=0.0, seed=2):
    """Mono → stereo. width > 0 memberi perbedaan halus L/R (ruang terasa luas)."""
    if width <= 0:
        return np.stack([x, x], axis=1)
    rng = np.random.default_rng(seed)
    n = len(x)
    delay = int(0.011 * SR * width)
    left = x
    right = np.concatenate([np.zeros(delay), x[: n - delay]]) * (1 + 0.03 * width)
    right += bandpass(rng.standard_normal(n), 2000, 9000) * 0.006 * width
    return np.stack([left, right], axis=1)


def write(name: str, data: np.ndarray, kind: str, tags: list[str], note: str, bitrate="112k"):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    data = np.asarray(data, dtype=np.float64)
    if data.ndim == 1:
        data = stereo(data)
    wav = OUT_DIR / f"{name}.wav"
    mp3 = OUT_DIR / f"{name}.mp3"

    pcm = np.clip(data, -1, 1)
    pcm16 = (pcm * 32767).astype("<i2")
    import wave

    with wave.open(str(wav), "wb") as fh:
        fh.setnchannels(2)
        fh.setsampwidth(2)
        fh.setframerate(SR)
        fh.writeframes(pcm16.tobytes())

    subprocess.run(
        [FFMPEG, "-hide_banner", "-loglevel", "error", "-y", "-i", str(wav),
         "-c:a", "libmp3lame", "-b:a", bitrate, str(mp3)],
        check=True,
    )
    wav.unlink()

    duration = len(pcm) / SR
    peak = 20 * math.log10(max(np.abs(pcm).max(), 1e-9))
    rms = 20 * math.log10(max(np.sqrt(np.mean(pcm ** 2)), 1e-9))
    size = mp3.stat().st_size
    print(f"  {name:22s} {duration:6.1f}s  peak {peak:5.1f} dB  rms {rms:6.1f} dB  {size/1024:7.0f} KB  [{kind}]")
    return {
        "name": name,
        "file": f"assets/audio/horror/{name}.mp3",
        "kind": kind,
        "tags": tags,
        "note": note,
        "durationSeconds": round(duration, 2),
        "peakDb": round(peak, 1),
        "rmsDb": round(rms, 1),
        "sizeKb": round(size / 1024, 1),
    }


# ── Musik latar (bed) ─────────────────────────────────────────────────────────
def bed_drone_dread():
    """Drone rendah yang bergerak pelan: ruang yang tidak pernah tenang."""
    dur = 60.0
    n = int(dur * SR)
    out = np.zeros(n)
    for freq, amp, rate in ((41.0, 0.5, 0.05), (61.5, 0.3, 0.07), (55.0, 0.22, 0.031)):
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * rate * t(dur) + RNG.uniform(0, 6))
        out += amp * sine(freq, dur) * lfo
    air = bandpass(noise(dur), 180, 900) * 0.35
    air *= 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.043 * t(dur)))
    out += air
    # denting logam jauh, tiap ±9 detik, makin jarang di ujung
    for start in np.arange(4, dur - 3, 9.0 + RNG.uniform(-2, 2)):
        ping = sine(690 + RNG.uniform(-40, 40), 2.4) * np.exp(-3.2 * t(2.4)) * 0.09
        i = int(start * SR)
        out[i:i + len(ping)] += ping[: max(0, min(len(ping), n - i))]
    out = reverb(out, 2.4, 0.3, seed=11)
    out *= env(dur, attack=2.0, decay=3.0, curve=1.5)
    return normalize_rms(stereo(out, width=0.6), -20.0)


def bed_music_box():
    """Kotak musik sumbang: melodi pengantar tidur yang salah nada."""
    dur = 48.0
    n = int(dur * SR)
    out = np.zeros(n)
    # A minor, turun naik, dengan satu nada yang selalu meleset 30 sen
    melody = [440.0, 523.25, 659.25, 587.33, 523.25, 493.88, 440.0, 329.63,
              440.0, 523.25, 659.25, 698.46, 659.25, 523.25, 493.88, 440.0]
    step = 60.0 / 66  # 66 bpm, satu nada per ketukan
    t0 = 0.6
    i = 0
    while t0 < dur - 2.5:
        freq = melody[i % len(melody)]
        if i % 7 == 3:
            freq *= 2 ** (30 / 1200)  # 30 sen meleset
        note = (sine(freq, 2.6) + 0.32 * sine(freq * 2, 2.6) + 0.14 * sine(freq * 3.01, 2.6))
        note *= np.exp(-2.6 * t(2.6))
        note *= 1 + 0.06 * np.sin(2 * np.pi * 5.5 * t(2.6))  # goyang pita kaset
        start = int(t0 * SR)
        seg = note[: min(len(note), n - start)]
        out[start:start + len(seg)] += seg * 0.5
        t0 += step
        i += 1
    out += bandpass(noise(dur), 300, 2500) * 0.012  # desis piringan
    out = reverb(out, 1.9, 0.22, seed=12)
    out *= env(dur, attack=0.8, decay=2.5)
    return normalize_rms(stereo(out, width=0.5), -21.0)


def bed_pulse_ritual():
    """Denyut lambat seperti jantung gedung, bukan jantung manusia."""
    dur = 64.0
    n = int(dur * SR)
    out = lowpass(noise(dur), 90) * 0.5
    beat = 1.45
    for start in np.arange(0.5, dur - 3, beat):
        thump = sine(np.linspace(58, 33, int(0.85 * SR)), 0.85) * np.exp(-6 * t(0.85))
        i = int(start * SR)
        seg = thump[: min(len(thump), n - i)]
        out[i:i + len(seg)] += seg * 0.55
    out += sine(48.5, dur) * 0.16 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.02 * t(dur)))
    out += bandpass(noise(dur), 900, 3200) * 0.02 * (0.4 + 0.6 * np.sin(2 * np.pi * 0.11 * t(dur)) ** 2)
    out = reverb(out, 1.4, 0.18, seed=13)
    out *= env(dur, attack=1.5, decay=2.0)
    return normalize_rms(stereo(out, width=0.7), -20.0)


def bed_static_tension():
    """Statik radio yang hidup: untuk cerita siaran, panggilan, rekaman."""
    dur = 45.0
    n = int(dur * SR)
    base = bandpass(noise(dur), 700, 5200) * 0.5
    swells = 0.25 + 0.75 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.06 * t(dur)) ** 2)
    out = base * swells
    # crackle: impuls acak
    for _ in range(70):
        i = RNG.integers(0, n - 2000)
        length = int(RNG.uniform(0.004, 0.03) * SR)
        out[i:i + length] += RNG.standard_normal(length) * RNG.uniform(0.05, 0.35)
    out += sine(1575, dur) * 0.015 * (np.sin(2 * np.pi * 0.004 * t(dur)) ** 2)  # heterodyne tipis
    out *= 1 + 0.25 * np.sin(2 * np.pi * 0.9 * t(dur))  # napas listrik
    out = highpass(out, 180)
    out *= env(dur, attack=1.0, decay=2.5)
    return normalize_rms(stereo(out, width=0.8), -21.0)


def bed_strings_swell():
    """Gesekan nada sumbang yang naik perlahan, lalu putus."""
    dur = 56.0
    n = int(dur * SR)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 4.7 * t(dur))
    out = np.zeros(n)
    for freq, amp in ((110.0, 0.35), (116.5, 0.3), (155.6, 0.25), (233.1, 0.16), (329.6, 0.09)):
        out += amp * saw(freq * vib, dur)
    out = lowpass(out, 1800)
    rise = np.linspace(0, 1, n) ** 2.2
    fall = 1 - np.clip((np.arange(n) - int(dur * 0.86 * SR)) / (0.14 * dur * SR), 0, 1) ** 0.7
    out *= rise * fall
    out += bandpass(noise(dur), 300, 2600) * 0.03 * rise
    out = reverb(out, 2.2, 0.3, seed=14)
    return normalize_rms(stereo(out, width=0.65), -22.0)


def bed_night_ambience():
    """Malam Jawa: jangkrik, angin jauh, satu kodok. Untuk pembuka tenang."""
    dur = 70.0
    n = int(dur * SR)
    out = lowpass(noise(dur), 220) * 0.35
    out *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.03 * t(dur))
    # jangkrik: dua kelompok, saling sahut
    for base in (4300, 5100):
        chirp_gate = (0.5 + 0.5 * np.sin(2 * np.pi * 0.55 * t(dur))) ** 8
        out += bandpass(noise(dur), base - 380, base + 380) * 0.055 * chirp_gate
    # kodok: pulsa rendah jarang
    for start in np.arange(3, dur - 2, 11.5 + RNG.uniform(-3, 3)):
        croak = bandpass(saw(np.linspace(120, 95, int(0.5 * SR)), 0.5), 180, 900)
        croak *= np.exp(-5 * t(0.5)) * 0.12
        i = int(start * SR)
        seg = croak[: min(len(croak), n - i)]
        out[i:i + len(seg)] += seg
    out = reverb(out, 3.0, 0.25, seed=15)
    out *= env(dur, attack=2.5, decay=3.0)
    return normalize_rms(stereo(out, width=0.9), -22.0)


# ── Efek suara (one-shot) ─────────────────────────────────────────────────────
def sfx_pintu_terbuka():
    """Gesekan kayu: model gesekan stick-slip, bukan derau yang disaring saja."""
    dur = 3.6
    n = int(dur * SR)
    tt = t(dur)
    # frekuensi resonansi bergerak (pintu berat membuka perlahan)
    res = 320 + 520 * (tt / dur) ** 0.7 + 60 * np.sin(2 * np.pi * 0.7 * tt)
    grain = RNG.standard_normal(n)
    creak = np.zeros(n)
    phase = np.cumsum(2 * np.pi * res / SR)
    # modulasi amplitudo berbutir: inilah yang membuatnya terdengar "kayu"
    jitter = 0.55 + 0.45 * np.sin(2 * np.pi * (9 + 3 * np.sin(2 * np.pi * 0.4 * tt)) * tt)
    creak = np.sin(phase) * jitter * 0.6 + bandpass(grain, 600, 4200) * 0.35 * jitter
    creak *= env(dur, attack=0.12, decay=0.5, curve=1.4)
    body = bandpass(noise(dur), 90, 260) * 0.25 * np.exp(-2.0 * tt)
    out = reverb(creak + body, 1.1, 0.16, seed=21)
    return normalize(stereo(out, width=0.3), -3.0)


def sfx_pintu_dibanting():
    dur = 1.5
    thump = lowpass(noise(dur), 160) * np.exp(-9 * t(dur)) * 0.9
    wood = bandpass(noise(dur), 180, 700) * np.exp(-14 * t(dur)) * 0.5
    slap = highpass(noise(0.06), 1500) * np.exp(-40 * t(0.06)) * 0.6
    out = thump + wood
    out[: len(slap)] += slap
    out = reverb(out, 0.9, 0.2, seed=22)
    return normalize(stereo(out, width=0.35), -2.0)


def sfx_ketukan():
    dur = 2.4
    n = int(dur * SR)
    out = np.zeros(n)
    for k, start in enumerate((0.0, 0.42, 0.84)):
        click = highpass(noise(0.05), 1200) * np.exp(-90 * t(0.05)) * 0.5
        body = bandpass(noise(0.35), 150, 520) * np.exp(-16 * t(0.35)) * (0.55 - 0.06 * k)
        i = int(start * SR)
        out[i:i + len(body)] += body[: min(len(body), n - i)]
        out[i:i + len(click)] += click[: min(len(click), n - i)]
    out = reverb(out, 0.8, 0.18, seed=23)
    return normalize(stereo(out, width=0.2), -3.0)


def sfx_petir():
    """Guntur: retak di depan, badan gemuruh panjang di belakang."""
    dur = 7.0
    tt = t(dur)
    crack = highpass(noise(0.35), 900) * np.exp(-12 * t(0.35)) * 0.9
    rumble = lowpass(noise(dur), 130) * (0.15 + 0.85 * np.exp(-1.1 * tt))
    rumble *= 0.55 + 0.45 * np.sin(2 * np.pi * 0.7 * tt)  # gelombang guntur
    sub = sine(np.linspace(48, 30, len(tt)), dur) * np.exp(-0.8 * tt) * 0.5
    out = rumble * 0.8 + sub
    out[: len(crack)] += crack
    out = reverb(out, 2.6, 0.35, seed=24)
    return normalize(stereo(out, width=0.75), -2.0)


def sfx_hujan():
    dur = 40.0
    drops = lowpass(noise(dur), 9000) * 0.35
    body = bandpass(noise(dur), 300, 3500) * 0.25
    out = drops + body
    # butir-butir besar
    for _ in range(900):
        i = RNG.integers(0, len(out) - 3000)
        ln = int(RNG.uniform(0.002, 0.012) * SR)
        out[i:i + ln] += highpass(RNG.standard_normal(ln), 2500) * RNG.uniform(0.02, 0.12)
    out = lowpass(out, 11000)
    out *= 0.9 + 0.1 * np.sin(2 * np.pi * 0.05 * t(dur))
    out *= env(dur, attack=1.5, decay=2.0)
    return normalize(stereo(out, width=0.85), -8.0)


def sfx_tawa_cekikikan():
    """Tawa anak: bukan tawa natural — derau bernada yang salah, justru lebih buruk.

    Dibentuk dari rangkaian suku kata: sumber harmonik 380–520 Hz (getar 7 Hz)
    yang disaring forman /a/ /i/, ditutup konsonan "k" di antaranya.
    """
    out = np.zeros(int(3.4 * SR))
    starts = [0.0, 0.22, 0.40, 0.62, 0.80, 1.06, 1.24, 1.52, 1.70, 1.95, 2.12]
    for idx, start in enumerate(starts):
        length = RNG.uniform(0.12, 0.20) if idx % 2 == 0 else RNG.uniform(0.08, 0.12)
        n = int(length * SR)
        f0 = RNG.uniform(360, 470) * (1 - 0.02 * idx)
        vib = 1 + 0.05 * np.sin(2 * np.pi * 7.5 * np.arange(n) / SR)
        src = saw(f0 * vib, length) + 0.5 * saw(f0 * 2 * vib, length)
        vowel = bandpass(src, 700, 1500) * 0.8 + bandpass(src, 1800, 3200) * 0.5
        breath = bandpass(RNG.standard_normal(n), 900, 5000) * 0.18
        syl = (vowel + breath) * np.exp(-6 * np.arange(n) / n) * 0.5
        i = int(start * SR)
        seg = syl[: min(n, len(out) - i)]
        out[i:i + len(seg)] += seg
        # konsonan "k" tepat sebelum suku kata berikutnya
        if idx < len(starts) - 1:
            gap = int((starts[idx + 1] - 0.06) * SR)
            cl = int(0.02 * SR)
            if gap > 0:
                out[gap:gap + cl] += highpass(RNG.standard_normal(cl), 2000)[: len(out[gap:gap + cl])] * 0.12
    out = reverb(out, 1.8, 0.3, seed=25)
    return normalize(stereo(out, width=0.55), -5.0)


def sfx_bisikan():
    dur = 4.2
    n = int(dur * SR)
    out = np.zeros(n)
    syllables = 12
    for k in range(syllables):
        start = 0.15 + k * (dur - 0.4) / syllables
        length = RNG.uniform(0.10, 0.19)
        m = int(length * SR)
        breath = bandpass(RNG.standard_normal(m), 1100, 4800)
        # forman bergerak membuatnya terbaca sebagai kata, bukan desis
        form = 1600 + 900 * np.sin(2 * np.pi * RNG.uniform(0.8, 1.6) * np.arange(m) / SR)
        breath *= 0.6 + 0.4 * np.sin(2 * np.pi * form / SR * 3)
        breath *= np.exp(-4 * np.arange(m) / m) * 0.4
        i = int(start * SR)
        seg = breath[: min(m, n - i)]
        out[i:i + len(seg)] += seg
    out = reverb(out, 1.4, 0.25, seed=26)
    return normalize(stereo(out, width=0.9), -6.0)


def sfx_radio_statis():
    dur = 4.0
    tt = t(dur)
    out = bandpass(noise(dur), 800, 6000) * (0.3 + 0.7 * (RNG.random(len(tt)) > 0.3))
    out *= np.exp(-0.6 * tt)
    out += sine(1200, dur) * 0.02 * (RNG.random(len(tt)) > 0.7)
    out = highpass(out, 200)
    return normalize(stereo(out, width=0.8), -4.0)


def sfx_logam_tergesek():
    dur = 2.0
    tt = t(dur)
    sweep = bandpass(noise(dur), 900, 5200) * (0.4 + 0.6 * np.sin(2 * np.pi * 3.2 * tt) ** 2)
    ring = sine(np.linspace(2400, 2100, len(tt)), dur) * np.exp(-1.6 * tt) * 0.18
    out = reverb(sweep * np.exp(-1.2 * tt) + ring, 1.6, 0.3, seed=27)
    return normalize(stereo(out, width=0.5), -4.0)


def sfx_angin():
    dur = 24.0
    tt = t(dur)
    gust = 0.35 + 0.65 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * tt + 1.2)) ** 2
    out = lowpass(noise(dur), 700) * gust
    out += bandpass(noise(dur), 400, 1200) * 0.25 * gust
    out += sine(190 + 40 * np.sin(2 * np.pi * 0.03 * tt), dur) * 0.06 * gust
    out *= env(dur, attack=2.0, decay=2.5)
    return normalize(stereo(out, width=0.85), -9.0)


def sfx_langkah_kayu():
    dur = 3.0
    n = int(dur * SR)
    out = np.zeros(n)
    for k, start in enumerate((0.0, 0.58, 1.18, 1.74, 2.34)):
        ln = 0.3
        thud = lowpass(noise(ln), 240) * np.exp(-18 * t(ln)) * (0.5 - 0.05 * k)
        creak = bandpass(noise(ln), 700, 2600) * np.exp(-9 * t(ln)) * 0.12
        i = int(start * SR)
        seg = (thud + creak)[: min(int(ln * SR), n - i)]
        out[i:i + len(seg)] += seg
    out = reverb(out, 0.9, 0.2, seed=28)
    return normalize(stereo(out, width=0.35), -4.0)


def sfx_telepon_lama():
    dur = 6.0
    n = int(dur * SR)
    out = np.zeros(n)
    ring = sine(440, 1.0) + sine(480, 1.0)
    ring *= 0.5 + 0.5 * signal.square(2 * np.pi * 20 * t(1.0))
    ring *= env(1.0, attack=0.01, decay=0.02)
    for start in (0.0, 1.4, 3.6, 5.0):
        i = int(start * SR)
        seg = ring[: min(len(ring), n - i)]
        out[i:i + len(seg)] += seg * 0.35
    out = bandpass(out, 300, 3400)  # speaker telepon tua
    out = reverb(out, 1.2, 0.2, seed=29)
    return normalize(stereo(out, width=0.45), -5.0)


def sfx_tetes_air():
    dur = 5.0
    n = int(dur * SR)
    out = np.zeros(n)
    for start in (0.0, 0.9, 1.4, 2.7, 3.1, 4.4):
        ln = 0.25
        freq = np.linspace(1100, 320, int(ln * SR))
        drip = sine(freq, ln) * np.exp(-22 * t(ln)) * 0.5
        splash = highpass(noise(0.05), 3000) * np.exp(-40 * t(0.05)) * 0.12
        i = int(start * SR)
        seg = drip[: min(len(drip), n - i)]
        out[i:i + len(seg)] += seg
        out[i:i + len(splash)] += splash[: min(len(splash), n - i)]
    out = reverb(out, 2.2, 0.4, seed=30)  # ruang beton kosong
    return normalize(stereo(out, width=0.7), -5.0)


def sfx_jam_berdetak():
    dur = 12.0
    n = int(dur * SR)
    out = np.zeros(n)
    for k, start in enumerate(np.arange(0, dur - 0.2, 1.0)):
        tick = highpass(noise(0.012), 1800) * np.exp(-120 * t(0.012)) * 0.35
        body = sine(2400 if k % 2 == 0 else 1900, 0.05) * np.exp(-45 * t(0.05)) * 0.2
        hit = np.zeros(int(0.05 * SR))
        hit[: len(tick)] += tick[: len(hit)]
        hit[: len(body)] += body[: len(hit)]
        i = int(start * SR)
        seg = hit[: min(len(hit), n - i)]
        out[i:i + len(seg)] += seg
    out = reverb(out, 0.8, 0.15, seed=31)
    return normalize(stereo(out, width=0.4), -6.0)


def sfx_nafas_berat():
    dur = 5.0
    out = np.zeros(int(dur * SR))
    for k, start in enumerate((0.3, 2.2, 3.6)):
        ln = RNG.uniform(0.7, 1.1)
        m = int(ln * SR)
        breath = bandpass(RNG.standard_normal(m), 300, 2200)
        shape = np.sin(np.linspace(0, np.pi, m)) ** 1.6
        i = int(start * SR)
        seg = (breath * shape * 0.35)[: min(m, len(out) - i)]
        out[i:i + len(seg)] += seg
    return normalize(stereo(reverb(out, 1.0, 0.15, seed=32), width=0.4), -6.0)


def sfx_anak_bersenandung():
    """Senandung anak: melodi sederhana, tanpa kata, salah satu nadanya sumbang."""
    dur = 10.0
    n = int(dur * SR)
    out = np.zeros(n)
    notes = [(392.0, 0.55), (440.0, 0.55), (523.25, 0.8), (440.0, 0.55), (392.0, 1.0)]
    pos = 0.4
    k = 0
    while pos < dur - 1.4:
        freq, length = notes[k % len(notes)]
        if k == 6:
            freq *= 2 ** (-45 / 1200)
        m = int(length * SR)
        vib = 1 + 0.012 * np.sin(2 * np.pi * 5.2 * np.arange(m) / SR)
        voice = sine(freq * vib, length) + 0.4 * sine(freq * 2 * vib, length) + 0.12 * sine(freq * 3 * vib, length)
        voice = bandpass(voice, 240, 2600)
        voice *= np.sin(np.linspace(0, np.pi, m)) ** 0.8 * 0.28
        i = int(pos * SR)
        seg = voice[: min(m, n - i)]
        out[i:i + len(seg)] += seg
        pos += length + RNG.uniform(0.12, 0.4)
        k += 1
    out = reverb(out, 2.0, 0.3, seed=33)
    return normalize(stereo(out, width=0.6), -7.0)


def sfx_stinger():
    """Pukulan jumpscare: satu ketukan dissonan + pekik, 1,2 detik."""
    dur = 1.4
    tt = t(dur)
    cluster = saw(302, dur) * 0.3 + saw(317.5, dur) * 0.3 + saw(453, dur) * 0.2
    cluster = lowpass(cluster, 3200) * np.exp(-4.5 * tt)
    screech = bandpass(noise(dur), 1800, 6000) * np.exp(-6 * tt) * 0.35
    hit = lowpass(noise(0.4), 200) * np.exp(-12 * t(0.4)) * 0.7
    out = cluster + screech
    out[: len(hit)] += hit
    out = reverb(out, 1.2, 0.25, seed=34)
    return normalize(stereo(out, width=0.5), -1.5)


def sfx_riser():
    dur = 6.0
    tt = t(dur)
    tone = sine(np.geomspace(90, 1400, len(tt)), dur) * 0.25
    air = bandpass(noise(dur), 400, 8000) * 0.5
    shape = (tt / dur) ** 2.6
    out = reverb((tone + air) * shape, 1.5, 0.25, seed=35)
    return normalize(stereo(out, width=0.6), -5.0)


def sfx_whoosh():
    dur = 1.3
    tt = t(dur)
    sweep = bandpass(noise(dur), 300, 5000) * np.exp(-3.2 * tt)
    sweep *= 0.4 + 0.6 * np.sin(np.pi * tt / dur)
    return normalize(stereo(sweep, width=0.7), -6.0)


def sfx_detak_jantung():
    dur = 8.0
    n = int(dur * SR)
    out = np.zeros(n)
    for start in np.arange(0.2, dur - 0.8, 0.92):
        for offset, amp in ((0.0, 1.0), (0.22, 0.6)):
            ln = 0.28
            beat = sine(np.linspace(70, 40, int(ln * SR)), ln) * np.exp(-18 * t(ln)) * amp
            i = int((start + offset) * SR)
            seg = beat[: min(len(beat), n - i)]
            out[i:i + len(seg)] += seg * 0.6
    out = lowpass(out, 220)
    return normalize(stereo(out, width=0.25), -4.0)


def sfx_geraman_setan():
    """Geraman: sumber nada rendah yang dicacah, bukan derau — terdengar bernapas."""
    dur = 4.2
    tt = t(dur)
    base = saw(np.linspace(52, 40, len(tt)), dur) * 0.5 + saw(np.linspace(78, 61, len(tt)), dur) * 0.3
    # cacahan 11 Hz membuatnya terdengar seperti tenggorokan, bukan sinyal uji
    grate = 0.45 + 0.55 * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * tt + 0.6 * np.sin(2 * np.pi * 3 * tt)))
    growl = lowpass(base * grate, 900)
    breath = bandpass(RNG.standard_normal(len(tt)), 200, 1800) * 0.22 * grate
    out = (growl + breath) * env(dur, attack=0.35, decay=0.9)
    out = reverb(out, 1.6, 0.28, seed=41)
    return normalize(stereo(out, width=0.5), -3.0)


def sfx_teriakan():
    """Pekik: saturasi tajam dengan forman naik — jangan dipakai lebih dari sekali."""
    dur = 2.2
    tt = t(dur)
    f0 = np.linspace(320, 780, len(tt)) * (1 + 0.03 * np.sin(2 * np.pi * 8 * tt))
    src = saw(f0, dur) + 0.6 * saw(f0 * 2.02, dur)
    scream = bandpass(src, 700, 3200) * 0.8 + bandpass(src, 2200, 5200) * 0.4
    scream *= np.sin(np.pi * np.clip(tt / dur, 0, 1)) ** 0.7
    rasp = bandpass(RNG.standard_normal(len(tt)), 1200, 6000) * 0.2
    out = np.tanh((scream + rasp) * 1.8) * 0.7
    out = reverb(out, 1.4, 0.3, seed=42)
    return normalize(stereo(out, width=0.6), -2.0)


def sfx_tangisan():
    """Tangis perempuan dari ruang lain: dua nada turun, tanpa kata."""
    dur = 7.0
    out = np.zeros(int(dur * SR))
    starts = [0.2, 1.15, 2.35, 3.1, 4.4, 5.25, 6.0]
    for index, start in enumerate(starts):
        length = RNG.uniform(0.55, 0.95)
        m = int(length * SR)
        tt = np.arange(m) / SR
        f0 = (420 if index % 2 == 0 else 370) * (1 - 0.18 * tt / length)
        vib = 1 + 0.02 * np.sin(2 * np.pi * 6.5 * tt)
        voice = sine(f0 * vib, length) + 0.45 * sine(f0 * 2 * vib, length) + 0.18 * sine(f0 * 3 * vib, length)
        voice = bandpass(voice, 300, 2600)
        sob = 0.55 + 0.45 * np.sin(2 * np.pi * 9 * tt) ** 2
        voice *= np.sin(np.pi * tt / length) ** 0.8 * 0.3 * sob
        i = int(start * SR)
        seg = voice[: min(m, len(out) - i)]
        out[i:i + len(seg)] += seg
    out = reverb(out, 2.4, 0.35, seed=43)
    return normalize(stereo(out, width=0.7), -5.0)


def sfx_desahan_iblis():
    """Desahan berlapis: tiga napas dengan nada berbeda, seperti lebih dari satu mulut."""
    dur = 5.5
    out = np.zeros(int(dur * SR))
    for k, (start, low, high) in enumerate(((0.0, 180, 900), (1.2, 140, 700), (2.6, 220, 1100))):
        length = RNG.uniform(1.1, 1.6)
        m = int(length * SR)
        tt = np.arange(m) / SR
        breath = bandpass(RNG.standard_normal(m), low, high)
        tone = sine(np.linspace(88, 62, m), length) * 0.25
        layer = (breath * 0.5 + tone) * np.sin(np.pi * tt / length) ** 1.4
        i = int(start * SR)
        seg = layer[: min(m, len(out) - i)]
        out[i:i + len(seg)] += seg * (0.5 - 0.08 * k)
    out = reverb(out, 2.0, 0.32, seed=44)
    return normalize(stereo(out, width=0.75), -5.0)


# ── Daftar aset ───────────────────────────────────────────────────────────────
@dataclass
class Asset:
    name: str
    kind: str
    tags: list[str]
    note: str
    fn: object


ASSETS: list[Asset] = [
    Asset("bed_drone_dread", "bed", ["gelap", "sunyi", "ruang", "umum"], "Drone rendah bergerak, denting logam jauh. Latar default.", bed_drone_dread),
    Asset("bed_music_box", "bed", ["anak", "musik", "lemari", "kamar", "umum"], "Kotak musik sumbang 66 bpm, satu nada meleset 30 sen.", bed_music_box),
    Asset("bed_pulse_ritual", "bed", ["jantung", "ritual", "lorong", "umum"], "Denyut lambat 41 bpm seperti jantung gedung.", bed_pulse_ritual),
    Asset("bed_static_tension", "bed", ["radio", "siaran", "telepon", "rekaman"], "Statik radio hidup dengan crackle dan heterodyne.", bed_static_tension),
    Asset("bed_strings_swell", "bed", ["naik", "klimaks", "akhir", "umum"], "Gesekan sumbang yang naik lalu putus di detik 48.", bed_strings_swell),
    Asset("bed_night_ambience", "bed", ["malam", "luar", "jangkrik", "kos", "umum"], "Jangkrik, angin jauh, kodok. Untuk pembuka tenang.", bed_night_ambience),

    Asset("sfx_pintu_terbuka", "sfx", ["pintu", "lemari", "buka", "kamar"], "Gesekan kayu 3,6 s — model stick-slip.", sfx_pintu_terbuka),
    Asset("sfx_pintu_dibanting", "sfx", ["pintu", "banting", "kaget"], "Bantingan pintu 1,5 s.", sfx_pintu_dibanting),
    Asset("sfx_ketukan", "sfx", ["ketuk", "pintu", "tok", "dinding"], "Tiga ketukan 2,4 s.", sfx_ketukan),
    Asset("sfx_petir", "sfx", ["petir", "hujan", "badai", "guntur"], "Guntur 7 s: retak di depan, gemuruh panjang.", sfx_petir),
    Asset("sfx_hujan", "sfx", ["hujan", "deras", "malam", "luar"], "Hujan 40 s, loop-able.", sfx_hujan),
    Asset("sfx_tawa_cekikikan", "sfx", ["tawa", "cekikikan", "anak", "kaget"], "Tawa anak 3,4 s — sengaja tidak natural.", sfx_tawa_cekikikan),
    Asset("sfx_bisikan", "sfx", ["bisik", "suara", "nama", "telinga"], "Bisikan 4,2 s dengan forman bergerak.", sfx_bisikan),
    Asset("sfx_radio_statis", "sfx", ["radio", "statik", "siaran", "putus"], "Burst statik 4 s.", sfx_radio_statis),
    Asset("sfx_logam_tergesek", "sfx", ["logam", "besi", "gesek", "pagar"], "Gesekan logam 2 s.", sfx_logam_tergesek),
    Asset("sfx_angin", "sfx", ["angin", "luar", "malam", "jendela"], "Angin 24 s.", sfx_angin),
    Asset("sfx_langkah_kayu", "sfx", ["langkah", "kaki", "lorong", "atap"], "Lima langkah di lantai kayu 3 s.", sfx_langkah_kayu),
    Asset("sfx_telepon_lama", "sfx", ["telepon", "dering", "panggilan", "kantor"], "Dering telepon rumah tua 6 s.", sfx_telepon_lama),
    Asset("sfx_tetes_air", "sfx", ["air", "tetes", "bocor", "beton"], "Tetes air 5 s dengan ruang beton.", sfx_tetes_air),
    Asset("sfx_jam_berdetak", "sfx", ["jam", "detak", "waktu", "tunggu"], "Detak 12 s.", sfx_jam_berdetak),
    Asset("sfx_nafas_berat", "sfx", ["napas", "bernapas", "dekat", "ketakutan"], "Napas 5 s.", sfx_nafas_berat),
    Asset("sfx_anak_bersenandung", "sfx", ["anak", "senandung", "lemari", "musik"], "Senandung anak tanpa kata 10 s.", sfx_anak_bersenandung),
    Asset("sfx_stinger", "sfx", ["kaget", "jumpscare", "pukul", "klimaks"], "Pukulan jumpscare 1,4 s.", sfx_stinger),
    Asset("sfx_riser", "sfx", ["naik", "tegang", "sebelum", "klimaks"], "Riser 6 s.", sfx_riser),
    Asset("sfx_whoosh", "sfx", ["transisi", "pindah", "cepat"], "Whoosh 1,3 s.", sfx_whoosh),
    Asset("sfx_detak_jantung", "sfx", ["jantung", "detak", "tegang", "tunggu"], "Detak jantung 8 s.", sfx_detak_jantung),

    Asset("sfx_geraman_setan", "sfx", ["geram", "setan", "iblis", "makhluk", "dekat"], "Geraman bertenggorokan 4,2 s.", sfx_geraman_setan),
    Asset("sfx_teriakan", "sfx", ["teriak", "pekik", "kaget", "klimaks"], "Pekik 2,2 s — sekali per episode.", sfx_teriakan),
    Asset("sfx_tangisan", "sfx", ["tangis", "menangis", "perempuan", "ruang"], "Tangis dari ruang lain 7 s.", sfx_tangisan),
    Asset("sfx_desahan_iblis", "sfx", ["desah", "napas", "iblis", "berlapis", "dekat"], "Desahan tiga lapis 5,5 s.", sfx_desahan_iblis),
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", nargs="*", help="nama aset yang dibangun ulang")
    parser.add_argument("--list", action="store_true", help="tampilkan daftar aset")
    args = parser.parse_args()

    if args.list:
        for a in ASSETS:
            print(f"{a.name:22s} [{a.kind:3s}] {a.note}  (tag: {', '.join(a.tags)})")
        return 0

    chosen = [a for a in ASSETS if not args.only or a.name in args.only or any(tag in args.only for tag in a.tags)]
    print(f"membangun {len(chosen)} aset ke {OUT_DIR.relative_to(ROOT)}")
    entries = []
    for asset in chosen:
        entries.append(write(asset.name, asset.fn(), asset.kind, asset.tags, asset.note))

    manifest_path = OUT_DIR / "manifest.json"
    existing = {}
    if manifest_path.exists():
        existing = {e["name"]: e for e in json.loads(manifest_path.read_text()).get("assets", [])}
    for entry in entries:
        existing[entry["name"]] = entry

    manifest = {
        "generatedBy": "tools/audio/build-horror-assets.py",
        "sampleRate": SR,
        "format": "mp3 112 kbps stereo",
        "note": "Semua aset disintesis dari rumus, bebas royalti. Dibangun ulang dengan hasil sama karena seed tetap.",
        "assets": sorted(existing.values(), key=lambda e: (e["kind"], e["name"])),
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    total = sum(e["sizeKb"] for e in manifest["assets"])
    print(f"manifest: {len(manifest['assets'])} aset, {total/1024:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
