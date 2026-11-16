"""QC bake AO: statistik, bukti visual, dan selftest algoritma.

    python3 studio-forge/dev_bake.py --selftest
    python3 studio-forge/dev_bake.py --stats public/assets/**/*.glb
    python3 studio-forge/dev_bake.py --baseline /tmp/baseline.json
    python3 studio-forge/dev_bake.py --image public/assets/prop/prop.drum/prop.drum.glb docs/bake-drum.png
"""
from __future__ import annotations

import io
import json
import struct
import sys
from pathlib import Path

import numpy as np
from PIL import Image

F = np.float32
ROOT = Path(__file__).resolve().parent.parent


def glb_json_bin(path: Path) -> tuple[dict, bytes]:
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


def _image_bytes(js: dict, bn: bytes, image_index: int) -> bytes:
    bv = js["bufferViews"][js["images"][image_index]["bufferView"]]
    start = bv.get("byteOffset", 0)
    return bn[start : start + bv["byteLength"]]


def ao_channel(glb: Path, material_index: int) -> np.ndarray | None:
    """Kanal R (AO) dari tekstur metallicRoughness/ORM sebuah material."""
    js, bn = glb_json_bin(glb)
    mat = js["materials"][material_index]
    tex = mat.get("pbrMetallicRoughness", {}).get("metallicRoughnessTexture")
    if not tex:
        return None
    img = js["textures"][tex["index"]]["source"]
    arr = np.asarray(Image.open(io.BytesIO(_image_bytes(js, bn, img))).convert("RGB"), F) / 255.0
    return arr[..., 0]


def stats(glb: Path) -> dict:
    js, _ = glb_json_bin(glb)
    out = {}
    for i, mat in enumerate(js.get("materials", [])):
        ao = ao_channel(glb, i)
        if ao is None:
            continue
        out[mat.get("name", f"mat{i}")] = {
            "mean": round(float(ao.mean()), 4),
            "min": round(float(ao.min()), 4),
            "dark": round(float((ao < 0.85).mean()), 4),
        }
    return out


def summary(glb: Path) -> dict:
    per = stats(glb)
    if not per:
        return {"materials": 0, "mean": 1.0, "min": 1.0, "dark": 0.0}
    return {
        "materials": len(per),
        "mean": round(float(np.mean([m["mean"] for m in per.values()])), 4),
        "min": round(float(min(m["min"] for m in per.values())), 4),
        "dark": round(float(np.mean([m["dark"] for m in per.values()])), 4),
    }


