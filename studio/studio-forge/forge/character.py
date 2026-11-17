"""Build rigged character GLBs from the MakeHuman CC0 base + generated layers."""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from . import human, tex, uvpaint
from .assemble import write_skinned_glb
from .glb import Material
from .human import CLIPS, build_hair_shell, build_long_hair, shape, to_metres
from .kit import compute_normals_welded
from .skinpaint import paint_skin
from .uvpaint import smoothstep

F = np.float32
ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
HEIGHT_UNITS = 16.659
FEET_Y = -8.168

# ------------------------------------------------------------------ wardrobe
# Satu set pakaian = daftar potongan kain prosedural (human.PIECES) + warna.
# Potongan dipotong dari permukaan tubuh, jadi otomatis pas di semua umur.
# Id outfit dipakai di SPECS (`outfit`) dan dipilih cerita untuk tukar kostum.
WARDROBE = {
    "polo-kargo": {"cloth": [("shirt-short", "#d9dee4"), ("pants", "#9aa98a")], "shoes": "shoes01"},
    "kemeja-kasual": {"cloth": [("shirt-long", "#46536b"), ("pants", "#37414f")], "shoes": "shoes01"},
    "jaket": {"cloth": [("shirt-long", "#2f343d"), ("pants", "#262a31")], "shoes": "shoes01"},
    "seragam": {"cloth": [("shirt-short", "#93b8e6"), ("pants", "#5d7ea8")], "shoes": "shoes01"},
    # Warna daster sengaja jauh dari warna kulit: dengan #e0a1a9 (pink pucat)
    # tokoh terbaca seperti telanjang di shot lebar, bukan memakai baju.
    "daster": {"cloth": [("tunic", "#bf5a72"), ("shorts", "#b0546a")], "shoes": "shoes01"},
    "kerja": {"cloth": [("shirt-long", "#6f7a5b"), ("pants", "#414a3a")], "shoes": "shoes01"},
}

DEFAULT_SKIN = dict(tone="#b98a63", red="#ad5f4c", lip="#8c4a44", age=0.32, sex="male", stubble=0.4, seed=11)
DEFAULT_HAIR = dict(style="short", color="#151110", thickness=0.030, long=0.0)


def darker(color: str, factor: float) -> str:
    """Warna hex yang digelapkan (untuk pita jahitan)."""
    c = color.lstrip("#")
    r, g, b = (int(c[i : i + 2], 16) for i in (0, 2, 4))
    return "#%02x%02x%02x" % (int(r * factor), int(g * factor), int(b * factor))


def _char(title, tags, profile, height, shape_, skin, hair, outfit, **kw):
    """Satu baris per tokoh: profil umur + tinggi + bentuk + kulit + rambut + outfit."""
    spec = {
        "title": title,
        "category": "character",
        "tags": tags,
        "profile": profile,
        "height": height,
        "shape": shape_,
        "skin": skin,
        "hair": hair,
        "cloth": [list(pc) for pc in WARDROBE[outfit]["cloth"]],
        "shoes": WARDROBE[outfit].get("shoes"),
        "outfit": outfit,
    }
    spec.update(kw)
    return spec


_CHILD_SHAPE = dict(shoulder=-0.55, chest=-0.35, waist=0.0, limb=-0.45, jaw_w=-0.45, brow=-0.1, cheek=0.35, nose_w=-0.2)
_TEEN_SHAPE = dict(shoulder=-0.35, chest=-0.15, waist=0.05, limb=-0.25, jaw_w=-0.25, cheek=0.15)

