# -*- coding: utf-8 -*-
"""把 b-building-data.json 画成 7 层 + 北楼 4/5 层的教室覆盖图（示意，非实测）。"""
import json, os
from PIL import Image, ImageDraw, ImageFont

ROOT = r"C:\Users\王\Desktop\11.1\demo"
D = json.load(open(os.path.join(ROOT, "handoff", "b-building-data.json"), encoding="utf-8"))
W, H = 2000, 1520
BG = (9, 13, 19)
FG = (225, 236, 248)
MUTED = (130, 150, 172)
ACCENT = (90, 176, 255)
ROOM = (30, 48, 68)
ROOM_BD = (79, 115, 150)
LOW = (180, 140, 60)
STAIR = (64, 160, 96)
ELEV = (90, 110, 220)
ENT = (255, 170, 50)


def font(sz, bold=False):
    for p in [r"C:\Windows\Fonts\msyhbd.ttc" if bold else r"C:\Windows\Fonts\msyh.ttc",
              r"C:\Windows\Fonts\simhei.ttf"]:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, sz)
            except Exception:
                pass
    return ImageFont.load_default()


F_TITLE = font(40, True)
F_SUB = font(20)
F_FLOOR = font(24, True)
F_ROOM = font(18, True)
F_LEG = font(18)

img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

d.text((60, 40), "B栋 7 层 + 北楼 4/5 层 · 教室覆盖图", font=F_TITLE, fill=FG)
d.text((60, 95), "长 270m / 高 40m 已校准；房间柱距按 270m 铺开，宽度 19–40m 未逐间建模", font=F_SUB, fill=MUTED)
d.text((60, 125), f"教室 {D['meta']['roomCount']} 间 · 节点 {D['meta']['nodeCount']} · 边 {D['meta']['edgeCount']} · 入口 {len(D['entrances'])} 个", font=F_SUB, fill=ACCENT)

X0 = 230
SCALE = 5.8
ROOM_W, ROOM_H = 56, 38
row_y0 = 210
row_h = 135

# 楼层顺序：南楼 F1-F7，然后北楼 N4/N5
order = [f for f in D["floors"] if f["wing"] == "S"] + [f for f in D["floors"] if f["wing"] == "N"]

for i, fl in enumerate(order):
    y = row_y0 + i * row_h
    d.text((60, y + 20), fl["id"], font=F_FLOOR, fill=ACCENT)
    d.text((60, y + 52), ("南楼" if fl["wing"] == "S" else "北楼"), font=F_SUB, fill=MUTED)
    d.text((60, y + 76), f"{len(fl['rooms'])} 间", font=F_SUB, fill=MUTED)

    corridor_y = y + 58
    length_m = D["meta"].get("dimensions", {}).get("length", 270.0)
    x_end = X0 + (length_m - 10.0) * SCALE
    d.line([(X0, corridor_y), (x_end, corridor_y)], fill=(40, 62, 86), width=6)

    # 房间
    for r in fl["rooms"]:
        px = X0 + (r["x"] - 10) * SCALE
        box = [px - ROOM_W / 2, corridor_y - ROOM_H - 6, px + ROOM_W / 2, corridor_y - 6]
        border = LOW if r.get("confidence") == "low" else ROOM_BD
        d.rounded_rectangle(box, radius=5, fill=ROOM, outline=border, width=2)
        d.text((px, corridor_y - ROOM_H / 2 - 6), r["id"], font=F_ROOM, fill=FG, anchor="mm")

    # 楼梯/电梯（本层）
    for s in D["stairs"]:
        if s["floor"] == fl["id"]:
            px = X0 + (s["x"] - 10) * SCALE
            d.rectangle([px - 7, corridor_y + 8, px + 7, corridor_y + 22], fill=STAIR)
    for e in D["elevators"]:
        if e["floor"] == fl["id"]:
            px = X0 + (e["x"] - 10) * SCALE
            d.rectangle([px - 7, corridor_y + 8, px + 7, corridor_y + 22], fill=ELEV)
    # 入口（画在走廊下方，避免压住房间编号）
    for en in D["entrances"]:
        if en["floor"] == fl["id"]:
            px = X0 + (en["x"] - 10) * SCALE
            d.polygon([(px, corridor_y + 26), (px - 8, corridor_y + 44), (px + 8, corridor_y + 44)], fill=ENT)

# 图例
lx, ly = 60, H - 150
leg = [
    ("教室（实线）", ROOM_BD), ("低置信 321/324（黄框）", LOW),
    ("楼梯", STAIR), ("电梯", ELEV), ("入口", ENT),
]
for i, (label, color) in enumerate(leg):
    yy = ly + (i % 3) * 34
    xx = lx + (i // 3) * 330
    d.rectangle([xx, yy, xx + 18, yy + 18], fill=color)
    d.text((xx + 28, yy - 2), label, font=F_LEG, fill=MUTED)

d.text((W - 560, H - 150), "虚线框：仅平面图可见，置信度低", font=F_LEG, fill=LOW)
d.text((W - 560, H - 118), "北楼只有 4/5 层；南楼 7 层，7 层仅东侧局部教室", font=F_LEG, fill=MUTED)
d.text((W - 560, H - 86), "入口/楼梯/电梯为简化位置，尺寸待实测标定", font=F_LEG, fill=MUTED)

out = os.path.join(ROOT, "handoff", "b-floors-preview.png")
img.save(out, quality=95)
print("saved", out, img.size)