# ------------------------------------------------------------------ selftest
def selftest() -> None:
    """Geometri buatan: pelat + kotak di atasnya. AO di bawah kotak harus lebih gelap."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from forge.bake import bake_ao

    n = 9
    xs = np.linspace(-1, 1, n, dtype=F)
    plate_v = np.stack(np.meshgrid(xs, xs), -1).reshape(-1, 2)
    plate = np.concatenate([plate_v, np.zeros((len(plate_v), 1), F)], 1)
    plate_uv = (plate_v + 1) / 2
    idx = []
    for j in range(n - 1):
        for i in range(n - 1):
            a = j * n + i
            idx += [a, a + 1, a + n + 1, a, a + n + 1, a + n]
    idx = np.array(idx, np.int64)
    plate_n = np.tile(np.array([[0, 0, 1]], F), (len(plate), 1))

    # kotak kecil melayang 0.2 m di atas pusat pelat
    s = 0.25
    y = 0.2
    box_v = np.array(
        [
            [-s, -s, y], [s, -s, y], [s, s, y], [-s, s, y],
            [-s, -s, y + 0.1], [s, -s, y + 0.1], [s, s, y + 0.1], [-s, s, y + 0.1],
        ],
        F,
    )
    box_f = np.array([[0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6], [0, 4, 5], [0, 5, 1],
                      [1, 5, 6], [1, 6, 2], [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0]], np.int64)
    box_n = np.tile(np.array([[0, 0, 1]], F), (8, 1))
    box_uv = np.tile(np.array([[0.5, 0.5]], F), (8, 1))  # tidak dipakai untuk sampel

    plate_part = {"pos": plate, "idx": idx, "uv": plate_uv, "normals": plate_n}
    box_part = {"pos": box_v, "idx": box_f.ravel(), "uv": box_uv, "normals": box_n}

    res = 96
    a = bake_ao([plate_part, box_part], [plate_part], res=res, max_dist=0.6, steps=16, cells=64)["ao"]
    b = bake_ao([plate_part, box_part], [plate_part], res=res, max_dist=0.6, steps=16, cells=64)["ao"]

    yy, xx = np.mgrid[0:res, 0:res]
    # pusat UV (0.5,0.5) = tengah pelat; di gambar v dibalik
    under = a[res // 2 - 6 : res // 2 + 6, res // 2 - 6 : res // 2 + 6].mean()
    corner = a[4:16, 4:16].mean()
    assert np.array_equal(a, b), "bake harus deterministik"
    assert corner - under > 0.15, f"oklusi kotak tidak terukur (bawah {under:.3f} vs pojok {corner:.3f})"
    print(
        f"selftest lulus: AO di bawah kotak {under:.3f} vs pojok terbuka {corner:.3f} "
        f"(selisih {corner - under:.3f}), deterministik, {res}x{res} texel"
    )


def contact_sheet(glb: Path, out: Path) -> None:
    """Peta AO tiap material disusun jadi satu lembar (bukti visual bake)."""
    js, _ = glb_json_bin(glb)
    maps = []
    for i, mat in enumerate(js.get("materials", [])):
        ao = ao_channel(glb, i)
        if ao is None:
            continue
        maps.append((mat.get("name", f"mat{i}"), ao))
    if not maps:
        raise SystemExit(f"{glb}: tidak ada tekstur ORM")
    size = 192
    sheet = Image.new("RGB", (size * len(maps), size + 22), (18, 20, 24))
    from PIL import ImageDraw, ImageFont

    font = ImageFont.load_default(size=13)
    d = ImageDraw.Draw(sheet)
    for k, (name, ao) in enumerate(maps):
        img = Image.fromarray((np.clip(ao, 0, 1) * 255).astype(np.uint8), mode="L").resize((size, size), Image.BILINEAR)
        sheet.paste(img.convert("RGB"), (k * size, 22))
        d.text((k * size + 4, 4), f"{name}  μ{ao.mean():.2f}", fill=(210, 214, 222), font=font)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"{out}: {len(maps)} material")


# ------------------------------------------------------------------ verify
DOC = ROOT / "docs" / "BAKING.md"
BEGIN = "<!-- BEGIN:bake -->"
END = "<!-- END:bake -->"


def verify(baseline_path: Path, write: bool = False) -> int:
    """Bandingkan AO hasil bake dengan baseline prosedural; tulis tabel dokumen."""
    base = json.loads(baseline_path.read_text())
    rows = []
    for glb in sorted((ROOT / "public" / "assets").rglob("*.glb")):
        cur = summary(glb)
        old = base.get(glb.stem)
        if old is None:
            print(f"  ! {glb.stem}: tidak ada di baseline")
            return 1
        rows.append((glb.stem, old, cur))

    darker = [r for r in rows if r[2]["mean"] < r[1]["mean"] - 0.005]
    problems = []
    for name, old, cur in rows:
        if cur["materials"] == 0:
            problems.append(f"{name}: tidak punya tekstur ORM")
        if cur["mean"] > old["mean"] + 0.002:
            problems.append(f"{name}: AO justru lebih terang ({old['mean']:.3f} -> {cur['mean']:.3f})")
    if len(darker) < 15:
        problems.append(f"hanya {len(darker)} aset yang AO-nya benar-benar turun (harus ≥ 15)")

    mean_before = float(np.mean([r[1]["mean"] for r in rows]))
    mean_after = float(np.mean([r[2]["mean"] for r in rows]))

    if write:
        lines = [
            "| aset | mat | AO prosedural | AO bake | Δ | min | texel gelap |",
            "|---|---|---|---|---|---|---|",
        ]
        for name, old, cur in rows:
            lines.append(
                f"| `{name}` | {cur['materials']} | {old['mean']:.3f} | {cur['mean']:.3f} | "
                f"{cur['mean'] - old['mean']:+.3f} | {cur['min']:.2f} | {cur['dark'] * 100:.1f}% |"
            )
        md = DOC.read_text()
        a, b = md.index(BEGIN), md.index(END)
        DOC.write_text(md[: a + len(BEGIN)] + "\n\n" + "\n".join(lines) + "\n\n" + md[b:])

    print(
        f"{len(rows)} aset · {len(darker)} jadi lebih gelap · rata-rata AO {mean_before:.3f} -> {mean_after:.3f} "
        f"· {len(problems)} masalah"
    )
    if problems:
        for pr in problems:
            print(f"  ! {pr}")
        return 1
    return 0


def main(argv: list[str]) -> None:
    if "--verify" in argv:
        i = argv.index("--verify")
        rc = verify(Path(argv[i + 1]), write="--write" in argv)
        if rc:
            sys.exit(rc)
        return
    if "--selftest" in argv:
        selftest()
        return
    if "--baseline" in argv:
        i = argv.index("--baseline")
        out = Path(argv[i + 1])
        base_dir = Path(argv[i + 2]) if len(argv) > i + 2 else ROOT / "public" / "assets"
        data = {}
        for glb in sorted(base_dir.rglob("*.glb")):
            data[glb.stem] = summary(glb)
        out.write_text(json.dumps(data, indent=1, sort_keys=True))
        print(f"{out}: {len(data)} aset")
        return
    if "--image" in argv:
        i = argv.index("--image")
        contact_sheet(Path(argv[i + 1]), Path(argv[i + 2]))
        return
    if "--stats" in argv:
        for p in argv[argv.index("--stats") + 1 :]:
            glb = Path(p)
            if glb.is_file():
                s = summary(glb)
                print(f"{glb.stem:32s} mat {s['materials']:2d}  AO μ{s['mean']:.3f} min {s['min']:.3f} gelap {s['dark']*100:.1f}%")
        return
    print(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
