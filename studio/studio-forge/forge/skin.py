"""CPU skinning used for QC previews (the runtime uses the GPU)."""
from __future__ import annotations

import numpy as np

F = np.float32


def quat_from_euler(rx, ry, rz):
    cx, sx = np.cos(rx / 2), np.sin(rx / 2)
    cy, sy = np.cos(ry / 2), np.sin(ry / 2)
    cz, sz = np.cos(rz / 2), np.sin(rz / 2)
    return np.array(
        [
            sx * cy * cz + cx * sy * sz,
            cx * sy * cz - sx * cy * sz,
            cx * cy * sz + sx * sy * cz,
            cx * cy * cz - sx * sy * sz,
        ]
    )


def matrix_from(quat, translation):
    x, y, z, w = quat
    m = np.eye(4, dtype=np.float64)
    m[:3, :3] = np.array(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ]
    )
    m[:3, 3] = translation
    return m


def world_matrices(bones, pose=None, root_offset=(0, 0, 0)):
    """bones: list of {name, parent, p} in metres, rest = identity rotation.

    ``p`` is the absolute rest position, so the local translation of a child is
    ``p - parent.p`` (otherwise the skeleton accumulates to ~23 m tall and every
    rotation pivots around the wrong point).
    """
    pose = pose or {}
    J = len(bones)
    locals_ = []
    for i, b in enumerate(bones):
        rx, ry, rz = pose.get(b["name"], (0.0, 0.0, 0.0))
        t = np.array(b["p"], dtype=np.float64)
        if b["parent"] >= 0:
            t = t - np.asarray(bones[b["parent"]]["p"], dtype=np.float64)
        else:
            t = t + np.asarray(root_offset, dtype=np.float64)
        locals_.append(matrix_from(quat_from_euler(rx, ry, rz), t))
    world = [None] * J
    for i in range(J):
        p = bones[i]["parent"]
        world[i] = locals_[i] if p < 0 else world[p] @ locals_[i]
    return world


def skin_mesh(pos, joints, weights, world, ibm):
    """pos (N,3), joints (N,4), weights (N,4), world (J,4,4), ibm (J,4,4)."""
    pos = np.asarray(pos, np.float64)
    out = np.zeros_like(pos)
    mats = np.stack([world[i] @ ibm[i] for i in range(len(world))])
    ph = np.concatenate([pos, np.ones((len(pos), 1))], 1)
    for k in range(4):
        j = joints[:, k].astype(np.int64)
        w = weights[:, k].astype(np.float64)[:, None]
        m = mats[j]  # (N,4,4)
        out += np.einsum("nij,nj->ni", m, ph)[:, :3] * w
    return out.astype(F)
