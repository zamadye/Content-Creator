#!/usr/bin/env python3
"""Build an honest, private QA/review report from technical results and sampled frames."""
import argparse
import json
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Image,Table,TableStyle,KeepTogether

ROOT=Path(__file__).resolve().parents[3];SCRATCH=(ROOT/'.scratch').resolve();FONTS=ROOT/'editorial-engine/assets/fonts'
for n,f in [('Archivo','archivo-latin-400-normal.ttf'),('ArchivoBold','archivo-latin-700-normal.ttf')]:pdfmetrics.registerFont(TTFont(n,str(FONTS/f)))
pdfmetrics.registerFontFamily('Archivo',normal='Archivo',bold='ArchivoBold')
INK=colors.HexColor('#173d40');TEAL=colors.HexColor('#327b76');MUTED=colors.HexColor('#536d69');CORAL=colors.HexColor('#ba6653')
styles={'eyebrow':ParagraphStyle('eyebrow',fontName='ArchivoBold',fontSize=9,leading=13,textColor=TEAL,spaceAfter=7),
 'title':ParagraphStyle('title',fontName='ArchivoBold',fontSize=25,leading=30,textColor=INK,spaceAfter=10),
 'h':ParagraphStyle('h',fontName='ArchivoBold',fontSize=13,leading=17,textColor=INK,spaceBefore=7,spaceAfter=6),
 'body':ParagraphStyle('body',fontName='Archivo',fontSize=10.5,leading=15.3,textColor=INK,spaceAfter=7),
 'small':ParagraphStyle('small',fontName='Archivo',fontSize=9,leading=13,textColor=MUTED,spaceAfter=5),
 'tab':ParagraphStyle('tab',fontName='Archivo',fontSize=9,leading=12,textColor=INK),
 'head':ParagraphStyle('head',fontName='ArchivoBold',fontSize=9,leading=12,textColor=colors.white)}
def P(s,k='body'):return Paragraph(s,styles[k])
def footer(c,doc):
    w,h=A4;c.saveState();c.setStrokeColor(colors.HexColor('#d9e1d7'));c.line(20*mm,16*mm,w-20*mm,16*mm)
    c.setFont('Archivo',8);c.setFillColor(MUTED);c.drawString(20*mm,10*mm,'KNOT THEORY  /  REVIEW PRIVAT  /  BUKAN IZIN TAYANG');c.drawRightString(w-20*mm,10*mm,f'{doc.page:02}');c.restoreState()
