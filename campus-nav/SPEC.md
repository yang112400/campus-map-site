# 室外 → 室内 对接规范（campus-map-site + B 楼本地 2.5D 模型）

版本：1.4.0（1.0.0 = 模拟室外 + 外部室内；1.1.0 新增真实 GIS；1.2.0 新增 §8 乐骑模式；1.3.0 把 B 栋改为本地 2.5D 模型 v4.1；本版对接 campus-map-site 2026-11 新版：房间热点 / 房间搜索 / 本层房间列表，深链口径不变）  
适用范围：`index.html`（模拟室外）、`real-map.html`（真实 GIS）与 `cycling.html`（乐骑）三个室外页，A / C / E-1 / E-2 / E-3 / F / G / I 栋外部室内页，以及 B 栋本地 2.5D 页 `b-package/3d.html`  
明确不适用：B 栋**不接入**外部 `campus-map-site`（`INDOOR_PROVIDERS.excluded = ["B"]`）；B 楼改走本地模型 `b-package/3d.html`（见 §5.5）

---

## 1. 坐标系与精度

- 室外：300m × 300m 局部 ENU，原点在校园西南角；+X 向东，+Z 向南，+Y 向上；**1 单位 = 1 米**。
- 所有建筑入口、路网节点、POI 都在同一坐标系；点击选点会吸附到最近路网节点（最大 7m，路边缘 16m）。
- 5m 精度口径：
  - 室外路线端点在路网节点上，坐标是确定的；
  - 建筑入口节点与 `buildings[].entrance` 坐标一致（校验脚本会断言）；
  - 外部室内页（A/C/E/F/G/I）是独立图纸，不在同一坐标场，**不承诺室内点位 5m**；入口交接点是确定的。B 栋本地 2.5D 模型是示意模型，坐标、入口与路线时间均为估算（§5.5）。
- 后续若需要室内外统一坐标，必须让外部页提供锚点/比例，再把室内局部坐标映射到校园 ENU。
- 真实版（`real-map.html`）**不使用本节 ENU**：改用 WGS-84 经纬度 + WebMercator 瓦片，精度口径见 §5.6，不要拿本节去校验真实版。

---

## 2. 室外数据 schema（`data/campus.js`）

```js
window.CAMPUS = {
  size: 300,
  roads: [ { id, name, dir: "v"|"h", center, width, from, to } ],
  buildings: [{
    id: "A", name: "A栋", alias: "西一楼",
    x0, x1, z0, z1, h, color, roof,
    entrance: { x, z },
    node: "ENT_A",
    floors: 6
  }],
  gate: { x, z, width, height, name },
  nodes: [ { id, x, z, type, name, buildingId? } ],
  edges: [ [nodeA, nodeB, 道路名] ],
  pois: [ { id, name, node } ]
}
```

约定：
- `buildings[].node` 必须存在，且 `node.x/z === entrance.x/z`。
- `edges` 端点必须存在；图必须连通。
- 新增楼栋时至少补：一条步道边（路口 → 入口）。

---

## 3. 外部室内提供方（`assets/indoor-providers.js`）

```js
window.INDOOR_PROVIDERS = {
  baseUrl: "https://yang112400.github.io/campus-map-site/",
  hashTemplate: "#{buildingId}/{floorId}",
  excluded: ["B"],
  byBuilding: {
    A: { providerBuildingId: "A", name: "A栋（西一楼）", defaultFloor: "1F",
         floors: [{ id: "1F", label: "1层" }, ...] }
  },
  get(outdoorBuildingId),
  has(outdoorBuildingId),
  buildUrl(outdoorBuildingId, floorId),
  list()
}
```

深链规则：
- `#<providerBuildingId>/<floorId>`，楼栋 id 与外部站点一致（A/C/E1/E2/E3/F/G/I）。
- 楼层 id 必须使用外部站点的 `1F`…`6F`，不要用 `1`、`2`。
- 非法楼层回退 `defaultFloor`；未覆盖楼栋返回 `null`。
- B 栋不在本表：它保留在 `excluded` 里，由 `real-map.html` 的本地 B 栏直接打开 `b-package/3d.html`（见 §5.5）。

