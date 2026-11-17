"""Anatomical skin texture painting from 3D landmarks (see uvpaint).

Coordinates are MakeHuman model units (feet ≈ -8.17, crown ≈ 8.49, +Z = face
forward). Landmarks come from the authored skeleton, so features stay glued to
the anatomy instead of a guessed UV layout.
"""
from __future__ import annotations

import numpy as np

from .tex import blur, fbm, height_to_normal, cavity_ao, speckle
from .uvpaint import band, ellipse, line_yz, smoothstep, srgb_hex

F = np.float32

EYE = (0.308, 7.284, 1.245)
NOSE_TIP = (0.0, 6.955, 1.681)
NOSTRIL = (0.088, 6.905, 1.585)
LIP = (0.0, 6.520, 1.560)
CHIN = (0.0, 6.290, 1.440)
CHEEK = (0.44, 7.030, 1.300)
EAR = (0.80, 7.170, 0.760)
BROW = (0.30, 7.470, 1.370)
TEMPLE = (0.63, 7.560, 0.980)
EYE_IN = 0.10
EYE_OUT = 0.55


def scalp_line(x, z, style="short"):
    """Tinggi garis rambut (model unit) sebagai fungsi x/z saja.

    Dulu garis ini hanya 6,80 + 0,22*(z) di dahi, yaitu **di bawah** alis
    (7,47) dan mata (7,29). Topi rambut karena itu menutupi seluruh wajah dan
    yang tampak sebagai "garis rambut" sebenarnya adalah perpotongan topi
    dengan kulit wajah — bidang yang nyaris berimpit, sehingga muncul sebagai
    gerigi hitam 8-10 px di dahi. Sekarang garis rambut memakai sudut keliling
    kepala: dahi 7,78 · pelipis ~7,55 · atas telinga ~7,45 · tengkuk 7,10,
    jadi topi rambut berhenti di kulit kepala dan tepinya = isoline mulus.
    Sisi 7,49 dibuat di atas puncak telinga 7,45; dulu 7,36 sehingga ujung
    telinga menembus topi dan tampil sebagai bercak terang di pelipis.
    """
    ax = np.abs(x)
    cz = 0.15
    r = np.sqrt(ax * ax + (z - cz) ** 2) + 1e-6
    c = np.clip((z - cz) / r, -1, 1)          # 1 = depan, -1 = belakang
    f = 0.5 * (c + 1)
    # Sisi (f=0,5) sengaja 7,49: di atas puncak telinga (7,45) supaya cuping/tulang
    # rawan telinga tidak menembus topi rambut dan tampil sebagai bercak terang.
    line = 6.98 + 0.85 * f ** 1.60
    if style == "receding":
        # pelipis mundur: garis naik di sisi depan
        line = line + 0.26 * np.clip((ax - 0.18) / 0.45, 0, 1) * f
    elif style == "bowl":
        # potongan mangkuk: garis rambut turun rata (khas anak)
        line = line - 0.30
    elif style == "fringe":
        # poni: bagian depan turun, samping tetap
        line = line - 0.22 * f
    elif style == "messy":
        pass
    # gelombang garis rambut: panjang ~6 cm, amplitudo 2-3 mm
    irregular = 0.030 * np.sin(ax * 11.0 + 1.3) + 0.020 * np.sin(z * 9.0 + 2.1) + 0.008 * np.sin(ax * 17.0 + 0.4)
    return line + irregular


HAIRLINE_RIM = 0.126


def _fill(img_flat, sel, value):
    img_flat[sel] = img_flat[sel] * (1 - value[..., :1]) + value if isinstance(value, np.ndarray) and value.ndim == 2 else value


