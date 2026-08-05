"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Cpu, Gauge, MapPin, Sparkles } from "lucide-react";
import type { PollutionTag } from "@/types";
import { gradeForScore } from "@/lib/ai/scoring";
import { sampleWaterImage } from "@/lib/data/sample-image";
import { cn } from "@/lib/utils";
import { ScoreRing } from "@/components/shared/score-ring";
import { QualityBadge } from "@/components/shared/primitives";

/**
 * Hero product shot.
 *
 * A real screenshot would go stale the moment the UI changes, so this is the
 * live component vocabulary rendered with three canned analyses that cycle.
 * Everything shown — score ring, indicator bars, badges — is the same code the
 * actual report page uses.
 */

interface Scene {
  place: string;
  region: string;
  score: number;
  confidence: number;
  tags: PollutionTag[];
  objects: string[];
  indicators: { label: string; severity: number }[];
  explanation: string;
}

const SCENES: Scene[] = [
  {
    place: "Yamuna — Kalindi Kunj",
    region: "Delhi, India",
    score: 91,
    confidence: 93,
    tags: ["foam", "sewage", "industrial_discharge"],
    objects: ["Persistent white foam", "Organic sludge", "Discharge outfall"],
    indicators: [
      { label: "Surface foam", severity: 94 },
      { label: "Sewage indicators", severity: 88 },
      { label: "Water clarity", severity: 82 },
      { label: "Industrial discharge", severity: 71 },
    ],
    explanation:
      "Dense surfactant foam covers the majority of the frame and persists well away from any weir, ruling out simple aeration.",
  },
  {
    place: "Lake Erie — Maumee Bay",
    region: "Ohio, United States",
    score: 64,
    confidence: 88,
    tags: ["algae_bloom", "eutrophication"],
    objects: ["Green algal mats", "Dense surface vegetation"],
    indicators: [
      { label: "Algae bloom", severity: 76 },
      { label: "Eutrophication", severity: 63 },
      { label: "Water clarity", severity: 54 },
      { label: "Sediment load", severity: 31 },
    ],
    explanation:
      "Green channel leads red and blue by 19% across a contiguous surface region, consistent with cyanobacteria biomass rather than reflected foliage.",
  },
  {
    place: "Big Almaty Lake",
    region: "Almaty, Kazakhstan",
    score: 11,
    confidence: 95,
    tags: [],
    objects: ["Clear open water", "Visible substrate"],
    indicators: [
      { label: "Water clarity", severity: 12 },
      { label: "Floating garbage", severity: 4 },
      { label: "Surface foam", severity: 2 },
    ],
    explanation:
      "High luminance contrast with a neutral colour cast and a visible bottom gradient in the shallows. No anthropogenic pollution signature measurable.",
  },
];

