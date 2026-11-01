/* 静态校验：数据完整性、室外图连通、A*、外部室内深链、页面 id/脚本引用
 * 运行：node tests/run.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
let pass = 0;
let fail = 0;
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

function loadScript(rel, windowObj) {
  const file = path.join(ROOT, rel);
  const code = fs.readFileSync(file, "utf8");
  const ctx = {
    window: windowObj || {},
    document: { createElement: () => ({ getContext: () => ({}) }) },
    console,
    Math,
    Date,
    Set,
    Map,
    Infinity,
    performance: { now: () => 0 }
  };
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: rel });
  return ctx.window;
}

function main() {
  console.log("== 1. 加载数据 ==");
  const w1 = loadScript("data/campus.js");
  const campus = w1.CAMPUS;
  const w2 = loadScript("assets/indoor-providers.js");
  const providers = w2.INDOOR_PROVIDERS;
  ok("data/campus.js 已加载", !!campus);
  ok("assets/indoor-providers.js 已加载", !!providers);

  const campusNodes = new Map((campus.nodes || []).map((n) => [n.id, n]));
  const campusEdges = campus.edges || [];

  console.log("== 2. 室外数据完整性 ==");
  ok("校园尺寸 300", campus.size === 300, String(campus.size));
  ok("节点唯一", campusNodes.size === campus.nodes.length, `${campusNodes.size}/${campus.nodes.length}`);
  let badEdges = [];
  for (const [a, b] of campusEdges) {
    if (!campusNodes.has(a) || !campusNodes.has(b)) badEdges.push(`${a}-${b}`);
  }
  ok("所有边端点存在", badEdges.length === 0, badEdges.join(","));
  let badEntr = [];
  for (const b of campus.buildings || []) {
    const n = campusNodes.get(b.node);
    if (!n) badEntr.push(`${b.id}:missing ${b.node}`);
    else if (Math.abs(n.x - b.entrance.x) > 0.01 || Math.abs(n.z - b.entrance.z) > 0.01) {
      badEntr.push(`${b.id}:coord (${n.x},${n.z}) vs (${b.entrance.x},${b.entrance.z})`);
    }
  }
  ok("建筑入口节点存在且坐标一致", badEntr.length === 0, badEntr.join("; "));
  let badPoi = [];
  for (const p of campus.pois || []) if (!campusNodes.has(p.node)) badPoi.push(`${p.id}:${p.node}`);
  ok("POI 节点存在", badPoi.length === 0, badPoi.join(","));

  // 建筑不能压在道路上，也不能互相重叠
  const roadRects = (campus.roads || []).map((r) => r.dir === "v"
    ? { x0: r.center - r.width / 2, x1: r.center + r.width / 2, z0: r.from, z1: r.to, name: r.name }
    : { x0: r.from, x1: r.to, z0: r.center - r.width / 2, z1: r.center + r.width / 2, name: r.name });
  const bldRects = (campus.buildings || []).map((b) => ({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, name: b.id }));
  function overlap(a, b, margin) {
    const m = margin || 0;
    return a.x0 < b.x1 - m && a.x1 > b.x0 + m && a.z0 < b.z1 - m && a.z1 > b.z0 + m;
  }
  const onRoad = [];
  for (const b of bldRects) for (const r of roadRects) if (overlap(b, r, 0.01)) onRoad.push(`${b.name}×${r.name}`);
  ok("建筑不压道路", onRoad.length === 0, onRoad.join(","));
  const overlapBld = [];
  for (let i = 0; i < bldRects.length; i++) {
    for (let j = i + 1; j < bldRects.length; j++) {
      if (overlap(bldRects[i], bldRects[j], 0.01)) overlapBld.push(`${bldRects[i].name}×${bldRects[j].name}`);
    }
  }
  ok("建筑互不重叠", overlapBld.length === 0, overlapBld.join(","));

  console.log("== 3. 室外图连通性 ==");
  const adj = new Map();
  for (const n of campus.nodes) adj.set(n.id, []);
  for (const [a, b] of campusEdges) {
    if (adj.has(a) && adj.has(b)) { adj.get(a).push(b); adj.get(b).push(a); }
  }
  function reachable(start) {
    const seen = new Set([start]);
    const q = [start];
    while (q.length) {
      const cur = q.shift();
      for (const nxt of adj.get(cur) || []) {
        if (!seen.has(nxt)) { seen.add(nxt); q.push(nxt); }
      }
    }
    return seen;
  }
  const seen = reachable("GATE");
  const unreachable = campus.nodes.filter((n) => !seen.has(n.id)).map((n) => n.id);
  ok("GATE 可达全部节点", unreachable.length === 0, unreachable.join(","));

  console.log("== 4. A* 路线 ==");
  const wNav = loadScript("app/nav.js");
  const NavCore = wNav.NavCore;
  ok("NavCore 已加载", !!NavCore && !!NavCore.Graph);
  const graph = new NavCore.Graph(campus.nodes, campus.edges);
  const r1 = graph.route("GATE", "ENT_A");
  ok("GATE → ENT_A 有路线", !!r1 && r1.ids.length >= 2, r1 ? r1.ids.join(">") : "null");
  ok("GATE → ENT_A 距离 > 0", !!r1 && r1.distance > 0, r1 ? String(r1.distance) : "");
  const targets = ["ENT_A", "ENT_B", "ENT_C", "ENT_G", "ENT_F", "ENT_E1", "ENT_E2", "ENT_E3", "ENT_I"];
  let missing = [];
  for (const t of targets) {
    const r = graph.route("GATE", t);
    if (!r || !r.ids.length) missing.push(t);
  }
  ok("GATE 可达全部教学楼入口", missing.length === 0, missing.join(","));
  ok("不可达节点返回 null", graph.route("GATE", "NOPE") === null);

  console.log("== 5. 外部室内提供方 ==");
  const expected = ["A", "C", "E1", "E2", "E3", "F", "G", "I"];
  const list = providers.list().slice().sort();
  ok("对接楼栋为 A/C/E1/E2/E3/F/G/I", JSON.stringify(list) === JSON.stringify(expected.sort()), JSON.stringify(list));
  ok("B 栋被明确排除", providers.excluded.indexOf("B") >= 0 && providers.get("B") === null);
  let badProvider = [];
  for (const id of list) {
    const entry = providers.get(id);
    const b = campus.buildings.find((x) => x.id === id);
    if (!b) { badProvider.push(id + ":campus missing"); continue; }
    if (!campusNodes.has(b.node)) badProvider.push(id + ":node missing");
    if (!entry.floors || entry.floors.length !== b.floors) {
      badProvider.push(`${id}:floors ${entry.floors ? entry.floors.length : 0} != building ${b.floors}`);
    }
    const url = providers.buildUrl(id);
    if (!url || !url.startsWith(providers.baseUrl + "#")) badProvider.push(id + ":bad url " + url);
  }
  ok("提供方与校园楼栋/楼层一致", badProvider.length === 0, badProvider.join("; "));
  const urlA = providers.buildUrl("A", "2F");
  ok("A 栋 2F 深链正确", urlA === "https://yang112400.github.io/campus-map-site/#A/2F", urlA);
  const urlI = providers.buildUrl("I", "4F");
  ok("I 栋 4F 深链正确", urlI === "https://yang112400.github.io/campus-map-site/#I/4F", urlI);
  ok("非法楼层回退默认层", providers.buildUrl("A", "9F").endsWith("#A/1F"), providers.buildUrl("A", "9F"));
  ok("未覆盖楼栋返回 null", providers.buildUrl("LIB") === null && providers.buildUrl("B") === null);

  console.log("== 6. 页面 id / 脚本引用 ==");
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const mainJs = fs.readFileSync(path.join(ROOT, "app/main.js"), "utf8");
  const ids = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  const refs = new Set();
  for (const m of mainJs.matchAll(/\$\(\s*"([^"]+)"\s*\)/g)) refs.add(m[1]);
  for (const m of mainJs.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g)) refs.add(m[1]);
  const missingIds = [...refs].filter((id) => !ids.has(id));
  ok("index.html 覆盖 main.js 的 DOM id", missingIds.length === 0, missingIds.join(","));

  const scripts = [...html.matchAll(/<script\s+src="([^"]+)"/g)].map((m) => m[1]);
  const scriptPaths = scripts.map((s) => s.split("?")[0]);
  const missingScripts = scripts.filter((s) => !fs.existsSync(path.join(ROOT, s.split("?")[0])));
  ok("index.html 引用的脚本都存在", missingScripts.length === 0, missingScripts.join(","));
  ok("index.html 引入 indoor-providers", scriptPaths.includes("assets/indoor-providers.js"));
  ok("index.html 引入 indoor-bridge", scriptPaths.includes("app/indoor-bridge.js"));

  const bridge = fs.readFileSync(path.join(ROOT, "app/indoor-bridge.js"), "utf8");
  const bridgeRefs = new Set();
  for (const m of bridge.matchAll(/\$\(\s*"([^"]+)"\s*\)/g)) bridgeRefs.add(m[1]);
  const missingBridgeIds = [...bridgeRefs].filter((id) => !ids.has(id));
  ok("index.html 覆盖 indoor-bridge 的 DOM id", missingBridgeIds.length === 0, missingBridgeIds.join(","));
  ok("桥接未硬编码 B 栋深链", !/campus-map-site\/#B/.test(bridge));
  ok("室外样式文件存在", fs.existsSync(path.join(ROOT, "styles/outdoor.css")));
  const bLocalPage = path.join(ROOT, "b-package", "3d.html");
  ok(
    "B 楼本地页存在且不接外部站",
    fs.existsSync(bLocalPage) && !/campus-map-site/.test(fs.readFileSync(bLocalPage, "utf8"))
  );

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
