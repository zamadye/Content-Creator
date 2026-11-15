"""Offline software PBR preview renderer.

Two uses only: QC stills during the asset build, and catalogue thumbnails.
It rasterises the actual geometry with the PBR maps embedded in the GLB, so the
preview shows what the runtime shows: base colour, normal map, roughness,
metallic, AO and one shadow-mapped key light plus a cheap hemisphere fill.
"""
from __future__ import annotations

import numpy as np
from PIL import Image

F = np.float32


def srgb_to_linear(c):
    c = np.asarray(c, F)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(F)


def aces(x):
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)


def look_at(eye, target, up=(0, 1, 0)):
    eye = np.asarray(eye, F)
    target = np.asarray(target, F)
    f = target - eye
    f /= np.linalg.norm(f)
    up = np.asarray(up, F)
    s = np.cross(f, up)
    s /= np.linalg.norm(s)
    u = np.cross(s, f)
    m = np.eye(4, dtype=F)
    m[0, :3] = s
    m[1, :3] = u
    m[2, :3] = -f
    m[:3, 3] = -m[:3, :3] @ eye
    return m


def _hex(s):
    s = s.lstrip("#")
    return [int(s[i : i + 2], 16) / 255.0 for i in (0, 2, 4)]


def sample(tex, u, v):
    if tex is None:
        return None
    tex = np.asarray(tex, F)
    h, w = tex.shape[:2]
    three = tex.ndim == 3
    t = tex if three else tex[..., None]
    x = (u % 1.0) * w - 0.5
    y = (v % 1.0) * h - 0.5
    x0 = np.floor(x).astype(np.int32)
    y0 = np.floor(y).astype(np.int32)
    fx = (x - x0)[..., None]
    fy = (y - y0)[..., None]
    x0 %= w
    y0 %= h
    x1 = (x0 + 1) % w
    y1 = (y0 + 1) % h
    out = t[y0, x0] * (1 - fx) * (1 - fy) + t[y0, x1] * fx * (1 - fy) + t[y1, x0] * (1 - fx) * fy + t[y1, x1] * fx * fy
    return out if three else out[..., 0]


class Scene:
    def __init__(self):
        self.objects = []

    def add(self, pos, idx, uv, nrm, mat, matrix=None, cast_shadow=True):
        pos = np.asarray(pos, F)
        uv = np.asarray(uv, F) if uv is not None else np.zeros((len(pos), 2), F)
        nrm = np.asarray(nrm, F) if nrm is not None else None
        if matrix is not None:
            pos = pos @ matrix[:3, :3].T + matrix[:3, 3]
            if nrm is not None:
                nrm = nrm @ np.linalg.inv(matrix[:3, :3]).T
                nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-9)
        self.objects.append(
            {"pos": pos, "idx": np.asarray(idx, np.int64).ravel(), "uv": uv, "nrm": nrm, "mat": mat, "shadow": cast_shadow}
        )


def _gather(scene):
    """Return concatenated vertex arrays and per-triangle material indices."""
    P, U, N, tris, tri_mat, tri_shadow = [], [], [], [], [], []
    off = 0
    for oi, o in enumerate(scene.objects):
        pos, idx, uv, nrm = o["pos"], o["idx"], o["uv"], o["nrm"]
        P.append(pos)
        U.append(uv)
        N.append(nrm if nrm is not None else np.zeros_like(pos))
        t = idx.reshape(-1, 3) + off
        tris.append(t)
        tri_mat.append(np.full(len(t), oi, np.int32))
        tri_shadow.append(np.full(len(t), bool(o["shadow"])))
        off += len(pos)
    return (
        np.vstack(P),
        np.vstack(U),
        np.vstack(N),
        np.vstack(tris),
        np.concatenate(tri_mat),
        np.concatenate(tri_shadow),
    )


