#!/usr/bin/env python3
"""Prepare a private single-take animation timeline; no publishing or network."""
import hashlib,json,math,re,struct,subprocess,wave
from pathlib import Path
R=Path(__file__).resolve().parents[2]
D=R/'deliverables/kaca-rupert-visual-v1';A=R/'assets/generated/kaca-rupert';V=R/'audio/voiceovers/kaca-rupert/narasi-utuh.mp3'
S=R/'content/recovered/kaca-pangeran-rupert-visual-v1.json';FF=R/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
VOICE_SHA='76d2cf47e4391083c31ea93d36b628e35f8d436a90e09528effe328ee38c12e3'
ART_SHA={'ruang-lab':'6c38b32cff411e1bbe90c09a6ec04df7df2642d5479cc4262551e5081ec82255','dalam-kaca':'a3f147015946503c14e6a96c626236d9389eee7307f5984fc41ca35980ab6396'}
FPS=30;LEAD_TRIM=.22;HOOK_FRAME=82
# Estimated from pauses in this exact take, not word-level forced alignment.
RAW_CUES=[
 (.267,1.711,['Palu kalah sama kaca?']),
 (2.193,2.870,['Kok bisa?']),
 (3.527,5.10,['Bentuknya mirip kecebong,']),
 (5.10,7.182,['dengan kepala bulat', 'dan ekor tipis.']),
 (7.780,11.326,['Di percobaan, kepala kaca ini', 'bisa tahan pukulan palu kecil.']),
 (11.876,13.752,['Tapi bukan berarti', 'tak bisa pecah.']),
 (14.359,17.099,['Yang mengejutkan,', 'saat ekornya patah,']),
 (17.099,20.415,['retakan justru menjalar', 'dan seluruh kaca bisa remuk.']),
 (21.135,23.072,['Ini namanya tetes Pangeran Rupert.']),
 (23.779,27.148,['Kenapa satu kaca bisa sekuat itu', 'sekaligus serapuh itu?']),
 (27.619,30.430,['Kuncinya ada pada cara', 'kaca ini mendingin.']),
 (30.895,33.615,['Permukaannya mengeras lebih cepat', 'daripada bagian dalam.']),
 (34.053,36.621,['Saat bagian dalam ikut mendingin', 'dan menyusut,']),
 (36.897,40.566,['tegangan terkunci: luar tertekan,', 'bagian dalam tertarik.']),
 (41.174,44.597,['Tekanan di permukaan membantu', 'menahan retakan masuk ke kepala,']),
 (44.902,46.906,['jadi kepala bisa tahan', 'pukulan tertentu.']),
 (47.659,49.060,['Tapi ekornya tipis.']),
 (49.522,53.143,['Kalau patah, retakan bisa mencapai', 'bagian dalam yang sedang tertarik.']),
 (53.821,56.60,['Dari ekor, retakan melaju', 'sangat cepat']),
 (56.60,59.589,['sampai seluruh tetesan hancur', 'menjadi serpihan halus.']),
 (60.291,61.838,['Jadi, bukan kaca ajaib.']),
 (62.321,64.200,['Kuat di satu bagian,', 'rapuh dari bagian lain']),
 (64.200,66.078,['karena tegangan yang sama.']),
 (66.930,69.146,['Kamu lebih kaget bagian kepala', 'atau ekornya?']),
 (69.760,72.221,['Ceritakan di komentar,', 'dan ikuti knot theory.'])]
RAW_BREAKS=[None,None,7.48,14.05,20.80,27.38,33.84,40.87,47.28,53.48,59.94,66.50]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def mapped(t):return max(0,t-LEAD_TRIM)
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02},{ms:03}'
def score(path,seconds,events):
 """Original synthesized minor-key score + gentle contact accents, no samples."""
 sr=22050;n=math.ceil(seconds*sr);buf=bytearray()
 chords=[(110,130.81,164.81),(103.83,123.47,155.56),(87.31,110,130.81),(98,116.54,146.83)]
 melody=[329.63,392,440,493.88,392,349.23,293.66,369.99]
 for i in range(n):
  t=i/sr;fade=min(1,t/.3,max(0,(seconds-t)/1.2));ch=chords[int(t/12)%4]
  pad=sum(math.sin(2*math.pi*f*t)/(1+j*.4) for j,f in enumerate(ch))*.055
  phase=t%1.85;f=melody[int(t/1.85)%8]
  pluck=math.sin(2*math.pi*f*t)*math.exp(-4*phase)*min(1,phase/.025)*.075
  beat=t%(60/84);pulse=math.sin(2*math.pi*(52*beat-6*beat*beat))*math.exp(-11*beat)*min(1,beat/.015)*.045 if beat<.3 else 0
  accent=sum((math.sin(2*math.pi*880*(t-b))+.5*math.sin(2*math.pi*1320*(t-b)))*math.exp(-9*(t-b))*min(1,(t-b)/.008)*.045 for b in events if 0<=t-b<.35)
  sample=max(-1,min(1,(pad+pluck+pulse+accent)*fade));buf.extend(struct.pack('<h',round(sample*32767)))
 with wave.open(str(path),'wb') as w:w.setparams((1,2,sr,n,'NONE','not compressed'));w.writeframes(buf)
