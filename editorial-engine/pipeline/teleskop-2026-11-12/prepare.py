#!/usr/bin/env python3
"""Prepare ONE timeline for the Teleskop episode; never publish.

The narration is ONE user-recorded MP3, kept verbatim and never re-tempoed.
Subtitle phrase starts come from the user's own timestamp file; they are only
a prior: each boundary is snapped to a real detected speech pause, and every
timing remains an estimate that a human must verify by listening.
"""
import hashlib
import json
import math
import re
import struct
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FF = ROOT / 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
HERE = ROOT / 'pipeline/teleskop-2026-11-12'
DATA = json.loads((ROOT / 'content/teleskop/story-teleskop.json').read_text(encoding='utf8'))
OUT = ROOT / 'deliverables/teleskop-2026-11-12'
ART = ROOT / 'assets/generated/episode-teleskop-2026'
VOICE = ROOT / 'assets/audio/episode-teleskop-2026/vo-teleskop.mp3'
STAMPS = ROOT / 'content/teleskop/teleskop_timestamp.txt'
OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
FPS = 30
# One whole narration; the user's own read is part of the brief. Never atempo.
SPEECH_TEMPO = 1.0
# Human-authored phrase boundaries (from KNOT THEORY/TELESKOP, verbatim text).
# Order and wording are asserted against story-teleskop.json below.
PHRASES = [
 ['Pernah nggak lu kepikiran?'],
 ['Pas lagi ngeliat bintang di langit malam, sebenarnya lu itu kagak lagi ngeliat keadaan bintang tersebut sekarang.'],
 ['Lu justru lagi ngeliat masa lalunya. Dan ini bukan cerita fiksi ilmiah ya.'],
 ['Ada alasan ilmiah yang sederhana banget di balik semua ini.'],
 ['Cahaya itu butuh waktu buat sampai ke mata kita. Bahkan cahaya matahari aja butuh waktu sekitar 8 menit 20 detik buat nyampe ke bumi.'],
 ['Artinya, setiap kali lu ngeliat matahari, yang sebenarnya lu liat adalah keadaan matahari 8 menit yang lalu.'],
 ['Nah, sekarang coba bayangin sesuatu yang jauh lebih gila.'],
 ['Ada sebuah galaksi yang jaraknya sekitar 2,5 juta tahun cahaya dari bumi.'],
 ['Namanya Andromeda.'],
 ['Cahaya dari galaksi ini butuh waktu sekitar 2,5 juta tahun buat nyampe ke mata kita.'],
 ['Jadi, cahaya yang sekarang kita lihat itu sebenarnya berangkat dari sana ketika nenek moyang manusia modern bahkan belum muncul seperti sekarang.'],
 ['Dan ada satu hal yang lebih menarik lagi.'],
 ['Makin jauh kita ngeliat ke luar angkasa, makin jauh juga kita ngeliat ke masa lalu.'],
 ['Nah, di sinilah James Webb Space Telescope punya peran yang luar biasa.'],
 ['Teleskop ini dirancang buat menangkap cahaya inframerah yang sangat redup dari objek-objek yang jaraknya luar biasa jauh.'],
 ['Termasuk galaksi-galaksi yang terbentuk di masa awal alam semesta.'],
 ['Bahkan, pada Januari 2026, NASA mengumumkan konfirmasi sebuah galaksi bernama MOMZ14.'],
 ['Galaksi ini kita lihat sebagaimana keadaannya ketika alam semesta baru berusia sekitar 280 juta tahun setelah Big Bang.'],
 ['Coba pikirin baik-baik.'],
 ['Alam semesta kita sekarang diperkirakan berusia sekitar 13,8 miliar tahun.'],
 ['Tapi, cahaya dari galaksi tersebut sudah menempuh perjalanan lebih dari 13 miliar tahun sebelum akhirnya sampai ke teleskop manusia.'],
 ['Artinya, lewat cahaya yang kita tangkap hari ini, kita bisa mempelajari kondisi alam semesta ketika usianya masih sangat muda.'],
 ['Jadi, ada sesuatu yang menarik dari semua ini.'],
 ['Ketika lu ngeliat semakin jauh ke luar angkasa, sebenarnya lu juga lagi ngeliat semakin jauh ke masa lalu.'],
 ['Dan mungkin, hal paling luar biasa dari alam semesta bukan cuma seberapa luas ukurannya, tapi kenyataan bahwa cahaya yang berangkat miliaran tahun lalu masih bisa tiba di hadapan kita hari ini.'],
]
# Scene k owns phrases in SCENE_PHRASES[k] (index into PHRASES).
SCENE_PHRASES = {'S01': [0, 1], 'S02': [2, 3, 4], 'S03': [5, 6, 7, 8], 'S04': [9, 10],
                 'S05': [11, 12, 13, 14, 15], 'S06': [16, 17, 18, 19, 20], 'S07': [21, 22, 23, 24]}
