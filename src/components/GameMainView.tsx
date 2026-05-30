/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Level, Talent, GameStats, StressRecord } from '../types';
import {
  SUDOKU_PUZZLES, FUNNY_QUOTES, SudokuCell,
  PIPE_PUZZLES, PipeCell, PipeType,
  ONE_STROKE_PUZZLES, StrokeNode, StrokeEdge,
  MEMORY_PAIRS, MemoryPair,
} from '../data';
import { 
  AlertOctagon, AlertTriangle, ShieldCheck, Play, Pause, RefreshCw, Undo2, Coffee, Eye, Radio, BellRing, Skull
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
  const stressMaxCap = talent?.id === 'pre_exam_amnesia' ? 110 : 100;

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

  // 100% stress threshold countdown (5s melting mode)
  const [stressMeltCounter, setStressMeltCounter] = useState<number>(5);

  // Instructor audit alert trigger state
  const [showSurprise, setShowSurprise] = useState<boolean>(false);
  const [surpriseTimeLeft, setSurpriseTimeLeft] = useState<number>(3.0);
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

  // ----------------------------------------------------
  // One-Stroke State (Level 5)
  // ----------------------------------------------------
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
      // Pick a random puzzle structure
      const puzzleIdx = Math.floor(Math.random() * SUDOKU_PUZZLES.length);
      const puzzle = SUDOKU_PUZZLES[puzzleIdx];
      // Deep copy board cells
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
      // Initialize pipe puzzle — scramble rotations
      const puzzle = PIPE_PUZZLES[0];
      const cells = puzzle.map((c) => ({ ...c }));
      const rotations = cells.map((c) => {
        const scramble = 1 + Math.floor(Math.random() * 3);
        return (c.solvedRotation + scramble) % 4;
      });
      setPipeCells(cells);
      setPipeRotations(rotations);
    } else if (level.id === 5) {
      // Initialize one-stroke puzzle
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
    if (isPaused) return;

    timerIntervalRef.current = setInterval(() => {
      // Left click to normal gameplay countdown
      if (!isSlacking && !showSurprise) {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            handleFailedConclusion('TIMEOUT');
            return 0;
          }
          return prev - 1;
        });

        // 100% stress crash timer handler
        if (stress >= 100) {
          setStressMeltCounter((melt) => {
            if (melt <= 1) {
              handleFailedConclusion('STRESS_CRASH');
              return 0;
            }
            return melt - 1;
          });
        } else {
          setStressMeltCounter(5); // reset Buffer
        }

        // Random roll for Instructor Audit (conduct Check once every 12 seconds with 25% probability)
        const checkChance = Math.random();
        if (checkChance < 0.04 && timeElapsed > 8 && !showSurprise) {
          triggerSurpriseCheck();
        }
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [stress, isPaused, isSlacking, showSurprise, timeElapsed]);

  // ----------------------------------------------------
  // Actions
  // ----------------------------------------------------
  const handleFailedConclusion = (reason: 'TIMEOUT' | 'STRESS_CRASH') => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    onLose(getFinalStats(), reason);
  };

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

  // Adjust stress Helper
  const adjustStressValue = (amount: number) => {
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
        const recoverRate = talent?.id === 'panic_prone' ? -50 : -30;
        adjustStressValue(recoverRate);
        setConsecutiveCorrect(0); // consume combo
        setFloatingQuote('💡 连消COMBO爽翻！心态瞬间冷若冰霜！');
      } else {
        adjustStressValue(-5);
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
      const extraPanicFactor = talent?.id === 'social_phobia' ? 1.3 : 1.0;
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
    setSlackTimeLeft(10);
    setConsecutiveCorrect(0);

    // Apply the 15s absolute time cost immediately
    setRemainingTime((prev) => {
      const penalty = prev - 15;
      return penalty < 0 ? 0 : penalty;
    });

    // Start 10 seconds rapid relief timer
    let ticks = 10;
    const slackTimer = setInterval(() => {
      ticks -= 1;
      setSlackTimeLeft(ticks);

      // Stress relief speed - doubled if "low blood sugar hand shack" active
      const normalRelief = -5;
      const multiplier = talent?.id === 'low_sugar' ? 2.0 : 1.0;
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
    setSurpriseTimeLeft(3.0);
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
    let leftTime = 3.0;
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
  const getPipeConnections = (type: PipeType, rotation: number): boolean[] => {
    // [up, right, down, left]
    const baseMap: Record<PipeType, boolean[]> = {
      empty:   [false, false, false, false],
      straight:[true, false, true, false],
      corner:  [true, true, false, false],
      tee:     [true, true, false, true],
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

  const handlePipeClick = (idx: number) => {
    if (isPaused || isSlacking || showSurprise) return;
    if (pipeCells[idx].type === 'empty') return;

    const newRotations = [...pipeRotations];
    newRotations[idx] = (newRotations[idx] + 1) % 4;
    setPipeRotations(newRotations);

    // Check win — all connected?
    checkPipeVictory(newRotations);
  };

  const checkPipeVictory = (rots: number[]) => {
    // BFS/DFS from left edge to right edge through connected pipes
    const cols = 4;
    const rows = 4;
    const visited = new Set<number>();
    const queue: number[] = [];

    // Start from left edge cells that connect left
    for (let r = 0; r < rows; r++) {
      const idx = r * cols;
      const conns = getPipeConnections(pipeCells[idx].type, rots[idx]);
      if (conns[3]) { // connects left
        queue.push(idx);
        visited.add(idx);
      }
    }

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const r = Math.floor(curr / cols);
      const c = curr % cols;
      const conns = getPipeConnections(pipeCells[curr].type, rots[curr]);

      // Check each direction
      const dirs = [[-1, 0, 0, 2], [0, 1, 1, 3], [1, 0, 2, 0], [0, -1, 3, 1]]; // [dr, dc, myDir, theirDir]
      for (const [dr, dc, myDir, theirDir] of dirs) {
        if (!conns[myDir]) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const nIdx = nr * cols + nc;
        if (visited.has(nIdx)) continue;
        const nConns = getPipeConnections(pipeCells[nIdx].type, rots[nIdx]);
        if (nConns[theirDir]) {
          visited.add(nIdx);
          queue.push(nIdx);
        }
      }
    }

    // Check if any right-edge cell is reached
    for (let r = 0; r < rows; r++) {
      const idx = r * cols + (cols - 1);
      if (visited.has(idx)) {
        const conns = getPipeConnections(pipeCells[idx].type, rots[idx]);
        if (conns[1]) { // connects right
          handleWinConclusion();
          return;
        }
      }
    }
  };

  // ----------------------------------------------------
  // Level 5: One-Stroke Drawing Helpers
  // ----------------------------------------------------
  const puzzle5 = ONE_STROKE_PUZZLES[0];

  const handleStrokeNodeClick = (nodeId: number) => {
    if (isPaused || isSlacking || showSurprise) return;

    if (strokePath.length === 0) {
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
    <div className="relative flex flex-col justify-between h-full bg-black text-white border-4 border-white rounded-lg overflow-hidden select-none">
      
      {/* Visual background shake indicator overlay */}
      {stress > 70 && (
        <div className="absolute inset-0 border-[6px] border-red-900/40 pointer-events-none z-40 animate-pulse" />
      )}

      {/* ----------------------------------------------------
          TOP NAVIGATION HEADER
          ---------------------------------------------------- */}
      <div className="bg-neutral-950 border-b-2 border-neutral-800 p-3 z-10">
        
        {/* Scenario mini banner */}
        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span className="truncate max-w-[180px]">[ {level.title} ]</span>
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>体质: {talent ? talent.name : '裸跑'}</span>
          </div>
        </div>

        {/* Dynamic Stress Progress Meter */}
        <div className="mt-3 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-4 text-left">
            <span className="text-[10px] text-neutral-500 block uppercase font-mono leading-none">逆风崩压值</span>
            <span className={`text-[12px] font-black ${getStressTitle().color} font-mono block mt-0.5`}>
              {stress}% / {stressMaxCap}% [{getStressTitle().label}]
            </span>
          </div>

          {/* Graphical custom segmented layout progress bar */}
          <div className="col-span-8 bg-neutral-900 border border-neutral-700 h-4.5 rounded p-0.5 flex relative overflow-hidden">
            <motion.div
              className={`h-full rounded-sm ${
                stress > 70 
                  ? 'bg-red-600' 
                  : stress > 40 
                  ? 'bg-orange-500' 
                  : 'bg-white'
              }`}
              style={{ width: `${Math.min((stress / stressMaxCap) * 100, 100)}%` }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Split segments markers */}
            <div className="absolute inset-y-0 left-1/5 w-px bg-black opacity-30" />
            <div className="absolute inset-y-0 left-2/5 w-px bg-black opacity-30" />
            <div className="absolute inset-y-0 left-3/5 w-px bg-black opacity-30" />
            <div className="absolute inset-y-0 left-4/5 w-px bg-black opacity-30" />
          </div>
        </div>

        {/* Countdown Timer DDL & Controllers */}
        <div className="mt-3 flex items-center justify-between bg-black/40 border border-neutral-900 p-1.5 rounded">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-red-600/10 text-red-500 border border-red-950 px-1.5 py-0.5 rounded uppercase font-mono font-bold">
              ⏰ DEADLINE
            </span>
            <span className={`text-xl font-mono font-bold tracking-widest ${remainingTime < 15 ? 'text-red-500 animate-pulse' : 'text-neutral-100'}`}>
              {formattedTime()}
            </span>
          </div>

          <div className="flex gap-2">
            {/* Pause trigger */}
            <button
              id="btn-play-pause-toggle"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 px-2.5 rounded border border-neutral-700 text-xs font-mono font-bold hover:bg-neutral-900 transition-colors cursor-pointer flex items-center gap-1 text-neutral-400 hover:text-white"
            >
              {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              {isPaused ? '续' : '暂'}
            </button>
            <button
              id="btn-play-back-setup"
              onClick={onBack}
              className="p-1 px-2 border border-neutral-800 text-[10px] font-mono hover:bg-neutral-950 text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              弃权
            </button>
          </div>
        </div>

        {/* Live quote marquee style commentary terminal */}
        <div className="mt-2.5 bg-[#080808] border border-neutral-900 rounded p-1.5 flex items-start gap-1.5">
          <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 p-0.5 border border-neutral-900 rounded select-none shrink-0">
            SYSTEM_LOG:
          </span>
          <p className="text-[10px] text-neutral-400 font-mono leading-relaxed truncate-2-lines whitespace-pre-line flex-1 min-w-0">
            {floatingQuote}
          </p>
        </div>

      </div>

      {/* ----------------------------------------------------
          MIDDLE: MAIN ACTIVE PUZZLE PLAYGROUND
          ---------------------------------------------------- */}
      <div className="relative flex-1 flex flex-col justify-center items-center bg-neutral-950 p-4 overflow-hidden min-h-[300px]">
        
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
            <p className="text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-1.5">
              <span>当前寻找数字:</span>
              <span className="text-sm font-black text-white bg-red-600/20 border border-red-500 px-2 py-0.5 rounded">
                【 {schulteNext} 】
              </span>
              <span className="text-neutral-500">/ 25</span>
            </p>
          )}
          {level.id === 2 && (
            <p className="text-[11px] font-mono text-neutral-400">
              {selectedSudokuIdx === null ? (
                <span>✍️ 请先点击任意 <span className="text-white font-bold select-none">[空格子]</span> 开始填入数字</span>
              ) : (
                <span className="text-red-400">
                  ⚡ 正在精修坐标 ({sudokuCells[selectedSudokuIdx].row + 1}, {sudokuCells[selectedSudokuIdx].col + 1})
                </span>
              )}
            </p>
          )}
          {level.id === 3 && (
            <p className="text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-1.5">
              <span>📦 点击空格旁的方块滑入 · 排列 1-8</span>
            </p>
          )}
          {level.id === 4 && (
            <p className="text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-1.5">
              <span>🔧 点击管道旋转 · 连通左右两侧</span>
            </p>
          )}
          {level.id === 5 && (
            <div className="flex flex-col items-center gap-1">
              <p className="text-[11px] font-mono text-neutral-400">
                ✏️ 依次点击节点走遍所有连线 · 剩余 {puzzle5.edges.length - strokeVisitedEdges.size} 条
              </p>
              {strokePath.length > 0 && (
                <button
                  onClick={handleStrokeReset}
                  className="text-[10px] font-mono text-red-400 hover:text-red-300 cursor-pointer underline"
                >
                  ↩ 重置路径
                </button>
              )}
            </div>
          )}
          {level.id === 6 && (
            <p className="text-[11px] font-mono text-neutral-400 flex items-center justify-center gap-1.5">
              <span>🃏 翻牌配对 · 已配对 {memoryCards.filter(c => c.matched).length / 2} / 8</span>
            </p>
          )}
        </div>

        {/* ----------------- GAME SCREEN: LEVEL 1 SCHULTE ----------------- */}
        {level.id === 1 && (
          <div className={`transition-all duration-200 w-full max-w-sm ${getGridDistortionClass()}`}>
            <div className="grid grid-cols-5 gap-1.5 select-none">
              {schulteNumbers.map((num, i) => {
                const isAlreadyCleared = num < schulteNext;
                const isAimIndex = num === schulteNext;
                
                // Stress symptom under Tier 4 (random blind/invisible values)
                const isExtremityBlind = stress > 75 && Math.random() < 0.25;

                return (
                  <motion.button
                    disabled={isAlreadyCleared}
                    id={`btn-schulte-grid-cell-${num}`}
                    key={i}
                    onClick={() => handleSchulteClick(num)}
                    whileHover={{ scale: isAlreadyCleared ? 1 : 1.05 }}
                    whileTap={{ scale: isAlreadyCleared ? 1 : 0.92 }}
                    className={`aspect-square flex items-center justify-center border-2 rounded font-mono font-bold cursor-pointer text-sm md:text-base transition-colors ${
                      isAlreadyCleared
                        ? 'bg-neutral-900 border-neutral-800 text-neutral-600 saturate-0'
                        : 'bg-black border-neutral-700 text-white hover:border-white hover:bg-neutral-900'
                    }`}
                  >
                    {isExtremityBlind && !isAlreadyCleared ? '?' : num}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- GAME SCREEN: LEVEL 2 SUDOKU ----------------- */}
        {level.id === 2 && (
          <div className={`transition-all duration-200 w-full max-w-xs ${getGridDistortionClass()}`}>
            
            {/* Sudoku 4x4 Grid Board */}
            <div className="grid grid-cols-4 border-4 border-white select-none bg-black">
              {sudokuCells.map((cell, idx) => {
                const isSelected = selectedSudokuIdx === idx;
                const isStatic = cell.starting;
                const isWrong = sudokuErrorIdxs.includes(idx);

                // Thick sub-box borders coordinates mapping (4x4 has four 2x2 boxes)
                const borderBottom = cell.row === 1 ? 'border-b-4 border-b-neutral-100' : 'border-b border-b-neutral-800';
                const borderRight = cell.col === 1 ? 'border-r-4 border-r-neutral-100' : 'border-r border-r-neutral-800';

                // Extreme stress dizzy blur indices
                const isExtremitySpun = stress > 75 && Math.random() < 0.2;

                return (
                  <div
                    id={`grid-sudoku-cell-${cell.row}-${cell.col}`}
                    key={idx}
                    onClick={() => handleSudokuCellClick(idx)}
                    className={`aspect-square flex items-center justify-center font-mono text-base md:text-lg font-black cursor-pointer transition-all ${borderBottom} ${borderRight} ${
                      isStatic 
                        ? 'bg-neutral-800/60 text-neutral-300' 
                        : isSelected 
                        ? 'bg-white text-black font-extrabold focus:outline-none' 
                        : isWrong 
                        ? 'bg-red-950/60 text-red-500 animate-pulse border-red-500'
                        : 'bg-black text-neutral-100 hover:bg-neutral-900'
                    }`}
                  >
                    {isExtremitySpun && !isStatic ? '🌀' : cell.val !== null ? cell.val : ''}
                  </div>
                );
              })}
            </div>

            {/* Sudoku Input Dial Panel (renders only if they highlight a cell) */}
            <div className="mt-4 bg-neutral-950 p-2 border border-neutral-900 rounded">
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    disabled={selectedSudokuIdx === null}
                    id={`btn-sudoku-dial-input-${num}`}
                    key={num}
                    onClick={() => handleSudokuNumInput(num)}
                    className="py-2.5 rounded bg-neutral-900 border border-neutral-700 text-xs text-white font-mono font-black hover:bg-white hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  disabled={selectedSudokuIdx === null}
                  id="btn-sudoku-dial-input-clear"
                  onClick={() => handleSudokuNumInput(null)}
                  className="py-2.5 rounded bg-red-950/60 border border-red-800 text-[10px] font-mono font-bold text-red-400 hover:bg-red-500 hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  清除
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ----------------- GAME SCREEN: LEVEL 3 SLIDING PUZZLE ----------------- */}
        {level.id === 3 && (
          <div className={`transition-all duration-200 w-full max-w-xs ${getGridDistortionClass()}`}>
            <div className="grid grid-cols-3 gap-1.5 select-none">
              {slideBoard.map((val, idx) => {
                const isEmpty = val === 0;
                const isExtremityBlind = stress > 75 && !isEmpty && Math.random() < 0.2;
                return (
                  <motion.button
                    key={idx}
                    disabled={isEmpty}
                    onClick={() => handleSlideClick(idx)}
                    whileHover={{ scale: isEmpty ? 1 : 1.05 }}
                    whileTap={{ scale: isEmpty ? 1 : 0.92 }}
                    className={`aspect-square flex items-center justify-center border-2 rounded font-mono font-black cursor-pointer text-lg md:text-xl transition-all ${
                      isEmpty
                        ? 'bg-neutral-950 border-neutral-900'
                        : 'bg-black border-neutral-600 text-white hover:border-white hover:bg-neutral-900'
                    }`}
                  >
                    {isEmpty ? '' : isExtremityBlind ? '?' : val}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- GAME SCREEN: LEVEL 4 PIPE PUZZLE ----------------- */}
        {level.id === 4 && (
          <div className={`transition-all duration-200 w-full max-w-xs ${getGridDistortionClass()}`}>
            <div className="grid grid-cols-4 gap-1 select-none">
              {pipeCells.map((cell, idx) => {
                if (cell.type === 'empty') {
                  return <div key={idx} className="aspect-square bg-neutral-950 border border-neutral-900 rounded" />;
                }
                const rotation = pipeRotations[idx];
                const conns = getPipeConnections(cell.type, rotation);
                // Check if this cell is connected to the left edge (for glow)
                const isExtremityBlind = stress > 75 && Math.random() < 0.15;

                // Render pipe shape using CSS borders/transforms
                const pipeChars: Record<PipeType, string> = {
                  empty: '',
                  straight: '┃',
                  corner: '┗',
                  tee: '┣',
                  cross: '╋',
                };
                const displayChar = isExtremityBlind ? '?' : pipeChars[cell.type];

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handlePipeClick(idx)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    className={`aspect-square flex items-center justify-center border-2 rounded font-mono font-black cursor-pointer text-xl md:text-2xl transition-all bg-black border-neutral-700 text-white hover:border-white hover:bg-neutral-900`}
                    style={{ transform: `rotate(${rotation * 90}deg)` }}
                  >
                    {displayChar}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- GAME SCREEN: LEVEL 5 ONE-STROKE ----------------- */}
        {level.id === 5 && (
          <div className={`transition-all duration-200 w-full max-w-sm ${getGridDistortionClass()}`}>
            <div className="relative w-full" style={{ aspectRatio: '1/0.75' }}>
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
                      stroke={visited ? '#22c55e' : '#555'}
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
                    className="absolute w-10 h-10 md:w-12 md:h-12 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center font-mono font-black text-sm border-2 cursor-pointer transition-all z-10"
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      backgroundColor: isCurrentHead ? '#ef4444' : isInPath ? '#22c55e' : '#000',
                      borderColor: isCurrentHead ? '#fff' : isInPath ? '#22c55e' : '#666',
                      color: isCurrentHead || isInPath ? '#000' : '#fff',
                    }}
                  >
                    {isExtremityBlind ? '?' : node.id}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- GAME SCREEN: LEVEL 6 MEMORY MATCH ----------------- */}
        {level.id === 6 && (
          <div className={`transition-all duration-200 w-full max-w-xs ${getGridDistortionClass()}`}>
            <div className="grid grid-cols-4 gap-1.5 select-none">
              {memoryCards.map((card, idx) => {
                const isExtremityBlind = stress > 75 && !card.faceUp && !card.matched && Math.random() < 0.15;
                return (
                  <motion.button
                    key={card.id}
                    onClick={() => handleMemoryCardClick(idx)}
                    whileHover={{ scale: card.faceUp || card.matched ? 1 : 1.05 }}
                    whileTap={{ scale: card.faceUp || card.matched ? 1 : 0.92 }}
                    className={`aspect-square flex items-center justify-center border-2 rounded font-mono font-bold cursor-pointer text-lg md:text-xl transition-all ${
                      card.matched
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                        : card.faceUp
                        ? 'bg-white border-white text-black'
                        : 'bg-black border-neutral-700 text-white hover:border-white hover:bg-neutral-900'
                    }`}
                  >
                    {card.faceUp || card.matched
                      ? isExtremityBlind ? '?' : card.emoji
                      : '?'}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- 100% EXTREME MELTDOWN CRITICAL ALERT ----------------- */}
        {stress >= 100 && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-30 bg-red-600 text-black border-4 border-white p-4 rounded text-center shadow-[4px_4px_0px_#000000] animate-pulse">
            <AlertOctagon className="w-10 h-10 mx-auto text-black animate-bounce" />
            <h3 className="text-base font-black font-mono uppercase mt-2">
              🚨 警告：脑神经元全面暴毙 🚨
            </h3>
            <p className="text-xs font-bold leading-relaxed mt-1">
              心态崩溃满档！CPU正在严重烧损融化...
            </p>
            <div className="mt-3 inline-block bg-black text-white font-mono font-black text-xl px-4 py-1.5 rounded-sm">
              崩溃倒计时: {stressMeltCounter}秒 !!!
            </div>
            <p className="text-[10px] text-zinc-900 font-bold italic mt-2.5">
              快摸鱼减压！否则直接心态破防失败！
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
              className="absolute inset-0 bg-neutral-950/95 z-30 flex flex-col justify-center items-center p-6 text-center"
            >
              <div className="relative shadow-2xl p-6 bg-black border-3 border-dashed border-sky-500 rounded max-w-sm">
                
                {/* Floating fun tea cup bubble */}
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-16 h-16 mx-auto flex items-center justify-center bg-sky-950 border-2 border-sky-500 rounded-full mb-3"
                >
                  <Coffee className="w-8 h-8 text-sky-400" />
                </motion.div>

                {/* Animated progress loop */}
                <p className="text-xs font-black text-sky-400 font-mono tracking-widest uppercase">
                  ⚡ 摸鱼减压时光中 (Slacking Off...)
                </p>
                <p className="text-[11px] text-neutral-400 font-serif leading-relaxed mt-2.5">
                  “短暂休息调整心态，虽然虚度了时光…”
                </p>

                {/* Counter displaying */}
                <div className="my-4 text-3xl font-mono font-black text-white">
                  {slackTimeLeft}s
                </div>

                {/* Slack penalties caution */}
                <div className="bg-sky-950/40 p-2 rounded border border-sky-900 text-[10px] text-sky-300 font-mono">
                  代价：DDL 危机缩短 -15 秒 ⏱️ 正在剧烈冷却压力...
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
              className="absolute inset-4 z-40 bg-black border-4 border-red-600 rounded p-4 flex flex-col justify-between"
            >
              <div className="flex items-center gap-2 border-b border-red-950 pb-2 mb-2">
                <BellRing className="w-6 h-6 text-red-500 animate-pulse animate-bounce" />
                <div>
                  <h3 className="text-xs font-black text-red-500 font-mono">
                    ⚠️ CRITICAL AUDIT: 导员查勤来袭！
                  </h3>
                  <span className="text-[9px] text-neutral-500 font-mono">INSTRUCTOR SURPRISE CHECK-IN</span>
                </div>
              </div>

              {/* Central check scenario */}
              <div className="my-auto text-center py-2">
                <p className="text-[12px] text-neutral-300 leading-relaxed font-serif pl-1 bg-red-950/20 p-2.5 border border-red-950 rounded">
                  “导员走到窗边张望！班级群发了在线打卡！”
                </p>

                {/* Action seconds feedback */}
                <div className="mt-4 flex flex-col items-center">
                  <span className="text-[9px] text-neutral-400 font-mono uppercase">你仅剩下极限反应时间：</span>
                  <span className="text-3xl font-black text-red-500 font-mono mt-1">
                    {surpriseTimeLeft}s
                  </span>
                  
                  {/* Visual progress shrinking line */}
                  <div className="w-full max-w-xs bg-neutral-900 border border-neutral-800 h-2 mt-2 rounded">
                    <div
                      className="bg-red-500 h-full rounded transition-all duration-75"
                      style={{ width: `${(surpriseTimeLeft / 3.0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status resolved banner */}
              {surpriseStatusMsg && (
                <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                  {surpriseStatusMsg === 'SUCCESS' ? (
                    <div className="text-center text-emerald-400">
                      <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                      <h4 className="text-sm font-black font-mono mt-2">打卡成功！躲过一劫！</h4>
                      <p className="text-xs text-neutral-500 mt-1">逆风值得到极佳舒缓降温</p>
                    </div>
                  ) : (
                    <div className="text-center text-red-500">
                      <Skull className="w-12 h-12 text-red-600 mx-auto" />
                      <h4 className="text-sm font-black font-mono mt-2">暴露穿帮！点名通报批评！</h4>
                      <p className="text-xs text-neutral-500 mt-1">逆风崩阻值加剧暴涨</p>
                    </div>
                  )}
                </div>
              )}

              {/* Multi Choice inputs (must click correct reaction buttons) */}
              <div className="space-y-2 mt-2 z-10">
                {surpriseOptions.map((opt, idx) => (
                  <button
                    id={`btn-surprise-audit-option-${idx}`}
                    disabled={surpriseStatusMsg !== ''}
                    key={idx}
                    onClick={() => handleSurpriseOptionClick(idx)}
                    className="w-full text-left p-2.5 border-2 border-neutral-800 bg-neutral-950 rounded text-xs font-mono font-bold hover:bg-white hover:text-black transition-colors cursor-pointer text-neutral-200"
                  >
                    {opt}
                  </button>
                ))}
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
              className="absolute inset-0 bg-black/90 z-30 flex flex-col justify-center items-center p-6 text-center"
            >
              <div className="border-2 border-white p-6 bg-neutral-950 rounded max-w-xs shadow-2xl">
                <Pause className="w-10 h-10 text-white mx-auto mb-3 animate-pulse" />
                <h3 className="text-lg font-black font-mono uppercase tracking-widest">
                  游戏已暂停
                </h3>
                <p className="text-xs text-neutral-400 mt-2 font-serif leading-relaxed">
                  “暂时的逃避可以暂缓压力，但逃避无法化解逆风。”
                </p>

                <div className="mt-5 space-y-2.5">
                  <button
                    id="btn-play-pause-resume"
                    onClick={() => setIsPaused(false)}
                    className="w-full py-2 border-2 border-white bg-white text-black font-mono font-bold text-xs hover:bg-neutral-900 hover:text-white transition-colors cursor-pointer"
                  >
                    恢复逆袭对局
                  </button>
                  <button
                    id="btn-play-pause-giveup"
                    onClick={onBack}
                    className="w-full py-2 bg-neutral-900 border border-neutral-700 text-neutral-400 font-mono text-xs hover:text-white hover:bg-black transition-colors"
                  >
                    返回主大厅
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
      <div className="bg-neutral-950 border-t-2 border-neutral-800 p-4 shrink-0 flex items-center justify-between">
        
        {/* Combo Streak counter indicators */}
        <div>
          <span className="text-[9px] text-neutral-500 block uppercase font-mono">连斩恢复进度</span>
          <div className="flex gap-1 mt-1">
            {[0, 1, 2].map((dotIdx) => {
              const active = consecutiveCorrect > dotIdx;
              const isComboProne = talent?.id === 'panic_prone';
              return (
                <div
                  key={dotIdx}
                  className={`w-3.5 h-3.5 rounded-sm border ${
                    active 
                      ? isComboProne 
                        ? 'bg-amber-500 border-amber-400' 
                        : 'bg-white border-white' 
                      : 'bg-transparent border-neutral-800'
                  }`}
                />
              );
            })}
          </div>
          <span className="text-[8px] text-neutral-500 font-mono block mt-1">
            (3连正确 大幅冷却 -30 压力)
          </span>
        </div>

        {/* Dynamic Slack off triggers */}
        <motion.button
          id="btn-slack-off-trigger"
          disabled={isPaused || isSlacking || showSurprise}
          onClick={triggerSlackOff}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 bg-black py-3 px-4 rounded border-2 border-white hover:bg-white hover:text-black transition-all cursor-pointer shadow-[3px_3px_0px_#0284c7] disabled:opacity-30 disabled:pointer-events-none"
        >
          <Coffee className="w-4 h-4" />
          <div className="text-left font-mono">
            <span className="font-extrabold text-[12px] block leading-none">摸鱼减压🥤</span>
            <span className="text-[8px] text-neutral-400 block mt-0.5 leading-none">代价: DDL-15秒 // 冷却50%</span>
          </div>
        </motion.button>

      </div>

    </div>
  );
}
