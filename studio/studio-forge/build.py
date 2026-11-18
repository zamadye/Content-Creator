#!/usr/bin/env python3
"""Build the studio asset library.

    python3 studio-forge/build.py --list
    python3 studio-forge/build.py --all
    python3 studio-forge/build.py --only char.male-dewasa-polo,nature.tree.karet
    python3 studio-forge/build.py --category nature --no-thumbs

Outputs public/assets/<category>/<asset-id>/{<asset-id>.glb,thumbnail.png} plus
public/assets/registry.json and docs/ASSET-CATALOG.md.
"""
from __future__ import annotations

import argparse
import json
import hashlib
import sys
import time
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from forge import character, entity, registry, validate  # noqa: E402

ASSET_ROOT = registry.ASSET_ROOT
DOCS = HERE.parent / "docs"


def list_assets():
    items = []
    for aid, spec in character.SPECS.items():
        items.append((aid, "character", spec["title"]))
    for aid, spec in entity.SPECS.items():
        items.append((aid, "entity", spec["title"]))
    for cat, group in registry.STATIC_GROUPS.items():
        for aid, meta in group.items():
            items.append((aid, meta.get("category", cat), meta["title"]))
    return items


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--only", default="")
    ap.add_argument("--category", default="")
    ap.add_argument("--no-thumbs", action="store_true")
    ap.add_argument("--skin-size", type=int, default=2048)
    ap.add_argument("--registry-only", action="store_true", help="rebuild registry.json from existing files")
    args = ap.parse_args(argv)

    every = registry.all_assets()
    if args.list:
        for aid, cat, title in list_assets():
            print(f"{aid:38s} {cat:10s} {title}")
        print(f"\n{len(every)} aset")
        return 0

    if args.registry_only:
        write_registry(rebuild_entries=True)
        return 0

    targets = []
    if args.all:
        targets = list(every)
    else:
        if args.only:
            targets += [t.strip() for t in args.only.split(",") if t.strip()]
        if args.category:
            targets += [aid for aid, info in every.items() if info["spec"].get("category") == args.category or info["kind"] == args.category]
    if not targets:
        ap.print_help()
        return 2
    unknown = [t for t in targets if t not in every]
    if unknown:
        raise SystemExit(f"unknown asset(s): {unknown}")

    results = {}
    t_start = time.time()
    for aid in targets:
        info = every[aid]
        spec = info["spec"]
        category = spec.get("category", "character" if info["kind"] == "character" else "prop")
        if info["kind"] in ("character", "entity"):
            base = "characters" if info["kind"] == "character" else "entities"
            folder = ASSET_ROOT / base / aid
            meta = registry.build_character(aid, spec, folder, size=args.skin_size, thumb=not args.no_thumbs)
            meta["rig"] = "studio-humanoid-v1"
        else:
            folder = ASSET_ROOT / category / aid
            meta = registry.build_static(aid, spec, folder, thumb=not args.no_thumbs)
            meta["tags"] = spec.get("tags", [])
            meta["title"] = spec["title"]
        rep = validate.inspect(folder / f"{aid}.glb")
        meta["validate"] = rep
        results[aid] = (category, meta)
        flag = "OK " if not rep["problems"] else "BAD"
        print(
            f"[{flag}] {aid:38s} {meta['size']/1024/1024:6.2f} MB  {meta.get('tris',0):6d} tris  "
            f"{rep['images']} tex  {rep['materials']} mat  {len(rep['animations'])} anim  {meta['seconds']:5.1f}s"
        )
        for p in rep["problems"]:
            print("      problem:", p)

    total = sum(m["size"] for _, m in results.values())
    print(f"\n{len(results)} aset, {total/1024/1024:.1f} MB, {time.time()-t_start:.0f}s")
    write_registry()
    return 0


