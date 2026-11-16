"""Bake AO dari geometri nyata ke ruang UV (langkah 19).

Bukan "cavity AO" dari height map: oklusi dihitung dengan menembakkan sinar dari
tiap texel ke setengah bola di sekitar normalnya dan memeriksa apakah sinar itu
menabrak **geometri aset itu sendiri**. Okupansi disimpan sebagai grid voxel
supaya vektorisasi numpy tetap cepat tanpa BVH.

Batas yang disadari: resolusi bake (256 px), jumlah sinar (16), dan ukuran voxel
membuat hasilnya kasar dibanding bake offline (Cycles/xNormal). Tujuannya bukan
menggantikan bake produksi, tapi membuat peta AO yang berasal dari bentuk asli
aset — bukan dari noise permukaan.
"""
from __future__ import annotations

import numpy as np

F = np.float32

# arah sinar: titik-titik Fibonacci di setengah bola +Z, diputar ke frame normal
def _directions(n: int) -> np.ndarray:
    i = np.arange(n) + 0.5
    z = 1.0 - i / n * 0.92  # 1 tidak dipakai penuh supaya tidak menyentuh normal
    phi = np.pi * (1 + 5**0.5) * i
    r = np.sqrt(np.maximum(0.0, 1.0 - z * z))
    return np.stack([r * np.cos(phi), r * np.sin(phi), z], 1).astype(F)


# Sinar yang terlalu mendatar dibuang (bias horizon): pada permukaan datar sinar
# seperti itu menyusur lapisan voxel milik permukaan itu sendiri dan membuat AO
# palsu gelap. Batas 0,2 = ±78° dari normal.
HORIZON = 0.2
DIRS = _directions(16)
DIRS = DIRS[DIRS[:, 2] >= HORIZON]


