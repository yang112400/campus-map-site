# B 栋 2.5D 模型（v4.1：南楼 7 层 + 北楼 4/5F）—— 交付说明

> 数据唯一源：`assets/b-building-data.js` → `window.B_BUILDING_DATA`
> 同目录文档：`B_STRUCTURE.md`（结构/校验）、`B_DATA_REPORT.md`（覆盖/路线/置信度）
> 主流程页面：`demo/b-package/3d.html`（`b-model-kit` v4.1 本地模型，**不接外部室内站**）

## 1. 怎么打开

- **单文件版（推荐发给别人）**：双击 `3d-standalone.html`，Three.js / OrbitControls / 数据全部内联，**只发这一个文件就行**；
- **分文件版（课程演示/主应用用这个）**：`demo/b-package/3d.html`，必须和 `assets/`、`vendor/` 保持同级：

```text
3d.html
assets/b-building-data.js
assets/b-indoor-nav.js
vendor/three.min.js
vendor/OrbitControls.js
```

- `demo/3d.html` + `demo/assets/b-building-data.js` 是**同模型的原版副本**（不接主流程，只用于对照）；
- 需要离线三维模型时，`preview/b-building.glb` 可导入 Blender（说明见 `preview/B_GLB_README.md`）。

> 如果 `3d.html` 显示“B_BUILDING_DATA 未加载”或“BIndoorNav 未加载”，说明 `assets/b-building-data.js` / `assets/b-indoor-nav.js` 没跟它在一起；直接改用 `3d-standalone.html`，或把 `assets/`、`vendor/` 一起放过去。

## 2. 页面功能

- **9 个楼层块**：南楼 F1–F7 + 北楼 N4/N5，按 270m 长 × 19–40m 宽 × 40m 高、层高 5.71m 布置；
- **单侧教室**：教室在南侧（z=+8），走廊在中间（z=0），楼梯/卫生间/办公室/空位在北侧（z=-8）；北楼 4F/5F 是独立一排（走廊 z=-50、教室 z=-54.5）；6F/7F 北侧是楼顶；
- 楼层按钮动态生成：全部 / F1–F7 / N4 / N5；点楼层显示该层房间编号；
- 示例区：路线下拉（7 条示例路线）+「显示示例」「重置视角」「房间标签」；显示路线后，起点/终点、跨层竖线、路线耗时；
- **起点 / 终点选择 +「规划路线」**：两个下拉都含 8 个入口（放在其所在楼层分组内，文案如「入口 · 东侧南入口1」）与 80 间教室（按楼层分组，文案如「707」）；页面内跑 Dijkstra；规划后 `history.replaceState` 同步 `?from=<入口或节点>&to=<教室节点>&floor=<终点楼层>`（`file://` 下退化 hash）；
- **可读分步指引**：右侧路线卡的 `#rcSteps`（`<ol>`）逐条说明——「从东侧南入口1进入（F1）」「沿走廊向东约 219 米，到东电梯」「乘东电梯到 F6（跨 5 层）」「乘楼梯13 上到 F7」「经通道口进入北楼（N4）」「到达 707（F7）」；卡片同时给耗时/距离/楼层/节点数；
- header「← 返回室外」→ `../real-map.html`；兼容旧 `?route=` 链接。

## 3. URL 参数

| 参数 | 示例 | 说明 |
|---|---|---|
| `from` / `to` | `3d.html?from=ENT1&to=707` | 起点/终点：入口 id 或教室号/节点 id，页面内跑 Dijkstra |
| `route` | `3d.html?route=ENT1,F1_105,F1_101` | 直接给节点 id 序列（调试/旧链接兼容） |
| `floor` | `3d.html?floor=F4` | 初始聚焦楼层（规划后同步为终点楼层，不影响路线计算） |

节点 id 规则：

- 房间：`F1_101`、`F7_707`、`N4_443`；
- 楼梯：`S1_F1` … `S6_F7`（渲染用的楼梯节点另见数据 `stairs`）；
- 电梯：`ELW_F1`（西电梯到 7 层）、`ELE_F1`（东电梯到 6 层）；
- 入口：`ENT1`–`ENT6`、`ENT_NE`、`ENT_NW`。

## 4. 数据

`assets/b-building-data.js` → `window.B_BUILDING_DATA`

