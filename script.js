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
  renderRoomList();
  setInfo(null);

  if (state.pendingRoom) {
    const pending = state.pendingRoom;
    state.pendingRoom = null;
    requestAnimationFrame(() => selectRoom(pending));
  }
}

function addRoomLayer(room) {
  const layer = L.rectangle(rectToBounds(room.rect), {
    color: "#1d4ed8",
    weight: 2.5,
    fillColor: "#3b82f6",
    fillOpacity: 0.14,
    className: "room-rect",
  });

  layer.bindTooltip(room.name, { sticky: true, direction: "top", className: "room-tip", opacity: 1 });
  layer.bindPopup(
    `<div class="popup-title">${escapeHtml(room.name)}</div>` +
    `<div class="popup-sub">${escapeHtml(state.building.name)} · ${floorLabel(state.floor)} · ${TYPE_LABEL[room.type] || "房间"}</div>`,
    { closeButton: false, offset: [0, -4] }
  );

  layer.on("mouseover", () => {
    if (state.selectedRoom !== room) layer.setStyle({ fillOpacity: 0.38, weight: 3.2 });
  });
  layer.on("mouseout", () => {
    if (state.selectedRoom !== room) {
      layer.setStyle({ color: "#1d4ed8", weight: 2.5, fillColor: "#3b82f6", fillOpacity: 0.14 });
    }
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

init();
