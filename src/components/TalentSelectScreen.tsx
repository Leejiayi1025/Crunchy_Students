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
    <div className="flex-1 flex flex-col justify-between p-5 bg-stone-50 select-none">

      {/* Top Bar */}
      <div className="pb-2 border-b-2 border-black">
        <span className="text-[9px] tracking-widest font-mono text-neutral-500 block uppercase font-bold leading-none">[PHYSIQUE DIAGNOSIS / 人格特质干涉]</span>
        <h2 className="text-xl font-display font-black text-black mt-1 flex justify-between items-center">
          <span>抽取"脆皮天资"</span>
          <button
            id="btn-re-draw-talent"
            onClick={drawTalents}
            className="text-[9px] bg-red-100 text-red-600 font-mono px-2 py-0.5 border border-red-300 font-black animate-pulse rounded-sm cursor-pointer hover:bg-red-200 transition-colors"
          >
            🎲 随机
          </button>
        </h2>
      </div>

      {/* Talent Cards */}
      <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1">
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
              className={`w-full text-left p-3 border-2 transition-all duration-150 rounded-none relative flex gap-3 select-none cursor-pointer ${
                isSel
                  ? 'border-red-600 bg-white shadow-[4px_4px_0px_#000000] translate-x-0.5 translate-y-0.5'
                  : 'border-neutral-300 bg-white hover:bg-neutral-50 shadow-[2px_2px_0px_rgba(0,0,0,0.15)] hover:border-black'
              }`}
            >
              {isSel && <span className="absolute -top-2.5 right-2 bg-red-600 text-white font-mono text-[8px] font-black px-2 py-0.5 border border-black shadow-[1px_1px_0px_rgba(0,0,0,1)] uppercase">SELECTED</span>}
              <div className={`p-2 border-2 h-max flex items-center justify-center shrink-0 transition-colors duration-200 text-2xl ${
                isSel ? 'bg-black text-white border-black' : 'bg-stone-100 border-neutral-300'
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

      {/* Talent Details */}
      {currentSelectedTalent?.specialRule && (
        <div className="bg-neutral-100 border-2 border-black p-2.5 font-mono text-[10px] rounded-none mb-2">
          <p className="text-neutral-700 font-medium leading-relaxed italic">"{currentSelectedTalent.specialRule}"</p>
        </div>
      )}

    </div>
  );
}
