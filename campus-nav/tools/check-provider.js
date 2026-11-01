#!/usr/bin/env node
/*
 * 外部提供方一致性校验脚本（campus-map-site）
 * ---------------------------------------------------------------
 * 校验目标：demo/assets/indoor-providers.js 里声明的楼栋 / 楼层 / 深链，
 *          是否与外部室内页 https://yang112400.github.io/campus-map-site/ 的实际数据一致。
 *
 * 做法：
 *   1. 用 Node https 请求站点首页与 assets/floorplan.js（断言 200）；
 *   2. 用 vm 执行 floorplan.js（伪造 window），读取 window.FLOORPLAN.buildings；
 *   3. 用 vm 加载本地 assets/indoor-providers.js，读取 window.INDOOR_PROVIDERS；
 *   4. 交叉比对楼栋集合、楼层集合（顺序无关）、排除项、深链生成；
 *   5. 检查首页响应头 / meta 中是否出现 X-Frame-Options（出现即 P1，因为会阻止 iframe 嵌入）。
 *
 * 运行：node tools/check-provider.js
 * 退出码：0 = PASS 或 SKIP（网络不可用时跳过，绝不伪造通过）；1 = FAIL
 * 可选环境变量：PROVIDER_TIMEOUT_MS（单次请求超时，默认 20000）
 */
"use strict";

const https = require("https");
const zlib = require("zlib");
const vm = require("vm");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, ".."); // demo/
const PROVIDERS_REL = "assets/indoor-providers.js";
const PROVIDERS_FILE = path.join(ROOT, PROVIDERS_REL);

const SITE_URL = "https://yang112400.github.io/campus-map-site/";
const FLOORPLAN_URL = SITE_URL + "assets/floorplan.js";
const EXPECTED_A_2F = "https://yang112400.github.io/campus-map-site/#A/2F";

/** 外部站点必须覆盖的楼栋（本地对接范围） */
const REQUIRED_BUILDINGS = ["A", "C", "E1", "E2", "E3", "F", "G"];
/** 明确排除、不对接外部室内页的楼栋 */
const EXCLUDED_BUILDINGS = ["B"];
/** 对照表的展示顺序 */
const ROW_ORDER = ["A", "B", "C", "E1", "E2", "E3", "F", "G"];

const TIMEOUT_MS = Number(process.env.PROVIDER_TIMEOUT_MS || 20000) || 20000;
const MAX_REDIRECTS = 5;
const T0 = Date.now();

let pass = 0;
let fail = 0;
const failures = [];
const p1 = [];

/* ------------------------------------------------------------------ */
/* 断言与输出                                                          */
/* ------------------------------------------------------------------ */

function section(title) {
  console.log("");
  console.log("== " + title + " ==");
}

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log("  PASS  " + name);
  } else {
    fail++;
    failures.push(name + (detail ? " :: " + detail : ""));
    console.log("  FAIL  " + name + (detail ? " :: " + detail : ""));
  }
  return !!cond;
}

/** 终端显示宽度（CJK 记 2 列），用于表格对齐 */
function dispWidth(s) {
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    const wide =
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0x303e) ||
      (c >= 0x3041 && c <= 0x33ff) ||
      (c >= 0x3400 && c <= 0x4dbf) ||
      (c >= 0x4e00 && c <= 0x9fff) ||
      (c >= 0xa000 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6);
    w += wide ? 2 : 1;
  }
  return w;
}

function padEndW(s, n) {
  const d = n - dispWidth(s);
  return d > 0 ? String(s) + " ".repeat(d) : String(s);
}

function renderTable(headers, rows) {
  const widths = headers.map((h, i) =>
    Math.max(dispWidth(h), ...rows.map((r) => dispWidth(r[i] === undefined ? "" : r[i])))
  );
  const format = (cells) =>
    "  " + cells.map((c, i) => padEndW(c === undefined ? "" : c, widths[i])).join(" │ ");
  console.log(format(headers));
  console.log("  " + widths.map((w) => "─".repeat(w)).join("─┼─"));
  rows.forEach((r) => console.log(format(r)));
}

/* ------------------------------------------------------------------ */
/* HTTPS 请求（跟随重定向、处理 gzip/br、超时）                        */
/* ------------------------------------------------------------------ */

