#!/usr/bin/env python3
"""Prepare one private voice take, a single clock, estimates, and original music.

No network access, publishing or mutation of V2. Timings are based on detected
silences of this exact take and estimates within sentences; NOT forced-aligned.
"""
import hashlib, json, math, re, struct, subprocess, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
D = ROOT / 'deliverables/awan-rig-v3'
FF = ROOT / 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
A = ROOT / 'assets/generated/awan-rig-v2'
V = ROOT / 'audio/voiceovers/awan-rig-v3/narasi-utuh.mp3'
SPEC = ROOT / 'content/recovered/awan-500-ton-rig-v3.json'
VOICE_SHA = 'ff2f78f60f5d0c6f8cc4a6788c8d02047363290d409c70fbe1a20a98460cf3bf'
ART_SHA = {
 'rooftop':'d57dd2724376e909e37fa0cfd3c2fc34204a9c2e2e5debc9fccfda7f64f2bef2',
 'microcloud':'394b703afea76584cc3f6ae4f233258e56d2c99c02312bf8a47a8ad356d9777c',
 'rainstreet':'e951e4a312b03fa1b94fda78235813235dd5bd42d3afb6a376e4a953e7398da2',
}
FPS = 30
# The detected leading silence of the take ends near .390 s. A 150 ms segment
# of the longer pause between the two opening questions is also removed. No
# speech is time-stretched. Recheck these ranges if the take changes.
LEAD_TRIM, PAUSE_IN, PAUSE_OUT = .34, 2.45, 2.60
# Cue boundaries are manually estimated from the above take's silence pattern.
# A human must hear and correct word timing before publication.
RAW_CUES = [
 (.390, 2.333, ['Lima ratus ton air melayang?']),
 (2.733, 3.432, ['Kok bisa?']),
 (4.158, 6.850, ['Coba bayangkan air sebanyak itu']),
 (6.850, 9.827, ['terkumpul di dalam tangki raksasa,', 'tepat di atas rumah.']),
 (10.501, 12.865, ['Tapi angka ini bukan berat', 'setiap awan.']),
 (13.208, 15.885, ['Ini hanya satu contoh', 'yang dihitung USGS.']),
 (16.526, 17.246, ['Lihat lebih dekat.']),
 (17.716, 18.993, ['Awan bukan tangki.']),
 (19.305, 22.661, ['Airnya tersebar menjadi banyak', 'tetesan yang sangat kecil.']),
 (23.389, 25.562, ['Gravitasi tetap menarik', 'setiap tetes.']),
 (25.919, 28.307, ['Tapi tetes kecil turun pelan', 'di udara tenang.']),
 (28.901, 32.183, ['Saat udara bergerak naik,', 'sebagian tetes itu ikut terbawa.']),
 (32.702, 35.574, ['Itulah salah satu alasan awan', 'bisa bertahan di langit.']),
 (36.251, 40.202, ['Dalam contoh USGS, awannya', 'berukuran satu kilometer kubik.']),
 (40.520, 43.478, ['Di tiap meter kubik, ada', 'sekitar setengah gram air.']),
 (43.968, 47.424, ['Kalau dijumlahkan, airnya sekitar', 'lima ratus ribu kilogram,']),
 (47.660, 49.189, ['atau lima ratus ton.']),
 (49.399, 52.118, ['Ini massa airnya saja,', 'belum termasuk udara.']),
 (52.716, 55.712, ['Di beberapa awan, tetesan', 'bertabrakan dan membesar.']),
 (56.185, 58.986, ['Saat cukup besar, sebagian', 'bisa jatuh sebagai hujan.']),
 (59.519, 61.800, ['Jadi bukan tangki terbang,']),
 (61.800, 64.157, ['melainkan banyak tetes kecil', 'di udara yang bergerak.']),
 (64.874, 67.488, ['Sebelum ini, kamu membayangkan', 'awan seperti apa?']),
 (68.006, 70.676, ['Ceritakan di komentar,', 'dan ikuti knot theory.']),
]
# One scene clock. Scene 2 begins immediately after the full opening question;
# other cuts lie in observed sentence/paragraph silences. Frame quantisation is
# explicit so the visual cut is on frame 89 (2.967 seconds).
RAW_BREAKS = [None, None, 10.164, 16.205, 23.025, 28.604, 35.912, 43.723, 52.417, 59.252]

def sha(p):
 h = hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda: f.read(1048576), b''): h.update(b)
 return h.hexdigest()

def mapped(t):
 if t <= LEAD_TRIM: return 0.0
 if t <= PAUSE_IN: return t - LEAD_TRIM
 if t < PAUSE_OUT: return PAUSE_IN - LEAD_TRIM
 return t - LEAD_TRIM - (PAUSE_OUT - PAUSE_IN)

def stamp(t):
 ms = round(t * 1000); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
 return f'{h:02}:{m:02}:{s:02},{ms:03}'

