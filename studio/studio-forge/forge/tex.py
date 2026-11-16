"""Procedural PBR texture synthesis with numpy.

Every generator returns a dict with real maps at the requested resolution:
    base : (H,W,3) float 0..1  — sRGB colour, written as JPEG
    normal : (H,W,3) float 0..1 — OpenGL tangent-space normal, JPEG
    orm  : (H,W,3) float 0..1 — R=AO, G=roughness, B=metallic, JPEG
Extra maps (emissive, alpha) are added only when the material needs them.

All noise is tileable so textures repeat without seams on modular geometry.
"""
from __future__ import annotations

import numpy as np

F = np.float32


# ------------------------------------------------------------------ primitives
def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(int(seed) & 0xFFFFFFFF)


def value_noise(h: int, w: int, cells: int | tuple, seed: int, smooth: bool = True) -> np.ndarray:
    """Tileable bilinear/smoothstep value noise in [0,1]."""
    cy, cx = (cells, cells) if isinstance(cells, int) else cells
    cy, cx = max(1, int(cy)), max(1, int(cx))
    g = _rng(seed).random((cy + 1, cx + 1), dtype=np.float32)
    g[-1, :] = g[0, :]
    g[:, -1] = g[:, 0]
    ys = np.linspace(0, cy, h, endpoint=False, dtype=np.float32)
    xs = np.linspace(0, cx, w, endpoint=False, dtype=np.float32)
    y0 = np.floor(ys).astype(int)
    x0 = np.floor(xs).astype(int)
    fy = ys - y0
    fx = xs - x0
    if smooth:
        fy = fy * fy * (3 - 2 * fy)
        fx = fx * fx * (3 - 2 * fx)
    y1 = (y0 + 1) % (cy + 1)
    x1 = (x0 + 1) % (cx + 1)
    a = g[y0][:, x0]
    b = g[y0][:, x1]
    c = g[y1][:, x0]
    d = g[y1][:, x1]
    fy = fy[:, None]
    fx = fx[None, :]
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy


def fbm(h: int, w: int, cells: int | tuple, octaves: int = 5, gain: float = 0.5, seed: int = 0, lacunarity: int = 2) -> np.ndarray:
    total = np.zeros((h, w), dtype=F)
    amp, norm = 1.0, 0.0
    c = cells
    for o in range(octaves):
        total += amp * value_noise(h, w, c, seed + o * 7919)
        norm += amp
        amp *= gain
        if isinstance(c, int):
            c = c * lacunarity
        else:
            c = (c[0] * lacunarity, c[1] * lacunarity)
    return total / norm


def ridged(h, w, cells, octaves=4, seed=0) -> np.ndarray:
    n = fbm(h, w, cells, octaves, 0.55, seed)
    return 1.0 - np.abs(n * 2 - 1)


def blur(a: np.ndarray, radius: int, wrap=True) -> np.ndarray:
    """Separable box blur (repeat `radius` for a gaussian-ish falloff)."""
    if radius < 1:
        return a
    out = a.astype(F)
    for _ in range(2):
        for axis in (0, 1):
            k = 2 * radius + 1
            pad = [(0, 0), (0, 0)]
            if wrap:
                acc = np.zeros_like(out)
                for i in range(-radius, radius + 1):
                    acc += np.roll(out, i, axis=axis)
                out = acc / k
            else:
                pw = [(radius, radius) if i == axis else (0, 0) for i in range(2)]
                p = np.pad(out, pw, mode="edge")
                if axis == 0:
                    out = sum(p[i : i + out.shape[0]] for i in range(k)) / k
                else:
                    out = sum(p[:, i : i + out.shape[1]] for i in range(k)) / k
    return out


def warp(field: np.ndarray, dx: np.ndarray, dy: np.ndarray, amount: float) -> np.ndarray:
    h, w = field.shape
    yy, xx = np.mgrid[0:h, 0:w].astype(F)
    xs = (xx + dx * amount * w).astype(np.int32) % w
    ys = (yy + dy * amount * h).astype(np.int32) % h
    return field[ys, xs]


