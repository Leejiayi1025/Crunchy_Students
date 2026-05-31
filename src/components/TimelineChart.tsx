/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useId } from 'react';
import { StressRecord } from '../types';

interface TimelineChartProps {
  timeline: StressRecord[];
  maxStressThreshold: number;
}

export function TimelineChart({ timeline, maxStressThreshold }: TimelineChartProps) {
  const chartId = useId();

  if (timeline.length === 0) {
    return (
      <div className="flex items-center justify-center h-36 bg-stone-100 border-2 border-black p-4">
        <p className="text-xs text-neutral-500 font-mono text-center">暂无逆风压力轨迹波动数据</p>
      </div>
    );
  }

  const width = 500;
  const height = 180;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxTime = Math.max(...timeline.map((d) => d.timeElapsed), 1);
  const minTime = 0;
  const maxStress = 100;
  const minStress = 0;

  const getX = (t: number) => paddingLeft + ((t - minTime) / (maxTime - minTime)) * chartWidth;
  const getY = (s: number) => paddingTop + chartHeight - ((s - minStress) / (maxStress - minStress)) * chartHeight;

  const points = timeline.map((record) => ({
    x: getX(record.timeElapsed),
    y: getY(record.stress),
    ...record,
  }));

  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');
    areaD = `${pathD} L ${points[points.length - 1].x} ${getY(0)} L ${points[0].x} ${getY(0)} Z`;
  }

  const gridYValues = [0, 20, 50, 80, 100];

  return (
    <div className="w-full bg-white border-2 border-black p-4 font-mono select-none shadow-[2px_2px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-black flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          逆风压力波动轨迹 (Struggle Curve)
        </span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <rect x={paddingLeft} y={getY(100)} width={chartWidth} height={getY(70) - getY(100)} fill="#dc2626" fillOpacity="0.08" />
          <rect x={paddingLeft} y={getY(70)} width={chartWidth} height={getY(40) - getY(70)} fill="#ea580c" fillOpacity="0.05" />
          <rect x={paddingLeft} y={getY(40)} width={chartWidth} height={getY(20) - getY(40)} fill="#eab308" fillOpacity="0.03" />
          <rect x={paddingLeft} y={getY(20)} width={chartWidth} height={getY(0) - getY(20)} fill="#22c55e" fillOpacity="0.02" />

          {gridYValues.map((val) => {
            const y = getY(val);
            let label = `${val}%`;
            let color = 'stroke-neutral-300';
            let textColor = 'fill-neutral-500';
            if (val === 100) { textColor = 'fill-red-500 font-bold'; color = 'stroke-red-200'; }
            else if (val === 80) { textColor = 'fill-orange-500'; color = 'stroke-orange-200'; }
            return (
              <g key={val}>
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} className={color} strokeDasharray={val === 0 || val === 100 ? '0' : '2'} strokeWidth={1} />
                <text x={paddingLeft - 8} y={y + 3} textAnchor="end" className={`text-[8px] ${textColor} font-mono`}>{label}</text>
              </g>
            );
          })}

          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const t = Math.round(minTime + pct * (maxTime - minTime));
            const x = getX(t);
            return (
              <g key={idx}>
                <line x1={x} y1={paddingTop} x2={x} y2={getY(0)} className="stroke-neutral-200" strokeDasharray="2" strokeWidth={1} />
                <text x={x} y={getY(0) + 14} textAnchor="middle" className="text-[8px] fill-neutral-400 font-mono">{t}s</text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill={`url(#area-grad-${chartId})`} />}
          {pathD && <path d={pathD} fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

          <defs>
            <linearGradient id={`area-grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {points.length > 0 && (
            <>
              {(() => {
                const peak = timeline.reduce((max, r) => (r.stress > max.stress ? r : max), timeline[0]);
                return (
                  <g>
                    <circle cx={getX(peak.timeElapsed)} cy={getY(peak.stress)} r="4" fill="#ef4444" stroke="#000" strokeWidth="1.5" />
                    <text x={getX(peak.timeElapsed)} y={getY(peak.stress) - 8} textAnchor="middle" className="text-[8px] fill-red-500 font-bold">峰值 {peak.stress}%</text>
                  </g>
                );
              })()}
              <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill="#000" />
            </>
          )}
        </svg>
      </div>

      <div className="grid grid-cols-4 gap-1 mt-4 pt-3 border-t border-stone-200 text-center text-[9px] text-neutral-500">
        <div className="flex flex-col border-r border-stone-200"><span>峰值高压</span><span className="text-black font-bold text-xs mt-0.5">{maxStressThreshold}%</span></div>
        <div className="flex flex-col border-r border-stone-200"><span>总耗时</span><span className="text-black font-bold text-xs mt-0.5">{maxTime}秒</span></div>
        <div className="flex flex-col border-r border-stone-200"><span>抗压等级</span><span className="text-emerald-600 font-bold text-xs mt-0.5">{maxStressThreshold > 80 ? '微弱抗压' : maxStressThreshold > 50 ? '凡人抗压' : '超级抗压'}</span></div>
        <div className="flex flex-col"><span>波动频率</span><span className="text-black font-bold text-xs mt-0.5">{timeline.length}次</span></div>
      </div>
    </div>
  );
}
