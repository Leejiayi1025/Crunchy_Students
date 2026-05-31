/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState =
  | 'START'
  | 'LEVEL_SELECT'
  | 'TALENT_SELECT'
  | 'LEVEL_INTRO'
  | 'PLAYING'
  | 'PAUSED'
  | 'CLEAR'
  | 'FAILED';

export interface Talent {
  id: string;
  name: string;
  emoji: string;
  description: string;
  bonusText: string;
  initialStress: number; // starts with this stress
  initialTimeBonus: number; // seconds added or subtracted from initial timer
  stressPenaltyMultiplier: number; // e.g. 1.2x on errors
  recoveryBonus: number; // e.g. 1.5x on slack off
  specialRule?: string;
}

export interface Level {
  id: number;
  name: string;
  title: string;
  scenario: string;
  instructions: string;
  rules: string[]; // 2-3 short bullet rules
  baseTime: number; // in seconds
  failureTragedy: string;
}

export interface StressRecord {
  timeElapsed: number;
  stress: number;
}

export interface GameStats {
  levelId: number;
  talent: Talent | null;
  timeRemainingBeforePenalty: number;
  timeUsed: number;
  errorsMade: number;
  maxStress: number;
  slackedOffCount: number;
  timeline: StressRecord[];
  triggeredSurprisesCount: number;
  surpriseSuccesses: number;
  stars: number;
}
