"""Pembaca GLB minimal: JSON chunk, BIN chunk, accessor, dan transform node.

Dipakai untuk mengimpor model pihak ketiga (Kenney, CC0) ke format yang bisa
dimuat studio: satu mesh per material, tanpa tekstur eksternal, pivot di alas.
"""
from __future__ import annotations

import json
import struct
from pathlib import Path

import numpy as np

F = np.float32
COMP = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NCOMP = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}


def read_glb(path: Path) -> tuple[dict, bytes]:
    raw = Path(path).read_bytes()
    if raw[:4] != b"glTF":
        raise ValueError(f"{path}: bukan GLB")
    off, js, bn = 12, None, b""
    while off < len(raw):
        ln, ty = struct.unpack("<II", raw[off : off + 8])
        chunk = raw[off + 8 : off + 8 + ln]
        if ty == 0x4E4F534A:
            js = json.loads(chunk.decode("utf8").rstrip("\x00 "))
        elif ty == 0x004E4942:
            bn = chunk
        off += 8 + ln
    return js, bn


def accessor(js: dict, bn: bytes, index: int) -> np.ndarray:
    acc = js["accessors"][index]
    n = NCOMP[acc["type"]]
    dtype = np.dtype(COMP[acc["componentType"]])
    count = acc["count"]
    bv = js["bufferViews"][acc["bufferView"]]
    base = bv.get("byteOffset", 0) + acc.get("byteOffset", 0)
    stride = bv.get("byteStride") or dtype.itemsize * n
    buf = np.frombuffer(bn, dtype=np.uint8, count=stride * count, offset=base).reshape(count, stride)
    out = buf[:, : dtype.itemsize * n].copy().view(dtype).reshape(count, n)
    return out.astype(np.float64) if dtype.kind == "f" else out.astype(np.int64)


def node_matrix(node: dict) -> np.ndarray:
    if "matrix" in node:
        return np.array(node["matrix"], F).reshape(4, 4).T
    t = np.eye(4, dtype=F)
    if "scale" in node:
        s = np.array(node["scale"], F)
        t = np.diag(np.append(s, 1.0)).astype(F)
    if "rotation" in node:
        x, y, z, w = node["rotation"]
        r = np.array(
            [
                [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 0],
                [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 0],
                [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), 0],
                [0, 0, 0, 1],
            ],
            F,
        )
        t = r @ t
    if "translation" in node:
        tr = np.eye(4, dtype=F)
        tr[:3, 3] = np.array(node["translation"], F)
        t = tr @ t
    return t


def walk_nodes(js: dict):
    """Yield (matrix, mesh_index) untuk setiap node mesh, dengan transform terakumulasi."""
    nodes = js.get("nodes", [])
    scene = js.get("scenes", [{}])[js.get("scene", 0)]
    roots = scene.get("nodes", list(range(len(nodes))))

    def rec(i, parent):
        node = nodes[i]
        m = parent @ node_matrix(node)
        if "mesh" in node:
            yield m, node["mesh"]
        for c in node.get("children", []):
            yield from rec(c, m)

    for r in roots:
        yield from rec(r, np.eye(4, dtype=F))


def load_meshes(path: Path):
    """Kembalikan list primitif: {pos, nrm, uv, idx, material_name, base_color}."""
    js, bn = read_glb(path)
    mats = js.get("materials", [])
    prims = []
    for matrix, mesh_index in walk_nodes(js):
        for prim in js["meshes"][mesh_index]["primitives"]:
            mode = prim.get("mode", 4)
            if mode != 4:
                continue
            attr = prim["attributes"]
            pos = accessor(js, bn, attr["POSITION"])
            nrm = accessor(js, bn, attr["NORMAL"]) if "NORMAL" in attr else None
            uv = accessor(js, bn, attr["TEXCOORD_0"]) if "TEXCOORD_0" in attr else None
            idx = accessor(js, bn, prim["indices"]).ravel() if "indices" in prim else np.arange(len(pos))
            pos = pos @ matrix[:3, :3].T + matrix[:3, 3]
            if nrm is not None:
                nrm = nrm @ np.linalg.inv(matrix[:3, :3]).T
                nrm /= np.maximum(np.linalg.norm(nrm, axis=1, keepdims=True), 1e-9)
            mi = prim.get("material")
            mat = mats[mi] if mi is not None and mi < len(mats) else {}
            pbr = mat.get("pbrMetallicRoughness", {})
            prims.append(
                {
                    "pos": pos.astype(F),
                    "nrm": None if nrm is None else nrm.astype(F),
                    "uv": None if uv is None else uv.astype(F),
                    "idx": np.asarray(idx, np.int64),
                    "material": mat.get("name", f"mat{mi}"),
                    "base": np.array(pbr.get("baseColorFactor", [1, 1, 1, 1])[:3], F),
                    "metallic": float(pbr.get("metallicFactor", 1.0)),
                    "roughness": float(pbr.get("roughnessFactor", 1.0)),
                    "double": bool(mat.get("doubleSided", False)),
                    "emissive": np.array(mat.get("emissiveFactor", [0, 0, 0]), F),
                }
            )
    return prims
