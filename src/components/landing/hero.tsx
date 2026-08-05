"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, Upload } from "lucide-react";
import type { PlatformStats } from "@/types";
import { compactNumber } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AmbientBackdrop,
  AnimatedCounter,
  Reveal,
} from "@/components/shared/primitives";
import { AnalysisPreview } from "./analysis-preview";

export function Hero({ stats }: { stats: PlatformStats }) {
  return (
    <section className="relative isolate overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <AmbientBackdrop />

      {/* Faint grid, masked so it fades before the copy starts */}
      <div
        className="pointer-events-none absolute inset-0 grid-noise opacity-60 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <Link
              href="/#features"
              className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3.5 text-[12.5px] backdrop-blur-xl transition-colors hover:border-aqua-400/30 hover:bg-white/8"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-aqua-400 to-flux-500 px-2 py-0.5 text-[11px] font-semibold text-ink-950">
                <Sparkles className="size-3" aria-hidden />
                Vision AI
              </span>
              <span className="text-ink-300">
                Environmental scoring from a single photograph
              </span>
              <ArrowRight
                className="size-3.5 text-ink-500 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="mt-7 max-w-4xl text-balance text-[clamp(2.5rem,7vw,4.75rem)] font-semibold leading-[0.98] tracking-[-0.045em]">
              <span className="text-ink-50">Every water body,</span>
              <br />
              <span className="text-gradient">measured by AI.</span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 max-w-2xl text-pretty text-[16.5px] leading-relaxed text-ink-400 sm:text-[17.5px]">
              Photograph a river, lake or reservoir. AquaVision analyses the
              image with computer vision, scores its environmental condition
              from 0–100, explains exactly what it found, and tracks how the
              site changes over time.{" "}
              <span className="text-ink-200">
                No sensors. No hardware. Entirely digital.
              </span>
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/upload">
                  <Upload aria-hidden />
                  Analyse a photograph
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href="/map">
                  <Play aria-hidden />
                  Explore the live map
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 sm:gap-x-12">
              {[
                { label: "Assessments", value: stats.reports, suffix: "" },
                { label: "Water bodies", value: stats.locations, suffix: "" },
                { label: "Contributors", value: stats.contributors, suffix: "" },
                {
                  label: "Countries",
                  value: stats.countries,
                  suffix: "",
                },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <dd className="text-[26px] font-semibold tracking-[-0.03em] text-ink-50 sm:text-3xl">
                    <AnimatedCounter value={stat.value} />
                    {stat.suffix}
                  </dd>
                  <dt className="mt-1 text-[11.5px] font-medium uppercase tracking-[0.12em] text-ink-500">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* Product preview */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 sm:mt-20"
        >
          <div
            className="absolute -inset-x-8 -top-6 bottom-0 rounded-[2.5rem] bg-gradient-to-b from-aqua-400/12 to-flux-500/8 blur-3xl"
            aria-hidden
          />
          <AnalysisPreview />
        </motion.div>

        <Reveal delay={0.2} className="mt-10">
          <p className="text-center text-[12.5px] text-ink-500">
            Analysing{" "}
            <span className="font-medium text-ink-300">
              {compactNumber(stats.analysedImages)}
            </span>{" "}
            images across{" "}
            <span className="font-medium text-ink-300">{stats.locations}</span>{" "}
            monitored sites · average severity{" "}
            <span className="font-medium text-ink-300">
              {stats.averageScore}/100
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
