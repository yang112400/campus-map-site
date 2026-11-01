# -*- coding: utf-8 -*-
"""B 栋结构 v3：中间走廊 + 两侧教室 + 原始竖向关系。

- 房间：按楼层顺序交替分到北侧(z=-8)/南侧(z=+8)；
- 走廊：每层每个非空列一个走廊节点(z=0)，相邻连成链；
- 教室/楼梯/电梯/入口都接到走廊；
- 竖向关系沿用原始图（105→206→306… 等），房间在两侧、楼梯在走廊线上。
"""
import json, os, heapq
from collections import deque

ROOT = r"C:\Users\王\Desktop\11.1\demo"
LENGTH = 270.0
WIDTH_MIN = 19.0
WIDTH_MAX = 40.0
HEIGHT = 40.0
FH = HEIGHT / 7.0
COL_W = LENGTH / 16.0
WALK = 1.25
STAIR = 20
ELEV = 12
SIDE_Z = 8.0

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
ALIASES = {'107': ['107考'], '215': ['215值'], '31x': ['321','324']}

def x_of(i): return round(i * COL_W, 2)
def fid(l, w='S'): return f"F{l}" if w == 'S' else f"N{l}"
def nid(l, label, w='S'):
    if label.startswith('|'): return f"L{label[1:]}_{fid(l,w)}"
    if label.startswith('st'): return f"ENT{label[2:]}"
    return f"{fid(l,w)}_{label}"

floors = []; rooms = []; nodes = []; label_to_node = {}
def add(n):
    nodes.append(n); label_to_node[n['label']] = n

# 房间（两侧）
for level in range(1, 8):
    fl = {"id": fid(level), "level": level, "wing": "S", "name": f"{level}层（南楼）",
          "elevation": round((level-1)*FH, 2), "displayY": round(2.2+(level-1)*6.0, 2), "rooms": []}
    digit_idx = 0
    for idx, label in enumerate(LEVELS[level]):
        if label == '---' or not (label[0].isdigit() and not label.endswith('x')):
            continue
        side = 'N' if digit_idx % 2 == 0 else 'S'
        z = -SIDE_Z if side == 'N' else SIDE_Z
        n = {"id": nid(level, label), "name": label, "label": label, "floor": fl['id'],
             "level": level, "wing": "S", "x": x_of(idx), "z": z, "type": "room", "room": label, "side": side}
        add(n)
        r = {"id": label, "node": n['id'], "name": label, "floor": fl['id'], "level": level,
             "wing": "S", "x": x_of(idx), "z": z, "side": side, "type": "classroom",
             "aliases": ALIASES.get(label, []), "source": "izcat-graph", "confidence": "medium"}
        fl['rooms'].append(r); rooms.append(r); digit_idx += 1
    floors.append(fl)

# 北楼房间（两侧，窄楼）
for level in (4, 5):
    fl = {"id": fid(level,'N'), "level": level, "wing": "N", "name": f"{level}层（北楼）",
          "elevation": round((level-1)*FH, 2), "displayY": round(2.2+(level-1)*6.0, 2), "rooms": []}
    for idx, label in enumerate(NORTH[level]):
        side = 'N' if idx % 2 == 0 else 'S'
        z = -50.0 + (-4.5 if side == 'N' else 4.5)
        n = {"id": nid(level,label,'N'), "name": label, "label": label, "floor": fl['id'],
             "level": level, "wing": "N", "x": round(60+idx*30,2), "z": z, "type": "room", "room": label, "side": side}
        add(n)
        r = {"id": label, "node": n['id'], "name": label, "floor": fl['id'], "level": level,
             "wing": "N", "x": n['x'], "z": z, "side": side, "type": "classroom", "aliases": [],
             "source": "izcat-graph", "confidence": "medium"}
        fl['rooms'].append(r); rooms.append(r)
    floors.append(fl)

# 走廊节点：每层每个非空列
corridor = {}
for level in range(1, 8):
    for idx, label in enumerate(LEVELS[level]):
        if label == '---':
            continue
        cid = f"C_F{level}_{idx}"
        n = {"id": cid, "name": f"{level}层走廊{idx}", "label": cid, "floor": f"F{level}",
             "level": level, "wing": "S", "x": x_of(idx), "z": 0.0, "type": "corridor"}
        add(n); corridor[(level, idx)] = n
for level in (4, 5):
    for idx, label in enumerate(NORTH[level]):
        cid = f"C_N{level}_{idx}"
        n = {"id": cid, "name": f"北{level}走廊{idx}", "label": cid, "floor": f"N{level}",
             "level": level, "wing": "N", "x": round(60+idx*30,2), "z": -50.0, "type": "corridor"}
        add(n); corridor[(level, idx)] = n

