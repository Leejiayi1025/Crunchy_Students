/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Level } from '../types';
import { TimelineChart } from './TimelineChart';
import { motion } from 'motion/react';
import { useState } from 'react';
import { DIFFICULTY_TEXT } from '../data';

interface FailedScreenProps {
  stats: GameStats;
  level: Level;
  failReason: 'TIMEOUT' | 'STRESS_CRASH';
  onRestart: () => void;
  onSkip: () => void;
  onHome: () => void;
}

export function FailedScreen({ stats, level, failReason, onRestart, onSkip, onHome }: FailedScreenProps) {
  const [isExporting, setIsExporting] = useState<boolean>(false);

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
    lines.push(`总用时 ${stats.timeUsed}s，答错 ${stats.errorsMade} 次（约 ${errsPerMin}/分钟），提示 ${stats.hintsUsed} 次（约 ${hintPerMin}/分钟）。`);
    lines.push(`平均压力 ${avgStress}%，峰值压力 ${stats.maxStress}%，高压(≥70%)占比 ${highStressPct}%。`);
    lines.push(`摸鱼 ${stats.slackedOffCount} 次，突袭应对 ${stats.surpriseSuccesses}/${stats.triggeredSurprisesCount}${stats.triggeredSurprisesCount > 0 ? `（${surpriseRate}%）` : ''}。`);

    const suggestions: string[] = [];
    if (failReason === 'TIMEOUT') suggestions.push('超时失败：建议减少试错，先看规律再点，必要时用提示锁定突破口。');
    if (failReason === 'STRESS_CRASH') suggestions.push('压力崩盘：建议更早“摸鱼”，把压力压回安全区再继续。');
    if (stats.errorsMade >= 5) suggestions.push('失误偏多：建议把每一步拆小，避免连错导致扣时+增压叠加。');
    if (stats.hintsUsed >= 3) suggestions.push('提示使用偏多：建议优先理解机制，提示留作关键时刻。');
    if (stats.triggeredSurprisesCount >= 2 && surpriseRate < 60) suggestions.push('突袭应对偏弱：先读题再点，不要凭感觉快速乱选。');
    if (suggestions.length === 0) suggestions.push('整体不错：复盘关键失误点，重来一遍很容易过。');

    return { lines, suggestions, avgStress, highStressPct, surpriseRate };
  };

  const exportSummary = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const a = analyze();
      const title = `第${level.id}关：${level.title}`;
      const resultTitle = failReason === 'TIMEOUT' ? '超时失败' : '压力崩盘';
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
      ctx.fillStyle = '#b91c1c';
      ctx.fillText(`峰值压力 ${stats.maxStress}%`, 96, 332);
      ctx.fillStyle = ink;
      ctx.fillText(`答错 ${stats.errorsMade}  ·  提示 ${stats.hintsUsed}  ·  摸鱼 ${stats.slackedOffCount}`, 320, 332);

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
    <div className="flex-1 flex flex-col p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-black bg-[#f9f9f9] select-none overflow-y-auto custom-scrollbar gap-2">

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
        <div className="mt-1 text-[10px] font-mono font-black tracking-widest text-zinc-500 uppercase">
          {level.title} · {DIFFICULTY_TEXT[stats.difficulty]}
        </div>
      </div>

      {/* Failure Card - Manga Panel */}
      <div className="my-1.5 manga-panel-active p-3 bg-white relative">
        <div className="hatching-dense absolute inset-0 pointer-events-none"></div>
        <div className="absolute -top-3.5 left-4 bg-black text-white p-1.5 border-2 border-black shadow-[2px_2px_0px_0px_#ef4444] z-10">
          <span className="text-red-500 animate-spin inline-block">💀</span>
        </div>
        <h4 className="text-xs font-mono font-black text-red-600 border-b-2 border-black pb-1 mb-2 tracking-wider uppercase relative z-10">☠ 崩溃因子</h4>
        <div className="text-xs font-mono space-y-2 text-zinc-700 leading-relaxed relative z-10">
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
        <div className="grid grid-cols-2 gap-1.5 mt-3 pt-2 border-t border-dashed border-stone-200 text-[10px] font-mono relative z-10">
          <div className="bg-neutral-50 p-1.5 border-2 border-black"><span className="text-zinc-400 block text-[9px]">用时</span><span className="font-extrabold text-black">{stats.timeUsed}s</span></div>
          <div className="bg-neutral-50 p-1.5 border-2 border-black"><span className="text-zinc-400 block text-[9px]">答错</span><span className="font-extrabold text-black">{stats.errorsMade}</span></div>
          <div className="bg-neutral-50 p-1.5 border-2 border-black"><span className="text-zinc-400 block text-[9px]">峰压</span><span className="font-extrabold text-black">{stats.maxStress}%</span></div>
          <div className="bg-neutral-50 p-1.5 border-2 border-black"><span className="text-zinc-400 block text-[9px]">提示</span><span className="font-extrabold text-black">{stats.hintsUsed}</span></div>
        </div>
      </div>

      <div className="mb-2 manga-panel p-3 bg-white">
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

      <div className="sticky bottom-0 left-0 right-0 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f9f9f9] border-t-4 border-black">
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            id="btn-play-level-home"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.95 }}
            onClick={onHome}
            className="bg-neutral-100 hover:bg-neutral-200 text-black font-display font-black py-2.5 px-2 text-xs tracking-wider manga-btn cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🏠 首页</span>
          </motion.button>
          <motion.button
            id="btn-play-level-fail-retry"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="bg-black hover:bg-neutral-900 text-white font-display font-black py-2.5 px-2 text-xs tracking-wider cursor-pointer flex items-center justify-center gap-1.5 border-3 border-black rounded-none"
            style={{boxShadow:'4px 4px 0px 0px #dc2626'}}
          >
            <span>🔄 重来</span>
          </motion.button>
          <motion.button
            id="btn-play-level-fail-next"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSkip}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-display font-black py-2.5 px-2 text-xs tracking-wider manga-btn cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>🚀 下一关</span>
          </motion.button>
        </div>
      </div>

    </div>
  );
}