function wrapNetError(e) {
  const err = new Error("网络错误: " + (e && e.code ? e.code + " " : "") + (e && e.message ? e.message : String(e)));
  err.isNetwork = true;
  return err;
}

function httpGet(url, redirectsLeft) {
  const left = redirectsLeft === undefined ? MAX_REDIRECTS : redirectsLeft;
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, val) => {
      if (settled) return;
      settled = true;
      fn(val);
    };

    let req;
    try {
      req = https.get(
        url,
        {
          headers: {
            "user-agent": "dsh-campus-demo/check-provider 1.0",
            accept: "*/*"
          },
          timeout: TIMEOUT_MS
        },
        (res) => {
          const status = res.statusCode || 0;
          const location = res.headers.location;

          if (status >= 300 && status < 400 && location && left > 0) {
            res.resume();
            let next;
            try {
              next = new URL(location, url).toString();
            } catch (e) {
              done(reject, wrapNetError(e));
              return;
            }
            httpGet(next, left - 1).then(
              (v) => done(resolve, v),
              (e) => done(reject, e)
            );
            return;
          }

          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            let buf = Buffer.concat(chunks);
            const enc = String(res.headers["content-encoding"] || "").toLowerCase();
            try {
              if (enc === "gzip" || enc === "x-gzip") buf = zlib.gunzipSync(buf);
              else if (enc === "deflate") buf = zlib.inflateSync(buf);
              else if (enc === "br") buf = zlib.brotliDecompressSync(buf);
            } catch (e) {
              done(reject, new Error("响应体解压失败: " + e.message));
              return;
            }
            done(resolve, {
              url: url,
              status: status,
              headers: res.headers,
              body: buf.toString("utf8")
            });
          });
          res.on("error", (e) => done(reject, wrapNetError(e)));
        }
      );
    } catch (e) {
      done(reject, wrapNetError(e));
      return;
    }

    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error("请求超时（" + TIMEOUT_MS + "ms）: " + url));
    });
    req.on("error", (e) => done(reject, wrapNetError(e)));
  });
}

function headerValue(headers, name) {
  const v = headers[name.toLowerCase()];
  if (v === undefined || v === null) return "";
  return Array.isArray(v) ? v.join(", ") : String(v);
}

/* ------------------------------------------------------------------ */
/* vm 沙箱与脚本加载                                                   */
/* ------------------------------------------------------------------ */

function canvasStub() {
  const noop = () => {};
  return {
    fillRect: noop,
    clearRect: noop,
    strokeRect: noop,
    drawImage: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    rect: noop,
    stroke: noop,
    fill: noop,
    save: noop,
    restore: noop,
    translate: noop,
    scale: noop,
    rotate: noop,
    setTransform: noop,
    fillText: noop,
    strokeText: noop,
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    getImageData: () => ({ data: [] }),
    putImageData: noop
  };
}

