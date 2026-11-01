/* 桥接逻辑仿真测试：室外页 → 外部室内页（app/indoor-bridge.js）
 *
 * 目的：不启动浏览器、不依赖 jsdom，用最小 DOM 桩 + 伪造的 window.NAV_APP，
 *      在 Node 里真实执行 app/indoor-bridge.js，验证：
 *        - 200ms 初始化轮询后才挂载 window.INDOOR_BRIDGE；
 *        - 250ms 状态轮询跟随 app.state.end 刷新室内栏；
 *        - 楼层下拉来自 INDOOR_PROVIDERS，深链来自 buildUrl；
 *        - btnIndoor 打开弹窗、iframe.src 与深链一致；
 *        - ?from=&to=&floor= 深链的预选终点与楼层；
 *        - B 栋（INDOOR_PROVIDERS.excluded）不显示、不生成外部 URL。
 *
 * 这是逻辑层仿真，不是真实浏览器验证：不覆盖 CSS 布局、真实 iframe 网络加载、
 * 浏览器 history 实现，以及真实的指针/键盘事件模型。
 *
 * 运行：node tests/bridge-sim.js
 */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = "https://yang112400.github.io/campus-map-site/";
const INIT_TIMEOUT_MS = 5000; // 任务要求：初始化最多等 5 秒
const POLL_TIMEOUT_MS = 3000;

/* 桥接实际会访问的 DOM id（与 index.html 对齐） */
const ELEMENT_TAGS = {
  indoorBar: "div",
  indoorTitle: "b",
  indoorSub: "span",
  indoorFloor: "select",
  btnIndoor: "button",
  indoorNew: "a",
  indoorModal: "div",
  imTitle: "b",
  imSub: "span",
  imFloor: "select",
  imNew: "a",
  imClose: "button",
  imFrame: "iframe",
  toast: "div"
};

/* ------------------------------------------------------------------ */
/* 断言框架                                                            */
/* ------------------------------------------------------------------ */
let pass = 0;
let fail = 0;
const failures = [];
const notes = [];

function ok(name, cond, detail) {
  if (cond) {
    pass++;
    console.log("  PASS  " + name);
  } else {
    fail++;
    const msg = name + (detail ? " :: " + detail : "");
    failures.push(msg);
    console.log("  FAIL  " + msg);
  }
}

function eq(name, actual, expected) {
  ok(name, actual === expected, "期望 " + JSON.stringify(expected) + "，实际 " + JSON.stringify(actual));
}

function note(text) {
  notes.push(text);
  console.log("  NOTE  " + text);
}

/** 轮询等待条件成立；条件抛错按“未成立”处理，超时 reject */
function waitFor(predicate, timeoutMs, label) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    (function tick() {
      let value = false;
      try {
        value = predicate();
      } catch (err) {
        value = false;
      }
      if (value) return resolve(value);
      if (Date.now() - started >= timeoutMs) return reject(new Error("等待超时：" + label));
      setTimeout(tick, 10);
    })();
  });
}

/* ------------------------------------------------------------------ */
/* 最小 DOM 桩                                                         */
/* ------------------------------------------------------------------ */
class FakeClassList {
  constructor() {
    this._set = new Set();
  }
  add() {
    for (let i = 0; i < arguments.length; i++) if (arguments[i]) this._set.add(String(arguments[i]));
  }
  remove() {
    for (let i = 0; i < arguments.length; i++) this._set.delete(String(arguments[i]));
  }
  contains(name) {
    return this._set.has(String(name));
  }
  toggle(name, force) {
    const key = String(name);
    const has = this._set.has(key);
    const next = force === undefined ? !has : !!force;
    if (next) this._set.add(key);
    else this._set.delete(key);
    return next;
  }
  get length() {
    return this._set.size;
  }
  toString() {
    return Array.from(this._set).join(" ");
  }
}

class FakeElement {
  constructor(tagName, id) {
    this.tagName = String(tagName || "div").toUpperCase();
    this.id = id || "";
    this.nodeType = 1;
    this.parentNode = null;
    this.children = [];
    this.classList = new FakeClassList();
    this.attributes = Object.create(null);
    this.style = {};
    this.dataset = {};
    this.href = "";
    this.src = "";
    this.textContent = "";
    this.focused = false;
    this.focusCount = 0;
    this.disabled = false;
    this._listeners = Object.create(null);
    this._innerHTML = "";
    this._value = "";
  }

