/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Difficulty } from './types';

/** 难度对应的满分时间阈值（秒内完成即满分） */
const TIME_THRESHOLD: Record<Difficulty, number> = {
  EASY: 20,
  MEDIUM: 15,
  HARD: 20,
  HELL: 18,
};

/** 难度分数上限 */
const SCORE_CEILING: Record<Difficulty, number> = {
  EASY: 90,
  MEDIUM: 95,
  HARD: 99,
  HELL: 100,
};

/**
 * 百分制打分 — 基于完成速度
 *
 * 基础60分 + 速度加分最高40分
 * 在阈值时间内完成 → 满分
 * 超过阈值 → 按比例递减，最低60分
 */
export function calculateScore(stats: GameStats): number {
  const timeUsed = stats.timeUsed;
  const threshold = TIME_THRESHOLD[stats.difficulty] ?? 15;
  const maxScore = SCORE_CEILING[stats.difficulty] ?? 95;
  const bonusMax = maxScore - 60;

  // 速度分：用时越少分越高
  // ratio = threshold / timeUsed (≤1时满分，>1时按比例递减)
  const ratio = timeUsed <= threshold
    ? 1.0
    : Math.max(0, threshold / timeUsed);

  // 用平方根曲线让高分更容易拿到
  const bonus = Math.round(Math.sqrt(ratio) * bonusMax);

  return Math.min(maxScore, 60 + bonus);
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
