/* B 栋新模型（b-model-kit v4.1）测试
 * 覆盖：B 楼包文件、B_BUILDING_DATA 数据规模与自洽、8 入口可达全部 80 教室、
 *       室内导航 API（dijkstra/resolveNode/buildSteps/pathStats）、
 *       b-package/3d.html 与 real-map 接入点，以及旧模型残留的清理。
 * 运行：node tests/b-package.test.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const P = (rel) => path.join(ROOT, rel);
const read = (rel) => fs.readFileSync(P(rel), "utf8");

let pass = 0;
let fail = 0;
const failed = [];
function ok(name, cond, detail) {
  if (cond) {
    pass++;
    console.log("  PASS  " + name);
  } else {
    fail++;
    failed.push(name + (detail ? " :: " + detail : ""));
    console.log("  FAIL  " + name + (detail ? " :: " + detail : ""));
  }
}
function exists(rel) {
  try {
    return fs.statSync(P(rel)).isFile() && fs.statSync(P(rel)).size > 0;
  } catch (err) {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * 1. B 楼包文件
 * ------------------------------------------------------------------ */
console.log("== 1. B 楼包文件 ==");
const REQUIRED_FILES = [
  "b-package/3d.html",
  "b-package/assets/b-building-data.js",
  "b-package/assets/b-indoor-nav.js",
  "b-package/vendor/three.min.js",
  "b-package/vendor/OrbitControls.js"
];
REQUIRED_FILES.forEach((rel) => ok(rel + " 存在且非空", exists(rel)));
ok("旧 b-package/assets/data.js 已移除", !fs.existsSync(P("b-package/assets/data.js")));

/* ------------------------------------------------------------------ *
 * 2. 数据加载与规模
 * ------------------------------------------------------------------ */
console.log("== 2. B_BUILDING_DATA 数据 ==");
function loadBData() {
  const sandbox = { window: {}, console: { log() {}, warn() {}, error() {} } };
  vm.createContext(sandbox);
  vm.runInContext(read("b-package/assets/b-building-data.js"), sandbox, {
    filename: "b-package/assets/b-building-data.js"
  });
  return sandbox.window.B_BUILDING_DATA || null;
}

let D = null;
try {
  D = loadBData();
} catch (err) {
  ok("b-building-data.js 可执行并挂载 window.B_BUILDING_DATA", false, String(err && err.message));
}
if (!D) {
  ok("window.B_BUILDING_DATA 已加载", false, "未定义 B_BUILDING_DATA");
  console.log("\nPASS " + pass + "  FAIL " + fail);
  failed.forEach((f) => console.log(" - " + f));
  process.exit(1);
}

const FLOORS = Array.isArray(D.floors) ? D.floors : [];
const ROOMS = Array.isArray(D.rooms) ? D.rooms : [];
const NODES = Array.isArray(D.nodes) ? D.nodes : [];
const EDGES = Array.isArray(D.edges) ? D.edges : [];
const ENTRANCES = Array.isArray(D.entrances) ? D.entrances : [];
const ROUTES = Array.isArray(D.routes) ? D.routes : [];

ok("window.B_BUILDING_DATA 已加载", !!(D && NODES.length && EDGES.length));
ok("9 个楼层 F1–F7 + N4/N5", FLOORS.length === 9 &&
  ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "N4", "N5"].every((id) => FLOORS.some((f) => f.id === id)),
  FLOORS.map((f) => f.id).join(","));
ok("80 间教室", ROOMS.length === 80, String(ROOMS.length));
ok("楼层教室合计 80", FLOORS.reduce((n, f) => n + ((f.rooms || []).length), 0) === 80,
  String(FLOORS.reduce((n, f) => n + ((f.rooms || []).length), 0)));
ok("265 个节点", NODES.length === 265, String(NODES.length));
ok("318 条边", EDGES.length === 318, String(EDGES.length));
ok("8 个入口", ENTRANCES.length === 8, String(ENTRANCES.length));
ok("7 条示例路线", ROUTES.length === 7, String(ROUTES.length));

const nodeIds = new Set(NODES.map((n) => n && n.id));
ok("节点 id 无重复", nodeIds.size === NODES.length, (NODES.length - nodeIds.size) + " 个重复");

const roomsMissingNode = ROOMS.filter((r) => !r || !nodeIds.has(r.node));
ok("所有教室的 node 都存在", roomsMissingNode.length === 0,
  roomsMissingNode.slice(0, 5).map((r) => r && r.id + "→" + r.node).join(","));
