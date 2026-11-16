"""Road network assets: modular segments that tile on a metric grid."""
from __future__ import annotations

import numpy as np

from . import tex
from .glb import Material
from .kit import Builder

F = np.float32
W = 4.0  # carriageway width (two 2 m lanes)


def _mats(wet=False):
    a = tex.asphalt(11, wet=wet, size=1024)
    p = tex.painted_metal(5, 256, "#d8d6cc", rust=0.0)
    c = tex.concrete(2, 0.45, 512)
    s = tex.soil(131, 512, damp=True)
    return {
        "asphalt": Material(name="asphalt", base=a["base"], normal=a["normal"], orm=a["orm"], metallic=1.0, roughness=1.0),
        "paint": Material(name="paint", base=p["base"], normal=p["normal"], orm=p["orm"], metallic=1.0, roughness=1.0),
        "concrete": Material(name="concrete", base=c["base"], normal=c["normal"], orm=c["orm"], metallic=1.0, roughness=1.0),
        "soil": Material(name="soil", base=s["base"], normal=s["normal"], orm=s["orm"], metallic=1.0, roughness=1.0),
    }


def _slab(b: Builder, cx, cz, w, d, y=0.0, thick=0.12, yaw=0.0, mat="asphalt", uv=2.0):
    """Metre-scale road slab with a slight crown-free top surface."""
    from .kit import xform_matrix

    m = xform_matrix(loc=(cx, y - thick / 2, cz), rot=(0, yaw, 0))
    b.add_box(mat, (0, 0, 0), (w, thick, d), uv, m, skip_faces=("y-",))


def _line(b: Builder, x0, z0, x1, z1, width=0.12, y=0.004, mat="paint"):
    from .kit import xform_matrix

    dx, dz = x1 - x0, z1 - z0
    length = np.hypot(dx, dz)
    yaw = np.arctan2(dx, dz)
    m = xform_matrix(loc=((x0 + x1) / 2, y, (z0 + z1) / 2), rot=(0, yaw, 0))
    b.add_box(mat, (0, 0, 0), (width, 0.004, length), 1.0, m, skip_faces=("y-",))


def _arc(b: Builder, radius, start, end, width, yaw0=0.0, segments=24, mat="asphalt", uv=2.0, y=0.0, thick=0.12):
    """Ring sector road slab (inner/outer edge and quads)."""
    from .kit import compute_tangents  # noqa: F401

    ring_in, ring_out = radius - width / 2, radius + width / 2
    pos, uvs, idx = [], [], []
    for i in range(segments + 1):
        t = i / segments
        a = start + (end - start) * t
        for r, is_out in ((ring_in, False), (ring_out, True)):
            x = np.sin(a) * r
            z = np.cos(a) * r
            pos.append([x, y, z])
            uvs.append([a * r / uv, (0.0 if not is_out else width / uv)])
    for i in range(segments):
        a = i * 2
        b2 = a + 2
        idx.extend([a, b2, a + 1, a + 1, b2, b2 + 1])
    pos = np.array(pos, F)
    # extrude down so the slab has thickness
    n = len(pos)
    low = pos.copy()
    low[:, 1] -= thick
    verts = np.vstack([pos, low])
    uvs2 = np.vstack([np.array(uvs, F), np.array(uvs, F)])
    idx2 = list(idx) + [[i + n for i in tri][0] for tri in []] + []
    # bottom faces (reverse winding)
    for i in range(segments):
        a = i * 2
        b2 = a + 2
        idx2.extend([a + n, a + 1 + n, b2 + n, a + 1 + n, b2 + 1 + n, b2 + n])
    # outer and inner rims
    for i in range(segments):
        a = i * 2
        b2 = a + 2
        idx2.extend([a, a + n, b2, b2, a + n, b2 + n])  # inner rim
        idx2.extend([a + 1, b2 + 1, a + 1 + n, b2 + 1, b2 + 1 + n, a + 1 + n])  # outer rim
    b.add_raw(mat, verts, idx2, uvs2)


def straight(wet=False):
    def build():
        b = Builder()
        _slab(b, 0, 0, W, 10.0)
        if not wet:
            for s in (-1, 1):
                _line(b, s * (W / 2 - 0.22), -5, s * (W / 2 - 0.22), 5, 0.10)
            for i in range(-2, 3):
                _line(b, 0, i * 2.0 - 0.6, 0, i * 2.0 + 0.6, 0.10)
        return b, _mats(wet)

    return build


