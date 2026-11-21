"""Ukur durasi VO lalu pasang ke story.json (skema studio.story2d/2)."""
import json, subprocess, sys
FF = 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'
def dur(p):
    out = subprocess.run([FF, '-hide_banner', '-i', p], capture_output=True, text=True).stderr
    for ln in out.splitlines():
        if 'Duration:' in ln:
            t = ln.split('Duration:')[1].split(',')[0].strip()
            h, m, s = t.split(':')
            return int(h) * 3600 + int(m) * 60 + float(s)
s = json.load(open('stories/saldo-8-juta/story.json'))
n = 0
for sh in s['shots']:
    spec = sh['duration']; tot = 0; has = False
    for l in sh['lines']:
        if 'audio' in l:
            d = dur('public/' + l['audio'])
            l['audioDuration'] = round(d, 2)
            l['duration'] = round(max(0.9, d + 0.45), 2)
            has = True; n += 1
        tot += l['duration']
    sh['duration'] = round(max(spec, tot + 0.5), 2) if has else spec
json.dump(s, open('stories/saldo-8-juta/story.json', 'w'), indent=2, ensure_ascii=False)
print('VO terpasang', n, '| total', round(sum(x['duration'] for x in s['shots']), 1))