def score(path, seconds, changes):
 """A local, original musical bed: chords, plucks, pulse and scene accents."""
 sr=22050; n=math.ceil(seconds*sr); buf=bytearray()
 chords=[(110,130.81,164.81),(98,116.54,146.83),(87.31,110,130.81),(98,123.47,146.83)]
 melody=[329.63,392,493.88,392,293.66,369.99,440,369.99]
 for i in range(n):
  t=i/sr; fade=min(1,t/.35,max(0,(seconds-t)/1.4)); ch=chords[int(t/15)%4]
  pad=sum(math.sin(2*math.pi*f*t)/(1+j*.35) for j,f in enumerate(ch))*.07
  phase=(t-.5)%2.3; f=melody[int(max(0,t-.5)/2.3)%8]
  pluck=math.sin(2*math.pi*f*t)*math.exp(-3.5*phase)*min(1,phase/.03)*.09 if t>=.5 else 0
  beat=t%(60/88*2); pulse=math.sin(2*math.pi*(50*beat-8*beat*beat))*math.exp(-7*beat)*min(1,beat/.015)*.075 if beat<.45 else 0
  accent=sum(math.sin(2*math.pi*659.25*(t-b))*math.exp(-8*(t-b))*min(1,(t-b)/.01)*.10 for b in changes if 0<=t-b<.4)
  sample=max(-1,min(1,(pad+pluck+pulse+accent)*fade)); buf.extend(struct.pack('<h', round(sample*32767)))
 with wave.open(str(path),'wb') as w: w.setparams((1,2,sr,n,'NONE','not compressed')); w.writeframes(buf)

def main():
 D.mkdir(parents=True, exist_ok=True)
 if not V.is_file() or sha(V) != VOICE_SHA: raise SystemExit('FAIL: voice-05 take missing/changed; generate new alignment, do not bypass hash')
 for name,digest in ART_SHA.items():
  if not (A/f'{name}.png').is_file() or sha(A/f'{name}.png') != digest: raise SystemExit(f'FAIL: private source background {name} missing/changed')
 story=json.loads(SPEC.read_text(encoding='utf-8'))
 assert len(story['scenes'])==10
 assert story['scenes'][0]['payoffScene']=='S04' and story['scenes'][0]['narration']=='Lima ratus ton air melayang? Kok bisa?'
 assert all(len(set(s['objectMap']))>=2 and s['action'] for s in story['scenes'])
 normal=lambda s: re.sub(r'\s+', ' ', s).strip()
 assert normal(' '.join(s['narration'] for s in story['scenes']))==normal(' '.join(' '.join(c[2]) for c in RAW_CUES)), 'Subtitle text does not match narration'
 assert all(0<=a<b and len(lines)<=2 and max(map(len,lines))<=36 for a,b,lines in RAW_CUES)
 assert all(a[1]<=b[0] for a,b in zip(RAW_CUES,RAW_CUES[1:]))
 voice=D/'narasi-utuh.wav'
 flt=(f'[0:a]asplit=2[a][b];[a]atrim=start={LEAD_TRIM}:end={PAUSE_IN},asetpts=PTS-STARTPTS[x];'
      f'[b]atrim=start={PAUSE_OUT},asetpts=PTS-STARTPTS[y];[x][y]concat=n=2:v=0:a=1[aout]')
 subprocess.run([str(FF),'-nostdin','-v','error','-y','-i',str(V),'-filter_complex',flt,'-map','[aout]','-ac','1','-ar','48000','-c:a','pcm_s16le',str(voice)],check=True)
 with wave.open(str(voice),'rb') as w: vd=w.getnframes()/w.getframerate()
 if not 70.2 < vd < 70.9: raise SystemExit(f'FAIL: unexpected decoded voice duration: {vd}')
 length=math.ceil((vd+1.35)*FPS)/FPS
 starts=[0,89/FPS]+[round(mapped(t)*FPS)/FPS for t in RAW_BREAKS[2:]]
 assert len(starts)==10 and all(a<b for a,b in zip(starts,starts[1:])) and starts[-1]<length
 ends=starts[1:]+[length]
 timeline=[{'id':s['id'],'start':a,'end':b} for s,a,b in zip(story['scenes'],starts,ends)]
 art={}
 for name in ART_SHA:
  src=A/f'{name}.png'; dst=D/f'{name}-render.jpg'
  vf='crop=704:1312:32:32,scale=720:-2' if name=='rooftop' else 'scale=720:-2'
  subprocess.run([str(FF),'-nostdin','-v','error','-y','-i',str(src),'-vf',vf,'-q:v','3','-frames:v','1',str(dst)],check=True)
  art[name]={'render':str(dst),'sha256':ART_SHA[name]}
 bed=D/'musik-original.wav'; score(bed,length,starts[1:])
 cues=[{'start':round(mapped(a),3),'end':round(mapped(b),3),'lines':lines} for a,b,lines in RAW_CUES]
 with (D/'subtitle-perkiraan.srt').open('w',encoding='utf-8') as f:
  for n,c in enumerate(cues,1): f.write(f"{n}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+'\n'.join(c['lines'])+'\n\n')
 prepared={'id':story['id'],'story':story,'timeline':timeline,'cues':cues,'duration':length,'voiceDuration':vd,'fps':FPS,'voiceSHA256':VOICE_SHA,'speechTempo':1,'art':art,'narration':str(voice),'score':str(bed),
  'timingNote':'Satu take voice-05; hanya sunyi awal 0,34 detik dan sebagian jeda antar pertanyaan 0,15 detik dipangkas. Tidak dipercepat. Boundary dan subtitle estimasi dari jeda, bukan forced alignment; perlu review manusia.'}
 (D/'prepared.json').write_text(json.dumps(prepared,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'duration':length,'voice':vd,'starts':starts,'cues':len(cues),'hookCutSeconds':starts[1]},ensure_ascii=False))

if __name__=='__main__': main()
