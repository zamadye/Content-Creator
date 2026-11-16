"""Set dressing props (furniture, containers, lights, small objects)."""
from __future__ import annotations

import numpy as np

from . import tex
from .glb import Material
from .kit import Builder, xform_matrix

F = np.float32


def _m(name, t, **kw):
    return Material(name=name, base=t["base"], normal=t["normal"], orm=t["orm"], metallic=1.0, roughness=1.0, **kw)


def std_mats():
    return {
        "wood": _m("wood", tex.wood_planks(51, 512, "#8a6a44", planks=6)),
        "wood2": _m("wood-dark", tex.wood_planks(57, 512, "#5c4530", planks=4)),
        "metal": _m("metal", tex.painted_metal(4, 512, "#5c6266", rust=0.25)),
        "steel": _m("steel-bare", tex.painted_metal(6, 512, "#9aa0a4", rust=0.05)),
        "rust": _m("rust", tex.painted_metal(8, 512, "#6d4a33", rust=0.8)),
        "red": _m("red-paint", tex.painted_metal(14, 512, "#8e3128", rust=0.35)),
        "brass": _m("brass", tex.painted_metal(16, 256, "#a8843c", rust=0.15)),
        "fabric": _m("fabric", tex.fabric(111, 512, (0.30, 0.32, 0.36))),
        "fabric2": _m("fabric-warm", tex.fabric(113, 512, (0.46, 0.36, 0.28))),
        "burlap": _m("burlap", tex.fabric(115, 512, (0.52, 0.45, 0.31), weave=200, folds=0.35, name="burlap")),
        "canvas": Material(
            name="canvas",
            base=np.concatenate([tex.fabric(117, 512, (0.72, 0.70, 0.62), weave=140, folds=0.3, name="canvas")["base"],
                                 np.ones((512, 512, 1), F)], -1),
            normal=tex.fabric(117, 512, (0.5, 0.5, 0.5), weave=140, folds=0.3)["normal"],
            orm=tex.fabric(117, 512, (0.5, 0.5, 0.5), weave=140, folds=0.3)["orm"],
            metallic=0.0,
            roughness=0.9,
            alpha_mode="MASK",
            alpha_cutoff=0.5,
        ),
        "plastic": _m("plastic", tex.painted_metal(12, 256, "#9aa39c", rust=0.0)),
        "ceramic": _m("ceramic", tex.concrete(23, 0.2, 256)),
        "glass": Material(
            name="glass-clear",
            base=np.concatenate([tex.glass(162, 128)["base"], np.ones((128, 128, 1), F) * 0.35], -1),
            normal=tex.glass(162, 128)["normal"],
            orm=tex.glass(162, 128)["orm"],
            metallic=0.0,
            roughness=0.15,
            alpha_mode="BLEND",
        ),
    }


def _lamp_mat(color="#ffc27a", factor=(1.0, 0.66, 0.32)):
    em = tex.emissive_panel(172, 128, color)
    return Material(
        name="lamp-glow",
        base=em["base"],
        normal=em["normal"],
        orm=em["orm"],
        metallic=0.0,
        roughness=0.6,
        emissive=em["emissive"],
        emissive_factor=factor,
    )


# ------------------------------------------------------------------ furniture
def table_wood():
    b = Builder()
    ms = std_mats()
    b.add_box("wood", (0, 0.735, 0), (1.2, 0.045, 0.8), 1.0)
    for i in range(4):
        b.add_box("wood", (-0.45 + i * 0.30, 0.755, 0), (0.285, 0.012, 0.78), 1.0)
    for sx in (-1, 1):
        for sz in (-1, 1):
            b.add_box("wood2", (sx * 0.52, 0.355, sz * 0.32), (0.065, 0.71, 0.065), 0.7)
    b.add_box("wood2", (0, 0.30, 0), (1.02, 0.035, 0.05), 0.5)
    for sz in (-1, 1):
        b.add_box("wood2", (0, 0.30, sz * 0.30), (1.02, 0.035, 0.05), 0.5)
    return b, ms


def chair():
    b = Builder()
    ms = std_mats()
    b.add_box("wood", (0, 0.44, 0), (0.42, 0.04, 0.42), 0.8)
    for sx in (-1, 1):
        for sz in (-1, 1):
            b.add_box("wood2", (sx * 0.175, 0.22, sz * 0.175), (0.04, 0.44, 0.04), 0.6)
    for sx in (-1, 1):
        b.add_box("wood2", (sx * 0.175, 0.68, -0.19), (0.04, 0.48, 0.04), 0.6)
    for y in (0.62, 0.76, 0.90):
        b.add_box("wood", (0, y, -0.19), (0.38, 0.075, 0.022), 0.7)
    for sz in (-1, 1):
        b.add_box("wood2", (0, 0.20, sz * 0.175), (0.36, 0.03, 0.03), 0.4)
    return b, ms


