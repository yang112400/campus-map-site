# -*- coding: utf-8 -*-
"""按原始 B 楼图结构重建数据（不再过滤房间/合并楼梯）。

来源：cnblogs izcat《西电B楼导航》的 0~7 层原始节点序列：
  level0 = st1~st6 入口 + 未编号空间
  level1~level7 = 教室 / 楼梯柱(|xx) / 未编号(x) / 空位(---)
  北楼 N4/N5
 以及 163 官方文章的电梯/北楼/下沉说明、BMap 的入口 GPS。

输出：assets/b-building-data.js、handoff/b-building-data.json、B_DATA_REPORT.md
"""
import json, os, heapq
from collections import deque

ROOT = r"C:\Users\王\Desktop\11.1\demo"
LENGTH = 270.0
WIDTH_MIN = 19.0
WIDTH_MAX = 40.0
HEIGHT = 40.0
FLOOR_COUNT = 7
FH = HEIGHT / FLOOR_COUNT          # 5.71m
COL_W = LENGTH / 16.0              # 16.875m
WALK = 1.25
STAIR = 20
ELEV = 12

# 原始图结构（逐列）
LEVELS = {
    0: ['---','---','---','st1','01x','st2','st3','02x','st4','03x','04x','st5','05x','st6','---','---','---'],
    1: ['|01','101','10x','105','106','107'],
    2: ['|02','201','203','206','207','208','211','215','216','217'],
    3: ['|03','301','303','306','307','308','311','312','314','315','316','318','31x','320'],
    4: ['|04','401','403','406','407','408','411','412','414','415','416','418','419','421','422','425','426'],
    5: ['|05','50x','501','|15','502','503','506','507','509','510','511','513','514','516','517','520','521'],
    6: ['---','---','---','---','---','---','|36','601','60x','602','603','605','606','608','609','612','613'],
    7: ['---','---','---','---','---','---','---','---','---','---','---','|57','701','|67','703','706','707'],
}
NORTH = {4: ['442','443','437','434','433'], 5: ['538','537','532','529','528']}
ALIASES = {'107': ['107考'], '215': ['215值'], '31x': ['321', '324']}

def x_of(idx):
    return round(idx * COL_W, 2)

def fid(level, wing='S'):
    return f"F{level}" if wing == 'S' else f"N{level}"

def nid(level, label, wing='S'):
    if label.startswith('|'):
        return f"L{label[1:]}_{fid(level, wing)}"
    if label.startswith('st'):
        return f"ENT{label[2:]}"
    return f"{fid(level, wing)}_{label}"

floors = []
rooms = []
nodes = []
label_to_node = {}

def add_node(n):
    nodes.append(n)
    label_to_node[n['label']] = n

# 楼层与房间
for level in range(1, 8):
    fl = {"id": fid(level), "level": level, "wing": "S", "name": f"{level}层（南楼）",
          "elevation": round((level - 1) * FH, 2), "displayY": round(2.2 + (level - 1) * 6.0, 2),
          "rooms": []}
    for idx, label in enumerate(LEVELS[level]):
        if label == '---':
            continue
        x = x_of(idx)
        is_room = label[0].isdigit() and not label.endswith('x')
        typ = 'room' if is_room else ('stair' if label.startswith('|') else 'void')
        n = {"id": nid(level, label), "name": label, "label": label, "floor": fl['id'],
             "level": level, "wing": "S", "x": x, "z": 0.0, "type": typ, "room": label if is_room else None}
        add_node(n)
        if is_room:
            r = {"id": label, "node": n['id'], "name": label, "floor": fl['id'], "level": level,
                 "wing": "S", "x": x, "z": 0.0, "type": "classroom",
                 "aliases": ALIASES.get(label, []), "source": "izcat-graph", "confidence": "medium"}
            fl['rooms'].append(r)
            rooms.append(r)
    floors.append(fl)

# 北楼
for level in (4, 5):
    fl = {"id": fid(level, 'N'), "level": level, "wing": "N", "name": f"{level}层（北楼）",
          "elevation": round((level - 1) * FH, 2), "displayY": round(2.2 + (level - 1) * 6.0, 2),
          "rooms": []}
    for idx, label in enumerate(NORTH[level]):
        x = round(60 + idx * 30, 2)
        n = {"id": nid(level, label, 'N'), "name": label, "label": label, "floor": fl['id'],
             "level": level, "wing": "N", "x": x, "z": -50.0, "type": "room", "room": label}
        add_node(n)
        r = {"id": label, "node": n['id'], "name": label, "floor": fl['id'], "level": level,
             "wing": "N", "x": x, "z": -50.0, "type": "classroom", "aliases": [],
             "source": "izcat-graph", "confidence": "medium"}
        fl['rooms'].append(r)
        rooms.append(r)
    floors.append(fl)

