"""Modular buildings: walls with real openings, floors, roofs, doors, windows.
All dimensions in metres; door openings are 2.0 m tall so a 1.7 m actor passes.
"""
from __future__ import annotations

import numpy as np

from . import tex
from .glb import Material
from .kit import Builder, xform_matrix

F = np.float32
WALL_T = 0.18


# ------------------------------------------------------------------ materials
def mats_for(kind="wood", condition=0.4):
    m = {}
    if kind == "wood":
        w = tex.wood_planks(51, 1024, "#8a6a49", planks=9)
        m["wall"] = _std("wall-wood", w)
        w2 = tex.wood_planks(54, 512, "#7a5c3f", planks=5)
        m["beam"] = _std("beam-wood", w2)
    elif kind == "plaster":
        p = tex.plaster(31, condition, 1024, "#c6bfae")
        m["wall"] = _std("wall-plaster", p)
        br = tex.brick(41, 512)
        m["beam"] = _std("brick", br)
    else:  # corrugated steel
        c = tex.corrugated(91, 512, "#7d837f", rust=condition)
        m["wall"] = _std("wall-steel", c)
        m["beam"] = _std("steel", tex.painted_metal(4, 256, "#4a5152", rust=0.2))
    m["floor"] = _std("floor", tex.concrete(22, 0.6, 512))
    m["wood"] = _std("cut-wood", tex.wood_planks(56, 512, "#7b5f42", planks=7))
    m["roof"] = _std("roof", tex.corrugated(92, 512, "#8b8f88", rust=0.35, ribs=30))
    m["tile"] = _std("roof-tile", tex.roof_tile(101, 512))
    m["thatch"] = _std("thatch", tex.thatch(81, 512))
    m["glass"] = Material(
        name="glass",
        base=tex.glass(161, 256)["base"],
        normal=tex.glass(161, 256)["normal"],
        orm=tex.glass(161, 256)["orm"],
        metallic=0.0,
        roughness=0.25,
        alpha_mode="BLEND",
    )
    gl = tex.glass(161, 256)["base"]
    m["glass"].base = np.concatenate([gl, np.ones(gl.shape[:2] + (1,), F) * 0.42], -1)
    em = tex.emissive_panel(171, 256, "#ffcf8a")
    m["lamp"] = Material(
        name="lamp",
        base=em["base"],
        normal=em["normal"],
        orm=em["orm"],
        metallic=0.0,
        roughness=0.5,
        emissive=em["emissive"],
        emissive_factor=(1.0, 0.72, 0.38),
    )
    return m


def _std(name, t):
    return Material(name=name, base=t["base"], normal=t["normal"], orm=t["orm"], metallic=1.0, roughness=1.0)


# --------------------------------------------------------------------- parts
def wall(b, mat, center, length, height, yaw=0.0, opening=None, base_y=0.0):
    m = xform_matrix(loc=(center[0], base_y + height / 2, center[2]), rot=(0, yaw, 0))
    if opening:
        b.add_wall_with_opening(mat, (0, 0, 0), (length, height, WALL_T), opening, 1.0, m)
    else:
        b.add_box(mat, (0, 0, 0), (length, height, WALL_T), 1.0, m)


def door_leaf(b, mat, center, yaw, width=1.0, height=2.0, open_angle=0.0):
    m = xform_matrix(loc=(center[0], height / 2, center[2]), rot=(0, yaw + open_angle, 0))
    # hinge at one edge
    b.add_box(mat, (width / 2, 0, 0), (width, height, 0.05), 1.0, m)


def window_glass(b, center, yaw, w=1.2, h=1.0, sill=1.0, frame_mat="beam", glass_mat="glass"):
    m = xform_matrix(loc=(center[0], sill + h / 2, center[2]), rot=(0, yaw, 0))
    b.add_box(glass_mat, (0, 0, 0), (w, h, 0.02), 1.0, m)
    for dx, dy, sx, sy in ((0, h / 2, w + 0.1, 0.08), (0, -h / 2, w + 0.1, 0.08), (-w / 2, 0, 0.08, h), (w / 2, 0, 0.08, h)):
        b.add_box(frame_mat, (dx, dy, 0), (sx, sy, 0.06), 0.6, m)
    b.add_box(frame_mat, (0, 0, 0), (0.05, h, 0.05), 0.6, m)