def shelves_steel():
    b = Builder()
    ms = std_mats()
    w, d, h = 1.8, 0.6, 2.0
    for sx in (-1, 1):
        for sz in (-1, 1):
            b.add_box("steel", (sx * (w / 2 - 0.03), h / 2, sz * (d / 2 - 0.03)), (0.05, h, 0.05), 0.8)
    for y in (0.15, 0.75, 1.35, 1.95):
        b.add_box("steel", (0, y, 0), (w, 0.025, d), 1.0)
        b.add_box("steel", (0, y - 0.05, 0), (w - 0.06, 0.06, 0.03), 0.6)
    for i in range(4):
        b.add_box("wood", (-0.66 + i * 0.42, 0.95, 0.02), (0.30, 0.28, 0.34), 0.6)
    for i in range(3):
        b.add_box("burlap", (-0.5 + i * 0.5, 1.55, 0.0), (0.34, 0.26, 0.30), 0.6)
    return b, ms


def bed():
    b = Builder()
    ms = std_mats()
    b.add_box("wood2", (0, 0.20, 0), (0.95, 0.10, 2.0), 1.0)
    for sx in (-1, 1):
        for sz in (-1, 1):
            b.add_box("wood2", (sx * 0.43, 0.12, sz * 0.92), (0.09, 0.24, 0.09), 0.6)
    b.add_box("fabric2", (0, 0.34, 0.02), (0.90, 0.18, 1.90), 1.2)
    b.add_box("fabric", (0, 0.45, -0.28), (0.88, 0.06, 1.24), 1.2)
    b.add_box("fabric", (0, 0.44, 0.74), (0.54, 0.10, 0.30), 0.8)
    b.add_box("wood2", (0, 0.42, -1.0), (0.94, 0.52, 0.06), 0.8)
    b.add_box("wood2", (0, 0.62, 1.0), (0.94, 0.30, 0.06), 0.8)
    return b, ms


# ------------------------------------------------------------------ utilities
def stove():
    """Kompor minyak (kerosene pressure stove)."""
    b = Builder()
    ms = std_mats()
    b.add_lathe("red", [(0.0, 0.0), (0.15, 0.0), (0.17, 0.02), (0.175, 0.20), (0.165, 0.26), (0.13, 0.28), (0.0, 0.285)], 20, 0.6)
    b.add_cylinder("metal", (0, 0.285, 0), (0, 0.315, 0), 0.135, 0.135, 20, 0.5)
    b.add_cylinder("steel", (0, 0.315, 0), (0, 0.345, 0), 0.105, 0.095, 18, 0.4)
    b.add_cylinder("rust", (0, 0.345, 0), (0, 0.355, 0), 0.055, 0.045, 14, 0.3)
    for k in range(10):
        a = 2 * np.pi * k / 10
        b.add_cylinder("rust", (np.cos(a) * 0.06, 0.352, np.sin(a) * 0.06), (np.cos(a) * 0.088, 0.352, np.sin(a) * 0.088), 0.008, 0.008, 5, 0.2)
    b.add_cylinder("brass", (0.175, 0.10, 0), (0.235, 0.10, 0), 0.016, 0.016, 8, 0.3)
    b.add_cylinder("brass", (0.235, 0.10, 0), (0.238, 0.10, 0), 0.032, 0.032, 12, 0.3)
    b.add_tube("metal", [(0, 0.26, -0.14), (0, 0.34, -0.20), (0, 0.46, -0.14)], [0.012, 0.012, 0.010], 6, 0.3)
    return b, ms


def teplok_lamp():
    """Lampu teplok: tangki kuningan, sumbu, cerobong kaca, nyala."""
    b = Builder()
    ms = std_mats()
    ms["flame"] = _lamp_mat("#ffd27a", (2.4, 1.5, 0.6))
    # fuel tank
    b.add_lathe("brass", [(0.0, 0.0), (0.085, 0.0), (0.095, 0.02), (0.093, 0.055), (0.07, 0.085), (0.045, 0.10)], 18, 0.4)
    # burner collar + wick wheel
    b.add_cylinder("brass", (0, 0.10, 0), (0, 0.135, 0), 0.045, 0.05, 14, 0.3)
    b.add_cylinder("brass", (0.06, 0.115, 0), (0.105, 0.115, 0), 0.008, 0.008, 6, 0.2)
    b.add_cylinder("brass", (0.105, 0.115, 0), (0.108, 0.115, 0), 0.026, 0.026, 12, 0.2)
    # flame (emissive)
    b.add_sphere("flame", (0, 0.165, 0), 0.022, 10, 8, 0.1, scale=(1.0, 2.1, 1.0))
    # glass chimney
    b.add_lathe("glass", [(0.042, 0.115), (0.062, 0.15), (0.070, 0.21), (0.060, 0.27), (0.048, 0.30), (0.052, 0.315)], 18, 0.3, cap_bottom=False)
    # handle
    for sx in (-1, 1):
        b.add_cylinder("metal", (sx * 0.088, 0.10, 0), (sx * 0.088, 0.24, 0), 0.005, 0.005, 5, 0.2)
    b.add_cylinder("metal", (-0.088, 0.245, 0), (0.088, 0.245, 0), 0.006, 0.006, 6, 0.2)
    return b, ms


