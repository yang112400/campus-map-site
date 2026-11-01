/* 场景构建：地面、道路、楼栋、校门、树、标签、网格 */
(function () {
  const C = window.CAMPUS;

  const COLORS = {
    bg: 0x0c1016,
    ground: 0x22301f,
    road: 0x171b21,
    sidewalk: 0x2b333d,
    line: 0xd8b24a,
    grid1: 0x2b3644,
    grid2: 0x1d2530
  };

  function canvasTexture(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    draw(ctx, w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }

  function makeGrassTexture() {
    return canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#24301f";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) {
        const x = Math.random() * w, y = Math.random() * h;
        const g = 40 + Math.random() * 34;
        ctx.fillStyle = `rgba(${28 + Math.random() * 20},${g},${24 + Math.random() * 18},${0.25 + Math.random() * 0.35})`;
        ctx.fillRect(x, y, 1.4, 1.4);
      }
    });
  }

  function makeFacadeTexture(baseColor) {
    return canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, w, h);
      // subtle vertical shading
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(0,0,0,0.16)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.04)");
      grad.addColorStop(1, "rgba(0,0,0,0.16)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const cols = 4, rows = 4;
      const pad = 12;
      const cw = (w - pad * (cols + 1)) / cols;
      const ch = (h - pad * (rows + 1)) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = pad + c * (cw + pad);
          const y = pad + r * (ch + pad);
          ctx.fillStyle = "#2c3a45";
          ctx.fillRect(x, y, cw, ch);
          const g2 = ctx.createLinearGradient(x, y, x, y + ch);
          g2.addColorStop(0, "rgba(150,196,222,0.75)");
          g2.addColorStop(0.45, "rgba(90,135,165,0.45)");
          g2.addColorStop(1, "rgba(35,55,72,0.7)");
          ctx.fillStyle = g2;
          ctx.fillRect(x + 1.5, y + 1.5, cw - 3, ch - 3);
          ctx.strokeStyle = "rgba(20,26,32,0.55)";
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x, y, cw, ch);
        }
      }
    });
  }

  function makeDashTexture() {
    return canvasTexture(16, 64, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(216,178,74,0.85)";
      ctx.fillRect(w / 2 - 2, 8, 4, 28);
    });
  }

  function makeTextSprite(text, opts) {
    opts = opts || {};
    const fontSize = opts.fontSize || 44;
    const padX = opts.padX || 26;
    const padY = opts.padY || 16;
    const accent = opts.accent || "#5ab0ff";
    const color = opts.color || "#eaf2fb";
    const bg = opts.bg || "rgba(12,17,24,0.78)";
    const border = opts.border || "rgba(255,255,255,0.10)";

    const measureCanvas = document.createElement("canvas");
    const mctx = measureCanvas.getContext("2d");
    const font = `${opts.weight || 600} ${fontSize}px -apple-system, "Microsoft YaHei", "PingFang SC", sans-serif`;
    mctx.font = font;
    const tw = Math.ceil(mctx.measureText(text).width);

    const w = tw + padX * 2 + (opts.dot ? 34 : 0);
    const h = fontSize + padY * 2;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");

    // rounded rect
    const r = Math.min(18, h / 2);
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
    ctx.closePath();
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();

    let tx = padX;
    if (opts.dot) {
      ctx.beginPath();
      ctx.arc(padX + 5, h / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      tx += 34;
    }
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textBaseline = "middle";
    ctx.fillText(text, tx, h / 2 + 1);

    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
    const sprite = new THREE.Sprite(mat);
    sprite.renderOrder = 10;
    const scale = opts.scale || 1;
    sprite.scale.set((w / h) * 3.2 * scale, 3.2 * scale, 1);
    return sprite;
  }

  function addBox(group, w, h, d, x, y, z, material, shadow) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x, y, z);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    group.add(m);
    return m;
  }

  function buildCampus(scene) {
    const root = new THREE.Group();
    scene.add(root);

    // ---------- ground ----------
    const grassTex = makeGrassTexture();
    grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping;
    grassTex.repeat.set(26, 26);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(C.size, C.size),
      new THREE.MeshStandardMaterial({ map: grassTex, color: 0xffffff, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(C.size / 2, 0, C.size / 2);
    ground.receiveShadow = true;
    root.add(ground);

    // ---------- roads ----------
    const roadMat = new THREE.MeshStandardMaterial({ color: COLORS.road, roughness: 0.95, metalness: 0 });
    const walkMat = new THREE.MeshStandardMaterial({ color: COLORS.sidewalk, roughness: 0.95, metalness: 0 });
    const dashTex = makeDashTexture();
    dashTex.wrapS = dashTex.wrapT = THREE.RepeatWrapping;

    C.roads.forEach((r) => {
      const len = r.to - r.from;
      const mid = (r.from + r.to) / 2;
      if (r.dir === "v") {
        const road = new THREE.Mesh(new THREE.PlaneGeometry(r.width, len), roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(r.center, 0.012, mid);
        road.receiveShadow = true;
        root.add(road);

        [-1, 1].forEach((s) => {
          const sw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, len), walkMat);
          sw.rotation.x = -Math.PI / 2;
          sw.position.set(r.center + s * (r.width / 2 + 0.45), 0.016, mid);
          sw.receiveShadow = true;
          root.add(sw);
        });

        const dashMat = new THREE.MeshBasicMaterial({ map: dashTex.clone(), transparent: true, opacity: 0.55, depthWrite: false });
        dashMat.map.repeat.set(1, len / 8);
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.28, len), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(r.center, 0.022, mid);
        root.add(dash);
      } else {
        const road = new THREE.Mesh(new THREE.PlaneGeometry(len, r.width), roadMat);
        road.rotation.x = -Math.PI / 2;
        road.position.set(mid, 0.012, r.center);
        road.receiveShadow = true;
        root.add(road);

        [-1, 1].forEach((s) => {
          const sw = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.9), walkMat);
          sw.rotation.x = -Math.PI / 2;
          sw.position.set(mid, 0.016, r.center + s * (r.width / 2 + 0.45));
          sw.receiveShadow = true;
          root.add(sw);
        });

        const dashMat = new THREE.MeshBasicMaterial({ map: dashTex.clone(), transparent: true, opacity: 0.55, depthWrite: false });
        dashMat.map.repeat.set(len / 8, 1);
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.28), dashMat);
        dash.rotation.x = -Math.PI / 2;
        dash.position.set(mid, 0.022, r.center);
        root.add(dash);
      }
    });

    // ---------- building access walkways ----------
    const nodeMap = {};
    C.nodes.forEach((n) => { nodeMap[n.id] = n; });
    C.edges.filter((e) => {
      const n = e[2] || "";
      return n.indexOf("步道") >= 0 || n.indexOf("连廊") >= 0;
    }).forEach(([aId, bId]) => {
      const a = nodeMap[aId], b = nodeMap[bId];
      if (!a || !b) return;
      const dx = b.x - a.x, dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.5) return;
      const g = new THREE.Group();
      g.position.set((a.x + b.x) / 2, 0.014, (a.z + b.z) / 2);
      g.rotation.y = Math.atan2(-dz, dx);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(len, 3.4), walkMat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.receiveShadow = true;
      g.add(mesh);
      root.add(g);
    });

    // road name labels
    const roadLabels = [
      { text: "学府大道", x: 150, z: 250, rot: 0 },
      { text: "学府大道", x: 150, z: 100, rot: 0 },
      { text: "中心路", x: 110, z: 150, rot: 0 },
      { text: "中心路", x: 200, z: 150, rot: 0 },
      { text: "北环路", x: 200, z: 70, rot: 0 },
      { text: "南环路", x: 100, z: 230, rot: 0 },
      { text: "西一路", x: 60, z: 195, rot: 0 },
      { text: "东一路", x: 240, z: 100, rot: 0 }
    ];
    roadLabels.forEach((l) => {
      const s = makeTextSprite(l.text, { fontSize: 34, color: "#8fa0b4", bg: "rgba(12,17,24,0.0)", border: "rgba(0,0,0,0)", padX: 8, padY: 4, scale: 0.62 });
      s.position.set(l.x, 0.9, l.z);
      root.add(s);
    });

    // ---------- buildings ----------
    const buildings = {};
    C.buildings.forEach((b) => {
      const w = b.x1 - b.x0;
      const d = b.z1 - b.z0;
      const cx = (b.x0 + b.x1) / 2;
      const cz = (b.z0 + b.z1) / 2;

      const facade = makeFacadeTexture(b.color);
      facade.wrapS = facade.wrapT = THREE.RepeatWrapping;
      facade.repeat.set(Math.max(2, Math.round(w / 9)), Math.max(1, Math.round(b.h / 9)));
      const facadeMat = new THREE.MeshStandardMaterial({ map: facade, roughness: 0.82, metalness: 0.02 });
      const roofMat = new THREE.MeshStandardMaterial({ color: b.roof, roughness: 0.9, metalness: 0.05 });
      const mats = [facadeMat, facadeMat, roofMat, roofMat, facadeMat, facadeMat];

      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, b.h, d), mats);
      mesh.position.set(cx, b.h / 2, cz);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.building = b;
      root.add(mesh);
      buildings[b.id] = mesh;

      // parapet
      const parMat = new THREE.MeshStandardMaterial({ color: b.roof, roughness: 0.9 });
      addBox(root, w + 0.4, 0.7, 0.5, cx, b.h + 0.2, b.z0 + 0.25, parMat, false);
      addBox(root, w + 0.4, 0.7, 0.5, cx, b.h + 0.2, b.z1 - 0.25, parMat, false);
      addBox(root, 0.5, 0.7, d + 0.4, b.x0 + 0.25, b.h + 0.2, cz, parMat, false);
      addBox(root, 0.5, 0.7, d + 0.4, b.x1 - 0.25, b.h + 0.2, cz, parMat, false);

      // rooftop equipment
      const equipMat = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.8 });
      addBox(root, Math.min(6, w * 0.16), 1.6, Math.min(4, d * 0.2), cx - w * 0.2, b.h + 0.8, cz, equipMat);
      addBox(root, Math.min(4, w * 0.12), 1.2, Math.min(3, d * 0.16), cx + w * 0.22, b.h + 0.6, cz + d * 0.1, equipMat);

      if (b.id === "LIB") {
        const antMat = new THREE.MeshStandardMaterial({ color: 0xb9c2cc, roughness: 0.5 });
        const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 6), antMat);
        ant.position.set(cx, b.h + 3.5, cz - d * 0.15);
        ant.castShadow = true;
        root.add(ant);
      }
      if (b.id === "DORM_A" || b.id === "DORM_B") {
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x8e96a0, roughness: 0.7 });
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 12), tankMat);
        tank.position.set(cx + w * 0.2, b.h + 1.5, cz);
        tank.castShadow = true;
        root.add(tank);
      }

      // label
      const label = makeTextSprite(b.name, { fontSize: 44, dot: true, accent: "#5ab0ff", scale: 1.0 });
      label.position.set(cx, b.h + 5.5, cz);
      root.add(label);
    });

    // ---------- gate ----------
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xb9b1a2, roughness: 0.85 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xcfc8b8, roughness: 0.8 });
    addBox(root, 2.2, 7.2, 2.2, C.gate.x - 14, 3.6, C.gate.z, pillarMat);
    addBox(root, 2.2, 7.2, 2.2, C.gate.x + 14, 3.6, C.gate.z, pillarMat);
    addBox(root, 32, 1.1, 1.6, C.gate.x, 7.2, C.gate.z, gateMat);
    const sign = makeTextSprite("西安电子科技大学 · 校门", { fontSize: 42, dot: true, accent: "#e0b64a", scale: 1.0 });
    sign.position.set(C.gate.x, 9.4, C.gate.z);
    root.add(sign);
    // guard house
    addBox(root, 6, 3.2, 4, C.gate.x - 24, 1.6, C.gate.z + 2, new THREE.MeshStandardMaterial({ color: 0x9d968a, roughness: 0.9 }));

    // ---------- trees ----------
    const treeGroup = new THREE.Group();
    root.add(treeGroup);
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 1 });
    const leafMats = [
      new THREE.MeshStandardMaterial({ color: 0x2f5d3a, roughness: 1 }),
      new THREE.MeshStandardMaterial({ color: 0x3a6b45, roughness: 1 }),
      new THREE.MeshStandardMaterial({ color: 0x285233, roughness: 1 })
    ];

    function blocked(x, z) {
      for (const r of C.roads) {
        if (r.dir === "v" && Math.abs(x - r.center) < r.width / 2 + 4) return true;
        if (r.dir === "h" && Math.abs(z - r.center) < r.width / 2 + 4) return true;
      }
      for (const b of C.buildings) {
        if (x > b.x0 - 4 && x < b.x1 + 4 && z > b.z0 - 4 && z < b.z1 + 4) return true;
      }
      if (Math.abs(x - C.gate.x) < 22 && Math.abs(z - C.gate.z) < 12) return true;
      return false;
    }

    let placed = 0;
    for (let i = 0; i < 800 && placed < 46; i++) {
      const x = 8 + rnd() * (C.size - 16);
      const z = 8 + rnd() * (C.size - 16);
      if (blocked(x, z)) continue;
      const s = 0.75 + rnd() * 0.7;
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * s, 0.4 * s, 2.6 * s, 6), trunkMat);
      trunk.position.y = 1.3 * s;
      trunk.castShadow = true;
      g.add(trunk);
      const lm = leafMats[Math.floor(rnd() * leafMats.length)];
      const leaf1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9 * s, 0), lm);
      leaf1.position.y = 3.5 * s;
      leaf1.castShadow = true;
      g.add(leaf1);
      const leaf2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.35 * s, 0), lm);
      leaf2.position.set(0.7 * s, 4.6 * s, 0.4 * s);
      leaf2.castShadow = true;
      g.add(leaf2);
      g.position.set(x, 0, z);
      treeGroup.add(g);
      placed++;
    }

    // ---------- grid / helpers ----------
    const grid = new THREE.GridHelper(C.size, 30, COLORS.grid1, COLORS.grid2);
    grid.position.set(C.size / 2, 0.03, C.size / 2);
    grid.material.transparent = true;
    grid.material.opacity = 0.5;
    grid.visible = false;
    root.add(grid);

    // compass
    const compass = new THREE.Group();
    compass.position.set(14, 0, 14);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x5ab0ff, transparent: true, opacity: 0.55 });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.12, 8, 40), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.1;
    compass.add(ring);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.6, 4), new THREE.MeshBasicMaterial({ color: 0x5ab0ff }));
    cone.rotation.x = Math.PI / 2;
    cone.position.set(0, 0.2, -1.2);
    compass.add(cone);
    const nLabel = makeTextSprite("N", { fontSize: 40, color: "#9fd0ff", bg: "rgba(12,17,24,0)", border: "rgba(0,0,0,0)", padX: 6, padY: 2, scale: 0.7 });
    nLabel.position.set(0, 2.6, -4.4);
    compass.add(nLabel);
    root.add(compass);

    // 1m scale reference
    const scaleBox = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({ color: 0x5ab0ff, wireframe: true, transparent: true, opacity: 0.7 })
    );
    scaleBox.position.set(288, 0.5, 288);
    root.add(scaleBox);
    const scaleLabel = makeTextSprite("1 m", { fontSize: 32, color: "#9fd0ff", bg: "rgba(12,17,24,0.7)", border: "rgba(90,176,255,0.25)", padX: 8, padY: 4, scale: 0.55 });
    scaleLabel.position.set(288, 2.2, 288);
    root.add(scaleLabel);

    return { root, buildings, grid, treeGroup };
  }

  window.buildCampus = buildCampus;
  window.makeTextSprite = makeTextSprite;
})();
