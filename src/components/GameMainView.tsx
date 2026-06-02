/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Difficulty, Level, Talent, GameStats, StressRecord } from '../types';
import {
  DIFFICULTY_TEXT, getLevelDifficultyConfig, generateSudokuPuzzle, FUNNY_QUOTES, SudokuCell,
  PIPE_PUZZLES, PipeCell, PipeType,
  MEMORY_PAIRS, MemoryPair,
} from '../data';
import {
  AlertOctagon, AlertTriangle, ShieldCheck, Play, Pause, RefreshCw, Undo2, Coffee, Eye, Radio, BellRing, Skull, ArrowLeft, Lightbulb, RotateCcw
} from 'lucide-react';
import { calculateScore } from '../utils';
import { playCorrect, playWrong, createParticles, hapticFeedback } from '../audio';

interface GameMainViewProps {
  level: Level;
  talent: Talent | null;
  difficulty: Difficulty;
  onWin: (stats: GameStats) => void;
  onLose: (stats: GameStats, reason: 'TIMEOUT' | 'STRESS_CRASH') => void;
  onBack: () => void;
  onRestart: () => void;
  onSkip: () => void;
}

export function GameMainView({ level, talent, difficulty, onWin, onLose, onBack, onRestart, onSkip }: GameMainViewProps) {
  // ----------------------------------------------------
  // Configuration offsets from active Talents
  // ----------------------------------------------------
  const difficultyCfg = getLevelDifficultyConfig(level.id, difficulty);
  const baseTime = difficultyCfg.timeLimit + (talent ? talent.initialTimeBonus : 0);
  const initialStress = talent ? talent.initialStress : 0;
  const stressMaxCap = talent?.id === 'pre_exam_amnesia' ? 110 : talent?.id === 'zen_winner' ? 120 : 100;

  // ----------------------------------------------------
  // Primary States
  // ----------------------------------------------------
  const [remainingTime, setRemainingTime] = useState<number>(baseTime);
  const [stress, setStress] = useState<number>(initialStress);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSlacking, setIsSlacking] = useState<boolean>(false);
  const [slackTimeLeft, setSlackTimeLeft] = useState<number>(10);
  
  // Game stats
  const [errorsMade, setErrorsMade] = useState<number>(0);
  const [maxStressReached, setMaxStressReached] = useState<number>(initialStress);
  const [slackedOffCount, setSlackedOffCount] = useState<number>(0);
  const [triggeredSurprisesCount, setTriggeredSurprisesCount] = useState<number>(0);
  const [surpriseSuccesses, setSurpriseSuccesses] = useState<number>(0);
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState<boolean>(false);
  const [hintTarget, setHintTarget] = useState<number | null>(null);

  // Time tracker
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const timelineRef = useRef<StressRecord[]>([]);
  const timeElapsedRef = useRef<number>(0);
  const stressRef = useRef<number>(0);
  const isSlackingRef = useRef<boolean>(false);
  const showSurpriseRef = useRef<boolean>(false);

  // 100% stress threshold countdown (5s melting mode)
  const [stressMeltCounter, setStressMeltCounter] = useState<number>(5);

  // Instructor audit alert trigger state
  const [showSurprise, setShowSurprise] = useState<boolean>(false);
  const [surpriseTimeLeft, setSurpriseTimeLeft] = useState<number>(3.0);
  const [surpriseBaseTime, setSurpriseBaseTime] = useState<number>(3.0);
  const [surpriseOptions, setSurpriseOptions] = useState<string[]>([]);
  const [surpriseCorrectIdx, setSurpriseCorrectIdx] = useState<number>(0);
  const [surpriseStatusMsg, setSurpriseStatusMsg] = useState<string>('');

  // ----------------------------------------------------
  // Schulte State (Level 1)
  // ----------------------------------------------------
  const [schulteNumbers, setSchulteNumbers] = useState<number[]>([]);
  const [schulteNext, setSchulteNext] = useState<number>(1);
  const [schulteAmnesiaFlash, setSchulteAmnesiaFlash] = useState<boolean>(false);

  // ----------------------------------------------------
  // Sudoku State (Level 2)
  // ----------------------------------------------------
  const [sudokuCells, setSudokuCells] = useState<SudokuCell[]>([]);
  const [selectedSudokuIdx, setSelectedSudokuIdx] = useState<number | null>(null);
  const [sudokuSolution, setSudokuSolution] = useState<number[][]>([]);
  const [sudokuErrorIdxs, setSudokuErrorIdxs] = useState<number[]>([]);
  const [sudokuSize, setSudokuSize] = useState<number>(4);
  const [sudokuBoxSize, setSudokuBoxSize] = useState<number>(2);

  // ----------------------------------------------------
  // Sliding Puzzle State (Level 3)
  // ----------------------------------------------------
  const ODD_ONE_OUT_TARGET_ROUNDS = difficultyCfg.oddOneOutTargetRounds;
  type OddOneOutKind = 'TEXT' | 'NUMBER' | 'PATTERN';
  type PatternSpec = {
    bg: string;
    fg: string;
    accent: string;
    shape: 'circle' | 'square' | 'triangle' | 'diamond';
    stripesAngle: 45 | 135;
    dotCount: number;
  };
  type OddOneOutCell =
    | { kind: 'TEXT'; value: string }
    | { kind: 'NUMBER'; value: number }
    | {
        kind: 'PATTERN';
        value: PatternSpec;
      };

  const ODD_ONE_OUT_TEXT_PAIRS: Array<{ base: string; odd: string }> = [
    { base: '土', odd: '士' },
    { base: '末', odd: '未' },
    { base: '日', odd: '曰' },
    { base: '口', odd: '囗' },
    { base: '己', odd: '已' },
    { base: '人', odd: '入' },
    { base: '千', odd: '干' },
    { base: '王', odd: '玉' },
  ];
  const [oddOneOutCells, setOddOneOutCells] = useState<OddOneOutCell[]>([]);
  const [oddOneOutAnswerIdx, setOddOneOutAnswerIdx] = useState<number>(-1);
  const [oddOneOutRound, setOddOneOutRound] = useState<number>(0);
  const [oddOneOutMeta, setOddOneOutMeta] = useState<{ kind: OddOneOutKind; label: string; base: string; odd: string } | null>(null);

  // ----------------------------------------------------
  // Reverse Command State (Level 7)
  // ----------------------------------------------------
  type ReverseDir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  const REVERSE_TARGET = difficultyCfg.reverseCommandTargetRounds;
  const [reverseDir, setReverseDir] = useState<ReverseDir>('UP');
  const [reverseScore, setReverseScore] = useState<number>(0);
  const reversePromptIdRef = useRef<number>(0);
  const reverseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reverseAwaitingRef = useRef<boolean>(false);

  // ----------------------------------------------------
  // Pipe Puzzle State (Level 4)
  // ----------------------------------------------------
  const [pipeCells, setPipeCells] = useState<PipeCell[]>([]);
  const [pipeRotations, setPipeRotations] = useState<number[]>([]);
  const [pipePoweredIdxs, setPipePoweredIdxs] = useState<number[]>([]);
  const pipeWinTriggeredRef = useRef<boolean>(false);

  // ----------------------------------------------------
  // Color Sequence State (Level 5)
  // ----------------------------------------------------
  const [colorSequence, setColorSequence] = useState<number[]>([]);
  const [colorPlayerInput, setColorPlayerInput] = useState<number[]>([]);
  const [colorRound, setColorRound] = useState<number>(0);
  const [colorShowingIdx, setColorShowingIdx] = useState<number>(-1);
  const [colorPhase, setColorPhase] = useState<'showing' | 'input' | 'feedback'>('showing');
  const [colorFeedback, setColorFeedback] = useState<'correct' | 'wrong' | null>(null);

  // ----------------------------------------------------
  // Memory Match State (Level 6)
  // ----------------------------------------------------
  const [memoryCards, setMemoryCards] = useState<{ id: string; pairId: string; emoji: string; label: string; faceUp: boolean; matched: boolean }[]>([]);
  const [memoryFlippedIdxs, setMemoryFlippedIdxs] = useState<number[]>([]);

  // Sound effects/visual quotes
  const [floatingQuote, setFloatingQuote] = useState<string>('');

  // Dynamic system timers
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const surpriseTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const handleFailedConclusionRef = useRef<(reason: 'TIMEOUT' | 'STRESS_CRASH') => void>(() => {});
  const triggerSurpriseCheckRef = useRef<() => void>(() => {});

  const renderOddOneOutCell = (cell: OddOneOutCell, isBlind: boolean) => {
    if (isBlind) return '?';
    if (cell.kind === 'TEXT') return cell.value;
    if (cell.kind === 'NUMBER') return String(cell.value);

    const s = cell.value;
    const shapeEl = (() => {
      const fill = s.fg;
      const stroke = '#0f172a';
      const sw = 3;
      if (s.shape === 'circle') return <circle cx="32" cy="32" r="16" fill={fill} stroke={stroke} strokeWidth={sw} />;
      if (s.shape === 'square') return <rect x="16" y="16" width="32" height="32" fill={fill} stroke={stroke} strokeWidth={sw} rx="2" />;
      if (s.shape === 'diamond') return <polygon points="32,12 52,32 32,52 12,32" fill={fill} stroke={stroke} strokeWidth={sw} />;
      return <polygon points="32,12 52,50 12,50" fill={fill} stroke={stroke} strokeWidth={sw} />;
    })();

    const stripes = Array.from({ length: 14 }, (_, i) => i).map((i) => {
      const offset = i * 10 - 30;
      return (
        <line
          key={i}
          x1={offset}
          y1={0}
          x2={offset + 64}
          y2={64}
          stroke={s.accent}
          strokeWidth={4}
          opacity={0.32}
        />
      );
    });

    const dots = Array.from({ length: s.dotCount }, (_, i) => i).map((i) => {
      const angle = (i / Math.max(1, s.dotCount)) * Math.PI * 2;
      const r = 22;
      const cx = 32 + Math.cos(angle) * r;
      const cy = 32 + Math.sin(angle) * r;
      return <circle key={i} cx={cx} cy={cy} r="2.2" fill="#0f172a" opacity={0.65} />;
    });

    return (
      <svg viewBox="0 0 64 64" className="w-10 h-10">
        <rect x="0" y="0" width="64" height="64" rx="8" fill={s.bg} stroke="#0f172a" strokeWidth="3" />
        <g transform={`rotate(${s.stripesAngle}, 32, 32)`}>{stripes}</g>
        {dots}
        {shapeEl}
      </svg>
    );
  };

  const startOddOneOutRound = (nextRound: number) => {
    const size = 25;
    const answerIdx = Math.floor(Math.random() * size);
    const kinds: OddOneOutKind[] = ['TEXT', 'NUMBER', 'PATTERN'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];

    const makeText = () => {
      const pair = ODD_ONE_OUT_TEXT_PAIRS[Math.floor(Math.random() * ODD_ONE_OUT_TEXT_PAIRS.length)];
      return {
        meta: { kind: 'TEXT' as const, label: '文字', base: pair.base, odd: pair.odd },
        baseCell: { kind: 'TEXT' as const, value: pair.base },
        oddCell: { kind: 'TEXT' as const, value: pair.odd },
      };
    };

    const makeNumber = () => {
      const base = 10 + Math.floor(Math.random() * 90);
      const deltas = [1, 2, 3, 5, 7];
      const delta = deltas[Math.floor(Math.random() * deltas.length)];
      const sign = Math.random() < 0.5 ? -1 : 1;
      let odd = base + sign * delta;
      if (odd < 10) odd = base + delta;
      if (odd > 99) odd = base - delta;
      if (odd === base) odd = base + 1;
      return {
        meta: { kind: 'NUMBER' as const, label: '数字', base: String(base), odd: String(odd) },
        baseCell: { kind: 'NUMBER' as const, value: base },
        oddCell: { kind: 'NUMBER' as const, value: odd },
      };
    };

    const makePattern = () => {
      const palette = [
        { bg: '#eff6ff', fg: '#60a5fa', accent: '#0ea5e9' },
        { bg: '#ecfeff', fg: '#22d3ee', accent: '#06b6d4' },
        { bg: '#f0fdf4', fg: '#4ade80', accent: '#22c55e' },
        { bg: '#fff7ed', fg: '#fb923c', accent: '#f97316' },
        { bg: '#fdf2f8', fg: '#f472b6', accent: '#ec4899' },
      ];
      const colors = palette[Math.floor(Math.random() * palette.length)];
      const shapes: PatternSpec['shape'][] = ['circle', 'square', 'triangle', 'diamond'];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const stripesAngle: 45 | 135 = Math.random() < 0.5 ? 45 : 135;
      const dotCount = 3 + Math.floor(Math.random() * 4);
      const baseSpec = { ...colors, shape, stripesAngle, dotCount };

      const mutate = () => {
        const roll = Math.random();
        if (roll < 0.45) {
          const otherShapes = shapes.filter((s) => s !== baseSpec.shape);
          return { ...baseSpec, shape: otherShapes[Math.floor(Math.random() * otherShapes.length)] };
        }
        if (roll < 0.8) {
          return { ...baseSpec, stripesAngle: baseSpec.stripesAngle === 45 ? 135 : 45 };
        }
        const d = baseSpec.dotCount + (Math.random() < 0.5 ? -1 : 1);
        return { ...baseSpec, dotCount: Math.max(2, Math.min(6, d)) };
      };

      const oddSpec = mutate();
      return {
        meta: { kind: 'PATTERN' as const, label: '图案', base: 'A', odd: 'B' },
        baseCell: { kind: 'PATTERN' as const, value: baseSpec },
        oddCell: { kind: 'PATTERN' as const, value: oddSpec },
      };
    };

    const { meta, baseCell, oddCell } = kind === 'TEXT' ? makeText() : kind === 'NUMBER' ? makeNumber() : makePattern();

    const cells = Array.from({ length: size }, (_, i) => (i === answerIdx ? oddCell : baseCell));
    setOddOneOutCells(cells);
    setOddOneOutAnswerIdx(answerIdx);
    setOddOneOutRound(nextRound);
    setOddOneOutMeta(meta);
    setShowHint(false);
    setHintTarget(null);
  };

  // ----------------------------------------------------
  // Initializers
  // ----------------------------------------------------
  useEffect(() => {
    clearReverseTimer();
    reverseAwaitingRef.current = false;
    timelineRef.current = [{ timeElapsed: 0, stress: initialStress }];
    
    // Pick a funny quote initially
    const randomQuote = FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)];
    setFloatingQuote(randomQuote);

    if (level.id === 1) {
      // Shuffled Schulte Table Numbers
      const gridSize = difficultyCfg.schulteGridSize;
      const numArr = Array.from({ length: gridSize }, (_, i) => i + 1);
      const shuffled = numArr.sort(() => Math.random() - 0.5);
      setSchulteNumbers(shuffled);
      setSchulteNext(1);
    } else if (level.id === 2) {
      const puzzle = generateSudokuPuzzle({
        size: difficultyCfg.sudokuSize,
        boxSize: difficultyCfg.sudokuBoxSize,
        clues: difficultyCfg.sudokuClues,
      });
      const cellsCopy = puzzle.board.map((cell) => ({ ...cell }));
      setSudokuCells(cellsCopy);
      setSudokuSolution(puzzle.solution);
      setSudokuSize(difficultyCfg.sudokuSize);
      setSudokuBoxSize(difficultyCfg.sudokuBoxSize);
      setSelectedSudokuIdx(null);
      setSudokuErrorIdxs([]);
    } else if (level.id === 3) {
      startOddOneOutRound(0);
    } else if (level.id === 4) {
      const cells = generatePipePuzzle4x4();
      const rotations = cells.map((c) => {
        const min = difficultyCfg.pipeScrambleMin;
        const max = difficultyCfg.pipeScrambleMax;
        const scramble = min === max ? min : min + Math.floor(Math.random() * (max - min + 1));
        return (c.solvedRotation + scramble) % 4;
      });
      setPipeCells(cells);
      setPipeRotations(rotations);
      pipeWinTriggeredRef.current = false;
      const powered = getPipePoweredIndices(cells, rotations);
      setPipePoweredIdxs([...powered]);
    } else if (level.id === 5) {
      // Initialize color sequence game
      const initialSeq = [Math.floor(Math.random() * 4)];
      setColorSequence(initialSeq);
      setColorPlayerInput([]);
      setColorRound(0);
      setColorShowingIdx(-1);
      setColorPhase('showing');
      setColorFeedback(null);
    } else if (level.id === 6) {
      // Initialize memory match — create shuffled card deck
      const pairs = MEMORY_PAIRS.slice(0, difficultyCfg.memoryPairsCount);
      const deck = [...pairs, ...pairs].map((p, i) => ({
        id: `card-${i}`,
        pairId: p.id,
        emoji: p.emoji,
        label: p.label,
        faceUp: false,
        matched: false,
      }));
      // Shuffle
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }
      setMemoryCards(deck);
      setMemoryFlippedIdxs([]);
    } else if (level.id === 7) {
      setReverseScore(0);
      reversePromptIdRef.current = 0;
      startReversePrompt();
    }

    setRemainingTime(baseTime);
    setStress(initialStress);
    setTimeElapsed(0);
    setConsecutiveCorrect(0);
    setErrorsMade(0);
    setSlackedOffCount(0);
    setTriggeredSurprisesCount(0);
    setSurpriseSuccesses(0);
    setStressMeltCounter(5);
  }, [level, talent, difficulty]);

  useEffect(() => {
    timeElapsedRef.current = timeElapsed;
  }, [timeElapsed]);

  useEffect(() => {
    stressRef.current = stress;
  }, [stress]);

  useEffect(() => {
    isSlackingRef.current = isSlacking;
  }, [isSlacking]);

  useEffect(() => {
    showSurpriseRef.current = showSurprise;
  }, [showSurprise]);

  // Record timeline every second
  useEffect(() => {
    if (isPaused || isSlacking || showSurprise) return;

    const recordingInterval = setInterval(() => {
      setTimeElapsed((prev) => {
        const nextTime = prev + 1;
        // Record timeline
        timelineRef.current.push({
          timeElapsed: nextTime,
          stress: stress,
        });
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(recordingInterval);
  }, [stress, isPaused, isSlacking, showSurprise]);

  // Capture peak stress
  useEffect(() => {
    if (stress > maxStressReached) {
      setMaxStressReached(stress);
    }
  }, [stress, maxStressReached]);

  // Main CountDown & Stress Melt Loop
  useEffect(() => {
    if (!handleFailedConclusionRef.current) return;
    if (!triggerSurpriseCheckRef.current) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      if (isPaused) return;
      if (isSlackingRef.current || showSurpriseRef.current) return;

      setRemainingTime((prev) => {
        if (prev <= 1) {
          handleFailedConclusionRef.current('TIMEOUT');
          return 0;
        }
        return prev - 1;
      });

      const currentStress = stressRef.current;
      if (currentStress >= 100) {
        setStressMeltCounter((melt) => {
          if (melt <= 1) {
            handleFailedConclusionRef.current('STRESS_CRASH');
            return 0;
          }
          return melt - 1;
        });
      } else {
        setStressMeltCounter(5);
      }

      const checkChance = Math.random();
      if (checkChance < 0.04 && timeElapsedRef.current > 8 && !showSurpriseRef.current) {
        triggerSurpriseCheckRef.current();
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPaused]);

  // ----------------------------------------------------
  // Actions
  // ----------------------------------------------------
  const handleFailedConclusion = (reason: 'TIMEOUT' | 'STRESS_CRASH') => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    clearReverseTimer();
    reverseAwaitingRef.current = false;
    onLose(getFinalStats(), reason);
  };

  useEffect(() => {
    handleFailedConclusionRef.current = handleFailedConclusion;
  }, [handleFailedConclusion]);

  const getFinalStats = (): GameStats => {
    const stars = calculateStars(errorsMade, maxStressReached, remainingTime);
    const stats: GameStats = {
      levelId: level.id,
      talent: talent,
      difficulty,
      timeRemainingBeforePenalty: remainingTime,
      timeUsed: timeElapsed,
      errorsMade: errorsMade,
      hintsUsed: hintsUsed,
      maxStress: maxStressReached,
      slackedOffCount: slackedOffCount,
      timeline: timelineRef.current,
      triggeredSurprisesCount: triggeredSurprisesCount,
      surpriseSuccesses: surpriseSuccesses,
      stars,
      score: 0,
    };
    stats.score = calculateScore(stats);
    return stats;
  };

  const calculateStars = (errs: number, maxStr: number, timeLeft: number): number => {
    // 3星: 0错误 + 压力<50% + 剩余时间>50%
    if (errs === 0 && maxStr < 50 && timeLeft > baseTime * 0.5) return 3;
    // 2星: ≤2错误 + 压力<75% + 剩余时间>25%
    if (errs <= 2 && maxStr < 75 && timeLeft > baseTime * 0.25) return 2;
    // 1星: 通关即得
    return 1;
  };

  // Adjust stress Helper (with talent modifiers)
  const adjustStressValue = (amount: number) => {
    // Lying flat: slower stress growth, slower recovery
    if (talent?.id === 'lying_flat') {
      amount = amount > 0 ? Math.round(amount * 0.7) : Math.round(amount * 0.6);
    }
    // Zen winner: all stress changes are dampened
    if (talent?.id === 'zen_winner') {
      amount = Math.round(amount * 0.8);
    }
    // Morning class collapse: immune to stress for first 10 seconds
    if (talent?.id === 'morning_class_collapse' && timeElapsed < 10 && amount > 0) {
      return; // immune to stress increase
    }
    setStress((prev) => {
      let next = prev + amount;
      if (next < 0) next = 0;
      if (next > stressMaxCap) next = stressMaxCap;
      return next;
    });
  };

  // ----------------------------------------------------
  // Level 1: Schulte Interaction Handler
  // ----------------------------------------------------
  const handleSchulteClick = (val: number) => {
    if (isPaused || isSlacking || showSurprise) return;

    if (val === schulteNext) {
      // Correct number picked!
      const isFinished = schulteNext === difficultyCfg.schulteGridSize;
      setIsVisualFeedback('CORRECT');
      playCorrect();
      hapticFeedback(10);

      // Consecutive multiplier drops
      const newConsecutive = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutive);

      // Decrement stress
      if (newConsecutive >= 3) {
        let recoverRate = talent?.id === 'panic_prone' ? -50 : -30;
        // Cramming master: enhanced combo recovery (but weakened after 60s)
        if (talent?.id === 'cramming_master') {
          recoverRate = timeElapsed < 60 ? -60 : -15;
        }
        // Involution anxiety: extra recovery on correct
        if (talent?.id === 'involution_anxiety') {
          recoverRate = Math.round(recoverRate * 1.3);
        }
        adjustStressValue(recoverRate);
        setConsecutiveCorrect(0); // consume combo
        setFloatingQuote('💡 连消COMBO爽翻！心态瞬间冷若冰霜！');
      } else {
        let baseRecover = -5;
        // Involution anxiety: extra recovery on each correct
        if (talent?.id === 'involution_anxiety') {
          baseRecover = -8;
        }
        // Cramming master: enhanced recovery early, weaker later
        if (talent?.id === 'cramming_master') {
          baseRecover = timeElapsed < 60 ? -8 : -2;
        }
        adjustStressValue(baseRecover);
      }

      // Amnesia flashes amnesia effect on success
      if (talent?.id === 'pre_exam_amnesia' && Math.random() < 0.15) {
        setSchulteAmnesiaFlash(true);
        setTimeout(() => setSchulteAmnesiaFlash(false), 550);
      }

      if (isFinished) {
        handleWinConclusion();
      } else {
        setSchulteNext((prev) => prev + 1);
      }
    } else {
      // WRONG guess! Apply pressure penalty
      setIsVisualFeedback('WRONG');
      playWrong();
      hapticFeedback(30);
      setConsecutiveCorrect(0);
      setErrorsMade((prev) => prev + 1);

      // Penalty logic depending on stress & talent
      const stressPenaltyBase = 20;
      const penaltyMultiplier = talent ? talent.stressPenaltyMultiplier : 1.0;
      let extraPanicFactor = talent?.id === 'social_phobia' ? 1.3 : 1.0;
      // Involution anxiety: extra penalty on wrong
      if (talent?.id === 'involution_anxiety') {
        extraPanicFactor *= 1.15;
      }
      // Milk tea addict: extra penalty on consecutive wrong
      if (talent?.id === 'milk_tea_addict' && consecutiveCorrect === 0) {
        extraPanicFactor *= 1.25;
      }
      const calculatedStressPenalty = Math.round(stressPenaltyBase * penaltyMultiplier * extraPanicFactor);

      adjustStressValue(calculatedStressPenalty);

      // Time Penalty deduction
      let timeDeduction = 5;
      if (stress > 40) timeDeduction = 7;
      if (stress > 70) timeDeduction = 10;
      if (talent?.id === 'panic_prone') timeDeduction = 8; // panic prone custom penalty

      setRemainingTime((prev) => {
        const offset = prev - timeDeduction;
        return offset < 0 ? 0 : offset;
      });

      // Show temporary warning quotes
      const randomMsg = FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)];
      setFloatingQuote(`❌ 点错了！时间扣减 ${timeDeduction}秒！\n${randomMsg}`);
    }
  };

  // State-directed click visuals
  const [visualFlash, setVisualFlash] = useState<'NONE' | 'CORRECT' | 'WRONG'>('NONE');
  const setIsVisualFeedback = (state: 'CORRECT' | 'WRONG') => {
    setVisualFlash(state);
    setTimeout(() => {
      setVisualFlash('NONE');
    }, 200);
  };

  // ----------------------------------------------------
  // Level 2: Sudoku Interaction Handler
  // ----------------------------------------------------
  const handleSudokuCellClick = (idx: number) => {
    if (isPaused || isSlacking || showSurprise) return;
    if (sudokuCells[idx].starting) return; // cannot select default template indices
    setSelectedSudokuIdx(idx);
  };

  const handleSudokuNumInput = (num: number | null) => {
    if (isPaused || isSlacking || showSurprise || selectedSudokuIdx === null) return;

    const cell = sudokuCells[selectedSudokuIdx];
    const correctVal = sudokuSolution[cell.row][cell.col];

    if (num === null) {
      // Clear input
      const newCells = [...sudokuCells];
      newCells[selectedSudokuIdx].val = null;
      setSudokuCells(newCells);
      // Clean errors index associated
      setSudokuErrorIdxs((prev) => prev.filter((i) => i !== selectedSudokuIdx));
      return;
    }

    // Input numerical value
    const newCells = [...sudokuCells];
    newCells[selectedSudokuIdx].val = num;
    setSudokuCells(newCells);

    if (num === correctVal) {
      // Cell is correct!
      setIsVisualFeedback('CORRECT');
      setConsecutiveCorrect((prev) => {
        const nextComb = prev + 1;
        if (nextComb >= 3) {
          const recoverRatio = talent?.id === 'panic_prone' ? -50 : -30;
          adjustStressValue(recoverRatio);
          setFloatingQuote('💡 逻辑闭环！感觉自己就是高斯在世！');
          return 0;
        }
        return nextComb;
      });
      adjustStressValue(-4);
      setSudokuErrorIdxs((prev) => prev.filter((i) => i !== selectedSudokuIdx));

      // Check ultimate sudoku victory logic
      checkSudokuVictory(newCells);
    } else {
      // Incorrect cell digit!
      setIsVisualFeedback('WRONG');
      setConsecutiveCorrect(0);
      setErrorsMade((prev) => prev + 1);

      // Add to errors index list to display red borders
      if (!sudokuErrorIdxs.includes(selectedSudokuIdx)) {
        setSudokuErrorIdxs((prev) => [...prev, selectedSudokuIdx]);
      }

      // Calculations for stress penalty
      const stressPenaltyBase = 15;
      const penaltyMultiplier = talent ? talent.stressPenaltyMultiplier : 1.0;
      const bonusPanic = talent?.id === 'low_sugar' ? 1.15 : 1.0;
      const computedStress = Math.round(stressPenaltyBase * penaltyMultiplier * bonusPanic);

      adjustStressValue(computedStress);

      // Time penalty
      let timeDeduction = 5;
      if (stress > 40) timeDeduction = 7;
      if (stress > 70) timeDeduction = 10;
      if (talent?.id === 'panic_prone') timeDeduction = 8;

      setRemainingTime((prev) => {
        const offset = prev - timeDeduction;
        return offset < 0 ? 0 : offset;
      });

      setFloatingQuote(`❌ 填入数字冲突！倒退 ${timeDeduction}秒！\n逻辑错乱，数理大厦正在坍塌！`);
    }
  };

  const checkSudokuVictory = (cells: SudokuCell[]) => {
    // A grid is complete if all cells are non-null and no error indexes remain
    const isCompleted = cells.every((c) => c.val !== null);
    const hasNoValidationErrors = cells.every((c) => c.val === sudokuSolution[c.row][c.col]);

    if (isCompleted && hasNoValidationErrors) {
      handleWinConclusion();
    }
  };

  const handleWinConclusion = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (surpriseTimerIntervalRef.current) clearInterval(surpriseTimerIntervalRef.current);
    clearReverseTimer();
    reverseAwaitingRef.current = false;
    onWin(getFinalStats());
  };

  // ----------------------------------------------------
  // Dynamic Slack Off (触摸减压) Code Block
  // ----------------------------------------------------
  const triggerSlackOff = () => {
    if (isPaused || isSlacking || showSurprise) return;

    setSlackedOffCount((prev) => prev + 1);
    setConsecutiveCorrect(0);

    // 扣除5秒时间
    setRemainingTime((prev) => {
      const penalty = prev - 5;
      return penalty < 0 ? 0 : penalty;
    });

    // 立即减少20%压力
    let relief = -20;
    // 天赋加成
    if (talent?.id === 'milk_tea_addict') relief = Math.round(relief * 1.5); // 奶茶续命 +50%
    if (talent?.id === 'low_sugar') relief = Math.round(relief * 1.3); // 低血糖 +30%
    adjustStressValue(relief);

    setFloatingQuote('☕ 摸鱼5秒，压力减轻了！');
    playClick();
  };

  // ----------------------------------------------------
  // Instructor Surprise Audit Alert (导员突袭机制)
  // ----------------------------------------------------
  const triggerSurpriseCheck = () => {
    setTriggeredSurprisesCount((prev) => prev + 1);
    setShowSurprise(true);
    // Phone addict: faster reaction time (+50%), social phobia: shorter time
    const baseTimeVal = talent?.id === 'phone_addict' ? 4.5 : talent?.id === 'social_phobia' ? 1.8 : 3.0;
    setSurpriseBaseTime(baseTimeVal);
    setSurpriseTimeLeft(baseTimeVal);
    setSurpriseStatusMsg('');

    // Generate option templates
    const correctAnswers = [
      '【极速挺起胸膛假装认真听讲】',
      '【火速戴上眼镜，疯狂做笔记】',
      '【立正答到，说在认真反思！】',
      '【利索点击静音，假装没听见】',
    ];
    const wrongAnswers = [
      '【挂断催魂电话直接关机摆烂】',
      '【大睡大摆：直接开始呼呼大睡】',
      '【在微信群里回一个：收到扣2】',
      '【大声骂：谁啊一大早点我！】',
    ];

    const pickCorrect = correctAnswers[Math.floor(Math.random() * correctAnswers.length)];
    const pickWrong = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];

    // Randomize indices order
    const randOrder = Math.random() < 0.5;
    const drawnOptions = randOrder ? [pickCorrect, pickWrong] : [pickWrong, pickCorrect];
    const correctIdx = randOrder ? 0 : 1;

    setSurpriseOptions(drawnOptions);
    setSurpriseCorrectIdx(correctIdx);

    // Alert decrease ticks
    let leftTime = baseTimeVal;
    surpriseTimerIntervalRef.current = setInterval(() => {
      leftTime -= 0.1;
      // Round to 1 decimal place
      const rounded = Math.round(leftTime * 10) / 10;
      setSurpriseTimeLeft(rounded);

      if (rounded <= 0) {
        if (surpriseTimerIntervalRef.current) clearInterval(surpriseTimerIntervalRef.current);
        handleSurpriseResolve(false); // timeout count as failed audit
      }
    }, 100);
  };

  useEffect(() => {
    triggerSurpriseCheckRef.current = triggerSurpriseCheck;
  }, [triggerSurpriseCheck]);

  const handleSurpriseResolve = (isSuccess: boolean) => {
    if (surpriseTimerIntervalRef.current) clearInterval(surpriseTimerIntervalRef.current);
    
    if (isSuccess) {
      setSurpriseSuccesses((prev) => prev + 1);
      // Stress decreases! Social phobia talent completely resets stress to 0!
      if (talent?.id === 'social_phobia') {
        setStress(0);
        setFloatingQuote('🔥 社恐自救！绝密走位满血复活，压力一扫而空！');
      } else {
        adjustStressValue(-15);
        setFloatingQuote('✅ 安全化解查岗！导员夸你是个有志之士。');
      }
      setSurpriseStatusMsg('SUCCESS');
    } else {
      // Severe mistake! High stress and flash warning
      const damage = 35;
      adjustStressValue(damage);
      setFloatingQuote('❌ 暴露了！导员大发雷霆并扣除平时成绩！脑壳一阵剧痛！');
      setSurpriseStatusMsg('FAILURE');
    }

    // Hide popup after brief showing
    setTimeout(() => {
      setShowSurprise(false);
    }, 1200);
  };

  const handleSurpriseOptionClick = (idx: number) => {
    if (surpriseTimeLeft <= 0) return;
    const isCorrect = idx === surpriseCorrectIdx;
    handleSurpriseResolve(isCorrect);
  };

  // ----------------------------------------------------
  // Render Dynamic Class Names for Stress states (0-20, 21-40, 41-70, 71-100)
  // ----------------------------------------------------
  const getStressTitle = () => {
    if (stress <= 20) return { label: '风平浪静', color: 'text-emerald-400' };
    if (stress <= 40) return { label: '轻微慌张', color: 'text-yellow-400 animate-pulse' };
    if (stress <= 70) return { label: '心态焦虑', color: 'text-orange-500 font-bold' };
    return { label: '逆境绝境 💥', color: 'text-red-500 font-black animate-bounce' };
  };

  // Dynamic CSS effects inside puzzle playground
  const getGridDistortionClass = () => {
    if (isSlacking) return 'blur-md pointer-events-none transition-all duration-300';
    if (schulteAmnesiaFlash) return 'blur-lg opacity-30 transition-all duration-100';

    let classes = '';
    
    // Tier 2: 21-40% Panic shake
    if (stress > 20 && stress <= 40) {
      classes += ' animate-shake-gentle';
    }
    // Tier 3: 41-70% Panic blur + distortion
    if (stress > 40 && stress <= 70) {
      classes += ' blur-[1.2px] rotate-1 scale-98 active:scale-95 animate-shake-constant';
    }
    // Tier 4: 71-100% Extremity dizzy wobble
    if (stress > 70) {
      classes += ' blur-[2px] scale-95 select-none animate-shake-extreme rotate-2 translate-y-1';
    }

    return classes;
  };

  // ----------------------------------------------------
  // Level 3: Sliding Puzzle Helpers
  // ----------------------------------------------------
  const handleOddOneOutClick = (idx: number) => {
    if (isPaused || isSlacking || showSurprise) return;
    if (oddOneOutAnswerIdx < 0) return;

    if (idx === oddOneOutAnswerIdx) {
      setIsVisualFeedback('CORRECT');
      setConsecutiveCorrect((prev) => prev + 1);
      adjustStressValue(-4);
      setHintTarget(null);

      const nextRound = oddOneOutRound + 1;
      if (nextRound >= ODD_ONE_OUT_TARGET_ROUNDS) {
        handleWinConclusion();
        return;
      }

      setTimeout(() => startOddOneOutRound(nextRound), 150);
      return;
    }

    setIsVisualFeedback('WRONG');
    setConsecutiveCorrect(0);
    setErrorsMade((prev) => prev + 1);

    const stressPenaltyBase = 15;
    const penaltyMultiplier = talent ? talent.stressPenaltyMultiplier : 1.0;
    const computedStress = Math.round(stressPenaltyBase * penaltyMultiplier);
    adjustStressValue(computedStress);

    let timeDeduction = 4;
    if (stress > 40) timeDeduction = 6;
    if (stress > 70) timeDeduction = 9;
    if (talent?.id === 'panic_prone') timeDeduction = 7;

    setRemainingTime((prev) => Math.max(0, prev - timeDeduction));
    setFloatingQuote(`❌ 看走眼了！时间扣减 ${timeDeduction}秒！`);
  };

  // ----------------------------------------------------
  // Level 7: Reverse Command Helpers
  // ----------------------------------------------------
  const randomReverseDir = (): ReverseDir => {
    const dirs: ReverseDir[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    return dirs[Math.floor(Math.random() * dirs.length)];
  };

  const getReversePromptMs = (): number => {
    if (difficulty === 'EASY') return 900;
    if (difficulty === 'MEDIUM') return 750;
    if (difficulty === 'HARD') return 650;
    return 520;
  };

  const clearReverseTimer = () => {
    if (reverseTimeoutRef.current) clearTimeout(reverseTimeoutRef.current);
    reverseTimeoutRef.current = null;
  };

  const getOppositeDir = (dir: ReverseDir): ReverseDir => {
    if (dir === 'UP') return 'DOWN';
    if (dir === 'DOWN') return 'UP';
    if (dir === 'LEFT') return 'RIGHT';
    return 'LEFT';
  };

  const applyReverseMissPenalty = () => {
    setIsVisualFeedback('WRONG');
    setConsecutiveCorrect(0);
    setErrorsMade((prev) => prev + 1);

    const stressPenaltyBase = 15;
    const penaltyMultiplier = talent ? talent.stressPenaltyMultiplier : 1.0;
    adjustStressValue(Math.round(stressPenaltyBase * penaltyMultiplier));

    let timeDeduction = 4;
    if (stress > 40) timeDeduction = 6;
    if (stress > 70) timeDeduction = 9;
    if (talent?.id === 'panic_prone') timeDeduction = 7;
    setRemainingTime((prev) => Math.max(0, prev - timeDeduction));
    setFloatingQuote(`⏱ 反应太慢！时间 -${timeDeduction}s`);
  };

  const startReversePrompt = () => {
    clearReverseTimer();
    const nextId = reversePromptIdRef.current + 1;
    reversePromptIdRef.current = nextId;
    reverseAwaitingRef.current = true;
    setReverseDir(randomReverseDir());

    const ms = getReversePromptMs();
    reverseTimeoutRef.current = setTimeout(() => {
      if (level.id !== 7) return;
      if (reversePromptIdRef.current !== nextId) return;
      if (!reverseAwaitingRef.current) return;
      reverseAwaitingRef.current = false;
      applyReverseMissPenalty();
      startReversePrompt();
    }, ms);
  };

  const handleReverseClick = (picked: ReverseDir) => {
    if (isPaused || isSlacking || showSurprise) return;
    const expected = getOppositeDir(reverseDir);
    if (!reverseAwaitingRef.current) return;
    reverseAwaitingRef.current = false;
    clearReverseTimer();

    if (picked === expected) {
      setIsVisualFeedback('CORRECT');
      setConsecutiveCorrect((prev) => prev + 1);
      adjustStressValue(-3);
      setHintTarget(null);

      const nextScore = reverseScore + 1;
      setReverseScore(nextScore);
      if (nextScore >= REVERSE_TARGET) {
        handleWinConclusion();
        return;
      }
      startReversePrompt();
      return;
    }

    setIsVisualFeedback('WRONG');
    setConsecutiveCorrect(0);
    setErrorsMade((prev) => prev + 1);

    const stressPenaltyBase = 15;
    const penaltyMultiplier = talent ? talent.stressPenaltyMultiplier : 1.0;
    adjustStressValue(Math.round(stressPenaltyBase * penaltyMultiplier));

    let timeDeduction = 4;
    if (stress > 40) timeDeduction = 6;
    if (stress > 70) timeDeduction = 9;
    if (talent?.id === 'panic_prone') timeDeduction = 7;
    setRemainingTime((prev) => Math.max(0, prev - timeDeduction));
    setFloatingQuote(`❌ 点反了！应该点【${expected === 'UP' ? '上' : expected === 'DOWN' ? '下' : expected === 'LEFT' ? '左' : '右'}】 · 时间 -${timeDeduction}s`);
    startReversePrompt();
  };

  // ----------------------------------------------------
  // Level 4: Pipe Puzzle Helpers
  // ----------------------------------------------------
  const pipeCols = 4;
  const pipeRows = 4;
  const pipeSourceIdx = 0;
  const pipeSinkIdx = 15;

  const shuffle = <T,>(arr: readonly T[]): T[] => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const getPipeConnections = (type: PipeType, rotation: number): boolean[] => {
    // [up, right, down, left]
    const baseMap: Record<PipeType, boolean[]> = {
      empty:   [false, false, false, false],
      straight:[true, false, true, false],
      corner:  [true, true, false, false],
      tee:     [true, true, true, false],
      cross:   [true, true, true, true],
    };
    const base = baseMap[type];
    // Rotate right by `rotation` steps
    const result = [false, false, false, false];
    for (let d = 0; d < 4; d++) {
      if (base[d]) result[(d + rotation) % 4] = true;
    }
    return result;
  };

  const generatePipePuzzle4x4 = (): PipeCell[] => {
    const dirToDelta: Array<[number, number]> = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    const oppositeDir = [2, 3, 0, 1] as const;

    const inBounds = (r: number, c: number) => r >= 0 && r < pipeRows && c >= 0 && c < pipeCols;
    const idxOf = (r: number, c: number) => r * pipeCols + c;

    const findPath = (): number[] | null => {
      const target = pipeSinkIdx;
      const visited = new Set<number>();
      const path: number[] = [];

      const dfs = (idx: number): boolean => {
        visited.add(idx);
        path.push(idx);
        if (idx === target) return true;

        const r = Math.floor(idx / pipeCols);
        const c = idx % pipeCols;
        const dirs = shuffle([0, 1, 2, 3] as const);
        for (const dir of dirs) {
          const nr = r + dirToDelta[dir][0];
          const nc = c + dirToDelta[dir][1];
          if (!inBounds(nr, nc)) continue;
          const nIdx = idxOf(nr, nc);
          if (visited.has(nIdx)) continue;
          if (dfs(nIdx)) return true;
        }

        path.pop();
        visited.delete(idx);
        return false;
      };

      if (!dfs(pipeSourceIdx)) return null;
      return path;
    };

    for (let attempt = 0; attempt < 60; attempt++) {
      const path = findPath();
      if (!path || path.length < 3) continue;

      const neighbors = new Map<number, Set<number>>();
      const connect = (a: number, b: number) => {
        if (!neighbors.has(a)) neighbors.set(a, new Set<number>());
        if (!neighbors.has(b)) neighbors.set(b, new Set<number>());
        neighbors.get(a)!.add(b);
        neighbors.get(b)!.add(a);
      };

      for (let i = 0; i < path.length - 1; i++) {
        connect(path[i], path[i + 1]);
      }

      const pathSet = new Set<number>(path);
      const candidates: Array<[number, number]> = [];
      for (let i = 1; i < path.length - 2; i++) {
        const a = path[i];
        const ar = Math.floor(a / pipeCols);
        const ac = a % pipeCols;
        for (const [dr, dc] of dirToDelta) {
          const nr = ar + dr;
          const nc = ac + dc;
          if (!inBounds(nr, nc)) continue;
          const b = idxOf(nr, nc);
          if (b === path[i - 1] || b === path[i + 1]) continue;
          if (!pathSet.has(b)) continue;
          if (neighbors.get(a)?.has(b)) continue;
          candidates.push([a, b]);
        }
      }

      const extraEdgesTarget = Math.random() < 0.45 ? 0 : 1 + Math.floor(Math.random() * 2);
      let added = 0;
      for (const [a, b] of shuffle(candidates)) {
        if (added >= extraEdgesTarget) break;
        const da = neighbors.get(a)?.size ?? 0;
        const db = neighbors.get(b)?.size ?? 0;
        if (da >= 4 || db >= 4) continue;
        connect(a, b);
        added += 1;
      }

      const edgeDirs = (a: number, b: number): [number, number] => {
        const ar = Math.floor(a / pipeCols);
        const ac = a % pipeCols;
        const br = Math.floor(b / pipeCols);
        const bc = b % pipeCols;
        if (br === ar - 1 && bc === ac) return [0, 2];
        if (br === ar + 1 && bc === ac) return [2, 0];
        if (br === ar && bc === ac + 1) return [1, 3];
        return [3, 1];
      };

      const desiredConnsByIdx = new Map<number, boolean[]>();
      for (const idx of neighbors.keys()) {
        desiredConnsByIdx.set(idx, [false, false, false, false]);
      }

      for (const [a, set] of neighbors.entries()) {
        const conns = desiredConnsByIdx.get(a)!;
        for (const b of set) {
          const [adir] = edgeDirs(a, b);
          conns[adir] = true;
        }
      }

      const sourceConns = desiredConnsByIdx.get(pipeSourceIdx) ?? [false, false, false, false];
      sourceConns[3] = true;
      desiredConnsByIdx.set(pipeSourceIdx, sourceConns);

      const sinkConns = desiredConnsByIdx.get(pipeSinkIdx) ?? [false, false, false, false];
      sinkConns[1] = true;
      desiredConnsByIdx.set(pipeSinkIdx, sinkConns);

      const cells: PipeCell[] = [];
      for (let idx = 0; idx < pipeCols * pipeRows; idx++) {
        const desired = desiredConnsByIdx.get(idx);
        if (!desired) {
          cells.push({ type: 'empty', solvedRotation: 0 });
          continue;
        }
        const deg = desired.filter(Boolean).length;
        let type: PipeType = 'empty';
        if (deg === 2) {
          const isStraight = (desired[0] && desired[2]) || (desired[1] && desired[3]);
          type = isStraight ? 'straight' : 'corner';
        } else if (deg === 3) {
          type = 'tee';
        } else if (deg === 4) {
          type = 'cross';
        } else {
          continue;
        }

        let solvedRotation = 0;
        for (let r = 0; r < 4; r++) {
          const conns = getPipeConnections(type, r);
          let ok = true;
          for (let d = 0; d < 4; d++) {
            if (conns[d] !== desired[d]) {
              ok = false;
              break;
            }
          }
          if (ok) {
            solvedRotation = r;
            break;
          }
        }

        cells.push({ type, solvedRotation });
      }

      const solvedRots = cells.map((c) => c.solvedRotation);
      if (!getPipePoweredIndices(cells, solvedRots).has(pipeSinkIdx)) continue;
      if (hasPipeLeaks(cells, solvedRots)) continue;

      return cells;
    }

    return PIPE_PUZZLES[0].map((c) => ({ ...c }));
  };

  const getPipePoweredIndices = (cells: PipeCell[], rots: number[]): Set<number> => {
    if (cells.length !== pipeCols * pipeRows || rots.length !== pipeCols * pipeRows) return new Set<number>();
    const startConns = getPipeConnections(cells[pipeSourceIdx].type, rots[pipeSourceIdx]);
    if (!startConns[3]) return new Set<number>();

    const visited = new Set<number>();
    const queue: number[] = [pipeSourceIdx];
    visited.add(pipeSourceIdx);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const r = Math.floor(curr / pipeCols);
      const c = curr % pipeCols;
      const conns = getPipeConnections(cells[curr].type, rots[curr]);

      const dirs: Array<[number, number, number, number]> = [
        [-1, 0, 0, 2],
        [0, 1, 1, 3],
        [1, 0, 2, 0],
        [0, -1, 3, 1],
      ];

      for (const [dr, dc, myDir, theirDir] of dirs) {
        if (!conns[myDir]) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= pipeRows || nc < 0 || nc >= pipeCols) continue;
        const nIdx = nr * pipeCols + nc;
        if (visited.has(nIdx)) continue;
        const nConns = getPipeConnections(cells[nIdx].type, rots[nIdx]);
        if (nConns[theirDir]) {
          visited.add(nIdx);
          queue.push(nIdx);
        }
      }
    }

    return visited;
  };

  const hasPipeLeaks = (cells: PipeCell[], rots: number[]): boolean => {
    const opp = [2, 3, 0, 1] as const;
    for (let idx = 0; idx < cells.length; idx++) {
      const r = Math.floor(idx / pipeCols);
      const c = idx % pipeCols;
      const conns = getPipeConnections(cells[idx].type, rots[idx]);
      for (let dir = 0; dir < 4; dir++) {
        if (!conns[dir]) continue;
        const drdc = [
          [-1, 0],
          [0, 1],
          [1, 0],
          [0, -1],
        ] as const;
        const nr = r + drdc[dir][0];
        const nc = c + drdc[dir][1];
        const isOut = nr < 0 || nr >= pipeRows || nc < 0 || nc >= pipeCols;
        if (isOut) {
          const allowed =
            (idx === pipeSourceIdx && dir === 3) ||
            (idx === pipeSinkIdx && dir === 1);
          if (!allowed) return true;
          continue;
        }
        const nIdx = nr * pipeCols + nc;
        const nConns = getPipeConnections(cells[nIdx].type, rots[nIdx]);
        if (!nConns[opp[dir]]) return true;
      }
    }
    return false;
  };

  const handlePipeClick = (idx: number) => {
    if (isPaused || isSlacking || showSurprise) return;
    if (pipeCells[idx].type === 'empty') return;

    setPipeRotations((prev) => {
      const next = [...prev];
      next[idx] = (next[idx] + 1) % 4;
      checkPipeVictory(next);
      return next;
    });
  };

  const checkPipeVictory = (rots: number[]) => {
    const powered = getPipePoweredIndices(pipeCells, rots);
    setPipePoweredIdxs([...powered]);
    if (pipeWinTriggeredRef.current) return;
    if (!powered.has(pipeSinkIdx)) return;
    if (hasPipeLeaks(pipeCells, rots)) return;
    pipeWinTriggeredRef.current = true;
    setTimeout(() => {
      handleWinConclusion();
    }, 350);
  };

  // ----------------------------------------------------
  // Level 5: Color Sequence Memory Helpers
  // ----------------------------------------------------
  const COLOR_SEQUENCE_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#eab308'] as const;
  const COLOR_SEQUENCE_NAMES = ['红', '蓝', '绿', '黄'] as const;
  const COLOR_SEQUENCE_TARGET_ROUNDS = difficultyCfg.colorTargetRounds;

  // Show the sequence when round changes or phase becomes 'showing'
  useEffect(() => {
    if (level.id !== 5) return;
    if (colorPhase !== 'showing') return;
    if (isPaused || isSlacking || showSurprise) return;

    let idx = 0;
    setColorShowingIdx(-1);

    const showTimer = setInterval(() => {
      if (idx < colorSequence.length) {
        setColorShowingIdx(colorSequence[idx]);
        setTimeout(() => setColorShowingIdx(-1), 400);
        idx++;
      } else {
        clearInterval(showTimer);
        setColorShowingIdx(-1);
        setColorPhase('input');
        setColorPlayerInput([]);
      }
    }, 600);

    return () => clearInterval(showTimer);
  }, [level.id, colorPhase, colorSequence, isPaused, isSlacking, showSurprise]);

  const handleColorButtonClick = (colorIdx: number) => {
    if (isPaused || isSlacking || showSurprise) return;
    if (colorPhase !== 'input') return;

    const newInput = [...colorPlayerInput, colorIdx];
    setColorPlayerInput(newInput);

    const currentStep = newInput.length - 1;
    if (newInput[currentStep] !== colorSequence[currentStep]) {
      // Wrong!
      setColorFeedback('wrong');
      setColorPhase('feedback');
      setErrorsMade((prev) => prev + 1);
      setConsecutiveCorrect(0);

      const penaltyMultiplier = talent ? talent.stressPenaltyMultiplier : 1.0;
      adjustStressValue(Math.round(15 * penaltyMultiplier));

      let timeDeduction = 5;
      if (stress > 40) timeDeduction = 7;
      if (stress > 70) timeDeduction = 10;
      setRemainingTime((prev) => Math.max(0, prev - timeDeduction));

      setFloatingQuote(`❌ 顺序错了！时间扣减 ${timeDeduction}秒！\n${FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)]}`);

      // After showing feedback, replay same round
      setTimeout(() => {
        setColorFeedback(null);
        setColorPhase('showing');
        setColorPlayerInput([]);
      }, 1200);
      return;
    }

    // Correct step
    adjustStressValue(-3);

    if (newInput.length === colorSequence.length) {
      // Completed this round!
      const newRound = colorRound + 1;
      setConsecutiveCorrect((prev) => prev + 1);

      if (newRound >= COLOR_SEQUENCE_TARGET_ROUNDS) {
        // Win!
        setColorFeedback('correct');
        setTimeout(() => handleWinConclusion(), 500);
        return;
      }

      // Add next color to sequence
      const nextColor = Math.floor(Math.random() * 4);
      const newSeq = [...colorSequence, nextColor];
      setColorFeedback('correct');
      setColorPhase('feedback');

      setTimeout(() => {
        setColorSequence(newSeq);
        setColorRound(newRound);
        setColorFeedback(null);
        setColorPhase('showing');
        setColorPlayerInput([]);
      }, 800);
    }
  };

  const handleColorSequenceReset = () => {
    if (isPaused || isSlacking || showSurprise) return;
    const initialSeq = [Math.floor(Math.random() * 4)];
    setColorSequence(initialSeq);
    setColorPlayerInput([]);
    setColorRound(0);
    setColorShowingIdx(-1);
    setColorPhase('showing');
    setColorFeedback(null);
  };

  // ----------------------------------------------------
  // Hint System (all levels)
  // ----------------------------------------------------
  const handleUseHint = () => {
    if (isPaused || isSlacking || showSurprise || showHint) return;

    const canApplyHint = (): boolean => {
      if (level.id === 1) return true;
      if (level.id === 2) {
        return sudokuCells.some((c) => !c.starting && c.val !== sudokuSolution[c.row][c.col]);
      }
      if (level.id === 3) {
        return oddOneOutAnswerIdx >= 0 && oddOneOutCells.length > 0;
      }
      if (level.id === 4) {
        return pipeCells.some((c, idx) => c.type !== 'empty' && pipeRotations[idx] !== c.solvedRotation);
      }
      if (level.id === 5) {
        return colorPhase === 'input' && colorPlayerInput.length < colorSequence.length;
      }
      if (level.id === 6) {
        if (memoryFlippedIdxs.length === 1) {
          const openIdx = memoryFlippedIdxs[0];
          const openCard = memoryCards[openIdx];
          if (!openCard) return false;
          return (
            memoryCards.findIndex((c, i) => i !== openIdx && !c.matched && c.pairId === openCard.pairId) >= 0
          );
        }
        if (memoryFlippedIdxs.length === 0) {
          return memoryCards.some((c) => !c.matched);
        }
        return false;
      }
      if (level.id === 7) return true;
      return false;
    };

    if (!canApplyHint()) {
      setFloatingQuote('💡 当前阶段没有可用提示。');
      return;
    }

    let timeDeduction = 5;
    if (level.id === 2) timeDeduction = 8;

    setRemainingTime((prev) => Math.max(0, prev - timeDeduction));
    adjustStressValue(10);
    setHintsUsed((prev) => prev + 1);
    setShowHint(true);
    setFloatingQuote(`💡 使用了提示！时间 -${timeDeduction}s，逆风值 +10%`);

    if (level.id === 1) {
      // Highlight the next number to click
      setHintTarget(schulteNext);
      setTimeout(() => { setShowHint(false); setHintTarget(null); }, 2000);
    } else if (level.id === 2) {
      // Fill in one correct empty cell
      const emptyCells = sudokuCells
        .map((c, i) => ({ ...c, idx: i }))
        .filter((c) => !c.starting && c.val !== sudokuSolution[c.row][c.col]);
      if (emptyCells.length > 0) {
        const pick = emptyCells.find((c) => c.val === null) ?? emptyCells[0];
        const newCells = [...sudokuCells];
        newCells[pick.idx] = { ...newCells[pick.idx], val: sudokuSolution[pick.row][pick.col] };
        setSudokuCells(newCells);
        setSudokuErrorIdxs((prev) => prev.filter((i) => i !== pick.idx));
        setHintTarget(pick.idx);
        checkSudokuVictory(newCells);
      }
      setTimeout(() => { setShowHint(false); setHintTarget(null); }, 2000);
    } else if (level.id === 3) {
      setHintTarget(oddOneOutAnswerIdx);
      setTimeout(() => { setShowHint(false); setHintTarget(null); }, 2000);
    } else if (level.id === 4) {
      // Highlight a pipe that needs rotation
      for (let idx = 0; idx < pipeCells.length; idx++) {
        if (pipeCells[idx].type === 'empty') continue;
        if (pipeRotations[idx] !== pipeCells[idx].solvedRotation) {
          setHintTarget(idx);
          break;
        }
      }
      setTimeout(() => { setShowHint(false); setHintTarget(null); }, 2000);
    } else if (level.id === 5) {
      // Flash the next color in the sequence
      if (colorPhase === 'input' && colorPlayerInput.length < colorSequence.length) {
        const nextColor = colorSequence[colorPlayerInput.length];
        setColorShowingIdx(nextColor);
        setTimeout(() => { setColorShowingIdx(-1); setShowHint(false); }, 1500);
      } else {
        setShowHint(false);
        setHintTarget(null);
      }
    } else if (level.id === 6) {
      if (memoryFlippedIdxs.length === 1) {
        const openIdx = memoryFlippedIdxs[0];
        const openCard = memoryCards[openIdx];
        if (openCard) {
          const matchIdx = memoryCards.findIndex(
            (c, i) => i !== openIdx && !c.matched && c.pairId === openCard.pairId
          );
          if (matchIdx >= 0) setHintTarget(matchIdx);
        }
        setTimeout(() => { setShowHint(false); setHintTarget(null); }, 2000);
      } else if (memoryFlippedIdxs.length === 0) {
        const firstUnmatchedIdx = memoryCards.findIndex((c) => !c.matched);
        if (firstUnmatchedIdx >= 0) {
          const pairId = memoryCards[firstUnmatchedIdx].pairId;
          const pairIdxs = memoryCards
            .map((c, i) => ({ c, i }))
            .filter(({ c }) => !c.matched && c.pairId === pairId)
            .map(({ i }) => i);
          if (pairIdxs.length >= 2) {
            const [a, b] = pairIdxs;
            setHintTarget(a);
            setMemoryCards((prev) =>
              prev.map((c, i) => (i === a || i === b ? { ...c, faceUp: true } : c))
            );
            setTimeout(() => {
              setMemoryCards((prev) =>
                prev.map((c, i) => (i === a || i === b ? { ...c, faceUp: c.matched ? true : false } : c))
              );
              setShowHint(false);
              setHintTarget(null);
            }, 1500);
            return;
          }
        }
        setTimeout(() => { setShowHint(false); setHintTarget(null); }, 2000);
      } else {
        setTimeout(() => { setShowHint(false); setHintTarget(null); }, 2000);
      }
    } else if (level.id === 7) {
      const dirToIdx = (d: ReverseDir) => (d === 'UP' ? 0 : d === 'DOWN' ? 1 : d === 'LEFT' ? 2 : 3);
      const expected = getOppositeDir(reverseDir);
      setHintTarget(dirToIdx(expected));
      setTimeout(() => { setShowHint(false); setHintTarget(null); }, 2000);
    }

  };

  // ----------------------------------------------------
  // Level 6: Memory Match Helpers
  // ----------------------------------------------------
  const handleMemoryCardClick = (idx: number) => {
    if (isPaused || isSlacking || showSurprise || showHint) return;
    if (memoryCards[idx].faceUp || memoryCards[idx].matched) return;
    if (memoryFlippedIdxs.length >= 2) return;

    const newCards = [...memoryCards];
    newCards[idx] = { ...newCards[idx], faceUp: true };
    setMemoryCards(newCards);

    const newFlipped = [...memoryFlippedIdxs, idx];
    setMemoryFlippedIdxs(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (newCards[first].pairId === newCards[second].pairId) {
        // Match found!
        setTimeout(() => {
          setMemoryCards((prev) => {
            const updated = [...prev];
            updated[first] = { ...updated[first], matched: true };
            updated[second] = { ...updated[second], matched: true };
            // Check win after updating
            const allMatched = updated.every((c) => c.matched);
            if (allMatched) {
              setTimeout(() => handleWinConclusion(), 50);
            }
            return updated;
          });
          setMemoryFlippedIdxs([]);
        }, 400);
      } else {
        // No match — flip back after delay
        setTimeout(() => {
          setMemoryCards((prev) => {
            const updated = [...prev];
            updated[first] = { ...updated[first], faceUp: false };
            updated[second] = { ...updated[second], faceUp: false };
            return updated;
          });
          setMemoryFlippedIdxs([]);
        }, 800);
      }
    }
  };

  // Return text formats
  const formattedTime = () => {
    const min = Math.floor(remainingTime / 60);
    const sec = remainingTime % 60;
    return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  return (
    <div className="relative flex flex-col h-full bg-[#f9f9f9] text-black overflow-hidden select-none">

      {/* Visual background shake indicator overlay */}
      {stress > 70 && (
        <div className="absolute inset-0 border-4 border-red-900/40 pointer-events-none z-40 animate-pulse" />
      )}

      {/* ── INFO PANEL ── */}
      <div className="shrink-0 px-4 pt-2 pb-2">
        <div className="manga-panel bg-white p-3">
          {/* 压力 + 暂停 */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <span className="text-red-600 text-base">💀</span>
              <span className="text-xs font-bold">压力</span>
              <div className="w-24 h-3 border-2 border-black bg-neutral-100 relative overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-300 ease-out ${stress >= 71 ? 'bg-red-600 animate-pulse' : stress >= 41 ? 'bg-orange-500' : 'bg-black'}`}
                  style={{width:`${Math.min((stress / stressMaxCap) * 100, 100)}%`}}
                />
              </div>
            </div>
            <button
              id="btn-play-pause-toggle"
              onClick={() => setIsPaused(!isPaused)}
              className="manga-panel bg-white px-2 py-0.5 flex items-center gap-1 cursor-pointer active:translate-y-1 active:shadow-none transition-all"
            >
              <span className="text-xs">{isPaused ? '▶' : '⏸'}</span>
              <span className="text-[10px] font-bold">暂停</span>
            </button>
          </div>

          {/* 状态网格 */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="border-2 border-black p-1 flex flex-col items-center">
              <span className="text-[9px] uppercase text-neutral-500 font-bold leading-none mb-1">时间</span>
              <span className={`font-mono text-xs ${remainingTime <= 15 ? 'text-red-600 animate-pulse' : ''}`}>{formattedTime()}</span>
            </div>
            <div className="border-2 border-black p-1 flex flex-col items-center" style={{backgroundImage:'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize:'4px 4px'}}>
              <span className="text-[9px] uppercase text-neutral-500 font-bold leading-none mb-1">连击</span>
              <span className="font-mono text-xs">{consecutiveCorrect}</span>
            </div>
            <div className="border-2 border-black p-1 flex flex-col items-center">
              <span className="text-[9px] uppercase text-neutral-500 font-bold leading-none mb-1">特质</span>
              <span className="text-[9px] font-bold text-center leading-none">{talent ? talent.name : '裸跑'}</span>
            </div>
          </div>

          {/* 系统语录 */}
          {floatingQuote && (
            <div className="border-t-2 border-black pt-1.5">
              <p className="text-[10px] italic text-neutral-500 leading-tight opacity-80">系统: {floatingQuote}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── GAMEPLAY AREA ── */}
      <div className="relative flex-1 flex flex-col items-center px-4 overflow-hidden min-h-0">

        {/* Flash effects */}
        {visualFlash === 'CORRECT' && (
          <div className="absolute inset-0 bg-white/10 z-10 pointer-events-none transition-all duration-75" />
        )}
        {visualFlash === 'WRONG' && (
          <div className="absolute inset-0 bg-red-600/15 z-10 pointer-events-none transition-all duration-75" />
        )}

        {/* Level-specific content */}
        <div className="w-full max-w-md flex flex-col items-center">

          {/* ----------------- GAME SCREEN: LEVEL 1 SCHULTE ----------------- */}
        {level.id === 1 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';
          const blurClass = isSevere ? 'blur-[2.5px] select-none scale-95' : isMedium ? 'blur-[1px] select-none' : '';

          return (
            <div className="w-full flex flex-col items-center select-none">
              {/* Target Indicator */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold">目标</span>
                  <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-xl font-bold font-mono border-2 border-black">
                    {schulteNext}
                  </div>
                </div>
                <div className="h-0.5 w-4 bg-black"></div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold">进度</span>
                  <span className="font-mono text-sm">{String(schulteNext - 1).padStart(2, '0')} / {difficultyCfg.schulteGridSize}</span>
                </div>
              </div>

              {/* Schulte Grid */}
              <div className={`manga-panel bg-zinc-100 p-2 grid grid-cols-5 gap-1.5 w-full max-w-[340px] transition-all duration-300 ${shakeClass}`}
                style={{ aspectRatio: difficultyCfg.schulteGridSize <= 25 ? '1 / 1' : '5 / 6' }}
              >
                {schulteNumbers.map((num, i) => {
                  const isClicked = num < schulteNext;
                  const isCorrupted = isSevere && !isClicked && (num % 3 === 0 || num % 7 === 1);
                  const isHidden = schulteAmnesiaFlash && num >= schulteNext;
                  return (
                    <button
                      disabled={isClicked}
                      id={`btn-schulte-grid-cell-${num}`}
                      key={i}
                      onClick={(e) => {
                        handleSchulteClick(num);
                        if (num === schulteNext) {
                          createParticles(e.currentTarget);
                        }
                      }}
                      className={`keycap aspect-square flex items-center justify-center text-xl font-bold font-mono
                        ${isClicked ? 'bg-neutral-300 text-neutral-500 border-neutral-400 line-through cursor-not-allowed shadow-none' : 'cursor-pointer'}
                        ${num === schulteNext && !isClicked ? 'keycap-active' : ''}
                        ${blurClass} ${isSevere && !isClicked ? 'border-red-600' : ''}
                        ${showHint && hintTarget === num && !isClicked ? 'ring-4 ring-yellow-400 ring-offset-2 bg-yellow-100 border-yellow-500 animate-bounce' : ''}`}
                    >
                      {isClicked ? '✓' : isHidden ? <span className="text-neutral-200">?</span> : isCorrupted ? <span className="text-red-600 font-extrabold animate-pulse">{['☠','Ø','⊗','⏾','☣','◆'][num % 6]}</span> : num}
                    </button>
                  );
                })}
              </div>
              {isSevere && <div className="text-center text-[10px] text-red-600 font-mono tracking-tight font-black mt-4 animate-bounce">▲ ⚠️ 脑压暴载！数字被乱码吞噬！请立即【摸鱼减压】恢复冷静！ ▲</div>}
              {isMedium && !isSevere && <div className="text-center text-[10px] text-neutral-700 font-mono tracking-tight font-bold mt-4 animate-pulse">■ 压力攀升，视野轻微晃动，解题切忌忙乱 ■</div>}
            </div>
          );
        })()}

        {/* ----------------- GAME SCREEN: LEVEL 2 SUDOKU ----------------- */}
        {level.id === 2 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';
          const blurClass = isSevere ? 'blur-[2px] scale-95' : isMedium ? 'blur-[0.5px]' : '';
          const cellTextClass = sudokuSize >= 9 ? 'text-sm' : sudokuSize >= 7 ? 'text-base' : 'text-xl';
          const dialTextClass = sudokuSize >= 9 ? 'text-base' : 'text-lg';

          return (
            <div className="w-full max-w-[320px] mx-auto select-none">
              <div className="flex justify-between items-center px-1 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>选定格子: {selectedSudokuIdx !== null ? `第${sudokuCells[selectedSudokuIdx].row + 1}行 第${sudokuCells[selectedSudokuIdx].col + 1}列` : '未选取'}</span>
                <span className="text-neutral-500">{sudokuSize}×{sudokuSize}</span>
              </div>
              <div
                className={`grid gap-0 bg-black p-1 shadow-[4px_4px_0px_#000000] border-2 border-black transition-all duration-300 ${shakeClass}`}
                style={{ gridTemplateColumns: `repeat(${sudokuSize}, minmax(0, 1fr))` }}
              >
                {sudokuCells.map((cell, idx) => {
                  const isPreset = cell.starting;
                  const isSelected = selectedSudokuIdx === idx;
                  const isWrong = sudokuErrorIdxs.includes(idx);
                  const thickBottom =
                    sudokuBoxSize > 1 && sudokuBoxSize * sudokuBoxSize === sudokuSize && (cell.row + 1) % sudokuBoxSize === 0 && cell.row !== sudokuSize - 1;
                  const thickRight =
                    sudokuBoxSize > 1 && sudokuBoxSize * sudokuBoxSize === sudokuSize && (cell.col + 1) % sudokuBoxSize === 0 && cell.col !== sudokuSize - 1;
                  const borderBottom = thickBottom ? 'border-b-4' : 'border-b';
                  const borderRight = thickRight ? 'border-r-4' : 'border-r';
                  const isCorrupted = isSevere && !isPreset && (cell.row * 3 + cell.col) % Math.max(sudokuSize, 4) === 1;

                  return (
                    <div
                      id={`grid-sudoku-cell-${cell.row}-${cell.col}`}
                      key={idx}
                      onClick={() => handleSudokuCellClick(idx)}
                      className={`aspect-square flex items-center justify-center font-mono font-bold ${cellTextClass} transition-all duration-200 border-black
                        ${borderBottom} ${borderRight}
                        ${isPreset ? 'bg-neutral-200 text-neutral-800 font-extrabold cursor-not-allowed' : isSelected ? 'bg-sky-50 text-black border-sky-500 ring-4 ring-sky-300 ring-offset-2 ring-offset-black shadow-[0_0_14px_rgba(56,189,248,0.8)]' : isWrong ? 'bg-red-600 text-white animate-pulse font-black' : 'bg-white text-black hover:bg-neutral-50 cursor-pointer'}
                        ${blurClass}`}
                    >
                      {isCorrupted ? <span className="text-red-600 text-xs font-black animate-ping">?!</span> : cell.val !== null ? cell.val : <span className="text-neutral-300 text-xs font-normal">.</span>}
                    </div>
                  );
                })}
              </div>
              {/* Number Input Panel */}
              <div className="mt-4 grid gap-1.5 px-1" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
                {Array.from({ length: sudokuSize }, (_, i) => i + 1).map((num) => (
                  <button
                    disabled={selectedSudokuIdx === null}
                    id={`btn-sudoku-dial-input-${num}`}
                    key={num}
                    onClick={() => handleSudokuNumInput(num)}
                    className={`h-12 flex items-center justify-center font-mono font-black ${dialTextClass} border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all duration-150
                      ${selectedSudokuIdx === null ? 'bg-neutral-100 text-neutral-400 border-neutral-300 shadow-none cursor-not-allowed' : 'bg-white text-black active:bg-black active:text-white active:translate-y-0.5 cursor-pointer'}`}
                  >
                    {num}
                  </button>
                ))}
                <button
                  disabled={selectedSudokuIdx === null}
                  id="btn-sudoku-dial-input-clear"
                  onClick={() => handleSudokuNumInput(null)}
                  className={`h-12 flex items-center justify-center font-mono text-xs font-bold border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all duration-150
                    ${selectedSudokuIdx === null ? 'bg-neutral-100 text-neutral-400 border-neutral-300 shadow-none cursor-not-allowed' : 'bg-red-50 text-red-600 active:bg-red-600 active:text-white active:translate-y-0.5 cursor-pointer'}`}
                >
                  清除
                </button>
              </div>
              {isSevere && <div className="text-center text-[10px] text-red-600 font-mono tracking-tight font-black mt-4 animate-bounce">☠️ 数度狂晃！思维严重错乱！错填一个即爆炸！建议【摸鱼】冷静！</div>}
              {selectedSudokuIdx === null && !isPaused && <div className="text-center text-[10px] text-neutral-500 font-mono tracking-tight font-medium mt-3 animate-pulse">🔍 长按或点击方格中的【空位】，激活键盘填入数字 🔍</div>}
            </div>
          );
        })()}

        {/* ----------------- GAME SCREEN: LEVEL 3 SLIDING PUZZLE ----------------- */}
        {level.id === 3 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';

          return (
            <div className="w-full max-w-[280px] mx-auto select-none">
              <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>🔎 找不同</span>
                <span className="text-neutral-500">
                  {oddOneOutMeta
                    ? oddOneOutMeta.kind === 'PATTERN'
                      ? '图案'
                      : `${oddOneOutMeta.label} ${oddOneOutMeta.base}/${oddOneOutMeta.odd}`
                    : ''}
                </span>
              </div>
              <div className={`grid grid-cols-5 gap-1.5 p-2 bg-neutral-100 border-4 border-black shadow-[4px_4px_0px_#000000] rounded-none transition-all duration-300 ${shakeClass}`}>
                {oddOneOutCells.map((v, idx) => {
                  const isExtremityBlind = isSevere && Math.random() < 0.18;
                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleOddOneOutClick(idx)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className={`aspect-square flex items-center justify-center font-mono font-black text-xl transition-all duration-150 rounded-none border-2 border-black
                        bg-white text-black active:bg-black active:text-white cursor-pointer hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)]
                        ${showHint && hintTarget === idx ? 'ring-4 ring-yellow-400 ring-offset-2 bg-yellow-100 border-yellow-500 animate-bounce' : ''}`}
                    >
                      {renderOddOneOutCell(v, isExtremityBlind)}
                    </motion.button>
                  );
                })}
              </div>
              {isSevere && <div className="text-center text-[10px] text-red-600 font-mono tracking-tight font-black mt-4 animate-bounce">▲ ⚠️ 脑压暴载！视野剧烈晃动！ ▲</div>}
            </div>
          );
        })()}

        {/* ----------------- GAME SCREEN: LEVEL 4 PIPE PUZZLE ----------------- */}
        {level.id === 4 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';

          return (
            <div className="w-full max-w-[280px] mx-auto select-none">
              <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>🔧 点击管道旋转</span>
                <span className="text-neutral-500">连通左右两侧</span>
              </div>
              <div className={`grid grid-cols-4 gap-1 p-2 bg-neutral-100 border-4 border-black shadow-[4px_4px_0px_#000000] rounded-none transition-all duration-300 ${shakeClass}`}>
                {pipeCells.map((cell, idx) => {
                  if (cell.type === 'empty') {
                    return <div key={idx} className="aspect-square bg-neutral-200 border-2 border-neutral-300" />;
                  }
                  const rotation = pipeRotations[idx];
                  const isExtremityBlind = isSevere && Math.random() < 0.15;
                  const isPowered = pipePoweredIdxs.includes(idx);
                  const isSource = idx === pipeSourceIdx;
                  const isSink = idx === pipeSinkIdx;

                  const pipeChars: Record<PipeType, string> = {
                    empty: '',
                    straight: '┃',
                    corner: '┗',
                    tee: '┣',
                    cross: '╋',
                  };
                  const displayChar = isExtremityBlind ? '?' : pipeChars[cell.type];
                  const borderClass = isSource ? 'border-sky-500' : isSink ? 'border-emerald-500' : isPowered ? 'border-sky-400' : 'border-black';
                  const bgClass = isPowered ? 'bg-sky-50' : 'bg-white';
                  const isCorrectRotation = rotation === cell.solvedRotation;

                  return (
                    <motion.button
                      key={idx}
                      type="button"
                      onClick={() => handlePipeClick(idx)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      style={{ filter: isCorrectRotation ? 'drop-shadow(0 0 10px rgba(56,189,248,0.75))' : undefined }}
                      className={`relative aspect-square flex items-center justify-center border-2 rounded-none font-mono font-black text-xl transition-all text-black active:bg-black active:text-white hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)] cursor-pointer ${bgClass} ${borderClass} ${isCorrectRotation ? 'outline outline-2 outline-sky-400 outline-offset-2' : ''} ${showHint && hintTarget === idx ? 'ring-4 ring-yellow-400 ring-offset-2 animate-bounce' : ''}`}
                      animate={{ rotate: rotation * 90 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                    >
                      {isSource && <span className="absolute left-1 top-1 w-1.5 h-1.5 rounded-full bg-sky-400" />}
                      {isSink && <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      {displayChar}
                    </motion.button>
                  );
                })}
              </div>
              {isSevere && <div className="text-center text-[10px] text-red-600 font-mono tracking-tight font-black mt-4 animate-bounce">▲ ⚠️ 脑压暴载！管道开始剧烈晃动！ ▲</div>}
            </div>
          );
        })()}

        {/* ----------------- GAME SCREEN: LEVEL 5 COLOR SEQUENCE ----------------- */}
        {level.id === 5 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';

          return (
            <div className="w-full max-w-[280px] mx-auto select-none">
              <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>🧠 背下颜色顺序</span>
                <span className="text-neutral-500">第 {colorRound + 1} / {COLOR_SEQUENCE_TARGET_ROUNDS} 轮</span>
              </div>

              {/* Status text */}
              <div className="text-center mb-3">
                {colorPhase === 'showing' && (
                  <p className="text-[11px] font-mono text-blue-600 animate-pulse font-bold">👀 注意观察闪烁顺序...</p>
                )}
                {colorPhase === 'input' && (
                  <p className="text-[11px] font-mono text-emerald-600 font-bold">🎮 轮到你了！按顺序点击 ({colorPlayerInput.length}/{colorSequence.length})</p>
                )}
                {colorPhase === 'feedback' && colorFeedback === 'correct' && (
                  <p className="text-[11px] font-mono text-emerald-600 font-bold">✅ 正确！继续...</p>
                )}
                {colorPhase === 'feedback' && colorFeedback === 'wrong' && (
                  <p className="text-[11px] font-mono text-red-600 font-bold animate-pulse">❌ 顺序错了！重新来...</p>
                )}
              </div>

              {/* Sequence progress dots */}
              <div className="flex justify-center gap-1 mb-3">
                {colorSequence.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full border border-black transition-all ${
                      i < colorPlayerInput.length
                        ? 'bg-emerald-500'
                        : i === colorPlayerInput.length && colorPhase === 'input'
                        ? 'bg-yellow-400 animate-pulse'
                        : 'bg-neutral-300'
                    }`}
                  />
                ))}
              </div>

              {/* Color buttons */}
              <div className={`grid grid-cols-2 gap-3 p-3 bg-neutral-100 border-4 border-black shadow-[4px_4px_0px_#000000] transition-all duration-300 ${shakeClass}`}>
                {COLOR_SEQUENCE_COLORS.map((color, idx) => {
                  const isShowing = colorShowingIdx === idx;
                  const isHintHighlight = showHint && hintTarget === idx && level.id === 5;

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handleColorButtonClick(idx)}
                      whileHover={{ scale: colorPhase === 'input' ? 1.05 : 1 }}
                      whileTap={{ scale: colorPhase === 'input' ? 0.92 : 1 }}
                      className={`aspect-square rounded-lg border-4 border-black font-mono font-black text-lg transition-all duration-150 cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none ${
                        colorPhase !== 'input' ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      style={{
                        backgroundColor: isShowing || isHintHighlight ? color : `${color}40`,
                        color: isShowing || isHintHighlight ? '#fff' : color,
                        borderColor: isShowing || isHintHighlight ? '#000' : color,
                        transform: isShowing ? 'scale(1.08)' : undefined,
                      }}
                    >
                      {COLOR_SEQUENCE_NAMES[idx]}
                    </motion.button>
                  );
                })}
              </div>

              {/* Reset button */}
              <div className="flex justify-center mt-2">
                <button
                  onClick={handleColorSequenceReset}
                  className="text-[10px] font-mono text-red-500 hover:text-red-400 cursor-pointer underline"
                >
                  ↩ 重新开始
                </button>
              </div>

              {isSevere && <div className="text-center text-[10px] text-red-600 font-mono tracking-tight font-black mt-4 animate-bounce">▲ ⚠️ 脑压暴载！记忆严重受损！ ▲</div>}
            </div>
          );
        })()}

        {/* ----------------- GAME SCREEN: LEVEL 6 MEMORY MATCH ----------------- */}
        {level.id === 6 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';

          return (
            <div className="w-full max-w-[280px] mx-auto select-none">
              <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>🃏 翻牌配对</span>
                <span className="text-neutral-500">已配对 {memoryCards.filter(c => c.matched).length / 2} / {difficultyCfg.memoryPairsCount}</span>
              </div>
              <div className={`grid grid-cols-4 gap-1.5 p-2 bg-neutral-100 border-4 border-black shadow-[4px_4px_0px_#000000] rounded-none transition-all duration-300 ${shakeClass}`}>
                {memoryCards.map((card, idx) => {
                  const isExtremityBlind = isSevere && !card.faceUp && !card.matched && Math.random() < 0.15;
                  return (
                    <motion.button
                      key={card.id}
                      onClick={() => handleMemoryCardClick(idx)}
                      whileHover={{ scale: card.faceUp || card.matched ? 1 : 1.05 }}
                      whileTap={{ scale: card.faceUp || card.matched ? 1 : 0.92 }}
                      className={`aspect-square flex items-center justify-center border-2 border-black rounded-none font-mono font-bold cursor-pointer text-lg transition-all duration-150
                        ${card.matched
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                          : card.faceUp
                          ? 'bg-white border-red-400 text-black'
                          : 'bg-white text-black active:bg-black active:text-white cursor-pointer hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)]'
                        }
                        ${showHint && hintTarget === idx && !card.matched && !card.faceUp ? 'ring-4 ring-yellow-400 ring-offset-2 bg-yellow-100 border-yellow-500 animate-bounce' : ''}`}
                    >
                      {card.faceUp || card.matched
                        ? isExtremityBlind ? '?' : card.emoji
                        : '?'}
                    </motion.button>
                  );
                })}
              </div>
              {isSevere && <div className="text-center text-[10px] text-red-600 font-mono tracking-tight font-black mt-4 animate-bounce">▲ ⚠️ 脑压暴载！牌面剧烈晃动！ ▲</div>}
            </div>
          );
        })()}

        {/* ----------------- GAME SCREEN: LEVEL 7 REVERSE COMMAND ----------------- */}
        {level.id === 7 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';

          const instruction =
            reverseDir === 'UP'
              ? '⬆️'
              : reverseDir === 'DOWN'
                ? '⬇️'
                : reverseDir === 'LEFT'
                  ? '⬅️'
                  : '➡️';

          const showBlind = isSevere && Math.random() < 0.12;

          const btnBase =
            'aspect-square flex items-center justify-center border-2 border-black rounded-none font-mono font-black cursor-pointer text-xl transition-all duration-150 bg-white text-black active:bg-black active:text-white hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)]';

          return (
            <div className="w-full max-w-[280px] mx-auto select-none">
              <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>🧭 反向指令</span>
                <span className="text-neutral-500">{reverseScore} / {REVERSE_TARGET}</span>
              </div>

              <div className={`border-4 border-black bg-white shadow-[4px_4px_0px_#000000] p-3 ${shakeClass}`}>
                <div className="text-[10px] font-mono text-neutral-500 font-bold tracking-widest uppercase">INSTRUCTION</div>
                <div className="mt-2 flex items-center justify-center">
                  <div className="w-full border-2 border-black bg-neutral-50 py-6 text-center">
                    <div className="text-5xl font-black">{showBlind ? '❓' : instruction}</div>
                    <div className="mt-1 text-[10px] font-mono text-neutral-500">点击相反方向</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleReverseClick('UP')}
                    className={`${btnBase} ${showHint && hintTarget === 0 ? 'ring-4 ring-yellow-400 ring-offset-2 bg-yellow-100 border-yellow-500 animate-bounce' : ''}`}
                  >
                    ⬆️
                  </motion.button>
                  <div />

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleReverseClick('LEFT')}
                    className={`${btnBase} ${showHint && hintTarget === 2 ? 'ring-4 ring-yellow-400 ring-offset-2 bg-yellow-100 border-yellow-500 animate-bounce' : ''}`}
                  >
                    ⬅️
                  </motion.button>
                  <div className="aspect-square border-2 border-dashed border-black/30 bg-neutral-50 flex items-center justify-center text-[10px] font-mono text-neutral-400">
                    反
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleReverseClick('RIGHT')}
                    className={`${btnBase} ${showHint && hintTarget === 3 ? 'ring-4 ring-yellow-400 ring-offset-2 bg-yellow-100 border-yellow-500 animate-bounce' : ''}`}
                  >
                    ➡️
                  </motion.button>

                  <div />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleReverseClick('DOWN')}
                    className={`${btnBase} ${showHint && hintTarget === 1 ? 'ring-4 ring-yellow-400 ring-offset-2 bg-yellow-100 border-yellow-500 animate-bounce' : ''}`}
                  >
                    ⬇️
                  </motion.button>
                  <div />
                </div>
              </div>

              {isSevere && <div className="text-center text-[10px] text-red-600 font-mono tracking-tight font-black mt-4 animate-bounce">▲ ⚠️ 脑压暴载！别下意识点！ ▲</div>}
            </div>
          );
        })()}

        {/* ----------------- 100% EXTREME MELTDOWN CRITICAL ALERT ----------------- */}
        {stress >= 100 && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 bg-red-600 text-white border-[4px] border-black p-3 text-center shadow-[6px_6px_0px_#000000] animate-pulse">
            <span className="text-3xl block mb-1">🚨</span>
            <h3 className="text-sm font-black font-display uppercase text-yellow-300">
              脑压全面暴毙！
            </h3>
            <div className="mt-2 inline-block bg-black text-yellow-400 font-mono font-black text-lg px-3 py-1 border-2 border-black">
              崩溃倒计时: {stressMeltCounter}s !!!
            </div>
            <p className="text-[10px] text-red-200 font-bold mt-1.5">
              快摸鱼减压！否则失败！
            </p>
          </div>
        )}

        {/* ----------------- THE SLACK OFF "摸鱼中" ANIMATION COVER ----------------- */}
        <AnimatePresence>
          {isSlacking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/95 z-30 flex flex-col justify-center items-center p-6 text-center"
            >
              <div className="border-[4px] border-black p-4 bg-amber-50 relative max-w-xs shadow-[6px_6px_0px_#000000] -rotate-1">
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-14 h-14 mx-auto flex items-center justify-center bg-amber-100 border-2 border-amber-400 rounded-full mb-2"
                >
                  <span className="text-2xl">☕</span>
                </motion.div>

                <h4 className="text-sm font-display font-black text-black tracking-tight uppercase">🍔 摸鱼冷却中...</h4>

                <div className="bg-white border-2 border-black p-2 my-3 text-[10px] font-mono select-none text-zinc-800 italic leading-snug">
                  {slackTimeLeft > 3 && '"滋溜一口冰柠檬红茶..."'}
                  {slackTimeLeft <= 3 && slackTimeLeft > 2 && '"假装盯着天花板发呆..."'}
                  {slackTimeLeft <= 2 && slackTimeLeft > 1 && '"心态要稳，下一题全对..."'}
                  {slackTimeLeft <= 1 && '"收起饮料！即将续战！"'}
                </div>

                <div className="my-2 text-3xl font-mono font-black text-black">
                  {slackTimeLeft}s
                </div>

                <div className="bg-red-50 text-red-600 p-1 border border-red-300 font-mono text-[8px] font-black animate-pulse text-center">
                  ⚠️ 代价：-15s DDL时限
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- THE SURPRISE AUDIT POPUP OVERLAY ----------------- */}
        <AnimatePresence>
          {showSurprise && (
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="absolute inset-0 z-40 bg-zinc-950/80 flex flex-col justify-center items-center p-6 text-center backdrop-blur-[2px]"
            >
              <div className="bg-red-600 border-[4px] border-black p-4 text-white max-w-xs shadow-[6px_6px_0px_#000000] rotate-1">
                <span className="text-3xl block mb-1 animate-bounce">⚠️</span>
                <h3 className="font-display font-black text-base tracking-wider text-yellow-300 uppercase">☠ 导员突击查岗！</h3>
                <p className="text-[10px] font-mono my-2 text-red-100 font-bold">立即假装认真看书！</p>

                <div className="w-full bg-red-950 border-2 border-black h-2.5 my-2 overflow-hidden rounded-none">
                  <div className="bg-yellow-400 h-full transition-all duration-100 ease-linear" style={{width:`${(surpriseTimeLeft / surpriseBaseTime) * 100}%`}} />
                </div>
                <div className="text-[10px] font-mono font-black mb-2 text-yellow-400 animate-pulse">反应时间: {surpriseTimeLeft}s</div>

                {/* Status resolved banner */}
                {surpriseStatusMsg && (
                  <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    {surpriseStatusMsg === 'SUCCESS' ? (
                      <div className="text-center text-emerald-400">
                        <span className="text-3xl block mb-1">✅</span>
                        <h4 className="text-sm font-black font-mono">打卡成功！</h4>
                      </div>
                    ) : (
                      <div className="text-center text-red-500">
                        <span className="text-3xl block mb-1">💀</span>
                        <h4 className="text-sm font-black font-mono">暴露穿帮！</h4>
                      </div>
                    )}
                  </div>
                )}

                {/* Multi Choice inputs */}
                <div className="mt-1 z-10 flex flex-col gap-1.5">
                  {surpriseOptions.map((opt, idx) => (
                    <button
                      id={`btn-surprise-audit-option-${idx}`}
                      disabled={surpriseStatusMsg !== ''}
                      key={idx}
                      onClick={() => handleSurpriseOptionClick(idx)}
                      className="w-full text-left p-2.5 border-2 border-black bg-yellow-400 text-black text-[11px] font-mono font-bold hover:bg-yellow-300 transition-colors cursor-pointer active:translate-y-0.5 active:shadow-none shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    >
                      {opt}
                    </button>
                  ))}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ----------------- GAME PAUSED OVERLAY ----------------- */}
        <AnimatePresence>
          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-stone-900/45 flex flex-col justify-center items-center text-center p-6 backdrop-blur-[2px]"
            >
              <div className="border-[4px] border-black p-4 bg-white max-w-xs shadow-[5px_5px_0px_#000000] rotate-1">
                <h4 className="font-display font-black text-sm text-black uppercase">⏸ 暂停修整</h4>
                <p className="text-[10px] text-zinc-600 font-mono my-1.5 leading-relaxed">时间已冻结。整理手感以续战。</p>

                <div className="mt-4 space-y-2">
                  <button
                    id="btn-play-pause-resume"
                    onClick={() => setIsPaused(false)}
                    className="w-full bg-black hover:bg-neutral-900 text-white font-display font-black py-2.5 border-2 border-black text-xs cursor-pointer rounded-none shadow-[2px_2px_0px_rgba(0,0,0,0.15)] active:translate-y-0.5 active:shadow-none transition-all"
                  >
                    【 解锁续战 】
                  </button>
                  <button
                    id="btn-play-pause-restart"
                    onClick={() => { setIsPaused(false); onRestart(); }}
                    className="w-full bg-amber-100 hover:bg-amber-200 border-2 border-black text-amber-900 font-mono font-bold py-2 text-[10px] rounded-none cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={12} /> 重新开始本关
                  </button>
                  <button
                    id="btn-play-pause-giveup"
                    onClick={onBack}
                    className="w-full bg-stone-200 hover:bg-stone-300 border border-neutral-400 text-zinc-700 font-mono font-medium py-2 text-[10px] rounded-none cursor-pointer transition-colors"
                  >
                    返回大厅
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        </div> {/* max-w-md */}
      </div> {/* playground */}

      {/* ----------------------------------------------------
          BOTTOM CONTROLLER FOOTER: ACTIONS BAR
          ---------------------------------------------------- */}
      <div className="shrink-0 px-4 pb-4 pt-1.5 border-t-2 border-black bg-[#f9f9f9] flex justify-around items-end gap-2">

        {/* Hint */}
        <motion.button
          id="btn-use-hint"
          disabled={isPaused || isSlacking || showSurprise || showHint}
          onClick={handleUseHint}
          whileTap={{ scale: 0.95 }}
          className={`keycap bg-white p-1 flex flex-col items-center justify-center w-14 h-14 ${
            isPaused || isSlacking || showSurprise || showHint
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          <Lightbulb size={18} className="shrink-0" />
          <span className="text-[10px] font-bold">提示</span>
        </motion.button>

        {/* Slack off - Main CTA */}
        <motion.button
          id="btn-slack-off-trigger"
          disabled={isPaused || isSlacking || showSurprise}
          onClick={triggerSlackOff}
          whileTap={{ scale: 0.95 }}
          className={`keycap px-3 flex flex-col items-center justify-center min-w-[90px] h-14 ${
            isPaused || isSlacking || showSurprise
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-black text-white cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-1">
            <span className="text-lg">☕</span>
            <span className="text-[12px] font-bold tracking-tight">摸鱼</span>
          </div>
          <span className="text-[8px] opacity-70">-20% · -5s</span>
        </motion.button>

        {/* Restart */}
        <motion.button
          id="btn-restart-level"
          disabled={isPaused || isSlacking || showSurprise}
          onClick={onRestart}
          whileTap={{ scale: 0.95 }}
          className={`keycap bg-white p-1 flex flex-col items-center justify-center w-14 h-14 ${
            isPaused || isSlacking || showSurprise
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          <RotateCcw size={18} className="shrink-0" />
          <span className="text-[10px] font-bold">重试</span>
        </motion.button>

        {/* Skip */}
        <motion.button
          id="btn-skip-level"
          disabled={isSlacking || showSurprise}
          onClick={() => setShowSkipConfirm(true)}
          whileTap={{ scale: 0.95 }}
          className={`keycap bg-white p-1 flex flex-col items-center justify-center w-14 h-14 ${
            isSlacking || showSurprise
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          <Undo2 size={18} className="shrink-0" />
          <span className="text-[10px] font-bold">跳过</span>
        </motion.button>

      </div>

      {/* Skip Confirmation Dialog */}
      <AnimatePresence>
        {showSkipConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowSkipConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="manga-panel-active bg-white p-4 max-w-[280px] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-3">
                <div className="text-2xl mb-2">⚠️</div>
                <h3 className="font-display font-black text-sm mb-1">确认放弃本关吗？</h3>
                <p className="text-[11px] font-mono text-neutral-500">跳过将直接挂科，本关得分计为 0</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowSkipConfirm(false)}
                  className="border-2 border-black py-2 font-display font-black text-xs tracking-wider bg-white hover:bg-neutral-50 cursor-pointer manga-active"
                >
                  我再试试
                </button>
                <button
                  onClick={() => { setShowSkipConfirm(false); onSkip(); }}
                  className="border-2 border-black py-2 font-display font-black text-xs tracking-wider bg-red-600 text-white hover:bg-red-500 cursor-pointer manga-active"
                >
                  确认放弃
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global screentone overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100]" style={{backgroundImage:'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize:'4px 4px'}}></div>

    </div>
  );
}
