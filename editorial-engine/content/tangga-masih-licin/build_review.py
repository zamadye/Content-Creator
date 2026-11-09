#!/usr/bin/env python3
"""Build a private editorial review PDF from the versioned draft; not a release asset."""
import argparse
import html
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, Flowable, KeepTogether,
                                PageBreak, PageTemplate, Paragraph, Spacer, Table, TableStyle)

HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
SCRATCH=(REPO/'.scratch').resolve()
FONTS=REPO/'editorial-engine/assets/fonts'
INK=colors.HexColor('#183B3D'); DARK=colors.HexColor('#103338'); TEAL=colors.HexColor('#277478')
PAPER=colors.HexColor('#F7F3E9'); MUTED=colors.HexColor('#56706C'); ORANGE=colors.HexColor('#EBA356')
SAND=colors.HexColor('#EADFC9'); WHITE=colors.white
for name, file in [('Archivo','archivo-latin-400-normal.ttf'),('ArchivoMedium','archivo-latin-500-normal.ttf'),
                   ('ArchivoSemi','archivo-latin-600-normal.ttf'),('ArchivoBold','archivo-latin-700-normal.ttf')]:
    pdfmetrics.registerFont(TTFont(name,str(FONTS/file)))
pdfmetrics.registerFontFamily('Archivo',normal='Archivo',bold='ArchivoBold',italic='Archivo',boldItalic='ArchivoBold')
styles={
 'eyebrow':ParagraphStyle('eyebrow',fontName='ArchivoBold',fontSize=8.8,leading=12,textColor=TEAL,spaceAfter=7),
 'hero':ParagraphStyle('hero',fontName='ArchivoBold',fontSize=28,leading=32,textColor=DARK,spaceAfter=12),
 'title':ParagraphStyle('title',fontName='ArchivoBold',fontSize=21,leading=25,textColor=DARK,spaceAfter=9),
 'deck':ParagraphStyle('deck',fontName='Archivo',fontSize=12.3,leading=18,textColor=INK,spaceAfter=13),
 'heading':ParagraphStyle('heading',fontName='ArchivoBold',fontSize=11.8,leading=15,textColor=DARK,spaceBefore=8,spaceAfter=5),
 'body':ParagraphStyle('body',fontName='Archivo',fontSize=10.3,leading=15,textColor=INK,spaceAfter=7),
 'small':ParagraphStyle('small',fontName='Archivo',fontSize=9.1,leading=13,textColor=MUTED,spaceAfter=5),
 'tiny':ParagraphStyle('tiny',fontName='Archivo',fontSize=8.4,leading=12,textColor=INK,spaceAfter=3),
 'script':ParagraphStyle('script',fontName='Archivo',fontSize=11.2,leading=16.2,textColor=INK,spaceAfter=9),
 'script_hook':ParagraphStyle('script_hook',fontName='ArchivoBold',fontSize=14.6,leading=21,textColor=TEAL,spaceAfter=11),
 'label':ParagraphStyle('label',fontName='ArchivoBold',fontSize=8.1,leading=11,textColor=TEAL,spaceBefore=7,spaceAfter=4),
 'tablehead':ParagraphStyle('tablehead',fontName='ArchivoBold',fontSize=8.6,leading=11.5,textColor=WHITE),
 'table':ParagraphStyle('table',fontName='Archivo',fontSize=9.0,leading=13,textColor=INK),
 'box':ParagraphStyle('box',fontName='ArchivoSemi',fontSize=10.7,leading=15,textColor=INK),
}

def esc(x): return html.escape(x,quote=False)
def P(text,style='body'): return Paragraph(text,styles[style])
def markup(text):return esc(text).replace('\n','<br/>')
def section(label):return P(esc(label.upper()),'label')

