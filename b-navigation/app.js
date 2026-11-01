/* global L, B_NAV_DATA */

const TYPE_LABEL = {
  classroom: "教室",
  room: "房间",
  office: "办公室",
  rest: "休息室",
  toilet: "卫生间",
  stairs: "楼梯 / 安全通道",
};

const CN_NUM = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const WALK_SPEED = 1.15; // m/s
const FLOOR_HEIGHT_M = 3.6;
const ROUTE_ZOOM = 1.15;
const NORTH_WALL_Y = 0.655;

const state = {
  data: null,
  floors: [],
  floorMap: new Map(),
  stairGroups: new Map(),
  floor: null,
  selectedRef: null,
  startRef: null,
  endRef: null,
  route: null,
  activeStepIndex: -1,
  map: null,
  imageLayer: null,
  roomGroup: null,
  routeLayer: null,
  roomLayers: new Map(),
  optionMap: new Map(),
  allClassrooms: [],
  showAllHotspots: true,
  hotspotsVisible: true,
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatMeters(value) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 100) return String(Math.round(value / 5) * 5);
  return String(Math.max(1, Math.round(value)));
}

function formatMinutes(value) {
  return String(Math.max(1, Math.ceil(value)));
}

function floorIndex(floorId) {
  return state.floors.findIndex((floor) => floor.id === floorId);
}

/* ============================== map ============================== */

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
  state.routeLayer = L.layerGroup().addTo(state.map);

  state.map.on("click", () => {
    if (!state.selectedRef) return;
    state.selectedRef = null;
    applyAllRoomStyles();
    hideRoomCard();
  });
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

function pointToLatLng(floor, point) {
  return [floor.height - point.y, point.x];
}

function latLngToPoint(floor, latlng) {
  return { x: latlng.lng, y: floor.height - latlng.lat };
}

/* ============================== data prep ============================== */

function prepareData() {
  state.data = window.B_NAV_DATA;
  state.floors = state.data.floors;
  for (const floor of state.floors) {
    state.floorMap.set(floor.id, floor);
    floor.rooms.forEach((room, index) => {
      room._floor = floor;
      room._index = index;
      room._key = `${floor.id}#${index}`;
      if (room.type === "classroom") {
        state.allClassrooms.push({ floor, room, key: room._key });
      }
    });
  }

  for (const floor of state.floors) {
    for (const room of floor.rooms) {
      if (room.type !== "stairs" || !room.rect) continue;
      room.group = room.name;
      const group = state.stairGroups.get(room.name) || {
        name: room.name,
        byFloor: new Map(),
        floorIds: new Set(),
      };
      group.byFloor.set(floor.id, room);
      group.floorIds.add(floor.id);
      state.stairGroups.set(room.name, group);
    }
  }

  for (const group of state.stairGroups.values()) {
    group.through = group.floorIds.size > 1;
    for (const room of group.byFloor.values()) room.through = group.through;
  }

  $("statFloors").textContent = String(state.floors.length);
  $("statClassrooms").textContent = String(state.allClassrooms.length);
  $("statStairs").textContent = String(
    state.floors.reduce(
      (total, floor) => total + floor.rooms.filter((room) => room.type === "stairs").length,
      0
    )
  );
}

/* ============================== floor rendering ============================== */

function isStartRoom(room) {
  return Boolean(state.startRef && state.startRef.room === room);
}

function isEndRoom(room) {
  return Boolean(state.endRef && state.endRef.room === room);
}

function isRouteStair(room) {
  if (!state.route) return false;
  return state.route.segments.some((segment) => segment.stair === room);
}

function baseStyle(room) {
  if (room.type === "stairs") {
    return { color: "#15803d", weight: 2.2, fillColor: "#22c55e", fillOpacity: 0.24 };
  }
  if (room.type === "classroom") {
    return { color: "#0f9f9a", weight: 2, fillColor: "#14b8a6", fillOpacity: 0.15 };
  }
  const colors = {
    office: ["#7c3aed", "#a78bfa"],
    toilet: ["#2563eb", "#93c5fd"],
    rest: ["#65a30d", "#bef264"],
    room: ["#64748b", "#cbd5e1"],
  };
  const [color, fillColor] = colors[room.type] || colors.room;
  return { color, weight: 1.6, fillColor, fillOpacity: 0.1 };
}

function styledRoom(room) {
  const base = baseStyle(room);
  if (isRouteStair(room)) {
    return { ...base, color: "#ea580c", weight: 3, fillColor: "#fb923c", fillOpacity: 0.34 };
  }
  if (isStartRoom(room)) {
    return { ...base, color: "#16a34a", weight: 3.2, fillColor: "#22c55e", fillOpacity: 0.34 };
  }
  if (isEndRoom(room)) {
    return { ...base, color: "#dc2626", weight: 3.2, fillColor: "#f87171", fillOpacity: 0.32 };
  }
  if (state.selectedRef && state.selectedRef.room === room) {
    return { ...base, color: "#f97316", weight: 3.2, fillColor: "#fb923c", fillOpacity: 0.36 };
  }
  return base;
}

function shouldShowRoom(room) {
  if (!room.rect) return false;
  if (state.showAllHotspots) return true;
  if (room.type === "classroom" || room.type === "stairs") return true;
  if (isStartRoom(room) || isEndRoom(room)) return true;
  if (state.selectedRef && state.selectedRef.room === room) return true;
  return false;
}

function addRoomLayer(room) {
  const layer = L.rectangle(rectToBounds(room.rect), {
    ...styledRoom(room),
    className: "room-rect",
  });

  layer.bindTooltip(room.name, {
    sticky: true,
    direction: "top",
    className: "room-tip",
    opacity: 1,
  });

  layer.on("mouseover", () => {
    if (state.selectedRef && state.selectedRef.room === room) return;
    layer.setStyle({
      weight: room.type === "stairs" ? 3.2 : 3,
      fillOpacity: room.type === "stairs" ? 0.44 : 0.34,
    });
  });

  layer.on("mouseout", () => {
    layer.setStyle(styledRoom(room));
  });

  layer.on("click", (event) => {
    L.DomEvent.stopPropagation(event);
    selectRoom(room);
  });

  layer.addTo(state.roomGroup);
  state.roomLayers.set(room, layer);
}

function renderRoomLayers() {
  state.roomGroup.clearLayers();
  state.roomLayers.clear();
  for (const room of state.floor.rooms) {
    if (shouldShowRoom(room)) addRoomLayer(room);
  }
}