def table(rows,widths):
    data=[[P(c,'head' if i==0 else 'tab') for c in row] for i,row in enumerate(rows)]
    t=Table(data,colWidths=widths,repeatRows=1);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),INK),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#e6eee7'),colors.HexColor('#f5ead8')]),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6)]));return t

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out-dir',type=Path,required=True);ap.add_argument('--promo-dir',type=Path,required=True);ap.add_argument('--output',type=Path,required=True);a=ap.parse_args()
    for p in (a.out_dir,a.promo_dir,a.output):
        if not p.resolve().is_relative_to(SCRATCH):ap.error('Private input/output must remain in .scratch')
    qa=json.loads((a.out_dir/'technical-qa.json').read_text());v=qa['outputs']
    doc=SimpleDocTemplate(str(a.output),pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,topMargin=18*mm,bottomMargin=22*mm,title='Review Privat — Tangga Itu Masih Licin v2',author='KNOT THEORY')
    story=[P('PRODUKSI V2  /  CERITA FIKTIF','eyebrow'),P('Tangga Itu<br/>Masih Licin','title'),
      P('Preview master dan Short untuk ditinjau, bukan video siap tayang. Nara ingin mencegah tetangga jatuh; iurannya tetap penting, tapi tidak membuktikan tangga aman.','body'),
      Spacer(1,3*mm),Image(str(a.promo_dir/'thumbnail-master.png'),width=170*mm,height=95.625*mm),Spacer(1,5*mm),
      P('<b>Apa yang baru:</b> contoh ad hominem dijelaskan setelah kejadian, ada contoh kedua perilaku merendahkan, dan dampak emosional dibingkai sebagai kemungkinan—bukan diagnosis seseorang.','body'),
      P('Label fiksi dan privat tampak sejak frame awal yang disampel. Ilustrasi promosi di atas sintetis dan dibuat terpisah, bukan frame video.','small'),PageBreak(),
      P('01  /  APA YANG SUDAH DIBUAT','eyebrow'),P('Tiga preview, satu cerita','title')]
    rows=[('Output','Durasi / ukuran','Hasil teknis'),
          ('Master horizontal',f"{v['master']['durationSeconds']:.2f} dtk · 1280 × 720",'Decode penuh PASS'),
          ('Master vertikal',f"{v['master-vertical']['durationSeconds']:.2f} dtk · 720 × 1280",'Decode penuh PASS'),
          ('Short vertikal',f"{v['short']['durationSeconds']:.2f} dtk · 720 × 1280",'Decode penuh PASS')]
    story += [table(rows,[52*mm,65*mm,53*mm]),Spacer(1,5*mm),
      P('Apa yang dihitung','h'),P('Ketiganya H.264/AAC dengan satu stream campuran dan wadah 24 fps. Ilustrasi digambar pada 12 gambar/detik dan ditahan dua frame: ini bukan 24 gambar unik/detik. Setiap potongan awal pertama berpindah pada 2,25 detik.','body'),
      P('49 titik tengah master dan 21 titik tengah Short di-decode; beda pixel pada dua sampel gerak ditemukan. Itu <b>bukan</b> bukti gerak bagus atau cerita menarik. Cakupan teks subtitle cocok dengan naskah, tetapi batasnya adalah perkiraan, bukan hasil mendengar atau forced alignment.','body'),
      P('Short sekitar 80,8 detik berada di dalam kisaran 3–90 detik FB Reels yang sebelumnya ditelusuri; master sekitar 176,9 detik berada di luar kisaran itu. Periksa ulang aturan saat rilis; durasi saja tidak menjamin penerimaan.','body'),
      P('Perlu perhatian: respons “Nggak” pada master memiliki cue sekitar 0,72 detik; cek keterbacaannya pada ponsel dan sesuaikan bila perlu.','small'),PageBreak(),
      P('02  /  PENGECEKAN PILIHAN GAMBAR','eyebrow'),P('Bukan sekadar ganti label','title'),
      P('Cuplikan di bawah adalah satu frame terpilih dari video master vertikal hasil decode. Frame yang disampel tidak mewakili playback penuh, kesesuaian suara, atau kenyamanan gerak.','body')]
    # The locally generated contact sheet contains eight decoded frames in two columns.
    story += [Image(str(a.out_dir/'selected-decoded-frames.jpg'),width=170*mm,height=(170*700/760)*mm),PageBreak(),
      P('03  /  GATE DAN BATAS','eyebrow'),P('Yang masih memerlukan orang','title')]
    rows=[('Pemeriksaan','Status','Arti'),
          ('Struktur & subtitle','PASS teknis','Audit teks, urutan, format, coverage; bukan pemahaman suara.'),
          ('Prevoice final','NEEDS REVIEW','Receipt kosong sengaja gagal; hanya reviewer nyata boleh mengisinya.'),
          ('Playback & audio penuh','NOT TESTED','Dengar pengucapan, musik, sinkron dan transisi di seluruh video.'),
          ('Fakta, hak & disclosure','NEEDS REVIEW','Konsep, hak suara/font/musik/gambar, label platform dan konteks fiksi.'),
          ('Cerita, gerak, audiens','NOT TESTED','Uji emosi, relevansi benda, konsistensi karakter dan keterbacaan mobile.'),
          ('Rilis / jadwal','NOT AUTHORIZED','Tidak ada Buffer, penjadwalan, publikasi atau akses publik baru.')]
    story += [table(rows,[53*mm,38*mm,79*mm]),Spacer(1,5*mm),
      P('Pertanyaan review yang disarankan','h'),
      P('1. Apakah penonton paham bahwa Nara benar menunggak, tetapi kondisi tangga perlu diperiksa? Apakah perubahan ke peran pengelola dana terasa adil?','body'),
      P('2. Apakah contoh ad hominem dan perilaku yang mungkin disebut toxic jelas tanpa menghakimi seluruh sifat Bima? Apakah contoh lampu minggu lalu dan rasa ragu terlihat?','body'),
      P('3. Apakah gesture menyentuh objek, subtitle nyaman di ponsel, suara dan musik dapat dipahami? Poster sinematik memiliki gaya lebih rinci daripada animatic; apakah konsistensi visual cukup?','body'),
      P('4. Penutup brand belum diputuskan: arahan lama “ikuti knot theory” dan arahan terbaru agar diskusi muncul dari isi perlu dikonfirmasi sebelum final.','body'),
      P('Sumber konsep dan batasnya tercatat dalam riset-batas-fakta.md: IEP/UNC untuk penalaran; APA, Harvard Health dan Psychology Today untuk konteks perilaku. Tidak ada sumber yang menguji cerita fiksi ini.','small')]
    a.output.parent.mkdir(parents=True,exist_ok=True);doc.build(story,onFirstPage=footer,onLaterPages=footer);print('Wrote private report',a.output)
if __name__=='__main__':main()
