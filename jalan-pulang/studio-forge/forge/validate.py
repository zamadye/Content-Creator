"""Static GLB inspection used by the build and by CI (no external tools)."""
from __future__ import annotations

import json
import struct
from pathlib import Path


def read_glb(path):
    raw = Path(path).read_bytes()
    magic, version, total = struct.unpack_from("<III", raw, 0)
    if magic != 0x46546C67:
        raise ValueError(f"{path}: not a GLB (magic {magic:#x})")
    if version != 2:
        raise ValueError(f"{path}: GLB version {version} unsupported")
    if total != len(raw):
        raise ValueError(f"{path}: header total {total} != file size {len(raw)}")
    off = 12
    doc = None
    bin_len = 0
    while off < len(raw):
        clen, ctype = struct.unpack_from("<II", raw, off)
        off += 8
        chunk = raw[off : off + clen]
        off += clen
        if ctype == 0x4E4F534A:
            doc = json.loads(chunk.decode("utf-8").rstrip(" \t\r\n\x00"))
        elif ctype == 0x004E4942:
            bin_len = clen
    if doc is None:
        raise ValueError(f"{path}: missing JSON chunk")
    return doc, bin_ranges(doc, len(raw)), len(raw), bin_len


def bin_ranges(doc, file_size):
    return len(doc.get("bufferViews", []))


def inspect(path):
    doc, n_views, nbytes, bin_len = read_glb(path)
    problems, warnings = [], []
    if doc.get("asset", {}).get("version") != "2.0":
        problems.append("asset.version must be 2.0")
    if not doc.get("meshes"):
        problems.append("no meshes")
    pos_accessors = {
        p["attributes"]["POSITION"]
        for mesh in doc.get("meshes", [])
        for p in mesh.get("primitives", [])
        if "POSITION" in p.get("attributes", {})
    }
    for i in sorted(pos_accessors):
        acc = doc["accessors"][i]
        if "min" not in acc or "max" not in acc:
            problems.append(f"POSITION accessor {i}: missing min/max")
    prims = 0
    for mesh in doc.get("meshes", []):
        for p in mesh.get("primitives", []):
            prims += 1
            for req in ("POSITION", "NORMAL", "TEXCOORD_0"):
                if req not in p["attributes"]:
                    problems.append(f"primitive missing {req}")
            if "TANGENT" not in p["attributes"]:
                warnings.append("primitive without TANGENT (normal map may be approximate)")
    materials = doc.get("materials", [])
    textured = 0
    for m in materials:
        pbr = m.get("pbrMetallicRoughness", {})
        has_base = "baseColorTexture" in pbr
        has_normal = "normalTexture" in m
        has_mr = "metallicRoughnessTexture" in pbr
        if has_base and has_normal and has_mr:
            textured += 1
        elif has_base or has_normal:
            warnings.append(f"material {m.get('name')}: incomplete PBR set")
        else:
            warnings.append(f"material {m.get('name')}: no textures")
    images = doc.get("images", [])
    for i, img in enumerate(images):
        if "uri" in img:
            problems.append(f"image {i}: external uri {img['uri']} (must be embedded)")
        if "bufferView" not in img:
            problems.append(f"image {i}: no bufferView")
    for b in doc.get("buffers", []):
        if "uri" in b:
            problems.append("buffer must be embedded (GLB binary chunk)")
        if b.get("byteLength", 0) > bin_len:
            problems.append("buffer byteLength exceeds BIN chunk")
    for s in doc.get("skins", []):
        if "inverseBindMatrices" not in s:
            problems.append("skin without inverseBindMatrices")
    anims = doc.get("animations", [])
    for a in anims:
        if not a.get("channels"):
            problems.append(f"animation {a.get('name')}: no channels")
    report = {
        "path": str(path),
        "bytes": nbytes,
        "meshes": len(doc.get("meshes", [])),
        "primitives": prims,
        "materials": len(materials),
        "texturedMaterials": textured,
        "images": len(images),
        "nodes": len(doc.get("nodes", [])),
        "skins": len(doc.get("skins", [])),
        "animations": [a.get("name") for a in anims],
        "anchors": [n["name"] for n in doc.get("nodes", []) if str(n.get("name", "")).startswith("anchor.")],
        "problems": problems,
        "warnings": warnings,
    }
    return report