const floorRoomsMissingNode = [];
FLOORS.forEach((f) => (f.rooms || []).forEach((r) => {
  if (!r || !nodeIds.has(r.node)) floorRoomsMissingNode.push((f.id || "?") + ":" + (r && r.id));
}));
ok("楼层内的教室 node 都存在", floorRoomsMissingNode.length === 0, floorRoomsMissingNode.slice(0, 5).join(","));

const danglingEdges = EDGES.filter((e) => !e || !nodeIds.has(e.from) || !nodeIds.has(e.to));
ok("所有边的两端节点都存在", danglingEdges.length === 0,
  danglingEdges.slice(0, 5).map((e) => e && (e.from + "→" + e.to)).join(","));

const badEntrances = ENTRANCES.filter((en) => !en || !nodeIds.has(en.node || en.id));
ok("所有入口的 node 都存在", badEntrances.length === 0,
  badEntrances.slice(0, 5).map((en) => en && en.id).join(","));

/* ------------------------------------------------------------------ *
 * 3. 室内导航内核加载
 * ------------------------------------------------------------------ */
console.log("== 3. 室内导航内核 b-indoor-nav.js ==");
let Nav = null;
try {
  Nav = require(P("b-package/assets/b-indoor-nav.js"));
} catch (err) {
  ok("b-indoor-nav.js 可 require", false, String(err && err.message));
}
if (!Nav) {
  ok("BIndoorNav 已导出", false, "module.exports 为空");
  console.log("\nPASS " + pass + "  FAIL " + fail);
  failed.forEach((f) => console.log(" - " + f));
  process.exit(1);
}
const NAV_SRC = read("b-package/assets/b-indoor-nav.js");
ok("UMD：浏览器挂 window.BIndoorNav", /BIndoorNav\s*=/.test(NAV_SRC) && /window|root|self/.test(NAV_SRC));
ok("UMD：Node 走 module.exports", /module\.exports/.test(NAV_SRC));
["buildGraph", "dijkstra", "resolveNode", "buildSteps", "pathStats"].forEach((fn) =>
  ok("BIndoorNav." + fn + " 是函数", typeof Nav[fn] === "function"));

const graph = Nav.buildGraph(D);
ok("buildGraph 建立 265 节点索引", Object.keys(graph.nodeById).length === 265,
  String(Object.keys(graph.nodeById).length));
ok("buildGraph 建立 80 教室索引", Object.keys(graph.roomById).length >= 80,
  String(Object.keys(graph.roomById).length));
ok("buildGraph 建立 8 入口索引", Object.keys(graph.entranceById).length === 8,
  String(Object.keys(graph.entranceById).length));

/* ------------------------------------------------------------------ *
 * 4. 可达性
 * ------------------------------------------------------------------ */
console.log("== 4. 入口到节点/教室可达 ==");
const seen = new Set(["ENT1"]);
const queue = ["ENT1"];
while (queue.length) {
  const u = queue.shift();
  ((graph.adj[u]) || []).forEach((nb) => {
    if (!seen.has(nb.to)) {
      seen.add(nb.to);
      queue.push(nb.to);
    }
  });
}
ok("BFS：ENT1 可达全部 265 节点", seen.size === NODES.length,
  "reached " + seen.size + "/" + NODES.length);

const unreachable = [];
ENTRANCES.forEach((en) => {
  ROOMS.forEach((room) => {
    if (!Nav.dijkstra(graph, en.id, room.node)) unreachable.push(en.id + "→" + room.node);
  });
});
ok("8 个入口均可直达全部 80 间教室", unreachable.length === 0,
  unreachable.slice(0, 5).join(","));

const SAMPLES = [
  ["ENT1", "F1_101", 43],
  ["ENT1", "F7_707", 303.9],
  ["ENT_NW", "N5_528", 42.5]
];
SAMPLES.forEach(([from, to]) => {
  const p = Nav.dijkstra(D, from, to);
  const s = p ? Nav.pathStats(D, p) : null;
  ok("示例路线 " + from + " → " + to + " 可达且 time>0",
    !!(p && p.length > 1 && p[0] === from && p[p.length - 1] === to && s && s.time > 0),
    p ? p.join(">") + " time=" + (s && s.time) : "null");
});

const badRoutes = ROUTES.filter((r) => {
  if (!r || !r.from || !r.to) return true;
  const p = Nav.dijkstra(D, r.from, r.to);
  return !p || p.length < 2;
});
ok("7 条示例路线全部可达", badRoutes.length === 0, badRoutes.map((r) => r && r.name).join(","));