# Meaningful card splits inside one spoken phrase: exact verbatim slices.
CARDS = {
 0: [['Pernah nggak lu kepikiran?']],
 1: [['Pas lagi ngeliat bintang', 'di langit malam,'], ['sebenarnya lu itu kagak lagi ngeliat'], ['keadaan bintang tersebut sekarang.']],
 2: [['Lu justru lagi ngeliat masa lalunya.'], ['Dan ini bukan cerita', 'fiksi ilmiah ya.']],
 3: [['Ada alasan ilmiah yang sederhana', 'banget di balik semua ini.']],
 4: [['Cahaya itu butuh waktu', 'buat sampai ke mata kita.'], ['Bahkan cahaya matahari aja', 'butuh waktu'], ['sekitar 8 menit 20 detik', 'buat nyampe ke bumi.']],
 5: [['Artinya, setiap kali', 'lu ngeliat matahari,'], ['yang sebenarnya lu liat adalah'], ['keadaan matahari 8 menit yang lalu.']],
 6: [['Nah, sekarang coba bayangin'], ['sesuatu yang jauh lebih gila.']],
 7: [['Ada sebuah galaksi yang jaraknya'], ['sekitar 2,5 juta tahun', 'cahaya dari bumi.']],
 8: [['Namanya Andromeda.']],
 9: [['Cahaya dari galaksi ini butuh waktu'], ['sekitar 2,5 juta tahun', 'buat nyampe ke mata kita.']],
 10: [['Jadi, cahaya yang sekarang', 'kita lihat itu'], ['sebenarnya berangkat', 'dari sana ketika'], ['nenek moyang manusia modern bahkan'], ['belum muncul seperti sekarang.']],
 11: [['Dan ada satu hal', 'yang lebih menarik lagi.']],
 12: [['Makin jauh kita ngeliat', 'ke luar angkasa,'], ['makin jauh juga kita ngeliat', 'ke masa lalu.']],
 13: [['Nah, di sinilah James Webb'], ['Space Telescope punya peran', 'yang luar biasa.']],
 14: [['Teleskop ini dirancang', 'buat menangkap'], ['cahaya inframerah yang sangat redup'], ['dari objek-objek yang jaraknya', 'luar biasa jauh.']],
 15: [['Termasuk galaksi-galaksi', 'yang terbentuk'], ['di masa awal alam semesta.']],
 16: [['Bahkan, pada Januari 2026,'], ['NASA mengumumkan konfirmasi'], ['sebuah galaksi bernama MOMZ14.']],
 17: [['Galaksi ini kita lihat sebagaimana'], ['keadaannya ketika alam semesta'], ['baru berusia sekitar 280 juta tahun'], ['setelah Big Bang.']],
 18: [['Coba pikirin baik-baik.']],
 19: [['Alam semesta kita sekarang', 'diperkirakan'], ['berusia sekitar 13,8 miliar tahun.']],
 20: [['Tapi, cahaya dari galaksi tersebut'], ['sudah menempuh perjalanan lebih dari'], ['13 miliar tahun sebelum akhirnya'], ['sampai ke teleskop manusia.']],
 21: [['Artinya, lewat cahaya yang kita'], ['tangkap hari ini,', 'kita bisa mempelajari'], ['kondisi alam semesta ketika'], ['usianya masih sangat muda.']],
 22: [['Jadi, ada sesuatu yang menarik', 'dari semua ini.']],
 23: [['Ketika lu ngeliat semakin jauh', 'ke luar angkasa,'], ['sebenarnya lu juga lagi ngeliat'], ['semakin jauh ke masa lalu.']],
 24: [['Dan mungkin, hal paling luar biasa'], ['dari alam semesta bukan', 'cuma seberapa'], ['luas ukurannya, tapi kenyataan bahwa'], ['cahaya yang berangkat', 'miliaran tahun lalu'], ['masih bisa tiba di hadapan', 'kita hari ini.']],
}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def stamp(t):
    ms = max(0, round(t * 1000)); hh, ms = divmod(ms, 3600000); mm, ms = divmod(ms, 60000); ss, ms = divmod(ms, 1000)
    return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'


