"""Dev helper: build one asset in memory and render QC stills."""
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from forge import character, render  # noqa: E402

spec_name = sys.argv[1] if len(sys.argv) > 1 else "char.male-dewasa-polo"
size = int(sys.argv[2]) if len(sys.argv) > 2 else 1024
spec = character.SPECS[spec_name]

captured = {}
orig = character.write_skinned_glb


def cap(path, name, parts, bones, clips, **kw):
    captured["parts"] = parts
    captured["bones"] = bones
    return orig(path, name, parts, bones, clips, **kw)


character.write_skinned_glb = cap
meta = character.build(spec_name, spec, "/tmp/assets", size=size)
print(meta["tris"], "tris", meta["size"] // 1024, "KB")

rp = character.to_render_parts(captured["parts"])
sc = render.Scene()
for p in rp:
    sc.add(p["pos"], p["idx"], p["uv"], p.get("normals"), p["mat"])

h = spec["height"]
ground = {"mat": {"base": None}, "y": 0.0}
render.render(sc, "/tmp/char_full.png", eye=(1.9, 1.45, 2.9), target=(0, 0.95, 0), fov=34, size=(640, 800), ground=ground)
render.render(sc, "/tmp/char_34.png", eye=(1.15, h - 0.02, 1.05), target=(0, h - 0.13, 0.05), fov=28, size=(640, 640))
render.render(sc, "/tmp/char_face.png", eye=(0.05, h - 0.055, 0.72), target=(0, h - 0.115, 0.02), fov=24, size=(640, 640), light_intensity=2.2, ambient=0.45)
print("rendered")
