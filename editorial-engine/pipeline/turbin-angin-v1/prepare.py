#!/usr/bin/env python3
"""Prepare private voice timing and an original score. No uploads or publishing.

The one approved take is not accelerated. Boundaries below are estimates based
on silences in this exact file, NOT word-level forced alignment; human listening
is mandatory. The private human review is checked before processing.
"""
import hashlib, json, math, re, struct, subprocess, wave
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
ENGINE=ROOT/'editorial-engine'
D=ROOT/'.scratch/turbine/render'
V=ROOT/'.scratch/turbine/narasi-voice-05.wav'
REVIEW=ROOT/'.scratch/turbine/human-review.json'
SCRIPT=ENGINE/'content/proposals/turbin-angin-draf-v1.json'
PLAN=ENGINE/'pipeline/turbin-angin-v1/shot-plan.json'
MANIFEST=ENGINE/'pipeline/turbin-angin-v1/footage-manifest.json'
FF=ENGINE/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
VOICE_SHA='3e26b0cbd59f7e84e8bebbe00b46508c557d717c28c451399d135c2e70e80f22'
FPS=30
LEAD_TRIM=.25
# Raw timestamps measured in this take's silence profile, with estimated
# subdivisions. No assumption of phoneme alignment; review with actual audio.
RAW_CUES=[
 (.330,2.071,['Saat angin terlalu kencang,']),
 (2.332,4.157,['turbin angin justru bisa berhenti.']),
 (4.859,6.984,['Kok mesin yang butuh angin','malah diam?']),
 (7.922,10.218,['Sekilas, makin kencang anginnya,']),
 (10.551,12.150,['harusnya makin banyak listrik, kan?']),
 (13.053,14.475,['Tapi angin yang terlalu kuat']),
 (14.679,16.674,['bisa memberi beban besar','pada turbin.']),
 (17.308,20.765,['Bayangkan payung yang makin','sulit ditahan saat angin menerpanya.']),
 (21.867,23.100,['Pada banyak turbin besar,']),
 (23.409,25.740,['sudut bilah diatur saat angin']),
 (25.740,28.319,['melewati kecepatan tertentu','agar daya tetap terkendali.']),
 (29.270,30.032,['Pada tahap itu,']),
 (30.389,32.782,['turbin masih bisa berputar','dan menghasilkan listrik.']),
 (33.819,36.071,['Kalau angin melewati','batas operasi desain,']),
 (36.414,38.698,['sebagian turbin menjalankan','prosedur berhenti.']),
 (39.359,41.182,['Batasnya bergantung pada modelnya.']),
 (42.200,43.246,['Salah satu caranya,']),
 (43.543,45.455,['bilah diputar pada','sumbu panjangnya,']),
 (45.863,47.985,['sehingga lebih sejajar','dengan arah angin.']),
 (48.805,50.761,['Gaya yang memutar rotor','pun berkurang,']),
 (51.114,52.431,['membantu melindungi mesin.']),
 (53.445,55.406,['Saat angin kembali','dalam rentang aman,']),
 (55.762,57.195,['turbin bisa beroperasi lagi.']),
 (58.240,59.800,['Tapi turbin yang diam','belum tentu']),
 (59.800,61.485,['sedang menghadapi angin kencang.']),
 (62.195,64.117,['Bisa juga karena anginnya','terlalu pelan,']),
 (64.428,65.396,['atau sedang dirawat.']),
 (66.319,69.307,['Jadi, dari video saja kita nggak','bisa memastikan penyebabnya.']),
 (70.293,71.888,['Kalau cuma melihat turbin','yang diam,']),
 (72.227,72.994,['tebakanmu apa?']),
 (73.620,74.532,['Tulis di komentar,']),
 (74.809,76.260,['dan ikuti knot theory']),
 (76.260,78.258,['untuk melihat hal biasa','dari sisi lain.'])
]
# Story scene S02 begins after the full spoken question, in the 6.98–7.92 s
# pause. A separate visual teaser cut inside S01 happens at 2 seconds; the
# narration continues unchanged over a question card before the story begins.
RAW_SCENE_STARTS=[0,7.450,12.600,21.300,28.800,33.300,41.700,52.950,57.700,61.850,65.850,69.800]
OPENING_VISUAL_CUT_FRAME=60
# Different in-points avoid repeatedly using the same first seconds of a clip.
# These are editorial choices only; the footage remains context, not evidence.
FOOTAGE_OFFSETS={'S02':.5,'S03':1.0,'S04':3.0,'S05':4.2,'S07':.5,'S08':10.0,'S10':6.0,'S11':7.2}

def sha(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()
def norm(s):return re.sub(r'\s+',' ',s).strip()
def stamp(t):
 ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000);return f'{h:02}:{m:02}:{s:02},{ms:03}'