def drum():
    b = Builder()
    ms = std_mats()
    b.add_lathe("rust", [(0.0, 0.0), (0.27, 0.0), (0.29, 0.015), (0.295, 0.28), (0.31, 0.30), (0.295, 0.32), (0.295, 0.60), (0.31, 0.62), (0.29, 0.64), (0.29, 0.88), (0.0, 0.885)], 20, 0.9)
    b.add_cylinder("metal", (0, 0.885, 0), (0, 0.90, 0), 0.285, 0.27, 20, 0.6)
    b.add_cylinder("steel", (0.10, 0.90, 0.06), (0.10, 0.925, 0.06), 0.032, 0.032, 8, 0.3)
    return b, ms


def sack():
    """Karung beras/gula yang diikat."""
    b = Builder()
    ms = std_mats()
    prof = [
        (0.0, 0.0),
        (0.21, 0.0),
        (0.235, 0.05),
        (0.248, 0.18),
        (0.250, 0.33),
        (0.240, 0.46),
        (0.215, 0.56),
        (0.17, 0.64),
        (0.115, 0.70),
        (0.085, 0.73),
    ]
    b.add_lathe("burlap", prof, 16, 0.55)
    # tied neck + folded flap
    b.add_lathe("burlap", [(0.095, 0.735), (0.115, 0.755), (0.10, 0.775), (0.07, 0.79)], 14, 0.3)
    b.add_lathe("burlap", [(0.07, 0.79), (0.10, 0.80), (0.085, 0.825), (0.0, 0.83)], 14, 0.3)
    # string tie
    b.add_lathe("metal", [(0.112, 0.75), (0.118, 0.756), (0.112, 0.762)], 14, 0.2, cap_bottom=False)
    # a few bulges for weight
    for k in range(5):
        a = 2 * np.pi * k / 5
        b.add_sphere("burlap", (np.cos(a) * 0.19, 0.10 + 0.05 * np.sin(a * 2), np.sin(a) * 0.19), 0.055, 8, 6, 0.2)
    return b, ms


def crate():
    b = Builder()
    ms = std_mats()
    b.add_box("wood", (0, 0.25, 0), (0.7, 0.5, 0.5), 1.0)
    for y in (0.03, 0.47):
        b.add_box("wood2", (0, y, 0), (0.72, 0.05, 0.52), 0.8)
    for sx in (-1, 1):
        b.add_box("wood2", (sx * 0.35, 0.25, 0), (0.03, 0.5, 0.52), 0.6)
        b.add_box("wood2", (sx * 0.18, 0.25, 0), (0.03, 0.5, 0.505), 0.5)
    for sz in (-1, 1):
        b.add_box("wood2", (0, 0.25, sz * 0.25), (0.70, 0.5, 0.025), 0.5)
    return b, ms


def jerrycan():
    """Jeriken baja 20 L."""
    b = Builder()
    ms = std_mats()
    w, h, d = 0.155, 0.42, 0.34
    b.add_box("red", (0, h / 2, 0), (w, h, d), 0.5)
    for y in (0.08, h - 0.06):
        b.add_box("red", (0, y, 0), (w + 0.012, 0.03, d + 0.012), 0.4)
    for sz in (-1, 1):
        for sx in (-1, 1):
            b.add_box("red", (sx * (w / 2 + 0.002), h / 2, sz * 0.10), (0.004, h * 0.8, 0.05), 0.3)
    # spout
    b.add_cylinder("red", (0, h, 0.10), (0.03, h + 0.06, 0.10), 0.035, 0.032, 10, 0.3)
    b.add_cylinder("metal", (0.03, h + 0.06, 0.10), (0.035, h + 0.075, 0.10), 0.038, 0.034, 10, 0.2)
    # handle
    b.add_box("red", (-0.02, h + 0.035, -0.09), (0.02, 0.02, 0.16), 0.3)
    b.add_box("red", (0.0, h + 0.01, -0.165), (0.05, 0.05, 0.02), 0.3)
    b.add_box("red", (0.0, h + 0.01, -0.02), (0.05, 0.05, 0.02), 0.3)
    return b, ms


