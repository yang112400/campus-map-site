/* 从乐骑 GCJ 路网生成步行页只读道路吸附点（不修改乐骑数据） */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const ROOT = path.resolve(__dirname, "..");
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "data", "cycling.js"), "utf8"), ctx);
const data = ctx.window.CYCLING_DATA;
const nodes = data.graph.nodes.map((n) => [Number(n[0].toFixed(7)), Number(n[1].toFixed(7))]);
const out = `/* 真实 GIS 页道路吸附点（由 data/cycling.js 的 GCJ 路网生成，只读）
 * 用途：地图任意点选时，先吸附到最近道路节点，再调用学校路径接口。
 * 路网 © OpenStreetMap contributors（ODbL）。
 */
window.REAL_ROAD_SNAP = ${JSON.stringify({ source: "OSM/GCJ cycling graph", attribution: "路网 © OpenStreetMap contributors", nodes: nodes })};\n`;
fs.writeFileSync(path.join(ROOT, "data", "real-road-snap.js"), out);
console.log("nodes", nodes.length, "bytes", out.length);
