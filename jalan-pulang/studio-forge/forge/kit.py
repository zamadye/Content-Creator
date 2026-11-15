"""Mesh kit: parametric geometry with metre-scale UVs, smooth normals, tangents."""
from __future__ import annotations

import numpy as np

F = np.float32


def _norm(v, axis=-1):
    n = np.linalg.norm(v, axis=axis, keepdims=True)
    return v / np.maximum(n, 1e-9)


def rot_matrix(axis, angle):
    a = np.asarray(axis, F)
    a = a / np.linalg.norm(a)
    c, s = np.cos(angle), np.sin(angle)
    x, y, z = a
    return np.array(
        [
            [c + x * x * (1 - c), x * y * (1 - c) - z * s, x * z * (1 - c) + y * s],
            [y * x * (1 - c) + z * s, c + y * y * (1 - c), y * z * (1 - c) - x * s],
            [z * x * (1 - c) - y * s, z * y * (1 - c) + x * s, c + z * z * (1 - c)],
        ],
        dtype=F,
    )


def xform_matrix(loc=(0, 0, 0), rot=(0, 0, 0), scale=(1, 1, 1)):
    """Euler XYZ rotation (radians) then scale then translate."""
    R = rot_matrix((1, 0, 0), rot[0]) @ rot_matrix((0, 1, 0), rot[1]) @ rot_matrix((0, 0, 1), rot[2])
    m = np.eye(4, dtype=F)
    m[:3, :3] = R * np.asarray(scale, F)[None, :]
    m[:3, 3] = loc
    return m


def apply_xform(pos, normal, m):
    p = (np.asarray(pos, F) @ m[:3, :3].T) + m[:3, 3]
    n = _norm(np.asarray(normal, F) @ np.linalg.inv(m[:3, :3]).T) if normal is not None else None
    return p.astype(F), (n.astype(F) if n is not None else None)


class Surface:
    """A chunk of geometry for one material."""

    __slots__ = ("pos", "uv", "nrm", "idx", "n")

    def __init__(self):
        self.pos = []
        self.uv = []
        self.nrm = []
        self.idx = []
        self.n = 0

    def count(self):
        return self.n


