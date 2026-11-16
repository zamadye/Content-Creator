"""Lembar kalibrasi material: tiap material diuji sebagai bola di bawah cahaya netral.

    python3 studio-forge/dev_materials.py --sheet docs/material-calibration.png
    python3 studio-forge/dev_materials.py --write          # perbarui tabel di docs/MATERIAL-CALIBRATION.md
    python3 studio-forge/dev_materials.py --check          # gagal bila ada material di luar rentang PBR

Cahaya netral: satu lampu utama netral (1,0; 0,98; 0,96) dari kiri-atas-depan,
ambient abu netral tanpa warna langit, exposure 1,0, tanpa vignette/grading.
Angka yang diukur: luminans albedo, roughness, metallic, dan luminans hasil
render. Semua diambil dari isi GLB, bukan dari konstanta di kode.
"""
from __future__ import annotations

import io
import json
import math
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))

from forge import render  # noqa: E402
from forge.bake import _upsample  # noqa: E402

F = np.float32
ROOT = Path(__file__).resolve().parent.parent
DOC = ROOT / "docs" / "MATERIAL-CALIBRATION.md"
BEGIN = "<!-- BEGIN:materials -->"
END = "<!-- END:materials -->"

# rentang wajar untuk material non-emisif (panduan PBR: albedo terang 0,9 / gelap 0,04)
L_MIN, L_MAX = 0.035, 0.90


def glb_json_bin(path: Path):
    raw = path.read_bytes()
    off, js, bn = 12, None, None
    while off < len(raw):
        ln, ty = struct.unpack("<II", raw[off : off + 8])
        chunk = raw[off + 8 : off + 8 + ln]
        if ty == 0x4E4F534A:
            js = json.loads(chunk.decode("utf8").rstrip("\x00 "))
        elif ty == 0x004E4942:
            bn = chunk
        off += 8 + ln
    return js, bn


def _img(js, bn, tex_info):
    if not tex_info:
        return None
    img = js["textures"][tex_info["index"]]["source"]
    bv = js["bufferViews"][js["images"][img]["bufferView"]]
    start = bv.get("byteOffset", 0)
    data = bn[start : start + bv["byteLength"]]
    return np.asarray(Image.open(io.BytesIO(data)).convert("RGB"), F) / 255.0


def luminance(rgb: np.ndarray) -> float:
    return float((rgb[..., 0] * 0.2126 + rgb[..., 1] * 0.7152 + rgb[..., 2] * 0.0722).mean())


def sphere(seg: int = 48, rings: int = 24, radius: float = 0.5):
    pos, uv, idx = [], [], []
    for i in range(rings + 1):
        phi = math.pi * i / rings
        for j in range(seg + 1):
            th = 2 * math.pi * j / seg
            pos.append([radius * math.sin(phi) * math.cos(th), radius * math.cos(phi), radius * math.sin(phi) * math.sin(th)])
            uv.append([j / seg, 1 - i / rings])
    for i in range(rings):
        for j in range(seg):
            a = i * (seg + 1) + j
            b = a + seg + 1
            idx.extend([a, b, a + 1, a + 1, b, b + 1])
    pos = np.asarray(pos, F)
    from forge.kit import compute_normals

    nrm = compute_normals(pos, np.asarray(idx, np.int64))
    return pos, np.asarray(idx, np.int64), np.asarray(uv, F), nrm


def material_entries():
    out = []
    for glb in sorted((ROOT / "public" / "assets").rglob("*.glb")):
        js, bn = glb_json_bin(glb)
        for m in js.get("materials", []):
            pbr = m.get("pbrMetallicRoughness", {})
            base = _img(js, bn, pbr.get("baseColorTexture"))
            normal = _img(js, bn, m.get("normalTexture"))
            orm = _img(js, bn, pbr.get("metallicRoughnessTexture"))
            factor = pbr.get("baseColorFactor", [1, 1, 1, 1])
            if base is None:
                base = np.tile(np.array([factor[0], factor[1], factor[2]], F), (8, 8, 1))
            out.append(
                {
                    "asset": glb.stem,
                    "name": m.get("name", "?"),
                    "base": base,
                    "normal": normal,
                    "orm": orm,
                    "emissive": float(np.max(m.get("emissiveFactor", [0, 0, 0]))),
                    "double": bool(m.get("doubleSided")),
                }
            )
    return out


_BG_CACHE: dict = {}


