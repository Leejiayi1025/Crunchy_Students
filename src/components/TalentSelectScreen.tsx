/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Talent } from '../types';
import { TALENTS } from '../data';

interface TalentSelectProps {
  onSelect: (talent: Talent) => void;
}

export function TalentSelectScreen({ onSelect }: TalentSelectProps) {
  const [selectedId, setSelectedId] = useState<string>('');
  const [drawnTalents, setDrawnTalents] = useState<Talent[]>([]);

  const drawTalents = () => {
    const shuffled = [...TALENTS].sort(() => 0.5 - Math.random());
    const drawn = shuffled.slice(0, 3);
    setDrawnTalents(drawn);
    setSelectedId(drawn[0].id);
  };

  useEffect(() => {
    drawTalents();
  }, []);

  const currentSelectedTalent = drawnTalents.find((t) => t.id === selectedId);

  return (
    <div className="flex-1 flex flex-col justify-between p-5 bg-[#f9f9f9] select-none">

      {/* Top Bar */}
      <div className="pb-2 border-b-4 border-black">
        <div className="flex justify-between items-end mb-1">
          <span className="text-[9px] tracking-widest font-mono text-neutral-500 block uppercase font-bold leading-none">[PHYSIQUE DIAGNOSIS / 人格特质干涉]</span>
          <button
            id="btn-re-draw-talent"
            onClick={drawTalents}
            className="bg-white text-black font-mono px-3 py-1 border-2 border-black font-black cursor-pointer hover:bg-neutral-100 transition-colors text-[10px] flex items-center gap-1 shadow-[2px_2px_0px_0px_black] active:translate-y-0.5 active:shadow-none"
          >
            🎲 随机
          </button>
        </div>
        <h2 className="text-xl font-display font-black text-black mt-1">抽取"脆皮天资"</h2>
      </div>

      {/* Talent Cards */}
      <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
        {drawnTalents.map((talent) => {
          const isSel = talent.id === selectedId;
          return (
            <motion.div
              key={talent.id}
              onClick={() => {
                setSelectedId(talent.id);
                onSelect(talent);
              }}
              whileHover={{ scale: isSel ? 1 : 1.01 }}
              className={`w-full text-left p-4 transition-all duration-150 rounded-none relative flex gap-3 select-none cursor-pointer ${
                isSel
                  ? 'manga-panel-active bg-white'
                  : 'manga-panel bg-white hover:bg-neutral-50'
              }`}
            >
              {isSel && <span className="absolute -top-3 right-3 bg-red-600 text-white font-mono text-[8px] font-black px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_black] uppercase z-10">已选择</span>}
              <div className={`p-2 border-2 border-black h-max flex items-center justify-center shrink-0 transition-colors duration-200 text-2xl w-12 h-12 ${
                isSel ? 'bg-black text-white' : 'bg-neutral-100 hatching'
              }`}>
                {talent.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-black text-sm text-black tracking-tight mb-1">{talent.name}</h4>
                <div className="text-[11px] font-mono leading-tight">
                  <span className="text-emerald-700 font-bold">[加护]</span>{' '}
                  <span className="text-stone-700 font-medium">{talent.bonusText}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Talent Details - Manga Quote Style */}
      {currentSelectedTalent?.specialRule && (
        <div className="manga-panel bg-white p-3 font-mono text-[10px] mb-2 relative">
          <div className="halftone absolute inset-0 pointer-events-none"></div>
          <p className="text-neutral-700 font-medium leading-relaxed italic relative z-10">"{currentSelectedTalent.specialRule}"</p>
        </div>
      )}

    </div>
  );
}
