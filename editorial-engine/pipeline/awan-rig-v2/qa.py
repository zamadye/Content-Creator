#!/usr/bin/env python3
"""Record objective checks; never label unlistened audio or subjective quality PASS."""
import hashlib,json,re,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[2];D=R/'deliverables/awan-rig-v2'
FF=R/'node_modules/@ffmpeg-installer/linux-x64/ffmpeg';PROBE=R/'node_modules/@remotion/compositor-linux-x64-gnu/ffprobe'
V=D/'awan-500-ton-rig-v2.mp4';prep=json.loads((D/'prepared.json').read_text());spec=json.loads((R/'content/recovered/awan-500-ton-rig-v2.json').read_text())
def run(args):
 p=subprocess.run([str(x) for x in args],cwd=R,capture_output=True,text=True)
 if p.returncode:raise RuntimeError(f'{args[0]} failed: {p.stderr[-2000:]}')
 return p
meta=json.loads(run([PROBE,'-v','error','-count_frames','-show_streams','-show_format','-of','json',V]).stdout)
v=[s for s in meta['streams'] if s['codec_type']=='video'];a=[s for s in meta['streams'] if s['codec_type']=='audio']
voice=R/'audio/voiceovers/awan-rig-v2/narasi-utuh.mp3';voice_sha=hashlib.sha256(voice.read_bytes()).hexdigest()
checks={}
def check(label,result):checks[label]=bool(result)
check('Satu video H.264 1080×1920 dan satu track AAC',len(v)==1 and len(a)==1 and v[0]['codec_name']=='h264' and v[0]['width']==1080 and v[0]['height']==1920 and a[0]['codec_name']=='aac')
check('Kecepatan 30 fps dan jumlah frame cocok',len(v)==1 and v[0].get('avg_frame_rate')=='30/1' and int(v[0].get('nb_read_frames','0'))==round(prep['duration']*prep['fps']))
check('Durasi cocok dengan timeline ±0,1 detik',abs(float(meta['format']['duration'])-prep['duration'])<.1)
check('Decode video dan audio lengkap tanpa error',run([FF,'-nostdin','-v','error','-i',V,'-f','null','-']).returncode==0)
check('Hash input voice cocok dan parameter tempo=1',voice_sha==prep['voiceSHA256'] and prep['speechTempo']==1.0)
for label,cmd in [('Unit test rig', ['node','--test','pipeline/awan-rig-v2/test-rig.mjs']),('TypeScript', [R/'node_modules/.bin/tsc','--noEmit'])]:
 p=subprocess.run([str(x) for x in cmd],cwd=R,capture_output=True,text=True);check(label,p.returncode==0)
check('Sembilan adegan dan minimal dua objek per adegan',len(spec['scenes'])==9 and all(len(s['objectMap'])>=2 for s in spec['scenes']))
check('CTA tertulis lowercase di naskah',spec['scenes'][-1]['narration'].endswith('ikuti knot theory.'))
cues=prep['cues'];check('26 cue subtitle monoton dan maksimal dua baris',len(cues)==26 and all(q['start']<q['end'] and len(q['lines'])<=2 and all(len(line)<=36 for line in q['lines']) for q in cues) and all(cues[i]['end']<=cues[i+1]['start']+.002 for i in range(len(cues)-1)))
def png_wh(p):
 raw=p.read_bytes();return (int.from_bytes(raw[16:20],'big'),int.from_bytes(raw[20:24],'big')) if raw[:8]==b'\x89PNG\r\n\x1a\n' else None
check('Thumbnail 9:16 dan poster 4:5 terpisah',png_wh(D/'awan-rig-v2-thumbnail.png')==(1080,1920) and png_wh(D/'awan-rig-v2-poster-4x5.png')==(1080,1350))
for filename in ['caption-empat-platform.txt','storyboard-rig-v2.md','subtitle-perkiraan.srt']:
 check(f'Output {filename} tersedia',(D/filename).is_file() and (D/filename).stat().st_size>0)