  get innerHTML() {
    return this._innerHTML;
  }
  set innerHTML(value) {
    this._innerHTML = value == null ? "" : String(value);
    // 桥接只用 innerHTML = "" 清空下拉
    if (this._innerHTML === "") this.children.length = 0;
  }

  get value() {
    if (this.tagName === "SELECT" && this._value === "" && this.children.length) {
      return this.children[0].value;
    }
    return this._value;
  }
  set value(value) {
    this._value = value == null ? "" : String(value);
  }

  get options() {
    return this.children.slice();
  }
  get childElementCount() {
    return this.children.length;
  }
  get firstElementChild() {
    return this.children[0] || null;
  }

  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }
  removeEventListener(type, fn) {
    const list = this._listeners[type];
    if (!list) return;
    const index = list.indexOf(fn);
    if (index >= 0) list.splice(index, 1);
  }
  appendChild(child) {
    if (!child || typeof child !== "object") return child;
    if (child.parentNode && Array.isArray(child.parentNode.children)) {
      const index = child.parentNode.children.indexOf(child);
      if (index >= 0) child.parentNode.children.splice(index, 1);
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index >= 0) this.children.splice(index, 1);
    if (child) child.parentNode = null;
    return child;
  }
  setAttribute(name, value) {
    this.attributes[String(name)] = String(value);
  }
  getAttribute(name) {
    const key = String(name);
    return Object.prototype.hasOwnProperty.call(this.attributes, key) ? this.attributes[key] : null;
  }
  hasAttribute(name) {
    return Object.prototype.hasOwnProperty.call(this.attributes, String(name));
  }
  removeAttribute(name) {
    const key = String(name);
    delete this.attributes[key];
    if (key === "src") this.src = "";
    if (key === "href") this.href = "";
  }
  focus() {
    this.focused = true;
    this.focusCount++;
  }
  blur() {
    this.focused = false;
  }
  click() {
    dispatchEvent(this, "click");
  }
  contains(node) {
    return node === this || this.children.indexOf(node) >= 0;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
}

function makeEvent(target, type, extra) {
  return Object.assign(
    {
      type: type,
      target: target,
      currentTarget: target,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      stopPropagation() {},
      stopImmediatePropagation() {}
    },
    extra || {}
  );
}

function dispatchEvent(target, type, extra) {
  const event = makeEvent(target, type, extra);
  const listeners = (target._listeners && target._listeners[type]) || [];
  listeners.slice().forEach((fn) => fn.call(target, event));
  return event;
}

function walkElements(env) {
  const seen = new Set();
  const out = [];
  const visit = (el) => {
    if (!el || seen.has(el)) return;
    seen.add(el);
    out.push(el);
    (el.children || []).forEach(visit);
  };
  env.allElements.forEach(visit);
  return out;
}

/** href/src 或 href/src 属性里是否出现 needle（例如 #B） */
function anyUrlContains(env, needle) {
  return walkElements(env).some((el) => {
    if (typeof el.href === "string" && el.href.indexOf(needle) >= 0) return true;
    if (typeof el.src === "string" && el.src.indexOf(needle) >= 0) return true;
    return Object.keys(el.attributes || {}).some((key) => {
      if (!/^(href|src)$/i.test(key)) return false;
      return String(el.attributes[key]).indexOf(needle) >= 0;
    });
  });
}

/* ------------------------------------------------------------------ */
/* 伪造 window.NAV_APP                                                 */
/* ------------------------------------------------------------------ */
function makeNavApp(campus, options) {
  const opts = options || {};
  const nodes = new Map((campus.nodes || []).map((node) => [node.id, node]));
  const calls = { computeRoute: 0, setEndpoint: [] };
  const state = { start: null, end: null, active: "start", route: null };

  const app = {
    state: state,
    calls: calls,
    nodeSelection(nodeId, label, snapDist) {
      const node = nodes.get(nodeId);
      if (!node) return null;
      return {
        nodeId: nodeId,
        x: node.x,
        z: node.z,
        label: label || node.name,
        tempNode: null,
        snapDist: snapDist || 0
      };
    },
    setEndpoint(which, sel) {
      if (!sel) return;
      state[which] = sel;
      calls.setEndpoint.push(which + ":" + sel.nodeId);
      if (state.start && state.end) app.computeRoute();
    },
    computeRoute() {
      calls.computeRoute++;
      state.route = null;
    }
  };

  // 模拟 main.js 结尾的默认演示：GATE → ENT_A
  state.start = app.nodeSelection(opts.start || "GATE", null, 0);
  state.end = app.nodeSelection(opts.end || "ENT_A", null, 0);
  return app;
}

