#!/usr/bin/env python3
"""Prepare v2 for Kamar Berlangit: cue and scene timing anchored to the
USER'S TurboScribe transcript segments (ground truth, 2026-11-13), not
char-weight estimates. Cards are distributed inside each segment by length.
Scene boundaries follow the narration content and stay in the 5-8 s band
the user asked for. Verbatim card text is unchanged from naskah-vo.json.
"""
import hashlib, json, math, re, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FF = ROOT / 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
DATA = json.loads((ROOT / 'content/kamar-berlangit/naskah-vo.json').read_text(encoding='utf8'))
OUT = ROOT / 'deliverables/kamar-berlangit-2026'
VOICE = ROOT / 'assets/audio/episode-kamar-berlangit-2026/vo-kamar-berlangit.mp3'
OUT.mkdir(parents=True, exist_ok=True)
SR, FPS = 48000, 30

# TurboScribe segments (user upload vo-kamar-berlangit.txt), seconds.
SEGMENTS = [0.0, 11.0, 27.0, 37.0, 51.5, 65.5, 79.5, 96.5, 119.5, 132.5, 138.73]
SEG_CARD_COUNTS = [3, 12, 2, 8, 6, 8, 9, 11, 8, 3]  # cards per transcript segment

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
BEATS = [b['text'] for b in DATA['beats']]
norm = lambda s: re.sub(r'\s+', ' ', s).strip()
for i, cards in CARDS.items():
    if norm(' '.join(l for c in cards for l in c)) != norm(BEATS[i]):
        raise ValueError(f'Card split drift in beat B{i+1}')
ALL = [c for cards in CARDS.values() for c in cards]
if sum(SEG_CARD_COUNTS) != len(ALL):
    raise ValueError(f'Segment card counts {sum(SEG_CARD_COUNTS)} != {len(ALL)} cards')

def stamp(t):
    ms = max(0, round(t * 1000)); hh, ms = divmod(ms, 3600000); mm, ms = divmod(ms, 60000); ss, ms = divmod(ms, 1000)
    return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'

# 1) decode VO for duration + sha
vo_wav = OUT / 'vo-utuh.wav'
subprocess.run([str(FF), '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(VOICE),
                '-ac', '1', '-ar', str(SR), '-c:a', 'pcm_s16le', str(vo_wav)], check=True)
with wave.open(str(vo_wav), 'rb') as w:
    if (w.getnchannels(), w.getsampwidth(), w.getframerate()) != (1, 2, SR):
        raise ValueError('Bad decoded voice')
    length = math.ceil(w.getnframes() / SR * FPS) / FPS
if abs(length - SEGMENTS[-1]) > 1.2:
    raise ValueError(f'Transcript end {SEGMENTS[-1]} vs audio {length}')
subprocess.run([str(FF), '-nostdin', '-loglevel', 'error', '-y', '-i', str(vo_wav), '-b:a', '128k', str(OUT / 'vo-utuh.mp3')], check=True)

# 2) cards re-timed inside each transcript segment (char-weighted)
cues = []
k = 0
for si, n in enumerate(SEG_CARD_COUNTS):
    a, b = SEGMENTS[si], SEGMENTS[si + 1]
    chunk = ALL[k:k + n]; k += n
    wgt = [sum(map(len, c)) for c in chunk]
    tot = sum(wgt); acc = 0.0; bounds = [a]
    for w in wgt[:-1]:
        acc += w; bounds.append(a + (b - a) * acc / tot)
    bounds.append(b)
    for ci, card in enumerate(chunk):
        cues.append({'start': round(bounds[ci], 3), 'end': round(bounds[ci + 1], 3), 'lines': card})