function fakeElement() {
  const noop = () => {};
  const el = {
    style: {},
    dataset: {},
    children: [],
    childNodes: [],
    textContent: "",
    innerHTML: "",
    classList: { add: noop, remove: noop, toggle: noop, contains: () => false },
    appendChild: (c) => c,
    append: noop,
    removeChild: noop,
    remove: noop,
    insertBefore: (c) => c,
    setAttribute: noop,
    getAttribute: () => null,
    hasAttribute: () => false,
    addEventListener: noop,
    removeEventListener: noop,
    querySelector: () => null,
    querySelectorAll: () => [],
    getContext: () => canvasStub(),
    getBoundingClientRect: () => ({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
    focus: noop,
    click: noop
  };
  return el;
}

function makeSandbox() {
  const noop = () => {};
  const doc = {
    createElement: () => fakeElement(),
    createElementNS: () => fakeElement(),
    getElementById: () => null,
    getElementsByClassName: () => [],
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: noop,
    removeEventListener: noop,
    body: fakeElement(),
    head: fakeElement(),
    documentElement: fakeElement(),
    title: ""
  };
  const sandbox = {
    console: { log: noop, info: noop, warn: noop, error: noop, debug: noop },
    document: doc,
    location: { href: SITE_URL, hash: "", pathname: "/campus-map-site/", search: "" },
    navigator: { userAgent: "check-provider/1.0" },
    history: { replaceState: noop, pushState: noop },
    performance: { now: () => 0 },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: noop,
    innerWidth: 1280,
    innerHeight: 800,
    addEventListener: noop,
    removeEventListener: noop
  };
  // 浏览器语义：window / self / globalThis 指向同一个全局对象
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  return sandbox;
}

/** 在沙箱里执行一段脚本，返回该沙箱的 window（即沙箱全局对象） */
function runScript(code, filename) {
  const sandbox = makeSandbox();
  const ctx = vm.createContext(sandbox);
  vm.runInContext(code, ctx, { filename: filename, timeout: 15000 });
  return ctx;
}

const NORMALIZE_FLOORPLAN = `(function () {
  var fp = window.FLOORPLAN;
  if (!fp || typeof fp !== "object") return "null";
  if (!Array.isArray(fp.buildings)) return "null";
  var out = [];
  for (var i = 0; i < fp.buildings.length; i++) {
    var b = fp.buildings[i] || {};
    var fl = Array.isArray(b.floors) ? b.floors : [];
    var floors = [];
    for (var j = 0; j < fl.length; j++) {
      var f = fl[j] || {};
      floors.push(f.id === undefined || f.id === null ? "" : String(f.id));
    }
    out.push({
      id: b.id === undefined || b.id === null ? "" : String(b.id),
      name: b.name === undefined || b.name === null ? "" : String(b.name),
      floors: floors
    });
  }
  return JSON.stringify(out);
})()`;

const NORMALIZE_PROVIDERS = `(function () {
  var p = window.INDOOR_PROVIDERS;
  if (!p || typeof p !== "object") return "null";
  var out = { provider: p.provider || "", baseUrl: p.baseUrl || "", excluded: [], byBuilding: {} };
  var ex = Array.isArray(p.excluded) ? p.excluded : [];
  for (var i = 0; i < ex.length; i++) out.excluded.push(String(ex[i]));
  var keys = Object.keys(p.byBuilding || {});
  for (var k = 0; k < keys.length; k++) {
    var key = keys[k];
    var e = p.byBuilding[key] || {};
    var fl = Array.isArray(e.floors) ? e.floors : [];
    var floors = [];
    for (var j = 0; j < fl.length; j++) {
      var f = fl[j] || {};
      floors.push(f.id === undefined || f.id === null ? "" : String(f.id));
    }
    out.byBuilding[key] = {
      providerBuildingId: e.providerBuildingId === undefined ? "" : String(e.providerBuildingId),
      defaultFloor: e.defaultFloor === undefined ? "" : String(e.defaultFloor),
      floors: floors
    };
  }
  return JSON.stringify(out);
})()`;

/* ------------------------------------------------------------------ */
/* 集合比较工具                                                        */
/* ------------------------------------------------------------------ */

function uniq(arr) {
  const seen = new Set();
  const out = [];
  arr.forEach((v) => {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  });
  return out;
}

function dupOf(arr) {
  const seen = new Set();
  const dups = new Set();
  arr.forEach((v) => (seen.has(v) ? dups.add(v) : seen.add(v)));
  return Array.from(dups);
}

function sameIdSet(a, b) {
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const v of sa) if (!sb.has(v)) return false;
  return true;
}

function diffSets(a, b) {
  const sb = new Set(b);
  return a.filter((v) => !sb.has(v));
}

/* ------------------------------------------------------------------ */
/* 收尾                                                                */
/* ------------------------------------------------------------------ */

function finish() {
  section("统计");
  console.log("  断言总数: " + (pass + fail) + "   PASS: " + pass + "   FAIL: " + fail);
  if (p1.length) {
    console.log("  P1 问题: " + p1.length);
    p1.forEach((t) => console.log("   - [P1] " + t));
  }
  console.log("  耗时: " + (Date.now() - T0) + " ms");

  if (fail > 0) {
    section("失败明细");
    failures.forEach((f, i) => console.log("  " + (i + 1) + ". " + f));
    console.log("");
    console.log("结果: FAIL");
    console.log("退出码 1");
    process.exitCode = 1;
  } else {
    console.log("");
    console.log("结果: PASS");
    console.log("退出码 0");
    process.exitCode = 0;
  }
}

/** 网络失败：只 SKIP，不做任何断言，不伪造通过 */
function skip(err) {
  section("SKIP");
  console.log("  原因: 无法完成对外部站点的网络请求，跳过本次一致性校验。");
  console.log("  详情: " + (err && err.message ? err.message : String(err)));
  console.log("  说明: 本脚本未做任何断言，因此不判定为通过（PASS）；");
  console.log("        请在可访问 " + SITE_URL + " 的环境中重新运行。");
  console.log("");
  console.log("结果: SKIP");
  console.log("退出码 0");
  process.exitCode = 0;
}

/* ------------------------------------------------------------------ */
/* 主流程                                                              */
/* ------------------------------------------------------------------ */

async function main() {
  console.log("== 外部提供方一致性校验 ==");
  console.log("  外部站点: " + SITE_URL);
  console.log("  楼层数据: " + FLOORPLAN_URL);
  console.log("  本地配置: " + PROVIDERS_FILE);

  /* ---------- 1. 网络请求 ---------- */
  section("1. 网络请求");
  let html = null;
  let floorplanJs = null;
  try {
    const tA = Date.now();
    html = await httpGet(SITE_URL);
    console.log("  GET " + SITE_URL);
    console.log("      -> HTTP " + html.status + "  (" + (Date.now() - tA) + " ms, " + html.body.length + " 字符)");

    const tB = Date.now();
    floorplanJs = await httpGet(FLOORPLAN_URL);
    console.log("  GET " + FLOORPLAN_URL);
    console.log(
      "      -> HTTP " + floorplanJs.status + "  (" + (Date.now() - tB) + " ms, " + floorplanJs.body.length + " 字符)"
    );
  } catch (err) {
    skip(err);
    return;
  }

  check("外部站点首页返回 HTTP 200", html.status === 200, "实际 " + html.status);
  check("assets/floorplan.js 返回 HTTP 200", floorplanJs.status === 200, "实际 " + floorplanJs.status);

  /* ---------- 2. 外部楼栋数据 ---------- */
  section("2. 外部数据（vm 执行 floorplan.js）");
  let externalBuildings = null;
  if (floorplanJs.status === 200) {
    try {
      const ctx = runScript(floorplanJs.body, FLOORPLAN_URL);
      const json = vm.runInContext(NORMALIZE_FLOORPLAN, ctx, { filename: "normalize-floorplan" });
      if (json === "null") throw new Error("window.FLOORPLAN.buildings 不存在或不是数组");
      externalBuildings = JSON.parse(json);
    } catch (err) {
      check("vm 执行 floorplan.js 并读取 window.FLOORPLAN.buildings", false, err.message);
    }
  } else {
    check("vm 执行 floorplan.js 并读取 window.FLOORPLAN.buildings", false, "floorplan.js 未返回 200，无法读取");
  }

  if (externalBuildings) {
    const shapeOk =
      Array.isArray(externalBuildings) &&
      externalBuildings.length > 0 &&
      externalBuildings.every((b) => typeof b.id === "string" && b.id !== "" && Array.isArray(b.floors));
    check("读取到 window.FLOORPLAN.buildings（共 " + externalBuildings.length + " 栋）", shapeOk, "楼栋数据结构异常");
    console.log(
      "  外部楼栋: " +
        externalBuildings
          .map((b) => b.id + "(" + b.floors.length + "层)")
          .join(" ")
    );
  }

  /* ---------- 3. 本地提供方配置 ---------- */
  section("3. 本地配置（vm 加载 indoor-providers.js）");
  let local = null;
  let providersObj = null;
  try {
    const ctx = runScript(fs.readFileSync(PROVIDERS_FILE, "utf8"), PROVIDERS_REL);
    providersObj = vm.runInContext(
      "(window.INDOOR_PROVIDERS && typeof window.INDOOR_PROVIDERS === 'object') ? window.INDOOR_PROVIDERS : null",
      ctx
    );
    const json = vm.runInContext(NORMALIZE_PROVIDERS, ctx, { filename: "normalize-providers" });
    if (json === "null") throw new Error("window.INDOOR_PROVIDERS 不存在");
    local = JSON.parse(json);
  } catch (err) {
    check("vm 加载 " + PROVIDERS_REL + " 并读取 window.INDOOR_PROVIDERS", false, err.message);
  }

  if (local && providersObj) {
    const keys = Object.keys(local.byBuilding);
    check(
      "读取到 window.INDOOR_PROVIDERS（" + keys.length + " 栋 / 排除 " + local.excluded.length + " 栋）",
      keys.length > 0 && typeof providersObj.buildUrl === "function",
      "byBuilding 为空或缺少 buildUrl()"
    );
    console.log("  本地楼栋: " + keys.join(" "));
    console.log("  排除楼栋: " + (local.excluded.join(" ") || "（无）"));
  }

  /* ---------- 4. 一致性断言 ---------- */
  section("4. 一致性断言");
  const rows = [];

  const usable = !!externalBuildings && !!local && !!providersObj;
  if (!usable) {
    console.log("  （外部或本地数据不可用，跳过一致性断言，不判定为通过）");
  } else {
    const extMap = new Map();
    externalBuildings.forEach((b) => {
      if (!extMap.has(b.id)) extMap.set(b.id, b);
    });
    const localKeys = Object.keys(local.byBuilding);

    // 4.1 外部站点必须覆盖对接楼栋
    const missing = REQUIRED_BUILDINGS.filter((id) => !extMap.has(id));
    check(
      "外部站点楼栋集合包含 " + REQUIRED_BUILDINGS.join("/"),
      missing.length === 0,
      missing.length ? "缺少: " + missing.join(", ") : "无缺失"
    );

    // 4.2 本地每个 key 都能在外部找到同 id 楼栋
    const notInExt = localKeys.filter((k) => !extMap.has(k));
    check(
      "本地 byBuilding 的每个 key 在外部站点都能找到同 id 楼栋",
      notInExt.length === 0,
      notInExt.length ? "外部缺少: " + notInExt.join(", ") : "无缺失"
    );

    // 4.3 逐楼栋比较楼层 id 集合（顺序无关）
    localKeys.forEach((key) => {
      const entry = local.byBuilding[key];
      const ext = extMap.get(key);
      const localFloors = entry.floors.filter((f) => f !== "");
      const extFloors = ext ? ext.floors.filter((f) => f !== "") : [];

      if (!ext) {
        rows.push({ id: key, local: localFloors.join(",") || "—", ext: "（外部无此楼栋）", same: "不一致" });
        check("楼栋 " + key + " 的楼层集合与外部一致", false, "外部站点没有楼栋 " + key);
        return;
      }

      const same = sameIdSet(localFloors, extFloors);
      const localOnly = diffSets(localFloors, extFloors);
      const extOnly = diffSets(extFloors, localFloors);
      const localDup = dupOf(localFloors);
      const detailParts = [];
      if (localOnly.length) detailParts.push("本地多出 " + localOnly.join(","));
      if (extOnly.length) detailParts.push("外部多出 " + extOnly.join(","));
      if (localDup.length) detailParts.push("本地重复 " + localDup.join(","));
      const detail = detailParts.length
        ? detailParts.join("; ")
        : "本地 " + localFloors.length + " 层 / 外部 " + extFloors.length + " 层";

      rows.push({
        id: key,
        local: localFloors.join(",") || "—",
        ext: extFloors.join(",") || "—",
        same: same ? "一致" : "不一致"
      });
      check("楼栋 " + key + " 的楼层集合与外部一致（顺序无关）", same, detail);

      // 仅提示，不计入断言：深链用的是 providerBuildingId
      if (entry.providerBuildingId && entry.providerBuildingId !== key) {
        console.log(
          "  NOTE  楼栋 " + key + " 的 providerBuildingId = " + entry.providerBuildingId + "（深链将使用该 id）"
        );
      }
    });

    // 4.4 B 栋排除
    check('B 不在本地 byBuilding 中', !Object.prototype.hasOwnProperty.call(local.byBuilding, "B"));
    check('B 在本地 excluded 数组中', local.excluded.indexOf("B") >= 0, "actual: [" + local.excluded.join(",") + "]");

    // 4.5 深链生成
    let urlA = null;
    try {
      urlA = providersObj.buildUrl("A", "2F");
    } catch (err) {
      urlA = "抛出异常: " + err.message;
    }
    check('buildUrl("A","2F") === ' + EXPECTED_A_2F, urlA === EXPECTED_A_2F, "实际: " + String(urlA));

    let urlB = null;
    let urlLib = null;
    try {
      urlB = providersObj.buildUrl("B");
      urlLib = providersObj.buildUrl("LIB");
    } catch (err) {
      urlB = "抛出异常: " + err.message;
      urlLib = urlB;
    }
    check('buildUrl("B") 为 null（B 栋已排除）', urlB === null, "实际: " + String(urlB));
    check('buildUrl("LIB") 为 null（未覆盖楼栋）', urlLib === null, "实际: " + String(urlLib));
  }

  /* ---------- 5. iframe 可嵌入性 ---------- */
  section("5. iframe 可嵌入性（X-Frame-Options）");
  const headerXfo = headerValue(html.headers, "x-frame-options");
  const metaRe = /<meta\b[^>]*http-equiv\s*=\s*["']?x-frame-options["']?/i;
  const metaXfo = metaRe.test(html.body || "");
  const xfoHit = [];
  if (headerXfo) xfoHit.push("响应头 X-Frame-Options: " + headerXfo);
  if (metaXfo) xfoHit.push("HTML 内含 <meta http-equiv=\"X-Frame-Options\">");
  const noXfo = xfoHit.length === 0;
  if (!noXfo) {
    p1.push("外部站点设置了 X-Frame-Options，室内页无法被 iframe 嵌入 —— " + xfoHit.join("; "));
  }
  check("外部站点首页不存在 X-Frame-Options（允许 iframe 嵌入）", noXfo, xfoHit.join("; "));

  /* ---------- 6. 对照表 ---------- */
  section("6. 楼栋 / 楼层对照表");
  if (usable) {
    const extMap = new Map();
    externalBuildings.forEach((b) => {
      if (!extMap.has(b.id)) extMap.set(b.id, b);
    });
    const ids = rows.map((r) => r.id);
    // 补上外部必须覆盖但本地未声明的楼栋，以及被排除的楼栋
    REQUIRED_BUILDINGS.concat(EXCLUDED_BUILDINGS).forEach((id) => {
      if (ids.indexOf(id) < 0) ids.push(id);
    });
    const ordered = ids
      .map((id, idx) => ({ id: id, idx: idx }))
      .sort((a, b) => {
        const ra = ROW_ORDER.indexOf(a.id);
        const rb = ROW_ORDER.indexOf(b.id);
        const ka = ra < 0 ? 1000 + a.idx : ra;
        const kb = rb < 0 ? 1000 + b.idx : rb;
        return ka - kb;
      })
      .map((x) => x.id);

    const tableRows = ordered.map((id) => {
      const row = rows.find((r) => r.id === id);
      if (row) return [id, row.local || "—", row.ext || "—", row.same];
      const ext = extMap.get(id);
      const extFloors = ext ? ext.floors.filter((f) => f !== "").join(",") : "—";
      if (local && local.byBuilding[id]) {
        // 理论上不会走到这里（逐楼栋比较已覆盖）
        return [id, local.byBuilding[id].floors.join(","), ext ? extFloors : "—", "—"];
      }
      if (local && local.excluded.indexOf(id) >= 0) {
        return [id, "—（已排除）", extFloors || "—", "N/A（已排除）"];
      }
      if (ext) return [id, "—", extFloors, "—（本地未覆盖）"];
      return [id, "—", "—（外部无此楼栋）", "—"];
    });

    renderTable(["楼栋", "本地楼层", "外部楼层", "一致?"], tableRows);

    if (externalBuildings) {
      const outside = externalBuildings.map((b) => b.id).filter((id) => ordered.indexOf(id) < 0);
      console.log("");
      console.log(
        "  说明: 外部站点共 " +
          externalBuildings.length +
          " 栋，本表只列出对接范围 / 排除 / 本地声明涉及的楼栋" +
          (outside.length ? "；其余 " + outside.join(", ") + " 不在本次对接范围" : "") +
          "。"
      );
    }
  } else {
    console.log("  （数据不完整，无法生成对照表）");
  }

  finish();
}

main().catch((err) => {
  console.error("");
  console.error("未捕获错误: " + (err && err.stack ? err.stack : err));
  console.error("结果: FAIL");
  process.exitCode = 1;
});
