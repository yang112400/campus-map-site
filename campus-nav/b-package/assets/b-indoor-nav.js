/*!
 * b-indoor-nav.js —— B 楼室内导航内核（本地、无外部依赖）
 *
 * 数据：window.B_BUILDING_DATA（assets/b-building-data.js）
 * 约定：x 增大 = 东（与“东电梯 x=270、西电梯 x=0”的标签一致），z 增大 = 南；
 *       楼层 id 为 F1–F7（南楼）/ N4、N5（北楼）。
 *
 * 浏览器 <script> 加载后挂到 window.BIndoorNav；
 * Node 下 require("./assets/b-indoor-nav.js") 得到同一对象（供测试用）。
 *
 * 对外 API：
 *   BIndoorNav.buildGraph(data)            → { data, nodeById, roomById, entranceById, floorById, adj, ... }
 *   BIndoorNav.dijkstra(data, from, to)    → 节点 id 数组 | null（from/to 支持节点 id、教室号、入口 id、别名）
 *   BIndoorNav.resolveNode(data, id)       → 节点 id | null
 *   BIndoorNav.buildSteps(data, path)      → [{ type, floor, text, ... }]，每项可 String() 成中文指引
 *   BIndoorNav.pathStats(data, path)       → { time, distance, nodeCount, ... }
 */
