# -*- coding: utf-8 -*-
"""按 3d.html 的相机参数，把 assets/data.js 的 2.5D 场景用透视投影渲染成 PNG。
用途：沙箱内无法启动浏览器时，做几何/布局预览；不是浏览器截图。
"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

CROSS = "--cross" in sys.argv

ROOT = r"C:\Users\王\Desktop\11.1\demo"
DATA = json.load(open(os.path.join(ROOT, "handoff", "data.json"), encoding="utf-8"))

W, H = 1600, 1000
FOV = 42.0
EYE = np.array([60.0, 46.0, 64.0])
TARGET = np.array([20.0, 5.5, 9.0])
UP = np.array([0.0, 1.0, 0.0])


def normalize(v):
    n = np.linalg.norm(v)
    return v / n if n else v


def look_at(eye, target, up):
    fwd = normalize(target - eye)
    side = normalize(np.cross(fwd, up))
    u = np.cross(side, fwd)
    M = np.eye(4)
    M[0, :3] = side
    M[1, :3] = u
    M[2, :3] = -fwd
    M[0, 3] = -np.dot(side, eye)
    M[1, 3] = -np.dot(u, eye)
    M[2, 3] = np.dot(fwd, eye)
    return M


VIEW = look_at(EYE, TARGET, UP)
F = 1.0 / math.tan(math.radians(FOV) / 2.0)
ASPECT = W / H


def project(p):
    v = VIEW @ np.array([p[0], p[1], p[2], 1.0])
    d = -v[2]
    if d <= 0.2:
        return None
    x = (F / ASPECT) * (v[0] / d)
    y = F * (v[1] / d)
    return ((x * 0.5 + 0.5) * W, (1.0 - (y * 0.5 + 0.5)) * H, d)


def P(x, y, z):
    return project((x, y, z))


def m2px(m, d):
    return m * (H / 2.0) / (math.tan(math.radians(FOV) / 2.0) * d)


def font(size, bold=False):
    paths = [
        r"C:\Windows\Fonts\msyhbd.ttc" if bold else r"C:\Windows\Fonts\msyh.ttc",
        r"C:\Windows\Fonts\simhei.ttf",
        r"C:\Windows\Fonts\arial.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


F_TITLE = font(34, True)
F_SUB = font(17)
F_FLOOR = font(26, True)
F_ROOM = font(20, True)
F_LABEL = font(20, True)
F_LEG = font(17)
F_TAG = font(15)

base = Image.new("RGBA", (W, H), (7, 10, 14, 255))


def layer():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def comp(img, lay):
    return Image.alpha_composite(img, lay)


def poly(d, pts, fill=None, outline=None, width=1):
    sp = [P(*p) for p in pts]
    if any(s is None for s in sp):
        return
    xy = [(s[0], s[1]) for s in sp]
    d.polygon(xy, fill=fill, outline=outline, width=width)


def line3(d, a, b, color, width=3):
    pa, pb = P(*a), P(*b)
    if pa and pb:
        d.line([(pa[0], pa[1]), (pb[0], pb[1])], fill=color, width=width)


def dashed3(d, a, b, color, width=3, dash=12, gap=8):
    pa, pb = P(*a), P(*b)
    if not pa or not pb:
        return
    x1, y1 = pa[0], pa[1]
    x2, y2 = pb[0], pb[1]
    L = math.hypot(x2 - x1, y2 - y1)
    if L < 0.1:
        return
    dx, dy = (x2 - x1) / L, (y2 - y1) / L
    t = 0.0
    while t < L:
        u = min(t + dash, L)
        d.line([(x1 + dx * t, y1 + dy * t), (x1 + dx * u, y1 + dy * u)], fill=color, width=width)
        t += dash + gap


def text_bg(d, xy, text, fnt, fg, bg=(13, 26, 40, 225), border=(63, 98, 133, 255), pad=(8, 4)):
    x, y = xy
    bbox = d.textbbox((0, 0), text, font=fnt)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.rounded_rectangle(
        [x - tw / 2 - pad[0], y - th / 2 - pad[1], x + tw / 2 + pad[0], y + th / 2 + pad[1]],
        radius=6, fill=bg, outline=border, width=1,
    )
    d.text((x, y), text, font=fnt, fill=fg, anchor="mm")


def text(d, xy, s, fnt, fg, anchor="mm"):
    d.text(xy, s, font=fnt, fill=fg, anchor=anchor)


# ---------- 1. 地面 + 网格 ----------
lay = layer()
d = ImageDraw.Draw(lay)
poly(d, [(-10, 0, -12), (110, 0, -12), (110, 0, 52), (-10, 0, 52)], fill=(13, 18, 25, 255))
for x in range(-10, 111, 10):
    line3(d, (x, 0.02, -12), (x, 0.02, 52), (22, 32, 44, 150), 1)
for z in range(-10, 53, 10):
    line3(d, (-10, 0.02, z), (110, 0.02, z), (22, 32, 44, 150), 1)
base = comp(base, lay)

# ---------- 2. A楼轮廓（特写视角不画，避免抢主体） ----------

# ---------- 3. 楼板 + 房间 ----------
floors = DATA["building"]["floors"]
SLAB_H = 0.16
# 特写预览：把 F2 的展示高度拉开，避免两层楼在画面里叠在一起
RENDER_Y = {"F1": 2.4, "F2": 16.0}
for idx, fl in enumerate(floors):
    dy = RENDER_Y.get(fl["id"], fl["displayY"])
    lay = layer()
    d = ImageDraw.Draw(lay)
    # 楼板厚度：顶面 + 两个侧面
    top_y = dy + SLAB_H / 2
    bot_y = dy - SLAB_H / 2
    # 侧面（南 / 东）
    poly(d, [(0, bot_y, 18), (40, bot_y, 18), (40, top_y, 18), (0, top_y, 18)], fill=(9, 22, 44, 210))
    poly(d, [(40, bot_y, 0), (40, bot_y, 18), (40, top_y, 18), (40, top_y, 0)], fill=(8, 19, 38, 210))
    # 顶面
    alpha = 170 if idx == 0 else 115
    poly(d, [(0, top_y, 0), (40, top_y, 0), (40, top_y, 18), (0, top_y, 18)],
         fill=(13, 32, 64, alpha), outline=(63, 98, 133, 235), width=2)
    # 房间矩形
    room_top = top_y + 0.11
    for room in fl["rooms"]:
        x, z, w, dd = room["x"], room["z"], room["w"], room["d"]
        poly(d, [(x - w / 2, room_top, z - dd / 2), (x + w / 2, room_top, z - dd / 2),
                 (x + w / 2, room_top, z + dd / 2), (x - w / 2, room_top, z + dd / 2)],
             fill=(16, 30, 48, 55), outline=(79, 115, 150, 225), width=2)
    base = comp(base, lay)

# ---------- 4. 楼层竖向虚线 ----------
if len(floors) >= 2:
    lay = layer()
    d = ImageDraw.Draw(lay)
    y1 = RENDER_Y["F1"] + SLAB_H / 2
    y2 = RENDER_Y["F2"] - SLAB_H / 2
    for (cx, cz) in [(0, 0), (40, 0), (40, 18), (0, 18)]:
        dashed3(d, (cx, y1, cz), (cx, y2, cz), (63, 98, 133, 170), 2, 8, 6)
    base = comp(base, lay)

# ---------- 5. 路线 ----------
node_map = {n["id"]: n for n in DATA["graph"]["nodes"]}
floor_map = {f["id"]: f for f in floors}
edge_map = {}
for e in DATA["graph"]["edges"]:
    edge_map[(e["from"], e["to"])] = e["distance"]
    edge_map[(e["to"], e["from"])] = e["distance"]


def node_pos(n):
    if n.get("floor") is None:
        return (n["x"], 0.14, n["z"])
    fl = floor_map[n["floor"]]
    return (n["x"], RENDER_Y.get(n["floor"], fl["displayY"]) + SLAB_H / 2 + 0.16, n["z"])


if CROSS:
    route = ["F1_room_101", "F1_door_101", "F1_corr_03", "F1_corr_01", "F1_stair_E",
             "F2_stair_E", "F2_corr_01", "F2_corr_02", "F2_door_201", "F2_room_201"]
    route_title = "101 → 201（跨层）"
else:
    route = ["B_path", "B_entrance", "F1_entrance", "F1_lobby", "F1_corr_02", "F1_corr_03", "F1_door_101", "F1_room_101"]
    route_title = "B楼入口 → 101 教室"
lay = layer()
d = ImageDraw.Draw(lay)
for i in range(len(route) - 1):
    a, b = node_map[route[i]], node_map[route[i + 1]]
    pa, pb = node_pos(a), node_pos(b)
    if a.get("floor") is None and b.get("floor") is None:
        dashed3(d, pa, pb, (255, 140, 0, 255), 4, 14, 9)
    elif a.get("floor") is not None and b.get("floor") is not None and a["floor"] != b["floor"]:
        line3(d, pa, pb, (160, 96, 255, 255), 4)
    elif (a.get("floor") is None) != (b.get("floor") is None):
        line3(d, pa, pb, (160, 96, 255, 255), 4)
    else:
        line3(d, pa, pb, (90, 176, 255, 255), 5)

# 起点 / 终点标记改到楼层标签之后单独画，避免被房间编号盖住
base = comp(base, lay)

# ---------- 5. 房间圆点 + 编号 ----------
lay = layer()
d = ImageDraw.Draw(lay)
for fl in floors:
    dy = RENDER_Y.get(fl["id"], fl["displayY"])
    top_y = dy + SLAB_H / 2
    for room in fl["rooms"]:
        pc = P(room["x"], top_y + 0.02, room["z"])
        if pc:
            r = max(4, m2px(0.3, pc[2]))
            d.ellipse([pc[0] - r, pc[1] - r, pc[0] + r, pc[1] + r], fill=(90, 176, 255, 255))
        pl = P(room["x"], top_y + 0.86, room["z"])
        if pl:
            text_bg(d, (pl[0], pl[1]), room["id"], F_ROOM, (235, 244, 252, 255))
base = comp(base, lay)

# ---------- 6. 楼层标签 ----------
lay = layer()
d = ImageDraw.Draw(lay)
for fl in floors:
    p = P(42.5, RENDER_Y.get(fl["id"], fl["displayY"]) + 0.4, 9)
    if p:
        text_bg(d, (p[0], p[1]), fl["id"] + " · " + ("一层" if fl["level"] == 1 else "二层"),
                F_FLOOR, (90, 176, 255, 255), bg=(9, 22, 44, 235), pad=(12, 6))
base = comp(base, lay)

# ---------- 6.5 起点 / 终点（最上层） ----------
lay = layer()
d = ImageDraw.Draw(lay)
markers = [
    (route[0], (64, 192, 96, 255), "起点", -1, 0),
    (route[-1], (224, 64, 64, 255), "终点", 0, 40),
]
for nid, color, label, side, dyoff in markers:
    n = node_map[nid]
    s = P(*node_pos(n))
    if not s:
        continue
    r = max(8, m2px(0.5, s[2]))
    d.ellipse([s[0] - r, s[1] - r, s[0] + r, s[1] + r], fill=color, outline=(255, 255, 255, 235), width=3)
    text_bg(d, (s[0] + side * (r + 34), s[1] + dyoff), label, F_TAG, (235, 244, 252, 255))
base = comp(base, lay)

# ---------- 7. UI 覆盖层 ----------
lay = layer()
d = ImageDraw.Draw(lay)
# 标题
text(d, (36, 34), "B楼 · 2.5D 室内视图", F_TITLE, (235, 244, 252, 255), anchor="la")
text(d, (36, 82), "特写预览 · 数据：assets/data.js · 坐标：1 单位 = 1 米", F_SUB, (140, 160, 182, 255), anchor="la")
text_bg(d, (36 + 150, 120), "preview render", F_TAG, (159, 208, 255, 255), bg=(18, 34, 54, 235))

# 路线卡
dist = 0.0
for i in range(len(route) - 1):
    dist += edge_map.get((route[i], route[i + 1]), 0.0)
card_x, card_y = 36, H - 150
d.rounded_rectangle([card_x, card_y, card_x + 360, card_y + 112], radius=10, fill=(13, 18, 25, 235), outline=(63, 98, 133, 255), width=1)
text(d, (card_x + 18, card_y + 20), "默认路线", F_TAG, (120, 150, 180, 255), anchor="la")
text(d, (card_x + 18, card_y + 46), route_title, F_LABEL, (235, 244, 252, 255), anchor="la")
text(d, (card_x + 18, card_y + 78), f"{len(route)} 个节点 · 约 {dist:.0f} m · 室内 + 入口", F_SUB, (140, 160, 182, 255), anchor="la")

# 图例
lx, ly = W - 300, H - 190
d.rounded_rectangle([lx, ly, W - 36, H - 36], radius=10, fill=(13, 18, 25, 235), outline=(63, 98, 133, 255), width=1)
text(d, (lx + 18, ly + 18), "图例", F_LABEL, (200, 216, 232, 255), anchor="la")
legend = [((90, 176, 255), "室内路线"), ((255, 140, 0), "室外路线"), ((160, 96, 255), "跨层 / 入口"), ((64, 192, 96), "起点"), ((224, 64, 64), "终点")]
for i, (c, s) in enumerate(legend):
    yy = ly + 52 + i * 24
    d.line([(lx + 18, yy), (lx + 52, yy)], fill=c + (255,), width=4)
    text(d, (lx + 62, yy), s, F_LEG, (170, 190, 210, 255), anchor="lm")
base = comp(base, lay)

out = os.path.join(ROOT, "handoff", "render-indoor-cross.png" if CROSS else "render-indoor.png")
base.convert("RGB").save(out, quality=95)
print("saved", out, base.size)
