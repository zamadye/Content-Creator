#!/usr/bin/env python3
"""Prepare ONE timeline for the new shark/forest episode; never publish.

Segment offsets are sample-accurate, not word-level forced alignment. Subtitle
breaks and timings must still be listened to and adjusted by a human.
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
HERE = ROOT / 'content/recovered/hiu-sebelum-hutan-2026-11-07.json'
DATA = json.loads(HERE.read_text(encoding='utf8'))
OUT = ROOT / 'deliverables/shark-2026-11-07'
ART = ROOT / 'assets/generated/episode-shark-2026-11-07'
VOICE = ROOT / 'audio/voiceovers/episode-shark-2026-11-07'
OUT.mkdir(parents=True, exist_ok=True)
SR = 48000
FPS = 30
# Preserve all narration while fitting Buffer's 90-second Facebook Reel limit.
# atempo preserves pitch approximately; human listening is still essential.
SPEECH_TEMPO = 1.15
# Human-authored phrase boundaries. Their *timing* is still only an estimate.
SUBTITLE_BREAKS = {
 'S01': [['Hiu sudah ada sebelum pohon?'], ['Catatan fosil memberi petunjuk','yang mengejutkan.'], ['Mari kita buka arsip Bumi.']],
 'S02': [['Kita punya dua kotak:'], ['petunjuk hiu purba dari laut,','dan jejak hutan purba dari daratan.'], ['Mana yang lebih tua?']],
 'S03': [['Menurut Smithsonian, sisik hiu','tertua yang terkonfirmasi'], ['berasal dari Siberia, sekitar'], ['empat ratus dua puluh juta tahun','lalu.'], ['Yang ditemukan sisiknya,','bukan seekor hiu utuh.']],
 'S04': [['Rangka hiu tersusun dari tulang','rawan yang jarang menjadi fosil.'], ['Karena itu, sisik dan gigi','sering membantu peneliti'], ['menelusuri sejarahnya.']],
 'S05': [['Di Inggris, tim peneliti','menemukan jejak hutan fosil'], ['yang berumur sekitar','tiga ratus sembilan puluh'], ['juta tahun. Ada batang,','jejak akar, dan sedimen.']],
 'S06': [['Pohon di hutan itu berbeda','dari pohon sekarang:'], ['batangnya ramping, dan cabangnya','menyerupai ranting-ranting kecil.'], ['Ilustrasi ini bukan foto fosil.']],
 'S07': [['Di garis waktu, sisik hiu tadi','lebih tua sekitar'], ['tiga puluh juta tahun dibanding','hutan fosil tersebut.'], ['Tapi penemuan baru bisa','memperbarui catatan.']],
 'S08': [['Bukan berarti hiu modern sama','persis dengan hiu purba,'], ['atau seekor hiu hidup selama itu.'], ['Kelompok hiu terus berevolusi.']],
 'S09': [['Jadi, yang dibandingkan adalah','catatan fosil, bukan umur'], ['satu hewan. Kamu pilih','menjelajahi laut purba'], ['atau hutan purba?'], ['Tulis di komentar,','dan ikuti knot theory!']]
}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()



def silence_boundaries(p):
    res = subprocess.run([str(FF),'-nostdin','-hide_banner','-i',str(p),'-af','silencedetect=noise=-35dB:d=0.18','-f','null','-'],capture_output=True,text=True,check=True)
    starts = [float(v) for v in re.findall(r'silence_start: ([\d.]+)',res.stderr)]
    ends = [float(v) for v in re.findall(r'silence_end: ([\d.]+)',res.stderr)]
    return [(a,b) for a,b in zip(starts,ends) if b > a]


def stamp(t):
    ms = max(0,round(t * 1000)); hh,ms=divmod(ms,3600000); mm,ms=divmod(ms,60000); ss,ms=divmod(ms,1000)
    return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'


def synth_score(path, seconds, boundaries):
    """Original gentle tonal bed and scene accents; no external recorded music."""
    sr=22050; n=math.ceil(seconds*sr); boundaries=list(boundaries)
    chords=[(110,138.59,164.81),(98,123.47,146.83),(87.31,110,130.81),(98,123.47,146.83)]
    melody=[329.63,392,493.88,392,293.66,369.99,440,369.99]
    frames=bytearray()
    for i in range(n):
        t=i/sr; chord=chords[int(t/17)%len(chords)]
        fade=min(1,t/.4,max(0,(seconds-t)/1.5))
        harmonic=sum(math.sin(2*math.pi*f*t)/(1+j*.35) for j,f in enumerate(chord))*.085
        phase=(t-.8)%2.65
        f=melody[int(max(0,t-.8)/2.65)%len(melody)]
        mallet=math.sin(2*math.pi*f*t)*math.exp(-2.9*phase)*min(1,phase/.03)*.11 if t>=.8 else 0
        hit=0.0
        for b in boundaries:
            dt=t-b
            if 0 <= dt < .35:
                hit+=math.sin(2*math.pi*659.25*dt)*math.exp(-10*dt)*min(1,dt/.01)*.09
        sample=max(-1,min(1,(harmonic+mallet+hit)*fade))
        frames.extend(struct.pack('<h',round(sample*32767)))
    with wave.open(str(path),'wb') as w:
        w.setparams((1,2,sr,n,'NONE','not compressed')); w.writeframes(frames)


assert len(DATA['scenes']) == 9
assert all(len(s['objectMap']) >= 3 and s['action'] for s in DATA['scenes'])
assert 'ikuti knot theory' in DATA['scenes'][-1]['narration']
segments=[]; timeline=[]; cues=[]; sample_offset=0
for i, scene in enumerate(DATA['scenes']):
    src=VOICE / f"{scene['id']}.mp3"
    if not src.is_file(): raise FileNotFoundError(src)
    wav=OUT / f"{scene['id']}-decoded.wav"
    subprocess.run([str(FF),'-nostdin','-hide_banner','-loglevel','error','-y','-i',str(src),'-af',f'atempo={SPEECH_TEMPO}','-ac','1','-ar',str(SR),'-c:a','pcm_s16le',str(wav)],check=True)
    with wave.open(str(wav),'rb') as w:
        if (w.getnchannels(),w.getsampwidth(),w.getframerate()) != (1,2,SR): raise ValueError('Bad decoded voice')
        samples=w.getnframes(); audio=w.readframes(samples)
    start=sample_offset/SR
    intervals=silence_boundaries(wav)
    end_voice=start+samples/SR
    gap=round((.18 if i < 8 else .55)*SR)
    scene_end=(sample_offset+samples+gap)/SR
    timeline.append({'id':scene['id'],'start':start,'voiceEnd':end_voice,'end':scene_end,'sourceSHA256':sha(src)})
    segments.append(audio + bytes(gap*2))
    # Silence detection anchors scene-local subtitle estimates to actual speech,
    # but does not prove word alignment.
    first=intervals[0][1] if intervals and intervals[0][0] < .06 else 0.0
    last=intervals[-1][0] if intervals and intervals[-1][1] > samples/SR-.06 else samples/SR
    groups=SUBTITLE_BREAKS[scene['id']]
    assert ' '.join(' '.join(g) for g in groups) == scene['narration'], f"Subtitle mismatch: {scene['id']}"
    assert all(len(g)<=2 and max(map(len,g))<=36 for g in groups), f"Subtitle width: {scene['id']}"
    weights=[len(' '.join(g)) for g in groups]
    cursor=first
    for j,group in enumerate(groups):
        target=last if j == len(groups)-1 else first+(last-first)*sum(weights[:j+1])/sum(weights)
        candidates=[(a+b)/2 for a,b in intervals if a>cursor+.55 and b<last-.4 and abs((a+b)/2-target)<.75]
        stop=min(candidates,key=lambda p:abs(p-target)) if candidates and j<len(groups)-1 else target
        stop=max(cursor+.05,stop)
        cues.append({'start':round(start+cursor,3),'end':round(start+stop,3),'lines':group,'scene':scene['id']})
        cursor=stop
    sample_offset += samples+gap

raw=b''.join(segments)
narration=OUT/'narasi-gabungan.wav'
with wave.open(str(narration),'wb') as w:
    w.setparams((1,2,SR,sample_offset,'NONE','not compressed'));w.writeframes(raw)
subprocess.run([str(FF),'-nostdin','-loglevel','error','-y','-i',str(narration),'-b:a','128k',str(OUT/'narasi-gabungan.mp3')],check=True)
length=math.ceil((sample_offset/SR)*FPS)/FPS
if not 3 <= length <= 90:
    raise ValueError(f'Facebook Reels via Buffer requires 3–90 seconds; generated {length:.2f}s')
art={}
for name in ['hero','lab','forest']:
    src=ART/f'{name}.png'
    if not src.is_file(): raise FileNotFoundError(src)
    dst=OUT/f'{name}-render.jpg'
    subprocess.run([str(FF),'-nostdin','-loglevel','error','-y','-i',str(src),'-vf','scale=720:-2','-q:v','3','-frames:v','1',str(dst)],check=True)
    art[name]={'render':str(dst),'sha256':sha(src)}
score=OUT/'musik-tonal-original.wav';synth_score(score,length,[x['start'] for x in timeline[1:]])
with (OUT/'subtitle-perkiraan.srt').open('w',encoding='utf8') as f:
    for n,q in enumerate(cues,1):f.write(f"{n}\n{stamp(q['start'])} --> {stamp(q['end'])}\n"+'\n'.join(q['lines'])+'\n\n')
prepared={'id':DATA['id'],'story':DATA,'timeline':timeline,'cues':cues,'duration':length,'fps':FPS,'speechTempo':SPEECH_TEMPO,'art':art,'narration':str(narration),'score':str(score),'narrationSHA256':sha(narration),'timingNote':'Narration sped up 1.15x using atempo. Scene offsets sample-accurate from assembled clips; subtitle phrase times estimated using pauses and text length, NOT forced-aligned.'}
(OUT/'prepared.json').write_text(json.dumps(prepared,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'id':DATA['id'],'duration':length,'sceneCount':len(timeline),'cueCount':len(cues),'sceneDurations':[round(x['end']-x['start'],2) for x in timeline]},ensure_ascii=False))
