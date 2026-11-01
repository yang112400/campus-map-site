/* 真实 GIS 地图页验收测试（demo/tests/real-map.test.js）
 * ---------------------------------------------------------------
 * 被测目标：demo/real-map.html + demo/app/real-map.js
 *           + demo/data/real-pois.js + demo/assets/indoor-providers.js
 *
 * 覆盖：
 *   1. POI 数据：REAL_CAMPUS 存在；A/B/C/E1/E2/E3/F/G/I/LIB/GYM/GATE 齐全；
 *      lon/lat 在西电长安校区合理范围；id 唯一；
 *   2. 室内映射：A/C/E1/E2/E3/F/G/I 有 provider，B 无且被 excluded；
 *      buildUrl("A","2F") 精确匹配；buildUrl("B") 为 null；
 *   3. 真实接口（联网）：
 *      - GIS 3D 瓦片返回 200 image/png；
 *      - GATE→A 方向接口 status=0、routes[0].path 长度 > 5、distance > 0；
 *      - A→G 方向接口 status=0、routes[0].path 非空；
 *      网络不可用时输出 SKIP（不做断言、不伪造 PASS），退出码 0；
 *   4. real-map.html 静态检查：脚本 src 文件存在（去掉 ?v）、Leaflet 本地文件存在、
 *      real-map.js 的 $("...")/getElementById("...") 引用的 id 都在 HTML 中；
 *      若 app/real-map.js 尚未创建，轮询等待最多 15 分钟；
 *   5. 输出 PASS/FAIL/SKIP 统计；有 FAIL 时退出码 1，仅网络 SKIP 时退出码 0。
 *
 * 运行（项目根目录 11.1）：
 *   node demo/tests/real-map.test.js
 *   node demo/tests/real-map.test.js   （或 node tests/real-map.test.js，需要 cwd=demo）
 *
 * 可选环境变量：
 *   REAL_MAP_APP_WAIT_MS    等待 app/real-map.js 的毫秒数，默认 900000（15 分钟）
 *   REAL_MAP_NET_TIMEOUT_MS 单次网络请求超时，默认 20000
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const https = require("https");
const zlib = require("zlib");

const ROOT = path.resolve(__dirname, ".."); // demo/
const MAP_HTML = path.join(ROOT, "real-map.html");
const MAP_JS_REL = "app/real-map.js";
const MAP_JS = path.join(ROOT, MAP_JS_REL);

function envNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

const APP_WAIT_MS = envNumber("REAL_MAP_APP_WAIT_MS", 15 * 60 * 1000);
const APP_POLL_MS = 1000;
const NET_TIMEOUT_MS = envNumber("REAL_MAP_NET_TIMEOUT_MS", 20000) || 20000;
const T0 = Date.now();

/* 长安校区经纬度合理范围（任务给定） */
const LON_MIN = 108.82;
const LON_MAX = 108.85;
const LAT_MIN = 34.11;
const LAT_MAX = 34.14;

/* POI 必须覆盖的 id */
const REQUIRED_POIS = ["A", "B", "C", "E1", "E2", "E3", "F", "G", "I", "LIB", "GYM", "GATE"];

/* 外部室内页必须覆盖的楼栋 */
const REQUIRED_PROVIDERS = ["A", "C", "E1", "E2", "E3", "F", "G", "I"];

const EXPECTED_A_2F = "https://yang112400.github.io/campus-map-site/#A/2F";

/* 真实接口地址（与任务给定一致） */
const TILE_URL = "https://gis.xidian.edu.cn/map?lyrs=zst&x=210321&y=104608&z=18";
const GATE_TO_A_URL =
  "https://gis.xidian.edu.cn/openmap/mapi/direction/v2" +
  "?origin=108.839996,34.122057&destination=108.830318,34.127246&mode=walk";
const A_TO_G_URL =
  "https://gis.xidian.edu.cn/openmap/mapi/direction/v2" +
  "?origin=108.830318,34.127246&destination=108.838850,34.123350&mode=walk";

/* ------------------------------------------------------------------ */
/* 统计与断言                                                          */
/* ------------------------------------------------------------------ */
const stats = { pass: 0, fail: 0, skip: 0 };
const failures = [];
const skips = [];
const notes = [];

function section(title) {
  console.log("");
  console.log("== " + title + " ==");
}

