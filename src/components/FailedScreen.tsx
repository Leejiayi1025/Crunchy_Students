/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Level } from '../types';
import { TimelineChart } from './TimelineChart';
import { motion } from 'motion/react';

interface FailedScreenProps {
  stats: GameStats;
  level: Level;
  failReason: 'TIMEOUT' | 'STRESS_CRASH';
  onRestart: () => void;
}

export function FailedScreen({ stats, level, failReason, onRestart }: FailedScreenProps) {
  return (
    <div className="flex-1 flex flex-col justify-between p-5 text-black bg-red-50/50 select-none overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="text-center pt-1">
        <motion.span
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="inline-block bg-red-600 text-white text-[8px] font-mono tracking-wider px-2 py-0.5 border-2 border-black uppercase font-black shadow-[1.5px_1.5px_0px_#000]"
        >
          CRITICAL COLLAPSE / 抗压碎裂
        </motion.span>
        <h2 className="text-2xl font-display font-black tracking-tight text-red-600 leading-none mt-2">
          <span>挂科警告！</span>
        </h2>
      </div>

      {/* Failure Card */}
      <div className="my-2.5 border-4 border-black p-3.5 bg-white shadow-[5px_5px_0px_rgba(0,0,0,1)] relative rounded-none">
        <div className="absolute -top-3.5 left-4 bg-black text-white p-1.5 border border-black shadow-[1.5px_1.5px_0px_#ef4444]">
          <span className="text-red-500 animate-spin inline-block">💀</span>
        </div>
        <h4 className="text-xs font-mono font-black text-red-600 border-b border-stone-200 pb-1 mb-2 tracking-wider uppercase">☠ 崩溃因子</h4>
        <div className="text-xs font-mono space-y-2 text-zinc-700 leading-relaxed">
          <p><strong className="text-black">致命短板：</strong>
            {failReason === 'TIMEOUT'
              ? <span className="text-red-600 font-bold">DDL倒计时耗尽！</span>
              : <span className="text-red-600 font-bold">脑压超载！5秒未调和！</span>
            }
          </p>
          <p className="bg-red-50 text-red-700 p-2 italic text-[11px] border-l-4 border-red-600 leading-normal">
            {level.failureTragedy}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-dashed border-stone-200 text-[10px] font-mono">
          <div className="bg-stone-50 p-1.5 border border-stone-200"><span className="text-zinc-400 block text-[9px]">答错</span><span className="font-extrabold text-black">{stats.errorsMade}次</span></div>
          <div className="bg-stone-50 p-1.5 border border-stone-200"><span className="text-zinc-400 block text-[9px]">摸鱼</span><span className="font-extrabold text-black">{stats.slackedOffCount}次</span></div>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="mb-3">
        <TimelineChart timeline={stats.timeline} maxStressThreshold={stats.maxStress} />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <motion.button
          id="btn-play-level-fail-retry"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="w-full bg-black hover:bg-neutral-900 text-white font-display font-black py-3.5 px-4 text-xs tracking-widest shadow-[4px_4px_0px_#dc2626] rounded-none flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
        >
          <span>🔄 重整状态 · 一键续战</span>
        </motion.button>
      </div>

    </div>
  );
}
