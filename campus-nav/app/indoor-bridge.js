/* 室外 → 外部室内页 的桥接
 * 依赖：window.CAMPUS、window.INDOOR_PROVIDERS、window.NAV_APP（main.js 末尾暴露）
 * 外部室内页深链：#<楼栋>/<楼层>，由 assets/indoor-providers.js 统一生成。
 * B 栋被 INDOOR_PROVIDERS.excluded 排除，本桥不会为 B 栋打开外部室内页。
 */
(function () {
  "use strict";

  var P = window.INDOOR_PROVIDERS;
  if (!P) return;

  var tries = 0;
  var timer = setInterval(tryInit, 200);

  function $(id) { return document.getElementById(id); }

  function tryInit() {
    tries++;
    var app = window.NAV_APP;
    var C = window.CAMPUS;
    var bar = $("indoorBar");
    if (!app || !C || !bar) {
      if (tries > 200) {
        console.error("[indoor-bridge] NAV_APP 未就绪，超时放弃");
        clearInterval(timer);
      }
      return;
    }
    clearInterval(timer);
    setup(app, C, bar);
  }

  function setup(app, C, bar) {
    var els = {
      bar: bar,
      title: $("indoorTitle"),
      sub: $("indoorSub"),
      floor: $("indoorFloor"),
      open: $("btnIndoor"),
      newTab: $("indoorNew"),
      modal: $("indoorModal"),
      imTitle: $("imTitle"),
      imSub: $("imSub"),
      imFloor: $("imFloor"),
      imNew: $("imNew"),
      imClose: $("imClose"),
      imFrame: $("imFrame")
    };
    if (!els.title || !els.floor || !els.open || !els.modal || !els.imFrame) return;

    var current = { building: null, entry: null, floor: null };
    var pendingFloor = readParam("floor");
    var lastSig = "";
    var bNoticeShown = false;

    /* ---------- 基础查找 ---------- */
    function buildingByEnd(end) {
      if (!end) return null;
      var nodeId = end.nodeId;
      var byNode = C.buildings.find(function (b) { return b.node === nodeId; });
      if (byNode) return byNode;
      var byId = C.buildings.find(function (b) { return b.id === nodeId; });
      return byId || null;
    }

    function entryOf(building) {
      return building ? P.get(building.id) : null;
    }

    function floorLabel(entry, id) {
      var f = (entry.floors || []).find(function (x) { return x.id === id; });
      return f ? f.label : id;
    }

    function option(value, text) {
      var o = document.createElement("option");
      o.value = value;
      o.textContent = text;
      return o;
    }

    /* ---------- 楼层下拉 ---------- */
    function fillFloors(entry, preferred) {
      var value = preferred;
      if (!value || !entry.floors.some(function (f) { return f.id === value; })) {
        value = entry.defaultFloor;
      }
      [els.floor, els.imFloor].forEach(function (sel) {
        if (!sel) return;
        sel.innerHTML = "";
        entry.floors.forEach(function (f) { sel.appendChild(option(f.id, f.label)); });
        sel.value = value;
      });
      current.floor = value;
      return value;
    }

    /* ---------- 打开/关闭 ---------- */
    function urlFor(building, floor) {
      return P.buildUrl(building.id, floor);
    }

    function syncLinks(building, floor) {
      var url = urlFor(building, floor);
      if (!url) return;
      if (els.newTab) els.newTab.href = url;
      if (els.imNew) els.imNew.href = url;
    }

    function openIndoor() {
      if (!current.building || !current.entry) return;
      var url = urlFor(current.building, current.floor);
      if (!url) return;
      els.imTitle.textContent = current.entry.name + " · 室内图";
      els.imSub.textContent = "campus-map-site · " + floorLabel(current.entry, current.floor) + " · 需要联网";
      els.imFrame.src = url;
      syncLinks(current.building, current.floor);
      els.modal.classList.add("open");
      els.modal.setAttribute("aria-hidden", "false");
      if (els.imClose) els.imClose.focus();
    }

    function closeIndoor() {
      els.modal.classList.remove("open");
      els.modal.setAttribute("aria-hidden", "true");
    }

    /* ---------- 刷新状态 ---------- */
    function refresh() {
      var end = app.state && app.state.end;
      var b = buildingByEnd(end);
      var entry = entryOf(b);

      if (!b) {
        hideBar();
        return;
      }

      if (b.id === "B") {
        hideBar();
        if (!bNoticeShown) {
          bNoticeShown = true;
          toast("B 栋室内不在本次外部对接范围");
        }
        return;
      }

      if (!entry) {
        hideBar();
        return;
      }

      var changed = !current.building || current.building.id !== b.id;
      current.building = b;
      current.entry = entry;

      if (changed) {
        fillFloors(entry, pendingFloor);
        pendingFloor = null;
        closeIndoor();
        if (els.imFrame) els.imFrame.removeAttribute("src");
      } else if (!current.floor) {
        fillFloors(entry, null);
      }

      els.title.textContent = entry.name;
      els.sub.textContent = "室内图 · 外部页面 · " + (b.floors ? b.floors + " 层" : "");
      syncLinks(b, current.floor);
      els.bar.classList.add("show");
    }

    function hideBar() {
      current.building = null;
      current.entry = null;
      current.floor = null;
      if (els.bar) els.bar.classList.remove("show");
      if (els.newTab) els.newTab.removeAttribute("href");
      if (els.imNew) els.imNew.setAttribute("href", "#");
      if (els.imFrame) els.imFrame.removeAttribute("src");
      closeIndoor();
    }

    /* ---------- 事件 ---------- */
    els.open.addEventListener("click", openIndoor);
    if (els.imClose) els.imClose.addEventListener("click", closeIndoor);
    if (els.modal) {
      els.modal.addEventListener("click", function (e) {
        if (e.target === els.modal) closeIndoor();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeIndoor();
    });

    function onFloorChange(e) {
      var v = e.target.value;
      current.floor = v;
      if (els.floor) els.floor.value = v;
      if (els.imFloor) els.imFloor.value = v;
      syncLinks(current.building, v);
      if (els.modal.classList.contains("open")) {
        els.imFrame.src = urlFor(current.building, v);
      }
      syncUrl();
    }
    els.floor.addEventListener("change", onFloorChange);
    if (els.imFloor) els.imFloor.addEventListener("change", onFloorChange);

    /* ---------- URL 参数 ---------- */
    function readParam(name) {
      try {
        var q = new URLSearchParams(window.location.search);
        if (q.has(name)) return q.get(name);
        var h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        return h.get(name);
      } catch (e) {
        return null;
      }
    }

    function resolveNode(raw) {
      if (!raw) return null;
      var byNode = C.nodes.find(function (n) { return n.id.toLowerCase() === String(raw).toLowerCase(); });
      if (byNode) return byNode.id;
      var byBuilding = C.buildings.find(function (b) { return b.id.toLowerCase() === String(raw).toLowerCase(); });
      if (byBuilding) return byBuilding.node;
      return null;
    }

    function applyUrlParams() {
      var fromRaw = readParam("from");
      var toRaw = readParam("to");
      if (!fromRaw && !toRaw) return;
      var fromId = fromRaw ? resolveNode(fromRaw) : null;
      var toId = toRaw ? resolveNode(toRaw) : null;

      if (fromId) {
        app.setEndpoint("start", app.nodeSelection(fromId, nodeLabel(C.nodes.find(function (n) { return n.id === fromId; })), 0));
      }
      if (toId) {
        app.setEndpoint("end", app.nodeSelection(toId, nodeLabel(C.nodes.find(function (n) { return n.id === toId; })), 0));
      }
      if (fromId && toId) app.computeRoute();
    }

    function nodeLabel(n) {
      if (!n) return "";
      var b = C.buildings.find(function (x) { return x.node === n.id; });
      return b ? b.name : n.name;
    }

    function syncUrl() {
      var s = app.state && app.state.start;
      var e = app.state && app.state.end;
      if (!s || !e) return;
      var sig = s.nodeId + "|" + e.nodeId + "|" + (current.floor || "");
      if (sig === lastSig) return;
      lastSig = sig;
      try {
        var p = new URLSearchParams(window.location.search);
        p.set("from", s.nodeId);
        p.set("to", e.nodeId);
        if (current.building && current.floor) p.set("floor", current.floor);
        else p.delete("floor");
        history.replaceState(null, "", window.location.pathname + "?" + p.toString());
      } catch (err) {
        // file:// 下 Chrome/Edge 可能禁止 replaceState：退化为 hash，仍可复制分享
        try {
          var hp = new URLSearchParams();
          hp.set("from", s.nodeId);
          hp.set("to", e.nodeId);
          if (current.building && current.floor) hp.set("floor", current.floor);
          window.location.hash = "#" + hp.toString();
        } catch (err2) { /* 忽略 */ }
      }
    }

    /* ---------- toast（优先复用主页面，避免两个定时器互抢） ---------- */
    function toast(msg) {
      if (app && typeof app.toast === "function") { app.toast(msg); return; }
      var t = $("toast");
      if (!t) return;
      t.textContent = msg;
      t.classList.add("show");
      clearTimeout(toast._timer);
      toast._timer = setTimeout(function () { t.classList.remove("show"); }, 2600);
    }

    /* ---------- 启动 ---------- */
    // main.js 默认已设 GATE→ENT_A；先应用 URL 参数
    applyUrlParams();
    refresh();

    // 监听主程序状态变化（点击选点/下拉/交换/清除都会改 state）
    var lastKey = "";
    setInterval(function () {
      var s = app.state && app.state.start;
      var e = app.state && app.state.end;
      var key = (s ? s.nodeId : "-") + ">" + (e ? e.nodeId : "-");
      if (key !== lastKey) {
        lastKey = key;
        refresh();
        if (s && e) syncUrl();
      }
    }, 250);

    // 楼层变化在 onFloorChange 内统一同步 URL

    window.INDOOR_BRIDGE = {
      refresh: refresh,
      open: openIndoor,
      close: closeIndoor,
      building: function () { return current.building; },
      url: function () { return current.building ? urlFor(current.building, current.floor) : null; }
    };
  }
})();