def parse_user_stamps(path):
    """User's own [mm:ss] phrase starts — the prior, not the truth."""
    out = []
    for m in re.finditer(r'\[(\d{2}):(\d{2})\]\s*([^\[]+)', path.read_text(encoding='utf8')):
        mm, ss, text = int(m.group(1)), int(m.group(2)), m.group(3).strip()
        out.append((mm * 60 + ss, text))
    return out


def silences(wav, noise='-35dB', mind=0.14):
    res = subprocess.run([str(FF), '-nostdin', '-hide_banner', '-i', str(wav),
                          '-af', f'silencedetect=noise={noise}:d={mind}', '-f', 'null', '-'],
                         capture_output=True, text=True, check=True)
    starts = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', res.stderr)]
    ends = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', res.stderr)]
    return [(a, b) for a, b in zip(starts, ends) if b > a]


def snap(t, pauses, span, max_shift):
    """Nearest pause midpoint inside the tolerance, else keep t."""
    lo, hi = span
    t = max(lo, min(hi, t))
    best, best_d = t, max_shift
    for a, b in pauses:
        mid = (a + b) / 2
        if not lo <= mid <= hi:
            continue
        d = abs(mid - t)
        if d < best_d:
            best, best_d = mid, d
    return best


# ---- Decode the whole narration once. Never re-tempo the user's read. ----
if not VOICE.is_file():
    raise FileNotFoundError(VOICE)
vo_wav = OUT / 'vo-utuh.wav'
subprocess.run([str(FF), '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(VOICE),
                '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_s16le', str(vo_wav)], check=True)
with wave.open(str(vo_wav), 'rb') as w:
    if (w.getnchannels(), w.getsampwidth(), w.getframerate()) != (1, 2, SR):
        raise ValueError('Bad decoded voice')
    total_frames = w.getnframes()
audio_len = total_frames / SR
length = math.ceil(audio_len * FPS) / FPS

# ---- Cross-check the user's timestamp text against the story and cards. ----
user = parse_user_stamps(STAMPS)
if len(user) != len(PHRASES):
    raise ValueError(f'timestamp phrases {len(user)} != PHRASES {len(PHRASES)}')
for (t, text), ph in zip(user, PHRASES):
    if re.sub(r'\s+', ' ', text) != re.sub(r'\s+', ' ', ph[0]):
        raise ValueError(f'Transcript drift at {t}s: {text!r} != {ph[0]!r}')
story_joined = ' '.join(s['narration'] for s in DATA['scenes'])
cards_joined = ' '.join(' '.join(c) for p in CARDS.values() for c in p)
norm = lambda s: re.sub(r'\s+', ' ', s).strip()
if norm(story_joined) != norm(cards_joined):
    raise ValueError('Story narration does not match the timestamp transcript')