function applyAllRoomStyles() {
  for (const [room, layer] of state.roomLayers.entries()) {
    layer.setStyle(styledRoom(room));
  }
}

function loadFloor(floorId, options = {}) {
  const floor = state.floorMap.get(floorId);
  if (!floor) return;

  state.floor = floor;
  state.selectedRef = null;

  if (state.imageLayer) {
    state.map.removeLayer(state.imageLayer);
    state.imageLayer = null;
  }

  state.map.setMaxBounds(null);
  const bounds = currentBounds();

  state.imageLayer = L.imageOverlay(floor.image, bounds, {
    className: "floor-image",
    alt: `B栋 ${floorLabel(floor)}平面图`,
  }).addTo(state.map);

  renderRoomLayers();

  // Set the pan limit before fitting: doing it the other way round can cancel
  // the fit animation and leave the route half off-screen.
  state.map.setMaxBounds(bounds.pad(0.35));

  if (options.focusPoint) {
    state.map.setView(pointToLatLng(floor, options.focusPoint), options.zoom || ROUTE_ZOOM, {
      animate: false,
    });
  } else {
    const segment = state.route?.segments.find((item) => item.floorId === floor.id);
    if (segment) {
      fitSegment(segment);
    } else {
      state.map.fitBounds(bounds, { padding: [24, 24], animate: false });
    }
  }

  try {
    // Keep ?start/?end/?back query parameters when switching floors, so a
    // shared deep link survives a reload.
    history.replaceState(null, "", `${location.pathname}${location.search}#B/${floor.id}`);
  } catch (error) {
    /* file:// may reject history updates; the page still works. */
  }

  $("floorBadge").textContent = `B栋 · ${floorLabel(floor)}`;
  updateFloorRail();
  renderRoomChips();
  renderRouteOnFloor();
  hideRoomCard();

  if (state.pendingRoomKey) {
    const pending = state.pendingRoomKey;
    state.pendingRoomKey = null;
    const room = floor.rooms.find((item) => item._key === pending);
    if (room) requestAnimationFrame(() => selectRoom(room));
  }
}

function updateFloorRail() {
  document.querySelectorAll(".floor-rail-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.floor === state.floor.id);
  });
  document.querySelectorAll(".floor-chip").forEach((button) => {
    button.classList.toggle("active", button.dataset.floor === state.floor.id);
  });
}

function fitSegment(segment) {
  if (!segment || !segment.points.length) return;
  state.map.stop();
  if (segment.points.length === 1) {
    state.map.setView(pointToLatLng(state.floor, segment.points[0]), ROUTE_ZOOM, { animate: false });
    return;
  }
  const latlngs = segment.points.map((point) => pointToLatLng(state.floor, point));
  state.map.fitBounds(L.latLngBounds(latlngs).pad(0.12), {
    padding: [80, 80],
    maxZoom: ROUTE_ZOOM,
    animate: false,
  });
}

function fitCurrent() {
  if (!state.floor) return;
  const segment = state.route?.segments.find((item) => item.floorId === state.floor.id);
  if (segment) {
    fitSegment(segment);
  } else {
    state.map.fitBounds(currentBounds(), { padding: [24, 24], animate: false });
  }
}

/* ============================== room selection ============================== */

function selectRoom(room) {
  state.selectedRef = { floor: state.floor, room };
  applyAllRoomStyles();

  const layer = state.roomLayers.get(room);
  if (layer) {
    layer.bringToFront();
    const bounds = layer.getBounds();
    state.map.fitBounds(bounds.pad(1.4), { padding: [70, 70], maxZoom: 1.1, animate: true });
  }

  showRoomCard(room);
  updateRoomChipSelection();
}

function showRoomCard(room) {
  const floor = state.floor;
  $("roomCardKicker").textContent = `B栋 · ${floorLabel(floor)} · ${TYPE_LABEL[room.type] || "房间"}`;
  $("roomCardTitle").textContent = room.name;
  $("roomCardSub").textContent = room.type === "classroom"
    ? "教室热点 · 可设为起点或终点"
    : room.type === "stairs"
      ? "楼梯 / 安全通道热点 · 可用于换层"
      : `${TYPE_LABEL[room.type] || "房间"}热点 · 可设为起点`;

  const isClassroom = room.type === "classroom";
  const endButton = $("setEndBtn");
  endButton.disabled = !isClassroom || !room.rect;
  endButton.title = isClassroom ? "设为终点" : "终点仅支持教室热点";

  $("setStartBtn").classList.toggle("active", isStartRoom(room));
  endButton.classList.toggle("active", isEndRoom(room));

  const note = $("roomCardNote");
  if (!isClassroom) {
    note.hidden = false;
    note.textContent = "终点只使用教室热点；该热点可以设为起点。";
  } else if (!room.rect) {
    note.hidden = false;
    note.textContent = "该房间暂无热点坐标，无法参与路线规划。";
  } else {
    note.hidden = true;
    note.textContent = "";
  }

  $("roomCard").hidden = false;
}

function hideRoomCard() {
  $("roomCard").hidden = true;
}

/* ============================== selectors / chips / search ============================== */

function roomOptionText(floor, room, simple) {
  if (simple) return `${room.name}（${floorLabel(floor)}）`;
  const type = TYPE_LABEL[room.type] || "房间";
  return `${room.name}（${floorLabel(floor)} · ${type}）`;
}

function populateSelectors() {
  const startSelect = $("startSelect");
  const endSelect = $("endSelect");
  startSelect.innerHTML = '<option value="">选择起点</option>';
  endSelect.innerHTML = '<option value="">选择终点教室</option>';
  state.optionMap.clear();

  for (const floor of state.floors) {
    const startGroup = document.createElement("optgroup");
    startGroup.label = `${floorLabel(floor)} · ${floor.id}`;
    const endGroup = document.createElement("optgroup");
    endGroup.label = `${floorLabel(floor)} · ${floor.id}`;

    const rooms = [...floor.rooms]
      .filter((room) => room.rect)
      .sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }));

    for (const room of rooms) {
      const key = room._key;
      state.optionMap.set(key, { floor, room });

      const startOption = document.createElement("option");
      startOption.value = key;
      startOption.textContent = roomOptionText(floor, room, false);
      startGroup.appendChild(startOption);

      if (room.type === "classroom") {
        const endOption = document.createElement("option");
        endOption.value = key;
        endOption.textContent = roomOptionText(floor, room, true);
        endGroup.appendChild(endOption);
      }
    }

    if (startGroup.children.length) startSelect.appendChild(startGroup);
    if (endGroup.children.length) endSelect.appendChild(endGroup);
  }

  startSelect.addEventListener("change", () => {
    const target = state.optionMap.get(startSelect.value);
    if (!target) {
      state.startRef = null;
      return;
    }
    setStartRef(target.floor, target.room, { plan: true });
  });

  endSelect.addEventListener("change", () => {
    const target = state.optionMap.get(endSelect.value);
    if (!target) {
      state.endRef = null;
      return;
    }
    setEndRef(target.floor, target.room, { plan: true });
  });
}

