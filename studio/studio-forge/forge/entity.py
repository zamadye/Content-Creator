"""Entities (ghosts) built from the same skeleton contract with their own
silhouette deformers and cloth shroud geometry — not recoloured humans."""
from __future__ import annotations

import numpy as np

from .uvpaint import smoothstep

F = np.float32


def shape_entity(P, spec):
    e = spec.get("entity", {})
    P = np.array(P, F, copy=True)
    y = P[:, 1]
    ax = np.abs(P[:, 0])
    # limb elongation: stretch arms beyond the shoulder and legs below the hip
    limb_len = e.get("limb_len", 0.0)
    if limb_len:
        arm = smoothstep((ax - 1.55) / 1.4) * (y > 1.6)
        P[:, 0] += np.sign(P[:, 0]) * arm * limb_len * 1.35
        leg = smoothstep((-y - 2.4) / 4.2) * (y < 0.2)
        P[:, 1] -= leg * limb_len * 2.3
    # trunk stretch
    tl = e.get("torso_len", 0.0)
    if tl:
        band = smoothstep((y - 1.4) / 3.4) * (1 - smoothstep((y - 4.4) / 1.6))
        P[:, 1] += band * tl * 1.8
    # long neck
    nl = e.get("neck_len", 0.0)
    if nl:
        band = smoothstep((y - 5.3) / 0.8) * (1 - smoothstep((y - 6.1) / 0.5))
        P[:, 1] += band * nl * 1.4
    # oversized / undersized head
    hs = e.get("head_scale", 1.0)
    if hs != 1.0:
        head = y > 6.30
        c = np.array([0.0, 7.35, 0.35], F)
        P[head] = c + (P[head] - c) * hs
    # sunken features
    hollow = e.get("hollow", 0.0)
    if hollow:
        for s in (1, -1):
            d = np.sqrt(((P[:, 0] - s * 0.31) / 0.20) ** 2 + ((P[:, 1] - 7.30) / 0.16) ** 2 + ((P[:, 2] - 1.24) / 0.22) ** 2)
            m = (1 - smoothstep(d - 0.15)) * hollow
            P[:, 2] -= m * 0.16
        P[:, 2] -= np.clip((np.abs(P[:, 0]) - 0.05) < 0.05, 0, 1) * 0.0
    # narrow shoulders, dropped posture
    ns = e.get("narrow", 0.0)
    if ns:
        band = smoothstep((y - 4.4) / 1.1)
        P[:, 0] -= np.sign(P[:, 0]) * band * ns * 0.35
    # ribcage taper
    taper = e.get("taper", 0.0)
    if taper:
        band = smoothstep((y - 1.2) / 2.0) * (1 - smoothstep((y - 4.6) / 1.2))
        P[:, 2] -= band * taper * 0.12
        P[:, 0] -= np.sign(P[:, 0]) * band * taper * 0.08
    return P


def shroud(P, y_top=5.6, y_bottom=-0.6, rows=22, cols=26, radius_scale=1.10, flare=1.35):
    """Long draped shroud: a cone from the shoulders to below the feet.

    P must be the *torso* vertices only (arms would inflate the radius into a
    cape) in raw MakeHuman units. The top radius is derived from the torso at
    shoulder height and the hem from ``flare``; growing monotonically keeps the
    cloth outside the body all the way down (body-derived radii pinched between
    the thighs and let knees poke through).
    """
    ys = np.linspace(y_top, y_bottom, rows)
    ring = P[np.abs(P[:, 1] - y_top) < 0.7]
    shoulder = float(np.percentile(np.abs(ring[:, 0]), 92)) if len(ring) >= 12 else 1.5
    r_top = shoulder * radius_scale + 0.15
    r_hem = max(r_top * flare, 3.0)
    pos, uvs, idx = [], [], []
    for i, yy in enumerate(ys):
        t = i / (rows - 1)
        r = r_top + (r_hem - r_top) * smoothstep(np.clip(t / 0.55, 0.0, 1.0))
        rx = r
        rz = r * 0.94
        for j in range(cols + 1):
            a = 2 * np.pi * j / cols
            fold = 1 + 0.045 * np.sin(a * 7 + t * 4.0) * smoothstep(t * 1.4)
            x = np.sin(a) * rx * fold
            z = np.cos(a) * rz * fold + 0.10
            # hem irregularity
            yj = yy - 0.14 * (0.5 + 0.5 * np.sin(a * 5 + 1.7)) * smoothstep((t - 0.85) / 0.15)
            pos.append([x, yj, z])
            uvs.append([j / cols * 2.0, 1 - t])
    for i in range(rows - 1):
        for j in range(cols):
            a = i * (cols + 1) + j
            b = a + cols + 1
            idx.extend([a, b, a + 1, a + 1, b, b + 1])
    return np.array(pos, F), np.array(uvs, F), np.array(idx, np.int64).reshape(-1, 3)


def veil(center=(0.0, 7.35, 0.2), rx=0.98, ry=1.15, rz=1.05, rows=14, cols=22, drop=0.0):
    """Head covering: an open cloth shell over the skull, falling to the chest."""
    pos, uvs, idx = [], [], []
    for i in range(rows + 1):
        phi = np.linspace(0.05, 1.55, rows + 1)[i]
        for j in range(cols + 1):
            th = 2 * np.pi * j / cols
            x = np.cos(th) * np.sin(phi) * rx
            y = np.cos(phi) * ry
            z = np.sin(th) * np.sin(phi) * rz
            # pull the front open so the face shows
            if z > 0.15:
                z *= 0.55
                y -= 0.12
            y -= drop * smoothstep((np.sin(phi)) ** 2)
            pos.append([center[0] + x, center[1] + y, center[2] + z])
            uvs.append([j / cols * 2, i / rows * 1.6])
    for i in range(rows):
        for j in range(cols):
            a = i * (cols + 1) + j
            b = a + cols + 1
            idx.extend([a, b, a + 1, a + 1, b, b + 1])
    return np.array(pos, F), np.array(uvs, F), np.array(idx, np.int64).reshape(-1, 3)