SPECS = {
    # ---------------------------------------------------------------- dewasa
    "char.male-dewasa-polo": _char(
        "Pria dewasa — polo & celana kargo", ["human", "male", "adult", "rider", "indonesian"], "dewasa", 1.72,
        dict(shoulder=0.35, chest=0.25, waist=0.05, jaw_w=0.35, brow=0.35, chin_fwd=0.3, cheek=0.1, neck=0.1),
        dict(tone="#b98a63", red="#ad5f4c", lip="#8c4a44", age=0.32, sex="male", stubble=0.5, seed=11),
        dict(style="short", color="#151110", thickness=0.030, long=0.0), "polo-kargo"),
    "char.female-dewasa": _char(
        "Wanita dewasa — polo & kargo", ["human", "female", "adult", "mother", "indonesian"], "dewasa", 1.605,
        dict(shoulder=-0.55, chest=-0.15, waist=0.55, hip=0.85, glute=0.4, limb=-0.35, jaw_w=-0.45, brow=-0.2,
             cheek=0.35, lip_full=0.6, lip_fwd=0.3, chin_drop=-0.15, nose_w=-0.25, neck=-0.2, skull_w=-0.15),
        dict(tone="#c69a74", red="#b0604f", lip="#a05a54", age=0.4, sex="female", stubble=0.0, seed=41),
        dict(style="long", color="#17120f", thickness=0.036, long=1.0), "polo-kargo"),
    "char.male-muda-jaket": _char(
        "Pria muda — setelan kasual", ["human", "male", "teen", "worker", "indonesian"], "dewasa", 1.64,
        dict(shoulder=-0.2, chest=-0.1, waist=0.15, limb=-0.25, jaw_w=-0.15, chin_drop=0.1, nose_w=-0.1),
        dict(tone="#c1936b", red="#b06552", lip="#95504a", age=0.15, sex="male", stubble=0.15, seed=23),
        dict(style="messy", color="#100d0b", thickness=0.042, long=0.0), "jaket"),
    "char.male-pekerja": _char(
        "Pekerja gudang — setelan kerja", ["human", "male", "adult", "worker", "guard"], "dewasa", 1.70,
        dict(shoulder=0.55, chest=0.45, belly=0.25, limb=0.35, jaw_w=0.55, brow=0.55, neck=0.3),
        dict(tone="#a87a56", red="#a35847", lip="#82463f", age=0.45, sex="male", stubble=0.85, dirt=0.25, seed=67),
        dict(style="short", color="#0f0c0a", thickness=0.026, long=0.0), "kerja"),
    # ---------------------------------------------------------------- lansia
    "char.male-lansia-kemeja": _char(
        "Pria lansia — kemeja lusuh", ["human", "male", "elder", "father", "indonesian"], "lansia", 1.665,
        dict(shoulder=-0.1, chest=0.1, belly=0.45, waist=-0.1, jaw_w=0.1, hollow=0.7, jowl=0.8, chin_drop=0.25,
             lip_full=-0.4, neck=0.1, neck_fwd=0.35, ear=0.25),
        dict(tone="#b98f6c", red="#a95c4c", lip="#84514b", age=0.95, sex="male", stubble=0.75, freckles=0.5, seed=37),
        dict(style="receding", color="#8d8880", thickness=0.028, long=0.0), "kemeja-kasual"),
    "char.female-lansia": _char(
        "Wanita lansia — ibu", ["human", "female", "elder", "mother", "indonesian"], "lansia", 1.545,
        dict(shoulder=-0.45, chest=-0.1, belly=0.3, waist=0.4, hip=0.6, limb=-0.45, hollow=0.75, jowl=0.85,
             jaw_w=-0.4, lip_full=-0.3, neck=-0.15, neck_fwd=0.3, ear=0.2, skull_w=-0.1),
        dict(tone="#bd9270", red="#a65a4b", lip="#8a544e", age=1.0, sex="female", stubble=0.0, freckles=0.4, seed=53),
        dict(style="bun", color="#9a958c", thickness=0.032, long=0.55), "daster"),
    # ---------------------------------------------------------------- remaja
    "char.remaja-laki": _char(
        "Remaja laki-laki — seragam", ["human", "male", "teen", "student", "indonesian"], "remaja", 1.56,
        dict(_TEEN_SHAPE, jaw_w=-0.1, brow=0.15, neck=0.05),
        dict(tone="#c39268", red="#b2604d", lip="#94504a", age=0.12, sex="male", stubble=0.05, seed=71),
        dict(style="fringe", color="#141010", thickness=0.038, long=0.0), "seragam"),
    "char.remaja-perempuan": _char(
        "Remaja perempuan — seragam", ["human", "female", "teen", "student", "indonesian"], "remaja", 1.50,
        dict(_TEEN_SHAPE, shoulder=-0.5, waist=0.45, hip=0.55, jaw_w=-0.5, cheek=0.4, lip_full=0.5),
        dict(tone="#c99b76", red="#b2614f", lip="#a55a53", age=0.15, sex="female", stubble=0.0, seed=73),
        dict(style="ponytail", color="#171210", thickness=0.036, long=0.75), "seragam"),
    # ---------------------------------------------------------------- anak
    "char.anak-laki": _char(
        "Anak laki-laki (5–6 tahun) — kaos", ["human", "male", "child", "kid", "indonesian"], "anak", 1.15,
        dict(_CHILD_SHAPE, belly=0.35, cheek=0.5),
        dict(tone="#c99a6f", red="#b3624f", lip="#9a544c", age=0.08, sex="male", stubble=0.0, seed=81),
        dict(style="bowl", color="#120f0d", thickness=0.030, long=0.0), "seragam"),
    "char.anak-perempuan": _char(
        "Anak perempuan (5–6 tahun) — kaos", ["human", "female", "child", "kid", "indonesian"], "anak", 1.12,
        dict(_CHILD_SHAPE, belly=0.3, hip=0.2, jaw_w=-0.55, cheek=0.55, lip_full=0.45),
        dict(tone="#cfa17b", red="#b46350", lip="#a95e56", age=0.08, sex="female", stubble=0.0, seed=83),
        dict(style="twin-tails", color="#150f0d", thickness=0.032, long=0.6), "daster"),
    # ---------------------------------------------------------------- balita
    "char.balita-laki": _char(
        "Balita laki-laki (2–3 tahun)", ["human", "male", "toddler", "kid", "indonesian"], "balita", 0.94,
        dict(_CHILD_SHAPE, belly=0.5, shoulder=-0.6, cheek=0.6, jaw_w=-0.55),
        dict(tone="#cb9a72", red="#b76450", lip="#9c564d", age=0.05, sex="male", stubble=0.0, seed=91),
        dict(style="bowl", color="#100d0b", thickness=0.028, long=0.0), "seragam"),
    "char.balita-perempuan": _char(
        "Balita perempuan (2–3 tahun)", ["human", "female", "toddler", "kid", "indonesian"], "balita", 0.91,
        dict(_CHILD_SHAPE, belly=0.45, hip=0.15, shoulder=-0.62, jaw_w=-0.6, cheek=0.65, lip_full=0.5),
        dict(tone="#d0a27c", red="#b76552", lip="#aa6058", age=0.05, sex="female", stubble=0.0, seed=93),
        dict(style="twin-tails", color="#160f0d", thickness=0.030, long=0.45), "daster"),
    # --------------------------------------------------- varian pakaian (buktikan swap)
    "char.male-dewasa-kemeja": _char(
        "Pria dewasa — kemeja (varian outfit)", ["human", "male", "adult", "variant"], "dewasa", 1.72,
        dict(shoulder=0.35, chest=0.25, waist=0.05, jaw_w=0.35, brow=0.35, chin_fwd=0.3, cheek=0.1, neck=0.1),
        dict(tone="#b98a63", red="#ad5f4c", lip="#8c4a44", age=0.32, sex="male", stubble=0.5, seed=11),
        dict(style="short", color="#151110", thickness=0.030, long=0.0), "kemeja-kasual",
        variant_of="char.male-dewasa-polo"),
    "char.female-dewasa-daster": _char(
        "Wanita dewasa — daster (varian outfit)", ["human", "female", "adult", "variant"], "dewasa", 1.605,
        dict(shoulder=-0.55, chest=-0.15, waist=0.55, hip=0.85, glute=0.4, limb=-0.35, jaw_w=-0.45, brow=-0.2,
             cheek=0.35, lip_full=0.6, lip_fwd=0.3, chin_drop=-0.15, nose_w=-0.25, neck=-0.2, skull_w=-0.15),
        dict(tone="#c69a74", red="#b0604f", lip="#a05a54", age=0.4, sex="female", stubble=0.0, seed=41),
        dict(style="long", color="#17120f", thickness=0.036, long=1.0), "daster",
        variant_of="char.female-dewasa"),
}

