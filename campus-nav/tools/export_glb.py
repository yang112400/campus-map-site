#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""B 栋结构 v4 -> glTF 2.0 二进制 (.glb) 最小导出器

只读 assets/b-building-data.js，只写 handoff/b-building.glb。
只用标准库（struct / json）手工拼 GLB，不依赖 trimesh / pygltflib / numpy。

几何约定
    · 每个建筑元素 = 一个盒子 mesh（局部居中）+ 一个 node（node 只带平移）
    · 默认每个盒子 8 个顶点 / 12 个三角面，不写 NORMAL
      （glTF 2.0：未提供 NORMAL 时由客户端计算平面法线；Blender 面法线就是 flat，
        three.js GLTFLoader 会置 material.flatShading = true）
    · --verts 24 时改为每面 4 顶点 + 显式法线，兼容不支持缺省法线的引擎

坐标系（默认，见 handoff/B_GLB_README.md）
    gltf_x = data_x                    （0 = 建筑西端）
    gltf_z = data_z - 20.0             （0 = 南墙；-z 朝北）
    gltf_y = floor.displayY            （F1 = 2.2，F7 = 38.2）
    于是建筑 SW 角正好落在 (0, ·, 0)；--raw 保留数据原始 z，不做 -20 平移。

用法
    python tools/export_glb.py                     # 导出 + 读回校验
    python tools/export_glb.py --check             # 只校验已有的 .glb
    python tools/export_glb.py --alpha 0.6         # 半透明材质
    python tools/export_glb.py --verts 24          # 显式法线版
    python tools/export_glb.py --raw               # 保留数据原始 z
    python tools/export_glb.py --ground-align      # 最低楼板底面贴 y=0
    python tools/export_glb.py --no-entrances      # 不导出入口标记
