"use client";

import { useState } from "react";
import type { Datum, Point } from "@/lib/analysis-types";

const GRID = "rgba(148,163,184,0.15)";
const AXIS = "#94a3b8";

export function DonutChart({ data, centerLabel }: { data: Datum[]; centerLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const R = 70, STROKE = 28, C = 2 * Math.PI * R;
  let offset = 0;
  const fallback = ["#10b981", "#f59e0b", "#f43f5e", "#22d3ee", "#a855f7", "#3b82f6"];
  return (
    <div className="flex flex-col items-center gap-5">
      <svg viewBox="0 0 200 200" className="h-52 w-52" role="img" aria-label="Distribution chart">
        <g transform="rotate(-90 100 100)">
          {total === 0 && <circle cx="100" cy="100" r={R} fill="none" stroke={GRID} strokeWidth={STROKE} />}
          {data.map((d, i) => {
            const len = total ? (d.value / total) * C : 0;
            const el = (
              <circle key={d.label} cx="100" cy="100" r={R} fill="none" stroke={d.color ?? fallback[i % fallback.length]}
                strokeWidth={STROKE} strokeDasharray={`${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`} strokeDashoffset={-offset}>
                <title>{`${d.label}: ${d.value}`}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="100" y="100" textAnchor="middle" className="fill-white font-display text-3xl font-semibold">{total}</text>
        {centerLabel && <text x="100" y="120" textAnchor="middle" className="fill-slate-400 font-mono text-[10px]">{centerLabel}</text>}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d, i) => (
          <span key={d.label} className="flex items-center gap-1.5 font-mono text-[11px] text-white/70">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color ?? fallback[i % fallback.length] }} />
            {d.label} ({d.value})
          </span>
        ))}
      </div>
    </div>
  );
}

export function LineChart({ points, color = "#a855f7" }: { points: Point[]; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 260, L = 44, R = 16, T = 16, B = 32;
  const vals = points.map((p) => p.value);
  const lo = Math.floor((Math.min(...vals) - 50) / 100) * 100;
  const hi = Math.ceil((Math.max(...vals) + 50) / 100) * 100;
  const x = (i: number) => L + (i / Math.max(points.length - 1, 1)) * (W - L - R);
  const y = (v: number) => T + (1 - (v - lo) / Math.max(hi - lo, 1)) * (H - T - B);
  const ticks = Array.from({ length: 5 }, (_, i) => Math.round(lo + ((hi - lo) * i) / 4));
  const step = Math.max(1, Math.ceil(points.length / 7));
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Rating progression chart" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={GRID} strokeDasharray="3 3" />
            <text x={L - 6} y={y(t) + 3} textAnchor="end" fill={AXIS} className="font-mono text-[10px]">{t}</text>
          </g>
        ))}
        {points.map((p, i) => i % step === 0 && (
          <text key={i} x={x(i)} y={H - 10} textAnchor="middle" fill={AXIS} className="font-mono text-[9px]">{p.label}</text>
        ))}
        <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r={hover === i ? 6 : points.length > 60 ? 2.5 : 4} fill={color}
            onMouseEnter={() => setHover(i)} />
        ))}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute right-2 top-0 rounded-lg border border-white/10 bg-[#0A0F24] px-3 py-1.5 font-mono text-[11px] text-white">
          {points[hover].label}: <span style={{ color }}>{points[hover].value}</span>
        </div>
      )}
    </div>
  );
}

export function BarChart({ data, color = "#3b82f6" }: { data: Datum[]; color?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 640, H = 240, L = 36, B = 44, T = 12;
  const slot = (W - L - 8) / data.length;
  const bw = Math.min(slot * 0.7, 80);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Bar chart">
      {ticks.map((t) => {
        const yy = T + (1 - t / max) * (H - T - B);
        return (
          <g key={t}>
            <line x1={L} x2={W - 8} y1={yy} y2={yy} stroke={GRID} strokeDasharray="3 3" />
            <text x={L - 6} y={yy + 3} textAnchor="end" fill={AXIS} className="font-mono text-[10px]">{t}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.value / max) * (H - T - B);
        const cx = L + slot * i + slot / 2;
        return (
          <g key={d.label}>
            <rect x={cx - bw / 2} y={H - B - h} width={bw} height={h} rx="3" fill={d.color ?? color}><title>{`${d.label}: ${d.value}`}</title></rect>
            <text x={cx} y={H - B + 14} textAnchor="middle" fill={AXIS} className="font-mono text-[9px]">
              {d.label.length > 12 ? `${d.label.slice(0, 11)}…` : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function Heatmap({ days }: { days: { date: string; count: number; level: number }[] }) {
  const shades = ["rgba(255,255,255,0.06)", "#0e4f43", "#1b8a73", "#35c4a2", "#64ffda"];
  const first = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
  const cells: ({ date: string; count: number; level: number } | null)[] = [...Array(first).fill(null), ...days];
  const weeks = Math.ceil(cells.length / 7), size = 11, gap = 3;
  return (
    <div className="overflow-x-auto">
      <svg width={weeks * (size + gap)} height={7 * (size + gap)} role="img" aria-label="Contribution heatmap">
        {cells.map((c, i) => c && (
          <rect key={c.date} x={Math.floor(i / 7) * (size + gap)} y={(i % 7) * (size + gap)} width={size} height={size} rx="2" fill={shades[c.level] ?? shades[0]}>
            <title>{`${c.count} contributions on ${c.date}`}</title>
          </rect>
        ))}
      </svg>
    </div>
  );
}