# Peta varian outfit: asset asal → {outfit: asset varian}. Dipakai cerita lewat
# `cast.<nama>.outfit` (lihat docs/STORY-FORMAT.md §5c).
OUTFIT_VARIANTS = {
    "char.male-dewasa-polo": {"polo-kargo": "char.male-dewasa-polo", "kemeja-kasual": "char.male-dewasa-kemeja"},
    "char.female-dewasa": {"polo-kargo": "char.female-dewasa", "daster": "char.female-dewasa-daster"},
}


def _metres(bones, height):
    S = height / HEIGHT_UNITS
    off = np.array([0, FEET_Y, 0], F)
    out = []
    for b in bones:
        out.append({"name": b["name"], "parent": b["parent"], "p": (np.asarray(b["p"], F) - off) * S})
    return out, S, off


def human_normals(pos, idx):
    from .kit import compute_normals_welded as cw

    return cw(np.asarray(pos, F), np.asarray(idx, np.int64))


def _torso_weights(points, bones, keys=("pelvis", "spine", "chest", "neck", "head", "clavicle")):
    """Blend cloth vertices between the two nearest torso bones.

    Transferring weights from the nearest *body* vertex lets arm bones grab the
    sides of a shroud, so the sleeves of cloth swing with the arms and the robe
    tears open. Cloth should follow the spine only.
    """
    idx = [i for i, b in enumerate(bones) if any(k in b["name"] for k in keys)]
    J = np.zeros((len(points), 4), np.int64)
    W = np.zeros((len(points), 4), F)
    bp = np.array([bones[i]["p"] for i in idx], dtype=np.float64)
    for n, q in enumerate(points):
        d = np.linalg.norm(bp - np.asarray(q, np.float64), axis=1)
        order = np.argsort(d)[:2]
        w = 1.0 / np.maximum(d[order], 1e-4)
        w = w / w.sum()
        J[n, 0], J[n, 1] = idx[order[0]], idx[order[1]]
        W[n, 0], W[n, 1] = w[0], w[1]
    return J, W