def _background(kw) -> np.ndarray:
    """Latar netral yang sama untuk semua bola (di-render sekali saja)."""
    if "img" in _BG_CACHE:
        return _BG_CACHE["img"]
    far = render.Scene()
    far.add(
        np.array([[0.0, -900.0, 0.0], [0.1, -900.0, 0.0], [0.0, -900.0, 0.1]], F),
        np.array([0, 1, 2], np.int64),
        np.zeros((3, 2), F),
        np.array([[0, 1, 0]] * 3, F),
        {"base": np.zeros((4, 4, 3), F), "normal": None, "orm": None},
        cast_shadow=False,
    )
    _BG_CACHE["img"] = np.asarray(render.render(far, None, **kw).convert("RGB"), F) / 255.0
    return _BG_CACHE["img"]


def basic(entry) -> dict:
    """Metrik yang bisa diukur tanpa render (dipakai mode --check yang cepat)."""
    orm = entry["orm"]
    luma = luminance(entry["base"])
    if orm is not None:
        rough = float(orm[..., 1].mean())
        metal = float(orm[..., 2].mean())
    else:
        rough = metal = float("nan")
    return {
        "albedo": round(luma, 3),
        "rough": round(rough, 3) if rough == rough else None,
        "metal": round(metal, 3) if metal == metal else None,
        "render": None,
        "image": None,
        "emissive": entry["emissive"],
    }


def measure(entry) -> dict:
    """Render satu bola dengan cahaya netral, ukur luminans albedo & hasil render."""
    pos, idx, uv, nrm = sphere()
    sc = render.Scene()
    sc.add(
        pos,
        idx,
        uv,
        nrm,
        {
            "base": entry["base"],
            "normal": entry["normal"],
            "orm": entry["orm"],
            "metallic": 1.0,
            "roughness": 1.0,
            "double_sided": entry["double"],
        },
    )
    size = (150, 150)
    kw = dict(
        eye=(0.0, 0.0, 2.1),
        target=(0.0, 0.0, 0.0),
        fov=32,
        size=size,
        light_dir=(-0.42, -0.55, -0.72),
        light_color=(1.0, 0.98, 0.96),
        light_intensity=3.0,
        ambient=0.35,
        ambient_sky=(0.45, 0.45, 0.45),
        ambient_ground=(0.30, 0.30, 0.30),
        shadow=False,
        exposure=1.0,
        vignette=0.0,
        bg_top="#3a3d42",
        bg_bottom="#2c2f34",
    )
    img = np.asarray(render.render(sc, None, **kw).convert("RGB"), F) / 255.0
    bg = _background(kw)
    mask = np.abs(img - bg).sum(2) > 0.02

    orm = entry["orm"]
    luma = luminance(entry["base"])
    if orm is not None:
        rough = float(orm[..., 1].mean())
        metal = float(orm[..., 2].mean())
    else:
        rough = metal = float("nan")
    return {
        "albedo": round(luma, 3),
        "rough": round(rough, 3) if rough == rough else None,
        "metal": round(metal, 3) if metal == metal else None,
        "render": round(luminance(img[mask]) if mask.any() else 0.0, 3),
        "image": img,
        "emissive": entry["emissive"],
    }


def verdict(m: dict) -> str:
    if m["emissive"] > 0:
        return "emisi"
    if m["albedo"] < L_MIN:
        return "terlalu gelap"
    if m["albedo"] > L_MAX:
        return "terlalu terang"
    return "ok"


