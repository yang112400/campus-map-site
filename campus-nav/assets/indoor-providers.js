/* 外部室内页面提供方配置（campus-map-site · 2026-11 新版室内地图）
 * 目标站点：https://yang112400.github.io/campus-map-site/
 * 新版能力：房间热点、房间搜索、本层房间列表、B 栋独立导航入口
 * 深链格式：#<楼栋id>/<楼层id>，例如 #A/2F、#E1/5F
 * 覆盖楼栋：A / C / E-1 / E-2 / E-3 / F / G / I
 * B 栋：主流程仍用本地 b-package v4.1（80 间教室 / 8 入口 / 跨层路线）
 */
window.INDOOR_PROVIDERS = {
  version: "2.1.0",
  provider: "campus-map-site",
  baseUrl: "https://yang112400.github.io/campus-map-site/",
  hashTemplate: "#{buildingId}/{floorId}",
  excluded: ["B"],

  /* outdoorBuildingId -> 外部站点配置 */
  byBuilding: {
    A: {
      providerBuildingId: "A",
      name: "A栋（西一楼）",
      defaultFloor: "1F",
      floors: [
        { id: "1F", label: "1层" }, { id: "2F", label: "2层" },
        { id: "3F", label: "3层" }, { id: "4F", label: "4层" },
        { id: "5F", label: "5层" }, { id: "6F", label: "6层" }
      ]
    },
    C: {
      providerBuildingId: "C",
      name: "C栋（西三楼）",
      defaultFloor: "1F",
      floors: [
        { id: "1F", label: "1层" }, { id: "2F", label: "2层" },
        { id: "3F", label: "3层" }, { id: "4F", label: "4层" },
        { id: "5F", label: "5层" }
      ]
    },
    E1: {
      providerBuildingId: "E1",
      name: "E-1栋（东三楼）",
      defaultFloor: "1F",
      floors: [
        { id: "1F", label: "1层" }, { id: "2F", label: "2层" },
        { id: "3F", label: "3层" }, { id: "4F", label: "4层" },
        { id: "5F", label: "5层" }
      ]
    },
    E2: {
      providerBuildingId: "E2",
      name: "E-2栋（东三楼）",
      defaultFloor: "1F",
      floors: [
        { id: "1F", label: "1层" }, { id: "2F", label: "2层" },
        { id: "3F", label: "3层" }, { id: "4F", label: "4层" },
        { id: "5F", label: "5层" }
      ]
    },
    E3: {
      providerBuildingId: "E3",
      name: "E-3栋（东三楼）",
      defaultFloor: "1F",
      floors: [
        { id: "1F", label: "1层" }, { id: "2F", label: "2层" },
        { id: "3F", label: "3层" }, { id: "4F", label: "4层" },
        { id: "5F", label: "5层" }
      ]
    },
    F: {
      providerBuildingId: "F",
      name: "F栋（东二楼）",
      defaultFloor: "1F",
      floors: [
        { id: "1F", label: "1层" }, { id: "2F", label: "2层" },
        { id: "3F", label: "3层" }, { id: "4F", label: "4层" },
        { id: "5F", label: "5层" }
      ]
    },
    G: {
      providerBuildingId: "G",
      name: "G栋（东一楼）",
      defaultFloor: "1F",
      floors: [
        { id: "1F", label: "1层" }, { id: "2F", label: "2层" },
        { id: "3F", label: "3层" }, { id: "4F", label: "4层" },
        { id: "5F", label: "5层" }, { id: "6F", label: "6层" }
      ],
      note: "G 栋为楼层图，无房间热点"
    },
    I: {
      providerBuildingId: "I",
      name: "I栋（信远1区）",
      defaultFloor: "1F",
      floors: [
        { id: "1F", label: "1层" }, { id: "2F", label: "2层" },
        { id: "3F", label: "3层" }, { id: "4F", label: "4层" }
      ]
    }
  },

  /** 取某栋室外建筑的外部室内配置；未覆盖/被排除返回 null */
  get: function (outdoorBuildingId) {
    if (!outdoorBuildingId) return null;
    if (this.excluded.indexOf(outdoorBuildingId) >= 0) return null;
    return this.byBuilding[outdoorBuildingId] || null;
  },

  /** 是否在本次外部对接范围内 */
  has: function (outdoorBuildingId) {
    return !!this.get(outdoorBuildingId);
  },

  /** 生成深链：#<buildingId>/<floorId>；楼层缺省用默认层 */
  buildUrl: function (outdoorBuildingId, floorId) {
    var entry = this.get(outdoorBuildingId);
    if (!entry) return null;
    var floor = floorId || entry.defaultFloor;
    var valid = entry.floors.some(function (f) { return f.id === floor; });
    if (!valid) floor = entry.defaultFloor;
    return this.baseUrl + "#" + encodeURIComponent(entry.providerBuildingId) + "/" + encodeURIComponent(floor);
  },

  /** 调试/测试用：列出本次对接的楼栋 id */
  list: function () {
    return Object.keys(this.byBuilding);
  }
};
