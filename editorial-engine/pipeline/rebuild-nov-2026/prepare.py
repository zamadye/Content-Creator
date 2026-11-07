#!/usr/bin/env python3
"""Rebuild inputs, original instrumental bed, and approximate captions for one episode.

Run from editorial-engine: python3 pipeline/rebuild-nov-2026/prepare.py EPISODE_ID
Reads the public narration/storyboard JSON and private PNG/MP3 from ignored paths.
It intentionally does not post or share anything. Timings are estimates, not ASR.
"""
import hashlib
import json
import math
import os
import re
import struct
import subprocess
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
FFMPEG = ROOT / 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
FFPROBE = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
BASE = 'rebuild-2026-11-11'


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def duration(path):
    output = subprocess.check_output([str(FFPROBE), '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', str(path)], text=True)
    return float(output.strip())


def pauses(path):
    p = subprocess.run([str(FFMPEG), '-nostdin', '-hide_banner', '-i', str(path), '-af', 'silencedetect=noise=-35dB:d=0.18', '-f', 'null', '-'], capture_output=True, text=True, check=True)
    starts = [float(n) for n in re.findall(r'silence_start: ([0-9.]+)', p.stderr)]
    ends = [float(n) for n in re.findall(r'silence_end: ([0-9.]+)', p.stderr)]
    return [(a + b) / 2 for a, b in zip(starts, ends) if b > a]


def chunks(text, n=35):
    # Group complete sentences where possible; split longer sentences into
    # balanced phrases, then balance each phrase into at most two short lines.
    sentences = re.findall(r'.+?(?:[.!?](?:\s|$)|$)', text)
    phrases = []
    for raw in sentences:
        sentence = raw.strip()
        if not sentence:
            continue
        if phrases and len(phrases[-1] + ' ' + sentence) <= 2*n:
            phrases[-1] += ' ' + sentence
            continue
        words = sentence.split()
        count = max(1, math.ceil(len(sentence)/(2*n-3)))
        while count > 1 and len(words) > 3:
            target = len(' '.join(words))/count
            candidates = range(2, len(words)-1)
            k = min(candidates, key=lambda i: abs(len(' '.join(words[:i]))-target) - (4 if words[i-1].endswith((',', ':', ';')) else 0))
            phrases.append(' '.join(words[:k]))
            words = words[k:]
            count -= 1
        phrases.append(' '.join(words))
    result = []
    for phrase in phrases:
        if len(phrase) <= n:
            result.append([phrase])
            continue
        words = phrase.split()
        k = min(range(1,len(words)), key=lambda i: max(len(' '.join(words[:i])), len(' '.join(words[i:]))) + (100 if max(len(' '.join(words[:i])), len(' '.join(words[i:])))>n else 0))
        result.append([' '.join(words[:k]),' '.join(words[k:])])
    return result


def score(path, seconds, episode_id):
    # Original sparse piano-like tones: deterministic, no borrowed track or samples.
    # Episode-derived pitch and tempo keep the nine beds from being exact repeats.
    sr = 22050
    seed = hashlib.sha256(episode_id.encode()).digest()
    transpose = 2 ** ((seed[0] % 7 - 3) / 12)
    beat = 1.5 + (seed[1] % 5) * 0.12
    notes = [n * transpose for n in [220.00, 261.63, 329.63, 392.00, 293.66, 349.23, 440.00, 329.63]]
    total = math.ceil(seconds * sr)
    with wave.open(str(path), 'wb') as w:
        w.setparams((1, 2, sr, total, 'NONE', 'not compressed'))
        data = bytearray()
        for i in range(total):
            t = i / sr
            phase = t % beat
            idx = int(t / beat) % len(notes)
            f = notes[idx]
            envelope = min(1.0, phase / 0.06) * math.exp(-2.1 * phase)
            fade = min(1.0, t / 0.2, max(0.0, (seconds - t) / 0.8))
            tone = envelope * (math.sin(2 * math.pi * f * t) + 0.2 * math.sin(2 * math.pi * 2 * f * t))
            low = 0.28 * math.sin(2 * math.pi * (notes[0]/2) * t) * (0.6 + 0.4 * math.sin(2 * math.pi * 0.12 * t))
            value = int(max(-1, min(1, (tone + low) * 0.29 * fade)) * 32767)
            data.extend(struct.pack('<h', value))
        w.writeframes(data)


