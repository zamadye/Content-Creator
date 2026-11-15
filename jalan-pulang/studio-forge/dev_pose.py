"""QC: render a character in a posed animation frame (skinning check, no engine).

    python3 studio-forge/dev_pose.py char.male-dewasa-polo walk 12 /tmp/pose.png
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from forge import character, entity, render, skin  # noqa: E402
from forge.assemble import inverse_bind_matrices, sample_clip  # noqa: E402
from forge.skin import matrix_from, quat_from_euler  # noqa: E402

F = np.float32


def posed_world(bones, quats, frame, root_offset=(0.0, 0.0, 0.0)):
    """World matrices with quaternion pose (same convention as skin.world_matrices)."""
    locals_ = []
    for b in bones:
        q = quats.get(b["name"])
        t = np.asarray(b["p"], np.float64)
        if b["parent"] >= 0:
            t = t - np.asarray(bones[b["parent"]]["p"], np.float64)
        else:
            t = t + np.asarray(root_offset, np.float64)
        locals_.append(matrix_from(q[frame] if q is not None else quat_from_euler(0, 0, 0), t))
    world = [None] * len(bones)

    def world_of(i):
        if world[i] is None:
            parent = bones[i]["parent"]
            world[i] = locals_[i] if parent < 0 else world_of(parent) @ locals_[i]
        return world[i]

    for i in range(len(bones)):
        world_of(i)
    return np.stack(world)


def main(asset_id, clip_name, frame, out):
    spec = character.SPECS.get(asset_id) or entity.SPECS[asset_id]
    captured = {}
    orig = character.write_skinned_glb

    def cap(path, name, parts, bones, clips, **kw):
        captured["parts"], captured["bones"], captured["clips"] = parts, bones, clips
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        Path(path).write_bytes(b"")  # placeholder so build() can stat it
        return {"gltf": None, "size": 0}

    character.write_skinned_glb = cap
    try:
        character.build(asset_id, spec, Path("/tmp/pose_unused"), size=512)
    finally:
        character.write_skinned_glb = orig

    parts, bones, clips = captured["parts"], captured["bones"], captured["clips"]
    clip = clips[clip_name]
    _, quats, roots = sample_clip(clip, 30)
    frame = min(frame, len(roots) - 1)
    world = posed_world(bones, quats, frame, roots[frame])
    ibm = inverse_bind_matrices(bones)

    sc = render.Scene()
    for part in parts:
        pos = np.asarray(part["pos"], F)
        idx = np.asarray(part["idx"], np.int64).ravel()
        posed = skin.skin_mesh(pos, part["joints"], part["weights"], world, ibm)
        m = part["mat"]
        sc.add(
            posed,
            idx,
            np.asarray(part["uv"], F),
            np.asarray(part["normals"], F) if part.get("normals") is not None else None,
            {
                "base": m.base,
                "normal": m.normal,
                "orm": m.orm,
                "emissive": m.emissive,
                "alpha_mode": getattr(m, "alpha_mode", None),
                "alpha_cutoff": getattr(m, "alpha_cutoff", None),
                "double_sided": getattr(m, "double_sided", False),
            },
        )
    h = float(spec.get("height", 1.75))
    img = render.render(
        sc,
        out,
        eye=(0.92 * h, 0.78 * h, 1.85 * h),
        target=(0, 0.50 * h, 0.05 * h),
        fov=36,
        size=(420, 560),
        ground={"mat": {"base": None}, "y": -0.02, "radius": 6.0},
        light_intensity=1.5,
        ambient=0.32,
    )
    img.save(out)
    print(f"{asset_id} {clip_name} frame {frame} -> {out}")


if __name__ == "__main__":
    a = sys.argv[1] if len(sys.argv) > 1 else "char.male-dewasa-polo"
    c = sys.argv[2] if len(sys.argv) > 2 else "walk"
    f = int(sys.argv[3]) if len(sys.argv) > 3 else 12
    o = sys.argv[4] if len(sys.argv) > 4 else "/tmp/pose.png"
    main(a, c, f, o)