"""

import argparse
import json
import os
import struct
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)                                  # demo/
DATA_JS = os.path.join(ROOT, "assets", "b-building-data.js")
DEFAULT_OUT = os.path.join(ROOT, "handoff", "b-building.glb")

# --------------------------------------------------------------------------
# 几何常量（米）—— 与 3d.html / gen_b_data_v4.py 的约定保持一致
# --------------------------------------------------------------------------
LENGTH = 270.0                 # 建筑总长（x）
SLAB_T = 0.60                  # 楼板厚（3d.html 用 0.6）
SLAB_Z = (-20.0, 20.0)         # 南楼楼板进深 40m（3d.html SOUTH.z0/z1）
CORR_D = 4.0                   # 走廊进深（= 宽）
CORR_T = 0.12                  # 走廊薄盒厚（3d.html 用 0.12）
ROOM_W = 15.5                  # 教室面宽（列距 16.875 留 1.375m 缝）
ROOM_GAP = 0.80                # 相邻教室至少留的缝（列距过近时自动收窄）
ROOM_D = 8.0                   # 教室进深（数据估算值）
ROOM_H = 3.4                   # 教室体块高（示意，不是层高 5.71）
CORE_W = 6.0                   # 楼梯 core 面宽
CORE_D = 6.0                   # 楼梯 core 进深
CORE_H = 3.4
LIFT_W = 3.0                   # 电梯井面宽（3d.html 用 3×3×3）
LIFT_H = 3.4
ENT_W = 2.6                    # 入口标记
ENT_H = 5.0
MIN_SIZE = 0.40                # 裁剪后的最小盒子尺寸
NORTH_Z1 = -40.5               # 北楼楼板南边（同 3d.html NORTH.z1）
NORTH_MARGIN = 2.0             # 北楼楼板在教室包围盒外扩
SOUTH_Z_SHIFT = 20.0           # 默认把南墙放到 z=0（data_z - 20）

KIND_ORDER = ["slab", "corridor", "room", "stair_core", "elevator", "entrance"]
KIND_LABEL = {
    "slab": "slab",
    "corridor": "corridor",
    "room": "room",
    "stair_core": "stair",
    "elevator": "lift",
    "entrance": "entry",
}

# 材质：(名称, kind, sRGB, roughness, metallic) —— 取 3d.html 的配色
MATERIAL_DEFS = [
    ("mat_slab", "slab", 0x0D2040, 0.85, 0.05),          # 楼板：深蓝
    ("mat_room", "room", 0x1F6FD0, 0.60, 0.10),          # 教室：蓝
    ("mat_corridor", "corridor", 0x1B3A5A, 0.80, 0.05),  # 走廊：灰蓝
    ("mat_stair", "stair_core", 0x3DDC84, 0.70, 0.05),   # 楼梯：绿
    ("mat_elevator", "elevator", 0x5A6ADE, 0.60, 0.10),  # 电梯：紫
    ("mat_entrance", "entrance", 0xFFB020, 0.70, 0.05),  # 入口标记（辅助）
]


# --------------------------------------------------------------------------
# 小工具
# --------------------------------------------------------------------------
def log(msg=""):
    """ASCII/GBK 都能输出的安全打印。"""
    print(msg, flush=True)


def r(v, nd=4):
    """统一取小数位，避免 JSON 里出现 -0.0 和长尾浮点。"""
    v = round(float(v) + 0.0, nd)
    return 0.0 if v == 0 else v


def f32(v):
    """取 float32 精确值（accessor min/max 必须和缓冲区里的数一致）。"""
    return struct.unpack("<f", struct.pack("<f", float(v)))[0]


def srgb_to_linear(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_linear_rgba(hex_value, alpha=1.0):
    rgb = [((hex_value >> 16) & 0xFF), ((hex_value >> 8) & 0xFF), (hex_value & 0xFF)]
    return [round(srgb_to_linear(v), 6) for v in rgb] + [round(float(alpha), 4)]


def clip_span(a, b, lo, hi, min_size=MIN_SIZE):
    """把 [a, b] 裁进 [lo, hi]；裁到太小就整体挪进去（保持最小尺寸）。"""
    a2, b2 = max(a, lo), min(b, hi)
    if b2 - a2 < min_size:
        if a <= lo:
            a2, b2 = lo, min(hi, lo + min_size)
        else:
            a2, b2 = max(lo, hi - min_size), hi
    return a2, b2


def clamp_center(c, half, lo, hi):
    """把盒子中心夹进 [lo+half, hi-half]，保证整盒不出界。"""
    return min(max(c, lo + half), hi - half)


# --------------------------------------------------------------------------
# 读数据（不执行 JS，只把 window.B_BUILDING_DATA = {...}; 抠出来当 JSON 解析）
# --------------------------------------------------------------------------
def load_building_data(path=DATA_JS):
    with open(path, "r", encoding="utf-8") as fh:
        text = fh.read()
    marker = "window.B_BUILDING_DATA"
    idx = text.find(marker)
    if idx < 0:
        raise SystemExit("未在 %s 里找到 %s" % (path, marker))
    start, end = text.find("{", idx), text.rfind("}")
    if start < 0 or end <= start:
        raise SystemExit("%s 里的 B_BUILDING_DATA 不是对象字面量" % path)
    data = json.loads(text[start:end + 1])
    meta = data.get("meta", {})
    mtime = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(os.path.getmtime(path)))
    log("[data] %s  version=%s rooms=%s nodes=%s floors=%s  mtime=%s"
        % (os.path.basename(path), meta.get("version"), len(data.get("rooms", [])),
           len(data.get("nodes", [])), len(data.get("floors", [])), mtime))
    return data


# --------------------------------------------------------------------------
# 盒子
# --------------------------------------------------------------------------
def make_box(name, kind, material, cx, cy, cz, w, h, d, extras=None):
    """一个盒子。尺寸只防退化（1mm），走廊 0.12m 这类薄盒按原值保留。"""
    return {
        "name": name,
        "kind": kind,
        "material": material,
        "c": (r(cx), r(cy), r(cz)),
        "s": (r(max(w, 0.001)), r(max(h, 0.001)), r(max(d, 0.001))),
        "extras": extras or {},
    }


def _node_extras(**kw):
    return {k: v for k, v in kw.items() if v is not None}


def build_model(data, with_entrances=True):
    """把 v4 数据展开成 [{id, extras, boxes}]，每个元素一个盒子。"""
    floors = data.get("floors", [])
    nodes = data.get("nodes", [])
    rooms = data.get("rooms", [])
    cores = data.get("cores", [])
    lifts = data.get("elevators", [])
    ents = data.get("entrances", [])

    groups = []
    for fl in floors:
        fid = fl["id"]
        wing = fl.get("wing", "S")
        dy = r(fl.get("displayY", 0.0))
        level = fl.get("level")
        boxes = []
        fl_rooms = sorted([rm for rm in rooms if rm.get("floor") == fid],
                          key=lambda rm: rm["x"])

        corr_nodes = [n for n in nodes
                      if n.get("type") == "corridor" and n.get("floor") == fid]
        if wing == "N":
            corr_xs = sorted({r(n["x"]) for n in corr_nodes})
            corr_z = r(corr_nodes[0]["z"]) if corr_nodes else -50.0
            if len(corr_xs) > 1:
                pitch = (corr_xs[-1] - corr_xs[0]) / (len(corr_xs) - 1)
                corr_x0, corr_x1 = corr_xs[0] - pitch / 2, corr_xs[-1] + pitch / 2
            elif corr_xs:
                corr_x0, corr_x1 = corr_xs[0] - 7.8, corr_xs[0] + 7.8
            else:
                corr_x0, corr_x1 = 52.2, 130.2
            slab_x0, slab_x1 = corr_x0 - NORTH_MARGIN, corr_x1 + NORTH_MARGIN
            if fl_rooms:
                slab_z0 = min(rm["z"] for rm in fl_rooms) - ROOM_D / 2 - NORTH_MARGIN
            else:
                slab_z0 = corr_z - 9.5
            slab_z1 = NORTH_Z1
        else:
            corr_x0, corr_x1, corr_z = 0.0, LENGTH, 0.0
            slab_x0, slab_x1 = 0.0, LENGTH
            slab_z0, slab_z1 = SLAB_Z

        # ---- 楼板 ----
        boxes.append(make_box(
            "%s_slab" % fid, "slab", "mat_slab",
            (slab_x0 + slab_x1) / 2, dy, (slab_z0 + slab_z1) / 2,
            slab_x1 - slab_x0, SLAB_T, slab_z1 - slab_z0,
            _node_extras(kind="slab", floor=fid, level=level, wing=wing,
                         displayY=dy, elevation=r(fl.get("elevation", 0.0)),
                         note="slab %.1f x %.1f m, %.2f m thick"
                              % (slab_x1 - slab_x0, slab_z1 - slab_z0, SLAB_T))))

        # ---- 走廊（薄盒，坐在楼板顶面） ----
        boxes.append(make_box(
            "%s_corridor" % fid, "corridor", "mat_corridor",
            (corr_x0 + corr_x1) / 2, dy + SLAB_T / 2 + CORR_T / 2, corr_z,
            corr_x1 - corr_x0, CORR_T, CORR_D,
            _node_extras(kind="corridor", floor=fid, level=level, wing=wing,
                         dataZ=corr_z,
                         note="thin slab %.1f x %.1f m" % (corr_x1 - corr_x0, CORR_D))))

        # ---- 教室（相邻列距不足 15.5m 时按中点收窄，保证不互相穿插） ----
        col_xs = [rm["x"] for rm in fl_rooms]
        for i, rm in enumerate(fl_rooms):
            label = rm.get("label") or rm.get("id")
            half = ROOM_W / 2.0
            x0, x1 = rm["x"] - half, rm["x"] + half
            if i > 0:
                x0 = max(x0, (rm["x"] + col_xs[i - 1]) / 2.0 + ROOM_GAP / 2.0)
            if i + 1 < len(col_xs):
                x1 = min(x1, (rm["x"] + col_xs[i + 1]) / 2.0 - ROOM_GAP / 2.0)
            x0, x1 = clip_span(x0, x1, 0.0, LENGTH)
            boxes.append(make_box(
                "%s_room_%s" % (fid, label), "room", "mat_room",
                (x0 + x1) / 2, dy + SLAB_T / 2 + ROOM_H / 2, r(rm["z"]),
                x1 - x0, ROOM_H, ROOM_D,
                _node_extras(kind="room", floor=fid, level=level, wing=wing,
                             dataId=rm.get("node"), label=label,
                             dataX=r(rm["x"]), dataZ=r(rm["z"]),
                             width=round(x1 - x0, 2),
                             aliases=rm.get("aliases") or None,
                             confidence=rm.get("confidence"))))

        # ---- 楼梯 core（数据 cores，按楼层） ----
        for c in cores:
            if c.get("floor") != fid:
                continue
            cx = clamp_center(c["x"], CORE_W / 2.0, 0.0, LENGTH)
            boxes.append(make_box(
                c["node"], "stair_core", "mat_stair",
                cx, dy + SLAB_T / 2 + CORE_H / 2, r(c["z"]),
                CORE_W, CORE_H, CORE_D,
                _node_extras(kind="stair_core", core=c.get("id"), floor=fid,
                             level=level, dataId=c["node"],
                             dataX=r(c["x"]), dataZ=r(c["z"]),
                             note="footprint estimated, x = mean of source columns")))

        # ---- 电梯井 ----
        for e in lifts:
            if e.get("floor") != fid:
                continue
            cx = clamp_center(e["x"], LIFT_W / 2.0, 0.0, LENGTH)
            boxes.append(make_box(
                e["node"], "elevator", "mat_elevator",
                cx, dy + SLAB_T / 2 + LIFT_H / 2, r(e["z"]),
                LIFT_W, LIFT_H, LIFT_W,
                _node_extras(kind="elevator", shaft=e.get("id"), floor=fid,
                             level=level, dataId=e["node"],
                             dataX=r(e["x"]), dataZ=r(e["z"]),
                             note="shaft position from data; may overlap a stair core")))

        groups.append({
            "id": fid,
            "extras": _node_extras(kind="floor", floor=fid, level=level, wing=wing,
                                   displayY=dy, elevation=r(fl.get("elevation", 0.0)),
                                   rooms=len(fl_rooms)),
            "boxes": boxes,
        })

    # ---- 入口（单独一组：数据里 entrance.floor 是所挂房间的楼层，不是入口高度） ----
    if with_entrances and ents:
        base_y = min(r(f.get("displayY", 0.0)) for f in floors) if floors else 0.0
        ent_y = base_y + SLAB_T / 2 + ENT_H / 2
        boxes = []
        for e in ents:
            x = e.get("x", 0.0)
            x0, x1 = clip_span(x - ENT_W / 2, x + ENT_W / 2, 0.0, LENGTH)
            boxes.append(make_box(
                e["node"], "entrance", "mat_entrance",
                (x0 + x1) / 2, ent_y, r(e.get("z", 0.0)),
                x1 - x0, ENT_H, ENT_W,
                _node_extras(kind="entrance", dataId=e["node"], attach=e.get("attach"),
                             floor=e.get("floor"), dataX=r(x), dataZ=r(e.get("z", 0.0)),
                             lat=e.get("lat"), lon=e.get("lon"), factor=e.get("factor"),
                             note="marker only; drawn at ground level (F1 displayY)")))
        groups.append({
            "id": "ENTRANCES",
            "extras": _node_extras(kind="group", note="entrances at ground level"),
            "boxes": boxes,
        })

    return groups


# --------------------------------------------------------------------------
# glTF / GLB 生成
# --------------------------------------------------------------------------
BOX_CORNERS = ((-0.5, -0.5, -0.5), (0.5, -0.5, -0.5), (0.5, 0.5, -0.5), (-0.5, 0.5, -0.5),
               (-0.5, -0.5, 0.5), (0.5, -0.5, 0.5), (0.5, 0.5, 0.5), (-0.5, 0.5, 0.5))

# 12 个三角面（CCW = 正面，朝外）
BOX_TRIS = ((4, 5, 6), (4, 6, 7), (1, 0, 3), (1, 3, 2), (1, 2, 6), (1, 6, 5),
            (0, 7, 3), (0, 4, 7), (3, 6, 2), (3, 7, 6), (0, 1, 5), (0, 5, 4))

# 24 顶点模式：每面 4 个顶点绕序 + 面法线
BOX_FACES = (((4, 5, 6, 7), (0.0, 0.0, 1.0)),
             ((1, 0, 3, 2), (0.0, 0.0, -1.0)),
             ((1, 2, 6, 5), (1.0, 0.0, 0.0)),
             ((0, 4, 7, 3), (-1.0, 0.0, 0.0)),
             ((3, 7, 6, 2), (0.0, 1.0, 0.0)),
             ((0, 1, 5, 4), (0.0, -1.0, 0.0)))


def _index_pattern(verts):
    """返回本模式下固定的索引表（所有盒子共用同一套拓扑）。"""
    if verts == 8:
        return [i for tri in BOX_TRIS for i in tri]
    out = []
    for qi in range(len(BOX_FACES)):
        base = qi * 4
        out.extend((base, base + 1, base + 2, base, base + 2, base + 3))
    return out


def material_json(alpha=1.0):
    out = []
    for name, kind, hex_value, rough, metal in MATERIAL_DEFS:
        mat = {
            "name": name,
            "pbrMetallicRoughness": {
                "baseColorFactor": hex_to_linear_rgba(hex_value, alpha),
                "metallicFactor": round(float(metal), 3),
                "roughnessFactor": round(float(rough), 3),
            },
            "doubleSided": False,
            "extras": {"kind": kind, "srgb": "#%06X" % hex_value},
        }
        if alpha < 1.0:
            mat["alphaMode"] = "BLEND"
        out.append(mat)
    return out


def make_glb(groups, alpha=1.0, verts=8, generator="demo/tools/export_glb.py",
             meta_note="B_BUILDING_DATA v4 / single-loaded classrooms + north wing"):
    """拼出 GLB 字节串，返回 (glb_bytes, build_stats)。"""
    materials = material_json(alpha)
    mat_index = {m["name"]: i for i, m in enumerate(materials)}

    idx_pattern = _index_pattern(verts)
    n_idx = len(idx_pattern)
    idx_blob_one = struct.pack("<%dH" % n_idx, *idx_pattern)
    nverts = 8 if verts == 8 else 24

    pos_buf = bytearray()
    nrm_buf = bytearray()
    idx_buf = bytearray()
    accessors = []
    meshes = []
    nodes = []

    nodes.append({"name": "B_building", "children": [],
                  "extras": {"kind": "root", "source": "assets/b-building-data.js",
                             "dataVersion": "4.0.0", "units": "meter",
                             "upAxis": "Y", "note": meta_note}})

    box_count = 0
    for grp in groups:
        gindex = len(nodes)
        nodes.append({"name": grp["id"], "children": [], "extras": grp["extras"]})
        nodes[0]["children"].append(gindex)
        for box in grp["boxes"]:
            w, h, d = box["s"]
            hw, hh, hd = w / 2.0, h / 2.0, d / 2.0

            if verts == 8:
                values = []
                for (sx, sy, sz) in BOX_CORNERS:
                    values.extend((sx * w, sy * h, sz * d))
                pos_buf.extend(struct.pack("<%df" % len(values), *values))
            else:
                values, norms = [], []
                for (ring, normal) in BOX_FACES:
                    for ci in ring:
                        sx, sy, sz = BOX_CORNERS[ci]
                        values.extend((sx * w, sy * h, sz * d))
                        norms.extend(normal)
                pos_buf.extend(struct.pack("<%df" % len(values), *values))
                nrm_buf.extend(struct.pack("<%df" % len(norms), *norms))
            vmin = [f32(-hw), f32(-hh), f32(-hd)]
            vmax = [f32(hw), f32(hh), f32(hd)]

            idx_buf.extend(idx_blob_one)

            pos_acc = len(accessors)
            accessors.append({
                "bufferView": 0,
                "byteOffset": box_count * nverts * 12,
                "componentType": 5126,
                "count": nverts,
                "type": "VEC3",
                "min": vmin,
                "max": vmax,
            })
            attributes = {"POSITION": pos_acc}
            if verts == 24:
                attributes["NORMAL"] = len(accessors)
                accessors.append({
                    "bufferView": 1,
                    "byteOffset": box_count * nverts * 12,
                    "componentType": 5126,
                    "count": nverts,
                    "type": "VEC3",
                })

            idx_acc = len(accessors)
            accessors.append({
                "bufferView": 2 if verts == 24 else 1,
                "byteOffset": box_count * n_idx * 2,
                "componentType": 5123,
                "count": n_idx,
                "type": "SCALAR",
            })

            mesh_index = len(meshes)
            meshes.append({
                "name": box["name"],
                "primitives": [{
                    "attributes": attributes,
                    "indices": idx_acc,
                    "material": mat_index[box["material"]],
                    "mode": 4,
                }],
            })

            nodes.append({
                "name": box["name"],
                "mesh": mesh_index,
                "translation": [box["c"][0], box["c"][1], box["c"][2]],
                "extras": box["extras"],
            })
            nodes[gindex]["children"].append(len(nodes) - 1)
            box_count += 1

    # ---- 缓冲区布局：positions | normals(可选) | indices ----
    views = [{"buffer": 0, "byteOffset": 0, "byteLength": len(pos_buf), "target": 34962}]
    bin_blob = bytes(pos_buf)
    offset = len(bin_blob)
    if verts == 24:
        views.append({"buffer": 0, "byteOffset": offset,
                      "byteLength": len(nrm_buf), "target": 34962})
        bin_blob += bytes(nrm_buf)
        offset = len(bin_blob)
    views.append({"buffer": 0, "byteOffset": offset,
                  "byteLength": len(idx_buf), "target": 34963})
    bin_blob += bytes(idx_buf)

    gltf = {
        "asset": {
            "version": "2.0",
            "generator": generator,
            "extras": {"source": "assets/b-building-data.js", "dataVersion": "4.0.0",
                       "units": "meter", "upAxis": "Y", "origin": "south-west corner",
                       "note": meta_note},
        },
        "scene": 0,
        "scenes": [{"name": "B_building_v4", "nodes": [0]}],
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(bin_blob)}],
    }

    json_blob = json.dumps(gltf, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    json_blob += b" " * ((4 - len(json_blob) % 4) % 4)
    bin_chunk = bin_blob + b"\x00" * ((4 - len(bin_blob) % 4) % 4)

    total = 12 + 8 + len(json_blob) + 8 + len(bin_chunk)
    header = struct.pack("<III", 0x46546C67, 2, total)
    json_header = struct.pack("<II", len(json_blob), 0x4E4F534A)     # 'JSON'
    bin_header = struct.pack("<II", len(bin_chunk), 0x004E4942)      # 'BIN\0'
    glb = header + json_header + json_blob + bin_header + bin_chunk

    stats = {
        "nodes": len(nodes),
        "mesh_nodes": box_count,
        "meshes": len(meshes),
        "triangles": box_count * (n_idx // 3),
        "vertices": box_count * nverts,
        "materials": len(materials),
        "accessors": len(accessors),
        "json_bytes": len(json_blob),
        "bin_bytes": len(bin_chunk),
        "bytes": len(glb),
        "verts_mode": verts,
    }
    return glb, stats


# --------------------------------------------------------------------------
# 读回校验（独立于上面的写码路径）
# --------------------------------------------------------------------------
def _read_glb(path):
    with open(path, "rb") as fh:
        blob = fh.read()
    if len(blob) < 12:
        raise ValueError("文件小于 12 字节，不是 GLB")
    magic, version, length = struct.unpack_from("<III", blob, 0)
    chunks, offset = [], 12
    while offset + 8 <= len(blob):
        clen, ctype = struct.unpack_from("<II", blob, offset)
        payload = blob[offset + 8:offset + 8 + clen]
        chunks.append((ctype, clen, payload))
        offset += 8 + clen
    return blob, magic, version, length, chunks, offset


def verify_glb(path):
    """读回 .glb 做结构校验，返回 (stats, errors)。"""
    errors = []
    stats = {}
    blob, magic, version, total_len, chunks, consumed = _read_glb(path)
    stats["bytes"] = len(blob)
    stats["magic"] = magic
    stats["version"] = version
    stats["total_length"] = total_len
    stats["chunks"] = [(c[0], c[1]) for c in chunks]

    if magic != 0x46546C67:
        errors.append("magic 不是 glTF（0x%08X）" % magic)
    if version != 2:
        errors.append("version 不是 2（%s）" % version)
    if total_len != len(blob):
        errors.append("头部总长度 %d != 文件大小 %d" % (total_len, len(blob)))
    if len(blob) % 4 != 0:
        errors.append("文件长度 %d 不是 4 的倍数" % len(blob))
    if consumed != len(blob):
        errors.append("chunk 解析停在 %d，文件有 %d 字节" % (consumed, len(blob)))
    if len(chunks) != 2:
        errors.append("期望 2 个 chunk（JSON+BIN），实际 %d 个" % len(chunks))
        return stats, errors
    if chunks[0][0] != 0x4E4F534A:
        errors.append("第 1 个 chunk 不是 JSON（0x%08X）" % chunks[0][0])
    if chunks[1][0] != 0x004E4942:
        errors.append("第 2 个 chunk 不是 BIN（0x%08X）" % chunks[1][0])

    json_blob = chunks[0][2]
    bin_blob = chunks[1][2]
    stats["json_bytes"] = len(json_blob)
    stats["bin_bytes"] = len(bin_blob)

    if json_blob.rstrip(b" ")[-1:] != b"}":
        errors.append("JSON chunk 尾部不是 '}'（padding 可能写错）")
    try:
        gltf = json.loads(json_blob.decode("utf-8"))
    except Exception as exc:                                   # noqa: BLE001
        errors.append("JSON chunk 解析失败: %s" % exc)
        return stats, errors

    version_str = gltf.get("asset", {}).get("version")
    if version_str != "2.0":
        errors.append("asset.version 不是 2.0（%s）" % version_str)
    stats["asset_version"] = version_str
    stats["generator"] = gltf.get("asset", {}).get("generator")

    nodes = gltf.get("nodes", [])
    meshes = gltf.get("meshes", [])
    accessors = gltf.get("accessors", [])
    views = gltf.get("bufferViews", [])
    materials = gltf.get("materials", [])
    buffers = gltf.get("buffers", [])
    stats["nodes"] = len(nodes)
    stats["meshes"] = len(meshes)
    stats["materials"] = len(materials)
    stats["accessors"] = len(accessors)
    stats["bufferViews"] = len(views)

    # buffer / bufferView
    buffer_len = buffers[0].get("byteLength", 0) if buffers else 0
    stats["buffer_byteLength"] = buffer_len
    if buffer_len > len(bin_blob):
        errors.append("buffer.byteLength %d > BIN chunk %d" % (buffer_len, len(bin_blob)))
    if buffers and "uri" in buffers[0]:
        errors.append("GLB 的 buffer 不应带 uri")
    for i, view in enumerate(views):
        if view.get("buffer") != 0:
            errors.append("bufferView[%d].buffer != 0" % i)
        if view.get("byteOffset", 0) % 4 != 0:
            errors.append("bufferView[%d].byteOffset 未 4 字节对齐" % i)
        if view.get("byteOffset", 0) + view.get("byteLength", 0) > len(bin_blob):
            errors.append("bufferView[%d] 越界" % i)

    comp_size = {5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4}
    type_count = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
    position_accessors = set()
    for mesh in meshes:
        for prim in mesh.get("primitives", []):
            pos = prim.get("attributes", {}).get("POSITION")
            if pos is not None:
                position_accessors.add(pos)
    for i, acc in enumerate(accessors):
        view = views[acc.get("bufferView", -1)] if acc.get("bufferView", -1) < len(views) else None
        if view is None:
            errors.append("accessor[%d] 的 bufferView 不存在" % i)
            continue
        csize = comp_size.get(acc.get("componentType"))
        tcount = type_count.get(acc.get("type"))
        if csize is None or tcount is None:
            errors.append("accessor[%d] componentType/type 非法" % i)
            continue
        need = acc.get("byteOffset", 0) + acc.get("count", 0) * csize * tcount
        if need > view.get("byteLength", 0):
            errors.append("accessor[%d] 超出 bufferView（需要 %d > %d）"
                          % (i, need, view.get("byteLength", 0)))
        if i in position_accessors and ("min" not in acc or "max" not in acc):
            errors.append("accessor[%d] POSITION 缺 min/max" % i)

    # 节点
    names, mesh_nodes, tris, verts_total = set(), 0, 0, 0
    for i, node in enumerate(nodes):
        name = node.get("name")
        if name:
            if name in names:
                errors.append("节点名重复: %s" % name)
            names.add(name)
        for child in node.get("children", []):
            if not (0 <= child < len(nodes)):
                errors.append("节点 %s 的子节点 %s 不存在" % (name, child))
        if "mesh" in node:
            mesh_nodes += 1
            if not (0 <= node["mesh"] < len(meshes)):
                errors.append("节点 %s 的 mesh %s 不存在" % (name, node["mesh"]))
                continue
            for prim in meshes[node["mesh"]].get("primitives", []):
                pos_acc = prim.get("attributes", {}).get("POSITION")
                if pos_acc is None or not (0 <= pos_acc < len(accessors)):
                    errors.append("节点 %s 的 POSITION accessor 缺失" % name)
                    continue
                vcount = accessors[pos_acc]["count"]
                verts_total += vcount
                idx_acc = prim.get("indices")
                if idx_acc is not None and 0 <= idx_acc < len(accessors):
                    idx_def = accessors[idx_acc]
                    icount = idx_def["count"]
                    if icount % 3 != 0:
                        errors.append("节点 %s 索引数 %d 不是 3 的倍数" % (name, icount))
                    tris += icount // 3
                    idx_fmt = {5121: "B", 5123: "H", 5125: "I"}.get(idx_def.get("componentType"))
                    if idx_fmt is None:
                        errors.append("节点 %s 的索引 componentType 非法" % name)
                        continue
                    base = (views[idx_def["bufferView"]]["byteOffset"]
                            + idx_def.get("byteOffset", 0))
                    raw = bin_blob[base:base + icount * comp_size[idx_def["componentType"]]]
                    top = max(struct.unpack("<%d%s" % (icount, idx_fmt), raw)) if icount else 0
                    if top >= vcount:
                        errors.append("节点 %s 索引 %d 越界（顶点数 %d）" % (name, top, vcount))
                if prim.get("material") is not None and prim["material"] >= len(materials):
                    errors.append("节点 %s 的 material 越界" % name)

    stats["mesh_nodes"] = mesh_nodes
    stats["triangles"] = tris
    stats["vertices"] = verts_total

    # 场景根 + 父子关系
    scene_nodes = gltf.get("scenes", [{}])[0].get("nodes", [])
    if not scene_nodes:
        errors.append("场景没有根节点")
    parented = set()
    for node in nodes:
        parented.update(node.get("children", []))
    for root in scene_nodes:
        if root in parented:
            errors.append("场景根节点 %d 同时是别人的子节点" % root)

    # 世界包围盒（沿父子累计平移）
    bbox = [[float("inf")] * 3, [float("-inf")] * 3]

    def walk(index, offset, seen):
        if index in seen:
            errors.append("节点图有环: %d" % index)
            return
        seen.add(index)
        node = nodes[index]
        tr = node.get("translation", [0.0, 0.0, 0.0])
        pos = [offset[k] + tr[k] for k in range(3)]
        if "mesh" in node and 0 <= node["mesh"] < len(meshes):
            for prim in meshes[node["mesh"]].get("primitives", []):
                acc = accessors[prim["attributes"]["POSITION"]]
                for k in range(3):
                    bbox[0][k] = min(bbox[0][k], pos[k] + acc["min"][k])
                    bbox[1][k] = max(bbox[1][k], pos[k] + acc["max"][k])
        for child in node.get("children", []):
            walk(child, pos, seen)

    for root in scene_nodes:
        walk(root, [0.0, 0.0, 0.0], set())
    stats["bbox_min"] = [r(v, 3) for v in bbox[0]]
    stats["bbox_max"] = [r(v, 3) for v in bbox[1]]

    return stats, errors


def print_report(stats, errors, path):
    log("")
    log("[check] file      : %s (%d bytes, %.1f KB)" % (path, stats.get("bytes", 0),
                                                        stats.get("bytes", 0) / 1024.0))
    log("[check] magic     : %s   version=%s (asset.version=%s)"
        % ("glTF" if stats.get("magic") == 0x46546C67 else "BAD", stats.get("version"),
           stats.get("asset_version")))
    log("[check] length    : header=%s  chunks=%s"
        % (stats.get("total_length"),
           " ".join("0x%08X:%dB" % (t, n) for t, n in stats.get("chunks", []))))
    log("[check] nodes     : %d total (%d with mesh)"
        % (stats.get("nodes", 0), stats.get("mesh_nodes", 0)))
    log("[check] geometry  : %d meshes, %d triangles, %d vertex refs, %d materials"
        % (stats.get("meshes", 0), stats.get("triangles", 0),
           stats.get("vertices", 0), stats.get("materials", 0)))
    log("[check] bbox      : min=%s max=%s"
        % (stats.get("bbox_min"), stats.get("bbox_max")))
    if errors:
        log("[check] FAILED    : %d 个问题" % len(errors))
        for err in errors:
            log("         - %s" % err)
    else:
        log("[check] OK        : magic/version/chunk/长度/节点/索引 全部通过")
    return not errors


# --------------------------------------------------------------------------
# 主流程
# --------------------------------------------------------------------------
def summarize(groups):
    counts = {}
    for grp in groups:
        row = {}
        for box in grp["boxes"]:
            key = box["kind"]
            row[key] = row.get(key, 0) + 1
        counts[grp["id"]] = row
        log("  %-10s %s" % (grp["id"], "  ".join(
            "%s=%d" % (KIND_LABEL.get(k, k), n)
            for k, n in sorted(row.items(), key=lambda kv: KIND_ORDER.index(kv[0])
                               if kv[0] in KIND_ORDER else 99))))
    total = {}
    for row in counts.values():
        for k, n in row.items():
            total[k] = total.get(k, 0) + n
    log("  %-10s %s" % ("TOTAL", "  ".join(
        "%s=%d" % (KIND_LABEL.get(k, k), n)
        for k, n in sorted(total.items(), key=lambda kv: KIND_ORDER.index(kv[0])
                           if kv[0] in KIND_ORDER else 99))))
    return counts


def main(argv=None):
    ap = argparse.ArgumentParser(
        description="把 assets/b-building-data.js（v4）导出为 glTF 2.0 二进制 .glb")
    ap.add_argument("--out", "-o", default=DEFAULT_OUT, help="输出 .glb 路径")
    ap.add_argument("--check", action="store_true", help="不导出，只读回校验已有 .glb")
    ap.add_argument("--no-verify", action="store_true", help="导出后不做读回校验")
    ap.add_argument("--alpha", type=float, default=1.0, help="材质透明度 0-1（<1 用 BLEND）")
    ap.add_argument("--verts", type=int, choices=(8, 24), default=8,
                    help="8 = 8 顶点/12 面无法线（默认）；24 = 每面 4 顶点 + 显式法线")
    ap.add_argument("--raw", action="store_true", help="保留数据原始 z（不做南墙 z=0 的平移）")
    ap.add_argument("--ground-align", action="store_true",
                    help="整体下移，使最低楼板底面贴 y=0（默认 y=displayY）")
    ap.add_argument("--no-entrances", action="store_true", help="不导出入口标记")
    args = ap.parse_args(argv)

    out_path = os.path.abspath(args.out)

    if args.check:
        if not os.path.exists(out_path):
            log("[error] 文件不存在: %s" % out_path)
            return 2
        log("[check] 只校验模式: %s" % out_path)
        stats, errors = verify_glb(out_path)
        return 0 if print_report(stats, errors, out_path) else 1

    if not (0.0 < args.alpha <= 1.0):
        log("[error] --alpha 需要在 (0, 1] 区间")
        return 2

    data = load_building_data()
    meta = data.get("meta", {})
    groups = build_model(data, with_entrances=not args.no_entrances)

    # 坐标平移：默认把南墙挪到 z=0（SW 角 = 原点）
    z_shift = 0.0 if args.raw else -SOUTH_Z_SHIFT
    y_shift = 0.0
    if args.ground_align:
        lowest = min(r(f.get("displayY", 0.0)) for f in data.get("floors", [])) - SLAB_T / 2
        y_shift = -lowest

    if z_shift or y_shift:
        for grp in groups:
            for box in grp["boxes"]:
                cx, cy, cz = box["c"]
                box["c"] = (cx, r(cy + y_shift), r(cz + z_shift))

    log("[model] groups=%d boxes=%d  z_shift=%.2f  y_shift=%.2f  verts=%d  alpha=%.2f"
        % (len(groups), sum(len(g["boxes"]) for g in groups), z_shift, y_shift,
           args.verts, args.alpha))
    summarize(groups)

    glb, stats = make_glb(groups, alpha=args.alpha, verts=args.verts,
                          meta_note="B_BUILDING_DATA v4.0.0 / south 7F + north 4F-5F")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "wb") as fh:
        fh.write(glb)

    log("")
    log("[write] %s" % out_path)
    log("[write] %d bytes (%.1f KB)  json=%dB bin=%dB"
        % (stats["bytes"], stats["bytes"] / 1024.0, stats["json_bytes"], stats["bin_bytes"]))
    log("[write] nodes=%d (mesh %d)  meshes=%d  triangles=%d  vertices=%d  materials=%d"
        % (stats["nodes"], stats["mesh_nodes"], stats["meshes"], stats["triangles"],
           stats["vertices"], stats["materials"]))
    if stats["bytes"] > 5 * 1024 * 1024:
        log("[warn] 文件超过 5MB 限制")
    if meta.get("version") and meta.get("version") != "4.0.0":
        log("[warn] 数据版本是 %s，本脚本按 v4 结构导出" % meta.get("version"))

    if args.no_verify:
        return 0

    stats2, errors = verify_glb(out_path)
    ok = print_report(stats2, errors, out_path)
    # 与写码时的统计对账
    for key in ("nodes", "mesh_nodes", "triangles", "materials"):
        if stats2.get(key) != stats.get(key):
            log("[check] 统计不一致 %s: 写入 %s / 读回 %s"
                % (key, stats.get(key), stats2.get(key)))
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
