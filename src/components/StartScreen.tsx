/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="flex-1 flex flex-col justify-center p-6 relative overflow-hidden bg-[#f9f9f9]">

      {/* Halftone overlay */}
      <div className="absolute inset-0 halftone pointer-events-none z-0"></div>

      {/* Background Anime Student Illustration */}
      <div className="absolute inset-0 flex items-center justify-center z-0 opacity-[0.07] pointer-events-none">
        <svg viewBox="0 0 400 600" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Desk */}
          <rect x="40" y="380" width="320" height="12" rx="2" fill="#000" />
          <rect x="60" y="392" width="8" height="120" fill="#000" />
          <rect x="332" y="392" width="8" height="120" fill="#000" />

          {/* Books stack on desk (left) */}
          <rect x="65" y="348" width="60" height="8" rx="1" fill="#000" />
          <rect x="68" y="340" width="55" height="8" rx="1" fill="#000" />
          <rect x="63" y="332" width="62" height="8" rx="1" fill="#000" />
          <rect x="67" y="324" width="50" height="8" rx="1" fill="#000" />
          {/* Book spines detail */}
          <line x1="80" y1="348" x2="80" y2="356" stroke="#fff" strokeWidth="1" />
          <line x1="95" y1="340" x2="95" y2="348" stroke="#fff" strokeWidth="1" />

          {/* Coffee cup (right side of desk) */}
          <rect x="290" y="355" width="30" height="25" rx="3" fill="#000" />
          <path d="M320 360 Q340 360 340 372 Q340 380 320 380" fill="none" stroke="#000" strokeWidth="3" />
          {/* Steam */}
          <path d="M298 350 Q300 340 305 345 Q308 335 312 342" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />

          {/* Laptop on desk */}
          <rect x="150" y="355" width="100" height="8" rx="1" fill="#000" />
          <rect x="155" y="310" width="90" height="45" rx="2" fill="#000" />
          {/* Screen glow lines */}
          <line x1="162" y1="320" x2="210" y2="320" stroke="#fff" strokeWidth="1" />
          <line x1="162" y1="326" x2="230" y2="326" stroke="#fff" strokeWidth="1" />
          <line x1="162" y1="332" x2="200" y2="332" stroke="#fff" strokeWidth="1" />
          <line x1="162" y1="338" x2="220" y2="338" stroke="#fff" strokeWidth="1" />
          <line x1="162" y1="344" x2="195" y2="344" stroke="#fff" strokeWidth="1" />

          {/* Student - slumped body */}
          {/* Torso / hoodie */}
          <path d="M160 380 Q160 310 200 290 Q240 310 240 380 Z" fill="#000" />
          {/* Hoodie hood */}
          <path d="M170 290 Q175 265 200 258 Q225 265 230 290" fill="#000" />
          {/* Hoodie front pocket */}
          <rect x="178" y="340" width="44" height="18" rx="5" fill="none" stroke="#fff" strokeWidth="1.5" />

          {/* Head - tilted/exhausted */}
          <ellipse cx="200" cy="250" rx="35" ry="40" fill="#000" />
          {/* Face highlight */}
          <ellipse cx="200" cy="252" rx="28" ry="33" fill="#fff" />
          {/* Messy hair strands */}
          <path d="M170 240 Q165 220 175 210 Q180 215 178 230" fill="#000" />
          <path d="M180 235 Q178 210 190 200 Q192 210 185 228" fill="#000" />
          <path d="M195 230 Q195 205 210 198 Q212 208 202 225" fill="#000" />
          <path d="M215 232 Q218 210 230 205 Q228 215 222 228" fill="#000" />
          <path d="M228 238 Q235 220 232 210 Q225 218 225 235" fill="#000" />
          {/* Top hair volume */}
          <path d="M165 245 Q163 215 185 200 Q200 192 215 200 Q237 215 235 245" fill="#000" />

          {/* Glasses */}
          <rect x="180" y="243" width="16" height="13" rx="2" fill="none" stroke="#000" strokeWidth="2" />
          <rect x="204" y="243" width="16" height="13" rx="2" fill="none" stroke="#000" strokeWidth="2" />
          <line x1="196" y1="249" x2="204" y2="249" stroke="#000" strokeWidth="2" />
          {/* Lens reflection */}
          <line x1="183" y1="246" x2="187" y2="246" stroke="#000" strokeWidth="1" />
          <line x1="207" y1="246" x2="211" y2="246" stroke="#000" strokeWidth="1" />

          {/* Tired eyes (half-closed) */}
          <path d="M184 250 Q188 253 192 250" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <path d="M208 250 Q212 253 216 250" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />

          {/* Dark circles under eyes */}
          <path d="M183 255 Q188 258 193 255" fill="none" stroke="#000" strokeWidth="1" opacity="0.6" />
          <path d="M207 255 Q212 258 217 255" fill="none" stroke="#000" strokeWidth="1" opacity="0.6" />

          {/* Nose */}
          <path d="M199 257 Q200 262 202 260" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />

          {/* Mouth - exhausted frown */}
          <path d="M192 270 Q200 266 208 270" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />

          {/* Stress marks / sweat drop */}
          <path d="M238 230 Q242 222 240 215 Q238 222 234 228 Z" fill="#000" />
          {/* Stress lines */}
          <line x1="245" y1="225" x2="255" y2="220" stroke="#000" strokeWidth="1.5" />
          <line x1="248" y1="232" x2="258" y2="230" stroke="#000" strokeWidth="1.5" />
          <line x1="246" y1="240" x2="256" y2="242" stroke="#000" strokeWidth="1.5" />

          {/* Arms on desk */}
          {/* Left arm */}
          <path d="M160 340 Q140 355 130 363 Q125 368 135 370 L170 380" fill="#000" />
          {/* Right arm reaching toward coffee */}
          <path d="M240 340 Q260 355 275 362 Q280 366 270 370 L245 380" fill="#000" />
          {/* Hand near coffee */}
          <ellipse cx="280" cy="365" rx="8" ry="5" fill="#000" />

          {/* Papers scattered */}
          <rect x="75" y="362" width="35" height="25" rx="1" fill="#000" transform="rotate(-8 92 374)" />
          <line x1="79" y1="368" x2="103" y2="365" stroke="#fff" strokeWidth="0.8" transform="rotate(-8 92 374)" />
          <line x1="79" y1="374" x2="100" y2="371" stroke="#fff" strokeWidth="0.8" transform="rotate(-8 92 374)" />

          <rect x="310" y="365" width="30" height="22" rx="1" fill="#000" transform="rotate(5 325 376)" />
          <line x1="314" y1="370" x2="335" y2="372" stroke="#fff" strokeWidth="0.8" transform="rotate(5 325 376)" />
          <line x1="314" y1="376" x2="330" y2="377" stroke="#fff" strokeWidth="0.8" transform="rotate(5 325 376)" />

          {/* "ZZZ" sleep indicator */}
          <text x="250" y="210" fontFamily="monospace" fontSize="16" fontWeight="bold" fill="#000" opacity="0.8">Z</text>
          <text x="260" y="195" fontFamily="monospace" fontSize="13" fontWeight="bold" fill="#000" opacity="0.6">Z</text>
          <text x="268" y="183" fontFamily="monospace" fontSize="10" fontWeight="bold" fill="#000" opacity="0.4">Z</text>

          {/* Clock on wall */}
          <circle cx="340" cy="120" r="25" fill="none" stroke="#000" strokeWidth="3" />
          <line x1="340" y1="120" x2="340" y2="102" stroke="#000" strokeWidth="2" />
          <line x1="340" y1="120" x2="355" y2="125" stroke="#000" strokeWidth="1.5" />
          {/* Clock tick marks */}
          <line x1="340" y1="97" x2="340" y2="100" stroke="#000" strokeWidth="2" />
          <line x1="340" y1="140" x2="340" y2="143" stroke="#000" strokeWidth="2" />
          <line x1="317" y1="120" x2="320" y2="120" stroke="#000" strokeWidth="2" />
          <line x1="360" y1="120" x2="363" y2="120" stroke="#000" strokeWidth="2" />

          {/* Wall poster - "加油" motivational poster */}
          <rect x="60" y="100" width="50" height="65" rx="2" fill="#000" />
          <rect x="64" y="104" width="42" height="57" rx="1" fill="#fff" />
          <text x="85" y="140" fontFamily="sans-serif" fontSize="18" fontWeight="bold" fill="#000" textAnchor="middle">加油</text>

          {/* Energy drink can on desk */}
          <rect x="255" y="345" width="14" height="22" rx="3" fill="#000" />
          <rect x="257" y="349" width="10" height="6" rx="1" fill="#fff" />

          {/* Backpack on floor */}
          <path d="M350 480 Q350 440 370 430 Q390 440 390 480 Z" fill="#000" />
          <rect x="355" y="435" width="30" height="8" rx="2" fill="#000" />
          <line x1="365" y1="445" x2="365" y2="475" stroke="#fff" strokeWidth="1" />
          <line x1="375" y1="445" x2="375" y2="475" stroke="#fff" strokeWidth="1" />

          {/* Scattered pens on floor */}
          <line x1="50" y1="500" x2="90" y2="495" stroke="#000" strokeWidth="2" strokeLinecap="round" />
          <line x1="55" y1="510" x2="85" y2="515" stroke="#000" strokeWidth="2" strokeLinecap="round" />

          {/* Crumpled paper on floor */}
          <circle cx="310" cy="500" r="8" fill="none" stroke="#000" strokeWidth="1.5" />
          <circle cx="120" cy="505" r="6" fill="none" stroke="#000" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Header Badge */}
      <div className="text-center pt-2 relative z-10">
        <span className="inline-block bg-black text-white text-[9px] font-mono uppercase tracking-widest px-3 py-1 mb-1 font-black">★ 2026 UNIVERSITY STRESS TEST ★</span>
        <p className="text-[10px] font-mono tracking-widest text-neutral-500 font-bold uppercase">Mental Resilience Simulator</p>
      </div>

      {/* Hero Title - Manga Panel Style */}
      <div className="text-center my-4 relative py-4 z-10">
        <div className="absolute inset-x-0 top-0 bottom-0 bg-white -rotate-1 -z-10 manga-panel-active"></div>
        <div className="absolute inset-0 hatching pointer-events-none z-10"></div>
        <h1 className="font-display font-black tracking-tight text-black flex flex-col gap-1 transform rotate-1 relative z-20">
          <span className="text-[10px] inline-block font-mono bg-black text-yellow-400 px-2.5 py-0.5 mx-auto max-w-max mb-1 uppercase tracking-wider font-extrabold shadow-[2px_2px_0px_rgba(0,0,0,1)]">极限心理防线自救</span>
          <span className="text-4xl sm:text-5xl tracking-tighter uppercase leading-none">脆皮大学生</span>
          <span className="text-red-600 font-display text-4xl sm:text-5xl block font-black mt-1 tracking-tight">《逆风指引》</span>
        </h1>
      </div>

      {/* Rules Box - Manga Panel */}
      <div className="manga-panel p-3.5 bg-white space-y-2 relative z-10">
        <div className="flex items-center gap-1.5 text-red-600 font-black border-b-[2px] border-black pb-1 leading-none font-display text-xs tracking-wider">
          <span>⚠</span>
          <span>CORE METRICS / 核心规则</span>
        </div>
        <ul className="text-neutral-900 font-mono space-y-1.5 list-none pl-0 text-[10px]">
          <li className="flex items-start gap-1.5 leading-relaxed"><span className="text-red-600 font-bold text-xs">■</span><span><strong>脑压负荷：</strong>点错暴涨，满100%须5秒内排解</span></li>
          <li className="flex items-start gap-1.5 leading-relaxed"><span className="text-red-600 font-bold text-xs">■</span><span><strong>摸鱼减压：</strong>强力降温，代价扣减15秒时限</span></li>
          <li className="flex items-start gap-1.5 leading-relaxed"><span className="text-red-600 font-bold text-xs">■</span><span><strong>突袭签到：</strong>导员降临，极速响应掩护避让</span></li>
        </ul>
      </div>

      {/* Start Button - Manga Style */}
      <div className="space-y-2.5 pt-3 border-t border-dashed border-zinc-300 relative z-10 mt-4">
        <motion.button
          id="btn-play-start"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          className="w-full bg-black hover:bg-neutral-900 text-white font-display font-black py-4 px-4 text-xs tracking-widest manga-btn cursor-pointer flex items-center justify-center gap-2 group"
          style={{boxShadow:'6px 6px 0px 0px #ef4444'}}
        >
          <span>抽取"脆皮天赋"进入测验</span>
          <span className="group-hover:translate-x-1 transition-transform text-emerald-400">→</span>
        </motion.button>
      </div>

    </div>
  );
}
