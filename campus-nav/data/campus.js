/* 模拟校园（假室外）数据 —— 单位：米
 * 坐标系：原点在校园西南角；+X 向东，+Z 向南，+Y 向上。
 * 外部室内页面：assets/indoor-providers.js（A/C/E-1/E-2/E-3/F/G 栋深链）
 * B 栋室内不在本次外部对接范围内（INDOOR_PROVIDERS.excluded = ["B"]）。
 */
window.CAMPUS = {
  size: 300,

  roads: [
    { id: "v150", name: "学府大道", dir: "v", center: 150, width: 12, from: 0, to: 300 },
    { id: "v60",  name: "西一路",   dir: "v", center: 60,  width: 7,  from: 0, to: 300 },
    { id: "v240", name: "东一路",   dir: "v", center: 240, width: 7,  from: 0, to: 300 },
    { id: "h70",  name: "北环路",   dir: "h", center: 70,  width: 7,  from: 0, to: 300 },
    { id: "h150", name: "中心路",   dir: "h", center: 150, width: 10, from: 0, to: 300 },
    { id: "h230", name: "南环路",   dir: "h", center: 230, width: 7,  from: 0, to: 300 }
  ],

  buildings: [
    /* 西侧：A / B / C（对应外部站点 A/B/C 栋；B 不接入外部室内） */
    { id: "A", name: "A栋", alias: "西一楼", x0: 70, x1: 120, z0: 80,  z1: 115, h: 25, color: "#d8d2c4", roof: "#6b7078", entrance: { x: 120, z: 97.5 }, node: "ENT_A", floors: 6 },
    { id: "B", name: "B栋", alias: "西二楼", x0: 70, x1: 120, z0: 120, z1: 143, h: 14, color: "#d3c8b8", roof: "#6d5f4e", entrance: { x: 120, z: 131.5 }, node: "ENT_B", floors: 3 },
    { id: "C", name: "C栋", alias: "西三楼", x0: 70, x1: 120, z0: 165, z1: 205, h: 21, color: "#cdd5db", roof: "#59636e", entrance: { x: 120, z: 185 }, node: "ENT_C", floors: 5 },

    /* 东侧：G / F / E-1 / E-2 / E-3（对应外部站点 G/F/E1/E2/E3 栋） */
    { id: "G",  name: "G栋",   alias: "东一楼", x0: 180, x1: 230, z0: 80,  z1: 115, h: 25, color: "#d9ccb8", roof: "#6d5f4e", entrance: { x: 180, z: 97.5 }, node: "ENT_G",  floors: 6 },
    { id: "F",  name: "F栋",   alias: "东二楼", x0: 180, x1: 230, z0: 120, z1: 143, h: 21, color: "#e4dfd2", roof: "#4f5c6e", entrance: { x: 180, z: 131.5 }, node: "ENT_F",  floors: 5 },
    { id: "E1", name: "E-1栋", alias: "东三楼", x0: 170, x1: 190, z0: 165, z1: 205, h: 18, color: "#d4d8d0", roof: "#5d6660", entrance: { x: 170, z: 185 }, node: "ENT_E1", floors: 5 },
    { id: "E2", name: "E-2栋", alias: "东三楼", x0: 192, x1: 212, z0: 165, z1: 205, h: 18, color: "#d4d8d0", roof: "#5d6660", entrance: { x: 192, z: 185 }, node: "ENT_E2", floors: 5 },
    { id: "E3", name: "E-3栋", alias: "东三楼", x0: 214, x1: 234, z0: 165, z1: 205, h: 18, color: "#d4d8d0", roof: "#5d6660", entrance: { x: 214, z: 185 }, node: "ENT_E3", floors: 5 },

    /* 配套（无外部室内页，仅做校园场景） */
    { id: "LIB",     name: "图书馆", x0: 20,  x1: 55,  z0: 105, z1: 140, h: 20, color: "#e4dfd2", roof: "#4f5c6e", entrance: { x: 55,  z: 122.5 }, node: "ENT_LIB",     floors: 5 },
    { id: "I",       name: "I栋",   alias: "信远1区", x0: 20, x1: 55, z0: 165, z1: 200, h: 17, color: "#d9d2c4", roof: "#5f6a72", entrance: { x: 55, z: 182.5 }, node: "ENT_I", floors: 4 },
    { id: "CANTEEN", name: "食堂",   x0: 245, x1: 285, z0: 108, z1: 140, h: 10, color: "#e2d2b4", roof: "#7a6248", entrance: { x: 245, z: 124 }, node: "ENT_CANTEEN", floors: 2 },
    { id: "GYM",     name: "体育馆", x0: 245, x1: 285, z0: 78,  z1: 100, h: 14, color: "#c8d1d7", roof: "#4c5a66", entrance: { x: 245, z: 89 }, node: "ENT_GYM",     floors: 3 }
  ],

  gate: { x: 150, z: 295, width: 28, height: 6.5, name: "校门" },

  nodes: [
    /* 学府大道（南北主路） */
    { id: "N150_0",   x: 150, z: 0,   type: "end",    name: "学府大道北端" },
    { id: "N150_70",  x: 150, z: 70,  type: "cross",  name: "学府大道/北环路" },
    { id: "N150_102", x: 150, z: 102, type: "access", name: "A栋/G栋路口" },
    { id: "N150_150", x: 150, z: 150, type: "cross",  name: "学府大道/中心路" },
    { id: "N150_202", x: 150, z: 202, type: "access", name: "C栋/E栋路口" },
    { id: "N150_230", x: 150, z: 230, type: "cross",  name: "学府大道/南环路" },
    { id: "GATE",     x: 150, z: 295, type: "gate",   name: "校门" },

    /* 西一路 */
    { id: "N60_0",   x: 60, z: 0,   type: "end",    name: "西一路北端" },
    { id: "N60_70",  x: 60, z: 70,  type: "cross",  name: "西一路/北环路" },
    { id: "N60_135", x: 60, z: 135, type: "access", name: "图书馆路口" },
    { id: "N60_150", x: 60, z: 150, type: "cross",  name: "西一路/中心路" },
    { id: "N60_182", x: 60, z: 182, type: "access", name: "I栋路口" },
    { id: "N60_230", x: 60, z: 230, type: "cross",  name: "西一路/南环路" },
    { id: "N60_300", x: 60, z: 300, type: "end",    name: "西一路南端" },

    /* 东一路 */
    { id: "N240_0",   x: 240, z: 0,   type: "end",    name: "东一路北端" },
    { id: "N240_70",  x: 240, z: 70,  type: "cross",  name: "东一路/北环路" },
    { id: "N240_100", x: 240, z: 100, type: "access", name: "体育馆路口" },
    { id: "N240_135", x: 240, z: 135, type: "access", name: "食堂路口" },
    { id: "N240_150", x: 240, z: 150, type: "cross",  name: "东一路/中心路" },
    { id: "N240_230", x: 240, z: 230, type: "cross",  name: "东一路/南环路" },
    { id: "N240_300", x: 240, z: 300, type: "end",    name: "东一路南端" },

    /* 教学楼主入口（含外部室内页的楼栋） */
    { id: "ENT_A",  x: 120, z: 97.5, type: "entrance", name: "A栋入口",  buildingId: "A"  },
    { id: "ENT_B",  x: 120, z: 131.5, type: "entrance", name: "B栋入口",  buildingId: "B"  },
    { id: "ENT_C",  x: 120, z: 185, type: "entrance", name: "C栋入口",  buildingId: "C"  },
    { id: "ENT_G",  x: 180, z: 97.5, type: "entrance", name: "G栋入口",  buildingId: "G"  },
    { id: "ENT_F",  x: 180, z: 131.5, type: "entrance", name: "F栋入口",  buildingId: "F"  },
    { id: "ENT_E1", x: 170, z: 185, type: "entrance", name: "E-1栋入口", buildingId: "E1" },
    { id: "ENT_E2", x: 192, z: 185, type: "entrance", name: "E-2栋入口", buildingId: "E2" },
    { id: "ENT_E3", x: 214, z: 185, type: "entrance", name: "E-3栋入口", buildingId: "E3" },

    /* E 栋南侧室外步道（绕开楼体，避免路线穿楼） */
    { id: "E_walk_1", x: 168, z: 212, type: "access", name: "E栋南侧步道西" },
    { id: "E_walk_2", x: 190, z: 212, type: "access", name: "E栋南侧步道中" },
    { id: "E_walk_3", x: 212, z: 212, type: "access", name: "E栋南侧步道东" },

    /* 配套入口 */
    { id: "ENT_LIB",     x: 55,  z: 122.5, type: "entrance", name: "图书馆入口", buildingId: "LIB"     },
    { id: "ENT_I",       x: 55,  z: 182.5, type: "entrance", name: "I栋入口",   buildingId: "I"       },
    { id: "ENT_CANTEEN", x: 245, z: 124, type: "entrance", name: "食堂入口",   buildingId: "CANTEEN" },
    { id: "ENT_GYM",     x: 245, z: 89, type: "entrance", name: "体育馆入口", buildingId: "GYM"     }
  ],

  edges: [
    /* 学府大道 */
    ["N150_0",   "N150_70",  "学府大道"],
    ["N150_70",  "N150_102", "学府大道"],
    ["N150_102", "N150_150", "学府大道"],
    ["N150_150", "N150_202", "学府大道"],
    ["N150_202", "N150_230", "学府大道"],
    ["N150_230", "GATE",     "学府大道"],

    /* 西一路 */
    ["N60_0",   "N60_70",  "西一路"],
    ["N60_70",  "N60_135", "西一路"],
    ["N60_135", "N60_150", "西一路"],
    ["N60_150", "N60_182", "西一路"],
    ["N60_182", "N60_230", "西一路"],
    ["N60_230", "N60_300", "西一路"],

    /* 东一路 */
    ["N240_0",   "N240_70",  "东一路"],
    ["N240_70",  "N240_100", "东一路"],
    ["N240_100", "N240_135", "东一路"],
    ["N240_135", "N240_150", "东一路"],
    ["N240_150", "N240_230", "东一路"],
    ["N240_230", "N240_300", "东一路"],

    /* 横向道路 */
    ["N60_70",  "N150_70",  "北环路"],
    ["N150_70", "N240_70",  "北环路"],
    ["N60_150", "N150_150", "中心路"],
    ["N150_150","N240_150", "中心路"],
    ["N60_230", "N150_230", "南环路"],
    ["N150_230","N240_230", "南环路"],

    /* 教学楼步道 */
    ["N150_102", "ENT_A",  "A栋步道"],
    ["N150_102", "ENT_G",  "G栋步道"],
    ["N150_150", "ENT_B",  "B栋步道"],
    ["N150_150", "ENT_F",  "F栋步道"],
    ["N150_202", "ENT_C",  "C栋步道"],
    ["N150_202", "E_walk_1", "E栋南侧步道"],
    ["E_walk_1", "E_walk_2", "E栋南侧步道"],
    ["E_walk_2", "E_walk_3", "E栋南侧步道"],
    ["E_walk_1", "ENT_E1", "E-1栋步道"],
    ["E_walk_2", "ENT_E2", "E-2栋步道"],
    ["E_walk_3", "ENT_E3", "E-3栋步道"],

    /* 配套步道 */
    ["N60_135",  "ENT_LIB",     "图书馆步道"],
    ["N60_182",  "ENT_I",       "I栋步道"],
    ["N240_135", "ENT_CANTEEN", "食堂步道"],
    ["N240_100", "ENT_GYM",     "体育馆步道"]
  ],

  pois: [
    { id: "GATE",      name: "校门",    node: "GATE" },
    { id: "A",         name: "A栋",     node: "ENT_A" },
    { id: "B",         name: "B栋",     node: "ENT_B" },
    { id: "C",         name: "C栋",     node: "ENT_C" },
    { id: "G",         name: "G栋",     node: "ENT_G" },
    { id: "F",         name: "F栋",     node: "ENT_F" },
    { id: "E1",        name: "E-1栋",   node: "ENT_E1" },
    { id: "E2",        name: "E-2栋",   node: "ENT_E2" },
    { id: "E3",        name: "E-3栋",   node: "ENT_E3" },
    { id: "LIB",       name: "图书馆",  node: "ENT_LIB" },
    { id: "I",         name: "I栋",     node: "ENT_I" },
    { id: "CANTEEN",   name: "食堂",    node: "ENT_CANTEEN" },
    { id: "GYM",       name: "体育馆",  node: "ENT_GYM" },
    { id: "CENTER",    name: "中心路口", node: "N150_150" }
  ]
};
