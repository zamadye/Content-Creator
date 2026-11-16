"""Tropical vegetation and terrain props (metre scale, +Y up)."""
from __future__ import annotations

import numpy as np

from . import tex
from .glb import Material
from .kit import Builder, rot_matrix, xform_matrix

F = np.float32
RNG = np.random.default_rng


def _foliage_mat(seed, tone, color="#3f5c33"):
    t = tex.foliage(seed, 512, tone, alpha=True)
    base = np.concatenate([t["base"], t["alpha"][..., None]], -1)
    return Material(
        name=f"foliage-{tone}",
        base=base,
        normal=t["normal"],
        orm=t["orm"],
        metallic=0.0,
        roughness=1.0,
        double_sided=True,
        alpha_mode="MASK",
        alpha_cutoff=0.42,
    )


def _cards(b, mat, center, radius, count, size=(1.4, 1.4), seed=0, height_bias=0.0, up=False):
    rng = RNG(seed)
    cx, cy, cz = center
    for i in range(count):
        a = rng.uniform(0, 2 * np.pi)
        r = radius * np.sqrt(rng.uniform(0.05, 1.0))
        y = cy + rng.uniform(-radius * 0.7, radius * 0.7) + height_bias
        x = cx + np.cos(a) * r
        z = cz + np.sin(a) * r
        s = size[0] * rng.uniform(0.7, 1.25)
        tilt = np.pi / 2 - 0.35 if up else rng.uniform(-0.5, 0.5)
        b.add_leaf_card(mat, (x, y, z), (s, size[1] * rng.uniform(0.7, 1.2)), rng.uniform(0, np.pi * 2), tilt)


def _blob(b, mat, center, radii, seed=0, rings=10, segs=16):
    """Ellipsoid foliage cluster with noisy surface."""
    rng = RNG(seed)
    pos, uvs, idx = [], [], []
    for i in range(rings + 1):
        phi = np.pi * i / rings
        for j in range(segs + 1):
            th = 2 * np.pi * j / segs
            n = np.array([np.cos(th) * np.sin(phi), np.cos(phi), np.sin(th) * np.sin(phi)], F)
            r = 1.0 + 0.16 * np.sin(th * 5 + phi * 4) + 0.10 * np.sin(th * 11)
            pos.append(np.asarray(center, F) + n * radii * r)
            uvs.append([j / segs * 2, i / rings * 2])
    for i in range(rings):
        for j in range(segs):
            a = i * (segs + 1) + j
            bb = a + segs + 1
            idx.extend([a, bb, a + 1, a + 1, bb, bb + 1])
    b.add_raw(mat, np.array(pos, F), idx, np.array(uvs, F))


def tree_karet(seed=3):
    def build():
        rng = RNG(seed)
        b = Builder()
        bark = tex.bark(61, 512, "#6b6a58", kind="karet")
        barkm = Material(name="bark", base=bark["base"], normal=bark["normal"], orm=bark["orm"], metallic=1.0, roughness=1.0)
        leafm = _foliage_mat(seed, "#3d5a30")
        leafm2 = _foliage_mat(seed + 1, "#4a6a38")
        h = 11.0
        trunk_pts = [(0, 0, 0), (0.05, h * 0.25, 0.04), (-0.04, h * 0.5, 0.02), (0.06, h * 0.72, -0.03), (0.02, h * 0.86, 0.0)]
        b.add_tube("bark", trunk_pts, [0.34, 0.28, 0.23, 0.18, 0.14], 12, 1.2)
        for k in range(4):
            a = k * np.pi / 2 + rng.uniform(-0.4, 0.4)
            tip = (np.cos(a) * rng.uniform(2.4, 3.4), h * rng.uniform(0.86, 0.98), np.sin(a) * rng.uniform(2.4, 3.4))
            mid = ((tip[0]) * 0.45, h * 0.80, tip[2] * 0.45)
            b.add_tube("bark", [(0, h * 0.78, 0), mid, tip], [0.11, 0.08, 0.05], 8, 1.2)
            _blob(b, "leaf", (tip[0], tip[1] + 0.4, tip[2]), np.array([2.3, 1.5, 2.3], F), seed * 7 + k)
            _cards(b, "leaf2", (tip[0], tip[1] + 0.4, tip[2]), 2.1, 16, (1.5, 1.5), seed * 11 + k)
        _blob(b, "leaf", (0, h * 0.95, 0), np.array([2.6, 1.7, 2.6], F), seed * 13)
        _cards(b, "leaf2", (0, h * 0.95, 0), 2.4, 20, (1.6, 1.6), seed * 17)
        return b, {"bark": barkm, "leaf": leafm, "leaf2": leafm2}

    return build