### 映射表

| 室外 buildingId | 外部站点 id | 楼层 |
|---|---|---|
| A | A | 1F–6F |
| C | C | 1F–5F |
| E1 | E1 | 1F–5F |
| E2 | E2 | 1F–5F |
| E3 | E3 | 1F–5F |
| F | F | 1F–5F |
| G | G | 1F–6F（仅楼层图，无房间热点） |
| I | I | 1F–4F（信远1区） |
| B | — | **不接入外部站**；本地 2.5D 页见 §5.5 |

---

## 4. 交接流程

```text
用户点选/搜索终点
  → 室外 A* 生成路线
  → 终点节点查 buildings[].node 得到楼栋
  → INDOOR_PROVIDERS.get(buildingId)
      ├─ 有配置：显示「打开室内图」；楼层下拉；iframe / 新窗口打开 buildUrl(id, floor)
      ├─ B 栋（excluded）：显示本地「B楼 · 7层室内」栏（入口 + 教室）；新窗口打开 b-package/3d.html?from=<入口>&to=<教室节点>&floor=<教室楼层>
      └─ 无配置：不显示室内入口
```

外部页打开后：
- 通过 hash 直接定位楼栋 + 楼层；
- 新版站点提供房间热点、房间搜索框、本层房间列表，可直接定位到房间（当前仍不支持房间级深链）；
- 关闭弹窗回到室外，原路线保留。

B 栋本地页打开后：
- 按 `from` / `to` / `floor` 预选起点、终点与聚焦楼层，页面内用本地图（`edges` + `time`）跑 Dijkstra 并显示路线 + 分步指引；
- 页面内「起点 / 终点」两个下拉都含 8 个入口（放进其所在楼层分组，文案如「入口 · 东侧南入口1」）与 80 间教室（按楼层分组），点「规划路线」重新计算；规划后 `history.replaceState` 同步 `?from=&to=&floor=`（`file://` 下退化 hash）；
- 右侧路线卡显示耗时/距离/楼层/节点数与 `<ol id="rcSteps">` 分步文本（沿走廊向东/西、乘电梯/楼梯到某层、经通道口进北楼、到达房间）；
- header「← 返回室外」→ `../real-map.html`，关闭页面后原室外路线不受影响。

### URL 契约

`index.html?from=<nodeOrBuilding>&to=<nodeOrBuilding>&floor=<floorId>`

- `from`/`to` 同时支持节点 id（`ENT_A`）与楼栋 id（`A`）。
- `floor` 仅影响外部室内弹窗的预选楼层。
- 路线变化后页面会用 `history.replaceState` 同步 `from`/`to`，可复制分享；`file://` 下 replaceState 受限时退化为 `#from=..&to=..&floor=..`。

---

## 5. 真实 GIS 地图接入

真实版页面把底图换成学校 GIS 的瓦片，把路径换成学校的路径接口；模拟版（`index.html`）完全不受影响，两页共用 `assets/indoor-providers.js`。

分工：

| 文件 | 职责 |
|---|---|
| `real-map.html` | 外壳：Leaflet 底图容器、起终点面板、路线卡、室内栏与弹窗 |
| `styles/real-map.css` | 真实版样式 |
| `app/real-map.js` | 交互与网络：建图、点击选点、请求 `/direction/v2`（失败回退 v1）、画线、分步指引 |
| `data/real-pois.js` | `window.REAL_CAMPUS`：中心点、zoom、瓦片模板、POI 经纬度 |
| `assets/indoor-providers.js` | 与模拟版同一份，室内深链 |
| `vendor/leaflet/` | Leaflet 1.9.4 本地副本（离线可引用，不改库本体） |

> 路径接口是学校 GIS 的内部接口：无公开文档、无 appkey。下面字段为 2026-11-01 直接请求实测所得；对方升级后以实际返回为准，文档不对“字段永不变化”作保证。

### 5.1 瓦片（底图）

```js
// data/real-pois.js
center: [34.1246, 108.8347],        // [lat, lon]
zoom: 17, minZoom: 16, maxZoom: 20,
tileUrl: "https://gis.xidian.edu.cn/map?lyrs=zst&x={x}&y={y}&z={z}"
```