def write_registry(rebuild_entries=False):
    every = registry.all_assets()
    entries = {}
    reviews = json.loads((HERE.parent / "data/character-reviews.json").read_text())
    for aid, info in every.items():
        spec = info["spec"]
        kind = info["kind"]
        if kind == "character":
            category = "character"
            folder = ASSET_ROOT / "characters" / aid
        elif kind == "entity":
            category = "entity"
            folder = ASSET_ROOT / "entities" / aid
        else:
            category = spec.get("category", "prop")
            folder = ASSET_ROOT / category / aid
        glb = folder / f"{aid}.glb"
        if not glb.exists():
            continue
        rep = validate.inspect(glb)
        meta = {
            "tags": spec.get("tags", []),
            "bounds": _bounds_from_glb(glb),
            "tris": _tris(glb),
            "size": glb.stat().st_size,
            "clips": rep["animations"],
            "anchors": rep["anchors"],
            "materials": sorted({m.get("name") for m in _gltf(glb).get("materials", [])}),
            "bones": len(_gltf(glb).get("skins", [{}])[0].get("joints", [])) if rep["skins"] else None,
        }
        e = registry.entry_for(aid, category, spec["title"], meta, folder)
        e["pbr"] = {
            "baseColor": any("baseColorTexture" in m.get("pbrMetallicRoughness", {}) for m in _gltf(glb).get("materials", [])),
            "normal": any("normalTexture" in m for m in _gltf(glb).get("materials", [])),
            "metallicRoughness": any("metallicRoughnessTexture" in m.get("pbrMetallicRoughness", {}) for m in _gltf(glb).get("materials", [])),
            "emissive": any("emissiveFactor" in m for m in _gltf(glb).get("materials", [])),
            "embeddedTextures": len(_gltf(glb).get("images", [])),
        }
        if kind == "character":
            # Tokoh: profil umur, outfit yang dipakai, dan peta varian outfit
            # supaya cerita bisa menukar kostum tanpa asset baru.
            for key, spec_key in (("profile", "profile"), ("outfit", "outfit"), ("variantOf", "variant_of")):
                if spec.get(spec_key):
                    e[key] = spec[spec_key]
            variants = character.OUTFIT_VARIANTS.get(aid)
            if variants:
                e["outfits"] = dict(variants)
        if kind in ("character", "entity"):
            review = reviews.get(aid, {})
            digest = hashlib.sha256(glb.read_bytes()).hexdigest()
            if review.get("sha256") == digest and review.get("status") in ("review", "draft", "approved"):
                e["review"] = {"sha256": digest, "note": review["note"]}
                e["status"] = review["status"]
        if rep["problems"]:
            e["status"] = "draft"
            e["problems"] = rep["problems"]
        entries[aid] = e

    doc = {
        "schema": "studio.registry/2",
        "units": "metre",
        "up": "+Y",
        "forward": "+Z",
        "generatedBy": "studio-forge/build.py",
        "notes": "Status draft/review/approved berlaku jujur. Lihat docs/ASSET-CATALOG.md dan PROVENANCE per kategori.",
        "categories": sorted({e["category"] for e in entries.values()}),
        "assets": entries,
    }
    js_out = HERE.parent / "src" / "studio" / "registry.generated.js"
    js_out.parent.mkdir(parents=True, exist_ok=True)
    js_out.write_text(
        "// AUTO-GENERATED by studio-forge/build.py -- do not edit.\n"
        "// Source of truth: public/assets/registry.json\n"
        "export default " + json.dumps(doc, indent=1, ensure_ascii=False) + ";\n"
    )
    out = ASSET_ROOT / "registry.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    print(f"registry: {out.relative_to(HERE.parent)} ({len(entries)} aset)")
    write_catalog(doc)
    write_gallery(doc)
    return doc


def _gltf(glb):
    doc, _, _, _ = validate.read_glb(glb)
    return doc


def _tris(glb):
    doc = _gltf(glb)
    total = 0
    for mesh in doc.get("meshes", []):
        for p in mesh.get("primitives", []):
            idx = p.get("indices")
            if idx is not None:
                total += doc["accessors"][idx]["count"] // 3
    return total


def _bounds_from_glb(glb):
    doc = _gltf(glb)
    mn = np.array([np.inf] * 3)
    mx = np.array([-np.inf] * 3)
    for mesh in doc.get("meshes", []):
        for p in mesh.get("primitives", []):
            acc = doc["accessors"][p["attributes"]["POSITION"]]
            mn = np.minimum(mn, np.array(acc.get("min", [0, 0, 0])))
            mx = np.maximum(mx, np.array(acc.get("max", [0, 0, 0])))
    if not np.isfinite(mn).all():
        return None
    return {"min": [round(float(v), 3) for v in mn], "max": [round(float(v), 3) for v in mx], "size": [round(float(v), 3) for v in (mx - mn)]}


def write_catalog(doc):
    DOCS.mkdir(exist_ok=True)
    rows = []
    for cat in doc["categories"]:
        rows.append(f"\n## {cat}\n")
        rows.append("| ID | Judul | Ukuran (m) | Tris | Tekstur | Rig/Klip | Status |")
        rows.append("|----|-------|-----------|------|---------|----------|--------|")
        for aid, e in sorted(doc["assets"].items()):
            if e["category"] != cat:
                continue
            size = e.get("bounds", {}).get("size") if e.get("bounds") else None
            dims = "×".join(f"{v:g}" for v in size) if size else "-"
            pbr = e.get("pbr", {})
            tex = sum(bool(pbr.get(k)) for k in ("baseColor", "normal", "metallicRoughness"))
            rig = e.get("rig")
            rig_txt = f"{rig['bones']} tulang · {', '.join(rig['clips'])}" if rig else ("anchor: " + ", ".join(e.get("anchors", [])) if e.get("anchors") else "-")
            rows.append(f"| `{aid}` | {e['title']} | {dims} | {e.get('tris') or '-'} | {tex}/3 (+{pbr.get('embeddedTextures',0)} peta) | {rig_txt} | {e['status']} |")
    head = (
        "# KATALOG ASET (dibuat otomatis)\n\n"
        "Jangan edit manual: jalankan `python3 studio-forge/build.py --all`.\n"
        "Sumber kebenaran runtime adalah `public/assets/registry.json`.\n\n"
        f"Total: **{len(doc['assets'])} aset**. Unit meter, +Y atas, aset menghadap +Z.\n"
    )
    (DOCS / "ASSET-CATALOG.md").write_text(head + "\n".join(rows) + "\n")


