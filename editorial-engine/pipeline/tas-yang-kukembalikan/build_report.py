#!/usr/bin/env python3
"""Generate a private review report from completed technical QA; not a release receipt."""
import argparse
import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak

ROOT=Path(__file__).resolve().parents[3]
F=ROOT/'editorial-engine/assets/fonts'
pdfmetrics.registerFont(TTFont('Archivo',str(F/'archivo-latin-400-normal.ttf')))
pdfmetrics.registerFont(TTFont('ArchivoBold',str(F/'archivo-latin-700-normal.ttf')))
pdfmetrics.registerFontFamily('Archivo',normal='Archivo',bold='ArchivoBold',italic='Archivo',boldItalic='ArchivoBold')
INK=colors.HexColor('#183c3c');MINT=colors.HexColor('#e7f0e9');CORAL=colors.HexColor('#b55f4c');CREAM=colors.HexColor('#f7efdc')
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleX',fontName='ArchivoBold',fontSize=24,leading=29,textColor=INK,spaceAfter=8))
styles.add(ParagraphStyle(name='LeadX',fontName='Archivo',fontSize=10.8,leading=16,textColor=INK,spaceAfter=9))
styles.add(ParagraphStyle(name='HeadingX',fontName='ArchivoBold',fontSize=14,leading=18,textColor=INK,spaceBefore=7,spaceAfter=7))
styles.add(ParagraphStyle(name='BodyX',fontName='Archivo',fontSize=9.8,leading=15,textColor=INK,spaceAfter=7))
styles.add(ParagraphStyle(name='SmallX',fontName='Archivo',fontSize=8,leading=11,textColor=INK))
styles.add(ParagraphStyle(name='BadgeX',fontName='ArchivoBold',fontSize=10,leading=14,textColor=colors.white))


def P(text,style='BodyX'):return Paragraph(text,styles[style])

def bullet(text):return P('• '+text)

def footer(canvas,doc):
    canvas.setStrokeColor(colors.HexColor('#d9cbb6'));canvas.line(17*mm,16*mm,193*mm,16*mm)
    canvas.setFillColor(INK);canvas.setFont('Archivo',8)
    canvas.drawString(17*mm,11*mm,'KNOT THEORY  /  DRAF PRIVAT  /  CERITA FIKTIF')
    canvas.drawRightString(193*mm,11*mm,str(doc.page))


