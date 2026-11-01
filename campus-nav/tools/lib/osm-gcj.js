/* OSM → GCJ 校园路网工具（仅构建数据用，不进入浏览器） */
"use strict";

const fs = require("fs");
const path = require("path");

const PI = Math.PI, A = 6378245.0, EE = 0.00669342162296594323;
function outOfChina(lon, lat) { return !(lon > 73.66 && lon < 135.05 && lat > 3.86 && lat < 53.55); }
function tLat(x, y) {
  let r = -100 + 2 * x + 3 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  r += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  r += (20 * Math.sin(y * PI) + 40 * Math.sin(y / 3 * PI)) * 2 / 3;
  r += (160 * Math.sin(y / 12 * PI) + 320 * Math.sin(y * PI / 30)) * 2 / 3;
  return r;
}
function tLon(x, y) {
  let r = 300 + x + 2 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  r += (20 * Math.sin(6 * x * PI) + 20 * Math.sin(2 * x * PI)) * 2 / 3;
  r += (20 * Math.sin(x * PI) + 40 * Math.sin(x / 3 * PI)) * 2 / 3;
  r += (150 * Math.sin(x / 12 * PI) + 300 * Math.sin(x / 30 * PI)) * 2 / 3;
  return r;
}
function wgs2gcj(lon, lat) {
  if (outOfChina(lon, lat)) return [lon, lat];
  let dLat = tLat(lon - 105, lat - 35), dLon = tLon(lon - 105, lat - 35);
  const radLat = lat / 180 * PI;
  let magic = Math.sin(radLat); magic = 1 - EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI);
  dLon = (dLon * 180) / (A / sqrtMagic * Math.cos(radLat) * PI);
  return [lon + dLon, lat + dLat];
}

const SKIP = new Set(["steps", "construction", "proposed", "platform", "bus_stop", "elevator", "escalator"]);
const CLASS = {
  trunk: 1.0, primary: 1.0, secondary: 1.05, tertiary: 1.1, residential: 1.3,
  living_street: 1.5, unclassified: 1.4, service: 1.55, cycleway: 1.1,
  footway: 2.2, path: 2.6, pedestrian: 2.0
};
const BIG = new Set([
  "外环北路", "外环南路", "内环北路", "内环南路", "梧桐大道", "银杏大道",
  "海棠路", "海棠二路", "雷甘路", "西太路", "西沣中路", "成章路"
]);

function meters(a, b) {
  if (Array.isArray(a)) a = { lon: a[0], lat: a[1] };
  if (Array.isArray(b)) b = { lon: b[0], lat: b[1] };
  const mid = ((a.lat + b.lat) / 2) * Math.PI / 180;
  return Math.hypot((b.lon - a.lon) * 111320 * Math.cos(mid), (b.lat - a.lat) * 110540);
}

function buildGraph(osmJson, bbox, opts) {
  const exclude = new Set((opts && opts.exclude) || []);
  const nodes = new Map();
  let edgeId = 0;
  function node(p) {
    const id = p[0].toFixed(7) + "," + p[1].toFixed(7);
    if (!nodes.has(id)) nodes.set(id, { id, lon: p[0], lat: p[1], edges: [] });
    return nodes.get(id);
  }
  function inside(p) {
    return p[0] >= bbox.minLon && p[0] <= bbox.maxLon && p[1] >= bbox.minLat && p[1] <= bbox.maxLat;
  }
  function addEdge(a, b, cls, name) {
    if (!inside(a) || !inside(b)) return;
    const na = node(a), nb = node(b);
    if (na.id === nb.id) return;
    const d = meters(na, nb);
    if (d < 0.4 || d > 500) return;
    const e = { id: edgeId++, a: na.id, b: nb.id, d, cls, name: name || "" };
    na.edges.push({ to: nb.id, e });
    nb.edges.push({ to: na.id, e });
  }
  for (const el of osmJson.elements || []) {
    if (el.type !== "way" || !el.geometry) continue;
    const t = el.tags || {};
    const cls = t.highway;
    if (!cls || SKIP.has(cls) || exclude.has(cls)) continue;
    const geom = el.geometry.map(p => wgs2gcj(p.lon, p.lat));
    for (let i = 1; i < geom.length; i++) addEdge(geom[i - 1], geom[i], cls, t.name || "");
  }

  /* 最大连通分量 */
  const seen = new Set();
  let best = [];
  for (const n of nodes.values()) {
    if (seen.has(n.id)) continue;
    const stack = [n.id], comp = [];
    seen.add(n.id);
    while (stack.length) {
      const id = stack.pop(); comp.push(id);
      for (const e of nodes.get(id).edges) if (!seen.has(e.to)) { seen.add(e.to); stack.push(e.to); }
    }
    if (comp.length > best.length) best = comp;
  }
  const compSet = new Set(best);
  for (const id of [...nodes.keys()]) if (!compSet.has(id)) nodes.delete(id);
  return { nodes, edges: edgeId, largest: best.length };
}

function snap(graph, lon, lat) {
  let best = null;
  for (const n of graph.nodes.values()) {
    const d = meters({ lon, lat }, n);
    if (!best || d < best.d) best = { id: n.id, d };
  }
  return best;
}

function edgeCost(e, opts) {
  let c = e.d * (CLASS[e.cls] || 2);
  if (BIG.has(e.name)) c *= 0.68;
  if (opts && opts.preferBig === false) c = e.d;
  return c;
}

function dijkstra(graph, from, to, banned) {
  const dist = new Map([[from, 0]]), prev = new Map();
  const pq = [[0, from]];
  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, u] = pq.shift();
    if (d > (dist.get(u) ?? Infinity)) continue;
    if (u === to) break;
    for (const e of graph.nodes.get(u).edges) {
      if (banned && banned.has(e.e.id)) continue;
      const nd = d + edgeCost(e.e);
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, { u, e: e.e });
        pq.push([nd, e.to]);
      }
    }
  }
  if (from !== to && !prev.has(to)) return null;
  const edges = [], ids = [];
  let cur = to;
  while (cur !== from) {
    const p = prev.get(cur);
    if (!p) return null;
    edges.unshift(p.e);
    ids.push(p.e.id);
    cur = p.u;
  }
  return { edges, ids };
}

module.exports = { wgs2gcj, buildGraph, snap, dijkstra, edgeCost, meters, CLASS, BIG };
