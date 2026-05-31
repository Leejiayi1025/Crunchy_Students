/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Level, Talent } from '../types';
import { motion } from 'motion/react';

interface LevelIntroProps {
  level: Level;
  talent: Talent | null;
  onEnterGame: () => void;
  onBack: () => void;
}

export function LevelIntroScreen({ level, talent, onEnterGame, onBack }: LevelIntroProps) {
  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-stone-50 select-none">

      {/* Header */}
      <div className="border-b-[3px] border-black pb-2">
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
      <div className="flex-1 py-3 space-y-3 overflow-y-auto max-h-[460px] my-1 pr-1">

        {/* Scenario */}
        <div className="bg-amber-50/75 border-2 border-black p-3 relative shadow-[4px_4px_0px_rgba(0,0,0,1)] rounded-none">
          <span className="absolute -top-2.5 left-3 bg-black text-white text-[8px] font-mono px-1.5 uppercase font-black">情境</span>
          <p className="text-[11px] font-mono text-neutral-800 leading-relaxed italic">"{level.scenario}"</p>
        </div>

        {/* Rules */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-neutral-500 uppercase font-black tracking-wider flex items-center gap-1"><span>■</span><span>核心规则</span></div>
          <div className="border-2 border-black p-2.5 bg-white space-y-2 rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex gap-2 text-[11px] leading-relaxed select-none">
              <span className="bg-black text-white text-[9px] font-mono font-black h-4 w-4 shrink-0 flex items-center justify-center border border-black">0</span>
              <span className="text-stone-800 font-bold">{level.instructions}</span>
            </div>
            {level.rules.map((rule, idx) => (
              <div key={idx} className="flex gap-2 text-[11px] leading-relaxed select-none">
                <span className="bg-black text-white text-[9px] font-mono font-black h-4 w-4 shrink-0 flex items-center justify-center border border-black">{idx+1}</span>
                <span className="text-stone-800 font-bold">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Talent Info */}
        {talent && (
          <div className="border-2 border-black p-3 bg-neutral-100/80 font-mono text-[10px] rounded-none">
            <div className="text-[11px] font-black text-black border-b border-stone-300 pb-1 mb-2 flex items-center justify-between">
              <span>👤 天赋加护</span>
              <span className="text-[8px] bg-black text-white font-mono px-1 leading-none font-bold uppercase">PHYSICS</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-start gap-1 leading-tight"><span className="text-emerald-700 font-black shrink-0">[加护]</span><span className="text-neutral-700 font-medium">{talent.bonusText}</span></div>
              <div className="pt-1.5 border-t border-dashed border-stone-300 grid grid-cols-2 gap-1.5 text-[10px] font-bold text-zinc-600">
                <span className="flex items-center gap-1">⏳ 时限: <strong className="text-black text-xs font-mono">{level.baseTime}s</strong></span>
                <span className="flex items-center gap-1">☢️ 脑压: <strong className="text-black text-xs font-mono">{talent.initialStress}%</strong></span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CTA */}
      <div className="space-y-2 pt-2 border-t border-dashed border-stone-300">
        <motion.button
          id="btn-level-intro-enter"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnterGame}
          className="w-full bg-black hover:bg-neutral-900 text-white font-display font-black py-3.5 px-4 text-xs tracking-widest shadow-[4px_4px_0px_#22c55e] rounded-none flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
        >
          <span>🚀 进入抗压测验</span>
          <span className="text-emerald-400 animate-pulse">→</span>
        </motion.button>
        <button
          onClick={onBack}
          className="w-full bg-stone-100 hover:bg-stone-200 border border-black font-semibold text-black py-2 px-4 text-[10px] font-mono tracking-wider rounded-none cursor-pointer transition-colors"
        >
          返回考场选单
        </button>
      </div>

    </div>
  );
}