/* ------------------------------------------------------------------ *
 * 5. 导航 API 行为
 * ------------------------------------------------------------------ */
console.log("== 5. 导航 API ==");
const resolveCases = [
  ["F1_101", "F1_101", "节点 id"],
  ["101", "F1_101", "教室号"],
  ["ENT1", "ENT1", "入口 id"],
  ["N5_528", "N5_528", "北楼节点"],
  ["ENT_NW", "ENT_NW", "北楼西入口"],
  ["707", "F7_707", "教室号（跨层）"]
];
resolveCases.forEach(([input, expected, label]) => {
  ok("resolveNode(" + label + ": " + input + ") → " + expected,
    Nav.resolveNode(D, input) === expected, String(Nav.resolveNode(D, input)));
});
ok("resolveNode 大小写不敏感 ent1 → ENT1", Nav.resolveNode(D, "ent1") === "ENT1");
ok("resolveNode 未知输入返回 null", Nav.resolveNode(D, "NOT_A_PLACE") === null);

ok("dijkstra 未知起点返回 null", Nav.dijkstra(D, "NOT_A_PLACE", "F1_101") === null);

const crossPath = Nav.dijkstra(D, "ENT1", "F7_707");
const steps = Nav.buildSteps(D, crossPath);
const stepText = steps.map((s) => String(s)).join(" | ");
ok("buildSteps 非空（ENT1→F7_707）", steps.length >= 3, String(steps.length));
ok("buildSteps 每步都有中文文本", steps.length > 0 && steps.every((s) => s && typeof s.text === "string" && s.text.length > 0));
ok("buildSteps 含竖向步骤（电梯/楼梯/坡道）",
  steps.some((s) => ["elevator", "stairs", "ramp"].indexOf(s.type) >= 0) ||
  /电梯|楼梯|扶梯/.test(stepText), stepText.slice(0, 160));
ok("buildSteps 含跨层文字（电梯/楼梯 + 楼层）",
  /电梯|楼梯/.test(stepText) && /F[1-7]/.test(stepText), stepText.slice(0, 160));
ok("buildSteps 首步为入口、末步为到达",
  steps.length > 0 && steps[0].type === "entrance" && steps[steps.length - 1].type === "arrive",
  steps.length ? steps[0].type + "→" + steps[steps.length - 1].type : "empty");

const stats = Nav.pathStats(D, crossPath);
ok("pathStats 返回 time>0", stats && stats.time > 0, String(stats && stats.time));
ok("pathStats 返回 distance>0", stats && stats.distance > 0, String(stats && stats.distance));
ok("pathStats.nodeCount 等于路径节点数", stats && stats.nodeCount === crossPath.length,
  (stats && stats.nodeCount) + " vs " + crossPath.length);
ok("pathStats 记录跨层 fromFloor/toFloor",
  stats && stats.fromFloor === "F1" && stats.toFloor === "F7",
  (stats && stats.fromFloor) + "→" + (stats && stats.toFloor));
ok("pathStats 含竖向换乘", stats && stats.transferCount >= 1, String(stats && stats.transferCount));

/* ------------------------------------------------------------------ *
 * 6. b-package/3d.html 接入点
 * ------------------------------------------------------------------ */
console.log("== 6. b-package/3d.html ==");
const html3d = read("b-package/3d.html");
[
  ["返回室外", /返回室外/],
  ["../real-map.html", /\.\.\/real-map\.html/],
  ["#startSelect", /id="startSelect"/],
  ["#endSelect", /id="endSelect"/],
  ["#btnPlan", /id="btnPlan"/],
  ["#rcSteps", /id="rcSteps"/],
  ["assets/b-indoor-nav.js", /assets\/b-indoor-nav\.js/],
  ["assets/b-building-data.js", /assets\/b-building-data\.js/],
  ["URL from=", /from=/],
  ["URL to=", /to=/],
  ["URL floor=", /floor=/],
  ["BIndoorNav", /BIndoorNav/],
  ["dijkstra", /dijkstra/],
  ["buildSteps（分步指引）", /buildSteps/]
].forEach(([label, re]) => ok("3d.html 含 " + label, re.test(html3d)));
ok("3d.html 不引用旧 assets/data.js", !/assets\/data\.js/.test(html3d));

/* 静态自洽：内联脚本可编译、脚本文件存在、DOM id 覆盖（无浏览器环境下的等价校验） */
const inlineScripts = [];
html3d.replace(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g, (m, src) => {
  inlineScripts.push(src);
  return m;
});
let inlineError = null;
inlineScripts.forEach((src, i) => {
  try {
    new vm.Script(src, { filename: "b-package/3d.html#inline" + i });
  } catch (err) {
    inlineError = inlineError || ("inline" + i + ": " + err.message);
  }
});
ok("3d.html 内联脚本语法可编译", inlineScripts.length > 0 && !inlineError, inlineError || (inlineScripts.length + " 段"));

