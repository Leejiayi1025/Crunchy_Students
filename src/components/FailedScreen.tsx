/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Level } from '../types';
import { TimelineChart } from './TimelineChart';
import { RefreshCw, Skull, CalendarDays, HeartCrack } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface FailedScreenProps {
  stats: GameStats;
  level: Level;
  failReason: 'TIMEOUT' | 'STRESS_CRASH';
  onRestart: () => void;
}

export function FailedScreen({ stats, level, failReason, onRestart }: FailedScreenProps) {
  const [funnySigh, setFunnySigh] = useState('');

  const sighs = [
    '“发际线悄然退守，绩点随风而散，明天还是去买一缸生发剂吧。”',
    '“室友开黑的大喊声传来，而你看着挂科单，默默捂上了被子…”',
    '“导导发在群里的@提醒红得刺眼，犹如高悬的达摩克利斯之剑。”',
    '“那一晚，微积分的微茫积分，再也凑不齐及格的起跑线…”',
    '“既然逆风无法化解，那就只能期待下学期重修再聚首了。”',
  ];

  useEffect(() => {
    const rIdx = Math.floor(Math.random() * sighs.length);
    setFunnySigh(sighs[rIdx]);
  }, []);

  return (
    <div className="flex flex-col h-full bg-black text-white p-5 border-4 border-red-600 rounded-lg overflow-y-auto custom-scrollbar select-none">
      
      {/* Failure Title Header */}
      <div className="text-center border-b border-neutral-900 pb-3 mb-4">
        <motion.div
          animate={{ scale: [0.95, 1.05, 0.95] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="inline-block bg-red-600 text-black text-[10px] font-black uppercase px-2 py-0.5 tracking-widest rounded-sm mb-1.5"
        >
          [ WARNING: SYSTEM CRASHED ]
        </motion.div>
        
        <h2 className="text-2xl font-black text-red-500 font-mono flex items-center justify-center gap-1.5 leading-none mt-1">
          <Skull className="w-6 h-6 text-red-600" />
          脆皮心态崩坏！
        </h2>
        
        <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
          STRESS THRESHOLD OVERLOAD // RETREAT FROM CLASSROOM
        </p>
      </div>

      {/* Failure dynamic story narration */}
      <div className="bg-neutral-950 border border-neutral-900 rounded p-4 mb-4">
        <div className="flex gap-2 text-red-400 font-bold items-center mb-2 text-xs">
          <HeartCrack className="w-4 h-4" />
          <span>惨烈宿命结局：</span>
        </div>
        
        <h3 className="text-sm font-black text-white font-mono">
          {failReason === 'TIMEOUT' ? '【DDL拖延症晚期 · 超时窒息】' : '【CPU当场烧灼 · 心态彻底融毁】'}
        </h3>
        
        <p className="text-xs text-neutral-400 font-serif leading-relaxed mt-2 pl-1">
          {level.failureTragedy}
        </p>

        <p className="text-[11px] text-neutral-500 font-serif italic mt-3 border-t border-neutral-900 pt-2.5">
          {funnySigh}
        </p>
      </div>

      {/* Real Struggle timeline chart */}
      <div className="mb-4">
        <TimelineChart timeline={stats.timeline} maxStressThreshold={stats.maxStress} />
      </div>

      {/* Numeric stats list */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
        <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded">
          <span className="text-neutral-500 text-[10px] block">阵亡前失误:</span>
          <span className="text-[#ef4444] font-black text-sm">{stats.errorsMade} 次</span>
        </div>
        <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded">
          <span className="text-neutral-500 text-[10px] block">崩溃前最高压力:</span>
          <span className="text-amber-500 font-black text-sm">{stats.maxStress}%</span>
        </div>
        <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded">
          <span className="text-neutral-500 text-[10px] block">摸草摆烂次数:</span>
          <span className="text-sky-400 font-black text-sm">{stats.slackedOffCount} 次</span>
        </div>
        <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded">
          <span className="text-neutral-500 text-[10px] block">导导突击成功率:</span>
          <span className="text-emerald-400 font-semibold text-sm">
            {stats.surpriseSuccesses}/{stats.triggeredSurprisesCount}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-auto pt-3 border-t border-neutral-800">
        <button
          id="btn-play-level-fail-retry"
          onClick={onRestart}
          className="w-full flex items-center justify-center gap-1.5 p-3 bg-red-600 border-2 border-red-600 text-black font-mono font-black text-xs hover:bg-black hover:text-red-500 hover:border-red-500 transition-all cursor-pointer shadow-[3px_3px_0px_#ffffff]"
        >
          <RefreshCw className="w-4 h-4 animate-spin-reverse" />
          重置心态，重振雄风 ➔
        </button>
      </div>

    </div>
  );
}