# 入口：6 个南侧 st + 2 个北楼入口
ENTRANCE_DEFS = [
    ("st1", "ENT1", "东侧南入口1", 3, '105', 34.125252, 108.832942, 0.0),
    ("st2", "ENT2", "东侧北入口2", 5, '107', 34.12543, 108.832974, 0.0),
    ("st3", "ENT3", "东侧南入口4", 6, '211', 34.125425, 108.832518, 0.5),
    ("st4", "ENT4", "东侧东入口7", 8, '312', 34.125807, 108.832014, 1.0),
    ("st5", "ENT5", "西侧南入口9", 11, '318', 34.125874, 108.831928, 0.0),
    ("st6", "ENT6", "西侧西入口14", 13, '320', 34.12613, 108.831151, 0.0),
]
entrances = []
for st, eid, name, idx, target_label, lat, lon, factor in ENTRANCE_DEFS:
    target = label_to_node.get(target_label)
    if not target:
        continue
    x = x_of(idx)
    n = {"id": eid, "name": name, "label": st, "floor": target['floor'], "level": target['level'],
         "wing": target['wing'], "x": x, "z": 12.0, "type": "entrance"}
    add_node(n)
    entrances.append({"id": eid, "name": name, "floor": target['floor'], "level": target['level'],
                      "node": eid, "attach": target['id'], "x": x, "z": 12.0,
                      "lat": lat, "lon": lon, "factor": factor, "source": "BMap GPS + izcat st", "confidence": "approx"})

# 北楼入口（6 北楼东、12 北楼西）
for eid, name, target_label, lat, lon in [
    ("ENT_NE", "北楼东入口6", "443", 34.125736, 108.832244),
    ("ENT_NW", "北楼西入口12", "434", 34.126086, 108.831462),
]:
    target = label_to_node.get(target_label)
    if not target:
        continue
    n = {"id": eid, "name": name, "label": eid, "floor": target['floor'], "level": target['level'],
         "wing": "N", "x": target['x'], "z": -42.0, "type": "entrance"}
    add_node(n)
    entrances.append({"id": eid, "name": name, "floor": target['floor'], "level": target['level'],
                      "node": eid, "attach": target['id'], "x": target['x'], "z": -42.0,
                      "lat": lat, "lon": lon, "factor": 0.0, "source": "BMap GPS + izcat north", "confidence": "approx"})

# 电梯：西电梯到 7 层，东电梯到 6 层（官方文章）
ELEV_X = {"ELW": x_of(0), "ELE": x_of(16)}
elevators = []
for shaft, levels in [("ELW", range(1, 8)), ("ELE", range(1, 7))]:
    for level in levels:
        same = [r for r in rooms if r['level'] == level and r['wing'] == 'S']
        if not same:
            continue
        x = ELEV_X[shaft]
        nearest = min(same, key=lambda r: abs(r['x'] - x))
        n = {"id": f"{shaft}_F{level}", "name": "西电梯" if shaft == "ELW" else "东电梯",
             "label": f"{shaft}_F{level}", "floor": f"F{level}", "level": level, "wing": "S",
             "x": x, "z": 0.0, "type": "elevator"}
        add_node(n)
        elevators.append({"id": shaft, "floor": f"F{level}", "level": level, "node": n['id'],
                          "attach": nearest['node'], "x": x, "z": 0.0})

# ---------------- 边 ----------------
edges = []
edge_keys = set()

def add_edge(a, b, dist, time, kind):
    if a == b or a not in {n['id'] for n in nodes} or b not in {n['id'] for n in nodes}:
        return
    key = tuple(sorted((a, b)))
    if key in edge_keys:
        return
    edge_keys.add(key)
    edges.append({"from": a, "to": b, "distance": round(max(1.0, dist), 2),
                  "time": round(max(1.0, time), 2), "type": kind})

# 每层水平：相邻非空列
for level in range(1, 8):
    entries = [(i, label) for i, label in enumerate(LEVELS[level]) if label != '---']
    for (ia, la), (ib, lb) in zip(entries, entries[1:]):
        na, nb = label_to_node.get(la), label_to_node.get(lb)
        if not na or not nb:
            continue
        d = abs(nb['x'] - na['x'])
        add_edge(na['id'], nb['id'], d, d / WALK, "walk")

