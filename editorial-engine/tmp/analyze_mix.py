"""Measures the delivered mix: speech level vs score level vs gaps, and clipping."""
import json, subprocess, numpy as np

FF = 'node_modules/@ffmpeg-installer/linux-x64/ffmpeg'
raw = subprocess.run([FF,'-v','error','-i','audio/mix/mbg-gizi-anak.master.wav','-f','f32le','-ac','1','-ar','48000','-'],
                     capture_output=True).stdout
mono = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
sr = 48000
tl = json.load(open('content/timeline.json'))
vo = [(v['id'], v['startFrame']/tl['fps'], v['durationInFrames']/tl['fps']) for v in tl['vo']]
def rms(a, b):
    s = mono[int(a*sr):int(b*sr)]
    return 20*np.log10(np.sqrt(np.mean(s**2))+1e-12) if len(s) else float('nan')
print(f"duration {len(mono)/sr:.2f}s  peak {20*np.log10(np.max(np.abs(mono))+1e-12):.2f} dBFS  near-clip samples {int(np.sum(np.abs(mono)>0.99))}")
for sid, s, d in vo:
    print(f"  speech {sid}: {rms(s+0.15, s+d-0.15):6.1f} dBFS")
spans = sorted([(s, d) for _, s, d in vo])
prev, gaps = 0.0, []
for s, d in spans:
    if s - prev > 0.9: gaps.append((prev+0.25, s-0.25))
    prev = max(prev, s+d)
for a, b in gaps[:8]:
    print(f"  score-only {a:5.1f}-{b:5.1f}: {rms(a,b):6.1f} dBFS")
print(f"  whole file: {rms(0, len(mono)/sr):.1f} dBFS")