def tree_beringin(seed=5):
    def build():
        rng = RNG(seed)
        b = Builder()
        bark = tex.bark(62, 512, "#7a7360", kind="beringin")
        barkm = Material(name="bark", base=bark["base"], normal=bark["normal"], orm=bark["orm"], metallic=1.0, roughness=1.0)
        leafm = _foliage_mat(seed, "#2f4a2a")
        leafm2 = _foliage_mat(seed + 2, "#3c5a30")
        # buttress base + thick trunk
        for k in range(6):
            a = k * np.pi / 3
            b.add_tube(
                "bark",
                [(np.cos(a) * 0.55, 0.0, np.sin(a) * 0.55), (np.cos(a) * 0.85, 0.35, np.sin(a) * 0.85), (np.cos(a) * 0.62, 1.1, np.sin(a) * 0.62)],
                [0.24, 0.16, 0.06],
                7,
                1.0,
            )
        b.add_tube("bark", [(0, 0, 0), (0.1, 1.8, 0.05), (0, 3.6, -0.05), (-0.1, 5.0, 0)], [0.62, 0.52, 0.44, 0.34], 14, 1.2)
        # spreading branches
        for k in range(5):
            a = k * 2 * np.pi / 5 + rng.uniform(-0.3, 0.3)
            r = rng.uniform(3.6, 5.2)
            tip = (np.cos(a) * r, rng.uniform(5.6, 6.8), np.sin(a) * r)
            b.add_tube("bark", [(0, 4.8, 0), (tip[0] * 0.5, 5.4, tip[2] * 0.5), tip], [0.22, 0.15, 0.07], 8, 1.2)
            _blob(b, "leaf", (tip[0], tip[1] + 0.3, tip[2]), np.array([3.1, 1.5, 3.1], F), seed * 3 + k)
            _cards(b, "leaf2", (tip[0], tip[1] + 0.3, tip[2]), 2.8, 20, (1.9, 1.9), seed * 5 + k)
        _blob(b, "leaf", (0, 6.2, 0), np.array([3.4, 1.7, 3.4], F), seed * 21)
        _cards(b, "leaf2", (0, 6.2, 0), 3.0, 26, (2.0, 2.0), seed * 29)
        # aerial roots
        for k in range(14):
            a = rng.uniform(0, 2 * np.pi)
            r = rng.uniform(1.2, 3.4)
            x, z = np.cos(a) * r, np.sin(a) * r
            y0 = rng.uniform(4.2, 6.0)
            b.add_tube("bark", [(x * 0.6, y0, z * 0.6), (x * 0.9, y0 * 0.6, z * 0.9), (x, 0.02, z)], [0.045, 0.035, 0.05], 5, 0.8)
        return b, {"bark": barkm, "leaf": leafm, "leaf2": leafm2}

    return build


def tree_palm(seed=7):
    def build():
        rng = RNG(seed)
        b = Builder()
        bark = tex.bark(63, 512, "#83765f", kind="palm")
        barkm = Material(name="bark", base=bark["base"], normal=bark["normal"], orm=bark["orm"], metallic=1.0, roughness=1.0)
        leafm = _foliage_mat(seed, "#47632f")
        leafm2 = _foliage_mat(seed + 4, "#3d5729")
        pts, radii = [], []
        h = 8.5
        for i in range(7):
            t = i / 6
            pts.append((np.sin(t * 1.6) * 1.1, t * h, np.cos(t * 1.1) * 0.25))
            radii.append(0.26 - 0.09 * t)
        b.add_tube("bark", pts, radii, 12, 1.0)
        top = np.array(pts[-1], F)
        for k in range(11):
            a = k * 2 * np.pi / 11 + rng.uniform(-0.15, 0.15)
            droop = rng.uniform(0.35, 0.9)
            L = rng.uniform(2.6, 3.6)
            R = rot_matrix((0, 1, 0), a)
            for j in range(5):
                t0, t1 = j / 5, (j + 1) / 5
                p0 = top + R @ np.array([t0 * L, np.sin(t0 * 1.4) * 0.5 - t0 * droop, 0], F)
                p1 = top + R @ np.array([t1 * L, np.sin(t1 * 1.4) * 0.5 - t1 * droop, 0], F)
                mid = (p0 + p1) / 2
                ang = np.arctan2(p1[0] - p0[0], p1[2] - p0[2])
                b.add_leaf_card("leaf", mid, (0.85, (L / 5) * 1.6), ang, 0.0)
                b.add_leaf_card("leaf", mid + np.array([0, 0.02, 0], F), (0.85, (L / 5) * 1.6), ang + np.pi / 2, 0.0)
        for k in range(4):
            a = k * np.pi / 2
            b.add_leaf_card("leaf2", top + np.array([0, 0.5, 0], F), (1.1, 2.4), a, 0.9)
        return b, {"bark": barkm, "leaf": leafm, "leaf2": leafm2}

    return build


