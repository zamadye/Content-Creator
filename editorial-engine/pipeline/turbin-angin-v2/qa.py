#!/usr/bin/env python3
"""Machine checks for the PRIVATE turbine draft, not a human/editorial pass.

Decodes every frame and audio packet, measures container/timing/audio and does a
coarse speech-energy/cue-overlap check. It does not listen, recognise words,
confirm permissions, prove mobile readability, or authorize publication.
"""
import array, hashlib, json, math, re, subprocess, wave
from pathlib import Path

ROOT=Path(__file__).resolve().parents[3]
ENGINE=ROOT/'editorial-engine'
D=ROOT/'.scratch/turbine-v2/render'
FF=ENGINE/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
PROBE=ENGINE/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
VIDEO=D/'turbin-angin-draf-privat.mp4'

def command(args):
 p=subprocess.run([str(x) for x in args],capture_output=True,text=True)
 if p.returncode:raise RuntimeError(f"Command failed ({p.returncode}): {' '.join(map(str,args[:4]))}\n{p.stderr[-2000:]}")
 return p

def digest(p):
 h=hashlib.sha256()
 with p.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()

def srt_matches(file:Path,cues:list)->bool:
 """Compare external SRT text and millisecond timings with burned-in cues."""
 def milliseconds(stamp):
  m=re.fullmatch(r'(\d{2}):(\d{2}):(\d{2}),(\d{3})',stamp)
  if not m:return None
  h,minute,second,ms=map(int,m.groups())
  if minute>=60 or second>=60:return None
  return ((h*60+minute)*60+second)*1000+ms
 try:
  blocks=re.split(r'\n\s*\n',file.read_text(encoding='utf8').strip().replace('\r\n','\n'))
  if len(blocks)!=len(cues):return False
  for i,(block,cue) in enumerate(zip(blocks,cues),1):
   lines=block.split('\n')
   if len(lines)<3 or lines[0]!=str(i) or ' --> ' not in lines[1]:return False
   start,end=lines[1].split(' --> ',1)
   if milliseconds(start)!=round(cue['start']*1000) or milliseconds(end)!=round(cue['end']*1000) or lines[2:]!=cue['lines']:return False
  return True
 except (OSError,ValueError,KeyError,TypeError):return False

def visual_cut_delta(file:Path,cut_frame:int)->float:
 """Mean absolute grayscale delta between decoded frames around a cut.

A large delta suggests a visual change, but cannot judge its narrative merit.
"""
 vf=f"select='eq(n,{cut_frame-1})+eq(n,{cut_frame})',scale=36:64,format=gray"
 p=subprocess.run([str(FF),'-nostdin','-v','error','-i',str(file),'-vf',vf,'-vsync','0','-frames:v','2','-f','rawvideo','pipe:1'],capture_output=True)
 if p.returncode or len(p.stdout)!=2*36*64:raise RuntimeError(f'Could not extract cut frames: {p.stderr.decode(errors="replace")[-500:]}')
 a=p.stdout[:36*64];b=p.stdout[36*64:]
 return sum(abs(x-y) for x,y in zip(a,b))/len(a)

def activity(cues):
 # This only measures energy, not syllables or semantic word alignment.
 with wave.open(str(D/'narasi-utuh.wav'),'rb') as f:
  if f.getnchannels()!=1 or f.getsampwidth()!=2:raise RuntimeError('Expected mono 16-bit narration')
  rate=f.getframerate(); samples=array.array('h',f.readframes(f.getnframes()))
 step=rate//100; threshold=32768*10**(-35/20);total=outside=0;active_cues=[0]*len(cues)
 for i in range(0,len(samples),step):
  frame=samples[i:i+step]
  if not frame:continue
  rms=math.sqrt(sum(x*x for x in frame)/len(frame));t=(i+len(frame)/2)/rate
  if rms<=threshold:continue
  total+=1;found=False
  for j,c in enumerate(cues):
   if c['start']<=t<c['end']:active_cues[j]+=1;found=True;break
  if not found:outside+=1
 return {'window_ms':10,'threshold_dbfs':-35,'active_seconds':round(total*.01,2),
  'active_outside_any_cue_seconds':round(outside*.01,2),
  'cues_without_detected_energy':[i+1 for i,n in enumerate(active_cues) if not n],
  'interpretation':'Energy coverage only; not speech recognition or word-level synchronization.'}

def opening_review(story_start:float,cue_end:float)->str:
 """Describe structural timing and uncertainty, never certify spoken alignment."""
 if not math.isfinite(story_start) or not math.isfinite(cue_end) or cue_end>story_start:
  raise ValueError('Invalid estimated opening timing')
 target='di luar target kreatif 1–3 detik' if not 1<=story_start<=3 else 'dalam target struktur 1–3 detik'
 return f'NEEDS REVIEW: cerita mulai pada {story_start:.2f} detik ({target}); akhir cue pertanyaan diperkirakan {cue_end:.2f} detik, perlu listening manusia'