function ok(name, cond, detail) {
  if (cond) {
    stats.pass++;
    console.log("  PASS  " + name);
  } else {
    stats.fail++;
    const msg = name + (detail ? " :: " + detail : "");
    failures.push(msg);
    console.log("  FAIL  " + msg);
  }
  return !!cond;
}

function eq(name, actual, expected) {
  return ok(
    name,
    actual === expected,
    "期望 " + JSON.stringify(expected) + "，实际 " + JSON.stringify(actual)
  );
}

/** 网络不可用等无法断言的情况：SKIP，不计 PASS，不伪造通过 */
function skip(name, reason) {
  stats.skip++;
  skips.push({ name: name, reason: reason });
  console.log("  SKIP  " + name + " :: " + reason);
}

/** 非阻断观察，仅提示，不计入 PASS/FAIL */
function note(text) {
  notes.push(text);
  console.log("  NOTE  " + text);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

/* ------------------------------------------------------------------ */
/* vm 加载浏览器脚本（伪造 window）                                    */
/* ------------------------------------------------------------------ */
function loadBrowserScript(rel) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) throw new Error("文件不存在: " + rel);
  const code = fs.readFileSync(file, "utf8");
  const sandbox = {
    window: {},
    console: { log() {}, info() {}, warn() {}, error() {}, debug() {} },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: rel, timeout: 5000 });
  return sandbox.window;
}

/* ------------------------------------------------------------------ */
/* HTTPS 请求（超时 / 重定向 / gzip 解压；保留二进制用于图片校验）      */
/* ------------------------------------------------------------------ */
function wrapNetError(err) {
  if (err && err.isNetwork) return err;
  const e = new Error(
    "网络错误: " + (err && err.code ? err.code + " " : "") + (err && err.message ? err.message : String(err))
  );
  e.isNetwork = true;
  return e;
}

function httpGet(url, redirectsLeft) {
  const left = redirectsLeft === undefined ? 5 : redirectsLeft;
  const started = Date.now();
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (err, value) => {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(value);
    };

    let req;
    try {
      req = https.get(
        url,
        {
          headers: {
            "user-agent": "dsh-campus-demo/real-map-test 1.0",
            accept: "*/*"
          },
          timeout: NET_TIMEOUT_MS
        },
        (res) => {
          const status = res.statusCode || 0;
          const location = res.headers.location;

          if (status >= 300 && status < 400 && location && left > 0) {
            res.resume();
            let next;
            try {
              next = new URL(location, url).toString();
            } catch (err) {
              done(wrapNetError(err));
              return;
            }
            httpGet(next, left - 1).then(
              (value) => done(null, value),
              (err) => done(err)
            );
            return;
          }

          const chunks = [];
          res.on("data", (chunk) => chunks.push(chunk));
          res.on("error", (err) => done(wrapNetError(err)));
          res.on("aborted", () => done(wrapNetError(new Error("响应被中止"))));
          res.on("end", () => {
            let body = Buffer.concat(chunks);
            const encoding = String(res.headers["content-encoding"] || "").toLowerCase();
            try {
              if (encoding === "gzip" || encoding === "x-gzip") body = zlib.gunzipSync(body);
              else if (encoding === "deflate") body = zlib.inflateSync(body);
              else if (encoding === "br") body = zlib.brotliDecompressSync(body);
            } catch (err) {
              done(new Error("响应体解压失败: " + err.message));
              return;
            }
            done(null, {
              url: url,
              status: status,
              headers: res.headers,
              body: body,
              ms: Date.now() - started
            });
          });
        }
      );
    } catch (err) {
      done(wrapNetError(err));
      return;
    }

    req.setTimeout(NET_TIMEOUT_MS, () => {
      req.destroy(new Error("请求超时（" + NET_TIMEOUT_MS + "ms）"));
    });
    req.on("error", (err) => done(wrapNetError(err)));
  });
}

/** 请求失败时：网络问题 → SKIP；其它错误 → FAIL。返回 response 或 null */
async function fetchForTest(name, url) {
  try {
    return await httpGet(url);
  } catch (err) {
    if (err && err.isNetwork) {
      skip(name, "网络不可用，未做任何断言，不判定为 PASS（" + err.message + "）");
    } else {
      ok(name, false, err.message);
    }
    return null;
  }
}

function parseJson(name, res) {
  try {
    return JSON.parse(res.body.toString("utf8"));
  } catch (err) {
    ok(name + " 响应可解析为 JSON", false, err.message);
    return null;
  }
}