def _nearest_weights(points, base, bones):
    """Transfer skin weights from the nearest body vertex (head-region only)."""
    P = base["pos"]
    head = np.flatnonzero(P[:, 1] > 5.4)
    idx = np.empty(len(points), np.int64)
    for i, q in enumerate(points):
        d = ((P[head] - q) ** 2).sum(1)
        idx[i] = head[int(np.argmin(d))]
    return base["skinIndex"][idx], base["skinWeight"][idx]


def _dome(center, sphere_r, disc_r, segs=28, rings=6):
    """Spherical cap on a sphere of radius `sphere_r`, covering radius `disc_r`."""
    verts, uvs, idx = [], [], []
    for r in range(rings + 1):
        rr = disc_r * r / rings
        for j in range(segs + 1):
            a = 2 * np.pi * j / segs
            x = np.cos(a) * rr
            y = np.sin(a) * rr
            z = np.sqrt(max(0.0, sphere_r * sphere_r - rr * rr - 1e-6))
            verts.append([center[0] + x, center[1] + y, center[2] + z * 0.999])
            uvs.append([0.5 + x / (2 * disc_r), 0.5 + y / (2 * disc_r)])
    for r in range(rings):
        for j in range(segs):
            a = r * (segs + 1) + j
            b = a + segs + 1
            idx.extend([a, b, a + 1, a + 1, b, b + 1])
    return np.array(verts, F), np.array(uvs, F), np.array(idx, np.int64)


def _sphere(center, radius, segs=28, rings=18):
    verts, uvs, idx = [], [], []
    for i in range(rings + 1):
        phi = np.pi * i / rings
        for j in range(segs + 1):
            th = 2 * np.pi * j / segs
            n = np.array([np.cos(th) * np.sin(phi), np.cos(phi), np.sin(th) * np.sin(phi)], F)
            verts.append(center + n * radius)
            uvs.append([j / segs, i / rings])
    for i in range(rings):
        for j in range(segs):
            a = i * (segs + 1) + j
            b = a + segs + 1
            idx.extend([a, b, a + 1, a + 1, b, b + 1])
    return np.array(verts, F), np.array(uvs, F), np.array(idx, np.int64)