# 北楼水平
for level in (4, 5):
    ns = [label_to_node[l] for l in NORTH[level] if l in label_to_node]
    ns.sort(key=lambda n: n['x'])
    for a, b in zip(ns, ns[1:]):
        d = abs(b['x'] - a['x'])
        add_edge(a['id'], b['id'], d, d / WALK, "walk")

# 竖向连接（原始图结构）
VERTICAL = [
    ('st1', '105', 0.0), ('st2', '107', 0.0), ('st3', '211', 0.5), ('st4', '312', 1.0),
    ('st5', '318', 0.0), ('st6', '320', 0.0),
    ('|01', '|02', 1), ('|02', '|03', 1), ('|03', '|04', 1), ('|04', '|05', 1),
    ('105', '206', 1), ('206', '306', 1), ('306', '406', 1), ('406', '|15', 1),
    ('107', '208', 1), ('208', '308', 1), ('308', '408', 1), ('408', '503', 1),
    ('211', '311', 1), ('311', '411', 1), ('411', '506', 1), ('506', '|36', 1),
    ('312', '412', 1), ('412', '507', 1), ('507', '601', 1),
    ('318', '418', 1), ('418', '513', 1), ('513', '605', 1), ('605', '|57', 1),
    ('320', '421', 1), ('421', '516', 1), ('516', '608', 1), ('608', '|67', 1),
    ('216', '314', 1), ('314', '414', 1), ('414', '509', 1), ('509', '60x', 1),
    ('217', '315', 1), ('315', '415', 1), ('415', '510', 1), ('510', '602', 1),
    ('316', '416', 1), ('416', '511', 1), ('511', '603', 1), ('603', '|97', 1),
    ('422', '517', 1), ('517', '609', 1), ('609', '703', 1),
    ('425', '520', 1), ('520', '612', 1), ('612', '706', 1),
    ('426', '521', 1), ('521', '612', 1), ('612', '707', 1),
    ('st3', '443', 1.0), ('st5', '434', 1.0), ('443', '537', 1.0), ('434', '529', 1.0),
]
for a_label, b_label, factor in VERTICAL:
    a, b = label_to_node.get(a_label), label_to_node.get(b_label)
    if not a or not b:
        continue
    d = FH * factor if factor > 0 else max(1.0, abs(a['x'] - b['x']))
    t = STAIR * factor if factor > 0 else d / WALK
    add_edge(a['id'], b['id'], d, t, "stairs")

# 入口 -> 目标
for e in entrances:
    target = next((n for n in nodes if n['id'] == e['attach']), None)
    if not target:
        continue
    d = abs(e['x'] - target['x']) + FH * (e.get('factor') or 0)
    t = d / WALK + STAIR * (e.get('factor') or 0)
    add_edge(e['node'], target['id'], d, t, "entrance")
    # st3/st5 的北楼连接
    if e['id'] in ('ENT3', 'ENT5'):
        north_label = '443' if e['id'] == 'ENT3' else '434'
        north = label_to_node.get(north_label)
        if north:
            add_edge(e['node'], north['id'], abs(e['x'] - north['x']) + FH, t + STAIR, "passage")

# 电梯竖井 + 挂接
for shaft, levels in [("ELW", range(1, 8)), ("ELE", range(1, 7))]:
    for a, b in zip(levels, levels[1:]):
        na, nb = f"{shaft}_F{a}", f"{shaft}_F{b}"
        if na in {n['id'] for n in nodes} and nb in {n['id'] for n in nodes}:
            add_edge(na, nb, FH, ELEV, "elevator")
for e in elevators:
    add_edge(e['node'], e['attach'], max(3.0, abs(next(n for n in nodes if n['id'] == e['node'])['x'] - next(n for n in nodes if n['id'] == e['attach'])['x'])),
             max(3.0, abs(next(n for n in nodes if n['id'] == e['node'])['x'] - next(n for n in nodes if n['id'] == e['attach'])['x'])) / WALK, "walk")

# ---------------- 图 / 校验 ----------------
adj = {}
for e in edges:
    adj.setdefault(e['from'], []).append((e['to'], e['time']))
    adj.setdefault(e['to'], []).append((e['from'], e['time']))

