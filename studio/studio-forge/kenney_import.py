#!/usr/bin/env python3
"""Impor properti Kenney (CC0) → pustaka studio yang siap dipakai cerita.

    python3 studio-forge/kenney_import.py --list
    python3 studio-forge/kenney_import.py --build            # semua di CURATED.json
    python3 studio-forge/kenney_import.py --build --only furniture/chair
    python3 studio-forge/kenney_import.py --check            # indeks vs berkas

Sumber mentah: `vendor/kenney/3d/<kit>/<nama>.glb` (lihat vendor/kenney/README.md).
Keluaran: `public/library/<kit>/<nama>.glb` + `thumbnail.png`, indeks
`public/library/index.json`, dan tabel di `docs/LIBRARY.md`.

Normalisasi yang dilakukan (supaya bisa dipakai bersama aset sendiri):
  * sumbu +Y, satuan meter (Kenney memang meter),
  * pivot di tengah alas (min y = 0, pusat x/z = 0),
  * satu mesh per material, tanpa tekstur eksternal — material tetap warna
    datar khas Kenney, sehingga bisa dipadukan tanpa konflik atlas,
  * `extras` memuat sumber + lisensi supaya provenance tidak hilang.
"""
from __future__ import annotations

import argparse
import json
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

from forge import render  # noqa: E402
from forge.glb_read import load_meshes  # noqa: E402

F = np.float32
VENDOR = ROOT / "vendor" / "kenney" / "3d"
LIBRARY = ROOT / "public" / "library"
INDEX = LIBRARY / "index.json"
DOC = ROOT / "docs" / "LIBRARY.md"
CURATED = HERE / "kenney" / "CURATED.json"
BEGIN, END = "<!-- BEGIN:library -->", "<!-- END:library -->"


# --------------------------------------------------------------------------- GLB
def write_glb(prims, out_path: Path, extras: dict) -> None:
    """Tulis GLB mandiri: satu buffer, material warna datar, tanpa tekstur."""
    materials, mat_index = [], {}
    blobs, views, accessors, meshes = [], [], [], []
    offset = 0

    def add_view(data: bytes, target: int) -> int:
        nonlocal offset
        blobs.append(data)
        views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(data), "target": target})
        offset += len(data) + (-len(data) % 4)
        if len(data) % 4:
            blobs.append(b"\x00" * (-len(data) % 4))
        return len(views) - 1

    def add_accessor(arr: np.ndarray, kind: str, component: int, normalised=False):
        view = add_view(arr.tobytes(), 34962)
        acc = {"bufferView": view, "componentType": component, "count": int(arr.shape[0]), "type": kind}
        if normalised:
            acc["normalized"] = True
        accessors.append(acc)
        return len(accessors) - 1

    for prim in prims:
        key = prim["material"]
        if key not in mat_index:
            mat = {
                "name": key,
                "pbrMetallicRoughness": {
                    "baseColorFactor": [float(v) for v in prim["base"]] + [1.0],
                    "metallicFactor": float(prim["metallic"]),
                    "roughnessFactor": float(prim["roughness"]),
                },
                "doubleSided": bool(prim["double"]),
            }
            if float(np.max(prim["emissive"])) > 0:
                mat["emissiveFactor"] = [float(v) for v in prim["emissive"]]
            mat_index[key] = len(materials)
            materials.append(mat)

        pos = prim["pos"].astype(F)
        nrm = prim["nrm"].astype(F)
        uv = prim["uv"].astype(F)
        idx = prim["idx"].astype(np.uint32)
        attrs = {
            "POSITION": add_accessor(pos, "VEC3", 5126),
            "NORMAL": add_accessor(nrm, "VEC3", 5126),
            "TEXCOORD_0": add_accessor(uv, "VEC2", 5126),
        }
        if len(pos) <= 65535:
            idx = prim["idx"].astype(np.uint16)
        iacc = add_view(idx.tobytes(), 34963)
        accessors.append({"bufferView": iacc, "componentType": 5125 if idx.dtype == np.uint32 else 5123,
                          "count": int(idx.size), "type": "SCALAR"})
        mesh = {
            "primitives": [{
                "attributes": attrs,
                "indices": len(accessors) - 1,
                "material": mat_index[key],
            }]
        }
        meshes.append(mesh)

    bin_chunk = b"".join(blobs)
    js = {
        "asset": {"version": "2.0", "generator": "studio-forge/kenney_import.py"},
        "scene": 0,
        "scenes": [{"nodes": list(range(len(meshes)))}],
        "nodes": [{"mesh": i, "name": f"part{i}"} for i in range(len(meshes))],
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(bin_chunk)}],
        "extras": extras,
    }
    payload = json.dumps(js, separators=(",", ":")).encode("utf8")
    payload += b" " * (-len(payload) % 4)
    total = 12 + 8 + len(payload) + 8 + len(bin_chunk)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("wb") as fh:
        fh.write(b"glTF" + struct.pack("<II", 2, total))
        fh.write(struct.pack("<II", len(payload), 0x4E4F534A) + payload)
        fh.write(struct.pack("<II", len(bin_chunk), 0x004E4942) + bin_chunk)


