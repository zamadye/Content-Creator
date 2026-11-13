#!/usr/bin/env python3
"""Prepare cue timings for the Kamar Berlangit VO (ElevenLabs Zephlyn, one file).

No user timestamp file exists for this TTS narration, so beat starts are
length-weighted predictions snapped to detected speech pauses — the same
estimation discipline as the Teleskop episode minus the user prior. Every
timing is an estimate a human must verify by listening. Never publishes.
"""
import hashlib
import json
import math
import re
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FF = ROOT / 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
DATA = json.loads((ROOT / 'content/kamar-berlangit/naskah-vo.json').read_text(encoding='utf8'))
OUT = ROOT / 'deliverables/kamar-berlangit-2026'
VOICE = ROOT / 'assets/audio/episode-kamar-berlangit-2026/vo-kamar-berlangit.mp3'
OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
FPS = 30
TEST_SECONDS = 38.0  # composite test covers B1-B4

BEATS = [b['text'] for b in DATA['beats']]
BEAT_IDS = [b['id'] for b in DATA['beats']]
# Meaningful card splits inside each beat: exact verbatim slices.
CARDS = {
 0: [['Pernah nggak lu kepikiran?'], ['Langit malam di kota itu', 'kayaknya isinya dua puluh,'], ['tiga puluh bintang doang.']],
 1: [['Dan ini bukan karena', 'bintangnya yang ilang ya.'], ['Bintangnya tetep ada di tempat.'], ['Yang berubah itu langitnya.']],
 2: [['Langit yang beneran gelap', 'bisa nunjukin bintang'], ['sampai ribuan sekali nengadah.'], ['Tapi di kota besar, lampu jalan,'], ['gedung, sama neon iklan'], ['bikin cahayanya naik ke atmosfer,'], ['mantul-mantul di uap air,'], ['terus balik lagi ke mata kita.'], ['Akibatnya, mata lu cuma kebagian'], ['bintang yang paling terang doang.']],
 3: [['Artinya, yang ngabisin langit', 'malam lu itu bukan awan.'], ['Tapi cahaya yang salah alamat.']],
 4: [['Nah, sekarang coba bayangin'], ['sesuatu yang lebih gila.'], ['Ada penelitian yang ngitung,'], ['sekitar delapan puluh persen'], ['penduduk Amerika Utara udah'], ['nggak bisa liat Bima Sakti'], ['dari tempat tinggal mereka,'], ['cuma gara-gara polusi cahaya.'], ['Sepertiga penduduk bumi juga'], ['kena nasib yang sama.'], ['Bintang yang udah nemani manusia'], ['sejak zaman gua purba, sekarang'], ['ilang dari halaman rumah sendiri.']],
 5: [['Dan di sinilah ada satu alat', 'yang menarik.'], ['Proyektor langit. Bentuknya'], ['kayak astronot kecil, tinggal'], ['dinyalain, terus dia nocuh'], ['pola bintang ke plafon kamar lu.'], ['Jujur ya, dia bukan pengganti'], ['langit asli, dan gak bakal'], ['bikin lu bisa paham arah'], ['mata angin. Tapi buat kamar'], ['yang langitnya ditutup lampu'], ['kota, dia nunjukin pola'], ['bintang sama galaksi yang mulai'], ['jarang banget keliatan.']],
 6: [['Coba pikirin baik-baik.'], ['Bintang terdekat dari bumi,'], ['Proxima Centauri, cahayanya'], ['butuh waktu sekitar empat koma'], ['dua tahun buat nyampe ke mata kita.'], ['Jadi setiap malam, langit itu'], ['sebenernya nunjukin masa lalu,'], ['dari jarak yang dihitung'], ['pakai tahun cahaya. Kagak lucu'], ['banget kan, sesuatu sejauh itu'], ['gratis buat diliat, tapi kita'], ['ngelupain gara-gara lampu?']],
 7: [['Jadi, mungkin malam ini lu bisa'], ['coba hal simpel. Matiin lampu'], ['kamar lima menit, biarin mata lu'], ['adaptasi ke gelap, terus nengadah.'], ['Kalau langit di halaman rumah'], ['udah gak kasih apa-apa lagi,'], ['di situlah proyektor langit'], ['punya tempat. Bukan buat ganti'], ['bintang, tapi buat balikin'], ['kebiasaan nengadah.']],
 8: [['Dan mungkin, hal paling aneh'], ['dari semua ini: langit paling'], ['jelas di kota besar itu bukan'], ['yang di atas kita, tapi yang di'], ['plafon kamar kita.']],
}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def stamp(t):
    ms = max(0, round(t * 1000)); hh, ms = divmod(ms, 3600000); mm, ms = divmod(ms, 60000); ss, ms = divmod(ms, 1000)
    return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'


def silences(wav, noise='-35dB', mind=0.14):
    res = subprocess.run([str(FF), '-nostdin', '-hide_banner', '-i', str(wav),
                          '-af', f'silencedetect=noise={noise}:d={mind}', '-f', 'null', '-'],
                         capture_output=True, text=True, check=True)
    starts = [float(v) for v in re.findall(r'silence_start: ([\d.]+)', res.stderr)]
    ends = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', res.stderr)]
    return [(a, b) for a, b in zip(starts, ends) if b > a]


