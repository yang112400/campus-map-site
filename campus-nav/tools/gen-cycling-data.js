/* 生成乐骑数据：OSM 路网（WGS-84 → GCJ-02，与学校 GIS 瓦片对齐）+ 校园 POI + 操场
 * 运行：node tools/gen-cycling-data.js
 * 依赖：tools/data/osm-campus-wgs84.json（Overpass 快照）
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const G = require("./lib/osm-gcj");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(__dirname, "data", "osm-campus-wgs84.json");
const OUT = path.join(ROOT, "data", "cycling.js");

const BBOX = { minLon: 108.824, maxLon: 108.852, minLat: 34.118, maxLat: 34.140 };
const EXCLUDE = ["footway", "path", "pedestrian", "steps"];
const PLAYGROUNDS = {
  SOUTH: {
    id: "SOUTH",
    name: "南操场",
    lon: 108.8230065,
    lat: 34.1271011,
    radius: 130,
    passes: [
      { id: "SOUTH_E", label: "东侧主路", lon: 108.829001, lat: 34.125828 },
      { id: "SOUTH_S", label: "南侧主路", lon: 108.828074, lat: 34.124401 },
      { id: "SOUTH_W", label: "西侧主路", lon: 108.826425, lat: 34.125133 }
    ]
  },
  NORTH: {
    id: "NORTH",
    name: "北操场",
    lon: 108.8262215,
    lat: 34.1321073,
    radius: 130,
    passes: [
      { id: "NORTH_SE", label: "东南主路", lon: 108.831636, lat: 34.129856 },
      { id: "NORTH_N", label: "北侧主路", lon: 108.831471, lat: 34.131321 },
      { id: "NORTH_W", label: "西侧主路", lon: 108.830033, lat: 34.130664 }
    ]
  }
};
const CORRIDOR = ["GATE", "GYM", "DORM_DX1415", "SOUTH", "NORTH", "DORM_HT78", "DORM_ZY"];

function loadCampus() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "real-pois.js"), "utf8"), ctx);
  return ctx.window.REAL_CAMPUS;
}

function main() {
  const osm = JSON.parse(fs.readFileSync(SRC, "utf8"));
  const graph = G.buildGraph(osm, BBOX, { exclude: EXCLUDE });
  console.log("图节点 %d，最大连通分量 %d", graph.nodes.size, graph.largest);

  const campus = loadCampus();
  const points = {};
  for (const p of (campus.pois || []).concat(campus.dorms || [])) {
    points[p.id] = { name: p.name, lon: Number(p.lon), lat: Number(p.lat), kind: p.type || "poi" };
  }
  for (const p of Object.values(PLAYGROUNDS)) {
    const g = G.wgs2gcj(p.lon, p.lat);
    points[p.id] = { name: p.name, lon: Number(g[0].toFixed(7)), lat: Number(g[1].toFixed(7)), kind: "playground" };
  }

  /* 站点/POI 吸附检查 */
  for (const [id, p] of Object.entries(points)) {
    const s = G.snap(graph, p.lon, p.lat);
    if (!s || s.d > 150) console.warn("  ! %s 吸附过远：%s m", id, s ? Math.round(s.d) : "null");
  }

  /* 节点数组，边去重 */
  const nodeList = [...graph.nodes.values()];
  const indexOf = new Map(nodeList.map((n, i) => [n.id, i]));
  const edgeMap = new Map();
  for (const n of nodeList) {
    for (const link of n.edges) {
      const a = indexOf.get(n.id);
      const b = indexOf.get(link.to);
      if (a == null || b == null || a === b) continue;
      const key = Math.min(a, b) + "," + Math.max(a, b);
      const e = link.e;
      const prev = edgeMap.get(key);
      if (!prev || e.d < prev.d || (G.BIG.has(e.name) && !G.BIG.has(prev.name))) {
        edgeMap.set(key, {
          a: Math.min(a, b),
          b: Math.max(a, b),
          d: e.d,
          cls: e.cls,
          name: e.name || ""
        });
      }
    }
  }
  const edges = [...edgeMap.values()].sort((x, y) => x.a - y.a || x.b - y.b);
  const classes = [...new Set(edges.map(e => e.cls))].sort();
  const names = [...new Set(edges.map(e => e.name).filter(Boolean))].sort();
  const clsCode = new Map(classes.map((c, i) => [c, i]));
  const nameCode = new Map([["", 0]].concat(names.map((n, i) => [n, i + 1])));

  const payload = {
    generated: new Date().toISOString().slice(0, 10),
    source: "OpenStreetMap 路网（WGS-84 → GCJ-02） + 西安电子科技大学 GIS POI",
    note: "乐骑路线为课程演示用推荐路线，非测绘成果；路网 © OpenStreetMap contributors（ODbL），底图 © 西电 GIS。",
    attribution: "路网 © OpenStreetMap contributors · 底图 © 西安电子科技大学 GIS",
    defaults: { from: "GATE", to: "A" },
    corridor: CORRIDOR,
    bigRoads: [...G.BIG].sort(),
    playgrounds: Object.fromEntries(Object.entries(PLAYGROUNDS).map(([id, p]) => {
      const g = G.wgs2gcj(p.lon, p.lat);
      return [id, {
        id,
        name: p.name,
        lon: Number(g[0].toFixed(7)),
        lat: Number(g[1].toFixed(7)),
        radius: p.radius,
        passes: p.passes.map(pass => ({
          id: pass.id, label: pass.label,
          lon: Number(pass.lon.toFixed(7)), lat: Number(pass.lat.toFixed(7))
        }))
      }];
    })),
    points,
    graph: {
      nodes: nodeList.map(n => [Number(n.lon.toFixed(7)), Number(n.lat.toFixed(7))]),
      edges: edges.map(e => [e.a, e.b, Math.round(e.d * 10) / 10, clsCode.get(e.cls), nameCode.get(e.name)]),
      classes,
      names
    }
  };

  const banner = `/* 乐骑路线数据（由 tools/gen-cycling-data.js 生成，请勿手改）
 * ${payload.source}
 * 路网坐标已从 WGS-84 转为 GCJ-02，与学校 GIS 瓦片、real-pois.js 对齐。
 * ${payload.note}
 */
window.CYCLING_DATA = `;
  fs.writeFileSync(OUT, banner + JSON.stringify(payload) + ";\n");
  console.log("已写入 %s：%d 节点 / %d 边 / %d 字节", path.relative(ROOT, OUT), nodeList.length, edges.length, fs.statSync(OUT).size);
  console.log("操场：南 %s,%s；北 %s,%s", payload.playgrounds.SOUTH.lon, payload.playgrounds.SOUTH.lat, payload.playgrounds.NORTH.lon, payload.playgrounds.NORTH.lat);
}

main();
