"""Make a 52-second proof of the fixed boundaries, without altering the master."""
import json
import shutil
from pathlib import Path

HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[3]
BASE=ROOT/'editorial-engine/deliverables/gibran-mundur-2026'
master=BASE/'openfilm-master-v5'
out=BASE/'openfilm-master-v5-review'
out.mkdir(exist_ok=True)
shutil.copytree(master/'assets',out/'assets',dirs_exist_ok=True)
for name in ['motion.js',*[f'scene-{i:02}.html' for i in range(1,25)]]:
    shutil.copy2(master/name,out/name)
manifest=json.loads((master/'build-manifest.json').read_text())
sections=[(14,29),(58,62),(195,207),(295,316)]
clips=[];audio=[];cursor=0
for a,b in sections:
    for scene in manifest['scenes']:
        left,right=max(a,scene['start']),min(b,scene['end'])
        if right<=left:continue
        start,end=left-scene['start'],right-scene['start']
        clips.append(f'<iframe src="scene-{scene["scene"]:02}.html#t={start:.3f},{end:.3f}" at="{cursor+left-a:.3f}"></iframe>')
    audio.append(f'<audio src="assets/vo.mp3#t={a},{b}" at="{cursor}"></audio>')
    cursor+=b-a
(out/'film.html').write_text('''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=1920,height=1080"><style>html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#081e26}iframe{display:block;border:0;width:1920px;height:1080px}</style></head><body><section>'''+''.join(clips)+'</section><section>'+''.join(audio)+'</section></body></html>')
(out/'review-ranges.json').write_text(json.dumps({'duration':cursor,'originalRanges':sections,'masterMotionSha256':manifest['motionSha256']},indent=2))
print(out)
