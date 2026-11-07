#!/usr/bin/env python3
"""Prepare one uninterrupted take and a single 30 fps timeline; never publishes."""
import hashlib,json,math,re,struct,subprocess,wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'deliverables/awan-rig-v2'
FF=ROOT/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg';A=ROOT/'assets/generated/awan-rig-v2';V=ROOT/'audio/voiceovers/awan-rig-v2/narasi-utuh.mp3'
STORY=json.loads((ROOT/'content/recovered/awan-500-ton-rig-v2.json').read_text(encoding='utf8'))
VOICE_SHA='934ebab4af7a178983498ae4f9958063ed85d7d2462adc4d7a93bb7c6d02e22f';FPS=30
# Timed near audible-silence boundaries of this exact voice file. Within-sentence
# splits are estimated, not forced aligned. Human listening remains required.
STARTS=[0,5.35,12.37,21.20,30.01,38.71,45.50,51.68,59.12]
CUES=[
 (.24,2.10,['Lima ratus ton air,']),
 (2.33,3.80,['melayang di langit?']),
 (4.10,5.25,['Kok bisa?']),
 (5.73,8.25,['Kalau awan seperti','tangki air raksasa,']),
 (8.46,10.42,['harusnya tinggal tunggu','jebol, kan?']),
 (10.80,12.30,['Tapi tunggu dulu.']),
 (12.49,14.70,['USGS memakai contoh','awan kumulus berukuran']),
 (14.70,17.33,['satu kilometer kubik.']),
 (17.67,21.12,['Di tiap meter kubiknya,','ada setengah gram air.']),
 (21.60,23.70,['Kalau dijumlahkan, hasilnya','sekitar']),
 (23.70,26.20,['lima ratus ribu kilogram air.']),
 (26.54,30.00,['Itu lima ratus ton,','tapi hanya untuk contoh ini.']),
 (30.35,31.90,['Sekarang lihat lebih dekat.']),
 (32.15,34.94,['Airnya bukan satu tangki','yang menggantung.']),
 (35.19,38.58,['Ia tersebar sebagai banyak','tetesan yang sangat kecil.']),
 (39.09,41.68,['Gravitasi tetap menarik','setiap tetes.']),
 (41.84,45.40,['Dalam udara tenang, tetes kecil','turun sangat pelan.']),
 (45.89,49.00,['Udara yang bergerak naik','bisa membawa tetesan kecil,']),
 (49.10,51.61,['sehingga sebagian tetap','berada di awan.']),
 (52.06,55.38,['Di beberapa awan, tetesan','bertabrakan dan membesar.']),
 (55.72,59.00,['Saat cukup besar, sebagian','bisa jatuh sebagai hujan.']),
 (59.50,61.35,['Jadi, bukan tangki terbang.']),
 (61.40,63.50,['Bayangkan kabut di ketinggian:']),
 (63.68,66.55,['tetesan kecil dalam udara','yang terus bergerak.']),
 (66.91,69.73,['Sebelumnya kamu membayangkan','awan seperti apa?']),
 (69.97,72.70,['Ceritakan di komentar, dan','ikuti knot theory.'])]

def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for c in iter(lambda:f.read(1048576),b''):h.update(c)
 return h.hexdigest()
def stamp(t):
 ms=round(t*1000);hh,ms=divmod(ms,3600000);mm,ms=divmod(ms,60000);ss,ms=divmod(ms,1000)
 return f'{hh:02}:{mm:02}:{ss:02},{ms:03}'
