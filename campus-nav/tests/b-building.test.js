/* B 楼真实图纸页静态校验 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
let pass = 0, fail = 0;
const failed = [];
function ok(name, cond, detail) {
  if (cond) { pass++; console.log("  PASS  " + name); }
  else { fail++; failed.push(name + (detail ? " :: " + detail : "")); console.log("  FAIL  " + name + (detail ? " :: " + detail : "")); }
}
function load(rel) {
  const ctx = { window: {}, console, Math, Date, Set, Map, Infinity };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), "utf8"), ctx, { filename: rel });
  return ctx.window;
}

const w = load("data/b-building.js");
const B = w.B_BUILDING;
ok("b-building.js 已加载", !!B);
ok("7 层楼层", (B.floors || []).length === 7, String((B.floors || []).length));
ok("16 个入口", (B.entrances || []).length === 16, String((B.entrances || []).length));
ok("9 个通道口分组", (B.groups || []).length === 9, String((B.groups || []).length));

const rooms = B.floors.reduce((n, f) => n + f.rooms.length, 0);
ok("教室总数 > 70", rooms > 70, String(rooms));

const missingImgs = [];
for (const f of B.floors) {
  if (!fs.existsSync(path.join(ROOT, f.image))) missingImgs.push(f.image);
}
if (!fs.existsSync(path.join(ROOT, B.overviewImage))) missingImgs.push(B.overviewImage);
ok("楼层图与总览图都存在", missingImgs.length === 0, missingImgs.join(","));

const html = fs.readFileSync(path.join(ROOT, "b-building.html"), "utf8");
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
for (const id of ["floorTabs", "roomList", "planImage", "roomInfo", "entranceList", "viewerTitle", "btnZoom"]) {
  ok("HTML 含 #" + id, ids.has(id));
}

const js = fs.readFileSync(path.join(ROOT, "app/b-building.js"), "utf8");
const refs = new Set([...js.matchAll(/\$\(\s*"([^"]+)"\s*\)/g)].map((m) => m[1]));
const missingRefs = [...refs].filter((id) => !ids.has(id));
ok("b-building.js 的 DOM 引用都存在", missingRefs.length === 0, missingRefs.join(","));

ok("页面标注数据来源", /BMap/.test(html) && /xidian-navigation/.test(html));
ok("页面标注 B 楼模型接入位/不接外部", /接入位|不接入/.test(html));

console.log("\nPASS " + pass + "  FAIL " + fail);
if (fail) { failed.forEach((f) => console.log(" - " + f)); process.exitCode = 1; }
