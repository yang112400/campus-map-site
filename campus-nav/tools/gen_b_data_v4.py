# -*- coding: utf-8 -*-
"""B 栋结构 v4：单侧教室 + 北侧服务带 + 北楼独立段。

可确认（来自平面图/官方文章/用户尺寸）：
- 南楼 F1-F7；教室在南侧；北侧是楼梯/卫生间/办公室/空位；6F/7F 北侧是楼顶
- 北楼只有 4F/5F，独立成排，通过平台/坡道连接
- 270m × 19-40m × 40m；层高 40/7
- 9 个通道口、16 个物理入口 GPS、电梯规则（西+2、东不到 7 层）

估算（明确标注，不当作实测）：
- 教室 z=+8、服务带 z=-8、走廊 z=0；房间进深 8m
- 教室列距 270/16=16.875m；北楼 5 间按 15.6m 排
- 楼梯柱 x 取原始图对应房间列的平均值
"""
import json, os, heapq
from collections import deque

ROOT = r"C:\Users\王\Desktop\11.1\demo"
LENGTH, WIDTH_MIN, WIDTH_MAX, HEIGHT = 270.0, 19.0, 40.0, 40.0
FH = HEIGHT / 7.0
COL_W = LENGTH / 16.0
WALK = 1.25
STAIR = 20
ELEV = 12
ROOM_Z = 8.0      # 教室中心：南侧
SERVICE_Z = -8.0  # 服务/楼梯：北侧
CORR_Z = 0.0

