/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Talent } from '../types';
import { TALENTS } from '../data';
import { Sparkles, ShoppingBag, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';

interface TalentSelectProps {
  onSelect: (talent: Talent) => void;
}

export function TalentSelectScreen({ onSelect }: TalentSelectProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [drawnTalents, setDrawnTalents] = useState<Talent[]>([]);

  // Function to draw 3 random talents from TALENTS pool
  const drawTalents = () => {
    const shuffled = [...TALENTS].sort(() => 0.5 - Math.random());
    const drawn = shuffled.slice(0, 3);
    setDrawnTalents(drawn);
    setSelectedId(drawn[0].id); // select first as default
  };

  useEffect(() => {
    drawTalents();
  }, []);

  const handleDrawNew = () => {
    drawTalents();
  };

  const currentSelectedTalent = drawnTalents.find((t) => t.id === selectedId);

  return (
    <div className="flex flex-col justify-between h-full bg-black text-white p-5 border-4 border-white rounded-lg select-none">
      
      {/* Top Bar */}
      <div>
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <span className="text-[10px] font-mono tracking-widest text-[#ef4444]">
            [ STEP_02: INJECT FRAGILE DNA ]
          </span>
          <button
            id="btn-re-draw-talent"
            onClick={handleDrawNew}
            className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono hover:text-white transition-colors cursor-pointer border border-neutral-800 px-2 py-1 rounded"
          >
            <RefreshCw className="w-3 h-3 hover:rotate-185 transition-transform duration-500" />
            重洗牌 (Draw Again)
          </button>
        </div>

        <h2 className="text-xl font-black text-neutral-100 flex items-center gap-1.5 leading-tight">
          抽签你的「脆皮大学生」体质
        </h2>
        <p className="text-xs text-neutral-400 font-sans mt-1.5 leading-relaxed">
          大学生体虚不重要，重要的是心态！不同的脆皮体质将深刻绑定本场游戏的自平衡抗压表现与特殊规则：
        </p>
      </div>

      {/* Talent Cards Grid/Stack */}
      <div className="my-auto py-4 space-y-3">
        {drawnTalents.map((talent) => {
          const isSelected = talent.id === selectedId;

          return (
            <motion.div
              key={talent.id}
              onClick={() => setSelectedId(talent.id)}
              whileHover={{ scale: isSelected ? 1 : 1.01 }}
              className={`relative flex items-start gap-3.5 p-3.5 rounded border-2 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-neutral-900 border-white shadow-[3px_3px_0px_#ef4444]'
                  : 'bg-black border-neutral-800 hover:border-neutral-500 hover:bg-neutral-950'
              }`}
            >
              {/* Left Column Emoji/Aura */}
              <div
                className={`flex items-center justify-center w-11 h-11 text-2xl rounded border-2 p-1 ${
                  isSelected ? 'bg-black border-red-500' : 'bg-neutral-950 border-neutral-800'
                }`}
              >
                {talent.emoji}
              </div>

              {/* Right content info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-[14px] font-black text-white font-mono flex items-center gap-1">
                    {talent.name}
                  </h3>
                  {isSelected && (
                    <span className="text-[9px] bg-red-600 text-black font-black uppercase px-1 py-0.5 rounded-sm">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 font-serif leading-relaxed mt-1">
                  {talent.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Talent Details & Confirm Panel */}
      {currentSelectedTalent && (
        <div className="bg-neutral-950 border-2 border-dashed border-neutral-800 rounded p-4 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>【体质影响 · 逆向博弈加成】</span>
          </div>
          <p className="text-xs text-neutral-200 font-mono leading-relaxed bg-black/50 p-2 border border-neutral-900 rounded">
            {currentSelectedTalent.bonusText}
          </p>
          <div className="mt-2 text-[10px] text-neutral-500 italic flex items-center gap-1">
            <span>规则注：{currentSelectedTalent.specialRule}</span>
          </div>
        </div>
      )}

      {/* Bottom Lock In */}
      <div className="pt-3 border-t border-neutral-800 flex flex-col gap-2">
        <button
          id="btn-confirm-talent"
          onClick={() => currentSelectedTalent && onSelect(currentSelectedTalent)}
          className="w-full bg-white text-black font-black text-sm tracking-widest py-3 border-2 border-white hover:bg-neutral-900 hover:text-white transition-all cursor-pointer shadow-[3px_3px_0px_rgba(239, 68, 68, 0.9)]"
        >
          激活宿命体质 ➔
        </button>
      </div>

    </div>
  );
}