class StairIllustration(Flowable):
    """Simple original vector illustration, not a reference frame."""
    def __init__(self,width=160*mm,height=55*mm):
        Flowable.__init__(self);self.width=width;self.height=height
    def draw(self):
        c=self.canv;w=self.width;h=self.height
        c.setFillColor(colors.HexColor('#DDE9E5'));c.roundRect(0,0,w,h,12,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#9AC5C0'));c.circle(w*.17,h*.70,24,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#E9F3F0'));c.ellipse(w*.11,h*.71,w*.25,h*.84,fill=1,stroke=0)
        c.setFillColor(DARK)
        path=c.beginPath();path.moveTo(w*.05,18);path.lineTo(w*.05,36);path.lineTo(w*.28,36);path.lineTo(w*.28,57);path.lineTo(w*.51,57);path.lineTo(w*.51,78);path.lineTo(w*.76,78);path.lineTo(w*.76,18);path.close()
        c.drawPath(path,fill=1,stroke=0)
        c.setStrokeColor(colors.HexColor('#83C6C3'));c.setLineWidth(3)
        c.line(w*.29,61,w*.43,61);c.line(w*.15,40,w*.23,40);c.line(w*.53,82,w*.69,82)
        c.setFillColor(ORANGE);c.ellipse(w*.55,88,w*.68,102,fill=1,stroke=0)
        c.setStrokeColor(colors.HexColor('#9E5B36'));c.setLineWidth(2);c.line(w*.58,96,w*.64,92)
        c.setFillColor(WHITE);c.roundRect(w*.76,h*.28,w*.20,h*.56,9,fill=1,stroke=0)
        c.setFillColor(TEAL);c.roundRect(w*.78,h*.68,w*.16,h*.09,2,fill=1,stroke=0)
        c.setFillColor(SAND);c.roundRect(w*.78,h*.49,w*.14,h*.11,3,fill=1,stroke=0)
        c.setFillColor(colors.HexColor('#EAB099'));c.roundRect(w*.80,h*.32,w*.13,h*.10,3,fill=1,stroke=0)
        c.setStrokeColor(colors.HexColor('#80AEAA'));c.setLineWidth(1)
        for i in range(4):
            x=w*.06+i*17;c.line(x,h*.42,x-3,h*.37)


def footer(canvas,doc):
    w,h=A4; canvas.saveState()
    canvas.setFillColor(PAPER);canvas.rect(0,0,w,h,fill=1,stroke=0)
    canvas.setStrokeColor(colors.HexColor('#D8E1D8'));canvas.line(20*mm,16*mm,w-20*mm,16*mm)
    canvas.setFillColor(MUTED);canvas.setFont('Archivo',8)
    canvas.drawString(20*mm,10*mm,'KNOT THEORY  /  DRAF EVALUASI PRIVAT')
    canvas.drawRightString(w-20*mm,10*mm,f'{doc.page:02d}')
    canvas.restoreState()

def box(items,bg='#E4EEEA',padding=10):
    table=Table([[items]],colWidths=[170*mm]);table.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,-1),colors.HexColor(bg)),('BOX',(0,0),(-1,-1),0,colors.HexColor(bg)),
        ('LEFTPADDING',(0,0),(-1,-1),padding),('RIGHTPADDING',(0,0),(-1,-1),padding),
        ('TOPPADDING',(0,0),(-1,-1),padding),('BOTTOMPADDING',(0,0),(-1,-1),padding)]))
    return table

def review_table(rows,widths):
    data=[]
    for i,row in enumerate(rows):data.append([P(esc(cell),'tablehead' if i==0 else 'table') for cell in row])
    t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),DARK),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#E6EFEB'),colors.HexColor('#F2EBDD')]),
       ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
       ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7),('LINEBELOW',(0,0),(-1,0),0,WHITE)]))
    return t

def script_group(scenes,label,start,end,hook=False):
    text=' '.join(s['narration'] for s in scenes[start-1:end])
    return [section(f'{label}  /  S{start:02}–S{end:02}'),P(markup(text),'script_hook' if hook else 'script')]