# 楼梯 | 节点（走廊位置）
for level in range(1, 8):
    for idx, label in enumerate(LEVELS[level]):
        if not label.startswith('|'):
            continue
        add({"id": nid(level,label), "name": label, "label": label, "floor": f"F{level}",
             "level": level, "wing": "S", "x": x_of(idx), "z": 0.0, "type": "stair"})

# 空位/未编号节点（用于走廊连接）
for level in range(1, 8):
    for idx, label in enumerate(LEVELS[level]):
        if label == '---' or label.startswith('|') or label.startswith('st'):
            continue
        if label[0].isdigit() and not label.endswith('x'):
            continue
        add({"id": nid(level,label), "name": label, "label": label, "floor": f"F{level}",
             "level": level, "wing": "S", "x": x_of(idx), "z": 0.0, "type": "void"})

# 入口
ENT_DEFS = [
    ("st1","ENT1","东侧南入口1",3,'105',34.125252,108.832942,0.0),
    ("st2","ENT2","东侧北入口2",5,'107',34.12543,108.832974,0.0),
    ("st3","ENT3","东侧南入口4",6,'211',34.125425,108.832518,0.5),
    ("st4","ENT4","东侧东入口7",8,'312',34.125807,108.832014,1.0),
    ("st5","ENT5","西侧南入口9",11,'318',34.125874,108.831928,0.0),
    ("st6","ENT6","西侧西入口14",13,'320',34.12613,108.831151,0.0),
]
entrances = []
for st,eid,name,idx,target_label,lat,lon,factor in ENT_DEFS:
    target = label_to_node.get(target_label)
    if not target: continue
    add({"id":eid,"name":name,"label":st,"floor":target['floor'],"level":target['level'],
         "wing":target['wing'],"x":x_of(idx),"z":12.0,"type":"entrance"})
    entrances.append({"id":eid,"name":name,"floor":target['floor'],"level":target['level'],
                      "node":eid,"attach":target['id'],"x":x_of(idx),"z":12.0,
                      "lat":lat,"lon":lon,"factor":factor,"source":"BMap GPS + izcat st","confidence":"approx"})
for eid,name,target_label,lat,lon in [
    ("ENT_NE","北楼东入口6","443",34.125736,108.832244),
    ("ENT_NW","北楼西入口12","434",34.126086,108.831462)]:
    target = label_to_node.get(target_label)
    if not target: continue
    add({"id":eid,"name":name,"label":eid,"floor":target['floor'],"level":target['level'],
         "wing":"N","x":target['x'],"z":-42.0,"type":"entrance"})
    entrances.append({"id":eid,"name":name,"floor":target['floor'],"level":target['level'],
                      "node":eid,"attach":target['id'],"x":target['x'],"z":-42.0,
                      "lat":lat,"lon":lon,"factor":0.0,"source":"BMap GPS + izcat north","confidence":"approx"})

# 电梯
ELEV_X = {"ELW": x_of(0), "ELE": x_of(16)}
elevators = []
for shaft, levels in [("ELW", range(1,8)), ("ELE", range(1,7))]:
    for level in levels:
        same = [r for r in rooms if r['level'] == level and r['wing'] == 'S']
        if not same: continue
        x = ELEV_X[shaft]
        nearest = min(same, key=lambda r: abs(r['x']-x))
        n = {"id":f"{shaft}_F{level}","name":"西电梯" if shaft=="ELW" else "东电梯",
             "label":f"{shaft}_F{level}","floor":f"F{level}","level":level,"wing":"S",
             "x":x,"z":0.0,"type":"elevator"}
        add(n)
        elevators.append({"id":shaft,"floor":f"F{level}","level":level,"node":n['id'],
                          "attach":nearest['node'],"x":x,"z":0.0})

# ---------------- 边 ----------------
edges = []; keys = set()
def add_edge(a,b,d,t,kind):
    if a==b or a not in label_to_node and a not in {n['id'] for n in nodes}:
        pass
    if a not in {n['id'] for n in nodes} or b not in {n['id'] for n in nodes}:
        return
    k=tuple(sorted((a,b)))
    if k in keys: return
    keys.add(k)
    edges.append({"from":a,"to":b,"distance":round(max(1.0,d),2),"time":round(max(1.0,t),2),"type":kind})

# 走廊链 + 房间/楼梯/空位接走廊
for level in range(1,8):
    cols = [i for i,l in enumerate(LEVELS[level]) if l != '---']
    for a,b in zip(cols, cols[1:]):
        ca, cb = corridor[(level,a)], corridor[(level,b)]
        d = abs(cb['x']-ca['x'])
        add_edge(ca['id'], cb['id'], d, d/WALK, "walk")
    for idx in cols:
        c = corridor[(level,idx)]
        label = LEVELS[level][idx]
        target = label_to_node.get(label)
        if not target or target['type'] == 'corridor':
            continue
        d = abs(target['z'] - c['z']) + max(1.0, abs(target['x']-c['x']))
        add_edge(c['id'], target['id'], d, d/WALK, "door")

