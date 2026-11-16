"""Minimal, strict glTF 2.0 / GLB writer with embedded PBR textures.

Only the subset the studio needs is implemented, but every field written is
spec-conformant:
  * binary chunk with 4-byte aligned bufferViews
  * POSITION accessors carry min/max (required by the spec)
  * metallic-roughness materials with base colour / normal / ORM (AO+rough+metal)
  * skins with inverse bind matrices
  * animation channels (per-bone TRS)
"""
from __future__ import annotations

import io
import json
import struct
from dataclasses import dataclass, field

import numpy as np
from PIL import Image

COMP_FLOAT = 5126
COMP_USHORT = 5123
COMP_UINT = 5125
COMP_UBYTE = 5121
ARRAY_BUFFER = 34962
ELEMENT_ARRAY_BUFFER = 34963


def _pad4(b: bytes) -> bytes:
    return b + b"\0" * ((-len(b)) % 4)


def _image_bytes(img, fmt: str = "jpg", quality: int = 90) -> tuple[bytes, str]:
    buf = io.BytesIO()
    if isinstance(img, np.ndarray):
        if img.dtype != np.uint8:
            img = np.clip(img * 255.0 + 0.5, 0, 255).astype(np.uint8)
        img = Image.fromarray(img)
    if fmt == "jpg":
        img.convert("RGB").save(buf, "JPEG", quality=quality, optimize=True, progressive=False)
        mime = "image/jpeg"
    else:
        img.save(buf, "PNG", optimize=True)
        mime = "image/png"
    return buf.getvalue(), mime


@dataclass
class Material:
    name: str
    base: np.ndarray | None = None
    normal: np.ndarray | None = None
    orm: np.ndarray | None = None
    emissive: np.ndarray | None = None
    base_color: tuple = (1.0, 1.0, 1.0, 1.0)
    metallic: float = 0.0
    roughness: float = 1.0
    normal_scale: float = 1.0
    occlusion_strength: float = 1.0
    emissive_factor: tuple = (0.0, 0.0, 0.0)
    double_sided: bool = False
    alpha_mode: str | None = None
    base_quality: int = 90
    normal_quality: int = 92
    alpha_cutoff: float | None = None


@dataclass
class Primitive:
    positions: np.ndarray  # (N,3) float32
    indices: np.ndarray  # (M,) uint32
    normals: np.ndarray | None = None
    uvs: np.ndarray | None = None
    tangents: np.ndarray | None = None
    material: int = 0
    joints: np.ndarray | None = None  # (N,4) uint8/uint16
    weights: np.ndarray | None = None  # (N,4) float32
    extra_attrs: dict = field(default_factory=dict)


@dataclass
class MeshDef:
    name: str
    primitives: list


