"""Dev: lembar kontak semua karakter (bukti rupa, bukan thumbnail terpisah).

    ./.venv/bin/python studio-forge/dev_lineup.py docs/character-lineup.png

Membaca GLB yang sudah dibangun (bukan membangun ulang), jadi lembar ini
selalu memperlihatkan aset yang benar-benar ada di `public/assets`. Warna tiap
material diambil dari tekstur base colour yang tertanam di GLB, jadi lembar ini
ikut berubah kalau warna pakaian berubah.
"""
from __future__ import annotations

import io
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))

from forge import render  # noqa: E402
from forge.glb_read import accessor, read_glb  # noqa: E402

F = np.float32

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

# Urutan tampil: dewasa dulu (dari yang tertinggi), lalu remaja, anak, balita.
ORDER = [
    "char.male-dewasa-polo",
    "char.male-dewasa-kemeja",
    "char.male-pekerja",
    "char.male-muda-jaket",
    "char.male-lansia-kemeja",
    "char.female-dewasa",
    "char.female-dewasa-daster",
    "char.female-lansia",
    "char.remaja-laki",
    "char.remaja-perempuan",
    "char.anak-laki",
    "char.anak-perempuan",
    "char.balita-laki",
    "char.balita-perempuan",
]

TILE_W, TILE_H = 150, 330
SCALE = 0.62  # 1 unit GLB (meter) → piksel dunia render


def tex_image(js: dict, bn: bytes, index: int) -> np.ndarray:
    """Tekstur base colour sebuah material sebagai array float (h, w, 3)."""
    img = js["images"][js["textures"][index]["source"]]
    view = js["bufferViews"][img["bufferView"]]
    off = view.get("byteOffset", 0)
    raw = bn[off : off + view["byteLength"]]
    return np.asarray(Image.open(io.BytesIO(raw)).convert("RGB"), F) / 255.0


def load(path: Path):
    """Ambil primitif GLB (posisi, indeks, uv, material) tanpa skinning."""
    js, bn = read_glb(path)
    out = []
    for mesh in js["meshes"]:
        for prim in mesh["primitives"]:
            mat = js["materials"][prim["material"]]
            pbr = mat.get("pbrMetallicRoughness", {})
            base = None
            if "baseColorTexture" in pbr:
                base = tex_image(js, bn, pbr["baseColorTexture"]["index"])
            pos = accessor(js, bn, prim["attributes"]["POSITION"]).astype(F)
            uv = accessor(js, bn, prim["attributes"]["TEXCOORD_0"]).astype(F)
            idx = accessor(js, bn, prim["indices"]).astype(np.int64).ravel()
            out.append(
                {
                    "pos": pos,
                    "uv": uv,
                    "idx": idx,
                    "mat": {
                        "base": base,
                        "alpha_cutoff": 0.35 if mat["name"] == "hair" else None,
                        "use_normal": False,
                    },
                    "double_sided": mat.get("doubleSided", False),
                }
            )
    return out


def main(out_path: str) -> None:
    reg = json.loads((PUBLIC / "assets" / "registry.json").read_text())["assets"]
    ids = [i for i in ORDER if i in reg]
    missing = [i for i in ORDER if i not in reg]
    for i in missing:
        print("lewat (belum ada):", i)

    scene = render.Scene()
    slot = 0.92  # jarak antar tokoh dalam meter dunia render
    labels = []
    for n, aid in enumerate(ids):
        entry = reg[aid]
        glb = PUBLIC / entry["uri"]
        parts = load(glb)
        x = (n - (len(ids) - 1) / 2) * slot
        for p in parts:
            pos = p["pos"].copy()
            pos[:, 0] += x
            pm = p["mat"]
            if pm.get("alpha_cutoff") is None:
                pm.pop("alpha_cutoff", None)
            scene.add(pos, p["idx"], p["uv"], None, pm)
        h = entry["bounds"]["size"][1]
        outfit = entry.get("outfit", "")
        labels.append((n, x, aid.replace("char.", ""), f"{h:.2f} m · {outfit}"))

    # Kamera jauh + fov sempit ≈ ortografis: proporsi antar usia terbaca jujur.
    span = max(1.0, len(ids) * slot)
    tile, height = 128, 560
    W, H = tile * len(ids), height
    aspect = W / H
    tanv = float(np.tan(np.radians(9.0)))
    half_w = span * 0.54
    dist = half_w / (tanv * aspect)
    ground_mat = {"base": np.full((4, 4, 3), 0.17, F), "use_normal": False}
    img = render.render(
        scene,
        None,
        eye=(0.0, 0.95, dist),
        target=(0.0, 0.88, 0.0),
        fov=18.0,
        size=(W, H),
        ground={"y": 0.0, "mat": ground_mat},
        shadow=True,
        vignette=0.18,
    )
    arr = np.asarray(img.convert("RGB"), F) / 255.0

    # Label: dua baris kecil di bawah tiap tokoh (tanpa font khusus).
    from PIL import ImageDraw

    im = Image.fromarray((np.clip(arr, 0, 1) * 255).astype(np.uint8))
    dr = ImageDraw.Draw(im)
    for n, x, name, sub in labels:
        # x dunia → piksel: proyeksi linier karena kamera jauh (≈ ortografis)
        px = int(W / 2 + (x / half_w) * (W / 2))
        dr.text((px - 56, H - 26), name, fill=(232, 236, 240))
        dr.text((px - 56, H - 14), sub, fill=(150, 198, 170))
    im.save(out_path)
    print("tulis", out_path, im.size, "·", len(ids), "tokoh · jarak kamera %.1f m" % dist)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "docs/character-lineup.png")