/** direction/v2 实际结构：result.routes；同时兼容顶层 routes / data.routes */
function extractRoutes(json) {
  if (!json || typeof json !== "object") return null;
  if (Array.isArray(json.routes)) return json.routes;
  if (json.result && Array.isArray(json.result.routes)) return json.result.routes;
  if (json.data && Array.isArray(json.data.routes)) return json.data.routes;
  return null;
}

let routeShapeNoted = false;
function noteRouteShape(json) {
  if (routeShapeNoted) return;
  if (json && !Array.isArray(json.routes) && json.result && Array.isArray(json.result.routes)) {
    routeShapeNoted = true;
    note(
      "direction/v2 实际把路线放在 result.routes（顶层没有 routes 字段），" +
        "页面解析应使用 json.result.routes[0]，不要直接读 json.routes[0]。"
    );
  }
}

/* ------------------------------------------------------------------ */
/* 1. POI 数据                                                         */
/* ------------------------------------------------------------------ */
function testPoiData() {
  section("1. 真实 POI 数据（data/real-pois.js）");

  let campus = null;
  try {
    const w = loadBrowserScript("data/real-pois.js");
    campus = w.REAL_CAMPUS;
  } catch (err) {
    ok("data/real-pois.js 可加载", false, err.message);
    return;
  }

  if (!ok("window.REAL_CAMPUS 存在", !!campus && typeof campus === "object")) return;

  const pois = campus.pois;
  if (!ok("REAL_CAMPUS.pois 是非空数组", Array.isArray(pois) && pois.length > 0, "实际 " + typeof pois)) {
    return;
  }
  console.log("  POI 共 " + pois.length + " 项");

  const ids = pois.map((p) => (p && p.id !== undefined ? String(p.id) : ""));
  const missing = REQUIRED_POIS.filter((id) => ids.indexOf(id) < 0);
  ok(
    "pois 覆盖 " + REQUIRED_POIS.join("/"),
    missing.length === 0,
    "缺少: " + (missing.join(", ") || "无")
  );

  const badFields = [];
  for (const p of pois) {
    if (!p || typeof p !== "object") badFields.push("非对象项");
    else if (typeof p.id !== "string" || !p.id) badFields.push("id 缺失");
    else if (typeof p.name !== "string" || !p.name) badFields.push(p.id + ":name 缺失");
  }
  ok("每个 POI 都有非空 id 与 name", badFields.length === 0, badFields.join("; "));

  const badLon = [];
  const badLat = [];
  for (const p of pois) {
    const id = p && p.id !== undefined ? String(p.id) : "?";
    const lon = p && p.lon;
    const lat = p && p.lat;
    if (!Number.isFinite(lon) || lon < LON_MIN || lon > LON_MAX) badLon.push(id + "=" + lon);
    if (!Number.isFinite(lat) || lat < LAT_MIN || lat > LAT_MAX) badLat.push(id + "=" + lat);
  }
  ok(
    "每个 POI 的 lon 在 " + LON_MIN + "–" + LON_MAX + " 内",
    badLon.length === 0,
    "越界: " + (badLon.join(", ") || "无")
  );
  ok(
    "每个 POI 的 lat 在 " + LAT_MIN + "–" + LAT_MAX + " 内",
    badLat.length === 0,
    "越界: " + (badLat.join(", ") || "无")
  );

  const dupIds = Array.from(new Set(ids.filter((id, index) => ids.indexOf(id) !== index)));
  ok("POI id 唯一", dupIds.length === 0, "重复: " + (dupIds.join(", ") || "无"));

  /* 附加：中心点也在同一范围内（center = [lat, lon]） */
  const center = campus.center;
  if (Array.isArray(center) && center.length === 2) {
    ok(
      "REAL_CAMPUS.center 落在长安校区范围内",
      Number.isFinite(center[0]) &&
        Number.isFinite(center[1]) &&
        center[0] >= LAT_MIN &&
        center[0] <= LAT_MAX &&
        center[1] >= LON_MIN &&
        center[1] <= LON_MAX,
      "center=" + JSON.stringify(center)
    );
  }
}

