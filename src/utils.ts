/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Difficulty } from './types';

/** 难度分数上限 — 通关即60分，上限随难度提升 */
const SCORE_CEILING: Record<Difficulty, number> = {
  EASY: 80,
  MEDIUM: 90,
  HARD: 95,
  HELL: 100,
};

/**
 * 百分制打分
 *
 * 通关即得60分基础分，剩余20分根据表现分配：
 * - 时间分(8): 剩余时间占比
 * - 准确分(6): 错误越少越高
 * - 抗压分(4): 压力越低越高
 * - 效率分(2): 提示/摸鱼越少越高
 *
 * 最终分 = min(难度上限, 60 + 基础加分)
 */
export function calculateScore(stats: GameStats): number {
  const totalTime = stats.timeUsed + stats.timeRemainingBeforePenalty;

  // 时间分（8分）：剩余时间越多越好
  const timeScore = totalTime > 0
    ? (stats.timeRemainingBeforePenalty / totalTime) * 8
    : 0;

  // 准确分（6分）：每错一次扣1.5分
  const accuracyScore = Math.max(0, 6 - stats.errorsMade * 1.5);

  // 抗压分（4分）：压力越高扣越多
  const stressScore = Math.max(0, 4 - stats.maxStress * 0.04);

  // 效率分（2分）：提示-0.5，摸鱼-0.5
  const efficiencyScore = Math.max(0, 2 - stats.hintsUsed * 0.5 - stats.slackedOffCount * 0.5);

  const bonusScore = timeScore + accuracyScore + stressScore + efficiencyScore;
  const rawScore = 60 + bonusScore;
  const ceiling = SCORE_CEILING[stats.difficulty] ?? 90;

  return Math.round(Math.min(ceiling, Math.max(60, rawScore)));
}

/** 分数等级 */
export function getScoreGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 90) return { grade: 'S', label: '完美', color: 'text-yellow-500' };
  if (score >= 80) return { grade: 'A', label: '优秀', color: 'text-emerald-600' };
  if (score >= 70) return { grade: 'B', label: '良好', color: 'text-sky-600' };
  if (score >= 60) return { grade: 'C', label: '及格', color: 'text-orange-500' };
  return { grade: 'D', label: '挂科', color: 'text-red-600' };
}

/** 及格线 */
export const PASSING_SCORE = 60;
