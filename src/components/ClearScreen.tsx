/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats } from '../types';
import { DIFFICULTY_TEXT, LEVELS, SUCCESS_TITLES } from '../data';
import { TimelineChart } from './TimelineChart';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';

interface ClearScreenProps {
  stats: GameStats;
  isLastLevel: boolean;
  onRestart: () => void;
  onNextLevel: () => void;
  onHome: () => void;
}

export function ClearScreen({ stats, isLastLevel, onRestart, onNextLevel, onHome }: ClearScreenProps) {
  const [funnyTitle, setFunnyTitle] = useState('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

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

  const level = LEVELS.find((l) => l.id === stats.levelId);

  const analyze = () => {
    const t = Math.max(stats.timeUsed, 1);
    const errsPerMin = Math.round((stats.errorsMade / (t / 60)) * 10) / 10;
    const hintPerMin = Math.round((stats.hintsUsed / (t / 60)) * 10) / 10;
    const timeline = stats.timeline.length > 0 ? stats.timeline : [{ timeElapsed: 0, stress: 0 }];
    const avgStress = Math.round(timeline.reduce((acc, r) => acc + r.stress, 0) / timeline.length);
    const highStressSecs = timeline.filter((r) => r.stress >= 70).length;
    const highStressPct = Math.round((highStressSecs / timeline.length) * 100);
    const surpriseRate =
      stats.triggeredSurprisesCount > 0 ? Math.round((stats.surpriseSuccesses / stats.triggeredSurprisesCount) * 100) : 0;

    const lines: string[] = [];
    lines.push(`总用时 ${stats.timeUsed}s，剩余时间 ${stats.timeRemainingBeforePenalty}s，星级 ${stats.stars}/3。`);
    lines.push(`平均压力 ${avgStress}%，峰值压力 ${stats.maxStress}%，高压(≥70%)占比 ${highStressPct}%。`);
    lines.push(`答错 ${stats.errorsMade} 次（约 ${errsPerMin}/分钟），提示 ${stats.hintsUsed} 次（约 ${hintPerMin}/分钟）。`);
    lines.push(`摸鱼 ${stats.slackedOffCount} 次，突袭应对 ${stats.surpriseSuccesses}/${stats.triggeredSurprisesCount}${stats.triggeredSurprisesCount > 0 ? `（${surpriseRate}%）` : ''}。`);

    const suggestions: string[] = [];
    if (stats.errorsMade >= 5) suggestions.push('失误偏多：建议先稳再快，避免连错触发压力连锁。');
    if (stats.maxStress >= 85 || highStressPct >= 35) suggestions.push('高压时间偏长：建议更早使用“摸鱼”把压力压回安全区。');
    if (stats.hintsUsed >= 3) suggestions.push('提示使用偏多：建议优先观察规律/拆小目标，减少依赖提示扣时。');
    if (stats.triggeredSurprisesCount >= 2 && surpriseRate < 60) suggestions.push('突袭应对偏弱：看到弹窗先读题再点，别凭直觉乱选。');
    if (suggestions.length === 0) suggestions.push('状态很稳：继续保持节奏，下一关可以尝试更快的完成时间。');

    return { lines, suggestions, avgStress, highStressPct, surpriseRate };
  };

  const exportSummary = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const a = analyze();
      const title = level ? `第${level.id}关：${level.title}` : `第${stats.levelId}关`;
      const resultTitle = '逆风突围成功';
      const w = 1080;
      const h = 1600;
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const canvas = document.createElement('canvas');
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);

      const bg = '#faf8f5';
      const ink = '#0f172a';
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(60, 60, w - 120, h - 120);
      ctx.fillStyle = bg;
      ctx.fillRect(72, 72, w - 144, h - 144);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(72, 72, w - 144, 84);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '900 32px Inter, Arial';
      ctx.fillText('CRISP OS · REPORT', 96, 126);

      ctx.fillStyle = ink;
      ctx.font = '900 44px "Space Grotesk", Inter, Arial';
      ctx.fillText(resultTitle, 96, 230);

      ctx.font = '800 32px Inter, Arial';
      ctx.fillText(title, 96, 280);

      ctx.font = '700 28px Inter, Arial';
      ctx.fillStyle = '#b45309';
      ctx.fillText(`⭐ ${stats.stars}/3`, 96, 332);
      ctx.fillStyle = ink;
      ctx.fillText(`答错 ${stats.errorsMade}  ·  提示 ${stats.hintsUsed}  ·  摸鱼 ${stats.slackedOffCount}`, 220, 332);

      const chartX = 96;
      const chartY = 380;
      const chartW = w - 192;
      const chartH = 320;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(chartX, chartY, chartW, chartH);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.strokeRect(chartX, chartY, chartW, chartH);

      const timeline = stats.timeline.length > 0 ? stats.timeline : [{ timeElapsed: 0, stress: 0 }];
      const maxT = Math.max(...timeline.map((r) => r.timeElapsed), 1);
      const maxS = 100;
      const getX = (t: number) => chartX + (t / maxT) * chartW;
      const getY = (s: number) => chartY + chartH - (s / maxS) * chartH;

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 6;
      ctx.beginPath();
      timeline.forEach((r, i) => {
        const x = getX(r.timeElapsed);
        const y = getY(r.stress);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      ctx.fillStyle = ink;
      ctx.font = '800 28px Inter, Arial';
      ctx.fillText('数据总结', 96, 770);

      ctx.font = '600 24px Inter, Arial';
      ctx.fillStyle = '#334155';
      const block = [...a.lines, '建议：', ...a.suggestions.map((s) => `- ${s}`)];
      let y = 820;
      for (const line of block) {
        ctx.fillText(line, 96, y);
        y += 36;
      }

      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `level-${stats.levelId}-report.png`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const analysis = analyze();

  return (
    <div className="flex-1 flex flex-col p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-black bg-stone-50 select-none overflow-y-auto custom-scrollbar gap-2">

      {/* Header */}
      <div className="text-center pt-1">
        <span className="inline-block bg-neutral-900 text-yellow-400 text-[8px] font-mono px-2 py-0.5 uppercase tracking-widest border border-black mb-1 shadow-[1px_1px_0px_#000]">[EXAMINATION REPORT]</span>
        <h2 className="text-xl font-display font-black mt-1 leading-none flex flex-col">
          <span className="text-emerald-700 font-extrabold text-xl">🎓 逆风突围成功！</span>
        </h2>
        <div className="mt-1 text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">
          {level ? level.title : `STAGE 0${stats.levelId}`} · {DIFFICULTY_TEXT[stats.difficulty]}
        </div>
      </div>

      {/* Stats Card */}
      <div className="my-1.5 border-[3px] border-black p-3 bg-white shadow-[4px_4px_0px_#000000] relative space-y-2.5 rounded-none">
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
        <p className="text-[11px] text-yellow-600 font-bold font-mono text-center">{getStarText(stats.stars)} · {funnyTitle}</p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
          <div className="border-2 border-black p-1.5 bg-stone-50"><span className="text-[8px] text-zinc-400 block font-bold">用时</span><span className="font-bold text-black text-xs">{stats.timeUsed}s</span></div>
          <div className="border-2 border-black p-1.5 bg-stone-50"><span className="text-[8px] text-zinc-400 block font-bold">剩余</span><span className="font-bold text-black text-xs">{stats.timeRemainingBeforePenalty}s</span></div>
          <div className="border-2 border-black p-1.5 bg-stone-50"><span className="text-[8px] text-zinc-400 block font-bold">答错</span><span className="font-bold text-black text-xs">{stats.errorsMade}</span></div>
          <div className="border-2 border-black p-1.5 bg-stone-50"><span className="text-[8px] text-zinc-400 block font-bold">峰压</span><span className={`font-black text-xs ${stats.maxStress >= 75 ? 'text-red-600' : 'text-stone-900'}`}>{stats.maxStress}%</span></div>
        </div>
      </div>

      <div className="mb-2 border-[3px] border-black p-3 bg-white shadow-[4px_4px_0px_#000000] rounded-none">
        <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
          <div className="text-xs font-mono font-black tracking-widest uppercase">DATA SUMMARY</div>
          <button
            type="button"
            onClick={exportSummary}
            disabled={isExporting}
            className={`text-[10px] font-mono font-black px-2 py-1 border-2 border-black rounded-none transition-all ${
              isExporting ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer'
            }`}
          >
            导出图片
          </button>
        </div>
        <div className="text-[10px] font-mono text-zinc-700 leading-relaxed">
          {analysis.lines.slice(0, 2).map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="mb-2">
        <TimelineChart timeline={stats.timeline} maxStressThreshold={stats.maxStress} />
      </div>

      <div className="sticky bottom-0 left-0 right-0 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-stone-50 border-t-2 border-black">
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            id="btn-play-level-home"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onHome}
            className="bg-stone-100 hover:bg-stone-200 text-black border-2 border-black font-display font-black py-2.5 px-2 text-xs tracking-wider rounded-none shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
          >
            <span>🏠 首页</span>
          </motion.button>
          <motion.button
            id="btn-play-level-retry"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRestart}
            className="bg-black hover:bg-neutral-900 text-white border-2 border-black font-display font-black py-2.5 px-2 text-xs tracking-wider rounded-none shadow-[3px_3px_0px_#10b981] flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none transition-all"
          >
            <span>🔄 重来</span>
          </motion.button>
          <motion.button
            id="btn-play-level-next"
            whileHover={{ scale: isLastLevel ? 1 : 1.01 }}
            whileTap={{ scale: isLastLevel ? 1 : 0.98 }}
            disabled={isLastLevel}
            onClick={onNextLevel}
            className={`border-2 border-black font-display font-black py-2.5 px-2 text-xs tracking-wider rounded-none shadow-[3px_3px_0px_#000000] flex items-center justify-center gap-1.5 active:translate-y-0.5 active:shadow-none transition-all ${
              isLastLevel
                ? 'bg-stone-100 text-stone-400 border-stone-300 shadow-none cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
            }`}
          >
            <span>🚀 下一关</span>
          </motion.button>
        </div>
      </div>

    </div>
  );
}
