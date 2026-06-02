/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { GameStats, Talent, Difficulty } from '../types';
import { LEVELS, DIFFICULTY_TEXT, SCENES } from '../data';
import { getScoreGrade, PASSING_SCORE } from '../utils';

interface SemesterEndScreenProps {
  semesterStats: GameStats[];
  talent: Talent | null;
  difficulty: Difficulty;
  onPlayBonus: () => void;
  onHome: () => void;
}

export function SemesterEndScreen({ semesterStats, talent, difficulty, onPlayBonus, onHome }: SemesterEndScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const scene = SCENES[0]; // 场景一
  const totalStars = semesterStats.reduce((sum, s) => sum + s.stars, 0);
  const maxStars = semesterStats.length * 3;
  const totalTime = semesterStats.reduce((sum, s) => sum + s.timeUsed, 0);
  const totalErrors = semesterStats.reduce((sum, s) => sum + s.errorsMade, 0);
  const maxStress = Math.max(...semesterStats.map((s) => s.maxStress));

  // 平均分计算
  const avgScore = semesterStats.length > 0
    ? Math.round(semesterStats.reduce((sum, s) => sum + s.score, 0) / semesterStats.length)
    : 0;
  const grade = getScoreGrade(avgScore);
  const isPassed = avgScore >= PASSING_SCORE;

  const exportTranscript = async () => {
    setIsExporting(true);
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 800;
      const H = 1200;
      canvas.width = W;
      canvas.height = H;

      // Background
      ctx.fillStyle = '#f9f9f9';
      ctx.fillRect(0, 0, W, H);

      // Border
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, W - 40, H - 40);

      // Header
      ctx.fillStyle = '#000';
      ctx.fillRect(20, 20, W - 40, 100);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px "Space Grotesk", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎓 第一学期 · 期末成绩单', W / 2, 80);

      // Subtitle
      ctx.fillStyle = '#666';
      ctx.font = '14px "JetBrains Mono", monospace';
      ctx.fillText(`体质: ${talent?.name ?? '裸跑'} | 难度: ${DIFFICULTY_TEXT[difficulty]} | ${new Date().toLocaleDateString('zh-CN')}`, W / 2, 150);

      // Grade
      ctx.fillStyle = '#000';
      ctx.font = 'bold 80px "Space Grotesk", sans-serif';
      ctx.fillText(grade.grade, W / 2, 240);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 18px "Space Grotesk", sans-serif';
      ctx.fillText(grade.label, W / 2, 270);

      // Divider
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(60, 295);
      ctx.lineTo(W - 60, 295);
      ctx.stroke();

      // Stats summary
      ctx.textAlign = 'left';
      ctx.fillStyle = '#000';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      const statsY = 330;
      ctx.fillText(`总星数: ${'⭐'.repeat(totalStars)}${'☆'.repeat(maxStars - totalStars)} (${totalStars}/${maxStars})`, 60, statsY);
      ctx.fillText(`总用时: ${totalTime}s`, 60, statsY + 30);
      ctx.fillText(`总错误: ${totalErrors}`, 60, statsY + 60);
      ctx.fillText(`最高压力: ${maxStress}%`, 60, statsY + 90);

      // Level details
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('—— 各关成绩 ——', 60, statsY + 140);

      semesterStats.forEach((stat, i) => {
        const level = LEVELS.find((l) => l.id === stat.levelId);
        const y = statsY + 170 + i * 55;

        // Level card background
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.fillRect(60, y, W - 120, 45);
        ctx.strokeRect(60, y, W - 120, 45);

        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${level?.title ?? `关卡 ${stat.levelId}`}`, 75, y + 18);

        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#666';
        ctx.fillText(`用时${stat.timeUsed}s | 错误${stat.errorsMade} | 峰压${stat.maxStress}%`, 75, y + 36);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('⭐'.repeat(stat.stars), W - 75, y + 28);
      });

      // Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#999';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('— 脆皮大学生 · 逆风指引 —', W / 2, H - 40);

      // Download
      const link = document.createElement('a');
      link.download = `脆皮大学生_成绩单_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-black bg-[#f9f9f9] select-none overflow-y-auto custom-scrollbar gap-3">

      {/* Header - Manga Celebration */}
      <div className="text-center pt-2">
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <span className="inline-block bg-black text-yellow-400 text-[10px] font-mono px-3 py-1 border-2 border-black uppercase tracking-widest mb-2">★ SEMESTER COMPLETE ★</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-display font-black tracking-tight"
        >
          🎓 第一学期顺利结束！
        </motion.h2>
        <p className="text-[11px] font-mono text-neutral-500 mt-1">{scene.subtitle}</p>
      </div>

      {/* Grade Card - Manga Panel Active */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="manga-panel-active bg-white p-4 relative"
      >
        <div className="hatching absolute inset-0 pointer-events-none"></div>
        <div className="relative z-10 text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 mb-1">学期平均分</div>
          <div className={`text-5xl font-display font-black ${grade.color}`}>{avgScore}</div>
          <div className={`text-sm font-bold mt-0.5 ${grade.color}`}>{grade.grade} · {grade.label}</div>
          <div className="flex items-center justify-center gap-1 mt-2">
            {'⭐'.repeat(totalStars).split('').map((_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
              >
                ⭐
              </motion.span>
            ))}
            {'☆'.repeat(maxStars - totalStars).split('').map((_, i) => (
              <span key={`empty-${i}`} className="opacity-20">⭐</span>
            ))}
          </div>
          {!isPassed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-[11px] font-mono font-bold text-red-600 mt-2 bg-red-50 border-2 border-red-300 px-2 py-1"
            >
              ⚠️ 平均分未达 {PASSING_SCORE}，无法进入寒假篇
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-3 gap-1.5"
      >
        <div className="border-2 border-black p-2 flex flex-col items-center bg-white">
          <span className="text-[9px] font-mono text-neutral-500">总用时</span>
          <span className="text-lg font-mono font-bold">{totalTime}s</span>
        </div>
        <div className="border-2 border-black p-2 flex flex-col items-center bg-white" style={{backgroundImage:'radial-gradient(circle, rgba(0,0,0,0.06) 0.5px, transparent 0.5px)', backgroundSize:'3px 3px'}}>
          <span className="text-[9px] font-mono text-neutral-500">总错误</span>
          <span className="text-lg font-mono font-bold">{totalErrors}</span>
        </div>
        <div className="border-2 border-black p-2 flex flex-col items-center bg-white">
          <span className="text-[9px] font-mono text-neutral-500">最高压力</span>
          <span className={`text-lg font-mono font-bold ${maxStress >= 75 ? 'text-red-600' : ''}`}>{maxStress}%</span>
        </div>
      </motion.div>

      {/* Level Summary Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="space-y-1.5"
      >
        <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-500 border-b border-black pb-1">各关成绩</div>
        {semesterStats.map((stat, i) => {
          const level = LEVELS.find((l) => l.id === stat.levelId);
          const statGrade = getScoreGrade(stat.score);
          return (
            <motion.div
              key={stat.levelId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="flex items-center justify-between p-2 border border-black bg-white"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="bg-black text-white text-[9px] font-mono px-1.5 py-0.5 font-black">0{stat.levelId}</span>
                  <span className="text-xs font-bold truncate">{level?.title ?? `关卡 ${stat.levelId}`}</span>
                </div>
                <div className="text-[9px] font-mono text-neutral-500 mt-0.5">
                  {stat.timeUsed}s · {stat.errorsMade}错 · 峰压{stat.maxStress}%
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-xs">{'⭐'.repeat(stat.stars)}{'☆'.repeat(3 - stat.stars)}</span>
                <span className={`font-display font-black text-lg ${statGrade.color}`}>{stat.score}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="sticky bottom-0 left-0 right-0 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-[#f9f9f9] border-t-4 border-black space-y-2"
      >
        <button
          onClick={exportTranscript}
          disabled={isExporting}
          className={`w-full manga-btn py-3 font-display font-black text-sm tracking-wider cursor-pointer flex items-center justify-center gap-2 ${
            isExporting ? 'bg-neutral-200 text-neutral-400' : 'bg-yellow-400 hover:bg-yellow-300 text-black'
          }`}
        >
          {isExporting ? '导出中...' : '📜 导出期末成绩单'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onHome}
            className="manga-btn bg-white hover:bg-neutral-50 py-2.5 font-display font-black text-xs tracking-wider cursor-pointer flex items-center justify-center gap-1.5"
          >
            🏠 回到首页
          </button>
          <button
            onClick={isPassed ? onPlayBonus : undefined}
            disabled={!isPassed}
            className={`manga-btn py-2.5 font-display font-black text-xs tracking-wider flex items-center justify-center gap-1.5 ${
              isPassed
                ? 'bg-black text-white hover:bg-neutral-800 cursor-pointer'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
            }`}
          >
            {isPassed ? '🎮 寒假特别挑战' : '🔒 需60分解锁'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
