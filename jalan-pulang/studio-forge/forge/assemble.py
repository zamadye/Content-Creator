"""Assemble skinned / static GLB assets from prepared parts."""
from __future__ import annotations

import numpy as np

from .glb import GLBWriter, MeshDef, Primitive
from .kit import compute_normals, compute_tangents
from .skin import quat_from_euler

F = np.float32


def inverse_bind_matrices(bones):
    out = np.zeros((len(bones), 4, 4), F)
    for i, b in enumerate(bones):
        m = np.eye(4, dtype=F)
        m[:3, 3] = -np.asarray(b["p"], F)
        out[i] = m
    return out


def joint_nodes(bones):
    children = [[] for _ in bones]
    roots = []
    for i, b in enumerate(bones):
        if b["parent"] >= 0:
            children[b["parent"]].append(i)
        else:
            roots.append(i)
    nodes = []
    for i, b in enumerate(bones):
        # b["p"] is an absolute rest position in metres; glTF node translation is
        # relative to the parent, so subtract it (roots stay absolute).
        p = np.asarray(b["p"], np.float64)
        if b["parent"] >= 0:
            p = p - np.asarray(bones[b["parent"]]["p"], np.float64)
        node = {"name": b["name"], "translation": [float(x) for x in p]}
        if children[i]:
            node["children"] = children[i]
        nodes.append(node)
    return nodes, roots


def sample_clip(clip, fps=30):
    n = int(clip["frames"])
    ts = np.linspace(0, 1, n + 1)
    times = np.arange(n + 1) / fps
    quats, roots = {}, []
    for k in range(n + 1):
        pose, root = clip["fn"](float(ts[k]))
        for bone, e in pose.items():
            quats.setdefault(bone, []).append(quat_from_euler(*e))
        roots.append(root)
    return times, {k: np.array(v, F) for k, v in quats.items()}, np.array(roots, F)


def write_skinned_glb(path, name, parts, bones, clips, extras=None, fps=30, anchors=None, generator="Content-Creator studio-forge"):
    w = GLBWriter(generator)
    if extras:
        w.asset_extras = extras
    nodes, roots = joint_nodes(bones)
    J = len(bones)
    mesh_node_index = len(nodes)
    nodes.append({"name": f"{name}-mesh", "mesh": 0, "skin": 0})

    prims = []
    for mi, part in enumerate(parts):
        pos = np.asarray(part["pos"], F)
        idx = np.asarray(part["idx"], np.int64).ravel()
        uv = np.asarray(part["uv"], F)
        nrm = part.get("normals")
        if nrm is None:
            nrm = compute_normals(pos, idx)
        prims.append(
            Primitive(
                positions=pos,
                indices=idx,
                normals=nrm,
                uvs=uv,
                tangents=compute_tangents(pos, uv, idx, nrm),
                material=mi,
                joints=np.asarray(part["joints"], np.uint16),
                weights=np.asarray(part["weights"], F),
            )
        )
        w.add_material(part["mat"])
    w.add_mesh(MeshDef(name=name, primitives=prims))

    name_to_index = {b["name"]: i for i, b in enumerate(bones)}
    for clip_name, clip in clips.items():
        if clip.get("skip"):
            continue
        times, quats, roots_off = sample_clip(clip, fps)
        channels = []
        for bone, q in quats.items():
            if bone not in name_to_index:
                continue
            if np.allclose(q, q[0]) and np.allclose(q[0], [0, 0, 0, 1], atol=1e-4):
                continue
            channels.append({"node": name_to_index[bone], "path": "rotation", "times": times, "values": q})
        if np.any(np.abs(roots_off) > 1e-6):
            root_bone = bones[roots[0]]
            base_t = np.asarray(root_bone["p"], F)
            trans = base_t[None, :] + roots_off
            channels.append({"node": name_to_index[root_bone["name"]], "path": "translation", "times": times, "values": trans})
        if channels:
            w.add_animation(clip_name, channels, loop=clip.get("loop", True))

    w.nodes = nodes
    scene_nodes = list(roots) + [mesh_node_index]
    for a in anchors or []:
        nodes.append({"name": a["name"], "translation": list(a["translation"])})
        scene_nodes.append(len(nodes) - 1)
    w.scene_nodes = scene_nodes
    w.skins = [
        {
            "name": extras.get("rig", "studio-humanoid-v1") if extras else "studio-humanoid-v1",
            "joints": list(range(J)),
            "inverseBindMatrices": inverse_bind_matrices(bones),
            "skeleton": roots[0] if roots else 0,
        }
    ]
    gltf = w.write(path)
    return {"gltf": gltf, "nodes": nodes, "mesh_node": mesh_node_index, "roots": roots}


def write_static_glb(path, name, builder, materials, extras=None, anchors=None, generator="Content-Creator studio-forge", pack_uv=True):
    """builder: kit.Builder with one Surface per material name; materials: name -> Material."""
    if pack_uv:
        from .uvpack import pack_builder

        pack_builder(builder)
    w = GLBWriter(generator)
    if extras:
        w.asset_extras = extras
    prims = []
    for mat_name, surf in builder.groups.items():
        if not surf.pos:
            continue
        pos = np.vstack(surf.pos)
        uv = np.vstack(surf.uv)
        nrm = np.vstack(surf.nrm)
        idx = np.concatenate(surf.idx)
        ln = np.linalg.norm(nrm, axis=1)
        if (ln < 1e-6).any():
            nrm = compute_normals(pos, idx)
        prims.append(
            Primitive(
                positions=pos,
                indices=idx,
                normals=nrm,
                uvs=uv,
                tangents=compute_tangents(pos, uv, idx, nrm),
                material=len(prims),
            )
        )
        w.add_material(materials[mat_name])
    w.add_mesh(MeshDef(name=name, primitives=prims))
    w.nodes = [{"name": name, "mesh": 0}]
    scene_nodes = [0]
    for a in anchors or []:
        w.nodes.append({"name": a["name"], "translation": list(a["translation"])})
        scene_nodes.append(len(w.nodes) - 1)
    w.scene_nodes = scene_nodes
    return w.write(path)