/* ------------------------------------------------------------------ */
/* 环境：vm 上下文 + DOM 桩 + 真实定时器                                */
/* ------------------------------------------------------------------ */
function createEnvironment(options) {
  const opts = options || {};
  const search = opts.search || "";

  const env = {
    stats: { intervalTicks: 0 },
    historyCalls: [],
    timers: { intervals: new Set(), timeouts: new Set() },
    els: new Map(),
    allElements: []
  };

  const locationStub = {
    search: search,
    pathname: "/demo/index.html",
    hash: "",
    href: "http://localhost/demo/index.html" + search
  };
  const historyStub = {
    replaceState(state, title, url) {
      env.historyCalls.push(String(url));
    },
    pushState(state, title, url) {
      env.historyCalls.push(String(url));
    }
  };

  const timer = {
    setInterval(fn, ms) {
      const id = setInterval(function () {
        env.stats.intervalTicks++;
        return fn.apply(this, arguments);
      }, ms);
      env.timers.intervals.add(id);
      return id;
    },
    clearInterval(id) {
      env.timers.intervals.delete(id);
      clearInterval(id);
    },
    setTimeout(fn, ms) {
      const id = setTimeout(function () {
        env.timers.timeouts.delete(id);
        return fn.apply(this, arguments);
      }, ms);
      env.timers.timeouts.add(id);
      return id;
    },
    clearTimeout(id) {
      env.timers.timeouts.delete(id);
      clearTimeout(id);
    }
  };

  // 预置 index.html 中的 14 个节点
  Object.keys(ELEMENT_TAGS).forEach((id) => {
    const element = new FakeElement(ELEMENT_TAGS[id], id);
    env.els.set(id, element);
    env.allElements.push(element);
  });
  env.els.get("indoorNew").href = "#";
  env.els.get("imNew").href = "#";

  const docListeners = Object.create(null);
  const documentStub = {
    _listeners: docListeners,
    nodeType: 9,
    getElementById(id) {
      return env.els.get(id) || null;
    },
    createElement(tagName) {
      const element = new FakeElement(tagName);
      env.allElements.push(element);
      return element;
    },
    createTextNode(text) {
      const node = new FakeElement("#text");
      node.textContent = String(text);
      return node;
    },
    addEventListener(type, fn) {
      (docListeners[type] = docListeners[type] || []).push(fn);
    },
    removeEventListener(type, fn) {
      const list = docListeners[type];
      if (!list) return;
      const index = list.indexOf(fn);
      if (index >= 0) list.splice(index, 1);
    },
    querySelector() {
      return null;
    },
    querySelectorAll() {
      return [];
    }
  };

  const windowStub = {
    location: locationStub,
    history: historyStub,
    navigator: { userAgent: "node+bridge-sim" },
    innerWidth: 1280,
    innerHeight: 720,
    addEventListener(type, fn) {
      (this._listeners = this._listeners || {})[type] = fn;
    },
    removeEventListener() {},
    setTimeout: timer.setTimeout,
    clearTimeout: timer.clearTimeout,
    setInterval: timer.setInterval,
    clearInterval: timer.clearInterval,
    URLSearchParams: URLSearchParams
  };

  const sandbox = {
    window: windowStub,
    document: documentStub,
    history: historyStub,
    location: locationStub,
    navigator: windowStub.navigator,
    console: console,
    URLSearchParams: URLSearchParams,
    URL: URL,
    setTimeout: timer.setTimeout,
    clearTimeout: timer.clearTimeout,
    setInterval: timer.setInterval,
    clearInterval: timer.clearInterval
  };
  vm.createContext(sandbox);

  env.window = windowStub;
  env.document = documentStub;
  env.location = locationStub;

  env.load = function (rel) {
    const file = path.join(ROOT, rel);
    const code = fs.readFileSync(file, "utf8");
    vm.runInContext(code, sandbox, { filename: rel });
  };

  env.el = function (id) {
    const element = env.els.get(id);
    if (!element) throw new Error("测试桩缺少元素 #" + id);
    return element;
  };

  env.load("data/campus.js");
  env.load("assets/indoor-providers.js");

  env.campus = windowStub.CAMPUS;
  env.providers = windowStub.INDOOR_PROVIDERS;
  env.app = makeNavApp(env.campus, opts);

  // 复刻 index.html 顺序：桥接先加载，NAV_APP 稍后由 main.js 挂到 window
  env.load("app/indoor-bridge.js");
  windowStub.NAV_APP = env.app;

  env.init = async function () {
    await waitFor(() => windowStub.INDOOR_BRIDGE, INIT_TIMEOUT_MS, "INDOOR_BRIDGE 初始化（200ms 轮询）");
    return windowStub.INDOOR_BRIDGE;
  };

  /** 状态改动后，等待下一轮 250ms 轮询真正跑完 */
  env.poll = async function () {
    const before = env.stats.intervalTicks;
    await waitFor(() => env.stats.intervalTicks > before, POLL_TIMEOUT_MS, "桥接 250ms 状态轮询");
  };

  env.cleanup = function () {
    env.timers.intervals.forEach((id) => clearInterval(id));
    env.timers.timeouts.forEach((id) => clearTimeout(id));
    env.timers.intervals.clear();
    env.timers.timeouts.clear();
  };

  return env;
}