for k, scene in enumerate(DATA['scenes']):
    joined = ' '.join(PHRASES[i][0] for i in SCENE_PHRASES[scene['id']])
    if norm(joined) != norm(scene['narration']):
        raise ValueError(f'Scene mapping broken: {scene["id"]}')
for idx, cards in CARDS.items():
    text = ' '.join(line for card in cards for line in card)
    if norm(text) != norm(PHRASES[idx][0]):
        raise ValueError(f'Card split drift in phrase {idx}')
    if any(max(map(len, c)) > 36 for c in cards):
        raise ValueError(f'Card too wide in phrase {idx}')

# ---- Snap phrase boundaries to real pauses. ----
pauses = silences(vo_wav)
wide = silences(vo_wav, '-33dB', 0.20)
all_pauses = sorted(set(pauses) | set(wide))
user_starts = [t for t, _ in user]
speech_spans = silences(vo_wav, '-35dB', 0.45)
voice_on = speech_spans[0][1] if speech_spans else 0.0
voice_off = speech_spans[-1][0] if speech_spans else audio_len
phrase_starts = [voice_on]
for i in range(1, len(user_starts)):
    predicted = user_starts[i] + (voice_on - user_starts[0])
    t = snap(predicted, all_pauses, (phrase_starts[-1] + 0.25, voice_off - 0.3), max_shift=1.4)
    phrase_starts.append(t)
phrase_starts.append(length)
if any(b <= a for a, b in zip(phrase_starts, phrase_starts[1:])):
    raise ValueError('Non-monotonic phrase boundaries')

# ---- Cards inside each phrase: verbatim slices, one cue per card. ----
scene_of_phrase = {}
for scene in DATA['scenes']:
    for i in SCENE_PHRASES[scene['id']]:
        for k in range(len(CARDS[i])):
            scene_of_phrase[(i, k)] = scene['id']
seq = [(i, k) for i in CARDS for k in range(len(CARDS[i]))]
cues = []
for idx in range(len(PHRASES)):
    cards = CARDS[idx]
    start, end = phrase_starts[idx], phrase_starts[idx + 1]
    weights = [sum(map(len, c)) for c in cards]
    total = sum(weights)
    bounds = [start]
    acc = 0.0
    for wgt in weights[:-1]:
        acc += wgt
        target = start + (end - start) * acc / total
        lo = bounds[-1] + 0.05
        hi = max(lo + 0.01, end - 0.15)
        bounds.append(snap(target, all_pauses, (lo, hi), max_shift=0.5))
    bounds.append(end)
    for ci, card in enumerate(cards):
        cues.append({'start': round(bounds[ci], 3), 'end': round(bounds[ci + 1], 3),
                     'lines': card, 'scene': scene_of_phrase[(idx, ci)]})
if not all(a['end'] <= b['start'] + 1e-9 for a, b in zip(cues, cues[1:])):
    raise ValueError('Overlapping cues')
if abs(cues[-1]['end'] - length) > 1e-3:
    raise ValueError('Last cue must end at video length')

# ---- Scene timeline: contiguous, derived from phrase boundaries. ----
timeline = []
for k, scene in enumerate(DATA['scenes']):
    first = min(SCENE_PHRASES[scene['id']])
    start = 0.0 if k == 0 else phrase_starts[first]
    timeline.append({'id': scene['id'], 'start': round(start, 3), 'voiceEnd': round(start, 3)})
for i, tl in enumerate(timeline):
    tl['end'] = timeline[i + 1]['start'] if i + 1 < len(timeline) else length
if any(abs(a['end'] - b['start']) > 1e-9 for a, b in zip(timeline, timeline[1:])):
    raise ValueError('Scene gaps')
if abs(timeline[0]['start']) > 1e-6:
    raise ValueError('First scene must start at 0')

