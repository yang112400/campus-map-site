/* 真实校园 GIS 底图与 POI（数据来自 gis.xidian.edu.cn 公共接口，2026-11-01 快照）
 * 坐标：WGS-84 经纬度；底图：学校 3D 渲染瓦片（lyrs=zst）。
 * 仅用于课程演示，版权归西安电子科技大学 GIS 所有。
 */
window.REAL_CAMPUS = {
  center: [34.1246, 108.8347],
  zoom: 17,
  minZoom: 16,
  maxZoom: 20,
  tileUrl: "https://gis.xidian.edu.cn/map?lyrs=zst&x={x}&y={y}&z={z}",
  attribution: "底图 © 西安电子科技大学 GIS · 路径 © 校园 GIS",

  pois: [
    { id: "GATE", name: "南校区东大门", lon: 108.83999658117804, lat: 34.122057293297075, type: "gate" },
    { id: "A", name: "A栋（西一楼）", lon: 108.83031805553608, lat: 34.12724568994085, type: "building" },
    { id: "B", name: "B栋（西二楼）", lon: 108.83207889254166, lat: 34.12592699581124, type: "building" },
    { id: "C", name: "C栋（西三楼）", lon: 108.83290823855467, lat: 34.126116577132336, type: "building" },
    { id: "E1", name: "E-1栋（东三楼）", lon: 108.83507, lat: 34.124382631945, type: "building", approx: true },
    { id: "E2", name: "E-2栋（东三楼）", lon: 108.83542, lat: 34.124382631945, type: "building", approx: true },
    { id: "E3", name: "E-3栋（东三楼）", lon: 108.83577, lat: 34.124382631945, type: "building", approx: true },
    { id: "F", name: "F栋（东二楼）", lon: 108.8365545515347, lat: 34.124384166650444, type: "building" },
    { id: "G", name: "G栋（东一楼）", lon: 108.83884986208486, lat: 34.12335010306367, type: "building" },
    { id: "I", name: "I栋（信远1区）", lon: 108.83856306786836, lat: 34.124856251393595, type: "building" },
    { id: "LIB", name: "图书馆", lon: 108.83188027278115, lat: 34.125301517297444, type: "building" },
    { id: "GYM", name: "远望谷体育馆", lon: 108.83787471551338, lat: 34.119845762147634, type: "building" }
  ],

  /* 宿舍起点（DawnWAW/BMap 的 building 坐标 + 0gaowei/xidian-navigation 的宿舍分组） */
  dorms: [
    { id: "DORM_ZY", name: "竹园1-4号楼", lon: 108.839762, lat: 34.127228, type: "dorm" },
    { id: "DORM_HT56", name: "海棠5/6号楼", lon: 108.835367, lat: 34.128960, type: "dorm" },
    { id: "DORM_HT78", name: "海棠7/8号楼", lon: 108.832777, lat: 34.130083, type: "dorm" },
    { id: "DORM_HT910", name: "海棠9/10号楼", lon: 108.832047, lat: 34.128901, type: "dorm" },
    { id: "DORM_DX1113", name: "丁香11-13号楼", lon: 108.828551, lat: 34.123407, type: "dorm" },
    { id: "DORM_DX1415", name: "丁香14/15号楼", lon: 108.830255, lat: 34.122040, type: "dorm" }
  ]
};