def stamp(seconds):
    ms = max(0, round(seconds * 1000))
    hours, ms = divmod(ms, 3_600_000)
    minutes, ms = divmod(ms, 60_000)
    secs, ms = divmod(ms, 1000)
    return f'{hours:02}:{minutes:02}:{secs:02},{ms:03}'


def main():
    if len(sys.argv) != 2:
        sys.exit('Usage: python3 pipeline/rebuild-nov-2026/prepare.py EPISODE_ID')
    episode_id = sys.argv[1]
    records = json.loads(Path('content/recovered/week-2026-11-11-narration.json').read_text())['episodes']
    boards = json.loads(Path('content/recovered/week-2026-11-11-storyboards.json').read_text())['episodes']
    ep = next(e for e in records if e['id'] == episode_id)
    board = next(e for e in boards if e['id'] == episode_id)
    assert ' '.join(s['narration'] for s in board['scenes']) == ep['narration'], 'Storyboard does not match narration'
    assert all(len(s['objects']) >= 2 and s['motion'] for s in board['scenes'])
    voice = Path('audio/voiceovers') / BASE / f'{episode_id}.mp3'
    image = Path('assets/generated') / BASE / f'{episode_id}.png'
    if not voice.is_file() or not image.is_file():
        sys.exit(f'Missing private voice or art: {voice} / {image}')
    out = Path('deliverables') / BASE / episode_id
    out.mkdir(parents=True, exist_ok=True)
    seconds = duration(voice)
    assert 10 <= seconds <= 75, f'Unexpected voice duration {seconds}'
    silences = pauses(voice)
    scene_weights = [len(s['narration']) for s in board['scenes']]
    bounds = [0.0]
    for i in range(1, len(scene_weights)):
        guess = seconds * sum(scene_weights[:i]) / sum(scene_weights)
        choices = [p for p in silences if bounds[-1] + 2.0 < p < seconds - (len(scene_weights)-i)*2.0 and abs(p-guess)<1.1]
        bounds.append(min(choices, key=lambda p: abs(p-guess)) if choices else guess)
    bounds.append(seconds)
    cues = []
    for i, scene in enumerate(board['scenes']):
        line_groups = chunks(scene['narration'])
        weights = [max(1, len(' '.join(g))) for g in line_groups]
        b0, b1 = bounds[i], bounds[i+1]
        cursor = b0
        for j, group in enumerate(line_groups):
            desired_end = b1 if j == len(line_groups)-1 else b0 + (b1-b0) * sum(weights[:j+1]) / sum(weights)
            close = [p for p in silences if cursor + 0.7 < p < b1 - 0.6 and abs(p-desired_end)<0.30]
            end = min(close,key=lambda p:abs(p-desired_end)) if close and j < len(line_groups)-1 else desired_end
            end = max(cursor + 0.01, end)
            cues.append({'start': round(cursor,3), 'end': round(end,3), 'lines': group})
            cursor = end
    # Image is converted to a small JPEG only for repeated in-memory video rendering;
    # the original PNG stays intact in the private asset backup.
    hero = out / 'illustration-render.jpg'
    subprocess.run([str(FFMPEG), '-nostdin','-loglevel','error','-y','-i',str(image),'-vf','scale=720:-2','-q:v','3','-frames:v','1',str(hero)], check=True)
    soundtrack = out / 'original-score.wav'
    score(soundtrack, seconds + 0.5, episode_id)
    prepared = {'episode': ep, 'board': board, 'voice': str(voice.resolve()), 'image': str(image.resolve()), 'hero': str(hero.resolve()), 'score': str(soundtrack.resolve()), 'voiceDuration': seconds, 'videoDuration': math.ceil((seconds+0.5)*30)/30, 'sceneBounds': [round(b,3) for b in bounds], 'cues': cues, 'inputSHA256': {'voice': sha(voice), 'image': sha(image)}, 'timingNote':'Estimated by text length and detected pauses; NOT forced-aligned. Human listening required.'}
    (out / 'prepared.json').write_text(json.dumps(prepared,ensure_ascii=False,indent=2)+'\n')
    with (out / 'subtitle-perkiraan.srt').open('w') as f:
        for n, cue in enumerate(cues, 1):
            f.write(f'{n}\n{stamp(cue["start"])} --> {stamp(cue["end"])}\n'+'\n'.join(cue['lines'])+'\n\n')
    print(json.dumps({'id':episode_id,'duration':seconds,'sceneBounds':prepared['sceneBounds'],'cues':len(cues),'inputSHA256':prepared['inputSHA256']}))

if __name__ == '__main__':
    main()