function setStartRef(floor, room, options = {}) {
  state.startRef = { floor, room };
  $("startSelect").value = room._key;
  applyAllRoomStyles();
  if (options.plan !== false && state.endRef) planRoute({ show: "start" });
  else showRoomCard(room);
}

function setEndRef(floor, room, options = {}) {
  if (room.type !== "classroom") {
    showMessage("终点只使用教室热点，请选择一间教室。", "bad");
    return;
  }
  state.endRef = { floor, room };
  $("endSelect").value = room._key;
  applyAllRoomStyles();
  updateRoomChipSelection();
  if (options.plan !== false && state.startRef) planRoute({ show: "start" });
}

function renderRoomChips() {
  const host = $("roomChips");
  host.innerHTML = "";
  const rooms = state.floor.rooms
    .filter((room) => room.type === "classroom" && room.rect)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN", { numeric: true }));
  $("roomCount").textContent = `${rooms.length} 间`;

  for (const room of rooms) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "room-chip";
    button.dataset.key = room._key;
    button.textContent = room.name;
    button.title = `设为终点：${floorLabel(state.floor)} ${room.name}`;
    button.addEventListener("click", () => {
      setEndRef(state.floor, room, { plan: true });
    });
    host.appendChild(button);
  }
  updateRoomChipSelection();
}

function updateRoomChipSelection() {
  document.querySelectorAll(".room-chip").forEach((button) => {
    button.classList.toggle(
      "active",
      Boolean(state.endRef) && state.endRef.room._key === button.dataset.key
    );
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
  const results = state.allClassrooms.filter((item) =>
    item.room.name.toLowerCase().includes(q)
  );

  results.sort((a, b) => {
    if (a.room.name === query) return -1;
    if (b.room.name === query) return 1;
    return a.room.name.localeCompare(b.room.name, "zh-CN", { numeric: true });
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

  for (const item of results.slice(0, 12)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.innerHTML =
      `<span class="result-room">${escapeHtml(item.room.name)}</span>` +
      `<span class="result-meta">B栋 · ${floorLabel(item.floor)}</span>`;
    button.addEventListener("click", () => {
      setEndRef(item.floor, item.room, { plan: true });
      host.hidden = true;
      $("searchInput").value = "";
    });
    host.appendChild(button);
  }
}

/* ============================== legend / rail ============================== */

function renderLegend() {
  const host = $("legend");
  host.innerHTML = "";
  for (const item of state.data.legend) {
    const row = document.createElement("div");
    row.className = "legend-item";
    row.innerHTML =
      `<span class="legend-swatch" style="background:${item.color}"></span>` +
      `<span>${escapeHtml(item.label)}</span>`;
    host.appendChild(row);
  }
}

function buildFloorRail() {
  const host = $("floorRail");
  host.innerHTML = "";
  const floors = [...state.floors].reverse();
  for (const floor of floors) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "floor-rail-btn";
    button.dataset.floor = floor.id;
    button.textContent = floor.id;
    button.title = `${floorLabel(floor)}平面图`;
    button.addEventListener("click", () => loadFloor(floor.id));
    host.appendChild(button);
  }
}

function updateRouteRail() {
  document.querySelectorAll(".floor-rail-btn").forEach((button) => {
    button.querySelector(".rail-dot")?.remove();
    button.querySelector(".rail-stair")?.remove();
    if (!state.route) return;

    const floorId = button.dataset.floor;
    const segment = state.route.segments.find((item) => item.floorId === floorId);
    if (!segment) return;

    const dot = document.createElement("span");
    dot.className = "rail-dot";
    if (segment.kind === "via") dot.style.background = "#94a3b8";
    button.appendChild(dot);

    if (segment.kind === "start" || segment.kind === "end") {
      const stair = document.createElement("span");
      stair.className = "rail-stair";
      stair.textContent = state.route.up ? "↑" : "↓";
      button.appendChild(stair);
    }
  });
}

/* ============================== routing grid ============================== */

function getGrid(floor) {
  if (floor._grid) return floor._grid;
  const { w, h, mask } = floor.grid;
  const binary = atob(mask);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const walk = new Uint8Array(w * h);
  for (let i = 0; i < walk.length; i += 1) {
    walk[i] = (bytes[i >> 3] >> (i & 7)) & 1;
  }
  const grid = { w, h, walk };
  floor._grid = grid;
  return grid;
}

function cellFromRect(floor, rect) {
  const grid = getGrid(floor);
  return {
    x: clamp(Math.round((rect[0] + rect[2] / 2) * (grid.w - 1)), 0, grid.w - 1),
    y: clamp(Math.round((rect[1] + rect[3] / 2) * (grid.h - 1)), 0, grid.h - 1),
  };
}

function nearestWalkable(grid, cell, maxRadius = 60) {
  const { w, h, walk } = grid;
  if (walk[cell.y * w + cell.x]) return { x: cell.x, y: cell.y };
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const x = cell.x + dx;
        const y = cell.y + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if (walk[y * w + x]) return { x, y };
      }
    }
  }
  return null;
}