def tree_banana(seed=9):
    def build():
        b = Builder()
        stalk = tex.foliage(seed, tone="#5c6a34")
        stalkm = Material(name="stalk", base=stalk["base"], normal=stalk["normal"], orm=stalk["orm"], metallic=0.0, roughness=1.0)
        leafm = _foliage_mat(seed + 1, "#4e6b2f")
        leafm2 = _foliage_mat(seed + 2, "#5c7a38")
        pts = [(0, 0, 0), (0.05, 0.7, 0.03), (0, 1.45, 0)]
        b.add_tube("stalk", pts, [0.18, 0.15, 0.13], 10, 1.0)
        top = np.array([0, 1.5, 0], F)
        for k in range(7):
            a = k * 2 * np.pi / 7
            R = rot_matrix((0, 1, 0), a)
            for j in range(3):
                t = j / 3
                p = top + R @ np.array([t * 1.0, 0.55 - t * 0.25, 0], F)
                b.add_leaf_card("leaf", p, (0.72, 2.5), a, np.pi / 2 - 0.9)
                b.add_leaf_card("leaf2", p + np.array([0, 0.02, 0], F), (0.72, 2.5), a + 0.5, np.pi / 2 - 1.0)
        return b, {"stalk": stalkm, "leaf": leafm, "leaf2": leafm2}

    return build


def tree_dead(seed=11):
    def build():
        rng = RNG(seed)
        b = Builder()
        bark = tex.bark(65, 512, "#4e463a", kind="dead")
        barkm = Material(name="bark", base=bark["base"], normal=bark["normal"], orm=bark["orm"], metallic=1.0, roughness=1.0)
        b.add_tube("bark", [(0, 0, 0), (0.1, 1.6, 0.05), (-0.05, 3.2, 0), (0.08, 4.6, -0.04)], [0.28, 0.22, 0.16, 0.1], 10, 1.0)

        def branch(p0, dirv, length, radius, depth):
            p1 = p0 + dirv * length
            b.add_tube("bark", [p0, p0 + dirv * length * 0.5 + np.array([0, 0.15, 0], F), p1], [radius, radius * 0.7, radius * 0.35], 6, 1.0)
            if depth <= 0:
                return
            for k in range(2):
                nd = dirv + rng.uniform(-0.7, 0.7, 4)[:3]
                nd[1] = abs(nd[1]) * 0.9 + 0.25
                nd = nd / np.linalg.norm(nd)
                branch(p1, nd.astype(F), length * 0.62, radius * 0.55, depth - 1)

        for k in range(3):
            a = k * 2 * np.pi / 3 + 0.4
            branch(np.array([0.06, 4.4, -0.03], F), np.array([np.cos(a) * 0.8, 0.9, np.sin(a) * 0.8], F), 1.5, 0.09, 2)
        return b, {"bark": barkm}

    return build


def bush_fern(seed=13):
    def build():
        b = Builder()
        leafm = _foliage_mat(seed, "#35502c")
        leafm2 = _foliage_mat(seed + 1, "#43602f")
        rng = RNG(seed)
        for k in range(9):
            a = k * 2 * np.pi / 9 + rng.uniform(-0.2, 0.2)
            tilt = np.pi / 2 - rng.uniform(0.5, 1.1)
            p = np.array([np.cos(a) * 0.18, 0.12, np.sin(a) * 0.18], F)
            b.add_leaf_card("leaf", p, (0.55, 1.5), a, tilt)
            b.add_leaf_card("leaf2", p + np.array([0, 0.05, 0], F), (0.5, 1.3), a + 0.6, tilt - 0.15)
        return b, {"leaf": leafm, "leaf2": leafm2}

    return build