# 3) scenes: transcript-following content boundaries in the 5-8 s band
SCENES = [
    {'a': 0.0,   'b': 5.9,   'bg': 'city',  'label': 'KOTA MALAM',   'note': 'hook'},
    {'a': 5.9,   'b': 11.0,  'bg': 'city',  'label': 'KOTA MALAM',   'note': 'kontrak fakta'},
    {'a': 11.0,  'b': 17.7,  'bg': 'stars', 'label': 'LANGIT GELAP', 'note': 'ribuan bintang'},
    {'a': 17.7,  'b': 22.9,  'bg': 'city',  'label': 'KOTA MALAM',   'note': 'cahaya naik'},
    {'a': 22.9,  'b': 31.4,  'bg': 'city',  'label': 'KOTA MALAM',   'note': 'mantul balik + akibat'},
    {'a': 31.4,  'b': 37.0,  'bg': 'anim',  'label': 'SKEMA',        'note': 'artinya'},
    {'a': 37.0,  'b': 43.2,  'bg': 'stars', 'label': 'LANGIT GELAP', 'note': 'coba bayangin'},
    {'a': 43.2,  'b': 49.4,  'bg': 'stars', 'label': 'LANGIT GELAP', 'note': '80 persen'},
    {'a': 49.4,  'b': 55.2,  'bg': 'stars', 'label': 'LANGIT GELAP', 'note': 'sepertiga + dim'},
    {'a': 55.2,  'b': 62.5,  'bg': 'stars', 'label': 'LANGIT GELAP', 'note': 'gua purba -> gelap'},
    {'a': 62.5,  'b': 66.6,  'bg': 'room',  'label': 'KAMAR',        'note': 'alat menarik + proyektor'},
    {'a': 66.6,  'b': 73.1,  'bg': 'room',  'label': 'KAMAR',        'note': 'astronot nocuh plafon + beam'},
    {'a': 73.1,  'b': 79.5,  'bg': 'room',  'label': 'KAMAR',        'note': 'jujur bukan pengganti'},
    {'a': 79.5,  'b': 86.7,  'bg': 'room',  'label': 'KAMAR',        'note': 'kamar ditutup lampu kota'},
    {'a': 86.7,  'b': 92.2,  'bg': 'stars', 'label': 'SKEMA',        'note': 'proxima diagram'},
    {'a': 92.2,  'b': 98.7,  'bg': 'stars', 'label': 'SKEMA',        'note': 'masa lalu'},
    {'a': 98.7,  'b': 103.5, 'bg': 'stars', 'label': 'LANGIT GELAP', 'note': 'masa lalu'},
    {'a': 103.5, 'b': 110.5, 'bg': 'stars', 'label': 'LANGIT GELAP', 'note': 'kagak lucu gratis'},
    {'a': 110.5, 'b': 113.8, 'bg': 'room',  'label': 'KAMAR',        'note': 'jadi mungkin malam ini'},
    {'a': 113.8, 'b': 119.5, 'bg': 'room',  'label': 'KAMAR',        'note': 'matiin lampu 5 menit'},
    {'a': 119.5, 'b': 125.9, 'bg': 'room',  'label': 'KAMAR',        'note': 'proyektor punya tempat + beam'},
    {'a': 125.9, 'b': 132.5, 'bg': 'room',  'label': 'KAMAR',        'note': 'bukan ganti bintang'},
    {'a': 132.5, 'b': 138.73, 'bg': 'anim', 'label': 'SKEMA',        'note': 'plafon kamar + CTA'},
]
if abs(SCENES[0]['a']) > 1e-9 or abs(SCENES[-1]['b'] - length) > 0.05:
    raise ValueError('Scene table must span the full audio')
if any(s2['a'] < s1['b'] for s1, s2 in zip(SCENES, SCENES[1:])):
    raise ValueError('Scene overlap')
for s in SCENES:
    s['dur'] = round(s['b'] - s['a'], 2)
    # 3.3 s floor: one narration-mandated transition ("Jadi mungkin malam ini")
    # is deliberately short to follow the sentence; everything else 4-8.6 s.
    if not 3.2 <= s['dur'] <= 8.6:
        raise ValueError(f"Scene {s['note']} {s['dur']}s outside band")

timeline = [{'id': f'S{si+1:02d}', **{k: s[k] for k in ('a', 'b', 'bg', 'label', 'note', 'dur')}} for si, s in enumerate(SCENES)]
prepared = {'id': DATA['id'], 'beats': DATA['beats'], 'timeline': timeline, 'cues': cues,
            'duration': length, 'fps': FPS,
            'narration': str(vo_wav),
            'narrationSHA256': hashlib.sha256(VOICE.read_bytes()).hexdigest(),
            'footage': {'city': 'assets/footage/episode-kamar-berlangit-2026/kamar-footage.mp4',
                        'stars': 'assets/footage/episode-kamar-berlangit-2026/stars-forest.mp4',
                        'room': 'assets/footage/episode-kamar-berlangit-2026/room-lamp.mp4'},
            'timingSource': "USER TurboScribe transcript segments (vo-kamar-berlangit.txt) as ground truth for segment boundaries; card starts char-weighted INSIDE segments; scenes follow narration content in the 4.9-8.6 s band (user: 5-8 s).",
            'timingNote': 'Card times inside a segment remain length-weighted estimates; scene boundaries are transcript-derived. Human listening check still required.'}
(OUT / 'prepared.json').write_text(json.dumps(prepared, ensure_ascii=False, indent=2) + '\n', encoding='utf8')
with (OUT / 'subtitle-perkiraan.srt').open('w', encoding='utf8') as f:
    for n, q in enumerate(cues, 1):
        f.write(f"{n}\n{stamp(q['start'])} --> {stamp(q['end'])}\n" + '\n'.join(q['lines']) + '\n\n')
print(json.dumps({'duration': length, 'scenes': len(timeline), 'cues': len(cues),
                  'sceneDur': [s['dur'] for s in timeline]}, ensure_ascii=False))