function astar(grid, start, goal) {
  const { w, h, walk } = grid;
  const total = w * h;
  const gScore = new Float32Array(total).fill(Infinity);
  const came = new Int32Array(total).fill(-1);
  const closed = new Uint8Array(total);
  const index = (x, y) => y * w + x;
  const heuristic = (x, y) => Math.hypot(x - goal.x, y - goal.y);

  const heap = [];
  const push = (f, node) => {
    heap.push([f, node]);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (heap[parent][0] <= heap[i][0]) break;
      [heap[parent], heap[i]] = [heap[i], heap[parent]];
      i = parent;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const left = i * 2 + 1;
        const right = left + 1;
        let smallest = i;
        if (left < heap.length && heap[left][0] < heap[smallest][0]) smallest = left;
        if (right < heap.length && heap[right][0] < heap[smallest][0]) smallest = right;
        if (smallest === i) break;
        [heap[smallest], heap[i]] = [heap[i], heap[smallest]];
        i = smallest;
      }
    }
    return top;
  };

  const startIndex = index(start.x, start.y);
  gScore[startIndex] = 0;
  push(heuristic(start.x, start.y), startIndex);

  while (heap.length) {
    const [, node] = pop();
    if (closed[node]) continue;
    closed[node] = 1;

    const x = node % w;
    const y = (node - x) / w;
    if (x === goal.x && y === goal.y) {
      const path = [];
      for (let current = node; current !== -1; current = came[current]) {
        path.push({ x: current % w, y: Math.floor(current / w) });
      }
      return path.reverse();
    }

    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const neighbor = index(nx, ny);
        if (!walk[neighbor] || closed[neighbor]) continue;
        if (dx && dy && (!walk[index(x + dx, y)] || !walk[index(x, y + dy)])) continue;

        const step = dx && dy ? Math.SQRT2 : 1;
        const tentative = gScore[node] + step;
        if (tentative >= gScore[neighbor]) continue;
        gScore[neighbor] = tentative;
        came[neighbor] = node;
        push(tentative + heuristic(nx, ny), neighbor);
      }
    }
  }

  return null;
}

function lineOfSight(grid, a, b) {
  let x1 = a.x;
  let y1 = a.y;
  const x2 = b.x;
  const y2 = b.y;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let error = dx - dy;

  for (;;) {
    if (!grid.walk[y1 * grid.w + x1]) return false;
    if (x1 === x2 && y1 === y2) return true;
    const doubled = 2 * error;
    if (doubled > -dy) {
      error -= dy;
      x1 += sx;
    }
    if (doubled < dx) {
      error += dx;
      y1 += sy;
    }
  }
}

function simplifyPath(grid, path) {
  if (path.length < 3) return path;
  const output = [path[0]];
  let i = 0;
  while (i < path.length - 1) {
    let j = path.length - 1;
    while (j > i + 1 && !lineOfSight(grid, path[i], path[j])) j -= 1;
    output.push(path[j]);
    i = j;
  }
  return output;
}

function cellToPoint(floor, grid, cell) {
  return {
    x: ((cell.x + 0.5) / grid.w) * floor.width,
    y: ((cell.y + 0.5) / grid.h) * floor.height,
  };
}

function rectCenter(floor, rect) {
  return {
    x: (rect[0] + rect[2] / 2) * floor.width,
    y: (rect[1] + rect[3] / 2) * floor.height,
  };
}

function pushPoint(points, point) {
  const last = points[points.length - 1];
  if (!last || Math.hypot(last.x - point.x, last.y - point.y) > 0.8) {
    points.push(point);
  }
}

function polylineLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return total;
}

function pathBetween(floor, fromRect, toRect) {
  const grid = getGrid(floor);
  const startCenter = rectCenter(floor, fromRect);
  const endCenter = rectCenter(floor, toRect);
  const startCell = cellFromRect(floor, fromRect);
  const endCell = cellFromRect(floor, toRect);
  const startWalk = nearestWalkable(grid, startCell);
  const endWalk = nearestWalkable(grid, endCell);
  if (!startWalk || !endWalk) return null;

  const raw = astar(grid, startWalk, endWalk);
  if (!raw) return null;

  const points = [];
  pushPoint(points, startCenter);
  for (const cell of simplifyPath(grid, raw)) {
    pushPoint(points, cellToPoint(floor, grid, cell));
  }
  pushPoint(points, endCenter);

  return {
    floor,
    points,
    pixels: polylineLength(points),
    meters: polylineLength(points) * floor.metersPerPixel,
    startCell,
    endCell,
    startWalk,
    endWalk,
  };
}

/* ============================== route planning ============================== */

function getStairCandidates(fromFloor, toFloor) {
  const fromIndex = floorIndex(fromFloor.id);
  const toIndex = floorIndex(toFloor.id);
  const low = Math.min(fromIndex, toIndex);
  const high = Math.max(fromIndex, toIndex);
  const candidates = [];

  for (const group of state.stairGroups.values()) {
    if (!group.byFloor.has(fromFloor.id) || !group.byFloor.has(toFloor.id)) continue;
    let continuous = true;
    for (let i = low; i <= high; i += 1) {
      if (!group.byFloor.has(state.floors[i].id)) {
        continuous = false;
        break;
      }
    }
    if (!continuous) continue;
    candidates.push({
      group,
      fromStair: group.byFloor.get(fromFloor.id),
      toStair: group.byFloor.get(toFloor.id),
    });
  }
  return candidates;
}

function planRoute(options = {}) {
  clearRoute({ keepRefs: true });

  const start = state.startRef;
  const end = state.endRef;
  if (!start || !end) {
    showMessage("请先选择起点和终点。", "bad");
    return;
  }
  if (start.room === end.room) {
    showMessage("起点和终点是同一个房间，请重新选择。", "bad");
    return;
  }

  let route;
  if (start.floor.id === end.floor.id) {
    route = buildSameFloorRoute(start, end);
  } else {
    route = buildCrossFloorRoute(start, end);
  }

  if (!route) return;

  state.route = route;
  state.activeStepIndex = -1;
  renderSummary();
  renderSteps();
  updateRouteRail();
  $("routeBadge").hidden = false;
  $("routeBadge").textContent = route.floorDiff ? "跨层导航中" : "同层导航中";
  showMessage(route.message, "ok");

  const targetFloor = options.show === "end" ? end.floor : start.floor;
  loadFloor(targetFloor.id);
  activateStep(options.show === "end" ? route.steps.length - 1 : 0, { keepFloor: true });
}

