"""UV-space painting helpers.

The MakeHuman-derived mesh ships with authored UVs, but the UV layout is not
documented. Instead of guessing island positions we rasterise *every triangle
into UV space* while interpolating the 3D position and normal of the surface.
After that, textures can be painted from real anatomical landmarks in 3D
(eye bones, mouth, nose tip, nails...) and stay perfectly aligned to the mesh.
"""
from __future__ import annotations

import numpy as np

F = np.float32


def rasterize_uv(pos, uv, idx, size=1024):
    """Return (pos_map, nrm_map, mask) in UV space; pos_map holds model-space XZY."""
    pos = np.asarray(pos, F)
    uv = np.asarray(uv, F)
    tris = np.asarray(idx, np.int64).reshape(-1, 3)
    P = np.zeros((size, size, 3), F)
    N = np.zeros((size, size, 3), F)
    M = np.zeros((size, size), bool)
    tri = pos[tris]
    e1 = tri[:, 1] - tri[:, 0]
    e2 = tri[:, 2] - tri[:, 0]
    fn = np.cross(e1, e2)
    fn /= np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-12)
    uvt = uv[tris] * size
    for t in range(len(tris)):
        a, b, c = uvt[t]
        x0 = max(int(np.floor(min(a[0], b[0], c[0]))), 0)
        x1 = min(int(np.ceil(max(a[0], b[0], c[0]))), size - 1)
        y0 = max(int(np.floor(min(a[1], b[1], c[1]))), 0)
        y1 = min(int(np.ceil(max(a[1], b[1], c[1]))), size - 1)
        if x1 < x0 or y1 < y0:
            continue
        area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])
        if abs(area) < 1e-12:
            continue
        px = np.arange(x0, x1 + 1, dtype=F)[None, :] + 0.5
        py = np.arange(y0, y1 + 1, dtype=F)[:, None] + 0.5
        w0 = ((b[0] - px) * (c[1] - py) - (c[0] - px) * (b[1] - py)) / area
        w1 = ((c[0] - px) * (a[1] - py) - (a[0] - px) * (c[1] - py)) / area
        w2 = 1.0 - w0 - w1
        m = (w0 >= -2e-3) & (w1 >= -2e-3) & (w2 >= -2e-3)
        if not m.any():
            continue
        wsum = np.maximum(w0 + w1 + w2, 1e-6)
        w0, w1, w2 = w0 / wsum, w1 / wsum, w2 / wsum
        pm = w0[..., None] * tri[t, 0] + w1[..., None] * tri[t, 1] + w2[..., None] * tri[t, 2]
        nm = w0[..., None] * fn[t] + w1[..., None] * fn[t] + w2[..., None] * fn[t]
        dst = P[y0 : y1 + 1, x0 : x1 + 1]
        dst[m] = pm[m]
        N[y0 : y1 + 1, x0 : x1 + 1][m] = nm[m]
        M[y0 : y1 + 1, x0 : x1 + 1] |= m
    ln = np.linalg.norm(N, axis=-1, keepdims=True)
    N = N / np.maximum(ln, 1e-9)
    return P, N, M


def fill_holes(pos_map, mask, passes=3):
    """Flood the unmapped gutter with neighbourhood averages (avoids seams)."""
    P = pos_map.copy()
    M = mask.copy()
    for _ in range(passes):
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            src = np.roll(np.roll(P, dy, 0), dx, 1)
            srcm = np.roll(np.roll(M, dy, 0), dx, 1) & ~M
            P[srcm] = src[srcm]
            M = M | srcm
    return P, M


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def ellipse(d, radii, soft=0.35):
    r = np.sqrt(sum((d[i] / radii[i]) ** 2 for i in range(len(radii))))
    return 1.0 - smoothstep((r - (1 - soft)) / max(soft, 1e-4))


def band(v, lo, hi, soft=0.15):
    w = max((hi - lo) * soft, 1e-5)
    return smoothstep((v - lo) / w) * (1 - smoothstep((v - hi) / w))


def line_yz(y, z, y0, z0, y1, z1, width, soft=0.5):
    """Distance-based soft line mask in the YZ plane (for wrinkle strokes)."""
    dy, dz = y1 - y0, z1 - z0
    L2 = max(dy * dy + dz * dz, 1e-9)
    t = np.clip(((y - y0) * dy + (z - z0) * dz) / L2, 0, 1)
    py = y0 + t * dy
    pz = z0 + t * dz
    d = np.sqrt((y - py) ** 2 + (z - pz) ** 2)
    return 1.0 - smoothstep((d - width * (1 - soft)) / max(width * soft, 1e-6))


def fbm_uv(size, cells, octaves=4, seed=0, gain=0.5):
    from .tex import fbm

    return fbm(size, size, cells, octaves, gain, seed)


def pore_field(size, seed=0, scale=1.0):
    """High frequency skin micro-relief + a few larger blemishes."""
    from .tex import fbm, speckle, blur

    fine = fbm(size, size, max(2, int(300 * scale)), 2, 0.55, seed)
    dots = speckle(size, size, seed + 1, 5200, (1, 2), (0.0, 1.0))
    dots = blur(dots, 1)
    blem = fbm(size, size, max(2, int(40 * scale)), 2, 0.5, seed + 2)
    return fine * 0.55 + dots * 0.35 + blem * 0.10


def srgb_hex(s):
    s = s.lstrip("#")
    return np.array([int(s[i : i + 2], 16) / 255.0 for i in (0, 2, 4)], F)
