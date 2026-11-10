"""Short gerbang: potongan klimax dari video final (C1 cue 9-24) -> vertikal 720x1280.

Menggunakan mesin art & alignment yang sama dengan renderer final:
- audio dipotong dari chunk ter-approve (bukan re-kam),
- subtitle sinkron per kalimat (windows dari sentence_windows),
- fase visual mengikuti kalimat (override km._PHS untuk window lokal).
End card navigasi ke episode penuh. Tanpa watermark (aset publik).
"""
import importlib.util
import math
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('km', HERE / 'render_private.py')
km = importlib.util.module_from_spec(spec)
sys.modules['km'] = km
spec.loader.exec_module(km)

W, H = 720, 1280
FPS, DRAW_FPS = 24, 12
CARD = 3.4  # detik end card


def cut_and_windows():
    cw, total = km.sentence_windows()
    c1 = cw[0]
    start = c1[9][0]            # 'Seorang karyawan membawa gagasan...'
    end = c1[24][1]             # 'Itu bukan debat. Itu ad hominem.'
    dur = end - start
    rel = [(a - start, b - start) for a, b in c1]
    vo = km.CONTENT / 'audio' / 'vo-c1-cold-open.mp3'
    return rel, dur, vo, start, end


def prep_audio(vo, start, end, work, dur):
    cut = work / 'short-vo.mp3'
    subprocess.run([km.rough.FF, '-y', '-loglevel', 'error', '-ss', f'{start:.3f}', '-t', f'{end - start:.3f}',
                    '-i', str(vo), '-c:a', 'libmp3lame', '-b:a', '160k', str(cut)], check=True)
    music = work / 'short-music.wav'
    km.rough.synth_score(music, dur + CARD)
    return cut, music


def build_sfx(rel, work, total_t):
    ev = [(rel[14][0] + .05, 'thud'), (rel[23][0] + .05, 'chime')]
    out = work / 'short-sfx.wav'
    km.synth_sfx(ev, total_t, out)
    return out


def compose_short(t, scenes, cues, rel, dur, endcard_start):
    raw = km.raw_frame(t, scenes)
    art = raw.crop((100, 0, 900, 800)).resize((720, 720), Image.Resampling.BILINEAR) if (Image := km.Image) else None
    bg = km.Image.new('RGB', (W, H), '#0c1f1d')
    bg.paste(art, (0, 0))
    d = km.ImageDraw.Draw(bg)
    km._motes(d, t)
    d.text((24, 736), 'ad hominem - ep. 1: logika toxic', font=km.fnt(17), fill='#9ab5ac')
    d.text((W - 24, 736), 'knot theory', font=km.pm(18), fill='#8fa8a0', anchor='ra')
    if t < endcard_start:
        cue = km.cue_at(cues, t)
        if cue:
            rows = None
            for px, lim in ((34, 2), (30, 2), (27, 3), (24, 3)):
                ft = km.fnt(px)
                rows = km.bag.wrap_width(d, cue, ft, 620)
                if len(rows) <= lim:
                    break
            lh = int(ft.size * 1.24)
            bh = len(rows) * lh + 30
            top = 830 + (300 - bh) // 2
            d.rounded_rectangle((50, top, W - 50, top + bh), 14, '#081614')
            d.rounded_rectangle((50, top, 56, top + bh), 3, km.GOLD)
            for i, r in enumerate(rows):
                d.text((W / 2, top + 15 + i * lh), r, font=ft, fill='#fffaf0', anchor='ma')
        d.rounded_rectangle((60, 1226, W - 60, 1234), 4, '#0c1f1d')
        done = min(1.0, t / dur)
        d.rounded_rectangle((60, 1226, 60 + int((W - 120) * done), 1234), 4, km.TEAL)
        d.text((W / 2, 1256), 'versi penuh 9 menit - tonton di channel ini', font=km.fnt(17), fill='#5f7d76', anchor='ma')
    else:
        k = (t - endcard_start) / CARD
        d.rectangle((0, 0, W, 720), fill='#0c1f1d')
        d.text((W / 2, 260 - int(14 * (1 - min(1.0, k * 2)))), 'CERITA PENUHNYA', font=km.pm(56), fill='#fffaf0', anchor='mm')
        if k > .22:
            d.text((W / 2, 360), '9 menit - bedah lengkap ad hominem', font=km.fnt(28), fill='#c9d6d0', anchor='mm')
        if k > .42:
            d.text((W / 2, 430), 'tonton di channel ini', font=km.fnt(27), fill=km.GOLD, anchor='mm')
        if k > .62:
            d.text((W / 2, 545), 'knot theory', font=km.pm(30), fill='#8fa8a0', anchor='mm')
        d.rounded_rectangle((60, 1226, W - 60, 1234), 4, '#0c1f1d')
        d.rounded_rectangle((60, 1226, W - 60, 1234), 4, km.TEAL)
    return bg