class Builder:
    """Accumulates geometry grouped by material name."""

    def __init__(self):
        self.groups: dict[str, Surface] = {}

    def surf(self, material: str) -> Surface:
        if material not in self.groups:
            self.groups[material] = Surface()
        return self.groups[material]

    # -------------------------------------------------------------- low level
    def add_raw(self, material, pos, idx, uv=None, normal=None, matrix=None):
        s = self.surf(material)
        base = s.count()
        pos = np.asarray(pos, F)
        if matrix is not None:
            pos, normal = apply_xform(pos, normal, matrix)
        uv = np.zeros((len(pos), 2), F) if uv is None else np.asarray(uv, F)
        if normal is None:
            normal = np.zeros((len(pos), 3), F)
        s.pos.append(pos)
        s.uv.append(uv)
        s.nrm.append(np.asarray(normal, F))
        s.idx.append(np.asarray(idx, np.int64).ravel() + base)
        s.n += len(pos)

    def add_quad(self, material, p0, p1, p2, p3, uv=((0, 0), (1, 0), (1, 1), (0, 1)), matrix=None, flip=False):
        p = np.array([p0, p1, p2, p3], F)
        n = np.cross(p[1] - p[0], p[3] - p[0])
        n = _norm(n)[None, :].repeat(4, axis=0)
        idx = [0, 1, 2, 0, 2, 3] if not flip else [0, 2, 1, 0, 3, 2]
        self.add_raw(material, p, idx, np.array(uv, F), n, matrix)

    # ---------------------------------------------------------------- shapes
    def add_box(self, material, center, size, uv_scale=1.0, matrix=None, skip_faces=()):
        cx, cy, cz = np.asarray(center, F)
        sx, sy, sz = np.asarray(size, F) / 2
        c = {
            "x-": [(-sx, -sy, -sz), (-sx, -sy, sz), (-sx, sy, sz), (-sx, sy, -sz)],
            "x+": [(sx, -sy, sz), (sx, -sy, -sz), (sx, sy, -sz), (sx, sy, sz)],
            "y-": [(-sx, -sy, -sz), (sx, -sy, -sz), (sx, -sy, sz), (-sx, -sy, sz)],
            "y+": [(-sx, sy, sz), (sx, sy, sz), (sx, sy, -sz), (-sx, sy, -sz)],
            "z-": [(sx, -sy, -sz), (-sx, -sy, -sz), (-sx, sy, -sz), (sx, sy, -sz)],
            "z+": [(-sx, -sy, sz), (sx, -sy, sz), (sx, sy, sz), (-sx, sy, sz)],
        }
        uv_axes = {"x": (2, 1), "y": (0, 2), "z": (0, 1)}
        for key, corners in c.items():
            if key in skip_faces:
                continue
            axis = key[0]
            p = np.array(corners, F) + np.array([cx, cy, cz], F)
            ui, vi = uv_axes[axis]
            uv = np.array([[cc[ui], cc[vi]] for cc in corners], F) / uv_scale
            n = np.cross(p[1] - p[0], p[3] - p[0])
            n = _norm(n)[None, :].repeat(4, axis=0)
            self.add_raw(material, p, np.array([0, 1, 2, 0, 2, 3]), uv, n, matrix)

    def add_cylinder(self, material, p0, p1, r0, r1=None, sides=16, uv_scale=1.0, caps=True, matrix=None, uv_v=None, phase=0.0):
        p0 = np.asarray(p0, F)
        p1 = np.asarray(p1, F)
        r1 = r0 if r1 is None else r1
        axis = p1 - p0
        length = np.linalg.norm(axis)
        if length < 1e-6:
            return
        d = axis / length
        up = np.array([0, 1, 0], F) if abs(d[1]) < 0.95 else np.array([1, 0, 0], F)
        a = _norm(np.cross(up, d))
        b = np.cross(d, a)
        ang = np.linspace(0, 2 * np.pi, sides + 1, dtype=F) + phase
        ring = np.cos(ang)[:, None] * a[None, :] + np.sin(ang)[:, None] * b[None, :]
        pts0 = p0[None, :] + ring * r0
        pts1 = p1[None, :] + ring * r1
        m = np.vstack([pts0, pts1])
        nrm = np.vstack([ring, ring])
        u = (ang / (2 * np.pi)) * (2 * np.pi * ((r0 + r1) / 2)) / uv_scale
        v = (uv_v if uv_v is not None else length / uv_scale)
        uv = np.vstack([np.stack([u, np.zeros_like(u)], 1), np.stack([u, np.full_like(u, v)], 1)])
        idx = []
        for i in range(sides):
            a0, a1 = i, i + 1
            b0, b1 = sides + 1 + i, sides + 1 + i + 1
            idx.extend([a0, b0, a1, a1, b0, b1])
        self.add_raw(material, m, idx, uv, nrm, matrix)
        if caps:
            for center, rr, flip in ((p0, r0, True), (p1, r1, False)):
                if rr <= 1e-6:
                    continue
                pts = np.vstack([[center], center[None, :] + ring * rr])
                n = (d * (-1 if flip else 1))[None, :].repeat(len(pts), 0)
                idx = []
                for i in range(1, len(pts) - 1):
                    idx.extend([0, i, i + 1] if flip else [0, i + 1, i])
                uvc = np.vstack([[[0.0, 0.0]], np.stack([np.cos(ang), np.sin(ang)], 1) * rr / uv_scale])
                self.add_raw(material, pts, idx, uvc, n, matrix)

    def add_tube(self, material, points, radii, sides=10, uv_scale=1.0, matrix=None, caps=True):
        """Bent tapered tube through 3D points (tree trunks, branches, cables)."""
        pts = np.asarray(points, F)
        r = np.asarray(radii, F)
        if len(pts) < 2:
            return
        # parallel transport frames
        tangents = _norm(np.gradient(pts, axis=0))
        frames = []
        up = np.array([1, 0, 0], F)
        prev_a = _norm(np.cross(up, tangents[0])) if abs(tangents[0][0]) < 0.9 else _norm(np.cross(np.array([0, 0, 1], F), tangents[0]))
        for i, t in enumerate(tangents):
            a = prev_a - t * np.dot(prev_a, t)
            a = _norm(a)
            b = np.cross(t, a)
            frames.append((a, b))
            prev_a = a
        ang = np.linspace(0, 2 * np.pi, sides + 1, dtype=F)
        ca, sa = np.cos(ang)[:, None], np.sin(ang)[:, None]
        verts, normals, uvs = [], [], []
        acc_u = 0.0
        for i, (p, rr) in enumerate(zip(pts, r)):
            a, b = frames[i]
            ring = ca * a[None, :] + sa * b[None, :]
            verts.append(p[None, :] + ring * rr)
            normals.append(ring)
            u = ang / (2 * np.pi) * (2 * np.pi * max(rr, 1e-3)) / uv_scale
            v = acc_u / uv_scale
            uvs.append(np.stack([u, np.full_like(u, v)], 1))
            if i + 1 < len(pts):
                acc_u += np.linalg.norm(pts[i + 1] - p)
        verts = np.vstack(verts)
        normals = np.vstack(normals)
        uvs = np.vstack(uvs)
        idx = []
        for i in range(len(pts) - 1):
            for j in range(sides):
                a0 = i * (sides + 1) + j
                a1 = a0 + 1
                b0 = a0 + sides + 1
                b1 = b0 + 1
                idx.extend([a0, b0, a1, a1, b0, b1])
        self.add_raw(material, verts, idx, uvs, normals, matrix)
        if caps:
            for i, flip in ((0, True), (len(pts) - 1, False)):
                p, rr = pts[i], r[i]
                a, b = frames[i]
                ring = ca * a[None, :] + sa * b[None, :]
                n = tangents[i] * (-1 if flip else 1)
                uvc = np.vstack([[[0.0, 0.0]], np.stack([np.cos(ang), np.sin(ang)], 1) * rr / uv_scale])
                idxc = []
                for j in range(1, sides):
                    idxc.extend([0, j, j + 1] if flip else [0, j + 1, j])
                self.add_raw(material, np.vstack([[p], p[None, :] + ring * rr]), idxc, uvc, n[None, :].repeat(sides + 2, 0), matrix)

    def add_sphere(self, material, center, radius, segments=24, rings=16, uv_scale=1.0, matrix=None, scale=(1, 1, 1), v_from=0.0, v_to=1.0, top_only=False):
        c = np.asarray(center, F)
        sc = np.asarray(scale, F)
        lat = np.linspace(np.pi * (0.5 - v_to), np.pi * (0.5 - v_from), rings + 1)
        lon = np.linspace(0, 2 * np.pi, segments + 1)
        verts, nrm, uv = [], [], []
        for i, phi in enumerate(lat):
            for j, th in enumerate(lon):
                n = np.array([np.cos(phi) * np.cos(th), np.sin(phi), np.cos(phi) * np.sin(th)], F)
                verts.append(c + n * radius * sc)
                nrm.append(_norm(n / sc))
                u = th / (2 * np.pi) * (2 * np.pi * radius * max(sc[0], sc[2])) / uv_scale
                v = (i / rings) * (np.pi * radius * sc[1]) / uv_scale
                uv.append([u, v])
        idx = []
        for i in range(rings):
            for j in range(segments):
                a = i * (segments + 1) + j
                b = a + segments + 1
                if top_only and i == 0:
                    idx.extend([a, a + 1, b + 1])
                else:
                    idx.extend([a, b, a + 1, a + 1, b, b + 1])
        self.add_raw(material, np.array(verts, F), idx, np.array(uv, F), np.array(nrm, F), matrix)

    def add_lathe(self, material, profile, segments=24, uv_scale=1.0, matrix=None, cap_bottom=True):
        prof = np.asarray(profile, F)
        ang = np.linspace(0, 2 * np.pi, segments + 1, dtype=F)
        verts, nrm, uv = [], [], []
        for k, (r, y) in enumerate(prof):
            for j, th in enumerate(ang):
                verts.append([np.cos(th) * r, y, np.sin(th) * r])
        # normals from profile tangent
        for k, (r, y) in enumerate(prof):
            k0, k1 = max(0, k - 1), min(len(prof) - 1, k + 1)
            dr = prof[k1][0] - prof[k0][0]
            dy = prof[k1][1] - prof[k0][1]
            n2 = _norm(np.array([dy, -dr], F))
            for j, th in enumerate(ang):
                nrm.append([n2[0] * np.cos(th), n2[1], n2[0] * np.sin(th)])
                uv.append([th / (2 * np.pi) * (2 * np.pi * max(r, 1e-3)) / uv_scale, y / uv_scale])
        idx = []
        rows = len(prof)
        for i in range(rows - 1):
            for j in range(segments):
                a = i * (segments + 1) + j
                b = a + segments + 1
                idx.extend([a, b, a + 1, a + 1, b, b + 1])
        self.add_raw(material, np.array(verts, F), idx, np.array(uv, F), np.array(nrm, F), matrix)
        if cap_bottom and prof[0][0] > 1e-4:
            r0, y0 = prof[0]
            ring = np.stack([np.cos(ang) * r0, np.full_like(ang, y0), np.sin(ang) * r0], 1)
            idxc = []
            for j in range(1, segments + 1):
                idxc.extend([0, j, j + 1])
            uvc = np.stack([np.cos(ang), np.sin(ang)], 1) * r0 / uv_scale
            self.add_raw(material, np.vstack([[[0, y0, 0]], ring]), idxc, np.vstack([[[0.0, 0.0]], uvc]), np.tile([0, -1, 0], (segments + 2, 1)), matrix)

    def add_plane(self, material, center, size, uv_scale=1.0, rx=0.0, rz=0.0, matrix=None, uv_offset=(0, 0), uv_repeat=None):
        sx, sy = np.asarray(size, F) / 2
        corners = np.array([[-sx, 0, sy], [sx, 0, sy], [sx, 0, -sy], [-sx, 0, -sy]], F)
        R = rot_matrix((1, 0, 0), rx) @ rot_matrix((0, 0, 1), rz)
        p = corners @ R.T + np.asarray(center, F)
        if uv_repeat:
            uv = np.array([[0, 0], [uv_repeat[0], 0], [uv_repeat[0], uv_repeat[1]], [0, uv_repeat[1]]], F)
        else:
            uv = np.array([[0, 0], [2 * sx, 0], [2 * sx, 2 * sy], [0, 2 * sy]], F) / uv_scale
        uv = uv + np.asarray(uv_offset, F)
        n = _norm(R @ np.array([0, 1, 0], F))[None, :].repeat(4, 0)
        self.add_raw(material, p, [0, 1, 2, 0, 2, 3], uv, n, matrix)

    def add_leaf_card(self, material, center, size, angle, tilt=0.0, uv_scale=1.0, matrix=None):
        sx, sy = np.asarray(size, F)
        R = rot_matrix((0, 1, 0), angle) @ rot_matrix((1, 0, 0), tilt)
        local = np.array([[-sx / 2, 0, 0], [sx / 2, 0, 0], [sx / 2, sy, 0], [-sx / 2, sy, 0]], F)
        p = local @ R.T + np.asarray(center, F)
        n = _norm(R @ np.array([0, 0, -1], F))[None, :].repeat(4, 0)
        uv = np.array([[0, 0], [1, 0], [1, 1], [0, 1]], F)
        self.add_raw(material, p, [0, 1, 2, 0, 2, 3], uv, n, matrix)

    def add_wall_with_opening(self, material, center, size, opening, uv_scale=1.0, matrix=None, axis="x"):
        """Wall on the XY plane (thickness on Z) with a rectangular opening.
        opening = dict(x, y, w, h) in wall-local metres relative to wall centre."""
        cx, cy, cz = center
        sx, sy, sz = size
        ox, oy, ow, oh = opening["x"], opening["y"], opening["w"], opening["h"]
        left = (-sx / 2, ox - ow / 2)
        right = (ox + ow / 2, sx / 2)
        # side pieces
        for (x0, x1) in (left, right):
            if x1 - x0 > 1e-4:
                self.add_box(material, (cx + (x0 + x1) / 2, cy, cz), (x1 - x0, sy, sz), uv_scale, matrix)
        bottom_h = (oy - oh / 2) + sy / 2
        top_start = (oy + oh / 2) + sy / 2
        if bottom_h > 1e-4:
            self.add_box(material, (cx + ox, cy - sy / 2 + bottom_h / 2, cz), (ow, bottom_h, sz), uv_scale, matrix)
        if sy - top_start > 1e-4:
            self.add_box(material, (cx + ox, cy - sy / 2 + top_start + (sy - top_start) / 2, cz), (ow, sy - top_start, sz), uv_scale, matrix)


