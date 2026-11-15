import sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parent))
from forge import character, render, human

spec = character.SPECS["char.male-dewasa-polo"]
cap = {}
orig = character.write_skinned_glb


def c(path, name, parts, bones, clips, **kw):
    cap["parts"] = parts
    return orig(path, name, parts, bones, clips, **kw)


character.write_skinned_glb = c
character.build("x", spec, "/tmp/assets", size=512)
parts = cap["parts"]

def shot(sel, out, eye=(1.6, 1.2, 2.4), target=(0, 0.95, 0), fov=36, size=(420, 520)):
    sc = render.Scene()
    for i in sel:
        p = parts[i]
        sc.add(p["pos"], p["idx"], p["uv"], p.get("normals"), character.to_render_parts([p])[0]["mat"])
    render.render(sc, out, eye=eye, target=target, fov=fov, size=size, ground=None)

shot([0], "/tmp/diag_body.png")
shot([0, 1], "/tmp/diag_body_shirt.png")
shot([0, 2], "/tmp/diag_body_pants.png")
print("ok")