def _raster(screen, depth, attrs, size, shade_ids=None):
    """Perspective-correct rasteriser.

    screen: (T,3,2) pixel centres, depth: (T,3) view depth, attrs: dict of
    (T,3,K) float arrays. Returns z-buffer and interpolated attribute buffers.
    Tri z-buffer chosen as min depth (closer).
    """
    W, H = size
    zbuf = np.full((H, W), np.inf, F)
    bufs = {k: np.zeros((H, W) + v.shape[2:], F) for k, v in attrs.items()}
    idbuf = np.full((H, W), -1, np.int32)
    for t in range(len(screen)):
        s = screen[t]
        z = depth[t]
        if not (z > 1e-4).all():
            continue
        x0 = max(int(np.floor(s[:, 0].min())), 0)
        x1 = min(int(np.ceil(s[:, 0].max())), W - 1)
        y0 = max(int(np.floor(s[:, 1].min())), 0)
        y1 = min(int(np.ceil(s[:, 1].max())), H - 1)
        if x1 < x0 or y1 < y0:
            continue
        ax, ay = s[0]
        bx, by = s[1]
        cx, cy = s[2]
        area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay)
        if abs(area) < 1e-12:
            continue
        px = np.arange(x0, x1 + 1, dtype=F)[None, :] + 0.5
        py = np.arange(y0, y1 + 1, dtype=F)[:, None] + 0.5
        w0 = ((bx - px) * (cy - py) - (cx - px) * (by - py)) / area
        w1 = ((cx - px) * (ay - py) - (ax - px) * (cy - py)) / area
        w2 = 1.0 - w0 - w1
        inside = (w0 >= -1e-4) & (w1 >= -1e-4) & (w2 >= -1e-4)
        if not inside.any():
            continue
        invw = w0 / z[0] + w1 / z[1] + w2 / z[2]
        with np.errstate(divide="ignore", invalid="ignore"):
            zd = 1.0 / invw
        zview = zbuf[y0 : y1 + 1, x0 : x1 + 1]
        m = inside & (zd < zview)
        if not m.any():
            continue
        zview[m] = zd[m]
        idbuf[y0 : y1 + 1, x0 : x1 + 1][m] = shade_ids[t] if shade_ids is not None else t
        for k, a in attrs.items():
            cw = np.stack([w0 / z[0], w1 / z[1], w2 / z[2]], -1)
            val = np.einsum("yxt,tk->yxk", cw, a[t]) / np.where(np.abs(invw) > 1e-9, invw, 1e-9)[..., None]
            dst = bufs[k][y0 : y1 + 1, x0 : x1 + 1]
            dst[m] = val[m]
    bufs["zbuf"] = zbuf
    bufs["id"] = idbuf
    return bufs


