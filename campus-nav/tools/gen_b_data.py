# -*- coding: utf-8 -*-
"""生成 B 栋 7 层可导航数据（简化拓扑，保证连通/可用）。
来源：
- cnblogs izcat《西电B楼导航 - Dijkstra简单实现》的 0~7 层节点序列与连边
- BMap-master 的 16 个入口 GPS / 房间清单
- 用户提供的 1F~7F 教室分布图 / 0gaowei xidian-navigation 的 1~7.jpg
- 西电官方《什么？听说你在B楼迷路了？》的电梯/北楼/楼层差说明
输出：
- demo/assets/b-building-data.js  (window.B_BUILDING_DATA)
- demo/handoff/b-building-data.json
- demo/B_DATA_REPORT.md
"""
import json, math, os, heapq

ROOT = r"C:\Users\王\Desktop\11.1\demo"
# 实测/用户提供的整体尺寸
LENGTH = 270.0          # 长（米）
WIDTH_MIN = 19.0        # 窄处宽（米）
WIDTH_MAX = 40.0        # 宽处宽（米）
HEIGHT = 40.0           # 总高（米）
FLOOR_COUNT = 7
FH = HEIGHT / FLOOR_COUNT   # 层高 ≈ 5.71m
STAIR_TIME = 20   # 每层楼梯耗时（秒）
ELEV_TIME = 12    # 每层电梯耗时（秒，含平均等待）
WALK_SPEED = 1.25 # m/s

# 教室沿 270m 长度铺开：用 17 个柱位（0..16），每柱约 15.625m
COL_X0 = 10.0
COL_W = (LENGTH - 2 * COL_X0) / 16.0
# 每层第一个真实教室在博客序列中的索引
FIRST_INDEX = {1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 7, 7: 12}

# ---------------- 房间清单（教室优先，排除卫生间/办公室/占位） ----------------
SOUTH = {
    1: ["101", "105", "106", "107"],
    2: ["201", "203", "206", "207", "208", "211", "215", "216", "217"],
    3: ["301", "303", "306", "307", "308", "311", "312", "314", "315", "316", "318", "320", "321", "324"],
    4: ["401", "403", "406", "407", "408", "411", "412", "414", "415", "416", "418", "419", "421", "422", "425", "426"],
    5: ["501", "502", "503", "506", "507", "509", "510", "511", "513", "514", "516", "517", "520", "521"],
    6: ["601", "602", "603", "605", "606", "608", "609", "612", "613"],
    7: ["701", "703", "706", "707"],
}
NORTH = {
    4: ["442", "443", "437", "434", "433"],
    5: ["538", "537", "532", "529", "528"],
}
ALIASES = {"107": ["107考"], "215": ["215值"]}

def floor_id(level, wing="S"):
    return f"F{level}" if wing == "S" else f"N{level}"

floors = []
rooms = []
for level in range(1, 8):
    fid = floor_id(level)
    fl = {
        "id": fid, "level": level, "wing": "S", "name": f"{level}层（南楼）",
        "elevation": round((level - 1) * FH, 2),
        "displayY": round(2.2 + (level - 1) * 6.0, 2),
        "rooms": [],
    }
    for i, rid in enumerate(SOUTH[level]):
        r = {
            "id": rid, "node": f"{fid}_{rid}", "name": rid, "floor": fid,
            "level": level, "wing": "S",
            "x": round(COL_X0 + (FIRST_INDEX.get(level, 1) + i) * COL_W, 1),
            "z": 0.0,
            "type": "classroom",
            "aliases": ALIASES.get(rid, []),
            "source": "blog+floorplan", "confidence": "medium",
        }
        if rid in ("321", "324"):
            r["source"] = "floorplan-only"
            r["confidence"] = "low"
        fl["rooms"].append(r)
        rooms.append(r)
    floors.append(fl)

