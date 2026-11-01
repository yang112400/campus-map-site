/* global L, FLOORPLAN */

const TYPE_LABEL = {
  classroom: "教室",
  room: "房间",
  office: "办公室",
  rest: "休息室",
  toilet: "卫生间",
  stairs: "楼梯 / 安全通道",
};

const CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

const state = {
  data: null,
  building: null,
  floor: null,
  map: null,
  imageLayer: null,
  roomGroup: null,
  roomLayers: new Map(),
  selectedRoom: null,
  hotspots: true,
  pendingRoom: null,
  startRef: null,
  endRef: null,
  routeLayer: null,
  routeResult: null,
};

const $ = (id) => document.getElementById(id);

function floorLabel(floor) {
  const n = parseInt(floor.id, 10);
  return Number.isFinite(n) ? `${CN_NUM[n] || n}层` : floor.name;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function initMap() {
  state.map = L.map("viewer", {
    crs: L.CRS.Simple,
    minZoom: -4,
    maxZoom: 3,
    zoomSnap: 0.1,
    zoomDelta: 0.25,
    attributionControl: false,
    zoomControl: false,
  });
  L.control.zoom({ position: "bottomright" }).addTo(state.map);
  state.roomGroup = L.layerGroup().addTo(state.map);
}

function currentBounds() {
  return L.latLngBounds([[0, 0], [state.floor.height, state.floor.width]]);
}

function rectToBounds(rect) {
  const [nx, ny, nw, nh] = rect;
  const width = state.floor.width;
  const height = state.floor.height;
  const west = nx * width;
  const east = (nx + nw) * width;
  const north = height - ny * height;
  const south = height - (ny + nh) * height;
  return L.latLngBounds([[south, west], [north, east]]);
}

function renderBuildingTabs() {
  const host = $("buildingTabs");
  host.innerHTML = "";
  for (const building of state.data.buildings) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "building-tab" + (building.id === state.building.id ? " active" : "");
    btn.innerHTML = `<strong>${escapeHtml(building.name)}</strong><span>${escapeHtml(building.alias || "")}</span>`;
    btn.addEventListener("click", () => selectBuilding(building.id));
    host.appendChild(btn);
  }
  $("buildingCount").textContent = `${state.data.buildings.length} 栋`;
}

function renderFloorButtons() {
  const host = $("floorGrid");
  host.innerHTML = "";
  $("floorCount").textContent = `${state.building.floors.length} 个楼层`;
  for (const floor of state.building.floors) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "floor-btn" + (floor.id === state.floor.id ? " active" : "");
    btn.dataset.floor = floor.id;
    btn.textContent = floorLabel(floor);
    btn.addEventListener("click", () => selectFloor(floor.id));
    host.appendChild(btn);
  }
}

function selectBuilding(buildingId, floorId = null) {
  const building = state.data.buildings.find((b) => b.id === buildingId);
  if (!building) return;
  const sameBuilding = state.building && state.building.id === buildingId;
  state.building = building;
  renderBuildingTabs();
  const targetId = floorId || (sameBuilding && state.floor ? state.floor.id : building.floors[0].id);
  state.floor = building.floors.find((f) => f.id === targetId) || building.floors[0];
  renderFloorButtons();
  loadFloor();
}

function selectFloor(floorId) {
  const floor = state.building.floors.find((f) => f.id === floorId);
  if (!floor) return;
  state.floor = floor;
  document.querySelectorAll(".floor-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.floor === floorId);
  });
  loadFloor();
}

function loadFloor() {
  const floor = state.floor;
  const building = state.building;

  if (state.imageLayer) {
    state.map.removeLayer(state.imageLayer);
    state.imageLayer = null;
  }
  state.roomGroup.clearLayers();
  state.roomLayers.clear();
  state.selectedRoom = null;

  state.map.setMaxBounds(null);
  const bounds = currentBounds();

  state.imageLayer = L.imageOverlay(floor.image, bounds, {
    className: "floor-image",
    alt: `${building.name} ${floorLabel(floor)}平面图`,
  }).addTo(state.map);

  state.map.fitBounds(bounds, { padding: [24, 24] });
  state.map.setMaxBounds(bounds.pad(0.35));

  for (const room of floor.rooms) {
    if (room.rect) addRoomLayer(room);
  }

  history.replaceState(null, "", `#${building.id}/${floor.id}`);
  $("viewerBadge").textContent = `${building.name} · ${floorLabel(floor)}`;
  const backValue = encodeURIComponent(`../index.html#${building.id}/${floor.id}`);
  const bNavBanner = $("bNavBanner");
  if (bNavBanner) {
    bNavBanner.hidden = building.id !== "B";
    bNavBanner.href = `b-navigation/index.html?back=${backValue}`;
  }
  const bNavTopLink = document.querySelector(".b-nav-toplink");
  if (bNavTopLink) bNavTopLink.href = `b-navigation/index.html?back=${backValue}`;
  renderRoomList();
  setInfo(null);

  // 切层后把本层那段路线画回来
  drawRouteParts();

  if (state.pendingRoom) {
    const pending = state.pendingRoom;
    state.pendingRoom = null;
    requestAnimationFrame(() => selectRoom(pending));
  }
}