# ---- Original score, synthesized; no external recorded music. ----
def synth_score(path, seconds, boundaries):
    sr = 22050; n = math.ceil(seconds * sr)
    chords = [(110.0, 130.81, 164.81), (87.31, 110.0, 130.81), (98.0, 123.47, 146.83), (82.41, 98.0, 123.47)]
    melody = [329.63, 392.0, 440.0, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23, 293.66]
    frames = bytearray()
    period = 9.0
    for i in range(n):
        t = i / sr
        chord = chords[int(t / period) % len(chords)]
        fade = min(1, t / .5, max(0, (seconds - t) / 2.0))
        harmonic = sum(math.sin(2 * math.pi * f * t) / (1 + j * .4) for j, f in enumerate(chord)) * .075
        shimmer = math.sin(2 * math.pi * chord[2] * 2 * t) * math.exp(-1.4 * ((t % 4.5) / 4.5)) * .028
        phase = (t - 1.2) % period
        f = melody[int(max(0, t - 1.2) / period) % len(melody)]
        mallet = math.sin(2 * math.pi * f * t) * math.exp(-2.2 * phase) * min(1, phase / .04) * .09 if t >= 1.2 else 0
        hit = 0.0
        for b in boundaries:
            dt = t - b
            if 0 <= dt < .5:
                hit += math.sin(2 * math.pi * 523.25 * dt) * math.exp(-7 * dt) * min(1, dt / .01) * .07
        sample = max(-1, min(1, (harmonic + shimmer + mallet + hit) * fade))
        frames.extend(struct.pack('<h', round(sample * 32767)))
    with wave.open(str(path), 'wb') as w:
        w.setparams((1, 2, sr, n, 'NONE', 'not compressed')); w.writeframes(frames)


score = OUT / 'musik-ruang-original.wav'
synth_score(score, length, [tl['start'] for tl in timeline[1:]])

# ---- Art downscales for the renderer. ----
art = {}
for name in ['night', 'sun', 'galaxy', 'deepfield']:
    src = ART / f'{name}.png'
    if not src.is_file():
        raise FileNotFoundError(src)
    dst = OUT / f'{name}-render.jpg'
    subprocess.run([str(FF), '-nostdin', '-loglevel', 'error', '-y', '-i', str(src),
                    '-vf', 'scale=720:-2', '-q:v', '3', '-frames:v', '1', str(dst)], check=True)
    art[name] = {'render': str(dst), 'sha256': sha(src)}

subprocess.run([str(FF), '-nostdin', '-loglevel', 'error', '-y', '-i', str(vo_wav), '-b:a', '128k', str(OUT / 'vo-utuh.mp3')], check=True)
with (OUT / 'subtitle-perkiraan.srt').open('w', encoding='utf8') as f:
    for n, q in enumerate(cues, 1):
        f.write(f"{n}\n{stamp(q['start'])} --> {stamp(q['end'])}\n" + '\n'.join(q['lines']) + '\n\n')
shifts = [abs(a - b) for a, b in zip([t for t, _ in user][1:], phrase_starts[1:-1])]
prepared = {'id': DATA['id'], 'story': DATA, 'timeline': timeline, 'cues': cues, 'duration': length,
            'fps': FPS, 'speechTempo': SPEECH_TEMPO, 'art': art, 'narration': str(vo_wav),
            'score': str(score), 'narrationSHA256': sha(vo_wav),
            'timingNote': "User's single narration, verbatim, no tempo change. Scene offsets snapped "
                          "from the user's timestamp marks to detected speech pauses; card times are "
                          "length-weighted estimates, NOT forced-aligned. Human listening required."}
(OUT / 'prepared.json').write_text(json.dumps(prepared, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(json.dumps({'id': DATA['id'], 'duration': round(length, 2), 'sceneCount': len(timeline),
                  'cueCount': len(cues), 'pauseCount': len(all_pauses),
                  'maxStampShift': round(max(shifts), 2) if shifts else 0.0,
                  'sceneDurations': [round(t['end'] - t['start'], 2) for t in timeline]}, ensure_ascii=False))
