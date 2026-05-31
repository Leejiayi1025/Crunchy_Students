/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats } from '../types';
import { SUCCESS_TITLES } from '../data';
import { TimelineChart } from './TimelineChart';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface ClearScreenProps {
  stats: GameStats;
  isLastLevel: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
}

export function ClearScreen({ stats, isLastLevel, onRestart, onNextLevel }: ClearScreenProps) {
  const [funnyTitle, setFunnyTitle] = useState('');

  useEffect(() => {
    if (stats.maxStress > 85) {
      setFunnyTitle('【刀尖舔蜜·极限作死大师】');
    } else if (stats.maxStress < 25) {
      setFunnyTitle('【冷酷无形·绝顶养生帝王】');
    } else if (stats.errorsMade === 0) {
      setFunnyTitle('【零瑕疵·一顺百顺极速解者】');
    } else {
      const idx = Math.floor(Math.random() * SUCCESS_TITLES.length);
      setFunnyTitle(SUCCESS_TITLES[idx]);
    }
  }, [stats]);

  const getStarText = (stars: number) => {
    switch (stars) {
      case 3: return '完美级逆风掌控！';
      case 2: return '优秀自救人！最终逆袭。';
      default: return '勉强过关！发际线又后移了。';
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-5 text-black bg-stone-50 select-none overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="text-center pt-1">
        <span className="inline-block bg-neutral-900 text-yellow-400 text-[8px] font-mono px-2 py-0.5 uppercase tracking-widest border border-black mb-1 shadow-[1px_1px_0px_#000]">[EXAMINATION REPORT]</span>
        <h2 className="text-xl font-display font-black mt-1 leading-none flex flex-col">
          <span className="text-emerald-700 font-extrabold text-xl">🎓 逆风突围成功！</span>
        </h2>
      </div>

      {/* Stats Card */}
      <div className="my-2 border-[3px] border-black p-3.5 bg-white shadow-[4px_4px_0px_#000000] relative space-y-3 rounded-none">
        <div className="absolute top-2 right-2 bg-red-50 text-red-600 p-1 border-2 border-dashed border-red-500 transform rotate-6 scale-90">
          <span className="text-[8px] font-mono block font-black uppercase tracking-tight">APPROVED</span>
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1.5 justify-center py-1 bg-stone-50/50 border border-stone-200">
          {[1, 2, 3].map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.15 }}
              className={`text-3xl ${i <= stats.stars ? '' : 'opacity-20'}`}
            >
              ⭐
            </motion.span>
          ))}
        </div>
        <p className="text-[11px] text-yellow-600 font-bold font-mono text-center">{getStarText(stats.stars)}</p>

        {/* Grade */}
        <div className="border-2 border-black py-2.5 bg-neutral-50 text-center text-xs font-mono relative">
          <span className="text-[8px] text-zinc-400 font-black block uppercase tracking-wider mb-0.5">抗压评定</span>
          <span className="text-base font-display font-black text-red-600 block">【 {funnyTitle} 】</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
          <div className="border-2 border-black p-1.5 bg-stone-50"><span className="text-[8px] text-zinc-400 block font-bold">答错</span><span className="font-bold text-black text-xs">{stats.errorsMade}次</span></div>
          <div className="border-2 border-black p-1.5 bg-stone-50"><span className="text-[8px] text-zinc-400 block font-bold">峰值压力</span><span className={`font-black text-xs ${stats.maxStress >= 75 ? 'text-red-600' : 'text-stone-900'}`}>{stats.maxStress}%</span></div>
          <div className="border-2 border-black p-1.5 bg-stone-50"><span className="text-[8px] text-zinc-400 block font-bold">摸鱼</span><span className="font-bold text-black text-xs">{stats.slackedOffCount}次</span></div>
          <div className="border-2 border-black p-1.5 bg-stone-50"><span className="text-[8px] text-zinc-400 block font-bold">突袭应对</span><span className="font-bold text-black text-xs">{stats.surpriseSuccesses}/{stats.triggeredSurprisesCount}</span></div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="mb-3">
        <TimelineChart timeline={stats.timeline} maxStressThreshold={stats.maxStress} />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <motion.button
            id="btn-play-level-retry"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="flex-1 bg-black hover:bg-neutral-900 text-white font-display font-black py-3 px-3 text-xs tracking-wider rounded-none shadow-[3px_3px_0px_#10b981] flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
          >
            <span>🔄 重刷</span>
          </motion.button>

          {!isLastLevel ? (
            <motion.button
              id="btn-play-level-next"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNextLevel}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-black font-display font-black py-3 px-3 text-xs tracking-wider rounded-none shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
            >
              <span>🚀 下一关</span>
            </motion.button>
          ) : (
            <motion.button
              id="btn-play-level-final-reset"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRestart}
              className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-black border-2 border-black font-display font-black py-3 px-3 text-xs tracking-wider rounded-none shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
            >
              <span>📸 重头再来</span>
            </motion.button>
          )}
        </div>
      </div>

    </div>
  );
}
