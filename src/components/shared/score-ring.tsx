"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { gradeForScore } from "@/lib/ai/scoring";

/**
 * Animated circular pollution-score gauge.
 *
 * The arc is a stroke-dashoffset animation on an SVG circle rather than a
 * conic-gradient, so it stays crisp at any size, respects
 * prefers-reduced-motion through Framer's spring, and prints correctly in the
 * PDF export.
 */
export function ScoreRing({
  score,
  size = 168,
  thickness = 12,
  showLabel = true,
  className,
  delay = 0.1,
}: {
  score: number;
  size?: number;
  thickness?: number;
  showLabel?: boolean;
  className?: string;
  delay?: number;
}) {
  const grade = gradeForScore(score);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useMotionValue(0);
  const spring = useSpring(progress, { stiffness: 60, damping: 18, mass: 0.9 });
  const dashOffset = useTransform(
    spring,
    (v) => circumference - (v / 100) * circumference,
  );
  const displayed = useTransform(spring, (v) => Math.round(v));
  const [readout, setReadout] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => progress.set(score), delay * 1000);
    return () => clearTimeout(timer);
  }, [score, progress, delay]);

  React.useEffect(
    () => displayed.on("change", (v) => setReadout(v)),
    [displayed],
  );

  const gradientId = React.useId();

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Pollution score ${score} out of 100 — ${grade.quality}`}
    >
      {/* Ambient halo, tinted by severity */}
      <div
        className="absolute inset-2 rounded-full opacity-25 blur-2xl"
        style={{ background: grade.hex }}
        aria-hidden
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={grade.hex} stopOpacity="0.75" />
            <stop offset="100%" stopColor={grade.hex} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-white/7"
          strokeWidth={thickness}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: dashOffset }}
        />
      </svg>

      {showLabel && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center">
            <div className="flex items-start font-semibold tabular-nums leading-none">
              <span
                style={{ fontSize: size * 0.3, color: grade.hex }}
                className="tracking-[-0.04em]"
              >
                {readout}
              </span>
              <span
                className="mt-1 ml-0.5 text-ink-500"
                style={{ fontSize: size * 0.11 }}
              >
                /100
              </span>
            </div>
            <span
              className="mt-1.5 font-medium uppercase tracking-[0.14em] text-ink-400"
              style={{ fontSize: Math.max(9, size * 0.062) }}
            >
              {grade.quality}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Compact horizontal severity bar for lists and tables. */
export function ScoreBar({
  score,
  className,
  showValue = true,
}: {
  score: number;
  className?: string;
  showValue?: boolean;
}) {
  const grade = gradeForScore(score);

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/8"
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Pollution score ${score} of 100`}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: grade.hex }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      {showValue && (
        <span
          className="w-8 shrink-0 text-right text-[13px] font-semibold tabular-nums"
          style={{ color: grade.hex }}
        >
          {score}
        </span>
      )}
    </div>
  );
}
