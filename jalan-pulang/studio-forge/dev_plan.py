"""QC denah (previs): gambar docs/plans/*.json jadi PNG tampak atas.

    python3 studio-forge/dev_plan.py                 # semua cerita
    python3 studio-forge/dev_plan.py duduk-sore      # satu cerita

Warna:
  cokelat tua  bangunan (building.*)     hijau  alam (nature.*)
  abu          jalan (road.*)            biru   properti (prop.*/vehicle.*)
  titik putih  aktor + panah arah hadap  garis  jalur kamera (kanan→kiri = awal→akhir)
"""
from __future__ import annotations

import json
import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
PLAN_DIR = ROOT / "docs" / "plans"

BG = (18, 20, 24)
PANEL = (28, 31, 37)
GRID = (44, 48, 56)
TEXT = (226, 230, 238)
DIM = (150, 158, 172)
ACCENT = (255, 214, 102)

COLORS = {
    "building": ((92, 70, 52), (146, 110, 76)),
    "nature": ((44, 78, 52), (74, 122, 82)),
    "road": ((52, 54, 60), (88, 92, 100)),
    "prop": ((40, 62, 92), (78, 118, 168)),
    "vehicle": ((70, 52, 90), (120, 88, 158)),
}

PANEL_W, PANEL_H = 400, 440
COLS = 3
MARGIN = 24
HEADER = 78
FOOTER = 92
PAD_WORLD = 1.1  # meter ruang kosong di tepi panel


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    names = ["DejaVuSans-Bold.ttf", "DejaVuSans.ttf"] if bold else ["DejaVuSans.ttf"]
    for base in ("/usr/share/fonts/truetype/dejavu", "/usr/share/fonts/dejavu",
                 "/usr/share/fonts/truetype/liberation"):
        for n in names:
            p = Path(base) / n
            if p.exists():
                return ImageFont.truetype(str(p), size)
    return ImageFont.load_default(size)


def rot2(x: float, z: float, a: float) -> tuple[float, float]:
    return x * math.cos(a) + z * math.sin(a), -x * math.sin(a) + z * math.cos(a)


def category(asset_id: str) -> str:
    return asset_id.split(".", 1)[0]


def box_corners(b) -> list[tuple[float, float]]:
    hw, hd = b["w"] / 2, b["d"] / 2
    pts = []
    for dx, dz in ((-hw, -hd), (hw, -hd), (hw, hd), (-hw, hd)):
        rx, rz = rot2(dx, dz, b["rot"])
        pts.append((b["cx"] + rx, b["cz"] + rz))
    return pts


def tag(d: ImageDraw.ImageDraw, xy, text, fnt, color=TEXT, anchor="mm") -> None:
    """Teks dengan latar gelap supaya tetap terbaca di atas kotak."""
    x, y = xy
    l, t, r, b = d.textbbox((x, y), text, font=fnt, anchor=anchor)
    d.rounded_rectangle([l - 3, t - 1, r + 3, b + 1], radius=3, fill=(14, 15, 18))
    d.text((x, y), text, fill=color, font=fnt, anchor=anchor)


def draw_arrow(d: ImageDraw.ImageDraw, p0, p1, color, width=2, head=6) -> None:
    d.line([p0, p1], fill=color, width=width)
    ang = math.atan2(p1[1] - p0[1], p1[0] - p0[0])
    for s in (2.6, -2.6):
        d.line(
            [p1, (p1[0] + head * math.cos(ang + s), p1[1] + head * math.sin(ang + s))],
            fill=color,
            width=width,
        )


