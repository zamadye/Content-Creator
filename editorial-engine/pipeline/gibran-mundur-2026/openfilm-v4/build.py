"""Build a separate motion study; preserve the original VO and the v3 project."""
from pathlib import Path
import argparse
import shutil

parser = argparse.ArgumentParser()
parser.add_argument('--compact', action='store_true', help='32-second action montage')
args = parser.parse_args()

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = ROOT / 'editorial-engine/deliverables/gibran-mundur-2026'
OLD = BASE / 'openfilm-full'
OUT = BASE / ('openfilm-motion-study-v4-compact' if args.compact else 'openfilm-motion-study-v4')
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'assets').mkdir(exist_ok=True)
for name in ('vo.mp3', 'SC01.mp4'):
    dest = OUT / 'assets' / name
    if not dest.exists():
        shutil.copy2(OLD / 'assets' / name, dest)
shutil.copy2(HERE / 'motion.js', OUT / 'motion.js')

# A study of four distinct mechanisms, each retained at the original VO length.
shots = ([(2, 9, 5, 13), (3, 25, 14, 22), (14, 209, 6, 14), (18, 291, 9, 17)]
         if args.compact else [(2, 9, 0, 16), (3, 25, 0, 30), (14, 209, 0, 24), (18, 291, 0, 19)])
pictures, sound, cursor = [], [], 0
for scene, source, start, end in shots:
    duration = end - start
    name = f'scene-{scene:02}.html'
    page = f'''<!doctype html><html lang="id"><head><meta charset="utf-8">
<meta name="viewport" content="width=1920,height=1080">
<style>*{{box-sizing:border-box}}html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;background:#081e26;color:#fff3d9;font-family:Arial,sans-serif}}svg{{width:1920px;height:1080px;display:block}}#review{{position:absolute;left:88px;bottom:20px;color:#829b9b;font-size:15px;letter-spacing:2px}}</style></head>
<body data-scene="{scene}"><svg id="stage" viewBox="0 0 1920 1080"></svg><div id="review">KNOT THEORY / MOTION STUDY V4 · ILUSTRASI · TIMING VO PERLU REVIEW</div><script type="module" src="motion.js"></script></body></html>'''
    (OUT / name).write_text(page)
    pictures.append(f'<iframe src="{name}#t={start},{end}" at="{cursor}" title="SC{scene:02} · motion study"></iframe>')
    sound.append(f'<audio src="assets/vo.mp3#t={source + start},{source + end}" at="{cursor}"></audio>')
    cursor += duration
(OUT / 'film.html').write_text('''<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=1920,height=1080"></head><body><section>'''
    + '\n'.join(pictures) + '</section><section>' + '\n'.join(sound) + '</section></body></html>')
(OUT / 'README.md').write_text(f'''# Motion study v4 — review draft

Four redesigned scenes: SC02, SC03, SC14, SC18. Total {cursor} seconds.
The VO uses original source ranges without regeneration. This is a study montage,
not a continuous edit of the master. Frame(t) is deterministic and has no animation loop.
No new factual or legal claim has been verified by this visual revision.
The numeric pillar loads are expressly an illustration, not engineering data.
No subtitle track or final sound design is included; do not treat this as a final master.
''')
print(OUT)