# 北楼走廊
for level in (4,5):
    cols = list(range(len(NORTH[level])))
    for a,b in zip(cols, cols[1:]):
        ca, cb = corridor[(level,a)], corridor[(level,b)]
        d = abs(cb['x']-ca['x'])
        add_edge(ca['id'], cb['id'], d, d/WALK, "walk")
    for idx in cols:
        c = corridor[(level,idx)]
        target = label_to_node.get(NORTH[level][idx])
        if target:
            d = abs(target['z']-c['z'])
            add_edge(c['id'], target['id'], d, d/WALK, "door")

# 原始竖向关系（房间/楼梯节点之间）
VERTICAL = [
    ('st1','105',0.0),('st2','107',0.0),('st3','211',0.5),('st4','312',1.0),('st5','318',0.0),('st6','320',0.0),
    ('|01','|02',1),('|02','|03',1),('|03','|04',1),('|04','|05',1),
    ('105','206',1),('206','306',1),('306','406',1),('406','|15',1),
    ('107','208',1),('208','308',1),('308','408',1),('408','503',1),
    ('211','311',1),('311','411',1),('411','506',1),('506','|36',1),
    ('312','412',1),('412','507',1),('507','601',1),
    ('318','418',1),('418','513',1),('513','605',1),('605','|57',1),
    ('320','421',1),('421','516',1),('516','608',1),('608','|67',1),
    ('216','314',1),('314','414',1),('414','509',1),('509','60x',1),
    ('217','315',1),('315','415',1),('415','510',1),('510','602',1),
    ('316','416',1),('416','511',1),('511','603',1),('603','|97',1),
    ('422','517',1),('517','609',1),('609','703',1),
    ('425','520',1),('520','612',1),('612','706',1),
    ('426','521',1),('521','612',1),('612','707',1),
    ('st3','443',1.0),('st5','434',1.0),('443','537',1.0),('434','529',1.0),
]
for a_label,b_label,factor in VERTICAL:
    a,b = label_to_node.get(a_label), label_to_node.get(b_label)
    if not a or not b: continue
    d = FH*factor if factor>0 else max(1.0, abs(a['x']-b['x'])+abs(a['z']-b['z']))
    t = STAIR*factor if factor>0 else d/WALK
    add_edge(a['id'],b['id'],d,t,"stairs")

# 入口 -> 走廊/目标
for e in entrances:
    # 找同列走廊
    target = label_to_node.get(e['attach'])
    if not target: continue
    # 目标所在层的走廊节点：按目标 x 最近
    cands = [n for n in nodes if n['type']=='corridor' and n['floor']==target['floor']]
    if not cands: continue
    c = min(cands, key=lambda n: abs(n['x']-e['x']))
    d = abs(c['x']-e['x']) + abs(c['z']-e['z'])
    t = d/WALK + STAIR*(e.get('factor') or 0)
    add_edge(e['node'], c['id'], d, t, "entrance")
    add_edge(c['id'], target['id'], abs(target['z']-c['z']), abs(target['z']-c['z'])/WALK, "door")
    if e['id'] in ('ENT3','ENT5'):
        north_label = '443' if e['id']=='ENT3' else '434'
        north = label_to_node.get(north_label)
        if north:
            cands2 = [n for n in nodes if n['type']=='corridor' and n['floor']==north['floor']]
            c2 = min(cands2, key=lambda n: abs(n['x']-north['x'])) if cands2 else None
            if c2:
                add_edge(e['node'], c2['id'], abs(c2['x']-e['x'])+abs(c2['z']-e['z']), 40, "passage")

# 电梯竖井 + 挂走廊
for shaft, levels in [("ELW",range(1,8)),("ELE",range(1,7))]:
    for a,b in zip(levels, levels[1:]):
        na,nb=f"{shaft}_F{a}",f"{shaft}_F{b}"
        if na in {n['id'] for n in nodes} and nb in {n['id'] for n in nodes}:
            add_edge(na,nb,FH,ELEV,"elevator")
for e in elevators:
    n = next(n for n in nodes if n['id']==e['node'])
    cands = [x for x in nodes if x['type']=='corridor' and x['floor']==e['floor']]
    c = min(cands, key=lambda x: abs(x['x']-n['x']))
    add_edge(n['id'], c['id'], max(1.0, abs(n['x']-c['x'])+abs(n['z']-c['z'])),
             max(1.0, abs(n['x']-c['x'])+abs(n['z']-c['z']))/WALK, "walk")