function addRoomLayer(room) {
  const isStair = room.type === "stairs";
  const base = isStair
    ? { color: "#15803d", fillColor: "#22c55e", fillOpacity: 0.22, weight: 2.5 }
    : { color: "#1d4ed8", fillColor: "#3b82f6", fillOpacity: 0.14, weight: 2.5 };
  const layer = L.rectangle(rectToBounds(room.rect), { ...base, className: "room-rect" });

  layer.bindTooltip(room.name, { sticky: true, direction: "top", className: "room-tip", opacity: 1 });
  layer.bindPopup(
    `<div class="popup-title">${escapeHtml(room.name)}</div>` +
    `<div class="popup-sub">${escapeHtml(state.building.name)} · ${floorLabel(state.floor)} · ${TYPE_LABEL[room.type] || "房间"}</div>`,
    { closeButton: false, offset: [0, -4] }
  );

  layer.on("mouseover", () => {
    if (state.selectedRoom !== room) layer.setStyle({ fillOpacity: isStair ? 0.42 : 0.38, weight: 3.2 });
  });
  layer.on("mouseout", () => {
    if (state.selectedRoom !== room) layer.setStyle(base);
  });
  layer.on("click", (event) => {
    L.DomEvent.stopPropagation(event);
    selectRoom(room);
  });

  layer.addTo(state.roomGroup);
  state.roomLayers.set(room, layer);
}

function selectRoom(room) {
  state.selectedRoom = room;
  for (const layer of state.roomLayers.values()) {
    layer.setStyle({ color: "#1d4ed8", weight: 2.5, fillColor: "#3b82f6", fillOpacity: 0.14 });
  }
  const layer = state.roomLayers.get(room);
  if (layer) {
    layer.setStyle({ color: "#f97316", weight: 3, fillColor: "#fb923c", fillOpacity: 0.32 });
    layer.bringToFront();
    state.map.fitBounds(layer.getBounds(), { padding: [110, 110], maxZoom: 1.5 });
    layer.openPopup();
  } else {
    state.map.fitBounds(currentBounds(), { padding: [24, 24] });
  }
  setInfo(room);
  updateRoomListSelection(room);
}

function setInfo(room) {
  const host = $("infoCard");
  if (!room) {
    host.innerHTML = `<h3>房间信息</h3><p class="muted">点击平面图中的房间，或搜索房间号。</p>`;
    return;
  }
  const backValue = encodeURIComponent(`../index.html#${state.building.id}/${state.floor.id}`);
  const bNavCta = state.building.id === "B" && room.type === "classroom" && room.rect
    ? `<a class="b-nav-cta" href="b-navigation/index.html?back=${backValue}&amp;end=${encodeURIComponent(`${state.floor.id}:${room.name}`)}&amp;show=end"><span>在 B 栋导航中打开</span><span>→</span></a>`
    : "";
  host.innerHTML = `
    <h3>房间信息</h3>
    <div class="info-room-name">${escapeHtml(room.name)}</div>
    <div class="info-meta">
      <span class="info-pill">${escapeHtml(state.building.name)} · ${floorLabel(state.floor)}</span>
      <span class="info-pill">${TYPE_LABEL[room.type] || "房间"}</span>
    </div>
    <p class="info-note">${room.rect
      ? "已定位到房间热点；橙色框为当前选中房间。"
      : "该房间暂无热点坐标。"}</p>
    ${bNavCta}
  `;
}

function renderRoomList() {
  const host = $("roomList");
  host.innerHTML = "";
  const rooms = state.floor.rooms || [];
  $("roomCount").textContent = `${rooms.length} 间`;
  if (!rooms.length) {
    host.innerHTML = '<p class="muted">本层暂无房间数据。</p>';
    return;
  }
  for (const room of rooms) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "room-chip";
    btn.dataset.roomName = room.name;
    btn.textContent = room.name;
    btn.title = `${state.building.name} · ${floorLabel(state.floor)} · ${room.name}`;
    btn.addEventListener("click", () => selectRoom(room));
    host.appendChild(btn);
  }
}