def compute_normals(pos, idx):
    n = np.zeros_like(pos)
    tri = idx.reshape(-1, 3)
    v0, v1, v2 = pos[tri[:, 0]], pos[tri[:, 1]], pos[tri[:, 2]]
    fn = np.cross(v1 - v0, v2 - v0)
    for k in range(3):
        np.add.at(n, tri[:, k], fn)
    ln = np.linalg.norm(n, axis=1, keepdims=True)
    return (n / np.maximum(ln, 1e-9)).astype(F)


def compute_tangents(pos, uv, idx, normals):
    tan = np.zeros_like(pos)
    bit = np.zeros_like(pos)
    tri = idx.reshape(-1, 3)
    for t in tri:
        i0, i1, i2 = t
        e1 = pos[i1] - pos[i0]
        e2 = pos[i2] - pos[i0]
        du1 = uv[i1] - uv[i0]
        du2 = uv[i2] - uv[i0]
        det = du1[0] * du2[1] - du2[0] * du1[1]
        if abs(det) < 1e-12:
            continue
        r = 1.0 / det
        sdir = (e1 * du2[1] - e2 * du1[1]) * r
        tdir = (e2 * du1[0] - e1 * du2[0]) * r
        for i, sd, td in ((i0, sdir, tdir), (i1, sdir, tdir), (i2, sdir, tdir)):
            tan[i] += sd
            bit[i] += td
    tan = _norm(tan)
    # Gram-Schmidt against normal
    tan = _norm(tan - normals * np.sum(tan * normals, axis=1, keepdims=True))
    handed = np.sign(np.sum(np.cross(normals, tan) * _norm(bit), axis=1))
    handed[handed == 0] = 1
    return np.concatenate([tan, handed[:, None]], axis=1).astype(F)


def compute_normals_welded(pos, idx, tol=2e-4):
    """Average normals across duplicated (UV-seam) vertices sharing a position."""
    n = compute_normals(pos, idx)
    if len(pos) == 0:
        return n
    keys = np.round(np.asarray(pos, np.float64) / tol).astype(np.int64)
    _, inv = np.unique(keys, axis=0, return_inverse=True)
    acc = np.zeros((int(inv.max()) + 1, 3), np.float64)
    np.add.at(acc, inv, n)
    out = acc[inv]
    ln = np.linalg.norm(out, axis=1, keepdims=True)
    return (out / np.maximum(ln, 1e-9)).astype(F)
