"use client";

import * as React from "react";
import Link from "next/link";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { TrendDirection, WaterQuality } from "@/types";
import { cn, compactNumber } from "@/lib/utils";
import { gradeForQuality, gradeForScore } from "@/lib/ai/scoring";
import { TREND_META } from "@/lib/ai/trend";
import { Badge } from "@/components/ui/badge";

/* -------------------------------- Logo -------------------------------- */

export function Logo({
  className,
  showWordmark = true,
  href = "/",
}: {
  className?: string;
  showWordmark?: boolean;
  href?: string | null;
}) {
  const mark = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-gradient-to-br from-aqua-400 via-aqua-500 to-flux-500 shadow-[0_4px_16px_-4px_oklch(0.7_0.14_192/0.6)]">
        <svg viewBox="0 0 24 24" className="size-5 text-ink-950" aria-hidden>
          <path
            d="M12 2.5c0 0-6.5 7.2-6.5 11.4A6.5 6.5 0 0 0 12 20.5a6.5 6.5 0 0 0 6.5-6.6C18.5 9.7 12 2.5 12 2.5Z"
            fill="currentColor"
            opacity="0.92"
          />
          <path
            d="M7.6 15.4c1.5.9 2.6-.7 4.4-.7s2.9 1.6 4.4.7"
            fill="none"
            stroke="oklch(0.97 0.02 195)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink-50">
          AquaVision
          <span className="ml-1 text-aqua-300">AI</span>
        </span>
      )}
    </span>
  );

  if (!href) return mark;

  return (
    <Link href={href} className="rounded-xl" aria-label="AquaVision AI — home">
      {mark}
    </Link>
  );
}

/* ----------------------------- Reveal ------------------------------ */

/**
 * Scroll-triggered entrance. One shared component keeps the motion vocabulary
 * consistent across the marketing site instead of ad-hoc variants per section.
 */
export function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
  once = true,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: "-12% 0px -8% 0px" });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------- Animated counter ------------------------- */

export function AnimatedCounter({
  value,
  duration = 1.6,
  suffix = "",
  prefix = "",
  compact = false,
  decimals = 0,
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  compact?: boolean;
  decimals?: number;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const [display, setDisplay] = React.useState("0");

  const formatted = useTransform(spring, (v) =>
    compact
      ? compactNumber(v)
      : v.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }),
  );

  React.useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, value, motionValue]);

  React.useEffect(
    () => formatted.on("change", (v) => setDisplay(v)),
    [formatted],
  );

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}

/* ---------------------------- Grade badge ---------------------------- */

export function QualityBadge({
  quality,
  score,
  size = "md",
  className,
}: {
  quality: WaterQuality;
  score?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const grade = gradeForQuality(quality);
  const variant = quality.toLowerCase() as
    | "excellent"
    | "good"
    | "moderate"
    | "poor"
    | "critical";

  return (
    <Badge variant={variant} size={size} className={className}>
      <span
        className="size-1.5 rounded-full"
        style={{ background: grade.hex }}
        aria-hidden
      />
      {quality}
      {typeof score === "number" && (
        <span className="opacity-60">· {score}</span>
      )}
    </Badge>
  );
}

export function ScoreChip({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const grade = gradeForScore(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[12px] font-semibold tabular-nums",
        className,
      )}
      style={{
        color: grade.hex,
        borderColor: `${grade.hex}44`,
        background: `${grade.hex}16`,
      }}
    >
      {score}
      <span className="text-[10px] font-normal opacity-70">/100</span>
    </span>
  );
}

/* ---------------------------- Trend pill ---------------------------- */

export function TrendPill({
  direction,
  delta,
  className,
  size = "md",
}: {
  direction: TrendDirection;
  delta?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const meta = TREND_META[direction];
  const Icon =
    meta.arrow === "up" ? ArrowUpRight : meta.arrow === "down" ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/8 font-medium",
        meta.bg,
        meta.text,
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden />
      {meta.label}
      {typeof delta === "number" && delta !== 0 && (
        <span className="tabular-nums opacity-75">
          {delta > 0 ? "+" : ""}
          {delta}
        </span>
      )}
    </span>
  );
}

/* ----------------------------- Stat tile ----------------------------- */

export function StatTile({
  label,
  value,
  hint,
  icon,
  accent = "brand",
  className,
  delay = 0,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "brand" | "flux" | "neutral";
  className?: string;
  delay?: number;
}) {
  const accentRing = {
    brand: "from-aqua-400/18",
    flux: "from-flux-400/18",
    neutral: "from-white/10",
  }[accent];

  return (
    <Reveal delay={delay} className={className}>
      <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.035] p-5 backdrop-blur-xl transition-colors duration-300 hover:border-white/14">
        <div
          className={cn(
            "pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-60",
            accentRing,
          )}
          aria-hidden
        />
        <div className="relative flex items-start justify-between gap-3">
          <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-500">
            {label}
          </p>
          {icon && (
            <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/5 text-ink-300 [&_svg]:size-4">
              {icon}
            </span>
          )}
        </div>
        <p className="relative mt-3 text-[28px] font-semibold tracking-[-0.03em] text-ink-50">
          {value}
        </p>
        {hint && (
          <p className="relative mt-1.5 text-[12.5px] leading-snug text-ink-400">
            {hint}
          </p>
        )}
      </div>
    </Reveal>
  );
}

/* --------------------------- Section heading --------------------------- */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11.5px] font-medium uppercase tracking-[0.14em] text-aqua-200 backdrop-blur-xl">
            <span className="size-1.5 rounded-full bg-aqua-400" aria-hidden />
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2
          className={cn(
            "text-balance text-[clamp(1.75rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-ink-50",
            align === "center" && "mx-auto max-w-3xl",
          )}
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.12}>
          <p
            className={cn(
              "text-pretty text-[15px] leading-relaxed text-ink-400 sm:text-base",
              align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl",
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/* ----------------------------- Empty state ----------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <span className="grid size-12 place-items-center rounded-2xl border border-white/8 bg-white/5 text-ink-400 [&_svg]:size-5">
          {icon}
        </span>
      )}
      <h3 className="text-[15px] font-medium text-ink-100">{title}</h3>
      {description && (
        <p className="max-w-sm text-[13.5px] leading-relaxed text-ink-500">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* --------------------------- Ambient backdrop --------------------------- */

/** Slow aurora gradients behind the marketing sections. Purely decorative. */
export function AmbientBackdrop({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <div
        className="absolute -left-[12%] top-[-18%] size-[46rem] rounded-full blur-[120px] animate-aurora"
        style={{
          background:
            "radial-gradient(circle, oklch(0.7 0.14 192 / 0.28) 0%, transparent 68%)",
          opacity: 0.85 * intensity,
        }}
      />
      <div
        className="absolute -right-[14%] top-[8%] size-[40rem] rounded-full blur-[120px] animate-aurora"
        style={{
          background:
            "radial-gradient(circle, oklch(0.63 0.19 272 / 0.26) 0%, transparent 68%)",
          animationDelay: "-7s",
          opacity: 0.8 * intensity,
        }}
      />
      <div
        className="absolute bottom-[-22%] left-[24%] size-[38rem] rounded-full blur-[130px] animate-aurora"
        style={{
          background:
            "radial-gradient(circle, oklch(0.61 0.13 195 / 0.2) 0%, transparent 70%)",
          animationDelay: "-13s",
          opacity: 0.7 * intensity,
        }}
      />
    </div>
  );
}
