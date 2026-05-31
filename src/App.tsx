/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Talent, GameStats } from './types';
import { LEVELS } from './data';
import { StartScreen } from './components/StartScreen';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { TalentSelectScreen } from './components/TalentSelectScreen';
import { LevelIntroScreen } from './components/LevelIntroScreen';
import { GameMainView } from './components/GameMainView';
import { ClearScreen } from './components/ClearScreen';
import { FailedScreen } from './components/FailedScreen';

const PROGRESS_STORAGE_KEY = 'crunchy_students_progress_v1';

const readProgress = (): { completedLevelIds: number[]; lastLevelId: number | null } => {
  if (typeof window === 'undefined' || !('localStorage' in window)) {
    return { completedLevelIds: [], lastLevelId: null };
  }
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return { completedLevelIds: [], lastLevelId: null };
    const parsed = JSON.parse(raw) as { completedLevelIds?: unknown; lastLevelId?: unknown };
    const completedLevelIds = Array.isArray(parsed.completedLevelIds)
      ? parsed.completedLevelIds.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
      : [];
    const lastLevelId = typeof parsed.lastLevelId === 'number' && Number.isFinite(parsed.lastLevelId) ? parsed.lastLevelId : null;
    return { completedLevelIds, lastLevelId };
  } catch {
    return { completedLevelIds: [], lastLevelId: null };
  }
};

const writeProgress = (progress: { completedLevelIds: number[]; lastLevelId: number | null }) => {
  if (typeof window === 'undefined' || !('localStorage' in window)) return;
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
};

const getNextPlayableLevelIdx = (completedIds: number[]): number => {
  const idx = LEVELS.findIndex((l) => !completedIds.includes(l.id));
  return idx >= 0 ? idx : Math.max(LEVELS.length - 1, 0);
};