def sheet(entries, rows) -> Image.Image:
    cols = 8
    cell = 150
    pad = 6
    label_h = 30
    n = len(entries)
    r = math.ceil(n / cols)
    img = Image.new("RGB", (cols * (cell + pad) + pad, r * (cell + label_h + pad) + 40), (18, 20, 24))
    d = ImageDraw.Draw(img)
    f_small = ImageFont.load_default(size=11)
    f_title = ImageFont.load_default(size=18)
    d.text((10, 8), "KALIBRASI MATERIAL — bola di bawah cahaya netral (albedo · roughness · luminans render)", fill=(228, 232, 240), font=f_title)
    for k, (e, m) in enumerate(zip(entries, rows)):
        cx = pad + (k % cols) * (cell + pad)
        cy = 40 + (k // cols) * (cell + label_h + pad)
        img.paste(Image.fromarray((np.clip(m["image"], 0, 1) * 255).astype(np.uint8)), (cx, cy + label_h))
        v = verdict(m)
        col = (255, 120, 120) if v not in ("ok", "emisi") else (200, 206, 216)
        d.text((cx + 2, cy + 2), f"{e['name'][:20]}", fill=col, font=f_small)
        d.text(
            (cx + 2, cy + 14),
            f"{m['albedo']:.2f} · {m['rough'] if m['rough'] is not None else '—'} · {m['render']:.2f}",
            fill=(150, 158, 172),
            font=f_small,
        )
    return img


def selftest() -> None:
    """Batas verdict harus benar: albedo sangat gelap/terang tidak boleh lolos."""
    cases = [
        ({"albedo": 0.02, "emissive": 0.0}, "terlalu gelap"),
        ({"albedo": 0.95, "emissive": 0.0}, "terlalu terang"),
        ({"albedo": 0.30, "emissive": 0.0}, "ok"),
        ({"albedo": 0.99, "emissive": 1.0}, "emisi"),
    ]
    for m, want in cases:
        got = verdict(m)
        assert got == want, f"verdict({m}) = {got}, harusnya {want}"
    print(f"selftest kalibrasi lulus: {len(cases)} batas verdict")


def main(argv: list[str]) -> None:
    if "--selftest" in argv:
        selftest()
        return
    entries = material_entries()
    if "--limit" in argv:
        n = int(argv[argv.index("--limit") + 1])
        entries = entries[:n]
    if "--check" in argv and "--write" not in argv:
        fast = [basic(e) for e in entries]
        md = DOC.read_text()
        block = md[md.index(BEGIN) : md.index(END)]
        doc_rows = [l for l in block.splitlines() if l.startswith("| `")]
        problems = []
        if len(doc_rows) != len(entries):
            problems.append(f"baris tabel {len(doc_rows)} ≠ jumlah material {len(entries)}")
        for line, e, m in zip(doc_rows, entries, fast):
            cells = [c.strip() for c in line.strip("|").split("|")]
            want = [
                f"`{e['asset']}`",
                e["name"],
                f"{m['albedo']:.3f}",
                str(m["rough"]) if m["rough"] is not None else "—",
                str(m["metal"]) if m["metal"] is not None else "—",
                verdict(m),
            ]
            if cells[:5] != want[:5] or cells[6] != want[5]:
                problems.append(f"{e['asset']}/{e['name']}: tabel {cells[:5]}≠{want[:5]} atau status {cells[6]}≠{want[5]}")
        bad = [e for e, m in zip(entries, fast) if verdict(m) not in ("ok", "emisi")]
        print(
            f"{len(entries)} material · albedo {min(m['albedo'] for m in fast):.3f}–"
            f"{max(m['albedo'] for m in fast):.3f} · {len(bad)} di luar rentang · "
            f"{len(problems)} masalah tabel"
        )
        for pr in problems[:10]:
            print(f"  ! {pr}")
        if problems or bad:
            sys.exit(1)
        return

    rows = [measure(e) for e in entries]
    bad = [(e["asset"], e["name"], m, verdict(m)) for e, m in zip(entries, rows) if verdict(m) not in ("ok", "emisi")]

    if "--sheet" in argv:
        out = Path(argv[argv.index("--sheet") + 1])
        out.parent.mkdir(parents=True, exist_ok=True)
        sheet(entries, rows).save(out)
        print(f"{out}: {len(entries)} material")

    if "--write" in argv:
        lines = ["| aset | material | albedo | roughness | metallic | render | status |", "|---|---|---|---|---|---|---|"]
        for e, m in zip(entries, rows):
            lines.append(
                f"| `{e['asset']}` | {e['name']} | {m['albedo']:.3f} | "
                f"{m['rough'] if m['rough'] is not None else '—'} | {m['metal'] if m['metal'] is not None else '—'} | "
                f"{m['render']:.3f} | {verdict(m)} |"
            )
        md = DOC.read_text()
        a, b = md.index(BEGIN), md.index(END)
        DOC.write_text(md[: a + len(BEGIN)] + "\n\n" + "\n".join(lines) + "\n\n" + md[b:])
        print(f"tabel ditulis ulang: {len(entries)} material")

    lums = [m["albedo"] for m in rows]
    print(
        f"{len(entries)} material · albedo {min(lums):.3f}–{max(lums):.3f} "
        f"(median {sorted(lums)[len(lums) // 2]:.3f}) · {len(bad)} di luar rentang"
    )
    for a, n, m, v in bad[:12]:
        print(f"  ! {a} / {n}: albedo {m['albedo']:.3f} → {v}")
    if "--check" in argv and bad:
        sys.exit(1)
    if bad:
        pass


if __name__ == "__main__":
    main(sys.argv[1:])