# ---------------- 校验 / 路由 ----------------
adj = {}
for e in edges:
    adj.setdefault(e['from'],[]).append((e['to'],e['time']))
    adj.setdefault(e['to'],[]).append((e['from'],e['time']))

def dijkstra(a,b):
    if a not in adj or b not in adj: return None
    dist={a:0.0}; prev={}; pq=[(0.0,a)]
    while pq:
        d,u=heapq.heappop(pq)
        if d>dist.get(u,1e18): continue
        if u==b: break
        for v,t in adj.get(u,[]):
            nd=d+t
            if nd<dist.get(v,1e18):
                dist[v]=nd; prev[v]=u; heapq.heappush(pq,(nd,v))
    if b not in dist: return None
    path=[b]
    while path[-1]!=a: path.append(prev[path[-1]])
    path.reverse()
    return {"path":path,"time":round(dist[b],1)}

def reach(a):
    seen={a}; q=deque([a])
    while q:
        u=q.popleft()
        for v,_ in adj.get(u,[]):
            if v not in seen: seen.add(v); q.append(v)
    return seen

room_ids=[r['node'] for r in rooms]; ent_ids=[e['node'] for e in entrances]
r1=reach('ENT1'); miss_rooms=[x for x in room_ids if x not in r1]; miss_ents=[x for x in ent_ids if x not in r1]
bad={}
for e in ent_ids:
    re=reach(e); b=[x for x in room_ids if x not in re]
    if b: bad[e]=b

routes=[]
for a,b,name in [('ENT1','F1_101','东入口 → 101'),('ENT1','F4_426','东入口 → 426（跨层）'),
                 ('ENT1','F7_707','东入口 → 707（顶层）'),('ENT3','N4_437','东入口 → 北楼 437'),
                 ('ENT5','F3_320','西入口 → 320'),('ENT_NW','N5_528','北楼西入口 → 528'),
                 ('ENT1','F2_215','东入口 → 215')]:
    r=dijkstra(a,b)
    routes.append({"name":name,"from":a,"to":b,"found":bool(r),"path":r['path'] if r else [],"time":r['time'] if r else None})

data={"meta":{"buildingId":"B","name":"B栋（西二楼）","units":"meter","version":"3.0.0",
              "generatedAt":"2026-11-01","structure":"double-loaded-corridor",
              "dimensions":{"length":LENGTH,"widthMin":WIDTH_MIN,"widthMax":WIDTH_MAX,
                            "height":HEIGHT,"floorHeight":round(FH,2)},
              "floors":7,"northFloors":[4,5],"roomCount":len(rooms),
              "nodeCount":len(nodes),"edgeCount":len(edges),
              "source":["cnblogs izcat /p/14871530.html 的 0~7 层原始节点序列",
                        "BMap 16 入口 GPS（近似）","西电官方电梯/北楼说明","用户 270×19-40×40m 尺寸"],
              "confidence":"structure-corrected-2d-corridor",
              "notes":["中间走廊 + 南北两侧教室（交替分布）",
                       "每层每个非空列一个走廊节点；教室/楼梯/电梯/入口都接走廊",
                       "竖向关系沿用原始图（105→206→306… 等）",
                       "宽度 19–40m 未逐段建模；房间按 8m 进深示意",
                       "321/324 作为 31x 别名；107考/215值 别名"]},
      "floors":floors,"rooms":rooms,"nodes":nodes,"edges":edges,
      "stairs":[n for n in nodes if n['type']=='stair'],
      "elevators":elevators,"entrances":entrances,"routes":routes,
      "validation":{"reachableFromENT1":len(r1),"missingRooms":miss_rooms,
                    "missingEntrances":miss_ents,"entrancesWithUnreachableRooms":bad}}

os.makedirs(os.path.join(ROOT,'assets'),exist_ok=True)
open(os.path.join(ROOT,'assets','b-building-data.js'),'w',encoding='utf-8').write(
    "/* 自动生成：B栋结构 v3（中间走廊+两侧教室） */\nwindow.B_BUILDING_DATA = "+
    json.dumps(data,ensure_ascii=False,indent=2)+";\n")
open(os.path.join(ROOT,'handoff','b-building-data.json'),'w',encoding='utf-8').write(
    json.dumps(data,ensure_ascii=False,indent=2))
print('rooms',len(rooms),'nodes',len(nodes),'edges',len(edges),
      'stairs',len(data['stairs']),'elevators',len(elevators),'entrances',len(entrances))
print('missing rooms',len(miss_rooms),'missing ents',len(miss_ents),'bad entrances',len(bad))
for r in routes: print(('OK ' if r['found'] else 'FAIL '),r['name'],r['time'],len(r['path']))
