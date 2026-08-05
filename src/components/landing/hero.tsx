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
 * The hero is the surface of the water seen from below: light falls in from
 * the top of the viewport, the wordmark sits in the brightest part of it, and
 * everything else descends into the dark.
 */
export function Hero({ stats }: { stats: PlatformStats }) {
  const t = useT();
  const year = new Date().getFullYear();

  return (
    <section className="relative isolate overflow-hidden">
      <AbyssBackdrop depth={1} particles />

      {/* --- Full-height opening frame --- */}
      <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col px-5 pt-24 sm:pt-28">
        <EditionMark
          left={`${t.hero.kicker} · ${t.common.edition}`}
          right={String(year)}
          className="pt-4"
        />

        <div className="flex flex-1 flex-col items-center justify-center pb-14 text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] font-medium uppercase tracking-[0.42em] text-lume-200/80 text-lume-soft"
          >
            {t.hero.tagline}
          </motion.p>

          {/* Wordmark. The second line rides up under the first, the way the
              reference stacks its two words. */}
          <h1 className="mt-5 flex flex-col items-center leading-[0.82]">
            <motion.span
              initial={{ opacity: 0, y: 34, filter: "blur(14px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="text-lume text-[clamp(4rem,17vw,11.5rem)] font-semibold tracking-[-0.055em]"
            >
              {t.hero.titleTop}
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 26, filter: "blur(14px)" }}
              animate={{ opacity: 0.92, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="-mt-[0.17em] text-[clamp(2.6rem,10vw,6.5rem)] font-medium tracking-[-0.05em] text-ink-100/85 text-lume-soft"
            >
              {t.hero.titleMain}
            </motion.span>
          </h1>

          <Reveal delay={0.5} className="mt-10">
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.3em] text-ink-200">
                AquaVision AI
              </p>
              <p className="eyebrow-mark">{t.common.allRightsReserved}</p>
            </div>
          </Reveal>

          <Reveal delay={0.62} className="mt-9">
            <a
              href="#lead"
              aria-label={t.common.scrollDown}
              className="group grid size-11 place-items-center rounded-full border border-lume-300/30 bg-white/[0.04] text-lume-200 backdrop-blur-xl transition-colors hover:border-lume-300/60 hover:bg-lume-400/12"
            >
              <ArrowDown
                className="size-4 transition-transform duration-300 group-hover:translate-y-0.5"
                aria-hidden
              />
            </a>
          </Reveal>
        </div>
      </div>

      {/* --- The actual pitch, below the fold --- */}
      <div id="lead" className="relative mx-auto max-w-6xl px-5 pb-20 sm:pb-28">
        <FadeRule />

        <div className="mt-16 flex flex-col items-center text-center">
          <Reveal>
            <Link
              href="/#features"
              className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] py-1.5 pl-1.5 pr-3.5 text-[12.5px] backdrop-blur-xl transition-colors hover:border-lume-400/40 hover:bg-white/[0.07]"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-lume-300 to-aqua-500 px-2 py-0.5 text-[11px] font-semibold text-abyss-1000">
                <Sparkles className="size-3" aria-hidden />
                {t.hero.badge}
              </span>
              <span className="text-ink-300">{t.hero.badgeText}</span>
              <ArrowRight
                className="size-3.5 text-ink-500 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </Reveal>

          <Reveal delay={0.08}>
            <p className="mt-8 max-w-2xl text-pretty text-[16.5px] leading-relaxed text-ink-400 sm:text-[17.5px]">
              {t.hero.subtitle}{" "}
              <span className="text-ink-100">{t.hero.subtitleStrong}</span>
            </p>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
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

          <Reveal delay={0.24}>
            <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4 sm:gap-x-14">
              {[
                { label: t.hero.stats.assessments, value: stats.reports },
                { label: t.hero.stats.waterBodies, value: stats.locations },
                { label: t.hero.stats.contributors, value: stats.contributors },
                { label: t.hero.stats.countries, value: stats.countries },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center">
                  <dd className="text-[26px] font-semibold tracking-[-0.03em] text-ink-50 sm:text-3xl">
                    <AnimatedCounter value={stat.value} />
                  </dd>
                  <dt className="mt-1.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-ink-500">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* Product preview, lit from behind like something surfacing */}
        <motion.div
          initial={{ opacity: 0, y: 48, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative mt-16 sm:mt-20"
        >
          <div
            className="absolute -inset-x-10 -top-10 bottom-0 rounded-[3rem] bg-gradient-to-b from-lume-400/18 via-aqua-600/10 to-transparent blur-3xl"
            aria-hidden
          />
          <AnalysisPreview />
        </motion.div>

        <Reveal delay={0.2} className="mt-10">
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