def clothesline():
    b = Builder()
    ms = std_mats()
    for sx in (-1, 1):
        b.add_cylinder("wood2", (sx * 2.0, 0, 0), (sx * 2.0, 1.95, 0), 0.055, 0.04, 8, 0.7)
        b.add_box("wood2", (sx * 2.0, 0.02, 0), (0.24, 0.04, 0.24), 0.4)
        b.add_cylinder("rust", (sx * 2.0, 1.86, 0), (sx * 2.0, 1.80, 0), 0.012, 0.012, 6, 0.3)
    b.add_tube("rust", [(-2.0, 1.84, 0), (-1.0, 1.74, 0), (0, 1.72, 0), (1.0, 1.74, 0), (2.0, 1.84, 0)], [0.008] * 5, 5, 0.4)
    clothes = [(-1.35, 0.56, 0.72, "canvas"), (-0.62, 0.5, 0.62, "burlap"), (0.15, 0.62, 0.80, "fabric2"), (0.95, 0.46, 0.58, "canvas")]
    for x, w, h, mat in clothes:
        top = 1.735 - abs(x) * 0.04
        p0 = (x - w / 2, top, 0.01)
        p1 = (x + w / 2, top, 0.01)
        p2 = (x + w / 2, top - h, 0.05)
        p3 = (x - w / 2, top - h, 0.05)
        b.add_quad(mat, p0, p1, p2, p3, uv=((0, 1), (1, 1), (1, 0), (0, 0)))
        b.add_quad(mat, p1, p0, p3, p2, uv=((0, 1), (1, 1), (1, 0), (0, 0)))
        for xx in (x - w / 2 + 0.05, x + w / 2 - 0.05):
            b.add_box("wood2", (xx, top + 0.012, 0.01), (0.012, 0.05, 0.012), 0.2)
    return b, ms


def sign_board():
    """Papan nama warung: huruf dicat, tiang kayu."""
    b = Builder()
    ms = std_mats()
    t = tex.text_panel("WARUNG BU SRI", "buka 06.00 - 21.00", 512, 256)
    ms["board"] = _m("sign-board", t)
    b.add_quad("board", (-0.85, 0.62, 0.035), (0.85, 0.62, 0.035), (0.85, 1.44, 0.035), (-0.85, 1.44, 0.035),
               uv=((0, 0), (1, 0), (1, 1), (0, 1)))
    b.add_quad("board", (0.85, 0.62, -0.035), (-0.85, 0.62, -0.035), (-0.85, 1.44, -0.035), (0.85, 1.44, -0.035),
               uv=((0, 0), (1, 0), (1, 1), (0, 1)))
    # frame
    b.add_box("wood2", (0, 1.46, 0), (1.78, 0.05, 0.09), 0.5)
    b.add_box("wood2", (0, 0.60, 0), (1.78, 0.05, 0.09), 0.5)
    for sx in (-1, 1):
        b.add_box("wood2", (sx * 0.875, 1.03, 0), (0.05, 0.92, 0.09), 0.5)
        b.add_box("wood2", (sx * 0.62, 0.31, 0), (0.085, 2.62, 0.085), 0.6)
        b.add_box("wood2", (sx * 0.62, 1.80, 0), (0.09, 0.06, 0.30), 0.4)
    return b, ms


ASSETS = {
    "prop.table.wood": dict(build=table_wood, title="Meja kayu", tags=["furniture", "table", "interior"], category="prop"),
    "prop.chair.wood": dict(build=chair, title="Kursi kayu", tags=["furniture", "chair", "interior"], category="prop"),
    "prop.shelves.steel": dict(build=shelves_steel, title="Rak besi", tags=["furniture", "shelf", "warehouse"], category="prop"),
    "prop.bed": dict(build=bed, title="Kasur", tags=["furniture", "bed", "interior"], category="prop"),
    "prop.stove": dict(build=stove, title="Kompor minyak", tags=["kitchen", "stove", "interior"], category="prop"),
    "prop.lamp.teplok": dict(build=teplok_lamp, title="Lampu teplok", tags=["light", "lamp", "night"], category="prop"),
    "prop.drum": dict(build=drum, title="Drum besi", tags=["container", "drum", "warehouse"], category="prop"),
    "prop.sack": dict(build=sack, title="Karung", tags=["container", "sack", "warehouse"], category="prop"),
    "prop.crate": dict(build=crate, title="Peti kayu", tags=["container", "crate"], category="prop"),
    "prop.jerrycan": dict(build=jerrycan, title="Jeriken", tags=["container", "can"], category="prop"),
    "prop.clothesline": dict(build=clothesline, title="Jemuran", tags=["home", "clothesline", "village"], category="prop"),
    "prop.signboard": dict(build=sign_board, title="Papan warung", tags=["sign", "board"], category="prop"),
}