/* ------------------------------------------------------------------ */
/* 小工具                                                              */
/* ------------------------------------------------------------------ */
function setEndpoint(env, which, nodeId, label) {
  const sel = env.app.nodeSelection(nodeId, label || null, 0);
  if (!sel) throw new Error("nodeSelection 失败：" + nodeId);
  env.app.setEndpoint(which, sel);
  return sel;
}

function lastHistory(env) {
  return env.historyCalls.length ? env.historyCalls[env.historyCalls.length - 1] : "";
}

function optionValues(select) {
  return select.children.map((option) => option.value).join(",");
}

/* ------------------------------------------------------------------ */
/* 场景 1：默认 A 栋 → B 栋 → 图书馆 → E-2 → 楼层 → 弹窗                */
/* ------------------------------------------------------------------ */
async function scenarioMainFlow() {
  console.log("\n== 场景 1：默认 A 栋 → B（excluded）→ 图书馆（无 provider）→ E-2 → 3F → 打开弹窗 ==");
  const env = createEnvironment({ search: "" });
  try {
    const br = await env.init();
    const P = env.providers;
    const bar = env.el("indoorBar");
    const floorSel = env.el("indoorFloor");

    ok("桥接经 200ms 轮询完成初始化（window.INDOOR_BRIDGE 已挂载）", !!br);
    ok("初始化确实走过轮询（至少 1 次 interval tick）", env.stats.intervalTicks >= 1, "ticks=" + env.stats.intervalTicks);

    /* --- 默认终点 ENT_A --- */
    ok("默认终点 ENT_A：indoorBar 有 show 类", bar.classList.contains("show"));
    eq("默认终点 ENT_A：indoorFloor 选项数 = 6", floorSel.children.length, 6);
    eq("默认终点 ENT_A：选项值为 1F–6F", optionValues(floorSel), "1F,2F,3F,4F,5F,6F");
    eq("默认终点 ENT_A：选项文本为 1层–6层", floorSel.children.map((o) => o.textContent).join(","), "1层,2层,3层,4层,5层,6层");
    eq("默认终点 ENT_A：选中 1F", floorSel.value, "1F");
    eq("buildUrl(A, 1F) 结果", P.buildUrl("A", "1F"), BASE_URL + "#A/1F");
    ok("buildUrl(A, 1F) 以 #A/1F 结尾", P.buildUrl("A", "1F").endsWith("#A/1F"), P.buildUrl("A", "1F"));
    eq("INDOOR_BRIDGE.url() = #A/1F", br.url(), BASE_URL + "#A/1F");
    eq("indoorNew.href 同步为 #A/1F", env.el("indoorNew").href, BASE_URL + "#A/1F");
    ok("indoorTitle 显示 A 栋名称", /A栋/.test(env.el("indoorTitle").textContent), JSON.stringify(env.el("indoorTitle").textContent));

    /* --- 终点 ENT_B：excluded --- */
    setEndpoint(env, "end", "ENT_B", "B栋");
    await env.poll();
    ok("终点 ENT_B：indoorBar 无 show 类", !bar.classList.contains("show"));
    eq("终点 ENT_B：INDOOR_BRIDGE.url() 为 null", br.url(), null);
    eq("INDOOR_PROVIDERS.buildUrl(B) 为 null", P.buildUrl("B"), null);
    ok(
      "终点 ENT_B：出现 B 栋排除提示 toast",
      /B\s*栋/.test(env.el("toast").textContent) && env.el("toast").classList.contains("show"),
      JSON.stringify(env.el("toast").textContent)
    );
    ok(
      "终点 ENT_B：DOM 与地址栏都没有 #B 外部深链",
      !anyUrlContains(env, "#B") && !env.historyCalls.some((url) => url.indexOf("#B") >= 0)
    );
    if (env.el("indoorNew").href.indexOf("campus-map-site") >= 0) {
      note(
        "非阻断观察：切到 B 栋后 #indoorNew 的 href 仍是上一栋深链（" +
          env.el("indoorNew").href +
          "）。栏已隐藏不影响验收，可选优化：hideBar() 里清空 indoorNew/imNew 的 href。"
      );
    }

    /* --- 终点 ENT_LIB：无 provider --- */
    setEndpoint(env, "end", "ENT_LIB", "图书馆入口");
    await env.poll();
    ok("终点 ENT_LIB（无 provider）：indoorBar 无 show 类", !bar.classList.contains("show"));
    eq("终点 ENT_LIB：INDOOR_BRIDGE.url() 为 null", br.url(), null);
    eq("终点 ENT_LIB：buildUrl(LIB) 为 null", P.buildUrl("LIB"), null);

    /* --- 终点 ENT_E2 --- */
    setEndpoint(env, "end", "ENT_E2", "E-2栋入口");
    await env.poll();
    ok("终点 ENT_E2：indoorBar 显示", bar.classList.contains("show"));
    eq("终点 ENT_E2：默认楼层 1F", floorSel.value, "1F");
    eq("终点 ENT_E2：默认深链 #E2/1F", br.url(), BASE_URL + "#E2/1F");
    eq("切换楼栋后 imFrame.src 已清空", env.el("imFrame").src, "");
    ok("indoorTitle 切到 E-2 栋", /E-2/.test(env.el("indoorTitle").textContent), JSON.stringify(env.el("indoorTitle").textContent));

    /* --- 楼层 3F --- */
    floorSel.value = "3F";
    dispatchEvent(floorSel, "change");
    eq("楼层切到 3F：INDOOR_BRIDGE.url() = #E2/3F", br.url(), BASE_URL + "#E2/3F");
    eq("楼层切到 3F：弹窗内 imFloor 同步为 3F", env.el("imFloor").value, "3F");
    eq("弹窗未打开时 imFrame.src 保持为空", env.el("imFrame").src, "");
    ok(
      "楼层变化触发 history.replaceState 并带上 floor=3F",
      /floor=3F/.test(lastHistory(env)),
      JSON.stringify(lastHistory(env))
    );

    /* --- 点击 btnIndoor --- */
    dispatchEvent(env.el("btnIndoor"), "click");
    const modal = env.el("indoorModal");
    const frame = env.el("imFrame");
    ok("点击 btnIndoor：modal 有 open 类", modal.classList.contains("open"));
    eq("点击 btnIndoor：modal aria-hidden = false", modal.getAttribute("aria-hidden"), "false");
    eq("点击 btnIndoor：imFrame.src = buildUrl(E2, 3F)", frame.src, BASE_URL + "#E2/3F");
    eq("点击 btnIndoor：imNew.href = buildUrl(E2, 3F)", env.el("imNew").href, BASE_URL + "#E2/3F");
    ok("弹窗标题含 E-2", /E-2/.test(env.el("imTitle").textContent), JSON.stringify(env.el("imTitle").textContent));
    ok("弹窗副标题含 3层", /3层/.test(env.el("imSub").textContent), JSON.stringify(env.el("imSub").textContent));
    eq("打开弹窗后焦点落在关闭按钮", env.el("imClose").focused, true);

    /* 附加：弹窗内切楼层应更新 iframe 的 hash（SPEC 验收项） */
    env.el("imFloor").value = "5F";
    dispatchEvent(env.el("imFloor"), "change");
    eq("弹窗内切到 5F：iframe 更新为 #E2/5F", frame.src, BASE_URL + "#E2/5F");
    eq("弹窗内切到 5F：INDOOR_BRIDGE.url() 跟随", br.url(), BASE_URL + "#E2/5F");

    /* 附加：Esc 关闭 */
    dispatchEvent(env.document, "keydown", { key: "Escape" });
    ok("Esc 关闭弹窗（document keydown 监听生效）", !modal.classList.contains("open"));
    eq("关闭后 modal aria-hidden = true", modal.getAttribute("aria-hidden"), "true");

    /* 附加：弹窗开着时切到 B 栋，应自动收起 */
    dispatchEvent(env.el("btnIndoor"), "click");
    ok("重新打开弹窗（B 栋切换前）", modal.classList.contains("open"));
    setEndpoint(env, "end", "ENT_B", "B栋");
    await env.poll();
    ok("弹窗打开时切到 B 栋：弹窗自动关闭", !modal.classList.contains("open"));
    if (frame.src.indexOf("campus-map-site") >= 0) {
      note(
        "非阻断观察：从 E-2 切到 B 栋时弹窗已关闭，但 #imFrame.src 仍保留 E-2 的深链（" +
          frame.src +
          "），隐藏的 iframe 会继续保留/加载外部页面。可选优化：hideBar() 里 removeAttribute('src')。"
      );
    }
  } finally {
    env.cleanup();
  }
}

