#!/usr/bin/env python3
"""Build the PRIVATE text-review PDF from the bound draft scripts.

Requires reportlab; media, voice, human review, clearance and release are not
produced by this program. The output is forced under the ignored .scratch tree.
"""
from __future__ import annotations
import argparse
from html import escape
import json
from pathlib import Path

try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Table, TableStyle
except ImportError as exc:
    raise SystemExit('Install reportlab in a local ignored tool directory first; see README.md') from exc

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
FONTS = ROOT / 'editorial-engine/assets/fonts'
SCRIPTS = {name: json.loads((HERE / f'{name}.script.json').read_text(encoding='utf-8')) for name in ('master', 'short')}


def register():
    for name, filename in [('Archivo','archivo-latin-400-normal.ttf'),
                           ('ArchivoBold','archivo-latin-700-normal.ttf'),
                           ('Instrument','instrument-serif-latin-400-normal.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(FONTS / filename)))
    pdfmetrics.registerFontFamily('Archivo', normal='Archivo', bold='ArchivoBold', italic='Archivo', boldItalic='ArchivoBold')


def make_pdf(output):
    if not output.resolve().is_relative_to((ROOT / '.scratch').resolve()):
        raise ValueError('PDF output must remain within ignored .scratch')
    output.parent.mkdir(parents=True, exist_ok=True)
    register()
    navy = colors.HexColor('#122037')
    muted = colors.HexColor('#596778')
    amber = colors.HexColor('#D18B49')
    paper = colors.HexColor('#F5F3ED')
    styles = {
        'eyebrow': ParagraphStyle('eyebrow',fontName='ArchivoBold',fontSize=9,leading=13,textColor=amber,spaceAfter=7),
        'title': ParagraphStyle('title',fontName='Instrument',fontSize=37,leading=42,textColor=navy,spaceAfter=13),
        'deck': ParagraphStyle('deck',fontName='Archivo',fontSize=12.1,leading=18,textColor=navy,spaceAfter=10),
        'head': ParagraphStyle('head',fontName='Instrument',fontSize=25,leading=30,textColor=navy,spaceAfter=10),
        'subhead': ParagraphStyle('subhead',fontName='ArchivoBold',fontSize=10.6,leading=15,textColor=navy,spaceBefore=8,spaceAfter=5),
        'body': ParagraphStyle('body',fontName='Archivo',fontSize=10.3,leading=15.4,textColor=navy,spaceAfter=8),
        'small': ParagraphStyle('small',fontName='Archivo',fontSize=9,leading=13.5,textColor=muted,spaceAfter=7),
        'scene': ParagraphStyle('scene',fontName='Archivo',fontSize=10.2,leading=15.1,textColor=navy,spaceAfter=8),
        'callout': ParagraphStyle('callout',fontName='ArchivoBold',fontSize=10,leading=15,textColor=navy,spaceAfter=0),
    }
    def p(text, style='body'):
        return Paragraph(text, styles[style])
    def raw(text, style='body'):
        return p(escape(text), style)
    def callout(text):
        t=Table([[raw(text,'callout')]],colWidths=[174*mm])
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),paper),('LEFTPADDING',(0,0),(-1,-1),12),
                               ('RIGHTPADDING',(0,0),(-1,-1),12),('TOPPADDING',(0,0),(-1,-1),10),
                               ('BOTTOMPADDING',(0,0),(-1,-1),10)]))
        return t
    def header_footer(c, doc):
        w,h=doc.pagesize
        c.saveState()
        c.setStrokeColor(colors.HexColor('#E3E6E5'))
        c.line(18*mm,h-17*mm,w-18*mm,h-17*mm)
        c.setFont('ArchivoBold',8)
        c.setFillColor(muted)
        c.drawString(18*mm,h-13*mm,'KNOT THEORY  /  DRAF PRIVAT')
        c.drawRightString(w-18*mm,h-13*mm,'PSIKOLOGI  •  BELUM TAYANG')
        c.line(18*mm,15*mm,w-18*mm,15*mm)
        c.setFont('Archivo',8)
        c.drawString(18*mm,10*mm,'Rani & Dimas: ilustrasi, bukan peserta penelitian')
        c.drawRightString(w-18*mm,10*mm,str(doc.page))
        c.restoreState()
    doc=SimpleDocTemplate(str(output),pagesize=(210*mm,297*mm),leftMargin=18*mm,rightMargin=18*mm,
                          topMargin=23*mm,bottomMargin=22*mm,title='Satu Pesan, Dua Harapan — Draf',
                          author='knot theory')
    story=[]
    story += [Spacer(1,15*mm),p('SUDUT CERITA  /  PSIKOLOGI','eyebrow'),
              p('Satu Pesan,<br/>Dua Harapan','title'),
              raw('Sebuah email kerja menghentikan makan malam. Yang tidak tertulis bukan isi pesannya, melainkan kapan jawaban dibutuhkan.','deck'),
              Spacer(1,4*mm),callout('SATU BENDA. DUA PERSPEKTIF. SATU KESALAHPAHAMAN YANG MUNGKIN TERASA AKRAB.'),
              Spacer(1,7*mm),p('Mengapa sudut ini?','subhead'),
              raw('Dari sisi Rani, menunda balasan bisa terasa seperti tidak peduli. Dari sisi Dimas, tombol kirim sudah menutup pekerjaannya untuk malam itu. Keduanya membaca email yang sama, tetapi hanya satu orang yang tahu kapan jawaban diperlukan.'),
              raw('Rani, Dimas, email dan adegan makan adalah ilustrasi fiktif; bukan peserta penelitian. Sudut dan dampak pada audiens belum diuji.','small'),
              p('Apa yang tersedia','subhead'),
              raw('Naskah master dan Short mandiri, ringkasan sumber, rencana footage bergerak serta caption untuk empat platform. Ini paket naskah, bukan video final.'),
              PageBreak()]
    story += [p('01  /  CERITA PANJANG','eyebrow'),p('Naskah master','head'),
              raw('29 adegan • Sumber: Giurge & Bohns (2021) • Durasi audio belum diukur.','small')]
    for scene in SCRIPTS['master']['scenes']:
        body=f"<font name='ArchivoBold' color='#D18B49'>{escape(scene['id'])}</font>  {escape(scene['narration'])}"
        story.append(KeepTogether([p(body,'scene')]))
    story += [PageBreak(),p('02  /  TURUNAN CERITA','eyebrow'),p('Short mandiri','head'),
              raw('Berangkat dari momen yang sama, dengan konteks dan batas riset yang tetap berdiri sendiri. Durasi belum diukur.','small')]
    for scene in SCRIPTS['short']['scenes']:
        body=f"<font name='ArchivoBold' color='#D18B49'>{escape(scene['id'])}</font>  {escape(scene['narration'])}"
        story.append(KeepTogether([p(body,'scene')]))
    story += [PageBreak(),p('03  /  SUMBER & BATAS','eyebrow'),p('Apa yang benar-benar diteliti','head'),
              raw('Giurge dan Bohns (2021) membandingkan penilaian pengirim dengan perkiraan penerima tentang email kerja tidak mendesak, terutama di luar jam kerja. Rangkaian delapan studi preregistrasi melibatkan total 4.004 peserta; sebagian mengingat situasi email, sebagian membayangkan skenario.'),
              raw('Secara rata-rata, penerima memperkirakan bahwa pengirim mengharapkan respons lebih cepat daripada yang dinyatakan kelompok pengirim. Ini perbandingan kelompok, bukan kepastian tentang isi pikiran orang yang mengirim pesan kepadamu.'),
              raw('Dalam satu skenario di luar jam kerja, penambahan catatan bahwa email tidak mendesak membuat perkiraan penerima lebih dekat dengan harapan pengirim. Efek langsung catatan pada stres di analisis tersebut tidak signifikan; jangan menjual kalimat itu sebagai obat stres.'),
              p('Batas yang tidak boleh hilang','subhead'),
              raw('Riset ini bukan uji semua chat pribadi, WhatsApp, hubungan atasan–bawahan, budaya kerja Indonesia atau keadaan darurat. Pesan dan pekerjaan tertentu memang membutuhkan respons cepat. Menjadwalkan email saat jam kerja adalah saran penulis, bukan efek yang diuji dalam intervensi itu.'),
              raw('Periksa catatan riset lengkap di folder yang sama untuk rincian metode, temuan dan keterbatasan.'),
              p('Sumber primer','subhead'),
              p('<link href="https://doi.org/10.1016/j.obhdp.2021.08.002" color="#8C562B">Giurge &amp; Bohns (2021) — doi.org/10.1016/j.obhdp.2021.08.002</link>','body'),
              p('<link href="https://lauragiurge.com/s/Giurge-Bohns-2021-Email-Urgency-Bias-OBHDP.pdf" color="#8C562B">Naskah artikel di situs peneliti</link>','body'),
              PageBreak(),p('04  /  RENCANA PRODUKSI','eyebrow'),p('Visual yang bergerak','head'),
              raw('Buka pada ponsel, piring, dan sendok yang berhenti; label ILUSTRASI sudah terlihat. Potong ke dua sisi meja yang konsisten: tangan Rani dan layar email, lalu tangan Dimas dan laptop yang menutup. Target pembuka 1–3 detik masih perlu diuji pada video.'),
              raw('Gunakan aksi yang berkaitan langsung dengan cerita: ponsel diangkat, lampiran dibuka, laptop ditutup dan catatan tenggat ditambahkan. Dua jam adalah metafora, bukan angka hasil penelitian. Peta adegan lengkap tersedia dalam storyboard.'),
              raw('Kandidat footage Pexels sudah dicari berdasarkan deskripsi, tetapi belum diunduh, ditonton atau diperiksa hak model/merek. Tidak ada klaim clearance. Bila tidak cocok, ganti dengan footage yang relevan dan diizinkan.'),
              p('Status pemeriksaan','subhead'),
              raw('PASS mekanis: struktur master dan cakupan anotasi naskah. NOT TESTED: kualitas editorial dan respons audiens, pemeriksaan fakta independen, hak/disclosure, tempo audio, visual bergerak, subtitle dan izin tayang.'),
              callout('BELUM ADA VIDEO, AUDIO, THUMBNAIL ATAU JADWAL PUBLIKASI UNTUK TOPIK INI.'),
              Spacer(1,5*mm),raw('Dokumen ini untuk umpan balik privat. Naskah, storyboard, sumber, caption dan backup tersedia terpisah di folder Drive.','small')]
    doc.build(story,onFirstPage=header_footer,onLaterPages=header_footer)


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--output',type=Path,default=ROOT/'.scratch/psych-deliverables/Paket-Draf-Satu-Pesan.pdf')
    args=parser.parse_args()
    make_pdf(args.output)
    print(args.output)


if __name__ == '__main__':
    main()
