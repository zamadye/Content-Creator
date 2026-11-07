#!/usr/bin/env python3
"""Prepare one narration-derived timeline. Does not publish or use a network.

This timing map was authored against one specific voice take and natural pauses;
it is not forced alignment or a substitute for listening to each word.
"""
import hashlib, json, math, re, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = ROOT/'deliverables/awan-500-ton-2026'
ART = ROOT/'assets/generated/awan-di-langit'
VOICE = ROOT/'audio/voiceovers/awan-500-ton-2026/narasi-utuh.mp3'
FF = ROOT/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
STORY = json.loads((ROOT/'content/recovered/awan-500-ton-2026.json').read_text(encoding='utf8'))
VOICE_SHA = '18397a48c4c11714d19db215f5007bb995a3436bbe53c464fbf568d1cac4f819'
FPS = 30
# Starts sit in natural inter-sentence pauses of this exact voice take.
STARTS = [0, 6.65, 14.40, 21.65, 32.20, 38.62, 48.08, 54.13, 61.45]
# Phrase boundaries combine pauses with estimated positions inside sentences.
# Keep captions intact when a word spans a boundary; a human must review sync.
CUES = [
 (0.28,4.55,['Awan yang terlihat ringan ini','bisa menyimpan ratusan ton air.']),
 (4.91,6.55,['Kok enggak langsung jatuh?']),
 (6.85,9.55,['Kita enggak menimbangnya pakai','timbangan raksasa.']),
 (9.93,14.30,['Berat airnya bisa diperkirakan','dari ukuran dan kadar air awan.']),
 (14.77,18.52,['USGS memberi contoh awan kumulus','satu kilometer kubik,']),
 (18.52,21.57,['dengan setengah gram air','di setiap meter kubik.']),
 (21.95,24.80,['Kalau dihitung, tetesan airnya','berjumlah sekitar']),
 (24.80,28.46,['lima ratus ribu kilogram,','atau lima ratus ton.']),
 (28.88,32.12,['Ini contoh hitungan, bukan','berat setiap awan.']),
 (32.52,34.65,['Nah, bayangan kita sering keliru:']),
 (34.83,36.65,['air sebanyak itu bukan','satu kantong raksasa']),
 (36.65,38.58,['yang menggantung di langit.']),
 (38.91,42.15,['Airnya tersebar sebagai','tetesan yang sangat kecil.']),
 (42.69,44.37,['Gravitasi tetap menariknya.']),
 (44.65,47.99,['Dalam udara tenang, tetes kecil','turun sangat pelan.']),
 (48.38,50.72,['Sementara itu, udara','yang bergerak naik']),
 (50.72,54.05,['bisa membawa tetesan kecil','tetap melayang di dalam awan.']),
 (54.42,57.72,['Di beberapa awan, tetesan','saling bertemu dan membesar.']),
 (57.99,61.37,['Saat cukup besar, sebagian','bisa jatuh sebagai hujan.']),
 (61.77,63.85,['Jadi, awan bukan tanpa berat.']),
 (64.09,67.72,['Dalam contoh ini, tetesannya ada','di udara yang terus bergerak.']),
 (68.08,71.16,['Kalau kamu lihat awan, bentuk apa','yang sering kamu temukan?']),
 (71.41,73.85,['Tulis di komentar, dan ikuti','knot theory.']),
]

def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''): h.update(chunk)
    return h.hexdigest()

def stamp(t):
    ms=max(0,round(t*1000));hh,ms=divmod(ms,3600000);mm,ms=divmod(ms,60000);ss,ms=divmod(ms,1000)
    return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'

