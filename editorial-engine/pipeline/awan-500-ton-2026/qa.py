#!/usr/bin/env python3
"""Mechanical media checks only; human AV review, rights, and publishing separate."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'deliverables/awan-500-ton-2026'
FF=ROOT/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg';PROBE=ROOT/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
p=json.loads((D/'prepared.json').read_text(encoding='utf8'))
video=D/'awan-500-ton.mp4';thumb=D/'awan-500-ton-thumbnail.png';poster=D/'awan-500-ton-poster-4x5.png'
caption=D/'caption-4-platform.txt';storyboard=D/'STORYBOARD.md';srt=D/'subtitle-perkiraan.srt';voice=ROOT/'audio/voiceovers/awan-500-ton-2026/narasi-utuh.mp3';bed=D/'musik-tonal-original.wav';inputs=D/'01-INPUT-PRIVAT-AWAN.zip'
for f in [video,thumb,poster,caption,storyboard,srt,voice,bed,inputs]:
    if not f.is_file():sys.exit(f'FAIL missing {f.name}')
def probe(p):return json.loads(subprocess.check_output([str(PROBE),'-v','error','-show_streams','-show_format','-of','json',str(p)],text=True))
def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for chunk in iter(lambda:f.read(1024*1024),b''):h.update(chunk)
    return h.hexdigest()
meta=probe(video);v=next(s for s in meta['streams'] if s['codec_type']=='video');a=next(s for s in meta['streams'] if s['codec_type']=='audio');actual=float(meta['format']['duration']);checks={}
checks['h264_1080x1920_cfr_30fps']=(v['codec_name']=='h264' and v['width']==1080 and v['height']==1920 and v['pix_fmt']=='yuv420p' and v['avg_frame_rate']=='30/1' and v['r_frame_rate']=='30/1' and int(v['nb_frames'])==round(p['duration']*30))
raw=subprocess.check_output([str(PROBE),'-v','error','-select_streams','v:0','-show_entries','frame=best_effort_timestamp_time','-of','csv=p=0',str(video)],text=True)
times=[]
for row in raw.splitlines():
    try:times.append(float(row.strip().split(',')[0]))
    except ValueError:pass
checks['all_frame_timestamps_monotonic_30fps']=len(times)==round(p['duration']*30) and abs(times[0])<1e-6 and all(.0332<q-r<.0335 for r,q in zip(times,times[1:]))
checks['audio_is_aac_48khz']=a['codec_name']=='aac' and a['sample_rate']=='48000'
checks['duration_matches_single_timeline_and_fb_3_to_90s']=abs(actual-p['duration'])<=.10 and 3<=actual<=90
decoded=subprocess.run([str(FF),'-nostdin','-v','error','-i',str(video),'-f','null','-'],capture_output=True,text=True)
checks['full_av_decode_without_errors']=decoded.returncode==0 and not decoded.stderr.strip()
measure=subprocess.run([str(FF),'-nostdin','-hide_banner','-i',str(video),'-filter_complex','ebur128=peak=true','-f','null','-'],capture_output=True,text=True,check=True)
levels=re.findall(r'I:\s*(-?[0-9.]+)\s*LUFS',measure.stderr);peaks=re.findall(r'Peak:\s*(-?[0-9.]+)\s*dBFS',measure.stderr)
lufs=float(levels[-1]) if levels else None;peak=float(peaks[-1]) if peaks else None
checks['loudness_between_minus18_and_minus13_lufs']=lufs is not None and -18<=lufs<=-13
checks['true_peak_not_above_minus2_dbtp']=peak is not None and peak<=-2
checks['original_voice_take_unsped_and_hash_matches']=p['speechTempo']==1 and sha(voice)==p['voiceSHA256']
checks['nine_scenes_have_concrete_objects']=len(p['story']['scenes'])==9 and all(len(s['objectMap'])>=2 and s['action'] for s in p['story']['scenes'])
checks['single_contiguous_timeline']=p['timeline'][0]['start']==0 and all(abs(x['end']-y['start'])<1e-6 for x,y in zip(p['timeline'],p['timeline'][1:])) and abs(p['timeline'][-1]['end']-p['duration'])<1e-6
normal=lambda t:re.sub(r'\s+',' ',t).strip()
checks['subtitle_text_matches_script']=normal(' '.join(s['narration'] for s in p['story']['scenes']))==normal(' '.join(' '.join(q['lines']) for q in p['cues']))
checks['subtitle_line_length_and_nonoverlap']=all(0<q['end']-q['start'] and len(q['lines'])<=2 and max(map(len,q['lines']))<=36 for q in p['cues']) and all(a['end']<=b['start'] for a,b in zip(p['cues'],p['cues'][1:]))
checks['closing_cta_lowercase_in_script_srt_and_renderer']=all('ikuti knot theory' in normal(t) for t in [p['story']['scenes'][-1]['narration'],srt.read_text(encoding='utf8'),(ROOT/'pipeline/awan-500-ton-2026/render.tsx').read_text(encoding='utf8')])
checks['four_caption_sections']=all(t in caption.read_text(encoding='utf8') for t in ['FACEBOOK REELS','TIKTOK','YOUTUBE SHORTS','INSTAGRAM REELS'])
checks['storyboard_has_nine_scene_ids_and_estimate']=all('## '+s['id'] in storyboard.read_text(encoding='utf8') for s in p['story']['scenes']) and '500.000 kg = 500 ton metrik' in storyboard.read_text(encoding='utf8')
checks['thumbnail_independent_1080x1920_png']=any(s.get('codec_name')=='png' and s.get('width')==1080 and s.get('height')==1920 for s in probe(thumb)['streams']) and thumb.read_bytes()!=(D/'qa-sample-00.png').read_bytes()
checks['poster_1080x1350_png']=any(s.get('codec_name')=='png' and s.get('width')==1080 and s.get('height')==1350 for s in probe(poster)['streams'])
def upper_md5(f):return subprocess.check_output([str(FF),'-nostdin','-hide_banner','-loglevel','error','-i',str(f),'-vf','crop=1080:1440:0:0,format=rgb24','-frames:v','1','-f','md5','-'],text=True).strip()
checks['two_different_samples_above_subtitles_per_scene']=all(upper_md5(D/f'qa-sample-{i+1:02d}.png')!=upper_md5(D/f'qa-sample-{i+10:02d}.png') for i in range(9))
files=[video,thumb,poster,caption,storyboard,srt,voice,bed,inputs];manifest=''.join(f'{sha(f)}  {f.name}\n' for f in files)
(D/'SHA256SUMS.txt').write_text(manifest,encoding='utf8')
try:commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True,stderr=subprocess.DEVNULL).strip()
except (subprocess.CalledProcessError, FileNotFoundError):commit='UNKNOWN (source archive, no Git)'
lines=['# QA mekanis dan sumber — Awan 500 Ton', '',f'- Status pemeriksaan mekanis: {"PASS" if all(checks.values()) else "FAIL"}. Ini bukan persetujuan kreatif, izin hak, atau bukti publikasi.',f'- Durasi {actual:.2f} detik; sembilan adegan; satu take narasi voice-05, tidak dipercepat.',f'- Loudness {lufs} LUFS; true peak {peak} dBTP.',f'- Source Git HEAD saat QA: {commit}.','- Tidak ada penjadwalan atau publikasi dari pipeline ini.','', '## Hasil pemeriksaan']
lines += [f'- {"PASS" if ok else "FAIL"}: {name}' for name,ok in checks.items()]
lines += ['','## Batas dan review yang masih diperlukan',
 '- NEEDS REVIEW: manusia mendengarkan seluruh suara, musik dan keseimbangan, terutama pengucapan "ikuti knot theory". Teks input tidak membuktikan pelafalan.',
 '- NEEDS REVIEW: kecocokan kata per kata pada subtitle, keterbacaan di ponsel, gerak dan interaksi penuh serta persetujuan kreatif pengguna. Waktu subtitle menggunakan jeda dan perkiraan; bukan forced alignment.',
 '- NEEDS REVIEW: hak pemakaian suara sintetis, ilustrasi AI, font dan distribusi; periksa syarat penggunaan model dan lisensi FFmpeg sebelum distribusi.',
 '- TESTED: gambar diam dari setiap adegan dan frame nol diperiksa; perubahan dua sample di atas area subtitle bukan bukti kualitas animasi atau keberhasilan review gerak penuh.',
 '- NOT TESTED: mendengarkan manusia, peninjauan gerak penuh, pemutaran di aplikasi/ponsel atau pembangunan ulang lengkap dari ZIP yang dipulihkan.',
 '- Angka 500 ton adalah estimasi massa air untuk awan contoh, bukan massa total semua awan. Awan, timbangan, kipas dan tetesan adalah ilustrasi konseptual yang tidak berskala. Lingkungan dihasilkan AI; musik disintesis dari kode. Tidak ada cuplikan Coverr.',
 '', '## Sumber dan batas klaim']+[f'- {s["url"]} — {s["supports"]}' for s in p['story']['sources']]+['','## SHA-256 lokal','```',manifest.strip(),'```','']
(D/'QA-DAN-SUMBER.md').write_text('\n'.join(lines),encoding='utf8')
print(json.dumps({'checks':checks,'duration':actual,'lufs':lufs,'peak_dbtp':peak,'status':'PASS' if all(checks.values()) else 'FAIL'},ensure_ascii=False))
if not all(checks.values()):sys.exit(1)