def height_to_normal(height: np.ndarray, strength: float = 2.0) -> np.ndarray:
    dx = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * 0.5 * strength
    dy = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * 0.5 * strength
    nx, ny, nz = -dx, dy, np.ones_like(height)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz)
    return np.stack([nx / ln * 0.5 + 0.5, ny / ln * 0.5 + 0.5, nz / ln * 0.5 + 0.5], axis=-1)


def cavity_ao(height: np.ndarray, radius: int = 6, strength: float = 0.55) -> np.ndarray:
    """Cheap AO from local height deficit (crevices darker)."""
    base = blur(height, radius)
    ao = 1.0 - np.clip((base - height) * 3.0, 0, 1) * strength
    return np.clip(ao, 0.2, 1.0)


def orm(ao, rough, metal) -> np.ndarray:
    shape = np.shape(ao)
    out = []
    for v in (ao, rough, metal):
        a = np.full(shape, v, F) if np.ndim(v) == 0 else np.asarray(v, F)
        out.append(np.clip(a, 0, 1))
    return np.stack(out, axis=-1)


def tint(gray, color) -> np.ndarray:
    c = np.asarray(color, dtype=F)
    g = np.asarray(gray, F)
    if g.ndim == 2:
        g = g[..., None]
    if g.ndim == 1:
        g = g[None, None, :]
    return np.clip(g * c[None, None, :], 0, 1)


