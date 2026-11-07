#!/usr/bin/env python3
"""Generate a human-readable storyboard from the one prepared timeline."""
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2];D=ROOT/'deliverables/awan-500-ton-2026'
p=json.loads((D/'prepared.json').read_text(encoding='utf8'))
def ts(t):return f'{int(t//60):02d}:{t%60:05.2f}'
lines=['# Storyboard — Awan Bisa Menyimpan 500 Ton Air?', '', 'Dunia Kebalik · satu take voice-05 · sembilan adegan · draf privat, belum disetujui publikasi.', '', 'Waktu adegan ditempatkan dekat jeda audio. Timing kata dalam subtitle bersifat perkiraan dan perlu didengar manusia; bukan forced alignment. Gambar dan diagram di bawah tidak berskala.','']
for s,seg in zip(p['story']['scenes'],p['timeline']):
    lines += [f"## {s['id']} · {ts(seg['start'])}–{ts(seg['end'])}", f"**Headline:** {' / '.join(s['headline'])}  ",f"**Tagline:** {s['tagline']}",'',f"**Narasi:** {s['narration']}",'',f"**Aksi:** {s['action']}",'',f"**Objek:** {', '.join(s['objectMap'])}.",'']
lines += ['## Akurasi dan sumber','',p['story']['estimateScope'],'','Perhitungan: 1.000.000.000 m³ × 0,5 g/m³ = 500.000.000 g = 500.000 kg = 500 ton metrik.','']
lines += [f"- {s['label']}: {s['url']} — {s['supports']}" for s in p['story']['sources']]
lines += ['', 'CTA visual dan narasi: **ikuti knot theory**. Pengucapan, waktu subtitle, gerak penuh, hak dan perangkat masih membutuhkan review manusia.','']
(D/'STORYBOARD.md').write_text('\n'.join(lines),encoding='utf8')
print(D/'STORYBOARD.md')
