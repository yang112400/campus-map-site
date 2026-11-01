/* 乐骑模式：Leaflet 校园底图 + 本地 GCJ 路网 + 操场约束路线
 * 依赖：vendor/leaflet/leaflet.js、data/real-pois.js、data/cycling.js、app/cycling-core.js
 * 仅普通 <script>，无构建步骤。
 */
(function () {
  "use strict";

  var CAMPUS = window.REAL_CAMPUS;
  var DATA = window.CYCLING_DATA;
  var Core = window.CyclingCore;
  var L = window.L;

  function $(id) { return document.getElementById(id); }
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var bootFailed = false;
  function showBootError(msg) {
    bootFailed = true;
    var box = $("loading");
    if (!box) return;
    box.style.display = "flex";
    box.classList.remove("hide");
    box.innerHTML = '<div class="loading-inner"><div>' + escapeHtml(msg) + "</div>" +
      '<div style="font-size:11px;color:#8d9aab">请确认 vendor/leaflet、data/cycling.js、app/cycling-core.js 已加载</div></div>';
  }

  if (!CAMPUS || !DATA || !Core || !L) {
    showBootError("乐骑依赖未加载：缺少 Leaflet、校区数据、路网数据或核心脚本");
    return;
  }

  var els = {
    loading: $("loading"), toast: $("toast"), coord: $("coord"),
    startCard: $("startCard"), endCard: $("endCard"),
    startName: $("startName"), endName: $("endName"),
    startSub: $("startSub"), endSub: $("endSub"),
    startSelect: $("startSelect"), endSelect: $("endSelect"),
    btnSwap: $("btnSwap"), btnReset: $("btnReset"), btnPlan: $("btnPlan"),
    routeCard: $("routeCard"), routeDist: $("routeDist"), routeTime: $("routeTime"),
    routeBig: $("routeBig"), checks: $("checks"), viaLine: $("viaLine"),
    warning: $("warning"), steps: $("steps"), btnAlt: $("btnAlt"), btnFit: $("btnFit")
  };

  var POINTS = DATA.points || {};
  var pointById = {};
  var lowerId = {};
  Object.keys(POINTS).forEach(function (id) {
    var p = POINTS[id];
    var item = { id: id, name: p.name || id, lon: Number(p.lon), lat: Number(p.lat), kind: p.kind || "poi" };
    pointById[id] = item;
    lowerId[id.toLowerCase()] = item;
  });

  var state = {
    start: null,
    end: null,
    active: "start",
    result: null,
    alts: [],
    altIndex: 0,
    planSeq: 0,
    clickTimer: null
  };

  var map = null;
  var tiles = null;
  var routeLayers = [];
  var ringLayers = [];
  var pgLayers = {};
  var poiDots = {};
  var startLayer = null, endLayer = null;
  var tileErrors = 0, tileWarned = false, toastTimer = null, urlTimer = null, resizeTimer = null;
  var planTimer = null;
  var lastUrl = null;

  function toast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove("show"); }, 2800);
  }

  function hideLoading() {
    if (bootFailed || window.__CYCLING_READY__) return;
    window.__CYCLING_READY__ = true;
    if (!els.loading) return;
    els.loading.classList.add("hide");
    setTimeout(function () { if (!bootFailed) els.loading.style.display = "none"; }, 500);
  }

  function pointEndpoint(id) {
    var p = pointById[id];
    if (!p) return null;
    return { kind: "poi", id: p.id, label: p.name, lon: p.lon, lat: p.lat };
  }

  function rawEndpoint(latlng) {
    return { kind: "point", id: null, label: "地图点选位置", lon: Number(latlng.lng), lat: Number(latlng.lat) };
  }

  function endpointSub(ep) {
    if (!ep) return "—";
    var coord = Number(ep.lon).toFixed(6) + ", " + Number(ep.lat).toFixed(6);
    return (ep.kind === "poi" ? "校园站点" : "地图点选") + " · " + coord;
  }

  /* ---------------- 地图 ---------------- */
  function initMap() {
    map = L.map("map", {
      zoomControl: false,
      attributionControl: false,
      minZoom: CAMPUS.minZoom,
      maxZoom: CAMPUS.maxZoom
    }).setView(CAMPUS.center, CAMPUS.zoom);

    tiles = L.tileLayer(CAMPUS.tileUrl, {
      minZoom: CAMPUS.minZoom,
      maxZoom: CAMPUS.maxZoom,
      maxNativeZoom: 20
    }).addTo(map);
    tiles.on("tileerror", function () {
      tileErrors++;
      if (!tileWarned && tileErrors >= 6) { tileWarned = true; toast("底图加载失败，请检查网络"); }
    });
    tiles.on("tileload", function () { tileErrors = 0; });

    map.createPane("ringPane").style.zIndex = 430;
    map.createPane("routePane").style.zIndex = 450;
    map.createPane("endpointPane").style.zIndex = 460;
    var credit = $("credit");
    if (credit && DATA.attribution) credit.textContent = DATA.attribution;

    map.whenReady(hideLoading);
    setTimeout(hideLoading, 2000);
  }

  function pgIcon(p) {
    return L.divIcon({
      className: "pg-marker pg-" + String(p.id).toLowerCase(),
      html: '<span class="pg-pill">' + escapeHtml(p.name) + '</span><span class="pg-stem"></span>',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  }

  function initPlaygrounds() {
    var pgs = DATA.playgrounds || {};
    Object.keys(pgs).forEach(function (id) {
      var p = pgs[id];
      var latlng = [Number(p.lat), Number(p.lon)];
      var circle = L.circle(latlng, {
        pane: "ringPane",
        radius: Number(p.radius) || 120,
        color: "#f5a623",
        weight: 1.2,
        opacity: 0.5,
        fillColor: "#f5a623",
        fillOpacity: 0.04,
        interactive: false,
        className: "pg-circle"
      }).addTo(map);
      var marker = L.marker(latlng, {
        icon: pgIcon(p),
        interactive: false,
        keyboard: false
      }).addTo(map);
      pgLayers[id] = { circle: circle, marker: marker };
    });
  }

  function initPoiDots() {
    Object.keys(pointById).forEach(function (id) {
      var p = pointById[id];
      if (p.kind === "playground") return;
      var dot = L.circleMarker([p.lat, p.lon], {
        pane: "endpointPane",
        radius: 3.5,
        color: "rgba(255,255,255,.55)",
        weight: 1,
        fillColor: "#f5a623",
        fillOpacity: 0.75,
        bubblingMouseEvents: false
      }).addTo(map);
      dot.bindTooltip(p.name, { direction: "top", offset: [0, -5], className: "station-tip" });
      dot.on("click", function (ev) {
        if (ev && ev.originalEvent && L.DomEvent) L.DomEvent.stopPropagation(ev.originalEvent);
        setEndpoint(state.active === "end" ? "end" : "start", pointEndpoint(id));
      });
      poiDots[id] = dot;
    });
  }

  /* 乐骑主环：沿站点顺序画出参考线，不参与路线计算 */
  function initRing() {
    var corridor = DATA.corridor || [];
    var graph = Core.buildGraph(DATA);
    function corridorPoint(id) {
      var pg = DATA.playgrounds && DATA.playgrounds[id];
      if (pg) {
        var pass = (pg.passes && pg.passes[0]) || pg;
        return { lon: Number(pass.lon), lat: Number(pass.lat) };
      }
      return pointById[id] || null;
    }
    var pts = [];
    for (var i = 0; i < corridor.length; i++) {
      var a = corridorPoint(corridor[i]);
      var b = corridorPoint(corridor[(i + 1) % corridor.length]);
      if (!a || !b) continue;
      var sa = Core.snap(graph, a.lon, a.lat);
      var sb = Core.snap(graph, b.lon, b.lat);
      if (!sa || !sb) continue;
      var leg = Core.dijkstra(graph, sa.id, sb.id, null);
      if (!leg) continue;
      var geom = Core.pathFromEdges(graph, sa.id, leg.edges);
      if (!geom) continue;
      for (var k = 0; k < geom.coords.length; k++) {
        var c = geom.coords[k];
        var last = pts[pts.length - 1];
        if (last && Core.meters(last, c) < 1) continue;
        pts.push(c);
      }
    }
    if (!pts.length) return;
    var line = L.polyline(pts.map(function (p) { return [p[1], p[0]]; }), {
      pane: "ringPane",
      color: "#f5a623",
      weight: 3,
      opacity: 0.32,
      dashArray: "2 9",
      interactive: false,
      className: "ring-line"
    }).addTo(map);
    ringLayers.push(line);
  }

  function initEndpointDots() {
    startLayer = L.circleMarker([0, 0], {
      pane: "endpointPane", radius: 8, color: "#ffffff", weight: 2,
      fillColor: "#34d399", fillOpacity: 1, interactive: false
    });
    endLayer = L.circleMarker([0, 0], {
      pane: "endpointPane", radius: 8, color: "#ffffff", weight: 2,
      fillColor: "#ff6b6b", fillOpacity: 1, interactive: false
    });
  }

  function drawEndpointDots() {
    if (state.start) {
      startLayer.setLatLng([state.start.lat, state.start.lon]).addTo(map);
      startLayer.bindTooltip("起点 · " + state.start.label, {
        permanent: true, direction: "left", offset: [-10, 0], className: "cycling-endpoint-tip start"
      });
    } else if (map.hasLayer(startLayer)) {
      map.removeLayer(startLayer);
    }
    if (state.end) {
      endLayer.setLatLng([state.end.lat, state.end.lon]).addTo(map);
      endLayer.bindTooltip("终点 · " + state.end.label, {
        permanent: true, direction: "top", offset: [0, -8], className: "cycling-endpoint-tip end"
      });
    } else if (map.hasLayer(endLayer)) {
      map.removeLayer(endLayer);
    }
  }

  /* ---------------- 端点 UI ---------------- */
  var GROUPS = [
    { kind: "gate", label: "校门" },
    { kind: "building", label: "教学楼 / 场馆" },
    { kind: "dorm", label: "宿舍" },
    { kind: "playground", label: "操场" }
  ];

  function initEndpointUi() {
    [els.startSelect, els.endSelect].forEach(function (sel) {
      if (!sel) return;
      var ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "— 地图点选 —";
      sel.appendChild(ph);
      GROUPS.forEach(function (g) {
        var items = Object.keys(pointById).filter(function (id) { return pointById[id].kind === g.kind; });
        if (!items.length) return;
        var og = document.createElement("optgroup");
        og.label = g.label;
        items.forEach(function (id) {
          var o = document.createElement("option");
          o.value = id;
          o.textContent = pointById[id].name;
          og.appendChild(o);
        });
        sel.appendChild(og);
      });
    });
  }

  function updateEndpointCards() {
    if (els.startName) els.startName.textContent = state.start ? state.start.label : "点击地图选择";
    if (els.endName) els.endName.textContent = state.end ? state.end.label : "点击地图选择";
    if (els.startSub) els.startSub.textContent = endpointSub(state.start);
    if (els.endSub) els.endSub.textContent = endpointSub(state.end);
    if (els.startCard) els.startCard.classList.toggle("active", state.active === "start");
    if (els.endCard) els.endCard.classList.toggle("active", state.active === "end");
    if (els.startSelect) els.startSelect.value = state.start && state.start.kind === "poi" ? state.start.id : "";
    if (els.endSelect) els.endSelect.value = state.end && state.end.kind === "poi" ? state.end.id : "";
  }

  function endpointValue(ep) {
    if (!ep) return null;
    if (ep.kind === "poi" && ep.id) return ep.id;
    return { lon: ep.lon, lat: ep.lat, label: ep.label || "地图点选位置" };
  }

  function setEndpoint(which, ep, opts) {
    if (!ep) return;
    state[which] = ep;
    if (!(opts && opts.keepActive) && state.active === which) {
      state.active = which === "start" ? "end" : "start";
    }
    updateEndpointCards();
    drawEndpointDots();
    schedulePlan();
    scheduleUrl();
  }

  function schedulePlan() {
    clearTimeout(planTimer);
    planTimer = setTimeout(compute, 60);
  }

  /* ---------------- 路线绘制 ---------------- */
  function clearRoute() {
    routeLayers.forEach(function (layer) { if (map.hasLayer(layer)) map.removeLayer(layer); });
    routeLayers = [];
  }

  function fitOptions() {
    var w = window.innerWidth || 1440;
    if (w > 1100) return { paddingTopLeft: [360, 110], paddingBottomRight: [410, 100], maxZoom: 17, animate: true };
    if (w > 760) return { paddingTopLeft: [40, 110], paddingBottomRight: [340, 100], maxZoom: 17, animate: true };
    return { paddingTopLeft: [16, 70], paddingBottomRight: [16, 130], maxZoom: 17, animate: true };
  }

  function fitRoute() {
    if (!map || !state.result) return;
    var latlngs = state.result.path.map(function (p) { return [p[1], p[0]]; });
    var b = L.latLngBounds(latlngs);
    if (state.start) b.extend([state.start.lat, state.start.lon]);
    if (state.end) b.extend([state.end.lat, state.end.lon]);
    if (b.isValid()) map.fitBounds(b, fitOptions());
  }

  function drawRoute(path) {
    clearRoute();
    if (!path || path.length < 2) return;
    var latlngs = path.map(function (p) { return [p[1], p[0]]; });
    var glow = L.polyline(latlngs, {
      pane: "routePane", interactive: false, color: "#ffb347", weight: 18,
      opacity: 0.24, lineCap: "round", lineJoin: "round", className: "cycling-glow"
    }).addTo(map);
    var base = L.polyline(latlngs, {
      pane: "routePane", interactive: false, color: "#f97316", weight: 7,
      opacity: 0.96, lineCap: "round", lineJoin: "round", className: "cycling-base"
    }).addTo(map);
    var dash = L.polyline(latlngs, {
      pane: "routePane", interactive: false, color: "#ffe4b8", weight: 2.2,
      opacity: 0.95, lineCap: "round", lineJoin: "round", dashArray: "5 11", className: "cycling-dash"
    }).addTo(map);
    routeLayers = [glow, base, dash];
  }

  function updatePlaygroundState(hits) {
    var hitIds = {};
    (hits || []).forEach(function (h) { hitIds[h.id] = 1; });
    Object.keys(pgLayers).forEach(function (id) {
      var layer = pgLayers[id];
      var hit = !!hitIds[id];
      layer.circle.setStyle({
        fillOpacity: hit ? 0.2 : 0.04,
        opacity: hit ? 0.95 : 0.45,
        weight: hit ? 2 : 1.2
      });
    });
  }

  /* ---------------- 结果渲染 ---------------- */
  function renderChecks(res, route) {
    if (!els.checks) return;
    var okLen = route.distance >= Core.MIN_LENGTH;
    var okLoop = route.repeats === 0 && route.crossings === 0 && (route.maxWinding || 0) <= 240;
    var big = Math.round(route.bigRatio * 100);
    var names = route.hits.map(function (h) { return h.name; });
    var html = "";
    html += '<span class="check ' + (okLen ? "ok" : "bad") + '">' +
      (okLen ? "✓" : "!") + " 长度 " + Core.formatDistance(route.distance) +
      (okLen ? " ≥ 3 km" : " < 3 km") + "</span>";
    html += '<span class="check ' + (names.length ? "ok" : "bad") + '">' +
      (names.length ? "✓ 途经 " + escapeHtml(names.join(" / ")) : "! 未经过操场") + "</span>";
    html += '<span class="check ' + (okLoop ? "ok" : "bad") + '">' +
      (okLoop ? "✓ 无绕圈 / 无重复路段" : "! 操场旁绕行较多") + "</span>";
    html += '<span class="check ' + (big >= 45 ? "ok" : "warn") + '">' +
      (big >= 45 ? "✓" : "·") + " 大路占比 " + big + "%</span>";
    els.checks.innerHTML = html;
  }

  function renderSteps(steps) {
    if (!els.steps) return;
    els.steps.innerHTML = (steps || []).map(function (s) {
      var txt = escapeHtml(s.text).replace(/(\d+)\s*米/g, "<em>$1 米</em>");
      return '<div class="step"><div class="ico">' + s.icon + '</div><div class="txt">' + txt + "</div></div>";
    }).join("");
  }

  function showResult(result, full, keepAlt) {
    state.result = result;
    state.alts = (full && full.alternatives) || [];
    if (!keepAlt) state.altIndex = 0;
    drawRoute(result.path);
    updatePlaygroundState(result.hits);
    if (els.routeDist) {
      els.routeDist.innerHTML = (result.distance / 1000).toFixed(2) + " <small>km</small>";
    }
    if (els.routeTime) els.routeTime.textContent = Core.formatDuration(result.duration);
    if (els.routeBig) els.routeBig.textContent = Math.round(result.bigRatio * 100) + "%";
    renderChecks(full, result);
    if (els.viaLine) {
      if (result.hits.length) {
        els.viaLine.innerHTML = "途经：<b>" + result.hits.map(function (h) { return escapeHtml(h.name); }).join(" · ") + "</b>";
      } else {
        els.viaLine.textContent = "路线未贴近操场";
      }
    }
    if (els.warning) {
      if (full && full.warning) {
        els.warning.hidden = false;
        els.warning.textContent = full.warning;
      } else {
        els.warning.hidden = true;
        els.warning.textContent = "";
      }
    }
    renderSteps(full && full.steps ? full.steps : Core.buildSteps(result.path, state.start.label, state.end.label));
    if (els.btnAlt) {
      els.btnAlt.disabled = state.alts.length <= 1;
      els.btnAlt.textContent = state.alts.length > 1 ? "换一条" : "仅此一条";
    }
    if (els.btnFit) els.btnFit.disabled = false;
    if (els.routeCard) els.routeCard.classList.add("show");
    fitRoute();
    scheduleUrl();
  }

  function clearResult() {
    state.result = null;
    state.alts = [];
    state.altIndex = 0;
    clearRoute();
    updatePlaygroundState([]);
    if (els.routeCard) els.routeCard.classList.remove("show");
    if (els.routeDist) els.routeDist.textContent = "—";
    if (els.routeTime) els.routeTime.textContent = "—";
    if (els.routeBig) els.routeBig.textContent = "—";
    if (els.checks) els.checks.innerHTML = "";
    if (els.viaLine) els.viaLine.textContent = "";
    if (els.warning) { els.warning.hidden = true; els.warning.textContent = ""; }
    if (els.steps) els.steps.innerHTML = "";
    if (els.btnAlt) { els.btnAlt.disabled = true; els.btnAlt.textContent = "换一条"; }
    if (els.btnFit) els.btnFit.disabled = true;
  }

  /* ---------------- 规划 ---------------- */
  function compute() {
    if (!state.start || !state.end) { clearResult(); return; }
    var seq = ++state.planSeq;
    if (els.btnPlan) els.btnPlan.disabled = true;
    if (els.routeCard) els.routeCard.classList.remove("show");
    if (els.routeDist) els.routeDist.textContent = "规划中…";
    if (els.routeTime) els.routeTime.textContent = "—";
    if (els.routeBig) els.routeBig.textContent = "—";
    if (els.checks) els.checks.innerHTML = "";
    if (els.viaLine) els.viaLine.textContent = "";
    if (els.warning) { els.warning.hidden = true; els.warning.textContent = ""; }
    if (els.steps) els.steps.innerHTML = "";

    setTimeout(function () {
      if (seq !== state.planSeq) return;
      var res;
      try {
        res = Core.plan(DATA, endpointValue(state.start), endpointValue(state.end));
      } catch (err) {
        if (window.console && console.error) console.error("[cycling] 规划失败", err);
        res = { ok: false, error: "exception", message: "路线规划出错，请重试" };
      }
      if (seq !== state.planSeq) return;
      if (els.btnPlan) els.btnPlan.disabled = false;
      if (!res.ok) {
        clearResult();
        toast(res.message || "没有找到合适的乐骑路线");
        return;
      }
      showResult(res.route, {
        alternatives: res.alternatives,
        warning: res.warning,
        steps: res.steps
      });
    }, 20);
  }

  /* ---------------- URL ---------------- */
  function readParams() {
    var out = {};
    function absorb(raw) {
      var s = String(raw == null ? "" : raw).replace(/^[?#]/, "");
      if (!s) return;
      try {
        new URLSearchParams(s).forEach(function (v, k) { if (k && !(k in out)) out[k] = v; });
      } catch (err) { /* ignore */ }
    }
    absorb(window.location.search);
    absorb(window.location.hash);
    return out;
  }

  function endpointFromParam(raw) {
    if (!raw) return null;
    var v = String(raw).trim();
    var p = pointById[v] || lowerId[v.toLowerCase()];
    if (p) return pointEndpoint(p.id);
    var m = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(v);
    if (m) {
      var lon = parseFloat(m[1]), lat = parseFloat(m[2]);
      if (isFinite(lon) && isFinite(lat) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        return rawEndpoint(L.latLng(lat, lon));
      }
    }
    return null;
  }

  function paramOf(ep) {
    if (!ep) return "";
    if (ep.kind === "poi" && ep.id) return ep.id;
    return Number(ep.lon).toFixed(6) + "," + Number(ep.lat).toFixed(6);
  }

  function syncUrl() {
    var from = paramOf(state.start), to = paramOf(state.end);
    var sig = from + "|" + to;
    if (sig === lastUrl) return;
    lastUrl = sig;
    var q;
    try { q = new URLSearchParams(window.location.search); } catch (err) { q = null; }
    if (!q) return;
    if (from) q.set("from", from); else q.delete("from");
    if (to) q.set("to", to); else q.delete("to");
    var qs = q.toString();
    try {
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    } catch (err) {
      try { window.location.hash = qs ? "#" + qs : ""; } catch (err2) { /* ignore */ }
    }
  }

  function scheduleUrl() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(syncUrl, 120);
  }

  /* ---------------- 事件 ---------------- */
  function nearestPoint(latlng) {
    var best = null;
    Object.keys(pointById).forEach(function (id) {
      var p = pointById[id];
      var d = Core.meters([latlng.lng, latlng.lat], [p.lon, p.lat]);
      if (!best || d < best.d) best = { id: id, d: d };
    });
    return best && best.d <= 40 ? best : null;
  }

  function bindEvents() {
    map.on("click", function (e) {
      var pending = e.latlng;
      clearTimeout(state.clickTimer);
      state.clickTimer = setTimeout(function () {
        var hit = nearestPoint(pending);
        var ep = hit ? pointEndpoint(hit.id) : rawEndpoint(pending);
        if (hit) toast("已吸附到 " + pointById[hit.id].name);
        setEndpoint(state.active === "end" ? "end" : "start", ep);
      }, 240);
    });
    map.on("mousemove", function (e) {
      if (els.coord) {
        els.coord.textContent = "经度 " + e.latlng.lng.toFixed(6) + "，纬度 " + e.latlng.lat.toFixed(6);
      }
    });
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { if (map) map.invalidateSize(); }, 120);
    });

    [els.startCard, els.endCard].forEach(function (card, idx) {
      if (!card) return;
      card.addEventListener("click", function (e) {
        var tag = e.target && e.target.tagName;
        if (tag === "SELECT" || tag === "OPTION") return;
        state.active = idx === 0 ? "start" : "end";
        updateEndpointCards();
      });
    });

    if (els.startSelect) {
      els.startSelect.addEventListener("change", function () {
        var p = pointById[els.startSelect.value];
        if (!p) { updateEndpointCards(); return; }
        setEndpoint("start", pointEndpoint(p.id), { keepActive: true });
      });
    }
    if (els.endSelect) {
      els.endSelect.addEventListener("change", function () {
        var p = pointById[els.endSelect.value];
        if (!p) { updateEndpointCards(); return; }
        setEndpoint("end", pointEndpoint(p.id), { keepActive: true });
      });
    }

    if (els.btnSwap) {
      els.btnSwap.addEventListener("click", function () {
        if (!state.start && !state.end) { toast("请先选择起点或终点"); return; }
        var t = state.start;
        state.start = state.end;
        state.end = t;
        state.active = "start";
        updateEndpointCards();
        drawEndpointDots();
        schedulePlan();
        scheduleUrl();
      });
    }

    if (els.btnReset) {
      els.btnReset.addEventListener("click", function () {
        state.start = null;
        state.end = null;
        state.active = "start";
        clearResult();
        updateEndpointCards();
        drawEndpointDots();
        scheduleUrl();
        toast("已清除，点击地图或下拉框重新选择");
      });
    }

    if (els.btnPlan) {
      els.btnPlan.addEventListener("click", function () {
        if (!state.start || !state.end) { toast("请先选择起点和终点"); return; }
        compute();
      });
    }

    if (els.btnAlt) {
      els.btnAlt.addEventListener("click", function () {
        if (!state.result || state.alts.length <= 1) return;
        state.altIndex = (state.altIndex + 1) % state.alts.length;
        var alt = state.alts[state.altIndex];
        var full = {
          alternatives: state.alts,
          warning: alt.distance < Core.MIN_LENGTH ? "该方案不足 3 km。" : null,
          steps: Core.buildSteps(alt.path, state.start.label, state.end.label)
        };
        showResult(alt, full, true);
        toast("已切换方案 " + (state.altIndex + 1) + " / " + state.alts.length);
      });
    }

    if (els.btnFit) els.btnFit.addEventListener("click", fitRoute);
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    initMap();
    initPlaygrounds();
    initPoiDots();
    initRing();
    initEndpointDots();
    initEndpointUi();
    bindEvents();

    var params = readParams();
    var from = endpointFromParam(params.from);
    var to = endpointFromParam(params.to);
    if (params.from && !from) toast("无法识别起点参数：" + params.from);
    if (params.to && !to) toast("无法识别终点参数：" + params.to);
    if (!from) from = pointEndpoint(DATA.defaults && DATA.defaults.from || "GATE");
    if (!to) to = pointEndpoint(DATA.defaults && DATA.defaults.to || "A");
    state.start = from;
    state.end = to;
    state.active = "start";
    updateEndpointCards();
    drawEndpointDots();
    compute();

    window.__CYCLING_DEBUG__ = {
      state: state,
      data: DATA,
      core: Core,
      compute: compute
    };
  }

  try {
    boot();
  } catch (err) {
    if (window.console && console.error) console.error("[cycling] 初始化失败", err);
    showBootError("乐骑页面初始化失败：" + (err && err.message ? err.message : "未知错误"));
  }
})();