def render(
    scene: Scene,
    out_path=None,
    eye=(3.0, 1.8, 3.2),
    target=(0, 0.9, 0),
    fov=32.0,
    size=(768, 768),
    bg_top="#16242a",
    bg_bottom="#05090b",
    light_dir=(-0.42, -0.78, -0.46),
    light_color=(1.0, 0.95, 0.88),
    light_intensity=3.0,
    ambient=0.34,
    ambient_sky=(0.42, 0.52, 0.62),
    ambient_ground=(0.13, 0.12, 0.11),
    shadow=True,
    exposure=1.0,
    ground=None,
    vignette=0.25,
):
    W, H = size
    eye = np.asarray(eye, F)
    view = look_at(eye, target)
    proj = np.zeros((4, 4), F)
    f = 1.0 / np.tan(np.radians(fov) / 2)
    proj[0, 0] = f / (W / H)
    proj[1, 1] = f
    proj[2, 2] = -1.001
    proj[2, 3] = -0.02
    proj[3, 2] = -1.0
    mvp = proj @ view

    if ground is not None:
        y = ground.get("y", 0.0)
        R = float(ground.get("radius", 60.0))
        seg = 48
        ang = np.linspace(0, 2 * np.pi, seg + 1, F)
        ring = np.stack([np.cos(ang) * R, np.full_like(ang, y), np.sin(ang) * R], 1)
        gpos = np.vstack([[[0.0, y, 0.0]], ring])
        rep = ground.get("uv_repeat", 40.0)
        uv = gpos[:, [0, 2]] / rep
        idx = []
        for i in range(1, seg + 1):
            idx.extend([0, i + 1, i])
        gs = Scene()
        gs.objects = list(scene.objects)
        gs.add(gpos, np.array(idx), uv, np.tile([0, 1, 0], (len(gpos), 1)).astype(F), ground["mat"], cast_shadow=False)
        scene = gs

    P, U, N, tris, tri_mat, tri_shadow = _gather(scene)
    v = P[tris]
    vn = N[tris]
    fn = np.cross(v[:, 1] - v[:, 0], v[:, 2] - v[:, 0])
    fnn = (fn / np.maximum(np.linalg.norm(fn, axis=1, keepdims=True), 1e-9))[:, None, :]
    ln = np.linalg.norm(vn, axis=2, keepdims=True)
    vn = np.where(ln > 1e-7, vn / np.maximum(ln, 1e-9), fnn)

    vh = np.concatenate([v, np.ones((len(v), 3, 1), F)], 2)
    vc = vh @ view.T
    w = -vc[:, :, 2]
    ok = (w > 0.08).all(1)
    # front-facing test in world space (robust with y-flip)
    centroid = v.mean(1)
    front = np.sum(fn * (eye[None, :] - centroid), 1) > 0
    uvn = np.linalg.norm(fn, axis=1, keepdims=True)
    keep = ok & (front | (uvn[:, 0] < 1e-9))
    if keep.sum() < 8:
        keep = ok
    v, vn, tri_mat, tri_shadow, w = v[keep], vn[keep], tri_mat[keep], tri_shadow[keep], w[keep]

    ndc = (v @ mvp[:3, :3].T + mvp[:3, 3]) / w[:, :, None]
    screen = np.stack([(ndc[:, :, 0] * 0.5 + 0.5) * W, (1 - (ndc[:, :, 1] * 0.5 + 0.5)) * H], 2)

    # shadow pass
    shadowmap = None
    ld = np.asarray(light_dir, F)
    ld /= np.linalg.norm(ld)
    if shadow:
        center = P.mean(0)
        radius = float(np.linalg.norm(P - center, axis=1).max()) * 1.25 + 0.4
        lv = look_at(center - ld * radius * 4, center)
        S = 1024
        pl = np.eye(4, dtype=F)
        scale = 1.0 / (radius * 0.75)
        pl[0, 0] = pl[1, 1] = scale
        pl[2, 2] = 1.0 / (radius * 8)
        pl[3, 3] = 1.0
        mvp_l = pl @ lv
        sh_mask = tri_shadow
        vl = v[sh_mask]
        if len(vl):
            vcl = np.concatenate([vl, np.ones((len(vl), 3, 1), F)], 2) @ mvp_l.T
            dw = -vcl[:, :, 2]
            ndcl = vcl[:, :, :3] / np.maximum(vcl[:, :, 3:4], 1e-6)
            scr_l = np.stack([(ndcl[:, :, 0] * 0.5 + 0.5) * S, (1 - (ndcl[:, :, 1] * 0.5 + 0.5)) * S], 2)
            sh = _raster(scr_l, dw, {}, (S, S))
            shadowmap = {"d": sh["zbuf"], "mvp": mvp_l, "S": S}

    auv = U[tris][keep]
    buf = _raster(screen, w, {"pos": v, "nrm": vn, "uv": auv}, (W, H), shade_ids=tri_mat)

    mask = buf["id"] >= 0
    pos = buf["pos"]
    nrm = buf["nrm"]
    uv = buf["uv"]
    mid = buf["id"]

    grad = np.linspace(0, 1, H, dtype=F)[:, None, None]
    top_c = srgb_to_linear(np.asarray(_hex(bg_top), F))[None, None, :]
    bot_c = srgb_to_linear(np.asarray(_hex(bg_bottom), F))[None, None, :]
    out = np.broadcast_to(top_c * (1 - grad) + bot_c * grad, (H, W, 3)).astype(F).copy()

    for oi, o in enumerate(scene.objects):
        sel = (mid == oi) & mask
        if not sel.any():
            continue
        mat = o["mat"]
        n = nrm[sel]
        n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
        u_ = uv[sel][:, 0]
        v_ = uv[sel][:, 1]
        base = sample(mat.get("base"), u_, v_)
        alpha = np.ones(sel.sum(), F)
        if base is None:
            base = np.ones((sel.sum(), 3), F) * 0.72
        elif np.asarray(base).shape[-1] == 4:
            b4 = np.asarray(base, F)
            alpha = b4[:, 3]
            cutoff = mat.get("alpha_cutoff")
            if cutoff is not None:
                alpha = (alpha >= cutoff).astype(F)
            base = b4[:, :3]
        base = srgb_to_linear(np.asarray(base, F))
        nm = sample(mat.get("normal"), u_, v_)
        orm = sample(mat.get("orm"), u_, v_)
        if orm is None:
            ao, rough, metal = np.ones(sel.sum(), F), np.full(sel.sum(), 0.8, F), np.zeros(sel.sum(), F)
        else:
            ao, rough, metal = orm[..., 0], np.clip(orm[..., 1], 0.03, 1), orm[..., 2]
        if nm is not None and mat.get("use_normal", True):
            up = np.where(np.abs(n[:, 1:2]) < 0.95, np.array([0, 1, 0], F), np.array([0, 0, 1], F))
            t = np.cross(up, n)
            t /= np.maximum(np.linalg.norm(t, axis=1, keepdims=True), 1e-9)
            b = np.cross(n, t)
            tn = np.asarray(nm, F) * 2 - 1
            tn *= np.asarray(mat.get("normal_scale", 1.0), F)
            n = t * tn[:, 0:1] + b * tn[:, 1:2] + n * tn[:, 2:3]
            n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
        p = pos[sel]
        ndl = np.clip(n @ (-ld), 0, 1)
        sh = np.ones(sel.sum(), F)
        if shadowmap is not None and o["shadow"]:
            vs = np.concatenate([p, np.ones((len(p), 1), F)], 1) @ shadowmap["mvp"].T
            ns = vs[:, :3] / np.maximum(vs[:, 3:4], 1e-6)
            light_dist = -vs[:, 2]
            S = shadowmap["S"]
            sx = ((ns[:, 0] * 0.5 + 0.5) * S).astype(np.int32)
            sy = ((1 - (ns[:, 1] * 0.5 + 0.5)) * S).astype(np.int32)
            inb = (sx >= 1) & (sx < S - 1) & (sy >= 1) & (sy < S - 1)
            acc = np.zeros(len(p), F)
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    d = shadowmap["d"][np.clip(sy + dy, 0, S - 1), np.clip(sx + dx, 0, S - 1)]
                    acc += (light_dist - 0.02 <= d).astype(F)
            sh = np.where(inb, acc / 9.0, 1.0)
            sh = 0.15 + 0.85 * sh
        lc = np.asarray(light_color, F)
        view_dir = eye[None, :] - p
        view_dir /= np.maximum(np.linalg.norm(view_dir, axis=1, keepdims=True), 1e-9)
        hv = -ld + view_dir
        hv /= np.maximum(np.linalg.norm(hv, axis=1, keepdims=True), 1e-9)
        ndh = np.clip(np.sum(n * hv, 1), 0, 1)
        ndv = np.clip(np.sum(n * view_dir, 1), 0, 1)
        a = np.maximum(rough**2, 1e-3)
        spec = (ndh ** (2.0 / a**2 - 2.0)) * ((2.0 / a**2) + 8) / (28.0)
        fres = 0.04 + 0.96 * (1 - ndv) ** 5
        f0 = 0.04 * (1 - metal)[:, None] + base * metal[:, None]
        diffuse = base * (lc[None, :] * light_intensity * ndl[:, None] * sh[:, None])
        specular = f0 * spec[:, None] * light_intensity * ndl[:, None] * sh[:, None] * fres[:, None]
        hemi = n[:, 1:2] * 0.5 + 0.5
        amb = (
            np.asarray(ambient_sky, F)[None, :] * hemi + np.asarray(ambient_ground, F)[None, :] * (1 - hemi)
        ) * ao[:, None] * ambient
        amb_diff = base * amb
        amb_spec = f0 * amb * (1 - rough[:, None]) * 1.5
        em = sample(mat.get("emissive"), u_, v_)
        emissive = srgb_to_linear(em) * 2.4 if em is not None else 0.0
        col = diffuse + specular + amb_diff + amb_spec + emissive
        dst = out[sel]
        a = alpha[:, None]
        out[sel] = dst * (1 - a) + col * a

    if vignette:
        yy, xx = np.mgrid[0:H, 0:W].astype(F)
        r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 1.414
        out *= (1 - vignette * r**2)[..., None]
    out = np.clip(aces(out * exposure), 0, 1) ** (1 / 2.2)
    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8))
    if out_path:
        img.save(out_path)
    return img


def contact_sheet(images, path, cell=360, cols=4, bg=(10, 12, 14)):
    rows = (len(images) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell, rows * cell), bg)
    for i, im in enumerate(images):
        sheet.paste(im.convert("RGB").resize((cell, cell), Image.LANCZOS), ((i % cols) * cell, (i // cols) * cell))
    sheet.save(path)
    return sheet
