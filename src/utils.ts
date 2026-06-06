/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameStats, Difficulty } from './types';

/** 过关分 */
const PASS_SCORE: Record<Difficulty, number> = {
  EASY: 60,
  MEDIUM: 70,
  HARD: 80,
  HELL: 90,
};

/** 剩余时间系数 */
const TIME_MULTIPLIER: Record<Difficulty, number> = {
  EASY: 1,
  MEDIUM: 1.2,
  HARD: 1.4,
  HELL: 1.6,
};

/**
 * 百分制打分 — 过关分 + 剩余时间 × 系数
 *
 * 过关分：简单60，中等70，困难80，地狱90
 * 剩余时间系数：简单×1，中等×1.2，困难×1.4，地狱×1.6
 */
export function calculateScore(stats: GameStats): number {
  const difficulty = stats.difficulty;

  // 过关分
  const passScore = PASS_SCORE[difficulty] ?? 60;

  // 剩余时间加分
  const timeMultiplier = TIME_MULTIPLIER[difficulty] ?? 1;
  const timeBonus = Math.round(stats.timeRemainingBeforePenalty * timeMultiplier);

  // 计算总分
  const totalScore = passScore + timeBonus;

  // 分数上限100分，下限0分
  return Math.max(0, Math.min(100, totalScore));
}

/** 分数等级 */
export function getScoreGrade(score: number): { grade: string; label: string; color: string } {
  if (score >= 100) return { grade: 'S', label: '完美', color: 'text-yellow-500' };
  if (score >= 90) return { grade: 'A', label: '优秀', color: 'text-emerald-600' };
  if (score >= 80) return { grade: 'B', label: '良好', color: 'text-sky-600' };
  if (score >= 60) return { grade: 'C', label: '及格', color: 'text-orange-500' };
  return { grade: 'D', label: '挂科', color: 'text-red-600' };
}

/** 及格线 */
export const PASSING_SCORE = 60;
