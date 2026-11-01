/* 乐骑模式测试：数据、路网、候选路线、约束校验、页面接入
 * 运行：node tests/cycling.test.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const Core = require("../app/cycling-core.js");

const ROOT = path.resolve(__dirname, "..");
let pass = 0, fail = 0;
const failures = [];

function ok(name, cond, detail) {
  if (cond) {
    pass++;
    console.log("  PASS  " + name);
  } else {
    fail++;
    failures.push(name + (detail ? " :: " + detail : ""));
    console.log("  FAIL  " + name + (detail ? " :: " + detail : ""));
  }
}

function loadCyclingData() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "cycling.js"), "utf8"), ctx, { filename: "data/cycling.js" });
  return ctx.window.CYCLING_DATA;
}

function main() {
  console.log("== 1. 乐骑数据 ==");
  const data = loadCyclingData();
  ok("data/cycling.js 已加载", !!data);
  ok("包含 643 个左右路网节点", data.graph.nodes.length > 500, String(data.graph.nodes.length));
  ok("包含 700 条左右路网边", data.graph.edges.length > 500, String(data.graph.edges.length));
  ok("默认起终点存在", !!data.points[data.defaults.from] && !!data.points[data.defaults.to]);
  ok("操场数据含南/北操场", !!data.playgrounds.SOUTH && !!data.playgrounds.NORTH);
  ok("两个操场均有多个主路通行点", data.playgrounds.SOUTH.passes.length >= 2 && data.playgrounds.NORTH.passes.length >= 2);
  ok("路网含 OSM 署名", /OpenStreetMap/.test(data.attribution || ""));

  console.log("== 2. 路网完整性 ==");
  const graph = Core.buildGraph(data);
  const edgeBad = [];
  data.graph.edges.forEach((e) => {
    if (!data.graph.nodes[e[0]] || !data.graph.nodes[e[1]]) edgeBad.push(e.slice(0, 2).join("-"));
  });
  ok("所有边端点存在", edgeBad.length === 0, edgeBad.slice(0, 5).join(","));
  const adj = new Map();
  for (let i = 0; i < graph.nodes.length; i++) adj.set(i, []);
  for (const e of graph.edges) { adj.get(e.a).push(e.b); adj.get(e.b).push(e.a); }
  const seen = new Set([0]), q = [0];
  while (q.length) {
    const cur = q.shift();
    for (const nxt of adj.get(cur) || []) if (!seen.has(nxt)) { seen.add(nxt); q.push(nxt); }
  }
  ok("路网连通", seen.size === graph.nodes.length, `${seen.size}/${graph.nodes.length}`);

  const passDist = [];
  Object.keys(data.playgrounds).forEach((id) => {
    const p = data.playgrounds[id];
    p.passes.forEach((pass) => {
      passDist.push({ id: id + "/" + pass.id, d: Core.meters([p.lon, p.lat], [pass.lon, pass.lat]) });
    });
  });
  ok("操场主路通行点距操场中心 ≤170m", passDist.every((x) => x.d <= 170),
    passDist.map((x) => x.id + ":" + Math.round(x.d)).join(","));

  console.log("== 3. 默认路线约束 ==");
  const defaults = Core.plan(data, data.defaults.from, data.defaults.to);
  ok("默认起终点有路线", defaults.ok, defaults.message);
  if (defaults.ok) {
    const r = defaults.route;
    ok("默认路线 ≥3km", r.distance >= Core.MIN_LENGTH, Math.round(r.distance) + "m");
    ok("默认路线经过操场", r.hits.length > 0, r.hits.map((h) => h.name).join("/"));
    ok("默认路线无重复节点", r.repeats === 0, String(r.repeats));
    ok("默认路线无自交", r.crossings === 0, String(r.crossings));
    ok("默认路线操场绕行 ≤240°", (r.maxWinding || 0) <= 240, String(Math.round(r.maxWinding || 0)));
    ok("默认路线大路占比 ≥50%", r.bigRatio >= 0.5, (r.bigRatio * 100).toFixed(0) + "%");
    ok("默认路线有换一条备选", defaults.alternatives.length > 0, String(defaults.alternatives.length));
  }

  console.log("== 4. 多组起终点 ==");
  const pairs = [
    ["GATE", "LIB"],
    ["A", "B"],
    ["DORM_ZY", "LIB"],
    ["B", "LIB"],
    ["DORM_DX1415", "F"],
    ["GYM", "A"]
  ];
  for (const [a, b] of pairs) {
    const r = Core.plan(data, a, b);
    ok(`${a} → ${b} 有 ≥3km 不绕圈路线`,
      r.ok && r.route.distance >= Core.MIN_LENGTH && r.route.repeats === 0 &&
      r.route.crossings === 0 && (r.route.maxWinding || 0) <= 240 && r.route.hits.length > 0,
      r.ok ? `${Math.round(r.route.distance)}m / wind ${Math.round(r.route.maxWinding || 0)}` : r.message);
  }

  console.log("== 5. 校验函数 ==");
  ok("同点规划被拒绝", Core.plan(data, "GATE", "GATE").ok === false);
  const fallback = Core.plan(data, "GATE", "SOUTH");
  ok("无 3km 方案时回退到不绕圈路线",
    fallback.ok && fallback.route.distance < Core.MIN_LENGTH &&
    fallback.route.maxWinding <= 240 && !!fallback.warning,
    fallback.ok ? `${Math.round(fallback.route.distance)}m / wind ${Math.round(fallback.route.maxWinding)}` : fallback.message);
  const straight = [];
  for (let i = 0; i <= 20; i++) straight.push([108.83 + i * 0.0001, 34.125]);
  ok("直线穿过操场中心绕行角 <200°", Core.windingAngle(straight, [108.831, 34.125], 200) < 200,
    String(Math.round(Core.windingAngle(straight, [108.831, 34.125], 200))));
  const circle = [];
  for (let i = 0; i <= 36; i++) {
    const a = i / 36 * Math.PI * 2;
    circle.push([108.83 + Math.cos(a) * 0.0005, 34.125 + Math.sin(a) * 0.0004]);
  }
  ok("整圈绕行角约 360°", Math.abs(Core.windingAngle(circle, [108.83, 34.125], 200) - 360) < 15,
    String(Math.round(Core.windingAngle(circle, [108.83, 34.125], 200))));
  ok("重复节点检测", Core.repeatedNodes([1, 2, 3, 2, 4]) === 1);
  const crossPath = [[0, 0], [1, 1], [0, 1], [1, 0]];
  ok("自交检测", Core.selfCrossings(crossPath) > 0);

  console.log("== 6. 页面接入 ==");
  const html = fs.readFileSync(path.join(ROOT, "cycling.html"), "utf8");
  const ui = fs.readFileSync(path.join(ROOT, "app", "cycling.js"), "utf8");
  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1].split("?")[0]);
  ["vendor/leaflet/leaflet.js", "data/real-pois.js", "data/cycling.js", "app/cycling-core.js", "app/cycling.js"]
    .forEach((s) => ok("cycling.html 引入 " + s, scripts.includes(s)));
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const refs = new Set();
  for (const m of ui.matchAll(/\$\(\s*"([^"]+)"\s*\)/g)) refs.add(m[1]);
  const missing = [...refs].filter((id) => !ids.has(id));
  ok("cycling.html 覆盖 cycling.js 的 DOM id", missing.length === 0, missing.join(","));
  ok("真实 GIS 页链接乐骑模式", /href="cycling\.html"/.test(fs.readFileSync(path.join(ROOT, "real-map.html"), "utf8")));
  ok("模拟室外页链接乐骑模式", /href="cycling\.html"/.test(fs.readFileSync(path.join(ROOT, "index.html"), "utf8")));
  ok("乐骑样式存在", fs.existsSync(path.join(ROOT, "styles", "cycling.css")));

  console.log("\n========================================");
  console.log(`PASS ${pass}  FAIL ${fail}`);
  if (fail) {
    console.log("失败项：");
    failures.forEach((f) => console.log(" - " + f));
    process.exitCode = 1;
  }
}

try {
  main();
} catch (err) {
  console.error("测试运行异常：", err && err.stack ? err.stack : err);
  process.exitCode = 1;
}
