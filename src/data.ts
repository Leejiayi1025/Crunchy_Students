/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Talent, Level } from './types';

export const TALENTS: Talent[] = [
  {
    id: 'night_owl',
    name: '熬夜脱发体质',
    emoji: '👁️',
    description: '长期凌晨3点修仙，发际线倒退，脑力极度活跃但后劲不足。',
    bonusText: '时间 +15秒；初始逆风值 15%。',
    initialStress: 15,
    initialTimeBonus: 15,
    stressPenaltyMultiplier: 1.0,
    recoveryBonus: 1.0,
    specialRule: '晚睡人狂喜！时间更充沛，但脑壳重重的。'
  },
  {
    id: 'low_sugar',
    name: '低血糖易手抖体质',
    emoji: '🍬',
    description: '早八不吃早饭，饿到指关节乱颤，遇到考题手抖想吃糖。',
    bonusText: '摸鱼降温翻倍；点错额外 +3% 逆风值。',
    initialStress: 0,
    initialTimeBonus: 0,
    stressPenaltyMultiplier: 1.15,
    recoveryBonus: 2.0,
    specialRule: '极限吃甜自救！每次点错惩罚更抖，但摸鱼直接爽翻。'
  },
  {
    id: 'social_phobia',
    name: '社恐点名恐惧体质',
    emoji: '🫣',
    description: '最害怕”请这位同学回答一下”，一被关注就满脸通红、心跳两百。',
    bonusText: '化解导员突袭时逆风值归零；答错惩罚 +30%。',
    initialStress: 5,
    initialTimeBonus: 5,
    stressPenaltyMultiplier: 1.3,
    recoveryBonus: 1.0,
    specialRule: '社恐危机！别让导导发现我，点掉突袭直接原地满血复活！'
  },
  {
    id: 'pre_exam_amnesia',
    name: '考前健忘体质',
    emoji: '🧠',
    description: '临考前5分钟还在看书，一发试卷脑子瞬间空白，宛如被格式化。',
    bonusText: '崩溃上限提升至 110%；15% 几率闪回模糊。',
    initialStress: 0,
    initialTimeBonus: 10,
    stressPenaltyMultiplier: 1.0,
    recoveryBonus: 1.2,
    specialRule: '耐操厚防！心态上限提升，但脑中偶尔闪回空白。'
  },
  {
    id: 'panic_prone',
    name: '极易慌张体质',
    emoji: '🤯',
    description: '风吹草动都会当场起飞，稍有一点落后就觉得要挂科，原地自闭。',
    bonusText: '3连回复 -50（常人-30）；做错延时 +8秒。',
    initialStress: 10,
    initialTimeBonus: -5,
    stressPenaltyMultiplier: 1.2,
    recoveryBonus: 0.8,
    specialRule: '超高暴击！手热时一顺百顺极速解压，手冷时一错就慌暴烈拖延。'
  }
];

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '舒尔特挑战',
    title: '第一关：导员要点名了！',
    scenario: '导员拿着点名册走上讲台，你的名字在上面！集中注意力！',
    instructions: '按 1→25 顺序快速点击数字，点错扣时间。',
    rules: ['按 1、2、3…25 顺序点击数字', '点错 → 扣时间 + 逆风值上涨', '逆风值满100持续5秒 → 心态崩盘失败'],
    baseTime: 65,
    failureTragedy: '点名被抓！挂科一门，罚写3000字思想汇报。'
  },
  {
    id: 2,
    name: '逻辑数独挑战',
    title: '第二关：随堂微积分测试！',
    scenario: '导员发下测试纸，算入平时成绩30%！逻辑已经完全打结…',
    instructions: '填入1-4，使每行、每列、每个2×2宫数字不重复。',
    rules: ['点击空格 → 再点下方数字填入', '每行/每列/每宫 数字不可重复', '填错 → 扣时间 + 逆风值上涨'],
    baseTime: 120,
    failureTragedy: '交了大白卷！平时成绩扣光，成绩不合格。'
  },
  {
    id: 3,
    name: '华容道滑块挑战',
    title: '第三关：宿舍大突击检查！',
    scenario: '宿管推门而入：”柜子乱成这样！5分钟内排好1-8，否则扣综测分！”',
    instructions: '点击空格旁的方块滑入空位，排列1-8。',
    rules: ['点击空格旁的数字 → 滑入空位', '目标：1到8从左到右、从上到下排列', '点错 → 扣时间 + 逆风值上涨'],
    baseTime: 90,
    failureTragedy: '柜子照片被发到辅导员群，通报批评，罚打扫厕所一个月。'
  },
  {
    id: 4,
    name: '管道连接挑战',
    title: '第四关：实验室电路短路了！',
    scenario: '电路板冒烟了！助教说：”把管道全部接通，否则实验课零分。”',
    instructions: '点击管道旋转，连通左右两侧入口出口。',
    rules: ['点击管道 → 旋转90°', '目标：从左侧入口到右侧出口全部连通', '连通的管道会发绿光'],
    baseTime: 100,
    failureTragedy: '电路板烧毁，半栋楼停电，赔偿3000元+重修实验课。'
  },
  {
    id: 5,
    name: '一笔画挑战',
    title: '第五关：选课系统崩溃前夜！',
    scenario: '选课系统凌晨开放，必须一笔走完所有路径才能抢到课！',
    instructions: '依次点击节点，一笔走遍所有连线。',
    rules: ['点击节点开始画路径', '每条连线只能走一次', '走完所有连线即通关'],
    baseTime: 80,
    failureTragedy: '系统崩溃，只抢到”太极拳与养生”，后悔一学期。'
  },
  {
    id: 6,
    name: '记忆翻牌挑战',
    title: '第六关：考前突击背公式！',
    scenario: '明天期末考，公式全忘了！用翻牌配对法把公式找出来！',
    instructions: '每次翻两张，相同则配对成功，不同则翻回。',
    rules: ['点击翻开一张牌', '每次翻两张，相同则配对成功', '找出全部8对即通关'],
    baseTime: 90,
    failureTragedy: '考试脑子空白，对着试卷发呆90分钟，成绩17分。'
  }
];