/* ------------------------------------------------------------------ */
/* 2. 室内映射                                                         */
/* ------------------------------------------------------------------ */
function testIndoorProviders() {
  section("2. 室内映射（assets/indoor-providers.js）");

  let providers = null;
  try {
    const w = loadBrowserScript("assets/indoor-providers.js");
    providers = w.INDOOR_PROVIDERS;
  } catch (err) {
    ok("assets/indoor-providers.js 可加载", false, err.message);
    return;
  }

  if (!ok("window.INDOOR_PROVIDERS 存在", !!providers && typeof providers === "object")) return;

  ok(
    "INDOOR_PROVIDERS 提供 get/has/buildUrl/list",
    typeof providers.get === "function" &&
      typeof providers.has === "function" &&
      typeof providers.buildUrl === "function" &&
      typeof providers.list === "function"
  );

  const missing = REQUIRED_PROVIDERS.filter((id) => !providers.has(id) || !providers.get(id));
  ok(
    "A/C/E1/E2/E3/F/G/I 都有 provider",
    missing.length === 0,
    "缺少: " + (missing.join(", ") || "无")
  );

  ok('B 栋没有 provider（get("B") 为 null）', providers.get("B") === null, "实际 " + String(providers.get("B")));
  ok(
    "B 栋在 excluded 列表中",
    Array.isArray(providers.excluded) && providers.excluded.indexOf("B") >= 0,
    "excluded=" + JSON.stringify(providers.excluded)
  );

  eq('buildUrl("A","2F") 深链', providers.buildUrl("A", "2F"), EXPECTED_A_2F);
  eq('buildUrl("B") 为 null（已排除）', providers.buildUrl("B"), null);
  eq('buildUrl("LIB") 为 null（未覆盖）', providers.buildUrl("LIB"), null);
}

/* ------------------------------------------------------------------ */
/* 3. 真实接口（联网）                                                 */
/* ------------------------------------------------------------------ */
async function testTileEndpoint() {
  console.log("  GET " + TILE_URL);
  const res = await fetchForTest("GET 学校 GIS 底图瓦片（200 image/png）", TILE_URL);
  if (!res) return;

  ok("底图瓦片 HTTP 200", res.status === 200, "实际 HTTP " + res.status);
  const contentType = String(res.headers["content-type"] || "").toLowerCase().split(";")[0].trim();
  ok("底图瓦片 Content-Type = image/png", contentType === "image/png", "实际 " + JSON.stringify(contentType));
  ok("底图瓦片响应体非空", res.body.length > 0, res.body.length + " bytes");

  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  ok(
    "底图瓦片确为 PNG（文件头 89 50 4E 47）",
    res.body.length >= 8 && res.body.subarray(0, 8).equals(pngSignature),
    "前 8 字节 " + res.body.subarray(0, 8).toString("hex")
  );
  console.log("      -> HTTP " + res.status + "，" + res.ms + " ms，" + res.body.length + " bytes");
}

/**
 * 校验一条 direction/v2 步行路线。
 * 网络错误 → SKIP（不伪造 PASS）；服务端返回但字段不符 → FAIL。
 */
async function checkDirection(name, url, options) {
  const opts = options || {};
  const minPath = opts.minPath === undefined ? 1 : opts.minPath;
  console.log("  GET " + url);

  const res = await fetchForTest(name + "（direction/v2）", url);
  if (!res) return null;

  ok(name + " HTTP 200", res.status === 200, "实际 HTTP " + res.status);
  if (res.status !== 200) return null;

  const json = parseJson(name, res);
  if (!json) return null;

  noteRouteShape(json);
  eq(name + " JSON status = 0", json.status, 0);

  const routes = extractRoutes(json);
  const route = Array.isArray(routes) ? routes[0] : null;
  const path = route && Array.isArray(route.path) ? route.path : null;

  ok(
    name + " 返回 routes 且 routes[0].path 为数组",
    Array.isArray(routes) && routes.length > 0 && !!path,
    "routes=" + JSON.stringify(Array.isArray(routes) ? routes.length : routes)
  );

  if (path) {
    ok(
      name + " routes[0].path 长度 >= " + minPath + "（实际 " + path.length + "）",
      path.length >= minPath,
      "path 长度 " + path.length
    );
    const badPoint = path.find(
      (p) => !p || !Number.isFinite(p.x) || !Number.isFinite(p.y)
    );
    ok(name + " 路径点都带合法 x/y 坐标", !badPoint, badPoint ? JSON.stringify(badPoint) : "");
  }

  if (opts.requireDistance) {
    ok(
      name + " routes[0].distance > 0",
      !!route && Number.isFinite(route.distance) && route.distance > 0,
      "distance=" + (route ? route.distance : "null")
    );
  }

  console.log(
    "      -> HTTP " +
      res.status +
      "，" +
      res.ms +
      " ms，path=" +
      (path ? path.length : "无") +
      (route && Number.isFinite(route.distance) ? "，distance=" + route.distance.toFixed(1) : "")
  );
  return json;
}

