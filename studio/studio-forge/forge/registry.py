"""Asset catalogue: build every GLB, render a thumbnail, write registry.json."""
from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np

from . import character, entity, env_building, env_nature, env_prop, env_road, env_vehicle, render
from .assemble import write_static_glb

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
ASSET_ROOT = PUBLIC / "assets"

STATIC_GROUPS = {
    "road": env_road.ASSETS,
    "nature": env_nature.ASSETS,
    "building": env_building.ASSETS,
    "prop": env_prop.ASSETS,
    "vehicle": env_vehicle.ASSETS,
}

PROVENANCE = {
    "character": "public/makehuman/PROVENANCE.md (mesh+skeleton CC0) · tekstur kulit, mata, rambut, klip: dibuat pipeline ini",
    "entity": "public/makehuman/PROVENANCE.md (mesh+skeleton CC0) · kafan/kerudung, tekstur, klip: dibuat pipeline ini",
    "road": "mesh + tekstur aspal/beton/tanah dibuat pipeline ini (prosedural deterministik)",
    "nature": "mesh + tekstur kulit kayu/daun/rumput dibuat pipeline ini",
    "building": "mesh + tekstur kayu/plester/baja dibuat pipeline ini",
    "prop": "mesh + tekstur dibuat pipeline ini",
    "vehicle": "mesh + tekstur dibuat pipeline ini; bukan model Honda Supra terukur",
}

# Honest quality gates: "draft" assets are usable as background only.
STATUS = {
    "entity": "draft",
    "vehicle.pickup": "draft",
    "road.prop.signpost": "draft",
    "prop.lamp.teplok": "draft",
}


def status_for(asset_id, category):
    return STATUS.get(asset_id, STATUS.get(category, "review"))


LICENSE = {
    "character": "Mesh & skeleton: CC0-1.0 (MakeHuman). Tekstur/rig-layer/animasi: proyek ini (CC0-1.0).",
    "entity": "Mesh & skeleton: CC0-1.0 (MakeHuman). Lapisan entitas: proyek ini (CC0-1.0).",
    "default": "Dibuat pipeline ini (CC0-1.0).",
}


def all_assets(include_entities=True):
    out = {}
    for aid, spec in character.SPECS.items():
        out[aid] = {"kind": "character", "spec": spec}
    if include_entities:
        for aid, spec in entity.SPECS.items():
            out[aid] = {"kind": "entity", "spec": spec}
    for cat, group in STATIC_GROUPS.items():
        for aid, meta in group.items():
            out[aid] = {"kind": "static", "spec": meta}
    return out


def _bounds_from_builder(b):
    pts = []
    for surf in b.groups.values():
        if surf.pos:
            pts.append(np.vstack(surf.pos))
    if not pts:
        return {"min": [0, 0, 0], "max": [0, 0, 0], "size": [0, 0, 0]}
    P = np.vstack(pts)
    mn = P.min(0)
    mx = P.max(0)
    return {"min": [round(float(v), 3) for v in mn], "max": [round(float(v), 3) for v in mx], "size": [round(float(v), 3) for v in (mx - mn)]}


def _thumb(scene_parts, bounds, path, ground=True, size=384, fov=30.0):
    mn = np.array(bounds["min"], np.float32)
    mx = np.array(bounds["max"], np.float32)
    center = (mn + mx) / 2
    sv = mx - mn
    radius = max(0.35, float(np.linalg.norm(sv)) * 0.5)
    flat = sv[1] < 0.40
    sc = render.Scene()
    for p in scene_parts:
        sc.add(p["pos"], p["idx"], p["uv"], p.get("normals"), p["mat"])
    el = np.radians(52.0 if flat else 19.0)
    az = np.radians(36.0)
    d = np.array([np.cos(el) * np.sin(az), np.sin(el), np.cos(el) * np.cos(az)], np.float32)
    eye = center + d * (radius / np.tan(np.radians(fov) / 2) * 1.04)
    g = None
    if ground and not flat and mn[1] < 0.25 and sv[1] > 0.65:
        from . import tex as _t

        cg = _t.concrete(29, 0.75, 512)
        g = {"mat": {"base": cg["base"] * 0.34, "normal": cg["normal"], "orm": cg["orm"]}, "y": 0.0,
             "radius": max(2.0, radius * 3.4), "uv_repeat": max(2.0, radius * 3.4)}
    img = render.render(sc, None, eye=eye, target=center, fov=fov, size=(size, size), ground=g,
                        shadow=not flat, light_intensity=1.45, ambient=0.30,
                        light_dir=(-0.38, -0.72, -0.58))
    img.save(path)
    return img