function buildSameFloorRoute(start, end) {
  const path = pathBetween(start.floor, start.room.rect, end.room.rect);
  if (!path) {
    showMessage("起点和终点之间暂时找不到连通的走廊，请换一组起终点。", "bad");
    return null;
  }

  const startPoint = path.points[0];
  const endPoint = path.points[path.points.length - 1];
  const segments = [
    {
      floorId: start.floor.id,
      kind: "same",
      points: path.points,
      startPoint,
      endPoint,
      stair: null,
    },
  ];

  const steps = [
    {
      kind: "start",
      title: `从 ${start.room.name} 出发`,
      detail: `B栋 · ${floorLabel(start.floor)} · 教室`,
      floorId: start.floor.id,
      point: startPoint,
    },
    {
      kind: "walk",
      title: `步行至 ${end.room.name}`,
      detail: describeWalk(path.points, start.floor, {
        from: start.room.name,
        to: end.room.name,
        isStart: true,
      }),
      floorId: start.floor.id,
      point: endPoint,
    },
    {
      kind: "end",
      title: `到达 ${end.room.name}`,
      detail: `B栋 · ${floorLabel(end.floor)} · 教室`,
      floorId: end.floor.id,
      point: endPoint,
    },
  ];

  return {
    start,
    end,
    segments,
    steps,
    floorDiff: 0,
    up: true,
    stairName: null,
    totalMeters: path.meters,
    timeMinutes: path.meters / WALK_SPEED / 60,
    summaryTitle: `${start.room.name} → ${end.room.name}`,
    badge: "同层",
    summaryMeta: `${floorLabel(start.floor)} · 同层步行路线`,
    floorIds: [start.floor.id],
    message: `同层路线：${start.room.name} → ${end.room.name}，约 ${formatMeters(path.meters)} 米。`,
  };
}

function buildCrossFloorRoute(start, end) {
  const candidates = getStairCandidates(start.floor, end.floor);
  if (!candidates.length) {
    showMessage("这两层之间没有连续的楼梯热点，暂时无法规划跨层路线。", "bad");
    return null;
  }

  let best = null;
  for (const candidate of candidates) {
    const toStair = pathBetween(start.floor, start.room.rect, candidate.fromStair.rect);
    const fromStair = pathBetween(end.floor, candidate.toStair.rect, end.room.rect);
    if (!toStair || !fromStair) continue;
    const score = toStair.meters + fromStair.meters;
    if (!best || score < best.score) {
      best = { ...candidate, toStair, fromStair, score };
    }
  }

  if (!best) {
    showMessage("起点、楼梯与终点之间没有找到连通走廊，请换一组起终点。", "bad");
    return null;
  }

  const fromIndex = floorIndex(start.floor.id);
  const toIndex = floorIndex(end.floor.id);
  const floorDiff = Math.abs(toIndex - fromIndex);
  const up = toIndex > fromIndex;
  const startPoint = best.toStair.points[0];
  const stairPoint = best.toStair.points[best.toStair.points.length - 1];
  const endPoint = best.fromStair.points[best.fromStair.points.length - 1];

  const segments = [
    {
      floorId: start.floor.id,
      kind: "start",
      points: best.toStair.points,
      startPoint,
      endPoint: stairPoint,
      stair: best.group.byFloor.get(start.floor.id),
    },
  ];

  const low = Math.min(fromIndex, toIndex);
  const high = Math.max(fromIndex, toIndex);
  const viaFloors = [];
  for (let i = low + 1; i < high; i += 1) {
    const floor = state.floors[i];
    const stair = best.group.byFloor.get(floor.id);
    if (!stair) continue;
    viaFloors.push(floor);
    segments.push({
      floorId: floor.id,
      kind: "via",
      points: [rectCenter(floor, stair.rect)],
      startPoint: null,
      endPoint: null,
      stair,
    });
  }

  segments.push({
    floorId: end.floor.id,
    kind: "end",
    points: best.fromStair.points,
    startPoint: best.fromStair.points[0],
    endPoint,
    stair: best.group.byFloor.get(end.floor.id),
  });

  const stairName = best.group.name;
  const viaText = viaFloors.length
    ? `（途经 ${viaFloors.map((floor) => floorLabel(floor)).join("、")}）`
    : "";

  const steps = [
    {
      kind: "start",
      title: `从 ${start.room.name} 出发`,
      detail: `B栋 · ${floorLabel(start.floor)} · 教室`,
      floorId: start.floor.id,
      point: startPoint,
    },
    {
      kind: "walk",
      title: `步行至 ${stairName}`,
      detail: describeWalk(best.toStair.points, start.floor, {
        from: start.room.name,
        to: stairName,
        isStart: true,
      }),
      floorId: start.floor.id,
      point: stairPoint,
    },
    {
      kind: "stairs",
      title: `${up ? "上楼" : "下楼"} ${floorDiff} 层`,
      detail: `在 ${stairName} 沿楼梯${up ? "上" : "下"}行 ${floorDiff} 层${viaText}，到达 ${floorLabel(end.floor)}。`,
      floorId: start.floor.id,
      point: stairPoint,
      toFloorId: end.floor.id,
    },
    {
      kind: "walk",
      title: `步行至 ${end.room.name}`,
      detail: describeWalk(best.fromStair.points, end.floor, {
        from: stairName,
        to: end.room.name,
        isStart: false,
      }),
      floorId: end.floor.id,
      point: endPoint,
    },
    {
      kind: "end",
      title: `到达 ${end.room.name}`,
      detail: `B栋 · ${floorLabel(end.floor)} · 教室`,
      floorId: end.floor.id,
      point: endPoint,
    },
  ];

  const totalMeters = best.toStair.meters + best.fromStair.meters + floorDiff * FLOOR_HEIGHT_M;
  const stairMeters = floorDiff * FLOOR_HEIGHT_M;
  const timeMinutes = totalMeters / WALK_SPEED / 60 + floorDiff * 0.35;

  return {
    start,
    end,
    segments,
    steps,
    floorDiff,
    up,
    stairName,
    totalMeters,
    stairMeters,
    timeMinutes,
    summaryTitle: `${start.room.name} → ${end.room.name}`,
    badge: "跨层",
    summaryMeta: `经 ${stairName} · ${floorLabel(start.floor)} → ${floorLabel(end.floor)}`,
    floorIds: state.floors.slice(low, high + 1).map((floor) => floor.id),
    message: `跨层路线：${start.room.name} → ${end.room.name}，经 ${stairName} ${up ? "上" : "下"} ${floorDiff} 层，约 ${formatMeters(totalMeters)} 米。`,
  };
}

function directionName(dx, dy) {
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  if (angle >= -22.5 && angle < 22.5) return "东";
  if (angle >= 22.5 && angle < 67.5) return "东南";
  if (angle >= 67.5 && angle < 112.5) return "南";
  if (angle >= 112.5 && angle < 157.5) return "西南";
  if (angle >= 157.5 || angle < -157.5) return "西";
  if (angle >= -157.5 && angle < -112.5) return "西北";
  if (angle >= -112.5 && angle < -67.5) return "北";
  if (angle >= -67.5 && angle < -22.5) return "东北";
  return "东";
}

