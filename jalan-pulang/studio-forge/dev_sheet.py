"""Contact sheet of every thumbnail in public/assets/registry.json (dev QC)."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUB = ROOT / "public"


def sheet(category=None, cell=190, cols=6, out="/tmp/sheet.png"):
    reg = json.loads((PUB / "assets/registry.json").read_text())
    items = [(k, v) for k, v in sorted(reg["assets"].items()) if not category or v["category"] == category]
    rows = (len(items) + cols - 1) // cols
    W, H = cols * cell, rows * (cell + 18)
    img = Image.new("RGB", (W, H), (24, 24, 26))
    d = ImageDraw.Draw(img)
    for i, (aid, e) in enumerate(items):
        x = (i % cols) * cell
        y = (i // cols) * (cell + 18)
        p = PUB / e["thumbnail"]
        if p.exists():
            t = Image.open(p).convert("RGB").resize((cell - 6, cell - 6))
            img.paste(t, (x + 3, y + 3))
        d.text((x + 6, y + cell + 2), aid[:30], fill=(220, 220, 210))
    img.save(out)
    print(out, len(items))


if __name__ == "__main__":
    sheet(sys.argv[1] if len(sys.argv) > 1 else None, out=sys.argv[2] if len(sys.argv) > 2 else "/tmp/sheet.png")