| 项 | 值 | 说明 |
|---|---|---|
| 模板 | `https://gis.xidian.edu.cn/map?lyrs=zst&x={x}&y={y}&z={z}` | 直接交给 `L.tileLayer(tileUrl, ...)`，`{x}/{y}/{z}` 由 Leaflet 替换 |
| 图层 | `lyrs=zst` | 学校 3D 斜视渲染瓦片；楼体与阴影已烘焙进图片 |
| 层级 | 本页使用 `z=16–20`，默认 `z=17` | 不要超过 `maxZoom: 20`；更高层级未必有数据 |
| 坐标系 | 切片：WebMercator（EPSG:3857）标准 `z/x/y`；业务坐标：WGS-84 经纬度（度） | 两套坐标由 Leaflet 投影时转换，页面不要自行换算 |
| 版权 | `底图 © 西安电子科技大学 GIS · 路径 © 校园 GIS` | 常驻页面（`#credit`），不要移除 |
| 中心 | `lat 34.1246, lon 108.8347` | 南校区 |

注意：

- 瓦片 URL 不带 token；实测 `z17/z18` 直连返回 **HTTP 200 `image/png`**（含不带 Referer），见 `demo/preview-real-gis.png`。页面仍必须能接受瓦片失败（提示，而不是白屏）。
- 瓦片是预渲染影像，**镜头角度固定**：只能平移与缩放，不要做 `rotate`/`pitch`，也不能用瓦片量测楼高。
- `{x}/{y}` 是瓦片编号，不是经纬度；POI 与路径端点用经纬度。

### 5.2 路径接口 `direction/v2`

请求（GET，无 appkey）：

```text
https://gis.xidian.edu.cn/openmap/mapi/direction/v2?origin=<lon>,<lat>&destination=<lon>,<lat>
```

| 参数 | 必填 | 格式 | 说明 |
|---|---|---|---|
| `origin` | 是 | `经度,纬度` | WGS-84，逗号分隔、无空格，如 `108.8303,34.1272` |
| `destination` | 是 | `经度,纬度` | 同上 |

- 参数名**不是** `start`/`end`/`from`/`to`。写错时返回 `{"status":2,"message":"origin coordinate is not correct"}`；终点对应 `destination coordiante is not correct`（原文如此拼写）。
- 参数只接受经纬度文本，**不接受 POI 名称或 id**；端点离路网太远时可能返回空 `routes`，按失败处理并提示。

成功返回（实测，已省略重复点）：

```json
{
  "status": 0,
  "message": "ok",
  "total": 1,
  "result": {
    "directionType": "OUTDOOR_TO_OUTDOOR",
    "routes": [
      {
        "routeType": "outdoor",
        "valid": true,
        "distance": 650.095,
        "duration": 433.397,
        "path": [
          { "geoType": "point", "x": 108.8301486536287, "y": 34.12695343753575 }
        ],
        "steps": [
          {
            "name": "25675-25677",
            "distance": 36.519,
            "duration": 24.346,
            "levelFrom": 0,
            "levelTo": 0,
            "text": null,
            "descr": null,
            "points": null,
            "path": []
          }
        ],
        "source": 0,
        "target": 0
      }
    ],
    "origin": null,
    "destination": null,
    "distance": 0.0
  }
}
```

取值规则：

- 折线取 `result.routes[0].path[]`，`x` = 经度、`y` = 纬度，按数组顺序连成 `L.polyline`。
- `path` 里**相邻重复点成对出现**（每条边首尾各记一次），绘制前按“与上一点相同则跳过”去重。
- 距离用 `routes[0].distance`（米），时间用 `routes[0].duration`（秒，按步行速度折算，约 1.5 m/s）；**不要用 `result.distance`**——v2 里恒为 `0.0`。
- `steps[].name` 是路网边 id（`25675-25677`），`text`/`descr` 为 `null`：接口不返回可读路名，中文分步指引必须由页面按折线方向与距离生成。
- 失败判定（任一命中即算失败）：`status !== 0`、HTTP 非 2xx、JSON 解析失败、`routes` 为空、`path` 少于 2 个点。