function pathSegments(points, floor) {
  const segments = [];
  const wallY = NORTH_WALL_Y * floor.height;

  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const meters = Math.hypot(dx, dy) * floor.metersPerPixel;
    const previousY = points[i - 1].y;
    const currentY = points[i].y;
    const crossesWall = (previousY - wallY) * (currentY - wallY) <= 0 && previousY !== currentY;
    if (meters < 1.2 && !crossesWall) continue;

    const direction = directionName(dx, dy);
    const last = segments[segments.length - 1];
    if (last && last.direction === direction) {
      last.meters += meters;
      last.crossesWall = last.crossesWall || crossesWall;
    } else {
      segments.push({ direction, meters, crossesWall });
    }
  }
  return segments;
}

function describeWalk(points, floor, options) {
  const allSegments = pathSegments(points, floor);
  if (!allSegments.length) return "沿走廊步行至目的地。";

  // Keep long corridor moves, the wall-crossing step and the final approach.
  // Short A* zigzags around room corners are not useful in a text direction.
  let segments = allSegments.filter(
    (segment, index) =>
      segment.meters >= 8 ||
      segment.crossesWall ||
      index === allSegments.length - 1
  );
  if (!segments.length) {
    segments = [allSegments.reduce((best, item) => (item.meters > best.meters ? item : best), allSegments[0])];
  }

  // Leaving a classroom usually produces a short diagonal segment before the
  // real corridor direction. "从 X 出发" already covers it.
  if (
    options.isStart &&
    segments.length > 1 &&
    segments[0].meters < 12 &&
    !segments[0].crossesWall
  ) {
    segments = segments.slice(1);
  }

  const phrases = [];
  if (options.isStart) {
    phrases.push(`从 ${options.from} 出发`);
  } else if (options.from) {
    phrases.push("出梯后");
  }

  let saidWall = false;
  let hasDirection = false;
  let lastSegment = null;
  let lastPhraseIndex = -1;

  for (const segment of segments) {
    // A short wall-crossing step is represented by the entrance phrase only.
    if (segment.crossesWall && segment.meters < 5) {
      if (!saidWall) {
        phrases.push("经北楼入口");
        saidWall = true;
      }
      continue;
    }

    const alongCorridor =
      (segment.direction.includes("东") || segment.direction.includes("西")) &&
      segment.meters >= 8;
    let phrase = alongCorridor
      ? `沿走廊向${segment.direction}步行约 ${formatMeters(segment.meters)} 米`
      : `向${segment.direction}步行约 ${formatMeters(segment.meters)} 米`;
    if (hasDirection) phrase = `再${phrase}`;

    phrases.push(phrase);
    lastPhraseIndex = phrases.length - 1;
    lastSegment = segment;
    hasDirection = true;

    if (segment.crossesWall && !saidWall) {
      phrases.push("经北楼入口");
      saidWall = true;
    }
  }

  if (options.to) {
    const endsOnEntrancePhrase =
      phrases.length > 0 && phrases[phrases.length - 1] === "经北楼入口";
    if (
      lastPhraseIndex >= 0 &&
      lastSegment &&
      lastSegment.meters <= 14 &&
      !endsOnEntrancePhrase
    ) {
      phrases[lastPhraseIndex] += `，进入 ${options.to}`;
    } else {
      phrases.push(`到达 ${options.to}`);
    }
  }

  return `${phrases.join("，")}。`;
}

/* ============================== route panels ============================== */

function showMessage(text, kind) {
  const host = $("routeMessage");
  host.className = `route-message${kind ? ` ${kind}` : ""}`;
  host.textContent = text;
}

function renderSummary() {
  const route = state.route;
  if (!route) return;

  $("summaryPanel").hidden = false;
  $("stepsPanel").hidden = false;
  $("summaryTitle").textContent = route.summaryTitle;

  const badge = $("summaryBadge");
  badge.textContent = route.badge;
  badge.classList.toggle("same-floor", route.floorDiff === 0);

  $("statDistance").textContent = formatMeters(route.totalMeters);
  $("statTime").textContent = formatMinutes(route.timeMinutes);
  $("statFloorsUsed").textContent = route.floorDiff === 0 ? "1" : String(route.floorDiff);
  $("statFloorsLabel").textContent = route.floorDiff === 0 ? "层" : "层差";
  $("summaryMeta").textContent = route.summaryMeta;

  renderFloorPath();
}

function renderFloorPath() {
  const host = $("floorPath");
  host.innerHTML = "";
  const route = state.route;
  if (!route) return;

  const low = Math.min(
    floorIndex(route.start.floor.id),
    floorIndex(route.end.floor.id)
  );
  const high = Math.max(
    floorIndex(route.start.floor.id),
    floorIndex(route.end.floor.id)
  );

  for (let i = low; i <= high; i += 1) {
    if (i > low) {
      const arrow = document.createElement("span");
      arrow.className = "floor-arrow stairs";
      arrow.textContent = route.up ? "↑" : "↓";
      host.appendChild(arrow);
    }

    const floor = state.floors[i];
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "floor-chip";
    chip.dataset.floor = floor.id;
    chip.textContent = floor.id;
    chip.title = `${floorLabel(floor)}平面图`;
    if (i !== low && i !== high) chip.classList.add("via");
    chip.classList.toggle("active", Boolean(state.floor) && state.floor.id === floor.id);
    chip.addEventListener("click", () => loadFloor(floor.id));
    host.appendChild(chip);
  }
}

function renderSteps() {
  const host = $("stepsList");
  host.innerHTML = "";
  const route = state.route;
  if (!route) return;

  $("stepCount").textContent = `${route.steps.length} 步`;

  route.steps.forEach((step, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "step-btn";
    button.dataset.index = String(index);

    const iconText = step.kind === "start"
      ? "起"
      : step.kind === "end"
        ? "终"
        : step.kind === "stairs"
          ? "梯"
          : "→";

    button.innerHTML =
      `<span class="step-icon ${step.kind}">${iconText}</span>` +
      `<span class="step-body">` +
        `<span class="step-title">${escapeHtml(step.title)}</span>` +
        `<span class="step-detail">${escapeHtml(step.detail)}</span>` +
      `</span>` +
      `<span class="step-connector"></span>`;

    button.addEventListener("click", () => activateStep(index));
    host.appendChild(button);
  });
}

