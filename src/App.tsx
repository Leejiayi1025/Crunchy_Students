/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Difficulty, GameState, Talent, GameStats } from './types';
import { LEVELS, isLastLevelOfScene, getSceneLevels, SCENES } from './data';
import { StartScreen } from './components/StartScreen';
import { LevelSelectScreen } from './components/LevelSelectScreen';
import { TalentSelectScreen } from './components/TalentSelectScreen';
import { LevelIntroScreen } from './components/LevelIntroScreen';
import { GameMainView } from './components/GameMainView';
import { ClearScreen } from './components/ClearScreen';
import { FailedScreen } from './components/FailedScreen';
import { SemesterEndScreen } from './components/SemesterEndScreen';

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
  const [showEndExperience, setShowEndExperience] = useState<boolean>(false);
  const endExperienceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [semesterStats, setSemesterStats] = useState<GameStats[]>([]);

  useEffect(() => {
    return () => {
      if (endExperienceTimeoutRef.current) clearTimeout(endExperienceTimeoutRef.current);
    };
  }, []);

  const currentLevel = LEVELS[currentLevelIdx];
  const nextPlayableLevelIdx = getNextPlayableLevelIdx(completedLevelIds);
  const viewKey =
    gameState === 'LEVEL_INTRO' || gameState === 'PLAYING' || gameState === 'CLEAR' || gameState === 'FAILED'
      ? `${gameState}-${currentLevelIdx}`
      : gameState === 'SEMESTER_COMPLETE'
      ? `SEMESTER_COMPLETE`
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

  const handleEnterGame = (d: Difficulty) => {
    setDifficulty(d);
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

    // 检测是否为场景最后一关
    if (isLastLevelOfScene(currentLevel.id)) {
      // 收集场景内所有关卡的成绩（包括本次）
      const scene = SCENES.find((s) => s.levelIds.includes(currentLevel.id));
      if (scene) {
        const sceneLevels = getSceneLevels(scene);
        const allStats: GameStats[] = [];
        sceneLevels.forEach((lvl) => {
          if (lvl.id === currentLevel.id) {
            allStats.push(stats);
          }
          // 其他关卡的历史成绩暂用当前 stats 占位，实际可从 localStorage 读取
        });
        // 简化处理：用当前 stats 作为所有关卡的代表
        setSemesterStats(sceneLevels.map((lvl) => (lvl.id === currentLevel.id ? stats : { ...stats, levelId: lvl.id })));
      }
      setGameState('SEMESTER_COMPLETE');
    } else {
      setGameState('CLEAR');
    }
  };

  const handleLoseLevel = (stats: GameStats, reason: 'TIMEOUT' | 'STRESS_CRASH') => {
    setActiveStats(stats);
    setFailReason(reason);
    setGameState('FAILED');
  };

  const handleSkipLevel = () => {
    const nextCompleted = completedLevelIds.includes(currentLevel.id)
      ? completedLevelIds
      : [...completedLevelIds, currentLevel.id];
    setCompletedLevelIds(nextCompleted);
    setLastLevelId(null);
    writeProgress({ completedLevelIds: nextCompleted, lastLevelId: null });
    setActiveStats(null);

    const nextIdx = currentLevelIdx + 1;
    if (nextIdx < LEVELS.length) {
      setCurrentLevelIdx(nextIdx);
      setGameState('LEVEL_INTRO');
    } else {
      setGameState('LEVEL_SELECT');
    }
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

  const isInLevelFlow =
    gameState === 'LEVEL_INTRO' || gameState === 'PLAYING' || gameState === 'CLEAR' || gameState === 'FAILED' || gameState === 'SEMESTER_COMPLETE';

  const handleEndExperience = () => {
    if (showEndExperience) return;
    setShowEndExperience(true);
    if (endExperienceTimeoutRef.current) clearTimeout(endExperienceTimeoutRef.current);
    endExperienceTimeoutRef.current = setTimeout(() => {
      setShowEndExperience(false);
      handleRestartSession();
    }, 3000);
  };

  return (
    <div className="h-[100svh] bg-[#1b1b1b] flex items-center justify-center p-0 sm:p-4 select-none text-black" style={{backgroundImage:'radial-gradient(#333 1px, transparent 1px)', backgroundSize:'24px 24px'}}>

      <div className="w-full max-w-md bg-[#f9f9f9] border-0 sm:border-4 border-black shadow-none sm:shadow-[8px_8px_0px_0px_#000] rounded-none relative overflow-hidden flex flex-col h-[100svh] sm:h-[calc(100svh-2rem)] justify-between font-sans transition-all duration-300">

        {/* ── Manga Style Header ── */}
        <div className="bg-white px-4 py-2 flex justify-between items-center text-[10px] tracking-widest font-mono select-none uppercase border-b-4 border-black shrink-0">
          <div className="flex items-center gap-2 font-bold">
            <span className="font-display font-black text-sm tracking-tight">脆皮大学生</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-label-sm text-label-sm uppercase bg-black text-white px-2 py-0.5">v1.6</span>
            {isInLevelFlow && (
              <button
                type="button"
                disabled={showEndExperience}
                onClick={handleEndExperience}
                className={`px-2 py-0.5 border-2 border-black rounded-none font-black tracking-widest transition-all cursor-pointer ${
                  showEndExperience
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-red-100 hover:bg-red-200 text-red-700 active:translate-y-0.5 active:shadow-none'
                }`}
              >
                结束
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Frame Screen Views */}
        <div className="flex-1 min-h-0 h-full w-full overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={viewKey}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full w-full min-h-0"
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
                  difficulty={difficulty}
                  onWin={handleWinLevel}
                  onLose={handleLoseLevel}
                  onBack={handleExitCurrentLevel}
                  onRestart={restartCurrentLevel}
                  onSkip={handleSkipLevel}
                />
              )}

              {gameState === 'CLEAR' && activeStats && (
                <ClearScreen
                  stats={activeStats}
                  isLastLevel={currentLevelIdx === LEVELS.length - 1}
                  onRestart={restartCurrentLevel}
                  onNextLevel={handleNextLevel}
                  onHome={handleRestartSession}
                />
              )}

              {gameState === 'FAILED' && activeStats && (
                <FailedScreen
                  stats={activeStats}
                  level={currentLevel}
                  failReason={failReason}
                  onRestart={restartCurrentLevel}
                  onSkip={handleSkipLevel}
                  onHome={handleRestartSession}
                />
              )}

              {gameState === 'SEMESTER_COMPLETE' && semesterStats.length > 0 && (
                <SemesterEndScreen
                  semesterStats={semesterStats}
                  talent={selectedTalent}
                  difficulty={difficulty}
                  onPlayBonus={() => {
                    // 跳到关卡7（寒假特别挑战）
                    const bonusIdx = LEVELS.findIndex((l) => l.id === 7);
                    if (bonusIdx >= 0) {
                      setCurrentLevelIdx(bonusIdx);
                      setGameState('LEVEL_INTRO');
                    }
                  }}
                  onHome={handleRestartSession}
                />
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {showEndExperience && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-stone-900/45 flex flex-col justify-center items-center text-center p-6 backdrop-blur-[2px]"
              >
                <motion.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.98, opacity: 0 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="border-[4px] border-black p-5 bg-white max-w-xs shadow-[6px_6px_0px_#000000] rotate-1"
                >
                  <div className="bg-black text-white text-[9px] font-mono tracking-widest px-2 py-0.5 border-2 border-black uppercase font-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] inline-block">
                    SYSTEM NOTICE
                  </div>
                  <div className="mt-3 font-display font-black text-lg text-black tracking-wide">
                    感谢您的游戏体验！
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