def build_static(asset_id, meta, out_dir, thumb=True):
    t0 = time.time()
    built = meta["build"]()
    anchors = None
    if len(built) == 3:
        b, mats, anchors = built
    else:
        b, mats = built
    b.groups = {k: v for k, v in b.groups.items() if v.pos}
    missing = [k for k in b.groups if k not in mats or mats[k] is None]
    if missing:
        raise KeyError(f"{asset_id}: no material for {missing}")
    out_dir.mkdir(parents=True, exist_ok=True)
    glb = out_dir / f"{asset_id}.glb"
    extras = {
        "assetId": asset_id,
        "units": "metre",
        "up": "+Y",
        "front": "+Z",
        "anchors": [a["name"] for a in anchors] if anchors else [],
    }
    write_static_glb(glb, asset_id, b, mats, extras=extras, anchors=anchors)
    bounds = _bounds_from_builder(b)
    tris = sum(len(s.idx) and sum(len(i) for i in s.idx) for s in b.groups.values()) // 3
    scene_parts = []
    for name, surf in b.groups.items():
        m = mats[name]
        scene_parts.append(
            {
                "pos": np.vstack(surf.pos),
                "idx": np.concatenate(surf.idx),
                "uv": np.vstack(surf.uv),
                "normals": np.vstack(surf.nrm),
                "mat": {
                    "base": m.base,
                    "normal": m.normal,
                    "orm": m.orm,
                    "emissive": m.emissive,
                    "normal_scale": m.normal_scale,
                    "metallic": m.metallic,
                    "roughness": m.roughness,
                    "alpha_mode": getattr(m, "alpha_mode", None),
                    "alpha_cutoff": getattr(m, "alpha_cutoff", None),
                    "double_sided": getattr(m, "double_sided", False),
                },
            }
        )
    if thumb:
        _thumb(scene_parts, bounds, out_dir / "thumbnail.png")
    return {
        "tris": int(tris),
        "size": int(glb.stat().st_size),
        "bounds": bounds,
        "materials": sorted(b.groups.keys()),
        "anchors": [a["name"] for a in anchors] if anchors else [],
        "seconds": round(time.time() - t0, 1),
    }


def build_character(asset_id, spec, out_dir, size=2048, thumb=True):
    t0 = time.time()
    captured = {}
    orig = character.write_skinned_glb

    def cap(path, name, parts, bones, clips, **kw):
        captured["parts"] = parts
        return orig(path, name, parts, bones, clips, **kw)

    character.write_skinned_glb = cap
    try:
        meta = character.build(asset_id, spec, out_dir, size=size)
    finally:
        character.write_skinned_glb = orig
    parts = character.to_render_parts(captured["parts"])
    P = np.vstack([p["pos"] for p in parts])
    bounds = {
        "min": [round(float(v), 3) for v in P.min(0)],
        "max": [round(float(v), 3) for v in P.max(0)],
        "size": [round(float(v), 3) for v in (P.max(0) - P.min(0))],
    }
    if thumb:
        _thumb(parts, bounds, Path(out_dir) / "thumbnail.png", ground=True)
    meta["bounds"] = bounds
    meta["anchors"] = ["anchor.hand.L", "anchor.hand.R", "anchor.head", "anchor.eye.L", "anchor.eye.R"]
    meta["seconds"] = round(time.time() - t0, 1)
    return meta


def pbr_report(gltf_json):
    has = {"baseColor": False, "normal": False, "orm": False, "emissive": False}
    tex_count = len(gltf_json.get("images", []))
    for m in gltf_json.get("materials", []):
        p = m.get("pbrMetallicRoughness", {})
        if "baseColorTexture" in p:
            has["baseColor"] = True
        if "normalTexture" in m:
            has["normal"] = True
        if "metallicRoughnessTexture" in p and "occlusionTexture" in m:
            has["orm"] = True
        if "emissiveTexture" in m or any(m.get("emissiveFactor", [0, 0, 0])):
            has["emissive"] = True
    return has, tex_count


def entry_for(asset_id, category, title, meta, folder, status=None):
    glb = Path(folder) / f"{asset_id}.glb"
    rel = glb.relative_to(PUBLIC).as_posix()
    entry = {
        "id": asset_id,
        "title": title,
        "category": category,
        "uri": rel,
        "thumbnail": (Path(folder) / "thumbnail.png").relative_to(PUBLIC).as_posix(),
        "status": status or status_for(asset_id, category),
        "version": 1,
        "bounds": meta.get("bounds"),
        "tris": meta.get("tris"),
        "bytes": meta.get("size"),
        "tags": meta.get("tags", []),
        "license": LICENSE.get(category, LICENSE["default"]),
        "provenance": PROVENANCE.get(category, PROVENANCE["road"]),
        "notes": meta.get("notes", ""),
    }
    if meta.get("clips"):
        entry["rig"] = {
            "skeleton": meta.get("rig", "studio-humanoid-v1"),
            "bones": meta.get("bones"),
            "clips": meta["clips"],
            "restFacing": "+Z",
            "height": meta.get("height"),
        }
    if meta.get("anchors"):
        entry["anchors"] = meta["anchors"]
    if meta.get("materials"):
        entry["materials"] = meta["materials"]
    return entry