function activateStep(index, options = {}) {
  if (!state.route) return;
  const step = state.route.steps[index];
  if (!step) return;

  state.activeStepIndex = index;
  document.querySelectorAll(".step-btn").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.index) === index);
  });

  const needFloorChange = state.floor.id !== step.floorId;
  if (needFloorChange) {
    loadFloor(step.floorId, { focusPoint: step.point });
  } else if (!options.keepFloor) {
    state.map.setView(pointToLatLng(state.floor, step.point), Math.max(state.map.getZoom(), 0.8), {
      animate: true,
    });
  }
}

/* ============================== route drawing ============================== */

function markerIcon(className, text, size = 28) {
  return L.divIcon({
    className: "",
    html: `<div class="marker-pin ${className}" style="width:${size}px;height:${size}px">${text}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function stairIcon(text) {
  return L.divIcon({
    className: "",
    html: `<div class="marker-pin stair">${text}</div>`,
    iconSize: [44, 24],
    iconAnchor: [22, 12],
  });
}

function viaIcon(text) {
  return L.divIcon({
    className: "",
    html: `<div class="marker-pin via">${text}</div>`,
    iconSize: [48, 24],
    iconAnchor: [24, 12],
  });
}

function clearRouteLayer() {
  state.routeLayer.clearLayers();
}

function renderRouteOnFloor() {
  clearRouteLayer();
  if (!state.route) return;

  const segment = state.route.segments.find((item) => item.floorId === state.floor.id);
  if (!segment) return;

  const floor = state.floor;

  if (segment.kind === "via") {
    const point = segment.points[0];
    if (!point) return;
    L.marker(pointToLatLng(floor, point), {
      icon: viaIcon("途经"),
      interactive: false,
      zIndexOffset: 900,
    }).addTo(state.routeLayer);
    return;
  }

  const latlngs = segment.points.map((point) => pointToLatLng(floor, point));

  L.polyline(latlngs, {
    color: "#0b1f3a",
    weight: 11,
    opacity: 0.28,
    lineCap: "round",
    lineJoin: "round",
    className: "route-casing",
    interactive: false,
  }).addTo(state.routeLayer);

  L.polyline(latlngs, {
    color: "#f97316",
    weight: 6,
    opacity: 1,
    lineCap: "round",
    lineJoin: "round",
    className: "route-line",
    interactive: false,
  }).addTo(state.routeLayer);

  L.polyline(latlngs, {
    color: "#fff",
    weight: 2,
    opacity: 0.9,
    dashArray: "2 9",
    lineCap: "round",
    className: "route-dash",
    interactive: false,
  }).addTo(state.routeLayer);

  addDirectionArrow(floor, segment.points);

  if (segment.kind === "same") {
    addStartMarker(floor, segment.points[0]);
    addEndMarker(floor, segment.points[segment.points.length - 1]);
  } else if (segment.kind === "start") {
    addStartMarker(floor, segment.points[0]);
    addStairMarker(
      floor,
      segment.points[segment.points.length - 1],
      `${state.route.up ? "↑" : "↓"}${state.route.floorDiff}`
    );
  } else if (segment.kind === "end") {
    addStairMarker(
      floor,
      segment.points[0],
      `${state.route.up ? "↑" : "↓"}${state.route.floorDiff}`
    );
    addEndMarker(floor, segment.points[segment.points.length - 1]);
  }
}

function addDirectionArrow(floor, points) {
  if (!points || points.length < 2) return;

  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  if (total < 12) return;

  let target = total * 0.56;
  let point = points[0];
  let angle = 0;
  for (let i = 1; i < points.length; i += 1) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const length = Math.hypot(dx, dy);
    if (target <= length) {
      const ratio = target / length;
      point = { x: points[i - 1].x + dx * ratio, y: points[i - 1].y + dy * ratio };
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      break;
    }
    target -= length;
  }

  L.marker(pointToLatLng(floor, point), {
    icon: L.divIcon({
      className: "",
      html: `<div class="route-arrow" style="transform:rotate(${angle}deg)"><svg viewBox="0 0 24 24"><path d="M3 12h15M12 6l6 6-6 6"></path></svg></div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    }),
    interactive: false,
    zIndexOffset: 800,
  }).addTo(state.routeLayer);
}

function addStartMarker(floor, point) {
  L.marker(pointToLatLng(floor, point), {
    icon: markerIcon("start", "起"),
    interactive: false,
    zIndexOffset: 1000,
  }).addTo(state.routeLayer);
}

function addEndMarker(floor, point) {
  L.marker(pointToLatLng(floor, point), {
    icon: markerIcon("end", "终"),
    interactive: false,
    zIndexOffset: 1000,
  }).addTo(state.routeLayer);
}

function addStairMarker(floor, point, text) {
  L.marker(pointToLatLng(floor, point), {
    icon: stairIcon(text),
    interactive: false,
    zIndexOffset: 950,
  }).addTo(state.routeLayer);
}

/* ============================== clear / swap ============================== */

function clearRoute(options = {}) {
  state.route = null;
  state.activeStepIndex = -1;
  state.selectedRef = null;
  clearRouteLayer();
  hideRoomCard();
  $("summaryPanel").hidden = true;
  $("stepsPanel").hidden = true;
  $("routeBadge").hidden = true;
  updateRouteRail();

  if (!options.keepRefs) {
    state.startRef = null;
    state.endRef = null;
    $("startSelect").value = "";
    $("endSelect").value = "";
    showMessage("选择起点和终点后，点击「规划路线」。");
    if (state.floor) fitCurrent();
  }

  applyAllRoomStyles();
  updateRoomChipSelection();
}

function swapEndpoints() {
  if (!state.startRef || !state.endRef) {
    showMessage("先选择起点和终点，再交换。", "bad");
    return;
  }
  if (state.startRef.room.type !== "classroom") {
    showMessage("起点不是教室，交换后终点会不符合「终点仅教室」的要求。", "bad");
    return;
  }
  const oldStart = state.startRef;
  const oldEnd = state.endRef;
  state.startRef = oldEnd;
  state.endRef = oldStart;
  $("startSelect").value = state.startRef.room._key;
  $("endSelect").value = state.endRef.room._key;
  applyAllRoomStyles();
  updateRoomChipSelection();
  planRoute({ show: "start" });
}

/* ============================== init / UI bindings ============================== */