def main():
 D.mkdir(parents=True,exist_ok=True)
 if not V.is_file() or sha(V)!=VOICE_SHA:raise SystemExit('FAIL: voice take missing/changed; remap timing instead of bypassing hash')
 for n,h in ART_SHA.items():
  if not (A/f'{n}.png').is_file() or sha(A/f'{n}.png')!=h:raise SystemExit(f'FAIL: background {n} missing/changed')
 story=json.loads(S.read_text(encoding='utf-8'))
 assert len(story['scenes'])==12 and story['scenes'][0]['payoffScene']=='S04'
 assert all(len(set(s['objectMap']))>=2 and s['action'] for s in story['scenes'])
 norm=lambda x:re.sub(r'\s+',' ',x).strip()
 assert norm(' '.join(s['narration'] for s in story['scenes']))==norm(' '.join(' '.join(c[2]) for c in RAW_CUES)), 'Subtitles differ from script'
 assert all(0<=a<b and len(lines)<=2 and max(map(len,lines))<=36 for a,b,lines in RAW_CUES)
 assert all(a[1]<=b[0] for a,b in zip(RAW_CUES,RAW_CUES[1:]))
 voice=D/'narasi-utuh.wav'
 subprocess.run([str(FF),'-nostdin','-v','error','-y','-i',str(V),'-af',f'atrim=start={LEAD_TRIM},asetpts=PTS-STARTPTS','-ac','1','-ar','48000','-c:a','pcm_s16le',str(voice)],check=True)
 with wave.open(str(voice),'rb') as w:vd=w.getnframes()/w.getframerate()
 if not 72.3<vd<72.5:raise SystemExit(f'FAIL: unexpected decoded voice duration: {vd}')
 length=math.ceil((vd+.6)*FPS)/FPS
 starts=[0,HOOK_FRAME/FPS]+[round(mapped(t)*FPS)/FPS for t in RAW_BREAKS[2:]]
 assert len(starts)==12 and all(a<b for a,b in zip(starts,starts[1:])) and starts[-1]<length
 timeline=[{'id':s['id'],'start':a,'end':b} for s,a,b in zip(story['scenes'],starts,starts[1:]+[length])]
 art={}
 for n,h in ART_SHA.items():
  dst=D/f'{n}-render.jpg';subprocess.run([str(FF),'-nostdin','-v','error','-y','-i',str(A/f'{n}.png'),'-vf','scale=720:-2','-q:v','3','-frames:v','1',str(dst)],check=True);art[n]={'render':str(dst),'sha256':h}
 bed=D/'musik-original.wav';score(bed,length,[.80,starts[2]+1.1,starts[3]+2.1,starts[9]+1.7])
 cues=[{'start':round(mapped(a),3),'end':round(mapped(b),3),'lines':lines} for a,b,lines in RAW_CUES]
 with (D/'subtitle-perkiraan.srt').open('w',encoding='utf-8') as f:
  for i,c in enumerate(cues,1):f.write(f"{i}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+'\n'.join(c['lines'])+'\n\n')
 prepared={'id':story['id'],'story':story,'timeline':timeline,'cues':cues,'duration':length,'voiceDuration':vd,'fps':FPS,'voiceSHA256':VOICE_SHA,'speechTempo':1,'art':art,'narration':str(voice),'score':str(bed),'timingNote':'Satu take voice-05, tanpa dipercepat; hanya 0,22 detik sunyi awal dipangkas. Batas adegan dan subtitle diperkirakan dari pola sunyi take ini, bukan forced alignment; QA dengar wajib.'}
 (D/'prepared.json').write_text(json.dumps(prepared,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(json.dumps({'duration':length,'voice':vd,'starts':starts,'cues':len(cues),'hookCutSeconds':starts[1]},ensure_ascii=False))
if __name__=='__main__':main()
