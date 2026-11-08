#!/usr/bin/env python3
"""Objective technical QA; all subjective and rights gates remain open."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'deliverables/kaca-rupert-visual-v1';V=D/'kaca-rupert-visual-v1.mp4'
FF=R/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg';PROBE=R/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
prep=json.loads((D/'prepared.json').read_text(encoding='utf-8'));spec=json.loads((R/'content/recovered/kaca-pangeran-rupert-visual-v1.json').read_text(encoding='utf-8'))
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=R,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(f'{args[0]} failed: {p.stderr[-1500:]}')
 return p
meta=json.loads(run([PROBE,'-v','error','-count_frames','-show_streams','-show_format','-of','json',V]).stdout)
v=[s for s in meta['streams'] if s['codec_type']=='video'];a=[s for s in meta['streams'] if s['codec_type']=='audio'];checks={}
def check(label,result):checks[label]=bool(result)
check('Satu video H.264 1080×1920 dan satu track AAC',len(v)==1 and len(a)==1 and v[0]['codec_name']=='h264' and v[0]['width']==1080 and v[0]['height']==1920 and a[0]['codec_name']=='aac')
check('Rata-rata 30 fps dan jumlah frame sesuai timeline',len(v)==1 and v[0].get('avg_frame_rate')=='30/1' and int(v[0].get('nb_read_frames','0'))==round(prep['duration']*prep['fps']))
check('Durasi file sesuai timeline ±0,1 detik',abs(float(meta['format']['duration'])-prep['duration'])<.1)
check('Decode penuh audio dan video tanpa error',run([FF,'-nostdin','-v','error','-i',V,'-f','null','-']).returncode==0)
voice=R/'audio/voiceovers/kaca-rupert/narasi-utuh.mp3';check('Hash take sama dan tempo narasi 1×',hashlib.sha256(voice.read_bytes()).hexdigest()==prep['voiceSHA256'] and prep['speechTempo']==1)
check('Cut pembuka sesuai frame 82, setelah pertanyaan estimasi',round(prep['timeline'][1]['start']*prep['fps'])==82)
for label,cmd in [('Unit test cerita, kontak, retak dan pecahan',['node','--test','pipeline/kaca-rupert-visual-v1/test-story.mjs']),('Unit test timing',['python3','pipeline/kaca-rupert-visual-v1/test-prepare.py']),('Unit test restore',['python3','pipeline/kaca-rupert-visual-v1/test-restore.py']),('Unit test rig Host',['node','--test','pipeline/awan-rig-v2/test-rig.mjs']),('TypeScript',[R/'node_modules/.bin/tsc','--noEmit'])]:
 p=subprocess.run([str(x) for x in cmd],cwd=R,capture_output=True,text=True);check(label,p.returncode==0)
check('Dua belas adegan, minimal dua objek per adegan',len(spec['scenes'])==12 and all(len(set(s['objectMap']))>=2 for s in spec['scenes']))
check('CTA lowercase di naskah',spec['scenes'][-1]['narration'].endswith('ikuti knot theory.'))
cues=prep['cues'];check('Cue subtitle monoton dan maksimal dua baris',len(cues)==25 and all(q['start']<q['end'] and len(q['lines'])<=2 and all(len(line)<=36 for line in q['lines']) for q in cues) and all(cues[i]['end']<=cues[i+1]['start']+.002 for i in range(len(cues)-1)))
def wh(p):
 b=p.read_bytes();return (int.from_bytes(b[16:20],'big'),int.from_bytes(b[20:24],'big')) if b[:8]==b'\x89PNG\r\n\x1a\n' else None
check('Thumbnail 9:16 dan poster 4:5 terpisah',wh(D/'kaca-rupert-thumbnail.png')==(1080,1920) and wh(D/'kaca-rupert-poster-4x5.png')==(1080,1350))
for n in ['caption-empat-platform.txt','storyboard-dan-sumber.md','subtitle-perkiraan.srt']:check(f'Output {n} tersedia',(D/n).is_file() and (D/n).stat().st_size>0)
p=run([FF,'-nostdin','-hide_banner','-i',V,'-af','loudnorm=I=-16:TP=-3.5:LRA=11:print_format=json','-f','null','-']);m=re.search(r'\{\s*"input_i".*?\}',p.stderr,re.S)
if not m:raise RuntimeError('Cannot measure loudness')
loud=json.loads(m.group());lufs=float(loud['input_i']);peak=float(loud['input_tp']);check('Loudness -20 sampai -14 LUFS dan true peak <= -2 dBTP',-20<=lufs<=-14 and peak<=-2)
outs=[V,D/'kaca-rupert-thumbnail.png',D/'kaca-rupert-poster-4x5.png',D/'caption-empat-platform.txt',D/'storyboard-dan-sumber.md',D/'subtitle-perkiraan.srt']
hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in outs};(D/'SHA256SUMS.txt').write_text(''.join(f'{h}  {n}\n' for n,h in hashes.items()),encoding='utf-8')
lines=['# QA dan sumber — Kaca Pangeran Rupert (draft privat)','',f'Video {float(meta["format"]["duration"]):.3f} detik; {v[0]["width"]}×{v[0]["height"]}, {v[0].get("avg_frame_rate")} fps, {v[0].get("nb_read_frames")} frame; satu track AAC.',f'Loudness: {lufs:.1f} LUFS integrated / {peak:.1f} dBTP true peak.','','## Pemeriksaan mekanis']
for label,ok in checks.items():lines.append(f'- {"PASS" if ok else "FAIL"}: {label}')
lines+=['','## Batas hasil','- VERIFIED: studi Aben dkk. (2016) mengukur tegangan tekan pada permukaan dan tegangan tarik pada interior; kekuatan sampel terbatas, bukan kebal semua pukulan.',
'- VERIFIED: menurut Purdue, retak dapat menjalar dari ekor menuju kepala dan menghancurkan tetes; luar mendingin lebih cepat daripada interior.',
'- NEEDS REVIEW: dengarkan seluruh voice-05, pelafalan “ikuti knot theory”, kualitas musik dan campurannya; belum diperiksa manusia.',
'- NEEDS REVIEW: timing subtitle diperkirakan dari jeda, bukan forced alignment; mulut prosedural bukan lip sync fonem. Cek gerak penuh, titik kontak, keterbacaan ponsel/safe area, hak AI/font/codec dan detail keamanan.',
'- NOT TESTED: pemutaran penuh di perangkat/platform, rebuild MP4 lengkap dari backup pada instalasi baru, respons penonton dan retensi.',
'- Visual retakan/serpihan diperlambat dan panah berwarna adalah skema, bukan rekaman eksperimen. Ilustrasi percobaan terkendali: jangan ditiru.',
'- Status: PRIVAT / BELUM DISETUJUI / BELUM DIJADWALKAN. Tes mekanis bukan izin tayang.','','## Sumber']
for src in spec['sources']:lines.append(f'- {src["id"]}: {src["url"]} — {src["supports"]}')
lines+=['','## SHA-256 output']+[f'- `{n}`: `{h}`' for n,h in hashes.items()]
(D/'QA-DAN-SUMBER.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'checks':checks,'duration':float(meta['format']['duration']),'lufs':lufs,'true_peak':peak,'hashes':hashes},ensure_ascii=False,indent=2))
if not all(checks.values()):sys.exit(1)
