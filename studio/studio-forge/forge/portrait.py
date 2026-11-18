"""Cast-specific head proportions. Coordinates are in half eye-spacings from eye level.

Apply the same smooth map to the skin, sockets, hair, accessories and rest joints;
UV landmarks and articulation then travel with the face.
"""

from typing import NamedTuple

import numpy as np

from . import student
from .kit import compute_normals_welded

F = np.float32


class Face(NamedTuple):
    temple: float
    cheek: float
    jaw: float
    lower_length: float
    nose: float  # projection in half eye-spacings
    mouth_width: float
    eye_tilt: float  # height difference at the outer corners
    detail: str = ""


FACES = {
    "char.male-dewasa-polo": Face(0.98, 1.09, 1.27, 1.07, 0.25, 1.08, -0.04),
    "char.female-dewasa": Face(1.04, 1.10, 0.97, 0.94, -0.16, 0.94, 0.12, "bob"),
    "char.male-muda-jaket": Face(1.02, 0.96, 0.83, 1.12, 0.37, 1.10, 0.12, "quiff"),
    "char.male-pekerja": Face(1.01, 1.12, 1.23, 0.92, -0.23, 1.24, -0.13, "moustache"),
    "char.male-lansia-kemeja": Face(0.94, 0.88, 1.07, 1.21, 0.53, 0.84, -0.16, "glasses"),
    "char.female-lansia": Face(1.06, 1.11, 0.98, 0.92, 0.12, 1.16, -0.05, "bun"),
    "char.remaja-laki": Face(0.94, 0.97, 1.20, 1.09, 0.16, 1.14, -0.09),
    "char.remaja-perempuan": Face(1.06, 1.09, 0.87, 0.92, -0.08, 0.91, 0.10),
    "char.anak-besar-laki": Face(0.95, 0.90, 0.99, 1.05, 0.11, 1.19, 0.09, "part"),
    "char.anak-besar-perempuan": Face(0.98, 1.10, 0.79, 0.98, 0.18, 0.89, 0.15, "twin"),
    "char.anak-laki": Face(1.07, 1.13, 1.09, 0.86, -0.31, 1.12, -0.12, "freckles"),
    "char.anak-perempuan": Face(1.12, 0.99, 0.87, 0.86, -0.07, 0.87, 0.16, "bob"),
    "char.balita-laki": Face(1.11, 1.14, 1.09, 0.80, -0.41, 1.04, -0.10, "curl"),
    "char.balita-perempuan": Face(1.08, 1.07, 0.96, 0.81, -0.30, 0.86, 0.11, "puffs"),
    "entity.pale-standing": Face(1.01, 0.81, 0.77, 1.30, 0.28, 0.83, -0.16),
    "entity.tall-limbs": Face(0.78, 0.77, 0.65, 1.39, 0.53, 0.70, 0.21),
    "entity.veiled-seated": Face(1.02, 1.19, 0.85, 0.88, -0.19, 0.84, -0.19),
    "entity.child": Face(1.12, 1.12, 0.86, 0.84, -0.36, 0.81, 0.10, "fringe"),
    "entity.shadow-crouch": Face(0.87, 1.08, 1.46, 0.72, -0.43, 1.51, -0.20),
}


def reshape(points, face):
    x, y, z = points.T
    # Continuity at the throat keeps the chin joined to the neck during dialogue.
    blend = np.clip((y + 4.65) / 1.35, 0, 1)
    blend *= np.clip((5.1 - abs(x)) / 1.8, 0, 1)
    blend = blend * blend * (3 - 2 * blend)
    # Broad transitions follow the mandible without a sharp ridge at the cheekbone.
    jaw = (1 - np.tanh((y + 1.85) / 0.83)) * 0.5
    upper = (1 + np.tanh((y + 0.12) / 0.86)) * 0.5
    width = face.cheek + (face.jaw - face.cheek) * jaw + (face.temple - face.cheek) * upper
    nose = np.exp(-((x / 0.53) ** 2 + ((y + 0.96) / 0.60) ** 2)) * np.clip(z + 0.1, 0, 1)
    lips = np.exp(-((x / 1.12) ** 2 + ((y + 2.05) / 0.46) ** 2)) * np.clip(z + 0.2, 0, 1)
    eye = np.exp(-((y / 0.55) ** 2 + ((abs(x) - 1) / 0.82) ** 2)) * np.clip(z + 1, 0, 1)
    offset = np.column_stack(
        (
            x * (width - 1) + x * (face.mouth_width - 1) * lips,
            np.minimum(y, 0) * (face.lower_length - 1) + (abs(x) - 1) * face.eye_tilt * eye,
            face.nose * nose
            + 0.48 * (face.cheek - 1) * np.exp(-((abs(x) - 1.34) ** 2 + ((y + 0.8) / 0.9) ** 2)),
        )
    )
    return (points + blend[:, None] * offset).astype(F)


