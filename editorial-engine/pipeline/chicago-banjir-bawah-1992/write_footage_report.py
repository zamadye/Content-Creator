#!/usr/bin/env python3
"""Write factual private draft reports from the actual local technical QC data."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
import sys
import render_rough as rough


def clock(seconds):
    m,s=divmod(round(seconds),60)
    return f'{m}:{s:02}'


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--out',type=Path,required=True)
    a=p.parse_args();out=a.out.resolve()
    if not out.is_relative_to((rough.ROOT/'.scratch').resolve()):raise ValueError('Report must remain private in .scratch.')
    report=json.loads((out/'QA_FOOTAGE_DATA.json').read_text(encoding='utf-8'))
    if report['technical']!='PASS' or set(report['outputs'])!={'master','short'}:raise ValueError('No complete technical QA data.')
    m,s=(report['outputs'][x] for x in ('master','short'))
    def detail(o):
        pct=100*o['nonEventContextFootageSeconds']/o['videoDurationSeconds']
        return (f"{clock(o['videoDurationSeconds'])}; {o['width']} × {o['height']}, 24 fps; "
                f"{o['shotCount']} shot; {o['cueCount']} cue subtitle perkiraan; "
                f"{o['nonEventContextFootageSeconds']:.1f} detik ({pct:.1f}%) footage konteks nonkejadian. "
                f"Di luar itu ada {o['stockWaterTextureDirectSeconds']:.1f} detik tekstur air stok langsung, "
                f"{o['hybridSeconds']:.1f} detik komposit tekstur dan rekonstruksi, serta gambar/skema.")
    text=f'''# Chicago 1992: eksperimen footage — draf privat

> **Untuk ditinjau, bukan persetujuan tayang.** Cerita dan narasi tetap mengacu pada master yang sudah ada; percobaan ini mengganti sebagian visual dengan rekaman bergerak, bukan membuat timeline cerita baru.

## Yang perlu diketahui sebelum menonton

**Tidak satu pun rekaman sumber adalah rekaman banjir Chicago April 1992.** Cuplikan nyata hanya untuk konteks: Chicago sekitar 1974, Sungai Chicago 2014, Metra September 1992 (setelah banjir), dan metro Spanyol 2017 (bukan Chicago). Setiap shot diberi label asal dan batasnya; cuplikan diberi keterangan waktu/lokasi. Beberapa bagian tetap memakai rekonstruksi AI, diagram, dan tekstur air stok dari 2011 dengan lokasi yang tidak diketahui. Tekstur air tidak dipastikan sebagai rekaman peristiwa atau pemandangan air nyata.

- **Master:** {detail(m)}
- **Short mandiri:** {detail(s)}
- Potongan pembuka sekitar {m['firstSceneCutSeconds']:.2f} detik; alur Short tetap memuat konteks peringatan dan hasil putusan. Storyboard shot dan naskah tersedia di paket. Kredit lengkap, tautan lisensi dan perubahan ada pada `KREDIT_FOOTAGE_DRAF.txt` dan caption.

## Pemeriksaan yang sudah dilakukan

- **PASS — pemeriksaan teknis otomatis saja:** seluruh aliran video/audio didekode; jumlah frame master {m['framesDecoded']} dan Short {s['framesDecoded']}; masing-masing H.264, AAC stereo 44,1 kHz. Urutan scene, cakupan shot, struktur SRT dan batas sumber diperiksa terhadap timeline. Ini tidak membuktikan waktu subtitle tepat saat didengar.
- Loudness terukur master {m['loudnessLUFS']:.1f} LUFS dan Short {s['loudnessLUFS']:.1f} LUFS; true peak masing-masing {m['truePeakDBFS']:.1f} dan {s['truePeakDBFS']:.1f} dBFS. Angka pengukuran bukan penilaian kualitas mix.
- Keduanya memiliki thumbnail PNG terpisah dan ada poster 4:5. Subtitle vertikal diangkat dari 18% terbawah sebagai target ruang overlay, **bukan** bukti aman di semua aplikasi dan ponsel.
- Paket juga menyertakan caption draf untuk FB, Instagram, TikTok dan YouTube; SRT/timeline adalah estimasi dan bukan forced alignment.

## Yang belum mendapat persetujuan

- **NOT TESTED:** pemutaran dan pendengaran penuh oleh manusia; sinkronisasi subtitle, kejelasan suara/musik, pergantian gambar dan kenyamanan di ponsel. Sampel frame dan decode otomatis tidak menggantikan pemeriksaan ini.
- **NEEDS REVIEW:** verifikasi independen setiap kalimat, hak tiap klip termasuk hak pihak ketiga, kepatuhan attribution, disclosure AI, thumbnail, dan kebijakan tiap platform. Pernyataan asal/lisensi mengacu pada halaman sumber tetapi belum merupakan izin akhir.
- **NOT TESTED:** penilaian penonton yang belum tahu cerita, respons emosional, dan persetujuan rilis. Tidak ada penjadwalan atau publikasi. Gate prevoice manusia master masih belum terpenuhi; Short belum memiliki gate prevoice kompatibel.
- Jika platform mewajibkan label AI, hentikan dan konsultasikan sebelum publikasi; jangan menyatakan bahwa karya tidak memakai AI.

## Batas fakta penting

Penjelasan perkara James McTigue mengikuti [putusan banding Illinois](https://www.courtlistener.com/opinion/2115818/mctigue-v-personnel-bd-of-chicago/): pemecatan dibatalkan, tetapi dua temuan terkait tindakannya sebelum 13 Maret tetap berlaku. Cerita pusaran di tepi sungai diatribusikan pada penuturan Larry Langford dalam [WBEZ](https://www.wbez.org/curious-city/2016/08/21/why-the-1992-loop-flood-is-the-most-chicago-story-ever); tidak menyatakan bahwa ia melihatnya di jembatan. Laporan [LA Times](https://www.latimes.com/archives/la-xpm-1992-04-15-mn-141-story.html) dan [US Army Corps of Engineers](https://web.archive.org/web/20080607013746/http:/www.hq.usace.army.mil/CEPA/PUBS/may02/story10.htm) mendukung konteks kronologi, dengan batas yang tertulis dalam audit naskah. Periksa seluruh audit dan sumber sebelum rilis.

## Identitas dua file MP4

- Master SHA-256: `{m['sha256']}`
- Short SHA-256: `{s['sha256']}`

Asli dan hasil MP4 disimpan terpisah dari checkpoint privat. Belum ada izin untuk mengubah akses menjadi publik atau memasukkan video ini ke antrean Buffer.
'''
    (out/'LAPORAN_FOOTAGE_DRAF.txt').write_text(text,encoding='utf-8')
    qa=f'''QA TEKNIS — DRAF PRIVAT, BUKAN PERSETUJUAN TAYANG

PASS: decode otomatis penuh, codec/frame/durasi, urutan scene/shot, struktur SRT, batas cuplikan dan dimensi gambar. Cakupan ini TIDAK menilai akurasi cerita, mutu estetika atau persepsi penonton.
MASTER: {detail(m)}
  SHA-256 {m['sha256']}
  MD5 {m['md5']}
  Frame terdekode {m['framesDecoded']}; LUFS {m['loudnessLUFS']}; true peak {m['truePeakDBFS']} dBFS.
SHORT: {detail(s)}
  SHA-256 {s['sha256']}
  MD5 {s['md5']}
  Frame terdekode {s['framesDecoded']}; LUFS {s['loudnessLUFS']}; true peak {s['truePeakDBFS']} dBFS.

NEEDS REVIEW: fakta, hak, atribusi, kebijakan/disclosure, visual, framing dan keamanan overlay platform.
NOT TESTED: tonton dan dengar penuh, sinkron subtitle manual, review independen, penonton, izin rilis/penjadwalan.
Tekstur air stok tidak dihitung sebagai footage konteks. Tidak ada sumber yang merupakan rekaman banjir Chicago April 1992.
'''
    (out/'QA_FOOTAGE_DRAF.txt').write_text(qa,encoding='utf-8')
    print('Wrote draft reports; human/editorial/rights checks remain NOT TESTED.')


if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,OSError,json.JSONDecodeError) as e:
        print('ERROR:',e,file=sys.stderr);raise SystemExit(1)
