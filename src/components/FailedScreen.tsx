/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Level } from '../types';
import { getScoreGrade } from '../utils';
import { DIFFICULTY_TEXT } from '../data';
import { motion } from 'motion/react';

interface FailedScreenProps {
  stats: GameStats;
  level: Level;
  failReason: 'TIMEOUT' | 'STRESS_CRASH';
  onRestart: () => void;
  onSkip: () => void;
  onHome: () => void;
}

export function FailedScreen({ stats, level, failReason, onRestart, onSkip, onHome }: FailedScreenProps) {
  const grade = getScoreGrade(stats.score);

  return (
    <div className="flex-1 flex flex-col p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-black bg-[#f9f9f9] select-none overflow-y-auto custom-scrollbar gap-3">

      {/* Header */}
      <div className="text-center pt-1">
        <span className="inline-block bg-red-600 text-white text-[8px] font-mono px-2 py-0.5 border-2 border-black uppercase tracking-widest font-black">STAGE FAILED</span>
        <h2 className="text-xl font-display font-black mt-1 text-red-600">💀 挂科警告！</h2>
        <div className="mt-1 text-[10px] font-mono font-black tracking-widest text-neutral-500 uppercase">
          {level.title} · {DIFFICULTY_TEXT[stats.difficulty]}
        </div>
      </div>

      {/* Score Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="manga-panel-active bg-white p-4 relative"
      >
        <div className="hatching-dense absolute inset-0 pointer-events-none opacity-50"></div>
        <div className="relative z-10 text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">得分</div>
          <div className={`text-5xl font-display font-black ${grade.color}`}>{stats.score}</div>
          <div className={`text-sm font-bold mt-0.5 ${grade.color}`}>{grade.grade} · {grade.label}</div>
          <p className="text-[11px] font-mono text-red-600 font-bold mt-2">
            {failReason === 'TIMEOUT' ? '⏰ 时间耗尽' : '💀 压力崩盘'}
          </p>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
        <div className="border-2 border-black p-2 bg-white"><span className="text-[9px] text-neutral-500 block">用时</span><span className="font-bold text-sm">{stats.timeUsed}s</span></div>
        <div className="border-2 border-black p-2 bg-white"><span className="text-[9px] text-neutral-500 block">答错</span><span className="font-bold text-sm">{stats.errorsMade}</span></div>
      </div>

      {/* Buttons */}
      <div className="sticky bottom-0 left-0 right-0 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f9f9f9] border-t-4 border-black">
        <div className="grid grid-cols-3 gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={onHome}
            className="manga-btn bg-white hover:bg-neutral-50 py-2.5 font-display font-black text-xs tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >🏠 首页</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onRestart}
            className="bg-black hover:bg-neutral-900 text-white font-display font-black py-2.5 px-2 text-xs tracking-wider cursor-pointer flex items-center justify-center gap-1.5 border-3 border-black rounded-none"
            style={{boxShadow:'4px 4px 0px 0px #dc2626'}}
          >🔄 重来</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onSkip}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black py-2.5 px-2 text-xs tracking-wider manga-btn cursor-pointer flex items-center justify-center gap-1.5"
          >🚀 下一关</motion.button>
        </div>
      </div>

    </div>
  );
}
