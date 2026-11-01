/* B楼室内图纸页：真实楼层图 + 教室列表 + 入口提示 */
(function () {
  "use strict";

  var B = window.B_BUILDING;
  if (!B) {
    document.body.innerHTML = '<p style="color:#fff;padding:40px">data/b-building.js 未加载</p>';
    return;
  }

  var $ = function (id) { return document.getElementById(id); };
  var state = { floor: "overview", room: null, zoomed: false };
  var floorsById = {};
  B.floors.forEach(function (f) { floorsById[f.id] = f; });

  function floorOf(room) {
    var n = parseInt(room, 10);
    return isFinite(n) ? Math.floor(n / 100) : null;
  }

  function groupForRoom(room) {
    var r = parseInt(room, 10);
    for (var i = 0; i < B.groups.length; i++) {
      if (B.groups[i].rooms.indexOf(r) >= 0) return B.groups[i];
    }
    return null;
  }

  function hintForRoom(room) {
    var f = floorOf(room);
    var g = groupForRoom(room);
    if (g) {
      return "建议从 " + g.label + " 进入，上到 " + f + " 层；具体教室位置以楼层图为准。";
    }
    return "从任一入口进入后上到 " + f + " 层；具体教室位置以楼层图为准。";
  }

  function renderFloorTabs() {
    var host = $("floorTabs");
    host.innerHTML = "";
    var all = [{ id: "overview", label: "总览" }].concat(B.floors);
    all.forEach(function (f) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = f.label;
      b.setAttribute("data-floor", f.id);
      b.addEventListener("click", function () { showFloor(f.id); });
      host.appendChild(b);
    });
  }

  function renderRooms(floor) {
    var host = $("roomList");
    host.innerHTML = "";
    if (!floor) {
      host.innerHTML = '<div class="empty">选择楼层查看教室</div>';
      $("floorNote").textContent = "";
      $("roomCount").textContent = "";
      return;
    }
    $("floorNote").textContent = floor.rooms.length + " 间";
    $("roomCount").textContent = B.floors.length + " 层";
    floor.rooms.forEach(function (room) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "room-chip" + (state.room === room ? " active" : "");
      chip.textContent = room;
      chip.addEventListener("click", function () { selectRoom(room); });
      host.appendChild(chip);
    });
  }

  function selectRoom(room) {
    state.room = room;
    var f = floorOf(room);
    var floor = floorsById[String(f)];
    if (floor && state.floor !== String(f)) {
      showFloor(String(f), room);
      return;
    }
    document.querySelectorAll(".room-chip").forEach(function (c) {
      c.classList.toggle("active", parseInt(c.textContent, 10) === parseInt(room, 10));
    });
    var el = $("roomInfo");
    el.innerHTML = "<b>" + room + "</b> · " + f + " 层<br><span class=\"hint\">" +
      hintForRoom(room) + "</span>";
    syncUrl();
  }

  function showFloor(id, room) {
    state.floor = id;
    state.room = room || null;
    state.zoomed = false;
    $("imageWrap").classList.remove("zoomed");
    $("btnZoom").textContent = "放大";

    document.querySelectorAll("#floorTabs button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-floor") === id);
    });

    var img = $("planImage");
    if (id === "overview") {
      img.src = B.overviewImage;
      img.alt = "B楼教室分布总览";
      $("viewerTitle").textContent = "B楼总览";
      $("viewerSub").textContent = "南楼 + 北楼 · 7 层教室分布";
      renderRooms(null);
      $("roomInfo").textContent = "点击左侧楼层查看该层平面图；点击教室查看入口提示。";
      $("roomCount").textContent = "约 " + B.floors.reduce(function (n, f) { return n + f.rooms.length; }, 0) + " 间";
    } else {
      var floor = floorsById[id];
      if (!floor) return;
      img.src = floor.image;
      img.alt = "B楼" + floor.label + "平面图";
      $("viewerTitle").textContent = "B楼 · " + floor.label;
      $("viewerSub").textContent = floor.rooms.length + " 间教室 · 点击教室查看入口提示";
      renderRooms(floor);
      if (room) selectRoom(room);
      else $("roomInfo").textContent = "点击左侧教室查看入口提示；点击图片可放大查看。";
    }
    syncUrl();
  }

  function renderEntrances() {
    var host = $("entranceList");
    host.innerHTML = "";
    B.groups.forEach(function (g) {
      var row = document.createElement("div");
      row.className = "entrance-item";
      row.innerHTML = "<span>" + g.label + "</span><span class=\"count\">" + g.rooms.length + " 间</span>";
      row.addEventListener("click", function () {
        var first = g.rooms[0];
        showFloor(String(floorOf(first)), first);
      });
      host.appendChild(row);
    });
  }

  function syncUrl() {
    try {
      var q = new URLSearchParams(window.location.search);
      if (state.floor && state.floor !== "overview") q.set("floor", state.floor);
      else q.delete("floor");
      if (state.room) q.set("room", state.room);
      else q.delete("room");
      history.replaceState(null, "", window.location.pathname + (q.toString() ? "?" + q.toString() : ""));
    } catch (e) { /* file:// 下忽略 */ }
  }

  function readParams() {
    try {
      var q = new URLSearchParams(window.location.search);
      var floor = q.get("floor");
      var room = q.get("room");
      if (floor && floorsById[floor]) showFloor(floor, room ? parseInt(room, 10) : null);
      else showFloor("overview");
    } catch (e) {
      showFloor("overview");
    }
  }

  function bindUi() {
    var img = $("planImage");
    img.addEventListener("load", function () {
      var l = $("loading");
      if (l) l.classList.add("hide");
      window.__B_READY__ = true;
    });
    img.addEventListener("error", function () {
      var l = $("loading");
      if (l) {
        l.classList.remove("hide");
        l.textContent = "楼层图加载失败，请检查 assets/b-floorplans/ 下的图片";
      }
    });
    img.addEventListener("click", function () {
      state.zoomed = !state.zoomed;
      $("imageWrap").classList.toggle("zoomed", state.zoomed);
      $("btnZoom").textContent = state.zoomed ? "缩小" : "放大";
    });
    $("btnZoom").addEventListener("click", function () {
      state.zoomed = !state.zoomed;
      $("imageWrap").classList.toggle("zoomed", state.zoomed);
      this.textContent = state.zoomed ? "缩小" : "放大";
    });
    setTimeout(function () {
      var l = $("loading");
      if (l && !window.__B_READY__) l.classList.add("hide");
    }, 2500);
  }

  renderFloorTabs();
  renderEntrances();
  bindUi();
  readParams();
})();
