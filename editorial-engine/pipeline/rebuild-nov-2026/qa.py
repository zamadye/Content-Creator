#!/usr/bin/env python3
"""Non-interactive mechanical QA for the rebuilt one-episode package.
Human listening, rights, subtitle sync and device review remain NEEDS REVIEW.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
os.chdir(ROOT)
ID=sys.argv[1]
D=Path('deliverables/rebuild-2026-11-11')/ID
ff=ROOT/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
probe=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
p=json.loads((D/'prepared.json').read_text())
video=D/f'{ID}.mp4'
thumb=D/f'{ID}-thumbnail.png'
caption=D/f'{ID}-caption-4-platform.txt'
srt=D/'subtitle-perkiraan.srt'
if not all(x.is_file() for x in [video,thumb,caption,srt]):
    sys.exit('FAIL: missing one or more deliverables')
meta=json.loads(subprocess.check_output([str(probe),'-v','error','-show_streams','-show_format','-of','json',str(video)],text=True))
v=next(s for s in meta['streams'] if s['codec_type']=='video')
a=next(s for s in meta['streams'] if s['codec_type']=='audio')
checks={}
checks['video_1080x1920_h264_30fps']=(v['codec_name']=='h264' and v['width']==1080 and v['height']==1920 and v['avg_frame_rate']=='30/1')
checks['audio_aac_present']=a['codec_name']=='aac'
actual=float(meta['format']['duration'])
checks['duration_covers_voice']=p['voiceDuration']<=actual<=p['voiceDuration']+1.0
read=subprocess.run([str(ff),'-nostdin','-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True)
checks['full_decode_no_error']=read.returncode==0 and not read.stderr.strip()
measure=subprocess.run([str(ff),'-nostdin','-hide_banner','-i',str(video),'-filter_complex','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
levels=re.findall(r'I:\s*(-?[0-9.]+)\s*LUFS',measure.stderr)
peaks=re.findall(r'Peak:\s*(-?[0-9.]+)\s*dBFS',measure.stderr)
lufs=float(levels[-1]) if levels else None
peak=float(peaks[-1]) if peaks else None
checks['integrated_loudness_-18_to_-13_lufs']=lufs is not None and -18<=lufs<=-13
checks['true_peak_at_or_below_-2dbtp']=peak is not None and peak<=-2
caption_text=caption.read_text()
checks['four_platform_caption_sections']=all(x in caption_text for x in ['FACEBOOK REELS','TIKTOK','YOUTUBE SHORTS','INSTAGRAM REELS'])
checks['cta_input_lowercase']='ikuti knot theory' in p['episode']['narration']
checks['cta_in_subtitles']='ikuti knot theory' in srt.read_text()
checks['five_scenes_two_concrete_objects']=len(p['board']['scenes'])==5 and all(len(s['objects'])>=2 for s in p['board']['scenes'])
# Ensure image decodes independently rather than merely checking its extension.
thumb_meta=json.loads(subprocess.check_output([str(probe),'-v','error','-show_streams','-of','json',str(thumb)],text=True))
checks['thumbnail_1080x1920']=any(s.get('width')==1080 and s.get('height')==1920 for s in thumb_meta['streams'])
files=[video,thumb,caption,srt,D/'00-ASSET-INPUTS-PRIVAT.zip']
def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
 return h.hexdigest()
manifest=''.join(f'{sha(f)}  {f.name}\n' for f in files if f.exists())
(D/'SHA256SUMS.txt').write_text(manifest)
commit=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()
lines=[f'# QA produksi ulang: {p["episode"]["title"]}', '',f'- Status: {"PASS" if all(checks.values()) else "FAIL"} untuk pemeriksaan mekanis di bawah, bukan persetujuan publikasi.',f'- Durasi: {actual:.2f} detik; narasi: {p["voiceDuration"]:.2f} detik.',f'- Loudness terukur: {lufs} LUFS; true peak: {peak} dBTP.',f'- Source Git commit saat build: {commit}', '- Jadwal editorial hanyalah target; tidak ada posting yang dibuat.', '', '## Pemeriksaan mekanis']
lines.extend(f'- {"PASS" if ok else "FAIL"}: {name}' for name,ok in checks.items())
lines.extend(['','## Batas penting', '- NEEDS REVIEW: dengarkan seluruh narasi, termasuk pelafalan "ikuti knot theory"; teks input saja bukan bukti pengucapan.', '- NEEDS REVIEW: sinkronisasi subtitle—waktu hanya perkiraan berbasis panjang teks dan jeda, bukan forced alignment.', '- NEEDS REVIEW: kelayakan kreatif, gerak, keterbacaan ponsel, akurasi visual, dan hak penggunaan ilustrasi/suara.', '- NOT TESTED: uji penerbitan di platform, akses atau pemulihan dari cadangan Drive; jangan jadwalkan tanpa persetujuan.', '- Ilustrasi dibuat dengan AI; musik latar disintesis dari kode asli. Grafik bukan citra resmi.', '', '## Sumber rujukan']+[f'- {u}' for u in p['episode']['sources']]+['', '## SHA-256 hasil lokal', '```',manifest.strip(),'```',''])
(D/'QA-DAN-SUMBER.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps({'checks':checks,'duration':actual,'lufs':lufs,'peak_dbtp':peak,'status':'PASS' if all(checks.values()) else 'FAIL'},ensure_ascii=False))
if not all(checks.values()):sys.exit(1)