async function testNetworkEndpoints() {
  section("3. 真实接口（联网；失败只 SKIP，不伪造 PASS）");

  /* 3.1 底图瓦片 */
  await testTileEndpoint();

  /* 3.2 GATE → A：status 0、path > 5、distance > 0 */
  await checkDirection("GATE→A 步行路线", GATE_TO_A_URL, { minPath: 6, requireDistance: true });

  /* 3.3 A → G：status 0、path 非空 */
  await checkDirection("A→G 步行路线", A_TO_G_URL, { minPath: 1 });
}

/* ------------------------------------------------------------------ */
/* 4. real-map.html 静态检查                                           */
/* ------------------------------------------------------------------ */
function stripQuery(url) {
  return String(url).split("#")[0].split("?")[0];
}

function isExternalUrl(url) {
  return /^(?:https?:)?\/\//i.test(url) || /^data:/i.test(url);
}

function getAttr(tag, name) {
  const re = new RegExp("(?:^|\\s)" + name + "\\s*=\\s*[\"']([^\"']+)[\"']", "i");
  const m = String(tag).match(re);
  return m ? m[1] : null;
}

/** 等待文件出现且大小稳定（避免读到写了一半的文件） */
async function waitForReadyFile(file, timeoutMs, label) {
  const started = Date.now();
  let lastSize = -1;
  let stableTicks = 0;
  let lastLog = started;

  for (;;) {
    let stat = null;
    try {
      stat = fs.statSync(file);
    } catch (err) {
      stat = null;
    }

    if (stat && stat.isFile() && stat.size > 0) {
      if (stat.size === lastSize) stableTicks++;
      else {
        lastSize = stat.size;
        stableTicks = 0;
      }
      if (stableTicks >= 2) return true;
    } else {
      lastSize = -1;
      stableTicks = 0;
    }

    if (Date.now() - started >= timeoutMs) return false;

    if (Date.now() - lastLog >= 30000) {
      lastLog = Date.now();
      console.log(
        "  ... 等待 " +
          label +
          "（" +
          Math.round((Date.now() - started) / 1000) +
          "s / " +
          Math.round(timeoutMs / 1000) +
          "s）"
      );
    }
    await sleep(APP_POLL_MS);
  }
}

