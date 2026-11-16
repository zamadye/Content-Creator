"""Vehicles with attachment anchors so any actor can ride them."""
from __future__ import annotations

import numpy as np

from . import tex
from .glb import Material
from .kit import Builder, xform_matrix

F = np.float32


def _m(name, t, **kw):
    return Material(name=name, base=t["base"], normal=t["normal"], orm=t["orm"], metallic=1.0, roughness=1.0, **kw)


def _torus(b, mat, center, R, r, seg_major=28, seg_minor=10, axis="x"):
    """Torus; axis is the axle direction (wheels use axis='x')."""
    cx, cy, cz = center
    pos, uvs, idx = [], [], []
    for i in range(seg_major + 1):
        a = 2 * np.pi * i / seg_major
        for j in range(seg_minor + 1):
            t = 2 * np.pi * j / seg_minor
            rr = R + r * np.cos(t)
            u = np.cos(a) * rr
            v = np.sin(a) * rr
            tube = r * np.sin(t)
            if axis == "x":
                pos.append([cx + tube, cy + v, cz + u])
            elif axis == "y":
                pos.append([cx + u, cy + tube, cz + v])
            else:
                pos.append([cx + u, cy + v, cz + tube])
            uvs.append([i / seg_major * 3, j / seg_minor])
    for i in range(seg_major):
        for j in range(seg_minor):
            a = i * (seg_minor + 1) + j
            bb = a + seg_minor + 1
            idx.extend([a, bb, a + 1, a + 1, bb, bb + 1])
    b.add_raw(mat, np.array(pos, F), idx, np.array(uvs, F))