/* ------------------------------------------------------------------ */
/* 场景 2：URL 深链 ?from=GATE&to=F&floor=3F                            */
/* ------------------------------------------------------------------ */
async function scenarioUrlParams() {
  console.log("\n== 场景 2：URL 深链 ?from=GATE&to=F&floor=3F ==");
  const env = createEnvironment({ search: "?from=GATE&to=F&floor=3F" });
  try {
    const br = await env.init();
    const floorSel = env.el("indoorFloor");

    eq("初始化后 end = ENT_F（楼栋 id F 解析为入口节点）", env.app.state.end && env.app.state.end.nodeId, "ENT_F");
    eq("初始化后 start = GATE", env.app.state.start && env.app.state.start.nodeId, "GATE");
    eq("初始化后楼层 = 3F", floorSel.value, "3F");
    eq("初始化后深链 = #F/3F", br.url(), BASE_URL + "#F/3F");
    ok("F 栋室内栏显示", env.el("indoorBar").classList.contains("show"));
    eq("F 栋楼层选项数 = 5", floorSel.children.length, 5);
    ok("URL 深链触发 computeRoute", env.app.calls.computeRoute >= 1, "computeRoute 调用 " + env.app.calls.computeRoute + " 次");
    ok("URL 深链触发两次 setEndpoint（from/to）", env.app.calls.setEndpoint.length >= 2, JSON.stringify(env.app.calls.setEndpoint));

    await env.poll();
    const synced = lastHistory(env);
    ok(
      "首次轮询把 from/to/floor 写回地址栏",
      /from=GATE/.test(synced) && /to=ENT_F/.test(synced) && /floor=3F/.test(synced),
      JSON.stringify(synced)
    );
    ok("地址栏同步未产生 #B 深链", synced.indexOf("#B") < 0, JSON.stringify(synced));
  } finally {
    env.cleanup();
  }
}

