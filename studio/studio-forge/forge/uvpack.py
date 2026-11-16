"""UV packing sederhana untuk aset statis (kotak/tabung/lathe/kartu daun).

Masalah yang diperbaiki: dulu setiap panggilan `add_raw` memetakan geometrinya
ke 0..1 sendirian, jadi beberapa bagian dalam satu material saling menimpa
(lampu teplok: 66 % texel tertimpa dua bagian). Di sini tiap bagian dianggap
satu pulau UV, lalu disusun rapat (shelf packing) tanpa tumpang tindih.

Yang **tidak** disentuh: material yang UV-nya memang tiling (melewati 0..1),
karena tiling adalah keputusan sadar untuk plester/aspal/kayu.
"""
from __future__ import annotations

import numpy as np

F = np.float32


def _islands_inside(uv, islands, eps=1e-6):
    for a, b in islands:
        u = uv[a:b]
        if u[:, 0].min() < -eps or u[:, 1].min() < -eps or u[:, 0].max() > 1 + eps or u[:, 1].max() > 1 + eps:
            return False
    return True


def _shelf(rects, pad):
    """Susun kotak (w,h) ke dalam 0..1 dengan shelf packing. Kembalikan posisi."""
    order = sorted(range(len(rects)), key=lambda i: -rects[i][1])
    pos = [None] * len(rects)
    x = y = row_h = 0.0
    for i in order:
        w, h = rects[i]
        if x + w + pad > 1.0 and x > 0:
            x = 0.0
            y += row_h + pad
            row_h = 0.0
        if y + h + pad > 1.0:
            return None
        pos[i] = (x, y)
        x += w + pad
        row_h = max(row_h, h)
    return pos


def pack_surface(uv, islands, pad=0.004):
    """Kembalikan UV baru (atau None bila material ini tidak bisa dipadatkan)."""
    if not islands:
        return None
    if not _islands_inside(uv, islands):
        return None
    boxes = []
    for a, b in islands:
        u = uv[a:b]
        boxes.append((float(u[:, 0].min()), float(u[:, 1].min()), float(u[:, 0].max()), float(u[:, 1].max())))
    # satu skala untuk semua pulau supaya kepadatan texel seragam
    scale = 1.0
    for _ in range(24):
        rects = [((x1 - x0) * scale, (y1 - y0) * scale) for x0, y0, x1, y1 in boxes]
        placed = _shelf(rects, pad)
        if placed is not None:
            break
        scale *= 0.88
    else:
        return None
    out = uv.copy()
    for (a, b), (x0, y0, _, _), (px, py) in zip(islands, boxes, placed):
        out[a:b, 0] = (uv[a:b, 0] - x0) * scale + px
        out[a:b, 1] = (uv[a:b, 1] - y0) * scale + py
    return out


def pack_builder(builder, pad=0.004):
    """Padatkan UV semua material yang belum tiling. Kembalikan statistik."""
    stats = {"packed": 0, "skipped": 0, "islands": 0}
    for surf in builder.groups.values():
        if not surf.pos or not surf.islands:
            stats["skipped"] += 1
            continue
        uv = np.vstack(surf.uv)
        new = pack_surface(uv, surf.islands, pad)
        if new is None:
            stats["skipped"] += 1
            continue
        base = 0
        chunks = []
        for chunk in surf.uv:
            n = len(chunk)
            chunks.append(new[base : base + n])
            base += n
        surf.uv = chunks
        stats["packed"] += 1
        stats["islands"] += len(surf.islands)
    return stats