const scriptSrcs = [];
html3d.replace(/<script[^>]*\bsrc="([^"]+)"/g, (m, src) => {
  scriptSrcs.push(src);
  return m;
});
const missingScripts = scriptSrcs.filter((src) => /^https?:/i.test(src) || !exists("b-package/" + src));
ok("3d.html 引用的本地脚本文件都存在", missingScripts.length === 0, missingScripts.join(","));

const declaredIds = new Set();
html3d.replace(/\bid="([^"]+)"/g, (m, id) => {
  declaredIds.add(id);
  return m;
});
const idRefs = [];
html3d.replace(/getElementById\("([^"]+)"\)/g, (m, id) => {
  idRefs.push(id);
  return m;
});
const missingIds = idRefs.filter((id) => !declaredIds.has(id));
ok("3d.html 声明的 id 覆盖 getElementById 引用", idRefs.length > 0 && missingIds.length === 0,
  missingIds.join(","));
ok("3d.html 无外部 http(s) 依赖", !/https?:\/\//.test(html3d));

/* ------------------------------------------------------------------ *
 * 7. real-map.html 接入点
 * ------------------------------------------------------------------ */
console.log("== 7. real-map.html ==");
const realHtml = read("real-map.html");
["bEntranceSelect", "bRoomSelect", "btnBIndoor"].forEach((id) =>
  ok("real-map.html 含 #" + id, realHtml.indexOf('id="' + id + '"') >= 0));
ok("real-map.html 加载 b-package/assets/b-building-data.js",
  /b-package\/assets\/b-building-data\.js(\?v=\d+)?/.test(realHtml),
  (realHtml.match(/b-package\/assets\/b-building-data\.js[^"']*/) || [])[0] || "未引用");
ok("real-map.html 不引用旧 b-package/assets/data.js", !/b-package\/assets\/data\.js/.test(realHtml));

/* ------------------------------------------------------------------ *
 * 8. app/real-map.js 接入点
 * ------------------------------------------------------------------ */
console.log("== 8. app/real-map.js ==");
const realJs = read("app/real-map.js");
[
  ["window.B_BUILDING_DATA", /B_BUILDING_DATA/],
  ["#bEntranceSelect", /bEntranceSelect/],
  ["defaultBEntrance", /defaultBEntrance/],
  ["b-package/3d.html?from=", /b-package\/3d\.html\?from=/],
  ["&to=", /&to=/],
  ["&floor=", /&floor=/]
].forEach(([label, re]) => ok("real-map.js 含 " + label, re.test(realJs)));
ok("real-map.js 已移除旧 APP_DATA", !/APP_DATA/.test(realJs));
ok("real-map.js 已移除旧 findBPath", !/findBPath/.test(realJs));
ok("real-map.js 不再使用 ?route=", !/\?route=/.test(realJs));
ok("real-map.js 不再引用旧 B_entrance", !/B_entrance/.test(realJs));
let js3Error = null;
try {
  new vm.Script(realJs, { filename: "app/real-map.js" });
} catch (err) {
  js3Error = err.message;
}
ok("real-map.js 语法可编译（含 B 楼深链逻辑）", !js3Error, js3Error || "OK");

/* ------------------------------------------------------------------ *
 * 9. 旧模型残留（主流程文件中不得出现）
 * ------------------------------------------------------------------ */
console.log("== 9. 旧模型残留 ==");
const MAIN_FLOW = [
  ["real-map.html", realHtml],
  ["app/real-map.js", realJs],
  ["b-package/3d.html", html3d]
];
MAIN_FLOW.forEach(([name, src]) => {
  ok(name + " 无「79 教室」", !/79\s*(?:间)?\s*教室/.test(src));
  ok(name + " 无「107 节点」", !/107\s*节点/.test(src));
  ok(name + " 无「111 边」", !/111\s*(?:条)?\s*边/.test(src));
  ok(name + " 无旧入口 B_entrance", !/B_entrance/.test(src));
});

/* ------------------------------------------------------------------ *
 * 汇总
 * ------------------------------------------------------------------ */
console.log("\nPASS " + pass + "  FAIL " + fail);
if (fail) {
  failed.forEach((f) => console.log(" - " + f));
  process.exitCode = 1;
}