runl=run([FF,'-nostdin','-hide_banner','-i',V,'-af','loudnorm=I=-16:TP=-3.5:LRA=11:print_format=json','-f','null','-'])
m=re.search(r'\{\s*"input_i".*?\}',runl.stderr,re.S)
if not m:raise RuntimeError('Cannot measure LUFS/true peak')
loud=json.loads(m.group());lufs=float(loud['input_i']);peak=float(loud['input_tp'])
check('Loudness terukur -20 sampai -14 LUFS dan true peak <= -2 dBTP',-20<=lufs<=-14 and peak<=-2)
outputs=[V,D/'awan-rig-v2-thumbnail.png',D/'awan-rig-v2-poster-4x5.png',D/'caption-empat-platform.txt',D/'storyboard-rig-v2.md',D/'subtitle-perkiraan.srt']
hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in outputs}
(D/'SHA256SUMS.txt').write_text(''.join(f'{v}  {k}\n' for k,v in hashes.items()),encoding='utf-8')
lines=['# QA — Awan 500 ton, rig V2 (draft privat)','',f'Video {float(meta["format"]["duration"]):.3f} dtk; {v[0]["width"]}×{v[0]["height"]}, {v[0].get("avg_frame_rate")} fps, {v[0].get("nb_read_frames")} frame; AAC satu track.',f'Loudness hasil pengukuran: {lufs:.1f} LUFS integrated / {peak:.1f} dBTP true peak.','', '## Pemeriksaan mekanis']
for label,ok in checks.items():lines.append(f'- {"PASS" if ok else "FAIL"}: {label}')
lines += ['', '## Peninjauan terbatas dan batas',
'- NEEDS REVIEW: pemeriksaan subjektif frame hasil encode dan seluruh gerakan memerlukan penonton manusia; unit test tidak membuktikannya.',
'- NEEDS REVIEW: dengarkan seluruh narasi, pelafalan “ikuti knot theory”, musik dan keseimbangan suara. Belum ada pemeriksaan pendengaran manusia.',
'- NEEDS REVIEW: batas cue mendekati jeda; pembagian di dalam kalimat masih estimasi, bukan forced alignment. Gerak mulut prosedural, bukan lip sync fonem.',
'- NEEDS REVIEW: kualitas gerak, interaksi tiap properti, kenyamanan visual di ponsel, safe-area serta hak distribusi aset AI/voice/font/codec.',
'- NOT TESTED: pemutaran penuh di perangkat/FB/TikTok/YT/IG; render ulang MP4 lengkap dari backup pada instalasi baru.',
'- VERIFIED: USGS memperkirakan 500.000 kg = 500 ton metrik **air** untuk contoh 1 km³ × 0,5 g/m³. Bukan berat semua awan dan tidak termasuk udara.',
'- VERIFIED: gravitasi tetap bekerja pada tetes; tetes kecil dapat turun relatif terhadap udara diam dan sebagian dapat terbawa arus naik. Pada sebagian awan, tumbukan/penggabungan membantu tetes tumbuh menjadi hujan.',
'- ASSUMPTION: ilustrasi dan kualitas hook dipakai sebagai rancangan editorial, bukan jaminan retensi/performa.',
'- Status: PRIVAT / BELUM dijadwalkan atau dipublikasikan; review tidak digantikan oleh angka pemeriksaan.', '', '## Sumber']
for src in spec['sources']:lines.append(f'- {src["label"]}: {src["url"]} — {src["supports"]}')
lines+=['','## SHA-256 output']+[f'- `{name}`: `{digest}`' for name,digest in hashes.items()]
(D/'QA-DAN-SUMBER.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print(json.dumps({'checks':checks,'duration':float(meta['format']['duration']),'lufs':lufs,'true_peak':peak,'hashes':hashes},ensure_ascii=False,indent=2))
if not all(checks.values()):sys.exit(1)