function updateRoomListSelection(room) {
  document.querySelectorAll(".room-chip").forEach((btn) => {
    btn.classList.toggle("active", Boolean(room) && btn.dataset.roomName === room.name);
  });
}

function renderSearchResults(query) {
  const host = $("searchResults");
  if (!query) {
    host.hidden = true;
    host.innerHTML = "";
    return;
  }
  const q = query.toLowerCase();
  const results = [];
  for (const building of state.data.buildings) {
    for (const floor of building.floors) {
      for (const room of floor.rooms) {
        if (room.name.toLowerCase().includes(q)) results.push({ building, floor, room });
      }
    }
  }
  results.sort((a, b) => {
    if (a.room.name === query) return -1;
    if (b.room.name === query) return 1;
    return a.room.name.localeCompare(b.room.name, "zh-CN");
  });

  host.hidden = false;
  host.innerHTML = "";
  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "result-empty";
    empty.textContent = `未找到“${query}”`;
    host.appendChild(empty);
    return;
  }

  for (const { building, floor, room } of results.slice(0, 30)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "search-result";
    btn.innerHTML =
      `<span class="result-room">${escapeHtml(room.name)}</span>` +
      `<span class="result-meta">${escapeHtml(building.name)} · ${floorLabel(floor)}</span>`;
    btn.addEventListener("click", () => {
      if (state.building.id === building.id && state.floor.id === floor.id) {
        selectRoom(room);
      } else {
        state.pendingRoom = room;
        selectBuilding(building.id, floor.id);
      }
      host.hidden = true;
      $("searchInput").value = "";
    });
    host.appendChild(btn);
  }
}

function renderLegend() {
  const host = $("legend");
  host.innerHTML = "";
  for (const item of state.data.legend || []) {
    const row = document.createElement("div");
    row.className = "legend-item";
    row.innerHTML =
      `<span class="legend-swatch" style="background:${item.color}"></span>` +
      `<span>${escapeHtml(item.label)}</span>`;
    host.appendChild(row);
  }
}

function parseHash() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw) return null;
  const [buildingId, floorId] = raw.split("/");
  const building = state.data.buildings.find((b) => b.id === buildingId);
  if (!building) return null;
  const floor = building.floors.find((f) => f.id === floorId) || building.floors[0];
  return { building, floor };
}

function bindUI() {
  $("fitBtn").addEventListener("click", () => {
    if (state.floor) state.map.fitBounds(currentBounds(), { padding: [24, 24] });
  });

  $("hotspotBtn").addEventListener("click", () => {
    state.hotspots = !state.hotspots;
    $("hotspotBtn").classList.toggle("active", state.hotspots);
    if (state.hotspots) state.roomGroup.addTo(state.map);
    else state.map.removeLayer(state.roomGroup);
  });

  $("searchInput").addEventListener("input", (event) => renderSearchResults(event.target.value.trim()));
  $("searchInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const first = $("searchResults").querySelector(".search-result");
      if (first) first.click();
    }
  });

  window.addEventListener("resize", () => state.map && state.map.invalidateSize());
  window.addEventListener("hashchange", () => {
    const target = parseHash();
    if (target && (!state.building || target.building.id !== state.building.id || target.floor.id !== state.floor.id)) {
      state.building = target.building;
      state.floor = target.floor;
      renderBuildingTabs();
      renderFloorButtons();
      loadFloor();
    }
  });
}

function init() {
  const data = window.FLOORPLAN;
  if (!data || !Array.isArray(data.buildings) || !data.buildings.length) {
    $("loading").textContent = "平面图数据加载失败：请确认 assets/floorplan.js 存在。";
    return;
  }
  state.data = data;
  initMap();
  bindUI();
  renderLegend();

  const fromHash = parseHash();
  state.building = fromHash?.building || data.buildings.find((b) => b.id === "B") || data.buildings[0];
  state.floor = fromHash?.floor || state.building.floors.find((f) => f.id === "5F") || state.building.floors[0];

  renderBuildingTabs();
  renderFloorButtons();
  loadFloor();
  $("loading").classList.add("hidden");
}

// ============ 路线规划（栅格 A*） ============
// 把每层平面图栅格化：房间矩形 = 障碍，其余 = 可走。A* 在空白处自然走出走廊。