export default function App() {
  const initialProgress = readProgress();
  const initialNextPlayableIdx = getNextPlayableLevelIdx(initialProgress.completedLevelIds);
  const initialIdx = (() => {
    if (initialProgress.lastLevelId !== null && !initialProgress.completedLevelIds.includes(initialProgress.lastLevelId)) {
      const idx = LEVELS.findIndex((l) => l.id === initialProgress.lastLevelId);
      if (idx >= 0) return idx;
    }
    return initialNextPlayableIdx;
  })();

  const [gameState, setGameState] = useState<GameState>('START');
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(initialIdx);
  const [activeStats, setActiveStats] = useState<GameStats | null>(null);
  const [failReason, setFailReason] = useState<'TIMEOUT' | 'STRESS_CRASH'>('TIMEOUT');
  const [completedLevelIds, setCompletedLevelIds] = useState<number[]>(() => initialProgress.completedLevelIds);
  const [lastLevelId, setLastLevelId] = useState<number | null>(() => initialProgress.lastLevelId);

  const currentLevel = LEVELS[currentLevelIdx];
  const nextPlayableLevelIdx = getNextPlayableLevelIdx(completedLevelIds);
  const viewKey =
    gameState === 'LEVEL_INTRO' || gameState === 'PLAYING' || gameState === 'CLEAR' || gameState === 'FAILED'
      ? `${gameState}-${currentLevelIdx}`
      : gameState;

  // ----------------------------------------------------
  // State Handlers
  // ----------------------------------------------------
  const handleStartGame = () => {
    setSelectedTalent(null);
    setCurrentLevelIdx((prev) => {
      const level = LEVELS[prev];
      if (level && completedLevelIds.includes(level.id)) return prev;
      return nextPlayableLevelIdx;
    });
    setGameState('TALENT_SELECT');
  };

  const handleSelectLevel = (levelIdx: number) => {
    const level = LEVELS[levelIdx];
    if (!level) return;
    const canReplay = completedLevelIds.includes(level.id);
    const canPlayNow = levelIdx === nextPlayableLevelIdx;
    if (!canReplay && !canPlayNow) return;
    setCurrentLevelIdx(levelIdx);
  };

  const handleProceedSelectedLevel = () => {
    setGameState('LEVEL_INTRO');
  };

  const handleContinueLast = () => {
    if (lastLevelId !== null && !completedLevelIds.includes(lastLevelId)) {
      const idx = LEVELS.findIndex((l) => l.id === lastLevelId);
      if (idx >= 0) setCurrentLevelIdx(idx);
    } else {
      setCurrentLevelIdx(nextPlayableLevelIdx);
    }
    setGameState('LEVEL_INTRO');
  };

  const handleResetProgress = () => {
    setCompletedLevelIds([]);
    setLastLevelId(null);
    setCurrentLevelIdx(0);
    writeProgress({ completedLevelIds: [], lastLevelId: null });
  };

  const handleSelectTalent = (talent: Talent) => {
    setSelectedTalent(talent);
    setGameState('LEVEL_SELECT');
  };

  const handleEnterGame = () => {
    setGameState('PLAYING');
  };

  const handleWinLevel = (stats: GameStats) => {
    const nextCompleted = completedLevelIds.includes(currentLevel.id)
      ? completedLevelIds
      : [...completedLevelIds, currentLevel.id];
    setCompletedLevelIds(nextCompleted);
    const nextLastLevelId = lastLevelId === currentLevel.id ? null : lastLevelId;
    setLastLevelId(nextLastLevelId);
    writeProgress({ completedLevelIds: nextCompleted, lastLevelId: nextLastLevelId });
    setActiveStats(stats);
    setGameState('CLEAR');
  };

  const handleLoseLevel = (stats: GameStats, reason: 'TIMEOUT' | 'STRESS_CRASH') => {
    setActiveStats(stats);
    setFailReason(reason);
    setGameState('FAILED');
  };

  const handleNextLevel = () => {
    const nextIdx = currentLevelIdx + 1;
    if (nextIdx < LEVELS.length) {
      setCurrentLevelIdx(nextIdx);
      setGameState('LEVEL_INTRO');
    }
  };

  const handleExitCurrentLevel = () => {
    setLastLevelId(currentLevel.id);
    writeProgress({ completedLevelIds, lastLevelId: currentLevel.id });
    setActiveStats(null);
    setGameState('LEVEL_SELECT');
  };

  const handleBackToLevelSelect = () => {
    setActiveStats(null);
    setGameState('LEVEL_SELECT');
  };

  const handleChangeTalent = () => {
    setSelectedTalent(null);
    setGameState('TALENT_SELECT');
  };

  const handleRestartSession = () => {
    setSelectedTalent(null);
    setCurrentLevelIdx(0);
    setActiveStats(null);
    setGameState('START');
  };

  const restartCurrentLevel = () => {
    setGameState('LEVEL_INTRO');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 select-none text-black" style={{backgroundImage:'radial-gradient(#262626 1px, transparent 1px)', backgroundSize:'24px 24px'}}>

      <div className="w-full max-w-md bg-stone-50 border-[6px] border-black shadow-[12px_12px_0px_#000000] rounded-none relative overflow-hidden flex flex-col min-h-[92vh] sm:min-h-[780px] justify-between font-sans transition-all duration-300">

        {/* ── CRISP OS Header ── */}
        <div className="bg-black text-white px-4 py-1.5 flex justify-between items-center text-[10px] tracking-widest font-mono select-none uppercase border-b-2 border-black shrink-0">
          <div className="flex items-center gap-2 font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-red-500 font-black">CRISP OS v1.6</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">5G ★</span>
          </div>
        </div>

        {/* Dynamic Frame Screen Views */}
        <div className="flex-1 h-full w-full overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewKey}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full w-full"
            >
              {gameState === 'START' && (
                <StartScreen onStart={handleStartGame} />
              )}

              {gameState === 'LEVEL_SELECT' && (
                <LevelSelectScreen
                  levels={LEVELS}
                  completedLevelIds={completedLevelIds}
                  lastLevelId={lastLevelId}
                  nextPlayableLevelIdx={nextPlayableLevelIdx}
                  selectedLevelIdx={currentLevelIdx}
                  onSelectLevel={handleSelectLevel}
                  onContinueLast={handleContinueLast}
                  onProceedSelected={handleProceedSelectedLevel}
                  onChangeTalent={handleChangeTalent}
                  onResetProgress={handleResetProgress}
                />
              )}

              {gameState === 'TALENT_SELECT' && (
                <TalentSelectScreen onSelect={handleSelectTalent} />
              )}

              {gameState === 'LEVEL_INTRO' && (
                <LevelIntroScreen
                  level={currentLevel}
                  talent={selectedTalent}
                  onEnterGame={handleEnterGame}
                  onBack={handleBackToLevelSelect}
                />
              )}

              {gameState === 'PLAYING' && (
                <GameMainView
                  level={currentLevel}
                  talent={selectedTalent}
                  onWin={handleWinLevel}
                  onLose={handleLoseLevel}
                  onBack={handleExitCurrentLevel}
                />
              )}

              {gameState === 'CLEAR' && activeStats && (
                <ClearScreen
                  stats={activeStats}
                  isLastLevel={currentLevelIdx === LEVELS.length - 1}
                  onRestart={restartCurrentLevel}
                  onNextLevel={handleNextLevel}
                />
              )}

              {gameState === 'FAILED' && activeStats && (
                <FailedScreen
                  stats={activeStats}
                  level={currentLevel}
                  failReason={failReason}
                  onRestart={restartCurrentLevel}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
