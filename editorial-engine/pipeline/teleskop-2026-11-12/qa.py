#!/usr/bin/env python3
"""Mechanical checks only. Creative, listening, word-level sync: NEEDS REVIEW."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
D=ROOT/'deliverables/teleskop-2026-11-12'
FF=ROOT/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
PROBE=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
p=json.loads((D/'prepared.json').read_text(encoding='utf8'))
video=D/'teleskop.mp4';thumb=D/'teleskop-thumbnail.png'
caption=D/'caption-4-platform.txt';srt=D/'subtitle-perkiraan.srt';voice=D/'vo-utuh.wav';voice_mp3=D/'vo-utuh.mp3';bed=D/'musik-ruang-original.wav';poster=D/'teleskop-poster-4x5.png'
for f in [video,thumb,poster,caption,srt,voice,voice_mp3,bed]:
 if not f.is_file():sys.exit(f'FAIL missing {f.name}')
meta=json.loads(subprocess.check_output([str(PROBE),'-v','error','-show_streams','-show_format','-of','json',str(video)],text=True))
v=next(s for s in meta['streams'] if s['codec_type']=='video');a=next(s for s in meta['streams'] if s['codec_type']=='audio')
actual=float(meta['format']['duration']);checks={}
checks['video_1080x1920_h264_cfr_30fps']=(v['codec_name']=='h264' and v['width']==1080 and v['height']==1920 and v['avg_frame_rate']=='30/1' and v['r_frame_rate']=='30/1' and int(v['nb_frames'])==round(p['duration']*30))
frame_times=subprocess.check_output([str(PROBE),'-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','csv=p=0',str(video)],text=True)
times=[]
for row in frame_times.splitlines():
 try: times.append(float(row.strip().split(',')[0]))
 except ValueError: pass
checks['all_frame_timestamps_monotonic_at_30fps']=len(times)==round(p['duration']*30) and abs(times[0])<1e-6 and all(.0332<b-a<.0335 for a,b in zip(times,times[1:]))
checks['audio_aac_present']=a['codec_name']=='aac'
# Master is 2:26: fits TikTok (<=10 min) and YT Shorts (<=3 min). FB Reels via
# Buffer caps at 90 s, so Facebook distribution needs a decision — reported
# separately below, not silently trimmed.
checks['shortform_duration_3_to_180s']=3<=actual<=180
checks['duration_matches_single_timeline']=p['duration']-.10<=actual<=p['duration']+.10
read=subprocess.run([str(FF),'-nostdin','-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True)
checks['full_audio_video_decode']=read.returncode==0 and not read.stderr.strip()
measure=subprocess.run([str(FF),'-nostdin','-hide_banner','-i',str(video),'-filter_complex','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
levels=re.findall(r'I:\s*(-?[0-9.]+)\s*LUFS',measure.stderr);peaks=re.findall(r'Peak:\s*(-?[0-9.]+)\s*dBFS',measure.stderr)
lufs=float(levels[-1]) if levels else None;peak=float(peaks[-1]) if peaks else None
checks['integrated_loudness_between_-18_and_-13_lufs']=lufs is not None and -18<=lufs<=-13
checks['true_peak_not_above_-2_dbtp']=peak is not None and peak<=-2
checks['four_caption_sections']=all(t in caption.read_text(encoding='utf8') for t in ['FACEBOOK REELS','TIKTOK','YOUTUBE SHORTS','INSTAGRAM REELS'])
render_src=(ROOT/'pipeline/teleskop-2026-11-12/render.tsx').read_text(encoding='utf8');caption_src=caption.read_text(encoding='utf8');srt_src=srt.read_text(encoding='utf8')
checks['lowercase_cta_in_render_and_captions']=all('ikuti knot theory' in t for t in [render_src,caption_src])
# The CTA pill is a VISUAL overlay: the user's verbatim VO never speaks it,
# so the subtitle track must NOT contain it.
checks['cta_visual_only_absent_from_vo_subtitles']='ikuti knot theory' not in srt_src
checks['seven_object_mapped_scenes']=len(p['story']['scenes'])==7 and all(len(s['objectMap'])>=3 and s['action'] for s in p['story']['scenes'])
checks['contiguous_scene_offsets']=all(abs(a['end']-b['start'])<1e-6 for a,b in zip(p['timeline'],p['timeline'][1:])) and abs(p['timeline'][0]['start'])<1e-6
checks['narration_verbatim_matches_user_transcript']=re.sub(r'\s+',' ',' '.join(line for q in p['cues'] for line in q['lines']))==re.sub(r'\s+',' ',' '.join(x['narration'] for x in p['story']['scenes']))
checks['subtitle_line_lengths_and_nonoverlap']=all(0<q['end']-q['start'] and len(q['lines'])<=2 and max(map(len,q['lines']))<=36 for q in p['cues']) and all(a['end']<=b['start'] for a,b in zip(p['cues'],p['cues'][1:]))
checks['no_tempo_change_on_user_voice']=p['speechTempo']==1.0 and p['timingNote'].startswith("User's single narration, verbatim")
thumb_meta=json.loads(subprocess.check_output([str(PROBE),'-v','error','-show_streams','-of','json',str(thumb)],text=True))
checks['thumbnail_independent_1080x1920_png']=any(s.get('codec_name')=='png' and s.get('width')==1080 and s.get('height')==1920 for s in thumb_meta['streams']) and thumb.read_bytes()!=(D/'qa-sample-00.png').read_bytes()
def sha(f):
 h=hashlib.sha256()
 with f.open('rb') as fp:
  for chunk in iter(lambda:fp.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
poster_meta=json.loads(subprocess.check_output([str(PROBE),'-v','error','-show_streams','-of','json',str(poster)],text=True))
checks['poster_1080x1350_png']=any(s.get('codec_name')=='png' and s.get('width')==1080 and s.get('height')==1350 for s in poster_meta['streams'])
n_scenes=len(p['story']['scenes'])
checks['two_distinct_sample_frames_per_scene']=all(sha(D/f'qa-sample-{i+1:02d}.png')!=sha(D/f'qa-sample-{i+1+n_scenes:02d}.png') for i in range(n_scenes))
# Remove the subtitle zone before comparing, so changing words alone cannot pass.
# Background movement or tiny host movement can still account for differences.
def upper_frame_md5(f):
 return subprocess.check_output([str(FF),'-nostdin','-hide_banner','-loglevel','error','-i',str(f),'-vf','crop=1080:1440:0:0,format=rgb24','-frames:v','1','-f','md5','-'],text=True).strip()
checks['scene_samples_differ_above_subtitle_zone']=all(upper_frame_md5(D/f'qa-sample-{i+1:02d}.png')!=upper_frame_md5(D/f'qa-sample-{i+1+n_scenes:02d}.png') for i in range(n_scenes))
files=[video,thumb,poster,caption,srt,voice_mp3,bed]
manifest=''.join(f'{sha(f)}  {f.name}\n' for f in files)
(D/'SHA256SUMS.txt').write_text(manifest,encoding='utf8')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
lines=['# QA mekanis — episode Teleskop', '',f'- Status: {"PASS" if all(checks.values()) else "FAIL"} hanya untuk pemeriksaan mekanis berikut. Ini bukan bukti penjadwalan atau penerbitan.',f'- Durasi: {actual:.2f} detik ({int(actual//60)} mnt {int(actual%60):02d} dtk), 7 adegan, satu narasi utuh verbatim dari pengguna (tanpa perubahan tempo).',f'- Loudness terukur: {lufs} LUFS; true peak: {peak} dBTP.',f'- Timestamp pengguna terkoreksi ke jeda suara asli; geser maksimum ±3,1 detik (drift timestamp user vs audio).',f'- Source Git HEAD saat pemeriksaan: {commit}', '- Tidak ada penjadwalan atau publikasi dari pipeline ini.', '', '## Hasil mekanis']
lines += [f'- {"PASS" if ok else "FAIL"}: {name}' for name,ok in checks.items()]
lines += ['', '## Batas pengujian',
 '- NEEDS REVIEW: dengarkan seluruh narasi asli pengguna; subtitle mengikuti transcript ber-timestamp milik pengguna — waktu per frasa di-snap ke jeda suara terdeteksi, BUKAN forced alignment.',
 '- CATATAN: pil penutup "ikuti knot theory" adalah overlay visual saja; VO verbatim milik pengguna tidak mengucapkannya (keputusan closing masih menunggu konfirmasi pengguna).',
 '- NEEDS REVIEW: durasi master 146,5 detik > batas 90 detik FB Reels via Buffer. Distribusi Facebook butuh keputusan (rute feed/lain atau potongan) — tidak dipotong diam-diam.',
 '- NEEDS REVIEW: penilaian kreatif dari pengguna; gerak utuh, prop teleskop, ekspresi, pacing, keterbacaan pada ponsel.',
 '- TESTED: dua contoh frame per adegan berbeda juga ketika area subtitle dibuang. Perbedaan bisa berasal dari latar atau gerak kecil dan bukan bukti kualitas interaksi.',
 '- NOT TESTED: mendengarkan manusia, review gerak penuh, pemutaran di ponsel dan platform, serta membangun ulang dari cadangan yang dipulihkan.',
 '- Ilustrasi latar dibuat dengan AI; cermin JWST, galaksi, dan garis waktu adalah ikon/skema, bukan foto ilmiah; garis waktu tidak berskala; musik disintesis dari kode; tanpa logo resmi NASA/JWST.',
 '- VO adalah rekaman milik pengguna; pipeline tidak mengubah tempo atau isi narasi.',
 '', '## Sumber dan batas klaim']+[f'- {s["url"]} — {s["supports"]}' for s in p['story']['sources']]+['','## SHA-256 lokal','```',manifest.strip(),'```','']
(D/'QA-DAN-SUMBER.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps({'checks':checks,'duration':actual,'lufs':lufs,'peak_dbtp':peak,'status':'PASS' if all(checks.values()) else 'FAIL'},ensure_ascii=False))
if not all(checks.values()):sys.exit(1)