for level in (4, 5):
    fid = floor_id(level, "N")
    fl = {
        "id": fid, "level": level, "wing": "N", "name": f"{level}层（北楼）",
        "elevation": round((level - 1) * FH, 2),
        "displayY": round(2.2 + (level - 1) * 6.0, 2),
        "rooms": [],
    }
    for i, rid in enumerate(NORTH[level]):
        r = {
            "id": rid, "node": f"{fid}_{rid}", "name": rid, "floor": fid,
            "level": level, "wing": "N", "x": round(60 + i * 30, 1), "z": -30.0,
            "type": "classroom", "aliases": [],
            "source": "blog+floorplan", "confidence": "medium",
        }
        fl["rooms"].append(r)
        rooms.append(r)
    floors.append(fl)

# ---------------- 节点 ----------------
nodes = []
node_by_id = {}

def add_node(n):
    nodes.append(n)
    node_by_id[n["id"]] = n

for fl in floors:
    for r in fl["rooms"]:
        add_node({
            "id": r["node"], "name": r["name"], "floor": fl["id"], "wing": fl["wing"],
            "level": fl["level"], "x": r["x"], "z": r["z"], "type": "room", "room": r["id"],
        })

# 楼梯：6 个简化竖井；每个竖井固定 x，避免“上楼时横向瞬移”
# (shaft, serves, attach_room_per_floor)
STAIRS = [
    ("S1", [1, 2, 3, 4, 5], {1: "101", 2: "201", 3: "301", 4: "401", 5: "501"}),
    ("S2", [1, 2, 3, 4, 5], {1: "105", 2: "206", 3: "306", 4: "406", 5: "506"}),
    ("S3", [2, 3, 4, 5, 6], {2: "211", 3: "311", 4: "411", 5: "506", 6: "601"}),
    ("S4", [3, 4, 5, 6], {3: "312", 4: "412", 5: "507", 6: "601"}),
    ("S5", [3, 4, 5, 6, 7], {3: "318", 4: "418", 5: "513", 6: "605", 7: "701"}),
    ("S6", [3, 4, 5, 6, 7], {3: "320", 4: "421", 5: "516", 6: "608", 7: "707"}),
]

def find_room(level, wing, rid):
    return next((r for r in rooms if r["level"] == level and r["wing"] == wing and r["id"] == rid), None)

STAIR_X = {}
for shaft, levels, attach in STAIRS:
    xs = []
    for lv in levels:
        r = find_room(lv, "S", attach.get(lv))
        if r:
            xs.append(r["x"])
    STAIR_X[shaft] = round(sum(xs) / len(xs), 1) if xs else 100.0

stairs = []
for shaft, levels, attach in STAIRS:
    x = STAIR_X[shaft]
    for lv in levels:
        same_floor = [r for r in rooms if r["level"] == lv and r["wing"] == "S"]
        if not same_floor:
            continue
        nearest = min(same_floor, key=lambda r: abs(r["x"] - x))
        nid = f"{shaft}_{floor_id(lv)}"
        add_node({
            "id": nid, "name": f"{shaft}楼梯", "floor": floor_id(lv), "wing": "S",
            "level": lv, "x": x, "z": 0.0, "type": "stair",
        })
        stairs.append({"id": shaft, "floor": floor_id(lv), "level": lv, "node": nid,
                       "attach": nearest["node"], "x": x, "z": 0.0})