### 5.3 回退 v1

```text
https://gis.xidian.edu.cn/openmap/mapi/direction/v1?origin=<lon>,<lat>&destination=<lon>,<lat>
```

参数与 v2 完全一致；`routes[]` 的 `path` / `distance` / `duration` / `steps` 与 v2 同源同值，**同一个解析函数可直接吃 v1**。

差异只在元信息（不影响画线）：

| 字段 | v2 | v1 |
|---|---|---|
| `result.directionType` | `"OUTDOOR_TO_OUTDOOR"` | `null` |
| `routes[].origin` / `.destination` | `{ geoType:"point", x, y }` | `null` |
| `result.origin` / `.destination` | `null` | `{ uid, name, campus, location:{ geoType:"point", x, y } }` |

回退顺序：`v2` → `v1` → 页面提示「路线接口暂不可用，请稍后再试」。两版都失败时**不要画假线**（不得用起终点直线冒充路线）。

### 5.4 POI 表与内部 provider 映射

`data/real-pois.js` 的 `REAL_CAMPUS.pois`（表中为 6 位小数，实际值以源码为准）：

| id | 名称 | 经度 lon | 纬度 lat | 类型 | 室内 provider |
|---|---|---|---|---|---|
| `GATE` | 南校区东大门 | 108.839997 | 34.122057 | gate | — |
| `A` | A栋（西一楼） | 108.830318 | 34.127246 | building | `A`（1F–6F） |
| `B` | B栋（西二楼） | 108.832079 | 34.125927 | building | **排除外部站；本地 2.5D（§5.5）** |
| `C` | C栋（西三楼） | 108.832908 | 34.126117 | building | `C`（1F–5F） |
| `E1` | E-1栋（东三楼） | 108.835070 | 34.124383 | building · `approx` | `E1`（1F–5F） |
| `E2` | E-2栋（东三楼） | 108.835420 | 34.124383 | building · `approx` | `E2`（1F–5F） |
| `E3` | E-3栋（东三楼） | 108.835770 | 34.124383 | building · `approx` | `E3`（1F–5F） |
| `F` | F栋（东二楼） | 108.836555 | 34.124384 | building | `F`（1F–5F） |
| `G` | G栋（东一楼） | 108.838850 | 34.123350 | building | `G`（1F–6F） |
| `I` | I栋（信远1区） | 108.838563 | 34.124856 | building | `I`（1F–4F） |
| `LIB` | 图书馆 | 108.831880 | 34.125302 | building | —（无配置） |
| `GYM` | 远望谷体育馆 | 108.837875 | 34.119846 | building | —（无配置） |

宿舍起点（`REAL_CAMPUS.dorms`，坐标取自 DawnWAW/BMap，分组来自 0gaowei/xidian-navigation）：

| id | 名称 | 经度 lon | 纬度 lat |
|---|---|---|---|
| `DORM_ZY` | 竹园1-4号楼 | 108.839762 | 34.127228 |
| `DORM_HT56` | 海棠5/6号楼 | 108.835367 | 34.128960 |
| `DORM_HT78` | 海棠7/8号楼 | 108.832777 | 34.130083 |
| `DORM_HT910` | 海棠9/10号楼 | 108.832047 | 34.128901 |
| `DORM_DX1113` | 丁香11-13号楼 | 108.828551 | 34.123407 |
| `DORM_DX1415` | 丁香14/15号楼 | 108.830255 | 34.122040 |

映射规则：

- 室内栏可见性 = `INDOOR_PROVIDERS.has(poiId)`；深链 = `INDOOR_PROVIDERS.buildUrl(poiId, floorId)`，即 `baseUrl + "#<providerBuildingId>/<floorId>"`，例如 `buildUrl("A","2F")` → `https://yang112400.github.io/campus-map-site/#A/2F`。
- B 栋有本地 2.5D 页，但**不进** `INDOOR_PROVIDERS`：`has("B")` 仍为 `false`，B 栏不经过 `buildUrl`，直接拼 `b-package/3d.html?from=&to=&floor=`（§5.5）。
- 楼层 id 只用 `1F`…`6F`；非法或省略楼层回退该栋 `defaultFloor`（均为 `1F`）。
- `GATE` / `LIB` / `GYM` 没有 `byBuilding` 配置，**不显示室内栏**（它们不是室内对接楼栋）。
- 点击地图得到的自由经纬度可直接作为端点；只有端点明确落在某个 POI/楼栋上时，才按本表决定室内栏。

