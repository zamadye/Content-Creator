"""Compare actual OpenFilm clip boundaries with the supplied DOCX timestamps."""
import hashlib
import argparse
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / 'editorial-engine/deliverables/gibran-mundur-2026'
parser = argparse.ArgumentParser()
parser.add_argument('--project', type=Path, default=BASE/'openfilm-full')
parser.add_argument('--out', type=Path, default=BASE/'audit-full')
parser.add_argument('--ffprobe', default='/tmp/knot-render-bin/ffprobe')
args = parser.parse_args()
DOC = ROOT / 'Timpstamp Gibran Mundur.docx'
OUT = args.out
OUT.mkdir(parents=True, exist_ok=True)
with ZipFile(DOC) as z:
    tree = ET.fromstring(z.read('word/document.xml'))
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', ns)).strip()
              for p in tree.findall('.//w:p', ns)]
blocks = []
for paragraph in paragraphs:
    m = re.fullmatch(r'\((\d+):(\d+)\s*-\s*(\d+):(\d+)\)', paragraph)
    if m:
        a, b, c, d = map(int, m.groups())
        blocks.append({'start': a*60+b, 'end': c*60+d, 'text': ''})
    elif paragraph and blocks:
        blocks[-1]['text'] += ('\n' if blocks[-1]['text'] else '') + paragraph
blocks = [b for b in blocks if b['end'] > b['start'] and b['text']]

class Film(HTMLParser):
    def __init__(self):
        super().__init__()
        self.clips = []
    def handle_starttag(self, tag, attrs):
        if tag != 'iframe':
            return
        a = dict(attrs)
        m = re.fullmatch(r'(scene-|hook-sc)(\d+)\.html#t=([\d.]+),([\d.]+)', a['src'])
        if not m:
            raise ValueError(a['src'])
        prefix, scene, src_in, src_out = m.groups()
        start = float(a.get('at', 0))
        self.clips.append({'scene': int(scene), 'isHook':prefix=='hook-sc', 'start': start,
                           'end': start + float(src_out)-float(src_in)})

film_path = args.project/'film.html'
film = Film()
film.feed(film_path.read_text())
manifest_path=args.project/'build-manifest.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
offset=manifest.get('mainStartOffset',0)
main_clips=[c for c in film.clips if not c['isHook']]
timeline = json.loads((ROOT/'editorial-engine/content/gibran-mundur/timeline.json').read_text())
rows, errors, holds = [], [], []
for playback in main_clips:
    c={**playback,'start':round(playback['start']-offset,6),'end':round(playback['end']-offset,6)}
    source = [b for b in blocks if b['start'] >= c['start'] and b['start'] < c['end']]
    row = {**c, 'playbackStart':playback['start'],'playbackEnd':playback['end'],'sourceBlocks': source}
    row['startMatches'] = bool(source) and c['start'] == source[0]['start']
    row['sourceEnd'] = source[-1]['end'] if source else None
    row['tailSeconds'] = round(c['end']-row['sourceEnd'], 3) if source else None
    expected = timeline['scenes'][c['scene']-1]
    row['matchesLocalTimeline'] = c['start'] == expected['start'] and abs(c['end']-expected['end']) < 1e-6
    if not row['startMatches'] or not row['matchesLocalTimeline']:
        errors.append(f"SC{c['scene']}: boundary mismatch")
    if row['tailSeconds'] == 1:
        holds.append({'scene': c['scene'], 'start': row['sourceEnd'], 'end': c['end']})
    rows.append(row)
for a, b in zip(film.clips, film.clips[1:]):
    if abs(a['end']-b['start']) > 1e-6:
        errors.append(f"Gap/overlap between SC{a['scene']} and SC{b['scene']}")
probe = subprocess.check_output([args.ffprobe, '-v', 'error',
    '-show_entries', 'format=duration', '-of', 'json', str(args.project/'assets/vo.mp3')])
duration = float(json.loads(probe)['format']['duration'])
if abs(film.clips[-1]['end']-duration-offset) > 1/30:
    errors.append('Timeline does not end with source audio')
result = {'sourceDoc': DOC.name, 'sourceDocSha256': hashlib.sha256(DOC.read_bytes()).hexdigest(),
          'filmSha256': hashlib.sha256(film_path.read_bytes()).hexdigest(),
          'audioDuration': duration,'leadInSeconds':offset,'playbackDuration':duration+offset,'pictureClipCount':len(film.clips), 'sourceBlocks': len(blocks), 'sceneCount': len(rows),
          'errors': errors, 'holds': holds, 'scenes': rows,
          'limitation': 'DOCX contains coarse intervals, not word timings. Boundary matches do not prove speech/action alignment.'}
(OUT/'timestamp-audit.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps({k: result[k] for k in ['audioDuration','sourceBlocks','sceneCount','errors','holds']}, indent=2))