// 4x4 Sudoku configurations
export interface SudokuCell {
  row: number;
  col: number;
  val: number | null;
  starting: boolean;
}

export interface SudokuPuzzle {
  board: SudokuCell[];
  solution: number[][];
}

export const SUDOKU_PUZZLES: SudokuPuzzle[] = [
  {
    board: [
      { row: 0, col: 0, val: 1, starting: true },
      { row: 0, col: 1, val: null, starting: false },
      { row: 0, col: 2, val: 3, starting: true },
      { row: 0, col: 3, val: null, starting: false },
      
      { row: 1, col: 0, val: null, starting: false },
      { row: 1, col: 1, val: null, starting: false },
      { row: 1, col: 2, val: null, starting: false },
      { row: 1, col: 3, val: 2, starting: true },
      
      { row: 2, col: 0, val: 4, starting: true },
      { row: 2, col: 1, val: null, starting: false },
      { row: 2, col: 2, val: null, starting: false },
      { row: 2, col: 3, val: null, starting: false },
      
      { row: 3, col: 0, val: null, starting: false },
      { row: 3, col: 1, val: 1, starting: true },
      { row: 3, col: 2, val: null, starting: false },
      { row: 3, col: 3, val: 3, starting: true }
    ],
    solution: [
      [1, 2, 3, 4],
      [3, 4, 1, 2],
      [4, 3, 2, 1],
      [2, 1, 4, 3]
    ]
  },
  {
    board: [
      { row: 0, col: 0, val: null, starting: false },
      { row: 0, col: 1, val: 3, starting: true },
      { row: 0, col: 2, val: null, starting: false },
      { row: 0, col: 3, val: 4, starting: true },
      
      { row: 1, col: 0, val: 4, starting: true },
      { row: 1, col: 1, val: null, starting: false },
      { row: 1, col: 2, val: 1, starting: true },
      { row: 1, col: 3, val: null, starting: false },
      
      { row: 2, col: 0, val: null, starting: false },
      { row: 2, col: 1, val: 4, starting: true },
      { row: 2, col: 2, val: null, starting: false },
      { row: 2, col: 3, val: 1, starting: true },
      
      { row: 3, col: 0, val: 1, starting: true },
      { row: 3, col: 1, val: null, starting: false },
      { row: 3, col: 2, val: 4, starting: true },
      { row: 3, col: 3, val: null, starting: false }
    ],
    solution: [
      [2, 3, 1, 4],
      [4, 2, 1, 3],
      [3, 4, 2, 1],
      [1, 2, 4, 3]
    ]
  },
  {
    board: [
      { row: 0, col: 0, val: 3, starting: true },
      { row: 0, col: 1, val: null, starting: false },
      { row: 0, col: 2, val: null, starting: false },
      { row: 0, col: 3, val: 1, starting: true },
      
      { row: 1, col: 0, val: null, starting: false },
      { row: 1, col: 1, val: 1, starting: true },
      { row: 1, col: 2, val: 2, starting: true },
      { row: 1, col: 3, val: null, starting: false },
      
      { row: 2, col: 0, val: null, starting: false },
      { row: 2, col: 1, val: 3, starting: true },
      { row: 2, col: 2, val: 1, starting: true },
      { row: 2, col: 3, val: null, starting: false },
      
      { row: 3, col: 0, val: 1, starting: true },
      { row: 3, col: 1, val: null, starting: false },
      { row: 3, col: 2, val: null, starting: false },
      { row: 3, col: 3, val: 2, starting: true }
    ],
    solution: [
      [3, 2, 4, 1],
      [4, 1, 2, 3],
      [2, 3, 1, 4],
      [1, 4, 3, 2]
    ]
  }
];

// -------------------------------------------------------
// Level 3: Sliding Puzzle (华容道) data
// -------------------------------------------------------
// 3x3 sliding puzzle is generated at runtime (shuffled array),
// so no static puzzle data is needed.

