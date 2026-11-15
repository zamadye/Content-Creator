"""Reject broken timing, missing media, or a restored v3 before a costly export."""
import hashlib
import json
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

project=Path(sys.argv[1]).resolve()
manifest=json.loads((project/'build-manifest.json').read_text())
assert manifest['version'] in [5,6], 'Expected revised master v5/v6'
hook=manifest.get('openingHook')
offset=manifest.get('mainStartOffset',0)
lead=1 if hook else 0
class Film(HTMLParser):
    def __init__(self):
        super().__init__();self.clips=[];self.audio=[];self.sources=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag not in ['iframe','audio']:return
        url=urlsplit(a['src'])
        assert (project/url.path).is_file(), f'Missing clip: {url.path}'
        if tag=='audio':self.audio.append(a);return
        trim=url.fragment.removeprefix('t=').split(',')
        start=float(a.get('at',0));duration=float(trim[1])-float(trim[0])
        self.clips.append((start,start+duration))
        self.sources.append(a)
f=Film();f.feed((project/'film.html').read_text())
assert len(f.clips)==24+lead, 'Expected 24 original picture clips plus the optional copied hook'
assert len(f.audio)==1+lead, 'Expected the main VO plus an optional hook excerpt'
main_audio=f.audio[-1]
assert main_audio['src']=='assets/vo.mp3' and abs(float(main_audio.get('at',0))-offset)<1e-6, 'Main VO must start unchanged after the hook'
assert f.clips[0][0]==0 and abs(f.clips[-1][1]-(434.991+offset))<.001, 'Wrong film endpoints'
for i,(a,b) in enumerate(f.clips):
    assert b>a, f'Non-positive clip {i+1}'
    if i:assert abs(f.clips[i-1][1]-a)<.001, f'Gap/overlap at clip {i+1}'
for i,scene in enumerate(manifest['scenes']):
    a,b=f.clips[i+lead]
    assert abs(a-scene['start']-offset)<1e-5 and abs(b-scene['end']-offset)<1e-5, f'SC{i+1}: original timing/order changed'
    src=urlsplit(f.sources[i+lead]['src'])
    assert src.path==f'scene-{i+1:02}.html', 'The 24 original scene copies must stay in order'
    left,right=map(float,src.fragment.removeprefix('t=').split(','))
    assert left==0 and abs(right-scene['duration'])<1e-5, 'Original scene was trimmed to make the hook'
    page=(project/src.path).read_text()
    assert i==0 or '<video' not in page, f'SC{i+1}: empty video placeholders can stall export by 10s/frame'
assert abs(f.clips[17+lead][0]-offset-291)<1e-5 and abs(f.clips[18+lead][0]-offset-311)<1e-5, 'SC18–19 timestamp regression'
if hook:
    assert abs(f.clips[0][1]-offset)<1e-6 and f.clips[0][0]==0, 'Hook must fill the leading slot'
    source_page=project/f'scene-{hook["sourceScene"]:02}.html'
    hook_page=project/urlsplit(f.sources[0]['src']).path
    assert hook_page.read_text().replace(' data-hook="true"','')==source_page.read_text(), 'Hook page must remain a copy of the selected scene'
    v0,v1=map(float,urlsplit(f.sources[0]['src']).fragment.removeprefix('t=').split(','))
    assert abs(v0-hook['visualIn'])<1e-6 and abs(v1-hook['visualOut'])<1e-6, 'Wrong copied visual range'
    audio=urlsplit(f.audio[0]['src'])
    x,y=map(float,audio.fragment.removeprefix('t=').split(','))
    assert audio.path=='assets/vo.mp3' and float(f.audio[0].get('at',0))==0
    assert abs(x-hook['audioIn'])<1e-6 and abs(y-hook['audioOut'])<1e-6 and abs(y-x-offset)<1e-6, 'Hook voice and picture lengths differ'
for key,name in [('voSha256','assets/vo.mp3'),('motionSha256','motion.js')]:
    actual=hashlib.sha256((project/name).read_bytes()).hexdigest()
    assert actual==manifest[key], f'{name} differs from build manifest; rebuild/review the source first'
print(f'Preflight: {24+lead} clips, continuous {434.991+offset:.3f}s, original scene order/timing and VO preserved; hook {offset:.3f}s.')
