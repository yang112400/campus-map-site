/* 乐骑路线核心：GCJ 校园路网、候选串联、约束校验与评分
 * 纯函数，可在浏览器与 Node 测试中共用。
 * 数据：data/cycling.js（window.CYCLING_DATA）
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.CyclingCore = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var EARTH_R = 6371000;
  var MIN_LENGTH = 3000;      /* m，硬性下限 */
  var TARGET_LENGTH = 3500;   /* m，评分目标 */
  var MAX_LENGTH = 5200;      /* m，超过后评分快速下降 */
  var RIDE_SPEED = 14 / 3.6;  /* m/s，校园骑行均速 14 km/h */

  function coord(p) {
    if (!p) return null;
    if (Array.isArray(p)) return { lon: Number(p[0]), lat: Number(p[1]) };
    return { lon: Number(p.lon), lat: Number(p.lat) };
  }

  function meters(a, b) {
    var p = coord(a), q = coord(b);
    if (!p || !q) return 0;
    var rad = Math.PI / 180;
    var dLat = (q.lat - p.lat) * rad;
    var dLon = (q.lon - p.lon) * rad;
    var s = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p.lat * rad) * Math.cos(q.lat * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
  }

  function bearing(a, b) {
    var p = coord(a), q = coord(b);
    var mid = ((p.lat + q.lat) / 2) * Math.PI / 180;
    var dx = (q.lon - p.lon) * 111320 * Math.cos(mid);
    var dy = (q.lat - p.lat) * 110540;
    var deg = Math.atan2(dx, dy) * 180 / Math.PI;
    return deg < 0 ? deg + 360 : deg;
  }

  function angleDelta(from, to) {
    var d = to - from;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
  }

  var DIRS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  function dirName(deg) {
    var n = ((deg % 360) + 360) % 360;
    return DIRS[Math.round(n / 45) % 8];
  }

  /* ---------------- 图 ---------------- */
  function buildGraph(data) {
    if (!data || !data.graph) throw new Error("缺少乐骑路网数据");
    var raw = data.graph;
    var classes = raw.classes || [];
    var names = raw.names || [];
    var nodes = raw.nodes.map(function (n) {
      return { lon: Number(n[0]), lat: Number(n[1]), edges: [] };
    });
    var edges = raw.edges.map(function (e, i) {
      var nameCode = Number(e[4]) || 0;
      return {
        id: i,
        a: Number(e[0]),
        b: Number(e[1]),
        d: Number(e[2]),
        cls: classes[Number(e[3])] || "service",
        name: nameCode > 0 ? (names[nameCode - 1] || "") : ""
      };
    });
    edges.forEach(function (e) {
      if (!nodes[e.a] || !nodes[e.b]) return;
      nodes[e.a].edges.push({ to: e.b, e: e });
      nodes[e.b].edges.push({ to: e.a, e: e });
    });
    var big = new Set(data.bigRoads || []);
    return { nodes: nodes, edges: edges, big: big, playgrounds: data.playgrounds || {} };
  }

  function snap(graph, lon, lat) {
    var best = null;
    for (var i = 0; i < graph.nodes.length; i++) {
      var n = graph.nodes[i];
      var d = meters([lon, lat], [n.lon, n.lat]);
      if (!best || d < best.distance) best = { id: i, distance: d };
    }
    return best;
  }

  var CLASS_WEIGHT = {
    trunk: 1.0, primary: 1.0, secondary: 1.05, tertiary: 1.1,
    residential: 1.3, living_street: 1.5, unclassified: 1.4,
    service: 1.55, cycleway: 1.1
  };

  function edgeCost(e, big) {
    var c = e.d * (CLASS_WEIGHT[e.cls] || 1.8);
    if (big.has(e.name)) c *= 0.68;
    return c;
  }

  function MinHeap() { this.a = []; }
  MinHeap.prototype.push = function (cost, node) {
    var a = this.a;
    a.push([cost, node]);
    var i = a.length - 1;
    while (i > 0) {
      var p = (i - 1) >> 1;
      if (a[p][0] <= a[i][0]) break;
      var t = a[p]; a[p] = a[i]; a[i] = t;
      i = p;
    }
  };
  MinHeap.prototype.pop = function () {
    var a = this.a;
    if (!a.length) return null;
    var top = a[0], last = a.pop();
    if (a.length) {
      a[0] = last;
      var i = 0;
      for (;;) {
        var l = i * 2 + 1, r = l + 1, m = i;
        if (l < a.length && a[l][0] < a[m][0]) m = l;
        if (r < a.length && a[r][0] < a[m][0]) m = r;
        if (m === i) break;
        var t = a[m]; a[m] = a[i]; a[i] = t;
        i = m;
      }
    }
    return top;
  };

  function dijkstra(graph, from, to, banned) {
    var n = graph.nodes.length;
    var dist = new Float64Array(n);
    var prevNode = new Int32Array(n);
    var prevEdge = new Array(n);
    var done = new Uint8Array(n);
    for (var i = 0; i < n; i++) { dist[i] = Infinity; prevNode[i] = -1; }
    dist[from] = 0;
    var heap = new MinHeap();
    heap.push(0, from);
    while (heap.a.length) {
      var top = heap.pop();
      var d = top[0], u = top[1];
      if (done[u]) continue;
      done[u] = 1;
      if (u === to) break;
      var adj = graph.nodes[u].edges;
      for (var k = 0; k < adj.length; k++) {
        var link = adj[k];
        if (banned && banned.has(link.e.id)) continue;
        var nd = d + edgeCost(link.e, graph.big);
        if (nd < dist[link.to]) {
          dist[link.to] = nd;
          prevNode[link.to] = u;
          prevEdge[link.to] = link.e;
          heap.push(nd, link.to);
        }
      }
    }
    if (from !== to && !done[to]) return null;
    if (from === to) return { edges: [], ids: [] };
    var edges = [], ids = [];
    var cur = to;
    while (cur !== from) {
      var e = prevEdge[cur];
      if (!e) return null;
      edges.unshift(e);
      ids.unshift(cur);
      cur = prevNode[cur];
    }
    return { edges: edges, ids: ids };
  }

  function pathFromEdges(graph, start, edges) {
    var ids = [start];
    var coords = [[graph.nodes[start].lon, graph.nodes[start].lat]];
    var cur = start;
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i];
      var nxt = e.a === cur ? e.b : (e.b === cur ? e.a : -1);
      if (nxt < 0) return null;
      ids.push(nxt);
      coords.push([graph.nodes[nxt].lon, graph.nodes[nxt].lat]);
      cur = nxt;
    }
    return { ids: ids, coords: coords };
  }

  function repeatedNodes(ids) {
    var seen = new Set(), repeats = 0;
    for (var i = 0; i < ids.length; i++) {
      if (seen.has(ids[i])) repeats++;
      seen.add(ids[i]);
    }
    return repeats;
  }

  function segmentCross(a, b, c, d) {
    function o(p, q, r) {
      var v = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
      return Math.abs(v) < 1e-14 ? 0 : (v > 0 ? 1 : -1);
    }
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  }

  function selfCrossings(coords) {
    var segs = [];
    for (var i = 1; i < coords.length; i++) {
      if (meters(coords[i - 1], coords[i]) > 3) segs.push([coords[i - 1], coords[i]]);
    }
    var n = 0;
    for (var x = 0; x < segs.length; x++) {
      for (var y = x + 2; y < segs.length; y++) {
        if (segmentCross(segs[x][0], segs[x][1], segs[y][0], segs[y][1])) n++;
      }
    }
    return n;
  }

  function windingAngle(coords, center, radius) {
    var pts = [];
    for (var i = 0; i < coords.length; i++) {
      if (meters(coords[i], center) <= radius) pts.push(coords[i]);
    }
    if (pts.length < 2) return 0;
    var prev = null, total = 0;
    for (var k = 0; k < pts.length; k++) {
      var brg = bearing(center, pts[k]);
      if (prev != null) total += angleDelta(prev, brg);
      prev = brg;
    }
    return Math.abs(total);
  }

  function playgroundHits(coords, playgrounds) {
    var hits = [];
    Object.keys(playgrounds || {}).forEach(function (id) {
      var p = playgrounds[id];
      var radius = Number(p.radius) || 130;
      var center = [p.lon, p.lat];
      var bestCenter = Infinity;
      for (var i = 0; i < coords.length; i++) {
        var d = meters(coords[i], center);
        if (d < bestCenter) bestCenter = d;
      }
      var passes = p.passes && p.passes.length ? p.passes : [p];
      var bestPass = Infinity;
      for (var j = 0; j < passes.length; j++) {
        for (var k = 0; k < coords.length; k++) {
          var pd = meters(coords[k], [passes[j].lon, passes[j].lat]);
          if (pd < bestPass) bestPass = pd;
        }
      }
      if (bestCenter <= radius || bestPass <= 60) {
        hits.push({
          id: id,
          name: p.name || id,
          distance: Math.round(bestCenter),
          passDistance: Math.round(bestPass),
          winding: Math.round(windingAngle(coords, center, 230))
        });
      }
    });
    return hits;
  }

  function bigRatio(graph, edges) {
    var total = 0, big = 0;
    for (var i = 0; i < edges.length; i++) {
      var e = edges[i];
      total += e.d;
      if (graph.big.has(e.name)) big += e.d;
    }
    return total > 0 ? big / total : 0;
  }

  /* ---------------- 候选序列 ---------------- */
  function candidateSequences(startNode, endNode, corridorNodes, playgroundAnchors) {
    var seqs = [], seen = {};
    var allPasses = [];
    playgroundAnchors.forEach(function (pg) {
      pg.nodes.forEach(function (node) {
        if (allPasses.indexOf(node) < 0) allPasses.push(node);
      });
    });
    function add(arr) {
      var out = [];
      for (var i = 0; i < arr.length; i++) {
        if (out.length && out[out.length - 1] === arr[i]) continue;
        out.push(arr[i]);
      }
      if (out.length < 3) return;
      if (out[0] !== startNode || out[out.length - 1] !== endNode) return;
      if (out.indexOf(startNode, 1) >= 0) return;
      if (out.lastIndexOf(endNode, out.length - 2) >= 0) return;
      var key = out.join(",");
      if (seen[key]) return;
      seen[key] = 1;
      seqs.push(out);
    }
    function hasPlayground(arr) {
      for (var i = 0; i < allPasses.length; i++) {
        if (arr.indexOf(allPasses[i]) >= 0) return true;
      }
      return false;
    }

    /* 单个操场通行点 */
    playgroundAnchors.forEach(function (pg) {
      pg.nodes.forEach(function (node) {
        add([startNode, node, endNode]);
      });
    });

    /* 两个操场通行点组合，两种顺序 */
    for (var i = 0; i < playgroundAnchors.length; i++) {
      for (var j = i + 1; j < playgroundAnchors.length; j++) {
        playgroundAnchors[i].nodes.forEach(function (a) {
          playgroundAnchors[j].nodes.forEach(function (b) {
            add([startNode, a, b, endNode]);
            add([startNode, b, a, endNode]);
          });
        });
      }
    }

    /* 走廊连续弧（走廊里已用操场通行点替代操场中心） */
    for (var c = 0; c < corridorNodes.length; c++) {
      for (var d = c + 2; d < corridorNodes.length; d++) {
        var arc = corridorNodes.slice(c, d + 1);
        if (!hasPlayground(arc)) continue;
        add([startNode].concat(arc, [endNode]));
        add([startNode].concat(arc.slice().reverse(), [endNode]));
      }
    }

    /* 相邻走廊站点之间插入操场通行点 */
    for (var a = 0; a < corridorNodes.length - 1; a++) {
      var x = corridorNodes[a], y = corridorNodes[a + 1];
      allPasses.forEach(function (pg) {
        if (pg === x || pg === y) return;
        add([startNode, x, pg, y, endNode]);
        add([startNode, y, pg, x, endNode]);
      });
    }

    /* 模板：起点/终点 + 一个走廊地标 + 操场通行点 */
    var scenic = corridorNodes.filter(function (node) { return allPasses.indexOf(node) < 0; }).slice(0, 7);
    var canonical = playgroundAnchors.map(function (pg) { return pg.nodes[0]; }).filter(function (node, idx, arr) {
      return node != null && arr.indexOf(node) === idx;
    });
    scenic.forEach(function (node) {
      allPasses.forEach(function (pg) {
        add([startNode, node, pg, endNode]);
        add([startNode, pg, node, endNode]);
      });
    });
    if (canonical.length >= 2) {
      var p1 = canonical[0], p2 = canonical[1];
      scenic.forEach(function (node) {
        add([startNode, node, p1, p2, endNode]);
        add([startNode, p1, p2, node, endNode]);
        add([startNode, p1, node, p2, endNode]);
      });
    }

    add([startNode].concat(corridorNodes, [endNode]));
    add([startNode].concat(corridorNodes.slice().reverse(), [endNode]));
    return seqs;
  }

  /* ---------------- 路线评价 ---------------- */
  function evaluate(graph, seq, ctx) {
    var banned = new Set(), edges = [];
    var cur = seq[0];
    for (var i = 1; i < seq.length; i++) {
      var leg = dijkstra(graph, cur, seq[i], banned);
      if (!leg) return { seq: seq, ok: false, failedAt: i };
      for (var k = 0; k < leg.edges.length; k++) {
        banned.add(leg.edges[k].id);
        edges.push(leg.edges[k]);
      }
      cur = seq[i];
    }
    if (!edges.length) return { seq: seq, ok: false, failedAt: -1 };
    var geom = pathFromEdges(graph, seq[0], edges);
    if (!geom) return { seq: seq, ok: false, failedAt: -1 };
    var total = 0;
    for (var e = 0; e < edges.length; e++) total += edges[e].d;
    var hits = playgroundHits(geom.coords, graph.playgrounds);
    var ratio = bigRatio(graph, edges);
    var repeats = repeatedNodes(geom.ids);
    var crossings = selfCrossings(geom.coords);
    var maxWinding = 0;
    for (var h = 0; h < hits.length; h++) maxWinding = Math.max(maxWinding, hits[h].winding || 0);
    var valid = total >= MIN_LENGTH && repeats === 0 && crossings === 0 && hits.length > 0 && maxWinding <= 240;
    var score = 0;
    if (valid) score += 1000;
    if (total >= MIN_LENGTH) score += 120;
    score -= Math.abs(total - 3300) / 1000 * 160;
    if (total >= 3150 && total <= 3900) score += 40;
    if (total > MAX_LENGTH) score -= (total - MAX_LENGTH) / 1000 * 80;
    score += ratio * 120;
    score -= repeats * 200;
    score -= crossings * 120;
    if (!hits.length) score -= 300;
    score += hits.length * 18;
    score -= maxWinding / 360 * 100;
    if (maxWinding > 240) score -= 160;
    return {
      seq: seq.slice(),
      ok: true,
      valid: valid,
      distance: total,
      duration: total / RIDE_SPEED,
      edges: edges.length,
      path: geom.coords,
      ids: geom.ids,
      hits: hits,
      maxWinding: maxWinding,
      bigRatio: ratio,
      repeats: repeats,
      crossings: crossings,
      score: score
    };
  }

  function buildSteps(path, startLabel, endLabel) {
    var groups = [];
    for (var i = 1; i < path.length; i++) {
      var d = meters(path[i - 1], path[i]);
      if (d < 1) continue;
      var brg = bearing(path[i - 1], path[i]);
      if (!groups.length) {
        groups.push({ from: i - 1, to: i, distance: d, startBearing: brg });
      } else {
        var g = groups[groups.length - 1];
        if (Math.abs(angleDelta(g.startBearing, brg)) <= 28) {
          g.to = i;
          g.distance += d;
        } else {
          groups.push({ from: i - 1, to: i, distance: d, startBearing: brg });
        }
      }
    }
    var steps = [];
    var prev = null;
    for (var k = 0; k < groups.length; k++) {
      var grp = groups[k];
      var br = grp.startBearing;
      var dir = dirName(br);
      var m = Math.max(1, Math.round(grp.distance));
      var icon, text;
      if (k === 0) {
        icon = "●";
        text = "从" + startLabel + "出发，向" + dir + "骑行 " + m + " 米";
      } else {
        var delta = angleDelta(prev, br);
        var abs = Math.abs(delta);
        if (abs < 22) {
          icon = "↑";
          text = "继续向" + dir + "直行 " + m + " 米";
        } else if (abs > 150) {
          icon = "↺";
          text = "掉头，向" + dir + "骑行 " + m + " 米";
        } else if (delta > 0) {
          icon = "↱";
          text = "右转，向" + dir + "骑行 " + m + " 米";
        } else {
          icon = "↰";
          text = "左转，向" + dir + "骑行 " + m + " 米";
        }
      }
      steps.push({ icon: icon, text: text });
      prev = br;
    }
    if (!steps.length) steps.push({ icon: "●", text: "从" + startLabel + "出发" });
    steps.push({ icon: "◉", text: "到达" + endLabel });
    return steps;
  }

  /* ---------------- 规划入口 ---------------- */
  var graphCache = null, graphCacheData = null;
  function plannerGraph(data) {
    if (graphCacheData !== data) {
      graphCache = buildGraph(data);
      graphCacheData = data;
    }
    return graphCache;
  }

  function resolvePoint(data, value) {
    if (!value) return null;
    if (typeof value === "string") {
      var p = data.points && data.points[value];
      if (!p) return null;
      return { lon: Number(p.lon), lat: Number(p.lat), label: p.name || value, id: value };
    }
    var c = coord(value);
    if (!c || !isFinite(c.lon) || !isFinite(c.lat)) return null;
    return { lon: c.lon, lat: c.lat, label: value.label || "地图点选位置", id: value.id || null };
  }

  function plan(data, startValue, endValue) {
    var graph = plannerGraph(data);
    var start = resolvePoint(data, startValue);
    var end = resolvePoint(data, endValue);
    if (!start || !end) return { ok: false, error: "invalid-endpoint", message: "请选择有效的起点和终点" };

    var s = snap(graph, start.lon, start.lat);
    var e = snap(graph, end.lon, end.lat);
    if (!s || !e) return { ok: false, error: "no-graph", message: "路网未加载" };
    if (s.id === e.id || meters(start, end) < 40) {
      return { ok: false, error: "too-close", message: "起点与终点太近，请选择两个不同位置" };
    }

    var corridor = (data.corridor || []).map(function (id) {
      var pg = data.playgrounds && data.playgrounds[id];
      if (pg) {
        var pass = (pg.passes && pg.passes[0]) || pg;
        return snap(graph, pass.lon, pass.lat).id;
      }
      var p = resolvePoint(data, id);
      return p ? snap(graph, p.lon, p.lat).id : null;
    }).filter(function (x) { return x != null; });

    var playgroundAnchors = Object.keys(data.playgrounds || {}).map(function (id) {
      var p = data.playgrounds[id];
      var passes = p.passes && p.passes.length ? p.passes : [p];
      var nodes = [];
      passes.forEach(function (pass) {
        var sn = snap(graph, pass.lon, pass.lat);
        if (sn && nodes.indexOf(sn.id) < 0) nodes.push(sn.id);
      });
      return { id: id, nodes: nodes };
    }).filter(function (pg) { return pg.nodes.length > 0; });

    var seqs = candidateSequences(s.id, e.id, corridor, playgroundAnchors);
    var results = [];
    for (var i = 0; i < seqs.length; i++) {
      var r = evaluate(graph, seqs[i], null);
      if (r.ok) results.push(r);
    }
    results.sort(function (a, b) { return b.score - a.score; });

    var cleanStrict = results.filter(function (r) {
      return r.repeats === 0 && r.crossings === 0 && r.hits.length > 0 && r.maxWinding <= 240;
    });
    var cleanLoose = results.filter(function (r) {
      return r.repeats === 0 && r.crossings === 0 && r.hits.length > 0;
    });
    var valid = cleanStrict.filter(function (r) { return r.distance >= MIN_LENGTH; });
    var fallback = (cleanStrict.length ? cleanStrict : cleanLoose).slice().sort(function (a, b) {
      return b.distance - a.distance;
    });
    var chosen = valid[0] || fallback[0] || results[0] || null;
    if (!chosen) {
      return { ok: false, error: "no-route", message: "当前起终点之间没有可用的骑行路线" };
    }

    var warning = null;
    if (chosen.distance < MIN_LENGTH) {
      warning = "当前起终点之间没有 ≥3km 且不绕圈的单程路线；已给出最长的不重复路线 " +
        (chosen.distance / 1000).toFixed(2) + " km。";
    } else if (chosen.repeats > 0 || chosen.crossings > 0) {
      warning = "满足 3km 的候选路线会重复路段，已选择不绕圈的方案。";
    } else if (chosen.maxWinding > 240) {
      warning = "路线在操场旁绕行角度较大（约 " + Math.round(chosen.maxWinding) +
        "°），为满足 3km 已选当前方案。";
    }
    if (!chosen.hits.length) {
      warning = "当前路线未能贴近操场，已选择路网可达的方案。";
    }

    return {
      ok: true,
      start: start,
      end: end,
      startNode: s.id,
      endNode: e.id,
      route: {
        distance: chosen.distance,
        duration: chosen.duration,
        path: chosen.path,
        ids: chosen.ids,
        hits: chosen.hits,
        maxWinding: chosen.maxWinding,
        bigRatio: chosen.bigRatio,
        repeats: chosen.repeats,
        crossings: chosen.crossings,
        seq: chosen.seq
      },
      steps: buildSteps(chosen.path, start.label, end.label),
      warning: warning,
      validCount: valid.length,
      candidates: results.length,
      alternatives: valid.slice(0, 8)
    };
  }

  function formatDuration(sec) {
    var m = Math.round((Number(sec) || 0) / 60);
    if (m < 1) return "不到 1 分钟";
    return m + " 分钟";
  }

  function formatDistance(m) {
    var v = Number(m) || 0;
    return v >= 1000 ? (v / 1000).toFixed(2) + " km" : Math.round(v) + " m";
  }

  return {
    MIN_LENGTH: MIN_LENGTH,
    TARGET_LENGTH: TARGET_LENGTH,
    meters: meters,
    bearing: bearing,
    dirName: dirName,
    buildGraph: buildGraph,
    snap: snap,
    dijkstra: dijkstra,
    pathFromEdges: pathFromEdges,
    repeatedNodes: repeatedNodes,
    selfCrossings: selfCrossings,
    windingAngle: windingAngle,
    playgroundHits: playgroundHits,
    bigRatio: bigRatio,
    candidateSequences: candidateSequences,
    evaluate: evaluate,
    buildSteps: buildSteps,
    plan: plan,
    formatDuration: formatDuration,
    formatDistance: formatDistance,
    _edgeCost: edgeCost
  };
});
