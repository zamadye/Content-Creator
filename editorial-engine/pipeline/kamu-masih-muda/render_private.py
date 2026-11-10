#!/usr/bin/env python3
"""Kamu-Masih-Muda longform animatic — PRIVATE ROUGH ONLY.

Penerus pipeline tangga: memakai ulang rig karakter/room/box/font dari
render_private.py tangga-masih-licin dan utilitas bag/rough. Draf selalu
ber-watermark DRAF PRIVAT, hanya keluar di .scratch. Review manusia, fakta,
dan persetujuan rilis tetap gerbang terpisah; tidak ada jalur final di sini.
"""
from __future__ import annotations
import argparse, importlib.util, json, math, re, subprocess
from functools import lru_cache
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[3]
CONTENT = ROOT / 'editorial-engine/content/kamu-masih-muda'
TANGGA = ROOT / 'editorial-engine/pipeline/tangga-masih-licin/render_private.py'
spec = importlib.util.spec_from_file_location('tg_base', TANGGA)
tg = importlib.util.module_from_spec(spec); spec.loader.exec_module(tg)
bag, rough = tg.bag, tg.rough
box, actor, table = tg.box, tg.actor, tg.table
INK, CORAL, CREAM, TEAL, GOLD = tg.INK, tg.CORAL, tg.CREAM, tg.TEAL, tg.GOLD
FONT_DIR = ROOT / 'editorial-engine/assets/fonts'
PM = ImageFont.truetype(str(FONT_DIR / 'permanent-marker-latin-400-normal.ttf'), 34)
W, H = 1280, 720
ART = 720
FPS, DRAW_FPS = 24, 12
RAW_W, RAW_H = 1000, 800
_CHUNKS = ['vo-c1-cold-open', 'vo-c2-korban', 'vo-c3-dampak', 'vo-c3b-pemimpin',
           'vo-c4-peta-fallacy', 'vo-c5-lebih-tua', 'vo-c6-konter-6langkah',
           'vo-c7-twist', 'vo-c8-closing']
_GAP, _GAP_TWIST = 0.4, 1.6
_RELEASE = None  # renderer ini memang tidak memiliki jalur rilis.

@lru_cache(maxsize=None)
def fnt(px, bold=True): return tg.font(px, bold)

def pm(px): return PM if px >= 30 else ImageFont.truetype(str(FONT_DIR / 'permanent-marker-latin-400-normal.ttf'), int(px))

def chunk_durations():
    out = []
    for name in _CHUNKS:
        p = CONTENT / 'audio' / f'{name}.mp3'
        r = subprocess.run([rough.FF, '-i', str(p)], capture_output=True, text=True)
        m = re.search(r'Duration: (\d+):(\d+):([\d.]+)', r.stderr)
        if not m: raise RuntimeError('durasi tidak terbaca: ' + name)
        out.append(int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3)))
    return out

# ---------------- teks cue (subtitle) per chunk ----------------
CUES = {
 'vo-c1-cold-open': [
  "\"Kamu ini masih kecil.", "Sok-sok-an menasihati saya.", "Tau apa kamu tentang hidup?\"",
  "Kalimat ini mungkin terdengar familiar.", "Bukan di film — tapi di meja makan,",
  "di ruang rapat, di grup keluarga.",
  "Perhatikan: tidak ada satu pun yang membahas gagasannya.",
  "Yang dibahas: usiamu, harga dirimu, hakmu bicara.", "Contohnya sederhana.",
  "Seorang karyawan membawa gagasan peningkatan penjualan ke atasannya.",
  "Dengan tenang, hampir seperti konsultan, dia bilang:",
  "\"Pak, saya ingin memastikan kita sudah memperhitungkan satu hal:",
  "di poin ini, asumsinya kurang pas dengan kondisi lapangan.",
  "Menurut saya, lebih baik kita buka datanya bersama... sebelum mengambil keputusan.\"",
  "Yang dibalas bukan datanya.", "\"Kamu masih baru.", "Jangan... mengajari saya...",
  "yang sudah lama, dan lebih tahu soal lapangan.\"",
  "Perhatikan kontrasnya.", "Bahasa paling dewasa sudah dipakai —",
  "yang dibalas tetap bahasa kekuasaan.",
  "Gagasan tentang penjualan mati... tanpa satu pun angka yang dibahas.",
  "Pernah nggak kamu mengalami ini —", "kamu bawa gagasan, yang dibalas fisik, usia, atau masa lalumu?",
  "Itu bukan debat. Itu ad hominem.",
  "Hari ini kita bedah: kenapa orang menyerang pribadi, siapa korbannya, apa dampaknya —",
  "sampai satu twist di ujung, soal kedewasaan dan usia."],
 'vo-c2-korban': [
  "Kita bedah pelan-pelan.", "Setiap percakapan punya dua wilayah.",
  "Wilayah objektif: fakta, data, argumen — hal yang bisa dicek benar atau salah.",
  "Wilayah subjektif: orangnya — fisik, usia, latar belakang, niat, moral.",
  "Ad hominem adalah serangan yang memindahkan percakapan",
  "dari wilayah objektif... ke wilayah subjektif.",
  "Coba cek kasus tadi.", "Satu pun angka penjualan tidak dibantah.",
  "Satu pun usulan tidak dibahas.", "Yang dibalas: jabatan dan usia.",
  "Siapa korbannya? Tiga lapis.", "Pemilik gagasan — idenya mati padahal belum dibahas.",
  "Audiens — ruangan kehilangan kesempatan tahu, ide itu benar atau salah.",
  "Dan yang sering kelewat: hubungan itu sendiri.",
  "Karyawan jadi diam. Anak jadi takut bicara.",
  "Diskusi yang seharusnya menyelamatkan... mati lebih dulu."],
 'vo-c3-dampak': [
  "Dan dampaknya menjalar.", "Dimulai dari ragu-ragu: mungkin memang aku yang kurang.",
  "Lalu jadi diam.", "Lama-lama jadi yang paling berbahaya —",
  "belajar jadi tak berdaya: kalau bicara pun pasti diserang, mending tidak usah.",
  "Psikolog menyebutnya learned helplessness.",
  "Dan di skala besar, inilah cara sebuah keluarga, kantor, atau komunitas",
  "kehilangan peringatan dini:", "alarmnya bukan rusak...",
  "tapi yang punya alarm capek didengar."],
 'vo-c3b-pemimpin': [
  "Dan di sini ada pelajaran yang jarang disentuh.",
  "Kalau kamu seorang pemimpin — di negara, di perusahaan, atau cukup di rumah —",
  "kebiasaan menyerang pribadi itu mahal harganya.",
  "Sekali bicara, orang mencatat.", "Dua kali, mereka berhenti membawa kabar.",
  "Penasihat yang takut diserang akan memilih diam.",
  "Laporan yang tidak enak dibaca akan dibungkus manis.",
  "Dan pemimpin yang hanya dikelilingi orang yang setuju...",
  "akhirnya memutuskan sendirian, dengan informasi yang sudah dibersihkan.",
  "Banyak keputusan besar yang salah bukan karena pemimpinnya bodoh —",
  "tapi karena kritik yang paling dibutuhkan justru tidak pernah sampai.",
  "Jadi kalau kamu pemimpin, di skala apa pun:",
  "jangan sering jadi ad hominem.",
  "Setiap kali kamu menyerang orangnya,",
  "kamu mengajarkan semua orang... untuk membisukan diri."],
 'vo-c4-peta-fallacy': [
  "Ad hominem ternyata satu keluarga besar bernama logical fallacy:",
  "kesalahan berpikir yang terdengar seperti argumen.", "Kenalkan anggotanya.",
  "Abusive: langsung menyerang orangnya.", "Omongannya nggak jelas.",
  "Circumstantial: menyerang latar belakang.", "Ya iya dia bilang begitu, dia kan penjualnya.",
  "Tu quoque — kamu juga: nasihatmu dibuang karena kamu nggak laku sendiri.",
  "Padahal dokter yang jarang olahraga tetap bisa benar soal olahraga.",
  "Guilt by association: idemu ditolak karena kelompokmu.", "Dasar orang kelompok itu.",
  "Appeal to age dan authority: saya lebih tua, saya lebih berpengalaman, kamu siapa.",
  "Straw man: idemu dipelintir jadi versi paling bodoh, lalu versi itu yang diserang.",
  "Whataboutism: dibalas dengan pertanyaan balik — lho, sebelah lebih parah kok!",
  "Dan tone policing: isimu diabaikan karena caramu bicara dianggap kurang sopan.",
  "Delapan nama, satu akar:", "memindahkan pertarungan dari isi... ke orang."],
 'vo-c5-lebih-tua': [
  "Sekarang kasus kedua.", "Yang paling sering, dan paling halus:",
  "orang yang tidak pernah salah.", "Semua kesalahan punya alasan.",
  "Semua kritik disambut: kamu belum paham.",
  "Ini bukan soal usia melawan muda. Ini otoritas melawan bukti.",
  "Tapi mari jujur dan empati sebentar.",
  "Banyak orang yang begitu sebenarnya sedang menjaga sesuatu:",
  "status, wibawa, dan cerita panjang bahwa dirinya sudah paling dulu hidup.",
  "Mengakui salah, bagi sebagian orang, terasa seperti kehilangan.",
  "Makanya pelampiasannya pun yang murah: usia.", "Modal yang bisa dipakai tanpa latihan.",
  "Padahal risetnya menarik.", "Satu studi terkenal menemukan, untuk masalah orang lain,",
  "orang yang lebih tua memang rata-rata lebih bijak.",
  "Tapi studi lanjurannya, untuk masalah pribadi, usia hampir tidak berpengaruh.",
  "Yang menolong bukan tambahan umur —",
  "melainkan keberanian melihat masalah dari luar diri sendiri.",
  "Jadi ingat: usia bukan kebenaran. Pengalaman bukan bukti.",
  "Kedewasaan diukur dari satu hal: kemauan mengakui... saya bisa salah."],
 'vo-c6-konter-6langkah': [
  "Lalu gimana menghadapinya?", "Jawabannya relatif — tergantung konteks, dan apa yang kamu jaga.",
  "Tapi ada kerangkanya. Enam langkah.",
  "Satu, deteksi.", "Tanya cepat di kepala: ini serangan ke argumen, atau ke orang?",
  "Menamainya saja sudah menenangkan.", "Dua, regulasi. Napas. Jeda.",
  "Jangan balas api dengan api — sekali ikut menyerang pribadi, kamu pindah ke arenanya.",
  "Tiga, reframe: kembalikan ke isi.", "Hormati dulu, lalu kembalikan.",
  "Saya hormati pengalaman Bapak.", "Tapi pertanyaannya bukan siapa lebih tua...",
  "melainkan apakah data ini benar. Boleh kita cek sumbernya?",
  "Empat, klarifikasi: minta spesifik, bukan menyerang balik.",
  "Itu soal pengalaman saya.", "Bagian argumen saya yang mana yang keliru?",
  "Lima, batas. Nyatakan apa yang boleh dan tidak.", "Saya hormat.",
  "Tapi hormat bukan alasan menolak fakta.", "Kalau kita mau lanjut, kita bahas isinya.",
  "Dan enam, pilih: lanjut atau stop.", "Kalau keadaannya abusive —",
  "ada ancaman, kekerasan, atau manipulasi berulang —",
  "jangan fokus menang debat. Fokus ke keselamatan.",
  "Konter terbaik... kadang adalah berhenti dan pergi."],
 'vo-c7-twist': [
  "Tapi sekarang bagian yang susah.",
  "Ad hominem sering lahir dari rasa terancam... bukan dari kebodohan.",
  "Saat ego tersentuh, otak kita juga punya senjata yang sama.",
  "Kamu buka kolom komentar, tergoda menulis:", "lho, kamu kan yang dulu gagal.",
  "Jempol berhenti... dan kamu sadar:", "itu bukan jawaban. Itu pelarian.",
  "Jadi antidotnya bukan menang debat.",
  "Melainkan intellectual humility: keberanian bilang, saya mungkin keliru.",
  "Validasi dulu yang bisa divalidasi.",
  "Dan kemampuan memisahkan harga diri dari argumen —",
  "karena kamu bukan idemu.", "Idemu boleh salah... kamu tetap utuh."],
 'vo-c8-closing': [
  "Tiga hal yang mau saya tinggalkan.",
  "Satu: pisahkan orang dari gagasannya — termasuk gagasanmu sendiri.",
  "Dua: usia bukan bukti. Pengalaman bukan otomatis kebenaran.",
  "Tiga: konter terbaik bukan mempermalukan lawan...",
  "melainkan batas yang jelas, dan isi yang tetap dibicarakan.",
  "Sekarang giliran kamu.",
  "Pernah kena ad hominem soal apa — usia, fisik, masa lalu, atau kelompokmu?",
  "Tulis di komentar; contoh terbaik akan kita bedah di episode berikutnya.",
  "Dan kalau kamu pernah sadar pernah melakukannya...",
  "itu tanda kamu mulai jadi dewasa, bukan tanda kamu jahat.",
  "Oh iya — kalau konten ini bermanfaat, like dan share ke teman kamu.",
  "Siapa tau dia sedang butuh dilindungi dari serangan begini.",
  "Sampai jumpa."],
}

