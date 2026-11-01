/* 真实 GIS 地图页：Leaflet 底图 + 校园 POI 选点 + 学校路径接口 + 外部室内页深链
 * 依赖（脚本顺序见 real-map.html）：
 *   window.L                  vendor/leaflet/leaflet.js（1.9.4，本地）
 *   window.REAL_CAMPUS        data/real-pois.js
 *   window.B_BUILDING_DATA    b-package/assets/b-building-data.js（B 楼 7 层 + 北楼 N4/N5）
 *   window.INDOOR_PROVIDERS   assets/indoor-providers.js
 * 仅使用普通 <script> 兼容写法，无 ES module、无构建步骤。
 */
(function () {
  "use strict";

  var CAMPUS = window.REAL_CAMPUS;
  var PROVIDERS = window.INDOOR_PROVIDERS;
  var ROAD_SNAP = window.REAL_ROAD_SNAP;
  var L = window.L;

  /* 学校 GIS 路径接口（步行）；v2 失败时回退 v1。
   * 返回：{ status, message, total, result: { routes: [ { path: [{x:lon,y:lat}], distance, duration } ] } }
   */
  var DIRECTION_V2 = "https://gis.xidian.edu.cn/openmap/mapi/direction/v2";
  var DIRECTION_V1 = "https://gis.xidian.edu.cn/openmap/mapi/direction/v1";
  var FETCH_TIMEOUT = 8000;   /* ms，单次请求超时 */
  var WALK_SPEED = 1.25;      /* m/s，接口未给 duration 时估算 */
  var SNAP_RADIUS = 30;       /* m，地图点选吸附半径 */
  var POI_FALLBACK_RADIUS = 160; /* m，点不在路网时回退到最近 POI 的半径 */
  var TILE_WARN_AT = 3;       /* 连续瓦片错误次数达到后提示 */
  var EARTH_R = 6371000;      /* m */

  function $(id) { return document.getElementById(id); }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var bootFailed = false;
  var loadingHidden = false;

  function showBootError(msg) {
    bootFailed = true;
    var box = $("loading");
    if (!box) return;
    box.style.display = "flex";
    box.classList.remove("hide");
    box.innerHTML = '<div class="loading-inner"><div>' + escapeHtml(msg) + "</div>" +
      '<div style="font-size:11px;color:#8d9aab">' +
      "请确认 vendor/leaflet/leaflet.js、data/real-pois.js 与 assets/indoor-providers.js 已随页面加载" +
      "</div></div>";
  }

  if (!CAMPUS || !L) {
    showBootError("地图依赖未加载：缺少 Leaflet 或校区数据");
    return;
  }

  /* ---------------- DOM ---------------- */
  var els = {
    loading: $("loading"),
    toast: $("toast"),
    coord: $("coord"),
    startCard: $("startCard"),
    endCard: $("endCard"),
    startName: $("startName"),
    endName: $("endName"),
    startSub: $("startSub"),
    endSub: $("endSub"),
    startSelect: $("startSelect"),
    endSelect: $("endSelect"),
    btnSwap: $("btnSwap"),
    btnReset: $("btnReset"),
    routeCard: $("routeCard"),
    routeDist: $("routeDist"),
    routeTime: $("routeTime"),
    routeKind: $("routeKind"),
    steps: $("steps"),
    indoorBar: $("indoorBar"),
    bIndoorBar: $("bIndoorBar"),
    bEntranceSelect: $("bEntranceSelect"),
    bRoomSelect: $("bRoomSelect"),
    btnBIndoor: $("btnBIndoor"),
    indoorTitle: $("indoorTitle"),
    indoorSub: $("indoorSub"),
    indoorFloor: $("indoorFloor"),
    btnIndoor: $("btnIndoor"),
    indoorNew: $("indoorNew"),
    indoorModal: $("indoorModal"),
    imTitle: $("imTitle"),
    imSub: $("imSub"),
    imFloor: $("imFloor"),
    imNew: $("imNew"),
    imClose: $("imClose"),
    imFrame: $("imFrame")
  };

  /* ---------------- POI 索引 ---------------- */
  var poiList = (CAMPUS.pois || []).concat(CAMPUS.dorms || []);
  var poiById = {};
  var poiByLowerId = {};
  poiList.forEach(function (poi) {
    if (!poi || !poi.id) return;
    poiById[poi.id] = poi;
    poiByLowerId[String(poi.id).toLowerCase()] = poi;
  });

  /* ---------------- 状态 ---------------- */
  var state = {
    start: null,              /* { kind:"poi"|"point", id, label, lat, lon } */
    end: null,
    active: "start",          /* 下一次地图点击写到哪个端点 */
    route: null,
    routeSeq: 0,              /* 丢弃过期请求 */
    floor: null,              /* 当前室内楼层 id */
    pendingFloor: null,       /* URL 里预选、等楼栋确定后再用的楼层 */
    indoorBuilding: null,
    indoorEntry: null
  };

  var map = null;
  var tiles = null;
  var startDot = null;
  var endDot = null;
  var routeLayers = [];
  var poiMarkers = {};
  var tileErrors = 0;
  var tileWarned = false;
  var toastTimer = null;
  var urlTimer = null;
  var lastUrlSig = null;
  var resizeTimer = null;
  var bEntranceTouched = false;  /* 用户手动选过 B 楼入口后，不再按起点就近覆盖 */

  /* ---------------- 小工具 ---------------- */
  function toast(msg) {
    var t = els.toast;
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function hideLoading() {
    if (loadingHidden || bootFailed) return;
    loadingHidden = true;
    window.__REAL_MAP_READY__ = true;
    var box = els.loading;
    if (!box) return;
    box.classList.add("hide");
    setTimeout(function () {
      if (!bootFailed) box.style.display = "none";
    }, 500);
  }

  function haversine(lat1, lon1, lat2, lon2) {
    var rad = Math.PI / 180;
    var dLat = (lat2 - lat1) * rad;
    var dLon = (lon2 - lon1) * rad;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function metersXY(a, b) {
    var midLat = ((a.y + b.y) / 2) * Math.PI / 180;
    var dx = (b.x - a.x) * 111320 * Math.cos(midLat);
    var dy = (b.y - a.y) * 110540;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function bearingXY(a, b) {
    var midLat = ((a.y + b.y) / 2) * Math.PI / 180;
    var dx = (b.x - a.x) * 111320 * Math.cos(midLat);
    var dy = (b.y - a.y) * 110540;
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

  function fmtDuration(sec) {
    var m = Math.round((Number(sec) || 0) / 60);
    if (m < 1) return "不到 1 分钟";
    if (m < 60) return m + " 分钟";
    var h = Math.floor(m / 60);
    var r = m % 60;
    return h + " 小时" + (r ? " " + r + " 分钟" : "");
  }

  function shortPoiName(name) {
    var s = String(name == null ? "" : name);
    var i = s.indexOf("（");
    return i > 0 ? s.slice(0, i) : s;
  }

  function endpointLabel(ep) {
    return ep && ep.label ? ep.label : "地图点选位置";
  }

  /* ---------------- 端点对象 ---------------- */
  function poiEndpoint(poi) {
    return {
      kind: "poi",
      id: poi.id,
      label: poi.name,
      lat: Number(poi.lat),
      lon: Number(poi.lon)
    };
  }

  function pointEndpoint(latlng) {
    return {
      kind: "point",
      id: null,
      label: "地图点选位置",
      lat: Number(latlng.lat),
      lon: Number(latlng.lng)
    };
  }

  function endpointSub(ep) {
    if (!ep) return "—";
    var coord = Number(ep.lon).toFixed(6) + ", " + Number(ep.lat).toFixed(6);
    var kind = ep.kind === "poi" ? "建筑 POI" : (ep.kind === "road" ? "道路吸附点" : "地图点选");
    return "WGS-84 " + coord + " · " + kind;
  }

  function sameEndpoint(a, b) {
    if (!a || !b) return false;
    if (a.kind === "poi" && b.kind === "poi" && a.id === b.id) return true;
    return haversine(a.lat, a.lon, b.lat, b.lon) < 5;
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

    var credit = $("credit");
    if (credit && CAMPUS.attribution) credit.textContent = CAMPUS.attribution;

    /* 底图错误：连续失败多次才提示，避免边缘瓦片偶发失败打扰 */
    tiles.on("tileerror", function () {
      tileErrors++;
      if (!tileWarned && tileErrors >= TILE_WARN_AT) {
        tileWarned = true;
        toast("底图加载失败，请检查网络");
      }
    });
    tiles.on("tileload", function () { tileErrors = 0; });
    window.addEventListener("online", function () {
      if (tiles) tiles.redraw();
      tileWarned = false;
    });

    /* 路线 / 端点单独分层，避免端点小圆点被路线盖住 */
    map.createPane("routePane").style.zIndex = 450;
    map.createPane("endpointPane").style.zIndex = 460;

    map.whenReady(function () { hideLoading(); });
    setTimeout(hideLoading, 2000);
  }

  function buildPoiIcon(poi) {
    var safeId = String(poi.id).toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return L.divIcon({
      className: "poi-marker poi-" + safeId,
      html: '<span class="poi-pill">' + escapeHtml(shortPoiName(poi.name)) +
        '</span><span class="poi-stem"></span>',
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });
  }

  function initPoiMarkers() {
    poiList.forEach(function (poi) {
      var marker = L.marker([poi.lat, poi.lon], {
        icon: buildPoiIcon(poi),
        riseOnHover: true,
        bubblingMouseEvents: false
      });
      marker.on("click", function (ev) {
        if (ev && ev.originalEvent && L.DomEvent) {
          L.DomEvent.stopPropagation(ev.originalEvent);
        }
        setEndpoint(state.active === "end" ? "end" : "start", poiEndpoint(poi));
      });
      marker.addTo(map);
      var el = marker.getElement();
      if (el) el.title = poi.name;
      poiMarkers[poi.id] = marker;
    });
  }

  function nearestPoi(latlng) {
    var best = null;
    poiList.forEach(function (poi) {
      var d = haversine(latlng.lat, latlng.lng, Number(poi.lat), Number(poi.lon));
      if (!best || d < best.distance) best = { poi: poi, distance: d };
    });
    if (best && best.distance <= SNAP_RADIUS) return best;
    return null;
  }

  /* 路网失败时用：在指定半径内找最近 POI（只对地图点选端点生效） */
  function nearestPoiWithin(ep, radius) {
    if (!ep || ep.kind !== "point") return null;
    var best = null;
    poiList.forEach(function (poi) {
      var d = haversine(ep.lat, ep.lon, Number(poi.lat), Number(poi.lon));
      if (!best || d < best.distance) best = { poi: poi, distance: d };
    });
    if (best && best.distance <= radius) return best;
    return null;
  }

  /* 任意点吸附：优先 30m 内 POI，否则 100m 内最近道路节点。
   * 道路节点来自 data/real-road-snap.js（GCJ，与瓦片/POI 对齐）。 */
  function nearestRoadPoint(ep, radius) {
    if (!ep || !ROAD_SNAP || !ROAD_SNAP.nodes) return null;
    var best = null;
    for (var i = 0; i < ROAD_SNAP.nodes.length; i++) {
      var n = ROAD_SNAP.nodes[i];
      var d = haversine(ep.lat, ep.lon, n[1], n[0]);
      if (!best || d < best.distance) best = { lon: n[0], lat: n[1], distance: d };
    }
    if (best && best.distance <= radius) return best;
    return null;
  }

  function snapRawEndpoint(ep) {
    if (!ep || ep.kind !== "point") return null;
    var poi = nearestPoi(L.latLng(ep.lat, ep.lon));
    if (poi) return { ep: poiEndpoint(poi.poi), distance: poi.distance, kind: "poi", label: poi.poi.name };
    var road = nearestRoadPoint(ep, 100);
    if (road) {
      return {
        ep: { kind: "road", id: null, label: "道路点", lon: road.lon, lat: road.lat },
        distance: road.distance,
        kind: "road",
        label: "道路点"
      };
    }
    return null;
  }

  /* ---------------- 端点标记 ---------------- */
  function setDot(which, ep, color, className) {
    var isStart = which === "start";
    var marker = isStart ? startDot : endDot;

    if (!ep) {
      if (marker) {
        if (map.hasLayer(marker)) map.removeLayer(marker);
        if (isStart) startDot = null; else endDot = null;
      }
      return;
    }

    var latlng = [ep.lat, ep.lon];
    if (!marker) {
      marker = L.circleMarker(latlng, {
        pane: "endpointPane",
        radius: 8,
        color: "#ffffff",
        weight: 2,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: 1,
        interactive: false,
        className: "endpoint-dot " + className
      }).addTo(map);
      if (isStart) startDot = marker; else endDot = marker;
    } else {
      marker.setLatLng(latlng);
    }
  }

  function drawEndpointDots() {
    if (!map) return;
    setDot("start", state.start, "#34d399", "endpoint-start");
    setDot("end", state.end, "#ff6b6b", "endpoint-end");
  }

  function updatePoiStates() {
    poiList.forEach(function (poi) {
      var marker = poiMarkers[poi.id];
      if (!marker) return;
      var el = marker.getElement();
      if (!el) return;
      var pill = el.querySelector ? el.querySelector(".poi-pill") : null;
      if (!pill) return;
      var isStart = !!(state.start && state.start.kind === "poi" && state.start.id === poi.id);
      var isEnd = !!(state.end && state.end.kind === "poi" && state.end.id === poi.id);
      pill.classList.toggle("is-start", isStart && !isEnd);
      pill.classList.toggle("is-end", isEnd && !isStart);
      pill.classList.toggle("is-both", isStart && isEnd);
    });
  }

  /* ---------------- 端点 UI ---------------- */
  function addOption(sel, value, text) {
    if (!sel) return;
    var o = document.createElement("option");
    o.value = value;
    o.textContent = text;
    sel.appendChild(o);
  }

  function initEndpointUi() {
    poiList.forEach(function (poi) {
      addOption(els.startSelect, poi.id, poi.name);
      addOption(els.endSelect, poi.id, poi.name);
    });
    [els.startSelect, els.endSelect].forEach(function (sel) {
      if (!sel) return;
      var ph = document.createElement("option");
      ph.value = "";
      ph.textContent = "— 地图点选 —";
      sel.insertBefore(ph, sel.firstChild);
      sel.value = "";
    });
  }

  function updateEndpointCards() {
    if (els.startName) els.startName.textContent = state.start ? state.start.label : "点击地图选择";
    if (els.endName) els.endName.textContent = state.end ? state.end.label : "点击地图选择";
    if (els.startSub) els.startSub.textContent = endpointSub(state.start);
    if (els.endSub) els.endSub.textContent = endpointSub(state.end);
    if (els.startCard) els.startCard.classList.toggle("active", state.active === "start");
    if (els.endCard) els.endCard.classList.toggle("active", state.active === "end");
    if (els.startSelect) els.startSelect.value =
      state.start && state.start.kind === "poi" ? state.start.id : "";
    if (els.endSelect) els.endSelect.value =
      state.end && state.end.kind === "poi" ? state.end.id : "";
  }

  function setEndpoint(which, ep, options) {
    if (!ep) return;
    state[which] = ep;
    if (!(options && options.keepActive) && state.active === which) {
      state.active = which === "start" ? "end" : "start";
    }
    afterEndpointsChanged();
  }

  function afterEndpointsChanged() {
    updateEndpointCards();
    drawEndpointDots();
    updatePoiStates();
    refreshIndoor();
    scheduleUrlSync();
    if (state.start && state.end) computeRoute();
    else resetRouteView();
  }

  /* ---------------- 路线绘制与指引 ---------------- */
  function clearRouteLayers() {
    routeLayers.forEach(function (layer) {
      if (map && map.hasLayer(layer)) map.removeLayer(layer);
    });
    routeLayers = [];
  }

  function fitOptions() {
    var w = window.innerWidth || document.documentElement.clientWidth || 1440;
    if (w > 1100) {
      return {
        paddingTopLeft: [360, 110],
        paddingBottomRight: [400, 90],
        maxZoom: 18,
        animate: true
      };
    }
    if (w > 760) {
      return {
        paddingTopLeft: [40, 110],
        paddingBottomRight: [320, 90],
        maxZoom: 18,
        animate: true
      };
    }
    return {
      paddingTopLeft: [16, 70],
      paddingBottomRight: [16, 110],
      maxZoom: 18,
      animate: true
    };
  }

  function drawRoute(path) {
    var latlngs = path.map(function (p) { return [p.y, p.x]; });

    var glow = L.polyline(latlngs, {
      pane: "routePane",
      interactive: false,
      color: "#5ab0ff",
      weight: 18,
      opacity: 0.22,
      lineCap: "round",
      lineJoin: "round",
      className: "route-glow"
    }).addTo(map);

    var base = L.polyline(latlngs, {
      pane: "routePane",
      interactive: false,
      color: "#2f7cc4",
      weight: 7,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      className: "route-base"
    }).addTo(map);

    var dash = L.polyline(latlngs, {
      pane: "routePane",
      interactive: false,
      color: "#d8efff",
      weight: 2.4,
      opacity: 0.95,
      lineCap: "round",
      lineJoin: "round",
      dashArray: "4 10",
      className: "route-dash"
    }).addTo(map);

    routeLayers = [glow, base, dash];

    var bounds = L.latLngBounds(latlngs);
    if (state.start) bounds.extend([state.start.lat, state.start.lon]);
    if (state.end) bounds.extend([state.end.lat, state.end.lon]);
    if (bounds.isValid()) map.fitBounds(bounds, fitOptions());
  }

  function groupByBearing(path) {
    var groups = [];
    if (!path || path.length < 2) return groups;
    for (var i = 1; i < path.length; i++) {
      var a = path[i - 1];
      var b = path[i];
      var d = metersXY(a, b);
      if (!(d > 0.5)) continue;
      var brg = bearingXY(a, b);

      if (!groups.length) {
        groups.push({ from: a, to: b, distance: d, startBearing: brg });
        continue;
      }
      var g = groups[groups.length - 1];
      if (Math.abs(angleDelta(g.startBearing, brg)) <= 28) {
        g.to = b;
        g.distance += d;
      } else {
        groups.push({ from: a, to: b, distance: d, startBearing: brg });
      }
    }

    /* 合并过短分组（< 8 m），减少路口微小折线产生的噪声指引 */
    var merged = [];
    groups.forEach(function (grp) {
      if (merged.length && grp.distance < 8) {
        var last = merged[merged.length - 1];
        last.to = grp.to;
        last.distance += grp.distance;
      } else {
        merged.push({ from: grp.from, to: grp.to, distance: grp.distance });
      }
    });
    return merged;
  }

  function buildSteps(path, startLabel, endLabel) {
    var groups = groupByBearing(path);
    var steps = [];
    var prevBearing = null;

    groups.forEach(function (g, idx) {
      var brg = bearingXY(g.from, g.to);
      var dir = dirName(brg);
      var m = Math.max(1, Math.round(g.distance));
      var icon;
      var text;

      if (idx === 0) {
        icon = "●";
        text = "从" + startLabel + "出发，向" + dir + "步行 " + m + " 米";
      } else {
        var delta = angleDelta(prevBearing, brg);
        var abs = Math.abs(delta);
        if (abs < 22) {
          icon = "↑";
          text = "继续向" + dir + "直行 " + m + " 米";
        } else if (abs > 150) {
          icon = "↺";
          text = "掉头，向" + dir + "步行 " + m + " 米";
        } else if (delta > 0) {
          icon = "↱";
          text = "右转，向" + dir + "步行 " + m + " 米";
        } else {
          icon = "↰";
          text = "左转，向" + dir + "步行 " + m + " 米";
        }
      }
      steps.push({ icon: icon, text: text });
      prevBearing = brg;
    });

    if (!steps.length) {
      steps.push({ icon: "●", text: "从" + startLabel + "出发" });
    }
    steps.push({ icon: "◉", text: "到达" + endLabel });
    return steps;
  }

  function renderSteps(steps) {
    return steps.map(function (s) {
      var txt = escapeHtml(s.text).replace(/(\d+)\s*米/g, "<em>$1 米</em>");
      return '<div class="step"><div class="ico">' + s.icon +
        '</div><div class="txt">' + txt + "</div></div>";
    }).join("");
  }

  function updateRouteKind() {
    if (!els.routeKind) return;
    if (isBEnd()) {
      els.routeKind.textContent = "室外→B楼室内";
      return;
    }
    els.routeKind.textContent = currentIndoorEntry() ? "室外→室内" : "室外";
  }

  function showRouteCard(route) {
    if (els.routeDist) {
      els.routeDist.innerHTML = route.distance >= 1000
        ? (route.distance / 1000).toFixed(2) + " <small>km</small>"
        : Math.min(9999, Math.max(0, Math.round(route.distance))) + " <small>m</small>";
    }
    if (els.routeTime) els.routeTime.textContent = fmtDuration(route.duration);
    updateRouteKind();
    if (els.steps) {
      els.steps.innerHTML = renderSteps(buildSteps(
        route.path,
        endpointLabel(state.start),
        endpointLabel(state.end)
      ));
    }
    if (els.routeCard) els.routeCard.classList.add("show");
  }

  function resetRouteView() {
    state.routeSeq++;
    state.route = null;
    clearRouteLayers();
    if (els.routeCard) els.routeCard.classList.remove("show");
    if (els.routeDist) els.routeDist.textContent = "—";
    if (els.routeTime) els.routeTime.textContent = "—";
    if (els.routeKind) els.routeKind.textContent = "室外";
    if (els.steps) els.steps.innerHTML = "";
  }

  function computeRoute() {
    if (!state.start || !state.end) {
      resetRouteView();
      return;
    }
    /* 任意点选：先吸附到 30m 内 POI，否则 100m 内最近道路；避免草坪/楼内直接调接口 */
    var sSnap = snapRawEndpoint(state.start);
    var eSnap = snapRawEndpoint(state.end);
    if (sSnap) state.start = sSnap.ep;
    if (eSnap) state.end = eSnap.ep;
    if (sSnap || eSnap) {
      updateEndpointCards();
      drawEndpointDots();
      updatePoiStates();
      var tips = [];
      if (sSnap) tips.push("起点" + (sSnap.kind === "road" ? "已吸附到最近道路" : "已吸附到 " + sSnap.label));
      if (eSnap) tips.push("终点" + (eSnap.kind === "road" ? "已吸附到最近道路" : "已吸附到 " + eSnap.label));
      toast("地图点不在路网：" + tips.join("；"));
    }
    if (sameEndpoint(state.start, state.end)) {
      resetRouteView();
      toast("起点与终点相同或过近，请重新选择");
      return;
    }
    if (typeof window.fetch !== "function") {
      resetRouteView();
      toast("当前浏览器不支持 fetch，请使用 Chrome/Edge");
      return;
    }

    var seq = ++state.routeSeq;
    clearRouteLayers();
    if (els.routeCard) els.routeCard.classList.remove("show");
    if (els.routeKind) els.routeKind.textContent = "计算中…";
    if (els.routeDist) els.routeDist.textContent = "—";
    if (els.routeTime) els.routeTime.textContent = "—";

    fetchRouteWithPoiFallback(state.start, state.end).then(function (route) {
      if (seq !== state.routeSeq) return;
      var snapped = route._snapped;
      if (snapped && (snapped.start || snapped.end)) {
        var labels = [];
        if (snapped.start) { state.start = snapped.start; labels.push(snapped.start.label); }
        if (snapped.end) { state.end = snapped.end; labels.push(snapped.end.label); }
        updateEndpointCards();
        drawEndpointDots();
        updatePoiStates();
        toast("该点不在路网，已吸附到 " + labels.join(" / "));
      }
      state.route = route;
      drawRoute(route.path);
      showRouteCard(route);
      refreshIndoor();
      syncUrl();
    }).catch(function (err) {
      if (seq !== state.routeSeq) return;
      clearRouteLayers();
      state.route = null;
      if (els.routeCard) els.routeCard.classList.remove("show");
      if (els.routeKind) els.routeKind.textContent = "室外";
      if (els.routeDist) els.routeDist.textContent = "—";
      if (els.routeTime) els.routeTime.textContent = "—";
      if (window.console && console.warn) {
        console.warn("[real-map] 路径规划失败", err);
      }
      toast("路径规划失败：" + reasonText(err));
      syncUrl();
    });
  }

  /* ---------------- 路径接口 ---------------- */
  function coordPair(ep) {
    return Number(ep.lon).toFixed(6) + "," + Number(ep.lat).toFixed(6);
  }

  function requestJson(url) {
    return new Promise(function (resolve, reject) {
      var settled = false;
      var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        if (controller) {
          try { controller.abort(); } catch (e) { /* 忽略 */ }
        }
        var err = new Error("timeout");
        err.name = "TimeoutError";
        err.code = "timeout";
        reject(err);
      }, FETCH_TIMEOUT);

      var opts = {
        headers: { "Accept": "application/json" },
        cache: "no-store"
      };
      if (controller) opts.signal = controller.signal;

      var request;
      try {
        request = window.fetch(url, opts);
      } catch (err) {
        /* fetch 参数错误等同步异常 */
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
        return;
      }

      request.then(function (res) {
        if (!res.ok) {
          var httpErr = new Error("HTTP " + res.status);
          httpErr.code = "http";
          httpErr.status = res.status;
          throw httpErr;
        }
        return res.json();
      }).then(function (data) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(data);
      }).catch(function (err) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function requestJsonRetry(url, attempts) {
    return requestJson(url).catch(function (err) {
      var retryable = !err || !err.code || err.code === "timeout" ||
        (err.code === "http" && err.status >= 500) || err.name === "TypeError";
      if (attempts > 1 && retryable) {
        return new Promise(function (resolve) { setTimeout(resolve, 350); }).then(function () {
          return requestJsonRetry(url, attempts - 1);
        });
      }
      throw err;
    });
  }

  function pathDistance(path) {
    var total = 0;
    for (var i = 1; i < path.length; i++) total += metersXY(path[i - 1], path[i]);
    return total;
  }

  function routeError(message, code, detail) {
    var err = new Error(message);
    err.code = code || "unknown";
    if (detail) err.detail = detail;
    return err;
  }

  function parseDirection(data) {
    if (!data || (data.status !== 0 && data.status !== "0")) {
      var apiMsg = data && data.message ? String(data.message) : "";
      var status = Number(data && data.status);
      var code = "api-status";
      if (status === 100 || /server exception/i.test(apiMsg)) code = "off-road";
      else if (status === 20 || /not found route/i.test(apiMsg)) code = "no-route";
      throw routeError("接口状态异常" + (apiMsg ? "：" + apiMsg : ""), code, apiMsg);
    }
    var result = data.result;
    var route = result && result.routes && result.routes[0];
    var raw = route && route.path;
    if (!raw || raw.length < 2) throw routeError("无可用路径", "no-route");
    if (route.valid === false) throw routeError("路线不可达", "no-route");

    var path = [];
    for (var i = 0; i < raw.length; i++) {
      var p = raw[i];
      if (!p || typeof p.x !== "number" || typeof p.y !== "number") continue;
      var last = path[path.length - 1];
      if (last && Math.abs(last.x - p.x) < 1e-9 && Math.abs(last.y - p.y) < 1e-9) continue;
      path.push({ x: p.x, y: p.y });
    }
    if (path.length < 2) throw routeError("路径点不足", "no-route");

    var distance = Number(route.distance);
    if (!isFinite(distance) || distance <= 0) distance = pathDistance(path);

    var duration = Number(route.duration);
    if (!isFinite(duration) || duration <= 0) duration = distance / WALK_SPEED;

    return {
      path: path,
      distance: distance,
      duration: duration,
      routeType: route.routeType || "outdoor"
    };
  }

  function fetchRoute(start, end) {
    var query = "?origin=" + coordPair(start) +
      "&destination=" + coordPair(end) + "&mode=walk";

    return requestJsonRetry(DIRECTION_V2 + query, 2).then(parseDirection).catch(function (err) {
      if (err && (err.name === "TimeoutError" || err.code === "timeout")) {
        throw err;
      }
      if (window.console && console.warn) {
        console.warn("[real-map] direction/v2 失败，回退 v1", err);
      }
      return requestJsonRetry(DIRECTION_V1 + query, 2).then(parseDirection);
    });
  }

  function isOffRoadError(err) {
    return !!(err && (err.code === "off-road" || err.code === "no-route"));
  }

  /* 地图点选落在草坪/楼内时，学校接口会返回 server exception 或 not found route；
   * 这里自动回退到 160m 内最近的 POI（建筑/校门/宿舍），避免把“点不在路上”
   * 误报成网络异常。只对 kind="point" 的端点生效。 */
  function fetchRouteWithPoiFallback(start, end) {
    return fetchRoute(start, end).catch(function (err) {
      if (!isOffRoadError(err)) throw err;
      var sHit = nearestPoiWithin(start, POI_FALLBACK_RADIUS);
      var eHit = nearestPoiWithin(end, POI_FALLBACK_RADIUS);
      var altStart = sHit ? poiEndpoint(sHit.poi) : null;
      var altEnd = eHit ? poiEndpoint(eHit.poi) : null;

      /* 不要吸附成与另一端相同/已存在的 POI，否则会变成同点规划 */
      if (altStart && end.kind === "poi" && altStart.id === end.id) altStart = null;
      if (altEnd && start.kind === "poi" && altEnd.id === start.id) altEnd = null;
      if (altStart && altEnd && altStart.id === altEnd.id) {
        altStart = null;
        altEnd = null;
      }
      if (!altStart && !altEnd) throw err;

      var nextStart = altStart || start;
      var nextEnd = altEnd || end;
      return fetchRoute(nextStart, nextEnd).then(function (route) {
        route._snapped = {
          start: altStart,
          end: altEnd
        };
        return route;
      }).catch(function () {
        throw err;
      });
    });
  }

  function reasonText(err) {
    var msg = err && err.message ? String(err.message) : "";
    var code = err && err.code;
    if (err && err.name === "TimeoutError" || code === "timeout" || /timeout/i.test(msg)) {
      return "接口超时（8 秒），请重试";
    }
    if (code === "off-road" || /server exception/i.test(msg)) {
      return "该点不在可规划道路上，请点在道路上，或选择附近的建筑/校门 POI";
    }
    if (code === "no-route") {
      return "该位置不在校园路网覆盖范围内，请选择附近的 POI 或道路点";
    }
    if (code === "http" || /^HTTP\s+\d+/.test(msg)) {
      return "接口返回 " + (err.status ? "HTTP " + err.status : msg);
    }
    if (code === "api-status") {
      return "路径接口返回异常" + (msg ? "：" + msg : "");
    }
    return "网络异常，请检查网络后重试";
  }

  /* ---------------- 室内对接 ---------------- */
  function buildIndoorUrl(buildingId, floorId) {
    if (!PROVIDERS || typeof PROVIDERS.buildUrl !== "function") return null;
    try {
      return PROVIDERS.buildUrl(buildingId, floorId);
    } catch (err) {
      return null;
    }
  }

  function currentIndoorEntry() {
    if (!PROVIDERS || typeof PROVIDERS.get !== "function") return null;
    if (!state.end || state.end.kind !== "poi") return null;
    return PROVIDERS.get(state.end.id);
  }

  function validFloor(entry, floorId) {
    if (!entry || !floorId || !entry.floors) return false;
    return entry.floors.some(function (f) { return f.id === floorId; });
  }

  function floorLabel(entry, floorId) {
    if (!entry || !entry.floors) return floorId || "";
    var hit = entry.floors.filter(function (f) { return f.id === floorId; })[0];
    return hit ? hit.label : (floorId || "");
  }

  function fillFloorSelects(entry, floorId) {
    var floors = entry.floors || [];
    [els.indoorFloor, els.imFloor].forEach(function (sel) {
      if (!sel) return;
      sel.innerHTML = "";
      floors.forEach(function (f) {
        var o = document.createElement("option");
        o.value = f.id;
        o.textContent = f.label;
        sel.appendChild(o);
      });
      sel.value = floorId;
    });
  }

  function updateIndoorLinks() {
    if (!state.indoorBuilding || !state.floor) return;
    var url = buildIndoorUrl(state.indoorBuilding, state.floor);
    if (!url) return;
    if (els.indoorNew) els.indoorNew.href = url;
    if (els.imNew) els.imNew.href = url;
  }

  function closeIndoorModal() {
    if (!els.indoorModal) return;
    els.indoorModal.classList.remove("open");
    els.indoorModal.setAttribute("aria-hidden", "true");
    clearIframe();
  }

  function clearIframe() {
    if (els.imFrame) els.imFrame.removeAttribute("src");
  }

  function hideIndoor() {
    state.indoorBuilding = null;
    state.indoorEntry = null;
    state.floor = null;
    bEntranceTouched = false;
    if (els.indoorBar) els.indoorBar.classList.remove("show");
    if (els.bIndoorBar) els.bIndoorBar.classList.remove("show");
    if (els.indoorFloor) els.indoorFloor.innerHTML = "";
    if (els.imFloor) els.imFloor.innerHTML = "";
    if (els.indoorNew) els.indoorNew.removeAttribute("href");
    if (els.imNew) els.imNew.setAttribute("href", "#");
    clearIframe();
    closeIndoorModal();
    updateRouteKind();
  }

  /* ---------------- B 楼室内（新模型 v4） ----------------
   * 数据：window.B_BUILDING_DATA（b-package/assets/b-building-data.js）
   *   8 个入口 { id, name, floor, node, lat, lon }
   *   80 间教室 { id, name, node, floor, level, wing }（南楼 F1–F7 + 北楼 N4/N5）
   * 跳转契约：b-package/3d.html?from=<入口 id>&to=<教室 node>&floor=<教室楼层>
   */
  function bBuildingData() {
    var d = window.B_BUILDING_DATA;
    return d && d.rooms && d.entrances ? d : null;
  }

  function isBEnd() {
    return !!(state.end && state.end.kind === "poi" && state.end.id === "B");
  }

  /* 按室外起点经纬度就近选择 B 楼入口；无起点/无入口时回退 ENT1 */
  function defaultBEntrance() {
    var d = bBuildingData();
    var list = (d && d.entrances) || [];
    var start = state.start;
    if (list.length && start && isFinite(Number(start.lat)) && isFinite(Number(start.lon))) {
      var best = null;
      list.forEach(function (en) {
        var lat = Number(en.lat);
        var lon = Number(en.lon);
        if (!isFinite(lat) || !isFinite(lon)) return;
        var distance = haversine(Number(start.lat), Number(start.lon), lat, lon);
        if (!best || distance < best.distance) best = { id: en.id, distance: distance };
      });
      if (best) return best.id;
    }
    return list.length ? list[0].id : "ENT1";
  }

  function initBIndoor() {
    var d = bBuildingData();
    if (!d || !els.bRoomSelect) return false;

    /* 8 个入口：文本 = 名称 + 所在楼层 */
    if (els.bEntranceSelect && !els.bEntranceSelect.options.length) {
      d.entrances.forEach(function (en) {
        var opt = document.createElement("option");
        opt.value = en.id;
        opt.textContent = en.name + " · " + en.floor;
        els.bEntranceSelect.appendChild(opt);
      });
    }

    /* 80 间教室：按楼层 optgroup，value = 室内节点，文本 = 教室号（含 N4/N5） */
    if (!els.bRoomSelect.options.length) {
      var floors = d.floors || [];
      var floorName = {};
      var roomsByFloor = {};
      var floorOrder = [];
      floors.forEach(function (f) {
        floorName[f.id] = f.name || f.id;
        if (!roomsByFloor[f.id]) {
          roomsByFloor[f.id] = [];
          floorOrder.push(f.id);
        }
      });
      d.rooms.forEach(function (room) {
        var key = room.floor || "未分楼层";
        if (!roomsByFloor[key]) {
          roomsByFloor[key] = [];
          floorOrder.push(key);
        }
        roomsByFloor[key].push(room);
      });
      floorOrder.forEach(function (key) {
        var floorRooms = roomsByFloor[key];
        if (!floorRooms || !floorRooms.length) return;
        var group = document.createElement("optgroup");
        group.label = floorName[key] || key;
        floorRooms.forEach(function (room) {
          var opt = document.createElement("option");
          opt.value = room.node;
          opt.textContent = room.id;
          group.appendChild(opt);
        });
        els.bRoomSelect.appendChild(group);
      });
    }

    return els.bRoomSelect.options.length > 0 &&
      (!els.bEntranceSelect || els.bEntranceSelect.options.length > 0);
  }

  function findBRoom(node) {
    var d = bBuildingData();
    if (!d || !node) return null;
    var hit = null;
    d.rooms.forEach(function (room) {
      if (room.node === node) hit = room;
    });
    return hit;
  }

  function refreshIndoor() {
    var endBuildingId = state.end && state.end.kind === "poi" ? state.end.id : null;

    if (endBuildingId === "B") {
      state.indoorBuilding = null;
      state.indoorEntry = null;
      state.floor = null;
      if (els.indoorBar) els.indoorBar.classList.remove("show");
      if (els.indoorFloor) els.indoorFloor.innerHTML = "";
      if (els.imFloor) els.imFloor.innerHTML = "";
      if (els.indoorNew) els.indoorNew.removeAttribute("href");
      if (els.imNew) els.imNew.setAttribute("href", "#");
      clearIframe();
      closeIndoorModal();
      /* 选项由新模型数据懒加载；入口未手动改过时按起点就近选择 */
      initBIndoor();
      if (els.bIndoorBar) els.bIndoorBar.classList.add("show");
      if (els.bEntranceSelect && !bEntranceTouched) {
        els.bEntranceSelect.value = defaultBEntrance();
      }
      updateRouteKind();
      return;
    }
    if (els.bIndoorBar) els.bIndoorBar.classList.remove("show");
    bEntranceTouched = false;

    var entry = currentIndoorEntry();
    if (!entry) {
      hideIndoor();
      return;
    }

    var buildingId = state.end.id;
    if (state.indoorBuilding !== buildingId) {
      state.indoorBuilding = buildingId;
      state.indoorEntry = entry;
      var preferred = state.pendingFloor || state.floor;
      state.pendingFloor = null;
      state.floor = validFloor(entry, preferred) ? preferred : entry.defaultFloor;
      fillFloorSelects(entry, state.floor);
      closeIndoorModal();
      clearIframe();
    } else {
      state.indoorEntry = entry;
      if (!validFloor(entry, state.floor)) {
        state.floor = entry.defaultFloor;
        fillFloorSelects(entry, state.floor);
      }
    }

    if (els.indoorTitle) els.indoorTitle.textContent = entry.name;
    if (els.indoorSub) {
      els.indoorSub.textContent = "室内图 · 房间搜索 / 热点 · " + (entry.floors || []).length + " 层";
    }
    updateIndoorLinks();
    if (els.indoorBar) els.indoorBar.classList.add("show");
    updateRouteKind();
  }

  function openIndoorModal() {
    var entry = state.indoorEntry;
    if (!entry || !state.indoorBuilding) return;
    var url = buildIndoorUrl(state.indoorBuilding, state.floor);
    if (!url) {
      toast("该楼栋暂无外部室内页");
      return;
    }
    if (els.imTitle) els.imTitle.textContent = entry.name + " · 室内图";
    if (els.imSub) {
      els.imSub.textContent = "campus-map-site · " + floorLabel(entry, state.floor) + " · 房间搜索 / 热点 · 需要联网";
    }
    updateIndoorLinks();
    if (els.imFrame) els.imFrame.src = url;
    if (els.indoorModal) {
      els.indoorModal.classList.add("open");
      els.indoorModal.setAttribute("aria-hidden", "false");
    }
    if (els.imClose) els.imClose.focus();
  }

  function onFloorChange(value) {
    var entry = state.indoorEntry;
    if (!entry) return;
    var floorId = validFloor(entry, value) ? value : entry.defaultFloor;
    state.floor = floorId;
    if (els.indoorFloor) els.indoorFloor.value = floorId;
    if (els.imFloor) els.imFloor.value = floorId;
    updateIndoorLinks();

    var url = buildIndoorUrl(state.indoorBuilding, floorId);
    if (url && els.indoorModal && els.indoorModal.classList.contains("open")) {
      if (els.imFrame) els.imFrame.src = url;
      if (els.imSub) {
        els.imSub.textContent = "campus-map-site · " + floorLabel(entry, floorId) + " · 房间搜索 / 热点 · 需要联网";
      }
    }
    scheduleUrlSync();
  }

  /* ---------------- URL ---------------- */
  function readUrlParams() {
    var out = {};
    function absorb(raw) {
      var s = String(raw == null ? "" : raw).replace(/^[?#]/, "");
      if (!s) return;
      try {
        new URLSearchParams(s).forEach(function (value, key) {
          if (key && !(key in out)) out[key] = value;
        });
      } catch (err) { /* 忽略非法查询串 */ }
    }
    absorb(window.location.search);
    absorb(window.location.hash);
    return out;
  }

  function normalizeFloor(raw) {
    var m = /^([1-9][0-9]?)\s*F?$/i.exec(String(raw == null ? "" : raw).trim());
    return m ? m[1] + "F" : null;
  }

  function endpointFromParam(raw) {
    if (!raw) return null;
    var v = String(raw).trim();
    var em = /^ENT_(.+)$/i.exec(v);
    if (em) v = em[1];
    var poi = poiById[v] || poiByLowerId[v.toLowerCase()];
    if (poi) return poiEndpoint(poi);

    /* 兼容地图点选：from=108.840012,34.122451 */
    var m = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(v);
    if (m) {
      var lon = parseFloat(m[1]);
      var lat = parseFloat(m[2]);
      if (isFinite(lon) && isFinite(lat) &&
          Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        return pointEndpoint(L.latLng(lat, lon));
      }
    }
    return null;
  }

  function applyUrlParams() {
    var params = readUrlParams();
    if (params.floor) {
      var floor = normalizeFloor(params.floor);
      if (floor) state.pendingFloor = floor;
    }
    var from = endpointFromParam(params.from);
    var to = endpointFromParam(params.to);
    if (params.from && !from) toast("无法识别起点参数：" + params.from);
    if (params.to && !to) toast("无法识别终点参数：" + params.to);
    if (from) state.start = from;
    if (to) state.end = to;
    state.active = from && !to ? "end" : "start";
    return !!(from || to);
  }

  function paramOf(ep) {
    if (!ep) return "";
    if (ep.kind === "poi") return ep.id;
    return Number(ep.lon).toFixed(6) + "," + Number(ep.lat).toFixed(6);
  }

  function urlSignature() {
    var from = state.start ? paramOf(state.start) : "";
    var to = state.end ? paramOf(state.end) : "";
    var floor = state.indoorEntry && state.floor ? state.floor : "";
    return from + "|" + to + "|" + floor;
  }

  function syncUrl() {
    var sig = urlSignature();
    if (sig === lastUrlSig) return;
    lastUrlSig = sig;

    var q;
    try {
      q = new URLSearchParams(window.location.search);
    } catch (err) {
      q = null;
    }
    if (!q) return;

    var from = state.start ? paramOf(state.start) : "";
    var to = state.end ? paramOf(state.end) : "";
    var floor = state.indoorEntry && state.floor ? state.floor : "";

    if (from) q.set("from", from); else q.delete("from");
    if (to) q.set("to", to); else q.delete("to");
    if (floor) q.set("floor", floor); else q.delete("floor");

    var qs = q.toString();
    try {
      /* http(s) 下写回查询串；复制地址即可分享 */
      history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
    } catch (err) {
      /* file:// 下 Chrome/Edge 可能禁止 replaceState：退化为 hash，仍可分享 */
      try {
        window.location.hash = qs ? "#" + qs : "";
      } catch (err2) { /* 忽略 */ }
    }
  }

  function scheduleUrlSync() {
    clearTimeout(urlTimer);
    urlTimer = setTimeout(syncUrl, 80);
  }

  /* ---------------- 交互事件 ---------------- */
  function bindEvents() {
    var clickTimer = null;
    var pendingLatLng = null;

    function pickAt(latlng) {
      var which = state.active === "end" ? "end" : "start";
      var hit = nearestPoi(latlng);
      if (hit) {
        if (hit.distance > 1) {
          toast("已吸附到 " + hit.poi.name + " · 偏移 " + Math.round(hit.distance) + " m");
        }
        setEndpoint(which, poiEndpoint(hit.poi));
      } else {
        setEndpoint(which, pointEndpoint(latlng));
      }
    }

    map.on("click", function (e) {
      /* 双击放大时 Leaflet 会先发两次 click；250ms 去抖，避免误清路线 */
      pendingLatLng = e.latlng;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(function () {
        if (pendingLatLng) pickAt(pendingLatLng);
      }, 250);
    });

    map.on("mousemove", function (e) {
      if (els.coord) {
        els.coord.textContent = "WGS-84 " +
          e.latlng.lng.toFixed(6) + ", " + e.latlng.lat.toFixed(6);
      }
    });

    window.addEventListener("resize", function () {
      if (!map) return;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () { map.invalidateSize(); }, 120);
    });

    function bindCard(card, which) {
      if (!card) return;
      card.addEventListener("click", function (e) {
        var tag = e.target && e.target.tagName;
        if (tag === "SELECT" || tag === "OPTION") return;
        state.active = which;
        updateEndpointCards();
      });
    }
    bindCard(els.startCard, "start");
    bindCard(els.endCard, "end");

    if (els.startSelect) {
      els.startSelect.addEventListener("change", function () {
        var poi = poiById[els.startSelect.value];
        if (!poi) { updateEndpointCards(); return; }
        setEndpoint("start", poiEndpoint(poi), { keepActive: true });
      });
    }
    if (els.endSelect) {
      els.endSelect.addEventListener("change", function () {
        var poi = poiById[els.endSelect.value];
        if (!poi) { updateEndpointCards(); return; }
        setEndpoint("end", poiEndpoint(poi), { keepActive: true });
      });
    }

    if (els.btnSwap) {
      els.btnSwap.addEventListener("click", function () {
        if (!state.start && !state.end) {
          toast("请先选择起点或终点");
          return;
        }
        var tmp = state.start;
        state.start = state.end;
        state.end = tmp;
        state.active = "start";
        afterEndpointsChanged();
      });
    }

    if (els.btnReset) {
      els.btnReset.addEventListener("click", function () {
        state.start = null;
        state.end = null;
        state.active = "start";
        state.pendingFloor = null;
        resetRouteView();
        hideIndoor();
        updateEndpointCards();
        drawEndpointDots();
        updatePoiStates();
        scheduleUrlSync();
        toast("已清除，点击地图重新选择");
      });
    }

    if (els.btnIndoor) els.btnIndoor.addEventListener("click", openIndoorModal);
    if (els.btnBIndoor) {
      els.btnBIndoor.addEventListener("click", function () {
        var d = bBuildingData();
        if (!d) {
          toast("B 楼数据未加载，请检查 b-package/assets/b-building-data.js");
          return;
        }
        var entrance = els.bEntranceSelect ? els.bEntranceSelect.value : "";
        var roomNode = els.bRoomSelect ? els.bRoomSelect.value : "";
        if (!entrance) { toast("请先选择 B 楼入口"); return; }
        if (!roomNode) { toast("请先选择 B 楼教室"); return; }
        var room = findBRoom(roomNode);
        if (!room) { toast("B 楼未找到该教室数据，请刷新重试"); return; }
        window.open(
          "b-package/3d.html?from=" + encodeURIComponent(entrance) +
            "&to=" + encodeURIComponent(room.node) +
            "&floor=" + encodeURIComponent(room.floor),
          "_blank",
          "noopener"
        );
      });
    }
    if (els.bEntranceSelect) {
      els.bEntranceSelect.addEventListener("change", function () {
        /* 用户手动选过入口后，刷新起终点不再覆盖 */
        bEntranceTouched = true;
      });
    }
    if (els.imClose) els.imClose.addEventListener("click", closeIndoorModal);
    if (els.indoorModal) {
      els.indoorModal.addEventListener("click", function (e) {
        if (e.target === els.indoorModal) closeIndoorModal();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" || e.keyCode === 27) closeIndoorModal();
    });

    if (els.indoorFloor) {
      els.indoorFloor.addEventListener("change", function () {
        onFloorChange(els.indoorFloor.value);
      });
    }
    if (els.imFloor) {
      els.imFloor.addEventListener("change", function () {
        onFloorChange(els.imFloor.value);
      });
    }
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    initMap();
    initPoiMarkers();
    initBIndoor();
    initEndpointUi();
    bindEvents();

    var hadParams = applyUrlParams();
    if (!hadParams && !state.start && !state.end && poiById.GATE && poiById.A) {
      state.start = poiEndpoint(poiById.GATE);
      state.end = poiEndpoint(poiById.A);
      state.active = "start";
    }
    updateEndpointCards();
    updatePoiStates();
    drawEndpointDots();
    refreshIndoor();

    if (state.start && state.end) computeRoute();
    else if (hadParams) scheduleUrlSync();
  }

  try {
    boot();
  } catch (err) {
    if (window.console && console.error) console.error("[real-map] 初始化失败", err);
    showBootError("地图初始化失败：" + (err && err.message ? err.message : "未知错误"));
  }
})();
