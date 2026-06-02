/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats } from '../types';
import { DIFFICULTY_TEXT, LEVELS } from '../data';
import { getScoreGrade } from '../utils';
import { motion } from 'motion/react';

interface ClearScreenProps {
  stats: GameStats;
  isLastLevel: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
  onHome: () => void;
}

export function ClearScreen({ stats, isLastLevel, onRestart, onNextLevel, onHome }: ClearScreenProps) {
  const level = LEVELS.find((l) => l.id === stats.levelId);
  const grade = getScoreGrade(stats.score);

  return (
    <div className="flex-1 flex flex-col p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-black bg-[#f9f9f9] select-none overflow-y-auto custom-scrollbar gap-3">

      {/* Header */}
      <div className="text-center pt-1">
        <span className="inline-block bg-black text-yellow-400 text-[8px] font-mono px-2 py-0.5 uppercase tracking-widest border-2 border-black mb-1">STAGE CLEAR</span>
        <h2 className="text-xl font-display font-black mt-1">🎓 逆风突围成功！</h2>
        <div className="mt-1 text-[10px] font-mono font-black tracking-widest text-neutral-500 uppercase">
          {level ? level.title : `STAGE 0${stats.levelId}`} · {DIFFICULTY_TEXT[stats.difficulty]}
        </div>
      </div>

      {/* Score Card - Manga Panel */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="manga-panel-active bg-white p-4 relative"
      >
        <div className="hatching absolute inset-0 pointer-events-none opacity-50"></div>
        <div className="relative z-10 text-center">
          {/* Score */}
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">得分</div>
          <div className={`text-5xl font-display font-black ${grade.color}`}>{stats.score}</div>
          <div className={`text-sm font-bold mt-0.5 ${grade.color}`}>{grade.grade} · {grade.label}</div>

          {/* Stars */}
          <div className="flex items-center gap-1.5 justify-center mt-2">
            {[1, 2, 3].map((i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className={`text-xl ${i <= stats.stars ? '' : 'opacity-20'}`}
              >
                ⭐
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
        <div className="border-2 border-black p-2 bg-white"><span className="text-[9px] text-neutral-500 block">用时</span><span className="font-bold text-sm">{stats.timeUsed}s</span></div>
        <div className="border-2 border-black p-2 bg-white"><span className="text-[9px] text-neutral-500 block">剩余</span><span className="font-bold text-sm">{stats.timeRemainingBeforePenalty}s</span></div>
        <div className="border-2 border-black p-2 bg-white"><span className="text-[9px] text-neutral-500 block">答错</span><span className="font-bold text-sm">{stats.errorsMade}</span></div>
        <div className="border-2 border-black p-2 bg-white"><span className="text-[9px] text-neutral-500 block">峰压</span><span className={`font-bold text-sm ${stats.maxStress >= 75 ? 'text-red-600' : ''}`}>{stats.maxStress}%</span></div>
      </div>

      {/* Buttons */}
      <div className="sticky bottom-0 left-0 right-0 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f9f9f9] border-t-4 border-black">
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            id="btn-play-level-home"
            whileTap={{ scale: 0.95 }}
            onClick={onHome}
            className="manga-btn bg-white hover:bg-neutral-50 py-2.5 font-display font-black text-xs tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🏠 首页</span>
          </motion.button>
          <motion.button
            id="btn-play-level-retry"
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="bg-black hover:bg-neutral-900 text-white font-display font-black py-2.5 px-2 text-xs tracking-wider cursor-pointer flex items-center justify-center gap-1.5 border-3 border-black rounded-none"
            style={{boxShadow:'4px 4px 0px 0px #10b981'}}
          >
            <span>🔄 重来</span>
          </motion.button>
          <motion.button
            id="btn-play-level-next"
            whileTap={{ scale: isLastLevel ? 1 : 0.95 }}
            disabled={isLastLevel}
            onClick={onNextLevel}
            className={`font-display font-black py-2.5 px-2 text-xs tracking-wider flex items-center justify-center gap-1.5 ${
              isLastLevel
                ? 'bg-neutral-100 text-neutral-400 border-2 border-neutral-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white manga-btn cursor-pointer'
            }`}
          >
            <span>🚀 下一关</span>
          </motion.button>
        </div>
      </div>

    </div>
  );
}