def overlay(base: np.ndarray, layer: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    if alpha.ndim == 2:
        alpha = alpha[..., None]
    return base * (1 - alpha) + layer * alpha


def streaks(h, w, seed, count=40, width=(1, 4), vertical=True, length=(0.15, 0.9)):
    """Random dark/light vertical stains; returns additive mask."""
    rng = _rng(seed)
    img = np.zeros((h, w), dtype=F)
    for _ in range(count):
        cw = rng.integers(width[0], width[1] + 1)
        x = int(rng.integers(0, w))
        ln = int(h * rng.uniform(*length))
        y0 = int(rng.integers(-h // 3, h))
        val = rng.uniform(0.2, 1.0)
        for i in range(ln):
            y = (y0 + i) % h
            fade = 1.0 - i / max(ln, 1)
            x0 = (x + int(2 * np.sin(i * 0.03 + rng.random() * 6))) % w
            for k in range(cw):
                img[y, (x0 + k) % w] = max(img[y, (x0 + k) % w], val * fade)
    return img


def cracks(h, w, seed, count=14, thickness=2, darkness=0.75, steps=(20, 70)) -> np.ndarray:
    rng = _rng(seed)
    img = np.zeros((h, w), dtype=F)
    for _ in range(count):
        x, y = rng.integers(0, w), rng.integers(0, h)
        ang = rng.uniform(0, 2 * np.pi)
        for _ in range(int(rng.integers(*steps))):
            ang += rng.normal(0, 0.35)
            x = (x + np.cos(ang) * 1.6) % w
            y = (y + np.sin(ang) * 1.6) % h
            for t in range(thickness):
                img[int(y) % h, (int(x) + t) % w] = darkness * rng.uniform(0.5, 1.0)
    return img


def speckle(h, w, seed, count, size=(1, 3), value=(0.0, 1.0), shape=None):
    rng = _rng(seed)
    img = np.zeros((h, w), dtype=F)
    for _ in range(count):
        s = int(rng.integers(size[0], size[1] + 1))
        x, y = int(rng.integers(0, w)), int(rng.integers(0, h))
        v = rng.uniform(*value)
        img[y : y + s, x : x + s] = v
        if x + s > w:
            img[y : y + s, : (x + s) % w] = v
        if y + s > h:
            img[: (y + s) % h, x : x + s] = v
    return img


def gradient(h, w, top=0.0, bottom=1.0) -> np.ndarray:
    return np.linspace(top, bottom, h, dtype=F)[:, None] * np.ones((1, w), dtype=F)


def hexc(s: str):
    s = s.lstrip("#")
    return tuple(int(s[i : i + 2], 16) / 255.0 for i in (0, 2, 4))


# ------------------------------------------------------------------- materials
def asphalt(seed=11, wet=False, size=1024):
    s = size
    agg = fbm(s, s, 90, 3, 0.6, seed) * 0.55 + fbm(s, s, 260, 2, 0.5, seed + 3) * 0.45
    coarse = speckle(s, s, seed + 9, 2600, (1, 3), (0.55, 1.0))
    fine = fbm(s, s, 400, 1, 0.5, seed + 5)
    base = 0.30 + agg * 0.16 + fine * 0.06 + coarse * 0.10
    base = tint(base, (0.62, 0.62, 0.63))
    cr = cracks(s, s, seed + 21, 10, 2, 0.55, (18, 60))
    base = base * (1 - cr[..., None] * 0.75)
    patch = (fbm(s, s, 5, 2, 0.5, seed + 33) > 0.62).astype(F)
    patch = blur(patch, 3)
    base = overlay(base, base * 0.72, patch * 0.9)
    oil = np.clip((fbm(s, s, 7, 2, 0.5, seed + 41) - 0.62) * 4, 0, 1)
    base = overlay(base, base * 0.55, blur(oil, 5) * 0.7)
    height = 0.55 + agg * 0.22 + coarse * 0.22 - cr * 0.55
    rough = 0.80 + fine * 0.14 - oil * 0.25
    metal = np.full((s, s), 0.0, F)
    if wet:
        puddle = np.clip((fbm(s, s, 4, 3, 0.55, seed + 77) - 0.46) * 3.2, 0, 1)
        puddle = blur(puddle, 4)
        base = overlay(base, base * 0.55, puddle * 0.85)
        rough = rough * (1 - puddle * 0.85) + 0.06 * puddle
        height = height * (1 - puddle * 0.7)
    normal = height_to_normal(height, 2.4 if not wet else 1.5)
    ao = cavity_ao(height, 5, 0.4)
    return {"base": np.clip(base, 0, 1), "normal": normal, "orm": orm(ao, rough, metal)}


def concrete(seed=21, dirty=0.5, size=512):
    s = size
    n = fbm(s, s, 24, 4, 0.55, seed)
    grain = fbm(s, s, 220, 2, 0.5, seed + 4)
    base = 0.60 + n * 0.16 + grain * 0.07
    base = tint(base, (0.93, 0.93, 0.90))
    base = overlay(base, base * 0.5, cracks(s, s, seed + 8, 6, 1, 0.7) * 0.8)
    st = blur(streaks(s, s, seed + 12, 26, (2, 7)), 2)
    base = overlay(base, base * 0.72, st * dirty)
    pits = speckle(s, s, seed + 15, 900, (1, 2), (0.35, 0.9))
    base = base * (1 - pits[..., None] * 0.25)
    height = 0.5 + grain * 0.16 + n * 0.08 - pits * 0.35
    rough = 0.85 + grain * 0.1 - st * 0.05
    return {"base": base, "normal": height_to_normal(height, 1.6), "orm": orm(cavity_ao(height, 4, 0.45), rough, np.zeros((s, s), F))}


def plaster(seed=31, peel=0.5, size=1024, tone="#c9c2b2"):
    s = size
    col = np.asarray(hexc(tone), F)
    n = fbm(s, s, 18, 4, 0.55, seed)
    fine = fbm(s, s, 180, 3, 0.5, seed + 2)
    base = 0.72 + n * 0.20 + fine * 0.08
    base = tint(base, col)
    # peeling patches expose grey render beneath
    pm = np.clip((fbm(s, s, 9, 3, 0.55, seed + 17) - (0.72 - peel * 0.14)) * 6, 0, 1)
    pm = blur(pm, 2)
    expose = tint(0.42 + fine * 0.2, (0.80, 0.79, 0.76))
    base = overlay(base, expose, pm * 0.95)
    st = blur(streaks(s, s, seed + 27, 46, (2, 9), length=(0.2, 1.0)), 2)
    base = overlay(base, base * 0.66, st * 0.85)
    grime = np.clip((gradient(s, s, 0, 1) - 0.55) * 2.4, 0, 1) * 0.5
    base = overlay(base, base * 0.55, grime)
    cr = cracks(s, s, seed + 31, 16, 1, 0.85, (25, 80))
    base = base * (1 - cr[..., None] * 0.8)
    height = 0.55 + fine * 0.14 - pm * 0.30 - cr * 0.5 + n * 0.05
    rough = 0.88 + fine * 0.1 - st * 0.06
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 2.0), "orm": orm(cavity_ao(height, 4, 0.5), rough, np.zeros((s, s), F))}


def brick(seed=41, size=512, tone="#8d4b3a", mortar="#b9b3a5"):
    s = size
    rng = _rng(seed)
    rows, cols = 12, 6
    bh, bw = s // rows, s // cols
    base = np.zeros((s, s, 3), F)
    height = np.zeros((s, s), F)
    rough = np.zeros((s, s), F)
    mc = np.asarray(hexc(mortar), F)
    base[:] = mc
    height[:] = 0.25
    rough[:] = 0.95
    for r in range(rows):
        off = (bw // 2) if r % 2 else 0
        for c in range(cols):
            c0 = col0 = (c * bw + off) % s
            y0, y1 = r * bh + 2, (r + 1) * bh - 2
            xs = np.arange(col0, col0 + bw - 3) % s
            ys = np.arange(y0, y1)
            vari = rng.uniform(0.82, 1.12)
            noise = fbm(s, s, 60, 2, 0.5, seed + r * 13 + c)[np.ix_(ys, xs)]
            col = np.asarray(hexc(tone), F) * vari
            base[np.ix_(ys, xs)] = np.clip(col[None, None, :] * (0.88 + noise[..., None] * 0.28), 0, 1)
            height[np.ix_(ys, xs)] = 0.65 + noise * 0.15
            rough[np.ix_(ys, xs)] = 0.82 + noise * 0.12
            chips = (fbm(s, s, 30, 2, 0.5, seed + 5 + r + c)[np.ix_(ys, xs)] > 0.78)
            base[np.ix_(ys, xs)][chips] *= 0.75
    fine = fbm(s, s, 200, 2, 0.5, seed + 9)
    base = np.clip(base * (0.92 + fine[..., None] * 0.16), 0, 1)
    st = blur(streaks(s, s, seed + 44, 30, (2, 6)), 2)
    base = overlay(base, base * 0.6, st * 0.7)
    height = 0.5 + (height - 0.5) * 1.1 + fine * 0.08
    return {"base": base, "normal": height_to_normal(height, 2.6), "orm": orm(cavity_ao(height, 3, 0.6), rough, np.zeros((s, s), F))}


def wood_planks(seed=51, size=1024, tone="#6f543c", planks=8, vertical=True):
    s = size
    rng = _rng(seed)
    col = np.asarray(hexc(tone), F)
    yy, xx = np.mgrid[0:s, 0:s].astype(F)
    across = (xx if not vertical else yy) / s
    along = (yy if not vertical else xx) / s
    warp_n = fbm(s, s, 12, 3, 0.5, seed)
    grain = np.sin((across * planks * 2 * np.pi) + warp_n * 9.0 + fbm(s, s, 120, 2, 0.5, seed + 1) * 3.0)
    grain = (grain * 0.5 + 0.5) ** 1.6
    base = 0.55 + grain * 0.35 + fbm(s, s, 300, 2, 0.5, seed + 2) * 0.1
    base = tint(base, col)
    # plank separation and per-plank tone
    pl = (across * planks)
    pid = np.floor(pl).astype(int) % planks
    tone_jit = (np.sin(pid * 12.9898) * 43758.5453) % 1.0
    base = base * (0.86 + tone_jit[..., None] * 0.26)
    gap = np.abs((pl % 1.0) - 0.5) > 0.455
    gap = blur(gap.astype(F), 1)
    base = base * (1 - gap[..., None] * 0.72)
    knots = np.zeros((s, s), F)
    for _ in range(4):
        kx, ky = rng.integers(0, s, 2)
        d = np.sqrt(((xx - kx) / s) ** 2 + ((yy - ky) / s) ** 2)
        knots = np.maximum(knots, np.clip(1 - d * 26, 0, 1))
    base = overlay(base, base * 0.6, knots * 0.85)
    height = 0.5 + grain * 0.1 - gap * 0.45 - knots * 0.2
    rough = 0.80 + grain * 0.12
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 2.2), "orm": orm(cavity_ao(height, 4, 0.5), rough, np.zeros((s, s), F))}