def curve(wet=False, radius=8.0):
    def build():
        b = Builder()
        _arc(b, radius, 0, np.pi / 2, W)
        if not wet:
            _arc(b, radius + W / 2 - 0.22, 0.03, np.pi / 2 - 0.03, 0.10, mat="paint", uv=1.0, y=0.004, thick=0.004)
            _arc(b, radius - W / 2 + 0.22, 0.03, np.pi / 2 - 0.03, 0.10, mat="paint", uv=1.0, y=0.004, thick=0.004)
        return b, _mats(wet)

    return build


def tjunction(wet=False):
    def build():
        b = Builder()
        _slab(b, 0, 0, 10.0, 10.0)
        if not wet:
            _line(b, -0.22, 1.0, -0.22, 5.0, 0.10)
            _line(b, 0.22, 1.0, 0.22, 5.0, 0.10)
            _line(b, -5.0, 0.22, -1.0, 0.22, 0.10)
            _line(b, 1.0, 0.22, 5.0, 0.22, 0.10)
            _line(b, -5.0, -0.22, -1.0, -0.22, 0.10)
            _line(b, 1.0, -0.22, 5.0, -0.22, 0.10)
        return b, _mats(wet)

    return build


def cross(wet=False):
    def build():
        b = Builder()
        _slab(b, 0, 0, 12.0, 12.0)
        if not wet:
            for sx in (-1, 1):
                _line(b, sx * 0.22, 1.2, sx * 0.22, 6.0, 0.10)
                _line(b, sx * 0.22, -6.0, sx * 0.22, -1.2, 0.10)
                _line(b, 1.2, sx * 0.22, 6.0, sx * 0.22, 0.10)
                _line(b, -6.0, sx * 0.22, -1.2, sx * 0.22, 0.10)
        return b, _mats(wet)

    return build


def dirt():
    def build():
        b = Builder()
        _slab(b, 0, 0, 3.6, 10.0, thick=0.05)
        # wheel ruts
        for s in (-1, 1):
            _line(b, s * 0.75, -5, s * 0.75, 5, 0.55, 0.002, "soil")
        return b, _mats(False)

    return build


def sidewalk():
    def build():
        b = Builder()
        from .kit import xform_matrix

        b.add_box("concrete", (0, -0.075, 0), (1.3, 0.15, 10.0), 1.2)
        # kerb
        b.add_box("concrete", (-0.68, 0.02, 0), (0.12, 0.20, 10.0), 0.8)
        for i in range(10):
            m = xform_matrix(loc=(0, 0.001, -4.5 + i), rot=(0, 0, 0))
            b.add_box("concrete", (0, 0, 0), (1.28, 0.004, 0.02), 0.6, m, skip_faces=("y-",))
        return b, _mats(False)

    return build


def signpost():
    def build():
        b = Builder()
        p = tex.painted_metal(9, 256, "#5b5f5a", rust=0.35)
        w = tex.wood_planks(52, 256, "#7a6549", planks=4)
        sign = _sign_texture()
        b.add_cylinder("metal", (0, 0, 0), (0, 2.6, 0), 0.055, 0.045, 12, 1.0)
        from .kit import xform_matrix

        m = xform_matrix(loc=(0, 2.35, 0.06), rot=(0.10, 0.0, -0.06))
        b.add_box("board", (0, 0, 0), (2.2, 0.7, 0.06), 1.0, m)
        b.add_box("wood", (0, 0, 0), (2.24, 0.74, 0.04), 1.0, xform_matrix(loc=(0, 2.35, 0.02), rot=(0.10, 0, -0.06)))
        mats = {
            "metal": Material(name="metal", base=p["base"], normal=p["normal"], orm=p["orm"], metallic=1.0, roughness=1.0),
            "board": Material(name="sign-board", base=sign["base"], normal=sign["normal"], orm=sign["orm"], metallic=1.0, roughness=1.0),
            "wood": Material(name="wood", base=w["base"], normal=w["normal"], orm=w["orm"], metallic=1.0, roughness=1.0),
        }
        return b, mats

    return build


