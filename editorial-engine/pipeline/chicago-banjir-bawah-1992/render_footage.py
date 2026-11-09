#!/usr/bin/env python3
"""Private, non-publication Chicago footage experiment.

There is exactly one sentence/scene clock, inherited from render_rough. This
renderer replaces portions of that visual clock with identified, *non-event*
source video; it does not clear rights, perform forced alignment, or approve a
release. Input footage is never committed or published by this program.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import math
from pathlib import Path
import subprocess
import sys

from PIL import Image, ImageDraw, ImageOps
import render_rough as rough

HERE = Path(__file__).resolve().parent
PLAN_PATH = HERE / 'footage-plan.json'
CATALOG_PATH = HERE / 'footage-sources.json'
FPS = rough.FPS


def read_plan(path=PLAN_PATH):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    if data.get('version') != 1 or set(data.get('shots', {})) != {'master', 'short'}:
        raise ValueError('Invalid footage plan version or editions.')
    return data['shots']


def read_catalog(path=CATALOG_PATH):
    data = json.loads(Path(path).read_text(encoding='utf-8'))
    if data.get('version') != 1 or not isinstance(data.get('sources'), dict):
        raise ValueError('Invalid footage source catalog.')
    for key in ('hybrid_label', 'still_label', 'diagram_label'):
        if len(data.get(key, [])) != 2 or not all(isinstance(s, str) and s.strip() for s in data[key]):
            raise ValueError(f'Missing disclosure label: {key}.')
    for key, value in data['sources'].items():
        if (not isinstance(value.get('duration'), (int, float)) or value['duration'] <= 0
                or len(value.get('sha256', '')) != 64 or len(value.get('label', [])) != 2
                or not all(isinstance(s, str) and s.strip() for s in value['label'])
                or not all(value.get(x) for x in ('file', 'author', 'license', 'license_url', 'source_url', 'place_date'))):
            raise ValueError(f'Incomplete source identity, rights, or disclosure: {key}.')
    return data


def check_source_files(catalog, footage_dir, used):
    root = footage_dir.resolve()
    scratch = (rough.ROOT / '.scratch').resolve()
    if not root.is_relative_to(scratch):
        raise ValueError('Source footage must remain in the ignored .scratch directory.')
    paths = {}
    for name in sorted(used):
        source = catalog['sources'][name]
        path = (root / source['file']).resolve()
        if not path.is_relative_to(root) or not path.is_file():
            raise ValueError(f'Missing or unsafe private source file: {name}.')
        if rough.shasum(path) != source['sha256']:
            raise ValueError(f'Private source hash differs from the approved source: {name}.')
        paths[name] = path
    return paths


def validate_plan(scripts, plans, catalog, assets):
    """Fail closed on missing scenes, unknown sources, or misleading missing labels."""
    used = set()
    for edition in ('master', 'short'):
        scene_ids = [s['id'] for s in scripts[edition]['scenes']]
        if list(plans[edition]) != scene_ids:
            raise ValueError(f'{edition}: plan must cover every scene exactly in script order.')
        for sid, shots in plans[edition].items():
            if not isinstance(shots, list) or not 1 <= len(shots) <= 4:
                raise ValueError(f'{sid}: expected one to four shots.')
            weights = []
            for shot in shots:
                kind = shot.get('source')
                weight = shot.get('weight')
                if not isinstance(weight, (int, float)) or not math.isfinite(weight) or weight <= 0:
                    raise ValueError(f'{sid}: invalid shot weight.')
                weights.append(weight)
                if kind == 'still':
                    if 'in' in shot:
                        raise ValueError(f'{sid}: stills cannot have source offsets.')
                elif kind == 'hybrid':
                    used.add('water2011')
                    if not shot.get('asset'):
                        raise ValueError(f'{sid}: a hybrid needs an explicitly bound reconstruction.')
                elif kind in catalog['sources']:
                    used.add(kind)
                else:
                    raise ValueError(f'{sid}: unknown source {kind!r}.')
                if kind != 'still':
                    val = shot.get('in')
                    if not isinstance(val, (int, float)) or not math.isfinite(val) or val < 0:
                        raise ValueError(f'{sid}: invalid source offset.')
                if 'asset' in shot and shot['asset'] not in assets:
                    raise ValueError(f'{sid}: illustration is not bound in the voice/assets manifest.')
                if 'diagram' in shot and (kind != 'still' or 'asset' in shot or sid not in ('S27','S28','T07') or shot['diagram'] not in ('legal-first','legal-both')):
                    raise ValueError(f'{sid}: unsupported or ambiguous diagram variant.')
            if abs(sum(weights) - 1.) > 1e-7:
                raise ValueError(f'{sid}: shot weights must add up to one.')
    return used


def split_frames(frames, shots):
    if frames < len(shots):
        raise ValueError('A scene is too short for its shot count.')
    cumulative = 0.
    borders = [0]
    for shot in shots[:-1]:
        cumulative += shot['weight']
        borders.append(round(frames * cumulative))
    borders.append(frames)
    counts = [borders[i + 1] - borders[i] for i in range(len(shots))]
    if min(counts) < 1 or sum(counts) != frames:
        raise ValueError('Shot frame allocation is invalid.')
    return counts


def check_bounds(sid, shots, counts, catalog):
    for shot, frames in zip(shots, counts):
        kind = shot['source']
        if kind == 'still':
            continue
        source = catalog['sources']['water2011' if kind == 'hybrid' else kind]
        # A small margin protects the decoded end from nominal-duration rounding.
        if shot['in'] + frames / FPS > source['duration'] - .12:
            raise ValueError(f'{sid}: source range exceeds {kind} duration.')


def disclosure_for(sid, shot, catalog):
    if shot['source'] == 'hybrid':
        return catalog['hybrid_label']
    if shot['source'] == 'still':
        return catalog['diagram_label'] if sid in rough.DIAGRAM and 'asset' not in shot else catalog['still_label']
    if sid == 'S22' and shot['source'] == 'chicago1974':
        # The archival crowds/train did not show the evacuation or outage.
        return (['CTA CHICAGO  •  SEKITAR 1974', 'BUKAN GANGGUAN SAAT BANJIR'] if shot['in']==442
                else ['CHICAGO  •  SEKITAR 1974', 'ARSIP  •  BUKAN EVAKUASI'])
    if sid in ('S27','S28','T07') and shot['source'] == 'chicago1974':
        return ['CHICAGO  •  SEKITAR 1974', 'ARSIP  •  BUKAN SIDANG 1998']
    return catalog['sources'][shot['source']]['label']


def render_badge(path, lines, sid, w, h):
    vertical = h > w
    size = 26 if vertical else 23
    max_text_width = int(w * (.82 if vertical else .34))
    f = rough.font(size, bold=True)
    while max(f.getlength(line) for line in lines) > max_text_width and size > 16:
        size -= 1
        f = rough.font(size, bold=True)
    padding = 13 if vertical else 12
    lineheight = round(size * 1.35)
    width = math.ceil(max(f.getlength(line) for line in lines)) + 2 * padding
    height = lineheight * 2 + padding * 2 - 3
    badge = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(badge)
    draw.rounded_rectangle((0, 0, width - 1, height - 1), radius=9, fill=(5, 25, 28, 235), outline=(208, 194, 156, 220), width=1)
    for i, line in enumerate(lines):
        draw.text((padding, padding - 2 + i * lineheight), line, font=f, fill=rough.CREAM if i else rough.GOLD)
    badge.save(path)
    if vertical:
        return int(.035 * w), int(.215 * h)
    x = w - width - int(.035 * w)
    y = int(.096 * h)
    # Keep a long single-line story headline distinct from the provenance pill.
    title = rough.HEADLINES.get(sid, '')
    if title and '\n' not in title:
        ftitle = rough.font(44, display=sid not in ('S32', 'T09'), bold=sid in ('S32', 'T09'))
        if int(.055 * w) + ftitle.getlength(title) + 18 > x:
            y = int(.18 * h)
    return x, y


def plain_head_layer(sid, w, h):
    """Adapt existing editorial design, but don't label real footage as reconstruction."""
    vertical = h > w
    layer = Image.new('RGBA', (w, int(h * .31)), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    top = 20 if vertical else 17
    d.rounded_rectangle((int(.035*w), top, int(.965*w), top + int(.045*h)),
                        radius=max(6, int(.008*w)), fill=(7,27,31,220))
    f = rough.font(22 if vertical else 23, bold=True)
    d.text((int(.052*w), top + int(.01*h)), 'KNOT / DUNIA KEBALIK', font=f, fill=rough.CREAM)
    label = 'DRAF PRIVAT  •  REVIEW'
    d.text((int(.948*w)-f.getlength(label), top + int(.01*h)), label, font=f, fill=rough.GOLD)
    title = rough.HEADLINES.get(sid)
    if title:
        size = 57 if vertical else (58 if sid == 'S01' else 44)
        use_display = sid not in ('S32', 'T09')
        ff = rough.font(size, bold=not use_display, display=use_display)
        while max(ff.getlength(line) for line in title.split('\n')) > w*.89 and size > 25:
            size -= 2
            ff = rough.font(size, bold=not use_display, display=use_display)
        y = top + int(.072*h)
        for line in title.split('\n'):
            d.text((int(.055*w), y), line, font=ff, fill=rough.CREAM, stroke_width=2, stroke_fill=rough.INK)
            y += int(size * 1.15)
    return layer


def readable_map(w, h, phase):
    """Conceptual route with labels kept above the subtitle safe area."""
    im = Image.new('RGB', (w,h), '#173d40'); d = ImageDraw.Draw(im)
    y0, y1 = (.30, .75) if w > h else (.32, .68)
    d.rounded_rectangle((int(.07*w),int(y0*h),int(.93*w),int(y1*h)),radius=int(.025*w),fill='#e7dfc9')
    def point(x, y):
        return int(x*w), int((y0 + y*(y1-y0))*h)
    route=[(.13,.67),(.29,.67),(.37,.47),(.57,.47),(.67,.27),(.87,.27)]
    d.line([point(x,y) for x,y in route],fill='#4f7b75',width=max(5,int(.012*w)),joint='curve')
    d.line([point(.20,.25),point(.45,.43),point(.84,.65)],fill='#77a7a5',width=max(6,int(.018*w)))
    x,y=point(*((.32,.67) if phase=='early' else (.65,.34)))
    rr=max(8,int(.025*w));d.ellipse((x-rr,y-rr,x+rr,y+rr),fill=rough.RUST,outline=rough.CREAM,width=3)
    size=max(25,int(w*(.03 if h>w else .021))); f=rough.font(size,bold=True)
    d.text(point(.12,.06),'SKEMA LOKASI',font=f,fill=rough.INK)
    d.text(point(.12,.83),'PENCARIAN AWAL' if phase=='early' else 'TITIK DITEMUKAN',font=f,fill=rough.INK)
    return rough.gradient_overlay(im)


def readable_vertical_cutaway(w, h, phase):
    """Not to scale: keep drawing and labels clear of the lifted captions."""
    im=Image.new('RGB',(w,h),rough.DARK);d=ImageDraw.Draw(im)
    d.rectangle((0,int(.43*h),w,h),fill='#715e4c')
    d.rectangle((0,int(.37*h),int(.48*w),int(.43*h)),fill='#2d8587')
    for i in range(4):
        x=int((.52+i*.11)*w);y=int((.30+(.02 if i%2 else 0))*h);bw=int(.078*w)
        d.rectangle((x,y,x+bw,int(.43*h)),fill='#466461')
        for xx in range(x+8,x+bw-4,14):
            for yy in range(y+12,int(.41*h),22):d.rectangle((xx,yy,xx+6,yy+9),fill='#d8c7a3')
    d.line((0,int(.43*h),w,int(.43*h)),fill='#e7c896',width=4)
    d.rounded_rectangle((int(.07*w),int(.59*h),int(.94*w),int(.68*h)),radius=18,fill='#173941',outline='#d4c09b',width=4)
    d.rectangle((int(.73*w),int(.43*h),int(.84*w),int(.67*h)),fill='#294850',outline='#d4c09b',width=3)
    d.rectangle((int(.735*w),int(.595*h),int(.835*w),int(.675*h)),fill='#173941')
    f=rough.font(26,bold=True)
    d.text((int(.08*w),int(.375*h)),'SUNGAI',font=f,fill=rough.CREAM)
    d.text((int(.09*w),int(.608*h)),'TEROWONGAN',font=f,fill=rough.CREAM)
    d.text((int(.69*w),int(.46*h)),'BASEMENT',font=f,fill=rough.CREAM)
    if phase in ('leak','flood','pump'):
        x=int(.32*w);d.line((x,int(.43*h),x-int(.01*w),int(.59*h)),fill=rough.RUST,width=6)
        for i in range(4):
            yy=int((.45+i*.035)*h);d.ellipse((x-4,yy-4,x+4,yy+4),fill=rough.GOLD)
    if phase in ('flood','pump'):
        d.rounded_rectangle((int(.08*w),int(.65*h),int(.92*w),int(.68*h)),radius=5,fill='#319292')
        d.line((int(.14*w),int(.665*h),int(.88*w),int(.665*h)),fill=rough.MINT,width=4)
        d.polygon([(int(.87*w),int(.65*h)),(int(.92*w),int(.665*h)),(int(.87*w),int(.68*h))],fill=rough.MINT)
    if phase=='pump':
        for x in (.26,.44):d.rectangle((int(x*w),int(.58*h),int((x+.025)*w),int(.69*h)),fill=rough.GOLD)
    return rough.gradient_overlay(im)


def readable_vertical_legal(w, h, phase):
    im=Image.new('RGB',(w,h),'#193b3e');d=ImageDraw.Draw(im)
    labels=['PEMECATAN\nDIBATALKAN']
    if phase=='both':labels+=['DUA TEMUAN\nTETAP ADA']
    for i,text in enumerate(labels):
        y0=.32+i*.19;y1=y0+.155
        d.rounded_rectangle((int(.13*w),int(y0*h),int(.87*w),int(y1*h)),radius=14,fill=rough.CREAM,outline=rough.GOLD,width=3)
        f=rough.font(40,bold=True);rough.draw_centered(d,(w/2,(y0+y1)*h/2-f.size),text,f,rough.INK,spacing=8)
    return rough.gradient_overlay(im)


def readable_vertical_chain(w, h):
    """Keep the attribution badge, three objects and subtitles in separate bands."""
    im=Image.new('RGB',(w,h),'#174247');d=ImageDraw.Draw(im)
    for i,label in enumerate(('KAMERA','PETA','MEMO')):
        y0=.30+i*.14;y1=y0+.10
        d.rounded_rectangle((int(.17*w),int(y0*h),int(.83*w),int(y1*h)),radius=14,
                            fill=rough.CREAM,outline=rough.GOLD,width=3)
        f=rough.font(32,bold=True)
        rough.draw_centered(d,(w/2,(y0+y1)*h/2-f.size/2),label,f,rough.INK)
    return rough.gradient_overlay(im)


def subtitle_lift(w, h):
    # Keep the subtitle box above the bottom 18% for common portrait overlays.
    # This is a design target, not proof of platform/device safe-area compliance.
    return int(h*.155) if h>w else 0


def prepare_tasks(name, timeline, metadata, asset_dir, work, w, h, cues, plans, catalog):
    tasks = rough.prepare_visuals(name, timeline, metadata, asset_dir, work, w, h, cues)
    for task in tasks:
        sid = task['scene']['id']
        plain_head_layer(sid, w, h).save(task['head'])
        if sid in rough.DIAGRAM:
            typ,phase=rough.DIAGRAM[sid]
            if typ=='map': image=readable_map(w,h,phase)
            elif h>w and typ=='cut': image=readable_vertical_cutaway(w,h,phase)
            elif h>w and typ=='legal': image=readable_vertical_legal(w,h,phase)
            elif h>w and typ=='chain': image=readable_vertical_chain(w,h)
            else: image=None
            if image is not None:image.convert('RGB').save(task['base'],optimize=True)
        selected = plans[name][sid]
        if any(shot['source']=='hybrid' for shot in selected):
            hh=int(h*.39)//2*2
            mask=Image.new('L',(w,hh));draw=ImageDraw.Draw(mask)
            for y in range(hh):
                # Fade in spatially rather than drawing a visible horizontal seam.
                alpha=round(59*min(1.,y/max(1.,hh*.35)))
                draw.line((0,y,w,y),fill=alpha)
            task['water_mask']=task['vdir']/'water-alpha.png'
            mask.save(task['water_mask'])
        frames = round(task['scene']['end']*FPS) - round(task['scene']['start']*FPS)
        counts = split_frames(frames, selected)
        check_bounds(sid, selected, counts, catalog)
        rendered_shots = []
        for i, (raw, count) in enumerate(zip(selected, counts)):
            shot = dict(raw)
            shot['frames'] = count
            if 'asset' in shot:
                # Explicit asset bypasses a diagram for this particular shot only.
                image = Image.open(asset_dir / shot['asset']).convert('RGB')
                fit = ImageOps.fit(image, (w,h), method=Image.Resampling.LANCZOS,
                                   centering=rough.FOCAL.get(shot['asset'], (.5,.5)))
                path = task['vdir'] / f'{sid}-alternative-{i}.png'
                rough.gradient_overlay(fit).convert('RGB').save(path, optimize=True)
                shot['base'] = path
            elif 'diagram' in shot:
                phase=shot['diagram'].removeprefix('legal-')
                image=readable_vertical_legal(w,h,phase) if h>w else rough.make_legal(w,h,phase)
                path=task['vdir']/f'{sid}-diagram-{i}.png'
                image.convert('RGB').save(path,optimize=True)
                shot['base']=path
            else:
                shot['base'] = task['base']
            badge = task['vdir'] / f'{sid}-provenance-{i}.png'
            label = disclosure_for(sid, shot, catalog)
            shot['label'] = label
            shot['badge'] = badge
            shot['badge_xy'] = render_badge(badge, label, sid, w, h)
            rendered_shots.append(shot)
        task['shots'] = rendered_shots
    return tasks


def render_segment(task, out_path, source_paths):
    scene = task['scene']; sid = scene['id']; w = task['w']; h = task['h']
    shots = task['shots']
    first = round(scene['start']*FPS); last = round(scene['end']*FPS)
    frames = last - first
    args = [rough.FF, '-loglevel','error','-y']
    inputs = 0
    shot_inputs = []
    # Only still backgrounds loop; source videos and labels are finite. Static
    # subtitle/label overlays are single frames, avoiding the old memory leak.
    for shot in shots:
        kind = shot['source']
        if kind in ('still', 'hybrid'):
            image_index = inputs
            args += ['-loop','1','-framerate',str(FPS),'-i',shot['base']]; inputs += 1
            if kind == 'hybrid':
                video_index = inputs
                args += ['-ss',str(shot['in']),'-threads','1','-i',source_paths['water2011']]; inputs += 1
                mask_index = inputs; args += ['-i',task['water_mask']]; inputs += 1
            else:
                video_index = None; mask_index = None
        else:
            image_index = None; video_index = inputs; mask_index = None
            args += ['-ss',str(shot['in']),'-threads','1','-i',source_paths[kind]]; inputs += 1
        shot_inputs.append((image_index, video_index, mask_index))
    head_index = inputs; args += ['-i',task['head']]; inputs += 1
    subtitle_indices = []
    for cue in task['cues']:
        subtitle_indices.append(inputs); args += ['-i',cue['path']]; inputs += 1
    badge_indices = []
    for shot in shots:
        badge_indices.append(inputs); args += ['-i',shot['badge']]; inputs += 1
    host_index = None
    # Do not put the host over archival people or their faces. Host appears only
    # over the final illustration of the CTA scene.
    if sid in ('S32', 'T09'):
        host_index = inputs
        args += ['-stream_loop','-1','-framerate',str(FPS),'-i',task['hostdir']/'host-%03d.png']; inputs += 1
    motion_index = None
    if sid in ('S08','S15','S19','S24','T02'):
        motion_index = inputs; args += ['-i',task['vdir']/'dot.png']; inputs += 1

    filters = []
    for i, (shot, (image_index, video_index, mask_index)) in enumerate(zip(shots, shot_inputs)):
        n = shot['frames']; kind = shot['source']
        if image_index is not None:
            filters.append(f"[{image_index}:v]zoompan=z='min(1.035,1+on*0.00012)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={w}x{h}:fps={FPS},trim=end_frame={n},setpts=PTS-STARTPTS,setsar=1[base{i}]")
            if kind == 'hybrid':
                # The water texture is visibly a stock overlay, not a claim of
                # real flood footage. It only covers the lower region.
                hh = int(h*.39)//2*2
                filters.append(f'[{video_index}:v]fps={FPS},scale={w}:{hh}:force_original_aspect_ratio=increase,crop={w}:{hh},trim=end_frame={n},setpts=PTS-STARTPTS,format=yuv420p[watercolor{i}]')
                filters.append(f'[{mask_index}:v]format=gray[mask{i}]')
                filters.append(f'[watercolor{i}][mask{i}]alphamerge=eof_action=repeat:shortest=0[water{i}]')
                filters.append(f'[base{i}][water{i}]overlay=0:H-h:format=auto:shortest=1,format=yuv420p[shot{i}]')
            else:
                filters.append(f'[base{i}]format=yuv420p[shot{i}]')
        else:
            prefix = 'crop=1440:1080:240:0,' if kind == 'chicago1974' else ''
            # Horizontal 4:3 archives get soft side fill instead of losing the
            # top/bottom of the image. Portrait is center-cropped and inspected.
            if w > h and kind in ('chicago1974','metra1992'):
                filters.append(f'[{video_index}:v]{prefix}fps={FPS},trim=end_frame={n},setpts=PTS-STARTPTS,split=2[blur{i}][main{i}]')
                filters.append(f'[blur{i}]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur=20:2[soft{i}]')
                filters.append(f'[main{i}]scale={w}:{h}:force_original_aspect_ratio=decrease[fit{i}]')
                filters.append(f'[soft{i}][fit{i}]overlay=(W-w)/2:(H-h)/2:shortest=1,eq=contrast=1.04:saturation=0.88:brightness=0.015,setsar=1,format=yuv420p[shot{i}]')
            else:
                filters.append(f'[{video_index}:v]{prefix}fps={FPS},scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},trim=end_frame={n},setpts=PTS-STARTPTS,eq=contrast=1.03:saturation=0.90,setsar=1,format=yuv420p[shot{i}]')
    filters.append(''.join(f'[shot{i}]' for i in range(len(shots))) + f'concat=n={len(shots)}:v=1:a=0[bg]')
    filters.append(f'[bg][{head_index}:v]overlay=0:0:format=auto:eof_action=repeat:shortest=0[headed]')
    prev = 'headed'
    elapsed = 0
    for i, (shot, badge_idx) in enumerate(zip(shots, badge_indices)):
        begin = elapsed/FPS; elapsed += shot['frames']; end = elapsed/FPS
        x,y = shot['badge_xy']; out = f'badge{i}'
        filters.append(f"[{prev}][{badge_idx}:v]overlay={x}:{y}:enable='gte(t,{begin:.6f})*lt(t,{end:.6f})':format=auto:eof_action=repeat:shortest=0[{out}]")
        prev = out
    if motion_index is not None:
        # Dot only travels over the conceptual diagram, never archive footage.
        elapsed = 0
        for i, shot in enumerate(shots):
            begin = elapsed/FPS; elapsed += shot['frames']; end = elapsed/FPS
            if shot['source'] == 'still' and 'asset' not in shot and sid in rough.DIAGRAM:
                x = f'{int(.10*w)}+mod(t*{max(18,int(w*.05))},{int(.72*w)})'
                y = int((.61 if h>w else .67)*h)
                filters.append(f"[{prev}][{motion_index}:v]overlay=x='{x}':y={y}:enable='gte(t,{begin:.6f})*lt(t,{end:.6f})':format=auto:eof_action=repeat:shortest=0[motion]")
                prev = 'motion'
                break
    if host_index is not None:
        begin = sum(s['frames'] for s in shots[:-1])/FPS
        x = int(.73*w) if w>h else int(.62*w); y = int(.25*h) if w>h else int(.39*h)
        filters.append(f"[{prev}][{host_index}:v]overlay={x}:{y}:enable='gte(t,{begin:.6f})':format=auto:shortest=0[host]")
        prev = 'host'
    for i, (cue, cue_index) in enumerate(zip(task['cues'], subtitle_indices)):
        out = f'c{i}'
        lift=subtitle_lift(w,h)
        filters.append(f"[{prev}][{cue_index}:v]overlay=0:H-h-{lift}:enable='gte(t,{cue['start']:.4f})*lt(t,{cue['end']:.4f})':format=auto:eof_action=repeat:shortest=0[{out}]")
        prev = out
    filters.append(f'[{prev}]format=yuv420p[v]')
    args += ['-filter_complex_threads','1','-filter_complex',';'.join(filters),'-map','[v]',
             '-frames:v',str(frames),'-r',str(FPS),'-an','-c:v','libx264','-preset','veryfast',
             '-crf','23','-threads','2',out_path]
    result = subprocess.run([str(x) for x in args], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True)
    if result.returncode:
        raise RuntimeError(f'{sid} footage render failed ({result.returncode}): {result.stderr[-2500:] or "no FFmpeg diagnostics"}')
    return sid, frames


def render_and_mux(name, tasks, narration, work, out, duration, source_paths):
    segments = work / f'footage-segments-{name}'; segments.mkdir(exist_ok=True)
    jobs = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        for i, task in enumerate(tasks):
            path = segments / f'{i:03}.mp4'
            jobs.append((path, pool.submit(render_segment, task, path, source_paths)))
        try:
            for completed, future in enumerate(concurrent.futures.as_completed([f for _,f in jobs]), 1):
                sid, frames = future.result()
                print(f'  {name}: {sid} ({completed}/{len(jobs)}, {frames} frames)', flush=True)
        except Exception:
            for _,future in jobs: future.cancel()
            raise
    listing = work / f'{name}-footage-concat.txt'
    listing.write_text(''.join("file '"+str(path.resolve()).replace("'","'\\''")+"'\n" for path,_ in jobs), encoding='utf-8')
    silent = work / f'{name}-footage-silent.mp4'
    rough.run([rough.FF,'-loglevel','error','-y','-f','concat','-safe','0','-i',listing,'-c','copy',silent])
    music = work / f'{name}-footage-score.wav'; rough.synth_score(music,duration)
    output = out / f'{name.upper()}_FOOTAGE_DRAF_PRIVAT.mp4'
    rough.run([rough.FF,'-loglevel','error','-y','-i',silent,'-i',narration,'-i',music,
               '-filter_complex','[1:a]volume=1.0[v];[2:a]volume=1.0[m];[v][m]amix=inputs=2:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.96[a]',
               '-map','0:v','-map','[a]','-c:v','copy','-c:a','aac','-b:a','160k','-ac','2',
               '-movflags','+faststart','-shortest',output])
    rough.run([rough.FF,'-loglevel','error','-y','-i',narration,'-c:a','libmp3lame','-b:a','160k',out/f'{name.upper()}_NARASI_DRAF_voice-05.mp3'])
    return output


def timeline_shots(tasks):
    result=[]
    for task in tasks:
        offset=round(task['scene']['start']*FPS)
        for shot in task['shots']:
            start=offset;offset+=shot['frames']
            result.append({'sceneId':task['scene']['id'], 'startFrame':start, 'endFrame':offset,
                           'start':start/FPS,'end':offset/FPS,'source':shot['source'],
                           'sourceInSeconds':shot.get('in'), 'asset':shot.get('asset'), 'diagram':shot.get('diagram'),
                           'onScreenDisclosure':shot['label']})
    return result


def write_credits(out, catalog, used_by_edition):
    lines = ['KREDIT FOOTAGE — DRAF PRIVAT', '',
             'Tidak ada sumber video di bawah yang merekam banjir Chicago pada April 1992.',
             'Visual kejadian berupa rekonstruksi AI/skema dan stok ilustratif; tanggal/lokasi sumber ditandai dalam video.',
             'Sumber audio asli tidak dipakai. Musik dibuat untuk draf ini. Hak, disclosure, dan publikasi belum direview.',
             '', 'Perubahan: '+catalog['edits'], '']
    for name in sorted(set().union(*used_by_edition.values())):
        item=catalog['sources'][name]
        editions=', '.join(k for k,v in used_by_edition.items() if name in v)
        lines += [f"{item['title']} — {item['author']} ({item['place_date']}); dipakai pada {editions}.",
                  f"{item['license']}: {item['license_url']}", f"Sumber: {item['source_url']}", '']
    (out/'KREDIT_FOOTAGE_DRAF.txt').write_text('\n'.join(lines),encoding='utf-8')


def main(argv=None):
    p=argparse.ArgumentParser(description='Build watermarked illustrative private footage drafts only.')
    p.add_argument('--private-rough',action='store_true')
    p.add_argument('--asset-dir',type=Path,required=True)
    p.add_argument('--voice-dir',type=Path,required=True)
    p.add_argument('--footage-dir',type=Path,required=True)
    p.add_argument('--manifest',type=Path,required=True)
    p.add_argument('--out',type=Path,required=True)
    p.add_argument('--only',choices=('master','short','both'),default='both')
    args=p.parse_args(argv)
    rough.validate_mode(args.private_rough,args.out)
    rough.mechanical_gates()
    manifest=json.loads(args.manifest.read_text(encoding='utf-8'))
    scripts,metadata=rough.validate_inputs(manifest,args.voice_dir,args.asset_dir)
    plans=read_plan(); catalog=read_catalog()
    used=validate_plan(scripts,plans,catalog,manifest['assets'])
    paths=check_source_files(catalog,args.footage_dir,used)
    args.out.mkdir(parents=True,exist_ok=True);work=args.out/'work';work.mkdir(exist_ok=True)
    names=('master','short') if args.only=='both' else (args.only,)
    summary={};used_by_edition={}
    for name in names:
        print(f'Building {name} private moving-footage draft...',flush=True)
        timeline,narration,duration=rough.make_timeline(name,scripts[name],manifest,args.voice_dir,work)
        w,h=(1280,720) if name=='master' else (720,1280)
        cues=rough.make_cues(timeline,w,h)
        rough.write_srt(cues,args.out/f'{name.upper()}_SUBTITLE_PERKIRAAN.srt')
        tasks=prepare_tasks(name,timeline,metadata[name],args.asset_dir,work,w,h,cues,plans,catalog)
        video=render_and_mux(name,tasks,narration,work,args.out,duration,paths)
        rough.make_cover(args.out/f'{name.upper()}_THUMBNAIL_DRAF.png',args.asset_dir/'01-basement.jpg',1080 if name=='short' else 1280,1920 if name=='short' else 720,vertical=name=='short')
        shotdata=timeline_shots(tasks)
        used_by_edition[name]={('water2011' if x['source']=='hybrid' else x['source']) for x in shotdata if x['source']!='still'}
        summary[name]={'durationAudio':duration,'frames':round(duration*FPS),'fps':FPS,'width':w,'height':h,
                       'video':video.name,'cutFrame':round(timeline[0]['end']*FPS),
                       'timing':'Sentence/cue/scene boundaries are estimates; no human playback or forced alignment.',
                       'scenes':timeline,'shots':shotdata,'cues':cues}
    rough.make_cover(args.out/'POSTER_4x5_DRAF.png',args.asset_dir/'01-basement.jpg',1080,1350,poster=True)
    (args.out/'TIMELINE_FOOTAGE_PERKIRAAN.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    write_credits(args.out,catalog,used_by_edition)
    print('PRIVATE ROUGH complete; human playback, facts/rights/disclosure, audience test and approval are NOT TESTED.',flush=True)


if __name__ == '__main__':
    try:
        main()
    except (ValueError,KeyError,FileNotFoundError,subprocess.CalledProcessError,RuntimeError) as exc:
        print(f'ERROR: {exc}',file=sys.stderr)
        raise SystemExit(1)