const ROUTE_GRID_W = 320;
const gridCache = new Map();

function buildGrid(floor) {
  if (gridCache.has(floor)) return gridCache.get(floor);
  const gw = ROUTE_GRID_W;
  const gh = Math.max(28, Math.round(gw * floor.height / floor.width));
  const blocked = new Uint8Array(gw * gh);
  for (const r of floor.rooms || []) {
    if (!r.rect) continue;
    const [nx, ny, nw, nh] = r.rect;
    const x0 = Math.max(0, Math.floor(nx * gw));
    const x1 = Math.min(gw, Math.ceil((nx + nw) * gw));
    const y0 = Math.max(0, Math.floor(ny * gh));
    const y1 = Math.min(gh, Math.ceil((ny + nh) * gh));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) blocked[y * gw + x] = 1;
    }
  }
  const grid = { gw, gh, blocked };
  gridCache.set(floor, grid);
  return grid;
}

function cellFromNorm(grid, nx, ny) {
  return {
    x: Math.min(grid.gw - 1, Math.max(0, Math.round(nx * (grid.gw - 1)))),
    y: Math.min(grid.gh - 1, Math.max(0, Math.round(ny * (grid.gh - 1)))),
  };
}

function nearestWalkable(grid, cx, cy, maxR = 26) {
  const { gw, gh, blocked } = grid;
  if (!blocked[cy * gw + cx]) return { x: cx, y: cy };
  for (let r = 1; r <= maxR; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = cx + dx, y = cy + dy;
        if (x < 0 || y < 0 || x >= gw || y >= gh) continue;
        if (!blocked[y * gw + x]) return { x, y };
      }
    }
  }
  return null;
}

function astar(grid, s, t) {
  const { gw, gh, blocked } = grid;
  const N = gw * gh;
  const gScore = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const idx = (x, y) => y * gw + x;
  const h = (x, y) => Math.hypot(x - t.x, y - t.y);

  const heap = [];
  const push = (f, n) => {
    heap.push([f, n]);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const a = i * 2 + 1, b = a + 1;
        let m = i;
        if (a < heap.length && heap[a][0] < heap[m][0]) m = a;
        if (b < heap.length && heap[b][0] < heap[m][0]) m = b;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  const s0 = idx(s.x, s.y);
  gScore[s0] = 0;
  push(h(s.x, s.y), s0);

  while (heap.length) {
    const [, n] = pop();
    if (closed[n]) continue;
    closed[n] = 1;
    const x = n % gw;
    const y = (n - x) / gw;
    if (x === t.x && y === t.y) {
      const path = [];
      for (let c = n; c !== -1; c = came[c]) path.push({ x: c % gw, y: Math.floor(c / gw) });
      return path.reverse();
    }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const ni = idx(nx, ny);
        if (blocked[ni] || closed[ni]) continue;
        if (dx && dy && (blocked[idx(x + dx, y)] || blocked[idx(x, y + dy)])) continue;
        const step = dx && dy ? Math.SQRT2 : 1;
        const ng = gScore[n] + step;
        if (ng < gScore[ni]) {
          gScore[ni] = ng;
          came[ni] = n;
          push(ng + h(nx, ny), ni);
        }
      }
    }
  }
  return null;
}

function lineOfSight(grid, a, b) {
  let x1 = a.x, y1 = a.y;
  const x2 = b.x, y2 = b.y;
  const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    if (grid.blocked[y1 * grid.gw + x1]) return false;
    if (x1 === x2 && y1 === y2) return true;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x1 += sx; }
    if (e2 < dx) { err += dx; y1 += sy; }
  }
}

function simplifyPath(grid, path) {
  if (path.length < 3) return path;
  const out = [path[0]];
  let i = 0;
  while (i < path.length - 1) {
    let j = path.length - 1;
    while (j > i + 1 && !lineOfSight(grid, path[i], path[j])) j--;
    out.push(path[j]);
    i = j;
  }
  return out;
}

function cellToLatLng(floor, grid, c) {
  return [
    floor.height - ((c.y + 0.5) / grid.gh) * floor.height,
    ((c.x + 0.5) / grid.gw) * floor.width,
  ];
}

function clearRoute() {
  if (state.routeLayer) {
    state.map.removeLayer(state.routeLayer);
    state.routeLayer = null;
  }
  state.routeResult = null;
}

