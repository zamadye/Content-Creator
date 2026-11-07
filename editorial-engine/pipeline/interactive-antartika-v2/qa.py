#!/usr/bin/env python3
"""Mechanical checks only. Creative, listening, word-level sync: NEEDS REVIEW."""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
D=ROOT/'deliverables/interactive-revision-2026-11-11/antartika'
FF=ROOT/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
PROBE=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
p=json.loads((D/'prepared.json').read_text(encoding='utf8'))
video=D/'antartika-revisi-v2.mp4';thumb=D/'antartika-revisi-v2-thumbnail.png'
caption=D/'caption-4-platform.txt';srt=D/'subtitle-perkiraan.srt';voice=D/'narasi-gabungan.mp3';bed=D/'musik-tonal-original.wav';inputs=D/'01-INPUT-PRIVAT-REV2.zip'
for f in [video,thumb,caption,srt,voice,bed,inputs]:
 if not f.is_file():sys.exit(f'FAIL missing {f.name}')
meta=json.loads(subprocess.check_output([str(PROBE),'-v','error','-show_streams','-show_format','-of','json',str(video)],text=True))
v=next(s for s in meta['streams'] if s['codec_type']=='video');a=next(s for s in meta['streams'] if s['codec_type']=='audio')
actual=float(meta['format']['duration']);checks={}
checks['video_1080x1920_h264_cfr_30fps']=(v['codec_name']=='h264' and v['width']==1080 and v['height']==1920 and v['avg_frame_rate']=='30/1' and v['r_frame_rate']=='30/1' and int(v['nb_frames'])==round(p['duration']*30))
checks['audio_aac_present']=a['codec_name']=='aac'
checks['duration_matches_single_timeline']=p['duration']-.10<=actual<=p['duration']+.10
read=subprocess.run([str(FF),'-nostdin','-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True)
checks['full_audio_video_decode']=read.returncode==0 and not read.stderr.strip()
measure=subprocess.run([str(FF),'-nostdin','-hide_banner','-i',str(video),'-filter_complex','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
levels=re.findall(r'I:\s*(-?[0-9.]+)\s*LUFS',measure.stderr);peaks=re.findall(r'Peak:\s*(-?[0-9.]+)\s*dBFS',measure.stderr)
lufs=float(levels[-1]) if levels else None;peak=float(peaks[-1]) if peaks else None
checks['integrated_loudness_between_-18_and_-13_lufs']=lufs is not None and -18<=lufs<=-13
checks['true_peak_not_above_-2_dbtp']=peak is not None and peak<=-2
checks['four_caption_sections']=all(t in caption.read_text(encoding='utf8') for t in ['FACEBOOK REELS','TIKTOK','YOUTUBE SHORTS','INSTAGRAM REELS'])
checks['lowercase_cta_in_script_srt_and_art_source']=all('ikuti knot theory' in t for t in [p['story']['scenes'][-1]['narration'],srt.read_text(encoding='utf8'),(ROOT/'pipeline/interactive-antartika-v2/render.tsx').read_text(encoding='utf8')])
checks['nine_object_mapped_scenes']=len(p['story']['scenes'])==9 and all(len(s['objectMap'])>=3 and s['action'] for s in p['story']['scenes'])
checks['contiguous_scene_offsets']=all(abs(a['end']-b['start'])<1e-6 for a,b in zip(p['timeline'],p['timeline'][1:])) and abs(p['timeline'][0]['start'])<1e-6
normal=lambda text:re.sub(r'\s+',' ',text).strip()
checks['subtitles_reproduce_script_text']=normal(' '.join(x['narration'] for x in p['story']['scenes']))==normal(' '.join(' '.join(x['lines']) for x in p['cues']))
checks['subtitle_line_lengths_and_nonoverlap']=all(0<q['end']-q['start'] and len(q['lines'])<=2 and max(map(len,q['lines']))<=36 for q in p['cues']) and all(a['end']<=b['start'] for a,b in zip(p['cues'],p['cues'][1:]))
thumb_meta=json.loads(subprocess.check_output([str(PROBE),'-v','error','-show_streams','-of','json',str(thumb)],text=True))
checks['thumbnail_independent_1080x1920_png']=any(s.get('codec_name')=='png' and s.get('width')==1080 and s.get('height')==1920 for s in thumb_meta['streams']) and thumb.read_bytes()!=(D/'qa-sample-00.png').read_bytes()
def sha(f):
 h=hashlib.sha256()
 with f.open('rb') as fp:
  for chunk in iter(lambda:fp.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
checks['two_distinct_sample_frames_per_scene']=all(sha(D/f'qa-sample-{i+1:02d}.png')!=sha(D/f'qa-sample-{i+10:02d}.png') for i in range(9))
files=[video,thumb,caption,srt,voice,bed,inputs]
manifest=''.join(f'{sha(f)}  {f.name}\n' for f in files)
(D/'SHA256SUMS.txt').write_text(manifest,encoding='utf8')
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
lines=['# QA mekanis — pilot Antartika revisi interaktif', '',f'- Status: {"PASS" if all(checks.values()) else "FAIL"} hanya untuk pemeriksaan mekanis berikut. **Belum disetujui untuk publikasi.**',f'- Durasi: {actual:.2f} detik, 9 adegan, satu master narasi dari sembilan segmen voice-05.',f'- Loudness terukur: {lufs} LUFS; true peak: {peak} dBTP.',f'- Source Git HEAD saat pemeriksaan: {commit}', '- Tidak ada penjadwalan atau publikasi dari pipeline ini.', '', '## Hasil mekanis']
lines += [f'- {"PASS" if ok else "FAIL"}: {name}' for name,ok in checks.items()]
lines += ['', '## Batas pengujian',
 '- NEEDS REVIEW: dengarkan seluruh narasi, terutama pengucapan “ikuti knot theory”, transisi dan keseimbangan musik; teks input bukan bukti pengucapan.',
 '- NEEDS REVIEW: sinkronisasi subtitle terhadap kata-kata audio. Batas adegan berasal dari sampel audio; waktu per frasa diperkirakan dari jeda dan panjang teks, bukan forced alignment.',
 '- NEEDS REVIEW: penilaian kreatif dari pengguna; gerak utuh, prop, ekspresi, pacing, keterbacaan pada ponsel, kesesuaian fakta dan hak suara/ilustrasi.',
 '- TESTED: beberapa gambar diam per adegan diperiksa visual; dua contoh frame per adegan memiliki hash berbeda. Hash berbeda saja bukan bukti gerak baik atau seluruh animasi benar.',
 '- NOT TESTED: mendengarkan manusia, review gerak penuh, pemutaran di ponsel dan platform, serta membangun ulang lengkap dari cadangan yang dipulihkan.',
 '- Ilustrasi lingkungan dibuat dengan AI; skema tidak berskala; musik tonal dan aksen disintesis dari kode asli. Tidak memakai logo resmi.',
 '', '## Sumber primer']+[f'- {s["url"]} — {s["claim"]}' for s in p['story']['sources']]+['','## SHA-256 lokal','```',manifest.strip(),'```','']
(D/'QA-DAN-SUMBER.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps({'checks':checks,'duration':actual,'lufs':lufs,'peak_dbtp':peak,'status':'PASS' if all(checks.values()) else 'FAIL'},ensure_ascii=False))
if not all(checks.values()):sys.exit(1)
