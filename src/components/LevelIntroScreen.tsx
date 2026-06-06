/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Difficulty, Level, Talent } from '../types';
import { motion } from 'motion/react';
import { DIFFICULTIES, DIFFICULTY_TEXT, getLevelDifficultyConfig } from '../data';

interface LevelIntroProps {
  level: Level;
  talent: Talent | null;
  onEnterGame: (difficulty: Difficulty) => void;
  onBack: () => void;
}

export function LevelIntroScreen({ level, talent, onEnterGame, onBack }: LevelIntroProps) {
  const shortName = (() => {
    if (level.id === 1) return '舒尔特方格';
    if (level.id === 2) return '数独';
    if (level.id === 3) return '找不同';
    if (level.id === 4) return '管道连接';
    if (level.id === 5) return '颜色记忆';
    if (level.id === 6) return '翻牌配对';
    if (level.id === 7) return '反向指令';
    return level.name;
  })();

  const keyRule = (() => {
    if (level.id === 1) return '按顺序点 1→25；点错会扣时间并提高脑压。';
    if (level.id === 2) return '每行/列/宫数字不重复；填错会扣时间并提高脑压。';
    if (level.id === 3) return '每轮找出唯一不同的那个（文字/数字/图案）；点错会扣时间并提高脑压。';
    if (level.id === 4) return '旋转管道连通入口→出口；漏水不算通关。';
    if (level.id === 5) return '按系统闪烁顺序点击颜色；点错会扣时间并提高脑压。';
    if (level.id === 6) return '每次翻两张，配对成功则保留；全部配对通关。';
    if (level.id === 7) return '看到方向就点相反方向：上↔下，左↔右；点错会扣时间并提高脑压。';
    return level.instructions;
  })();

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-[#f9f9f9] select-none">

      {/* Header */}
      <div className="border-b-4 border-black pb-2">
        <button
          id="btn-level-intro-back"
          onClick={onBack}
          className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-mono text-neutral-500 hover:text-black cursor-pointer"
        >
          ← 返回
        </button>
        <span className="text-[9px] tracking-widest font-mono text-red-600 block uppercase font-extrabold mb-0.5">[STAGE SPECIFICATION / 规则手册]</span>
        <h2 className="text-xl font-display font-black text-black leading-tight">{level.title}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 py-3 space-y-3 overflow-y-auto my-1 pr-1">
        {/* Rule Card - Manga Panel with Hatching */}
        <div className="manga-panel p-3 bg-red-50 relative">
          <div className="hatching absolute inset-0 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-1 mb-2">
              <div className="text-[10px] font-mono font-black tracking-widest uppercase text-red-700">核心规则</div>
              <div className="text-[10px] font-mono font-black px-2 py-0.5 border-2 border-black bg-white">{shortName}</div>
            </div>
            <div className="space-y-2">
              <div className="flex gap-2 text-[11px] leading-relaxed select-none">
                <span className="bg-black text-white text-[9px] font-mono font-black h-4 w-4 shrink-0 flex items-center justify-center border border-black">!</span>
                <span className="text-stone-900 font-black">{level.instructions}</span>
              </div>
              <div className="flex gap-2 text-[11px] leading-relaxed select-none">
                <span className="bg-black text-white text-[9px] font-mono font-black h-4 w-4 shrink-0 flex items-center justify-center border border-black">1</span>
                <span className="text-stone-800 font-bold">{keyRule}</span>
              </div>
            </div>
          </div>
        </div>

        {talent && (
          <div className="manga-panel p-3 bg-white relative">
            <div className="halftone absolute inset-0 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="text-[10px] font-mono font-black tracking-widest uppercase text-neutral-600 border-b-2 border-black pb-1 mb-2">
                天赋加护
              </div>
              <div className="text-[11px] font-mono leading-relaxed text-neutral-800">
                <span className="font-black">{talent.name}</span>：{talent.bonusText}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="space-y-2 pt-2 border-t border-dashed border-neutral-300">
        <div className="text-[10px] font-mono font-black tracking-widest uppercase text-neutral-600">
          选择难度（点击即开始）
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DIFFICULTIES.map((d) => {
            const cfg = getLevelDifficultyConfig(level.id, d);
            const timeBonus = talent ? talent.initialTimeBonus : 0;
            return (
              <motion.button
                key={d}
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onEnterGame(d)}
                className={`p-2.5 text-left manga-btn cursor-pointer ${
                  d === 'HELL'
                    ? 'bg-red-50 hover:bg-red-100'
                    : d === 'HARD'
                    ? 'bg-amber-50 hover:bg-amber-100'
                    : d === 'MEDIUM'
                    ? 'bg-white hover:bg-neutral-50'
                    : 'bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-display font-black text-sm text-black">{DIFFICULTY_TEXT[d]}</div>
                  <div className="text-[10px] font-mono font-black text-zinc-700">{cfg.timeLimit}s{timeBonus !== 0 && `+${timeBonus}s`}</div>
                </div>
                <div className="mt-1 text-[10px] font-mono text-zinc-600 leading-tight">
                  {d === 'EASY' && '更宽松时限 / 更易上手'}
                  {d === 'MEDIUM' && '标准体验'}
                  {d === 'HARD' && '更紧张节奏 / 更难题量'}
                  {d === 'HELL' && '极限压迫 / 地狱体验'}
                </div>
              </motion.button>
            );
          })}
        </div>
        <button
          onClick={onBack}
          className="w-full bg-neutral-100 hover:bg-neutral-200 border-2 border-black font-semibold text-black py-2 px-4 text-[10px] font-mono tracking-wider rounded-none cursor-pointer transition-colors shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
        >
          返回考场选单
        </button>
      </div>

    </div>
  );
}