def _frame(n: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Basis tangen untuk sekumpulan normal (N,3)."""
    n = n / np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
    up = np.where(np.abs(n[:, 2:3]) < 0.9, np.array([[0.0, 0.0, 1.0]], F), np.array([[1.0, 0.0, 0.0]], F))
    t = np.cross(up, n)
    t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
    b = np.cross(n, t)
    return t, b, n


def occupancy(parts, cells: int = 72, pad: float = 0.01) -> dict:
    """Grid voxel dari seluruh geometri (okluder).

    Tiap segitiga diisi titik-titik barysentrik yang cukup rapat sehingga tidak
    ada celah lebih besar dari satu voxel — kalau hanya vertebra segitiga yang
    ditandai, sinar bisa lolos menembus dinding.
    """
    pos = np.vstack([np.asarray(p["pos"], F) for p in parts])
    lo = pos.min(0) - pad
    hi = pos.max(0) + pad
    size = np.maximum(hi - lo, 1e-4)
    voxel = float(np.max(size) / cells)
    dims = np.maximum(np.ceil(size / voxel).astype(int), 1)
    tri_all = np.vstack(
        [np.asarray(p["pos"], F)[np.asarray(p["idx"], np.int64).ravel().reshape(-1, 3)] for p in parts]
    )
    edges = np.stack(
        [
            np.linalg.norm(tri_all[:, 1] - tri_all[:, 0], axis=1),
            np.linalg.norm(tri_all[:, 2] - tri_all[:, 1], axis=1),
            np.linalg.norm(tri_all[:, 0] - tri_all[:, 2], axis=1),
        ],
        1,
    )
    # jumlah subdivisi per segitiga mengikuti sisi terpanjang / ukuran voxel
    k = np.clip(np.ceil(edges.max(1) / voxel).astype(int), 2, 16)
    grid = np.zeros(dims, bool)
    for kk in np.unique(k):
        tris = tri_all[k == kk]
        if not len(tris):
            continue
        n = kk + 1
        i, j = np.meshgrid(np.arange(n), np.arange(n), indexing="ij")
        keep = (i + j) <= kk
        w = np.stack([(kk - i[keep] - j[keep]) / kk, i[keep] / kk, j[keep] / kk], 1).astype(F)
        pts = np.einsum("pw,twc->tpc", w, tris).reshape(-1, 3)
        c = np.clip(np.floor((pts - lo) / voxel).astype(np.int64), 0, dims - 1)
        grid[c[:, 0], c[:, 1], c[:, 2]] = True
    return {"grid": grid, "lo": lo, "voxel": voxel, "dims": dims}


def _rasterize_uv(part, res: int) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Rasterisasi satu primitif di ruang UV → posisi & normal per texel."""
    p = np.asarray(part["pos"], F)
    uv = np.asarray(part["uv"], F)
    nrm = part.get("normals")
    if nrm is None:
        from .kit import compute_normals

        nrm = compute_normals(p, np.asarray(part["idx"], np.int64).ravel())
    nrm = np.asarray(nrm, F)
    idx = np.asarray(part["idx"], np.int64).ravel().reshape(-1, 3)

    pos_buf = np.zeros((res, res, 3), F)
    nrm_buf = np.zeros((res, res, 3), F)
    mask = np.zeros((res, res), bool)

    for tri in idx:
        x = uv[tri, 0] * res
        y = (1 - uv[tri, 1]) * res
        minx, maxx = int(np.floor(x.min())), int(np.ceil(x.max()))
        miny, maxy = int(np.floor(y.min())), int(np.ceil(y.max()))
        minx, miny = max(minx, 0), max(miny, 0)
        maxx, maxy = min(maxx, res - 1), min(maxy, res - 1)
        if maxx < minx or maxy < miny:
            continue
        ys, xs = np.mgrid[miny : maxy + 1, minx : maxx + 1]
        cx, cy = xs + 0.5, ys + 0.5
        x0, x1, x2 = x
        y0, y1, y2 = y
        area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
        if abs(area) < 1e-12:
            continue
        w0 = ((x1 - cx) * (y2 - cy) - (x2 - cx) * (y1 - cy)) / area
        w1 = ((x2 - cx) * (y0 - cy) - (x0 - cx) * (y2 - cy)) / area
        w2 = 1 - w0 - w1
        inside = (w0 >= -1e-6) & (w1 >= -1e-6) & (w2 >= -1e-6)
        if not inside.any():
            continue
        w = np.stack([w0, w1, w2], -1)
        pos_buf[ys[inside], xs[inside]] = w[inside] @ p[tri]
        nrm_buf[ys[inside], xs[inside]] = w[inside] @ nrm[tri]
        mask[ys[inside], xs[inside]] = True
    return pos_buf, nrm_buf, mask


def bake_ao(parts, samples_from=None, res: int = 256, steps: int = 14, max_dist: float = 0.8, cells: int = 72) -> dict:
    """Bake AO rata-rata per texel untuk primitif `samples_from` (default: semua)."""
    occ = occupancy(parts, cells=cells)
    grid, lo, voxel, dims = occ["grid"], occ["lo"], occ["voxel"], occ["dims"]

    targets = samples_from if samples_from is not None else parts
    tot = np.zeros((res, res), F)
    cnt = np.zeros((res, res), F)

    for part in targets:
        pos_buf, nrm_buf, mask = _rasterize_uv(part, res)
        if not mask.any():
            continue
        p = pos_buf[mask]
        n = nrm_buf[mask]
        t, b, nn = _frame(n)
        # (N, R, 3) arah sinar dalam frame tangen
        dirs = (
            t[:, None, :] * DIRS[None, :, 0:1] + b[:, None, :] * DIRS[None, :, 1:2] + nn[:, None, :] * DIRS[None, :, 2:3]
        )
        occ_flags = np.zeros((p.shape[0], DIRS.shape[0]), bool)
        # mulai lebih jauh dari permukaan supaya sinar tidak menabrak voxel
        # milik permukaan itu sendiri (bias horizon)
        eps = voxel * 3.0
        for k in range(1, steps + 1):
            dist = eps + (max_dist - eps) * (k / steps)
            q = p[:, None, :] + dirs * dist
            c = np.floor((q - lo) / voxel).astype(np.int64)
            valid = np.all((c >= 0) & (c < dims), axis=2)
            cc = np.clip(c, 0, dims - 1)
            hit = grid[cc[..., 0], cc[..., 1], cc[..., 2]] & valid
            occ_flags |= hit
        ao = 1.0 - occ_flags.mean(1)
        tot[mask] += ao
        cnt[mask] += 1

    out = np.where(cnt > 0, tot / np.maximum(cnt, 1), 1.0).astype(F)
    return {
        "ao": out,
        "coverage": float(cnt.mean() > 0),
        "mean": float(out[cnt > 0].mean()) if (cnt > 0).any() else 1.0,
        "min": float(out[cnt > 0].min()) if (cnt > 0).any() else 1.0,
        "texels": int((cnt > 0).sum()),
    }


def _upsample(ao: np.ndarray, shape: tuple[int, int]) -> np.ndarray:
    """Perbesar peta AO ke ukuran tekstur material (bilinear lewat PIL).

    Tekstur ORM tidak selalu persegi (mis. 256x512 pada tekstur kayu), jadi
    bentuk target diambil dari array aslinya, bukan diasumsikan persegi.
    """
    h, w = shape[:2]
    if ao.shape[0] == h and ao.shape[1] == w:
        return ao
    from PIL import Image

    img = Image.fromarray((np.clip(ao, 0, 1) * 255).astype(np.uint8), mode="L")
    return np.asarray(img.resize((w, h), Image.BILINEAR), F) / 255.0


def apply_to_material(part_list, target, res: int = 256, blend: float = 0.55, max_dist: float = 0.8) -> dict:
    """Bake AO untuk satu material lalu campur ke kanal AO (R) di ORM-nya.

    AO prosedural (cavity) tetap dipakai untuk detail halus; bake menyumbang
    oklusi bentuk besar. `blend` = bobot bake.
    """
    uv = np.asarray(target["uv"], F)
    mat = target["mat"]
    if uv.size == 0 or uv.min() < -1e-6 or uv.max() > 1 + 1e-6:
        # UV tiling (ruang objek): menaruh AO di tekstur berulang akan
        # mengulang bercak gelap yang sama di seluruh permukaan — lebih buruk
        # daripada AO prosedural. Material seperti ini dilewati, dan itu dicatat.
        return {"applied": False, "reason": "tiling"}
    baked = bake_ao(part_list, [target], res=res, max_dist=max_dist)
    if mat is None or mat.orm is None:
        return {**baked, "applied": False, "reason": "no-orm"}
    size = mat.orm.shape[0]
    ao = _upsample(baked["ao"], mat.orm.shape)
    orm = mat.orm.copy()
    proc = orm[..., 0]
    orm[..., 0] = np.clip(proc * (1.0 - blend) + proc * ao * blend, 0.0, 1.0)
    mat.orm = orm
    return {**baked, "applied": True, "size": size}