# 电梯：西侧到 7 层，东侧到 6 层（官方文章：西侧电梯楼层=按键+2）
ELEVATORS = [
    ("ELW", [1, 2, 3, 4, 5, 6, 7], {1: "101", 2: "201", 3: "301", 4: "401", 5: "501", 6: "601", 7: "701"}),
    ("ELE", [1, 2, 3, 4, 5, 6], {1: "107", 2: "217", 3: "320", 4: "426", 5: "521", 6: "613"}),
]
ELEV_X = {"ELW": COL_X0 + 10.0, "ELE": round(LENGTH - COL_X0 - 10.0, 1)}
elevators = []
for shaft, levels, attach in ELEVATORS:
    x = ELEV_X[shaft]
    for lv in levels:
        same_floor = [r for r in rooms if r["level"] == lv and r["wing"] == "S"]
        if not same_floor:
            continue
        nearest = min(same_floor, key=lambda r: abs(r["x"] - x))
        nid = f"{shaft}_{floor_id(lv)}"
        add_node({
            "id": nid, "name": "西电梯" if shaft == "ELW" else "东电梯",
            "floor": floor_id(lv), "wing": "S", "level": lv,
            "x": x, "z": 0.0, "type": "elevator",
        })
        elevators.append({"id": shaft, "floor": floor_id(lv), "level": lv, "node": nid,
                          "attach": nearest["node"], "x": x, "z": 0.0})

# 入口：6 个南侧 + 2 个北侧（GPS 取 BMap 的物理入口近似）
ENTRANCES = [
    {"id": "ENT1", "name": "东侧南入口1", "level": 1, "attach": "105", "lat": 34.125252, "lon": 108.832942},
    {"id": "ENT2", "name": "东侧北入口2", "level": 1, "attach": "107", "lat": 34.12543, "lon": 108.832974},
    {"id": "ENT3", "name": "东侧南入口4", "level": 1, "attach": "211", "lat": 34.125425, "lon": 108.832518},
    {"id": "ENT4", "name": "东侧东入口7", "level": 1, "attach": "312", "lat": 34.125807, "lon": 108.832014},
    {"id": "ENT5", "name": "西侧南入口9", "level": 1, "attach": "318", "lat": 34.125874, "lon": 108.831928},
    {"id": "ENT6", "name": "西侧西入口14", "level": 1, "attach": "320", "lat": 34.12613, "lon": 108.831151},
    {"id": "ENT_NE", "name": "北楼东入口6", "level": 4, "attach": "443", "lat": 34.125736, "lon": 108.832244},
    {"id": "ENT_NW", "name": "北楼西入口12", "level": 4, "attach": "434", "lat": 34.126086, "lon": 108.831462},
]
entrances = []
for e in ENTRANCES:
    target = next((r for r in rooms if r["id"] == e["attach"]), None)
    if not target:
        continue
    is_north = e["id"] in ("ENT_NE", "ENT_NW")
    x = target["x"]
    z = -42.0 if is_north else 12.0
    nid = e["id"]
    # 下沉式设计：入口可能已经位于二层/三层（博客 st3->211、st4->312、st5/6->318/320）
    node_floor = target["floor"]
    node_level = target["level"]
    add_node({
        "id": nid, "name": e["name"], "floor": node_floor, "wing": target["wing"],
        "level": node_level, "x": round(x, 1), "z": round(z, 1), "type": "entrance",
    })
    entrances.append({
        "id": nid, "name": e["name"], "lat": e["lat"], "lon": e["lon"],
        "floor": node_floor, "level": node_level, "node": nid,
        "attach": target["node"], "x": round(x, 1), "z": round(z, 1),
        "source": "BMap GPS + blog entrance mapping", "confidence": "approx",
    })

# ---------------- 边 ----------------
edges = []

def add_edge(a, b, distance, time, kind):
    if a not in node_by_id or b not in node_by_id or a == b:
        return
    dist = max(1.0, float(distance))
    edges.append({"from": a, "to": b, "distance": round(dist, 1),
                  "time": round(float(time), 1), "type": kind})

# 每层：房间之间连走廊；楼梯/电梯作为“支线”挂到最近房间，避免路线穿过楼梯
floor_nodes = {}
for n in nodes:
    if n["type"] in ("room", "stair", "elevator"):
        floor_nodes.setdefault(n["floor"], []).append(n)
