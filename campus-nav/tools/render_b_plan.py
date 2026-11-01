# -*- coding: utf-8 -*-
"""B 栋「单侧教室」结构平面预览图（示意，非施工图）。

只读 handoff/b-building-data.json（v4），输出 handoff/b-plan-preview.png。
画布 2000x1600，深色背景。

数据约定（v4，见 meta.structure = single-loaded-classrooms + north-service-band）：
  南楼 F1-F7  走廊 z=0；教室 z=+8（南侧，图中走廊下方）
              楼梯 / core / 电梯 / 空位 z=-8（北侧，图中走廊上方）
  北楼 N4/N5  走廊 z=-50；教室 z=-54.5（教室在走廊北侧，图中走廊上方）；入口 z=-42
  6F/7F 北侧为楼顶；北楼仅 4/5 层。

用法： python tools/render_b_plan.py
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA_PATH = os.path.join(ROOT, "handoff", "b-building-data.json")
OUT_PATH = os.path.join(ROOT, "handoff", "b-plan-preview.png")

# ------------------------------------------------------------------ 画布 / 色板
W, H = 2000, 1600
BG = (9, 13, 19)
PANEL = (13, 18, 26)
FG = (232, 240, 248)
MUTED = (146, 164, 184)
DIM = (100, 116, 134)
LINE = (40, 54, 70)
ACCENT = (98, 182, 255)
WARM = (214, 176, 116)

ROOM_F = (23, 42, 63)
ROOM_B = (92, 141, 179)
NROOM_F = (31, 36, 63)
NROOM_B = (136, 130, 210)
COR_F = (30, 47, 67)
COR_L = (64, 94, 126)
SVC_F = (16, 22, 31)
SVC_B = (40, 52, 68)
CORE_F = (26, 80, 65)
CORE_B = (88, 198, 150)
CORE_T = (176, 240, 212)
ELEV_F = (44, 58, 132)
ELEV_B = (118, 138, 236)
VOID_B = (200, 154, 76)
ROOF_H = (52, 64, 80)
PASS = (150, 234, 128)
DOOR = (232, 242, 252)
ENT = (255, 168, 48)

# ------------------------------------------------------------------ 版面常量
X0, X1 = 248.0, 1848.0            # x = 0m / 270m 的像素位置（横向等比）
SCALE = (X1 - X0) / 270.0
BAND_L, BAND_R = X0 - 28, X1 + 28

ROOM_W, ROOM_H = 54, 32
CORE_W, CORE_H = 44, 22
RIGHT_TEXT = 1992

Y_TITLE = 26
Y_SUB = 84
Y_STATS = 112
Y_SEC1 = 148
Y_AXIS = 188
Y_ROWS = 218
ROW_H = 114

Y_SEC_N = 1028
Y_NROW = 1062
N_ROW_H = 100

Y_FOOT = 1256

_FONTS = {}


def font(size, bold=False, mono=False):
    key = (size, bold)
    if key in _FONTS:
        return _FONTS[key]
    cands = []
    if bold:
        cands += [r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\simhei.ttf"]
    cands += [r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\simhei.ttf",
              r"C:\Windows\Fonts\simsun.ttc"]
    f = None
    for p in cands:
        if os.path.exists(p):
            try:
                f = ImageFont.truetype(p, int(round(size)))
                break
            except Exception:
                f = None
    if f is None:
        f = ImageFont.load_default()
    _FONTS[key] = f
    return f


F_TITLE = font(38, True)
F_SUB = font(19)
F_STATS = font(15)
F_SEC = font(19, True)
F_SEC2 = font(15)
F_FLOOR = font(22, True)
F_SMALL = font(11)
F_TINY = font(10)
F_ROOM = font(13, True)
F_ROOM_S = font(11, True)
F_CORE = font(10, True)
F_ENT = font(11)
F_LEG = font(13)
F_LEG_T = font(15, True)
F_NOTE = font(13, True)
F_NOTE2 = font(12.5)

X = lambda m: X0 + m * SCALE  # noqa: E731


# ------------------------------------------------------------------ 绘制原语
def dash_line(d, p0, p1, color, width=1, dash=6, gap=4):
    x0, y0 = p0
    x1, y1 = p1
    dx, dy = x1 - x0, y1 - y0
    dist = max(abs(dx), abs(dy))
    if dist < 1:
        return
    ux, uy = dx / dist, dy / dist
    t = 0.0
    while t < dist:
        e = min(t + dash, dist)
        d.line([(x0 + ux * t, y0 + uy * t), (x0 + ux * e, y0 + uy * e)],
               fill=color, width=width)
        t = e + gap


def dash_rect(d, box, color, width=1, dash=5, gap=3):
    x0, y0, x1, y1 = box
    dash_line(d, (x0, y0), (x1, y0), color, width, dash, gap)
    dash_line(d, (x0, y1), (x1, y1), color, width, dash, gap)
    dash_line(d, (x0, y0), (x0, y1), color, width, dash, gap)
    dash_line(d, (x1, y0), (x1, y1), color, width, dash, gap)


def hatch(d, box, color, step=9):
    """45° 斜纹，裁剪在 box 内。"""
    x0, y0, x1, y1 = [int(round(v)) for v in box]
    h = y1 - y0
    for sx in range(x0 - h, x1 + 1, step):
        ax, ay, bx, by = sx, y0, sx + h, y1
        if bx <= x0 or ax >= x1:
            continue
        if ax < x0:
            ay = y0 + (x0 - ax)
            ax = x0
        if bx > x1:
            by = y1 - (bx - x1)
            bx = x1
        d.line([(ax, ay), (bx, by)], fill=color, width=1)


def arrow_up(d, cx, y_from, y_to, color, head_w=14, head_h=8, shaft=4):
    """竖直向上箭头：尾部 y_from（下）、箭头尖 y_to（上）。"""
    d.rectangle([cx - shaft / 2.0, y_to + head_h - 1, cx + shaft / 2.0, y_from], fill=color)
    d.polygon([(cx, y_to), (cx - head_w / 2.0, y_to + head_h),
               (cx + head_w / 2.0, y_to + head_h)], fill=color)


def rich(d, x, y, parts, gapx=3):
    for s, f, c in parts:
        d.text((x, y), s, font=f, fill=c)
        x += d.textlength(s, font=f) + gapx
    return x


# ------------------------------------------------------------------ 读数据
with open(DATA_PATH, encoding="utf-8") as fh:
    D = json.load(fh)

meta = D["meta"]
floors = D["floors"]
s_floors = [f for f in floors if f["wing"] == "S"]
n_floors = [f for f in floors if f["wing"] == "N"]
stairs, elevators, entrances, cores, nodes = (
    D["stairs"], D["elevators"], D["entrances"], D["cores"], D["nodes"])

cores_by_floor, stairs_by_floor = {}, {}
for c in cores:
    cores_by_floor.setdefault(c["floor"], {})[c["id"]] = c["x"]
for s in stairs:
    stairs_by_floor.setdefault(s["floor"], []).append(s)
voids_by_floor, elev_by_floor, ent_by_floor = {}, {}, {}
for n in nodes:
    if n["type"] == "void":
        voids_by_floor.setdefault(n["floor"], []).append((n["id"], n["x"]))
for e in elevators:
    elev_by_floor.setdefault(e["floor"], []).append(e)
for e in entrances:
    ent_by_floor.setdefault(e["floor"], []).append(e)

room_count = sum(len(f["rooms"]) for f in floors)
core_groups = len({c["id"] for c in cores})
assert room_count == meta["roomCount"], (room_count, meta["roomCount"])

# 门边：房间 -> 走廊（取自 edges[type=door]），决定门开在教室的哪一侧
node_by_id = {n["id"]: n for n in nodes}
door_face = {}
for e in D["edges"]:
    if e.get("type") != "door":
        continue
    a, b = node_by_id.get(e["from"]), node_by_id.get(e["to"])
    if not a or not b:
        continue
    if a["type"] == "room" and b["type"] == "corridor":
        door_face[a["id"]] = "N" if b["z"] < a["z"] else "S"
    elif b["type"] == "room" and a["type"] == "corridor":
        door_face[b["id"]] = "N" if a["z"] < b["z"] else "S"
door_ok = sum(1 for f in floors for r in f["rooms"] if r["node"] in door_face)
_check = ["F4_401", "F4_403", "F4_406", "F4_407", "F5_501", "F5_502"]
south_corr_ok = all(door_face.get(n) == "N" for n in _check)

# ------------------------------------------------------------------ 画布
img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# 标题区
d.text((58, Y_TITLE), "B栋单侧教室结构（示意）", font=F_TITLE, fill=FG)
d.rectangle([58, Y_TITLE + 52, 96, Y_TITLE + 56], fill=ACCENT)
d.text((58, Y_SUB), "尺寸 270×19–40×40m；z/列距为估算", font=F_SUB, fill=MUTED)
rich(d, 58, Y_STATS, [
    (f"教室 {room_count} 间", F_STATS, ACCENT),
    (" · ", F_STATS, DIM),
    (f"入口 {len(entrances)} 个", F_STATS, ACCENT),
    (" · ", F_STATS, DIM),
    (f"楼梯 {len(stairs)} 个", F_STATS, ACCENT),
    (" ｜ 节点 ", F_STATS, DIM),
    (f"{meta['nodeCount']}", F_STATS, MUTED),
    (" + ", F_STATS, DIM),
    (f"{core_groups} 组 core", F_STATS, MUTED),
    (" ｜ 边 ", F_STATS, DIM),
    (f"{meta['edgeCount']}", F_STATS, MUTED),
    (" ｜ 数据 v", F_STATS, DIM),
    (meta["version"], F_STATS, MUTED),
])

# 指北针
ac_x = 1898
d.line([(ac_x, 92), (ac_x, 44)], fill=ACCENT, width=2)
d.polygon([(ac_x, 34), (ac_x - 8, 48), (ac_x + 8, 48)], fill=ACCENT)
d.text((ac_x + 18, 38), "北", font=font(20, True), fill=ACCENT)
d.text((ac_x + 18, 68), "图纸上方为北", font=F_TINY, fill=DIM)

# 南楼分区标题
rich(d, 58, Y_SEC1, [
    ("南楼 F1–F7", F_SEC, ACCENT),
    (" · 单侧教室：", F_SEC2, MUTED),
    ("走廊 z=0", F_SEC2, FG),
    (" ｜ 教室在走廊南侧（图下方） ｜ 楼梯·服务在走廊北侧（图上方）", F_SEC2, MUTED),
])

# x 轴标尺
d.line([(X(0), Y_AXIS), (X(270), Y_AXIS)], fill=LINE, width=1)
for m in range(0, 271, 30):
    px = X(m)
    d.line([(px, Y_AXIS), (px, Y_AXIS + 5)], fill=LINE, width=1)
    d.text((px, Y_AXIS + 8), f"{m}", font=F_TINY, fill=DIM, anchor="ma")
d.text((X(270) + 12, Y_AXIS + 8), "m", font=F_TINY, fill=DIM)
d.text((X(270) + 2, Y_AXIS - 18), "x 坐标 (m)", font=F_TINY, fill=DIM, anchor="ra")


# ------------------------------------------------------------------ 南楼行
def room_boxes(rooms):
    """按相邻间距收窄房间宽度，避免密集房间重叠（如 F3 的 321/324 只隔 6m）。"""
    xs = [r["x"] for r in rooms]
    out = []
    for i, r in enumerate(rooms):
        if len(xs) > 1:
            gap_l = (xs[i] - xs[i - 1]) if i > 0 else (xs[1] - xs[0])
            gap_r = (xs[i + 1] - xs[i]) if i < len(xs) - 1 else (xs[-1] - xs[-2])
        else:
            gap_l = gap_r = 20.0
        half = min(ROOM_W / 2.0, gap_l * SCALE / 2.0 - 2.5, gap_r * SCALE / 2.0 - 2.5)
        out.append((r, max(15.0, half)))
    return out


def draw_rooms(rooms, y_room, wing):
    """画一间教室；x 为估算（x-estimated / x/z-estimated）的加虚线框，
    并在朝向走廊的一侧画门（门边取自数据 edges[type=door]）。"""
    fill = ROOM_F if wing == "S" else NROOM_F
    bd = ROOM_B if wing == "S" else NROOM_B
    for r, half in room_boxes(rooms):
        cx = X(r["x"])
        box = [cx - half, y_room, cx + half, y_room + ROOM_H]
        d.rounded_rectangle(box, radius=3, fill=fill, outline=bd, width=1)
        if ("x-estimated" in r["confidence"]) or ("x/z" in r["confidence"]):
            dash_rect(d, box, bd, 1, 3, 3)
        fnt = F_ROOM if (half * 2) >= 44 else F_ROOM_S
        d.text((cx, y_room + ROOM_H / 2.0 - 1), r["id"], font=fnt, fill=FG, anchor="mm")
        # 门：贴在朝走廊的边（南楼=上边，北楼=下边）
        face = door_face.get(r["node"], "N" if wing == "S" else "S")
        y_edge = y_room if face == "N" else y_room + ROOM_H
        dw = 12 if (half * 2) >= 44 else 8
        d.rectangle([cx - dw / 2.0, y_edge - 1, cx + dw / 2.0, y_edge + 2], fill=DOOR)


def draw_south_row(fl, yt):
    """服务带（北，上）→ 走廊 → 教室（南，下），再叠入口箭头。"""
    y_svc = yt
    y_cor = yt + 40
    y_room = yt + 55
    roof = fl["id"] in ("F6", "F7")

    # 北侧服务带
    svc_box = [BAND_L, y_svc, BAND_R, y_svc + 36]
    d.rectangle(svc_box, fill=SVC_F)
    if roof:
        hatch(d, svc_box, ROOF_H, step=10)
        d.line([(BAND_L, y_svc + 36), (BAND_R, y_svc + 36)], fill=(72, 86, 102), width=1)
    else:
        d.line([(BAND_L, y_svc + 36), (BAND_R, y_svc + 36)], fill=(34, 44, 58), width=1)
    d.line([(BAND_L, y_svc), (BAND_R, y_svc)], fill=SVC_B, width=1)

    # 走廊
    d.rectangle([BAND_L, y_cor, BAND_R, y_cor + 11], fill=COR_F)
    d.line([(BAND_L, y_cor), (BAND_R, y_cor)], fill=COR_L, width=1)
    d.line([(BAND_L, y_cor + 11), (BAND_R, y_cor + 11)], fill=COR_L, width=1)

    # 教室带边界（虚线）
    dash_line(d, (BAND_L, y_room), (BAND_R, y_room), (50, 66, 86), 1, 7, 5)

    # 教室（相邻间距不足时自动收窄，避免重叠；x 为估算的画虚线框）
    draw_rooms(fl["rooms"], y_room, "S")

    # 楼梯柱 core
    for cid, cx_m in sorted(cores_by_floor.get(fl["id"], {}).items(), key=lambda kv: kv[1]):
        cx = X(cx_m)
        box = [cx - CORE_W / 2.0, y_svc + 2, cx + CORE_W / 2.0, y_svc + 2 + CORE_H]
        d.rectangle(box, fill=CORE_F, outline=CORE_B, width=1)
        d.text((cx, box[1] + CORE_H / 2.0), f"楼梯{int(cid[1:]) + 1}", font=F_CORE,
               fill=CORE_T, anchor="mm")

    # 空位 void
    for _vid, vx_m in voids_by_floor.get(fl["id"], []):
        cx = X(vx_m)
        box = [cx - CORE_W / 2.0, y_svc + 2, cx + CORE_W / 2.0, y_svc + 2 + CORE_H]
        dash_rect(d, box, VOID_B, 1, 4, 3)
        d.text((cx, box[1] + CORE_H / 2.0 - 1), "空位", font=F_CORE, fill=VOID_B,
               anchor="mm")

    # 电梯（贴走廊一侧）
    for e in elev_by_floor.get(fl["id"], []):
        cx = X(e["x"])
        d.rectangle([cx - 11, y_svc + 26, cx + 11, y_svc + 34], fill=ELEV_F, outline=ELEV_B)

    # 通道口：走廊与服务带之间的开口（竖向连接）
    for s in stairs_by_floor.get(fl["id"], []):
        cx = X(s["x"])
        d.rectangle([cx - 2, y_svc + 36, cx + 2, y_cor + 3], fill=PASS)

    # 入口（橙色箭头，从南侧指入）
    for e in ent_by_floor.get(fl["id"], []):
        cx = X(e["x"])
        tip = y_room + ROOM_H
        arrow_up(d, cx, tip + 17, tip, ENT)
        d.text((cx + 10, tip + 9), e["name"], font=F_ENT, fill=ENT, anchor="lm")


def row_labels(fl, yt):
    color = ACCENT if fl["wing"] == "S" else NROOM_B
    d.rectangle([44, yt + 3, 47, yt + 25], fill=color)
    d.text((58, yt + 1), fl["id"], font=F_FLOOR, fill=color)
    d.text((58, yt + 29), f"{fl['level']}层·{'南楼' if fl['wing'] == 'S' else '北楼'}",
           font=F_SMALL, fill=MUTED)
    d.text((58, yt + 45), f"教室 {len(fl['rooms'])} 间", font=F_SMALL, fill=FG)


for i, fl in enumerate(s_floors):
    yt = Y_ROWS + i * ROW_H
    draw_south_row(fl, yt)
    row_labels(fl, yt)

# F1 服务带内的一处说明（其余楼层同构，不重复标注）
d.text((X(104), Y_ROWS + 18), "北侧服务带：楼梯柱 / 电梯 / 空位",
       font=F_TINY, fill=(122, 140, 158), anchor="lm")

# 6F/7F 楼顶文字
for fid, xm, txt in (("F6", 44, "楼顶（北侧无教室）"), ("F7", 92, "楼顶（北侧无教室）")):
    yt = Y_ROWS + [f["id"] for f in s_floors].index(fid) * ROW_H
    cx = X(xm)
    d.rectangle([cx - 65, yt + 10, cx + 65, yt + 28], fill=SVC_F)
    d.text((cx, yt + 19), txt, font=F_SMALL, fill=(202, 212, 226), anchor="mm")

# 6F/7F 西段留空提示
for fid, xm in (("F6", 44), ("F7", 92)):
    yt = Y_ROWS + [f["id"] for f in s_floors].index(fid) * ROW_H
    d.text((X(xm), yt + 71), "西段无教室节点（数据未建）", font=F_SMALL,
           fill=(112, 128, 148), anchor="mm")

# F1 行右侧 z 向注记
yt1 = Y_ROWS
for yoff, txt, col in ((18, "北侧服务带  z=-8", (128, 148, 166)),
                       (46, "走廊  z=0", FG),
                       (71, "教室  z=+8（南）", ROOM_B)):
    yy = yt1 + yoff
    d.line([(BAND_R + 10, yy), (BAND_R + 26, yy)], fill=LINE, width=1)
    d.text((RIGHT_TEXT, yy), txt, font=F_TINY, fill=col, anchor="rm")

# 楼层区与北楼之间的分隔
d.line([(58, 1010), (BAND_R, 1010)], fill=(26, 34, 44), width=1)

# ------------------------------------------------------------------ 北楼
rich(d, 58, Y_SEC_N, [
    ("北楼 N4 / N5", F_SEC, NROOM_B),
    (" · 仅 4/5 层", F_SEC2, FG),
    ("（1–3F、6–7F 无北楼；x 60–122.4m 独立段；教室在走廊北侧＝图上方）", F_SEC2, MUTED),
])

for i, fl in enumerate(n_floors):
    yt = Y_NROW + i * N_ROW_H
    y_room = yt
    y_cor = yt + 36

    dash_line(d, (X(60) - 28, y_room + ROOM_H), (X(122.4) + 28, y_room + ROOM_H),
              (54, 52, 88), 1, 7, 5)
    draw_rooms(fl["rooms"], y_room, "N")

    cb = [X(60) - 28, y_cor, X(122.4) + 28, y_cor + 11]
    d.rectangle(cb, fill=COR_F)
    d.line([(cb[0], y_cor), (cb[2], y_cor)], fill=COR_L, width=1)
    d.line([(cb[0], y_cor + 11), (cb[2], y_cor + 11)], fill=COR_L, width=1)

    for e in ent_by_floor.get(fl["id"], []):
        cx = X(e["x"])
        tip = y_cor + 11
        arrow_up(d, cx, tip + 17, tip, ENT)
        d.text((cx + 10, tip + 9), e["name"], font=F_ENT, fill=ENT, anchor="lm")

    row_labels(fl, yt + 1)

# 北楼 z 注记
for yoff, txt, col in ((-9, "教室  z=-54.5（北侧）", NROOM_B), (41, "走廊  z=-50", FG)):
    yy = Y_NROW + yoff
    d.line([(X(122.4) + 40, yy), (X(122.4) + 56, yy)], fill=(64, 60, 100), width=1)
    d.text((X(122.4) + 64, yy), txt, font=F_TINY, fill=col, anchor="lm")

d.line([(58, 1240), (BAND_R, 1240)], fill=(26, 34, 44), width=1)

# ------------------------------------------------------------------ 图例
LB = [1180, Y_FOOT, 1948, H - 26]
d.rounded_rectangle(LB, radius=8, fill=PANEL, outline=(30, 40, 52), width=1)
d.text((LB[0] + 24, LB[1] + 15), "图例", font=F_LEG_T, fill=FG)
d.line([(LB[0] + 74, LB[1] + 24), (LB[0] + 98, LB[1] + 24)], fill=LINE, width=1)

lx0, lx1 = LB[0] + 24, LB[0] + 390
ly0, lstep = LB[1] + 52, 41


def leg_room(x, y, fill, bd, dashed=False):
    box = [x, y, x + 26, y + 17]
    d.rounded_rectangle(box, radius=2, fill=fill, outline=bd, width=1)
    if dashed:
        dash_rect(d, box, bd, 1, 3, 3)


leg_room(lx0, ly0, ROOM_F, ROOM_B)
d.text((lx0 + 36, ly0 + 1), "教室（南楼 F1–F7，单侧）", font=F_LEG, fill=MUTED)
leg_room(lx0, ly0 + lstep, NROOM_F, NROOM_B, True)
d.text((lx0 + 36, ly0 + lstep + 1), "教室（北楼；虚线＝x 为估算）", font=F_LEG, fill=MUTED)

bx, by = lx0, ly0 + 2 * lstep
d.rectangle([bx, by, bx + 26, by + 17], fill=CORE_F, outline=CORE_B, width=1)
d.text((bx + 13, by + 8), "楼梯", font=font(8, True), fill=CORE_T, anchor="mm")
d.text((lx0 + 36, ly0 + 2 * lstep + 1), "楼梯柱 core（13 组，编号同 K0–K12）", font=F_LEG, fill=MUTED)

bx, by = lx0, ly0 + 3 * lstep
d.rectangle([bx + 2, by + 5, bx + 24, by + 13], fill=ELEV_F, outline=ELEV_B)
d.text((lx0 + 36, ly0 + 3 * lstep + 1), "电梯（ELW 西 / ELE 东）", font=F_LEG, fill=MUTED)

bx, by = lx0, ly0 + 4 * lstep
d.rectangle([bx + 2, by + 6, bx + 24, by + 14], fill=COR_F, outline=COR_L, width=1)
d.text((lx0 + 36, ly0 + 4 * lstep + 1), "走廊（z=0；北楼 z=-50）", font=F_LEG, fill=MUTED)

bx, by = lx0, ly0 + 5 * lstep
leg_room(bx, by, ROOM_F, ROOM_B)
d.rectangle([bx + 7, by - 1, bx + 19, by + 2], fill=DOOR)
d.text((lx0 + 36, ly0 + 5 * lstep + 1), "门（开向本层走廊）", font=F_LEG, fill=MUTED)

bx, by = lx1, ly0
d.line([(bx + 1, by + 9), (bx + 25, by + 9)], fill=PASS, width=3)
d.text((lx1 + 36, ly0 + 1), "通道口（9，走廊开口）", font=F_LEG, fill=MUTED)

bx, by = lx1, ly0 + lstep
dash_rect(d, [bx, by, bx + 26, by + 17], VOID_B, 1, 4, 3)
d.text((lx1 + 36, ly0 + lstep + 1), "空位 void（4：10x/31x/50x/60x）", font=F_LEG, fill=MUTED)

bx, by = lx1, ly0 + 2 * lstep
d.rectangle([bx, by, bx + 26, by + 17], fill=SVC_F)
hatch(d, [bx, by, bx + 26, by + 17], ROOF_H, step=7)
d.rectangle([bx, by, bx + 26, by + 17], outline=(72, 86, 102), width=1)
d.text((lx1 + 36, ly0 + 2 * lstep + 1), "楼顶（6F/7F 北侧）", font=F_LEG, fill=MUTED)

bx, by = lx1, ly0 + 3 * lstep
d.rectangle([bx + 2, by + 6, bx + 24, by + 14], fill=SVC_F, outline=SVC_B, width=1)
d.text((lx1 + 36, ly0 + 3 * lstep + 1), "北侧服务带（z=-8）", font=F_LEG, fill=MUTED)

bx, by = lx1, ly0 + 4 * lstep
arrow_up(d, bx + 13, by + 18, by + 2, ENT, head_w=15, head_h=8, shaft=4)
d.text((lx1 + 36, ly0 + 4 * lstep + 1), "入口（8，橙色箭头）", font=F_LEG, fill=MUTED)

# ------------------------------------------------------------------ 估算说明
NX = 58
d.text((NX, Y_FOOT + 15), "估算与口径", font=F_NOTE, fill=WARM)
notes = [
    "z 向（估算）：教室 +8 / 走廊 0 / 南侧服务带 -8；北楼 入口 -42 / 走廊 -50 / 教室 -54.5；房间进深按 8m 示意。",
    "列距 16.875m = 270/16；北楼 5 间自 x=60 起按 15.6m 排列；虚线框＝该教室 x 为估算（北楼 10 间、F3 的 321/324）。",
    "楼梯柱 core 的 x＝原始图对应列的平均值（编号 K0–K12 沿用数据，非按 x 从左到右）；通道口 / 入口为近似位置。",
    "楼宽 19–40m 未逐段确认；本图横向按 270m 等比，竖向非等比（仅表达「北在上、南在下」）。",
    f"门：每间教室朝走廊开（door 边接本层走廊，{door_ok}/{room_count} 间已接；"
    f"401/403/406/407、501/502 {'均接南侧走廊' if south_corr_ok else '见数据'}）。",
    "6F/7F 北侧为楼顶；北楼仅 4/5 层（1–3F、6–7F 无北楼）；F6/F7 西段无教室节点，图中留空。",
    "入口 8 个：F1×2、F2×1、F3×3、N4×2（ENT1–6、ENT_NE/NW），位置均按 approx 处理。",
    "只画教室：卫生间 / 办公室 / 配电室 / 值班室等未建模（v4 notes：不建模卫生间办公室内部、家具）。",
    f"数据 handoff/b-building-data.json v4（{room_count} 教室 / {meta['nodeCount']} 节点 / "
    f"{meta['edgeCount']} 边 / {core_groups} 组 core）；本图由 tools/render_b_plan.py 生成。",
]
for i, s in enumerate(notes):
    d.text((NX, Y_FOOT + 46 + i * 25), s, font=F_NOTE2, fill=MUTED)

d.text((NX, Y_FOOT + 46 + len(notes) * 25 + 8),
       "※ 教室编号来自 v4 数据（平面图/0gaowei/BMap）；本图为拓扑投影示意，不能作施工或尺寸复核依据。",
       font=font(11), fill=(112, 126, 142))

img.save(OUT_PATH, optimize=True)
print("saved", OUT_PATH, img.size)
print("rooms", room_count, "| per floor:",
      ", ".join(f"{f['id']}={len(f['rooms'])}" for f in floors))
print("doors", door_ok, "/", room_count, "| face N(S-wing):",
      sum(1 for k, v in door_face.items() if v == "N"),
      "face S(N-wing):", sum(1 for k, v in door_face.items() if v == "S"))