_CUEW, _PHS, _TOTAL, _PH = None, {}, 0.0, []

def _P(i):
    return _PH[i] if i < len(_PH) else 1e9

def _speech_intervals(path, total):
    r = subprocess.run([rough.FF, '-i', str(path), '-af', 'silencedetect=noise=-36dB:d=0.20',
                        '-f', 'null', '-'], capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]
    ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    ivs = []; cur = 0.0
    for i, st in enumerate(starts):
        e = ends[i] if i < len(ends) else total
        if st - cur > 0.30: ivs.append((cur, st))
        cur = e
    if total - cur > 0.30: ivs.append((cur, total))
    return ivs or [(0.0, total)]

def _align_cues(texts, ivs, total):
    """DP: setiap kalimat mendapat 1..k segmen bicara berurutan; biaya =
    deviasi durasi grup dari ekspektasi proporsi karakter. Jendela kalimat
    mencakup jeda di dalam kalimatnya."""
    n, k = len(texts), len(ivs)
    if k == n: return list(ivs)
    if k < n:
        ws = [max(6, len(c)) for c in texts]; tot = sum(ws)
        idx = []; acc = 0.0
        for w in ws:
            idx.append(min(k - 1, int(acc / tot * k + 1e-9))); acc += w
        idx[-1] = k - 1
        for j in range(1, n): idx[j] = max(idx[j], idx[j - 1])
        from collections import defaultdict
        d = defaultdict(list)
        for j, i2 in enumerate(idx): d[i2].append(j)
        out = [None] * n
        for i2 in range(k):
            js = d[i2]
            if not js: continue
            a0, b0 = ivs[i2]; wsj = [ws[j] for j in js]; ssum = sum(wsj); cur = a0
            for j in js:
                seg = (b0 - a0) * ws[j] / ssum
                out[j] = (cur, cur + seg); cur += seg
        for j in range(n):
            if out[j] is None: out[j] = (max(0.0, total - .5), total)
        return out
    ws = [max(6, len(c)) for c in texts]; tot = sum(ws)
    exp = [total * w / tot for w in ws]
    INF = 1e18
    ends = [b for _, b in ivs]; t0 = ivs[0][0]
    f = [[INF] * k for _ in range(n)]; bk = [[-1] * k for _ in range(n)]
    for j in range(k):
        f[0][j] = abs((ends[j] - t0) - exp[0])
    for i in range(1, n):
        for j in range(i, k - (n - 1 - i)):
            best, arg = INF, -1
            for j2 in range(i - 1, j):
                c = f[i - 1][j2] + abs((ends[j] - ends[j2]) - exp[i])
                if c < best: best, arg = c, j2
            f[i][j] = best; bk[i][j] = arg
    bounds = [0] * n; j = k - 1
    for i in range(n - 1, -1, -1):
        bounds[i] = j
        j = bk[i][j] if i > 0 else -1
    out = []; prev_end = t0
    for i in range(n):
        out.append((prev_end, ends[bounds[i]])); prev_end = ends[bounds[i]]
    return out

def sentence_windows():
    global _CUEW, _TOTAL
    durs = chunk_durations(); cw = []; off = 0.0
    for i, name in enumerate(_CHUNKS):
        ivs = _speech_intervals(CONTENT / 'audio' / f'{name}.mp3', durs[i])
        mapped = _align_cues(CUES[name], ivs, durs[i])
        cw.append([(off + a, off + min(durs[i], b)) for a, b in mapped])
        off += durs[i] + (_GAP_TWIST if i == 6 else _GAP)
    _CUEW = cw; _TOTAL = off - _GAP
    return cw, _TOTAL

def build_cues(_ignored=None):
    flat = []
    for i, name in enumerate(_CHUNKS):
        for (a, b), txt in zip(_CUEW[i], CUES[name]):
            flat.append({'start': a, 'end': b, 'text': txt})
    return flat

def cue_at(cues, t):
    for c in cues:
        if c['start'] <= t < c['end']: return c['text']
    return ''