def gable_roof(b, mat, cx, cz, w, d, rise=1.4, over=0.45, base_y=3.0, thick=0.09, gable_mat=None):
    half = d / 2 + over
    ridge_y = base_y + rise
    ww = w / 2 + over
    for s in (1, -1):
        eave0 = (cx - ww, base_y, cz + s * half)
        eave1 = (cx + ww, base_y, cz + s * half)
        top1 = (cx + ww, ridge_y, cz)
        top0 = (cx - ww, ridge_y, cz)
        if s > 0:
            b.add_quad(mat, eave0, eave1, top1, top0,
                       uv=((cz + s * half, base_y), (cz + s * half, base_y + w + 2 * over), (cz, ridge_y), (cz, ridge_y)))
            b.add_quad(mat, top0, top1, eave1, eave0,
                       uv=((cz, ridge_y), (cz, ridge_y), (cz + s * half, base_y), (cz + s * half, base_y)))
        else:
            b.add_quad(mat, eave1, eave0, top0, top1,
                       uv=((cz + s * half, base_y + w + 2 * over), (cz + s * half, base_y), (cz, ridge_y), (cz, ridge_y)))
            b.add_quad(mat, top1, top0, eave0, eave1,
                       uv=((cz, ridge_y), (cz, ridge_y), (cz + s * half, base_y), (cz + s * half, base_y)))
        # fascia along the eave
        b.add_box(mat, (cx, base_y - 0.02, cz + s * half), (2 * ww, 0.10, 0.05), 1.0)
    # ridge cap
    b.add_box(mat, (cx, ridge_y + 0.02, cz), (2 * ww, 0.09, 0.20), 1.0)
    # gable end walls (wall material, not roofing)
    gm = gable_mat or mat
    tri_wall(b, gm, cx - w / 2, cz, d, rise, base_y)
    tri_wall(b, gm, cx + w / 2, cz, d, rise, base_y)


def tri_wall(b, mat, x, cz, d, rise, base_y, mat_axis="x"):
    """Triangular gable fill (two quads approximating the triangle)."""
    steps = 4
    for i in range(steps):
        t0, t1 = i / steps, (i + 1) / steps
        y0 = base_y + rise * t0
        y1 = base_y + rise * t1
        half0 = (d / 2) * (1 - t0)
        half1 = (d / 2) * (1 - t1)
        b.add_quad(
            mat,
            (x, y0, cz - half0),
            (x, y0, cz + half0),
            (x, y1, cz + half1),
            (x, y1, cz - half1),
            uv=((cz - half0, y0), (cz + half0, y0), (cz + half1, y1), (cz - half1, y1)),
        )
        b.add_quad(
            mat,
            (x, y0, cz + half0),
            (x, y0, cz - half0),
            (x, y1, cz - half1),
            (x, y1, cz + half1),
            uv=((cz + half0, y0), (cz - half0, y0), (cz - half1, y1), (cz + half1, y1)),
        )


def porch(b, mats, cx, cz, w, d, y=0.0, post_h=2.6):
    b.add_box("wood", (cx, y + 0.06, cz), (w, 0.12, d), 1.2)
    for sx in (-1, 1):
        for sz in (-1, 1):
            b.add_box("beam", (cx + sx * (w / 2 - 0.16), y + post_h / 2, cz + sz * (d / 2 - 0.16)), (0.14, post_h, 0.14), 0.8)
    b.add_box("beam", (cx, y + post_h + 0.08, cz), (w + 0.2, 0.14, 0.14), 0.8)
    m = xform_matrix(loc=(cx, y + post_h + 0.14, cz), rot=(-0.12, 0, 0))
    b.add_box("roof", (0, 0, 0), (w + 0.4, 0.07, d + 0.3), 1.4, m)


def steps(b, mats, cx, cz, w, n=3, rise=0.17, run=0.28):
    for i in range(n):
        b.add_box("wood", (cx, rise / 2 + i * rise, cz + i * run), (w, rise, run), 1.0)


