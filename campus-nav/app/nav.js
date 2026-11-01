/* 导航核心：路网图、A*、3D 路线带、起终点标记、中文分步指引 */
(function () {
  const WALK_SPEED = 1.25; // m/s

  function dist2(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }

  function fmtMeters(m) {
    if (m >= 1000) return (m / 1000).toFixed(2) + " km";
    return Math.round(m) + " m";
  }
  function fmtTime(sec) {
    const m = Math.round(sec / 60);
    if (m < 1) return "不到 1 分钟";
    if (m < 60) return m + " 分钟";
    const h = Math.floor(m / 60), r = m % 60;
    return h + " 小时" + (r ? " " + r + " 分钟" : "");
  }

  // ---------------- Graph ----------------
  class Graph {
    constructor(nodes, edges) {
      this.nodes = new Map();
      nodes.forEach((n) => this.nodes.set(n.id, { id: n.id, x: n.x, z: n.z, name: n.name, type: n.type }));
      this.adj = new Map();
      this.nodes.forEach((n) => this.adj.set(n.id, []));
      this.edges = [];
      edges.forEach(([a, b, name]) => this.addEdge(a, b, name));
    }

    addEdge(a, b, name) {
      const na = this.nodes.get(a), nb = this.nodes.get(b);
      if (!na || !nb) { console.warn("edge missing node", a, b); return; }
      const length = dist2(na, nb);
      this.edges.push({ a, b, name, length });
      this.adj.get(a).push({ to: b, length, name });
      this.adj.get(b).push({ to: a, length, name });
    }

    nearestNode(x, z, maxDist) {
      let best = null, bestD = maxDist == null ? Infinity : maxDist;
      for (const n of this.nodes.values()) {
        const d = Math.hypot(n.x - x, n.z - z);
        if (d < bestD) { bestD = d; best = n; }
      }
      return best ? { node: best, dist: bestD } : null;
    }

    nearestEdge(x, z, maxDist) {
      let best = null, bestD = maxDist == null ? Infinity : maxDist;
      for (const e of this.edges) {
        const a = this.nodes.get(e.a), b = this.nodes.get(e.b);
        const vx = b.x - a.x, vz = b.z - a.z;
        const len2 = vx * vx + vz * vz;
        if (len2 === 0) continue;
        let t = ((x - a.x) * vx + (z - a.z) * vz) / len2;
        t = Math.max(0, Math.min(1, t));
        const px = a.x + vx * t, pz = a.z + vz * t;
        const d = Math.hypot(x - px, z - pz);
        if (d < bestD) {
          bestD = d;
          best = { edge: e, t, point: { x: px, z: pz }, dist: d };
        }
      }
      return best;
    }

    // temp: { id, x, z, edges: [{to, length, name}] }
    route(startId, goalId, tempNodes) {
      const adj = new Map();
      for (const [id, list] of this.adj) adj.set(id, list.slice());
      const nodes = this.nodes;
      (tempNodes || []).forEach((t) => {
        adj.set(t.id, t.edges.map((e) => ({ to: e.to, length: e.length, name: e.name })));
        t.edges.forEach((e) => {
          const arr = adj.get(e.to);
          if (arr) arr.push({ to: t.id, length: e.length, name: e.name });
        });
      });

      const heuristic = (id) => {
        const n = nodes.get(id);
        const g = nodes.get(goalId);
        if (!n || !g) return 0;
        return Math.hypot(n.x - g.x, n.z - g.z);
      };

      const open = new Set([startId]);
      const gScore = new Map([[startId, 0]]);
      const fScore = new Map([[startId, heuristic(startId)]]);
      const came = new Map();

      while (open.size) {
        let cur = null, best = Infinity;
        for (const id of open) {
          const v = fScore.get(id) == null ? Infinity : fScore.get(id);
          if (v < best) { best = v; cur = id; }
        }
        if (cur === goalId) break;
        open.delete(cur);

        const neighbors = adj.get(cur) || [];
        for (const e of neighbors) {
          const tentative = (gScore.get(cur) == null ? Infinity : gScore.get(cur)) + e.length;
          if (tentative < (gScore.get(e.to) == null ? Infinity : gScore.get(e.to))) {
            came.set(e.to, { from: cur, edge: e });
            gScore.set(e.to, tentative);
            fScore.set(e.to, tentative + heuristic(e.to));
            open.add(e.to);
          }
        }
      }

      if (startId !== goalId && !came.has(goalId)) return null;

      const ids = [goalId];
      const edges = [];
      let cur = goalId;
      let guard = 0;
      while (cur !== startId) {
        const c = came.get(cur);
        if (!c) return null;
        edges.unshift(c.edge);
        ids.unshift(c.from);
        cur = c.from;
        if (++guard > 10000) return null;
      }
      return { ids, edges, distance: gScore.get(goalId) || 0 };
    }

    pointOf(id) {
      const n = this.nodes.get(id);
      return n ? { x: n.x, z: n.z } : null;
    }
  }

  // ---------------- instructions ----------------
  const DIRS = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  function bearing(dx, dz) {
    // 0 = north (-Z), 90 = east (+X), 180 = south (+Z)
    let deg = Math.atan2(dx, -dz) * 180 / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  }
  function dirName(deg) {
    return DIRS[Math.round(deg / 45) % 8];
  }
  function turnName(prevDeg, curDeg) {
    let d = curDeg - prevDeg;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    if (Math.abs(d) < 25) return "直行";
    if (Math.abs(d) > 155) return "掉头";
    return d > 0 ? "右转" : "左转";
  }

  function buildInstructions(path, edges, startLabel, endLabel) {
    const steps = [];
    if (!path || path.length < 2) return { steps, total: 0 };

    // group consecutive edges by road name
    const groups = [];
    let g = null;
    for (let i = 0; i < edges.length; i++) {
      const name = edges[i].name || "步行道";
      const segLen = Math.hypot(path[i + 1].x - path[i].x, path[i + 1].z - path[i].z);
      if (!g || g.name !== name) {
        if (g) groups.push(g);
        g = { name, from: path[i], to: path[i + 1], distance: segLen };
      } else {
        g.to = path[i + 1];
        g.distance += segLen;
      }
    }
    if (g) groups.push(g);

    let prevDeg = null;
    let total = 0;
    groups.forEach((grp, idx) => {
      const dx = grp.to.x - grp.from.x;
      const dz = grp.to.z - grp.from.z;
      if (Math.hypot(dx, dz) < 0.5) return;
      const deg = bearing(dx, dz);
      const dir = dirName(deg);
      const turn = prevDeg == null ? "出发" : turnName(prevDeg, deg);
      total += grp.distance;
      const icon = prevDeg == null ? "●" : (turn === "右转" ? "↱" : turn === "左转" ? "↰" : turn === "掉头" ? "↺" : "↑");
      const text = prevDeg == null
        ? `从${startLabel}出发，沿${grp.name}向${dir}步行 ${Math.round(grp.distance)} 米`
        : `${turn}进入${grp.name}，向${dir}步行 ${Math.round(grp.distance)} 米`;
      steps.push({ icon, text, distance: grp.distance });
      prevDeg = deg;
    });

    steps.push({ icon: "◉", text: `到达${endLabel}`, distance: 0 });
    return { steps, total };
  }

  // ---------------- route geometry ----------------
  function makeChevronTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 64;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 128, 64);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < 3; i++) {
      const x = 18 + i * 40;
      ctx.beginPath();
      ctx.moveTo(x, 12);
      ctx.lineTo(x + 16, 32);
      ctx.lineTo(x, 52);
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.anisotropy = 4;
    return t;
  }

  function ribbonGeometry(points, width, y) {
    const n = points.length;
    if (n < 2) return null;
    const segN = [];
    for (let i = 0; i < n - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dz = points[i + 1].z - points[i].z;
      const len = Math.hypot(dx, dz) || 1;
      segN.push({ x: -dz / len, z: dx / len });
    }

    const pos = [], uv = [], idx = [];
    let acc = 0;
    for (let i = 0; i < n; i++) {
      let nx, nz;
      if (i === 0) { nx = segN[0].x; nz = segN[0].z; }
      else if (i === n - 1) { nx = segN[n - 2].x; nz = segN[n - 2].z; }
      else {
        let mx = segN[i - 1].x + segN[i].x;
        let mz = segN[i - 1].z + segN[i].z;
        const ml = Math.hypot(mx, mz) || 1;
        mx /= ml; mz /= ml;
        const dot = mx * segN[i - 1].x + mz * segN[i - 1].z;
        const scale = Math.min(3.5, 1 / Math.max(0.3, dot));
        nx = mx * scale; nz = mz * scale;
      }
      const hw = width / 2;
      pos.push(points[i].x + nx * hw, y, points[i].z + nz * hw);
      pos.push(points[i].x - nx * hw, y, points[i].z - nz * hw);
      if (i > 0) acc += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z);
      const u = acc / 4;
      uv.push(u, 0, u, 1);
      if (i < n - 1) {
        const a = i * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // ---------------- renderer ----------------
  class RouteRenderer {
    constructor(scene) {
      this.scene = scene;
      this.group = new THREE.Group();
      scene.add(this.group);
      this.chevron = makeChevronTexture();
      this.startMarker = null;
      this.endMarker = null;
      this.routeMeshes = [];
      this.time = 0;
    }

    clear() {
      const kids = this.group.children.slice();
      this.group.clear();
      kids.forEach((c) => {
        c.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            if (o.material.map && o.material.map !== this.chevron) o.material.map.dispose();
            o.material.dispose();
          }
        });
      });
      this.startMarker = null;
      this.endMarker = null;
      this.routeMeshes = [];
    }

    clearRouteOnly() {
      this.routeMeshes.forEach((m) => {
        this.group.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (m.material.map && m.material.map !== this.chevron) m.material.map.dispose();
          m.material.dispose();
        }
      });
      this.routeMeshes = [];
    }

    setMarkers(start, end, startLabel, endLabel) {
      this.clear();
      if (start) this.startMarker = this.makeMarker(start, 0x34d399, "起点", startLabel, "#34d399");
      if (end) this.endMarker = this.makeMarker(end, 0xff6b6b, "终点", endLabel, "#ff6b6b");
      if (this.startMarker) this.group.add(this.startMarker);
      if (this.endMarker) this.group.add(this.endMarker);
    }

    makeMarker(p, color, tag, label, cssColor) {
      const g = new THREE.Group();
      g.position.set(p.x, 0, p.z);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(1.8, 2.1, 0.2, 28),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 })
      );
      base.position.y = 0.14;
      g.add(base);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.4, 0.12, 8, 40),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75 })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.12;
      ring.userData.pulse = true;
      g.add(ring);

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 })
      );
      stem.position.y = 1.4;
      g.add(stem);

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.8, 18, 14),
        new THREE.MeshBasicMaterial({ color })
      );
      head.position.y = 2.9;
      g.add(head);

      const labelSprite = window.makeTextSprite(`${tag} · ${label}`, {
        fontSize: 40, dot: true, accent: cssColor, scale: 1.05
      });
      labelSprite.position.set(0, 5.0, 0);
      g.add(labelSprite);

      g.userData.ring = ring;
      return g;
    }

    drawRoute(points) {
      this.clearRouteOnly();
      if (!points || points.length < 2) return;

      // glow underlay
      const glowGeo = ribbonGeometry(points, 10.0, 0.1);
      if (glowGeo) {
        const glow = new THREE.Mesh(
          glowGeo,
          new THREE.MeshBasicMaterial({ color: 0x1f6fd0, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })
        );
        glow.renderOrder = 2;
        this.group.add(glow);
        this.routeMeshes.push(glow);
      }

      // solid base
      const baseGeo = ribbonGeometry(points, 3.6, 0.2);
      if (baseGeo) {
        const base = new THREE.Mesh(
          baseGeo,
          new THREE.MeshBasicMaterial({ color: 0x0f6fc4, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false })
        );
        base.renderOrder = 3;
        this.group.add(base);
        this.routeMeshes.push(base);
      }

      // chevrons overlay
      const geo = ribbonGeometry(points, 3.6, 0.22);
      if (!geo) return;
      const tex = this.chevron.clone();
      tex.needsUpdate = true;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      const mat = new THREE.MeshBasicMaterial({
        map: tex, color: 0xffffff, transparent: true, opacity: 0.9,
        side: THREE.DoubleSide, depthWrite: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 4;
      this.group.add(mesh);
      this.routeMeshes.push(mesh);
      this.routeMesh = mesh;
    }

    update(dt) {
      this.time += dt;
      if (this.routeMesh && this.routeMesh.material.map) {
        this.routeMesh.material.map.offset.x -= dt * 1.1;
      }
      const pulse = 1 + Math.sin(this.time * 3.2) * 0.12;
      [this.startMarker, this.endMarker].forEach((m) => {
        if (!m || !m.userData.ring) return;
        m.userData.ring.scale.set(pulse, pulse, pulse);
        m.userData.ring.material.opacity = 0.45 + 0.3 * (0.5 + 0.5 * Math.sin(this.time * 3.2));
      });
    }
  }

  window.NavCore = {
    Graph, RouteRenderer, buildInstructions, fmtMeters, fmtTime, WALK_SPEED, bearing, dirName
  };
})();