for fid, ns in floor_nodes.items():
    room_nodes = [n for n in ns if n["type"] == "room"]
    room_nodes.sort(key=lambda n: n["x"])
    for a, b in zip(room_nodes, room_nodes[1:]):
        d = abs(b["x"] - a["x"])
        add_edge(a["id"], b["id"], max(4.0, d), max(4.0, d) / WALK_SPEED, "walk")
    for n in ns:
        if n["type"] in ("stair", "elevator") and room_nodes:
            nearest = min(room_nodes, key=lambda r: abs(r["x"] - n["x"]))
            d = abs(nearest["x"] - n["x"])
            add_edge(n["id"], nearest["id"], max(3.0, d), max(3.0, d) / WALK_SPEED, "walk")

# 入口 -> 目标房间
for e in entrances:
    add_edge(e["node"], e["attach"], 10.0, 10.0 / WALK_SPEED, "entrance")

# 楼梯竖井
for shaft, levels, _ in STAIRS:
    for a, b in zip(levels, levels[1:]):
        na, nb = f"{shaft}_{floor_id(a)}", f"{shaft}_{floor_id(b)}"
        add_edge(na, nb, FH, STAIR_TIME, "stairs")

# 电梯竖井
for shaft, levels, _ in ELEVATORS:
    for a, b in zip(levels, levels[1:]):
        na, nb = f"{shaft}_{floor_id(a)}", f"{shaft}_{floor_id(b)}"
        add_edge(na, nb, FH, ELEV_TIME, "elevator")

# 北楼内部
for level in (4, 5):
    fid = floor_id(level, "N")
    ns = [n for n in nodes if n["floor"] == fid and n["type"] == "room"]
    ns.sort(key=lambda n: n["x"])
    for a, b in zip(ns, ns[1:]):
        d = abs(b["x"] - a["x"])
        add_edge(a["id"], b["id"], d, d / WALK_SPEED, "walk")

# 南楼 <-> 北楼（通道/坡道，简化）
add_edge("N4_443", "F4_421", 20.0, 30.0, "passage")
add_edge("N4_434", "F4_411", 20.0, 30.0, "passage")
add_edge("N4_443", "N5_537", FH, STAIR_TIME, "stairs")
add_edge("N4_434", "N5_529", FH, STAIR_TIME, "stairs")

# 补连通：确保每层每个房间都能接到主链（按 x 排序已保证）
# 入口 ENT_NE/ENT_NW 已接 443/434

# ---------------- 校验 / 路由 ----------------
adj = {}
for e in edges:
    adj.setdefault(e["from"], []).append((e["to"], e["time"], e["distance"]))
    adj.setdefault(e["to"], []).append((e["from"], e["time"], e["distance"]))