class GLBWriter:
    def __init__(self, generator: str = "Content-Creator studio-forge"):
        self.generator = generator
        self.materials: list[Material] = []
        self.meshes: list[MeshDef] = []
        self.nodes: list[dict] = []
        self.skins: list[dict] = []
        self.animations: list[dict] = []
        self.anim_specs: list[dict] = []
        self.asset_extras: dict = {}
        self.scene_extras: dict = {}

    # ---------------------------------------------------------------- helpers
    def add_material(self, mat: Material) -> int:
        self.materials.append(mat)
        return len(self.materials) - 1

    def add_mesh(self, mesh: MeshDef) -> int:
        self.meshes.append(mesh)
        return len(self.meshes) - 1

    def add_animation(self, name: str, channels: list, loop: bool = True):
        """channels: [{node:int, path:'rotation'|'translation', times:(T,), values:(T,K)}]"""
        self.anim_specs.append({"name": name, "channels": channels, "loop": loop})

    # ------------------------------------------------------------------ write
    def write(self, path) -> dict:
        blob = bytearray()
        buffer_views: list[dict] = []
        accessors: list[dict] = []
        images: list[dict] = []
        textures: list[dict] = []
        samplers = [{"magFilter": 9729, "minFilter": 9987, "wrapS": 10497, "wrapT": 10497}]

        def add_view(data: bytes, target: int | None = None) -> int:
            blob.extend(b"\0" * ((-len(blob)) % 4))
            offset = len(blob)
            blob.extend(data)
            view = {"buffer": 0, "byteOffset": offset, "byteLength": len(data)}
            if target is not None:
                view["target"] = target
            buffer_views.append(view)
            return len(buffer_views) - 1

        def add_tex(img, fmt="jpg", quality=90) -> int:
            data, mime = _image_bytes(img, fmt, quality)
            view = add_view(data)
            images.append({"bufferView": view, "mimeType": mime, "name": f"tex{len(images)}"})
            textures.append({"sampler": 0, "source": len(images) - 1})
            return len(textures) - 1

        def add_accessor(arr: np.ndarray, typ: str, comp: int, target: int, with_minmax=False) -> int:
            arr = np.ascontiguousarray(arr)
            view = add_view(arr.tobytes(), target)
            acc = {
                "bufferView": view,
                "componentType": comp,
                "count": int(arr.shape[0]),
                "type": typ,
            }
            if with_minmax:
                mn = np.min(arr, axis=0)
                mx = np.max(arr, axis=0)
                acc["min"] = [float(x) for x in np.atleast_1d(mn)]
                acc["max"] = [float(x) for x in np.atleast_1d(mx)]
            accessors.append(acc)
            return len(accessors) - 1

        # ---- materials
        gl_materials = []
        for mat in self.materials:
            pbr: dict = {
                "baseColorFactor": list(mat.base_color),
                "metallicFactor": float(mat.metallic),
                "roughnessFactor": float(mat.roughness),
            }
            if mat.base is not None:
                is_rgba = mat.base.ndim == 3 and mat.base.shape[2] == 4
                pbr["baseColorTexture"] = {"index": add_tex(mat.base, "png" if is_rgba else "jpg", mat.base_quality)}
            if mat.orm is not None:
                tex = add_tex(mat.orm, "jpg", 92)
                pbr["metallicRoughnessTexture"] = {"index": tex}
            out = {"name": mat.name, "pbrMetallicRoughness": pbr}
            if mat.normal is not None:
                out["normalTexture"] = {
                    "index": add_tex(mat.normal, "jpg", mat.normal_quality),
                    "scale": float(mat.normal_scale),
                }
            if mat.orm is not None:
                out["occlusionTexture"] = {
                    "index": pbr["metallicRoughnessTexture"]["index"],
                    "strength": float(mat.occlusion_strength),
                }
            if mat.emissive is not None:
                out["emissiveTexture"] = {"index": add_tex(mat.emissive, "jpg", 90)}
                out["emissiveFactor"] = list(mat.emissive_factor)
            elif any(mat.emissive_factor):
                out["emissiveFactor"] = list(mat.emissive_factor)
            if mat.double_sided:
                out["doubleSided"] = True
            if mat.alpha_mode:
                out["alphaMode"] = mat.alpha_mode
            if mat.alpha_cutoff is not None:
                out["alphaCutoff"] = float(mat.alpha_cutoff)
            gl_materials.append(out)

        # ---- meshes
        gl_meshes = []
        for mesh in self.meshes:
            prims = []
            for p in mesh.primitives:
                pos = np.asarray(p.positions, dtype=np.float32)
                idx = np.asarray(p.indices, dtype=np.uint32)
                attrs = {"POSITION": add_accessor(pos, "VEC3", COMP_FLOAT, ARRAY_BUFFER, True)}
                if p.normals is not None:
                    attrs["NORMAL"] = add_accessor(np.asarray(p.normals, np.float32), "VEC3", COMP_FLOAT, ARRAY_BUFFER)
                if p.uvs is not None:
                    attrs["TEXCOORD_0"] = add_accessor(np.asarray(p.uvs, np.float32), "VEC2", COMP_FLOAT, ARRAY_BUFFER)
                if p.tangents is not None:
                    attrs["TANGENT"] = add_accessor(np.asarray(p.tangents, np.float32), "VEC4", COMP_FLOAT, ARRAY_BUFFER)
                if p.joints is not None:
                    j = np.asarray(p.joints)
                    comp = COMP_UBYTE if j.max() < 256 else COMP_USHORT
                    attrs["JOINTS_0"] = add_accessor(j.astype(np.uint8 if comp == COMP_UBYTE else np.uint16), "VEC4", comp, ARRAY_BUFFER)
                if p.weights is not None:
                    attrs["WEIGHTS_0"] = add_accessor(np.asarray(p.weights, np.float32), "VEC4", COMP_FLOAT, ARRAY_BUFFER)
                for name, (arr, typ, comp) in p.extra_attrs.items():
                    attrs[name] = add_accessor(arr, typ, comp, ARRAY_BUFFER)
                prim = {
                    "attributes": attrs,
                    "indices": add_accessor(idx, "SCALAR", COMP_UINT, ELEMENT_ARRAY_BUFFER),
                    "material": int(p.material),
                    "mode": 4,
                }
                prims.append(prim)
            gl_meshes.append({"name": mesh.name, "primitives": prims})

        # ---- skins (inverse bind matrices need accessors)
        gl_skins = []
        for skin in self.skins:
            out = {k: v for k, v in skin.items() if k != "inverseBindMatrices"}
            ibm = skin.get("inverseBindMatrices")
            if isinstance(ibm, np.ndarray):
                # glTF stores MAT4 column-major; numpy is row-major, so transpose
                # each matrix before flattening (otherwise the translation lands in
                # the bottom row and every skinned vertex pivots about the origin).
                flat = np.ascontiguousarray(
                    ibm.astype(np.float32).transpose(0, 2, 1).reshape(len(ibm), 16)
                )
                view = add_view(flat.tobytes())
                accessors.append(
                    {
                        "bufferView": view,
                        "componentType": COMP_FLOAT,
                        "count": int(flat.shape[0]),
                        "type": "MAT4",
                    }
                )
                out["inverseBindMatrices"] = len(accessors) - 1
            elif ibm is not None:
                out["inverseBindMatrices"] = ibm
            gl_skins.append(out)

        # ---- animations
        gl_anims = []
        for spec in self.anim_specs:
            samplers, chans = [], []
            for ch in spec["channels"]:
                times = np.ascontiguousarray(np.asarray(ch["times"], dtype=np.float32).ravel())
                values = np.ascontiguousarray(np.asarray(ch["values"], dtype=np.float32))
                ti = add_accessor(times, "SCALAR", COMP_FLOAT, None, True)
                vi = add_accessor(values, "VEC4" if values.shape[1] == 4 else ("VEC3" if values.shape[1] == 3 else "SCALAR"), COMP_FLOAT, None)
                samplers.append({"input": ti, "output": vi, "interpolation": "LINEAR"})
                chans.append({"sampler": len(samplers) - 1, "target": {"node": int(ch["node"]), "path": ch["path"]}})
            anim = {"name": spec["name"], "channels": chans, "samplers": samplers}
            if spec.get("loop") is not None:
                anim["extras"] = {"loop": bool(spec["loop"])}
            gl_anims.append(anim)

        # ---- nodes/scenes are provided by caller through self.nodes
        gltf = {
            "asset": {"version": "2.0", "generator": self.generator, **({"extras": self.asset_extras} if self.asset_extras else {})},
            "scene": 0,
            "scenes": [{"nodes": [n for n in self.scene_nodes], **({"extras": self.scene_extras} if self.scene_extras else {})}],
            "nodes": self.nodes,
            "meshes": gl_meshes,
            "materials": gl_materials,
            "accessors": accessors,
            "bufferViews": buffer_views,
            "buffers": [{"byteLength": len(_pad4(bytes(blob)))}],
        }
        if images:
            gltf["images"] = images
            gltf["textures"] = textures
            gltf["samplers"] = samplers
        if gl_skins:
            gltf["skins"] = gl_skins
        if gl_anims:
            gltf["animations"] = gl_anims

        bin_chunk = _pad4(bytes(blob))
        gltf["buffers"][0]["byteLength"] = len(bin_chunk)
        json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
        json_chunk = json_bytes + b" " * ((-len(json_bytes)) % 4)

        total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
        with open(path, "wb") as fh:
            fh.write(struct.pack("<III", 0x46546C67, 2, total))
            fh.write(struct.pack("<II", len(json_chunk), 0x4E4F534A))
            fh.write(json_chunk)
            fh.write(struct.pack("<II", len(bin_chunk), 0x004E4942))
            fh.write(bin_chunk)
        return gltf

    scene_nodes: list = field(default_factory=list)


# ------------------------------------------------------------------ skinning
def inverse_bind_matrices(joint_world: np.ndarray) -> np.ndarray:
    """joint_world: (J,4,4) column-major-agnostic world matrices (row-major numpy)."""
    out = np.zeros_like(joint_world, dtype=np.float32)
    for i, m in enumerate(joint_world):
        out[i] = np.linalg.inv(m)
    return out


def trs_matrix(translation, rotation_quat, scale) -> np.ndarray:
    x, y, z, w = rotation_quat
    rot = np.array(
        [
            [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
            [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
            [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
        ]
    )
    m = np.eye(4)
    m[:3, :3] = rot * np.asarray(scale)[None, :]
    m[:3, 3] = translation
    return m


def quat_from_euler(rx=0.0, ry=0.0, rz=0.0):
    cx, sx = np.cos(rx / 2), np.sin(rx / 2)
    cy, sy = np.cos(ry / 2), np.sin(ry / 2)
    cz, sz = np.cos(rz / 2), np.sin(rz / 2)
    return np.array(
        [
            sx * cy * cz + cx * sy * sz,
            cx * sy * cz - sx * cy * sz,
            cx * cy * sz + sx * sy * cz,
            cx * cy * cz - sx * sy * sz,
        ]
    )