def bark(seed=61, size=512, tone="#5d4a38", kind="karet"):
    s = size
    stretch = {"karet": (2, 40), "beringin": (3, 22), "palm": (2, 10), "dead": (2, 60)}.get(kind, (2, 30))
    n = fbm(s, s, stretch, 4, 0.6, seed)
    ridge = ridged(s, s, (6, 40), 3, seed + 2)
    base = 0.42 + n * 0.30 + ridge * 0.22
    base = tint(base, np.asarray(hexc(tone), F) * (1.05 if kind == "beringin" else 1.0))
    if kind == "karet":
        # rubber trees: pale grey-green patches and latex scars
        scars = np.clip((fbm(s, s, 18, 3, 0.5, seed + 9) - 0.68) * 5, 0, 1)
        base = overlay(base, np.full_like(base, 0.72), scars * 0.55)
    moss = np.clip((fbm(s, s, 20, 3, 0.5, seed + 13) - 0.62) * 3.4, 0, 1)
    base = overlay(base, tint(0.35 + n * 0.2, (0.28, 0.38, 0.22)), moss * 0.5)
    height = 0.5 + n * 0.35 + ridge * 0.2
    rough = 0.88 + n * 0.1
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 3.0), "orm": orm(cavity_ao(height, 5, 0.6), rough, np.zeros((s, s), F))}