def motorcycle():
    def build():
        b = Builder()
        mats = {
            "paint": _m("paint", tex.painted_metal(21, 512, "#3d5566", rust=0.12)),
            "frame": _m("frame", tex.painted_metal(23, 256, "#2c3033", rust=0.2)),
            "chrome": _m("chrome", tex.painted_metal(25, 256, "#b9bfc2", rust=0.0)),
            "rubber": _m("rubber", tex.fabric(115, 512, (0.055, 0.055, 0.06), weave=260, folds=0.2, name="rubber")),
            "seat": _m("seat", tex.fabric(117, 512, (0.10, 0.09, 0.09), weave=180, folds=0.4, name="leather")),
            "engine": _m("engine", tex.painted_metal(27, 256, "#6a6e70", rust=0.35)),
            "glass": Material(
                name="lamp-glass",
                base=np.concatenate([tex.glass(163, 128)["base"], np.ones((128, 128, 1), F) * 0.5], -1),
                normal=tex.glass(163, 128)["normal"],
                orm=tex.glass(163, 128)["orm"],
                metallic=0.0,
                roughness=0.1,
                alpha_mode="BLEND",
                emissive_factor=(1.0, 0.92, 0.75),
            ),
            "tail": Material(
                name="tail-light",
                base=np.clip(tex.emissive_panel(174, 64, "#ff3a24")["base"] * np.array([1.0, 0.25, 0.2], F), 0, 1),
                normal=tex.emissive_panel(174, 64, "#ff3a24")["normal"],
                orm=tex.emissive_panel(174, 64, "#ff3a24")["orm"],
                metallic=0.0,
                roughness=0.3,
                emissive=tex.emissive_panel(174, 64, "#ff3a24")["emissive"],
                emissive_factor=(0.9, 0.08, 0.05),
            ),
        }
        # wheels
        for z in (0.66, -0.60):
            _torus(b, "rubber", (0, 0.31, z), 0.235, 0.075, axis="x")
            b.add_cylinder("chrome", (0, 0.31, z - 0.055), (0, 0.31, z + 0.055), 0.075, 0.075, 14, 0.4)
            for k in range(8):
                a = k * np.pi / 4
                b.add_cylinder("chrome", (np.cos(a) * 0.04, 0.31 + np.sin(a) * 0.04, z), (np.cos(a) * 0.21, 0.31 + np.sin(a) * 0.21, z), 0.008, 0.008, 4, 0.3)
        # front fork + steering
        for sx in (-1, 1):
            b.add_cylinder("chrome", (sx * 0.075, 0.92, 0.50), (sx * 0.075, 0.31, 0.66), 0.022, 0.022, 8, 0.4)
        b.add_box("frame", (0, 0.98, 0.50), (0.16, 0.06, 0.10), 0.5)
        b.add_cylinder("chrome", (-0.30, 1.03, 0.49), (0.30, 1.03, 0.49), 0.016, 0.016, 8, 0.4)
        for sx in (-1, 1):
            b.add_cylinder("rubber", (sx * 0.22, 1.03, 0.49), (sx * 0.31, 1.03, 0.49), 0.020, 0.020, 8, 0.3)
            # mirror
            b.add_cylinder("chrome", (sx * 0.26, 1.03, 0.50), (sx * 0.31, 1.18, 0.52), 0.008, 0.008, 6, 0.3)
            b.add_cylinder("chrome", (sx * 0.31, 1.19, 0.53), (sx * 0.33, 1.19, 0.53), 0.045, 0.045, 12, 0.3)
        # headlight
        b.add_lathe("paint", [(0.115, 0.0), (0.12, 0.03), (0.10, 0.10)], 16, 0.5, matrix=xform_matrix(loc=(0, 0.96, 0.60), rot=(np.pi / 2, 0, 0)))
        b.add_cylinder("glass", (0, 0.96, 0.63), (0, 0.96, 0.635), 0.10, 0.10, 16, 0.4)
        # body: step-through frame + floorboard
        b.add_box("frame", (0, 0.44, 0.06), (0.20, 0.10, 0.86), 0.7)
        b.add_box("frame", (0, 0.34, 0.10), (0.34, 0.05, 0.70), 0.8)
        b.add_box("paint", (0, 0.62, 0.26), (0.26, 0.30, 0.44), 1.0)
        b.add_box("paint", (0, 0.55, -0.34), (0.30, 0.26, 0.52), 1.0)
        # engine
        b.add_box("engine", (0, 0.42, 0.12), (0.24, 0.28, 0.34), 0.6)
        b.add_cylinder("engine", (-0.13, 0.42, 0.12), (0.13, 0.42, 0.12), 0.09, 0.09, 12, 0.4)
        # exhaust
        b.add_tube("chrome", [(0.08, 0.34, 0.16), (0.13, 0.29, -0.20), (0.16, 0.30, -0.62)], [0.028, 0.030, 0.042], 10, 0.6)
        # seat
        b.add_box("seat", (0, 0.80, -0.16), (0.26, 0.10, 0.56), 1.2)
        b.add_box("paint", (0, 0.74, -0.44), (0.22, 0.14, 0.20), 0.8)
        # rear light + plate
        b.add_box("tail", (0, 0.74, -0.60), (0.14, 0.06, 0.03), 0.4)
        b.add_box("chrome", (0, 0.58, -0.66), (0.20, 0.12, 0.02), 0.4)
        # rear rack + shock
        for sx in (-1, 1):
            b.add_cylinder("chrome", (sx * 0.14, 0.62, -0.42), (sx * 0.14, 0.42, -0.50), 0.020, 0.020, 8, 0.4)
        # kickstand
        b.add_cylinder("frame", (0.16, 0.34, -0.10), (0.34, 0.02, -0.26), 0.014, 0.014, 6, 0.3)
        anchors = [
            {"name": "anchor.seat", "translation": [0.0, 0.86, -0.16]},
            {"name": "anchor.ride-foot.L", "translation": [0.19, 0.40, 0.02]},
            {"name": "anchor.ride-foot.R", "translation": [-0.19, 0.40, 0.02]},
            {"name": "anchor.grip.L", "translation": [0.30, 1.03, 0.49]},
            {"name": "anchor.grip.R", "translation": [-0.30, 1.03, 0.49]},
            {"name": "anchor.headlight", "translation": [0.0, 0.96, 0.66]},
            {"name": "anchor.rear", "translation": [0.0, 0.86, -0.62]},
        ]
        return b, mats, anchors

    return build