// -------------------------------------------------------
// Level 4: Pipe Puzzle data
// -------------------------------------------------------
export type PipeType = 'empty' | 'straight' | 'corner' | 'tee' | 'cross';
// rotation: 0, 1, 2, 3 (×90° clockwise)
export interface PipeCell {
  type: PipeType;
  solvedRotation: number;
}

export const PIPE_PUZZLES: PipeCell[][] = [
  // Puzzle 1 — a winding path from left edge to right edge
  [
    // Row 0: down-bend → down-bend → corner(down→right) → straight(down)
    { type: 'corner', solvedRotation: 2 },  // [0,0] connects: down, left
    { type: 'corner', solvedRotation: 2 },  // [0,1] connects: down, left
    { type: 'corner', solvedRotation: 1 },  // [0,2] connects: down, right
    { type: 'straight', solvedRotation: 1 },// [0,3] connects: down, down
    // Row 1: straight(right) → straight(right) → corner(up→right) → corner(down→left)
    { type: 'straight', solvedRotation: 0 },// [1,0] connects: left, right
    { type: 'straight', solvedRotation: 0 },// [1,1] connects: left, right
    { type: 'straight', solvedRotation: 0 },// [1,2] connects: left, right
    { type: 'corner', solvedRotation: 3 },  // [1,3] connects: down, left
    // Row 2: corner(up→right) → straight(right) → straight(right) → corner(up→left)
    { type: 'corner', solvedRotation: 0 },  // [2,0] connects: up, right
    { type: 'straight', solvedRotation: 0 },// [2,1] connects: left, right
    { type: 'straight', solvedRotation: 0 },// [2,2] connects: left, right
    { type: 'corner', solvedRotation: 3 },  // [2,3] connects: down, left
    // Row 3: corner(up→right) → straight(right) → straight(right) → corner(up→left)
    { type: 'corner', solvedRotation: 0 },  // [3,0] connects: up, right
    { type: 'straight', solvedRotation: 0 },// [3,1] connects: left, right
    { type: 'straight', solvedRotation: 0 },// [3,2] connects: left, right
    { type: 'corner', solvedRotation: 2 },  // [3,3] connects: down, left
  ],
];

// -------------------------------------------------------
// Level 5: One-Stroke Drawing data
// -------------------------------------------------------
export interface StrokeNode {
  id: number;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}
export type StrokeEdge = [number, number];
export interface OneStrokePuzzle {
  nodes: StrokeNode[];
  edges: StrokeEdge[];
  solution: number[]; // correct Eulerian path (node id sequence)
}

export const ONE_STROKE_PUZZLES: OneStrokePuzzle[] = [
  {
    // Nodes arranged in a clean grid-diamond layout
    // 1(top) - 2(left) - 5(center) - 3(right) - 4(bottom)
    // with extra edges forming the diamond shape
    nodes: [
      { id: 1, x: 50, y: 10 },
      { id: 2, x: 15, y: 40 },
      { id: 3, x: 85, y: 40 },
      { id: 4, x: 50, y: 90 },
      { id: 5, x: 50, y: 50 },
    ],
    edges: [
      [1, 2], [1, 3], [1, 5],
      [2, 5], [2, 4],
      [3, 5], [3, 4],
      [4, 5],
    ],
    // Eulerian path: odd-degree nodes are 1 and 4
    solution: [1, 2, 5, 1, 3, 5, 4, 2, 3, 4],
  },
];

// -------------------------------------------------------
// Level 6: Memory Match data
// -------------------------------------------------------
export interface MemoryPair {
  id: string;
  emoji: string;
  label: string;
}
export const MEMORY_PAIRS: MemoryPair[] = [
  { id: 'p1', emoji: '📚', label: '高数' },
  { id: 'p2', emoji: '☕', label: '续命' },
  { id: 'p3', emoji: '🌙', label: '修仙' },
  { id: 'p4', emoji: '📝', label: 'DDL' },
  { id: 'p5', emoji: '😱', label: '挂科' },
  { id: 'p6', emoji: '🎯', label: '满分' },
  { id: 'p7', emoji: '💤', label: '早八' },
  { id: 'p8', emoji: '🔥', label: '内卷' },
];

export const FUNNY_QUOTES = [
  "“导员在黑板上把教鞭敲得梆梆响，你的冷汗打湿了衣襟…”",
  "“完了！脑子里突然想起来还没收晾在阳台的被套…”",
  "“室友在旁边偷偷开了一把排位，超大声喊着抓中抓中…”",
  "“听说隔壁班老王因为心态崩溃，直接去给导员干家务自救了。”",
  "“高压之下，突然想起来昨晚外卖还没给五星好评…”",
  "“风雨声在耳边盘旋，导导的声音像大悲咒一样洗脑…”",
  "“微积分公式就像张牙舞爪的哥斯拉，在你眼皮底下疯狂蹦迪…”",
  "“心态一崩，感觉看所有的格子都有重影…”",
];

export const SUCCESS_TITLES = [
  "【无畏的逆风神行者】",
  "【深渊级的抗压帝王】",
  "【导员也服气的自救超人】",
  "【稳如泰山·脆皮天尊】",
  "【优雅抗压的自黑之王】"
];