### 5.5 B 栋本地 2.5D 模型（不接外部站）与 E 楼近似坐标

- **B 栋不接外部站**：`INDOOR_PROVIDERS.excluded = ["B"]`，`get`/`has` 返回 `null`/`false`、`buildUrl("B")` 返回 `null`。B 改走**本地 2.5D 模型（b-model-kit v4.1）**：`b-package/3d.html` + `b-package/assets/b-building-data.js`（`window.B_BUILDING_DATA`）+ `b-package/assets/b-indoor-nav.js`（路线/分步指引纯函数）+ `vendor/`。
- **模型规模**：9 个楼层块（南楼 F1–F7 + 北楼 N4/N5）、80 间教室、265 个节点、318 条边、8 个导航入口（`ENT1`–`ENT6`、`ENT_NE`、`ENT_NW`）、7 条示例路线；270m × 19–40m × 40m，层高约 5.71m。
- **结构**：单侧教室——教室在南侧（z=+8）、走廊 z=0、北侧是楼梯/卫生间/办公室/空位；北楼只在 4F/5F（走廊 z=-50、教室 z=-54.5），6F/7F 北侧是楼顶；竖向有 13 组楼梯柱 + 2 组电梯（西到 7 层、东到 6 层）。
- **主应用 B 栏**：`real-map.html` 终点选 B 后显示「B楼 · 7层室内」= 入口下拉（8 个，文本带所在层）+ 教室下拉（80 间，含北楼 N4/N5，按楼层分组）+「进入 B 楼室内」；入口默认按室外起点经纬度就近选择，用户手动改过后不再覆盖。
- **URL 契约**：`b-package/3d.html?from=<入口 id 或节点 id>&to=<教室号或教室节点>&floor=<教室楼层>`；页面内用 `assets/b-indoor-nav.js`（`window.BIndoorNav`，同时 `module.exports` 供测试）的 `buildGraph / dijkstra / resolveNode / buildSteps / pathStats` 计算路线与分步指引。本地页兼容 `?route=<节点 id 序列>`；无参数时显示 `routes[0]`；规划成功时用 `history.replaceState` 同步 `from`/`to`/`floor`（`floor` 为终点楼层）；页面暴露 `window.__B_MODEL__ = { data, graph, nav, showRoute, setFloor, dijkstra, resolveNode, planRoute }`。
- **早期参考页**：`b-building.html`（楼层图）与 `demo/3d.html`（同模型原版副本）不接入主流程。
- **限制口径（答辩必须说明）**：2.5D 示意图，房间是点/小方块而不是多边形；教室 z=+8、房间进深 8m、列距 16.875m、北楼 5 间按 15.6m、8 个入口与 16 个物理入口的对应均为估算；F1–F7 整层按附件斜楼折算倾斜 5°；5F 508 未建；路线时间是估算值，不是实测步行时间。
- **E1/E2/E3**：`real-pois.js` 中标了 `approx: true`，是 E 楼综合体（东三楼）的**近似点位**——三者同纬度 `34.124382631945`，经度 `108.83507 / 108.83542 / 108.83577`，相邻间隔 `0.00035°`，在该纬度约 **32m**。它们只用于区分三栋、生成路线端点，**不代表各栋真实入口**；页面应标注「近似位置」，文档与答辩里不要当作 5m 级证据。
- 其余楼栋为定点快照，同样不做入口级精度承诺（见 5.6）。

### 5.6 5m 口径（真实版）