def build(output):
    master=json.loads((HERE/'master.script.json').read_text(encoding='utf-8'))['scenes']
    short=json.loads((HERE/'short.script.json').read_text(encoding='utf-8'))['scenes']
    pagew,pageh=A4
    doc=BaseDocTemplate(str(output),pagesize=A4,leftMargin=20*mm,rightMargin=20*mm,
                        topMargin=18*mm,bottomMargin=22*mm,title='Evaluasi Arah dan Naskah — Tangga Itu Masih Licin',
                        author='KNOT THEORY',subject='Draft editorial; semua kejadian fiksi')
    frame=Frame(20*mm,23*mm,pagew-40*mm,pageh-42*mm,leftPadding=0,rightPadding=0,topPadding=0,bottomPadding=0,id='normal')
    doc.addPageTemplates(PageTemplate(id='main',frames=frame,onPage=footer))
    story=[]
    story += [P('EVALUASI ARAH  /  CERITA FIKTIF','eyebrow'),
              P('Ketika orangnya<br/>yang disalahkan','hero'),
              P('Sebuah usul cerita untuk mengajak penonton berpikir bersama, bukan sekadar menerima penjelasan.','deck'),
              StairIllustration(width=170*mm,height=51*mm),Spacer(1,6*mm),
              section('Usulan pilot'),P('Tangga Itu Masih Licin','title'),
              P('Nara melaporkan tangga bersama yang licin. Bima justru menolak usulnya karena Nara menunggak iuran. Tunggakan itu benar, tetapi apakah itu membuktikan tangganya aman?','body'),
              box([P('REFERENSI = PENDEKATAN VISUAL', 'label'),
                   P('Bukan topik bisnisnya, bukan plotnya, bukan desain atau asetnya. Cerita ini baru dan fiktif.', 'box')]),Spacer(1,4*mm),
              P('Tahap ini berisi evaluasi, naskah dan storyboard tertulis. Belum ada video atau persetujuan produksi/tayang.','small'),PageBreak()]
    story += [P('01  /  PILIHAN ARAH','eyebrow'),P('Mengapa mulai dari sini?','title'),
              P('Empat arah berikut punya potensi cerita. Penilaian ini hipotesis editorial, bukan hasil uji penonton.','body')]
    rows=[('Arah','Situasi & pertanyaan','Batas utama'),
          ('Orang vs usul','Tunggakan benar, tapi apakah tangganya aman?','Iuran tetap penting; usul tidak otomatis benar.'),
          ('Pilihan sempit','Haruskah setuju dengan cara agar dianggap mendukung tujuan?','Alternatif harus benar-benar layak.'),
          ('Merasa dikekang','Benarkah ia menolak karena merasa pilihannya dibatasi?','Respons dan motif tidak bisa dipastikan dari satu kejadian.'),
          ('Reverse psychology','Seseorang menyatakan kebalikan dari keinginannya. Bagaimana jika dipercaya?','Bukan sinonim reaksi terhadap larangan; hasil tak dijamin.')]
    story += [review_table(rows,[38*mm,72*mm,60*mm]),Spacer(1,6*mm),
              P('Pilihan pertama: orang vs usul','heading'),
              P('Bendanya jelas, konfliknya dekat dengan percakapan sehari-hari, dan penonton bisa berada di dua posisi: orang yang diserang dan orang yang kemudian menilai orang lain. Naskah tidak perlu mengucapkan istilah teknisnya.','body'),
              P('Dua hal yang tidak saling menghapus','heading'),
              P('Dalam cerita ini Nara memang menunggak. Itu perlu dicari jalan keluarnya, apalagi jika perbaikan memakai uang bersama. Namun kondisi tangga harus diperiksa terpisah. Diserang juga tidak membuat usul Nara otomatis benar.','body'),
              P('Memilih orang yang mengurus uang adalah pertanyaan berbeda: pengalaman dan cara membuat laporan bisa relevan. Satu sindiran bukan bukti bahwa Bima akan salah mengurus uang.','body'),PageBreak()]
    story += [P('02  /  NASKAH MASTER','eyebrow'),P('Tangga Itu Masih Licin','title'),
              P('Bagian 1 dari 2  •  Semua nama, tempat, dialog, dan kejadian adalah fiksi.','small')]
    for args in [('Pembuka',1,2,True),('Melihat masalah',3,7,False),('Percakapan bergeser',8,12,False),('Mau membela diri',13,18,False)]:
        story += script_group(master,*args)
    story += [PageBreak(),P('02  /  NASKAH MASTER','eyebrow'),P('Dua masalah, dua pertanyaan','title'),P('Bagian 2 dari 2  •  Jeda dan durasi masih rancangan, belum direkam atau diukur.','small')]
    for args in [('Periksa persoalannya',19,24,False),('Balik posisinya',25,31,False),('Apa yang dikirim?',32,34,False),('Akibat dan penutup',35,39,False)]:
        story += script_group(master,*args)
    story += [PageBreak(),P('03  /  SHORT TURUNAN','eyebrow'),P('Momen yang dibawa dari master','title'),
              P('Versi ringkas, bukan cerita baru: usul ditolak, tunggakan diakui, lalu posisi penonton dibalik. Hasil pemeriksaan tetap dibayar di dalam cerita fiksi.','body')]
    for label,a,b in [('Pembuka & konteks',1,4),('Dua persoalan',5,9),('Tukar posisi & akibat',10,15)]:
        text=' '.join(s['narration'] for s in short[a-1:b]);story += [section(f'{label}  /  T{a:02}–T{b:02}'),P(markup(text),'script')]
    story += [Spacer(1,4*mm),box([P('PETA SHORT KE MASTER', 'label'),P('Setiap adegan Short ditautkan ke adegan master dalam berkas short-sumber-master.json. Durasi dan keterbacaan belum diuji pada video.','box')],bg='#F0E3CD'),PageBreak()]
    story += [P('04  /  RENCANA VISUAL','eyebrow'),P('Benda bergerak karena cerita','title'),
              P('Lebih bervariasi bukan berarti mengganti benda secara acak. Setiap perubahan sudut atau prop harus menambah sebab, akibat, atau sudut pandang.','body')]
    visual=[('Momen','Objek & sudut','Yang berubah'),
            ('Pembuka','Makro pijakan basah + sandal; detail telepon.','Masalah dan pertanyaan muncul segera.'),
            ('Awal','Wide hujan & rumah; medium pegangan; close-up sandal.','Tetangga nyaris terpeleset, lalu Nara melapor.'),
            ('Konflik','Telepon, cangkir Bima, pintu dan tangga.','Pesan tentang tangga tenggelam oleh soal iuran.'),
            ('Pengakuan','Catatan, pensil, amplop, kotak dana.','Tunggakan benar dan biaya bersama diperhitungkan.'),
            ('Balik posisi','Cermin, kursi, kotak dana dan buku kas.','Nara kini menilai Bima sebagai calon pengelola.'),
            ('Payoff','Papan bersama, lembar hasil, dua catatan.','Tangga diperiksa; kedua masalah tetap ada.')]
    story += [review_table(visual,[33*mm,70*mm,67*mm]),Spacer(1,6*mm),
              P('Batas cek visual','heading'),
              P('Setiap scene punya minimal dua objek bernama di storyboard. Fokus utama tidak direncanakan berulang lebih dari dua scene berturut-turut, kecuali ada alasan kontinuitas. Hitungan label bukan bukti gerak atau gambar sudah bervariasi: keduanya perlu diuji pada animatic.','body'),
              P('Hak, disclosure, subtitle, playback penuh, durasi, suara, musik, pembacaan manusia dan respons penonton: BELUM DIUJI. Tidak ada penjadwalan.','small'),PageBreak()]
    story += [P('05  /  BATAS & KEPUTUSAN','eyebrow'),P('Sebelum dilanjutkan','title'),
              P('<b>1. Pilih arah cerita.</b> “Tangga Itu Masih Licin” adalah usulan; topik dan penyampaiannya masih perlu persetujuan pemilik.','body'),
              P('<b>2. Putuskan penutup brand.</b> Arahan baru meminta diskusi dari isi, bukan CTA. Draf ini tidak memakai CTA. Aturan lama meminta “ikuti knot theory”; konfirmasi apakah penutup itu masih ingin dipakai sebagai tambahan terpisah.','body'),
              P('<b>3. Uji naskah dan animatic.</b> Minta reviewer yang belum mengenal cerita menjelaskan konflik, dua masalah, pembalikan dan bagian yang terasa datar. Uji visual, audio, subtitle, fakta, hak dan disclosure sebelum final.','body'),
              P('<b>4. Tetap privat sampai ada izin.</b> Tidak ada suara atau video yang dihasilkan pada tahap evaluasi ini, dan tidak ada publikasi atau jadwal baru.','body'),
              Spacer(1,4*mm),P('Dasar yang ditinjau','heading'),
              P('Internet Encyclopedia of Philosophy — Fallacies, Ad Hominem<br/><link href="https://iep.utm.edu/fallacy/#AdHominem" color="#277478">iep.utm.edu/fallacy/#AdHominem</link>','small'),
              P('UNC Writing Center — Fallacies<br/><link href="https://writingcenter.unc.edu/tips-and-tools/fallacies/" color="#277478">writingcenter.unc.edu/tips-and-tools/fallacies/</link>','small'),
              P('Reynolds-Tylus (2019), ulasan reactance dalam komunikasi kesehatan<br/><link href="https://doi.org/10.3389/fcomm.2019.00056" color="#277478">doi.org/10.3389/fcomm.2019.00056</link>','small'),
              P('MacDonald, Nail &amp; Harper (2011), reverse psychology: self-report, bukan jaminan efektivitas. Hanya abstrak/cuplikan pencarian yang terbaca; teks penuh belum diverifikasi melalui fetch.<br/><link href="https://doi.org/10.1080/15534510.2010.517282" color="#277478">doi.org/10.1080/15534510.2010.517282</link>','small'),
              Spacer(1,3*mm),box([P('STATUS YANG JUJUR','label'),P('Struktur dan cakupan audit dapat diuji secara mekanis. Kualitas cerita, respons audiens, ritme dan kelayakan tayang tetap membutuhkan manusia.', 'box')])]
    doc.build(story)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--out',required=True,help='PDF destination inside repo .scratch')
    args=parser.parse_args();out=Path(args.out).expanduser().resolve()
    if out.suffix.lower()!='.pdf' or not out.is_relative_to(SCRATCH):
        parser.error('output must be a .pdf inside .scratch')
    out.parent.mkdir(parents=True,exist_ok=True);build(out);print('Wrote private draft:',out)
if __name__=='__main__':main()