# ------------------------------------------------------------------ buildings
def house_village():
    def build():
        m = mats_for("wood", 0.5)
        b = Builder()
        w, d, h = 6.0, 7.5, 3.0
        b.add_box("floor", (0, -0.15, 0), (w + 0.4, 0.3, d + 0.4), 2.0)
        # walls: front (door + window), back, two sides
        wall(b, "wall", (0, 0, d / 2), w, h, 0.0, dict(x=0.9, y=0.0, w=1.0, h=2.05))
        wall(b, "wall", (0, 0, -d / 2), w, h, 0.0, dict(x=-0.6, y=-0.2, w=1.2, h=1.1))
        wall(b, "wall", (-w / 2, 0, 0), d, h, np.pi / 2, dict(x=1.2, y=-0.2, w=1.2, h=1.1))
        wall(b, "wall", (w / 2, 0, 0), d, h, np.pi / 2)
        door_leaf(b, "wood", (0.4, 0, d / 2 + 0.02), 0.0, 1.0, 2.05, open_angle=-1.1)
        window_glass(b, (-0.6, 0, -d / 2 - 0.02), 0.0, 1.2, 1.1, 1.2)
        window_glass(b, (-w / 2 - 0.02, 0, -1.2), np.pi / 2, 1.2, 1.1, 1.2)
        gable_roof(b, "roof", 0, 0, w, d, rise=1.8, over=0.5, base_y=h, gable_mat="wall")
        # interior: simple partition + shelf
        b.add_box("wall", (1.6, h / 2, 1.2), (2.6, h, 0.12), 1.0)
        porch(b, m, 0, d / 2 + 1.5, 4.4, 2.6)
        steps(b, m, 0.6, d / 2 + 2.9, 1.6)
        return b, m

    return build


def house_old():
    def build():
        m = mats_for("plaster", 0.85)
        b = Builder()
        w, d, h = 7.0, 8.5, 3.2
        b.add_box("floor", (0, -0.15, 0), (w + 0.5, 0.3, d + 0.5), 2.2)
        wall(b, "wall", (0, 0, d / 2), w, h, 0.0, dict(x=-1.2, y=0.0, w=1.1, h=2.1))
        wall(b, "wall", (0, 0, -d / 2), w, h, 0.0, dict(x=1.4, y=-0.1, w=1.5, h=1.3))
        wall(b, "wall", (-w / 2, 0, 0), d, h, np.pi / 2, dict(x=0.5, y=-0.1, w=1.5, h=1.3))
        # right wall partially collapsed: build two stubs
        wall(b, "wall", (w / 2, 0, -d / 2 + 1.0), 2.0, h, np.pi / 2, dict(x=0, y=-0.3, w=1.0, h=1.4))
        wall(b, "wall", (w / 2, 0, d / 2 - 1.2), 2.4, h, np.pi / 2)
        door_leaf(b, "wood", (-1.2, 0, d / 2 + 0.02), 0.0, 1.1, 2.1, open_angle=1.9)
        window_glass(b, (1.4, 0, -d / 2 - 0.02), 0.0, 1.5, 1.3, 1.1)
        gable_roof(b, "tile", 0, 0, w, d, rise=1.9, over=0.4, base_y=h, gable_mat="wall")
        # collapsed roof beams
        for i, (x, rz) in enumerate(((1.6, 0.5), (2.4, 0.9))):
            mm = xform_matrix(loc=(x, h + 0.4 - i * 0.2, 0.4 + i * 0.7), rot=(0.2, 0.3, rz))
            b.add_box("beam", (0, 0, 0), (0.16, 0.16, 3.4), 1.0, mm)
        return b, m

    return build