- 模拟版：300m ENU、1 单位 = 1 米，路线端点在路网节点上、与 `buildings[].entrance` 一致，5m 口径可校验（§1）。
- 真实版：路径来自 `direction/v2` 的真实经纬度折线，底图是已配准的斜视瓦片，点击选点取的是瓦片上的近似位置；精度 = **瓦片配准误差 + 接口路径误差**，**不再承诺低模场景那种几何一致性（0.1m 级 / 米级对齐）**。
- 因此真实版只做“位置示意 + 路线方向与距离参考”：不做长度实测对齐、不做入口级断言；跨版本比距离时以接口 `distance` 为准。

### 5.7 验收清单

- [ ] `real-map.html` 能打开，底图出现 `lyrs=zst` 瓦片，页面可见版权/attribution。
- [ ] 底图加载失败（断网/被拒）时给出提示，不白屏、不抛未捕获异常。
- [ ] 点击地图能取到经纬度（`#coord` 显示 `经度, 纬度`），POI 下拉可选。
- [ ] 任选两点能出路线：折线贴合瓦片上的道路、总距离与步行时间非空、分步指引为中文。
- [ ] 把 `direction/v2` 置为不可用（改 URL 或断网重试）时自动走 `direction/v1`，路线仍能画出。
- [ ] v1 也失败时提示接口不可用，**不用直线冒充路线**。
- [ ] 地图点选草坪/楼内：160m 内自动回退最近 POI；无 POI 时提示「该位置不在校园路网覆盖范围内」，不得显示笼统「网络异常或接口不可用」。
- [ ] 终点选 A 栋：出现室内栏，「打开室内图」打开 `https://yang112400.github.io/campus-map-site/#A/1F`，切楼层后深链同步变化。
- [ ] 终点选 B 栋：**不出现外部室内弹窗**；出现「B楼 · 7层室内」栏，入口下拉 8 项、教室下拉 80 项（按楼层分组）；点「进入 B 楼室内」新窗口打开 `b-package/3d.html?from=<入口>&to=<教室节点>&floor=<楼层>`，页面显示对应室内路线与分步指引；`INDOOR_PROVIDERS.buildUrl("B")` 返回 `null`。
- [ ] `GATE` / `GYM` / `LIB` 不出现室内栏，也不出现 B 楼 2.5D 入口。
- [ ] E1/E2/E3 标注「近似位置」（`approx: true`），无入口级精度断言。
- [ ] 若 `file://` 下路径接口被浏览器拦截，改用本地 http 后功能恢复正常。

---

## 6. 验收清单

- [ ] `node tests/run.js`、`node tests/real-map.test.js`、`node tests/b-package.test.js`、`node tests/cycling.test.js`、`node tests/bridge-sim.js`、`node tools/check-provider.js` 全绿。
- [ ] `data/campus.js` 中每栋楼 `entrance` 与 `node` 坐标一致。
- [ ] 校园图从 `GATE` 可达全部入口。
- [ ] `INDOOR_PROVIDERS.list()` = `["A","C","E1","E2","E3","F","G","I"]`。
- [ ] `buildUrl("A","2F")` = `https://yang112400.github.io/campus-map-site/#A/2F`。
- [ ] `buildUrl("B")` 与 `buildUrl("LIB")` 返回 `null`。
- [ ] 室外页导航到 A/C/E/F/G/I 栋时出现「打开室内图」；到 B 栋不出现外部室内弹窗，但出现本地「B楼 · 7层室内」栏。
- [ ] B 本地页 `b-package/3d.html?from=ENT1&to=F1_101&floor=F1` 与跨层 `?from=ENT1&to=F7_707&floor=F7` 均能画出室内路线并给分步指引。
- [ ] 弹窗内楼层切换会更新 iframe 的 hash。
- [ ] 断网时「新窗口」仍给出可复制的 URL（页面会空白，可接受）。
- [ ] 真实版（`real-map.html`）按其验收清单（§5.7）单独过一遍。

---

## 7. 后续升级建议