export function AnalysisPreview() {
  const [index, setIndex] = React.useState(0);
  const scene = SCENES[index];
  const grade = gradeForScore(scene.score);

  React.useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SCENES.length), 6200);
    return () => clearInterval(timer);
  }, []);

  const image = React.useMemo(
    () => sampleWaterImage(`hero-${scene.place}`, scene.score, scene.tags),
    [scene.place, scene.score, scene.tags],
  );

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-ink-900/70 shadow-[0_40px_120px_-40px_oklch(0.145_0.014_258)] backdrop-blur-2xl">
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-white/12" />
          <span className="size-2.5 rounded-full bg-white/12" />
          <span className="size-2.5 rounded-full bg-white/12" />
        </div>
        <div className="mx-auto flex items-center gap-2 rounded-lg border border-white/8 bg-white/4 px-3 py-1 text-[11.5px] text-ink-500">
          <Cpu className="size-3 text-aqua-400" aria-hidden />
          aquavision.ai/reports/new
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-aqua-400/25 bg-aqua-400/10 px-2 py-0.5 text-[10.5px] font-medium text-aqua-200 sm:inline-flex">
          <span className="size-1.5 animate-pulse rounded-full bg-aqua-400" aria-hidden />
          Analysing
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
        {/* Image panel */}
        <div className="relative aspect-[4/3] overflow-hidden border-b border-white/8 lg:aspect-auto lg:border-b-0 lg:border-r">
          <AnimatePresence mode="wait">
            <motion.img
              key={scene.place}
              src={image}
              alt={`Sample water surface analysis at ${scene.place}`}
              className="absolute inset-0 size-full object-cover"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </AnimatePresence>

          {/* Scanning laser */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div
              className="absolute inset-x-0 h-16 animate-scan"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, oklch(0.82 0.11 193 / 0.22), transparent)",
                boxShadow: "0 0 40px 8px oklch(0.82 0.11 193 / 0.18)",
              }}
            />
          </div>

          {/* Detection boxes */}
          <AnimatePresence>
            {scene.objects.slice(0, 3).map((object, i) => (
              <motion.div
                key={`${scene.place}-${object}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 + i * 0.22, duration: 0.4 }}
                className="absolute rounded-lg border-2"
                style={{
                  borderColor: grade.hex,
                  left: `${12 + i * 26}%`,
                  top: `${34 + (i % 2) * 24}%`,
                  width: `${20 + i * 4}%`,
                  height: `${18 + (i % 2) * 6}%`,
                  boxShadow: `0 0 0 1px oklch(0.145 0.014 258 / 0.5), 0 0 24px -4px ${grade.hex}`,
                }}
              >
                <span
                  className="absolute -top-[1.35rem] left-0 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-ink-950"
                  style={{ background: grade.hex }}
                >
                  {object}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-4 pt-12">
            <div className="flex items-center gap-2 text-[13px]">
              <MapPin className="size-3.5 shrink-0 text-aqua-300" aria-hidden />
              <span className="truncate font-medium text-ink-100">
                {scene.place}
              </span>
              <span className="hidden shrink-0 text-ink-500 sm:inline">
                · {scene.region}
              </span>
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <div className="flex items-center gap-5">
            <ScoreRing score={scene.score} size={112} thickness={9} delay={0.2} />
            <div className="min-w-0 flex-1">
              <QualityBadge quality={grade.quality} />
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-400">
                {grade.blurb}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11.5px] text-ink-500">
                <Gauge className="size-3.5" aria-hidden />
                Confidence
                <span className="font-semibold text-ink-200">
                  {scene.confidence}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
              Indicator matrix
            </p>
            {scene.indicators.map((indicator, i) => {
              const bar = gradeForScore(indicator.severity);
              return (
                <div key={indicator.label} className="flex items-center gap-3">
                  <span className="w-[7.5rem] shrink-0 truncate text-[12px] text-ink-300">
                    {indicator.label}
                  </span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/8">
                    <motion.div
                      key={`${scene.place}-${indicator.label}`}
                      className="h-full rounded-full"
                      style={{ background: bar.hex }}
                      initial={{ width: 0 }}
                      animate={{ width: `${indicator.severity}%` }}
                      transition={{
                        duration: 0.8,
                        delay: 0.3 + i * 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[11.5px] font-medium tabular-nums text-ink-400">
                    {indicator.severity}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-aqua-300">
              <Sparkles className="size-3" aria-hidden />
              AI explanation
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={scene.explanation}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
                className="mt-2 text-[12.5px] leading-relaxed text-ink-300"
              >
                {scene.explanation}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-4">
            <div className="flex items-center gap-1.5 text-[11.5px] text-ink-500">
              <CheckCircle2 className="size-3.5 text-grade-excellent" aria-hidden />
              Stored, mapped &amp; trended
            </div>
            <div className="flex gap-1.5" role="tablist" aria-label="Preview scenes">
              {SCENES.map((s, i) => (
                <button
                  key={s.place}
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show ${s.place}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-6 bg-aqua-400" : "w-1.5 bg-white/18 hover:bg-white/30",
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
