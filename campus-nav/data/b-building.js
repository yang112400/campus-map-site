/* B 楼真实楼层/教室/入口数据
 * 来源：
 *   - DawnWAW/BMap：78 间教室拓扑、16 个入口 GPS、Dijkstra/入口选择思路
 *   - 0gaowei/xidian-navigation：B 楼 1–7 层教室清单、通道口分组、楼层图
 * 说明：教室清单为两仓库合并；无 license，仅课程演示使用，请勿公开再分发图片。
 */
window.B_BUILDING = {
  name: "B楼",
  subtitle: "7 层 · 约 79 间教室 · 16 个入口",
  overviewImage: "assets/b-floorplans/xd_b.png",
  floors: [
    {
      id: "1", label: "1层", image: "assets/b-floorplans/xd_floor_1.jpg",
      rooms: [101, 105, 106, 107]
    },
    {
      id: "2", label: "2层", image: "assets/b-floorplans/xd_floor_2.jpg",
      rooms: [201, 203, 206, 207, 208, 211, 215, 216, 217]
    },
    {
      id: "3", label: "3层", image: "assets/b-floorplans/xd_floor_3.jpg",
      rooms: [301, 303, 306, 307, 308, 311, 312, 314, 315, 316, 318, 320]
    },
    {
      id: "4", label: "4层", image: "assets/b-floorplans/xd_floor_4.jpg",
      rooms: [401, 403, 406, 407, 408, 411, 412, 414, 415, 416, 418, 419, 421, 422, 425, 426, 442, 443, 437, 434, 433]
    },
    {
      id: "5", label: "5层", image: "assets/b-floorplans/xd_floor_5.jpg",
      rooms: [501, 502, 503, 506, 507, 508, 509, 510, 511, 513, 514, 516, 517, 520, 521, 528, 529, 532, 537, 538]
    },
    {
      id: "6", label: "6层", image: "assets/b-floorplans/xd_floor_6.jpg",
      rooms: [601, 602, 603, 605, 606, 608, 609, 612, 613]
    },
    {
      id: "7", label: "7层", image: "assets/b-floorplans/xd_floor_7.jpg",
      rooms: [701, 703, 706, 707]
    }
  ],

  /* DawnWAW/BMap：B 楼 16 个真实入口 GPS */
  entrances: [
    { number: 1, name: "东侧南入口", lat: 34.125252, lon: 108.832942 },
    { number: 2, name: "东侧北入口", lat: 34.12543, lon: 108.832974 },
    { number: 3, name: "东侧北入口", lat: 34.125567, lon: 108.832641 },
    { number: 4, name: "东侧南入口", lat: 34.125425, lon: 108.832518 },
    { number: 5, name: "东侧北入口", lat: 34.125687, lon: 108.832368 },
    { number: 6, name: "北楼东入口", lat: 34.125736, lon: 108.832244 },
    { number: 7, name: "东侧东入口", lat: 34.125807, lon: 108.832014 },
    { number: 8, name: "北楼楼梯口", lat: 34.125949, lon: 108.831997 },
    { number: 9, name: "西侧南入口", lat: 34.125874, lon: 108.831928 },
    { number: 10, name: "西侧南入口", lat: 34.12581, lon: 108.831671 },
    { number: 11, name: "西侧北入口", lat: 34.125957, lon: 108.831704 },
    { number: 12, name: "北楼西入口", lat: 34.126086, lon: 108.831462 },
    { number: 13, name: "西侧北入口", lat: 34.126161, lon: 108.83129 },
    { number: 14, name: "西侧西入口", lat: 34.12613, lon: 108.831151 },
    { number: 15, name: "西侧北入口", lat: 34.126343, lon: 108.830877 },
    { number: 16, name: "西侧北入口", lat: 34.126525, lon: 108.83047 }
  ],

  /* 0gaowei/xidian-navigation：通道口 → 教室分组（用于入口提示） */
  groups: [
    { id: "1", label: "南侧通道口 1", rooms: [101, 201, 203, 301, 303, 401, 403, 501] },
    { id: "23", label: "南侧通道口 2/3", rooms: [105, 106, 107, 206, 207, 208, 211, 306, 307, 308, 311, 406, 407, 408, 411, 502, 503, 506, 507] },
    { id: "45", label: "南侧通道口 4/5", rooms: [215, 216, 217, 312, 314, 315, 412, 414, 415, 508, 509, 510, 511, 601, 602, 603] },
    { id: "6", label: "南侧通道口 6", rooms: [316, 318, 416, 418, 419, 513, 514, 605, 606, 608, 701] },
    { id: "71", label: "南侧通道口 7（左）", rooms: [320, 421, 516, 517, 609, 703] },
    { id: "72", label: "南侧通道口 7（右）", rooms: [422, 425, 426, 520, 521, 612, 613, 706, 707] },
    { id: "8", label: "北侧通道口 8", rooms: [442, 443, 537, 538] },
    { id: "91", label: "北侧通道口 9（左）", rooms: [532, 437, 434, 529] },
    { id: "92", label: "北侧通道口 9（右）", rooms: [433, 528] }
  ],

  sources: [
    { repo: "DawnWAW/BMap", url: "https://github.com/DawnWAW/BMap", use: "教室拓扑、16 入口 GPS、入口选择思路" },
    { repo: "0gaowei/xidian-navigation", url: "https://github.com/0gaowei/xidian-navigation", use: "B 楼 1–7 层教室清单、通道口分组、楼层图" }
  ]
};
