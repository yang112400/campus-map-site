/* 快速检查乐骑核心与数据 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const Core = require("../app/cycling-core.js");

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "data", "cycling.js"), "utf8"), ctx);
const data = ctx.window.CYCLING_DATA;

console.log("data", data.graph.nodes.length, "nodes", data.graph.edges.length, "edges", "corridor", data.corridor.join(","));
for (const [a, b] of [["GATE", "A"], ["GATE", "LIB"], ["GATE", "DORM_HT78"], ["DORM_ZY", "LIB"], ["A", "B"], ["B", "LIB"], ["DORM_DX1415", "F"], ["GYM", "A"]]) {
  const t0 = Date.now();
  const r = Core.plan(data, a, b);
  const ms = Date.now() - t0;
  if (!r.ok) { console.log(a, "->", b, "ERR", r.error, r.message); continue; }
  const route = r.route;
  console.log(
    `${a}->${b}`.padEnd(20),
    `${Core.formatDistance(route.distance)}`.padStart(8),
    `valid=${r.validCount}`,
    `cand=${r.candidates}`,
    `repeat=${route.repeats}`,
    `cross=${route.crossings}`,
    `big=${(route.bigRatio * 100).toFixed(0)}%`,
    `wind=${Math.round(route.maxWinding || 0)}`,
    `play=${route.hits.map(h => h.name + "@" + h.distance + "/w" + h.winding).join("/") || "NONE"}`,
    `seq=${route.seq.length}`,
    `${ms}ms`,
    r.warning ? "WARN" : ""
  );
}
