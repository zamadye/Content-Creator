"""Regression check for black padding in this navy-background motion study."""
import argparse
import json
import statistics
import subprocess

p = argparse.ArgumentParser()
p.add_argument('video')
p.add_argument('--ffmpeg', default='ffmpeg')
p.add_argument('--ffprobe', default='ffprobe')
args = p.parse_args()
info = json.loads(subprocess.check_output([args.ffprobe, '-v', 'error', '-show_entries',
    'format=duration:stream=width,height,codec_type', '-of', 'json', args.video]))
duration = float(info['format']['duration'])
video = next(s for s in info['streams'] if s['codec_type'] == 'video')
assert (video['width'], video['height']) == (1920, 1080), video
# Every study shot paints a navy background to all four edges. The old GUI
# capture painted the bottom/right region black even though dimensions were 1080p.
for t in [duration * x for x in (.05, .25, .6, .9)]:
    for corner, crop in [('TL', '8:8:4:4'), ('TR', '8:8:1908:4'),
                         ('BL', '8:8:4:1068'), ('BR', '8:8:1908:1068')]:
        raw = subprocess.check_output([args.ffmpeg, '-v', 'error', '-ss', str(t),
            '-i', args.video, '-frames:v', '1', '-vf', 'crop='+crop,
            '-pix_fmt', 'rgb24', '-f', 'rawvideo', '-'])
        rgb = tuple(round(statistics.median(raw[c::3])) for c in range(3))
        assert rgb[1] > 15 and rgb[2] > 15, f'Black/missing capture at {t:.2f}s {corner}: {rgb}'
    print(f'{t:.2f}s: four corners painted, no GUI padding')