def shop_warung():
    def build():
        m = mats_for("wood", 0.6)
        b = Builder()
        w, d, h = 4.0, 5.0, 2.7
        b.add_box("floor", (0, -0.12, 0), (w + 0.6, 0.24, d + 0.6), 2.0)
        wall(b, "wall", (0, 0, -d / 2), w, h, 0.0, dict(x=0.0, y=-0.2, w=1.4, h=1.2))
        wall(b, "wall", (-w / 2, 0, 0), d, h, np.pi / 2)
        wall(b, "wall", (w / 2, 0, 0), d, h, np.pi / 2, dict(x=1.0, y=-0.2, w=1.2, h=1.0))
        # open front with counter
        b.add_box("wood", (0, 0.55, d / 2), (w, 1.1, 0.55), 1.0)
        b.add_box("beam", (0, 1.12, d / 2), (w + 0.2, 0.10, 0.7), 0.8)
        for sx in (-1, 1):
            b.add_box("beam", (sx * (w / 2 - 0.1), 1.35, d / 2 + 0.05), (0.12, 2.7, 0.12), 0.8)
        # awning
        mm = xform_matrix(loc=(0, h + 0.12, d / 2 + 0.55), rot=(-0.28, 0, 0))
        b.add_box("roof", (0, 0, 0), (w + 0.4, 0.06, 1.7), 1.4, mm)
        gable_roof(b, "roof", 0, 0, w, d, rise=1.6, over=0.35, base_y=h, gable_mat="wall")
        # interior shelves with goods
        for shelf_y in (0.6, 1.2, 1.8):
            b.add_box("wood", (0, shelf_y, -d / 2 + 0.35), (3.2, 0.05, 0.35), 1.0)
        rng = np.random.default_rng(3)
        for i in range(16):
            x = rng.uniform(-1.5, 1.5)
            y = [0.65, 1.25, 1.85][i % 3]
            b.add_box("beam", (x, y + 0.11, -d / 2 + 0.35), (rng.uniform(0.10, 0.18), rng.uniform(0.16, 0.26), 0.12), 0.5)
        # hanging lamp
        b.add_cylinder("beam", (0, h - 0.05, 0.4), (0, h - 0.55, 0.4), 0.012, 0.012, 6, 1.0)
        b.add_cylinder("lamp", (0, h - 0.62, 0.4), (0, h - 0.72, 0.4), 0.11, 0.07, 12, 1.0)
        # bench outside
        b.add_box("wood", (1.3, 0.42, d / 2 + 0.9), (1.8, 0.07, 0.35), 1.0)
        for sx in (-1, 1):
            b.add_box("beam", (1.3 + sx * 0.75, 0.2, d / 2 + 0.9), (0.08, 0.42, 0.3), 0.6)
        return b, m

    return build


def warehouse():
    def build():
        m = mats_for("steel", 0.55)
        b = Builder()
        w, d, h = 16.0, 24.0, 6.5
        b.add_box("floor", (0, -0.2, 0), (w + 0.6, 0.4, d + 0.6), 3.0)
        # columns
        for x in (-w / 2 + 0.2, w / 2 - 0.2):
            for z in np.arange(-d / 2 + 0.2, d / 2, 4.0):
                b.add_box("beam", (x, h / 2, z), (0.22, h, 0.22), 1.0)
        for z in (-d / 2 + 0.2, d / 2 - 0.2):
            for x in np.arange(-w / 2 + 0.2, w / 2, 4.0):
                b.add_box("beam", (x, h / 2, z), (0.22, h, 0.22), 1.0)
        # walls with high windows and a big roller door
        wall(b, "wall", (0, 0, d / 2), w, h, 0.0, dict(x=2.0, y=-1.4, w=4.5, h=4.2))
        for x in (-5.0, -2.0, 5.0):
            wall(b, "wall", (0, 0, -d / 2), w, h, 0.0, dict(x=x, y=1.3, w=2.0, h=1.2))
        wall(b, "wall", (-w / 2, 0, 0), d, h, np.pi / 2, dict(x=0.0, y=1.3, w=2.0, h=1.2))
        wall(b, "wall", (w / 2, 0, 0), d, h, np.pi / 2, dict(x=6.0, y=1.3, w=2.0, h=1.2))
        # roller door half-open
        b.add_box("wall", (2.0, 4.2 + 0.6, d / 2 + 0.02), (4.5, 1.2, 0.08), 1.2)
        # roof: shallow gable
        gable_roof(b, "roof", 0, 0, w, d, rise=2.0, over=0.5, base_y=h, gable_mat="wall")
        # interior shelving rows
        for z in (-6.0, -1.0, 4.0):
            for x in (-4.0, 4.0):
                b.add_box("beam", (x, 1.4, z), (0.12, 2.8, 7.0), 1.0)
                for yy in (0.4, 1.2, 2.0, 2.7):
                    b.add_box("beam", (x, yy, z), (0.9, 0.05, 7.0), 1.0)
        return b, m

    return build


