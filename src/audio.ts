/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * 机械键盘音效引擎 — "Thocky" 合成音效
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playThock(frequency = 120, volume = 0.4) {
  const ac = getCtx();
  const now = ac.currentTime;

  // 低频 "thock" 声
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(100, now + 0.08);

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, now);
  osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, now + 0.1);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.2);

  // 塑料碰撞 "clack" 噪声
  const bufferSize = Math.floor(ac.sampleRate * 0.05);
  const noiseBuffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;

  const noise = ac.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = ac.createGain();
  const noiseFilter = ac.createBiquadFilter();

  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(1500, now);
  noiseFilter.Q.setValueAtTime(1, now);

  noiseGain.gain.setValueAtTime(volume * 0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ac.destination);
  noise.start(now);
}

/** 正确点击音效 */
export function playCorrect() {
  playThock(160, 0.5);
}

/** 错误点击音效 */
export function playWrong() {
  const ac = getCtx();
  const now = ac.currentTime;
  playThock(80, 0.6);

  // 额外的低频嗡嗡声
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(60, now);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.3);
}

/** 按钮点击音效 */
export function playClick() {
  playThock(140, 0.3);
}

/** 在元素上创建粒子爆发效果 */
export function createParticles(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const angle = (i / 6) * Math.PI * 2;
    const dist = 15 + Math.random() * 10;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    particle.style.setProperty('--tx', `${tx}px`);
    particle.style.setProperty('--ty', `${ty}px`);
    particle.style.left = '50%';
    particle.style.top = '50%';

    element.appendChild(particle);
    setTimeout(() => particle.remove(), 300);
  }
}

/** 触发震动反馈 */
export function hapticFeedback(duration = 10) {
  if (navigator.vibrate) navigator.vibrate(duration);
}
