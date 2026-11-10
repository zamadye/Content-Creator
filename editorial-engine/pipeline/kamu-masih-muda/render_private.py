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
W, H = 720, 1280
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
  "Satu: pisahkan orang dari argumen — termasuk orangmu sendiri.",
  "Dua: usia bukan bukti. Pengalaman bukan otomatis kebenaran.",
  "Tiga: konter terbaik bukan mempermalukan lawan...",
  "melainkan batas yang jelas, dan isi yang tetap dibicarakan.",
  "Sekarang giliran kamu.", "Pernah kena ad hominem soal apa —",
  "usia, fisik, masa lalu, atau kelompokmu?", "Tulis di komentar.",
  "Dan kalau kamu pernah sadar diri sendiri melakukannya...",
  "itu bukan tanda kamu jahat. Itu tanda kamu mulai jadi dewasa.",
  "Di cerita berikutnya: straw man — cara orang memutar balik argumenmu",
  "tanpa terlihat melenceng. Sampai jumpa."],
}

def build_cues(windows):
    cues = []
    for name, (a, b) in zip(_CHUNKS, windows):
        lines = CUES[name]; total = sum(len(x) for x in lines); t = a
        for line in lines:
            d = (b - a) * len(line) / total
            cues.append({'start': t, 'end': t + d, 'text': line}); t += d
    return cues

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
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#d7e1d7')
    table(d)
    paste_card(d._base, d, 560, 550, 200, 105, 'IDE PENJUALAN', tilt=3)
    actor(d, 'bima', 170, 720, .92, ts * .9, 'neutral', target=(560, 560))
    actor(d, 'owner', 830, 720, .95, ts * .8, 'neutral', target=(560, 560))
    d.line([(320, 500), (670, 390)], fill=TEAL, width=8)
    if ts > .5: bubble(d, 240, 300, 380, 74, '"Pak, mari buka datanya bersama."', fnt(22))
    d.text((500, 140), 'dengan tenang — hampir seperti konsultan', font=fnt(24), fill='#56655f', anchor='mm')
    d.text((500, 200), 'yang dimintakan: BUKA DATA', font=fnt(22), fill=TEAL, anchor='mm')