def paint_skin(P, N, M, size, spec):
    """P,N,M: UV-space position/normal/mask maps. spec: tone/age/sex/hair..."""
    tone = srgb_hex(spec.get("tone", "#c69a76"))
    red = srgb_hex(spec.get("red", "#b9675a"))
    lip_col = srgb_hex(spec.get("lip", "#9d554d"))
    brow_col = srgb_hex(spec.get("brow", "#241a12"))
    age = float(spec.get("age", 0.35))
    male = spec.get("sex", "male") == "male"
    stubble = float(spec.get("stubble", 0.55 if male else 0.0))
    freckle = float(spec.get("freckles", 0.0))
    pale = float(spec.get("pale", 0.0))
    dirt = float(spec.get("dirt", 0.0))
    glow = spec.get("glow", None)

    flat = M.reshape(-1)
    sel = np.flatnonzero(flat)
    p = P.reshape(-1, 3)[sel]
    n = N.reshape(-1, 3)[sel]
    x = p[:, 0]
    y = p[:, 1]
    z = p[:, 2]
    ax = np.abs(x)
    front = np.clip(n[:, 2], 0, 1)
    is_head = y > 6.30
    is_face = is_head & (front > 0.25)
    n_tex = len(sel)

    rng = np.random.default_rng(int(spec.get("seed", 3)))
    # ---------------------------------------------------------------- albedo
    base = np.tile(tone, (n_tex, 1))
    # large-scale mottling and subtle warm/cool variation
    mott = (fbm(size, size, 9, 4, 0.55, int(spec.get("seed", 3))).reshape(-1)[sel] - 0.5)
    base *= (1.0 + mott[..., None] * 0.10)
    base *= (1.0 + np.stack([mott, mott * 0.6, -mott * 0.5], 1) * 0.10)
    # palms/soles slightly pinker and lighter
    low_limb = (~is_head) & (y < 0.0)
    base = np.where((low_limb & (y < -7.6))[..., None], base * 0.92 + red * 0.10, base)

    # blush / vascular zones
    def zone(cx, cy, cz, rx, ry, rz, amt):
        d = np.sqrt(((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2)
        return (1 - smoothstep(d - 0.35) ) * amt

    redness = np.zeros(n_tex, F)
    for s in (1, -1):
        redness += zone(s * CHEEK[0], CHEEK[1], CHEEK[2], 0.30, 0.30, 0.30, 0.55)
        redness += zone(s * EAR[0], EAR[1], EAR[2], 0.22, 0.34, 0.20, 0.55)
        redness += zone(s * 0.10, 6.98, 1.60, 0.16, 0.13, 0.18, 0.35)  # nose
        redness += zone(s * 0.34, 6.44, 1.45, 0.13, 0.13, 0.13, 0.25)  # mouth corner
        redness += zone(s * 0.95, 4.90, 0.30, 0.28, 0.24, 0.34, 0.25)  # elbow
        redness += zone(s * 0.62, -0.20, 0.55, 0.30, 0.26, 0.26, 0.25)  # knee
    redness += zone(0.0, 5.10, 0.55, 0.55, 0.5, 0.4, 0.10)
    base = base * (1 - 0.55 * redness[..., None]) + red * (0.55 * redness[..., None])

    # veins on forearms/wrists (subtle)
    vein = np.zeros(n_tex, F)
    arms = (ax > 1.35) & (y > -1.6) & (y < 3.4) & (z > 0.0)
    if arms.any():
        vn = fbm(size, size, 60, 3, 0.55, 17).reshape(-1)[sel]
        vein = (np.clip((vn - 0.62) * 3.2, 0, 1) * arms * 0.5)
        base = base * (1 - 0.35 * vein[..., None]) + np.array([0.28, 0.36, 0.44], F) * (0.35 * vein[..., None])

    # freckles / sun spots
    if freckle > 0:
        dots = speckle(size, size, 77, 4200, (1, 2), (0.0, 1.0)).reshape(-1)[sel]
        freck = (dots > 0.75) * freckle * (is_face | (front > 0.6))
        base = base * (1 - 0.5 * freck[..., None]) + np.array([0.42, 0.28, 0.20], F) * (0.5 * freck[..., None])

    # ----------------------------------------------------------------- face
    fw = np.zeros(n_tex, F)  # feature darkness accumulator
    height = np.zeros(n_tex, F)
    rough = np.full(n_tex, 0.68, F)
    metal = np.zeros(n_tex, F)
    ao = np.ones(n_tex, F)
    extra = np.zeros((n_tex, 3), F)
    extra_w = np.zeros(n_tex, F)

    brow_mask = np.zeros(n_tex, F)
    lip_mask = np.zeros(n_tex, F)
    lash_mask = np.zeros(n_tex, F)

    pores = fbm(size, size, 150, 2, 0.55, 91).reshape(-1)[sel]
    height += (pores - 0.5) * 0.10
    fine = fbm(size, size, 60, 3, 0.5, 93).reshape(-1)[sel]
    height += (fine - 0.5) * 0.035

    for side in (1, -1):
        # ---- eyebrow: dense strokes along a curved band
        bx = side * x
        t_b = np.clip((bx - 0.075) / 0.44, 0, 1)
        arc_y = 7.435 + 0.055 * np.sin(t_b * np.pi) - 0.045 * t_b
        thick = 0.052 * (1 - 0.55 * smoothstep((t_b - 0.55) / 0.45)) * (0.55 + 0.45 * smoothstep(t_b / 0.25))
        bm = (
            band(bx, 0.075, 0.50, 0.10)
            * (1 - smoothstep(np.abs(y - arc_y) / np.maximum(thick, 1e-3)))
            * (front > 0.45)
            * is_head
        )
        stroke = 0.45 + 0.55 * (0.5 + 0.5 * np.sin(bx * 190 + y * 120 + side)) ** 3
        brow_mask = np.maximum(brow_mask, bm * (0.30 + 0.70 * stroke))
        # ---- eyelids + lashes + crease
        lid_d = np.sqrt(((bx - EYE[0]) / 0.19) ** 2 + ((y - EYE[1]) / 0.115) ** 2)
        lid = (1 - smoothstep(lid_d - 0.15)) * (front > 0.3) * is_head
        lash = (1 - smoothstep(np.abs(lid_d - 1.02) / 0.055)) * (front > 0.3) * is_head
        lash_mask = np.maximum(lash_mask, lash * 0.9)
        crease = (1 - smoothstep(np.abs((y - EYE[1] - 0.105) / 0.022))) * band(bx, EYE[0] - 0.16, EYE[0] + 0.17, 0.15) * (front > 0.4)
        height -= crease * 0.55
        fw = np.maximum(fw, crease * 0.35)
        # orbital shadow: brow-to-lid recess reads as an eye socket
        orb = np.exp(-(((bx - EYE[0]) / 0.21) ** 2 + ((y - EYE[1] - 0.02) / 0.15) ** 2)) * (front > 0.25)
        ao = np.minimum(ao, 1 - orb * 0.16)
        fw = np.maximum(fw, orb * 0.07)
        # under-eye bag / shadow
        bag = np.exp(-(((bx - EYE[0]) / 0.17) ** 2 + ((y - EYE[1] + 0.105) / 0.04) ** 2)) * (front > 0.35)
        fw = np.maximum(fw, bag * (0.08 + 0.20 * age))
        # ---- nasolabial fold
        nl = line_yz(y, z, 7.02, 1.60, 6.44, 1.50, 0.028, 0.9) * band(bx, 0.10, 0.34, 0.2) * (z > 1.25)
        height -= nl * 0.55
        fw = np.maximum(fw, nl * 0.28)
        # ---- crow's feet (age)
        if age > 0.35:
            for k in range(3):
                cf = line_yz(y, z, 7.30 + 0.03 * k, 1.36, 7.36 + 0.05 * k, 1.60, 0.010, 0.9)
                cf *= band(bx, 0.42, 0.60, 0.25) * (front > 0.4)
                height -= cf * 0.35 * age
                fw = np.maximum(fw, cf * 0.18 * age)
        # ---- ear detail
        ed = np.sqrt(((bx - EAR[0]) / 0.20) ** 2 + ((y - EAR[1]) / 0.30) ** 2)
        if (ed < 1.4).any():
            ear_rim = (1 - smoothstep(np.abs(ed - 0.95) / 0.13)) * (z < 1.05)
            ear_bowl = (1 - smoothstep(ed / 0.55)) * (z < 0.95)
            height += ear_rim * 0.5 - ear_bowl * 0.6
            fw = np.maximum(fw, ear_bowl * 0.28)

    # ---- forehead lines (age)
    for k in range(3 if age > 0.55 else 1 if age > 0.42 else 0):
        yy = 7.62 + k * 0.075
        fl = line_yz(y, z, yy, 1.30, yy + 0.01, 1.55, 0.016, 0.95) * band(ax, 0.0, 0.42, 0.25)
        fl *= (front > 0.5) & is_head
        height -= fl * 0.3
        fw = np.maximum(fw, fl * 0.14 * age)

    # ---- lips
    lip_d = np.sqrt(((x) / 0.255) ** 2 + ((y - LIP[1]) / 0.115) ** 2)
    lips = (1 - smoothstep(lip_d - 0.18)) * (front > 0.3) * (z > 1.30)
    lip_line = (1 - smoothstep(np.abs(y - LIP[1] - 0.004) / 0.010)) * band(ax, 0.0, 0.25, 0.3) * (front > 0.3) * (z > 1.30)
    vermilion = (1 - smoothstep(np.abs(lip_d - 1.0) / 0.22)) * (front > 0.3) * (z > 1.30)
    lip_mask = np.maximum(lip_mask, lips)
    edge = np.clip(vermilion - lips, 0, 1) * 0.55
    # lip creases
    # Kerut bibir dibuat jauh lebih halus: frekuensi 150 dan amplitudo 0,18 di
    # atlas 1024 tampil sebagai garis-garis tebal yang terbaca seperti jahitan,
    # dan tonjolan 0,35 membuat bibir atas tampak seperti lempeng terpisah.
    creases = (np.sin(x * 70 + 0.6) * 0.5 + 0.5) ** 3 * lips
    height += lips * 0.16 - lip_line * 0.55 + creases * 0.05
    fw = np.maximum(fw, lip_line * 0.6)
    upper_lip = lips * (y > LIP[1] + 0.005)
    lower_lip = lips * (y <= LIP[1] + 0.005)
    # cupid's bow
    bow = (1 - smoothstep(np.abs(ax - 0.055) / 0.045)) * (y > LIP[1] + 0.03) * (y < LIP[1] + 0.10) * (front > 0.4) * (z > 1.35)
    height += bow * 0.18

    # ---- nostrils
    for side in (1, -1):
        nd = np.sqrt(((x - side * NOSTRIL[0]) / 0.052) ** 2 + ((y - NOSTRIL[1]) / 0.032) ** 2)
        nostril = (1 - smoothstep(nd - 0.35)) * (front > 0.15) * (z > 1.45)
        fw = np.maximum(fw, nostril * 0.75)
        height -= nostril * 0.9
        ao = np.minimum(ao, 1 - nostril * 0.55)
    # nose bridge sides + tip shading
    for side in (1, -1):
        nb = line_yz(y, z, 7.32, 1.62, 7.02, 1.66, 0.028, 0.9) * band(x * side, 0.055, 0.14, 0.4) * (front > 0.4)
        fw = np.maximum(fw, nb * 0.22)
        ao = np.minimum(ao, 1 - nb * 0.20)
    tip = np.exp(-(((x) / 0.13) ** 2 + ((y - 6.99) / 0.10) ** 2)) * (front > 0.3) * (z > 1.5)
    base = base * (1 - 0.18 * tip[..., None]) + red * (0.18 * tip[..., None])
    # philtrum
    ph = band(ax, 0.0, 0.045, 0.5) * band(y, LIP[1] + 0.11, LIP[1] + 0.26, 0.4) * (front > 0.5) * (z > 1.35)
    height -= ph * 0.12
    fw = np.maximum(fw, ph * 0.06)
    # chin crease
    cc = line_yz(y, z, 6.36, 1.42, 6.36, 1.52, 0.020, 0.9) * band(ax, 0.02, 0.20, 0.3) * (front > 0.4)
    height -= cc * 0.25
    fw = np.maximum(fw, cc * 0.10)

    # ---- stubble / beard shadow
    if stubble > 0:
        # Batas atas 6,85 (bukan 6,95): 6,95 sudah di pipi atas, sehingga bercak
        # cambang tampil sebagai noda gelap di tulang pipi. Titiknya juga dibuat
        # lebih kecil dan lebih rapat supaya terbaca sebagai tekstur, bukan noda.
        beard = (
            band(y, 6.10, 6.85, 0.18) * band(ax, 0.0, 0.66, 0.22) * (front > 0.35) * is_head
        )
        dots = speckle(size, size, 95, 15000, (1, 2), (0.0, 1.0)).reshape(-1)[sel]
        beard = beard * (0.30 + 0.70 * (dots > 0.65))
        fw = np.maximum(fw, beard * stubble * 0.70)
        height += beard * stubble * 0.06

    # ---- body details: nipples, navel, nails, knuckles
    for side in (1, -1):
        nz = zone(side * 0.60, 4.55, 1.05, 0.10, 0.09, 0.12, 1.0)
        extra += (np.array([0.36, 0.20, 0.17], F)[None, :] - base) * nz[..., None] * 0.55
        extra_w = np.maximum(extra_w, nz * 0.5)
        rough = np.where(nz > 0.5, 0.72, rough)
    navel = zone(0.0, 2.05, 0.85, 0.055, 0.075, 0.09, 1.0)
    height -= navel * 1.0
    fw = np.maximum(fw, navel * 0.55)
    ao = np.minimum(ao, 1 - navel * 0.6)

    # nails: fingertips and toes
    nail = np.zeros(n_tex, F)
    for side in (1, -1):
        fingers = (ax > 3.55) & (ax < 4.70) & (y > 1.85) & (y < 2.55)
        nail = np.maximum(nail, fingers * (1 - smoothstep((4.70 - ax) / 0.10)))
        toes = (y < -7.72) & (ax > 0.5) & (ax < 2.4) & (z > 1.0)
        nail = np.maximum(nail, toes * (1 - smoothstep((0.5 - y) / 0.06) * 0))
    nail = np.clip(nail, 0, 1) * (front > 0.2)
    extra += (np.array([0.80, 0.66, 0.62], F)[None, :] - base) * nail[..., None] * 0.75
    extra_w = np.maximum(extra_w, nail * 0.8)
    rough = np.where(nail > 0.5, 0.22, rough)
    height += nail * 0.25
    # knuckle wrinkles
    for side in (1, -1):
        for k, ky in enumerate((2.20, 2.35, 2.50)):
            kn = line_yz(y, z, ky, 0.9, ky, 1.6, 0.008, 0.9) * band(ax * side, 3.4, 4.6, 0.2)
            height -= kn * 0.2
        # wrist + elbow creases
        wr = line_yz(y, z, 2.62, 0.7, 2.62, 1.5, 0.010, 0.9) * band(ax, 2.9, 4.2, 0.2)
        height -= wr * 0.25
    # knees / ankles / soles
    for side in (1, -1):
        kn = zone(side * 0.62, -0.30, 1.05, 0.16, 0.20, 0.18, 1.0)
        height += kn * 0.10
        ankle = zone(side * 0.62, -7.30, 0.55, 0.10, 0.10, 0.30, 1.0)
        fw = np.maximum(fw, ankle * 0.10)

    # ------------------------------------------------------------------- dirt
    if dirt > 0:
        dm = fbm(size, size, 14, 4, 0.55, 101).reshape(-1)[sel]
        dm = np.clip((dm - 0.48) * 2.2, 0, 1) * dirt
        dm *= np.clip((3.0 - y) / 6.0 + 0.4, 0, 1)
        base = base * (1 - dm[..., None] * 0.55) + np.array([0.32, 0.27, 0.22], F) * (dm[..., None] * 0.55)

    # ------------------------------------------------------------ composition
    # lips colour over base
    lip_col_upper = lip_col * 0.80
    base = base * (1 - lip_mask[..., None] * 0.92) + (
        np.where(upper_lip[..., None] > 0.5, lip_col_upper, lip_col)
    ) * (lip_mask[..., None] * 0.92)
    lip_red = lips * (0.25 + 0.25 * (1 - front))
    base = base * (1 - lip_red[..., None] * 0.3) + red * (lip_red[..., None] * 0.3)

    # eyebrows + lashes
    base = base * (1 - edge[..., None] * 0.35) + (lip_col * 0.7) * (edge[..., None] * 0.35)
    base = base * (1 - brow_mask[..., None] * 0.88) + brow_col * (brow_mask[..., None] * 0.88)
    base = base * (1 - lash_mask[..., None] * 0.85) + brow_col * (lash_mask[..., None] * 0.85)

    # feature darkening (sockets, folds, nostrils)
    shadow_col = np.array([0.30, 0.22, 0.19], F)
    base = base * (1 - fw[..., None] * 0.85) + shadow_col * (fw[..., None] * 0.85)
    base = base * (1 - extra_w[..., None]) + extra * extra_w[..., None]

    if pale > 0:  # entity
        pale_col = np.array([0.80, 0.82, 0.80], F)
        base = base * (1 - pale) + pale_col * pale

    # ------------------------------------------------- kulit kepala di bawah rambut
    # Topi rambut adalah cangkang yang dipotong per segitiga di garis rambut.
    # Di mesh kepala yang kasar potongan itu tidak bisa mulus: tepinya menuruni
    # faset ~1 cm. Karena itu **garis rambut yang terlihat dilukis di sini**:
    # kulit kepala di atas garis rambut dicat warna `hair_color` dengan
    # transisi 10 mm, jadi tepi geometri seburuk apa pun jatuh di area gelap
    # (gelap di atas gelap) dan yang terbaca sebagai garis rambut adalah batas
    # lukisan yang mulus (± 0,4 mm/texel di dahi pada atlas 1024).
    hair_style = spec.get("hair_style", "short")
    if hair_style != "bald":
        hair_col = srgb_hex(spec.get("hair_color", "#151110"))
        line = scalp_line(x, z, hair_style) + HAIRLINE_RIM
        # Pita gelap mulai 11 mm di bawah garis rambut (cukup menutup takik
        # tepi geometri) dan penuh 13 mm di atasnya.
        under = smoothstep((y - (line - 0.11)) / 0.13) * is_head
        # Telinga tidak perlu mask sendiri: di x telinga (0,80) garis rambut
        # sudah 7,58, di atas puncak telinga 7,45. Mask telinga di sini malah
        # memotong pita gelap di pelipis sehingga gerigi tepi rambut terlihat.
        shade = np.clip((y - (line - 0.16)) / 0.16, 0, 1) * is_head * 0.28
        mix = np.clip(np.maximum(under * 0.95, shade), 0, 1)
        base = base * (1 - mix[..., None]) + hair_col * mix[..., None]
        rough = np.where(under > 0.5, 0.60, rough)
        ao = np.where(under > 0.5, np.minimum(ao, 0.92), ao)

    base = np.clip(base, 0, 1)

    # --------------------------------------------------------- rough / normal
    rough = np.clip(rough - 0.30 * lips + 0.10 * np.clip(1 - front, 0, 1), 0.18, 1.0)
    rough = rough - 0.06 * np.clip(fbm(size, size, 30, 3, 0.5, 7).reshape(-1)[sel] - 0.5, -1, 1)
    # forehead/nose oily, cheeks drier
    rough += 0.10 * (1 - np.clip(front, 0, 1))
    rough = np.clip(rough, 0.15, 1.0)

    ao = np.clip(ao * (1 - fw * 0.35), 0.15, 1.0)

    height_img = _dilate(_to_map(height, sel, M), M, 5)
    normal = height_to_normal(height_img, 1.0)

    out_base = np.zeros((size * size, 3), F)
    out_base[sel] = base
    out_orm = np.zeros((size * size, 3), F)
    out_orm[sel] = np.stack([ao, rough, metal], -1)
    base_img = out_base.reshape(size, size, 3)
    orm_img = out_orm.reshape(size, size, 3)

    # fill the masked gutter by dilation so bilinear filtering never picks black
    base_img = _dilate(base_img, M, 6)
    orm_img = _dilate(orm_img, M, 6)
    return {"base": base_img, "normal": _dilate(normal, M, 5), "orm": orm_img}


def _to_map(flat, sel, M):
    out = np.zeros(M.size, F)
    out[sel] = flat
    return out.reshape(M.shape)


def _dilate(img, mask, passes):
    out = img.copy()
    m = mask.copy()
    if out.ndim == 3:
        for _ in range(passes):
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                src = np.roll(np.roll(out, dy, 0), dx, 1)
                sm = np.roll(np.roll(m, dy, 0), dx, 1) & ~m
                out[sm] = src[sm]
                m |= sm
    else:
        out = out[..., None]
        o2 = _dilate(out, mask, passes)
        return o2[..., 0]
    return out


def _dilate_normal(nm, mask, passes):
    return _dilate(nm, mask, passes)
