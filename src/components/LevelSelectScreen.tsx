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
    <div className="flex-1 flex flex-col justify-between p-5 bg-[#f9f9f9] select-none">

      {/* Top Bar */}
      <div className="pb-2 border-b-4 border-black">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[9px] tracking-widest font-mono text-neutral-500 block uppercase font-bold leading-none">[LEVEL SELECTION / 关卡选择]</span>
          <div className="flex items-center gap-2">
            <button
              id="btn-change-talent"
              onClick={onChangeTalent}
              className="bg-white text-black font-mono px-2 py-1 border-2 border-black font-black cursor-pointer hover:bg-neutral-100 transition-colors text-[10px] shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
            >
              更换体质
            </button>
            <button
              id="btn-reset-progress"
              onClick={onResetProgress}
              className="bg-white text-black font-mono px-2 py-1 border-2 border-black font-black cursor-pointer hover:bg-neutral-100 transition-colors text-[10px] shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
            >
              清除
            </button>
          </div>
        </div>
        <h2 className="text-xl font-display font-black text-black mt-1">关卡进度</h2>
      </div>

      {/* Continue Last */}
      {hasLast && !isCompleted(lastLevelId) && (
        <motion.button
          id="btn-continue-last"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.95 }}
          onClick={onContinueLast}
          className="mt-3 w-full bg-white p-3 flex items-center justify-between manga-panel cursor-pointer"
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
              className={`w-full p-4 text-left relative transition-all rounded-none flex items-center justify-between select-none ${
                isLocked
                  ? 'border-3 border-neutral-300 bg-neutral-100 text-zinc-400 cursor-not-allowed'
                  : selected
                    ? 'manga-panel-active bg-white cursor-pointer'
                    : 'manga-panel bg-white hover:bg-neutral-50 cursor-pointer'
              }`}
              style={isLocked ? {borderWidth:'3px', borderStyle:'solid', borderColor:'#d4d4d4'} : undefined}
            >
              {isLocked && <div className="absolute inset-0 hatching pointer-events-none opacity-50"></div>}
              <div className="flex-1 min-w-0 pr-2 relative z-10">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[9px] font-mono px-2 py-0.5 border-2 border-black leading-none font-bold ${
                    isLocked ? 'bg-neutral-200 text-zinc-400' : 'bg-black text-yellow-400'
                  }`}>STAGE 0{level.id}</span>
                  {completed && <span className="text-[9px] bg-emerald-500 text-white font-mono px-1 py-0.5 border-2 border-black font-black uppercase">已通关</span>}
                  {isNextPlayable && !completed && <span className="text-[9px] bg-red-600 text-white font-mono px-1 py-0.5 border-2 border-black font-black uppercase animate-pulse">当前关</span>}
                </div>
                <h3 className={`font-display font-black text-sm leading-tight ${isLocked ? 'text-zinc-400' : 'text-black'}`}>{level.title}</h3>
                <p className={`text-[10px] font-mono mt-0.5 ${isLocked ? 'text-zinc-400' : 'text-neutral-500'}`}>时限 {level.baseTime}s</p>
              </div>
              <div className="shrink-0 flex items-center justify-center ml-2 relative z-10">
                {isLocked
                  ? <div className="p-2 border-2 border-neutral-300 bg-neutral-200">🔒</div>
                  : <div className="bg-black text-white p-2.5 border-2 border-black shadow-[2px_2px_0px_0px_#22c55e]">→</div>
                }
              </div>
            </motion.div>
          );
        })}
      </div>

    </div>
  );
}