/* ------------------------------------------------------------------ */
/* 场景 3：初始终点就是 B 栋（excluded）                                */
/* ------------------------------------------------------------------ */
async function scenarioExcludedAtInit() {
  console.log("\n== 场景 3：初始终点就是 B 栋（INDOOR_PROVIDERS.excluded） ==");
  const env = createEnvironment({ search: "", end: "ENT_B" });
  try {
    const br = await env.init();
    const P = env.providers;
    const bar = env.el("indoorBar");

    ok("B 栋：室内栏无 show 类", !bar.classList.contains("show"));
    eq("B 栋：INDOOR_BRIDGE.url() 为 null", br.url(), null);
    eq("B 栋：INDOOR_PROVIDERS.get(B) 为 null", P.get("B"), null);
    eq("B 栋：INDOOR_PROVIDERS.has(B) 为 false", P.has("B"), false);
    eq("B 栋：不填充楼层下拉", env.el("indoorFloor").children.length, 0);
    eq("B 栋：imFrame.src 为空", env.el("imFrame").src, "");
    ok(
      "B 栋：未生成任何 #B 外链 / 深链",
      !anyUrlContains(env, "#B") && !env.historyCalls.some((url) => url.indexOf("#B") >= 0)
    );
    ok("B 栋：出现排除提示 toast", /B\s*栋/.test(env.el("toast").textContent), JSON.stringify(env.el("toast").textContent));

    // 附加：即使误触按钮，也不能打开外部页
    dispatchEvent(env.el("btnIndoor"), "click");
    ok("B 栋：误触 btnIndoor 不打开弹窗", !env.el("indoorModal").classList.contains("open"));
    eq("B 栋：误触后 imFrame.src 仍为空", env.el("imFrame").src, "");

    await env.poll();
    eq("B 栋：轮询后 url() 仍为 null", br.url(), null);
    const synced = lastHistory(env);
    ok(
      "B 栋：轮询同步的地址栏既无 floor 也无 #B",
      synced.indexOf("floor=") < 0 && synced.indexOf("#B") < 0,
      JSON.stringify(synced)
    );
  } finally {
    env.cleanup();
  }
}