function updateRoutePanel() {
  const a = state.startRef, b = state.endRef;
  $("routeStart").textContent = a ? `${a.room.name}（${a.building.name}${floorLabel(a.floor)}）` : "未设置";
  $("routeEnd").textContent = b ? `${b.room.name}（${b.building.name}${floorLabel(b.floor)}）` : "未设置";
  $("routeStart").classList.toggle("set", !!a);
  $("routeEnd").classList.toggle("set", !!b);
}

function setRouteRef(kind, room) {
  const ref = { building: state.building, floor: state.floor, room };
  if (kind === "start") state.startRef = ref;
  else state.endRef = ref;
  updateRoutePanel();
  setInfo(room);
}

function stairList(floor) {
  return (floor.rooms || [])
    .filter((r) => r.type === "stairs" && r.rect)
    .map((r) => ({ x: r.rect[0], y: r.rect[1], w: r.rect[2], h: r.rect[3], name: r.name, group: r.group }))
    .sort((a, b) => a.x + a.w / 2 - (b.x + b.w / 2));
}

function roomCell(grid, rect) {
  return cellFromNorm(grid, rect[0] + rect[2] / 2, rect[1] + rect[3] / 2);
}

function stairCell(grid, s) {
  return cellFromNorm(grid, s.x + s.w / 2, s.y + s.h / 2);
}

// 同楼不同层：起点层走到楼梯 → 目标层从同一位置的楼梯走到终点
function planMultiFloor(a, b) {
  const bld = a.building;
  const fromFloor = a.floor;
  const toFloor = b.floor;
  const tStairs = stairList(toFloor);
  const fStairs = stairList(fromFloor);
  if (!tStairs.length || !fStairs.length) return { error: "这两层的楼梯还没识别出来，跨层算不了。" };

  const gb = buildGrid(toFloor);
  const cb = roomCell(gb, b.room.rect);
  const endWalk = nearestWalkable(gb, cb.x, cb.y);
  if (!endWalk) return { error: "终点附近没有通道。" };

  let best = null;
  for (const s of tStairs) {
    const sc = stairCell(gb, s);
    const sw = nearestWalkable(gb, sc.x, sc.y);
    if (!sw) continue;
    const p = astar(gb, sw, endWalk);
    if (!p) continue;
    if (!best || p.length < best.len) best = { stair: s, sw, len: p.length, path: p };
  }
  if (!best) return { error: "从目标层的楼梯走不到终点。" };

  let fStair = fStairs[0];
  const byGroup = new Map(fStairs.map((s) => [s.group, s]));
  if (best.stair.group && byGroup.has(best.stair.group)) {
    fStair = byGroup.get(best.stair.group);
  } else {
    const tx = best.stair.x + best.stair.w / 2;
    for (const s of fStairs) {
      if (Math.abs(s.x + s.w / 2 - tx) < Math.abs(fStair.x + fStair.w / 2 - tx)) fStair = s;
    }
  }

  const ga = buildGrid(fromFloor);
  const ca = roomCell(ga, a.room.rect);
  const startWalk = nearestWalkable(ga, ca.x, ca.y);
  const scA = stairCell(ga, fStair);
  const stairWalk = nearestWalkable(ga, scA.x, scA.y);
  if (!startWalk || !stairWalk) return { error: "起点或楼梯附近没有通道。" };
  const pA = astar(ga, startWalk, stairWalk);
  if (!pA) return { error: "从起点走不到楼梯。" };

  const parts = {};
  parts[fromFloor.id] = {
    floor: fromFloor, grid: ga,
    line: [cellToLatLng(fromFloor, ga, ca), ...pA.map((c) => cellToLatLng(fromFloor, ga, c))],
    start: true, end: false,
  };
  parts[toFloor.id] = {
    floor: toFloor, grid: gb,
    line: [...best.path.map((c) => cellToLatLng(toFloor, gb, c)), cellToLatLng(toFloor, gb, cb)],
    start: false, end: true,
  };
  return { parts, fromFloor, toFloor, stairCx: fStair.cx };
}

