/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Level, Talent } from '../types';
import { Skull, AlertTriangle, Play, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface LevelIntroProps {
  level: Level;
  talent: Talent | null;
  onEnterGame: () => void;
}

export function LevelIntroScreen({ level, talent, onEnterGame }: LevelIntroProps) {
  return (
    <div className="flex flex-col justify-between h-full bg-black text-white p-5 border-4 border-white rounded-lg select-none">
      
      {/* Target Level Marker */}
      <div className="border-b border-neutral-800 pb-3">
        <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-[#ef4444]">
          <span>[ STAGE_MISSION _ 0{level.id} ]</span>
          <span className="bg-red-950 text-red-400 border border-red-900 px-2 py-0.5 rounded-sm font-bold animate-pulse">
            CRITICAL 危
          </span>
        </div>
        <h2 className="text-2xl font-black text-white mt-2 leading-tight">
          {level.title}
        </h2>
      </div>

      {/* Narrative Section - The Collegiate Crisis */}
      <div className="my-auto py-4 space-y-4">
        
        {/* Scenario card */}
        <div className="relative bg-neutral-950 p-4 border-2 border-neutral-800 rounded">
          <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-2 bg-red-600 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
            CAMPUS EMERGENCY
          </div>
          <div className="flex items-start gap-2.5">
            <span className="text-2xl">🔥</span>
            <div>
              <h4 className="text-xs font-black text-neutral-300 font-mono">校园逆境实事剧情:</h4>
              <p className="text-[12px] text-neutral-400 font-serif leading-loose mt-1.5 italic">
                “ {level.scenario} ”
              </p>
            </div>
          </div>
        </div>

        {/* Selected Talent Synergy Status */}
        {talent && (
          <div className="bg-[#111] p-3.5 border border-white/20 rounded flex items-center gap-3">
            <div className="text-3xl bg-neutral-950 w-12 h-12 flex items-center justify-center border-2 border-neutral-800 rounded">
              {talent.emoji}
            </div>
            <div>
              <h5 className="text-xs font-bold text-white font-mono flex items-center gap-1">
                已装载脆皮属性: <span className="text-red-500 font-black">{talent.name}</span>
              </h5>
              <p className="text-[10px] text-neutral-400 mt-1 font-mono leading-relaxed max-w-xs">
                属性调校: {talent.bonusText}
              </p>
            </div>
          </div>
        )}

        {/* Puzzle mechanism manual */}
        <div className="bg-neutral-950 p-4 border border-neutral-900 rounded space-y-2">
          <div className="flex items-center gap-1 text-xs font-bold text-white font-mono uppercase">
            <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
            <span>玩法说明</span>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed font-sans pl-1">
            {level.instructions}
          </p>
          {/* Game rules bullets */}
          <div className="mt-2 space-y-1 pl-1">
            {level.rules.map((rule, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[11px] text-neutral-400 font-mono">
                <span className="text-red-500 shrink-0">▸</span>
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Threat evaluation & CTA */}
      <div className="border-t border-neutral-800 pt-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <span>基础抗压时长: {level.baseTime}秒</span>
          <span>高压风向: 北风4级 (STRESS LEVEL: HIGH)</span>
        </div>

        <motion.button
          id="btn-level-intro-enter"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onEnterGame}
          className="w-full bg-[#e11d48] text-white font-black text-center py-3.5 border-2 border-[#e11d48] hover:bg-black hover:text-red-500 transition-all cursor-pointer shadow-[3px_3px_0px_#ffffff]"
        >
          进入高压脑暴区 / START CLOCK ➔
        </motion.button>
      </div>

    </div>
  );
}