def build(asset_id, spec, out_dir, size=2048, fps=30, entities=False):
    b = human.base()
    shape_spec = spec.get("shape", {})
    profile = human.PROFILES.get(spec.get("profile", "dewasa"), human.PROFILES["dewasa"])
    # Proporsi umur diterapkan pada mesh, pakaian, dan tulang dengan kurva yang
    # sama; tanpa ini "anak" hanya orang dewasa yang diperkecil (kepala kecil,
    # kaki panjang) dan klipnya jadi aneh.
    P = human.apply_proportions(shape(b["pos"], shape_spec), profile)
    if entities:
        from .entity import shape_entity

        P = shape_entity(P, spec)
    idx = b["idx"]
    uv = b["uv"]

    # ------------------------------------------------------------- textures
    pos_map, nrm_map, mask = uvpaint.rasterize_uv(P, uv, idx, size)
    filled, _ = uvpaint.fill_holes(pos_map, mask, 2)
    skin_spec = dict(spec["skin"])
    skin_maps = paint_skin(filled, nrm_map, mask, size, skin_spec)

    # ------------------------------------------------------------ garments
    # Kain diturunkan dari permukaan tubuh (human.body_cloth): potongan mengikuti
    # tulang yang mendominasi, jadi tidak ada lubang crotch, tidak ada segitiga
    # menghadap ke dalam, dan tidak ada badan menembus kain. Sepatu tetap dari
    # paket kain jadi — bentuknya sudah benar.
    Nbody = compute_normals_welded(P, idx)
    # Kain dipotong pada mesh yang **sudah diproporsi**. Karena itu bidang potong,
    # tinggi kancing, dan posisi tulang acuan (sendi bahu, panggul, leher) harus
    # berada di ruang yang sama — yaitu lewat kurva proporsi yang sama. Dulu
    # ketiganya memakai angka unit MH mentah: pada balita garis leher y = 6,20
    # jatuh di dagu (kerah menutup mulut) sementara dewasa nyaris tidak terlihat
    # bedanya.
    _pc = human.proportion_curve(profile)

    def _f_y(v):
        return float(_pc(np.array([v], human.F))[0][0])

    b_cloth = {**b, "bones": human.proportion_bones(b["bones"], profile)}
    garment_parts = []
    for piece_name, color in spec.get("cloth", []):
        raw_piece = human.PIECES[piece_name]
        piece_spec = dict(raw_piece, y=(_f_y(raw_piece["y"][0]), _f_y(raw_piece["y"][1])))
        piece = human.body_cloth(b_cloth, P, Nbody, idx, uv, piece_spec)
        if piece is None:
            continue
        piece["tex"] = human.fabric_texture(color, seed=abs(hash(piece_name + color)) % 997)
        # Lubang kecil di garis leher/bahu (segitiga yang tulangnya beda) ditutup.
        from . import kit as _kit

        gp2, fixed_idx, fixed = _kit.fill_small_holes(
            piece["pos"],
            piece["indices"],
            {"uv": piece["uv"], "skinIndex": piece["skinIndex"], "skinWeight": piece["skinWeight"]},
            max_loop=14,
            max_extent=0.6,
        )
        piece["pos"] = gp2
        piece["indices"] = fixed_idx
        piece["uv"], piece["skinIndex"], piece["skinWeight"] = fixed["uv"], fixed["skinIndex"], fixed["skinWeight"]
        piece["normals"] = compute_normals_welded(gp2, fixed_idx)
        garment_parts.append((piece_name, piece, piece["pos"]))

        # Kerah + kancing: dua detail yang membuat kain terbaca sebagai baju,
        # bukan bodysuit. Keduanya bagian terpisah dengan bahan lebih tua.
        neck_y = _f_y(5.55)  # di bawah dagu (neck01.y = 5,89 unit MH)
        extras = []
        collar = human.collar_ring(
            piece["pos"], piece["indices"], piece["skinIndex"], piece["skinWeight"],
            piece["uv"], piece["normals"], neck_y,
        )
        if collar is not None:
            extras.append(collar)
        btn = human.buttons(
            piece["pos"], piece["indices"], piece["normals"],
            [_f_y(h) for h in raw_piece.get("buttons", ())],
        )
        if btn is not None:
            src = btn["src"]
            extras.append(
                {
                    "pos": btn["pos"],
                    "indices": btn["indices"],
                    "uv": piece["uv"][src],
                    "skinIndex": piece["skinIndex"][src],
                    "skinWeight": piece["skinWeight"][src],
                }
            )
        if extras:
            trim = {
                "pos": np.concatenate([x["pos"] for x in extras]),
                "indices": np.concatenate(
                    [x["indices"] + sum(len(y["pos"]) for y in extras[:k]) for k, x in enumerate(extras)]
                ),
                "uv": np.concatenate([x["uv"] for x in extras]),
                "skinIndex": np.concatenate([x["skinIndex"] for x in extras]),
                "skinWeight": np.concatenate([x["skinWeight"] for x in extras]),
            }
            # UV trim = satu titik di tengah atlas: pita kerah dan kancing
            # berwarna rata, jadi tidak butuh area UV sendiri. Memakai UV kain
            # akan menumpuk di wilayah yang sama dan dilaporkan qc-uv sebagai
            # tumpang tindih tak sengaja.
            # UV trim = satu titik: pita kerah dan kancing berwarna rata, jadi
            # tidak punya wilayah UV sendiri. Memakai UV kain membuat texel pita
            # menumpuk di wilayah body (qc-uv: tabrakan), sedangkan kotak kecil
            # pun tetap bertumpuk karena 206 segitiga tidak mungkin dipetakan
            # tanpa tumpang tindih ke kotak sekecil itu. UV titik = luas nol.
            trim["uv"] = np.tile(np.array([0.5, 0.5], F), (len(trim["pos"]), 1))
            trim["tex"] = human.fabric_texture(
                darker(color, 0.30), seed=(abs(hash(piece_name + color)) % 997) + 1
            )
            trim["normals"] = compute_normals_welded(trim["pos"], trim["indices"])
            garment_parts.append((f"{piece_name}-trim", trim, trim["pos"]))

    if spec.get("shoes"):
        gname = spec["shoes"]
        pack = human.garment_pack(gname, hash(gname) % 1000)
        gp = human.apply_proportions(shape(pack["positions"], shape_spec), profile)
        if entities:
            from .entity import shape_entity

            gp = shape_entity(P, spec)
        from . import kit as _kit

        gp, fixed_idx, fixed = _kit.fill_small_holes(
            gp,
            pack["indices"],
            {"uv": pack["uv"], "skinIndex": pack["skinIndex"], "skinWeight": pack["skinWeight"]},
            max_loop=12,
            max_extent=1.2,
        )
        pack["indices"], pack["uv"] = fixed_idx, fixed["uv"]
        pack["skinIndex"], pack["skinWeight"] = fixed["skinIndex"], fixed["skinWeight"]
        pack["indices"], _ = _kit.orient_consistently(
            gp, pack["indices"], outward_from=(0.0, float(np.mean(gp[:, 1])), 0.0)
        )
        gn = human_normals(gp, pack["indices"])
        gp = gp + gn * 0.012
        garment_parts.append((gname, pack, gp))

    body_idx = idx
    bones, S, off = _metres(human.proportion_bones(b["bones"], profile), spec["height"])
    # Rantai tulang kain untuk shroud/veil. Sudah ada sejak awal supaya indeks
    # sendi di mesh bisa menunjuk ke sini; tanpa tulang, kain hanya bisa ikut
    # punggung dan mustahil berayun.
    bones, cloth_span = _add_cloth_bones(bones, spec, S, off)
    name_to_i = {bn["name"]: i for i, bn in enumerate(bones)}

    def to_m(p):
        return (np.asarray(p, F) - off) * S

    parts = []
    body_normals = compute_normals_welded(to_m(P), body_idx)
    parts.append(
        {
            "pos": to_m(P),
            "uv": uv,
            "idx": body_idx,
            "normals": body_normals,
            "joints": b["skinIndex"],
            "weights": b["skinWeight"],
            "mat": Material(
                name="skin",
                base=skin_maps["base"],
                normal=skin_maps["normal"],
                orm=skin_maps["orm"] if skin_maps["orm"].shape[0] <= 1024 else _down(skin_maps["orm"], 1024),
                metallic=1.0,
                roughness=1.0,
                normal_scale=1.0,
            ),
        }
    )

    for gname, pack, gp in garment_parts:
        mp = to_m(gp)
        nrm = pack.get("normals")
        if nrm is None or len(nrm) != len(mp):
            nrm = compute_normals_welded(mp, pack["indices"])
        t = pack["tex"]
        parts.append(
            {
                "pos": mp,
                "uv": pack["uv"],
                "idx": pack["indices"],
                "normals": nrm,
                "joints": pack["skinIndex"],
                "weights": pack["skinWeight"],
                "mat": Material(
                    name=f"cloth-{gname}",
                    base=t["base"],
                    normal=t["normal"],
                    orm=t["orm"],
                    metallic=1.0,
                    roughness=1.0,
                    normal_scale=1.0,
                    base_color=(1, 1, 1, 1),
                    # Cloth panels are thin and some arrive partially inverted;
                    # two-sided keeps sleeves/hair cards from vanishing.
                    double_sided=True,
                ),
            }
        )

    # --------------------------------------------------------------- eyes
    eye_tex = human.eye_texture(256, iris=spec.get("iris", "#4a2f1c"), sclera=skin_spec.get("tone", "#ded6c8"))
    sclera_tex = human.sclera_texture(256)
    for side in ("L", "R"):
        bone = bones[name_to_i[human.EYE_BONE[side]]]
        c = np.asarray(bone["p"], F)
        R = 0.0116 * (spec["height"] / 1.70)
        c = c + np.array([0, 0, -0.0065], F)
        verts, uvs, iix = _sphere(c, R, 24, 16)
        parts.append(
            {
                "pos": verts,
                "uv": uvs,
                "idx": iix,
                "joints": np.tile([name_to_i[human.EYE_BONE[side]], 0, 0, 0], (len(verts), 1)).astype(np.uint16),
                "weights": np.tile([1.0, 0, 0, 0], (len(verts), 1)).astype(F),
                "mat": Material(
                    name=f"sclera-{side}",
                    base=sclera_tex["base"],
                    normal=sclera_tex["normal"],
                    orm=sclera_tex["orm"],
                    metallic=1.0,
                    roughness=1.0,
                ),
            }
        )
        iris_r = R * 0.476
        dv, duv2, dix = _dome(c, R * 1.004, iris_r, 28, 5)
        parts.append(
            {
                "pos": dv,
                "uv": duv2,
                "idx": dix,
                "joints": np.tile([name_to_i[human.EYE_BONE[side]], 0, 0, 0], (len(dv), 1)).astype(np.uint16),
                "weights": np.tile([1.0, 0, 0, 0], (len(dv), 1)).astype(F),
                "mat": Material(
                    name=f"iris-{side}",
                    base=eye_tex["base"],
                    normal=eye_tex["normal"],
                    orm=eye_tex["orm"],
                    metallic=0.0,
                    roughness=1.0,
                    double_sided=False,
                ),
            }
        )

    # -------------------------------------------------------- shroud / veil
    if spec.get("shroud"):
        from .entity import shroud

        # Shroud specs are authored on a 7.32-unit-tall body with 0 at the feet;
        # the mesh is in raw MakeHuman units (feet at FEET_Y), so convert.
        k = HEIGHT_UNITS / 7.32
        cfg = dict(spec["shroud"])
        cfg["y_top"] = FEET_Y + float(cfg.get("y_top", 5.6)) * k
        cfg["y_bottom"] = FEET_Y + float(cfg.get("y_bottom", -0.6)) * k
        # Follow the *torso* silhouette only: arms inflate a raw cross-section
        # percentile into a cape, which is what made the old shrouds look like
        # tutus.
        dom = np.asarray(parts[0]["joints"])[:, 0]
        torso = np.array(
            [
                any(k in bones[int(i)]["name"] for k in ("pelvis", "spine", "chest", "neck", "head", "clavicle", "breast"))
                for i in dom
            ]
        )
        sp, suv, sidx = shroud(P[torso], **cfg)
        j, w = (
            _cloth_weights(to_m(sp), bones, cloth_span)
            if cloth_span
            else _torso_weights(to_m(sp), bones)
        )
        cloth = tex.fabric(7, 512, (0.42, 0.44, 0.42), weave=200, folds=0.75)
        parts.append(
            {
                "pos": to_m(sp),
                "uv": suv,
                "idx": sidx,
                "joints": j,
                "weights": w,
                "mat": Material(name="shroud", base=cloth["base"], normal=cloth["normal"], orm=cloth["orm"],
                                metallic=0.0, roughness=1.0, double_sided=True, alpha_mode="BLEND" if spec.get("alpha") else None),
            }
        )
    if spec.get("veil"):
        from .entity import veil

        vp_, vuv, vidx = veil(**spec["veil"])
        j, w = _torso_weights(to_m(vp_), bones, keys=("head", "neck"))
        cloth2 = tex.fabric(9, 512, (0.50, 0.50, 0.48), weave=230, folds=0.6)
        parts.append(
            {
                "pos": to_m(vp_),
                "uv": vuv,
                "idx": vidx,
                "joints": j,
                "weights": w,
                "mat": Material(name="veil", base=cloth2["base"], normal=cloth2["normal"], orm=cloth2["orm"],
                                metallic=0.0, roughness=1.0, double_sided=True),
            }
        )

    # --------------------------------------------------------------- hair
    hs = spec.get("hair", {})
    hair_tex = human.hair_texture(512, hs.get("color", "#161210"), hs.get("style", "short"))
    hair_built = None if hs.get("style") == "bald" else build_hair_shell(P, None, idx, hs.get("style", "short"), hs.get("thickness", 0.03))
    if hair_built is not None:
        hpos, huvs, hidx, used, hw = hair_built
        mp = to_m(hpos)
        alpha = _hair_alpha_hairline(hpos, huvs, hidx, hs.get("style", "short"))
        base_rgba = np.concatenate([hair_tex["base"], alpha[..., None]], -1)
        parts.append(
            {
                "pos": mp,
                "uv": huvs,
                "idx": hidx,
                "joints": b["skinIndex"][used],
                "weights": b["skinWeight"][used],
                "mat": Material(
                    name="hair",
                    base=base_rgba,
                    normal=hair_tex["normal"],
                    orm=hair_tex["orm"],
                    metallic=0.0,
                    roughness=1.0,
                    double_sided=True,
                    alpha_mode="MASK",
                    alpha_cutoff=0.45,
                ),
            }
        )
    if hs.get("long", 0) > 0:
        lpos, luv, lidx = build_long_hair(P, hs.get("style"), hs.get("thickness", 0.03), hs["long"])
        j, w = _nearest_weights(lpos, b, bones)
        parts.append(
            {
                "pos": to_m(lpos),
                "uv": luv,
                "idx": lidx,
                "joints": j,
                "weights": w,
                "mat": Material(name="hair-long", base=hair_tex["base"], normal=hair_tex["normal"], orm=hair_tex["orm"], metallic=0.0, roughness=1.0, double_sided=True),
            }
        )

    clips = {}
    for cname, cinfo in CLIPS.items():
        if cname in spec.get("skip_clips", []):
            continue
        clips[cname] = dict(cinfo)

    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    glb_path = out_dir / f"{asset_id}.glb"
    extras = {
        "assetId": asset_id,
        "rig": "studio-humanoid-v1",
        "restFacing": "+Z",
        "units": "metre",
        "clips": sorted(clips.keys()),
        "provenance": "public/makehuman/PROVENANCE.md + generated layers (project-authored)",
    }
    write_skinned_glb(glb_path, asset_id, parts, bones, clips, extras=extras, fps=fps, anchors=_anchor_nodes(bones))

    meta = {
        "id": asset_id,
        "title": spec["title"],
        "category": spec.get("category", "character"),
        "tags": spec.get("tags", []),
        "height": spec["height"],
        "clips": sorted(clips.keys()),
        "tris": int(sum(len(p["idx"]) for p in parts) // 3),
        "bones": len(bones),
        "size": int(glb_path.stat().st_size),
        "parts": [p["mat"].name for p in parts],
    }
    return meta


CLOTH_CHAIN = ("cloth01", "cloth02", "cloth03")


def _add_cloth_bones(bones, spec, S, off):
    """Tambah rantai tiga tulang kain (spine03 -> cloth01 -> cloth02 -> cloth03).

    Posisi diambil dari tinggi shroud yang diminta spec, dikonversi ke meter
    dengan skala yang sama seperti `_metres`. Mengembalikan (bones, span) dengan
    span = (y_top, y_bottom) dalam meter, atau (bones, None) kalau aset tidak
    punya kain panjang.
    """
    cfg = spec.get("shroud")
    if not cfg:
        return bones, None
    k = HEIGHT_UNITS / 7.32
    y_top_raw = FEET_Y + float(cfg.get("y_top", 5.6)) * k
    y_bot_raw = FEET_Y + float(cfg.get("y_bottom", -0.6)) * k
    if y_top_raw <= y_bot_raw:
        return bones, None
    y_top = (y_top_raw - off[1]) * S
    y_bot = (y_bot_raw - off[1]) * S
    h = y_top - y_bot
    out = list(bones)
    # `parent` di rig ini berupa indeks, bukan nama
    index_of = {b["name"]: i for i, b in enumerate(out)}
    parent = index_of.get("spine03", 0)
    fracs = (0.22, 0.58, 0.92)
    for name, frac in zip(CLOTH_CHAIN, fracs):
        out.append({"name": name, "parent": parent, "p": np.array([0.0, y_top - h * frac, 0.03], F)})
        parent = len(out) - 1
    return out, (y_top, y_bot)


def _cloth_weights(points, bones, span):
    """Bobot kain: puncak ikut punggung, ujung bawah ikut tulang kain terbawah."""
    name_to_i = {b["name"]: i for i, b in enumerate(bones)}
    spine = name_to_i.get("spine03", 0)
    idx = [name_to_i[n] for n in CLOTH_CHAIN]
    y_top, y_bot = span
    h = max(y_top - y_bot, 1e-4)
    t = np.clip((y_top - points[:, 1]) / h, 0.0, 1.0)
    # tiga band kain + pangkal punggung yang cepat memudar
    bands = [np.exp(-(((t - c) / 0.30) ** 2)) for c in (0.25, 0.60, 0.95)]
    spine_w = np.clip(1.0 - t / 0.30, 0.0, 1.0) * 1.3
    cols = [spine_w] + bands
    keys = [spine] + idx
    W4 = np.zeros((len(points), 4), F)
    J4 = np.zeros((len(points), 4), np.int64)
    for n in range(len(points)):
        w = np.array([c[n] for c in cols], np.float64)
        if w.sum() <= 1e-9:
            w[:] = 1.0
        order = np.argsort(-w)[:4]
        ws = w[order]
        ws = ws / ws.sum()
        for s_i, o in enumerate(order):
            J4[n, s_i] = keys[o]
            W4[n, s_i] = ws[s_i]
    return J4, W4


def _anchor_nodes(bones):
    """Attachment points other assets can be parented to (props, cameras, gaze).

    Posisi rest tulang disimpan di kunci "p" (meter, absolut terhadap rig);
    "translation" baru dibuat saat penulisan node glTF (lokal terhadap induk).
    Membaca "translation" di sini membuat semua anchor jatuh di titik nol —
    bug yang membuat properti tidak bisa ditempelkan ke tangan/kepala.
    """
    rest = {b["name"]: np.asarray(b.get("p", b.get("translation", [0, 0, 0])), float) for b in bones}
    pairs = (
        ("anchor.hand.L", "metacarpal1.L"),
        ("anchor.hand.R", "metacarpal1.R"),
        ("anchor.foot.L", "foot.L"),
        ("anchor.foot.R", "foot.R"),
        ("anchor.head", "head"),
        ("anchor.eye.L", "eye.L"),
        ("anchor.eye.R", "eye.R"),
    )
    return [{"name": name, "translation": [round(float(v), 4) for v in rest[bone]]} for name, bone in pairs if bone in rest]


def _hair_alpha_hairline(hpos, huvs, hidx, style, size=512):
    """Alpha rambut = 1 di seluruh pulau UV rambut.

    Dulu di sini ada alpha yang dipanggang dari `scalp_weight` lalu diblur
    (radius 12 px di atlas 512). Akibatnya nilai alpha di ubun-ubun ikut
    terdilusi dan di bawah ambang `alphaCutoff` 0.45: di WebGL rambut hanya
    tersisa dua jepit di pelipis, kepala tampak botak. Bentuk garis rambut
    sekarang ditentukan *geometri* (segitiga di atas hairline saja), jadi
    tekstur tidak perlu memotong apa pun lagi.
    """
    return np.ones((size, size), F)


def _down(img, size):
    from PIL import Image

    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))
    im = im.resize((size, size), Image.LANCZOS)
    return np.asarray(im, F) / 255.0


def to_render_parts(parts):
    """Convert assembled parts into render.Scene entries for QC previews."""
    out = []
    for p in parts:
        m = p["mat"]
        out.append(
            {
                "pos": p["pos"],
                "idx": p["idx"],
                "uv": p["uv"],
                "normals": p.get("normals"),
                "mat": {
                    "base": m.base,
                    "normal": m.normal,
                    "orm": m.orm,
                    "emissive": m.emissive,
                    "normal_scale": m.normal_scale,
                },
            }
        )
    return out