def foliage(seed=71, size=512, tone="#4d6b3a", alpha=False):
    s = size
    rng = _rng(seed)
    yy, xx = np.mgrid[0:s, 0:s].astype(F)
    # leaf clusters: several overlapping pointed leaves
    base = np.zeros((s, s, 3), F) + np.asarray(hexc(tone), F) * 0.35
    height = np.zeros((s, s), F)
    cover = np.zeros((s, s), F)
    for i in range(46):
        cx, cy = rng.uniform(0, 1) * s, rng.uniform(0, 1) * s
        ang = rng.uniform(0, np.pi)
        ln = rng.uniform(0.10, 0.30) * s
        wd = ln * rng.uniform(0.18, 0.34)
        dx, dy = np.cos(ang), np.sin(ang)
        u = ((xx - cx) * dx + (yy - cy) * dy) / ln
        v = (-(xx - cx) * dy + (yy - cy) * dx) / wd
        m = (np.abs(u) < 1) & (np.abs(v) < (1 - np.abs(u) ** 1.4) * 1.1)
        shade = rng.uniform(0.7, 1.15)
        vein = 1 - np.clip(np.abs(v) * 5, 0, 1) * 0.35
        col = np.asarray(hexc(tone), F) * shade
        base[m] = np.clip(col[None, :] * (0.85 + vein[m][:, None] * 0.3), 0, 1)
        height[m] = 0.7 * shade
        cover = np.maximum(cover, m.astype(F))
    height = blur(height, 1) + fbm(s, s, 120, 2, 0.5, seed + 5) * 0.05
    rough = 0.7 + fbm(s, s, 100, 2, 0.5, seed + 8) * 0.2
    out = {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 1.2), "orm": orm(cavity_ao(height, 3, 0.5), rough, np.zeros((s, s), F))}
    if alpha:
        out["alpha"] = blur(cover, 1)
    return out


