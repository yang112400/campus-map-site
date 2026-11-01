/* 应用入口：场景、交互、选点、路线、UI */
(function () {
  const C = window.CAMPUS;
  const N = window.NavCore;

  // ---------------- renderer / scene ----------------
  const container = document.getElementById("app");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1016);
  scene.fog = new THREE.Fog(0x0c1016, 460, 980);

  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.5, 1400);
  camera.position.set(150, 300, 500);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  } catch (err) {
    const box = document.getElementById("loading");
    if (box) {
      box.innerHTML = '<div class="loading-inner"><div>当前浏览器不支持 WebGL，或已禁用硬件加速</div></div>';
      box.classList.remove("hide");
      box.style.display = "flex";
    }
    console.error("[nav] WebGL 初始化失败", err);
    window.__NAV_FAILED__ = true;
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ("outputEncoding" in renderer) renderer.outputEncoding = THREE.sRGBEncoding;
  if ("toneMapping" in renderer) {
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
  }
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.target.set(150, 0, 160);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 40;
  controls.maxDistance = 700;
  controls.screenSpacePanning = false;

  // ---------------- lights ----------------
  scene.add(new THREE.HemisphereLight(0xbdd7ff, 0x1a2216, 0.62));
  scene.add(new THREE.AmbientLight(0x33404f, 0.25));

  const sun = new THREE.DirectionalLight(0xfff1dc, 1.0);
  sun.position.set(250, 300, 90);
  sun.target.position.set(150, 0, 150);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -220;
  sun.shadow.camera.right = 220;
  sun.shadow.camera.top = 220;
  sun.shadow.camera.bottom = -220;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 800;
  sun.shadow.bias = -0.0004;
  scene.add(sun);
  scene.add(sun.target);

  // ---------------- campus / graph ----------------
  const campus = window.buildCampus(scene);
  const graph = new N.Graph(C.nodes, C.edges);
  const routeRenderer = new N.RouteRenderer(scene);

  // debug road network
  const netGroup = new THREE.Group();
  netGroup.visible = false;
  scene.add(netGroup);
  const netPos = [];
  graph.edges.forEach((e) => {
    const a = graph.nodes.get(e.a), b = graph.nodes.get(e.b);
    netPos.push(a.x, 0.35, a.z, b.x, 0.35, b.z);
  });
  const netGeo = new THREE.BufferGeometry();
  netGeo.setAttribute("position", new THREE.Float32BufferAttribute(netPos, 3));
  netGroup.add(new THREE.LineSegments(netGeo, new THREE.LineBasicMaterial({ color: 0x5ab0ff, transparent: true, opacity: 0.35 })));
  graph.nodes.forEach((n) => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.75, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0x5ab0ff, transparent: true, opacity: 0.85 })
    );
    dot.position.set(n.x, 0.45, n.z);
    netGroup.add(dot);
  });

  // ---------------- state ----------------
  const state = { start: null, end: null, active: "start", route: null };

  // ---------------- UI ----------------
  const $ = (id) => document.getElementById(id);
  const startName = $("startName"), startSub = $("startSub");
  const endName = $("endName"), endSub = $("endSub");
  const startSelect = $("startSelect"), endSelect = $("endSelect");

  C.pois.forEach((p) => {
    const o1 = document.createElement("option");
    o1.value = p.node; o1.textContent = p.name;
    startSelect.appendChild(o1);
    const o2 = document.createElement("option");
    o2.value = p.node; o2.textContent = p.name;
    endSelect.appendChild(o2);
  });
  [startSelect, endSelect].forEach((s) => {
    const ph = document.createElement("option");
    ph.value = ""; ph.textContent = "— 地图点选 —";
    s.insertBefore(ph, s.firstChild);
    s.value = "";
  });

  function poiNameByNode(nodeId) {
    const p = C.pois.find((x) => x.node === nodeId);
    return p ? p.name : null;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  let toastTimer = null;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2400);
  }

  function updateCards() {
    const s = state.start, e = state.end;
    startName.textContent = s ? s.label : "点击地图选择";
    endName.textContent = e ? e.label : "点击地图选择";
    startSub.textContent = s ? `X ${s.x.toFixed(1)} · Z ${s.z.toFixed(1)} · 吸附 ${(s.snapDist || 0).toFixed(1)} m` : "—";
    endSub.textContent = e ? `X ${e.x.toFixed(1)} · Z ${e.z.toFixed(1)} · 吸附 ${(e.snapDist || 0).toFixed(1)} m` : "—";

    $("startCard").classList.toggle("active", state.active === "start");
    $("endCard").classList.toggle("active", state.active === "end");

    const sPoi = s && C.pois.find((p) => p.node === s.nodeId);
    const ePoi = e && C.pois.find((p) => p.node === e.nodeId);
    startSelect.value = sPoi ? sPoi.node : "";
    endSelect.value = ePoi ? ePoi.node : "";
  }

  function hideRouteCard() {
    $("routeCard").classList.remove("show");
  }

  function showRouteCard(distance, steps) {
    const d = distance >= 1000
      ? (distance / 1000).toFixed(2) + " <small>km</small>"
      : Math.round(distance) + " <small>m</small>";
    $("routeDist").innerHTML = d;
    $("routeTime").textContent = N.fmtTime(distance / N.WALK_SPEED);
    $("routeKind").textContent = "室外";
    $("steps").innerHTML = steps.map((s) => {
      const txt = escapeHtml(s.text).replace(/(\d+)\s*米/g, "<em>$1 米</em>");
      return `<div class="step"><div class="ico">${s.icon}</div><div class="txt">${txt}</div></div>`;
    }).join("");
    $("routeCard").classList.add("show");
  }

  // ---------------- selection ----------------
  function nodeSelection(nodeId, label, snapDist) {
    const n = graph.nodes.get(nodeId);
    if (!n) return null;
    return { nodeId, x: n.x, z: n.z, label: label || n.name, tempNode: null, snapDist: snapDist || 0 };
  }

  function pointSelection(pt, which) {
    const nn = graph.nearestNode(pt.x, pt.z, 7);
    if (nn) return nodeSelection(nn.node.id, nn.node.name, nn.dist);

    const ne = graph.nearestEdge(pt.x, pt.z, 16);
    if (!ne) return null;

    const na = graph.nodes.get(ne.edge.a);
    const nb = graph.nodes.get(ne.edge.b);
    const da = Math.hypot(pt.x - na.x, pt.z - na.z);
    const db = Math.hypot(pt.x - nb.x, pt.z - nb.z);
    if (Math.min(da, db) < 6) return nodeSelection(da < db ? na.id : nb.id, (da < db ? na : nb).name, Math.min(da, db));

    const id = which === "start" ? "TMP_START" : "TMP_END";
    const tempNode = {
      id, x: ne.point.x, z: ne.point.z,
      edges: [
        { to: ne.edge.a, length: Math.hypot(ne.point.x - na.x, ne.point.z - na.z), name: ne.edge.name },
        { to: ne.edge.b, length: Math.hypot(ne.point.x - nb.x, ne.point.z - nb.z), name: ne.edge.name }
      ]
    };
    return { nodeId: id, x: ne.point.x, z: ne.point.z, label: ne.edge.name + "路边", tempNode, snapDist: ne.dist };
  }

  function drawMarkers() {
    const s = state.start, e = state.end;
    routeRenderer.setMarkers(
      s ? { x: s.x, z: s.z } : null,
      e ? { x: e.x, z: e.z } : null,
      s ? s.label : "",
      e ? e.label : ""
    );
  }

  function computeRoute() {
    if (!state.start || !state.end) { hideRouteCard(); return; }
    if (state.start.nodeId === state.end.nodeId) {
      toast("起点与终点相同");
      drawMarkers();
      hideRouteCard();
      return;
    }
    const tempNodes = [];
    if (state.start.tempNode) tempNodes.push(state.start.tempNode);
    if (state.end.tempNode) tempNodes.push(state.end.tempNode);

    const r = graph.route(state.start.nodeId, state.end.nodeId, tempNodes);
    if (!r) {
      toast("两点之间暂不可达，请换一个点");
      drawMarkers();
      hideRouteCard();
      return;
    }

    const points = r.ids.map((id) => {
      if (id === "TMP_START") return { x: state.start.x, z: state.start.z };
      if (id === "TMP_END") return { x: state.end.x, z: state.end.z };
      const n = graph.nodes.get(id);
      return { x: n.x, z: n.z };
    });

    const inst = N.buildInstructions(points, r.edges, state.start.label, state.end.label);
    drawMarkers();
    routeRenderer.drawRoute(points);
    showRouteCard(r.distance, inst.steps);
    state.route = { r, points, steps: inst.steps };
  }

  function setEndpoint(which, sel) {
    if (!sel) return;
    state[which] = sel;
    if (state.active === which) state.active = which === "start" ? "end" : null;
    updateCards();
    drawMarkers();
    if (state.start && state.end) computeRoute();
    else hideRouteCard();
  }

  // ---------------- click / hover ----------------
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const buildingMeshes = Object.values(campus.buildings);
  let pointerDown = null;

  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (e.button === 0) pointerDown = { x: e.clientX, y: e.clientY };
  });

  function rayFromEvent(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
  }

  renderer.domElement.addEventListener("pointerup", (e) => {
    if (e.button === 0) setTimeout(() => { pointerDown = null; }, 0);
  });

  renderer.domElement.addEventListener("click", (e) => {
    if (pointerDown) {
      const moved = Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y);
      pointerDown = null;
      if (moved > 4) return;
    }
    rayFromEvent(e);
    const hit = raycaster.intersectObjects(buildingMeshes, false)[0];
    const which = state.active || "end";

    if (hit) {
      const b = hit.object.userData.building;
      setEndpoint(which, nodeSelection(b.node, b.name, 0));
      return;
    }

    const pt = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, pt)) return;
    if (pt.x < -5 || pt.x > C.size + 5 || pt.z < -5 || pt.z > C.size + 5) return;

    const sel = pointSelection({ x: pt.x, z: pt.z }, which);
    if (!sel) { toast("请点击道路或建筑附近"); return; }
    if (sel.snapDist > 5) toast(`已吸附到最近道路，偏移 ${sel.snapDist.toFixed(1)} m`);
    setEndpoint(which, sel);
  });

  renderer.domElement.addEventListener("pointermove", (e) => {
    rayFromEvent(e);
    const pt = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(groundPlane, pt)) return;
    $("coord").textContent = `X ${pt.x.toFixed(1)} m · Z ${pt.z.toFixed(1)} m`;
  });

  // ---------------- UI events ----------------
  $("startCard").addEventListener("click", (e) => {
    if (e.target.tagName === "SELECT") return;
    state.active = "start";
    updateCards();
  });
  $("endCard").addEventListener("click", (e) => {
    if (e.target.tagName === "SELECT") return;
    state.active = "end";
    updateCards();
  });
  startSelect.addEventListener("change", (e) => {
    const node = e.target.value;
    if (!node) return;
    setEndpoint("start", nodeSelection(node, poiNameByNode(node) || node, 0));
  });
  endSelect.addEventListener("change", (e) => {
    const node = e.target.value;
    if (!node) return;
    setEndpoint("end", nodeSelection(node, poiNameByNode(node) || node, 0));
  });

  $("btnSwap").addEventListener("click", () => {
    const t = state.start;
    state.start = state.end;
    state.end = t;
    updateCards();
    if (state.start && state.end) computeRoute();
    else drawMarkers();
  });

  $("btnReset").addEventListener("click", () => {
    state.start = null;
    state.end = null;
    state.active = "start";
    state.route = null;
    routeRenderer.clear();
    hideRouteCard();
    updateCards();
  });

  // ---------------- camera views ----------------
  const VIEWS = {
    iso: { pos: [150, 300, 500], target: [150, 0, 160] },
    top: { pos: [150, 385, 150.01], target: [150, 0, 150] }
  };
  let camTween = null;
  function flyTo(view) {
    camTween = {
      p0: camera.position.clone(),
      p1: new THREE.Vector3(...view.pos),
      t0: controls.target.clone(),
      t1: new THREE.Vector3(...view.target),
      t: 0,
      dur: 0.85
    };
  }
  document.querySelectorAll("[data-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-view]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      flyTo(VIEWS[btn.dataset.view]);
    });
  });

  $("btnNet").addEventListener("click", (e) => {
    netGroup.visible = !netGroup.visible;
    e.currentTarget.classList.toggle("active", netGroup.visible);
  });
  $("btnGrid").addEventListener("click", (e) => {
    campus.grid.visible = !campus.grid.visible;
    e.currentTarget.classList.toggle("active", campus.grid.visible);
  });

  // ---------------- default demo ----------------
  state.start = nodeSelection("GATE", "校门", 0);
  state.end = nodeSelection("ENT_A", "A栋", 0);
  state.active = null;
  updateCards();
  computeRoute();

  // ---------------- loop ----------------
  let last = performance.now();
  let frames = 0;
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    routeRenderer.update(dt);

    if (camTween) {
      camTween.t += dt;
      let k = Math.min(1, camTween.t / camTween.dur);
      k = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(camTween.p0, camTween.p1, k);
      controls.target.lerpVectors(camTween.t0, camTween.t1, k);
      if (camTween.t >= camTween.dur) camTween = null;
    }

    controls.update();
    renderer.render(scene, camera);

    frames++;
    if (frames === 2) {
      const loading = $("loading");
      loading.classList.add("hide");
      loading.style.display = "none";
      window.__NAV_READY__ = true;
    }
  }
  requestAnimationFrame(animate);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.NAV_APP = { state, graph, computeRoute, setEndpoint, nodeSelection, camera, controls, routeRenderer, toast };
})();
