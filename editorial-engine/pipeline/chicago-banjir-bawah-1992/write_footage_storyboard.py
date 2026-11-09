#!/usr/bin/env python3
"""Document the measured, single-clock footage plan as a private review storyboard."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import render_rough as rough
import render_footage as footage


def clock(t):
    centiseconds=max(0,round(t*100));return f'{centiseconds//6000:02}:{(centiseconds//100)%60:02}.{centiseconds%100:02}'


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--timeline',type=Path,required=True)
    ap.add_argument('--out',type=Path,required=True)
    a=ap.parse_args()
    if not a.out.resolve().is_relative_to((rough.ROOT/'.scratch').resolve()):
        raise ValueError('Storyboard output must remain private in .scratch.')
    timeline=json.loads(a.timeline.read_text(encoding='utf-8'))
    meta=json.loads((rough.CONTENT/'render-meta.json').read_text(encoding='utf-8'))
    catalog=footage.read_catalog()
    lines=['# Storyboard footage — Chicago 1992', '',
           '**DRAF PRIVAT, BUKAN BUKTI KEJADIAN DAN BUKAN IZIN TAYANG.** Waktu scene/subtitle adalah estimasi dari satu clock narasi. Tidak ada klip yang merekam banjir 1992. Rekonstruksi dan skema bukan lokasi, rupa, dokumen atau simulasi fisik yang akurat.', '',
           'ObjectMap adalah target penulisan sebelumnya, **bukan** bukti bahwa setiap aksi terlihat/bergerak di hasil. Kecocokan visual-kalimat dan kelayakan perlu ditonton dan diperiksa manusia.', '']
    for edition, data in timeline.items():
        script=json.loads((rough.CONTENT/f'{edition}.script.json').read_text(encoding='utf-8'))
        narr={s['id']:s['narration'] for s in script['scenes']}; objects={s['id']:s['objectMap'] for s in meta[edition]}
        lines += [f'## {edition.upper()}', '']
        for scene in data['scenes']:
            sid=scene['id'];lines += [f"### {sid} · {clock(scene['start'])}–{clock(scene['end'])}", '',
                f"Narasi: {narr[sid]}", '',
                'Target objectMap: '+'; '.join(f"{o['object']} — {o['action']}" for o in objects[sid])+'.', '']
            for shot in (s for s in data['shots'] if s['sceneId']==sid):
                kind=shot['source']
                if kind=='still':
                    title=('skema ilustratif' if sid in rough.DIAGRAM and not shot.get('asset') else 'rekonstruksi AI')
                    extra=shot.get('diagram') or shot.get('asset') or ''
                elif kind=='hybrid':
                    title='rekonstruksi AI + tekstur video air 2011';extra=shot.get('asset') or ''
                else:
                    title=catalog['sources'][kind]['title'];extra=catalog['sources'][kind]['place_date']
                source_in=f" · sumber mulai {shot['sourceInSeconds']:.2f} dtk" if shot.get('sourceInSeconds') is not None else ''
                lines.append(f"- {clock(shot['start'])}–{clock(shot['end'])}: {title} ({extra}){source_in}. Label: {' / '.join(shot['onScreenDisclosure'])}.")
            lines.append('')
    a.out.parent.mkdir(parents=True,exist_ok=True)
    a.out.write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print('Wrote',a.out)


if __name__=='__main__':main()
