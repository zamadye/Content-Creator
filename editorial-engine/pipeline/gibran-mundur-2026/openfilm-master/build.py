"""Prepare the revised 24-scene native project. Never restore v3 over this master."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path
from zipfile import ZipFile

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
BASE = ROOT/'editorial-engine/deliverables/gibran-mundur-2026'
parser = argparse.ArgumentParser()
parser.add_argument('--out', type=Path)
parser.add_argument('--without-hook', action='store_true', help='Reproduce the previous v5 master')
args = parser.parse_args()
hook_path = ROOT/'editorial-engine/content/gibran-mundur/opening-hook.json'
hook = None if args.without_hook else json.loads(hook_path.read_text())
if hook and not hook.get('enabled'):hook=None
offset = hook['duration'] if hook else 0
if hook:
    assert hook['keepOriginalScene'] is True
    assert abs(hook['visualOut']-hook['visualIn']-offset)<1e-6
    assert abs(hook['audioOut']-hook['audioIn']-offset)<1e-6
    assert abs(offset*30-round(offset*30))<1e-6, 'Hook length must land on a frame'
version = 6 if hook else 5
out = (args.out or BASE/('openfilm-master-v6-hook' if hook else 'openfilm-master-v5')).resolve()
(out/'assets').mkdir(parents=True, exist_ok=True)
timeline_path = ROOT/'editorial-engine/content/gibran-mundur/timeline.json'
timeline = json.loads(timeline_path.read_text())
for name in ['vo.mp3', 'SC01.mp4']:
    source = BASE/'openfilm-full/assets'/name
    target = out/'assets'/name
    if not target.exists():
        if source.exists():
            shutil.copy2(source, target)
        else:
            with ZipFile(ROOT/'gibran-mundur-openfilm-full-project-v3.zip') as z:
                target.write_bytes(z.read('assets/'+name))
    if source.exists() and hashlib.sha256(source.read_bytes()).digest() != hashlib.sha256(target.read_bytes()).digest():
        raise SystemExit(f'Asset differs from original: {target}; not overwriting it.')
for weight in [400, 600, 700]:
    font = f'archivo-latin-{weight}-normal.ttf'
    shutil.copy2(ROOT/'editorial-engine/assets/fonts'/font, out/'assets'/font)
shutil.copy2(HERE/'motion.js', out/'motion.js')
clips = []
pages = []
for scene in timeline['scenes']:
    n = scene['n']
    start, end = scene['start'], scene['end']
    duration = round(end-start, 3)
    name = f'scene-{n:02}.html'
    css = ''.join(f"@font-face{{font-family:Archivo;src:url('assets/archivo-latin-{w}-normal.ttf');font-weight:{w};font-display:block}}" for w in [400,600,700])
    page = f'''<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=1920,height=1080">
<style>{css}*{{box-sizing:border-box}}html,body{{margin:0;width:1920px;height:1080px;overflow:hidden;background:#081e26;color:#fff3d9;font-family:Archivo,Arial,sans-serif}}svg{{position:absolute;inset:0;width:1920px;height:1080px;display:block}}#plate{{position:absolute;inset:0;width:1920px;height:1080px;object-fit:cover;display:{'block' if n==1 else 'none'}}}.disclosure{{position:absolute;right:88px;bottom:20px;color:#829b9b;font-size:14px;letter-spacing:2px}}</style></head>
<body data-scene="{n}">{'<video id="plate" muted playsinline preload="auto"></video>' if n==1 else ''}<svg id="stage" viewBox="0 0 1920 1080"></svg>{'' if n==1 else '<div class="disclosure">ILUSTRASI</div>'}<script type="module" src="motion.js"></script></body></html>'''
    (out/name).write_text(page)
    clips.append(f'<iframe id="main-sc{n:02}" src="{name}#t=0,{duration:.3f}" at="{start+offset:.6f}" title="SC{n:02} · {scene["section"]}"></iframe>')
    pages.append({'scene':n,'start':start,'end':end,'duration':duration,'playbackStart':start+offset,'playbackEnd':end+offset})
audio_clips=[]
if hook:
    source=out/f'scene-{hook["sourceScene"]:02}.html'
    target=out/f'hook-sc{hook["sourceScene"]:02}.html'
    target.write_text(source.read_text().replace(f'data-scene="{hook["sourceScene"]}"',f'data-scene="{hook["sourceScene"]}" data-hook="true"'))
    clips.insert(0,f'<iframe id="opening-hook-copy-sc{hook["sourceScene"]}" src="{target.name}#t={hook["visualIn"]:.6f},{hook["visualOut"]:.6f}" at="0" title="HOOK · salinan SC{hook["sourceScene"]}"></iframe>')
    audio_clips.append(f'<audio id="hook-original-vo" src="assets/vo.mp3#t={hook["audioIn"]:.6f},{hook["audioOut"]:.6f}" at="0" volume="1"></audio>')
audio_clips.append(f'<audio id="main-original-vo" src="assets/vo.mp3" at="{offset:.6f}" volume="1"></audio>')
film = '''<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=1920,height=1080"><style>html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#081e26}iframe{border:0;display:block;width:1920px;height:1080px}</style></head><body><section>'''+ '\n'.join(clips)+'</section><section><audio src="assets/vo.mp3" at="0" volume="1"></audio></section></body></html>'
film=film.replace('<audio src="assets/vo.mp3" at="0" volume="1"></audio>','\n'.join(audio_clips))
(out/'film.html').write_text(film)
manifest = {'version':version,'scenes':pages,'duration':434.991+offset,'mainStartOffset':offset,'openingHook':hook,'pictureClipCount':len(clips),
    'timelineSha256':hashlib.sha256(timeline_path.read_bytes()).hexdigest(),
    'motionSha256':hashlib.sha256((out/'motion.js').read_bytes()).hexdigest(),
    'voSha256':hashlib.sha256((out/'assets/vo.mp3').read_bytes()).hexdigest(),
    'timingStatus':'DOCX interval boundaries corrected; internal phrase cues need listen-through',
    'publicationAuthorized':False}
(out/'build-manifest.json').write_text(json.dumps(manifest,indent=2))
(out/'README.md').write_text(f'''# Revised native master v{version}

24 original scenes + {1 if hook else 0} copied opening hook; 1920×1080; {434.991+offset:.3f} seconds.
Original VO unchanged. Opening adds {offset:.3f} seconds before the original story.
SC21 remains in its original place in the main story. DOCX/source times are
unchanged; playback of the main story is offset by the hook length.
SC18 holds through 5:11, SC19 begins at 5:11; all ten DOCX gaps hold the outgoing picture.
The cooling-system reveal begins at 4:58. Local fonts are bundled.
Source: pipeline/gibran-mundur-2026/openfilm-master/.
This is the revised master for visual review, not a claim of final editorial approval.
The v3 ZIP and previous projects are preserved. Exact phrase alignment, subtitles,
final sound design and factual/legal verification are separate remaining checks.
''')
print(out)