/* ------------------------------------------------------------------ */
/* 场景 4（附加）：?to=E2&floor=9F 非法楼层回退默认层                    */
/* ------------------------------------------------------------------ */
async function scenarioInvalidFloorParam() {
  console.log("\n== 场景 4（附加）：?to=E2&floor=9F 非法楼层回退默认层 ==");
  const env = createEnvironment({ search: "?to=E2&floor=9F" });
  try {
    const br = await env.init();
    const floorSel = env.el("indoorFloor");

    eq("to=E2 解析为 ENT_E2", env.app.state.end && env.app.state.end.nodeId, "ENT_E2");
    eq("非法楼层 9F 回退默认 1F", floorSel.value, "1F");
    eq("回退后深链 = #E2/1F", br.url(), BASE_URL + "#E2/1F");
    eq("E-2 栋楼层选项数 = 5", floorSel.children.length, 5);

    await env.poll();
    ok(
      "轮询把非法 floor 修正为 floor=1F",
      /floor=1F/.test(lastHistory(env)),
      JSON.stringify(lastHistory(env))
    );
  } finally {
    env.cleanup();
  }
}

/* ------------------------------------------------------------------ */
/* 入口                                                                */
/* ------------------------------------------------------------------ */
async function runScenario(name, fn) {
  try {
    await fn();
  } catch (err) {
    fail++;
    const firstLine = err && err.stack ? String(err.stack).split("\n")[0] : String(err);
    failures.push(name + " 运行异常：" + firstLine);
    console.log("  FAIL  " + name + " 运行异常：" + firstLine);
    if (err && err.stack) console.log(String(err.stack).split("\n").slice(1, 6).join("\n"));
  }
}

function summary() {
  console.log("\n========================================");
  console.log("PASS " + pass + "  FAIL " + fail);
  if (notes.length) {
    console.log("\n观察（未修改桥接代码，非验收失败）：");
    notes.forEach((item) => console.log(" - " + item));
  } else {
    console.log("未记录到桥接逻辑缺陷（本仿真仅覆盖逻辑层）。");
  }
  if (fail) {
    console.log("\n失败项：");
    failures.forEach((item) => console.log(" - " + item));
    process.exitCode = 1;
  }
  console.log("\n（逻辑仿真：不覆盖真实 DOM/CSS、iframe 网络加载、浏览器 history 实现）");
}

async function main() {
  console.log("桥接逻辑仿真测试（Node vm + 最小 DOM 桩，非真实浏览器验证）");
  console.log("被测：app/indoor-bridge.js；数据：data/campus.js + assets/indoor-providers.js");

  await runScenario("场景 1", scenarioMainFlow);
  await runScenario("场景 2", scenarioUrlParams);
  await runScenario("场景 3", scenarioExcludedAtInit);
  await runScenario("场景 4", scenarioInvalidFloorParam);

  summary();
}

process.on("uncaughtException", (err) => {
  console.error("\n[运行时异常] 桥接脚本在定时器回调中抛错（真实失败）：");
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("\n[未处理 Promise 拒绝]");
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});

main().catch((err) => {
  console.error("\n[测试调度异常]");
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