def grass_patch(seed=15):
    def build():
        b = Builder()
        m = _foliage_mat(seed, "#425a2c")
        m2 = _foliage_mat(seed + 1, "#4d6631")
        rng = RNG(seed)
        for k in range(26):
            x, z = rng.uniform(-0.8, 0.8), rng.uniform(-0.8, 0.8)
            b.add_leaf_card("leaf" if k % 2 else "leaf2", (x, 0.02, z), (0.5, rng.uniform(0.4, 0.8)), rng.uniform(0, 3.14), np.pi / 2 - rng.uniform(0.1, 0.5))
        return b, {"leaf": m, "leaf2": m2}

    return build


def rock(seed=17):
    def build():
        from .kit import compute_normals

        b = Builder()
        st = tex.stone(151, 512, "#7e7f78")
        m = Material(name="stone", base=st["base"], normal=st["normal"], orm=st["orm"], metallic=1.0, roughness=1.0)
        rng = RNG(seed)
        rings, segs = 14, 20
        pos, uvs, idx = [], [], []
        for i in range(rings + 1):
            phi = np.pi * i / rings
            for j in range(segs + 1):
                th = 2 * np.pi * j / segs
                n = np.array([np.cos(th) * np.sin(phi), np.cos(phi), np.sin(th) * np.sin(phi)], F)
                r = 1.0 + 0.22 * np.sin(th * 3 + phi * 2) + 0.12 * np.sin(th * 7 + i)
                pos.append(n * np.array([1.1, 0.72, 0.95], F) * r)
                uvs.append([j / segs * 2, i / rings * 2])
        for i in range(rings):
            for j in range(segs):
                a = i * (segs + 1) + j
                bb = a + segs + 1
                idx.extend([a, bb, a + 1, a + 1, bb, bb + 1])
        pos = np.array(pos, F)
        pos[:, 1] = np.maximum(pos[:, 1], -0.05)
        b.add_raw("stone", pos, idx, np.array(uvs, F))
        return b, {"stone": m}

    return build


def log_fallen(seed=19):
    def build():
        b = Builder()
        bark = tex.bark(64, 512, "#5a4a38", kind="dead")
        wood = tex.wood_planks(55, 512, "#7b5f42", planks=10)
        bm = Material(name="bark", base=bark["base"], normal=bark["normal"], orm=bark["orm"], metallic=1.0, roughness=1.0)
        wm = Material(name="cut-wood", base=wood["base"], normal=wood["normal"], orm=wood["orm"], metallic=1.0, roughness=1.0)
        b.add_cylinder("bark", (0, 0.34, -2.4), (0.5, 0.30, 2.4), 0.34, 0.28, 14, 1.0, caps=False)
        b.add_cylinder("wood", (0.0, 0.34, -2.42), (0.0, 0.34, -2.38), 0.33, 0.33, 14, 0.8, caps=True)
        b.add_cylinder("wood", (0.5, 0.30, 2.38), (0.5, 0.30, 2.42), 0.28, 0.28, 14, 0.8, caps=True)
        return b, {"bark": bm, "wood": wm}

    return build


ASSETS = {
    "nature.tree.karet": dict(build=tree_karet(), title="Pohon karet", tags=["tree", "rubber", "tall", "tropical"], category="nature"),
    "nature.tree.beringin": dict(build=tree_beringin(), title="Pohon beringin (akar gantung)", tags=["tree", "banyan", "large", "tropical"], category="nature"),
    "nature.tree.palm": dict(build=tree_palm(), title="Pohon kelapa", tags=["tree", "palm", "tropical"], category="nature"),
    "nature.tree.banana": dict(build=tree_banana(), title="Pohon pisang", tags=["tree", "banana", "village"], category="nature"),
    "nature.tree.dead": dict(build=tree_dead(), title="Pohon mati", tags=["tree", "dead", "forest"], category="nature"),
    "nature.bush.fern": dict(build=bush_fern(), title="Semak pakis", tags=["bush", "fern", "undergrowth"], category="nature"),
    "nature.grass.patch": dict(build=grass_patch(), title="Rumpun rumput", tags=["grass", "ground"], category="nature"),
    "nature.rock.boulder": dict(build=rock(), title="Batu besar", tags=["rock", "stone"], category="nature"),
    "nature.log.fallen": dict(build=log_fallen(), title="Batang tumbang", tags=["log", "forest", "prop"], category="nature"),
}