def panel(plan: dict, shot: dict) -> Image.Image:
    img = Image.new("RGBA", (PANEL_W, PANEL_H), PANEL + (255,))
    d = ImageDraw.Draw(img)
    overlay = Image.new("RGBA", (PANEL_W, PANEL_H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    small = font(12)
    bold = font(14, bold=True)

    # --- skala otomatis: semua isi shot masuk panel
    xs: list[float] = []
    zs: list[float] = []
    for b in shot["blockers"]:
        for x, z in box_corners(b):
            xs.append(x)
            zs.append(z)
    for s in shot["samples"]:
        xs.append(s["position"][0])
        zs.append(s["position"][2])
        xs.append(s["target"][0])
        zs.append(s["target"][2])
    for a in shot["actors"]:
        for p in (a["at"], a["end"]):
            xs.append(p[0])
            zs.append(p[2])
    if not xs:
        xs, zs = [-3.0, 3.0], [-3.0, 3.0]
    x0, x1 = min(xs) - PAD_WORLD, max(xs) + PAD_WORLD
    z0, z1 = min(zs) - PAD_WORLD, max(zs) + PAD_WORLD
    top = 34
    avail_w, avail_h = PANEL_W - 16, PANEL_H - top - 30
    scale = min(avail_w / (x1 - x0), avail_h / (z1 - z0))
    off_x = (PANEL_W - (x1 - x0) * scale) / 2
    off_y = top + (avail_h - (z1 - z0) * scale) / 2

    def T(x: float, z: float) -> tuple[float, float]:
        # +Z dunia = ke atas gambar (kamera menghadap +Z terlihat "maju")
        return (off_x + (x - x0) * scale, off_y + (z1 - z) * scale)

    # --- kisi 1 m
    step = 1.0 if scale * 1.0 > 14 else 5.0
    gx = math.ceil(x0 / step) * step
    while gx <= x1:
        d.line([T(gx, z0), T(gx, z1)], fill=GRID, width=1)
        gx += step
    gz = math.ceil(z0 / step) * step
    while gz <= z1:
        d.line([T(x0, gz), T(x1, gz)], fill=GRID, width=1)
        gz += step

    # --- kotak set & objek (isi transparan supaya properti di dalam tetap terlihat)
    for b in sorted(shot["blockers"], key=lambda b: -b["h"]):
        fill, line = COLORS.get(category(b["assetId"]), COLORS["prop"])
        alpha = 60 if category(b["assetId"]) in ("building", "road", "nature") else 150
        pts = [T(x, z) for x, z in box_corners(b)]
        od.polygon(pts, fill=fill + (alpha,), outline=line + (255,))
        if b.get("ref"):
            cx = sum(p[0] for p in pts) / 4
            cz = min(p[1] for p in pts) - 9
            tag(d, (cx, cz), b["ref"], small)
    img = Image.alpha_composite(img, overlay)
    d = ImageDraw.Draw(img)

    # --- aktor: titik + arah hadap + jalur travel
    for a in shot["actors"]:
        p0 = T(a["at"][0], a["at"][2])
        p1 = T(a["end"][0], a["end"][2])
        if math.hypot(p1[0] - p0[0], p1[1] - p0[1]) > 2:
            d.line([p0, p1], fill=(70, 200, 160), width=2)
        r = 5
        d.ellipse([p0[0] - r, p0[1] - r, p0[0] + r, p0[1] + r], fill=(255, 255, 255), outline=(20, 20, 20))
        fx = math.sin(a["yaw"])
        fz = math.cos(a["yaw"])
        d.line([p0, T(a["at"][0] + fx * 0.55, a["at"][2] + fz * 0.55)], fill=ACCENT, width=2)
        tag(d, (p0[0] + 8, p0[1] - 9), a["ref"], small, anchor="lm")

    # --- jalur kamera + sampel
    cam_pts = [T(s["position"][0], s["position"][2]) for s in shot["samples"]]
    if len(cam_pts) > 1:
        d.line(cam_pts, fill=(120, 190, 255), width=2)
    for i, s in enumerate(shot["samples"]):
        p = T(s["position"][0], s["position"][2])
        t = i / max(1, len(shot["samples"]) - 1)
        col = (int(120 + 130 * t), int(200 - 60 * t), int(255 - 90 * t))
        d.ellipse([p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3], fill=col)
    for s in (shot["samples"][0], shot["samples"][-1]):
        p = T(s["position"][0], s["position"][2])
        q = T(s["target"][0], s["target"][2])
        draw_arrow(d, p, q, (255, 120, 190) if s is shot["samples"][-1] else (120, 190, 255), 1, 7)

    # --- label
    d.text((10, 8), shot["id"], fill=TEXT, font=bold)
    meta = f"{shot['cameraPreset']} · {shot['durationInFrames']}f"
    near = shot.get("nearestCamera")
    if near:
        meta += f" · cam {near['clearance']:.2f} m"
    d.text((PANEL_W - 10, 10), meta, fill=DIM, font=small, anchor="ra")

    # --- skala 1 m
    bar = scale * 1.0
    if bar >= 16:
        y = PANEL_H - 16
        d.line([(12, y), (12 + bar, y)], fill=DIM, width=2)
        d.line([(12, y - 4), (12, y + 4)], fill=DIM, width=2)
        d.line([(12 + bar, y - 4), (12 + bar, y + 4)], fill=DIM, width=2)
        d.text((14 + bar, y), "1 m", fill=DIM, font=small, anchor="lm")
    d.text((PANEL_W - 10, PANEL_H - 16), "+Z ↑", fill=DIM, font=small, anchor="rm")
    return img.convert("RGB")


def render(plan: dict, out: Path) -> Path:
    shots = plan["shots"]
    rows = math.ceil(len(shots) / COLS)
    w = MARGIN * 2 + COLS * PANEL_W + (COLS - 1) * 12
    h = HEADER + rows * PANEL_H + (rows - 1) * 12 + FOOTER
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)

    story = plan["story"]
    stats = plan.get("stats", {})
    d.text((MARGIN, 16), f"DENAH — {story['title']}  ({story['id']})", fill=TEXT, font=font(22, bold=True))
    d.text(
        (MARGIN, 46),
        f"{story['fps']} fps · {stats.get('shots', len(shots))} shot · "
        f"{stats.get('cameraSamples', len(shots) * 9)} sampel kamera · "
        f"{stats.get('triangles', 0)} segitiga diperiksa · "
        f"{len(plan.get('problems', []))} masalah",
        fill=DIM,
        font=font(14),
    )

    for i, shot in enumerate(shots):
        r, c = divmod(i, COLS)
        x = MARGIN + c * (PANEL_W + 12)
        y = HEADER + r * (PANEL_H + 12)
        img.paste(panel(plan, shot), (x, y))

    legend_y = h - FOOTER + 16
    items = [
        ("bangunan", COLORS["building"][0]),
        ("alam", COLORS["nature"][0]),
        ("jalan", COLORS["road"][0]),
        ("properti", COLORS["prop"][0]),
        ("aktor", (255, 255, 255)),
        ("jalur kamera", (120, 190, 255)),
        ("arah hadap", ACCENT),
    ]
    x = MARGIN
    for label, col in items:
        d.rectangle([x, legend_y + 4, x + 14, legend_y + 18], fill=col, outline=(90, 94, 102))
        d.text((x + 20, legend_y + 11), label, fill=DIM, font=font(13), anchor="lm")
        x += 24 + d.textlength(label, font=font(13)) + 22
    d.text(
        (MARGIN, legend_y + 34),
        "Denah digambar dari docs/plans/*.json (npm run qc:plan). Kotak = kotak batas aset, "
        "bukan bentuk asli; jarak kamera diukur ke segitiga asli.",
        fill=(110, 116, 128),
        font=font(12),
    )

    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)
    return out


def main(names: list[str]) -> None:
    files = sorted(PLAN_DIR.glob("*.json"))
    if names:
        files = [f for f in files if f.stem in names]
    if not files:
        raise SystemExit("belum ada docs/plans/*.json — jalankan: npm run qc:plan")
    for f in files:
        plan = json.loads(f.read_text())
        out = render(plan, f.with_suffix(".png"))
        print(f"{plan['story']['id']}: {len(plan['shots'])} shot -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