def main():
    ap=argparse.ArgumentParser();ap.add_argument('--out-dir',type=Path,required=True);args=ap.parse_args()
    if not args.out_dir.resolve().is_relative_to((ROOT/'.scratch').resolve()):ap.error('Output must remain under .scratch')
    qa=json.loads((args.out_dir/'technical-qa.json').read_text(encoding='utf-8'))
    if set(qa['outputs'])!={'master','master-vertical','short'}:raise ValueError('Incomplete technical QA')
    doc=SimpleDocTemplate(str(args.out_dir/'Laporan-review-DRAF-PRIVAT.pdf'),pagesize=(210*mm,297*mm),
        leftMargin=18*mm,rightMargin=18*mm,topMargin=17*mm,bottomMargin=21*mm)
    story=[]
    badge=Table([[P('DRAF PRIVAT  •  BUKAN IZIN TAYANG','BadgeX')]],colWidths=[174*mm])
    badge.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),INK),('LEFTPADDING',(0,0),(-1,-1),9),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    story += [badge,Spacer(1,7*mm),P('Tas yang Kukembalikan','TitleX'),
        P('Ide usaha yang sama, diceritakan dari sisi orang yang mencoba barangnya.','LeadX')]
    im=Image(str(args.out_dir/'thumbnail-master.png'),width=174*mm,height=97.875*mm);story += [im,Spacer(1,5*mm)]
    story += [P('Maya mengembalikan sampel tas milik Nisa dan meminta lebih banyak kantong. Ketika ia memperagakan cara mengambil kartu sambil memegang payung, Nisa menemukan dugaan yang berbeda: masalahnya mungkin akses, bukan jumlah. Tokoh dan kejadian ini <b>fiktif</b>.'),
      P('Bukan cerita “rencana versus tindakan”. Perencanaan, ongkos, mutu, pertanyaan yang tepat dan uji kecil dapat saling melengkapi. Satu pembelian bukan bukti bahwa bisnis pasti berhasil.'),
      P('Yang tersedia','HeadingX'),
      bullet('Master vertikal dan horizontal: masing-masing 2 menit 53,8 detik.'),
      bullet('Short vertikal dari inti konflik dan penemuan: 1 menit 2,6 detik.'),
      bullet('Thumbnail, poster 4:5, caption empat platform, storyboard dan subtitle SRT draf.')]
    story += [PageBreak(),P('Dari referensi ke cerita baru','TitleX'),
      P('Video referensi di Drive diamati lewat sampling visual dan transkripsi mesin yang masih dapat keliru; belum didengarkan penuh oleh manusia. Pembacaan temanya adalah usaha kecil, perencanaan, uji, dan belajar dari tanggapan. Peristiwa dalam referensi tidak diperlakukan sebagai bukti usaha nyata.'),
      P('Yang dipertahankan','HeadingX'),bullet('Kegelisahan seorang pembuat usaha saat memilih antara menyempurnakan ide dan memperoleh masukan.'),
      P('Yang sengaja dibedakan','HeadingX'),
      bullet('Sudut pandang orang pertama dari Maya sebagai peminjam/calon pembeli, bukan membandingkan dua pemilik usaha.'),
      bullet('Tokoh Nisa, tas, halte, kartu, payung, pertanyaan akses dan satu pembelian ditulis untuk cerita ini.'),
      bullet('Tidak menggunakan gambar, suara, dialog khas, logo atau desain karakter dari video referensi. Hak tetap perlu ditinjau independen.'),
      P('Dasar, bukan jaminan','HeadingX'),
      P('Studi Camuffo dkk. (2020; DOI 10.1287/mnsc.2018.3249) membandingkan pelatihan wirausaha umum dengan tambahan pendekatan ilmiah pada 116 startup Italia; kedua kelompok mendapat pelatihan dasar. Replikasi/perluasan 2024 (DOI 10.1002/smj.3580) membahas keputusan mengubah atau menghentikan ide. Studi tidak menguji cerita tas ini dan tidak menjamin sukses.'),
      P('Ceritanya adalah ilustrasi, bukan testimoni, data hasil usaha atau rekomendasi investasi. Sampel kecil tidak otomatis mewakili pasar. Periksa batas produk, keselamatan dan izin sebelum penerapan nyata.')]
    story += [PageBreak(),P('Pemeriksaan & langkah lanjut','TitleX'),
      P('Status pemeriksaan','HeadingX')]
    table=[['Pemeriksaan','Hasil / batas'],
      ['Struktur cerita & audit kalimat','PASS mekanis; tidak menilai kualitas'],
      ['Video 3 versi','PASS full decode H.264/AAC, 24 fps'],
      ['Cut pembuka','2,17 dtk master; 2,04 dtk Short (hitungan frame)'],
      ['Gambar tersampling','30 + 30 + 11 titik tengah scene dibuka; bukan review penuh'],
      ['Narasi & subtitle','NEEDS REVIEW: belum didengarkan penuh; timing perkiraan'],
      ['Animasi & respons penonton','NEEDS REVIEW: rig vektor sederhana, bukan bukti engagement'],
      ['Fakta, hak & disclosure platform','NOT TESTED oleh reviewer independen'],
      ['Persetujuan final / penjadwalan','NOT TESTED; tidak dijadwalkan']]
    rows=[[P(str(x),'SmallX') for x in row] for row in table]
    t=Table(rows,colWidths=[59*mm,115*mm],repeatRows=1,hAlign='LEFT')
    t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),MINT),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f7f5ef')]),('GRID',(0,0),(-1,-1),.4,colors.HexColor('#d8dfd5')),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5)]))
    story += [t,Spacer(1,5*mm),
      P('Sebelum produksi atau unggah final','HeadingX'),
      bullet('Reviewer manusia menilai sebab-akibat, karakter, ritme, emosi dan kalimat, lalu mengisi receipt prevoice yang benar-benar mengikat hash. Receipt kosong saat ini sengaja gagal.'),
      bullet('Dengarkan keseluruhan, perbaiki timing subtitle/gerak, pelafalan nama kanal dan level musik; cek overlay platform pada perangkat nyata.'),
      bullet('Periksa fakta, hak sumber/font/suara dan ketentuan disclosure AI. Jika label diwajibkan atau tidak jelas, jeda; jangan menyangkal AI.'),
      bullet('Master melebihi batas Reels Facebook via Buffer yang sebelumnya ditelusuri (90 detik); Short kandidat berdasarkan durasi, tetap cek aturan saat publikasi. Rilis/jadwal memerlukan izin tersendiri.')]
    doc.build(story,onFirstPage=footer,onLaterPages=footer)
    print(args.out_dir/'Laporan-review-DRAF-PRIVAT.pdf')

if __name__=='__main__':main()