- `floors`：9 个楼层块（F1–F7 + N4/N5），含 `displayY`、`elevation`、`rooms`；
- `rooms`：**80 间**（南楼 70 + 北楼 10：F1 4 / F2 9 / F3 14 / F4 16 / F5 14 / F6 9 / F7 4 / N4 5 / N5 5）；3F 的 321/324 已补入（x 为估算）；5F 508 因平面图/原始图未单列，暂不建；
- `nodes`：**265 个**（80 房间 + 91 走廊 + 9 楼梯 + 60 楼梯柱 + 13 电梯站 + 8 入口 + 4 空位）；
- `stairs`：9 个楼梯节点 + 13 组楼梯柱（K0–K12，60 个 `stair_core` 节点）；
- `elevators`：2 组 13 站（西电梯 ELW 到 7 层、东电梯 ELE 到 6 层）；
- `entrances`：**8 个**（6 南 + 2 北），含 BMap GPS 近似值；ENT1/ENT2 挂 F1、ENT3 挂 F2、ENT4–ENT6 挂 F3、ENT_NE/ENT_NW 挂 N4；
- `edges`：**318 条**，`time` 为秒；`routes`：7 条示例路线；
- `passageGroups`：9 组通道口（78 名成员；321/324 不在组内）；
- `validation`：`reachableFromENT1 = 265`、`missingRooms` / `missingEntrances` 为空、`entrancesWithUnreachableRooms = {}`。

## 5. 给主应用的接入点

主应用 `real-map.html` 的 B 栏已经是「入口 + 教室 → 本地页」：

- 终点选 B 栋 → 显示「B楼 · 7层室内」：入口下拉（8 个）+ 教室下拉（80 间，按楼层分组）+「进入 B 楼室内」；
- 入口默认按室外起点经纬度就近选择；按钮新窗口打开 `b-package/3d.html?from=<入口 id>&to=<教室节点>&floor=<教室楼层>`；
- **B 不接外部 `campus-map-site`**：`INDOOR_PROVIDERS.excluded = ["B"]` 保持不变，B 不经过外部深链；
- 页面暴露 `window.__B_MODEL__ = { data, graph, nav, showRoute, setFloor, dijkstra, resolveNode, planRoute }`；
- 路线/分步指引的纯函数在 `assets/b-indoor-nav.js`（`window.BIndoorNav`；同时支持 `module.exports`，供 Node 测试复用）：`buildGraph / dijkstra / resolveNode / buildSteps / pathStats`；
- 如果主应用自己渲染：读 `B_BUILDING_DATA` 的 `floors/rooms/nodes/edges`，节点 id 与上面一致即可；
- 如果以后要把 B 收进 `assets/indoor-providers.js`，可按 `byBuilding` 加一条本地 provider（`local: true` + `urlTemplate: "3d.html?from={entrance}&to={room}&floor={floor}"`），并支持 `urlTemplate` 优先于 hash 深链；当前实现不走这条分支。

## 6. 限制（务必在答辩时说明）

- **可确认**：9 个楼层块（南楼 7 层 + 北楼仅 4/5 层）、每层教室名单、6F/7F 北侧楼顶、270×19–40×40m、9 个通道口、16 个物理入口 GPS、原始图楼梯柱关系、电梯楼层规则（西到 7 层、东到 6 层）。
- **估算**：教室 z=+8 / 服务带 z=-8 / 走廊 z=0、房间进深 8m、列距 16.875m、北楼 5 间按 15.6m、楼梯柱 x 取原始列平均、宽度 19–40m 未逐段建模。
- **未确认**：教室精确面宽/进深、走廊净宽、北楼真实长度、入口到门的精确对应、214/218/219/330/331 等服务空间。
- 2.5D 示意：房间是点/小方块，不是多边形；宽度 19–40m 没有逐段轮廓；
- 8 个入口是 BMap 16 个物理入口的近似映射；楼梯 14 组实际简化为 13 组固定 core；
- 北楼错层/坡道用 passage 边简化；
- **F1–F7 整层按附件斜楼折算倾斜 5°**（楼板+教室+走廊+楼梯一起斜；路线坐标同步；附件 72m/20° 的总高差按 270m 折算约 5°）；
- 所有入口可达所有教室（已校验），但**路线时间是估算值**，不是实测步行时间。

## 7. 校验

- `node --check` 内联脚本通过；
- 数据引用检查：318 条边、7 条路线、9 个楼梯节点 + 60 个楼梯柱节点、13 个电梯站、8 个入口节点全部存在；
- 连通性：8 个入口均可达 265/265 节点、80/80 间教室；
- 数据自带 `validation` 与 `meta.roomCount/nodeCount/edgeCount` 一致（80/265/318）。

## 8. 重新生成

在 kit 根目录执行（源脚本在 `tools/`）：

- 数据：`python tools/gen_b_data_v4.py`（改 `LENGTH` / `HEIGHT` / 房间清单后重跑）；
- 平面预览：`python tools/render_b_plan.py`；
- glTF 模型：`python tools/export_glb.py`；
- 单文件版：`python tools/build_standalone.py`。