1. **房间级深链**：请外部页支持 `#<building>/<floor>/<room>` 或 `?room=`；桥接层只需把 `roomId` 拼进 `buildUrl`，其余不变。
2. **postMessage 协议**：外部页 `window.parent.postMessage({type:"nav:room", buildingId, floorId, roomId})`，室外页监听后重载 iframe；比 URL 更灵活。
3. **坐标锚点**：若外部页能提供楼栋锚点与比例，可把室内局部坐标映射到校园 ENU，实现真正的连续导航。
4. **B 栋**：已用本地 2.5D 模型接入（入口 + 教室 → `b-package/3d.html?from=&to=&floor=`），**不依赖外部站**。若以后要统一到 `INDOOR_PROVIDERS`，可按 `byBuilding` 加一条本地 provider（`local: true`、`urlTemplate`），并从 `excluded` 去掉 `B`；当前实现不走该分支。
5. **真实版的自建代理**（可选）：瓦片与路径接口都依赖学校服务，若出现防盗链/跨域限制，可在本地 http 服务里加一层同源转发（`/gis/tile`、`/gis/direction`），前端只换 `tileUrl` 与请求路径，其余解析逻辑不变。
6. **瓦片层级**：`minZoom/maxZoom` 若需调整，只改 `data/real-pois.js`，不要写死在 `app/real-map.js`。

---

## 8. 乐骑模式（`cycling.html`）

### 8.1 目标与硬约束

单独模式，输入起点/终点，自动规划：

1. 长度 **≥3000 m**（目标 3.2–3.8 km，超过 5.2 km 降分）；
2. **途经南操场或北操场**（可两个都经过）；
3. **尽量选大路**（命名主路加权，结果卡显示大路里程占比）；
4. **不绕圈**：无重复节点、无自交、操场绕行角 ≤240°；
5. 起点/终点选点支持 POI 下拉、地图点选、URL 参数。

### 8.2 文件分工

| 文件 | 职责 |
|---|---|
| `cycling.html` | 页面外壳：地图、起终点面板、约束卡、路线卡、图例 |
| `styles/cycling.css` | 琥珀色主题与乐骑专用组件 |
| `data/cycling.js` | 路网、POI、操场及主路通行点、默认起终点、大路名单 |
| `app/cycling-core.js` | 纯函数核心：图、Dijkstra、候选、校验、评分、分步指引 |
| `app/cycling.js` | 交互：Leaflet、选点、绘制、换一条、URL |
| `tools/gen-cycling-data.js` | 从 OSM 快照重新生成 `data/cycling.js` |
| `tools/lib/osm-gcj.js` | OSM → GCJ 转换、建图、Dijkstra 构建工具 |
| `tools/data/osm-campus-wgs84.json` | Overpass 路网快照（构建源数据） |
| `tests/cycling.test.js` | 数据/路网/默认与多组起终点/校验函数/页面接入测试 |

### 8.3 坐标系（重要）

- 学校 GIS 瓦片与 `data/real-pois.js` 的 POI 实际按 **GCJ-02** 解读；OSM 原始数据是 **WGS-84**，直接叠加会整体偏移约 **300 m**（实测南/北操场与瓦片明显错位）。
- `tools/gen-cycling-data.js` 在构建时统一把 OSM 路网与操场中心做 **WGS-84 → GCJ-02** 转换；`data/cycling.js` 内所有经纬度均为 GCJ-02。
- 操场主路通行点是按 GCJ 路网人工选定的**操场旁主路点**，不是跑道内部；通行点距操场中心 ≤170 m，路线命中口径为“距任一通行点 ≤60 m 或距操场中心 ≤130 m”。
- 乐骑模式不使用学校 `direction/v2`（接口对操场/西侧路网覆盖不足），路线完全由本地路网计算；底图仍需联网。

### 8.4 数据 schema

```js
window.CYCLING_DATA = {
  defaults: { from: "GATE", to: "A" },
  corridor: ["GATE", "GYM", "DORM_DX1415", "SOUTH", "NORTH", "DORM_HT78", "DORM_ZY"],
  bigRoads: ["外环北路", "外环南路", "内环北路", "内环南路", "梧桐大道", ...],
  playgrounds: {
    SOUTH: { name: "南操场", lon, lat, radius: 130,
             passes: [{ id: "SOUTH_E", label: "东侧主路", lon, lat }, ...] },
    NORTH: { ... }
  },
  points: { GATE: { name, lon, lat, kind: "gate" }, ... },
  graph: {
    nodes: [[lon, lat], ...],                 // 数组下标即节点 id
    edges: [[a, b, d, classCode, nameCode]],  // d: 米；nameCode 0 = 无名
    classes: ["service", "residential", ...],
    names: ["梧桐大道", "外环北路", ...]
  }
};
```