def dijkstra(start, goal):
    if start not in adj or goal not in adj:
        return None
    dist = {start: 0.0}
    prev = {}
    pq = [(0.0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, 1e18):
            continue
        if u == goal:
            break
        for v, t, _ in adj.get(u, []):
            nd = d + t
            if nd < dist.get(v, 1e18):
                dist[v] = nd
                prev[v] = u
                heapq.heappush(pq, (nd, v))
    if goal not in dist:
        return None
    path = [goal]
    while path[-1] != start:
        path.append(prev[path[-1]])
    path.reverse()
    return {"path": path, "time": round(dist[goal], 1)}

# 连通性
from collections import deque
def reachable(start):
    seen = {start}
    q = deque([start])
    while q:
        u = q.popleft()
        for v, _, _ in adj.get(u, []):
            if v not in seen:
                seen.add(v)
                q.append(v)
    return seen

room_nodes = [n["id"] for n in nodes if n["type"] == "room"]
ent_nodes = [n["id"] for n in nodes if n["type"] == "entrance"]
reach_ent1 = reachable("ENT1")
missing_rooms = [r for r in room_nodes if r not in reach_ent1]
missing_ents = [e for e in ent_nodes if e not in reachable("ENT1")]
# 从每个入口到所有房间
ent_unreachable = {}
for e in ent_nodes:
    re = reachable(e)
    bad = [r for r in room_nodes if r not in re]
    if bad:
        ent_unreachable[e] = bad

routes = []
route_specs = [
    ("ENT1", "F1_101", "东入口 → 101"),
    ("ENT1", "F4_426", "东入口 → 426（跨层）"),
    ("ENT1", "F7_707", "东入口 → 707（顶层）"),
    ("ENT3", "N4_437", "东入口 → 北楼 437"),
    ("ENT6", "F3_320", "西入口 → 320"),
    ("ENT_NW", "N5_528", "北楼西入口 → 528"),
    ("ENT1", "F2_215", "东入口 → 215"),
]
for a, b, name in route_specs:
    r = dijkstra(a, b)
    routes.append({"name": name, "from": a, "to": b,
                   "found": bool(r), "path": r["path"] if r else [],
                   "time": r["time"] if r else None})

# ---------------- 输出 ----------------
data = {
    "meta": {
        "buildingId": "B", "name": "B栋（西二楼）", "units": "meter",
        "version": "1.1.0", "generatedAt": "2026-11-01",
        "dimensions": {"length": LENGTH, "widthMin": WIDTH_MIN, "widthMax": WIDTH_MAX,
                       "height": HEIGHT, "floorHeight": round(FH, 2)},
        "floors": 7, "northFloors": [4, 5],
        "roomCount": len(rooms), "nodeCount": len(nodes), "edgeCount": len(edges),
        "source": [
            "cnblogs izcat /p/14871530.html 的 0~7 层图结构",
            "BMap-master 的 16 入口 GPS 与房间清单",
            "1F~7F 教室分布图（用户上传 + 0gaowei xidian-navigation）",
            "西电官方《什么？听说你在B楼迷路了？》电梯/北楼说明",
        ],
        "confidence": "schematic-estimated",
        "notes": [
            "教室沿走廊按 15.6m 柱距铺开（总长 270m），不是平面图像素坐标",
            "层高按 5.71m（40m/7 层）估算；楼梯 20s/层、电梯 12s/层（含平均等待）",
            "北楼 4/5 层用 z=-30 偏移，坡道/楼层差用 passage 边简化",
            "321/324 仅平面图可见，置信度低；107考/215值 作为别名",
            "8 个入口（6 南 + 2 北），GPS 从 BMap 16 个物理入口中近似选取",
        ],
    },
    "floors": floors,
    "rooms": rooms,
    "nodes": nodes,
    "edges": edges,
    "stairs": stairs,
    "elevators": elevators,
    "entrances": entrances,
    "routes": routes,
    "validation": {
        "reachableFromENT1": len(reach_ent1),
        "missingRooms": missing_rooms,
        "missingEntrances": missing_ents,
        "entrancesWithUnreachableRooms": ent_unreachable,
    },
}

os.makedirs(os.path.join(ROOT, "assets"), exist_ok=True)
os.makedirs(os.path.join(ROOT, "handoff"), exist_ok=True)
js = "/* 自动生成：B栋 7 层简化导航数据（示意坐标，非实测） */\n" + \
     "window.B_BUILDING_DATA = " + json.dumps(data, ensure_ascii=False, indent=2) + ";\n"
open(os.path.join(ROOT, "assets", "b-building-data.js"), "w", encoding="utf-8").write(js)
open(os.path.join(ROOT, "handoff", "b-building-data.json"), "w", encoding="utf-8").write(
    json.dumps(data, ensure_ascii=False, indent=2))

print("rooms", len(rooms), "nodes", len(nodes), "edges", len(edges))
print("missing rooms", len(missing_rooms), "missing entrances", len(missing_ents))
print("entrances with unreachable rooms", len(ent_unreachable))
for r in routes:
    print(("OK " if r["found"] else "FAIL "), r["name"], r["time"], len(r["path"]))

# ---------------- 报告 ----------------
lines = []
lines.append("# B 栋 7 层导航数据报告")
lines.append("")
lines.append("> 自动生成：`demo/tools/gen_b_data.py` → `demo/assets/b-building-data.js`")
lines.append("> 定位：**可导航优先的简化拓扑**，不是实测几何；尺寸/坐标标注为估算。")
lines.append("")
lines.append("## 1. 覆盖情况")
lines.append("")
lines.append(f"- 楼层：南楼 F1–F7；北楼 N4、N5（北楼只有 4/5 层）")
lines.append(f"- 尺寸：**长 {LENGTH:.0f} m × 宽 {WIDTH_MIN:.0f}–{WIDTH_MAX:.0f} m × 高 {HEIGHT:.0f} m**；层高约 {FH:.2f} m（用户提供，2026-11-01）")
lines.append(f"- 教室：**{len(rooms)} 间**（含 321/324 两间仅平面图可见的低置信房间）")
lines.append(f"- 节点：{len(nodes)}；边：{len(edges)}")
lines.append(f"- 入口：{len(entrances)} 个（6 个南侧 + 2 个北侧）；GPS 从 BMap 16 个物理入口中近似选取")
lines.append(f"- 楼梯：{len(STAIRS)} 组简化竖井；电梯：2 组（西电梯到 7 层，东电梯到 6 层）")
lines.append("")
lines.append("| 楼层 | 教室数 | 教室 |")
lines.append("|---|---|---|")
for fl in floors:
    ids = "、".join(r["id"] for r in fl["rooms"])
    lines.append(f"| {fl['id']} | {len(fl['rooms'])} | {ids} |")
lines.append("")
lines.append("## 2. 入口")
lines.append("")
lines.append("| id | 名称 | 连接教室 | 楼层 | GPS | 置信度 |")
lines.append("|---|---|---|---|---|---|")
for e in entrances:
    lines.append(f"| {e['id']} | {e['name']} | {e['attach']} | {e['floor']} | {e['lat']:.6f}, {e['lon']:.6f} | {e['confidence']} |")
lines.append("")
lines.append("## 3. 校验")
lines.append("")
lines.append(f"- 从 ENT1 可达节点：{len(reach_ent1)} / {len(nodes)}")
lines.append(f"- 不可达教室：{len(missing_rooms)}")
lines.append(f"- 不可达入口：{len(missing_ents)}")
lines.append(f"- 存在不可达教室的入口：{len(ent_unreachable)}")
lines.append("")
lines.append("路线抽测：")
lines.append("")
lines.append("| 路线 | 结果 | 耗时 | 节点数 |")
lines.append("|---|---|---|---|")
for r in routes:
    lines.append(f"| {r['name']} | {'OK' if r['found'] else 'FAIL'} | {r['time']} s | {len(r['path'])} |")
lines.append("")
lines.append("## 4. 简化与限制")
lines.append("")
for note in data["meta"]["notes"]:
    lines.append(f"- {note}")
lines.append("- 未建模：卫生间、办公室、配电室、值班室、开水器、消防箱、地弹门、多媒体总控室等非导航目标")
lines.append("- 房间位置沿 270m 长度按 15.6m 柱距排列；楼梯/电梯位置为近似，不是平面图像素坐标")
lines.append("- 入口与 BMap 16 个物理入口的对应为近似映射；精确对应需现场核对")
lines.append("- 北楼与南楼的坡道/楼层差用 passage 边简化；'北楼层数为负一'的标高关系未精确建模")
lines.append("")
lines.append("## 5. 数据来源")
lines.append("")
for s in data["meta"]["source"]:
    lines.append(f"- {s}")
lines.append("")
lines.append("## 6. 使用方式")
lines.append("")
lines.append("```html")
lines.append('<script src="assets/b-building-data.js"></script>')
lines.append("```")
lines.append("")
lines.append("```js")
lines.append("// 房间、楼层、图、入口都在这里")
lines.append("const D = window.B_BUILDING_DATA;")
lines.append("```")
lines.append("")
report = "\n".join(lines) + "\n"
open(os.path.join(ROOT, "B_DATA_REPORT.md"), "w", encoding="utf-8").write(report)
print("report written", os.path.join(ROOT, "B_DATA_REPORT.md"))
