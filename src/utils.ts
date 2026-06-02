/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Difficulty } from './types';

/** 难度分数上限 */
const SCORE_CEILING: Record<Difficulty, number> = {
  EASY: 85,
  MEDIUM: 95,
  HARD: 100,
  HELL: 100,
};

/**
 * 百分制打分
 *
 * 基础分60 + 表现加分最高40 = 100
 *
 * 时间分(15): 剩余时间越多越好
 * 准确分(12): 错误越少越好
 * 抗压分(8): 压力越低越好
 * 效率分(5): 提示/摸鱼越少越好
 */
export function calculateScore(stats: GameStats): number {
  const totalTime = stats.timeUsed + stats.timeRemainingBeforePenalty;

  // 时间分（15分）
  const timeScore = totalTime > 0
    ? (stats.timeRemainingBeforePenalty / totalTime) * 15
    : 0;

  // 准确分（12分）：每错一次扣2分
  const accuracyScore = Math.max(0, 12 - stats.errorsMade * 2);

  // 抗压分（8分）：压力越高扣越多
  const stressScore = Math.max(0, 8 - stats.maxStress * 0.08);

  // 效率分（5分）：提示-1，摸鱼-1
  const efficiencyScore = Math.max(0, 5 - stats.hintsUsed * 1 - stats.slackedOffCount * 1);

  const bonusScore = timeScore + accuracyScore + stressScore + efficiencyScore;
  const rawScore = 60 + bonusScore;
  const ceiling = SCORE_CEILING[stats.difficulty] ?? 95;

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
