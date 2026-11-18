"""School cast sculpted in metres on the existing studio-humanoid-v1 armature.

The pattern is drafted for a 1.50 m student and scaled together with the rig.
Rings carry bone blends, so the cloth has its own silhouette in every pose.
"""

from __future__ import annotations

import math
from collections import defaultdict

import numpy as np
from PIL import Image, ImageDraw

from . import human
from .glb import Material
from .kit import compute_normals_welded

F = np.float32


def material(name, color, base=None):
    maps = human.flat_fabric(color, size=128)
    return Material(
        name=name,
        base=maps["base"] if base is None else base,
        normal=maps["normal"],
        orm=maps["orm"],
        double_sided=True,
    )


class Pattern:
    def __init__(self, bones, scale):
        self.joints = {b["name"]: i for i, b in enumerate(bones)}
        self.scale = scale
        self.panels = defaultdict(list)

    def add(self, mat, pos, uv, faces, bind):
        pos = np.asarray(pos, F)
        faces = np.asarray(faces, np.int32)
        if isinstance(bind, str):
            bind = [{bind: 1.0}] * len(pos)
        joints = np.zeros((len(pos), 4), np.uint16)
        weights = np.zeros((len(pos), 4), F)
        for i, influences in enumerate(bind):
            for k, (name, weight) in enumerate(influences.items()):
                joints[i, k] = self.joints[name] if weight > 0 else 0
                weights[i, k] = weight
        self.panels[mat].append((pos * self.scale, np.asarray(uv, F), faces, joints, weights))

    def rings(self, mat, rows, bind, sides=32):
        """Each row is a function of angle. Order bottom to top, seam at the back."""
        pos, uv, faces, bindings = [], [], [], []
        for r, row in enumerate(rows):
            for j in range(sides + 1):
                point = row(2 * math.pi * (j / sides - 0.5))
                pos.append(point)
                uv.append((j / sides, 1 - r / (len(rows) - 1)))
                bindings.append(bind(point, r) if callable(bind) else {bind: 1.0})
            if r:
                for j in range(sides):
                    i = (r - 1) * (sides + 1) + j
                    faces.extend([(i, i + 1, i + sides + 1), (i + 1, i + sides + 2, i + sides + 1)])
        self.add(mat, pos, uv, faces, bindings)

    def loft(self, mat, profile, bind, sides=32):
        self.rings(mat, [ellipse_ring(*row) for row in profile], bind, sides)

    def oval(self, mat, center, radii, bone):
        x, y, z = center
        w, h, d = radii
        self.loft(
            mat,
            [
                (x, y + h * math.sin(a), z, w * math.cos(a), d * math.cos(a))
                for a in np.linspace(-1.566, 1.566, 13)
            ],
            bone,
            24,
        )

    def finish(self, materials):
        parts = []
        for name, panels in self.panels.items():
            # Each solid-colour panel gets its own UV island. Eye and mouth
            # drawings each occupy a single dedicated material.
            grid = math.ceil(math.sqrt(len(panels)))
            pos, uv, faces, joints, weights = [], [], [], [], []
            offset = 0
            for i, (p, tex, tri, j, w) in enumerate(panels):
                pos.append(p)
                uv.append(tex if grid == 1 else (tex * 0.94 + [0.03 + i % grid, 0.03 + i // grid]) / grid)
                faces.append(tri + offset)
                offset += len(p)
                joints.append(j)
                weights.append(w)
            p, f = np.vstack(pos), np.vstack(faces)
            parts.append(
                dict(
                    pos=p,
                    idx=f,
                    normals=compute_normals_welded(p, f),
                    uv=np.vstack(uv),
                    joints=np.vstack(joints),
                    weights=np.vstack(weights),
                    mat=materials[name],
                )
            )
        return parts


def ellipse_ring(cx, y, cz, rx, rz):
    return lambda a: (cx + rx * math.sin(a), y, cz + rz * math.cos(a))


def surface(profile, x, y):
    rows = np.asarray(profile)
    cx, cz, rx, rz = [np.interp(y, rows[:, 1], rows[:, i]) for i in (0, 2, 3, 4)]
    return cz + rz * np.sqrt(max(0, 1 - ((x - cx) / rx) ** 2))


def front_panel(model, mat, outline, profile, bind, lift=0.003):
    """Drape a small cutout on the curved surface, including its interior."""
    xy = np.asarray(outline, F)
    # Slice along the long axis. Include polygon corners and extra stations so
    # the tie and eyebrows follow the skin even between their end points.
    axis = int(np.argmax(np.ptp(xy, axis=0)))
    across = 1 - axis
    stops = np.unique(np.round(np.r_[xy[:, axis], np.linspace(xy[:, axis].min(), xy[:, axis].max(), 13)], 6))
    pos, coords, faces, rows = [], [], [], []
    for t in stops:
        hits = []
        for a, b in zip(xy, np.roll(xy, -1, axis=0)):
            delta = b[axis] - a[axis]
            if abs(delta) > 1e-8 and min(a[axis], b[axis]) - 1e-6 <= t <= max(a[axis], b[axis]) + 1e-6:
                hits.append(a[across] + (t - a[axis]) / delta * (b[across] - a[across]))
        if not hits:
            continue
        lo, hi = min(hits), max(hits)
        widths = [(lo + hi) / 2] if hi - lo < 1e-5 else np.linspace(lo, hi, 5)
        row = []
        for v in widths:
            x, y = (v, t) if axis == 1 else (t, v)
            row.append(len(pos))
            pos.append((x, y, surface(profile, x, y) + lift))
            coords.append((x, y))
        if rows:
            prev = rows[-1]
            for i in range(4):
                a, b = prev[min(i, len(prev) - 1)], prev[min(i + 1, len(prev) - 1)]
                c, d = row[min(i, len(row) - 1)], row[min(i + 1, len(row) - 1)]
                if a != b:
                    faces.append((a, b, c))
                if c != d:
                    faces.append((b, d, c))
        rows.append(row)
    if axis == 0:
        faces = [(a, c, b) for a, b, c in faces]
    uv = (np.asarray(coords) - xy.min(0)) / np.maximum(np.ptp(xy, axis=0), 0.001)
    uv[:, 1] = 1 - uv[:, 1]
    bindings = [bind(pt, 0) for pt in pos] if callable(bind) else bind
    model.add(mat, pos, uv, faces, bindings)


def eye_paint():
    # Ink only the upper lash. A warm iris and two glints stay readable at 540p.
    im = Image.new("RGB", (384, 192), "#fff7e9")
    d = ImageDraw.Draw(im)
    d.ellipse((82, -12, 297, 199), fill="#352726")
    d.ellipse((88, -6, 291, 194), fill="#a4673d")
    d.ellipse((102, 1, 276, 165), fill="#5d392c")
    d.ellipse((128, 27, 252, 148), fill="#201e22")
    d.ellipse((123, 23, 159, 58), fill="#fffaf1")
    d.ellipse((231, 128, 246, 141), fill="#f1bd83")
    return np.asarray(im, F) / 255


def eye(model, mats, face, side, boy, bones):
    sign = 1 if side == "L" else -1
    cx, cy = sign * (0.047 if boy else 0.052), 1.382
    w, h = (0.034, 0.0145) if boy else (0.0355, 0.021)
    bone = "eye." + side
    # Scaling around the centre closes the drawn eye against solid cheek geometry.
    bones[model.joints[bone]]["p"] = np.array((cx, cy, surface(face, cx, cy)), F) * model.scale
    pos, uv, faces = [], [], []
    for r in range(9):
        for j in range(25):
            u, v = j / 24, r / 8
            x = cx + (u * 2 - 1) * w
            arch = 0.015 + 0.985 * math.sin(math.pi * u) ** 0.75
            y = cy + (1 - 2 * v) * h * arch + sign * (u - 0.5) * 0.005
            z = surface(face, x, y) + 0.0028 + 0.004 * arch * math.sin(math.pi * v)
            pos.append((x, y, z))
            uv.append((u, 0.5 + (v - 0.5) * arch))
            if r and j:
                k = r * 25 + j
                faces.extend([(k - 26, k - 1, k), (k - 26, k, k - 25)])
    model.add(bone, pos, uv, faces, bone)
    mats[bone] = material(bone, "#ffead8", eye_paint())
    top = np.array(pos[:25])
    lash = np.vstack([top + [0, 0, 0.001], top + [0, 0.0028, 0.001]])
    model.add(
        "ink",
        lash,
        [(j / 24, r) for r in (0, 1) for j in range(25)],
        [(j, j + 1, j + 25) for j in range(24)] + [(j + 1, j + 26, j + 25) for j in range(24)],
        bone,
    )
    eyebrow = [
        (sign * x, y + (0.003 + 0.003 * sign if boy else 0))
        for x, y in [
            (0.014, 1.415),
            (0.036, 1.429),
            (0.061, 1.430),
            (0.083, 1.419),
            (0.059, 1.419 if boy else 1.424),
            (0.038, 1.419 if boy else 1.423),
        ]
    ]
    brow_bone = "oculi01." + side
    bones[model.joints[brow_bone]]["p"] = np.array((cx, 1.423, surface(face, cx, 1.423)), F) * model.scale
    front_panel(model, "hair", eyebrow, face, brow_bone, 0.0035)


def portrait(model, mats, bones, boy):
    width = 1.04 if boy else 1
    face = [
        (0, y, z, w * width, d)
        for y, z, w, d in [
            (1.246, 0.062, 0.009, 0.014),
            (1.253, 0.059, 0.055 if boy else 0.044, 0.052),
            (1.276, 0.049, 0.087 if boy else 0.073, 0.083),
            (1.310, 0.039, 0.101, 0.108),
            (1.353, 0.033, 0.117, 0.116),
            (1.394, 0.032, 0.120, 0.118),
            (1.433, 0.025, 0.118, 0.116),
            (1.476, 0.019, 0.103, 0.100),
            (1.505, 0.018, 0.069, 0.069),
            (1.521, 0.018, 0.004, 0.005),
        ]
    ]
    model.loft("skin", face, "head", 48)
    model.loft(
        "skin",
        [(0, 1.175, 0.023, 0.047, 0.042), (0, 1.225, 0.025, 0.045, 0.042), (0, 1.29, 0.035, 0.041, 0.045)],
        "neck02",
    )
    for side, s in (("L", 1), ("R", -1)):
        model.oval("skin", (s * 0.115, 1.353, 0.029), (0.025, 0.039, 0.019), "head")
        model.oval("warm", (s * 0.13, 1.355, 0.040), (0.011, 0.022, 0.009), "head")
        eye(model, mats, face, side, boy, bones)
    model.loft(
        "skin",
        [
            (0, 1.329, 0.147, 0.006, 0.003),
            (0, 1.332, 0.150, 0.014, 0.009),
            (0, 1.337, 0.152, 0.018, 0.013),
            (0, 1.344, 0.151, 0.016, 0.013),
            (0, 1.353, 0.146, 0.011, 0.008),
            (0, 1.369, 0.143, 0.006, 0.003),
        ],
        "head",
    )
    mouth_y = 1.303
    mouth_bone = "oris05"
    bones[model.joints[mouth_bone]]["p"] = np.array([0, mouth_y, surface(face, 0, mouth_y)], F) * model.scale
    # Rounded open lip shape with lightly upturned corners. The scale channel
    # compresses the opening vertically to a smile between utterances.
    pos, uv, faces = [], [], []
    for row in range(5):
        for j in range(25):
            u, v = j / 24, row / 4
            x = (2 * u - 1) * (0.037 if boy else 0.029)
            arch = 0.015 + 0.985 * math.sin(math.pi * u)
            y = mouth_y + 0.004 * (2 * u - 1) ** 2 + arch * (0.006 - (0.018 if boy else 0.023) * v)
            pos.append((x, y, surface(face, x, y) + 0.003))
            uv.append((u, v))
            if row and j:
                k = row * 25 + j
                faces.extend([(k - 26, k - 1, k), (k - 26, k, k - 25)])
    im = Image.new("RGB", (192, 96), "#623737")
    d = ImageDraw.Draw(im)
    d.ellipse((22, -26, 169, 17), fill="#f6debd")
    d.ellipse((26, 72, 163, 120), fill="#ba7070")
    mats["mouth"] = material("mulut", "#623737", np.asarray(im, F) / 255)
    model.add("mouth", pos, uv, faces, mouth_bone)

    # The hairline changes with azimuth: clear the brows in front and cover the nape.
    def cap_row(t):
        def point(a):
            front = (1 + math.cos(a)) / 2
            hem = 1.313 + 0.137 * front**2 + 0.010 * math.sin(2 * a + 0.4) * front
            y = hem + (1.543 - hem) * t
            r = math.sqrt(max(0.002, 1 - ((y - 1.406) / 0.138) ** 2))
            return (0.128 * width * r * math.sin(a), y, 0.020 + 0.131 * r * math.cos(a))

        return point

    model.rings("hair", [cap_row(t) for t in np.linspace(0, 1, 20)], "head", 48)
    # Overlapping tapered locks, swept across the forehead rather than a straight rim.
    for count, (root_x, tip_x, tip_y, half) in enumerate(
        [
            (-0.041, -0.103, 1.389, 0.027),
            (0.014, -0.081, 1.414, 0.039),
            (0.059, -0.031, 1.435, 0.042),
            (0.087, 0.033, 1.444, 0.031),
            (0.098, 0.107, 1.398, 0.025),
        ]
        if boy
        else [
            (-0.040, -0.104, 1.361, 0.024),
            (0.016, -0.088, 1.408, 0.034),
            (0.055, -0.047, 1.436, 0.039),
            (0.075, 0.017, 1.451, 0.031),
            (0.087, 0.106, 1.380, 0.024),
        ]
    ):
        rows = []
        for t in np.linspace(0, 1, 13):
            x = tip_x + (root_x - tip_x) * t
            y = tip_y + (1.508 - tip_y) * t
            if boy:
                x = -x
                y += 0.013 * (1-t)  # short fringe opens over Bayu's left eyebrow
            r = math.sqrt(max(0.01, 1 - ((y - 1.406) / 0.138) ** 2))
            z = 0.020 + 0.131 * r * math.sqrt(max(0.03, 1 - (x / (0.128 * width * r)) ** 2))
            w = half * (0.04 + 0.96 * math.sin(math.pi * t * 0.92) ** 0.8)
            rows.append((x, y, z - 0.002, w, 0.004 + w * 0.27))
        model.loft("hair" if count % 2 == 0 else "fringe", rows, "head", 24)
    if not boy:
        model.loft(
            "hair",
            [
                (0.098, 1.160, -0.106, 0.002, 0.003),
                (0.112, 1.191, -0.134, 0.028, 0.026),
                (0.118, 1.248, -0.161, 0.039, 0.037),
                (0.113, 1.331, -0.179, 0.047, 0.048),
                (0.088, 1.401, -0.159, 0.051, 0.047),
                (0.049, 1.443, -0.114, 0.032, 0.034),
                (0.037, 1.455, -0.090, 0.004, 0.004),
            ],
            "head",
        )
        model.oval("ribbon", (0.046, 1.441, -0.110), (0.036, 0.025, 0.038), "head")


def torso_bind(p, _):
    t = np.clip((p[1] - 0.90) / 0.20, 0, 1)
    return {"spine02": 1 - t, "spine01": t}


def shirt_with_sleeves(model, profile):
    """Join each sleeve directly to an armhole, with identical seam weights."""
    sides = 32
    rings = np.array(
        [[ellipse_ring(*r)(2 * math.pi * (j / sides - 0.5)) for j in range(sides + 1)] for r in profile]
    )
    low, high = 4, 7
    faces = []
    for r in range(len(rings) - 1):
        for j in range(sides):
            if low <= r < high and (3 <= j < 13 or 19 <= j < 29):
                continue
            a = r * (sides + 1) + j
            faces.extend([(a, a + 1, a + sides + 1), (a + 1, a + sides + 2, a + sides + 1)])
    used, local = np.unique(faces, return_inverse=True)
    body = rings.reshape(-1, 3)[used]
    uv = [(i % (sides + 1) / sides, 1 - (i // (sides + 1)) / (len(rings) - 1)) for i in used]
    model.add("shirt", body, uv, local.reshape(-1, 3), [torso_bind(pt, 0) for pt in body])

    for side, sign, left in (("L", 1, 19), ("R", -1, 3)):
        right = left + 10
        border = (
            [(low, j) for j in range(left, right)]
            + [(r, right) for r in range(low, high)]
            + [(high, j) for j in range(right, left, -1)]
            + [(r, left) for r in range(high, low, -1)]
        )
        rim = np.asarray([rings[r, j] for r, j in border + [border[0]]])
        yz = (rim[:, 1:] - [1.123, 0.024]) / [0.075, 0.080]
        yz /= np.linalg.norm(yz, axis=1)[:, None]
        up, depth = yz.T
        cuff = np.column_stack(
            (sign * (0.222 + 0.047 * 0.78 * up), 1.072 + 0.047 * 0.62 * up, 0.013 + 0.053 * depth)
        )
        pos, uv, faces, bind = [], [], [], []
        n = len(rim)
        for k, t in enumerate((0, 0.24, 0.52, 0.80, 0.95, 1)):
            band = (1 - t) * rim + t * cuff
            bulge = 0.021 * math.sin(math.pi * t)
            band[:, 0] += sign * bulge
            band[:, 1] += bulge * 0.55
            band[:, 2] += bulge * depth * 0.42
            w = t * t * (3 - 2 * t)
            for j, pt in enumerate(band):
                pos.append(pt)
                uv.append((j / (n - 1), t))
                influences = {bone: v * (1 - w) for bone, v in torso_bind(rim[j], 0).items()}
                influences["upperarm01." + side] = w
                bind.append(influences)
                if k and j:
                    a = (k - 1) * n + j - 1
                    faces.extend([(a, a + 1, a + n), (a + 1, a + n + 1, a + n)])
        model.add("shirt", pos, uv, faces, bind)


def uniform(model, boy):
    shoulder = 0.172 if boy else 0.157
    shirt = [
        (0, y, z, w, d)
        for y, z, w, d in [
            (0.800, 0.024, 0.130, 0.080),
            (0.817, 0.024, 0.146, 0.090),
            (0.866, 0.025, 0.150, 0.091),
            (0.951, 0.025, 0.145, 0.092),
            (1.048, 0.025, 0.150, 0.095),
            (1.137, 0.024, shoulder, 0.092),
            (1.17, 0.022, shoulder, 0.076),
            (1.198, 0.021, 0.123, 0.061),
            (1.216, 0.024, 0.058, 0.047),
            (1.214, 0.024, 0.043, 0.039),
        ]
    ]
    shirt_with_sleeves(model, shirt)
    for side, s in (("L", 1), ("R", -1)):
        front_panel(
            model,
            "collar",
            [(s * 0.007, 1.180), (s * 0.049, 1.212), (s * 0.073, 1.186), (s * 0.048, 1.144)],
            shirt,
            torso_bind,
            0.006,
        )
        # Generous trouser leg, tapered gently at the ankle and blended across the knee.
        leg = [
            (s * x, y, z, w, d)
            for x, y, z, w, d in [
                (0.187, 0.085, 0.003, 0.047, 0.052),
                (0.186, 0.101, 0.002, 0.052, 0.054),
                (0.168, 0.242, 0.014, 0.058, 0.061),
                (0.139, 0.391, 0.031, 0.066, 0.065),
                (0.124, 0.477, 0.025, 0.070, 0.070),
                (0.102, 0.644, 0.023, 0.079, 0.081),
                (0.078, 0.739, 0.020, 0.081, 0.086),
                (0.073, 0.804, 0.021, 0.078, 0.083),
                (0.071, 0.829, 0.021, 0.065, 0.075),
            ]
        ]

        def leg_bind(p, r):
            knee = np.clip((p[1] - 0.32) / 0.14, 0, 1)
            hip = np.clip((p[1] - 0.68) / 0.13, 0, 1)
            return {
                "lowerleg01." + side: 1 - knee,
                "upperleg01." + side: knee * (1 - hip),
                "spine05": knee * hip,
            }

        model.loft("pants", leg, leg_bind)
        shoe = [
            (s * 0.189, y, z, w, d)
            for y, z, w, d in [
                (0.006, 0.057, 0.002, 0.004),
                (0.008, 0.057, 0.052, 0.099),
                (0.016, 0.062, 0.057, 0.107),
                (0.030, 0.059, 0.056, 0.105),
                (0.052, 0.051, 0.055, 0.097),
                (0.071, 0.023, 0.048, 0.071),
                (0.104, 0.003, 0.040, 0.047),
            ]
        ]
        model.loft("sole", shoe[:4], "foot." + side)
        model.loft("shoe", shoe[3:], "foot." + side)
    front_panel(
        model,
        "tie",
        [(0, 1.105), (0.013, 1.158), (0.020, 1.177), (-0.020, 1.177), (-0.013, 1.158)],
        shirt,
        torso_bind,
        0.008,
    )
    front_panel(
        model,
        "tie",
        [(0, 0.967), (0.024, 0.994), (0.012, 1.153), (-0.012, 1.153), (-0.024, 0.994)],
        shirt,
        torso_bind,
        0.006,
    )
    front_panel(
        model,
        "collar",
        [(0.057, 1.091), (0.083, 1.080), (0.105, 1.092), (0.105, 1.137), (0.057, 1.137)],
        shirt,
        torso_bind,
        0.002,
    )
    for mat, lo, hi in (("ribbon", 1.145, 1.156), ("white", 1.134, 1.145)):
        front_panel(model, mat, [(0.060, lo), (0.102, lo), (0.102, hi), (0.060, hi)], shirt, torso_bind, 0.006)


def build(spec, bones):
    boy = spec["skin"]["sex"] == "male"
    scale = spec["height"] / 1.5
    model = Pattern(bones, scale)
    colors = {
        "skin": "#c89164" if boy else "#d8a47b",
        "warm": "#bd805e",
        "shirt": "#e9e3d8",
        "collar": "#dbd9cb",
        "pants": "#596778",
        "tie": "#435369",
        "shoe": "#39343a",
        "sole": "#c0b59f",
        "hair": "#382c2a" if boy else "#302627",
        "fringe": "#493633",
        "white": "#e7e4d8",
        "ink": "#352b2a",
        "ribbon": "#ad4442",
    }
    mats = {name: material(name, color) for name, color in colors.items()}
    mats["collar"].name = "cloth-kerah"
    mats["tie"].name = "cloth-dasi"
    portrait(model, mats, bones, boy)
    uniform(model, boy)
    parts = model.finish(mats)

    # Keep the articulated MakeHuman hands and forearms; the cut sits inside the sleeves.
    body = human.base()
    p = human.apply_proportions(human.shape(body["pos"], spec["shape"]), human.PROFILES["remaja"])
    p = human.to_metres(p, spec["height"])
    triangles = body["idx"]
    along_arm = 0.62 * (np.abs(p[:, 0]) - 0.146 * scale) - 0.78 * (p[:, 1] - 1.181 * scale)
    selected = (np.abs(p[:, 0]) > 0.17 * scale) & (p[:, 1] > 0.77 * scale) & (along_arm > 0.105 * scale)
    tri = triangles[selected[triangles].all(axis=1)]
    used, idx = np.unique(tri, return_inverse=True)
    weights = body["skinWeight"][used].copy()
    weights /= weights.sum(axis=1, keepdims=True)
    joints = np.where(weights > 0, body["skinIndex"][used], 0)
    parts.append(
        dict(
            pos=p[used].astype(F),
            uv=body["uv"][used],
            idx=idx.reshape(-1, 3),
            normals=compute_normals_welded(p, triangles)[used],
            joints=joints,
            weights=weights,
            mat=mats["skin"],
        )
    )
    return parts


def phrase(t, start, peak, release, end):
    """Rise, briefly sustain, then settle. Each articulation has its own timing."""
    if t <= start or t >= end:
        return 0.0
    u = (t - start) / (peak - start) if t < peak else min(1.0, (end - t) / (end - release))
    return u * u * (3 - 2 * u)


def acting(t, boy, talking):
    breath = math.sin(2 * math.pi * t)
    # The body initiates a turn, the elbow carries the gesture, the hand settles last.
    shift = phrase(t, 0.02, 0.26, 0.57, 0.96)
    gesture = phrase(t, 0.13, 0.37, 0.49, 0.82)
    hand = phrase(t, 0.20, 0.42, 0.55, 0.90)
    nod = phrase(t, 0.03, 0.12, 0.15, 0.28) - 0.40 * phrase(t, 0.18, 0.29, 0.33, 0.44)
    accent = phrase(t, 0.51, 0.66, 0.69, 0.85)
    p = human.base_pose(arm_drop=0.47, finger_curl=0)
    active, quiet = "R", "L"
    human.add(p, "spine04", rz=-(0.026 + 0.054 * shift))
    human.add(p, "spine02", rx=0.014 * breath + 0.052 * shift, ry=-(0.045 + 0.12 * gesture))
    human.add(p, "spine01", ry=-(0.05 + 0.08 * shift), rz=0.034 * shift)
    human.add(
        p,
        "head",
        rx=0.12 * nod + 0.072 * accent,
        ry=(1 if boy else -1) * (0.08 - 0.28 * gesture + 0.13 * accent),
        rz=-(0.055 + 0.095 * shift - 0.08 * accent),
    )
    human.add(p, "neck01", rx=-0.028 * breath + 0.048 * nod, ry=-0.065 * shift)
    human.add(p, "upperarm01." + quiet, rx=0.15 + 0.07 * shift, rz=-0.045 * breath)
    human.add(p, "lowerarm01." + quiet, rx=0.22 - 0.06 * accent)
    if talking:
        # Bayu opens his palm toward the door. Nisa acknowledges, then turns
        # her right hand outward on the second part of her reply.
        lift = gesture if boy else 0.23 * nod + accent
        finish = hand if boy else phrase(t, 0.54, 0.72, 0.75, 0.94)
        human.add(p, "clavicle." + active, rz=-(0.035 + 0.115 * lift))
        human.add(p, "upperarm01." + active, rx=-0.07 - 0.46 * lift, rz=-(0.08 + 0.33 * lift))
        human.add(p, "lowerarm01." + active, rx=-0.08 - 0.68 * lift, ry=-0.28 * finish, rz=0.24 * lift)
        human.add(p, "wrist." + active, rx=0.18 * finish, ry=-0.38 * finish, rz=-0.20 * finish)
    else:
        finish = 0.2 * shift
        human.add(p, "upperarm01." + active, rx=0.06 - 0.13 * shift, rz=-0.06 * breath)
        human.add(p, "lowerarm01." + active, rx=-0.02 - 0.21 * shift, rz=0.12 * shift)
    for side in ("L", "R"):
        openness = finish if side == active else 0
        for finger in range(2, 6):
            for joint in range(1, 4):
                p[f"finger{finger}-{joint}.{side}"] = [(0.085 + 0.025 * finger) * (1 - 0.8 * openness), 0, 0]
    balance = (0.030 if boy else -0.025) * shift
    for side in ("L", "R"):
        human.add(p, "upperleg01." + side, rz=-balance / 0.69)
        human.add(p, "foot." + side, rz=balance / 0.69)
        human.add(p, "oculi01." + side, rz=(1 if side == "L" else -1) * (0.11 * nod + 0.16 * accent))
    return p, (balance, 0.002 * breath, 0)


def expression(t, boy, talking):
    blinks = (0.24, 0.83) if boy else ((0.16, 0.90) if talking else (0.32, 0.78))
    blink = max(phrase(t, c - 0.032, c, c + 0.009, c + 0.062) for c in blinks)
    opening = 0.0
    if talking:
        # Stress groups leave a visible pause after the address or the short answer.
        syllables = (
            (
                (0.075, 0.7),
                (0.23, 0.8),
                (0.32, 0.6),
                (0.42, 0.75),
                (0.51, 0.9),
                (0.61, 0.5),
                (0.70, 0.85),
                (0.81, 0.65),
                (0.89, 0.45),
            )
            if boy
            else (
                (0.065, 0.7),
                (0.14, 0.9),
                (0.33, 0.7),
                (0.42, 0.85),
                (0.52, 0.6),
                (0.60, 0.75),
                (0.68, 0.8),
                (0.77, 1.0),
                (0.89, 0.67),
            )
        )
        opening = max(a * phrase(t, c - 0.052, c, c + 0.009, c + 0.061) for c, a in syllables)
    return {
        "eye.L": (1, 1 - 0.95 * blink, 1),
        "eye.R": (1, 1 - 0.95 * blink, 1),
        "oris05": (1 - 0.16 * opening, 0.19 + 0.91 * opening, 1),
    }


def direct(clips, boy):
    for name, clip in clips.items():
        talking = name == "talk"
        clip["scales"] = lambda t, speak=talking: expression(t, boy, speak)
        if name in ("idle", "talk"):
            clip["frames"] = 90 if boy or not talking else 75
            clip["fn"] = lambda t, speak=talking: acting(t, boy, speak)