def thatch(seed=81, size=512, tone="#9a7c4f"):
    s = size
    rng = _rng(seed)
    yy, xx = np.mgrid[0:s, 0:s].astype(F)
    base = np.zeros((s, s, 3), F)
    height = np.zeros((s, s), F)
    for row in range(22):
        y0 = row * s / 22
        for i in range(70):
            x0 = rng.uniform(0, s)
            ln = rng.uniform(0.04, 0.14) * s
            wd = rng.uniform(1.0, 2.6)
            shade = rng.uniform(0.72, 1.18)
            u = ((xx - x0) % s) / ln
            v = (yy - y0) / wd
            m = (u < 1) & (np.abs(v) < 1) & (((xx - x0) % s) == ((xx - x0) % s))
            m &= (yy >= y0) & (yy < y0 + wd)
            col = np.asarray(hexc(tone), F) * shade
            base[m] = col
            height[m] = 0.75
    base = np.where(base.sum(-1, keepdims=True) < 0.05, np.asarray(hexc(tone), F) * 0.5, base)
    height = blur(height, 1) + fbm(s, s, 90, 2, 0.5, seed + 3) * 0.12
    rough = 0.95 + fbm(s, s, 120, 1, 0.5, seed + 4) * 0.05
    return {"base": np.clip(base * (0.9 + fbm(s, s, 30, 2, 0.5, seed + 7)[..., None] * 0.3), 0, 1), "normal": height_to_normal(height, 2.4), "orm": orm(cavity_ao(height, 4, 0.6), rough, np.zeros((s, s), F))}


def corrugated(seed=91, size=512, tone="#8a8f8c", rust=0.55, ribs=26):
    s = size
    yy, xx = np.mgrid[0:s, 0:s].astype(F)
    rib = np.sin(xx / s * ribs * 2 * np.pi)
    height = 0.5 + rib * 0.35
    n = fbm(s, s, 20, 4, 0.55, seed)
    base = tint(0.75 + n * 0.25, hexc(tone))
    rm = np.clip((fbm(s, s, 14, 3, 0.55, seed + 7) - (0.75 - rust * 0.3)) * 5, 0, 1)
    rm = blur(rm, 2) * (0.55 + 0.45 * np.clip(rib * 0.5 + 0.5, 0, 1))
    rust_col = tint(0.45 + n * 0.35, (0.62, 0.31, 0.16))
    base = overlay(base, rust_col, rm * 0.95)
    metal = 0.85 * (1 - rm)
    rough = 0.42 + n * 0.2 + rm * 0.5
    height = height + n * 0.1 - rm * 0.12
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 2.8), "orm": orm(cavity_ao(height, 3, 0.4), rough, metal)}


def roof_tile(seed=101, size=512, tone="#7b4436"):
    s = size
    yy, xx = np.mgrid[0:s, 0:s].astype(F)
    rows, cols = 10, 8
    ry = (yy / s * rows)
    cx = (xx / s * cols + 0.5 * (np.floor(ry) % 2))
    rib = np.cos((cx % 1.0 - 0.5) * np.pi)
    height = 0.5 + rib * 0.3
    height -= (np.abs((ry % 1.0) - 0.5) > 0.44).astype(F) * 0.25
    n = fbm(s, s, 60, 3, 0.5, seed)
    base = tint(0.7 + n * 0.3 + rib * 0.15, hexc(tone))
    moss = np.clip((fbm(s, s, 16, 3, 0.5, seed + 5) - 0.6) * 3, 0, 1)
    base = overlay(base, tint(0.4, (0.32, 0.42, 0.26)), moss * 0.55)
    rough = 0.82 + n * 0.12
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 2.6), "orm": orm(cavity_ao(height, 3, 0.5), rough, np.zeros((s, s), F))}


def fabric(seed=111, size=512, color=(0.35, 0.38, 0.34), weave=90, folds=0.55, name="fabric"):
    s = size
    yy, xx = np.mgrid[0:s, 0:s].astype(F)
    w1 = np.sin(xx / s * weave * 2 * np.pi) * 0.5 + 0.5
    w2 = np.sin(yy / s * weave * 2 * np.pi) * 0.5 + 0.5
    thread = (w1 * w2) ** 0.5
    n = fbm(s, s, 30, 3, 0.5, seed)
    fold = fbm(s, (s, s)[1], (6, 3), 3, 0.55, seed + 3)
    base = 0.72 + thread * 0.16 + n * 0.12 + fold * 0.22
    col = np.asarray(color, F)
    base = tint(base, col)
    dirt = blur(streaks(s, s, seed + 11, 14, (3, 12)), 2)
    base = overlay(base, base * 0.7, dirt * 0.35)
    height = 0.5 + thread * 0.18 + fold * 0.25
    rough = 0.90 + thread * 0.06 - fold * 0.05
    metal = np.full((s, s), 0.0, F)
    if name == "leather":
        rough = 0.55 + n * 0.3
        height = 0.5 + n * 0.25
    if name == "denim":
        base = tint(0.6 + thread * 0.3, (0.24, 0.31, 0.45))
        rough = 0.92
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 1.8), "orm": orm(cavity_ao(height, 3, 0.35), rough, metal)}