def score(path,seconds,events):
 """Original synthesized tonal score; no wind noise or sampled music."""
 sr=22050;n=math.ceil(seconds*sr);buf=bytearray();chords=[(110,130.81,164.81),(87.31,110,130.81),(130.81,164.81,196),(98,123.47,146.83)]
 melody=[329.63,392,440,392,349.23,293.66,329.63,369.99]
 for i in range(n):
  t=i/sr;fade=min(1,t/.5,max(0,(seconds-t)/1.5));ch=chords[int(t/11.2)%4]
  pad=sum(math.sin(2*math.pi*f*t)/(1+j*.45) for j,f in enumerate(ch))*.045
  phase=t%1.55;freq=melody[int(t/1.55)%8]
  pluck=math.sin(2*math.pi*freq*t)*math.exp(-3.8*phase)*min(1,phase/.03)*.065
  beat=t%(60/82);pulse=math.sin(2*math.pi*(49*beat-5*beat*beat))*math.exp(-10*beat)*min(1,beat/.02)*.040 if beat<.3 else 0
  accent=sum(math.sin(2*math.pi*660*(t-b))*math.exp(-9*(t-b))*min(1,(t-b)/.008)*.035 for b in events if 0<=t-b<.3)
  sample=max(-1,min(1,(pad+pluck+pulse+accent)*fade));buf.extend(struct.pack('<h',round(sample*32767)))
 with wave.open(str(path),'wb') as w:w.setparams((1,2,sr,n,'NONE','not compressed'));w.writeframes(buf)

def main():
 subprocess.run(['node',str(ENGINE/'pipeline/turbin-angin-v1/preflight.mjs'),'--stage','voice','--review',str(REVIEW)],cwd=ROOT,check=True,stdout=subprocess.DEVNULL)
 if not V.is_file() or sha(V)!=VOICE_SHA:raise SystemExit('FAIL: approved voice take missing/changed; remap timing instead of bypassing hash')
 story=json.loads(SCRIPT.read_text(encoding='utf-8'));plan=json.loads(PLAN.read_text(encoding='utf-8'));manifest=json.loads(MANIFEST.read_text(encoding='utf-8'))
 assert len(story['scenes'])==len(plan['shots'])==len(RAW_SCENE_STARTS)==12
 assert norm(' '.join(s['narration'] for s in story['scenes']))==norm(' '.join(' '.join(c[2]) for c in RAW_CUES)), 'Subtitle text differs from the approved narration'
 assert all(0<=a<b and len(lines)<=2 and max(map(len,lines))<=36 for a,b,lines in RAW_CUES)
 assert all(a[1]<=b[0] for a,b in zip(RAW_CUES,RAW_CUES[1:]))
 D.mkdir(parents=True,exist_ok=True)
 voice=D/'narasi-utuh.wav'
 subprocess.run([str(FF),'-nostdin','-v','error','-y','-i',str(V),'-af',f'atrim=start={LEAD_TRIM},asetpts=PTS-STARTPTS','-ac','1','-ar','48000','-c:a','pcm_s16le',str(voice)],check=True)
 with wave.open(str(voice),'rb') as w:vd=w.getnframes()/w.getframerate()
 if not 78.2<vd<78.4:raise SystemExit(f'FAIL: unexpected voice duration {vd}')
 total_frames=math.ceil((vd+.75)*FPS);starts=[0]+[round((t-LEAD_TRIM)*FPS) for t in RAW_SCENE_STARTS[1:]]
 assert all(a<b for a,b in zip(starts,starts[1:])) and starts[-1]<total_frames
 by_id={i['id']:i for i in manifest['items']};timeline=[]
 for scene,shot,a,b in zip(story['scenes'],plan['shots'],starts,starts[1:]+[total_frames]):
  item=by_id.get(shot['footage']); source=str(ROOT/'google_drive'/item['localFilename']) if item else None
  offset=FOOTAGE_OFFSETS.get(scene['id'],0.0)
  if item and (offset<0 or offset+(b-a)/FPS>item['probe']['duration_seconds']):raise SystemExit(f"FAIL: {scene['id']} source too short for chosen offset")
  timeline.append({'id':scene['id'],'startFrame':a,'endFrame':b,'start':a/FPS,'end':b/FPS,'footage':shot['footage'],'source':source,'sourceOffset':offset})
 cues=[{'start':round(max(0,a-LEAD_TRIM),3),'end':round(b-LEAD_TRIM,3),'lines':lines} for a,b,lines in RAW_CUES]
 with (D/'subtitle-perkiraan.srt').open('w',encoding='utf8') as f:
  for i,c in enumerate(cues,1):f.write(f"{i}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+'\n'.join(c['lines'])+'\n\n')
 music=D/'musik-original.wav';score(music,total_frames/FPS,[starts[1]/FPS,starts[5]/FPS,starts[6]/FPS])
 assert 0<OPENING_VISUAL_CUT_FRAME<timeline[0]['endFrame']
 prepared={'id':story['id'],'timeline':timeline,'cues':cues,'duration':total_frames/FPS,'totalFrames':total_frames,'fps':FPS,
  'openingVisualCutFrame':OPENING_VISUAL_CUT_FRAME,
  'narration':str(voice),'voiceSourceSha256':VOICE_SHA,'narrationSha256':sha(voice),
  'score':str(music),'scoreSha256':sha(music),'speechTempo':1,
  'scriptSha256':sha(SCRIPT),'planSha256':sha(PLAN),'auditSha256':sha(ENGINE/'content/proposals/turbin-angin-audit-kalimat-v1.json'),
  'reviewSha256':sha(REVIEW),'timingNote':'Satu take voice-05 pada tempo asli; 0,25 detik sunyi awal dipangkas. Batas adegan/subtitle diperkirakan dari jeda; bukan forced alignment. Perlu dengar manusia.'}
 (D/'prepared.json').write_text(json.dumps(prepared,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print(json.dumps({'duration':prepared['duration'],'voice':vd,'scenes':len(timeline),'cues':len(cues),
  'visualTeaserCutSeconds':OPENING_VISUAL_CUT_FRAME/FPS,'storyStartsAfterFullQuestionSeconds':timeline[1]['start'],'fps':FPS},indent=2))
if __name__=='__main__':main()