def normalise(prims) -> tuple[list, dict]:
    """Pivot di tengah alas; kembalikan primitif baru + batas."""
    pos_all = np.vstack([p["pos"] for p in prims])
    lo, hi = pos_all.min(0), pos_all.max(0)
    shift = np.array([(lo[0] + hi[0]) / 2, lo[1], (lo[2] + hi[2]) / 2], F)
    out = []
    for p in prims:
        q = dict(p)
        q["pos"] = p["pos"] - shift
        out.append(q)
    size = hi - lo
    return out, {"min": [round(float(v), 3) for v in (lo - shift)], "max": [round(float(v), 3) for v in (hi - shift)],
                 "size": [round(float(v), 3) for v in size], "pivot_shift": [round(float(v), 3) for v in shift]}


# ----------------------------------------------------------------------- thumbnail
def thumbnail(prims, out_path: Path, size: int = 192) -> None:
    sc = render.Scene()
    for p in prims:
        mat = {
            "base": np.tile(p["base"], (4, 4, 1)).astype(F),
            "normal": None,
            "orm": None,
            "metallic": p["metallic"],
            "roughness": p["roughness"],
            "double_sided": p["double"],
        }
        sc.add(p["pos"], p["idx"], p["uv"], p["nrm"], mat)
    pos_all = np.vstack([p["pos"] for p in prims])
    centre = (pos_all.min(0) + pos_all.max(0)) / 2
    radius = float(np.max(pos_all.max(0) - pos_all.min(0))) or 1.0
    d = radius * 1.85 + 0.35
    eye = centre + np.array([0.62, 0.55, 0.82], F) * d
    img = render.render(
        sc, None,
        eye=tuple(eye), target=tuple(centre), fov=34, size=(size, size),
        light_dir=(-0.35, -0.72, -0.6), light_intensity=2.15, ambient=0.30,
        shadow=False, vignette=0.14, ground=None,
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path)