def hair_and_features(detail, parts, bones, center, unit, spec):
    """Model a few readable silhouette or surface details in the original head space."""
    if not detail:
        return []
    model = student.Pattern(bones, 1)
    hair = spec.get("hair", {}).get("color", "#282021")
    # Near-black tints retain a small amount of reflected light at thumbnail size.
    tint = tuple(max(int(hair[1 + i : 3 + i], 16), low) for i, low in zip((0, 2, 4), (41, 33, 32)))
    pigment = "#%02x%02x%02x" % tint
    colors = {"locks": pigment, "frame": "#514139", "spots": "#815744"}

    def oval(mat, xyz, radii):
        model.oval(mat, xyz, radii, "head")

    if detail in ("puffs", "twin", "bun"):
        sides = [1] if detail == "bun" else [-1, 1]
        for side in sides:
            if detail == "bun":
                oval("locks", (1.05, 3.65, -4.45), (1.49, 1.41, 1.38))
            elif detail == "puffs":
                oval("locks", (side * 2.07, 2.65, -3.05), (0.91, 1.07, 0.96))
            else:
                model.loft(
                    "locks",
                    [
                        (side * x, y, z, w, d)
                        for x, y, z, w, d in [
                            (2.84, -2.35, -3.83, 0.05, 0.07),
                            (2.95, -1.68, -3.65, 0.42, 0.50),
                            (2.76, -0.60, -3.45, 0.57, 0.66),
                            (2.68, 0.61, -3.40, 0.60, 0.69),
                            (2.30, 1.58, -3.34, 0.33, 0.43),
                            (2.09, 1.86, -3.30, 0.10, 0.14),
                        ]
                    ],
                    "head",
                )
    elif detail == "bob":
        # The front opening clears the eyes; the rear hem curves under the jaw.
        def ring(t):
            def point(a):
                c = np.cos(a)
                hem = -2.25 + 4.08 * np.clip((c - 0.02) / 0.89, 0, 1) ** 1.65 + 0.17 * np.sin(a * 3)
                y = hem + (3.98 - hem) * t
                r = np.sqrt(max(0.003, 1 - (max(0, y - 0.75) / 3.25) ** 2))
                return ((2.73 - 0.19 * (1 - t) ** 3) * r * np.sin(a), y, -2.26 + 3.66 * r * c)

            return point

        model.rings("locks", [ring(t) for t in np.linspace(0, 1, 21)], "head", 48)
    elif detail in ("quiff", "fringe", "curl", "part"):
        # Wide, shallow locks overlap like shingles across the frontal scalp.
        designs = {
            "quiff": [
                (-1.95, -0.90, 1.44),
                (-1.39, -0.27, 1.87),
                (-0.71, 0.41, 2.07),
                (0.12, 0.92, 2.20),
                (0.87, 1.22, 2.23),
            ],
            "part": [
                (-1.62, -0.75, 1.75),
                (-1.08, -0.65, 2.03),
                (0.01, -0.44, 2.21),
                (0.80, -0.14, 1.95),
                (1.50, 0.45, 1.67),
            ],
            "fringe": [
                (-1.65, -1.28, 1.55),
                (-0.97, -0.65, 1.12),
                (-0.26, -0.08, 1.45),
                (0.50, 0.52, 1.10),
                (1.26, 1.00, 1.46),
            ],
            "curl": [(-0.60, 0.34, 1.75), (-0.10, 0.49, 2.03), (0.37, 0.63, 2.28)],
        }
        for tip_x, root_x, tip_y in designs[detail]:
            rows = []
            for t in np.linspace(0, 1, 15):
                x = tip_x + (root_x - tip_x) * t - 0.18 * np.sin(np.pi * t)
                y = tip_y + (3.63 - tip_y) * t
                crown = np.sqrt(max(0.02, 1 - ((y - 0.80) / 3.20) ** 2))
                z = -2.35 + 3.58 * np.sqrt(max(0.02, crown**2 - (x / 2.65) ** 2))
                width = 0.035 + 0.68 * np.sin(t * np.pi * 0.94) ** 0.80
                rows.append((x, y, z, width, 0.05 + 0.21 * width))
            model.loft("locks", rows, "head", 16)
    else:
        skin = next(p for p in parts if p["mat"].name == "skin")
        face_pos = (skin["pos"] - center) / unit
        tris = face_pos[np.asarray(skin["idx"]).reshape(-1, 3)]
        # Intersect a ray from the camera side against the actual facial triangles.
        a, b, c = tris[:, 0], tris[:, 1], tris[:, 2]
        ab, ac = b - a, c - a
        det = ab[:, 0] * ac[:, 1] - ab[:, 1] * ac[:, 0]

        def surface(x, y):
            dx, dy = x - a[:, 0], y - a[:, 1]
            good = abs(det) > 1e-8
            u = np.divide(dx * ac[:, 1] - dy * ac[:, 0], det, out=np.zeros_like(det), where=good)
            v = np.divide(ab[:, 0] * dy - ab[:, 1] * dx, det, out=np.zeros_like(det), where=good)
            hit = good & (u >= 0) & (v >= 0) & (u + v <= 1)
            return float(np.max((a[:, 2] + u * ab[:, 2] + v * ac[:, 2])[hit]))

        if detail == "freckles":
            for side in (-1, 1):
                for x, y, r in [
                    (1.13, -0.67, 0.046),
                    (1.32, -0.73, 0.053),
                    (1.51, -0.64, 0.04),
                    (1.60, -0.83, 0.035),
                ]:
                    oval("spots", (side * x, y, surface(side * x, y) + 0.016), (r, r * 0.78, 0.025))
        elif detail == "moustache":
            for side in (-1, 1):
                rows = []
                for t in np.linspace(0, 1, 13):
                    x = side * (1.09 - 0.94 * t)
                    y = -2.04 + 0.41 * t
                    r = 0.025 + 0.22 * np.sin(np.pi * t) ** 0.72
                    rows.append((x, y, surface(x, y) + 0.046, r, 0.04 + r * 0.40))
                model.loft("locks", rows, "head", 18)
        elif detail == "glasses":
            from .kit import Builder

            tubes = Builder()

            def wire(points, radius):
                tubes.add_tube("frame", np.asarray(points, F), np.full(len(points), radius, F), sides=8)

            for side in (-1, 1):
                wire(
                    [
                        (side * (1 + 0.87 * np.cos(t)), 0.56 * np.sin(t) - 0.06, 0.96 - 0.14 * np.cos(t))
                        for t in np.linspace(0, 2 * np.pi, 49)
                    ],
                    0.058,
                )
                wire(
                    [(side * 1.86, -0.04, 0.83), (side * 2.39, 0.03, 0.18), (side * 2.57, 0.09, -2.52)], 0.053
                )
            wire([(-0.17, 0.03, 0.99), (0, 0.18, 1.18), (0.17, 0.03, 0.99)], 0.057)
            # Each tube has its own UV island.
            mesh = tubes.groups["frame"]
            for p, uv, idx, (start, end) in zip(mesh.pos, mesh.uv, mesh.idx, mesh.islands):
                model.add(
                    "frame", p, uv / np.maximum(uv.max(axis=0), 1e-6), (idx - start).reshape(-1, 3), "head"
                )
    details = model.finish({k: student.material(k, v) for k, v in colors.items() if k in model.panels})
    for part in details:
        part["pos"] = center + part["pos"] * unit
    return details


def apply(identity, spec, parts, bones):
    face = FACES[identity]
    rest = {bone["name"]: bone["p"] for bone in bones}
    center = (rest["eye.L"] + rest["eye.R"]) * 0.5
    unit = abs(rest["eye.L"][0] - rest["eye.R"][0]) * 0.5
    if face.detail in ("bob", "puffs", "twin", "bun"):
        parts[:] = [part for part in parts if part["mat"].name != "hair-long"]
    parts.extend(hair_and_features(face.detail, parts, bones, center, unit, spec))

    def warp(p):
        return center + unit * reshape((p - center) / unit, face)

    for part in parts:
        p = np.asarray(part["pos"], F)
        q = warp(p)
        changed = np.max(abs(q - p), axis=1) > 1e-6
        if not changed.any():
            continue
        # Keep tailored seams and hand-authored normals elsewhere on the body.
        normals = compute_normals_welded(q, np.asarray(part["idx"]).reshape(-1, 3))
        if part.get("normals") is not None:
            normals[~changed] = part["normals"][~changed]
        part.update(pos=np.where(changed[:, None], q, p), normals=normals)
    for bone, p in zip(bones, warp(np.asarray([b["p"] for b in bones]))):
        bone["p"] = p