# ---------------- primitif gambar (raw 1000x800) ----------------
def card(d, x, y, w, h, label='', ring=None, tilt=0):
    im = Image.new('RGBA', (int(w) + 40, int(h) + 40), (0, 0, 0, 0)); dd = ImageDraw.Draw(im)
    col = '#fffaf0'
    if ring == 'green':
        dd.rounded_rectangle((6, 6, w + 34, h + 34), 12, fill=(188, 214, 208, 255))
    dd.rounded_rectangle((14, 14, w + 26, h + 26), 12, fill=col, outline=INK, width=4)
    for i in range(3):
        dd.line((34, 44 + i * 22, w - 2, 44 + i * 22), fill='#c9bda6', width=5)
    if label:
        ft = pm(min(30, int(w / max(6, len(label)) * 2.1)))
        dd.text(((w + 40) / 2, (h + 40) / 2), label, font=ft, fill=INK, anchor='mm')
    im = im.rotate(tilt, expand=True, resample=Image.BICUBIC)
    d._image = im  # diperlukan pemanggil via paste_card
    return (x - im.width // 2, y - im.height // 2)

def paste_card(base, d, x, y, w, h, label='', ring=None, tilt=0):
    pos = card(d, x, y, w, h, label, ring, tilt)
    base.paste(d._image, (int(pos[0]), int(pos[1])), d._image)

def stamp(d, x, y, text, color=CORAL, s=1.0, ang=-8):
    ft = pm(int(30 * s)); wtxt = int(ft.getlength(text)) + 30
    im = Image.new('RGBA', (wtxt + 40, 74), (0, 0, 0, 0)); dd = ImageDraw.Draw(im)
    dd.rounded_rectangle((6, 6, wtxt + 34, 66), 10, outline=color, width=6)
    dd.text((im.width / 2, 36), text, font=ft, fill=color, anchor='mm')
    im = im.rotate(ang, expand=True, resample=Image.BICUBIC)
    d._stamp = im; return (x - im.width // 2, y - im.height // 2)

def paste_stamp(base, x, y, text, color=CORAL, s=1.0, ang=-8, alpha=None):
    im = Image.new('RGBA', (10, 10)); d = ImageDraw.Draw(im)
    pos = stamp(d, 0, 0, text, color, s, ang); im2 = d._stamp
    if alpha is not None: im2 = im2.copy(); im2.putalpha(im2.getchannel('A').point(lambda a: int(a * alpha)))
    base.paste(im2, (int(x - im2.width / 2), int(y - im2.height / 2)), im2)

def head(d, x, y, s=1.0, skin='#e8b58f', hair='#3a3a3a', talk=0):
    d.ellipse((x - 26 * s, y - 26 * s, x + 26 * s, y + 26 * s), fill=skin, outline=INK, width=3)
    d.pieslice((x - 26 * s, y - 30 * s, x + 26 * s, y + 2 * s), 180, 360, fill=hair)
    o = 4 * talk
    d.ellipse((x - 5 * s, y + (6 + o) * s, x + 5 * s, y + (10 + o) * s), fill=INK)
    for ex in (-9, 9): d.ellipse((x + (ex - 2) * s, y - 8 * s, x + (ex + 2) * s, y - 4 * s), fill=INK)

def bubble(d, x, y, w, h, text, ft=None, fill='#fffaf0'):
    ft = ft or fnt(22)
    d.rounded_rectangle((x, y, x + w, y + h), 14, fill=fill, outline=INK, width=3)
    d.polygon([(x + 24, y + h), (x + 44, y + h), (x + 30, y + h + 16)], fill=fill, outline=INK)
    rows = bag.wrap_width(d, text, ft, w - 28)
    for i, r in enumerate(rows[:3]): d.text((x + 16, y + 12 + i * 28), r, font=ft, fill=INK)

def arrow_hook(d, x0, y0, x1, y1, color=CORAL, wdt=10):
    mx = (x0 + x1) / 2 + (y1 - y0) * .35
    d.line([(x0, y0), (mx, (y0 + y1) / 2), (x1, y1)], fill=color, width=wdt, joint='curve')
    ang = math.atan2(y1 - (y0 + y1) / 2, x1 - mx)
    for da in (2.6, -2.6):
        d.line([(x1, y1), (x1 - 26 * math.cos(ang + da), y1 - 26 * math.sin(ang + da))], fill=color, width=wdt)

def salt(d, x, y, s=1.0):
    d.rounded_rectangle((x - 16 * s, y - 46 * s, x + 16 * s, y + 6 * s), 8, fill='#fffaf0', outline=INK, width=4)
    d.rounded_rectangle((x - 10 * s, y - 60 * s, x + 10 * s, y - 44 * s), 5, fill='#c9bda6', outline=INK, width=3)
    for i in range(6):
        d.ellipse((x - 8 * s + i * 3.4 * s, y - 20 * s, x - 4 * s + i * 3.4 * s, y - 16 * s), fill='#c9bda6')

def bell(d, x, y, s=1.0, closed=False):
    d.arc((x - 30 * s, y - 46 * s, x + 30 * s, y + 14 * s), 180, 360, fill=GOLD, width=int(10 * s))
    d.line((x - 34 * s, y - 2 * s, x + 34 * s, y - 2 * s), fill=INK, width=int(6 * s))
    d.ellipse((x - 6 * s, y - 2 * s, x + 6 * s, y + 10 * s), fill=GOLD, outline=INK, width=3)
    if closed:
        d.line((x - 40 * s, y - 54 * s, x + 40 * s, y + 16 * s), fill=CORAL, width=int(9 * s))

def door(d, x, y, s=1.0, glow=False):
    col = GOLD if glow else '#8a7a66'
    d.rounded_rectangle((x - 34 * s, y - 96 * s, x + 34 * s, y + 8 * s), 10, fill=col, outline=INK, width=4)
    d.ellipse((x + 16 * s, y - 46 * s, x + 26 * s, y - 36 * s), fill=INK)
    if glow:
        for i in range(3): d.arc((x - (46 + i * 10) * s, y - (108 + i * 10) * s, x + (46 + i * 10) * s, y + (18 + i * 10) * s), 300, 60, fill=GOLD, width=4)

def mirror(d, x, y, s=1.0):
    d.ellipse((x - 62 * s, y - 90 * s, x + 62 * s, y + 34 * s), fill='#c3d9d2', outline=INK, width=6)
    d.line((x, y + 34 * s, x, y + 92 * s), fill=INK, width=int(10 * s))
    d.line((x - 40 * s, y - 60 * s, x + 30 * s, y - 6 * s), fill='#fffaf0', width=6)

def mic(d, x, y, s=1.0, muted=False):
    d.rounded_rectangle((x - 14 * s, y - 44 * s, x + 14 * s, y + 4 * s), 14, fill='#8a94a0', outline=INK, width=4)
    d.arc((x - 24 * s, y - 26 * s, x + 24 * s, y + 18 * s), 0, 180, fill=INK, width=4)
    d.line((x, y + 18 * s, x, y + 40 * s), fill=INK, width=5)
    d.line((x - 18 * s, y + 40 * s, x + 18 * s, y + 40 * s), fill=INK, width=5)
    if muted:
        d.line((x - 30 * s, y - 52 * s, x + 30 * s, y + 8 * s), fill=CORAL, width=8)

def scarecrow_card(d, x, y, s=1.0):
    d.line((x, y - 70 * s, x, y + 60 * s), fill='#795640', width=int(10 * s))
    d.line((x - 46 * s, y - 30 * s, x + 46 * s, y - 30 * s), fill='#795640', width=int(8 * s))
    d.rounded_rectangle((x - 34 * s, y - 64 * s, x + 34 * s, y + 4 * s), 10, fill='#e4d3ae', outline=INK, width=4)
    for i in range(3): d.line((x - 22 * s, y - 46 * s + i * 18 * s, x + 22 * s, y - 46 * s + i * 18 * s), fill='#b9a97f', width=4)
    d.polygon([(x - 40 * s, y - 64 * s), (x + 40 * s, y - 64 * s), (x, y - 96 * s)], fill=CORAL)

def ktp_trophy(d, x, y, s=1.0):
    d.rounded_rectangle((x - 70 * s, y - 40 * s, x + 6 * s, y + 34 * s), 8, fill='#d9e4de', outline=INK, width=4)
    head(d, x - 48 * s, y - 12 * s, s * .55)
    d.line((x - 30 * s, y + 4 * s, x - 14 * s, y + 4 * s), fill=INK, width=3)
    d.line((x - 30 * s, y + 16 * s, x - 14 * s, y + 16 * s), fill=INK, width=3)
    d.arc((x + 22 * s, y - 66 * s, x + 66 * s, y - 22 * s), 180, 360, fill=GOLD, width=8)
    d.line((x + 44 * s, y - 22 * s, x + 44 * s, y - 6 * s), fill=GOLD, width=8)
    d.line((x + 32 * s, y - 6 * s, x + 56 * s, y - 6 * s), fill=GOLD, width=8)

def fence(d, x, y, s=1.0):
    for i in range(5):
        d.rounded_rectangle((x + i * 26 * s, y - 40 * s, x + (i * 26 + 12) * s, y + 10 * s), 5, fill='#c9ae8f', outline=INK, width=3)
    d.line((x - 6 * s, y - 26 * s, x + 112 * s, y - 26 * s), fill='#9d6e51', width=int(7 * s))
    d.line((x - 6 * s, y - 6 * s, x + 112 * s, y - 6 * s), fill='#9d6e51', width=int(7 * s))

def shield(d, x, y, s=1.0, labels=('STATUS', 'WIBAWA')):
    d.polygon([(x, y - 56 * s), (x + 52 * s, y - 34 * s), (x, y + 56 * s), (x - 52 * s, y - 34 * s)], fill='#849a7c', outline=INK, width=5)
    ft = fnt(int(15 * s))
    for i, lb in enumerate(labels): d.text((x, y - 14 * s + i * 26 * s), lb, font=ft, fill=CREAM, anchor='mm')

def tag(d, x, y, text, s=1.0):
    ft = fnt(int(17 * s)); w = ft.getlength(text) + 26
    d.rounded_rectangle((x, y, x + w, y + 30 * s), 15 * s, fill='#e4d3ae', outline=INK, width=3)
    d.text((x + 13, y + 13 * s), text, font=ft, fill=INK)

def screen_text_chip(d, x, y, text, color=TEAL):
    ft = fnt(24); w = ft.getlength(text) + 34
    d.rounded_rectangle((x, y, x + w, y + 46), 10, fill=color, outline=INK, width=4)
    d.text((x + 17, y + 10), text, font=ft, fill=INK)

def fake_comment(d, x, y, name, text, ft=None):
    ft = ft or fnt(19)
    d.rounded_rectangle((x, y, x + 470, y + 74), 12, fill='#fffaf0', outline=INK, width=3)
    d.ellipse((x + 10, y + 12, x + 42, y + 44), fill='#bcd6d0', outline=INK, width=2)
    d.text((x + 54, y + 8), name, font=fnt(16), fill='#56655f')
    rows = bag.wrap_width(d, text, ft, 396)[:2]
    for i, r in enumerate(rows): d.text((x + 54, y + 26 + i * 20), r, font=ft, fill=INK)

# ---------------- 30 scene (raw 1000x800) ----------------
def S1(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#d7e1d7')
    table(d)
    rise = min(1, ts / 2.5)
    d.line([(320, 500)] + [(320 + i * 70, 500 - i * 55 * rise) for i in range(1, 5)], fill=TEAL, width=8)
    paste_card(d._base, d, 560, 550, 200, 105, 'IDE PENJUALAN', tilt=-3)
    box(d, (250, 485, 300, 575), 5, '#8a7a66', INK, 3); d.text((258, 492), 'data', font=fnt(15), fill=INK)
    actor(d, 'bima', 170, 720, .92, ts * 1.2, 'neutral', target=(560, 560))
    actor(d, 'owner', 830, 720, .95, ts * 1.1, 'neutral')
    for i, (q, th) in enumerate((('"Kamu ini masih kecil."', .2),
                                 ('"Sok-sok-an menasihati saya."', .9),
                                 ('"Tau apa kamu tentang hidup?"', 1.6))):
        if ts > th: d.text((500, 140 + i * 64), q, font=pm(34), fill=INK if i < 2 else CORAL, anchor='mm')
    d.text((500, 360), 'detik pertama: yang diserang BUKAN gagasannya', font=fnt(22), fill='#56655f', anchor='mm')

def S2(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    d.text((500, 84), '"kalimat ini terdengar familiar..."', font=pm(30), fill=INK, anchor='mm')
    for i, (lb, th) in enumerate((('MEJA MAKAN', .8), ('RUANG RAPAT', 2.6), ('GRUP KELUARGA', 4.4))):
        if ts < th: continue
        x = 235 + i * 265
        d.rounded_rectangle((x - 130, 170, x + 130, 400), 16, fill='#fffaf0', outline=INK, width=5)
        d.text((x, 368), lb, font=fnt(20), fill='#56655f', anchor='mm')
        if i == 0:
            d.ellipse((x - 62, 230, x + 62, 320), fill='#e4d3ae', outline=INK, width=4)
            d.ellipse((x - 40, 248, x + 40, 302), fill='#cfc8b8', outline=INK, width=3)
            d.line((x + 40, 222, x + 74, 290), fill=INK, width=6)
        elif i == 1:
            d.rounded_rectangle((x - 90, 260, x + 90, 315), 10, fill='#8a7a66', outline=INK, width=4)
            d.line((x - 60, 215, x - 60, 260), fill=INK, width=5); d.line((x + 60, 215, x + 60, 260), fill=INK, width=5)
            d.ellipse((x - 72, 200, x - 48, 224), fill='#bcd6d0', outline=INK, width=3)
            d.ellipse((x + 48, 200, x + 72, 224), fill='#bcd6d0', outline=INK, width=3)
        else:
            for j in range(3):
                px = x - 70 + j * 70
                d.rounded_rectangle((px, 220 + (j % 2) * 16, px + 48, 306 + (j % 2) * 16), 8, fill='#193333', outline=INK, width=3)
                d.text((px + 24, 262 + (j % 2) * 16), '...', font=fnt(20), fill=CREAM, anchor='mm')
    d.rounded_rectangle((150, 470, 850, 590), 14, fill='#193333', outline=INK, width=5)
    d.text((500, 510), 'Perhatikan: tidak ada satu pun yang membahas gagasannya.', font=fnt(23), fill=CREAM, anchor='mm')
    d.text((500, 556), 'Yang dibahas: usia, harga diri, hak bicara.', font=fnt(22), fill=GOLD, anchor='mm')

def S3(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#d7e1d7')
    table(d)
    atk = ts > _P(0)
    rise = min(1, ts / 2.5)
    d.line([(320, 500)] + [(320 + i * 70, 500 - i * 55 * rise) for i in range(1, 5)], fill=TEAL, width=8)
    paste_card(d._base, d, 560, 550, 200, 105, 'IDE PENJUALAN', tilt=3)
    actor(d, 'bima', 170, 720, .92, ts * .9, 'worried' if atk else 'neutral', target=(560, 560))
    actor(d, 'owner', 830, 720, .95, ts * .8, 'neutral', target=(560, 560))
    if not atk:
        bubble(d, 240, 300, 400, 74, '"Pak, mari buka datanya bersama."', fnt(22))
        d.text((500, 140), 'dia bicara tenang — isi ke isi', font=fnt(24), fill='#56655f', anchor='mm')
    else:
        paste_stamp(d._base, 500, 235, 'MASIH BARU', CORAL, 1.3, -6 + math.sin(ts * 8) * 1.5)
        if ts > _P(1): bubble(d, 330, 330, 400, 74, '"Jangan mengajari saya."', fnt(22))
        d.text((500, 140), 'yang dibahas bukan gagasannya', font=fnt(24), fill=CORAL, anchor='mm')

def S4a(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#26312e')
    d.text((500, 110), 'Perhatikan kontrasnya', font=pm(30), fill=CREAM, anchor='mm')
    d.text((500, 190), 'bahasa paling dewasa sudah dipakai —', font=fnt(26), fill='#c3d9d2', anchor='mm')
    d.text((500, 232), 'yang dibalas tetap bahasa kekuasaan', font=fnt(26), fill=CORAL, anchor='mm')
    if ts > _P(0):
        d.rounded_rectangle((120, 300, 880, 450), 14, fill='#193333', outline=GOLD, width=5)
        d.text((500, 342), 'YANG DIMINTA: BUKA DATA', font=pm(24), fill=CREAM, anchor='mm')
        d.text((500, 402), 'YANG DITERIMA: CERAMAH USIA KERJA', font=pm(24), fill=CORAL, anchor='mm')
    if ts > _P(1):
        d.rounded_rectangle((350, 500, 650, 610), 10, fill='#cfc8b8', outline='#9a917f', width=4)
        d.text((500, 555), 'IDE PENJUALAN', font=fnt(22), fill='#9a917f', anchor='mm')
        d.line([(360, 510), (640, 600)], fill=CORAL, width=9)
        d.line([(640, 510), (360, 600)], fill=CORAL, width=9)
        d.text((500, 660), 'mati tanpa satu pun angka dibahas', font=fnt(23), fill='#9ab5ac', anchor='mm')

def S4b(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    if ts < _P(1):
        d.text((500, 150), 'Pernah nggak kamu mengalami ini?', font=fnt(30), fill=INK, anchor='mm')
        fake_comment(d, 220, 230, 'kamu (mengingat)', 'aku bawa data, dibalas ngejudge...')
        if ts > _P(0):
            d.text((500, 470), 'ITU BUKAN DEBAT. ITU AD HOMINEM.', font=pm(32), fill=CORAL, anchor='mm')
    else:
        d.text((500, 120), 'hari ini kita bedah:', font=fnt(26), fill='#56655f', anchor='mm')
        items = ['MENGAPA', 'KORBAN', 'DAMPAK', 'KONTER']
        for i, it in enumerate(items):
            x = 120 + (i % 2) * 400; y = 180 + (i // 2) * 210
            on = ts > _P(1) + .5 + i * .7
            d.rounded_rectangle((x, y, x + 330, y + 150), 16, fill='#fffaf0' if on else '#d9d2c2', outline=INK, width=5)
            d.text((x + 165, y + 75), it, font=fnt(32), fill=INK if on else '#9a917f', anchor='mm')
        if ts > _P(2):
            d.text((500, 690), '+ satu twist di ujung: kedewasaan vs usia', font=fnt(24), fill=CORAL, anchor='mm')

def S5(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    tg.actor(d, 'nara', 500, 700, 1.15, ts * .9, 'worried')
    labels = ['FISIK', 'USIA', 'LATAR', 'NIAT', 'PENGALAMAN', 'MORAL']
    for i, lb in enumerate(labels):
        ang = ts * .7 + i * math.pi / 3
        x = 500 + math.cos(ang) * 300; y = 330 + math.sin(ang) * 210
        hot = int(ts * 1.6) % 6 == i
        d.ellipse((x - 74, y - 30, x + 74, y + 30), fill=CORAL if hot else '#d9d2c2', outline=INK, width=4)
        d.text((x, y), lb, font=fnt(22), fill=CREAM if hot else INK, anchor='mm')
    for i, lb in enumerate(['premis', 'bukti', 'logika']):
        paste_card(d._base, d, 150, 260 + i * 120, 150, 70, lb, ring='green')

def S6(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    d.rounded_rectangle((90, 200, 480, 560), 18, fill='#bcd6d0', outline=INK, width=6)
    d.text((285, 250), 'OBJEKTIF', font=fnt(34), fill=INK, anchor='mm')
    for i, lb in enumerate(['fakta', 'data', 'argumen']):
        paste_card(d._base, d, 285, 330 + i * 72, 210, 56, lb, ring='green')
    d.rounded_rectangle((520, 200, 910, 560), 18, fill='#4a5a57', outline=INK, width=6)
    d.text((715, 250), 'SUBJEKTIF', font=fnt(34), fill=CREAM, anchor='mm')
    for i, lb in enumerate(['fisik', 'usia', 'latar', 'niat', 'moral']):
        x = 585 + (i % 2) * 170; y = 330 + (i // 2) * 78
        hot = int(ts * 1.4) % 5 == i
        d.rounded_rectangle((x, y, x + 150, y + 54), 12, fill=CORAL if hot else '#5c6d69', outline=INK, width=3)
        d.text((x + 75, y + 27), lb, font=fnt(20), fill=CREAM, anchor='mm')
    arrow_hook(d, 462, 380, 540, 380)
    d.text((500, 330), 'serangan', font=fnt(20), fill=CORAL, anchor='mm')
    d.text((500, 640), 'percakapan dipindah dari isi... ke orangnya', font=fnt(24), fill=INK, anchor='mm')

def S7(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    panels = [(130, 'kartu robek'), (390, 'audiens'), (650, 'hubungan')]
    act = min(2, int(ts / 2.2))
    for i, (x, _) in enumerate(panels):
        on = i <= act
        d.rounded_rectangle((x, 190, x + 240, 560), 18, fill='#fffaf0' if on else '#d9d2c2', outline=INK, width=5)
    paste_card(d._base, d, 210, 300, 150, 90, 'IDE', tilt=-6)
    d.line((150, 260, 270, 360), fill=CORAL, width=9); d.line((270, 260, 150, 360), fill=CORAL, width=9)
    for i in range(3): head(d, 450 + i * 70, 330, 1.1, talk=int(ts * 3) % 3 == i)
    d.line((410, 250, 410, 520), fill='#c9bda6', width=4)
    for i, dx in enumerate((-40, 40)):
        xx = 810 + dx * min(1, ts / 4)
        d.rounded_rectangle((xx - 34, 380, xx + 34, 470), 10, fill='#c9ae8f', outline=INK, width=4)
        d.rounded_rectangle((xx - 44, 470, xx + 44, 490), 8, fill='#795640', outline=INK, width=3)
    d.text((250, 600), 'pemilik argumen', font=fnt(24), fill=INK, anchor='mm')
    d.text((510, 600), 'audiens', font=fnt(24), fill=INK, anchor='mm')
    d.text((770, 600), 'hubungan', font=fnt(24), fill=INK, anchor='mm')

def S8(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#dfe4e0')
    if ts < _P(1):
        for i, (lb, th) in enumerate((('1 · ragu: "mungkin memang aku"', .3), ('2 · diam', 1.9), ('3 · tak berdaya', 3.4))):
            if ts < th: continue
            x = 130 + i * 280
            d.rounded_rectangle((x, 300 - i * 40, x + 250, 400 - i * 40), 12, fill='#fffaf0', outline=INK, width=5)
            d.text((x + 125, 350 - i * 40), lb, font=fnt(21), fill=INK, anchor='mm')
        d.text((500, 150), 'dampaknya menjalar pelan-pelan', font=fnt(26), fill='#56655f', anchor='mm')
    elif ts < _P(2):
        tg.actor(d, 'nara', 500, 690, 1.05, ts * .6, 'sad')
        d.arc((330, 380, 670, 620), 200, 340, fill=CORAL, width=8)
        d.rounded_rectangle((380, 330, 620, 392), 10, fill='#fffaf0', outline=CORAL, width=4)
        d.text((500, 361), 'learned helplessness', font=fnt(22), fill=CORAL, anchor='mm')
        d.text((500, 150), 'bicara = diserang, menurutnya — jadi ya sudah', font=fnt(23), fill='#56655f', anchor='mm')
    else:
        bell(d, 500, 330, 1.6, closed=True)
        d.text((500, 520), 'alarmnya bukan rusak...', font=fnt(28), fill=INK, anchor='mm')
        d.text((500, 570), 'yang punya alarm capek didengar', font=pm(28), fill=CORAL, anchor='mm')

def S9edu(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#26312e')
    d.text((500, 100), 'kalau kamu seorang PEMIMPIN', font=fnt(30), fill=CREAM, anchor='mm')
    for i, (x, lb) in enumerate(((230, 'NEGARA'), (500, 'PERUSAHAAN'), (770, 'RUMAH'))):
        if ts < _P(0) + i * .8: continue
        d.rounded_rectangle((x - 105, 170, x + 105, 400), 16, fill='#31403c', outline=INK, width=5)
        d.text((x, 368), lb, font=fnt(24), fill=CREAM, anchor='mm')
        if lb == 'NEGARA':
            d.polygon([(x - 60, 300), (x + 60, 300), (x, 220)], fill=GOLD); d.rectangle((x - 40, 300, x + 40, 335), fill=GOLD)
        elif lb == 'PERUSAHAAN':
            d.rectangle((x - 55, 220, x + 55, 335), fill='#8a94a0')
            for r_ in range(3):
                for c in range(3): d.rectangle((x - 40 + c * 30, 232 + r_ * 34, x - 22 + c * 30, 250 + r_ * 34), fill='#c3d9d2')
        else:
            d.polygon([(x - 55, 270), (x, 222), (x + 55, 270)], fill=CORAL); d.rectangle((x - 42, 270, x + 42, 335), fill='#e4d3ae')
    if ts > _P(1):
        bubble(d, 130, 420, 210, 60, '"..."', fnt(26)); d.text((235, 505), 'penasihat membisukan diri', font=fnt(17), fill='#9ab5ac', anchor='mm')
    if ts > _P(2):
        d.rounded_rectangle((620, 425, 880, 480), 10, fill='#31403c', outline=INK, width=4)
        d.text((750, 452), 'laporan dibungkus manis', font=fnt(18), fill=CREAM, anchor='mm')
    if ts > _P(4):
        paste_stamp(d._base, 500, 625, 'KRITIK MATI', CORAL, 1.0, -5)

def S8d(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#26312e')
    d.text((500, 110), 'ad hominem = satu keluarga besar', font=fnt(28), fill=CREAM, anchor='mm')
    d.text((500, 155), 'logical fallacy — kesalahan berpikir yang terdengar seperti argumen', font=fnt(20), fill='#9ab5ac', anchor='mm')
    names = ['abusive', 'circum.', 'tu quoque', 'assoc.', 'age/auth.', 'straw man', 'whatabout.', 'tone polic.']
    for i, nm in enumerate(names):
        ang = i * math.pi / 4 - math.pi / 2
        ap = max(0.0, min(1.0, (ts - .3 - i * .18)))
        if ap <= 0: continue
        x = 500 + math.cos(ang) * 330; y = 440 + math.sin(ang) * 195
        d.ellipse((x - 16 * ap, y - 16 * ap, x + 16 * ap, y + 16 * ap), fill=CORAL, outline=INK, width=3)
        d.text((x, y + 34), nm, font=fnt(17), fill=CREAM, anchor='mm')
    r = 46 + math.sin(ts * 2) * 4
    d.ellipse((500 - r, 440 - r, 500 + r, 440 + r), fill=TEAL, outline=CREAM, width=5)
    d.text((500, 440), 'fallacy', font=fnt(20), fill=INK, anchor='mm')
def fallacy_slide(d, t, ts, num, name, example):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    paste_card(d._base, d, 500, 430, 260, 150, 'ARGUMEN', tilt=math.sin(ts * 2) * 4)
    d.text((130, 110), f'{num}/8', font=fnt(26), fill='#56655f')
    paste_stamp(d._base, 500, 170, name, CORAL, 1.25, -4)
    d.text((500, 640), example, font=fnt(26), fill=INK, anchor='mm')

def S9(d, t, ts):
    fallacy_slide(d, t, ts, 1, 'ABUSIVE', '"Omongannya nggak jelas."')
    punch = max(0, math.sin(ts * 3)) * 26
    d.rounded_rectangle((700 - punch, 330, 780 - punch, 420), 18, fill=CORAL, outline=INK, width=5)
    d.rounded_rectangle((716 - punch, 300, 764 - punch, 345), 12, fill=CORAL, outline=INK, width=4)
    if punch > 18: paste_stamp(d._base, 380, 300, 'PLAK', INK, .8, 12)

def S10(d, t, ts):
    fallacy_slide(d, t, ts, 2, 'CIRCUMSTANTIAL', '"Ya iyalah, dia kan penjualnya."')
    tg.actor(d, 'neighbor', 790, 690, .95, ts, 'neutral')
    d.rounded_rectangle((740, 380, 850, 420), 8, fill='#e4d3ae', outline=INK, width=3)
    d.text((795, 400), 'LABEL', font=pm(20), fill=CORAL, anchor='mm')

def S11(d, t, ts):
    fallacy_slide(d, t, ts, 3, 'TU QUOQUE', '"Kamu juga! Nggak laku sendiri."')
    mirror(d, 250, 480, 1.15)
    tg.actor(d, 'owner', 760, 690, .95, ts, 'neutral', target_left=(320, 470))

def S12(d, t, ts):
    fallacy_slide(d, t, ts, 4, 'GUILT BY ASSOCIATION', '"Dasar orang kelompok itu."')
    tg.actor(d, 'bima', 420, 700, .9, ts, 'worried'); tg.actor(d, 'nara', 580, 700, .9, ts + 2, 'worried')
    d.line((360, 480, 640, 480), fill=CORAL, width=10)
    d.line((400, 560, 400, 430), fill='#795640', width=14); d.line((600, 560, 600, 430), fill='#795640', width=14)
    d.line((400, 440, 600, 440), fill=CORAL, width=8)

def S13(d, t, ts):
    fallacy_slide(d, t, ts, 5, 'APPEAL TO AGE', '"Saya lebih tua. Kamu siapa?"')
    ktp_trophy(d, 500, 470, 1.2)

def S14(d, t, ts):
    fallacy_slide(d, t, ts, 6, 'STRAW MAN', '"Idemu dipelintir dulu, baru dipukul."')
    scarecrow_card(d, 560, 470, 1.25)
    paste_card(d._base, d, 180, 460, 140, 80, 'ASLI', ring='green')

def S15(d, t, ts):
    fallacy_slide(d, t, ts, 7, 'WHATABOUTISM', '"Lho, sebelah lebih parah kok!"')
    d.rounded_rectangle((700, 430, 900, 620), 12, fill='#c9ae8f', outline=INK, width=5)
    d.polygon([(690, 430), (900, 430), (795, 340)], fill='#795640', outline=INK)
    arrow_hook(d, 300, 300, 660, 470)

def S16(d, t, ts):
    fallacy_slide(d, t, ts, 8, 'TONE POLICING', '"Caranya bicaramu kurang sopan."')
    mic(d, 500, 520, 1.4, muted=ts > 1.6)
    for i in range(4):
        y = 470 - i * 26
        if ts > 1.6 and i < int((ts - 1.6) * 2): continue
        d.arc((420, y, 470, y + 30), 300, 60, fill=TEAL, width=6)

def S16b(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    d.text((500, 180), 'delapan nama, satu akar:', font=fnt(28), fill='#56655f', anchor='mm')
    d.rounded_rectangle((150, 260, 430, 390), 16, fill='#bcd6d0', outline=INK, width=6)
    d.text((290, 325), 'ISI ARGUMEN', font=fnt(28), fill=INK, anchor='mm')
    d.rounded_rectangle((570, 260, 850, 390), 16, fill='#4a5a57', outline=INK, width=6)
    d.text((710, 325), 'ORANGNYA', font=fnt(28), fill=CREAM, anchor='mm')
    k = max(0.0, min(1.0, (ts - .4) / 1.2))
    arrow_hook(d, 440, 325, 440 + int(120 * k), 325)
    d.text((500, 470), 'memindahkan pertarungan dari isi... ke orang', font=pm(26), fill=CORAL, anchor='mm')

def S17(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#dfe4e0')
    d.rounded_rectangle((380, 380, 620, 560), 14, fill='#c9ae8f', outline=INK, width=6)
    d.text((500, 470), 'TIDAK\nPERNAH\nSALAH', font=fnt(34), fill=INK, anchor='mm', align='center')
    tags = ['sibuk', 'sudah lama', 'kamu belum paham', 'zaman dulu']
    for i, s in enumerate(tags):
        y = 700 - ((ts * 40 + i * 160) % 300)
        tag(d, 140 + (i % 2) * 360, y - 240, s)

def S18(d, t, ts):
    warm = Image.new('RGB', (RAW_W, RAW_H), '#e6d8bf'); dd = ImageDraw.Draw(warm)
    dd.rectangle((0, 0, RAW_W, RAW_H), fill='#e6d8bf'); d._base.paste(warm, (0, 0))
    shield(d, 500, 420, 1.5)
    tg.actor(d, 'owner', 500, 720, 1.0, ts * .6, 'sad')
    d.text((500, 150), 'di baliknya: menjaga sesuatu', font=fnt(28), fill=INK, anchor='mm')

def S19(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    show2 = ts > 4.2
    x = 500
    if not show2:
        d.rounded_rectangle((x - 330, 220, x + 330, 480), 16, fill='#fffaf0', outline=INK, width=5)
        d.text((x, 280), 'MASALAH ORANG LAIN', font=fnt(26), fill=TEAL, anchor='mm')
        d.text((x, 350), 'usia membantu — studi 2010', font=fnt(24), fill=INK, anchor='mm')
    else:
        d.rounded_rectangle((x - 330, 220, x + 330, 480), 16, fill='#fffaf0', outline=INK, width=5)
        d.text((x, 270), 'MASALAH PRIBADI', font=fnt(26), fill=CORAL, anchor='mm')
        d.text((x, 335), 'usia ≈ tidak berpengaruh', font=fnt(24), fill=INK, anchor='mm')
        d.text((x, 395), 'yang menolong: melihat dari luar diri', font=fnt(22), fill=INK, anchor='mm')
    d.text((x, 620), 'dua temuan riset — diakui apa adanya', font=fnt(22), fill='#56655f', anchor='mm')

def S20(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#193333')
    lines = ['USIA BUKAN KEBENARAN', 'PENGALAMAN BUKAN BUKTI', '"SAYA BISA SALAH"']
    for i, s in enumerate(lines):
        if ts < i * 1.4: continue
        y = 200 + i * 170
        d.rounded_rectangle((110, y, 890, y + 120), 16, fill=CREAM if i < 2 else CORAL, outline=INK, width=6)
        d.text((500, y + 60), s, font=fnt(40 if i < 2 else 34), fill=INK if i < 2 else CREAM, anchor='mm')

def step_slide(d, t, ts, num, name, phrase, dark=False):
    if dark: d.rectangle((0, 0, RAW_W, RAW_H), fill='#26312e')
    else: d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    d.text((140, 100), f'LANGKAH {num}', font=pm(40), fill=CORAL)
    d.text((140, 170), name, font=fnt(38), fill=CREAM if dark else INK)
    bubble(d, 250, 520, 520, 96, phrase, fnt(24))

def S21(d, t, ts):
    step_slide(d, t, ts, 1, 'DETEKSI', 'Ini ke argumen, atau ke orang?')
    paste_card(d._base, d, 500, 380, 220, 110, 'BALIKAN', tilt=math.sin(ts * 2) * 5)
    d.ellipse((330 + math.sin(ts * 1.5) * 30, 250, 470 + math.sin(ts * 1.5) * 30, 390), outline=TEAL, width=8)
    d.line((470 + math.sin(ts * 1.5) * 30, 390, 560, 480), fill=INK, width=14)

def S22(d, t, ts):
    step_slide(d, t, ts, 2, 'REGULASI', 'Napas. Jeda. Jangan ikut menyerang.')
    r = 60 + 26 * math.sin(ts * 2.2)
    d.ellipse((500 - r, 330 - r, 500 + r, 330 + r), outline=TEAL, width=8)
    d.arc((470, 300, 530, 360), 0, 180, fill=INK, width=5)

def S23(d, t, ts):
    step_slide(d, t, ts, 3, 'REFRAME', 'Kembalikan ke isi. Hormati dulu.')
    tg.table(d)
    x = 500 - 200 * min(1, ts / 3)
    paste_card(d._base, d, x + 200, 500, 190, 100, 'DATA', ring='green')
    arrow_hook(d, 850, 360, x + 260, 440, color=TEAL)

def S24(d, t, ts):
    step_slide(d, t, ts, 4, 'KLARIFIKASI', 'Bagian mana yang keliru?')
    paste_card(d._base, d, 500, 430, 200, 100, 'ARGUMEN')
    d.text((500 + math.sin(ts * 2) * 6, 300), '?', font=pm(64), fill=CORAL, anchor='mm')

def S25(d, t, ts):
    step_slide(d, t, ts, 5, 'BATAS', 'Nyatakan yang boleh dan tidak.')
    fence(d, 400, 500, 1.3)
    arrow_hook(d, 120, 330, 380, 440)
    d.text((300, 300), 'berhenti di sini', font=fnt(22), fill=TEAL)

def S26(d, t, ts):
    step_slide(d, t, ts, 6, 'PILIH: LANJUT ATAU STOP', 'Safety first. Pergi bukan kalah.', dark=True)
    door(d, 500, 480, 1.3, glow=ts > 2)
    paste_card(d._base, d, 200, 520, 160, 90, 'ISI', ring='green')

def S26b(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#dfe4e0')
    d.text((500, 110), 'LANGKAH 6 · PILIH: LANJUT ATAU STOP', font=fnt(28), fill=INK, anchor='mm')
    d.rounded_rectangle((90, 180, 450, 430), 16, fill='#bcd6d0', outline=INK, width=5)
    d.text((270, 230), 'LANJUT', font=fnt(26), fill=INK, anchor='mm')
    d.text((270, 278), 'kalau masih membahas isi', font=fnt(19), fill='#56655f', anchor='mm')
    d.text((270, 330), '"kita bahas isinya"', font=fnt(21), fill=TEAL, anchor='mm')
    d.rounded_rectangle((545, 180, 895, 430), 16, fill='#4a5a57', outline=INK, width=5)
    d.text((720, 230), 'STOP', font=fnt(26), fill=CREAM, anchor='mm')
    d.text((720, 278), 'kalau abusive berulang', font=fnt(19), fill='#c3d9d2', anchor='mm')
    d.text((720, 330), 'berhenti dan pergi', font=fnt(21), fill=GOLD, anchor='mm')
    tg.actor(d, 'nara', 500, 700, 1.0, ts * .8, 'neutral')
    if ts > _P(0):
        d.rounded_rectangle((120, 470, 880, 545), 12, fill='#fffaf0', outline=CORAL, width=5)
        d.text((500, 508), 'kalau ada ancaman atau manipulasi berulang — keselamatan dulu', font=fnt(20), fill=CORAL, anchor='mm')

def S27(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#101816' if ts < .3 else '#26312e')
    mirror(d, 280, 430, 1.4)
    tg.actor(d, 'nara', 280, 690, .85, ts * .5, 'sad' if ts < _P(0) else 'neutral')
    typed = max(0.0, min(1.0, (ts - .6) / 2.2))
    erased = max(0.0, min(1.0, (ts - _P(0)) / 1.2)) if ts > _P(0) else 0.0
    msg = 'lho, kamu kan yang dulu gagal'
    k = int(len(msg) * typed * (1 - erased))
    fake_comment(d, 430, 240, 'kamu (jari menggetar)', msg[:k] + ('|' if erased == 0 and int(ts * 2) % 2 else ''))
    if ts > _P(0):
        d.text((500, 420), 'jempol berhenti...', font=fnt(26), fill=CREAM, anchor='mm')
        d.text((500, 470), 'itu bukan jawaban. itu pelarian.', font=pm(28), fill=GOLD, anchor='mm')
    if ts > _P(1):
        d.rounded_rectangle((600, 150, 895, 380), 16, fill='#193333', outline=GOLD, width=5)
        d.text((748, 195), 'ANTIDOT', font=pm(26), fill=GOLD, anchor='mm')
        d.text((748, 245), 'intellectual humility:', font=fnt(21), fill=CREAM, anchor='mm')
        d.text((748, 282), 'berani bilang "saya mungkin keliru"', font=fnt(18), fill='#c3d9d2', anchor='mm')
        d.text((748, 335), 'kamu bukan idemu', font=fnt(23), fill=TEAL, anchor='mm')
    if ts > _P(2):
        d.text((500, 620), 'idemu boleh salah... kamu tetap utuh', font=pm(30), fill=CREAM, anchor='mm')
    d.text((500, 90), 'twist: senjata yang sama ada di tanganmu', font=fnt(22), fill='#9ab5ac', anchor='mm')

def S28(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    take = ['1 · ORANG BUKAN ARGUMEN', '2 · USIA BUKAN BUKTI', '3 · BATAS YANG JELAS']
    th = (0.0, _P(0), _P(1))
    for i, s2 in enumerate(take):
        if ts < th[i]: continue
        y = 120 + i * 150
        d.rounded_rectangle((120, y, 880, y + 110), 16, fill='#fffaf0', outline=INK, width=6)
        d.text((500, y + 55), s2, font=fnt(36), fill=INK, anchor='mm')
    if ts > _P(2):
        d.text((500, 620), 'tiga bekal pulang', font=fnt(22), fill='#56655f', anchor='mm')

def S29(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#dfe4e0')
    d.rounded_rectangle((130, 90, 870, 148), 14, fill=TEAL, outline=INK, width=4)
    d.text((500, 119), 'Pernah kena ad hominem soal apa?', font=fnt(25), fill=INK, anchor='mm')
    fake_comment(d, 140, 180, 'penonton A (anonim)', 'dibilang "masih muda", padahal datanya lengkap...')
    fake_comment(d, 140, 260, 'penonton B (anonim)', 'diserang soal fisik, pertanyaannya tidak dijawab')
    d.rounded_rectangle((140, 352, 600, 394), 10, fill='#fffaf0', outline=INK, width=3)
    if int(ts * 1.6) % 2: d.line((160, 362, 160, 384), fill=INK, width=4)
    d.text((176, 362), 'tulis contohmu di komentar...', font=fnt(20), fill='#9a917f')
    paste_card(d._base, d, 690, 300, 190, 70, 'ATURAN', tilt=4)
    for i, s2 in enumerate(['tanpa nama orang', 'tanpa menyerang balik', 'satu contoh satu komentar']):
        d.text((560, 400 + i * 36), '· ' + s2, font=fnt(21), fill=INK)
    hx, hy = 150, 560
    d.ellipse((hx, hy - 12, hx + 16, hy + 4), fill=CORAL); d.ellipse((hx + 12, hy - 12, hx + 28, hy + 4), fill=CORAL)
    d.polygon([(hx, hy - 2), (hx + 28, hy - 2), (hx + 14, hy + 16)], fill=CORAL)
    d.text((178, 560), 'LIKE', font=fnt(26), fill=CORAL)
    d.text((280, 560), '· SHARE ke temanmu — siapa tau dia butuh', font=fnt(24), fill=INK)
    if ts > _P(0):
        d.text((500, 660), 'pernah melakukannya? itu tanda mulai dewasa', font=fnt(22), fill=TEAL, anchor='mm')

def S30(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#193333')
    d.text((500, 330), 'CERITA FIKTIF', font=pm(40), fill=CREAM, anchor='mm')
    d.text((500, 420), 'knot theory', font=fnt(30), fill='#9ab5ac', anchor='mm')
    if int(ts * 1.4) % 2: d.text((500, 530), 'share ke temanmu — siapa tau dia butuh', font=fnt(22), fill='#c3d9d2', anchor='mm')

def scene_windows():
    cw, total = sentence_windows()
    def W3(ci, a, b, fn, marks=()):
        return ((cw[ci][a][0], cw[ci][b - 1][1]), fn, [cw[ci][j][0] for j in marks])
    T = [
        W3(0, 0, 3, S1), W3(0, 3, 8, S2), W3(0, 8, 18, S3, [15, 16]),
        W3(0, 18, 22, S4a, [19, 21]), W3(0, 22, 27, S4b, [24, 25, 26]),
        W3(1, 0, 6, S5), W3(1, 6, 10, S6), W3(1, 10, 16, S7, [11, 12, 13]),
        W3(2, 0, 10, S8, [1, 5, 6]),
        W3(3, 0, 15, S9edu, [1, 5, 6, 8, 12]),
        W3(4, 0, 3, S8d), W3(4, 3, 5, S9), W3(4, 5, 7, S10), W3(4, 7, 9, S11),
        W3(4, 9, 11, S12), W3(4, 11, 12, S13), W3(4, 12, 13, S14),
        W3(4, 13, 14, S15), W3(4, 14, 15, S16), W3(4, 15, 17, S16b),
        W3(5, 0, 6, S17), W3(5, 6, 12, S18), W3(5, 12, 18, S19, [13, 15]), W3(5, 18, 20, S20),
        W3(6, 0, 3, S21), W3(6, 3, 6, S22), W3(6, 6, 8, S23), W3(6, 8, 13, S24),
        W3(6, 13, 16, S25), W3(6, 16, 20, S26), W3(6, 20, 25, S26b, [22]),
        W3(7, 0, 13, S27, [5, 8, 12]),
        W3(8, 0, 5, S28, [1, 2, 3]), W3(8, 5, 10, S29, [8]), W3(8, 10, 13, S30),
    ]
    S = [(w, f) for w, f, _ in T]
    _PHS.clear(); _PHS.update({f.__name__: [m - w[0] for m in mk] for w, f, mk in T})
    return S, total, chunk_durations(), cw

MIST = getattr(tg, 'MIST', '#cfd8d3')

def raw_frame(t, scenes):
    cur = None
    for (a, b), fn in scenes:
        if a <= t: cur = ((a, b), fn)
        else: break
    if cur is not None:
        (a, b), fn = cur
        im = Image.new('RGB', (RAW_W, RAW_H), '#e8dcca'); d = ImageDraw.Draw(im)
        im._base = im; d._base = im
        global _PH
        _PH = list(_PHS.get(fn.__name__, ()))
        fn(d, t, max(0.0, t - a))
        return im
    im = Image.new('RGB', (RAW_W, RAW_H), '#e8dcca'); return im

_WM = None
def _watermark():
    global _WM
    if _WM is None:
        tmp = Image.new('RGBA', (1700, 1000), (0, 0, 0, 0))
        td = ImageDraw.Draw(tmp)
        for i in range(5):
            td.text((70, 130 + i * 175), 'DRAF PRIVAT — CERITA FIKTIF', font=pm(44), fill=(150, 45, 45, 66))
        tmp = tmp.rotate(16, expand=False)
        _WM = tmp.crop((210, 140, 1490, 860))
    return _WM

def _motes(d, t):
    for i in range(7):
        x = (i * 173 + t * (11 + 5 * (i % 3))) % ART
        y = (i * 271 - t * (8 + 3 * (i % 2))) % ART
        r = 2 + i % 3
        d.ellipse((x - r, y - r, x + r, y + r), fill='#3f5a54')

def compose(t, scenes, cues):
    raw = raw_frame(t, scenes)
    pan = 100 + 12 * math.sin(0.10 * t + .5)
    art = raw.crop((int(pan), 0, int(pan) + 800, 800)).resize((ART, ART), Image.Resampling.BILINEAR)
    bg = Image.new('RGB', (W, H), '#122a28'); bg.paste(art, (0, 0))
    d = ImageDraw.Draw(bg)
    _motes(d, t)
    box(d, (28, 30, 196, 66), 8, INK)
    d.text((40, 38), 'CERITA FIKTIF', font=fnt(18), fill=CREAM)
    d.text((W - 28, 28), 'DRAF PRIVAT', font=pm(24), fill='#e8dcca', anchor='ra')
    cue = cue_at(cues, t)
    if cue:
        rows = None
        for px in (32, 29, 26, 23):
            ft = fnt(px); rows = bag.wrap_width(d, cue, ft, 486)
            if len(rows) <= 4: break
        lh = int(ft.size * 1.24); bh = len(rows) * lh + 30
        top = 176 + (420 - bh) // 2
        x0, x1 = ART + 28, W - 28
        d.rounded_rectangle((x0, top, x1, top + bh), 13, '#0c1f1d')
        d.rounded_rectangle((x0, top, x0 + 6, top + bh), 3, GOLD)
        for i, r in enumerate(rows):
            d.text(((x0 + x1) / 2, top + 15 + i * lh), r, font=ft, fill='#fffaf0', anchor='ma')
    d.text((ART + 30, H - 44), 'ad hominem · ep. 1 — logika toxic', font=fnt(17), fill='#9ab5ac')
    d.text((W - 30, H - 44), 'knot theory', font=pm(16), fill='#9ab5ac', anchor='ra')
    d.rounded_rectangle((ART + 30, H - 20, W - 30, H - 12), 4, '#0c1f1d')
    if _TOTAL > 0:
        d.rounded_rectangle((ART + 30, H - 20, ART + 30 + int((W - 60) * min(1, t / _TOTAL)), H - 12), 4, TEAL)
    wm = _watermark()
    bg.paste(wm, (0, 0), wm)
    return bg

def encode(scenes, cues, total, work, out):
    silent = work / 'silent.mp4'
    n = math.ceil(total * DRAW_FPS)
    cmd = [rough.FF, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
           '-s', f'{W}x{H}', '-r', str(DRAW_FPS), '-i', 'pipe:0', '-an', '-r', str(FPS),
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
           '-movflags', '+faststart', str(silent)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    saved = {}; mids = [(w[0] + w[1]) / 2 for w, f in scenes]
    try:
        for i in range(n):
            t = i / DRAW_FPS
            frame = compose(t, scenes, cues)
            for si, m in enumerate(mids):
                if si not in saved and t >= m: saved[si] = frame.copy()
            proc.stdin.write(frame.tobytes())
            if i % 240 == 0: print(f'frame {i}/{n}', flush=True)
        proc.stdin.close(); code = proc.wait()
        if code: raise RuntimeError('encode video gagal')
    except BaseException:
        try: proc.stdin.close()
        except Exception: pass
        proc.terminate(); proc.wait(); raise
    for si, im in saved.items(): im.save(work / f'scene-{si:02d}.png')
    music = work / 'music.wav'
    rough.synth_score(music, total)
    for gl, nm in ((_GAP, 'gap1.mp3'), (1.2, 'gap2.mp3')):
        subprocess.run([rough.FF, '-y', '-loglevel', 'error', '-f', 'lavfi', '-t', str(gl),
                        '-i', 'anullsrc=r=44100:cl=mono', '-c:a', 'libmp3lame', '-b:a', '160k',
                        str(work / nm)], check=True)
    work_abs = work.resolve()
    vo_list = work / 'vo.txt'
    with open(vo_list, 'w') as f:
        for i, name in enumerate(_CHUNKS):
            f.write(f"file '{(CONTENT / 'audio' / f'{name}.mp3').resolve()}'\n")
            if i < 7:
                f.write(f"file '{work_abs}/gap1.mp3'\n")
                if i == 6: f.write(f"file '{work_abs}/gap2.mp3'\n")
    vo = work / 'vo-full.mp3'
    subprocess.run([rough.FF, '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
                    '-i', str(vo_list), '-c:a', 'libmp3lame', '-b:a', '160k', str(vo)], check=True)
    sfxev = []
    for (a, b), fn in scenes:
        nm = fn.__name__; ph = _PHS.get(nm, [])
        if nm == 'S3' and ph: sfxev.append((a + ph[0] + .05, 'thud'))
        if nm == 'S4a' and len(ph) > 1: sfxev.append((a + ph[1] + .05, 'damp'))
        if nm == 'S9edu' and len(ph) > 4: sfxev.append((a + ph[4] + .05, 'thud'))
        if nm == 'S8' and len(ph) > 1: sfxev.append((a + ph[1] + .05, 'damp'))
        if nm == 'S27' and ph: sfxev.append((a + ph[0] + .05, 'whoosh'))
        if nm == 'S26b': sfxev.append((a + 1.0, 'chime'))
        if nm == 'S30': sfxev.append((a + .5, 'chime'))
    sfx = work / 'sfx.wav'
    synth_sfx(sfxev, total, sfx)
    command = [rough.FF, '-y', '-loglevel', 'error', '-i', str(silent), '-i', str(vo), '-i', str(music), '-i', str(sfx),
               '-filter_complex', '[1:a]volume=1.0[voice];[2:a]volume=0.25[music];[3:a]volume=0.9[sfx];[voice][music][sfx]amix=inputs=3:duration=first:dropout_transition=0:normalize=0,alimiter=limit=0.95[a]',
               '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k',
               '-movflags', '+faststart', '-shortest', str(out)]
    subprocess.run(command, check=True)
    print('ENCODING COMPLETE', out, flush=True)

def restore_audio():
    """Audio tidak disimpan Git (aturan media privat). Pulihkan dari ZIP Drive
    yang sudah diunduh ke google_drive/ bila file lokal lenyap oleh snapshot."""
    marker = CONTENT / 'audio' / _CHUNKS[0]
    if marker.with_suffix('.mp3').exists(): return 'OK'
    for cand in [ROOT / 'google_drive', *Path.home().glob('**/kamu-masih-muda*')]:
        z = cand / 'kamu-masih-muda VO chunks + manifest.zip'
        if z.exists():
            subprocess.run(['unzip', '-q', '-o', str(z), '-d', str(CONTENT)], check=True)
            if marker.with_suffix('.mp3').exists(): return 'RESTORED'
    raise RuntimeError('Audio chunk tidak ditemukan; unduh ulang ZIP dari Drive.')

def synth_sfx(events, total, out):
    """Lapisan 2: sound effect hanya di adegan krusial (bukan musik latar)."""
    import numpy as np, wave
    sr = 44100; buf = np.zeros(int(total * sr) + sr, dtype=np.float32)
    for t, kind in events:
        i = int(t * sr)
        if kind == 'thud':
            n = int(.28 * sr); f = np.linspace(120, 45, n)
            w = np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-np.linspace(0, 9, n)); buf[i:i + n] += w * .9
        elif kind == 'damp':
            n = int(.4 * sr)
            w = np.sin(2 * np.pi * 220 * np.linspace(0, .4, n)) * np.exp(-np.linspace(0, 7, n)); buf[i:i + n] += w * .5
        elif kind == 'whoosh':
            n = int(.6 * sr)
            w = np.random.RandomState(7).randn(n) * np.hanning(n); buf[i:i + n] += w * .2
        elif kind == 'chime':
            n = int(.8 * sr)
            w = (np.sin(2 * np.pi * 880 * np.linspace(0, .8, n)) + .5 * np.sin(2 * np.pi * 1320 * np.linspace(0, .8, n))) * np.exp(-np.linspace(0, 5, n)); buf[i:i + n] += w * .32
    buf = buf / max(1e-9, np.max(np.abs(buf))) * .8
    with wave.open(str(out), 'wb') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(sr)
        wf.writeframes((buf[:int(total * sr)] * 32767).astype('<i2').tobytes())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--private-rough', action='store_true')
    ap.add_argument('--plan-only', action='store_true')
    ap.add_argument('--work-dir', type=Path, required=True)
    ap.add_argument('--out-dir', type=Path, required=True)
    a = ap.parse_args()
    if not a.private_rough: ap.error('Hanya --private-rough; render final tidak ada di sini.')
    rough.validate_mode(True, a.out_dir); rough.validate_mode(True, a.work_dir)
    print('audio:', restore_audio(), flush=True)
    scenes, total, durs, chunks = scene_windows()
    cues = build_cues([c for c in chunks])
    print(f'total={total:.2f}s scenes={len(scenes)} cues={len(cues)}', flush=True)
    if a.plan_only:
        for i, ((sa, sb), fn) in enumerate(scenes): print(f'S{i+1:02d} {sa:7.2f}-{sb:7.2f} {fn.__name__}')
        return
    a.work_dir.mkdir(parents=True, exist_ok=True); a.out_dir.mkdir(parents=True, exist_ok=True)
    out = a.out_dir / 'kamu-DRAF-PRIVAT.mp4'
    encode(scenes, cues, total, a.work_dir, out)
    print('PRIVATE ROUGH ONLY: estimated subtitle timing; human/facts/release gates remain open.', flush=True)

if __name__ == '__main__':
    main()
