/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Level } from '../types';
import { motion } from 'motion/react';

interface LevelSelectScreenProps {
  levels: Level[];
  completedLevelIds: number[];
  lastLevelId: number | null;
  nextPlayableLevelIdx: number;
  selectedLevelIdx: number;
  onSelectLevel: (levelIdx: number) => void;
  onContinueLast: () => void;
  onChangeTalent: () => void;
  onResetProgress: () => void;
}

export function LevelSelectScreen({
  levels,
  completedLevelIds,
  lastLevelId,
  nextPlayableLevelIdx,
  selectedLevelIdx,
  onSelectLevel,
  onContinueLast,
  onChangeTalent,
  onResetProgress,
}: LevelSelectScreenProps) {
  const isCompleted = (levelId: number) => completedLevelIds.includes(levelId);
  const hasLast = lastLevelId !== null;

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-stone-50 select-none">

      {/* Top Bar */}
      <div className="pb-2 border-b-2 border-black">
        <span className="text-[9px] tracking-widest font-mono text-neutral-500 block uppercase font-bold leading-none">[LEVEL SELECTION / 关卡选择]</span>
        <h2 className="text-xl font-display font-black text-black mt-1 flex justify-between items-center">
          <span>关卡进度</span>
          <div className="flex items-center gap-2">
            <button
              id="btn-change-talent"
              onClick={onChangeTalent}
              className="text-[9px] bg-stone-100 text-stone-600 font-mono px-2 py-0.5 border border-stone-300 font-black rounded-sm cursor-pointer hover:bg-stone-200 transition-colors"
            >
              更换体质
            </button>
            <button
              id="btn-reset-progress"
              onClick={onResetProgress}
              className="text-[9px] bg-stone-100 text-stone-600 font-mono px-2 py-0.5 border border-stone-300 font-black rounded-sm cursor-pointer hover:bg-stone-200 transition-colors"
            >
              清除进度
            </button>
          </div>
        </h2>
      </div>

      {/* Continue Last */}
      {hasLast && !isCompleted(lastLevelId) && (
        <motion.button
          id="btn-continue-last"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinueLast}
          className="mt-3 w-full bg-white border-[3px] border-black p-3 flex items-center justify-between shadow-[4px_4px_0px_#000000] cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
        >
          <div className="text-left">
            <div className="text-[10px] text-neutral-500 font-mono uppercase font-bold">继续上次</div>
            <div className="text-sm font-black text-black font-mono">
              {levels.find((l) => l.id === lastLevelId)?.title ?? `关卡 ${lastLevelId}`}
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-600 font-bold">
            → 继续
          </div>
        </motion.button>
      )}

      {/* Level List */}
      <div className="flex-1 flex flex-col justify-center py-3 space-y-3 overflow-y-auto custom-scrollbar pr-1">
        <span className="text-[9px] font-mono tracking-widest text-neutral-500 block uppercase text-center font-black">—— ☠ 选择抗压考场 ☠ ——</span>
        {levels.map((level, idx) => {
          const selected = idx === selectedLevelIdx;
          const completed = isCompleted(level.id);
          const isNextPlayable = idx === nextPlayableLevelIdx;
          const isLocked = !completed && !isNextPlayable;
          const selectable = completed || isNextPlayable;
          return (
            <motion.div
              key={level.id}
              whileHover={selectable ? { y: -2 } : undefined}
              whileTap={selectable ? { y: 2 } : undefined}
              onClick={selectable ? () => onSelectLevel(idx) : undefined}
              className={`w-full p-3.5 border-[3px] text-left relative transition-all rounded-none flex items-center justify-between select-none ${
                isLocked
                  ? 'border-stone-300 bg-stone-100/75 text-zinc-400 cursor-not-allowed shadow-none'
                  : selected
                    ? 'border-black bg-white shadow-[4px_4px_0px_#000000] cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none'
                    : 'border-neutral-300 bg-white hover:bg-stone-50 shadow-[2px_2px_0px_rgba(0,0,0,0.15)] hover:border-black cursor-pointer'
              }`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-mono px-2 py-0.5 border leading-none font-bold ${
                    isLocked ? 'bg-stone-200 border-stone-300 text-zinc-400' : 'bg-red-50 text-red-600 border-red-300'
                  }`}>STAGE 0{level.id}</span>
                  {completed && <span className="text-[9px] bg-emerald-500 text-white font-mono px-1 py-0.5 border border-emerald-600 font-black uppercase">已通关</span>}
                  {isNextPlayable && !completed && <span className="text-[9px] bg-red-600 text-white font-mono px-1 py-0.5 border border-red-700 font-black uppercase animate-pulse">当前关</span>}
                </div>
                <h3 className={`font-display font-black text-sm leading-tight ${isLocked ? 'text-zinc-400' : 'text-black'}`}>{level.title}</h3>
                <p className={`text-[10px] font-mono mt-0.5 ${isLocked ? 'text-zinc-400' : 'text-neutral-500'}`}>时限 {level.baseTime}s</p>
              </div>
              <div className="shrink-0 flex items-center justify-center ml-2">
                {isLocked
                  ? <div className="p-2 border-2 border-stone-300 bg-stone-200">🔒</div>
                  : <div className="bg-black text-white p-2.5 border-2 border-black shadow-[2px_2px_0px_#22c55e]">→</div>
                }
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
