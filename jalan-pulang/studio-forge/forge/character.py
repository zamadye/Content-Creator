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

SPECS = {
    "char.male-dewasa-polo": {
        "title": "Pria dewasa — polo & celana kargo",
        "category": "character",
        "tags": ["human", "male", "adult", "rider", "indonesian"],
        "height": 1.72,
        "shape": dict(shoulder=0.35, chest=0.25, waist=0.05, jaw_w=0.35, brow=0.35, chin_fwd=0.3, cheek=0.1, neck=0.1),
        "skin": dict(tone="#b98a63", red="#ad5f4c", lip="#8c4a44", age=0.32, sex="male", stubble=0.5, seed=11),
        "hair": dict(style="short", color="#151110", thickness=0.030, long=0.0),
        "garments": ["namuhekam_male_polo_shirt", "cortu_cargo_pants", "shoes01"],
        "tint": [1.0, 1.0, 1.0],
    },
    "char.male-muda-jaket": {
        "title": "Pria muda — setelan kasual",
        "category": "character",
        "tags": ["human", "male", "teen", "worker", "indonesian"],
        "height": 1.64,
        "shape": dict(shoulder=-0.2, chest=-0.1, waist=0.15, limb=-0.25, jaw_w=-0.15, chin_drop=0.1, nose_w=-0.1),
        "skin": dict(tone="#c1936b", red="#b06552", lip="#95504a", age=0.15, sex="male", stubble=0.15, seed=23),
        "hair": dict(style="messy", color="#100d0b", thickness=0.042, long=0.0),
        "garments": ["male_casualsuit05", "shoes01"],
        "tint": [0.95, 0.98, 1.0],
    },
    "char.male-lansia-kemeja": {
        "title": "Pria lansia — polo lusuh",
        "category": "character",
        "tags": ["human", "male", "elder", "father", "indonesian"],
        "height": 1.665,
        "shape": dict(shoulder=-0.1, chest=0.1, belly=0.45, waist=-0.1, jaw_w=0.1, hollow=0.7, jowl=0.8,
                      chin_drop=0.25, lip_full=-0.4, neck=0.1, neck_fwd=0.35, ear=0.25),
        "skin": dict(tone="#b98f6c", red="#a95c4c", lip="#84514b", age=0.95, sex="male", stubble=0.75,
                     freckles=0.5, seed=37),
        "hair": dict(style="receding", color="#8d8880", thickness=0.028, long=0.0),
        "garments": ["namuhekam_male_polo_shirt", "cortu_cargo_pants", "shoes01"],
        "tint": [0.88, 0.86, 0.80],
    },
    "char.female-dewasa": {
        "title": "Wanita dewasa — polo & kargo",
        "category": "character",
        "tags": ["human", "female", "adult", "mother", "indonesian"],
        "height": 1.605,
        "shape": dict(shoulder=-0.55, chest=-0.15, waist=0.55, hip=0.85, glute=0.4, limb=-0.35,
                      jaw_w=-0.45, brow=-0.2, cheek=0.35, lip_full=0.6, lip_fwd=0.3, chin_drop=-0.15,
                      nose_w=-0.25, neck=-0.2, skull_w=-0.15),
        "skin": dict(tone="#c69a74", red="#b0604f", lip="#a05a54", age=0.4, sex="female", stubble=0.0, seed=41),
        "hair": dict(style="long", color="#17120f", thickness=0.036, long=1.0),
        "garments": ["namuhekam_male_polo_shirt", "cortu_cargo_pants", "shoes01"],
        "tint": [0.92, 0.94, 0.99],
    },
    "char.female-lansia": {
        "title": "Wanita lansia — ibu",
        "category": "character",
        "tags": ["human", "female", "elder", "mother", "indonesian"],
        "height": 1.545,
        "shape": dict(shoulder=-0.45, chest=-0.1, belly=0.3, waist=0.4, hip=0.6, limb=-0.45, hollow=0.75,
                      jowl=0.85, jaw_w=-0.4, lip_full=-0.3, neck=-0.15, neck_fwd=0.3, ear=0.2, skull_w=-0.1),
        "skin": dict(tone="#bd9270", red="#a65a4b", lip="#8a544e", age=1.0, sex="female", stubble=0.0,
                     freckles=0.4, seed=53),
        "hair": dict(style="bun", color="#9a958c", thickness=0.032, long=0.55),
        "garments": ["namuhekam_male_polo_shirt", "cortu_cargo_pants", "shoes01"],
        "tint": [0.86, 0.84, 0.78],
    },
    "char.male-pekerja": {
        "title": "Pekerja gudang — setelan kerja",
        "category": "character",
        "tags": ["human", "male", "adult", "worker", "guard"],
        "height": 1.70,
        "shape": dict(shoulder=0.55, chest=0.45, belly=0.25, limb=0.35, jaw_w=0.55, brow=0.55, neck=0.3),
        "skin": dict(tone="#a87a56", red="#a35847", lip="#82463f", age=0.45, sex="male", stubble=0.85,
                     dirt=0.25, seed=67),
        "hair": dict(style="short", color="#0f0c0a", thickness=0.026, long=0.0),
        "garments": ["male_casualsuit05", "shoes01"],
        "tint": [0.82, 0.84, 0.80],
    },
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
    P = shape(b["pos"], shape_spec)
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
    hidden = set()
    garment_parts = []
    for gname in spec.get("garments", []):
        pack = human.garment_pack(gname, hash(gname) % 1000)
        hidden |= pack["hidden"]
        gp = shape(pack["positions"], shape_spec)
        if entities:
            from .entity import shape_entity

            gp = shape_entity(gp, spec)
        # The fitting pass leaves hairline slits in some garments (62 holes in the
        # polo alone); close the small ones before they are offset outwards.
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
        # A fifth of the polo's triangles arrive wound backwards; a front-face
        # renderer culls those patches and the cloth looks full of holes.
        pack["indices"], _ = _kit.orient_consistently(
            gp, pack["indices"], outward_from=(0.0, float(np.mean(gp[:, 1])), 0.0)
        )
        # Loosen the fit so low-poly authored garments clear the body. The gap has
        # to differ per layer: a shirt and the trousers under it at the same
        # offset poke through each other, which reads as notches along the hem.
        fit = {"namuhekam_male_polo_shirt": 0.062, "cortu_cargo_pants": 0.026, "male_casualsuit05": 0.048}
        off_g = fit.get(gname, 0.0)
        if off_g:
            gn = human_normals(gp, pack["indices"])
            gp = gp + gn * off_g
        garment_parts.append((gname, pack, gp))

    # Keep the whole body surface (removing covered triangles punches holes),
    # and sink the covered area ~9 mm under the cloth instead.
    body_idx = idx
    body_nrm_raw = compute_normals_welded(P, idx)
    if hidden:
        hid = np.isin(b["source"], list(hidden)).astype(F)
        P = P - body_nrm_raw * (hid[:, None] * 0.035)

    bones, S, off = _metres(b["bones"], spec["height"])
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
        nrm = compute_normals_welded(mp, pack["indices"])
        t = pack["tex"]
        tint = spec.get("tint", [1, 1, 1])
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
                    base=np.clip(t["base"] * np.asarray(tint, F)[None, None, :], 0, 1),
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
        j, w = _torso_weights(to_m(sp), bones)
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


def _anchor_nodes(bones):
    """Attachment points other assets can be parented to (props, cameras, gaze)."""
    rest = {b["name"]: np.asarray(b.get("translation", [0, 0, 0]), float) for b in bones}
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
    """Bake a soft irregular hairline into the hair texture's alpha channel:
    rasterise the per-vertex scalp weight in hair-UV space."""
    from .human import scalp_weight
    from .uvpaint import rasterize_uv, smoothstep

    w = scalp_weight(hpos, style)
    tmp = np.zeros_like(hpos)
    tmp[:, 0] = w
    from .tex import blur

    baked, _, mask = rasterize_uv(tmp, huvs, hidx, size)
    wmap = blur(np.where(mask, baked[..., 0], 0.0), max(1, size // 40))
    noise = tex.fbm(size, size, 40, 3, 0.55, 21)
    wmap = wmap + (noise - 0.5) * 0.10
    alpha = smoothstep((wmap - 0.36) / 0.34)
    alpha = blur(alpha, 2)
    alpha[~mask] = 0.0
    return alpha


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
