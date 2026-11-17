"""Dev: lihat satu potong pakaian dari beberapa sudut (diagnosa jahitan).

    python3 studio-forge/dev_garment.py char.male-dewasa-polo cortu_cargo_pants /tmp/pants.png
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from forge import character, render  # noqa: E402

F = np.float32

name = sys.argv[1] if len(sys.argv) > 1 else "char.male-dewasa-polo"
want = sys.argv[2] if len(sys.argv) > 2 else "cortu_cargo_pants"
out = sys.argv[3] if len(sys.argv) > 3 else "/tmp/garment.png"

captured = {}
orig = character.write_skinned_glb


def cap(path, n, parts, bones, clips, **kw):
    captured["parts"] = parts
    return orig(path, n, parts, bones, clips, **kw)


character.write_skinned_glb = cap
character.build(name, character.SPECS[name], "/tmp/assets", size=512)
parts = captured["parts"]
sel = [i for i, p in enumerate(parts) if want in p["mat"].name]
print("part:", [(i, parts[i]["mat"].name, len(parts[i]["idx"]) // 3) for i in sel])
rp = character.to_render_parts(parts)

views = {
    "depan": ((0.0, 1.0, 2.6), (0, 0.95, 0)),
    "belakang": ((0.0, 1.0, -2.6), (0, 0.95, 0)),
    "samping": ((2.6, 1.0, 0.0), (0, 0.95, 0)),
    "dekat": ((0.5, 1.0, 1.2), (0, 0.9, 0)),
}
tiles = []
with_body = "--body" in sys.argv
for label, (eye, target) in views.items():
    sc = render.Scene()
    for i in sel:  # hanya kain
        p = parts[i]
        sc.add(p["pos"], p["idx"], p["uv"], p.get("normals"), rp[i]["mat"])
    if with_body:
        b = parts[0]
        sc.add(b["pos"], b["idx"], b["uv"], b.get("normals"), rp[0]["mat"])
    img = render.render(sc, None, eye=eye, target=target, fov=40, size=(420, 520), ground=None)
    tiles.append(np.asarray(img.convert("RGB"), F) / 255.0)

sheet = np.concatenate(tiles, axis=1)
from PIL import Image  # noqa: E402

Image.fromarray((np.clip(sheet, 0, 1) * 255).astype(np.uint8)).save(out)
print("tulis", out)
