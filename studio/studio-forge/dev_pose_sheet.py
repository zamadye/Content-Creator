"""QC sheet: every character in an animated pose (skinning proof, no engine).

    python3 studio-forge/dev_pose_sheet.py docs/animation-poses.png
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))

import dev_pose  # noqa: E402

CHARACTERS = [
    "char.male-dewasa-polo",
    "char.male-muda-jaket",
    "char.male-lansia-kemeja",
    "char.female-dewasa",
    "char.female-lansia",
    "char.male-pekerja",
]
ENTITIES = [
    "entity.pale-standing",
    "entity.tall-limbs",
    "entity.veiled-seated",
    "entity.child",
    "entity.shadow-crouch",
]
CLIPS = [("idle", 0), ("walk", 8), ("sit", 24)]
W, H = 240, 330


def main(out, ids=None, clips=None):
    ids = ids or CHARACTERS
    clips = clips or CLIPS
    tiles = []
    for cid in ids:
        row = []
        for clip, frame in clips:
            tmp = Path(f"/tmp/ps_{cid}_{clip}.png")
            try:
                dev_pose.main(cid, clip, frame, str(tmp))
                row.append(Image.open(tmp).convert("RGB").resize((W, H), Image.LANCZOS))
            except Exception as exc:  # keep the sheet going, report the gap
                img = Image.new("RGB", (W, H), (24, 26, 30))
                ImageDraw.Draw(img).text((8, 8), f"{cid}\n{clip}\n{exc}", fill=(255, 120, 120))
                row.append(img)
        tiles.append(row)

    sheet = Image.new("RGB", (W * len(clips), H * len(ids)), (18, 20, 24))
    for r, row in enumerate(tiles):
        for c, img in enumerate(row):
            sheet.paste(img, (c * W, r * H))
    d = ImageDraw.Draw(sheet)
    for c, (clip, frame) in enumerate(clips):
        d.text((c * W + 8, 6), f"{clip} @ frame {frame}", fill=(235, 235, 235))
    for r, cid in enumerate(ids):
        d.text((6, r * H + H - 16), cid, fill=(235, 235, 235))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(f"{out} — {sheet.width}x{sheet.height}")


if __name__ == "__main__":
    which = sys.argv[2] if len(sys.argv) > 2 else "character"
    if which == "entity":
        main(sys.argv[1] if len(sys.argv) > 1 else "docs/entity-poses.png", ids=ENTITIES, clips=[("idle", 0), ("sit", 24)])
    else:
        main(sys.argv[1] if len(sys.argv) > 1 else "docs/animation-poses.png")