function setInitialSelection() {
  const startFloor = state.floorMap.get("1F");
  const endFloor = state.floorMap.get("5F");
  const startRoom = startFloor?.rooms.find((room) => room.name === "101" && room.rect);
  const endRoom = endFloor?.rooms.find((room) => room.name === "538" && room.rect);

  if (startRoom && endRoom) {
    state.startRef = { floor: startFloor, room: startRoom };
    state.endRef = { floor: endFloor, room: endRoom };
    $("startSelect").value = startRoom._key;
    $("endSelect").value = endRoom._key;
  }
}

function toggleAllHotspots() {
  state.showAllHotspots = !state.showAllHotspots;
  $("allHotspotsBtn").classList.toggle("active", state.showAllHotspots);
  $("allHotspotsBtn").setAttribute("aria-pressed", String(state.showAllHotspots));
  $("allHotspotsBtn").textContent = state.showAllHotspots ? "全部热点" : "关键热点";
  renderRoomLayers();
  renderRouteOnFloor();
}

function toggleHotspotVisibility() {
  state.hotspotsVisible = !state.hotspotsVisible;
  $("hotspotBtn").classList.toggle("active", state.hotspotsVisible);
  if (state.hotspotsVisible) state.roomGroup.addTo(state.map);
  else state.map.removeLayer(state.roomGroup);
}

function bindUI() {
  $("fitBtn").addEventListener("click", fitCurrent);
  $("fitBtnMap").addEventListener("click", fitCurrent);
  $("allHotspotsBtn").addEventListener("click", toggleAllHotspots);
  $("hotspotBtn").addEventListener("click", toggleHotspotVisibility);
  $("swapBtn").addEventListener("click", swapEndpoints);
  $("planBtn").addEventListener("click", () => planRoute({ show: "start" }));
  $("clearBtn").addEventListener("click", () => clearRoute({ keepRefs: false }));

  $("roomCardClose").addEventListener("click", () => {
    state.selectedRef = null;
    applyAllRoomStyles();
    hideRoomCard();
  });

  $("setStartBtn").addEventListener("click", () => {
    if (!state.selectedRef) return;
    const { floor, room } = state.selectedRef;
    setStartRef(floor, room, { plan: true });
    hideRoomCard();
  });

  $("setEndBtn").addEventListener("click", () => {
    if (!state.selectedRef) return;
    const { floor, room } = state.selectedRef;
    if (room.type !== "classroom") {
      showMessage("终点只使用教室热点。", "bad");
      return;
    }
    setEndRef(floor, room, { plan: true });
    hideRoomCard();
  });

  $("searchInput").addEventListener("input", (event) => {
    renderSearchResults(event.target.value.trim());
  });

  $("searchInput").addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    const first = $("searchResults").querySelector(".search-result");
    if (first) first.click();
  });

  window.addEventListener("resize", () => {
    if (state.map) state.map.invalidateSize();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      state.selectedRef = null;
      applyAllRoomStyles();
      hideRoomCard();
      $("searchResults").hidden = true;
    }
  });
}

function findRoomByParam(value) {
  if (!value) return null;
  const [floorId, ...nameParts] = value.split(":");
  const floor = state.floorMap.get(floorId);
  const roomName = nameParts.join(":");
  if (!floor || !roomName) return null;
  const room = floor.rooms.find((item) => item.name === roomName && item.rect);
  return room ? { floor, room } : null;
}

function applyDeepLink(params) {
  let applied = false;

  const startTarget = findRoomByParam(params.get("start"));
  if (startTarget) {
    state.startRef = startTarget;
    $("startSelect").value = startTarget.room._key;
    applied = true;
  }

  const endTarget = findRoomByParam(params.get("end"));
  if (endTarget && endTarget.room.type === "classroom") {
    state.endRef = endTarget;
    $("endSelect").value = endTarget.room._key;
    applied = true;
  }

  // Clicking 101 on the map would otherwise produce 101 → 101. Keep the
  // destination and move the default start to the nearest other classroom.
  if (state.startRef && state.endRef && state.startRef.room === state.endRef.room) {
    const floor = state.startRef.floor;
    const center = rectCenter(floor, state.endRef.room.rect);
    const alternative = floor.rooms
      .filter((room) => room.type === "classroom" && room.rect && room !== state.endRef.room)
      .map((room) => {
        const candidate = rectCenter(floor, room.rect);
        return {
          room,
          distance: Math.hypot(candidate.x - center.x, candidate.y - center.y),
        };
      })
      .sort((a, b) => a.distance - b.distance)[0]?.room;

    if (alternative) {
      state.startRef = { floor, room: alternative };
      $("startSelect").value = alternative._key;
    }
  }

  return {
    applied,
    showEnd: params.get("show") === "end",
  };
}

function applyBackLink(params) {
  const link = $("backToMap");
  if (!link) return;

  const back = params.get("back");
  if (back) {
    link.href = back;
    link.hidden = false;
    return;
  }

  const path = location.pathname;
  if (path.includes("/campus-b-navigation/")) {
    link.href = "../campus-map-site/index.html";
    link.hidden = false;
  } else if (path.includes("/b-navigation/")) {
    link.href = "../index.html";
    link.hidden = false;
  } else {
    // Standalone server rooted at campus-b-navigation/ has no sibling map page.
    link.hidden = true;
  }
}

function init() {
  const data = window.B_NAV_DATA;
  if (!data || !Array.isArray(data.floors) || !data.floors.length) {
    $("loading").textContent = "平面图数据加载失败：请确认 data/b-floorplan.js 存在。";
    return;
  }

  prepareData();
  initMap();
  buildFloorRail();
  populateSelectors();
  renderLegend();
  bindUI();
  setInitialSelection();

  const params = new URLSearchParams(location.search);
  applyBackLink(params);
  const deepLink = applyDeepLink(params);

  const hashMatch = location.hash.match(/#B\/(\dF)/);
  const initialFloor = state.floorMap.has(hashMatch?.[1]) ? hashMatch[1] : "1F";
  loadFloor(initialFloor);

  $("loading").classList.add("hidden");

  // A shared floor link should stay on that floor; the plain entry page opens
  // with a ready-made 101 → 538 example route. Deep links from the campus map
  // always plan and can open on the destination floor.
  if (deepLink.applied && state.startRef && state.endRef) {
    setTimeout(() => planRoute({ show: deepLink.showEnd ? "end" : "start" }), 120);
  } else if (!hashMatch && state.startRef && state.endRef) {
    setTimeout(() => planRoute({ show: "start" }), 120);
  }
}

init();