# --------------------------------------------------------------------------- main
def build_one(kit: str, name: str, thumb: bool = True, scale: float = 1.0) -> dict:
    src = VENDOR / kit / f"{name}.glb"
    prims = load_meshes(src)
    if not prims:
        raise SystemExit(f"{kit}/{name}: tidak ada primitif segitiga")
    if scale != 1.0:
        for p in prims:
            p["pos"] = p["pos"] * scale
    prims, bounds = normalise(prims)
    # panel tipis (dinding/ubin/rumput) satu sisi — jadikan dua sisi supaya terlihat
    # juga dari dalam ruangan; tanpa ini interior jadi berlubang
    for p in prims:
        if bounds["size"][0] <= 0.02 or bounds["size"][2] <= 0.02 or bounds["size"][1] <= 0.02:
            p["double"] = True
    asset_id = f"kenney.{kit}.{name}"
    out = LIBRARY / kit / f"{name}.glb"
    write_glb(prims, out, {"assetId": asset_id, "source": f"kenney:{kit}/{name}", "license": "CC0-1.0"})
    if thumb:
        thumbnail(prims, LIBRARY / kit / f"{name}.png")
    tris = int(sum(len(p["idx"]) // 3 for p in prims))
    verts = int(sum(len(p["pos"]) for p in prims))
    return {
        "id": asset_id,
        "kit": kit,
        "name": name,
        "title": f"{kit} · {name}",
        "path": f"library/{kit}/{name}.glb",
        "thumbnail": f"library/{kit}/{name}.png" if thumb else None,
        "tris": tris,
        "verts": verts,
        "materials": sorted({p["material"] for p in prims}),
        "bounds": bounds,
        "flat": bounds["size"][1] <= 0.002,
        "license": "CC0-1.0",
        "source": f"kenney:{kit}/{name}",
    }


def load_index() -> dict:
    return json.loads(INDEX.read_text()) if INDEX.exists() else {"schema": "studio.library/1", "props": []}


def write_index(props: list) -> None:
    props = sorted(props, key=lambda p: p["id"])
    INDEX.parent.mkdir(parents=True, exist_ok=True)
    INDEX.write_text(json.dumps({
        "schema": "studio.library/1",
        "note": "Properti CC0 dari Kenney. Karakter tetap dibuat pipeline sendiri.",
        "license": "CC0-1.0",
        "source": "https://github.com/shorepine/kenney",
        "count": len(props),
        "props": props,
    }, indent=1, ensure_ascii=False) + "\n")


def write_doc(props: list) -> None:
    kits = {}
    for p in props:
        kits.setdefault(p["kit"], []).append(p)
    lines = [
        "| kit | jumlah | tri total | contoh |",
        "|---|---|---|---|",
    ]
    for kit, items in sorted(kits.items()):
        ex = ", ".join(f"`{i['name']}`" for i in items[:4])
        lines.append(f"| {kit} | {len(items)} | {sum(i['tris'] for i in items)} | {ex} |")
    table = "\n".join(lines)
    detail = ["| id | tri | ukuran (m) | material |", "|---|---|---|---|"]
    for p in props:
        s = p["bounds"]["size"]
        detail.append(f"| `{p['id']}` | {p['tris']} | {s[0]:.2f} × {s[1]:.2f} × {s[2]:.2f} | {', '.join(p['materials'][:4])} |")
    body = f"{table}\n\n<details><summary>Daftar lengkap {len(props)} properti</summary>\n\n" + "\n".join(detail) + "\n\n</details>"
    md = DOC.read_text() if DOC.exists() else "# PUSTAKA PROPERTI (Kenney, CC0)\n\n<!-- BEGIN:library -->\n<!-- END:library -->\n"
    a, b = md.index(BEGIN), md.index(END)
    DOC.write_text(md[: a + len(BEGIN)] + "\n\n" + body + "\n\n" + md[b:])


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--build", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--no-thumbs", action="store_true")
    ap.add_argument("--sheet", default="", help="tulis kontak sheet PNG ke path ini")
    args = ap.parse_args(argv)

    curated_raw = json.loads(CURATED.read_text())
    curated = curated_raw["kits"]
    kit_scale = curated_raw.get("kit_scale", {})
    pairs = [(kit, n) for kit, names in curated.items() for n in names]

    if args.list:
        for kit, n in pairs:
            print(f"{kit:20s} {n}")
        print(f"\n{len(pairs)} properti terkurasi")
        return 0

    if args.check:
        idx = load_index()
        problems = []
        for p in idx["props"]:
            if not (ROOT / "public" / p["path"]).exists():
                problems.append(f"hilang: {p['path']}")
            if p.get("thumbnail") and not (ROOT / "public" / p["thumbnail"]).exists():
                problems.append(f"thumbnail hilang: {p['path']}")
            # properti datar/tipis (ubin jalan, rumput, panel dinding) memang bisa
            # punya satu dimensi ~0 — yang cacat hanya kalau ketiganya nol
            if max(p["bounds"]["size"]) <= 0.002:
                problems.append(f"properti tanpa volume: {p['id']}")
            if not (0.005 < p["tris"] / max(p["verts"], 1) < 2.0):
                problems.append(f"rasio tri/vert aneh: {p['id']} {p['tris']}/{p['verts']}")
        if len(idx["props"]) != len(pairs):
            problems.append(f"indeks {len(idx['props'])} ≠ kurasi {len(pairs)}")
        ids = {p["id"] for p in idx["props"]}
        for kit, n in pairs:
            if f"kenney.{kit}.{n}" not in ids:
                problems.append(f"belum dibangun: {kit}/{n}")
        print(f"{len(idx['props'])} properti · {len(problems)} masalah")
        for pr in problems[:10]:
            print(" !", pr)
        return 1 if problems else 0

    if args.build:
        wanted = [tuple(args.only.split("/"))] if args.only else pairs
        idx = load_index()
        by_id = {p["id"]: p for p in idx["props"]}
        for kit, name in wanted:
            meta = build_one(kit, name, thumb=not args.no_thumbs, scale=float(kit_scale.get(kit, 1.0)))
            by_id[meta["id"]] = meta
            print(f"✓ {meta['id']:44s} {meta['tris']:5d} tri  {meta['bounds']['size']}")
        write_index(list(by_id.values()))
        write_doc(sorted(by_id.values(), key=lambda p: p["id"]))
        print(f"{len(by_id)} properti di indeks")
        return 0

    if args.sheet:
        props = load_index()["props"]
        cols, cell = 10, 150
        cols = min(cols, len(props))
        rows = (len(props) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cell + 12, rows * (cell + 16) + 34), (20, 22, 26))
        d = ImageDraw.Draw(sheet)
        f = ImageFont.load_default(size=11)
        d.text((10, 8), f"PUSTAKA PROPERTI — {len(props)} model Kenney (CC0), pivot di alas, satuan meter", fill=(230, 234, 242), font=ImageFont.load_default(size=15))
        for i, p in enumerate(props):
            th = ROOT / "public" / (p["thumbnail"] or "")
            if not th.exists():
                continue
            x = 6 + (i % cols) * cell
            y = 30 + (i // cols) * (cell + 16)
            sheet.paste(Image.open(th).convert("RGB").resize((cell - 8, cell - 8)), (x, y))
            d.text((x + 2, y + cell - 6), p["name"][:22], fill=(170, 176, 188), font=f)
        out = Path(args.sheet)
        out.parent.mkdir(parents=True, exist_ok=True)
        sheet.save(out)
        print(f"{out}: {len(props)} sel")
        return 0

    ap.print_help()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