def synth_score(path, seconds, boundaries):
    """Original tonal bed: minor-key pad, mallet and soft pulse, no stock music."""
    import struct
    sr=22050;n=math.ceil(seconds*sr);frames=bytearray()
    chords=[(110,130.81,164.81),(98,116.54,146.83),(87.31,110,130.81),(98,123.47,146.83)]
    melody=[329.63,392,493.88,392,293.66,369.99,440,369.99]
    for i in range(n):
        t=i/sr;chord=chords[int(t/17)%len(chords)];fade=min(1,t/.4,max(0,(seconds-t)/1.5))
        harmonic=sum(math.sin(2*math.pi*f*t)/(1+j*.35) for j,f in enumerate(chord))*.085
        phase=(t-.8)%2.65;f=melody[int(max(0,t-.8)/2.65)%len(melody)]
        mallet=math.sin(2*math.pi*f*t)*math.exp(-2.9*phase)*min(1,phase/.03)*.11 if t>=.8 else 0
        hit=sum(math.sin(2*math.pi*659.25*(t-b))*math.exp(-10*(t-b))*min(1,(t-b)/.01)*.09 for b in boundaries if 0<=t-b<.35)
        beat=t%(60/92*2)
        pulse=math.sin(2*math.pi*(52*beat-10*beat*beat))*math.exp(-8*beat)*min(1,beat/.015)*.08 if beat<.5 else 0
        sample=max(-1,min(1,(harmonic+mallet+hit+pulse)*fade));frames.extend(struct.pack('<h',round(sample*32767)))
    with wave.open(str(path),'wb') as w:w.setparams((1,2,sr,n,'NONE','not compressed'));w.writeframes(frames)

D.mkdir(parents=True, exist_ok=True)
if not VOICE.is_file() or sha(VOICE)!=VOICE_SHA:
    raise SystemExit('FAIL: exact voice input missing or changed; timing map requires review and update.')
assert len(STORY['scenes'])==len(STARTS)==9
assert all(len(s['objectMap'])>=2 and s['action'] for s in STORY['scenes'])
assert 'ikuti knot theory' in STORY['scenes'][-1]['narration']
normal=lambda t:re.sub(r'\s+',' ',t).strip()
assert normal(' '.join(x['narration'] for x in STORY['scenes'])) == normal(' '.join(' '.join(v[2]) for v in CUES)), 'Caption text diverges from narration'
assert all(0<=a<b and len(lines)<=2 and max(map(len,lines))<=36 for a,b,lines in CUES)
assert all(a[1]<=b[0] for a,b in zip(CUES,CUES[1:])), 'Overlapping captions'
voice_wav=D/'narasi-utuh.wav'
subprocess.run([str(FF),'-nostdin','-hide_banner','-loglevel','error','-y','-i',str(VOICE),'-ac','1','-ar','48000','-c:a','pcm_s16le',str(voice_wav)],check=True)
with wave.open(str(voice_wav),'rb') as w:voice_duration=w.getnframes()/w.getframerate()
assert 73.7 < voice_duration < 74.1, f'Unexpected decoded voice duration: {voice_duration}'
duration=math.ceil((voice_duration+1.5)*FPS)/FPS
assert 3<=duration<=90
ends=STARTS[1:]+[duration]
timeline=[{'id':s['id'],'start':a,'end':b} for s,a,b in zip(STORY['scenes'],STARTS,ends)]
cues=[{'start':a,'end':b,'lines':lines} for a,b,lines in CUES]
art={}
for name in ['rooftop','microcloud','rainstreet']:
    src=ART/f'{name}.png'
    if not src.is_file():raise FileNotFoundError(src)
    dst=D/f'{name}-render.jpg'
    subprocess.run([str(FF),'-nostdin','-hide_banner','-loglevel','error','-y','-i',str(src),'-vf','scale=540:-2','-q:v','3','-frames:v','1',str(dst)],check=True)
    art[name]={'render':str(dst),'sha256':sha(src)}
score=D/'musik-tonal-original.wav';synth_score(score,duration,STARTS[1:])
with (D/'subtitle-perkiraan.srt').open('w',encoding='utf8') as f:
    for n,q in enumerate(cues,1):f.write(f"{n}\n{stamp(q['start'])} --> {stamp(q['end'])}\n"+'\n'.join(q['lines'])+'\n\n')
prepared={'id':STORY['id'],'story':STORY,'timeline':timeline,'cues':cues,'duration':duration,'voiceDuration':voice_duration,'fps':FPS,'speechTempo':1,'art':art,'narration':str(voice_wav),'score':str(score),'voiceSHA256':VOICE_SHA,'timingNote':'One unsped voice take. Scene starts are positioned near silence; within-sentence subtitle timing is estimated, not forced-aligned. Human listening is required.'}
(D/'prepared.json').write_text(json.dumps(prepared,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'duration':duration,'voice_duration':voice_duration,'scenes':len(timeline),'cues':len(cues),'scene_starts':STARTS}))
