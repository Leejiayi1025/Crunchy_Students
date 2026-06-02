/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Difficulty } from './types';

/** 难度系数 — 难度越高，同等表现得分越高 */
const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  EASY: 0.85,
  MEDIUM: 1.0,
  HARD: 1.15,
  HELL: 1.35,
};

/**
 * 根据玩家操作计算百分制分数
 *
 * 基础分 = 时间分(45) + 准确分(25) + 抗压分(20) + 效率分(10)
 * 最终分 = min(100, round(基础分 × 难度系数))
 */
export function calculateScore(stats: GameStats): number {
  const totalTime = stats.timeUsed + stats.timeRemainingBeforePenalty;

  // 时间分（45分）：剩余时间越多分越高
  const timeScore = totalTime > 0
    ? (stats.timeRemainingBeforePenalty / totalTime) * 45
    : 0;

  // 准确分（25分）：每错一次扣5分
  const accuracyScore = Math.max(0, 25 - stats.errorsMade * 5);

  // 抗压分（20分）：压力越高扣越多
  const stressScore = Math.max(0, 20 - stats.maxStress * 0.2);

  // 效率分（10分）：提示-3，摸鱼-2
  const efficiencyScore = Math.max(0, 10 - stats.hintsUsed * 3 - stats.slackedOffCount * 2);

  const baseScore = timeScore + accuracyScore + stressScore + efficiencyScore;
  const multiplier = DIFFICULTY_MULTIPLIER[stats.difficulty] ?? 1.0;
  const finalScore = baseScore * multiplier;

  return Math.round(Math.min(100, Math.max(0, finalScore)));
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