def S3(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#d7e1d7')
    table(d)
    dead = ts > 15.5
    if not dead: paste_card(d._base, d, 560, 550, 200, 105, 'IDE PENJUALAN', tilt=3)
    else:
        d.rounded_rectangle((460, 498, 660, 602), 8, fill='#cfc8b8', outline='#9a917f', width=4)
        d.text((560, 550), 'IDE PENJUALAN', font=fnt(20), fill='#9a917f', anchor='mm')
        d.line([(470, 508), (650, 592)], fill=CORAL, width=8); d.line([(650, 508), (470, 592)], fill=CORAL, width=8)
    actor(d, 'bima', 170, 720, .92, ts * .9, 'worried' if ts > 10.5 else 'neutral', target=(560, 560))
    actor(d, 'owner', 830, 720, .95, ts * .8, 'neutral', target=(560, 560))
    if ts < 10.5:
        bubble(d, 240, 300, 380, 74, '"Pak, mari buka datanya bersama."', fnt(22))
        d.text((500, 140), 'dia sedang bicara — tenang, isi-ke-isi', font=fnt(22), fill='#56655f', anchor='mm')
    if ts > 10.5: paste_stamp(d._base, 500, 235, 'MASIH BARU', CORAL, 1.3, -6 + math.sin(ts * 8) * 1.5)
    if ts > 11.3: bubble(d, 330, 330, 400, 74, '"Jangan mengajari saya."', fnt(22))
    if ts > 13.5:
        d.text((500, 140), 'bahasa paling dewasa — dibalas bahasa kekuasaan', font=fnt(24), fill=CORAL, anchor='mm')
    if ts > 13.5:
        d.rounded_rectangle((120, 620, 880, 745), 14, fill='#193333', outline=INK, width=5)
        d.text((500, 655), 'YANG DIMINTA: BUKA DATA', font=pm(24), fill=CREAM, anchor='mm')
        d.text((500, 705), 'YANG DITERIMA: CERAMAH USIA KERJA', font=pm(24), fill=CORAL, anchor='mm')

def S4(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill=MIST if hasattr(tg, 'MIST') else '#cfd8d3')
    items = ['MENGAPA', 'KORBAN', 'DAMPAK', 'KONTER']
    for i, it in enumerate(items):
        x = 120 + (i % 2) * 400; y = 200 + (i // 2) * 230
        on = ts > i * 1.1
        d.rounded_rectangle((x, y, x + 330, y + 170), 16, fill='#fffaf0' if on else '#d9d2c2', outline=INK, width=5)
        d.text((x + 165, y + 85), it, font=fnt(34), fill=INK if on else '#9a917f', anchor='mm')
    paste_card(d._base, d, 500, 700, 120, 60, '??', tilt=8 if int(ts * 2) % 2 else -8)

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
    for i in range(3):
        x = 200 + i * 300; y = 640 - i * 130
        d.rectangle((x - 130, y, x + 130, y + 26), fill='#9d6e51', outline=INK, width=4)
    fade = max(0, 1 - ts / 6)
    for i, a in enumerate((1, .7, .45)):
        bubble(d, 300 + i * 60 - i * 20, 300 + i * 60, 220, 70, 'coba saran dikit', ) if fade >= a - .01 else None
    bell(d, 760, 300, 1.2, closed=ts > 4.5)
    d.text((500, 120), 'peringatan dini mati pelan-pelan', font=fnt(26), fill=CORAL, anchor='mm')

def S9edu(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#26312e')
    d.text((500, 110), 'kalau kamu seorang PEMIMPIN', font=fnt(30), fill=CREAM, anchor='mm')
    for x, lb in ((230, 'NEGARA'), (500, 'PERUSAHAAN'), (770, 'RUMAH')):
        d.rounded_rectangle((x - 105, 200, x + 105, 430), 16, fill='#31403c', outline=INK, width=5)
        d.text((x, 395), lb, font=fnt(24), fill=CREAM, anchor='mm')
        if lb == 'NEGARA':
            d.polygon([(x - 60, 330), (x + 60, 330), (x, 250)], fill=GOLD)
            d.rectangle((x - 40, 330, x + 40, 365), fill=GOLD)
        elif lb == 'PERUSAHAAN':
            d.rectangle((x - 55, 250, x + 55, 365), fill='#8a94a0')
            for r in range(3):
                for c in range(3): d.rectangle((x - 40 + c * 30, 262 + r * 34, x - 22 + c * 30, 280 + r * 34), fill='#c3d9d2')
        else:
            d.polygon([(x - 55, 300), (x, 252), (x + 55, 300)], fill=CORAL)
            d.rectangle((x - 42, 300, x + 42, 365), fill='#e4d3ae')
    actor(d, 'inspector', 500, 700, 1.05, ts * .8, 'neutral', target=(500, 470))
    if ts > 1.8: paste_stamp(d._base, 760, 170, 'KRITIK MATI', CORAL, 1.1, -7)
    bubble(d, 130, 470, 250, 96, '...', fnt(30))
    d.text((255, 596), 'penasihat membisukan diri', font=fnt(19), fill='#9ab5ac', anchor='mm')

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
    lines = ['USIA ≠ KEBENARAN', 'PENGALAMAN ≠ BUKTI', '"SAYA BISA SALAH"']
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

def S27(d, t, ts):
    if ts < 1.5:
        d.rectangle((0, 0, RAW_W, RAW_H), fill='#101816'); return
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#26312e')
    mirror(d, 300, 420, 1.5)
    tg.actor(d, 'nara', 300, 660, .8, ts * .5, 'sad')
    typed = max(0, min(1, (ts - 2.5) / 2.5)); erased = max(0, (ts - 6.5) / 2.0)
    msg = 'dasar bodoh, dulu juga gagal'
    k = int(len(msg) * typed * (1 - erased))
    fake_comment(d, 420, 260, 'kamu (jari menggetar)', msg[:k] + ('|' if int(ts * 2) % 2 else ''))
    d.text((500, 600), 'itu bukan jawaban... itu pelarian', font=fnt(26), fill=CREAM, anchor='mm')

def S28(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#e9ddca')
    take = ['1 · ORANG ≠ ARGUMEN', '2 · USIA BUKAN BUKTI', '3 · BATAS YANG JELAS']
    for i, s in enumerate(take):
        if ts < i * 1.3: continue
        y = 170 + i * 170
        d.rounded_rectangle((120, y, 880, y + 120), 16, fill='#fffaf0', outline=INK, width=6)
        d.text((500, y + 60), s, font=fnt(36), fill=INK, anchor='mm')

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
    d.text((140, 560), '♥ LIKE', font=fnt(26), fill=CORAL)
    d.text((280, 560), '· SHARE ke temanmu — siapa tau dia butuh', font=fnt(24), fill=INK)

def S30(d, t, ts):
    d.rectangle((0, 0, RAW_W, RAW_H), fill='#193333')
    d.text((500, 330), 'CERITA FIKTIF', font=pm(40), fill=CREAM, anchor='mm')
    d.text((500, 420), 'knot theory', font=fnt(30), fill='#9ab5ac', anchor='mm')
    if int(ts * 1.4) % 2: d.text((500, 530), 'share ke temanmu — siapa tau dia butuh', font=fnt(22), fill='#c3d9d2', anchor='mm')

def scene_windows():
    durs = chunk_durations()
    starts = []; t = 0.0
    for i, du in enumerate(durs):
        starts.append(t); t += du + (_GAP_TWIST if i == 6 else _GAP)
    total = t - _GAP
    def win(i): return starts[i], starts[i] + durs[i]
    c = [win(i) for i in range(9)]
    def sub(ci, a, b): return (c[ci][0] + (c[ci][1] - c[ci][0]) * a, c[ci][0] + (c[ci][1] - c[ci][0]) * b)
    S = [
        (sub(0, 0.00, .30), S1), (sub(0, .30, .44), S2), (sub(0, .44, .69), S3), (sub(0, .69, 1.0), S4),
        (sub(1, 0.00, .50), S5), (sub(1, .50, .76), S6), (sub(1, .76, 1.0), S7),
        ((c[2][0], c[2][1]), S8),
        ((c[3][0], c[3][1]), S9edu),
        (sub(4, 0.00, .125), S9), (sub(4, .125, .25), S10), (sub(4, .25, .375), S11), (sub(4, .375, .5), S12),
        (sub(4, .5, .625), S13), (sub(4, .625, .75), S14), (sub(4, .75, .875), S15), (sub(4, .875, 1.0), S16),
        (sub(5, 0.00, .30), S17), (sub(5, .30, .55), S18), (sub(5, .55, .80), S19), (sub(5, .80, 1.0), S20),
        (sub(6, 0.00, .166), S21), (sub(6, .166, .333), S22), (sub(6, .333, .5), S23), (sub(6, .5, .666), S24),
        (sub(6, .666, .833), S25), (sub(6, .833, 1.0), S26),
        ((c[7][0], c[7][1]), S27),
        (sub(8, 0.00, .30), S28), (sub(8, .30, .74), S29), (sub(8, .74, 1.0), S30),
    ]
    return S, total, durs, c

MIST = getattr(tg, 'MIST', '#cfd8d3')

def raw_frame(t, scenes):
    for (a, b), fn in scenes:
        if a <= t < b or (fn is scenes[-1][1] and t >= a):
            im = Image.new('RGB', (RAW_W, RAW_H), '#e8dcca'); d = ImageDraw.Draw(im)
            im._base = im; d._base = im
            fn(d, t, t - a)
            return im
    im = Image.new('RGB', (RAW_W, RAW_H), '#e8dcca'); return im

def compose(t, scenes, cues):
    raw = raw_frame(t, scenes)
    art = raw.crop((100, 0, 900, 800)).resize((720, 720), Image.Resampling.BILINEAR)
    bg = Image.new('RGB', (W, H), '#f2e2c9'); bg.paste(art, (0, 193))
    d = ImageDraw.Draw(bg)
    box(d, (42, 38, 222, 76), 8, INK)
    d.text((53, 45), 'CERITA FIKTIF', font=fnt(18), fill=CREAM)
    d.text((W - 200, 47), 'DRAF PRIVAT', font=fnt(16), fill=INK)
    cue = cue_at(cues, t)
    if cue:
        rows = None
        for px in (30, 27, 25):
            ft = fnt(px); rows = bag.wrap_width(d, cue, ft, 610 - 48)
            if len(rows) <= 2: break
        lh = int(ft.size * 1.22); bh = len(rows) * lh + 28; top = int(1000 - bh / 2)
        box(d, ((W - 610) / 2, top, (W + 610) / 2, top + bh), 13, (19, 51, 51, 240))
        for i, r in enumerate(rows):
            d.text(((W - d.textlength(r, font=ft)) / 2, top + 10 + i * lh), r, font=ft, fill='#fffaf0')
    return bg

def encode(scenes, cues, total, work, out):
    silent = work / 'silent.mp4'
    n = math.ceil(total * DRAW_FPS)
    cmd = [rough.FF, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
           '-s', f'{W}x{H}', '-r', str(DRAW_FPS), '-i', 'pipe:0', '-an', '-r', str(FPS),
           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p',
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
        nm = fn.__name__
        if nm == 'S3': sfxev += [(a + 10.8, 'thud'), (a + 16.3, 'damp')]
        elif nm == 'S8': sfxev += [(a + (b - a) * .55, 'damp')]
        elif nm == 'S9edu': sfxev += [(a + 1.9, 'thud')]
        elif nm == 'S26': sfxev += [(a + 2.1, 'chime')]
        elif nm == 'S27': sfxev += [(a + 1.45, 'whoosh')]
        elif nm == 'S30': sfxev += [(a + .5, 'chime')]
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