def kos_room():
    def build():
        m = mats_for("plaster", 0.3)
        b = Builder()
        w, d, h = 4.0, 4.5, 2.8
        b.add_box("floor", (0, -0.1, 0), (w + 0.3, 0.2, d + 0.3), 2.0)
        wall(b, "wall", (0, 0, d / 2), w, h, 0.0, dict(x=-0.9, y=0.0, w=0.95, h=2.05))
        wall(b, "wall", (0, 0, -d / 2), w, h, 0.0, dict(x=1.0, y=-0.1, w=1.1, h=1.1))
        wall(b, "wall", (-w / 2, 0, 0), d, h, np.pi / 2)
        wall(b, "wall", (w / 2, 0, 0), d, h, np.pi / 2, dict(x=1.4, y=0.0, w=0.95, h=2.05))
        door_leaf(b, "wood", (-1.35, 0, d / 2 + 0.02), 0.0, 0.95, 2.05, open_angle=-0.5)
        door_leaf(b, "wood", (w / 2 + 0.02, 0, 1.4), np.pi / 2, 0.95, 2.05, open_angle=0.0)
        window_glass(b, (1.0, 0, -d / 2 - 0.02), 0.0, 1.1, 1.1, 1.0)
        b.add_box("roof", (0, h + 0.06, 0), (w + 0.5, 0.12, d + 0.5), 1.6)
        # simple bed + cupboard
        b.add_box("wood", (-1.1, 0.28, -0.9), (0.9, 0.18, 2.0), 1.0)
        b.add_box("wall", (-1.1, 0.55, -0.9), (0.86, 0.12, 1.9), 1.4)
        b.add_box("wood", (0.2, 0.1, -1.6), (0.5, 0.2, 0.5), 0.8)
        b.add_box("wood", (1.4, 0.9, -1.2), (0.9, 1.8, 0.5), 1.0)
        b.add_cylinder("lamp", (1.0, h - 0.1, 0.6), (1.0, h - 0.28, 0.6), 0.14, 0.10, 12, 1.0)
        return b, m

    return build


# --------------------------------------------------------------------- kit
def kit_wall_plain():
    def build():
        m = mats_for("wood", 0.4)
        b = Builder()
        b.add_box("wall", (0, 1.5, 0), (4.0, 3.0, WALL_T), 1.0)
        return b, m

    return build


def kit_wall_door():
    def build():
        m = mats_for("wood", 0.4)
        b = Builder()
        wall(b, "wall", (0, 0, 0), 4.0, 3.0, 0.0, dict(x=0.0, y=0.0, w=1.0, h=2.05))
        door_leaf(b, "wood", (-0.5, 0, 0.06), 0.0, 1.0, 2.05, open_angle=0.0)
        return b, m

    return build


def kit_wall_window():
    def build():
        m = mats_for("wood", 0.4)
        b = Builder()
        wall(b, "wall", (0, 0, 0), 4.0, 3.0, 0.0, dict(x=0.0, y=0.2, w=1.4, h=1.1))
        window_glass(b, (0, 0, 0.0), 0.0, 1.4, 1.1, 0.9)
        return b, m

    return build


def kit_floor():
    def build():
        m = mats_for("wood", 0.4)
        b = Builder()
        b.add_box("floor", (0, -0.1, 0), (4.0, 0.2, 4.0), 2.0)
        return b, m

    return build


ASSETS = {
    "building.house.village": dict(build=house_village(), title="Rumah kampung papan", tags=["house", "village", "wood", "interior"], category="building"),
    "building.house.old": dict(build=house_old(), title="Rumah tua rusak", tags=["house", "old", "decay", "interior"], category="building"),
    "building.shop.warung": dict(build=shop_warung(), title="Warung kelontong menyala", tags=["shop", "warung", "interior", "night"], category="building"),
    "building.industrial.warehouse": dict(build=warehouse(), title="Gudang industri", tags=["warehouse", "industrial", "interior"], category="building"),
    "building.house.kos": dict(build=kos_room(), title="Kamar kos", tags=["room", "kos", "interior"], category="building"),
    "kit.wall.plain": dict(build=kit_wall_plain(), title="Modul dinding 4×3 m", tags=["kit", "wall"], category="building"),
    "kit.wall.door": dict(build=kit_wall_door(), title="Modul dinding + pintu", tags=["kit", "wall", "door"], category="building"),
    "kit.wall.window": dict(build=kit_wall_window(), title="Modul dinding + jendela", tags=["kit", "wall", "window"], category="building"),
    "kit.floor.tile": dict(build=kit_floor(), title="Modul lantai 4×4 m", tags=["kit", "floor"], category="building"),
}