/** 收集 real-map.js 中可静态识别的 DOM id 引用 */
function collectIdRefs(js) {
  const refs = new Map();
  const add = (raw, expr) => {
    let value = String(raw).trim();
    if (value.charAt(0) === "#") value = value.slice(1);
    if (!/^[A-Za-z_][\w:-]*$/.test(value)) return;
    if (!refs.has(value)) refs.set(value, expr);
  };

  for (const m of js.matchAll(/\$\(\s*["']([^"']+)["']\s*\)/g)) {
    add(m[1], '$("' + m[1] + '")');
  }
  for (const m of js.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)) {
    add(m[1], 'getElementById("' + m[1] + '")');
  }
  for (const m of js.matchAll(/querySelector(?:All)?\(\s*["']#([A-Za-z_][\w:-]*)["']\s*\)/g)) {
    add(m[1], 'querySelector("#' + m[1] + '")');
  }
  return refs;
}

async function testStaticPage() {
  section("4. real-map.html 静态检查");

  let html = null;
  try {
    html = fs.readFileSync(MAP_HTML, "utf8");
  } catch (err) {
    ok("real-map.html 存在且可读", false, err.message);
    return;
  }
  ok("real-map.html 存在且可读", true);

  /* 4.1 等待 app/real-map.js（最多 15 分钟） */
  console.log("  检查 " + MAP_JS_REL + (fs.existsSync(MAP_JS) ? "（已存在）" : "（尚未创建，开始轮询）"));
  const appReady = await waitForReadyFile(MAP_JS, APP_WAIT_MS, MAP_JS_REL);
  if (!appReady) {
    ok(
      MAP_JS_REL + " 在 " + Math.round(APP_WAIT_MS / 1000) + " 秒内创建且非空",
      false,
      "文件不存在或为空；无法校验 DOM id 一致性"
    );
  } else {
    ok(MAP_JS_REL + " 已创建且非空", true);
  }
  const js = appReady ? fs.readFileSync(MAP_JS, "utf8") : null;

  /* 4.2 HTML id 集合 */
  const ids = [];
  for (const m of html.matchAll(/(?:^|\s)id\s*=\s*["']([^"']+)["']/g)) ids.push(m[1]);
  const idSet = new Set(ids);
  console.log("  real-map.html 声明 " + ids.length + " 个 id");
  ok("real-map.html 至少声明 1 个 id", ids.length > 0);

  const dupIds = Array.from(new Set(ids.filter((id, index) => ids.indexOf(id) !== index)));
  ok("real-map.html 的 id 不重复", dupIds.length === 0, "重复: " + (dupIds.join(", ") || "无"));

  /* 4.3 脚本 / 样式引用 */
  const scriptSrcs = Array.from(html.matchAll(/<script\b[^>]*\ssrc\s*=\s*["']([^"']+)["']/gi)).map(
    (m) => m[1]
  );
  const scriptPaths = scriptSrcs.map(stripQuery);
  const localScripts = scriptSrcs.filter((src) => !isExternalUrl(src));
  const missingScripts = localScripts.filter((src) => !fs.existsSync(path.join(ROOT, stripQuery(src))));
  ok(
    "real-map.html 引用的全部脚本文件都存在（去掉 ?v 后）",
    missingScripts.length === 0,
    "缺失: " + (missingScripts.join(", ") || "无")
  );
  console.log("  脚本: " + (scriptPaths.join(", ") || "（无）"));

  const expectedScripts = [
    "vendor/leaflet/leaflet.js",
    "data/real-pois.js",
    "assets/indoor-providers.js",
    MAP_JS_REL
  ];
  const missingIncludes = expectedScripts.filter((src) => scriptPaths.indexOf(src) < 0);
  ok(
    "real-map.html 引入了 Leaflet / POI / 室内映射 / real-map.js",
    missingIncludes.length === 0,
    "缺少: " + (missingIncludes.join(", ") || "无")
  );

  const linkTags = Array.from(html.matchAll(/<link\b[^>]*>/gi)).map((m) => m[0]);
  const stylesheets = linkTags
    .filter((tag) => /\bstylesheet\b/i.test(getAttr(tag, "rel") || ""))
    .map((tag) => getAttr(tag, "href"))
    .filter(Boolean);
  const localStylesheets = stylesheets.filter((href) => !isExternalUrl(href));
  const missingStylesheets = localStylesheets.filter(
    (href) => !fs.existsSync(path.join(ROOT, stripQuery(href)))
  );
  if (missingStylesheets.length) {
    note(
      "real-map.html 引用的样式文件不存在（任务只要求校验脚本 src，未计入 FAIL）：" +
        missingStylesheets.join(", ") +
        "；页面会缺少样式，建议补齐。"
    );
  }

  /* 4.4 Leaflet 本地文件 */
  const leafletFiles = [
    "vendor/leaflet/leaflet.js",
    "vendor/leaflet/leaflet.css",
    "vendor/leaflet/images/marker-icon.png",
    "vendor/leaflet/images/marker-shadow.png",
    "vendor/leaflet/images/layers.png",
    "vendor/leaflet/images/layers-2x.png"
  ];
  const missingLeaflet = leafletFiles.filter((rel) => !exists(rel));
  ok(
    "Leaflet 本地文件存在（js/css/图标）",
    missingLeaflet.length === 0,
    "缺失: " + (missingLeaflet.join(", ") || "无")
  );

  const leafletJsIndex = scriptPaths.indexOf("vendor/leaflet/leaflet.js");
  const mapJsIndex = scriptPaths.indexOf(MAP_JS_REL);
  if (leafletJsIndex >= 0 && mapJsIndex >= 0) {
    ok("Leaflet 先于 app/real-map.js 加载", leafletJsIndex < mapJsIndex);
  }

  /* 4.5 DOM id 引用一致性 */
  if (js !== null) {
    const refs = collectIdRefs(js);
    const refIds = Array.from(refs.keys());
    console.log("  real-map.js 中解析到 " + refIds.length + " 个 DOM id 引用");
    ok(
      "app/real-map.js 使用了可校验的 DOM id 引用（$()/getElementById()）",
      refIds.length > 0,
      "未解析到任何字面量 id；请确认访问方式"
    );

    if (refIds.length) {
      const missingIds = refIds.filter((id) => !idSet.has(id));
      ok(
        "real-map.html 覆盖 app/real-map.js 引用的全部 DOM id",
        missingIds.length === 0,
        "HTML 缺少: " +
          (missingIds.map((id) => "#" + id + "（" + refs.get(id) + "）").join("; ") || "无")
      );
      console.log("  引用 id: " + refIds.join(", "));
    }

    /* 4.6 地图点选失败回退：点不在路网时自动吸附附近 POI，并区分错误原因 */
    ok(
      "地图点选有“路网失败 → 附近 POI”回退",
      /fetchRouteWithPoiFallback/.test(js) && /POI_FALLBACK_RADIUS/.test(js) && /nearestPoiWithin/.test(js),
      "缺少回退函数或半径常量"
    );
    ok(
      "路网失败提示区分“点不在路网”",
      /该位置不在校园路网覆盖范围内/.test(js) && /该点不在可规划道路上/.test(js),
      "缺少针对 off-road / no-route 的中文提示"
    );
    ok(
      "不再把路网失败统一报成网络异常",
      !/return "网络异常或接口不可用"/.test(js),
      "仍存在笼统的“网络异常或接口不可用”兜底"
    );
    ok(
      "任意点道路吸附数据存在",
      fs.existsSync(path.join(ROOT, "data/real-road-snap.js")),
      "缺少 data/real-road-snap.js"
    );
    ok(
      "real-map.html 加载道路吸附数据",
      /data\/real-road-snap\.js/.test(html),
      "HTML 未引入 data/real-road-snap.js"
    );
    ok(
      "real-map.js 有任意点道路吸附",
      /nearestRoadPoint/.test(js) && /snapRawEndpoint/.test(js),
      "缺少 nearestRoadPoint / snapRawEndpoint"
    );
  }
}

/* ------------------------------------------------------------------ */
/* 汇总                                                                */
/* ------------------------------------------------------------------ */
function summary() {
  section("统计");
  const assertions = stats.pass + stats.fail;
  console.log(
    "  PASS " +
      stats.pass +
      "   FAIL " +
      stats.fail +
      "   SKIP " +
      stats.skip +
      "   （已断言 " +
      assertions +
      " 项；SKIP 不计入 PASS/FAIL）"
  );
  console.log("  耗时: " + ((Date.now() - T0) / 1000).toFixed(1) + " s");

  if (failures.length) {
    console.log("");
    console.log("失败项：");
    failures.forEach((item) => console.log(" - " + item));
  }

  if (skips.length) {
    console.log("");
    console.log("跳过项（未做断言，绝不伪造 PASS）：");
    skips.forEach((item) => console.log(" - " + item.name + " :: " + item.reason));
  }

  if (notes.length) {
    console.log("");
    console.log("发现的问题 / 观察（非 FAIL）：");
    notes.forEach((item) => console.log(" - " + item));
  }

  console.log("");
  if (stats.fail > 0) {
    console.log("结果: FAIL");
    console.log("退出码 1");
    process.exitCode = 1;
  } else if (stats.skip > 0) {
    console.log("结果: SKIP（离线/静态断言已通过，但联网接口未验证，按约定不判定为 PASS）");
    console.log("原因: " + skips.map((item) => item.name + "（" + item.reason + "）").join("；"));
    console.log("退出码 0（网络不可用，不伪造 PASS）");
    process.exitCode = 0;
  } else {
    console.log("结果: PASS");
    console.log("退出码 0");
    process.exitCode = 0;
  }
}

/* ------------------------------------------------------------------ */
/* 入口                                                                */
/* ------------------------------------------------------------------ */
async function main() {
  console.log("真实 GIS 地图页验收测试");
  console.log("  目标目录: " + ROOT);
  console.log("  Node: " + process.version);
  console.log(
    "  等待 app/real-map.js 上限: " +
      Math.round(APP_WAIT_MS / 1000) +
      "s；网络请求超时: " +
      NET_TIMEOUT_MS +
      "ms"
  );

  testPoiData();
  testIndoorProviders();
  await testNetworkEndpoints();
  await testStaticPage();

  summary();
}

main().catch((err) => {
  console.error("");
  console.error("[测试调度异常] " + (err && err.stack ? err.stack : String(err)));
  console.error("结果: FAIL");
  process.exitCode = 1;
});
