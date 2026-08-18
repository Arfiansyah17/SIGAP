"use client";

import { motion } from "motion/react";
import type { Tone } from "./StatusDot";

const STROKE: Record<Tone, string> = {
  safe: "var(--color-safe)",
  warn: "var(--color-warn)",
  high: "var(--color-danger)",
  idle: "var(--color-line)",
  busy: "var(--color-accent)",
};

const RADIUS = 78;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Three-quarter sweep, so the gap reads as a gauge rather than a pie. */
const SWEEP = 0.75;

/**
 * Gauge for the composite score.
 *
 * The arc is drawn with `stroke-dashoffset` over a fixed-length path, so the
 * sweep animates without recomputing geometry on every frame.
 */
export function ScoreDial({
  value,
  tone,
  label,
}: {
  value: number;
  tone: Tone;
  label: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const arc = CIRCUMFERENCE * SWEEP;

  return (
    <div className="relative grid size-[188px] place-items-center">
      <svg viewBox="0 0 188 188" className="absolute inset-0 -rotate-[225deg]" aria-hidden>
        <circle
          cx="94"
          cy="94"
          r={RADIUS}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
        />
        <motion.circle
          cx="94"
          cy="94"
          r={RADIUS}
          fill="none"
          stroke={STROKE[tone]}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
          initial={{ strokeDashoffset: arc }}
          animate={{ strokeDashoffset: arc * (1 - clamped / 100) }}
          transition={{ type: "spring", stiffness: 60, damping: 18 }}
        />
      </svg>

      <div className="relative flex flex-col items-center gap-1.5">
        <span
          className="tnum font-mono text-5xl leading-none tracking-tighter"
          style={{ color: STROKE[tone] }}
        >
          {clamped}
        </span>
        <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-fg-faint">
          {label}
        </span>
      </div>
    </div>
  );
}