function drawRouteParts() {
  if (state.routeLayer) {
    state.map.removeLayer(state.routeLayer);
    state.routeLayer = null;
  }
  const parts = state.routeParts || {};
  const part = parts[state.floor.id];
  if (!part) return false;

  state.routeLayer = L.layerGroup().addTo(state.map);
  L.polyline(part.line, { color: "#0f172a", weight: 11, opacity: 0.45, lineCap: "round", lineJoin: "round" }).addTo(state.routeLayer);
  L.polyline(part.line, { color: "#f97316", weight: 6, opacity: 1, lineCap: "round", lineJoin: "round" }).addTo(state.routeLayer);
  if (part.start) {
    L.circleMarker(part.line[0], { radius: 10, color: "#fff", weight: 3, fillColor: "#22c55e", fillOpacity: 1 }).addTo(state.routeLayer);
  }
  if (part.end) {
    L.circleMarker(part.line[part.line.length - 1], { radius: 10, color: "#fff", weight: 3, fillColor: "#ef4444", fillOpacity: 1 }).addTo(state.routeLayer);
  }
  return true;
}

function runPlan() {
  const info = $("routeInfo");
  const a = state.startRef, b = state.endRef;
  clearRoute();
  state.routeParts = null;
  if (!a || !b) { info.className = "route-info bad"; info.textContent = "先设置起点和终点。"; return; }
  if (!a.room.rect || !b.room.rect) { info.className = "route-info bad"; info.textContent = "起点或终点没有房间坐标。"; return; }
  if (a.building.id !== b.building.id) {
    info.className = "route-info bad";
    info.textContent = "两栋楼之间没有连廊数据，只能算同一栋楼内的路线。";
    return;
  }

  // —— 同层 ——
  if (a.floor.id === b.floor.id) {
    const floor = a.floor;
    const grid = buildGrid(floor);
    const ca = roomCell(grid, a.room.rect);
    const cb = roomCell(grid, b.room.rect);
    const sa = nearestWalkable(grid, ca.x, ca.y);
    const sb = nearestWalkable(grid, cb.x, cb.y);
    if (!sa || !sb) { info.className = "route-info bad"; info.textContent = "起点或终点附近找不到可走的通道。"; return; }
    const raw = astar(grid, sa, sb);
    if (!raw) { info.className = "route-info bad"; info.textContent = "这两间之间没有连通的通道。"; return; }
    const line = [cellToLatLng(floor, grid, ca), ...simplifyPath(grid, raw).map((c) => cellToLatLng(floor, grid, c)), cellToLatLng(floor, grid, cb)];
    state.routeParts = { [floor.id]: { floor, grid, line, start: true, end: true } };
    drawRouteParts();
    state.map.fitBounds(L.latLngBounds(line).pad(0.25), { padding: [40, 40] });
    let px = 0;
    for (let i = 1; i < line.length; i++) px += Math.hypot(line[i][1] - line[i - 1][1], line[i][0] - line[i - 1][0]);
    state.routeResult = { px };
    info.className = "route-info ok";
    info.innerHTML = `同层：<b>${escapeHtml(a.room.name)}</b> → <b>${escapeHtml(b.room.name)}</b>，图上约 ${Math.round(px)} 像素（走廊全长的 ${(px / floor.width * 100).toFixed(0)}%），${line.length - 2} 个拐点。`;
    return;
  }

  // —— 跨层 ——
  const res = planMultiFloor(a, b);
  if (res.error) { info.className = "route-info bad"; info.textContent = res.error; return; }
  state.routeParts = res.parts;
  drawRouteParts();
  const floors = a.building.floors;
  const iFrom = floors.findIndex((f) => f.id === a.floor.id);
  const iTo = floors.findIndex((f) => f.id === b.floor.id);
  const up = iTo > iFrom;
  info.className = "route-info ok";
  info.innerHTML =
    `跨层：<b>${escapeHtml(a.room.name)}</b>（${floorLabel(a.floor)}）→ <b>${escapeHtml(b.room.name)}</b>（${floorLabel(b.floor)}）。` +
    `在${floorLabel(a.floor)}先走到楼梯，${up ? "上" : "下"} ${Math.abs(iTo - iFrom)} 层，再走到目标。` +
    `两层的路线分段显示——切到 ${floorLabel(res.toFloor)} 就能看到下半段。`;
}

function bindRouteUI() {
  // This page uses the dedicated B-building navigation instead of the old
  // inline route panel. Keep the legacy code harmless if that panel is absent.
  if (!$("routePlan") || !$("routeClear")) return;
  $("routePlan").addEventListener("click", runPlan);
  $("routeClear").addEventListener("click", () => {
    state.startRef = null;
    state.endRef = null;
    clearRoute();
    updateRoutePanel();
    $("routeInfo").className = "route-info muted";
    $("routeInfo").textContent = "点击图上房间后，用「设为起点 / 设为终点」。";
    setInfo(state.selectedRoom);
  });
  updateRoutePanel();
}

init();
bindRouteUI();