SPECS = {
    "entity.pale-standing": {
        "title": "Sosok pucat — berdiri",
        "category": "entity",
        "tags": ["ghost", "humanoid", "standing", "pale"],
        "height": 1.78,
        "shape": dict(shoulder=-0.35, chest=-0.35, limb=-0.55, jaw_w=-0.15, neck=0.25, cheek=-0.35, hollow=0.9, jowl=0.4),
        "entity": dict(limb_len=0.10, neck_len=0.35, head_scale=0.97, hollow=0.35, narrow=0.45, taper=0.55),
        "skin": dict(tone="#9aa098", red="#7c7f7a", lip="#6d6663", age=0.6, sex="male", stubble=0.0, pale=0.72, seed=71),
        "hair": dict(style="receding", color="#201c1a", thickness=0.022, long=0.0),
        "garments": [],
        "shroud": dict(y_top=5.5, y_bottom=-0.55, radius_scale=1.26, flare=1.55),
        "iris": "#1b1614",
    },
    "entity.tall-limbs": {
        "title": "Sosok tinggi berlengan panjang",
        "category": "entity",
        "tags": ["ghost", "humanoid", "tall", "long-limb"],
        "height": 2.28,
        "shape": dict(shoulder=-0.5, chest=-0.4, limb=-0.7, jaw_w=-0.1, neck=0.45, cheek=-0.5, hollow=1.0),
        "entity": dict(limb_len=0.55, torso_len=0.35, neck_len=0.9, head_scale=0.86, hollow=0.55, narrow=0.55, taper=0.6),
        "skin": dict(tone="#8e9188", red="#6f7370", lip="#635c59", age=0.7, sex="male", stubble=0.0, pale=0.8, seed=83),
        "hair": dict(style="bald", color="#1a1716", thickness=0.02, long=0.0),
        "garments": [],
        "shroud": dict(y_top=5.9, y_bottom=-1.6, radius_scale=1.24, flare=1.55),
        "iris": "#161210",
    },
    "entity.veiled-seated": {
        "title": "Sosok berkerudung — duduk",
        "category": "entity",
        "tags": ["ghost", "humanoid", "seated", "veiled", "female"],
        "height": 1.62,
        "shape": dict(shoulder=-0.6, chest=-0.2, waist=0.4, hip=0.5, limb=-0.5, jaw_w=-0.5, lip_full=0.2),
        "entity": dict(limb_len=0.05, head_scale=0.94, hollow=0.5, narrow=0.5, taper=0.5),
        "skin": dict(tone="#a2a49c", red="#7f7b76", lip="#6b625f", age=0.65, sex="female", stubble=0.0, pale=0.75, seed=97),
        "hair": dict(style="bald", color="#141110", thickness=0.02, long=0.0),
        "garments": [],
        "shroud": dict(y_top=5.5, y_bottom=-0.9, radius_scale=1.22, flare=1.5),
        "veil": dict(drop=3.2, rx=1.52, ry=1.52, rz=1.46),
        "iris": "#201a18",
        "pose": "sit",
    },
    "entity.child": {
        "title": "Sosok anak",
        "category": "entity",
        "tags": ["ghost", "child", "humanoid"],
        "height": 1.22,
        "shape": dict(shoulder=-0.7, chest=-0.5, limb=-0.8, jaw_w=-0.6, skull_w=0.2, cheek=0.3, lip_full=0.3),
        "entity": dict(head_scale=1.18, limb_len=-0.1, hollow=0.45, narrow=0.3),
        "skin": dict(tone="#9c9d95", red="#7a7570", lip="#6a615e", age=0.2, sex="female", stubble=0.0, pale=0.7, seed=101),
        "hair": dict(style="short", color="#1a1614", thickness=0.024, long=0.0),
        "garments": [],
        "shroud": dict(y_top=6.0, y_bottom=-1.1, radius_scale=1.26, flare=1.5),
        "iris": "#1b1715",
    },
    "entity.shadow-crouch": {
        "title": "Bayangan — jongkok",
        "category": "entity",
        "tags": ["ghost", "shadow", "crouch", "silhouette"],
        "height": 1.66,
        "shape": dict(shoulder=-0.3, chest=-0.3, limb=-0.45, hollow=0.9, jowl=0.5),
        "entity": dict(limb_len=0.2, neck_len=0.2, head_scale=0.95, hollow=0.6, narrow=0.4, taper=0.5),
        "skin": dict(tone="#3b3f3e", red="#33322f", lip="#2c2825", age=0.6, sex="male", stubble=0.0, pale=0.0, seed=113,
                     shadow=True),
        "hair": dict(style="bald", color="#0e0c0b", thickness=0.02, long=0.0),
        "garments": [],
        "shroud": dict(y_top=5.4, y_bottom=-0.8, radius_scale=1.26, flare=1.5),
        "iris": "#0c0a09",
        "pose": "crouch",
    },
}