def dijkstra(start, goal):
    if start not in adj or goal not in adj:
        return None
    dist = {start: 0.0}; prev = {}; pq = [(0.0, start)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist.get(u, 1e18):
            continue
        if u == goal:
            break
        for v, t in adj.get(u, []):
            nd = d + t
            if nd < dist.get(v, 1e18):
                dist[v] = nd; prev[v] = u; heapq.heappush(pq, (nd, v))
    if goal not in dist:
        return None
    path = [goal]
    while path[-1] != start:
        path.append(prev[path[-1]])
    path.reverse()
    return {"path": path, "time": round(dist[goal], 1)}

def reach(start):
    seen = {start}; q = deque([start])
    while q:
        u = q.popleft()
        for v, _ in adj.get(u, []):
            if v not in seen:
                seen.add(v); q.append(v)
    return seen

room_ids = [r['node'] for r in rooms]
ent_ids = [e['node'] for e in entrances]
reach1 = reach('ENT1')
missing_rooms = [r for r in room_ids if r not in reach1]
missing_ents = [e for e in ent_ids if e not in reach1]
ent_bad = {}
for e in ent_ids:
    re = reach(e)
    bad = [r for r in room_ids if r not in re]
    if bad:
        ent_bad[e] = bad

routes = []
for a, b, name in [
    ('ENT1', 'F1_101', '东入口 → 101'),
    ('ENT1', 'F4_426', '东入口 → 426（跨层）'),
    ('ENT1', 'F7_707', '东入口 → 707（顶层）'),
    ('ENT3', 'N4_437', '东入口 → 北楼 437'),
    ('ENT5', 'F3_320', '西入口 → 320'),
    ('ENT_NW', 'N5_528', '北楼西入口 → 528'),
    ('ENT1', 'F2_215', '东入口 → 215'),
]:
    r = dijkstra(a, b)
    routes.append({"name": name, "from": a, "to": b,
                   "found": bool(r), "path": r['path'] if r else [], "time": r['time'] if r else None})

data = {
    "meta": {
        "buildingId": "B", "name": "B栋（西二楼）", "units": "meter",
        "version": "2.0.0", "generatedAt": "2026-11-01",
        "structure": "izcat-graph-exact-columns",
        "dimensions": {"length": LENGTH, "widthMin": WIDTH_MIN, "widthMax": WIDTH_MAX,
                       "height": HEIGHT, "floorHeight": round(FH, 2)},
        "floors": 7, "northFloors": [4, 5],
        "roomCount": len(rooms), "nodeCount": len(nodes), "edgeCount": len(edges),
        "source": [
            "cnblogs izcat /p/14871530.html 的 0~7 层原始节点序列与竖向连接",
            "BMap-master 的 16 入口 GPS（用于入口近似定位）",
            "西电官方《什么？听说你在B楼迷路了？》电梯/北楼说明",
            "用户提供的 270m×19-40m×40m 尺寸",
        ],
        "confidence": "structure-corrected-1d",
        "notes": [
            "按原始图的列位置铺开：x = 列索引 × 16.875m，未再过滤或合并房间",
            "保留 14 根原始楼梯柱（105→206→306…、107→208→308… 等）与 9 个 | 楼梯节点",
            "6 个南侧 st 入口 + 2 个北楼入口；st3/st5 同时连北楼",
            "结构是 1D 走廊+楼梯，宽度 19–40m 尚未分段建模",
            "321/324 作为 31x 的别名；107考/215值 作为别名",
            "层高 40/7=5.71m；楼梯 20s/层，电梯 12s/层",
        ],
    },
    "floors": floors, "rooms": rooms, "nodes": nodes, "edges": edges,
    "stairs": [n for n in nodes if n['type'] == 'stair'],
    "elevators": elevators, "entrances": entrances, "routes": routes,
    "validation": {
        "reachableFromENT1": len(reach1), "missingRooms": missing_rooms,
        "missingEntrances": missing_ents, "entrancesWithUnreachableRooms": ent_bad,
    },
}

os.makedirs(os.path.join(ROOT, 'assets'), exist_ok=True)
open(os.path.join(ROOT, 'assets', 'b-building-data.js'), 'w', encoding='utf-8').write(
    "/* 自动生成：B栋结构修正版（按原始图逐列，v2.0） */\nwindow.B_BUILDING_DATA = " +
    json.dumps(data, ensure_ascii=False, indent=2) + ";\n")
open(os.path.join(ROOT, 'handoff', 'b-building-data.json'), 'w', encoding='utf-8').write(
    json.dumps(data, ensure_ascii=False, indent=2))

print('rooms', len(rooms), 'nodes', len(nodes), 'edges', len(edges),
      'stairs', len(data['stairs']), 'elevators', len(elevators), 'entrances', len(entrances))
print('missing rooms', len(missing_rooms), 'missing ents', len(missing_ents),
      'entrances with bad rooms', len(ent_bad))
for r in routes:
    print(('OK ' if r['found'] else 'FAIL '), r['name'], r['time'], len(r['path']))