def painted_metal(seed=121, size=512, color="#3f4a4d", rust=0.25):
    s = size
    n = fbm(s, s, 40, 3, 0.5, seed)
    base = tint(0.75 + n * 0.25, hexc(color))
    ch = np.clip((fbm(s, s, 18, 3, 0.55, seed + 5) - 0.68) * 6, 0, 1)
    base = overlay(base, tint(0.5 + n * 0.3, (0.55, 0.33, 0.2)), ch * rust)
    st = blur(streaks(s, s, seed + 9, 20, (1, 4)), 2)
    base = overlay(base, base * 0.75, st * 0.3)
    height = 0.5 + n * 0.08 - ch * 0.3
    rough = 0.45 + n * 0.2 + ch * 0.4
    metal = 0.35 * (1 - ch) + 0.8 * ch
    return {"base": base, "normal": height_to_normal(height, 1.4), "orm": orm(cavity_ao(height, 3, 0.4), rough, metal)}


def soil(seed=131, size=512, damp=False):
    s = size
    n = fbm(s, s, 26, 4, 0.55, seed)
    g = speckle(s, s, seed + 3, 2200, (1, 3), (0.3, 1.0))
    peb = fbm(s, s, 140, 2, 0.5, seed + 7)
    base = 0.30 + n * 0.24 + g * 0.12
    base = tint(base, (0.55, 0.44, 0.33) if not damp else (0.34, 0.29, 0.24))
    base = overlay(base, tint(0.55 + peb * 0.2, (0.55, 0.53, 0.48)), np.clip(peb - 0.62, 0, 1) * 2.2)
    height = 0.5 + n * 0.25 + g * 0.25 + peb * 0.2
    rough = 0.95 - (0.15 if damp else 0)
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 2.2), "orm": orm(cavity_ao(height, 4, 0.5), rough, np.zeros((s, s), F))}


def grass(seed=141, size=512):
    s = size
    rng = _rng(seed)
    yy, xx = np.mgrid[0:s, 0:s].astype(F)
    base = np.zeros((s, s, 3), F) + np.asarray(hexc("#2d3b22"), F)
    height = np.zeros((s, s), F)
    for i in range(2600):
        x0, y0 = rng.uniform(0, s), rng.uniform(0, s)
        ang = rng.uniform(-0.5, 0.5) - np.pi / 2
        ln = rng.uniform(0.03, 0.12) * s
        wd = rng.uniform(0.8, 2.0)
        shade = rng.uniform(0.6, 1.25)
        for t in np.linspace(0, 1, 12):
            x = x0 + np.cos(ang) * ln * t
            y = y0 + np.sin(ang) * ln * t
            xi, yi = int(x) % s, int(y) % s
            base[yi, xi] = np.clip(np.asarray(hexc("#587a3c"), F) * shade, 0, 1)
            height[yi, xi] = 0.8
    height = blur(height, 1)
    return {"base": base, "normal": height_to_normal(height, 1.6), "orm": orm(cavity_ao(height, 3, 0.4), 0.9 + fbm(s, s, 40, 2, 0.5, seed + 2) * 0.1, np.zeros((s, s), F))}


def stone(seed=151, size=512, tone="#8d8b84"):
    s = size
    n = fbm(s, s, 16, 4, 0.55, seed)
    g = fbm(s, s, 200, 2, 0.5, seed + 2)
    base = tint(0.60 + n * 0.30 + g * 0.10, hexc(tone))
    cr = cracks(s, s, seed + 5, 10, 1, 0.6)
    base = base * (1 - cr[..., None] * 0.6)
    height = 0.5 + n * 0.3 + g * 0.1 - cr * 0.4
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(height, 2.4), "orm": orm(cavity_ao(height, 4, 0.55), 0.85 + g * 0.1, np.zeros((s, s), F))}


