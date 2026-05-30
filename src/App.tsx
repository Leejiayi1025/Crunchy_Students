/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Talent, GameStats } from './types';
import { LEVELS } from './data';
import { StartScreen } from './components/StartScreen';
import { TalentSelectScreen } from './components/TalentSelectScreen';
import { LevelIntroScreen } from './components/LevelIntroScreen';
import { GameMainView } from './components/GameMainView';
import { ClearScreen } from './components/ClearScreen';
import { FailedScreen } from './components/FailedScreen';
import { Laptop, Phone, HelpCircle, GraduationCap } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState<number>(0);
  const [activeStats, setActiveStats] = useState<GameStats | null>(null);
  const [failReason, setFailReason] = useState<'TIMEOUT' | 'STRESS_CRASH'>('TIMEOUT');

  const currentLevel = LEVELS[currentLevelIdx];

  // ----------------------------------------------------
  // State Handlers
  // ----------------------------------------------------
  const handleStartGame = () => {
    setGameState('TALENT_SELECT');
  };

  const handleSelectTalent = (talent: Talent) => {
    setSelectedTalent(talent);
    setCurrentLevelIdx(0); // reset to level 1 first
    setGameState('LEVEL_INTRO');
  };

  const handleEnterGame = () => {
    setGameState('PLAYING');
  };

  const handleWinLevel = (stats: GameStats) => {
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
    <div className="min-h-screen bg-[#111111] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] flex flex-col items-center justify-center p-0 md:p-4 selection:bg-red-600 selection:text-white">
      
      {/* Outer wrapper casing for aesthetic simulation background */}
      <div className="w-full max-w-md md:h-[840px] flex flex-col justify-between relative bg-black md:border-[10px] md:border-neutral-900 md:shadow-[0_24px_60px_rgba(0,0,0,0.8),8px_8px_0px_#222] md:rounded-3xl overflow-hidden aspect-[9/16] h-screen">
        
        {/* Top Camera Notch Decorator (retro phone casing) */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-32 h-4.5 bg-neutral-900 rounded-full z-50 flex items-center justify-center pointer-events-none hidden md:flex">
          <div className="w-2 h-2 rounded-full bg-neutral-950 mr-2 border border-neutral-800" />
          <div className="w-12 h-1 bg-neutral-950 rounded" />
        </div>

        {/* Dynamic Frame Screen Views */}
        <div className="flex-1 h-full w-full overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={gameState + '-' + currentLevelIdx}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.01 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full w-full"
            >
              {gameState === 'START' && (
                <StartScreen onStart={handleStartGame} />
              )}

              {gameState === 'TALENT_SELECT' && (
                <TalentSelectScreen onSelect={handleSelectTalent} />
              )}

              {gameState === 'LEVEL_INTRO' && (
                <LevelIntroScreen
                  level={currentLevel}
                  talent={selectedTalent}
                  onEnterGame={handleEnterGame}
                />
              )}

              {gameState === 'PLAYING' && (
                <GameMainView
                  level={currentLevel}
                  talent={selectedTalent}
                  onWin={handleWinLevel}
                  onLose={handleLoseLevel}
                  onBack={handleRestartSession}
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

        {/* Bottom physical home bar indicator Decorator */}
        <div className="bg-black py-2.5 flex items-center justify-center pointer-events-none z-50 shrink-0 hidden md:flex border-t border-neutral-950">
          <div className="w-28 h-1 bg-neutral-800 rounded-full" />
        </div>

      </div>

      {/* Desktop auxiliary metadata layout sidebar annotations (hiding absolute code paths, neat human labels) */}
      <div className="hidden lg:flex flex-col gap-3 absolute right-5 top-5 w-60 text-xs font-mono text-neutral-500 bg-black/40 border border-neutral-900 rounded-lg p-4 leading-relaxed shadow-lg">
        <div className="flex items-center gap-1.5 text-white font-bold border-b border-neutral-900 pb-1.5 mb-1.5">
          <GraduationCap className="w-4 h-4 text-red-500" />
          <span>《逆风如解》辅导面板</span>
        </div>
        <p>
          🎯 <strong className="text-neutral-300">设计内涵</strong>：游戏旨在模拟高校压力。当您感到焦灼（压力大）时，不妨适时点击“摸鱼减压”自救。
        </p>
        <p>
          🤖 <strong className="text-neutral-300">辅导员突袭</strong>：不定期触发。请确保您能保持 3s 内闪电手速，否则会被查岗问退！
        </p>
        <div className="mt-2 text-[10px] text-neutral-600 border-t border-neutral-900 pt-2 flex items-center justify-between">
          <span>PORT: 3000 // H5 ACTIVE</span>
          <span className="text-red-600 animate-pulse">● LIVE</span>
        </div>
      </div>

    </div>
  );
}
