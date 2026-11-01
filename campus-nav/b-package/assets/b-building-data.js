/* 自动生成：B栋结构 v4（单侧教室+北侧服务带+北楼） */
window.B_BUILDING_DATA = {
  "meta": {
    "buildingId": "B",
    "name": "B栋（西二楼）",
    "units": "meter",
    "version": "4.0.0",
    "generatedAt": "2026-11-01",
    "structure": "single-loaded-classrooms + north-service-band + north-wing",
    "dimensions": {
      "length": 270.0,
      "widthMin": 19.0,
      "widthMax": 40.0,
      "height": 40.0,
      "floorHeight": 5.71
    },
    "floors": 7,
    "northFloors": [
      4,
      5
    ],
    "roomCount": 80,
    "nodeCount": 265,
    "edgeCount": 318,
    "confirmed": [
      "7 层南楼 + 北楼仅 4/5 层",
      "每层教室名单（平面图/0gaowei/BMap）",
      "教室在南侧、北侧为楼梯/卫生间/办公室/空位",
      "6F/7F 北侧为楼顶",
      "270m×19-40m×40m",
      "9 个通道口/16 个物理入口 GPS",
      "西电梯到 7 层、东电梯到 6 层"
    ],
    "estimated": [
      "教室中心 z=+8、服务带 z=-8、走廊 z=0；房间进深 8m",
      "列距 16.875m（270/16）；北楼 5 间按 15.6m 排",
      "楼梯柱 x=原始图对应列平均；北楼 x 从 60m 起",
      "宽度 19-40m 未逐段确认，页面按 40m 示意",
      "入口到门的精确对应、楼梯柱精确位置未实测"
    ],
    "notes": [
      "教室单侧；北侧是服务带，不是教室",
      "北楼 N4/N5 独立；6F/7F 北侧不建教室",
      "321/324 已按平面图补入（x 为估算）；5F 508 未确认，暂不建",
      "F1–F7 整层按附件斜楼折算倾斜 5°（楼板+教室+走廊+楼梯）",
      "房间/楼梯/入口均接走廊；竖向用固定 x 的 core 连接",
      "不建模：卫生间/办公室内部、家具"
    ],
    "source": [
      "7 张 1F-7F 平面图",
      "cnblogs izcat /p/14871530.html 原始图",
      "BMap 16 入口 GPS",
      "西电官方电梯/北楼说明",
      "用户 270×19-40×40m"
    ]
  },
  "floors": [
    {
      "id": "F1",
      "level": 1,
      "wing": "S",
      "name": "1层（南楼）",
      "elevation": 0.0,
      "displayY": 2.2,
      "rooms": [
        {
          "id": "101",
          "node": "F1_101",
          "name": "101",
          "floor": "F1",
          "level": 1,
          "wing": "S",
          "x": 16.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "105",
          "node": "F1_105",
          "name": "105",
          "floor": "F1",
          "level": 1,
          "wing": "S",
          "x": 50.62,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "106",
          "node": "F1_106",
          "name": "106",
          "floor": "F1",
          "level": 1,
          "wing": "S",
          "x": 67.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "107",
          "node": "F1_107",
          "name": "107",
          "floor": "F1",
          "level": 1,
          "wing": "S",
          "x": 84.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [
            "107考"
          ],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        }
      ],
      "slabTiltDeg": 5.0,
      "slabTiltAxis": "Z",
      "slabTiltNote": "整层示意倾斜（楼板+教室+走廊+楼梯）"
    },
    {
      "id": "F2",
      "level": 2,
      "wing": "S",
      "name": "2层（南楼）",
      "elevation": 5.71,
      "displayY": 8.2,
      "rooms": [
        {
          "id": "201",
          "node": "F2_201",
          "name": "201",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 16.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "203",
          "node": "F2_203",
          "name": "203",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 33.75,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "206",
          "node": "F2_206",
          "name": "206",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 50.62,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "207",
          "node": "F2_207",
          "name": "207",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 67.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "208",
          "node": "F2_208",
          "name": "208",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 84.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "211",
          "node": "F2_211",
          "name": "211",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 101.25,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "215",
          "node": "F2_215",
          "name": "215",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 118.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [
            "215值"
          ],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "216",
          "node": "F2_216",
          "name": "216",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 135.0,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "217",
          "node": "F2_217",
          "name": "217",
          "floor": "F2",
          "level": 2,
          "wing": "S",
          "x": 151.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        }
      ],
      "slabTiltDeg": 5.0,
      "slabTiltAxis": "Z",
      "slabTiltNote": "整层示意倾斜（楼板+教室+走廊+楼梯）"
    },
    {
      "id": "F3",
      "level": 3,
      "wing": "S",
      "name": "3层（南楼）",
      "elevation": 11.43,
      "displayY": 14.2,
      "rooms": [
        {
          "id": "301",
          "node": "F3_301",
          "name": "301",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 16.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "303",
          "node": "F3_303",
          "name": "303",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 33.75,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "306",
          "node": "F3_306",
          "name": "306",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 50.62,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "307",
          "node": "F3_307",
          "name": "307",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 67.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "308",
          "node": "F3_308",
          "name": "308",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 84.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "311",
          "node": "F3_311",
          "name": "311",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 101.25,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "312",
          "node": "F3_312",
          "name": "312",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 118.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "314",
          "node": "F3_314",
          "name": "314",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 135.0,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "315",
          "node": "F3_315",
          "name": "315",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 151.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "316",
          "node": "F3_316",
          "name": "316",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 168.75,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "318",
          "node": "F3_318",
          "name": "318",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 185.62,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "320",
          "node": "F3_320",
          "name": "320",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 219.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "321",
          "node": "F3_321",
          "name": "321",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 199.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x-estimated"
        },
        {
          "id": "324",
          "node": "F3_324",
          "name": "324",
          "floor": "F3",
          "level": 3,
          "wing": "S",
          "x": 205.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x-estimated"
        }
      ],
      "slabTiltDeg": 5.0,
      "slabTiltAxis": "Z",
      "slabTiltNote": "整层示意倾斜（楼板+教室+走廊+楼梯）"
    },
    {
      "id": "F4",
      "level": 4,
      "wing": "S",
      "name": "4层（南楼）",
      "elevation": 17.14,
      "displayY": 20.2,
      "rooms": [
        {
          "id": "401",
          "node": "F4_401",
          "name": "401",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 16.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "403",
          "node": "F4_403",
          "name": "403",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 33.75,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "406",
          "node": "F4_406",
          "name": "406",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 50.62,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "407",
          "node": "F4_407",
          "name": "407",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 67.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "408",
          "node": "F4_408",
          "name": "408",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 84.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "411",
          "node": "F4_411",
          "name": "411",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 101.25,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "412",
          "node": "F4_412",
          "name": "412",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 118.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "414",
          "node": "F4_414",
          "name": "414",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 135.0,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "415",
          "node": "F4_415",
          "name": "415",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 151.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "416",
          "node": "F4_416",
          "name": "416",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 168.75,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "418",
          "node": "F4_418",
          "name": "418",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 185.62,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "419",
          "node": "F4_419",
          "name": "419",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 202.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "421",
          "node": "F4_421",
          "name": "421",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 219.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "422",
          "node": "F4_422",
          "name": "422",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 236.25,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "425",
          "node": "F4_425",
          "name": "425",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 253.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "426",
          "node": "F4_426",
          "name": "426",
          "floor": "F4",
          "level": 4,
          "wing": "S",
          "x": 270.0,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        }
      ],
      "slabTiltDeg": 5.0,
      "slabTiltAxis": "Z",
      "slabTiltNote": "整层示意倾斜（楼板+教室+走廊+楼梯）"
    },
    {
      "id": "F5",
      "level": 5,
      "wing": "S",
      "name": "5层（南楼）",
      "elevation": 22.86,
      "displayY": 26.2,
      "rooms": [
        {
          "id": "501",
          "node": "F5_501",
          "name": "501",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 33.75,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "502",
          "node": "F5_502",
          "name": "502",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 67.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "503",
          "node": "F5_503",
          "name": "503",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 84.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "506",
          "node": "F5_506",
          "name": "506",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 101.25,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "507",
          "node": "F5_507",
          "name": "507",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 118.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "509",
          "node": "F5_509",
          "name": "509",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 135.0,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "510",
          "node": "F5_510",
          "name": "510",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 151.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "511",
          "node": "F5_511",
          "name": "511",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 168.75,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "513",
          "node": "F5_513",
          "name": "513",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 185.62,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "514",
          "node": "F5_514",
          "name": "514",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 202.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "516",
          "node": "F5_516",
          "name": "516",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 219.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "517",
          "node": "F5_517",
          "name": "517",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 236.25,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "520",
          "node": "F5_520",
          "name": "520",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 253.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "521",
          "node": "F5_521",
          "name": "521",
          "floor": "F5",
          "level": 5,
          "wing": "S",
          "x": 270.0,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        }
      ],
      "slabTiltDeg": 5.0,
      "slabTiltAxis": "Z",
      "slabTiltNote": "整层示意倾斜（楼板+教室+走廊+楼梯）"
    },
    {
      "id": "F6",
      "level": 6,
      "wing": "S",
      "name": "6层（南楼）",
      "elevation": 28.57,
      "displayY": 32.2,
      "rooms": [
        {
          "id": "601",
          "node": "F6_601",
          "name": "601",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 118.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "602",
          "node": "F6_602",
          "name": "602",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 151.88,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "603",
          "node": "F6_603",
          "name": "603",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 168.75,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "605",
          "node": "F6_605",
          "name": "605",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 185.62,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "606",
          "node": "F6_606",
          "name": "606",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 202.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "608",
          "node": "F6_608",
          "name": "608",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 219.38,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "609",
          "node": "F6_609",
          "name": "609",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 236.25,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "612",
          "node": "F6_612",
          "name": "612",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 253.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "613",
          "node": "F6_613",
          "name": "613",
          "floor": "F6",
          "level": 6,
          "wing": "S",
          "x": 270.0,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        }
      ],
      "slabTiltDeg": 5.0,
      "slabTiltAxis": "Z",
      "slabTiltNote": "整层示意倾斜（楼板+教室+走廊+楼梯）"
    },
    {
      "id": "F7",
      "level": 7,
      "wing": "S",
      "name": "7层（南楼）",
      "elevation": 34.29,
      "displayY": 38.2,
      "rooms": [
        {
          "id": "701",
          "node": "F7_701",
          "name": "701",
          "floor": "F7",
          "level": 7,
          "wing": "S",
          "x": 202.5,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "703",
          "node": "F7_703",
          "name": "703",
          "floor": "F7",
          "level": 7,
          "wing": "S",
          "x": 236.25,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "706",
          "node": "F7_706",
          "name": "706",
          "floor": "F7",
          "level": 7,
          "wing": "S",
          "x": 253.12,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        },
        {
          "id": "707",
          "node": "F7_707",
          "name": "707",
          "floor": "F7",
          "level": 7,
          "wing": "S",
          "x": 270.0,
          "z": 8.0,
          "side": "S",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; z-estimated"
        }
      ],
      "slabTiltDeg": 5.0,
      "slabTiltAxis": "Z",
      "slabTiltNote": "整层示意倾斜（楼板+教室+走廊+楼梯）"
    },
    {
      "id": "N4",
      "level": 4,
      "wing": "N",
      "name": "4层（北楼）",
      "elevation": 17.14,
      "displayY": 20.2,
      "rooms": [
        {
          "id": "442",
          "node": "N4_442",
          "name": "442",
          "floor": "N4",
          "level": 4,
          "wing": "N",
          "x": 60.0,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        },
        {
          "id": "443",
          "node": "N4_443",
          "name": "443",
          "floor": "N4",
          "level": 4,
          "wing": "N",
          "x": 75.6,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        },
        {
          "id": "437",
          "node": "N4_437",
          "name": "437",
          "floor": "N4",
          "level": 4,
          "wing": "N",
          "x": 91.2,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        },
        {
          "id": "434",
          "node": "N4_434",
          "name": "434",
          "floor": "N4",
          "level": 4,
          "wing": "N",
          "x": 106.8,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        },
        {
          "id": "433",
          "node": "N4_433",
          "name": "433",
          "floor": "N4",
          "level": 4,
          "wing": "N",
          "x": 122.4,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        }
      ]
    },
    {
      "id": "N5",
      "level": 5,
      "wing": "N",
      "name": "5层（北楼）",
      "elevation": 22.86,
      "displayY": 26.2,
      "rooms": [
        {
          "id": "538",
          "node": "N5_538",
          "name": "538",
          "floor": "N5",
          "level": 5,
          "wing": "N",
          "x": 60.0,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        },
        {
          "id": "537",
          "node": "N5_537",
          "name": "537",
          "floor": "N5",
          "level": 5,
          "wing": "N",
          "x": 75.6,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        },
        {
          "id": "532",
          "node": "N5_532",
          "name": "532",
          "floor": "N5",
          "level": 5,
          "wing": "N",
          "x": 91.2,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        },
        {
          "id": "529",
          "node": "N5_529",
          "name": "529",
          "floor": "N5",
          "level": 5,
          "wing": "N",
          "x": 106.8,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        },
        {
          "id": "528",
          "node": "N5_528",
          "name": "528",
          "floor": "N5",
          "level": 5,
          "wing": "N",
          "x": 122.4,
          "z": -54.5,
          "side": "N",
          "type": "classroom",
          "aliases": [],
          "source": "floorplan",
          "confidence": "room-number-confirmed; x/z-estimated"
        }
      ]
    }
  ],
  "rooms": [
    {
      "id": "101",
      "node": "F1_101",
      "name": "101",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 16.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "105",
      "node": "F1_105",
      "name": "105",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 50.62,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "106",
      "node": "F1_106",
      "name": "106",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "107",
      "node": "F1_107",
      "name": "107",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [
        "107考"
      ],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "201",
      "node": "F2_201",
      "name": "201",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 16.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "203",
      "node": "F2_203",
      "name": "203",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 33.75,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "206",
      "node": "F2_206",
      "name": "206",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 50.62,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "207",
      "node": "F2_207",
      "name": "207",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "208",
      "node": "F2_208",
      "name": "208",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "211",
      "node": "F2_211",
      "name": "211",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 101.25,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "215",
      "node": "F2_215",
      "name": "215",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [
        "215值"
      ],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "216",
      "node": "F2_216",
      "name": "216",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 135.0,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "217",
      "node": "F2_217",
      "name": "217",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "301",
      "node": "F3_301",
      "name": "301",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 16.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "303",
      "node": "F3_303",
      "name": "303",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 33.75,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "306",
      "node": "F3_306",
      "name": "306",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 50.62,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "307",
      "node": "F3_307",
      "name": "307",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "308",
      "node": "F3_308",
      "name": "308",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "311",
      "node": "F3_311",
      "name": "311",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 101.25,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "312",
      "node": "F3_312",
      "name": "312",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "314",
      "node": "F3_314",
      "name": "314",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 135.0,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "315",
      "node": "F3_315",
      "name": "315",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "316",
      "node": "F3_316",
      "name": "316",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 168.75,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "318",
      "node": "F3_318",
      "name": "318",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 185.62,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "320",
      "node": "F3_320",
      "name": "320",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 219.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "401",
      "node": "F4_401",
      "name": "401",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 16.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "403",
      "node": "F4_403",
      "name": "403",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 33.75,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "406",
      "node": "F4_406",
      "name": "406",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 50.62,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "407",
      "node": "F4_407",
      "name": "407",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "408",
      "node": "F4_408",
      "name": "408",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "411",
      "node": "F4_411",
      "name": "411",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 101.25,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "412",
      "node": "F4_412",
      "name": "412",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "414",
      "node": "F4_414",
      "name": "414",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 135.0,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "415",
      "node": "F4_415",
      "name": "415",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "416",
      "node": "F4_416",
      "name": "416",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 168.75,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "418",
      "node": "F4_418",
      "name": "418",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 185.62,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "419",
      "node": "F4_419",
      "name": "419",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 202.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "421",
      "node": "F4_421",
      "name": "421",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 219.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "422",
      "node": "F4_422",
      "name": "422",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 236.25,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "425",
      "node": "F4_425",
      "name": "425",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 253.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "426",
      "node": "F4_426",
      "name": "426",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 270.0,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "501",
      "node": "F5_501",
      "name": "501",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 33.75,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "502",
      "node": "F5_502",
      "name": "502",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "503",
      "node": "F5_503",
      "name": "503",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "506",
      "node": "F5_506",
      "name": "506",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 101.25,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "507",
      "node": "F5_507",
      "name": "507",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "509",
      "node": "F5_509",
      "name": "509",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 135.0,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "510",
      "node": "F5_510",
      "name": "510",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "511",
      "node": "F5_511",
      "name": "511",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 168.75,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "513",
      "node": "F5_513",
      "name": "513",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 185.62,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "514",
      "node": "F5_514",
      "name": "514",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 202.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "516",
      "node": "F5_516",
      "name": "516",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 219.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "517",
      "node": "F5_517",
      "name": "517",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 236.25,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "520",
      "node": "F5_520",
      "name": "520",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 253.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "521",
      "node": "F5_521",
      "name": "521",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 270.0,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "601",
      "node": "F6_601",
      "name": "601",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "602",
      "node": "F6_602",
      "name": "602",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "603",
      "node": "F6_603",
      "name": "603",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 168.75,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "605",
      "node": "F6_605",
      "name": "605",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 185.62,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "606",
      "node": "F6_606",
      "name": "606",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 202.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "608",
      "node": "F6_608",
      "name": "608",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 219.38,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "609",
      "node": "F6_609",
      "name": "609",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 236.25,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "612",
      "node": "F6_612",
      "name": "612",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 253.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "613",
      "node": "F6_613",
      "name": "613",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 270.0,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "701",
      "node": "F7_701",
      "name": "701",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 202.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "703",
      "node": "F7_703",
      "name": "703",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 236.25,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "706",
      "node": "F7_706",
      "name": "706",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 253.12,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "707",
      "node": "F7_707",
      "name": "707",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 270.0,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; z-estimated"
    },
    {
      "id": "442",
      "node": "N4_442",
      "name": "442",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 60.0,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "443",
      "node": "N4_443",
      "name": "443",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 75.6,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "437",
      "node": "N4_437",
      "name": "437",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 91.2,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "434",
      "node": "N4_434",
      "name": "434",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 106.8,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "433",
      "node": "N4_433",
      "name": "433",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 122.4,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "538",
      "node": "N5_538",
      "name": "538",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 60.0,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "537",
      "node": "N5_537",
      "name": "537",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 75.6,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "532",
      "node": "N5_532",
      "name": "532",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 91.2,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "529",
      "node": "N5_529",
      "name": "529",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 106.8,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "528",
      "node": "N5_528",
      "name": "528",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 122.4,
      "z": -54.5,
      "side": "N",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x/z-estimated"
    },
    {
      "id": "321",
      "node": "F3_321",
      "name": "321",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 199.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x-estimated"
    },
    {
      "id": "324",
      "node": "F3_324",
      "name": "324",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 205.5,
      "z": 8.0,
      "side": "S",
      "type": "classroom",
      "aliases": [],
      "source": "floorplan",
      "confidence": "room-number-confirmed; x-estimated"
    }
  ],
  "nodes": [
    {
      "id": "F1_101",
      "name": "101",
      "label": "101",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 16.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "101"
    },
    {
      "id": "F1_105",
      "name": "105",
      "label": "105",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 50.62,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "105"
    },
    {
      "id": "F1_106",
      "name": "106",
      "label": "106",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "106"
    },
    {
      "id": "F1_107",
      "name": "107",
      "label": "107",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "107"
    },
    {
      "id": "F2_201",
      "name": "201",
      "label": "201",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 16.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "201"
    },
    {
      "id": "F2_203",
      "name": "203",
      "label": "203",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 33.75,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "203"
    },
    {
      "id": "F2_206",
      "name": "206",
      "label": "206",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 50.62,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "206"
    },
    {
      "id": "F2_207",
      "name": "207",
      "label": "207",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "207"
    },
    {
      "id": "F2_208",
      "name": "208",
      "label": "208",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "208"
    },
    {
      "id": "F2_211",
      "name": "211",
      "label": "211",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 101.25,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "211"
    },
    {
      "id": "F2_215",
      "name": "215",
      "label": "215",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "215"
    },
    {
      "id": "F2_216",
      "name": "216",
      "label": "216",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 135.0,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "216"
    },
    {
      "id": "F2_217",
      "name": "217",
      "label": "217",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "217"
    },
    {
      "id": "F3_301",
      "name": "301",
      "label": "301",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 16.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "301"
    },
    {
      "id": "F3_303",
      "name": "303",
      "label": "303",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 33.75,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "303"
    },
    {
      "id": "F3_306",
      "name": "306",
      "label": "306",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 50.62,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "306"
    },
    {
      "id": "F3_307",
      "name": "307",
      "label": "307",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "307"
    },
    {
      "id": "F3_308",
      "name": "308",
      "label": "308",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "308"
    },
    {
      "id": "F3_311",
      "name": "311",
      "label": "311",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 101.25,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "311"
    },
    {
      "id": "F3_312",
      "name": "312",
      "label": "312",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "312"
    },
    {
      "id": "F3_314",
      "name": "314",
      "label": "314",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 135.0,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "314"
    },
    {
      "id": "F3_315",
      "name": "315",
      "label": "315",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "315"
    },
    {
      "id": "F3_316",
      "name": "316",
      "label": "316",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 168.75,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "316"
    },
    {
      "id": "F3_318",
      "name": "318",
      "label": "318",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 185.62,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "318"
    },
    {
      "id": "F3_320",
      "name": "320",
      "label": "320",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 219.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "320"
    },
    {
      "id": "F4_401",
      "name": "401",
      "label": "401",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 16.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "401"
    },
    {
      "id": "F4_403",
      "name": "403",
      "label": "403",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 33.75,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "403"
    },
    {
      "id": "F4_406",
      "name": "406",
      "label": "406",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 50.62,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "406"
    },
    {
      "id": "F4_407",
      "name": "407",
      "label": "407",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "407"
    },
    {
      "id": "F4_408",
      "name": "408",
      "label": "408",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "408"
    },
    {
      "id": "F4_411",
      "name": "411",
      "label": "411",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 101.25,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "411"
    },
    {
      "id": "F4_412",
      "name": "412",
      "label": "412",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "412"
    },
    {
      "id": "F4_414",
      "name": "414",
      "label": "414",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 135.0,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "414"
    },
    {
      "id": "F4_415",
      "name": "415",
      "label": "415",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "415"
    },
    {
      "id": "F4_416",
      "name": "416",
      "label": "416",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 168.75,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "416"
    },
    {
      "id": "F4_418",
      "name": "418",
      "label": "418",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 185.62,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "418"
    },
    {
      "id": "F4_419",
      "name": "419",
      "label": "419",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 202.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "419"
    },
    {
      "id": "F4_421",
      "name": "421",
      "label": "421",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 219.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "421"
    },
    {
      "id": "F4_422",
      "name": "422",
      "label": "422",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 236.25,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "422"
    },
    {
      "id": "F4_425",
      "name": "425",
      "label": "425",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 253.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "425"
    },
    {
      "id": "F4_426",
      "name": "426",
      "label": "426",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 270.0,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "426"
    },
    {
      "id": "F5_501",
      "name": "501",
      "label": "501",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 33.75,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "501"
    },
    {
      "id": "F5_502",
      "name": "502",
      "label": "502",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 67.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "502"
    },
    {
      "id": "F5_503",
      "name": "503",
      "label": "503",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 84.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "503"
    },
    {
      "id": "F5_506",
      "name": "506",
      "label": "506",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 101.25,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "506"
    },
    {
      "id": "F5_507",
      "name": "507",
      "label": "507",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "507"
    },
    {
      "id": "F5_509",
      "name": "509",
      "label": "509",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 135.0,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "509"
    },
    {
      "id": "F5_510",
      "name": "510",
      "label": "510",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "510"
    },
    {
      "id": "F5_511",
      "name": "511",
      "label": "511",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 168.75,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "511"
    },
    {
      "id": "F5_513",
      "name": "513",
      "label": "513",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 185.62,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "513"
    },
    {
      "id": "F5_514",
      "name": "514",
      "label": "514",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 202.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "514"
    },
    {
      "id": "F5_516",
      "name": "516",
      "label": "516",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 219.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "516"
    },
    {
      "id": "F5_517",
      "name": "517",
      "label": "517",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 236.25,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "517"
    },
    {
      "id": "F5_520",
      "name": "520",
      "label": "520",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 253.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "520"
    },
    {
      "id": "F5_521",
      "name": "521",
      "label": "521",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 270.0,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "521"
    },
    {
      "id": "F6_601",
      "name": "601",
      "label": "601",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 118.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "601"
    },
    {
      "id": "F6_602",
      "name": "602",
      "label": "602",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 151.88,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "602"
    },
    {
      "id": "F6_603",
      "name": "603",
      "label": "603",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 168.75,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "603"
    },
    {
      "id": "F6_605",
      "name": "605",
      "label": "605",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 185.62,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "605"
    },
    {
      "id": "F6_606",
      "name": "606",
      "label": "606",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 202.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "606"
    },
    {
      "id": "F6_608",
      "name": "608",
      "label": "608",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 219.38,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "608"
    },
    {
      "id": "F6_609",
      "name": "609",
      "label": "609",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 236.25,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "609"
    },
    {
      "id": "F6_612",
      "name": "612",
      "label": "612",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 253.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "612"
    },
    {
      "id": "F6_613",
      "name": "613",
      "label": "613",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 270.0,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "613"
    },
    {
      "id": "F7_701",
      "name": "701",
      "label": "701",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 202.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "701"
    },
    {
      "id": "F7_703",
      "name": "703",
      "label": "703",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 236.25,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "703"
    },
    {
      "id": "F7_706",
      "name": "706",
      "label": "706",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 253.12,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "706"
    },
    {
      "id": "F7_707",
      "name": "707",
      "label": "707",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 270.0,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "707"
    },
    {
      "id": "N4_442",
      "name": "442",
      "label": "442",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 60.0,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "442"
    },
    {
      "id": "N4_443",
      "name": "443",
      "label": "443",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 75.6,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "443"
    },
    {
      "id": "N4_437",
      "name": "437",
      "label": "437",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 91.2,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "437"
    },
    {
      "id": "N4_434",
      "name": "434",
      "label": "434",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 106.8,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "434"
    },
    {
      "id": "N4_433",
      "name": "433",
      "label": "433",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 122.4,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "433"
    },
    {
      "id": "N5_538",
      "name": "538",
      "label": "538",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 60.0,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "538"
    },
    {
      "id": "N5_537",
      "name": "537",
      "label": "537",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 75.6,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "537"
    },
    {
      "id": "N5_532",
      "name": "532",
      "label": "532",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 91.2,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "532"
    },
    {
      "id": "N5_529",
      "name": "529",
      "label": "529",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 106.8,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "529"
    },
    {
      "id": "N5_528",
      "name": "528",
      "label": "528",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 122.4,
      "z": -54.5,
      "side": "N",
      "type": "room",
      "room": "528"
    },
    {
      "id": "C_F1_0",
      "name": "1层走廊0",
      "label": "C_F1_0",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 0.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L01_F1",
      "name": "|01",
      "label": "|01",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F1_1",
      "name": "1层走廊1",
      "label": "C_F1_1",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 16.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F1_2",
      "name": "1层走廊2",
      "label": "C_F1_2",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 33.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "F1_10x",
      "name": "10x",
      "label": "10x",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 33.75,
      "z": -8.0,
      "type": "void"
    },
    {
      "id": "C_F1_3",
      "name": "1层走廊3",
      "label": "C_F1_3",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 50.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F1_4",
      "name": "1层走廊4",
      "label": "C_F1_4",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 67.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F1_5",
      "name": "1层走廊5",
      "label": "C_F1_5",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 84.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_0",
      "name": "2层走廊0",
      "label": "C_F2_0",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 0.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L02_F2",
      "name": "|02",
      "label": "|02",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F2_1",
      "name": "2层走廊1",
      "label": "C_F2_1",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 16.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_2",
      "name": "2层走廊2",
      "label": "C_F2_2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 33.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_3",
      "name": "2层走廊3",
      "label": "C_F2_3",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 50.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_4",
      "name": "2层走廊4",
      "label": "C_F2_4",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 67.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_5",
      "name": "2层走廊5",
      "label": "C_F2_5",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 84.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_6",
      "name": "2层走廊6",
      "label": "C_F2_6",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 101.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_7",
      "name": "2层走廊7",
      "label": "C_F2_7",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 118.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_8",
      "name": "2层走廊8",
      "label": "C_F2_8",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 135.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F2_9",
      "name": "2层走廊9",
      "label": "C_F2_9",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 151.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_0",
      "name": "3层走廊0",
      "label": "C_F3_0",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 0.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L03_F3",
      "name": "|03",
      "label": "|03",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F3_1",
      "name": "3层走廊1",
      "label": "C_F3_1",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 16.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_2",
      "name": "3层走廊2",
      "label": "C_F3_2",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 33.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_3",
      "name": "3层走廊3",
      "label": "C_F3_3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 50.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_4",
      "name": "3层走廊4",
      "label": "C_F3_4",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 67.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_5",
      "name": "3层走廊5",
      "label": "C_F3_5",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 84.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_6",
      "name": "3层走廊6",
      "label": "C_F3_6",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 101.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_7",
      "name": "3层走廊7",
      "label": "C_F3_7",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 118.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_8",
      "name": "3层走廊8",
      "label": "C_F3_8",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 135.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_9",
      "name": "3层走廊9",
      "label": "C_F3_9",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 151.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_10",
      "name": "3层走廊10",
      "label": "C_F3_10",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 168.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_11",
      "name": "3层走廊11",
      "label": "C_F3_11",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 185.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F3_12",
      "name": "3层走廊12",
      "label": "C_F3_12",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 202.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "F3_31x",
      "name": "31x",
      "label": "31x",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 202.5,
      "z": -8.0,
      "type": "void"
    },
    {
      "id": "C_F3_13",
      "name": "3层走廊13",
      "label": "C_F3_13",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 219.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_0",
      "name": "4层走廊0",
      "label": "C_F4_0",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 0.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L04_F4",
      "name": "|04",
      "label": "|04",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F4_1",
      "name": "4层走廊1",
      "label": "C_F4_1",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 16.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_2",
      "name": "4层走廊2",
      "label": "C_F4_2",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 33.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_3",
      "name": "4层走廊3",
      "label": "C_F4_3",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 50.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_4",
      "name": "4层走廊4",
      "label": "C_F4_4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 67.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_5",
      "name": "4层走廊5",
      "label": "C_F4_5",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 84.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_6",
      "name": "4层走廊6",
      "label": "C_F4_6",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 101.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_7",
      "name": "4层走廊7",
      "label": "C_F4_7",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 118.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_8",
      "name": "4层走廊8",
      "label": "C_F4_8",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 135.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_9",
      "name": "4层走廊9",
      "label": "C_F4_9",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 151.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_10",
      "name": "4层走廊10",
      "label": "C_F4_10",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 168.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_11",
      "name": "4层走廊11",
      "label": "C_F4_11",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 185.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_12",
      "name": "4层走廊12",
      "label": "C_F4_12",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 202.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_13",
      "name": "4层走廊13",
      "label": "C_F4_13",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 219.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_14",
      "name": "4层走廊14",
      "label": "C_F4_14",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 236.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_15",
      "name": "4层走廊15",
      "label": "C_F4_15",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 253.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F4_16",
      "name": "4层走廊16",
      "label": "C_F4_16",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 270.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_0",
      "name": "5层走廊0",
      "label": "C_F5_0",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 0.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L05_F5",
      "name": "|05",
      "label": "|05",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F5_1",
      "name": "5层走廊1",
      "label": "C_F5_1",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 16.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "F5_50x",
      "name": "50x",
      "label": "50x",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 16.88,
      "z": -8.0,
      "type": "void"
    },
    {
      "id": "C_F5_2",
      "name": "5层走廊2",
      "label": "C_F5_2",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 33.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_3",
      "name": "5层走廊3",
      "label": "C_F5_3",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 50.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L15_F5",
      "name": "|15",
      "label": "|15",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 50.62,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F5_4",
      "name": "5层走廊4",
      "label": "C_F5_4",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 67.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_5",
      "name": "5层走廊5",
      "label": "C_F5_5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 84.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_6",
      "name": "5层走廊6",
      "label": "C_F5_6",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 101.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_7",
      "name": "5层走廊7",
      "label": "C_F5_7",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 118.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_8",
      "name": "5层走廊8",
      "label": "C_F5_8",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 135.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_9",
      "name": "5层走廊9",
      "label": "C_F5_9",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 151.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_10",
      "name": "5层走廊10",
      "label": "C_F5_10",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 168.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_11",
      "name": "5层走廊11",
      "label": "C_F5_11",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 185.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_12",
      "name": "5层走廊12",
      "label": "C_F5_12",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 202.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_13",
      "name": "5层走廊13",
      "label": "C_F5_13",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 219.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_14",
      "name": "5层走廊14",
      "label": "C_F5_14",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 236.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_15",
      "name": "5层走廊15",
      "label": "C_F5_15",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 253.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F5_16",
      "name": "5层走廊16",
      "label": "C_F5_16",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 270.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_6",
      "name": "6层走廊6",
      "label": "C_F6_6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 101.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L36_F6",
      "name": "|36",
      "label": "|36",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 101.25,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F6_7",
      "name": "6层走廊7",
      "label": "C_F6_7",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 118.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_8",
      "name": "6层走廊8",
      "label": "C_F6_8",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 135.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "F6_60x",
      "name": "60x",
      "label": "60x",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 135.0,
      "z": -8.0,
      "type": "void"
    },
    {
      "id": "C_F6_9",
      "name": "6层走廊9",
      "label": "C_F6_9",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 151.88,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_10",
      "name": "6层走廊10",
      "label": "C_F6_10",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 168.75,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_11",
      "name": "6层走廊11",
      "label": "C_F6_11",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 185.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_12",
      "name": "6层走廊12",
      "label": "C_F6_12",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 202.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_13",
      "name": "6层走廊13",
      "label": "C_F6_13",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 219.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_14",
      "name": "6层走廊14",
      "label": "C_F6_14",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 236.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_15",
      "name": "6层走廊15",
      "label": "C_F6_15",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 253.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F6_16",
      "name": "6层走廊16",
      "label": "C_F6_16",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 270.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F7_11",
      "name": "7层走廊11",
      "label": "C_F7_11",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 185.62,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L57_F7",
      "name": "|57",
      "label": "|57",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 185.62,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F7_12",
      "name": "7层走廊12",
      "label": "C_F7_12",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 202.5,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F7_13",
      "name": "7层走廊13",
      "label": "C_F7_13",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 219.38,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "L67_F7",
      "name": "|67",
      "label": "|67",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 219.38,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "C_F7_14",
      "name": "7层走廊14",
      "label": "C_F7_14",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 236.25,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F7_15",
      "name": "7层走廊15",
      "label": "C_F7_15",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 253.12,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "C_F7_16",
      "name": "7层走廊16",
      "label": "C_F7_16",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 270.0,
      "z": 0.0,
      "type": "corridor"
    },
    {
      "id": "F3_321",
      "name": "321",
      "label": "321",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 199.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "321"
    },
    {
      "id": "F3_324",
      "name": "324",
      "label": "324",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 205.5,
      "z": 8.0,
      "side": "S",
      "type": "room",
      "room": "324"
    },
    {
      "id": "C_N4_0",
      "name": "北4走廊0",
      "label": "C_N4_0",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 60.0,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N4_1",
      "name": "北4走廊1",
      "label": "C_N4_1",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 75.6,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N4_2",
      "name": "北4走廊2",
      "label": "C_N4_2",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 91.2,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N4_3",
      "name": "北4走廊3",
      "label": "C_N4_3",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 106.8,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N4_4",
      "name": "北4走廊4",
      "label": "C_N4_4",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 122.4,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N5_0",
      "name": "北5走廊0",
      "label": "C_N5_0",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 60.0,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N5_1",
      "name": "北5走廊1",
      "label": "C_N5_1",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 75.6,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N5_2",
      "name": "北5走廊2",
      "label": "C_N5_2",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 91.2,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N5_3",
      "name": "北5走廊3",
      "label": "C_N5_3",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 106.8,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "C_N5_4",
      "name": "北5走廊4",
      "label": "C_N5_4",
      "floor": "N5",
      "level": 5,
      "wing": "N",
      "x": 122.4,
      "z": -50.0,
      "type": "corridor"
    },
    {
      "id": "ENT1",
      "name": "东侧南入口1",
      "label": "st1",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 50.62,
      "z": 12.0,
      "type": "entrance"
    },
    {
      "id": "ENT2",
      "name": "东侧北入口2",
      "label": "st2",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 84.38,
      "z": 12.0,
      "type": "entrance"
    },
    {
      "id": "ENT3",
      "name": "东侧南入口4",
      "label": "st3",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 101.25,
      "z": 12.0,
      "type": "entrance"
    },
    {
      "id": "ENT4",
      "name": "东侧东入口7",
      "label": "st4",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 135.0,
      "z": 12.0,
      "type": "entrance"
    },
    {
      "id": "ENT5",
      "name": "西侧南入口9",
      "label": "st5",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 185.62,
      "z": 12.0,
      "type": "entrance"
    },
    {
      "id": "ENT6",
      "name": "西侧西入口14",
      "label": "st6",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 219.38,
      "z": 12.0,
      "type": "entrance"
    },
    {
      "id": "ENT_NE",
      "name": "北楼东入口6",
      "label": "ENT_NE",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 75.6,
      "z": -42.0,
      "type": "entrance"
    },
    {
      "id": "ENT_NW",
      "name": "北楼西入口12",
      "label": "ENT_NW",
      "floor": "N4",
      "level": 4,
      "wing": "N",
      "x": 106.8,
      "z": -42.0,
      "type": "entrance"
    },
    {
      "id": "ELW_F1",
      "name": "西电梯",
      "label": "ELW_F1",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELW_F2",
      "name": "西电梯",
      "label": "ELW_F2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELW_F3",
      "name": "西电梯",
      "label": "ELW_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELW_F4",
      "name": "西电梯",
      "label": "ELW_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELW_F5",
      "name": "西电梯",
      "label": "ELW_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELW_F6",
      "name": "西电梯",
      "label": "ELW_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELW_F7",
      "name": "西电梯",
      "label": "ELW_F7",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELE_F1",
      "name": "东电梯",
      "label": "ELE_F1",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 270.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELE_F2",
      "name": "东电梯",
      "label": "ELE_F2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 270.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELE_F3",
      "name": "东电梯",
      "label": "ELE_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 270.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELE_F4",
      "name": "东电梯",
      "label": "ELE_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 270.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELE_F5",
      "name": "东电梯",
      "label": "ELE_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 270.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "ELE_F6",
      "name": "东电梯",
      "label": "ELE_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 270.0,
      "z": -8.0,
      "type": "elevator"
    },
    {
      "id": "K0_F1",
      "name": "楼梯1",
      "label": "K0_F1",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K0_F2",
      "name": "楼梯1",
      "label": "K0_F2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K0_F3",
      "name": "楼梯1",
      "label": "K0_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K0_F4",
      "name": "楼梯1",
      "label": "K0_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K0_F5",
      "name": "楼梯1",
      "label": "K0_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K1_F1",
      "name": "楼梯2",
      "label": "K1_F1",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 50.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K1_F2",
      "name": "楼梯2",
      "label": "K1_F2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 50.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K1_F3",
      "name": "楼梯2",
      "label": "K1_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 50.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K1_F4",
      "name": "楼梯2",
      "label": "K1_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 50.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K1_F5",
      "name": "楼梯2",
      "label": "K1_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 50.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K2_F1",
      "name": "楼梯3",
      "label": "K2_F1",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 84.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K2_F2",
      "name": "楼梯3",
      "label": "K2_F2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 84.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K2_F3",
      "name": "楼梯3",
      "label": "K2_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 84.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K2_F4",
      "name": "楼梯3",
      "label": "K2_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 84.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K2_F5",
      "name": "楼梯3",
      "label": "K2_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 84.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K3_F2",
      "name": "楼梯4",
      "label": "K3_F2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 101.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K3_F3",
      "name": "楼梯4",
      "label": "K3_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 101.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K3_F4",
      "name": "楼梯4",
      "label": "K3_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 101.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K3_F5",
      "name": "楼梯4",
      "label": "K3_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 101.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K3_F6",
      "name": "楼梯4",
      "label": "K3_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 101.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K4_F3",
      "name": "楼梯5",
      "label": "K4_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 118.12,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K4_F4",
      "name": "楼梯5",
      "label": "K4_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 118.12,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K4_F5",
      "name": "楼梯5",
      "label": "K4_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 118.12,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K4_F6",
      "name": "楼梯5",
      "label": "K4_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 118.12,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K5_F3",
      "name": "楼梯6",
      "label": "K5_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 185.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K5_F4",
      "name": "楼梯6",
      "label": "K5_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 185.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K5_F5",
      "name": "楼梯6",
      "label": "K5_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 185.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K5_F6",
      "name": "楼梯6",
      "label": "K5_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 185.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K5_F7",
      "name": "楼梯6",
      "label": "K5_F7",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 185.62,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K6_F3",
      "name": "楼梯7",
      "label": "K6_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 219.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K6_F4",
      "name": "楼梯7",
      "label": "K6_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 219.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K6_F5",
      "name": "楼梯7",
      "label": "K6_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 219.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K6_F6",
      "name": "楼梯7",
      "label": "K6_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 219.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K6_F7",
      "name": "楼梯7",
      "label": "K6_F7",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 219.38,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K7_F2",
      "name": "楼梯8",
      "label": "K7_F2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 135.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K7_F3",
      "name": "楼梯8",
      "label": "K7_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 135.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K7_F4",
      "name": "楼梯8",
      "label": "K7_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 135.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K7_F5",
      "name": "楼梯8",
      "label": "K7_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 135.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K7_F6",
      "name": "楼梯8",
      "label": "K7_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 135.0,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K8_F2",
      "name": "楼梯9",
      "label": "K8_F2",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 151.88,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K8_F3",
      "name": "楼梯9",
      "label": "K8_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 151.88,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K8_F4",
      "name": "楼梯9",
      "label": "K8_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 151.88,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K8_F5",
      "name": "楼梯9",
      "label": "K8_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 151.88,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K8_F6",
      "name": "楼梯9",
      "label": "K8_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 151.88,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K9_F3",
      "name": "楼梯10",
      "label": "K9_F3",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 168.75,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K9_F4",
      "name": "楼梯10",
      "label": "K9_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 168.75,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K9_F5",
      "name": "楼梯10",
      "label": "K9_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 168.75,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K9_F6",
      "name": "楼梯10",
      "label": "K9_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 168.75,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K10_F4",
      "name": "楼梯11",
      "label": "K10_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 236.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K10_F5",
      "name": "楼梯11",
      "label": "K10_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 236.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K10_F6",
      "name": "楼梯11",
      "label": "K10_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 236.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K10_F7",
      "name": "楼梯11",
      "label": "K10_F7",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 236.25,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K11_F4",
      "name": "楼梯12",
      "label": "K11_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 253.12,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K11_F5",
      "name": "楼梯12",
      "label": "K11_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 253.12,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K11_F6",
      "name": "楼梯12",
      "label": "K11_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 253.12,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K11_F7",
      "name": "楼梯12",
      "label": "K11_F7",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 253.12,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K12_F4",
      "name": "楼梯13",
      "label": "K12_F4",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 265.78,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K12_F5",
      "name": "楼梯13",
      "label": "K12_F5",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 265.78,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K12_F6",
      "name": "楼梯13",
      "label": "K12_F6",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 265.78,
      "z": -8.0,
      "type": "stair_core"
    },
    {
      "id": "K12_F7",
      "name": "楼梯13",
      "label": "K12_F7",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 265.78,
      "z": -8.0,
      "type": "stair_core"
    }
  ],
  "edges": [
    {
      "from": "C_F1_0",
      "to": "C_F1_1",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F1_1",
      "to": "C_F1_2",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F1_2",
      "to": "C_F1_3",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F1_3",
      "to": "C_F1_4",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F1_4",
      "to": "C_F1_5",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_0",
      "to": "C_F2_1",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_1",
      "to": "C_F2_2",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_2",
      "to": "C_F2_3",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_3",
      "to": "C_F2_4",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_4",
      "to": "C_F2_5",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_5",
      "to": "C_F2_6",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_6",
      "to": "C_F2_7",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_7",
      "to": "C_F2_8",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F2_8",
      "to": "C_F2_9",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_0",
      "to": "C_F3_1",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_1",
      "to": "C_F3_2",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_2",
      "to": "C_F3_3",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_3",
      "to": "C_F3_4",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_4",
      "to": "C_F3_5",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_5",
      "to": "C_F3_6",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_6",
      "to": "C_F3_7",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_7",
      "to": "C_F3_8",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_8",
      "to": "C_F3_9",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_9",
      "to": "C_F3_10",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_10",
      "to": "C_F3_11",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_11",
      "to": "C_F3_12",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F3_12",
      "to": "C_F3_13",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_0",
      "to": "C_F4_1",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_1",
      "to": "C_F4_2",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_2",
      "to": "C_F4_3",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_3",
      "to": "C_F4_4",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_4",
      "to": "C_F4_5",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_5",
      "to": "C_F4_6",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_6",
      "to": "C_F4_7",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_7",
      "to": "C_F4_8",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_8",
      "to": "C_F4_9",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_9",
      "to": "C_F4_10",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_10",
      "to": "C_F4_11",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_11",
      "to": "C_F4_12",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_12",
      "to": "C_F4_13",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_13",
      "to": "C_F4_14",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_14",
      "to": "C_F4_15",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F4_15",
      "to": "C_F4_16",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_0",
      "to": "C_F5_1",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_1",
      "to": "C_F5_2",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_2",
      "to": "C_F5_3",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_3",
      "to": "C_F5_4",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_4",
      "to": "C_F5_5",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_5",
      "to": "C_F5_6",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_6",
      "to": "C_F5_7",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_7",
      "to": "C_F5_8",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_8",
      "to": "C_F5_9",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_9",
      "to": "C_F5_10",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_10",
      "to": "C_F5_11",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_11",
      "to": "C_F5_12",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_12",
      "to": "C_F5_13",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_13",
      "to": "C_F5_14",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_14",
      "to": "C_F5_15",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F5_15",
      "to": "C_F5_16",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_6",
      "to": "C_F6_7",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_7",
      "to": "C_F6_8",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_8",
      "to": "C_F6_9",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_9",
      "to": "C_F6_10",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_10",
      "to": "C_F6_11",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_11",
      "to": "C_F6_12",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_12",
      "to": "C_F6_13",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_13",
      "to": "C_F6_14",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_14",
      "to": "C_F6_15",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F6_15",
      "to": "C_F6_16",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F7_11",
      "to": "C_F7_12",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F7_12",
      "to": "C_F7_13",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F7_13",
      "to": "C_F7_14",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F7_14",
      "to": "C_F7_15",
      "distance": 16.87,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_F7_15",
      "to": "C_F7_16",
      "distance": 16.88,
      "time": 13.5,
      "type": "walk"
    },
    {
      "from": "C_N4_0",
      "to": "C_N4_1",
      "distance": 15.6,
      "time": 12.48,
      "type": "walk"
    },
    {
      "from": "C_N4_1",
      "to": "C_N4_2",
      "distance": 15.6,
      "time": 12.48,
      "type": "walk"
    },
    {
      "from": "C_N4_2",
      "to": "C_N4_3",
      "distance": 15.6,
      "time": 12.48,
      "type": "walk"
    },
    {
      "from": "C_N4_3",
      "to": "C_N4_4",
      "distance": 15.6,
      "time": 12.48,
      "type": "walk"
    },
    {
      "from": "C_N5_0",
      "to": "C_N5_1",
      "distance": 15.6,
      "time": 12.48,
      "type": "walk"
    },
    {
      "from": "C_N5_1",
      "to": "C_N5_2",
      "distance": 15.6,
      "time": 12.48,
      "type": "walk"
    },
    {
      "from": "C_N5_2",
      "to": "C_N5_3",
      "distance": 15.6,
      "time": 12.48,
      "type": "walk"
    },
    {
      "from": "C_N5_3",
      "to": "C_N5_4",
      "distance": 15.6,
      "time": 12.48,
      "type": "walk"
    },
    {
      "from": "L01_F1",
      "to": "C_F1_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F1_101",
      "to": "C_F1_1",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F1_10x",
      "to": "C_F1_2",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F1_105",
      "to": "C_F1_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F1_106",
      "to": "C_F1_4",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F1_107",
      "to": "C_F1_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "L02_F2",
      "to": "C_F2_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F2_201",
      "to": "C_F2_1",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F2_203",
      "to": "C_F2_2",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F2_206",
      "to": "C_F2_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F2_207",
      "to": "C_F2_4",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F2_208",
      "to": "C_F2_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F2_211",
      "to": "C_F2_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F2_215",
      "to": "C_F2_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F2_216",
      "to": "C_F2_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F2_217",
      "to": "C_F2_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "L03_F3",
      "to": "C_F3_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F3_301",
      "to": "C_F3_1",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_303",
      "to": "C_F3_2",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_306",
      "to": "C_F3_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_307",
      "to": "C_F3_4",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_308",
      "to": "C_F3_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_311",
      "to": "C_F3_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_312",
      "to": "C_F3_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_314",
      "to": "C_F3_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_315",
      "to": "C_F3_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_316",
      "to": "C_F3_10",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_318",
      "to": "C_F3_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F3_31x",
      "to": "C_F3_12",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F3_320",
      "to": "C_F3_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "L04_F4",
      "to": "C_F4_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F4_401",
      "to": "C_F4_1",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_403",
      "to": "C_F4_2",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_406",
      "to": "C_F4_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_407",
      "to": "C_F4_4",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_408",
      "to": "C_F4_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_411",
      "to": "C_F4_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_412",
      "to": "C_F4_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_414",
      "to": "C_F4_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_415",
      "to": "C_F4_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_416",
      "to": "C_F4_10",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_418",
      "to": "C_F4_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_419",
      "to": "C_F4_12",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_421",
      "to": "C_F4_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_422",
      "to": "C_F4_14",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_425",
      "to": "C_F4_15",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F4_426",
      "to": "C_F4_16",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "L05_F5",
      "to": "C_F5_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F5_50x",
      "to": "C_F5_1",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F5_501",
      "to": "C_F5_2",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "L15_F5",
      "to": "C_F5_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F5_502",
      "to": "C_F5_4",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_503",
      "to": "C_F5_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_506",
      "to": "C_F5_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_507",
      "to": "C_F5_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_509",
      "to": "C_F5_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_510",
      "to": "C_F5_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_511",
      "to": "C_F5_10",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_513",
      "to": "C_F5_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_514",
      "to": "C_F5_12",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_516",
      "to": "C_F5_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_517",
      "to": "C_F5_14",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_520",
      "to": "C_F5_15",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F5_521",
      "to": "C_F5_16",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "L36_F6",
      "to": "C_F6_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F6_601",
      "to": "C_F6_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F6_60x",
      "to": "C_F6_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F6_602",
      "to": "C_F6_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F6_603",
      "to": "C_F6_10",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F6_605",
      "to": "C_F6_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F6_606",
      "to": "C_F6_12",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F6_608",
      "to": "C_F6_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F6_609",
      "to": "C_F6_14",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F6_612",
      "to": "C_F6_15",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F6_613",
      "to": "C_F6_16",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "L57_F7",
      "to": "C_F7_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F7_701",
      "to": "C_F7_12",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "L67_F7",
      "to": "C_F7_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "service"
    },
    {
      "from": "F7_703",
      "to": "C_F7_14",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F7_706",
      "to": "C_F7_15",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "F7_707",
      "to": "C_F7_16",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "N4_442",
      "to": "C_N4_0",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N4_443",
      "to": "C_N4_1",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N4_437",
      "to": "C_N4_2",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N4_434",
      "to": "C_N4_3",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N4_433",
      "to": "C_N4_4",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N5_538",
      "to": "C_N5_0",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N5_537",
      "to": "C_N5_1",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N5_532",
      "to": "C_N5_2",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N5_529",
      "to": "C_N5_3",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "N5_528",
      "to": "C_N5_4",
      "distance": 4.5,
      "time": 3.6,
      "type": "door"
    },
    {
      "from": "F3_321",
      "to": "C_F3_12",
      "distance": 11.0,
      "time": 8.8,
      "type": "door"
    },
    {
      "from": "F3_324",
      "to": "C_F3_12",
      "distance": 11.0,
      "time": 8.8,
      "type": "door"
    },
    {
      "from": "K0_F1",
      "to": "C_F1_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K0_F2",
      "to": "C_F2_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K0_F3",
      "to": "C_F3_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K0_F4",
      "to": "C_F4_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K0_F5",
      "to": "C_F5_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K0_F1",
      "to": "K0_F2",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K0_F2",
      "to": "K0_F3",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K0_F3",
      "to": "K0_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K0_F4",
      "to": "K0_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K1_F1",
      "to": "C_F1_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K1_F2",
      "to": "C_F2_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K1_F3",
      "to": "C_F3_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K1_F4",
      "to": "C_F4_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K1_F5",
      "to": "C_F5_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K1_F1",
      "to": "K1_F2",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K1_F2",
      "to": "K1_F3",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K1_F3",
      "to": "K1_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K1_F4",
      "to": "K1_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K2_F1",
      "to": "C_F1_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K2_F2",
      "to": "C_F2_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K2_F3",
      "to": "C_F3_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K2_F4",
      "to": "C_F4_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K2_F5",
      "to": "C_F5_5",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K2_F1",
      "to": "K2_F2",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K2_F2",
      "to": "K2_F3",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K2_F3",
      "to": "K2_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K2_F4",
      "to": "K2_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K3_F2",
      "to": "C_F2_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K3_F3",
      "to": "C_F3_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K3_F4",
      "to": "C_F4_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K3_F5",
      "to": "C_F5_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K3_F6",
      "to": "C_F6_6",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K3_F2",
      "to": "K3_F3",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K3_F3",
      "to": "K3_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K3_F4",
      "to": "K3_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K3_F5",
      "to": "K3_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K4_F3",
      "to": "C_F3_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K4_F4",
      "to": "C_F4_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K4_F5",
      "to": "C_F5_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K4_F6",
      "to": "C_F6_7",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K4_F3",
      "to": "K4_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K4_F4",
      "to": "K4_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K4_F5",
      "to": "K4_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K5_F3",
      "to": "C_F3_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K5_F4",
      "to": "C_F4_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K5_F5",
      "to": "C_F5_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K5_F6",
      "to": "C_F6_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K5_F7",
      "to": "C_F7_11",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K5_F3",
      "to": "K5_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K5_F4",
      "to": "K5_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K5_F5",
      "to": "K5_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K5_F6",
      "to": "K5_F7",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K6_F3",
      "to": "C_F3_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K6_F4",
      "to": "C_F4_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K6_F5",
      "to": "C_F5_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K6_F6",
      "to": "C_F6_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K6_F7",
      "to": "C_F7_13",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K6_F3",
      "to": "K6_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K6_F4",
      "to": "K6_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K6_F5",
      "to": "K6_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K6_F6",
      "to": "K6_F7",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K7_F2",
      "to": "C_F2_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K7_F3",
      "to": "C_F3_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K7_F4",
      "to": "C_F4_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K7_F5",
      "to": "C_F5_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K7_F6",
      "to": "C_F6_8",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K7_F2",
      "to": "K7_F3",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K7_F3",
      "to": "K7_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K7_F4",
      "to": "K7_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K7_F5",
      "to": "K7_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K8_F2",
      "to": "C_F2_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K8_F3",
      "to": "C_F3_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K8_F4",
      "to": "C_F4_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K8_F5",
      "to": "C_F5_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K8_F6",
      "to": "C_F6_9",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K8_F2",
      "to": "K8_F3",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K8_F3",
      "to": "K8_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K8_F4",
      "to": "K8_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K8_F5",
      "to": "K8_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K9_F3",
      "to": "C_F3_10",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K9_F4",
      "to": "C_F4_10",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K9_F5",
      "to": "C_F5_10",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K9_F6",
      "to": "C_F6_10",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K9_F3",
      "to": "K9_F4",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K9_F4",
      "to": "K9_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K9_F5",
      "to": "K9_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K10_F4",
      "to": "C_F4_14",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K10_F5",
      "to": "C_F5_14",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K10_F6",
      "to": "C_F6_14",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K10_F7",
      "to": "C_F7_14",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K10_F4",
      "to": "K10_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K10_F5",
      "to": "K10_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K10_F6",
      "to": "K10_F7",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K11_F4",
      "to": "C_F4_15",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K11_F5",
      "to": "C_F5_15",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K11_F6",
      "to": "C_F6_15",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K11_F7",
      "to": "C_F7_15",
      "distance": 8.0,
      "time": 6.4,
      "type": "door"
    },
    {
      "from": "K11_F4",
      "to": "K11_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K11_F5",
      "to": "K11_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K11_F6",
      "to": "K11_F7",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K12_F4",
      "to": "C_F4_16",
      "distance": 12.22,
      "time": 9.78,
      "type": "door"
    },
    {
      "from": "K12_F5",
      "to": "C_F5_16",
      "distance": 12.22,
      "time": 9.78,
      "type": "door"
    },
    {
      "from": "K12_F6",
      "to": "C_F6_16",
      "distance": 12.22,
      "time": 9.78,
      "type": "door"
    },
    {
      "from": "K12_F7",
      "to": "C_F7_16",
      "distance": 12.22,
      "time": 9.78,
      "type": "door"
    },
    {
      "from": "K12_F4",
      "to": "K12_F5",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K12_F5",
      "to": "K12_F6",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "K12_F6",
      "to": "K12_F7",
      "distance": 5.71,
      "time": 20,
      "type": "stairs"
    },
    {
      "from": "C_N4_1",
      "to": "C_N5_1",
      "distance": 5.71,
      "time": 20,
      "type": "ramp"
    },
    {
      "from": "C_N4_3",
      "to": "C_N5_3",
      "distance": 5.71,
      "time": 20,
      "type": "ramp"
    },
    {
      "from": "C_F4_5",
      "to": "C_N4_1",
      "distance": 10,
      "time": 20,
      "type": "passage"
    },
    {
      "from": "C_F4_7",
      "to": "C_N4_3",
      "distance": 10,
      "time": 20,
      "type": "passage"
    },
    {
      "from": "ENT1",
      "to": "C_F1_3",
      "distance": 12.0,
      "time": 9.6,
      "type": "entrance"
    },
    {
      "from": "ENT2",
      "to": "C_F1_5",
      "distance": 12.0,
      "time": 9.6,
      "type": "entrance"
    },
    {
      "from": "ENT3",
      "to": "C_F2_6",
      "distance": 12.0,
      "time": 9.6,
      "type": "entrance"
    },
    {
      "from": "ENT4",
      "to": "C_F3_8",
      "distance": 12.0,
      "time": 9.6,
      "type": "entrance"
    },
    {
      "from": "ENT5",
      "to": "C_F3_11",
      "distance": 12.0,
      "time": 9.6,
      "type": "entrance"
    },
    {
      "from": "ENT6",
      "to": "C_F3_13",
      "distance": 12.0,
      "time": 9.6,
      "type": "entrance"
    },
    {
      "from": "ENT_NE",
      "to": "C_N4_1",
      "distance": 8.0,
      "time": 6.4,
      "type": "entrance"
    },
    {
      "from": "ENT_NW",
      "to": "C_N4_3",
      "distance": 8.0,
      "time": 6.4,
      "type": "entrance"
    },
    {
      "from": "ELW_F1",
      "to": "ELW_F2",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELW_F2",
      "to": "ELW_F3",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELW_F3",
      "to": "ELW_F4",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELW_F4",
      "to": "ELW_F5",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELW_F5",
      "to": "ELW_F6",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELW_F6",
      "to": "ELW_F7",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELE_F1",
      "to": "ELE_F2",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELE_F2",
      "to": "ELE_F3",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELE_F3",
      "to": "ELE_F4",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELE_F4",
      "to": "ELE_F5",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELE_F5",
      "to": "ELE_F6",
      "distance": 5.71,
      "time": 12,
      "type": "elevator"
    },
    {
      "from": "ELW_F1",
      "to": "C_F1_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "walk"
    },
    {
      "from": "ELW_F2",
      "to": "C_F2_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "walk"
    },
    {
      "from": "ELW_F3",
      "to": "C_F3_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "walk"
    },
    {
      "from": "ELW_F4",
      "to": "C_F4_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "walk"
    },
    {
      "from": "ELW_F5",
      "to": "C_F5_0",
      "distance": 8.0,
      "time": 6.4,
      "type": "walk"
    },
    {
      "from": "ELW_F6",
      "to": "C_F6_6",
      "distance": 109.25,
      "time": 87.4,
      "type": "walk"
    },
    {
      "from": "ELW_F7",
      "to": "C_F7_11",
      "distance": 193.62,
      "time": 154.9,
      "type": "walk"
    },
    {
      "from": "ELE_F1",
      "to": "C_F1_5",
      "distance": 193.62,
      "time": 154.9,
      "type": "walk"
    },
    {
      "from": "ELE_F2",
      "to": "C_F2_9",
      "distance": 126.12,
      "time": 100.9,
      "type": "walk"
    },
    {
      "from": "ELE_F3",
      "to": "C_F3_13",
      "distance": 58.62,
      "time": 46.9,
      "type": "walk"
    },
    {
      "from": "ELE_F4",
      "to": "C_F4_16",
      "distance": 8.0,
      "time": 6.4,
      "type": "walk"
    },
    {
      "from": "ELE_F5",
      "to": "C_F5_16",
      "distance": 8.0,
      "time": 6.4,
      "type": "walk"
    },
    {
      "from": "ELE_F6",
      "to": "C_F6_16",
      "distance": 8.0,
      "time": 6.4,
      "type": "walk"
    }
  ],
  "cores": [
    {
      "id": "K0",
      "floor": "F1",
      "level": 1,
      "node": "K0_F1",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "K0",
      "floor": "F2",
      "level": 2,
      "node": "K0_F2",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "K0",
      "floor": "F3",
      "level": 3,
      "node": "K0_F3",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "K0",
      "floor": "F4",
      "level": 4,
      "node": "K0_F4",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "K0",
      "floor": "F5",
      "level": 5,
      "node": "K0_F5",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "K1",
      "floor": "F1",
      "level": 1,
      "node": "K1_F1",
      "x": 50.62,
      "z": -8.0
    },
    {
      "id": "K1",
      "floor": "F2",
      "level": 2,
      "node": "K1_F2",
      "x": 50.62,
      "z": -8.0
    },
    {
      "id": "K1",
      "floor": "F3",
      "level": 3,
      "node": "K1_F3",
      "x": 50.62,
      "z": -8.0
    },
    {
      "id": "K1",
      "floor": "F4",
      "level": 4,
      "node": "K1_F4",
      "x": 50.62,
      "z": -8.0
    },
    {
      "id": "K1",
      "floor": "F5",
      "level": 5,
      "node": "K1_F5",
      "x": 50.62,
      "z": -8.0
    },
    {
      "id": "K2",
      "floor": "F1",
      "level": 1,
      "node": "K2_F1",
      "x": 84.38,
      "z": -8.0
    },
    {
      "id": "K2",
      "floor": "F2",
      "level": 2,
      "node": "K2_F2",
      "x": 84.38,
      "z": -8.0
    },
    {
      "id": "K2",
      "floor": "F3",
      "level": 3,
      "node": "K2_F3",
      "x": 84.38,
      "z": -8.0
    },
    {
      "id": "K2",
      "floor": "F4",
      "level": 4,
      "node": "K2_F4",
      "x": 84.38,
      "z": -8.0
    },
    {
      "id": "K2",
      "floor": "F5",
      "level": 5,
      "node": "K2_F5",
      "x": 84.38,
      "z": -8.0
    },
    {
      "id": "K3",
      "floor": "F2",
      "level": 2,
      "node": "K3_F2",
      "x": 101.25,
      "z": -8.0
    },
    {
      "id": "K3",
      "floor": "F3",
      "level": 3,
      "node": "K3_F3",
      "x": 101.25,
      "z": -8.0
    },
    {
      "id": "K3",
      "floor": "F4",
      "level": 4,
      "node": "K3_F4",
      "x": 101.25,
      "z": -8.0
    },
    {
      "id": "K3",
      "floor": "F5",
      "level": 5,
      "node": "K3_F5",
      "x": 101.25,
      "z": -8.0
    },
    {
      "id": "K3",
      "floor": "F6",
      "level": 6,
      "node": "K3_F6",
      "x": 101.25,
      "z": -8.0
    },
    {
      "id": "K4",
      "floor": "F3",
      "level": 3,
      "node": "K4_F3",
      "x": 118.12,
      "z": -8.0
    },
    {
      "id": "K4",
      "floor": "F4",
      "level": 4,
      "node": "K4_F4",
      "x": 118.12,
      "z": -8.0
    },
    {
      "id": "K4",
      "floor": "F5",
      "level": 5,
      "node": "K4_F5",
      "x": 118.12,
      "z": -8.0
    },
    {
      "id": "K4",
      "floor": "F6",
      "level": 6,
      "node": "K4_F6",
      "x": 118.12,
      "z": -8.0
    },
    {
      "id": "K5",
      "floor": "F3",
      "level": 3,
      "node": "K5_F3",
      "x": 185.62,
      "z": -8.0
    },
    {
      "id": "K5",
      "floor": "F4",
      "level": 4,
      "node": "K5_F4",
      "x": 185.62,
      "z": -8.0
    },
    {
      "id": "K5",
      "floor": "F5",
      "level": 5,
      "node": "K5_F5",
      "x": 185.62,
      "z": -8.0
    },
    {
      "id": "K5",
      "floor": "F6",
      "level": 6,
      "node": "K5_F6",
      "x": 185.62,
      "z": -8.0
    },
    {
      "id": "K5",
      "floor": "F7",
      "level": 7,
      "node": "K5_F7",
      "x": 185.62,
      "z": -8.0
    },
    {
      "id": "K6",
      "floor": "F3",
      "level": 3,
      "node": "K6_F3",
      "x": 219.38,
      "z": -8.0
    },
    {
      "id": "K6",
      "floor": "F4",
      "level": 4,
      "node": "K6_F4",
      "x": 219.38,
      "z": -8.0
    },
    {
      "id": "K6",
      "floor": "F5",
      "level": 5,
      "node": "K6_F5",
      "x": 219.38,
      "z": -8.0
    },
    {
      "id": "K6",
      "floor": "F6",
      "level": 6,
      "node": "K6_F6",
      "x": 219.38,
      "z": -8.0
    },
    {
      "id": "K6",
      "floor": "F7",
      "level": 7,
      "node": "K6_F7",
      "x": 219.38,
      "z": -8.0
    },
    {
      "id": "K7",
      "floor": "F2",
      "level": 2,
      "node": "K7_F2",
      "x": 135.0,
      "z": -8.0
    },
    {
      "id": "K7",
      "floor": "F3",
      "level": 3,
      "node": "K7_F3",
      "x": 135.0,
      "z": -8.0
    },
    {
      "id": "K7",
      "floor": "F4",
      "level": 4,
      "node": "K7_F4",
      "x": 135.0,
      "z": -8.0
    },
    {
      "id": "K7",
      "floor": "F5",
      "level": 5,
      "node": "K7_F5",
      "x": 135.0,
      "z": -8.0
    },
    {
      "id": "K7",
      "floor": "F6",
      "level": 6,
      "node": "K7_F6",
      "x": 135.0,
      "z": -8.0
    },
    {
      "id": "K8",
      "floor": "F2",
      "level": 2,
      "node": "K8_F2",
      "x": 151.88,
      "z": -8.0
    },
    {
      "id": "K8",
      "floor": "F3",
      "level": 3,
      "node": "K8_F3",
      "x": 151.88,
      "z": -8.0
    },
    {
      "id": "K8",
      "floor": "F4",
      "level": 4,
      "node": "K8_F4",
      "x": 151.88,
      "z": -8.0
    },
    {
      "id": "K8",
      "floor": "F5",
      "level": 5,
      "node": "K8_F5",
      "x": 151.88,
      "z": -8.0
    },
    {
      "id": "K8",
      "floor": "F6",
      "level": 6,
      "node": "K8_F6",
      "x": 151.88,
      "z": -8.0
    },
    {
      "id": "K9",
      "floor": "F3",
      "level": 3,
      "node": "K9_F3",
      "x": 168.75,
      "z": -8.0
    },
    {
      "id": "K9",
      "floor": "F4",
      "level": 4,
      "node": "K9_F4",
      "x": 168.75,
      "z": -8.0
    },
    {
      "id": "K9",
      "floor": "F5",
      "level": 5,
      "node": "K9_F5",
      "x": 168.75,
      "z": -8.0
    },
    {
      "id": "K9",
      "floor": "F6",
      "level": 6,
      "node": "K9_F6",
      "x": 168.75,
      "z": -8.0
    },
    {
      "id": "K10",
      "floor": "F4",
      "level": 4,
      "node": "K10_F4",
      "x": 236.25,
      "z": -8.0
    },
    {
      "id": "K10",
      "floor": "F5",
      "level": 5,
      "node": "K10_F5",
      "x": 236.25,
      "z": -8.0
    },
    {
      "id": "K10",
      "floor": "F6",
      "level": 6,
      "node": "K10_F6",
      "x": 236.25,
      "z": -8.0
    },
    {
      "id": "K10",
      "floor": "F7",
      "level": 7,
      "node": "K10_F7",
      "x": 236.25,
      "z": -8.0
    },
    {
      "id": "K11",
      "floor": "F4",
      "level": 4,
      "node": "K11_F4",
      "x": 253.12,
      "z": -8.0
    },
    {
      "id": "K11",
      "floor": "F5",
      "level": 5,
      "node": "K11_F5",
      "x": 253.12,
      "z": -8.0
    },
    {
      "id": "K11",
      "floor": "F6",
      "level": 6,
      "node": "K11_F6",
      "x": 253.12,
      "z": -8.0
    },
    {
      "id": "K11",
      "floor": "F7",
      "level": 7,
      "node": "K11_F7",
      "x": 253.12,
      "z": -8.0
    },
    {
      "id": "K12",
      "floor": "F4",
      "level": 4,
      "node": "K12_F4",
      "x": 265.78,
      "z": -8.0
    },
    {
      "id": "K12",
      "floor": "F5",
      "level": 5,
      "node": "K12_F5",
      "x": 265.78,
      "z": -8.0
    },
    {
      "id": "K12",
      "floor": "F6",
      "level": 6,
      "node": "K12_F6",
      "x": 265.78,
      "z": -8.0
    },
    {
      "id": "K12",
      "floor": "F7",
      "level": 7,
      "node": "K12_F7",
      "x": 265.78,
      "z": -8.0
    }
  ],
  "stairs": [
    {
      "id": "L01_F1",
      "name": "|01",
      "label": "|01",
      "floor": "F1",
      "level": 1,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "L02_F2",
      "name": "|02",
      "label": "|02",
      "floor": "F2",
      "level": 2,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "L03_F3",
      "name": "|03",
      "label": "|03",
      "floor": "F3",
      "level": 3,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "L04_F4",
      "name": "|04",
      "label": "|04",
      "floor": "F4",
      "level": 4,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "L05_F5",
      "name": "|05",
      "label": "|05",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 0.0,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "L15_F5",
      "name": "|15",
      "label": "|15",
      "floor": "F5",
      "level": 5,
      "wing": "S",
      "x": 50.62,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "L36_F6",
      "name": "|36",
      "label": "|36",
      "floor": "F6",
      "level": 6,
      "wing": "S",
      "x": 101.25,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "L57_F7",
      "name": "|57",
      "label": "|57",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 185.62,
      "z": -8.0,
      "type": "stair"
    },
    {
      "id": "L67_F7",
      "name": "|67",
      "label": "|67",
      "floor": "F7",
      "level": 7,
      "wing": "S",
      "x": 219.38,
      "z": -8.0,
      "type": "stair"
    }
  ],
  "elevators": [
    {
      "id": "ELW",
      "floor": "F1",
      "level": 1,
      "node": "ELW_F1",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "ELW",
      "floor": "F2",
      "level": 2,
      "node": "ELW_F2",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "ELW",
      "floor": "F3",
      "level": 3,
      "node": "ELW_F3",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "ELW",
      "floor": "F4",
      "level": 4,
      "node": "ELW_F4",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "ELW",
      "floor": "F5",
      "level": 5,
      "node": "ELW_F5",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "ELW",
      "floor": "F6",
      "level": 6,
      "node": "ELW_F6",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "ELW",
      "floor": "F7",
      "level": 7,
      "node": "ELW_F7",
      "x": 0.0,
      "z": -8.0
    },
    {
      "id": "ELE",
      "floor": "F1",
      "level": 1,
      "node": "ELE_F1",
      "x": 270.0,
      "z": -8.0
    },
    {
      "id": "ELE",
      "floor": "F2",
      "level": 2,
      "node": "ELE_F2",
      "x": 270.0,
      "z": -8.0
    },
    {
      "id": "ELE",
      "floor": "F3",
      "level": 3,
      "node": "ELE_F3",
      "x": 270.0,
      "z": -8.0
    },
    {
      "id": "ELE",
      "floor": "F4",
      "level": 4,
      "node": "ELE_F4",
      "x": 270.0,
      "z": -8.0
    },
    {
      "id": "ELE",
      "floor": "F5",
      "level": 5,
      "node": "ELE_F5",
      "x": 270.0,
      "z": -8.0
    },
    {
      "id": "ELE",
      "floor": "F6",
      "level": 6,
      "node": "ELE_F6",
      "x": 270.0,
      "z": -8.0
    }
  ],
  "entrances": [
    {
      "id": "ENT1",
      "name": "东侧南入口1",
      "floor": "F1",
      "level": 1,
      "node": "ENT1",
      "attach": "F1_105",
      "x": 50.62,
      "z": 12.0,
      "lat": 34.125252,
      "lon": 108.832942,
      "factor": 0.0,
      "source": "BMap GPS + izcat st",
      "confidence": "approx"
    },
    {
      "id": "ENT2",
      "name": "东侧北入口2",
      "floor": "F1",
      "level": 1,
      "node": "ENT2",
      "attach": "F1_107",
      "x": 84.38,
      "z": 12.0,
      "lat": 34.12543,
      "lon": 108.832974,
      "factor": 0.0,
      "source": "BMap GPS + izcat st",
      "confidence": "approx"
    },
    {
      "id": "ENT3",
      "name": "东侧南入口4",
      "floor": "F2",
      "level": 2,
      "node": "ENT3",
      "attach": "F2_211",
      "x": 101.25,
      "z": 12.0,
      "lat": 34.125425,
      "lon": 108.832518,
      "factor": 0.5,
      "source": "BMap GPS + izcat st",
      "confidence": "approx"
    },
    {
      "id": "ENT4",
      "name": "东侧东入口7",
      "floor": "F3",
      "level": 3,
      "node": "ENT4",
      "attach": "F3_312",
      "x": 135.0,
      "z": 12.0,
      "lat": 34.125807,
      "lon": 108.832014,
      "factor": 1.0,
      "source": "BMap GPS + izcat st",
      "confidence": "approx"
    },
    {
      "id": "ENT5",
      "name": "西侧南入口9",
      "floor": "F3",
      "level": 3,
      "node": "ENT5",
      "attach": "F3_318",
      "x": 185.62,
      "z": 12.0,
      "lat": 34.125874,
      "lon": 108.831928,
      "factor": 0.0,
      "source": "BMap GPS + izcat st",
      "confidence": "approx"
    },
    {
      "id": "ENT6",
      "name": "西侧西入口14",
      "floor": "F3",
      "level": 3,
      "node": "ENT6",
      "attach": "F3_320",
      "x": 219.38,
      "z": 12.0,
      "lat": 34.12613,
      "lon": 108.831151,
      "factor": 0.0,
      "source": "BMap GPS + izcat st",
      "confidence": "approx"
    },
    {
      "id": "ENT_NE",
      "name": "北楼东入口6",
      "floor": "N4",
      "level": 4,
      "node": "ENT_NE",
      "attach": "N4_443",
      "x": 75.6,
      "z": -42.0,
      "lat": 34.125736,
      "lon": 108.832244,
      "factor": 0.0,
      "source": "BMap GPS + izcat north",
      "confidence": "approx"
    },
    {
      "id": "ENT_NW",
      "name": "北楼西入口12",
      "floor": "N4",
      "level": 4,
      "node": "ENT_NW",
      "attach": "N4_434",
      "x": 106.8,
      "z": -42.0,
      "lat": 34.126086,
      "lon": 108.831462,
      "factor": 0.0,
      "source": "BMap GPS + izcat north",
      "confidence": "approx"
    }
  ],
  "passageGroups": {
    "1": [
      "101",
      "201",
      "203",
      "301",
      "303",
      "401",
      "403",
      "501"
    ],
    "23": [
      "105",
      "106",
      "107",
      "206",
      "207",
      "208",
      "211",
      "306",
      "307",
      "308",
      "311",
      "406",
      "407",
      "408",
      "411",
      "502",
      "503",
      "506",
      "507"
    ],
    "45": [
      "215",
      "216",
      "217",
      "312",
      "314",
      "315",
      "412",
      "414",
      "415",
      "509",
      "510",
      "511",
      "601",
      "602",
      "603"
    ],
    "6": [
      "316",
      "318",
      "416",
      "418",
      "419",
      "513",
      "514",
      "605",
      "606",
      "608",
      "701"
    ],
    "71": [
      "320",
      "421",
      "516",
      "517",
      "609",
      "703"
    ],
    "72": [
      "422",
      "425",
      "426",
      "520",
      "521",
      "612",
      "613",
      "706",
      "707"
    ],
    "8": [
      "442",
      "443",
      "537",
      "538"
    ],
    "91": [
      "532",
      "437",
      "434",
      "529"
    ],
    "92": [
      "433",
      "528"
    ]
  },
  "routes": [
    {
      "name": "东入口 → 101",
      "from": "ENT1",
      "to": "F1_101",
      "found": true,
      "path": [
        "ENT1",
        "C_F1_3",
        "C_F1_2",
        "C_F1_1",
        "F1_101"
      ],
      "time": 43.0
    },
    {
      "name": "东入口 → 426（跨层）",
      "from": "ENT1",
      "to": "F4_426",
      "found": true,
      "path": [
        "ENT1",
        "C_F1_3",
        "C_F1_4",
        "C_F1_5",
        "ELE_F1",
        "ELE_F2",
        "ELE_F3",
        "ELE_F4",
        "C_F4_16",
        "F4_426"
      ],
      "time": 240.3
    },
    {
      "name": "东入口 → 707（顶层）",
      "from": "ENT1",
      "to": "F7_707",
      "found": true,
      "path": [
        "ENT1",
        "C_F1_3",
        "C_F1_4",
        "C_F1_5",
        "ELE_F1",
        "ELE_F2",
        "ELE_F3",
        "ELE_F4",
        "ELE_F5",
        "ELE_F6",
        "C_F6_16",
        "K12_F6",
        "K12_F7",
        "C_F7_16",
        "F7_707"
      ],
      "time": 303.9
    },
    {
      "name": "东入口 → 北楼 437",
      "from": "ENT3",
      "to": "N4_437",
      "found": true,
      "path": [
        "ENT3",
        "C_F2_6",
        "K3_F2",
        "K3_F3",
        "K3_F4",
        "C_F4_6",
        "C_F4_5",
        "C_N4_1",
        "C_N4_2",
        "N4_437"
      ],
      "time": 112.0
    },
    {
      "name": "西入口 → 320",
      "from": "ENT5",
      "to": "F3_320",
      "found": true,
      "path": [
        "ENT5",
        "C_F3_11",
        "C_F3_12",
        "C_F3_13",
        "F3_320"
      ],
      "time": 43.0
    },
    {
      "name": "北楼西入口 → 528",
      "from": "ENT_NW",
      "to": "N5_528",
      "found": true,
      "path": [
        "ENT_NW",
        "C_N4_3",
        "C_N5_3",
        "C_N5_4",
        "N5_528"
      ],
      "time": 42.5
    },
    {
      "name": "东入口 → 215",
      "from": "ENT1",
      "to": "F2_215",
      "found": true,
      "path": [
        "ENT1",
        "C_F1_3",
        "K1_F1",
        "K1_F2",
        "C_F2_3",
        "C_F2_4",
        "C_F2_5",
        "C_F2_6",
        "C_F2_7",
        "F2_215"
      ],
      "time": 102.8
    }
  ],
  "validation": {
    "reachableFromENT1": 265,
    "missingRooms": [],
    "missingEntrances": [],
    "entrancesWithUnreachableRooms": {}
  }
};