def main():
 if not VIDEO.exists():raise SystemExit('FAIL: private video is missing')
 pre=command(['node',ENGINE/'pipeline/turbin-angin-v2/preflight.mjs','--stage','render','--review',ROOT/'.scratch/turbine-v2/human-review.json'])
 prepared=json.loads((D/'prepared.json').read_text(encoding='utf8'))
 info=json.loads(command([PROBE,'-v','error','-count_frames','-show_entries',
  'stream=index,codec_type,codec_name,width,height,pix_fmt,r_frame_rate,nb_frames,nb_read_frames,duration,sample_rate,channels:format=duration,size',
  '-of','json',VIDEO]).stdout)
 videos=[s for s in info['streams'] if s.get('codec_type')=='video'];audios=[s for s in info['streams'] if s.get('codec_type')=='audio']
 if len(videos)!=1 or len(audios)!=1:raise RuntimeError('Expected one video and one audio stream')
 v,a=videos[0],audios[0];expected=prepared['totalFrames']
 checks={
  'video_codec_and_size':v.get('codec_name')=='h264' and v.get('width')==1080 and v.get('height')==1920 and v.get('pix_fmt')=='yuv420p',
  'frame_rate':v.get('r_frame_rate')=='30/1',
  'decoded_frame_count':int(v.get('nb_read_frames','0'))==expected,
  'audio_codec_and_rate':a.get('codec_name')=='aac' and a.get('sample_rate')=='48000',
  'container_duration':abs(float(info['format']['duration'])-prepared['duration'])<.1,
  'audio_video_duration_difference':abs(float(v['duration'])-float(a['duration']))<.1,
  'srt_matches_burned_cue_text_and_estimates':srt_matches(D/'subtitle-perkiraan.srt',prepared['cues']),
 }
 cut_delta=visual_cut_delta(VIDEO,prepared['openingVisualCutFrame'])
 checks['visual_change_at_planned_cut']=cut_delta>=3.0
 # Do not equate metadata with decode; ffmpeg separately checks both streams.
 decoded=command([FF,'-nostdin','-v','error','-xerror','-i',VIDEO,'-map','0:v:0','-map','0:a:0','-f','null','-'])
 checks['full_video_and_audio_decode']=decoded.returncode==0
 vol=command([FF,'-nostdin','-hide_banner','-i',VIDEO,'-map','0:a:0','-af','volumedetect','-f','null','-']).stderr
 means=re.findall(r'mean_volume:\s*(-?[0-9.]+) dB',vol);peaks=re.findall(r'max_volume:\s*(-?[0-9.]+) dB',vol)
 if not means or not peaks:raise RuntimeError('Could not read audio volume measurement')
 audio={'mean_dbfs':float(means[-1]),'sample_peak_dbfs':float(peaks[-1]),'note':'Sample peak is not true-peak or a listening/quality test.'}
 checks['sample_peak_below_zero']=audio['sample_peak_dbfs']<0
 energy=activity(prepared['cues'])
 command([FF,'-nostdin','-v','error','-y','-i',VIDEO,'-frames:v','1',D/'qa-frame0-final.png'])
 # Twelve actual decoded scene midpoints, reduced to 360x640 each. This is a
 # useful small-size simulation, never a real-device playback/readability pass.
 frame_ids=[(s['startFrame']+s['endFrame']-1)//2 for s in prepared['timeline']]
 selection='+'.join(f'eq(n,{n})' for n in frame_ids)
 filters=f"select='{selection}',scale=360:640,tile=4x3:padding=8:margin=8:color=0x253747"
 command([FF,'-nostdin','-v','error','-y','-i',VIDEO,'-vf',filters,'-vsync','0','-frames:v','1',D/'QA-contact-360.png'])
 cut_frame=prepared['openingVisualCutFrame']
 cut_filter=f"select='eq(n,{cut_frame-1})+eq(n,{cut_frame})',scale=360:640,tile=2x1:padding=8:margin=8:color=0x253747"
 command([FF,'-nostdin','-v','error','-y','-i',VIDEO,'-vf',cut_filter,'-vsync','0','-frames:v','1',D/'QA-potongan-pembuka.png'])
 visual_cut=cut_frame/prepared['fps']
 story_start=prepared['timeline'][1]['start']
 report={
  'scope':'PRIVATE DRAFT ONLY; no publishing or scheduling authorization',
  'technical_checks':{k:'PASS' if ok else 'FAIL' for k,ok in checks.items()},
  'video':{'sha256':digest(VIDEO),'bytes':VIDEO.stat().st_size,'expected_frames':expected,
   'decoded_frames':int(v['nb_read_frames']),'width':v['width'],'height':v['height'],
   'fps':v['r_frame_rate'],'duration_seconds':float(info['format']['duration']),
   'audio_video_duration_difference_seconds':round(abs(float(v['duration'])-float(a['duration'])),4)},
  'audio_measurements':audio,'coarse_cue_energy':energy,
  'visual_cut_detection':{'planned_frame':prepared['openingVisualCutFrame'],'mean_absolute_grayscale_delta_0_to_255':round(cut_delta,2),'note':'A detectable visual change is not proof of storytelling quality.'},
  'sampled_mobile_size_frames':{'count':len(frame_ids),'dimensions_each':'360x640','frames':frame_ids,'status':'SIMULATED STILL IMAGES ONLY; NOT DEVICE PLAYBACK'},
  'editorial_and_human':{
   'visual_teaser_first_cut':f'{"PASS" if 1<=visual_cut<=3 else "FAIL"}: {visual_cut:.1f} detik; narasi berlanjut pada shot pertanyaan',
   'complete_spoken_opening_before_story':opening_review(story_start,prepared['openingCueEndEstimate']),
   'script_and_storyboard_private_approval':'PASS hanya untuk draf privat, terikat hash input',
   'subtitle_word_level_sync':'NEEDS REVIEW; estimasi, bukan forced alignment',
   'full_human_audio_and_video_playback':'NOT TESTED',
   'voice_pronunciation_and_music_mix':'NOT TESTED melalui listening manusia',
   'mobile_safe_area_and_readability':'NOT TESTED pada ponsel',
   'independent_expert_fact_review':'NEEDS REVIEW',
   'footage_rights_and_attribution':'NEEDS REVIEW; tracking Coverr menghasilkan 404',
   'audience_response':'NOT TESTED',
   'publication_and_schedule':'NOT AUTHORIZED'
  },
  'context':'Footage 16:9 tampil penuh dan tajam di jendela; latarnya crop buram dari sumber landscape yang sama, bukan footage vertikal asli. Mekanisme adalah ilustrasi, bukan diagnosis rekaman.',
  'preflight':json.loads(pre.stdout),
 }
 (D/'QA-teknis-draf.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 lines=['# QA — draf privat turbin angin','',
  '**Draf privat; belum boleh dijadwalkan atau dipublikasikan.**','',
  '## Pemeriksaan teknis']
 labels={
  'video_codec_and_size':'Format video dan resolusi','frame_rate':'Frame rate',
  'decoded_frame_count':'Jumlah frame yang terdekode','audio_codec_and_rate':'Format dan sample rate audio',
  'container_duration':'Durasi kontainer','audio_video_duration_difference':'Selisih durasi audio/video',
  'srt_matches_burned_cue_text_and_estimates':'SRT sesuai data cue untuk burn-in (bukan pembacaan video)',
  'visual_change_at_planned_cut':'Perubahan visual pada cut pembuka','full_video_and_audio_decode':'Decode penuh video dan audio',
  'sample_peak_below_zero':'Sample peak di bawah 0 dBFS',
 }
 lines += [f'- {labels.get(k,k)}: **{val}**' for k,val in report['technical_checks'].items()]
 lines += [f"- Video: {v['width']}×{v['height']}, {v['r_frame_rate']} fps, {report['video']['decoded_frames']} frame, {report['video']['duration_seconds']:.3f} detik.",
  f"- Audio: rata-rata {audio['mean_dbfs']} dBFS, sample peak {audio['sample_peak_dbfs']} dBFS (bukan pengukuran true peak atau bukti kualitas dengar).",
  f"- Energi narasi di luar semua cue: {energy['active_outside_any_cue_seconds']:.2f} detik pada ambang -35 dBFS/10 ms; ini **tidak** memverifikasi kata atau sinkronisasi.",
  f'- Perubahan visual terdeteksi pada frame {prepared["openingVisualCutFrame"]}: selisih grayscale rata-rata {cut_delta:.2f}/255; ini bukan penilaian kualitas cerita.',
  '- `QA-contact-360.png`: 12 frame tengah aktual dalam simulasi 360×640, bukan playback/perangkat ponsel.',
  '- `QA-potongan-pembuka.png`: dua frame aktual tepat sebelum dan setelah cut visual pertama.',
  '', '## Yang masih perlu ditinjau']
 human_labels={
  'visual_teaser_first_cut':'Cut cuplikan visual pertama','complete_spoken_opening_before_story':'Panjang pembuka lisan penuh',
  'script_and_storyboard_private_approval':'Persetujuan naskah dan storyboard','subtitle_word_level_sync':'Sinkronisasi subtitle per kata',
  'full_human_audio_and_video_playback':'Playback penuh oleh manusia','voice_pronunciation_and_music_mix':'Pelafalan voice dan keseimbangan musik',
  'mobile_safe_area_and_readability':'Area aman dan keterbacaan di ponsel','independent_expert_fact_review':'Review fakta oleh ahli independen',
  'footage_rights_and_attribution':'Hak dan atribusi footage','audience_response':'Respons audiens','publication_and_schedule':'Publikasi/penjadwalan',
 }
 lines += [f'- {human_labels.get(k,k)}: **{val}**' for k,val in report['editorial_and_human'].items()]
 lines += ['',report['context'],'',f"SHA-256 MP4: `{report['video']['sha256']}`",'']
 (D/'QA-draf-privat.md').write_text('\n'.join(lines),encoding='utf8')
 print(json.dumps({'technical_checks':report['technical_checks'],'video':report['video'],'audio':audio,'cue_energy':energy,'unresolved':report['editorial_and_human']},ensure_ascii=False,indent=2))
 if not all(checks.values()):raise SystemExit('FAIL: one or more technical checks failed; do not deliver as a complete draft')

if __name__=='__main__':main()
