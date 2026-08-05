"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Play, Sparkles, Upload } from "lucide-react";
import type { PlatformStats } from "@/types";
import { compactNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { fmt } from "@/lib/i18n/format";
import { Button } from "@/components/ui/button";
import { AnimatedCounter, Reveal } from "@/components/shared/primitives";
import { AbyssBackdrop, EditionMark, FadeRule } from "@/components/shared/abyss";
import { AnalysisPreview } from "./analysis-preview";

/**
 * The hero is the surface of the water seen from below: light falls in
 * through a gap in the rock, and the wordmark sits in the brightest part of
 * it. Everything that makes the case — badge, promise, both calls to action
 * and the live counters — is inside the first screen; nothing is parked in
 * empty space waiting to be scrolled to.
 */
export function Hero({ stats }: { stats: PlatformStats }) {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <section className="relative isolate overflow-hidden">
      <AbyssBackdrop
        depth={1}
        particles
        photo="/photos/hero.jpg"
        photoPriority
        photoDim={0.42}
        photoFocus="center 34%"
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pb-8 pt-20 sm:pb-12 sm:pt-28">
        <EditionMark
          left={`${t.hero.kicker} · ${t.common.edition}`}
          right={String(year)}
          className="pt-2"
        />

        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-5 text-center sm:gap-7 sm:py-8">
          <Reveal>
            <Link
              href="/#features"
              className="group inline-flex max-w-full items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] py-1.5 pl-1.5 pr-3 text-[12px] backdrop-blur-xl transition-colors hover:border-lume-400/40 hover:bg-white/[0.09] sm:pr-3.5 sm:text-[12.5px]"
            >
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-lume-300 to-aqua-500 px-2 py-0.5 text-[11px] font-semibold text-abyss-1000">
                <Sparkles className="size-3" aria-hidden />
                {t.hero.badge}
              </span>
              {/* Truncated rather than wrapped: a two-line pill reads as a
                  broken button on a narrow screen. */}
              <span className="truncate text-ink-300">{t.hero.badgeText}</span>
              <ArrowRight
                className="size-3.5 shrink-0 text-ink-500 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Reveal>

          {/* Wordmark. The second line rides up under the first, the way the
              reference stacks its two words. */}
          <h1 className="flex flex-col items-center leading-[0.82]">
            <motion.span
              initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-lume text-[clamp(3rem,13.5vw,9.5rem)] font-semibold tracking-[-0.055em]"
            >
              {t.hero.titleTop}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 22, filter: "blur(14px)" }}
              animate={{ opacity: 0.92, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="-mt-[0.17em] text-[clamp(2rem,7.5vw,5.5rem)] font-medium tracking-[-0.05em] text-ink-100/85 text-lume-soft"
            >
              {t.hero.titleMain}
            </motion.span>
          </h1>

          <Reveal delay={0.34}>
            <p className="max-w-2xl text-pretty text-[14px] leading-[1.55] text-ink-300 sm:text-[17px] sm:leading-relaxed">
              {t.hero.subtitle}{" "}
              <span className="text-ink-100">{t.hero.subtitleStrong}</span>
            </p>
          </Reveal>

          <Reveal delay={0.42}>
            <div className="flex w-full flex-col items-center gap-2.5 sm:w-auto sm:flex-row sm:gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/upload">
                  <Upload aria-hidden />
                  {t.hero.ctaPrimary}
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
                  {t.hero.ctaSecondary}
                </Link>
              </Button>
            </div>
          </Reveal>

          <Reveal delay={0.5}>
            <p className="text-[12px] leading-snug text-ink-500 sm:text-[12.5px]">
              {t.hero.noAccount}
            </p>
          </Reveal>
        </div>

        {/* Live counters pinned to the bottom of the opening screen */}
        <Reveal delay={0.58}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3.5 backdrop-blur-xl sm:px-5 sm:py-4">
            <dl className="grid grid-cols-4 gap-x-2 gap-y-4 sm:gap-x-6">
              {[
                { label: t.hero.stats.assessments, value: stats.reports },
                { label: t.hero.stats.waterBodies, value: stats.locations },
                { label: t.hero.stats.contributors, value: stats.contributors },
                { label: t.hero.stats.countries, value: stats.countries },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <dd className="text-[19px] font-semibold tracking-[-0.03em] text-ink-50 sm:text-[28px]">
                    <AnimatedCounter value={stat.value} />
                  </dd>
                  <dt className="mt-1 text-center text-[8.5px] font-medium uppercase leading-tight tracking-[0.1em] text-ink-500 sm:text-[10px] sm:tracking-[0.18em]">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={0.66} className="mt-5 hidden justify-center sm:mt-6 sm:flex">
          <a
            href="#lead"
            aria-label={t.common.scrollDown}
            className="group grid size-10 place-items-center rounded-full border border-lume-300/30 bg-white/[0.05] text-lume-200 backdrop-blur-xl transition-colors hover:border-lume-300/60 hover:bg-lume-400/12"
          >
            <ArrowDown
              className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
              aria-hidden
            />
          </a>
        </Reveal>
      </div>

      {/* --- Product preview --- */}
      <div id="lead" className="relative mx-auto max-w-6xl px-5 pb-20 sm:pb-28">
        <FadeRule />

        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16"
        >
          <div
            className="absolute -inset-x-10 -top-10 bottom-0 rounded-[3rem] bg-gradient-to-b from-lume-400/18 via-aqua-600/10 to-transparent blur-3xl"
            aria-hidden
          />
          <AnalysisPreview />
        </motion.div>

        <Reveal delay={0.2} className="mt-8">
          <p className="text-center text-[12.5px] text-ink-500">
            {fmt(t.hero.ticker, {
              images: compactNumber(stats.analysedImages),
              sites: stats.locations,
              score: stats.averageScore,
            })}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