def _sign_texture(text="DESA SUKAMAJU", sub="12 km", size=512):
    from PIL import Image, ImageDraw, ImageFont

    yy = tex.fbm(size, size, 20, 3, 0.5, 3)
    img = np.clip(0.72 + yy[..., None] * 0.12, 0, 1) * np.array([0.88, 0.88, 0.82], F)
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    try:
        f1 = ImageFont.load_default(size=52)
        f2 = ImageFont.load_default(size=64)
    except TypeError:
        f1 = f2 = ImageFont.load_default()
    d.text((size / 2, size * 0.36), text, fill=(30, 38, 34), font=f1, anchor="mm")
    d.text((size / 2, size * 0.62), sub, fill=(30, 38, 34), font=f2, anchor="mm")
    base = np.asarray(im, F) / 255
    rust = np.clip((tex.fbm(size, size, 12, 3, 0.55, 8) - 0.66) * 5, 0, 1)
    base = base * (1 - rust[..., None] * 0.7) + np.array([0.44, 0.26, 0.14], F) * (rust[..., None] * 0.7)
    height = 0.5 + (base.mean(-1) - 0.5) * 0.4 + tex.fbm(size, size, 90, 2, 0.5, 5) * 0.1
    return {
        "base": np.clip(base, 0, 1),
        "normal": tex.height_to_normal(height, 1.6),
        "orm": tex.orm(np.ones((size, size), F), 0.7 - rust * 0.2, 0.2 + rust * 0.6),
    }


def powerpole():
    def build():
        b = Builder()
        p = tex.bark(66, 512, "#6a5a48", kind="dead")
        w = tex.wood_planks(53, 256, "#5c4a37", planks=2)
        cable = tex.painted_metal(3, 128, "#22262a", rust=0.1)
        b.add_tube("pole", [(0, 0, 0), (0, 3.2, 0.05), (0, 6.6, 0.02), (0, 8.0, 0)], [0.16, 0.14, 0.11, 0.09], 10, 1.0)
        for y in (6.9, 7.5):
            b.add_box("cross", (0, y, 0), (2.0, 0.09, 0.11), 1.0)
            for x in (-0.85, 0.85):
                b.add_cylinder("cable", (x, y + 0.04, 0), (x, y + 0.16, 0), 0.035, 0.035, 8, 1.0)
        mats = {
            "pole": Material(name="pole", base=p["base"], normal=p["normal"], orm=p["orm"], metallic=1.0, roughness=1.0),
            "cross": Material(name="crossarm", base=w["base"], normal=w["normal"], orm=w["orm"], metallic=1.0, roughness=1.0),
            "cable": Material(name="insulator", base=cable["base"], normal=cable["normal"], orm=cable["orm"], metallic=1.0, roughness=1.0),
        }
        return b, mats

    return build


ASSETS = {
    "road.asphalt.straight": dict(build=straight(False), title="Aspal lurus 4×10 m", tags=["road", "asphalt", "straight"], category="road"),
    "road.asphalt.wet": dict(build=straight(True), title="Aspal basah lurus 4×10 m", tags=["road", "asphalt", "wet", "night"], category="road"),
    "road.asphalt.curve": dict(build=curve(False), title="Aspal tikungan 90° (R=8 m)", tags=["road", "asphalt", "curve"], category="road"),
    "road.asphalt.tjunction": dict(build=tjunction(False), title="Persimpangan T 10×10 m", tags=["road", "asphalt", "junction"], category="road"),
    "road.asphalt.cross": dict(build=cross(False), title="Persimpangan + 12×12 m", tags=["road", "asphalt", "junction"], category="road"),
    "road.dirt.straight": dict(build=dirt(), title="Jalan tanah 3,6×10 m", tags=["road", "dirt", "village"], category="road"),
    "road.sidewalk.segment": dict(build=sidewalk(), title="Trotoar + kerb 10 m", tags=["road", "sidewalk", "concrete"], category="road"),
    "road.prop.signpost": dict(build=signpost(), title="Papan nama desa + tiang", tags=["road", "sign", "prop"], category="prop"),
    "road.prop.powerpole": dict(build=powerpole(), title="Tiang listrik + kabel", tags=["road", "pole", "prop"], category="prop"),
}