约定：
- `nodes` 与 `edges` 必须连通；`edges` 端点必须在范围内。
- `passes` 至少 2 个/操场；`passes[0]` 作为走廊参考主环的规范通行点。
- `points` 是可选起终点；`playgrounds` 的 lon/lat 是操场中心（GCJ），仅用于圆圈/命中判定。

### 8.5 规划算法

1. **建图**：`CyclingCore.buildGraph(data)` 建邻接表；边权 = `d × 道路等级系数`，命名主路再乘 `0.68`（大路优先）。
2. **吸附**：起点/终点、走廊站点、操场通行点分别吸附到最近路网节点。
3. **候选生成**：
   - 单操场通行点：`start → pass → end`；
   - 南/北操场通行点组合（两种顺序）；
   - 走廊连续弧（含操场通行点，正反两个方向）；
   - 相邻走廊站点之间插入操场通行点；
   - 地标 + 操场模板（如 `start → 体育馆 → 通行点 → 通行点 → end`）；
   - 全走廊正反两向。
4. **逐段路由**：按候选顺序逐段 Dijkstra；每段完成后把已用边加入 `banned`，后续段不得复用——从结构上避免重复路段。
5. **校验**：
   - 总长 ≥3000 m；
   - 命中操场；
   - `repeatedNodes === 0`；
   - `selfCrossings === 0`；
   - 操场绕行角 `windingAngle ≤ 240°`（整圈约 360°，直线穿过约 180°）。
6. **评分**：合法 +1000；长度接近 3300 m 加分、3.15–3.9 km 额外加分；大路占比 ×120；绕行角、重复/自交扣分；两个操场都经过额外加分。
7. **兜底**：没有合法方案时，选“无重复/无自交/经过操场”的最长方案，并在结果卡显示未达标原因（长度不足或绕行较多）。

### 8.6 页面行为

- 默认 `GATE → A` 自动规划，约 **3.36 km / 87% 大路 / 14 分钟**，途经南、北操场；`换一条` 在合法备选中切换。
- 结果卡约束徽章：`长度 ≥3 km`、`途经南/北操场`、`无绕圈 / 无重复路段`、`大路占比`。
- 起点/终点可用下拉、地图点选、`?from=&to=` 设置；URL 用 `history.replaceState` 同步。
- 失败/不达标不画假线、不伪造 3km：显示明确 warning。

### 8.7 验收清单

- [ ] `cycling.html` 打开后底图出现，默认 `GATE → A` 路线长度 ≥3 km，途经至少一个操场。
- [ ] 默认路线 `repeats=0`、`crossings=0`、`maxWinding≤240`，大路占比 ≥50%。
- [ ] 选 `DORM_ZY → LIB`、`A → B`、`B → LIB`、`DORM_DX1415 → F`，均能给出 ≥3 km 且不绕圈的路线（或给出明确未达标提示）。
- [ ] 点「换一条」能切换合法备选；点「看全程」能重新框选路线。
- [ ] 起点/终点相同或过近时提示，不画线。
- [ ] 头部链接能回到 `real-map.html` / `index.html` / `b-package/3d.html`。
- [ ] 页面 `#credit` 保留 `路网 © OpenStreetMap contributors` 与学校 GIS 署名。
- [ ] `node tests/cycling.test.js` 全绿。

### 8.8 已知限制

- 路网来自 OSM 快照，个别校园内部道路可能比学校路径接口略粗；路线是“推荐 + 演示”，不是车道级导航。
- 操场旁通行点位于主路，不进入跑道；不要把“途经操场”理解为“在操场上骑行”。
- 学校 GIS 与 OSM 的坐标口径差异是本模式特有的坑：任何新数据加入前都必须先统一到 GCJ-02，否则会整体偏移。
- 若起点/终点在路网死角或彼此过近，可能不存在 ≥3 km 且不绕圈的单程路线，页面会降级提示。






