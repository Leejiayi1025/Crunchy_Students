/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Level, Talent, GameStats, StressRecord } from '../types';
import {
  generate4x4SudokuPuzzle, FUNNY_QUOTES, SudokuCell,
  PIPE_PUZZLES, PipeCell, PipeType,
  ONE_STROKE_PUZZLES, OneStrokePuzzle, StrokeNode, StrokeEdge,
  MEMORY_PAIRS, MemoryPair,
} from '../data';
import { 
  AlertOctagon, AlertTriangle, ShieldCheck, Play, Pause, RefreshCw, Undo2, Coffee, Eye, Radio, BellRing, Skull, ArrowLeft
} from 'lucide-react';

interface GameMainViewProps {
  level: Level;
  talent: Talent | null;
  onWin: (stats: GameStats) => void;
  onLose: (stats: GameStats, reason: 'TIMEOUT' | 'STRESS_CRASH') => void;
  onBack: () => void;
}

export function GameMainView({ level, talent, onWin, onLose, onBack }: GameMainViewProps) {
  // ----------------------------------------------------
  // Configuration offsets from active Talents
  // ----------------------------------------------------
  const baseTime = level.baseTime + (talent ? talent.initialTimeBonus : 0);
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

  // ----------------------------------------------------
  // Sliding Puzzle State (Level 3)
  // ----------------------------------------------------
  const [slideBoard, setSlideBoard] = useState<number[]>([]); // 0 = empty

  // ----------------------------------------------------
  // Pipe Puzzle State (Level 4)
  // ----------------------------------------------------
  const [pipeCells, setPipeCells] = useState<PipeCell[]>([]);
  const [pipeRotations, setPipeRotations] = useState<number[]>([]);
  const [pipePoweredIdxs, setPipePoweredIdxs] = useState<number[]>([]);
  const pipeWinTriggeredRef = useRef<boolean>(false);

  // ----------------------------------------------------
  // One-Stroke State (Level 5)
  // ----------------------------------------------------
  const [oneStrokePuzzle, setOneStrokePuzzle] = useState<OneStrokePuzzle>(ONE_STROKE_PUZZLES[0]);
  const [strokePath, setStrokePath] = useState<number[]>([]); // node ids visited
  const [strokeVisitedEdges, setStrokeVisitedEdges] = useState<Set<string>>(new Set());

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

  // ----------------------------------------------------
  // Initializers
  // ----------------------------------------------------
  useEffect(() => {
    timelineRef.current = [{ timeElapsed: 0, stress: initialStress }];
    
    // Pick a funny quote initially
    const randomQuote = FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)];
    setFloatingQuote(randomQuote);

    if (level.id === 1) {
      // Shuffled Schulte Table Numbers 1..25
      const numArr = Array.from({ length: 25 }, (_, i) => i + 1);
      const shuffled = numArr.sort(() => Math.random() - 0.5);
      setSchulteNumbers(shuffled);
      setSchulteNext(1);
    } else if (level.id === 2) {
      const puzzle = generate4x4SudokuPuzzle();
      const cellsCopy = puzzle.board.map((cell) => ({ ...cell }));
      setSudokuCells(cellsCopy);
      setSudokuSolution(puzzle.solution);
      setSelectedSudokuIdx(null);
      setSudokuErrorIdxs([]);
    } else if (level.id === 3) {
      // Generate solvable 3x3 sliding puzzle
      const board = generateSlidingPuzzle();
      setSlideBoard(board);
    } else if (level.id === 4) {
      const cells = generatePipePuzzle4x4();
      const rotations = cells.map((c) => {
        const scramble = 1 + Math.floor(Math.random() * 3);
        return (c.solvedRotation + scramble) % 4;
      });
      setPipeCells(cells);
      setPipeRotations(rotations);
      pipeWinTriggeredRef.current = false;
      const powered = getPipePoweredIndices(cells, rotations);
      setPipePoweredIdxs([...powered]);
    } else if (level.id === 5) {
      // Initialize one-stroke puzzle
      setOneStrokePuzzle(generateOneStrokePuzzle());
      setStrokePath([]);
      setStrokeVisitedEdges(new Set());
    } else if (level.id === 6) {
      // Initialize memory match — create shuffled card deck
      const pairs = MEMORY_PAIRS.slice(0, 8);
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
  }, [level, talent]);

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
    onLose(getFinalStats(), reason);
  };

  useEffect(() => {
    handleFailedConclusionRef.current = handleFailedConclusion;
  }, [handleFailedConclusion]);

  const getFinalStats = (): GameStats => {
    return {
      levelId: level.id,
      talent: talent,
      timeRemainingBeforePenalty: remainingTime,
      timeUsed: timeElapsed,
      errorsMade: errorsMade,
      maxStress: maxStressReached,
      slackedOffCount: slackedOffCount,
      timeline: timelineRef.current,
      triggeredSurprisesCount: triggeredSurprisesCount,
      surpriseSuccesses: surpriseSuccesses,
      stars: calculateStars(errorsMade, maxStressReached, remainingTime),
    };
  };

  const calculateStars = (errs: number, maxStr: number, timeLeft: number): number => {
    // 3 stars: no errors and max stress below 70% and time remaining > 30%
    const perfectErrors = errs <= 1;
    const stablePressure = maxStr < 75;
    const swiftSolve = timeLeft > (baseTime * 0.25);

    if (perfectErrors && stablePressure && swiftSolve) return 3;
    if (errs <= 4 && maxStr < 95) return 2;
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
      const isFinished = schulteNext === 25;
      setIsVisualFeedback('CORRECT');

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
    onWin(getFinalStats());
  };

  // ----------------------------------------------------
  // Dynamic Slack Off (触摸减压) Code Block
  // ----------------------------------------------------
  const triggerSlackOff = () => {
    if (isPaused || isSlacking || showSurprise) return;

    setIsSlacking(true);
    setSlackedOffCount((prev) => prev + 1);
    setSlackTimeLeft(5);
    setConsecutiveCorrect(0);

    // Apply the 15s absolute time cost immediately
    setRemainingTime((prev) => {
      const penalty = prev - 15;
      return penalty < 0 ? 0 : penalty;
    });

    // Start 10 seconds rapid relief timer
    let ticks = 5;
    const slackTimer = setInterval(() => {
      ticks -= 1;
      setSlackTimeLeft(ticks);

      // Stress relief speed - doubled if "low blood sugar hand shack" active
      const normalRelief = -5;
      let multiplier = talent?.id === 'low_sugar' ? 2.0 : 1.0;
      // Milk tea addict: +80% recovery
      if (talent?.id === 'milk_tea_addict') {
        multiplier = 1.8;
      }
      adjustStressValue(normalRelief * multiplier);

      if (ticks <= 0) {
        clearInterval(slackTimer);
        setIsSlacking(false);
        setFloatingQuote('⚡ 抽身摸鱼归来！脑子勉强冷下来了，冲！');
      }
    }, 1000);
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
  const generateSlidingPuzzle = (): number[] => {
    // Create a solved board [1,2,3,4,5,6,7,8,0] then shuffle with legal moves
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    // Shuffle by performing random legal moves (guarantees solvability)
    let emptyIdx = 8;
    for (let i = 0; i < 200; i++) {
      const row = Math.floor(emptyIdx / 3);
      const col = emptyIdx % 3;
      const neighbors: number[] = [];
      if (row > 0) neighbors.push(emptyIdx - 3);
      if (row < 2) neighbors.push(emptyIdx + 3);
      if (col > 0) neighbors.push(emptyIdx - 1);
      if (col < 2) neighbors.push(emptyIdx + 1);
      const pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      [board[emptyIdx], board[pick]] = [board[pick], board[emptyIdx]];
      emptyIdx = pick;
    }
    return board;
  };

  const handleSlideClick = (idx: number) => {
    if (isPaused || isSlacking || showSurprise) return;
    if (slideBoard[idx] === 0) return;

    const emptyIdx = slideBoard.indexOf(0);
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const eRow = Math.floor(emptyIdx / 3);
    const eCol = emptyIdx % 3;
    const isAdjacent = (Math.abs(row - eRow) + Math.abs(col - eCol)) === 1;

    if (!isAdjacent) return;

    const newBoard = [...slideBoard];
    [newBoard[idx], newBoard[emptyIdx]] = [newBoard[emptyIdx], newBoard[idx]];
    setSlideBoard(newBoard);

    // Check win: [1,2,3,4,5,6,7,8,0]
    const isWin = newBoard.every((v, i) => v === (i === 8 ? 0 : i + 1));
    if (isWin) {
      handleWinConclusion();
    }
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
  // Level 5: One-Stroke Drawing Helpers
  // ----------------------------------------------------
  const puzzle5 = oneStrokePuzzle;
  const puzzle5OddNodes = (() => {
    const degreeByNode = new Map<number, number>();
    for (const [a, b] of puzzle5.edges) {
      degreeByNode.set(a, (degreeByNode.get(a) ?? 0) + 1);
      degreeByNode.set(b, (degreeByNode.get(b) ?? 0) + 1);
    }
    return Array.from(degreeByNode.entries())
      .filter(([, deg]) => deg % 2 === 1)
      .map(([nodeId]) => nodeId);
  })();

  const generateOneStrokePuzzle = (): OneStrokePuzzle => {
    const base = ONE_STROKE_PUZZLES[0];
    const nodes = base.nodes.map((n) => ({ ...n }));
    const nodeIds = nodes.map((n) => n.id);
    const allPairs: StrokeEdge[] = [];
    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        allPairs.push([nodeIds[i], nodeIds[j]]);
      }
    }

    const keyOf = (a: number, b: number) => `${Math.min(a, b)}-${Math.max(a, b)}`;

    const buildEulerTrail = (edges: StrokeEdge[]): number[] | null => {
      const adj = new Map<number, number[]>();
      for (const id of nodeIds) adj.set(id, []);
      for (const [a, b] of edges) {
        adj.get(a)!.push(b);
        adj.get(b)!.push(a);
      }

      const degrees = nodeIds.map((id) => adj.get(id)!.length);
      const odd = nodeIds.filter((id, i) => degrees[i] % 2 === 1);
      if (!(odd.length === 0 || odd.length === 2)) return null;
      if (degrees.some((d) => d === 0)) return null;

      const visited = new Set<number>();
      const queue: number[] = [nodeIds[0]];
      visited.add(nodeIds[0]);
      while (queue.length > 0) {
        const v = queue.shift()!;
        for (const n of adj.get(v)!) {
          if (visited.has(n)) continue;
          visited.add(n);
          queue.push(n);
        }
      }
      if (visited.size !== nodeIds.length) return null;

      const start = odd.length === 2 ? odd[0] : nodeIds[0];
      const workAdj = new Map<number, number[]>();
      for (const id of nodeIds) workAdj.set(id, [...adj.get(id)!]);

      const stack: number[] = [start];
      const out: number[] = [];

      while (stack.length > 0) {
        const v = stack[stack.length - 1];
        const list = workAdj.get(v)!;
        if (list.length === 0) {
          out.push(v);
          stack.pop();
          continue;
        }
        const u = list.pop()!;
        const backList = workAdj.get(u)!;
        const idx = backList.lastIndexOf(v);
        if (idx >= 0) backList.splice(idx, 1);
        stack.push(u);
      }

      const trail = out.reverse();
      if (trail.length !== edges.length + 1) return null;
      return trail;
    };

    for (let attempt = 0; attempt < 200; attempt++) {
      const desiredEdges = 7 + Math.floor(Math.random() * 3);

      const edgeKeys = new Set<string>();
      const edges: StrokeEdge[] = [];

      const connected: number[] = [nodeIds[Math.floor(Math.random() * nodeIds.length)]];
      const remaining = nodeIds.filter((id) => id !== connected[0]);
      while (remaining.length > 0) {
        const u = connected[Math.floor(Math.random() * connected.length)];
        const v = remaining[Math.floor(Math.random() * remaining.length)];
        edgeKeys.add(keyOf(u, v));
        edges.push([u, v]);
        connected.push(v);
        remaining.splice(remaining.indexOf(v), 1);
      }

      const candidates = shuffle(allPairs).filter(([a, b]) => !edgeKeys.has(keyOf(a, b)));
      for (const [a, b] of candidates) {
        if (edges.length >= desiredEdges) break;
        edgeKeys.add(keyOf(a, b));
        edges.push([a, b]);
      }

      const solution = buildEulerTrail(edges);
      if (!solution) continue;

      return { nodes, edges, solution };
    }

    return base;
  };

  const handleStrokeNodeClick = (nodeId: number) => {
    if (isPaused || isSlacking || showSurprise) return;

    if (strokePath.length === 0) {
      if (puzzle5OddNodes.length === 2 && !puzzle5OddNodes.includes(nodeId)) {
        setIsVisualFeedback('WRONG');
        return;
      }
      // Start the path
      setStrokePath([nodeId]);
      return;
    }

    const lastNode = strokePath[strokePath.length - 1];
    if (nodeId === lastNode) return;

    // Check if there's an edge between lastNode and nodeId
    const edgeKey = makeEdgeKey(lastNode, nodeId);
    const edgeExists = puzzle5.edges.some(([a, b]) => makeEdgeKey(a, b) === edgeKey);
    if (!edgeExists) return;

    // Check if edge already visited
    if (strokeVisitedEdges.has(edgeKey)) return;

    const newVisited = new Set(strokeVisitedEdges);
    newVisited.add(edgeKey);
    const newPath = [...strokePath, nodeId];

    setStrokeVisitedEdges(newVisited);
    setStrokePath(newPath);

    // Check win: all edges visited
    if (newVisited.size === puzzle5.edges.length) {
      handleWinConclusion();
    }
  };

  const makeEdgeKey = (a: number, b: number): string => {
    return `${Math.min(a, b)}-${Math.max(a, b)}`;
  };

  const handleStrokeReset = () => {
    if (isPaused || isSlacking || showSurprise) return;
    setStrokePath([]);
    setStrokeVisitedEdges(new Set());
  };

  const handleStrokeUndo = () => {
    if (isPaused || isSlacking || showSurprise) return;

    setStrokePath((prevPath) => {
      if (prevPath.length < 2) return prevPath;
      const last = prevPath[prevPath.length - 1];
      const prev = prevPath[prevPath.length - 2];
      const edgeKey = makeEdgeKey(last, prev);
      setStrokeVisitedEdges((prevEdges) => {
        const nextEdges = new Set(prevEdges);
        nextEdges.delete(edgeKey);
        return nextEdges;
      });
      return prevPath.slice(0, -1);
    });
  };

  // ----------------------------------------------------
  // Level 6: Memory Match Helpers
  // ----------------------------------------------------
  const handleMemoryCardClick = (idx: number) => {
    if (isPaused || isSlacking || showSurprise) return;
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
    <div className="relative flex flex-col justify-between h-full bg-stone-50 text-black overflow-hidden select-none">

      {/* Visual background shake indicator overlay */}
      {stress > 70 && (
        <div className="absolute inset-0 border-[6px] border-red-900/40 pointer-events-none z-40 animate-pulse" />
      )}

      {/* ----------------------------------------------------
          TOP NAVIGATION HEADER
          ---------------------------------------------------- */}
      <div className="p-3 border-b-2 border-black bg-white z-10" style={{backgroundImage:'radial-gradient(#f1f1f1 1px, transparent 1px)', backgroundSize:'10px 10px'}}>

        {/* Stage & Pause */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <span className="text-[8.5px] bg-black text-yellow-400 font-mono font-black tracking-widest px-2 py-0.5 select-none rounded-none border border-black shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] uppercase">STAGE 0{level.id}</span>
            <h3 className="font-display font-black text-[13px] text-black mt-1 tracking-tight">{level.title}</h3>
          </div>
          <button
            id="btn-play-pause-toggle"
            onClick={() => setIsPaused(!isPaused)}
            className="bg-neutral-50 hover:bg-neutral-100 border-2 border-black text-black px-2.5 py-1 select-none text-[10px] font-mono rounded-none font-black shadow-[2px_2px_0px_#000000] cursor-pointer hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          >
            {isPaused ? '▶ 唤睡战意' : '⏸ 暂作修整'}
          </button>
        </div>

        {/* Stress Gauge */}
        <div className="px-2 py-1.5 bg-white">
          <div className="flex justify-between items-center text-[10px] font-mono mb-1">
            <span className="font-semibold text-black">💀 脑压: <strong className={`font-black ${stress >= 75 ? 'text-red-600' : ''}`}>{stress}%</strong></span>
            <span className="text-zinc-500 text-[9px] font-bold">
              {stress <= 20 && '🧘 平缓'}{stress > 20 && stress <= 40 && '😳 轻浮'}{stress > 40 && stress <= 70 && '🥵 沸热'}{stress > 70 && '☠️ 濒崩'}
            </span>
          </div>
          <div className="w-full bg-neutral-200 h-3 border-2 border-black rounded-none relative overflow-hidden">
            <div className={`h-full transition-all duration-300 ease-out ${stress >= 71 ? 'bg-red-600 animate-pulse' : stress >= 41 ? 'bg-orange-500' : 'bg-black'}`} style={{width:`${Math.min((stress / stressMaxCap) * 100, 100)}%`}} />
          </div>
        </div>

        {/* Tickers */}
        <div className="py-1.5 px-2 border-t border-black text-[10px] font-mono flex justify-between bg-zinc-50/50 select-none font-bold">
          <div className="flex items-center gap-1">
            <span>⏰</span>
            <span className={`font-mono font-black tracking-tight ${remainingTime <= 15 ? 'text-red-600 animate-pulse bg-red-50 px-1 border border-red-300' : 'text-neutral-900'}`}>{formattedTime()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>✅</span>
            <span className="text-zinc-500">COMBO:</span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-1 py-0.5 text-[9px] font-black rounded-sm">{consecutiveCorrect}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-600 font-bold">[体质]</span>
            <span className="truncate max-w-[80px]">{talent ? talent.name : '裸跑'}</span>
          </div>
        </div>

        {/* Live quote */}
        {floatingQuote && (
          <div className="mt-1 bg-stone-100 border border-stone-300 p-1 flex items-start gap-1">
            <span className="text-[9px] font-mono text-neutral-500 bg-stone-200 px-1 border border-stone-300 select-none shrink-0 font-bold">SYS:</span>
            <p className="text-[9px] text-neutral-600 font-mono leading-tight truncate flex-1 min-w-0">
              {floatingQuote}
            </p>
          </div>
        )}

      </div>

      {/* ----------------------------------------------------
          MIDDLE: MAIN ACTIVE PUZZLE PLAYGROUND
          ---------------------------------------------------- */}
      <div className="relative flex-1 flex flex-col justify-center items-center bg-white p-4 overflow-hidden min-h-[300px]" style={{backgroundImage:'radial-gradient(#e5e5e5 1px, transparent 1px)', backgroundSize:'16px 16px'}}>
        
        {/* Dynamic Flash Visual Screen on Click */}
        {visualFlash === 'CORRECT' && (
          <div className="absolute inset-0 bg-white/10 z-10 pointer-events-none transition-all duration-75" />
        )}
        {visualFlash === 'WRONG' && (
          <div className="absolute inset-0 bg-red-600/15 z-10 pointer-events-none transition-all duration-75" />
        )}

        {/* Level instructions overlay */}
        <div className="text-center mb-3 select-none z-10">
          {level.id === 1 && (
            <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
              <span>当前寻找目标:</span>
              <span className="bg-black text-white px-2.5 py-0.5 rounded font-black text-sm animate-pulse">{schulteNext}</span>
              <span>进度: {schulteNext - 1} / 25</span>
            </div>
          )}
          {level.id === 2 && (
            <div className="flex justify-between items-center px-1 py-1 mb-3 text-xs font-mono border-b border-black text-black">
              <span>{selectedSudokuIdx === null ? '未选取' : `第${sudokuCells[selectedSudokuIdx].row + 1}行 第${sudokuCells[selectedSudokuIdx].col +1}列`}</span>
              <span className="text-neutral-500">4×4 经典小九宫格</span>
            </div>
          )}
          {level.id === 3 && (
            <p className="text-[11px] font-mono text-neutral-500 flex items-center justify-center gap-1.5 mb-2">
              <span>📦 点击空格旁的方块滑入 · 排列 1-8</span>
            </p>
          )}
          {level.id === 4 && (
            <p className="text-[11px] font-mono text-neutral-500 flex items-center justify-center gap-1.5 mb-2">
              <span>🔧 点击管道旋转 · 连通左右两侧</span>
            </p>
          )}
          {level.id === 5 && (
            <p className="text-[11px] font-mono text-neutral-500 flex items-center justify-center gap-1.5 mb-2">
              <span>✏️ 依次点击节点走遍所有连线</span>
            </p>
          )}
          {level.id === 6 && (
            <p className="text-[11px] font-mono text-neutral-500 flex items-center justify-center gap-1.5 mb-2">
              <span>🃏 翻牌配对</span>
            </p>
          )}
        </div>

        {/* ----------------- GAME SCREEN: LEVEL 1 SCHULTE ----------------- */}
        {level.id === 1 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';
          const blurClass = isSevere ? 'blur-[2.5px] select-none scale-95' : isMedium ? 'blur-[1px] select-none' : '';

          return (
            <div className="w-full max-w-sm mx-auto select-none mt-2">
              <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>当前寻找目标:</span>
                <span className="bg-black text-white px-2.5 py-0.5 rounded font-black text-sm animate-pulse">{schulteNext}</span>
                <span>进度: {schulteNext - 1} / 25</span>
              </div>
              <div className={`grid grid-cols-5 gap-1.5 p-2 bg-neutral-100 border-4 border-black shadow-[4px_4px_0px_#000000] rounded-none transition-all duration-300 ${shakeClass}`}>
                {schulteNumbers.map((num, i) => {
                  const isClicked = num < schulteNext;
                  const isCorrupted = isSevere && !isClicked && (num % 3 === 0 || num % 7 === 1);
                  const isHidden = schulteAmnesiaFlash && num >= schulteNext;
                  return (
                    <motion.button
                      disabled={isClicked}
                      id={`btn-schulte-grid-cell-${num}`}
                      key={i}
                      onClick={() => handleSchulteClick(num)}
                      whileHover={{ scale: isClicked ? 1 : 1.05 }}
                      whileTap={{ scale: isClicked ? 1 : 0.92 }}
                      className={`aspect-square flex items-center justify-center font-mono font-bold text-base md:text-lg transition-all duration-150 rounded-none border-2 border-black
                        ${isClicked ? 'bg-neutral-300 text-neutral-500 border-neutral-400 line-through cursor-not-allowed' : 'bg-white text-black active:bg-black active:text-white cursor-pointer hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)]'}
                        ${blurClass} ${isSevere && !isClicked ? 'border-red-600 shadow-[1px_1px_0px_#dc2626]' : ''}`}
                    >
                      {isClicked ? '✓' : isHidden ? <span className="text-neutral-200">?</span> : isCorrupted ? <span className="text-red-600 font-extrabold animate-pulse">{['☠','Ø','⊗','⏾','☣','◆'][num % 6]}</span> : num}
                    </motion.button>
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

          return (
            <div className="w-full max-w-sm mx-auto select-none mt-2">
              <div className="flex justify-between items-center px-1 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>选定格子: {selectedSudokuIdx !== null ? `第${sudokuCells[selectedSudokuIdx].row + 1}行 第${sudokuCells[selectedSudokuIdx].col + 1}列` : '未选取'}</span>
                <span className="text-neutral-500">4×4 经典小九宫格</span>
              </div>
              <div className={`grid grid-cols-4 gap-0 bg-black p-1 shadow-[4px_4px_0px_#000000] border-2 border-black transition-all duration-300 ${shakeClass}`}>
                {sudokuCells.map((cell, idx) => {
                  const isPreset = cell.starting;
                  const isSelected = selectedSudokuIdx === idx;
                  const isWrong = sudokuErrorIdxs.includes(idx);
                  const borderBottom = cell.row === 1 ? 'border-b-4' : 'border-b';
                  const borderRight = cell.col === 1 ? 'border-r-4' : 'border-r';
                  const isCorrupted = isSevere && !isPreset && (cell.row * 2 + cell.col) % 4 === 1;

                  return (
                    <div
                      id={`grid-sudoku-cell-${cell.row}-${cell.col}`}
                      key={idx}
                      onClick={() => handleSudokuCellClick(idx)}
                      className={`aspect-square flex items-center justify-center font-mono font-bold text-xl md:text-2xl transition-all duration-200 border-black
                        ${borderBottom} ${borderRight}
                        ${isPreset ? 'bg-neutral-200 text-neutral-800 font-extrabold cursor-not-allowed' : isSelected ? 'bg-red-200 text-black border-red-600 animate-pulse' : isWrong ? 'bg-red-600 text-white animate-pulse font-black' : 'bg-white text-black hover:bg-neutral-50 cursor-pointer'}
                        ${blurClass}`}
                    >
                      {isCorrupted ? <span className="text-red-600 text-xs font-black animate-ping">?!</span> : cell.val !== null ? cell.val : <span className="text-neutral-300 text-xs font-normal">.</span>}
                    </div>
                  );
                })}
              </div>
              {/* Number Input Panel */}
              <div className="mt-5 grid grid-cols-5 gap-1.5 px-1">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    disabled={selectedSudokuIdx === null}
                    id={`btn-sudoku-dial-input-${num}`}
                    key={num}
                    onClick={() => handleSudokuNumInput(num)}
                    className={`h-12 flex items-center justify-center font-mono font-black text-lg border-2 border-black rounded-none shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all duration-150
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
            <div className="w-full max-w-xs mx-auto select-none mt-2">
              <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>📦 点击空格旁的方块滑入</span>
                <span className="text-neutral-500">排列 1-8</span>
              </div>
              <div className={`grid grid-cols-3 gap-1.5 p-2 bg-neutral-100 border-4 border-black shadow-[4px_4px_0px_#000000] rounded-none transition-all duration-300 ${shakeClass}`}>
                {slideBoard.map((val, idx) => {
                  const isEmpty = val === 0;
                  const isExtremityBlind = isSevere && !isEmpty && Math.random() < 0.2;
                  return (
                    <motion.button
                      key={idx}
                      disabled={isEmpty}
                      onClick={() => handleSlideClick(idx)}
                      whileHover={{ scale: isEmpty ? 1 : 1.05 }}
                      whileTap={{ scale: isEmpty ? 1 : 0.92 }}
                      className={`aspect-square flex items-center justify-center font-mono font-bold text-base md:text-lg transition-all duration-150 rounded-none border-2 border-black
                        ${isEmpty
                          ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                          : 'bg-white text-black active:bg-black active:text-white cursor-pointer hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)]'
                        }`}
                    >
                      {isEmpty ? '' : isExtremityBlind ? '?' : val}
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
            <div className="w-full max-w-xs mx-auto select-none mt-2">
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

                  return (
                    <motion.button
                      key={idx}
                      onClick={() => handlePipeClick(idx)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      className={`relative aspect-square flex items-center justify-center border-2 rounded-none font-mono font-black cursor-pointer text-xl md:text-2xl transition-all text-black active:bg-black active:text-white hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)] ${bgClass} ${borderClass}`}
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

        {/* ----------------- GAME SCREEN: LEVEL 5 ONE-STROKE ----------------- */}
        {level.id === 5 && (
          <div className="w-full max-w-sm mx-auto select-none mt-2">
            <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
              <span>✏️ 依次点击节点走遍所有连线</span>
              <span className="text-neutral-500">剩余 {puzzle5.edges.length - strokeVisitedEdges.size} 条</span>
            </div>
            <div className={`relative w-full bg-neutral-100 border-4 border-black shadow-[4px_4px_0px_#000000] p-2 transition-all duration-300 ${getGridDistortionClass()}`} style={{ aspectRatio: '1/0.75' }}>
              {/* Draw edges as SVG lines */}
              <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
                {puzzle5.edges.map(([a, b], i) => {
                  const nodeA = puzzle5.nodes.find((n) => n.id === a)!;
                  const nodeB = puzzle5.nodes.find((n) => n.id === b)!;
                  const key = makeEdgeKey(a, b);
                  const visited = strokeVisitedEdges.has(key);
                  return (
                    <line
                      key={i}
                      x1={`${nodeA.x}%`}
                      y1={`${nodeA.y}%`}
                      x2={`${nodeB.x}%`}
                      y2={`${nodeB.y}%`}
                      stroke={visited ? '#22c55e' : '#aaa'}
                      strokeWidth={visited ? 4 : 2}
                      strokeLinecap="round"
                    />
                  );
                })}
                {/* Draw path so far */}
                {strokePath.length > 1 && strokePath.slice(0, -1).map((nodeId, i) => {
                  const from = puzzle5.nodes.find((n) => n.id === strokePath[i])!;
                  const to = puzzle5.nodes.find((n) => n.id === strokePath[i + 1])!;
                  return (
                    <line
                      key={`path-${i}`}
                      x1={`${from.x}%`}
                      y1={`${from.y}%`}
                      x2={`${to.x}%`}
                      y2={`${to.y}%`}
                      stroke="#ef4444"
                      strokeWidth={3}
                      strokeLinecap="round"
                      opacity={0.8}
                    />
                  );
                })}
              </svg>

              {/* Draw nodes */}
              {puzzle5.nodes.map((node) => {
                const isInPath = strokePath.includes(node.id);
                const isCurrentHead = strokePath.length > 0 && strokePath[strokePath.length - 1] === node.id;
                const isExtremityBlind = stress > 75 && Math.random() < 0.15;

                return (
                  <motion.button
                    key={node.id}
                    onClick={() => handleStrokeNodeClick(node.id)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute w-10 h-10 md:w-12 md:h-12 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-mono font-black text-sm border-2 border-black cursor-pointer transition-all z-10"
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      backgroundColor: isCurrentHead ? '#ef4444' : isInPath ? '#22c55e' : '#fff',
                      borderColor: '#000',
                      color: isCurrentHead || isInPath ? '#000' : '#000',
                    }}
                  >
                    {isExtremityBlind ? '?' : node.id}
                  </motion.button>
                );
              })}
            </div>
            {/* Undo/Reset buttons */}
            {strokePath.length > 0 && (
              <div className="flex items-center justify-center gap-3 mt-2">
                {strokePath.length > 1 && (
                  <button
                    id="btn-stroke-undo"
                    onClick={handleStrokeUndo}
                    className="text-[10px] font-mono text-neutral-500 hover:text-black cursor-pointer underline inline-flex items-center gap-1"
                  >
                    ↩ 撤回
                  </button>
                )}
                <button
                  onClick={handleStrokeReset}
                  className="text-[10px] font-mono text-red-500 hover:text-red-400 cursor-pointer underline"
                >
                  ↩ 重置路径
                </button>
              </div>
            )}
            {stress > 70 && <div className="text-center text-[10px] text-red-600 font-mono tracking-tight font-black mt-4 animate-bounce">▲ ⚠️ 脑压暴载！节点剧烈晃动！ ▲</div>}
          </div>
        )}

        {/* ----------------- GAME SCREEN: LEVEL 6 MEMORY MATCH ----------------- */}
        {level.id === 6 && (() => {
          const isSlight = stress > 20 && stress <= 40;
          const isMedium = stress > 40 && stress <= 70;
          const isSevere = stress > 70;
          const shakeClass = isSevere ? 'animate-shake-extreme' : isMedium ? 'animate-shake-constant' : isSlight ? 'animate-shake-gentle' : '';

          return (
            <div className="w-full max-w-xs mx-auto select-none mt-2">
              <div className="flex justify-between items-center px-2 py-1 mb-3 text-xs font-mono border-b border-black text-black">
                <span>🃏 翻牌配对</span>
                <span className="text-neutral-500">已配对 {memoryCards.filter(c => c.matched).length / 2} / 8</span>
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
                      className={`aspect-square flex items-center justify-center border-2 border-black rounded-none font-mono font-bold cursor-pointer text-lg md:text-xl transition-all duration-150
                        ${card.matched
                          ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                          : card.faceUp
                          ? 'bg-white border-red-400 text-black'
                          : 'bg-white text-black active:bg-black active:text-white cursor-pointer hover:bg-neutral-50 shadow-[1px_1px_0px_rgba(0,0,0,1)]'
                        }`}
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

      </div>

      {/* ----------------------------------------------------
          BOTTOM CONTROLLER FOOTER: SLACK OFF SYSTEM
          ---------------------------------------------------- */}
      <div className="p-2.5 px-4 border-t-4 border-black bg-stone-200 flex justify-between items-center shadow-[0px_-2px_0px_rgba(0,0,0,1)] shrink-0">

        {/* Combo indicators */}
        <div className="text-[10px] font-mono text-zinc-600 shrink-0 leading-tight">
          <span className="font-extrabold text-black block text-[10px]">[人格] {talent ? talent.name : '无'}</span>
          <div className="flex gap-1 mt-0.5">
            {[0, 1, 2].map((dotIdx) => {
              const active = consecutiveCorrect > dotIdx;
              const isComboProne = talent?.id === 'panic_prone';
              return (
                <div
                  key={dotIdx}
                  className={`w-2.5 h-2.5 rounded-sm border border-black ${
                    active
                      ? isComboProne
                        ? 'bg-amber-500'
                        : 'bg-black'
                      : 'bg-transparent'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-[7px] text-zinc-500 font-mono block">3连→ -30压力</span>
        </div>

        {/* Slack off button */}
        <motion.button
          id="btn-slack-off-trigger"
          disabled={isPaused || isSlacking || showSurprise}
          onClick={triggerSlackOff}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`h-[40px] px-3 font-mono font-black text-[11px] tracking-tight border-2 border-black flex items-center gap-1.5 transition-all duration-150 shadow-[2.5px_2.5px_0px_rgba(0,0,0,1)] ${
            isPaused || isSlacking || showSurprise
              ? 'bg-stone-100 text-stone-400 border-stone-300 shadow-none cursor-not-allowed'
              : 'bg-yellow-400 hover:bg-yellow-300 text-black cursor-pointer active:translate-y-0.5 active:shadow-none'
          }`}
        >
          <span className="shrink-0 text-amber-900">☕</span>
          <div className="text-left leading-none select-none">
            <span className="block font-black text-[10px] font-display">【摸鱼自救】</span>
            <span className="text-[7px] font-normal leading-none block font-mono text-zinc-600">降压 / -15s</span>
          </div>
        </motion.button>

      </div>

    </div>
  );
}