LEVELS = {
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
# 原始图的竖向楼梯序列（房间/| 作为柱位）
SEQUENCES = [
    ['|01','|02','|03','|04','|05'],
    ['105','206','306','406','|15'],
    ['107','208','308','408','503'],
    ['211','311','411','506','|36'],
    ['312','412','507','601'],
    ['318','418','513','605','|57'],
    ['320','421','516','608','|67'],
    ['216','314','414','509','60x'],
    ['217','315','415','510','602'],
    ['316','416','511','603','|97'],
    ['422','517','609','703'],
    ['425','520','612','706'],
    ['426','521','612','707'],
]

def x_of(i): return round(i * COL_W, 2)
def fid(l, w='S'): return f"F{l}" if w == 'S' else f"N{l}"
def nid(l, label, w='S'):
    if label.startswith('|'): return f"L{label[1:]}_{fid(l,w)}"
    if label.startswith('st'): return f"ENT{label[2:]}"
    return f"{fid(l,w)}_{label}"

floors = []; rooms = []; nodes = []; label_to_node = {}
def add(n): nodes.append(n); label_to_node[n['label']] = n

# 南楼教室（全部南侧）
for level in range(1, 8):
    fl = {"id": fid(level), "level": level, "wing": "S", "name": f"{level}层（南楼）",
          "elevation": round((level-1)*FH, 2), "displayY": round(2.2+(level-1)*6.0, 2), "rooms": []}
    for idx, label in enumerate(LEVELS[level]):
        if label == '---' or not (label[0].isdigit() and not label.endswith('x')):
            continue
        n = {"id": nid(level,label), "name": label, "label": label, "floor": fl['id'],
             "level": level, "wing": "S", "x": x_of(idx), "z": ROOM_Z, "side": "S", "type": "room", "room": label}
        add(n)
        r = {"id": label, "node": n['id'], "name": label, "floor": fl['id'], "level": level,
             "wing": "S", "x": x_of(idx), "z": ROOM_Z, "side": "S", "type": "classroom",
             "aliases": ALIASES.get(label, []), "source": "floorplan", "confidence": "room-number-confirmed; z-estimated"}
        fl['rooms'].append(r); rooms.append(r)
    floors.append(fl)

# 北楼教室（北侧）
for level in (4, 5):
    fl = {"id": fid(level,'N'), "level": level, "wing": "N", "name": f"{level}层（北楼）",
          "elevation": round((level-1)*FH, 2), "displayY": round(2.2+(level-1)*6.0, 2), "rooms": []}
    for idx, label in enumerate(NORTH[level]):
        x = round(60 + idx*15.6, 2)
        z = -54.5
        n = {"id": nid(level,label,'N'), "name": label, "label": label, "floor": fl['id'],
             "level": level, "wing": "N", "x": x, "z": z, "side": "N", "type": "room", "room": label}
        add(n)
        r = {"id": label, "node": n['id'], "name": label, "floor": fl['id'], "level": level,
             "wing": "N", "x": x, "z": z, "side": "N", "type": "classroom", "aliases": [],
             "source": "floorplan", "confidence": "room-number-confirmed; x/z-estimated"}
        fl['rooms'].append(r); rooms.append(r)
    floors.append(fl)

# F1–F7 整层倾斜（楼板+教室+走廊+楼梯一起转）
# 附件 72m 长、20° → 总高差 ~24.6m；270m 长按同高差折算约 5°。
for f in floors:
    if f['wing'] == 'S':
        f['slabTiltDeg'] = 5.0
        f['slabTiltAxis'] = 'Z'
        f['slabTiltNote'] = '整层示意倾斜（楼板+教室+走廊+楼梯）'

# 走廊 + 南侧服务带/楼梯
corridor = {}
service = []
for level in range(1, 8):
    for idx, label in enumerate(LEVELS[level]):
        if label == '---':
            continue
        c = {"id": f"C_F{level}_{idx}", "name": f"{level}层走廊{idx}", "label": f"C_F{level}_{idx}",
             "floor": f"F{level}", "level": level, "wing": "S", "x": x_of(idx), "z": CORR_Z, "type": "corridor"}
        add(c); corridor[(level, idx)] = c
        if label.startswith('|'):
            s = {"id": nid(level,label), "name": label, "label": label, "floor": f"F{level}",
                 "level": level, "wing": "S", "x": x_of(idx), "z": SERVICE_Z, "type": "stair"}
            add(s); service.append(s)
        elif label.endswith('x'):
            s = {"id": nid(level,label), "name": label, "label": label, "floor": f"F{level}",
                 "level": level, "wing": "S", "x": x_of(idx), "z": SERVICE_Z, "type": "void"}
            add(s); service.append(s)

# 3F 321/324：平面图可见，原始图只有 31x 占位；位置为估算
base31 = label_to_node.get('31x')
if base31:
    f3 = next(f for f in floors if f['id'] == 'F3')
    for i, rid in enumerate(['321', '324']):
        x = round(base31['x'] + (-3 if i == 0 else 3), 2)
        n = {"id": f"F3_{rid}", "name": rid, "label": rid, "floor": "F3", "level": 3,
             "wing": "S", "x": x, "z": ROOM_Z, "side": "S", "type": "room", "room": rid}
        add(n)
        r = {"id": rid, "node": n['id'], "name": rid, "floor": "F3", "level": 3,
             "wing": "S", "x": x, "z": ROOM_Z, "side": "S", "type": "classroom",
             "aliases": [], "source": "floorplan", "confidence": "room-number-confirmed; x-estimated"}
        f3['rooms'].append(r); rooms.append(r)

# 北楼走廊
corridor_n = {}
for level in (4, 5):
    for idx, label in enumerate(NORTH[level]):
        c = {"id": f"C_N{level}_{idx}", "name": f"北{level}走廊{idx}", "label": f"C_N{level}_{idx}",
             "floor": f"N{level}", "level": level, "wing": "N", "x": round(60+idx*15.6,2), "z": -50.0, "type": "corridor"}
        add(c); corridor_n[(level, idx)] = c

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

# 电梯（服务带）
elevators = []
for shaft, levels in [("ELW", range(1,8)), ("ELE", range(1,7))]:
    for level in levels:
        x = x_of(0) if shaft == "ELW" else x_of(16)
        n = {"id":f"{shaft}_F{level}","name":"西电梯" if shaft=="ELW" else "东电梯",
             "label":f"{shaft}_F{level}","floor":f"F{level}","level":level,"wing":"S",
             "x":x,"z":SERVICE_Z,"type":"elevator"}
        add(n)
        elevators.append({"id":shaft,"floor":f"F{level}","level":level,"node":n['id'],"x":x,"z":SERVICE_Z})

# ---------------- 边 ----------------
edges = []; keys = set()
def add_edge(a,b,d,t,kind):
    if a==b or a not in {n['id'] for n in nodes} or b not in {n['id'] for n in nodes}: return
    k=tuple(sorted((a,b)))
    if k in keys: return
    keys.add(k)
    edges.append({"from":a,"to":b,"distance":round(max(1.0,d),2),"time":round(max(1.0,t),2),"type":kind})

# 走廊链
for level in range(1,8):
    cols=[i for i,l in enumerate(LEVELS[level]) if l!='---']
    for a,b in zip(cols,cols[1:]):
        ca,cb=corridor[(level,a)],corridor[(level,b)]
        d=abs(cb['x']-ca['x']); add_edge(ca['id'],cb['id'],d,d/WALK,"walk")
for level in (4,5):
    for a,b in zip(range(5),range(1,5)):
        ca,cb=corridor_n[(level,a)],corridor_n[(level,b)]
        add_edge(ca['id'],cb['id'],abs(cb['x']-ca['x']),abs(cb['x']-ca['x'])/WALK,"walk")

# 房间/服务 -> 走廊
for level in range(1,8):
    for idx,label in enumerate(LEVELS[level]):
        if label=='---': continue
        c=corridor[(level,idx)]
        t=label_to_node.get(label)
        if not t or t['type']=='corridor': continue
        d=abs(t['z']-c['z'])+abs(t['x']-c['x'])
        add_edge(t['id'],c['id'],d,d/WALK,"door" if t['type']=='room' else "service")
for level in (4,5):
    for idx,label in enumerate(NORTH[level]):
        c=corridor_n[(level,idx)]; t=label_to_node.get(label)
        if t:
            d=abs(t['z']-c['z'])+abs(t['x']-c['x'])
            add_edge(t['id'],c['id'],d,d/WALK,"door")

# 3F 321/324 -> 走廊（31x 列；按几何距离，不写死 8m）
for rid in ('321','324'):
    n = next((x for x in nodes if x['id'] == f'F3_{rid}'), None)
    c = corridor.get((3, 12))
    if n and c:
        d = abs(n['x'] - c['x']) + abs(n['z'] - c['z'])
        add_edge(n['id'], c['id'], d, d / WALK, "door")

# 楼梯柱：按原始序列建固定 x 的 core
cores = []
for si, seq in enumerate(SEQUENCES):
    xs=[]; levels=[]
    for label in seq:
        n=label_to_node.get(label)
        if n:
            xs.append(n['x']); levels.append(n['level'])
    if not xs: continue
    x=round(sum(xs)/len(xs),2)
    for level in sorted(set(levels)):
        cid=f"K{si}_F{level}"
        n={"id":cid,"name":f"楼梯{si+1}","label":cid,"floor":f"F{level}","level":level,
           "wing":"S","x":x,"z":SERVICE_Z,"type":"stair_core"}
        add(n)
        cores.append({"id":f"K{si}","floor":f"F{level}","level":level,"node":cid,"x":x,"z":SERVICE_Z})
        # 接最近走廊
        cs=[c for c in corridor.values() if c['floor']==f"F{level}"]
        if cs:
            c=min(cs,key=lambda c:abs(c['x']-x))
            d=abs(c['x']-x)+abs(c['z']-SERVICE_Z)
            add_edge(cid,c['id'],d,d/WALK,"door")
    # 竖向
    lv=sorted(set(levels))
    for a,b in zip(lv,lv[1:]):
        add_edge(f"K{si}_F{a}",f"K{si}_F{b}",FH,STAIR,"stairs")

# 北楼内部竖向（平台/坡道，通道口 8/9）
add_edge("C_N4_1","C_N5_1",FH,STAIR,"ramp")  # 443↔537 附近
add_edge("C_N4_3","C_N5_3",FH,STAIR,"ramp")  # 434↔529 附近
# 南楼 ↔ 北楼
add_edge("C_F4_5","C_N4_1",10,20,"passage")
add_edge("C_F4_7","C_N4_3",10,20,"passage")

# 入口 -> 走廊
for e in entrances:
    target = next((n for n in nodes if n['id'] == e['attach']), None)
    if not target: continue
    pool = corridor_n if target['wing'] == 'N' else corridor
    cs=[c for c in pool.values() if c['floor']==target['floor']]
    if not cs: continue
    c=min(cs,key=lambda c:abs(c['x']-e['x']))
    d=abs(c['x']-e['x'])+abs(c['z']-e['z'])
    add_edge(e['node'],c['id'],d,d/WALK,"entrance")

# 电梯
for shaft, levels in [("ELW",range(1,8)),("ELE",range(1,7))]:
    for a,b in zip(levels,levels[1:]):
        add_edge(f"{shaft}_F{a}",f"{shaft}_F{b}",FH,ELEV,"elevator")
for e in elevators:
    cs=[c for c in corridor.values() if c['floor']==e['floor']]
    if cs:
        c=min(cs,key=lambda c:abs(c['x']-e['x']))
        d=abs(c['x']-e['x'])+abs(c['z']-SERVICE_Z)
        add_edge(e['node'],c['id'],d,d/WALK,"walk")

# ---------------- 校验 / 路由 ----------------
adj={}
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
            if nd<dist.get(v,1e18): dist[v]=nd; prev[v]=u; heapq.heappush(pq,(nd,v))
    if b not in dist: return None
    path=[b]
    while path[-1]!=a: path.append(prev[path[-1]])
    path.reverse(); return {"path":path,"time":round(dist[b],1)}
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

PASSAGE_GROUPS = {
    "1": ["101", "201", "203", "301", "303", "401", "403", "501"],
    "23": ["105", "106", "107", "206", "207", "208", "211", "306", "307", "308", "311", "406", "407", "408", "411", "502", "503", "506", "507"],
    "45": ["215", "216", "217", "312", "314", "315", "412", "414", "415", "509", "510", "511", "601", "602", "603"],
    "6": ["316", "318", "416", "418", "419", "513", "514", "605", "606", "608", "701"],
    "71": ["320", "421", "516", "517", "609", "703"],
    "72": ["422", "425", "426", "520", "521", "612", "613", "706", "707"],
    "8": ["442", "443", "537", "538"],
    "91": ["532", "437", "434", "529"],
    "92": ["433", "528"],
}

data={"meta":{"buildingId":"B","name":"B栋（西二楼）","units":"meter","version":"4.0.0",
              "generatedAt":"2026-11-01","structure":"single-loaded-classrooms + north-service-band + north-wing",
              "dimensions":{"length":LENGTH,"widthMin":WIDTH_MIN,"widthMax":WIDTH_MAX,"height":HEIGHT,"floorHeight":round(FH,2)},
              "floors":7,"northFloors":[4,5],"roomCount":len(rooms),"nodeCount":len(nodes),"edgeCount":len(edges),
              "confirmed":[
                  "7 层南楼 + 北楼仅 4/5 层", "每层教室名单（平面图/0gaowei/BMap）",
                  "教室在南侧、北侧为楼梯/卫生间/办公室/空位", "6F/7F 北侧为楼顶",
                  "270m×19-40m×40m", "9 个通道口/16 个物理入口 GPS", "西电梯到 7 层、东电梯到 6 层"],
              "estimated":[
                  "教室中心 z=+8、服务带 z=-8、走廊 z=0；房间进深 8m",
                  "列距 16.875m（270/16）；北楼 5 间按 15.6m 排",
                  "楼梯柱 x=原始图对应列平均；北楼 x 从 60m 起",
                  "宽度 19-40m 未逐段确认，页面按 40m 示意",
                  "入口到门的精确对应、楼梯柱精确位置未实测"],
              "notes":["教室单侧；北侧是服务带，不是教室","北楼 N4/N5 独立；6F/7F 北侧不建教室",
                       "321/324 已按平面图补入（x 为估算）；5F 508 未确认，暂不建",
                       "F1–F7 整层按附件斜楼折算倾斜 5°（楼板+教室+走廊+楼梯）",
                       "房间/楼梯/入口均接走廊；竖向用固定 x 的 core 连接","不建模：卫生间/办公室内部、家具"],
              "source":["7 张 1F-7F 平面图","cnblogs izcat /p/14871530.html 原始图","BMap 16 入口 GPS","西电官方电梯/北楼说明","用户 270×19-40×40m"]},
      "floors":floors,"rooms":rooms,"nodes":nodes,"edges":edges,"cores":cores,
      "stairs":[n for n in nodes if n['type']=='stair'],
      "elevators":elevators,"entrances":entrances,"passageGroups":PASSAGE_GROUPS,"routes":routes,
      "validation":{"reachableFromENT1":len(r1),"missingRooms":miss_rooms,"missingEntrances":miss_ents,"entrancesWithUnreachableRooms":bad}}

os.makedirs(os.path.join(ROOT,'assets'),exist_ok=True)
open(os.path.join(ROOT,'assets','b-building-data.js'),'w',encoding='utf-8').write(
    "/* 自动生成：B栋结构 v4（单侧教室+北侧服务带+北楼） */\nwindow.B_BUILDING_DATA = "+
    json.dumps(data,ensure_ascii=False,indent=2)+";\n")
open(os.path.join(ROOT,'handoff','b-building-data.json'),'w',encoding='utf-8').write(
    json.dumps(data,ensure_ascii=False,indent=2))
print('rooms',len(rooms),'nodes',len(nodes),'edges',len(edges),'cores',len(cores),'entrances',len(entrances))
print('missing rooms',len(miss_rooms),'missing ents',len(miss_ents),'bad entrances',len(bad))
for r in routes: print(('OK ' if r['found'] else 'FAIL '),r['name'],r['time'],len(r['path']))