def write_gallery(doc):
    """Static catalogue browser: public/assets/index.html (no build step)."""
    cards = []
    for aid, e in sorted(doc["assets"].items()):
        size = e.get("bounds", {}).get("size") if e.get("bounds") else None
        dims = "×".join(f"{v:g}" for v in size) if size else "-"
        tags = " ".join(e.get("tags", [])[:4])
        rig = f"{e['rig']['bones']} tulang · {len(e['rig']['clips'])} klip" if e.get("rig") else ""
        inspect = f'<p><a href="/#karakter/{aid}">Uji karakter 3D →</a></p>' if e["category"] in ("character", "entity") else ""
        cards.append(
            f'<article class="card" data-cat="{e["category"]}" data-q="{aid} {e["title"]} {tags}">'
            f'<img loading="lazy" src="{aid and e["thumbnail"].split("/", 1)[1]}" alt="">'
            f'<div class="meta"><h3>{e["title"]}</h3><code>{aid}</code>'
            f'<p>{dims} m · {e.get("tris") or "-"} tris · {(e.get("bytes") or 0)/1048576:.2f} MB</p>'
            f'<p class="tags">{tags}{(" · " + rig) if rig else ""}</p>'
            f'{inspect}<span class="status {e["status"]}">{e["status"]}</span></div></article>'
        )
    cats = "".join(f'<option value="{c}">{c}</option>' for c in doc["categories"])
    html = f"""<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Katalog Aset — {len(doc['assets'])} aset</title>
<style>
 :root {{ color-scheme: dark; }}
 * {{ box-sizing: border-box; }}
 body {{ margin:0; background:#0c0f12; color:#e8e6df; font:15px/1.5 system-ui, sans-serif; }}
 header {{ padding:28px 32px 10px; }}
 h1 {{ margin:0 0 4px; font-size:22px; letter-spacing:-.01em; }}
 header p {{ margin:0; color:#8e9aa2; font-size:13px; }}
 .bar {{ display:flex; gap:10px; padding:14px 32px 8px; flex-wrap:wrap; position:sticky; top:0; background:#0c0f12e6; backdrop-filter:blur(6px); z-index:5; }}
 select, input {{ background:#151a1f; color:#e8e6df; border:1px solid #263038; border-radius:8px; padding:8px 12px; font:inherit; }}
 input {{ flex:1; min-width:180px; }}
 .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; padding:10px 32px 48px; }}
 .card {{ background:#12171c; border:1px solid #1e262d; border-radius:12px; overflow:hidden; display:flex; flex-direction:column; }}
 .card img {{ width:100%; aspect-ratio:1; object-fit:cover; background:#0a0d10; display:block; }}
 .meta {{ padding:10px 12px 14px; position:relative; }}
 .meta h3 {{ margin:0 0 2px; font-size:14px; font-weight:600; }}
 .meta code {{ font-size:11px; color:#7fb8a0; }}
 .meta p {{ margin:4px 0 0; font-size:11.5px; color:#8e9aa2; }}
 .card a {{ color:#a5d5b7; }}
 .tags {{ color:#65727c !important; }}
 .status {{ position:absolute; top:8px; right:10px; font-size:10px; text-transform:uppercase; letter-spacing:.06em; padding:2px 6px; border-radius:99px; background:#2a3540; color:#9fb0bd; }}
 .status.approved {{ background:#1e4034; color:#7fe0b0; }}
 .status.draft {{ background:#4a2a20; color:#e0a081; }}
</style></head><body>
<header><h1>Katalog Aset Studio</h1>
<p>{len(doc['assets'])} aset · meter · +Y atas · menghadap +Z · dibuat dari <code>public/assets/registry.json</code></p></header>
<div class="bar"><select id="cat"><option value="">semua kategori</option>{cats}</select>
<input id="q" placeholder="cari id, judul, tag…"><span id="count" style="align-self:center;color:#8e9aa2;font-size:13px"></span></div>
<div class="grid" id="grid">{''.join(cards)}</div>
<script>
 const cards=[...document.querySelectorAll('.card')],cat=document.getElementById('cat'),q=document.getElementById('q'),count=document.getElementById('count');
 const apply=()=>{{const c=cat.value,t=q.value.toLowerCase();let n=0;
  for(const el of cards){{const ok=(!c||el.dataset.cat===c)&&(!t||el.dataset.q.toLowerCase().includes(t));el.style.display=ok?'':'none';if(ok)n++;}}
  count.textContent=n+' aset';}};
 cat.oninput=apply;q.oninput=apply;apply();
</script></body></html>"""
    (ASSET_ROOT / "index.html").write_text(html)


if __name__ == "__main__":
    raise SystemExit(main())
