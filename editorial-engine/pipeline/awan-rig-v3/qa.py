#!/usr/bin/env python3
"""Objective QA and explicit untested gates for a private V3 draft."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'deliverables/awan-rig-v3'
FF=R/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg';PROBE=R/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
V=D/'awan-500-ton-rig-v3.mp4';prep=json.loads((D/'prepared.json').read_text(encoding='utf-8'));spec=json.loads((R/'content/recovered/awan-500-ton-rig-v3.json').read_text(encoding='utf-8'))
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=R,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(f'{args[0]} failed: {p.stderr[-2000:]}')
 return p
meta=json.loads(run([PROBE,'-v','error','-count_frames','-show_streams','-show_format','-of','json',V]).stdout)
v=[s for s in meta['streams'] if s['codec_type']=='video'];a=[s for s in meta['streams'] if s['codec_type']=='audio']
checks={}
def check(label,result):checks[label]=bool(result)
check('Satu video H.264 1080×1920 dan satu track AAC',len(v)==1 and len(a)==1 and v[0]['codec_name']=='h264' and v[0]['width']==1080 and v[0]['height']==1920 and a[0]['codec_name']=='aac')
check('Rata-rata 30 fps dan jumlah frame sesuai timeline',len(v)==1 and v[0].get('avg_frame_rate')=='30/1' and int(v[0].get('nb_read_frames','0'))==round(prep['duration']*prep['fps']))
check('Durasi file sesuai timeline ±0,1 detik',abs(float(meta['format']['duration'])-prep['duration'])<.1)
check('Decode penuh audio dan video tanpa error',run([FF,'-nostdin','-v','error','-i',V,'-f','null','-']).returncode==0)
voice=R/'audio/voiceovers/awan-rig-v3/narasi-utuh.mp3'
check('Hash take sama dan tempo narasi 1×',hashlib.sha256(voice.read_bytes()).hexdigest()==prep['voiceSHA256'] and prep['speechTempo']==1)
check('Cut pembuka sesuai frame 89, sebelum hitungan',round(prep['timeline'][1]['start']*prep['fps'])==89 and prep['timeline'][5]['start']<prep['timeline'][6]['start'])
for label,cmd in [('Unit test naskah', ['node','--test','pipeline/awan-rig-v3/test-story.mjs']),('Unit test timing', ['python3','pipeline/awan-rig-v3/test-prepare.py']),('Unit test rig', ['node','--test','pipeline/awan-rig-v2/test-rig.mjs']),('TypeScript', [R/'node_modules/.bin/tsc','--noEmit'])]:
 p=subprocess.run([str(x) for x in cmd],cwd=R,capture_output=True,text=True);check(label,p.returncode==0)
check('Sepuluh adegan dan minimal dua objek per adegan',len(spec['scenes'])==10 and all(len(set(s['objectMap']))>=2 for s in spec['scenes']))
check('CTA lowercase di naskah',spec['scenes'][-1]['narration'].endswith('ikuti knot theory.'))
cues=prep['cues'];check('Cue subtitle monoton dan maksimal dua baris',len(cues)==24 and all(q['start']<q['end'] and len(q['lines'])<=2 and all(len(line)<=36 for line in q['lines']) for q in cues) and all(cues[i]['end']<=cues[i+1]['start']+.002 for i in range(len(cues)-1)))
def png_wh(p):
 raw=p.read_bytes();return (int.from_bytes(raw[16:20],'big'),int.from_bytes(raw[20:24],'big')) if raw[:8]==b'\x89PNG\r\n\x1a\n' else None
check('Thumbnail 9:16 dan poster 4:5 terpisah',png_wh(D/'awan-rig-v3-thumbnail.png')==(1080,1920) and png_wh(D/'awan-rig-v3-poster-4x5.png')==(1080,1350))
for fn in ['caption-empat-platform.txt','storyboard-rig-v3.md','subtitle-perkiraan.srt']:
 check(f'Output {fn} tersedia',(D/fn).is_file() and (D/fn).stat().st_size>0)
meas=run([FF,'-nostdin','-hide_banner','-i',V,'-af','loudnorm=I=-16:TP=-3.5:LRA=11:print_format=json','-f','null','-'])
m=re.search(r'\{\s*"input_i".*?\}',meas.stderr,re.S)
if not m:raise RuntimeError('Cannot measure LUFS/true peak')
loud=json.loads(m.group());lufs=float(loud['input_i']);peak=float(loud['input_tp'])
check('Loudness -20 sampai -14 LUFS dan true peak <= -2 dBTP',-20<=lufs<=-14 and peak<=-2)
outs=[V,D/'awan-rig-v3-thumbnail.png',D/'awan-rig-v3-poster-4x5.png',D/'caption-empat-platform.txt',D/'storyboard-rig-v3.md',D/'subtitle-perkiraan.srt']
hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in outs}
(D/'SHA256SUMS.txt').write_text(''.join(f'{v}  {k}\n' for k,v in hashes.items()),encoding='utf-8')
lines=['# QA — Awan 500 ton, rig V3 (draft privat)','',f'Video {float(meta["format"]["duration"]):.3f} detik; {v[0]["width"]}×{v[0]["height"]}, {v[0].get("avg_frame_rate")} fps, {v[0].get("nb_read_frames")} frame; satu track AAC.',f'Loudness hasil pengukuran: {lufs:.1f} LUFS integrated / {peak:.1f} dBTP true peak.','', '## Pemeriksaan mekanis']
for label,ok in checks.items():lines.append(f'- {"PASS" if ok else "FAIL"}: {label}')
lines += ['', '## Peninjauan dan batas',
'- NEEDS REVIEW: dengarkan seluruh narasi voice-05, pelafalan “ikuti knot theory”, musik dan keseimbangan; belum ada pemeriksaan pendengaran manusia.',
'- NEEDS REVIEW: subtitle diperkirakan dari pola sunyi dan timing frasa, bukan forced alignment. Gerak mulut prosedural, bukan lip sync fonem.',
'- NEEDS REVIEW: pengalaman puncak/cut, seluruh gerakan, kontak prop, estetika, keterbacaan di ponsel/safe area dan hak distribusi aset AI/voice/font/codec.',
'- NOT TESTED: playback penuh di perangkat atau platform; full MP4 rebuild dari backup pada instalasi baru; respons penonton dan retensi.',
'- VERIFIED: USGS memperkirakan 500.000 kg = 500 ton metrik air untuk satu contoh 1 km³ × 0,5 g/m³; bukan berat semua awan dan tidak termasuk massa udara.',
'- VERIFIED: tetes kecil tetap mengalami gravitasi; sebagian dapat terbawa udara naik. Pada sebagian awan, tumbukan/penggabungan dapat menghasilkan hujan.',
'- ASSUMPTION: perubahan opening dan urutan penjelasan merupakan hipotesis editorial, bukan jaminan retensi atau jangkauan.',
'- Status: PRIVAT / BELUM DISETUJUI / BELUM DIJADWALKAN. Pemeriksaan mekanis bukan izin tayang. Master V2 tidak diubah.', '', '## Sumber']
for src in spec['sources']:lines.append(f'- {src["id"]}: {src["url"]} — {src["supports"]}')
lines+=['','## SHA-256 output']+[f'- `{name}`: `{digest}`' for name,digest in hashes.items()]
(D/'QA-DAN-SUMBER.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'checks':checks,'duration':float(meta['format']['duration']),'lufs':lufs,'true_peak':peak,'hashes':hashes},ensure_ascii=False,indent=2))
if not all(checks.values()):sys.exit(1)