def pickup():
    def build():
        b = Builder()
        mats = {
            "paint": _m("paint", tex.painted_metal(31, 512, "#6d7a72", rust=0.3)),
            "chrome": _m("chrome", tex.painted_metal(33, 256, "#a8aeb1", rust=0.15)),
            "rubber": _m("rubber", tex.fabric(119, 512, (0.05, 0.05, 0.055), weave=260, folds=0.2, name="rubber")),
            "glass": Material(
                name="car-glass",
                base=np.concatenate([tex.glass(164, 128)["base"], np.ones((128, 128, 1), F) * 0.55], -1),
                normal=tex.glass(164, 128)["normal"],
                orm=tex.glass(164, 128)["orm"],
                metallic=0.0,
                roughness=0.08,
                alpha_mode="BLEND",
            ),
            "rust": _m("rust", tex.painted_metal(35, 256, "#6a3f28", rust=0.85)),
        }
        L, Wd = 4.6, 1.75
        b.add_box("paint", (0, 0.62, 0.1), (Wd, 0.55, L), 1.2)
        b.add_box("paint", (0, 1.05, 0.55), (Wd - 0.08, 0.5, 1.7), 1.2)  # cabin
        b.add_box("glass", (0, 1.12, 1.42), (Wd - 0.22, 0.42, 0.04), 0.5)
        b.add_box("glass", (0, 1.12, -0.30), (Wd - 0.22, 0.42, 0.04), 0.5)
        for sx in (-1, 1):
            b.add_box("glass", (sx * (Wd / 2 - 0.05), 1.12, 0.6), (0.04, 0.36, 1.2), 0.5)
        # cargo bed
        b.add_box("paint", (0, 0.92, -1.4), (Wd, 0.06, 1.8), 1.2)
        for sx in (-1, 1):
            b.add_box("paint", (sx * (Wd / 2 - 0.04), 1.06, -1.4), (0.06, 0.32, 1.8), 1.0)
        b.add_box("paint", (0, 1.06, -2.28), (Wd, 0.32, 0.06), 1.0)
        b.add_box("rust", (0, 1.0, -2.3), (Wd - 0.2, 0.20, 0.03), 0.6)
        # wheels
        for sx in (-1, 1):
            for z in (1.35, -1.35):
                _torus(b, "rubber", (sx * (Wd / 2 - 0.06), 0.36, z), 0.27, 0.095, 26, 10, axis="x")
                b.add_cylinder("chrome", (sx * (Wd / 2 - 0.14), 0.36, z), (sx * (Wd / 2 + 0.02), 0.36, z), 0.16, 0.16, 14, 0.4)
        # lights + bumper
        for sx in (-1, 1):
            b.add_cylinder("chrome", (sx * 0.55, 0.78, 2.31), (sx * 0.55, 0.78, 2.36), 0.11, 0.11, 12, 0.4)
        b.add_box("chrome", (0, 0.5, 2.3), (Wd, 0.12, 0.1), 0.8)
        anchors = [
            {"name": "anchor.door.L", "translation": [0.88, 0.9, 1.0]},
            {"name": "anchor.door.R", "translation": [-0.88, 0.9, 1.0]},
            {"name": "anchor.bed", "translation": [0.0, 0.98, -1.4]},
            {"name": "anchor.driver", "translation": [0.42, 1.0, 0.55]},
        ]
        return b, mats, anchors

    return build


ASSETS = {
    "vehicle.motorcycle.bebek": dict(build=motorcycle(), title="Motor bebek + anchor duduk", tags=["vehicle", "motorcycle", "ride"], category="vehicle"),
    "vehicle.pickup": dict(build=pickup(), title="Pikap tua", tags=["vehicle", "truck", "village"], category="vehicle"),
}