def snap(t, pauses, span, max_shift):
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


norm = lambda s: re.sub(r'\s+', ' ', s).strip()
for i, cards in CARDS.items():
    if norm(' '.join(line for card in cards for line in card)) != norm(BEATS[i]):
        raise ValueError(f'Card split drift in beat {BEAT_IDS[i]}')
    if any(max(map(len, c)) > 36 for c in cards):
        raise ValueError(f'Card too wide in beat {BEAT_IDS[i]}')
if norm(' '.join(BEATS)) != norm(DATA['fullTextTTS']):
    raise ValueError('Beats do not reproduce fullTextTTS')

vo_wav = OUT / 'vo-utuh.wav'
subprocess.run([str(FF), '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(VOICE),
                '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_s16le', str(vo_wav)], check=True)
with wave.open(str(vo_wav), 'rb') as w:
    if (w.getnchannels(), w.getsampwidth(), w.getframerate()) != (1, 2, SR):
        raise ValueError('Bad decoded voice')
    total_frames = w.getnframes()
audio_len = total_frames / SR
length = math.ceil(audio_len * FPS) / FPS

pauses = silences(vo_wav)
wide = silences(vo_wav, '-33dB', 0.20)
all_pauses = sorted(set(pauses) | set(wide))
spans = silences(vo_wav, '-35dB', 0.45)
voice_on = spans[0][1] if spans else 0.0
voice_off = spans[-1][0] if spans else audio_len
# Beat starts: char-weighted predictions snapped to real pauses.
weights = [len(b) for b in BEATS]
total_w = sum(weights)
starts = [voice_on]
acc = 0.0
for wgt in weights[:-1]:
    acc += wgt
    target = voice_on + (voice_off - voice_on) * acc / total_w
    lo = starts[-1] + 0.25
    hi = voice_off - 0.3
    starts.append(snap(target, all_pauses, (lo, hi), max_shift=2.5))
starts.append(length)
if any(b <= a for a, b in zip(starts, starts[1:])):
    raise ValueError('Non-monotonic beat boundaries')

cues = []
for bi, cards in CARDS.items():
    start, end = starts[bi], starts[bi + 1]
    wgt = [sum(map(len, c)) for c in cards]
    tot = sum(wgt)
    bounds = [start]
    acc = 0.0
    for w in wgt[:-1]:
        acc += w
        target = start + (end - start) * acc / tot
        lo = bounds[-1] + 0.05
        hi = max(lo + 0.01, end - 0.15)
        bounds.append(snap(target, all_pauses, (lo, hi), max_shift=0.5))
    bounds.append(end)
    for ci, card in enumerate(cards):
        cues.append({'start': round(bounds[ci], 3), 'end': round(bounds[ci + 1], 3),
                     'lines': card, 'beat': BEAT_IDS[bi]})
if not all(a['end'] <= b['start'] + 1e-9 for a, b in zip(cues, cues[1:])):
    raise ValueError('Overlapping cues')

timeline = [{'id': BEAT_IDS[bi], 'start': round(starts[bi], 3), 'end': round(starts[bi + 1], 3)} for bi in range(len(BEATS))]
subprocess.run([str(FF), '-nostdin', '-loglevel', 'error', '-y', '-i', str(vo_wav), '-b:a', '128k', str(OUT / 'vo-utuh.mp3')], check=True)
with (OUT / 'subtitle-perkiraan.srt').open('w', encoding='utf8') as f:
    for n, q in enumerate(cues, 1):
        f.write(f"{n}\n{stamp(q['start'])} --> {stamp(q['end'])}\n" + '\n'.join(q['lines']) + '\n\n')
prepared = {'id': DATA['id'], 'beats': DATA['beats'], 'timeline': timeline, 'cues': cues,
            'duration': length, 'fps': FPS, 'testSeconds': TEST_SECONDS,
            'narration': str(vo_wav), 'narrationSHA256': sha(VOICE),
            'footage': {'path': str(ROOT / 'assets/footage/episode-kamar-berlangit-2026/kamar-footage.mp4'),
                        'ready': str(ROOT / 'assets/footage/episode-kamar-berlangit-2026/kamar-footage-ready.json')},
            'timingNote': 'TTS narration without user timestamps: beat starts are char-weighted '
                          'and snapped to detected pauses; card times length-weighted estimates, '
                          'NOT forced-aligned. Human listening required.'}
(OUT / 'prepared.json').write_text(json.dumps(prepared, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
print(json.dumps({'duration': round(length, 2), 'beats': len(timeline), 'cueCount': len(cues),
                  'testWindow': TEST_SECONDS,
                  'beatStarts': [round(s, 2) for s in starts[:-1]],
                  'cuesInTest': sum(1 for q in cues if q['start'] < TEST_SECONDS)}, ensure_ascii=False))
