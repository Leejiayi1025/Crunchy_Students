/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { ShieldCheck, Flame, Skull, Sparkles } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  // Fun floating stress keywords
  const floatingBubbles = [
    { text: '早八高压', x: '10%', y: '15%', delay: 0 },
    { text: '期末测验', x: '80%', y: '25%', delay: 1 },
    { text: '导员查寝', x: '15%', y: '70%', delay: 1.5 },
    { text: '微积分DDL', x: '75%', y: '75%', delay: 0.5 },
    { text: '摆烂危机', x: '45%', y: '82%', delay: 2 },
    { text: '脱发警告', x: '82%', y: '50%', delay: 2.5 },
  ];

  return (
    <div className="relative flex flex-col justify-between h-full bg-black text-white p-6 overflow-hidden border-4 border-white rounded-lg">
      
      {/* Decorative Matrix Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30" />

      {/* Floating Collegiate Stress Bubbles */}
      {floatingBubbles.map((bubble, i) => (
        <motion.div
          key={i}
          className="absolute bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400 font-mono px-2 py-1 rounded-full pointer-events-none"
          style={{ left: bubble.x, top: bubble.y }}
          animate={{
            y: [-10, 10, -10],
            rotate: [-2, 2, -2],
          }}
          transition={{
            duration: 4 + (i % 3),
            repeat: Infinity,
            delay: bubble.delay,
            ease: 'easeInOut',
          }}
        >
          {bubble.text}
        </motion.div>
      ))}

      {/* Header section */}
      <div className="z-10 flex justify-between items-center border-b border-neutral-800 pb-4">
        <span className="font-mono text-xs tracking-widest text-neutral-400">大学生心态模拟器 // VER 1.0</span>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-neutral-700"></span>
        </div>
      </div>

      {/* Hero Body */}
      <div className="z-10 flex flex-col items-center justify-center my-auto text-center py-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative inline-block"
        >
          {/* Main big red tag */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-black text-[9px] font-mono font-black uppercase tracking-[0.2em] px-2 py-0.5 whitespace-nowrap">
            CRISP COLLEGE STUDENT STRESS SYSTEM
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-tight mt-2 select-none">
            脆皮大学生
            <br />
            <motion.span 
              className="text-red-500 font-extrabold italic inline-block mt-1"
              animate={{ skewX: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            >
              逆风如解
            </motion.span>
          </h1>
        </motion.div>

        {/* Traditional Custom Scroll / Chinese Poetry Core Motif */}
        <p className="text-xs text-neutral-400 font-serif leading-loose mt-6 tracking-widest bg-neutral-950/80 px-4 py-2 border border-neutral-900 rounded max-w-xs">
          “ 逆风如解意，
          <br />
          容易莫摧残。”
        </p>

        {/* Innovative self-adaptive challenge description */}
        <div className="mt-8 text-left text-xs text-neutral-300 font-sans space-y-2 bg-neutral-950 p-4 border-l-4 border-red-500 rounded max-w-sm">
          <div className="flex items-center gap-1 text-red-400 font-bold">
            <Flame className="w-4 h-4" />
            <span>核心自适应机制 (Windlord Engine) :</span>
          </div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            这不是传统的解谜游戏。你玩得越急、答得越错，界面抖动与虚无状态就会愈加严重！唯有冷静自救、适时摸鱼，方能极限反杀。
          </p>
        </div>
      </div>

      {/* Start Button & Slogan */}
      <div className="z-10 flex flex-col gap-4 items-center border-t border-neutral-800 pt-6">
        <div className="text-center">
          <p className="text-sm font-bold tracking-[0.3em] text-neutral-300 uppercase select-none">
            「 逆风如解，稳则必胜 」
          </p>
          <p className="text-[10px] text-neutral-500 font-mono mt-1">
            PRESS TO IMMERSE // DO NOT PANIC UNDER INSTRUCTOR AUDIT
          </p>
        </div>

        <motion.button
          id="btn-play-start"
          whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onStart}
          className="w-full max-w-xs bg-white text-black text-center font-bold font-mono tracking-wider py-4 border-2 border-white hover:bg-neutral-900 hover:text-white transition-all cursor-pointer shadow-[4px_4px_0px_#dc2626]"
        >
          进入残酷校园 ➔
        </motion.button>
      </div>

    </div>
  );
}
