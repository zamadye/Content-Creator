# studio-forge — pipeline aset studio (Python, tanpa Blender)

Menghasilkan seluruh perpustakaan aset: GLB 2.0 ber-PBR, rig 163 tulang dengan 13
klip, thumbnail, dan katalog — semuanya deterministik dari kode.

```bash
python3 -m venv .venv
.venv/bin/pip install -r studio-forge/requirements.txt   # numpy + pillow

.venv/bin/python studio-forge/build.py --list             # 52 aset
.venv/bin/python studio-forge/build.py --all              # build semua (±7 menit)
.venv/bin/python studio-forge/build.py --only prop.drum,road.asphalt.wet
.venv/bin/python studio-forge/build.py --category nature --no-thumbs
.venv/bin/python studio-forge/build.py --registry-only    # hanya katalog
```

Keluaran: `public/assets/<kategori>/<id>/<id>.glb` + `thumbnail.png`,
`public/assets/registry.json`, `public/assets/index.html` (galeri),
`src/studio/registry.generated.js`, `docs/ASSET-CATALOG.md`.

## Modul

| file | isi |
|---|---|
| `forge/glb.py` | GLB 2.0 writer: buffer/accessor/mesh/material/texture, skin, animasi, ekstensi `alphaMode` |
| `forge/tex.py` | 18 preset tekstur PBR prosedural (`fbm`, `streaks`, `cracks`, `cavity_ao`, `height_to_normal`, `orm`, `text_panel`) + cache |
| `forge/kit.py` | `Builder`: box, quad, cylinder, tube, lathe, sphere, wall-with-opening, leaf card; normal/tangent |
| `forge/render.py` | path tracer sederhana untuk QC thumbnail (PBR + bayangan + fog) |
| `forge/uvpaint.py` | rasterisasi UV + kuas (ellipse, band, line, fbm, pore) |
| `forge/skinpaint.py` | pelukis kulit anatomis (pori, bibir, alis, orbital, freckles) |
| `forge/skin.py` | konversi matriks, bobot kulit, `skin_mesh` |
| `forge/human.py` | loader MakeHuman, deformer bentuk, rambut, mata, 13 klip animasi, `garment_pack` |
| `forge/assemble.py` | `write_skinned_glb` (skin + IBM + klip + anchor), `write_static_glb` |
| `forge/character.py` | 6 spesifikasi manusia + perakitan |
| `forge/entity.py` | 5 entitas (kafan, kerudung, siluet) |
| `forge/env_road.py` `env_nature.py` `env_building.py` `env_prop.py` `env_vehicle.py` | 41 aset lingkungan |
| `forge/registry.py` | katalog, render thumbnail, status jujur, provenance |
| `forge/validate.py` | inspeksi GLB (dipakai build + CI) |
| `build.py` | CLI build |
| `dev_sheet.py` | contact sheet QC ke `/tmp` (atau `docs/asset-catalog.png`) |
| `dev_pose.py` | render satu frame animasi (cek skinning tanpa engine): `dev_pose.py char.male-dewasa-polo walk 12 /tmp/p.png` (juga menerima id entity) |
| `dev_pose_sheet.py` | sheet pose → `docs/animation-poses.png` (karakter) atau `dev_pose_sheet.py docs/entity-poses.png entity` |
| `dev_preview.py` | QC karakter 3 sudut |

## Konvensi aset

* meter, **+Y** atas, menghadap **+Z**, origin di kaki, pusat `x=z=0`;
* `base` sRGB (JPEG; PNG + `alphaMode: MASK` untuk rambut/dedaunan),
  `normal` OpenGL, `orm` terkemas (R=AO, G=roughness, B=metal), `emissive` opsional;
* setiap material **wajib** punya base + normal + ORM (dijaga tes);
* rig: `studio-humanoid-v1`, 163 joint, klip 30 fps, `extras.loop` per klip;
* tidak ada geometri degenerate (silinder `p0 == p1`, torus tanpa radius) —
  normal jadi NaN dan bounding box meledak.