def glass(seed=161, size=256, tint_col=(0.62, 0.68, 0.66)):
    s = size
    n = fbm(s, s, 20, 3, 0.5, seed)
    base = tint(0.85 + n * 0.15, tint_col)
    dirt = blur(streaks(s, s, seed + 3, 30, (2, 8)), 3)
    base = overlay(base, base * 0.7, dirt * 0.5)
    return {"base": np.clip(base, 0, 1), "normal": height_to_normal(0.5 + n * 0.06, 0.8), "orm": orm(np.ones((s, s), F) * 0.9, 0.10 + dirt * 0.4, np.zeros((s, s), F))}


def emissive_panel(seed=171, size=256, color="#ffd9a0", text=None):
    s = size
    base = np.full((s, s, 3), 0.05, F)
    glow = np.clip(fbm(s, s, 8, 2, 0.5, seed) * 0.4 + 0.8, 0, 1)
    em = tint(glow, hexc(color))
    return {"base": base, "normal": height_to_normal(np.full((s, s), 0.5, F), 0.4), "orm": orm(np.ones((s, s), F), 0.35, np.zeros((s, s), F)), "emissive": em}


# ------------------------------------------------------------------ caching
_CACHE = {}


def text_panel(text, sub=None, w=512, h=256, bg="#8d8b80", fg="#232820", seed=201, border=True):
    """Painted lettering on a flat board (papan nama, spanduk, plang)."""
    from PIL import Image, ImageDraw, ImageFont

    yy = fbm(h, w, 18, 3, 0.5, seed)
    img = np.clip(0.86 + (yy[..., None] - 0.5) * 0.22, 0, 1) * np.array(hexc(bg), F)
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    if border:
        d.rectangle([3, 3, w - 4, h - 4], outline=(28, 32, 26), width=max(2, w // 160))
    def fit(text, start, max_w):
        size = int(start)
        while size > 8:
            try:
                f = ImageFont.load_default(size=size)
            except TypeError:
                return ImageFont.load_default()
            if d.textlength(text, font=f) <= max_w:
                return f
            size = int(size * 0.92)
        return ImageFont.load_default()

    f1 = fit(text, h * (0.44 if sub else 0.58), w * 0.86)
    f2 = fit(sub or "", h * 0.26, w * 0.80)
    if sub:
        d.text((w / 2, h * 0.38), text, fill=fg, font=f1, anchor="mm")
        d.text((w / 2, h * 0.74), sub, fill=fg, font=f2, anchor="mm")
    else:
        d.text((w / 2, h * 0.52), text, fill=fg, font=f1, anchor="mm")
    base = np.asarray(im, F) / 255.0
    grime = np.clip((fbm(h, w, 10, 3, 0.55, seed + 5) - 0.55) * 1.8, 0, 1)
    base = base * (1 - grime[..., None] * 0.25) + np.array([0.30, 0.26, 0.20], F) * (grime[..., None] * 0.25)
    height = 0.5 + (base.mean(-1) - 0.5) * 0.35 + fbm(h, w, 120, 2, 0.5, seed + 9) * 0.08
    return {
        "base": np.clip(base, 0, 1),
        "normal": height_to_normal(height, 1.2),
        "orm": orm(np.ones((h, w), F), 0.72 - grime * 0.1, 0.05),
    }


def cached(fn):
    """Memoise texture generators: many assets share the same maps."""
    import functools

    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        key = (fn.__name__, repr(args), repr(sorted(kwargs.items())))
        if key not in _CACHE:
            _CACHE[key] = fn(*args, **kwargs)
        return _CACHE[key]

    return wrapper


for _name in (
    "asphalt",
    "concrete",
    "plaster",
    "brick",
    "wood_planks",
    "bark",
    "foliage",
    "thatch",
    "corrugated",
    "roof_tile",
    "fabric",
    "painted_metal",
    "soil",
    "grass",
    "stone",
    "glass",
    "emissive_panel",
    "text_panel",
):
    globals()[_name] = cached(globals()[_name])
