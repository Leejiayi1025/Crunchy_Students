/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats } from '../types';
import { SUCCESS_TITLES } from '../data';
import { TimelineChart } from './TimelineChart';
import { Star, RefreshCw, Trophy, ArrowRight, Award } from 'lucide-react';
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
    // Pick a funny title randomly or depending on maximum stress
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

  // Star description
  const getStarText = (stars: number) => {
    switch (stars) {
      case 3:
        return '完美级逆风掌控！高压下安然自若。';
      case 2:
        return '优秀自救人！虽然慌张但最终逆袭。';
      default:
        return '勉强过关！发际线再次向后推移一厘米。';
    }
  };

  return (
    <div className="flex flex-col h-full bg-black text-white p-5 border-4 border-white rounded-lg overflow-y-auto custom-scrollbar select-none">
      
      {/* Top Victory Header */}
      <div className="text-center border-b border-neutral-800 pb-3 mb-4">
        <motion.div
          initial={{ scale: 0.5, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 10 }}
          className="inline-block bg-yellow-500 text-black text-xs font-black uppercase px-2 py-1 tracking-widest rounded-sm mb-1"
        >
          MISSION FLIP COMPLETE ➔ 逆风翻盘成功
        </motion.div>
        <h2 className="text-2xl font-black text-white font-mono flex items-center justify-center gap-1.5 leading-none mt-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          抗压解谜通关！
        </h2>
        <p className="text-neutral-400 text-xs mt-1 font-mono">
          STRESS FLIPPED SUCCESSFULLY // DATA UPLOADED
        </p>
      </div>

      {/* Star Evaluation */}
      <div className="flex flex-col items-center py-3 bg-neutral-950 border border-neutral-800 rounded p-4 mb-4">
        <div className="flex gap-2">
          {[1, 2, 3].map((starIdx) => {
            const isFilled = starIdx <= stats.stars;
            return (
              <motion.div
                key={starIdx}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: starIdx * 0.15 }}
              >
                <Star
                  className={`w-10 h-10 ${
                    isFilled ? 'text-yellow-500 fill-yellow-500' : 'text-neutral-800 fill-neutral-900'
                  }`}
                />
              </motion.div>
            );
          })}
        </div>
        <p className="text-xs text-yellow-500 font-bold font-mono mt-2.5">
          {getStarText(stats.stars)}
        </p>

        {/* Dynamic collegiate honors */}
        <div className="mt-3 text-center border-t border-neutral-900 pt-2.5 w-full">
          <span className="text-[10px] text-neutral-500 block uppercase font-mono">获得高校认可认证：</span>
          <span className="text-sm font-black text-neutral-200 mt-1 block flex items-center justify-center gap-1">
            <Award className="w-4 h-4 text-emerald-400" /> {funnyTitle}
          </span>
        </div>
      </div>

      {/* Real Struggle timeline chart */}
      <div className="mb-4">
        <TimelineChart timeline={stats.timeline} maxStressThreshold={stats.maxStress} />
      </div>

      {/* Numeric stats list */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
        <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded">
          <span className="text-neutral-500 text-[10px] block">作答失误数:</span>
          <span className="text-[#ef4444] font-black text-sm">{stats.errorsMade} 次</span>
        </div>
        <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded">
          <span className="text-neutral-500 text-[10px] block">极限最高逆风值:</span>
          <span className="text-amber-500 font-black text-sm">{stats.maxStress}%</span>
        </div>
        <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded">
          <span className="text-neutral-500 text-[10px] block">主动摸鱼减压:</span>
          <span className="text-sky-400 font-black text-sm">{stats.slackedOffCount} 次</span>
        </div>
        <div className="bg-neutral-950 p-2.5 border border-neutral-900 rounded">
          <span className="text-neutral-500 text-[10px] block">化解导导突袭:</span>
          <span className="text-emerald-400 font-black text-sm">
            {stats.surpriseSuccesses}/{stats.triggeredSurprisesCount}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-auto pt-3 border-t border-neutral-800 grid grid-cols-2 gap-3">
        <button
          id="btn-play-level-retry"
          onClick={onRestart}
          className="flex items-center justify-center gap-1.5 p-3 border-2 border-white text-white font-mono font-bold text-xs hover:bg-neutral-900 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          重刷此局
        </button>

        {!isLastLevel ? (
          <button
            id="btn-play-level-next"
            onClick={onNextLevel}
            className="flex items-center justify-center gap-1.5 p-3 bg-white text-black font-mono font-bold text-xs hover:bg-neutral-900 hover:text-white hover:border-neutral-500 transition-colors cursor-pointer border-2 border-white"
          >
            下一关卡
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            id="btn-play-level-final-reset"
            onClick={onRestart}
            className="flex items-center justify-center gap-1.5 p-3 bg-red-600 border-2 border-red-600 text-black font-mono font-black text-xs hover:bg-black hover:text-red-500 hover:border-red-500 transition-colors cursor-pointer"
          >
            完美通关！重头开辟
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
}