(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.BIndoorNav = factory();
  }
})(typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : this, function () {
  "use strict";

  var VERSION = "1.0.0";

  /* ------------------------------------------------------------------ *
   * 基础工具
   * ------------------------------------------------------------------ */

  function isGraph(x) {
    return !!(x && x.adj && x.nodeById && x.roomById);
  }

  function toGraph(dataOrGraph) {
    if (isGraph(dataOrGraph)) return dataOrGraph;
    return buildGraph(dataOrGraph);
  }

  function pairKey(a, b) {
    return a < b ? a + "|" + b : b + "|" + a;
  }

  function floorOf(g, fid) {
    return g.floorById[fid] || null;
  }

  function floorWing(g, fid) {
    var f = floorOf(g, fid);
    return f && f.wing ? f.wing : "S";
  }

  function floorLabel(fid) {
    return fid || "—";
  }

  function levelOf(node) {
    return node && typeof node.level === "number" ? node.level : 0;
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  /* 中文分步指引：x 增大 = 东 */
  function directionWord(dx) {
    return dx > 0 ? "东" : "西";
  }

  var HORIZONTAL_EDGE_TYPES = { walk: 1, door: 1, service: 1, entrance: 1 };
  var VERTICAL_EDGE_TYPES = { elevator: 1, stairs: 1, ramp: 1, passage: 1 };

  function isHorizontalEdge(type) {
    return !!HORIZONTAL_EDGE_TYPES[type];
  }

  function isVerticalEdge(type) {
    return !!VERTICAL_EDGE_TYPES[type];
  }

  /* ------------------------------------------------------------------ *
   * buildGraph
   * ------------------------------------------------------------------ */

  function buildGraph(data) {
    if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
      throw new TypeError("BIndoorNav.buildGraph: 需要包含 nodes/edges 的 B_BUILDING_DATA");
    }
    var nodeById = {};
    var roomById = {};
    var roomByAlias = {};
    var entranceById = {};
    var floorById = {};
    var adj = {};
    var edgeByPair = {};

    (data.floors || []).forEach(function (f) {
      if (f && f.id) floorById[f.id] = f;
    });

    data.nodes.forEach(function (n) {
      if (!n || !n.id) return;
      nodeById[n.id] = n;
      adj[n.id] = [];
      if (n.type === "room" && n.room != null) {
        var rid = String(n.room);
        if (!roomById[rid]) {
          roomById[rid] = { id: rid, name: n.name || rid, node: n.id, floor: n.floor, level: n.level, wing: n.wing };
        }
      }
    });

    /* data.rooms 是更完整的一份（带 aliases / source 等），优先使用 */
    (data.rooms || []).forEach(function (r) {
      if (!r || r.id == null || !r.node || !nodeById[r.node]) return;
      var rid = String(r.id);
      roomById[rid] = r;
      if (r.name != null) roomById[String(r.name)] = r;
      (r.aliases || []).forEach(function (a) {
        if (a != null) roomByAlias[String(a)] = r;
      });
    });

    (data.entrances || []).forEach(function (en) {
      if (!en || !en.id) return;
      entranceById[en.id] = en;
    });

    data.edges.forEach(function (e, idx) {
      if (!e || !e.from || !e.to) return;
      var a = nodeById[e.from];
      var b = nodeById[e.to];
      if (!a || !b) return; /* 悬空边忽略，保证图自洽 */
      var record = {
        from: e.from,
        to: e.to,
        distance: Number(e.distance) || 0,
        time: Number(e.time) || 0,
        type: e.type || "walk",
        index: idx
      };
      edgeByPair[pairKey(e.from, e.to)] = record;
      adj[e.from].push({ to: e.to, distance: record.distance, time: record.time, type: record.type, edge: record });
      adj[e.to].push({ to: e.from, distance: record.distance, time: record.time, type: record.type, edge: record });
    });

    return {
      version: VERSION,
      data: data,
      nodeById: nodeById,
      roomById: roomById,
      roomByAlias: roomByAlias,
      entranceById: entranceById,
      floorById: floorById,
      adj: adj,
      edgeByPair: edgeByPair
    };
  }

  /* ------------------------------------------------------------------ *
   * resolveNode：节点 id / 教室号 / 入口 id / 别名 → 节点 id
   * ------------------------------------------------------------------ */

  function resolveNode(dataOrGraph, id) {
    var g = toGraph(dataOrGraph);
    if (id == null) return null;
    var raw = String(id).trim();
    if (!raw) return null;

    var candidates = [raw];
    var stripped = raw.replace(/^[#＃]/, "").replace(/室$/, "").replace(/\s+/g, "");
    if (stripped && stripped !== raw) candidates.push(stripped);

    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (g.nodeById[c]) return c;
      if (g.roomById[c]) return g.roomById[c].node;
      if (g.roomByAlias[c]) return g.roomByAlias[c].node;
      if (g.entranceById[c]) return g.entranceById[c].node || c;
    }

    /* 大小写不敏感：ent1 / f7_707 / ent_nw */
    var lower = raw.toLowerCase();
    var ids = Object.keys(g.nodeById);
    for (var j = 0; j < ids.length; j++) {
      if (ids[j].toLowerCase() === lower) return ids[j];
    }
    var rids = Object.keys(g.roomById);
    for (var k = 0; k < rids.length; k++) {
      if (rids[k].toLowerCase() === lower) return g.roomById[rids[k]].node;
    }
    var aids = Object.keys(g.entranceById);
    for (var m = 0; m < aids.length; m++) {
      if (aids[m].toLowerCase() === lower) return g.entranceById[aids[m]].node || aids[m];
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   * findEdge（无向；返回 buildGraph 生成的统一边记录）
   * ------------------------------------------------------------------ */

  function findEdge(dataOrGraph, a, b) {
    var g = toGraph(dataOrGraph);
    var ia = resolveNode(g, a);
    var ib = resolveNode(g, b);
    if (!ia || !ib) return null;
    return g.edgeByPair[pairKey(ia, ib)] || null;
  }

  /* ------------------------------------------------------------------ *
   * dijkstra：以 time（秒）为权重，返回节点 id 数组
   * ------------------------------------------------------------------ */

  function dijkstra(dataOrGraph, from, to) {
    var g = toGraph(dataOrGraph);
    var start = resolveNode(g, from);
    var goal = resolveNode(g, to);
    if (!start || !goal) return null;
    if (start === goal) return [start];
    if (!g.adj[start] || !g.adj[goal]) return null;

    var dist = {};
    var prev = {};
    var done = {};
    Object.keys(g.adj).forEach(function (k) {
      dist[k] = Infinity;
    });
    dist[start] = 0;

    for (;;) {
      var u = null;
      var best = Infinity;
      Object.keys(dist).forEach(function (k) {
        if (!done[k] && dist[k] < best) {
          best = dist[k];
          u = k;
        }
      });
      if (u === null) break;
      if (u === goal) break;
      done[u] = true;
      var neighbours = g.adj[u] || [];
      for (var i = 0; i < neighbours.length; i++) {
        var nb = neighbours[i];
        var nd = dist[u] + (nb.time > 0 ? nb.time : 0.001);
        if (nd < dist[nb.to]) {
          dist[nb.to] = nd;
          prev[nb.to] = u;
        }
      }
    }

    if (!isFinite(dist[goal])) return null;

    var path = [goal];
    var cursor = goal;
    var guard = 0;
    while (path[0] !== start) {
      cursor = prev[path[0]];
      if (cursor == null) return null;
      path.unshift(cursor);
      if (++guard > 10000) return null;
    }
    return path;
  }

  /* ------------------------------------------------------------------ *
   * buildSteps：把节点序列翻成可读分步指引
   * ------------------------------------------------------------------ */

  function makeStep(type, text, extra) {
    var s = { type: type, text: text };
    if (extra) {
      Object.keys(extra).forEach(function (k) {
        if (k !== "text" && k !== "type") s[k] = extra[k];
      });
    }
    /* 让 steps.join(" ") / String(step) 直接得到中文文本，方便测试与展示 */
    s.toString = function () {
      return this.text;
    };
    return s;
  }

  function startStep(node) {
    var extra = { node: node.id, floor: node.floor };
    if (node.type === "entrance") {
      return makeStep("entrance", "从" + (node.name || node.id) + "进入（" + floorLabel(node.floor) + "）", extra);
    }
    if (node.type === "room") {
      return makeStep("start", "从 " + (node.name || node.id) + " 出发（" + floorLabel(node.floor) + "）", extra);
    }
    return makeStep("start", "从 " + floorLabel(node.floor) + " 出发", extra);
  }

  function arriveStep(node) {
    var extra = { node: node.id, floor: node.floor };
    if (node.type === "room") {
      return makeStep("arrive", "到达 " + (node.name || node.id) + "（" + floorLabel(node.floor) + "）", extra);
    }
    if (node.type === "entrance") {
      return makeStep("arrive", "到达" + (node.name || node.id), extra);
    }
    if (node.type === "elevator" || node.type === "stair_core" || node.type === "stair") {
      return makeStep("arrive", "到达 " + floorLabel(node.floor) + "（" + (node.name || node.id) + "）", extra);
    }
    return makeStep("arrive", "到达 " + floorLabel(node.floor) + " 走廊", extra);
  }

  function sameShaft(a, b) {
    var pa = String(a.id).replace(/_F\d+$/i, "");
    var pb = String(b.id).replace(/_F\d+$/i, "");
    return pa === pb;
  }

  function targetName(node) {
    if (!node) return "";
    if (node.type === "elevator" || node.type === "stair_core" || node.type === "stair" || node.type === "entrance") {
      return node.name || node.id;
    }
    return "";
  }

  function horizontalRunText(g, nodes, startIdx, endIdx) {
    var start = nodes[startIdx];
    var end = nodes[endIdx];
    var run = nodes.slice(startIdx, endIdx + 1);
    var hasCorridor = run.some(function (n) {
      return n.type === "corridor";
    });

    var dx = (Number(end.x) || 0) - (Number(start.x) || 0);
    var directional = Math.abs(dx) >= 2;
    var distance = Math.abs(dx);

    if (!directional) {
      var sum = 0;
      for (var i = startIdx; i < endIdx; i++) {
        var e = findEdge(g, nodes[i].id, nodes[i + 1].id);
        if (e && isHorizontalEdge(e.type)) sum += e.distance;
      }
      if (sum >= 2) distance = sum;
    }

    var wing = start.wing || floorWing(g, start.floor);
    var north = wing === "N" || String(start.floor).charAt(0) === "N";
    var corridorWord = north ? "北楼走廊" : "走廊";

    var text;
    if (directional) {
      text = "沿" + corridorWord + "向" + directionWord(dx) + "约 " + Math.max(1, Math.round(distance)) + " 米";
    } else if (hasCorridor) {
      text = "经" + corridorWord + "步行约 " + Math.max(1, Math.round(distance)) + " 米";
    } else {
      return null;
    }

    if (end.type === "room") {
      /* 到达房间由 arrive 步骤给出，这里不再重复房间号 */
    } else {
      var suffix = targetName(end);
      if (suffix) text += "，到" + suffix;
    }

    return makeStep("corridor", text, {
      from: start.id,
      to: end.id,
      floor: start.floor,
      direction: directional ? directionWord(dx) : "直行",
      distance: Math.round(distance * 10) / 10
    });
  }

  function buildSteps(data, path) {
    var g = toGraph(data);
    if (!Array.isArray(path) || !path.length) return [];

    var nodes = [];
    var ids = [];
    for (var i = 0; i < path.length; i++) {
      var nid = resolveNode(g, path[i]);
      if (!nid || !g.nodeById[nid]) continue;
      if (nodes.length && nodes[nodes.length - 1].id === nid) continue; /* 去重相邻重复节点 */
      nodes.push(g.nodeById[nid]);
      ids.push(nid);
    }
    if (!nodes.length) return [];

    var steps = [startStep(nodes[0])];
    if (nodes.length === 1) return steps;

    var edges = [];
    for (var k = 1; k < nodes.length; k++) {
      edges.push(findEdge(g, nodes[k - 1].id, nodes[k].id));
    }

    var idx = 1; /* nodes[idx] 是当前边 edges[idx-1] 的终点 */
    while (idx < nodes.length) {
      var edge = edges[idx - 1];
      var etype = edge ? edge.type : "walk";

      if (etype === "elevator" || etype === "stairs") {
        var mode = etype;
        var j = idx;
        var first = nodes[idx - 1];
        var last = nodes[idx];
        while (j < nodes.length - 1) {
          var nextEdge = edges[j]; /* nodes[j] → nodes[j+1] */
          if (!nextEdge || nextEdge.type !== mode) break;
          if (mode === "stairs" && !sameShaft(nodes[j], nodes[j + 1])) break;
          if (mode === "elevator" && !sameShaft(nodes[j], nodes[j + 1])) break;
          j += 1;
          last = nodes[j];
        }
        var levels = Math.abs(levelOf(last) - levelOf(first));
        var name = first.name || (mode === "elevator" ? "电梯" : "楼梯");
        var text;
        if (mode === "elevator") {
          text = "乘" + name + "到 " + floorLabel(last.floor) + (levels > 1 ? "（跨 " + levels + " 层）" : "");
        } else {
          var upDown = levelOf(last) >= levelOf(first) ? "上" : "下";
          text = "乘" + name + " " + upDown + "到 " + floorLabel(last.floor) + (levels > 1 ? "（跨 " + levels + " 层）" : "");
        }
        steps.push(
          makeStep(mode === "elevator" ? "elevator" : "stairs", text, {
            from: first.id,
            to: last.id,
            fromFloor: first.floor,
            toFloor: last.floor,
            floor: last.floor,
            levels: levels
          })
        );
        idx = j + 1;
        continue;
      }

      if (etype === "ramp") {
        var rFirst = nodes[idx - 1];
        var rLast = nodes[idx];
        var rj = idx;
        while (rj < nodes.length - 1) {
          var rEdge = edges[rj];
          if (!rEdge || rEdge.type !== "ramp") break;
          rj += 1;
          rLast = nodes[rj];
        }
        steps.push(
          makeStep("ramp", "沿坡道从 " + floorLabel(rFirst.floor) + " 到 " + floorLabel(rLast.floor), {
            from: rFirst.id,
            to: rLast.id,
            fromFloor: rFirst.floor,
            toFloor: rLast.floor,
            floor: rLast.floor,
            levels: Math.abs(levelOf(rLast) - levelOf(rFirst))
          })
        );
        idx = rj + 1;
        continue;
      }

      if (etype === "passage") {
        var pTarget = nodes[idx];
        var north = floorWing(g, pTarget.floor) === "N";
        steps.push(
          makeStep("passage", (north ? "经通道口进入北楼（" : "经通道口回到南楼（") + floorLabel(pTarget.floor) + "）", {
            from: nodes[idx - 1].id,
            to: pTarget.id,
            fromFloor: nodes[idx - 1].floor,
            toFloor: pTarget.floor,
            floor: pTarget.floor
          })
        );
        idx += 1;
        continue;
      }

      /* 水平段：连续非竖向、非通道边 */
      var runStart = idx - 1;
      var runEnd = idx;
      while (runEnd < nodes.length && !isVerticalEdge(edges[runEnd - 1] ? edges[runEnd - 1].type : "")) {
        runEnd += 1;
      }
      var runStep = horizontalRunText(g, nodes, runStart, runEnd - 1);
      if (runStep) steps.push(runStep);
      idx = runEnd;
    }

    var lastNode = nodes[nodes.length - 1];
    steps.push(arriveStep(lastNode));
    return steps;
  }

  /* ------------------------------------------------------------------ *
   * pathStats：耗时 / 距离 / 节点数 / 楼层跨度 / 换乘
   * ------------------------------------------------------------------ */

  function pathStats(dataOrGraph, path) {
    var g = toGraph(dataOrGraph);
    var ids = [];
    (Array.isArray(path) ? path : []).forEach(function (p) {
      var nid = resolveNode(g, p);
      if (nid && g.nodeById[nid] && ids[ids.length - 1] !== nid) ids.push(nid);
    });

    var stats = {
      path: ids,
      from: ids[0] || null,
      to: ids[ids.length - 1] || null,
      startLabel: "",
      endLabel: "",
      fromFloor: null,
      toFloor: null,
      floors: [],
      edgeCount: 0,
      nodeCount: ids.length,
      time: 0,
      distance: 0,
      levels: 0,
      transfers: []
    };
    if (!ids.length) return stats;

    var first = g.nodeById[ids[0]];
    var last = g.nodeById[ids[ids.length - 1]];
    stats.startLabel = first.name || first.id;
    stats.endLabel = last.name || last.id;
    stats.fromFloor = first.floor || null;
    stats.toFloor = last.floor || null;
    stats.levels = Math.abs(levelOf(last) - levelOf(first));

    var floorsSeen = {};
    var lastTransferKey = null;
    for (var i = 0; i < ids.length; i++) {
      var node = g.nodeById[ids[i]];
      if (node && node.floor && !floorsSeen[node.floor]) {
        floorsSeen[node.floor] = 1;
        stats.floors.push(node.floor);
      }
      if (i === 0) continue;
      var prev = g.nodeById[ids[i - 1]];
      var edge = findEdge(g, ids[i - 1], ids[i]);
      if (!edge) continue;
      stats.edgeCount += 1;
      stats.time += edge.time;
      stats.distance += edge.distance;
      if (edge.type === "elevator" || edge.type === "stairs" || edge.type === "ramp" || edge.type === "passage") {
        /* 同一电梯/同一组楼梯连续跨层合并为一次换乘（如 5 层电梯只记 1 次） */
        var shaft = String(prev.id).replace(/_F\d+$/i, "");
        var transferKey = edge.type + ":" + shaft;
        var current = stats.transfers[stats.transfers.length - 1];
        if (lastTransferKey === transferKey && current && (edge.type === "elevator" || edge.type === "stairs")) {
          current.to = node.id;
          current.toFloor = node.floor;
        } else {
          stats.transfers.push({
            type: edge.type,
            name: node.name || node.id,
            from: prev.id,
            to: node.id,
            fromFloor: prev.floor,
            toFloor: node.floor
          });
          lastTransferKey = transferKey;
        }
      } else {
        lastTransferKey = null; /* 中间隔了水平段，后续竖向边不再并入上一次换乘 */
      }
    }

    stats.time = round1(stats.time);
    stats.distance = round1(stats.distance);
    stats.transferCount = stats.transfers.length;
    return stats;
  }

  /* ------------------------------------------------------------------ *
   * 导出
   * ------------------------------------------------------------------ */

  return {
    version: VERSION,
    buildGraph: buildGraph,
    dijkstra: dijkstra,
    resolveNode: resolveNode,
    findEdge: findEdge,
    buildSteps: buildSteps,
    pathStats: pathStats
  };
});