def encode(scenes, cues, rel, dur, vo, music, sfx, work, out):
    total_t = dur + CARD
    endcard_start = dur
    silent = work / 'short-silent.mp4'
    n = math.ceil(total_t * DRAW_FPS)
    cmd = [km.rough.FF, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
           '-s', f'{W}x{H}', '-r', str(DRAW_FPS), '-i', 'pipe:0', '-an', '-r', str(FPS),
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
           '-movflags', '+faststart', str(silent)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    try:
        for i in range(n):
            t = i / DRAW_FPS
            proc.stdin.write(compose_short(t, scenes, cues, rel, dur, endcard_start).tobytes())
            if i % 120 == 0:
                print(f'frame {i}/{n}', flush=True)
        proc.stdin.close()
        if proc.wait():
            raise RuntimeError('encode short gagal')
    except BaseException:
        try:
            proc.stdin.close()
        except Exception:
            pass
        proc.terminate(); proc.wait(); raise
    command = [km.rough.FF, '-y', '-loglevel', 'error', '-i', str(silent), '-i', str(vo), '-i', str(music), '-i', str(sfx),
               '-filter_complex', '[1:a]apad=whole_dur=%f[v];[2:a]volume=0.25[m];[3:a]volume=0.9[s];[v][m][s]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[a]' % (dur + CARD),
               '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
               '-movflags', '+faststart', str(out)]
    subprocess.run(command, check=True)


def main():
    work = HERE.parent.parent / 'deliverables' / 'kamu-short'
    work.mkdir(parents=True, exist_ok=True)
    rel, dur, vo, start_abs, end_abs = cut_and_windows()
    print(f'cut: {start_abs:.2f}-{end_abs:.2f} dari C1 ({dur:.2f}s)', flush=True)
    S3a, S3b = rel[9][0], rel[17][1]
    S4aa, S4ab = rel[18][0], rel[21][1]
    S4ba, S4bb = rel[22][0], rel[24][1]
    km._PHS['S3'] = [rel[15][0] - S3a, rel[16][0] - S3a]
    km._PHS['S4a'] = [rel[19][0] - S4aa, rel[21][0] - S4aa]
    km._PHS['S4b'] = [1.0]
    scenes = [((S3a, S3b), km.S3), ((S4aa, S4ab), km.S4a), ((S4ba, S4bb), km.S4b)]
    cues = [{'start': a, 'end': b, 'text': txt} for (a, b), txt in zip(rel[9:25], km.CUES['vo-c1-cold-open'][9:25])]
    vo_cut, music = prep_audio(vo, start_abs, end_abs, work, dur)
    total_t = dur + CARD
    sfx = build_sfx(rel, work, total_t)
    out = work / 'kamu-SHORT-gateway.mp4'
    encode(scenes, cues, rel, dur, vo_cut, music, sfx, work, out)
    print('SHORT COMPLETE', out, flush=True)


if __name__ == '__main__':
    main()