def score(path,seconds):
 """Original musical bed, tension pulse then a bright reveal; no stock audio."""
 sr=22050;n=math.ceil(seconds*sr);buf=bytearray();changes=[5.35,12.37,21.2,30.01,38.71,45.5,51.68,59.12]
 chords=[(110,130.81,164.81),(98,116.54,146.83),(87.31,110,130.81),(98,123.47,146.83)]
 melody=[329.63,392,493.88,392,293.66,369.99,440,369.99]
 for i in range(n):
  t=i/sr;fade=min(1,t/.4,max(0,(seconds-t)/1.4));ch=chords[int(t/15)%4]
  pad=sum(math.sin(2*math.pi*f*t)/(1+j*.35) for j,f in enumerate(ch))*.07
  phase=(t-.5)%2.3;f=melody[int(max(0,t-.5)/2.3)%8]
  pluck=math.sin(2*math.pi*f*t)*math.exp(-3.5*phase)*min(1,phase/.03)*.09 if t>=.5 else 0
  beat=t%(60/88*2);pulse=math.sin(2*math.pi*(50*beat-8*beat*beat))*math.exp(-7*beat)*min(1,beat/.015)*.075 if beat<.45 else 0
  accent=sum(math.sin(2*math.pi*659.25*(t-b))*math.exp(-8*(t-b))*min(1,(t-b)/.01)*.10 for b in changes if 0<=t-b<.4)
  v=max(-1,min(1,(pad+pluck+pulse+accent)*fade));buf.extend(struct.pack('<h',round(v*32767)))
 with wave.open(str(path),'wb') as w:w.setparams((1,2,sr,n,'NONE','not compressed'));w.writeframes(buf)
D.mkdir(parents=True,exist_ok=True)
if not V.is_file() or sha(V)!=VOICE_SHA:raise SystemExit('FAIL: take narasi hilang/berubah; timing harus dipetakan ulang.')
assert len(STORY['scenes'])==len(STARTS)==9
assert all(len(s['objectMap'])>=2 and s['action'] for s in STORY['scenes'])
norm=lambda s:re.sub(r'\s+',' ',s).strip()
assert norm(' '.join(x['narration'] for x in STORY['scenes']))==norm(' '.join(' '.join(q[2]) for q in CUES)), 'Subtitle tidak sama dengan naskah'
assert all(0<=a<b and len(lines)<=2 and max(map(len,lines))<=36 for a,b,lines in CUES)
assert all(a[1]<=b[0] for a,b in zip(CUES,CUES[1:]))
voice=D/'narasi-utuh.wav';subprocess.run([str(FF),'-nostdin','-v','error','-y','-i',str(V),'-ac','1','-ar','48000','-c:a','pcm_s16le',str(voice)],check=True)
with wave.open(str(voice),'rb') as w:vd=w.getnframes()/w.getframerate()
assert 72.5<vd<73.2
length=math.ceil((vd+1.5)*FPS)/FPS
assert 3<=length<=90
ends=STARTS[1:]+[length];timeline=[{'id':s['id'],'start':a,'end':b} for s,a,b in zip(STORY['scenes'],STARTS,ends)]
art={}
for name in ['rooftop','microcloud','rainstreet']:
 src=A/f'{name}.png';dst=D/f'{name}-render.jpg'
 if not src.is_file():raise FileNotFoundError(src)
 vf='crop=704:1312:32:32,scale=720:-2' if name=='rooftop' else 'scale=720:-2'
 subprocess.run([str(FF),'-nostdin','-v','error','-y','-i',str(src),'-vf',vf,'-q:v','3','-frames:v','1',str(dst)],check=True)
 art[name]={'render':str(dst),'sha256':sha(src)}
bed=D/'musik-original.wav';score(bed,length)
cues=[{'start':a,'end':b,'lines':lines} for a,b,lines in CUES]
with (D/'subtitle-perkiraan.srt').open('w',encoding='utf8') as f:
 for n,c in enumerate(cues,1):f.write(f"{n}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+'\n'.join(c['lines'])+'\n\n')
p={'id':STORY['id'],'story':STORY,'timeline':timeline,'cues':cues,'duration':length,'voiceDuration':vd,'fps':FPS,'voiceSHA256':VOICE_SHA,'speechTempo':1,'art':art,'narration':str(voice),'score':str(bed),'timingNote':'Satu take tanpa percepatan. Batas antar adegan dekat jeda; timing dalam kalimat estimasi, bukan forced alignment.'}
(D/'prepared.json').write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'duration':length,'voice':vd,'starts':STARTS,'cues':len(cues)}))
