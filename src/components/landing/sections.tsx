"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Blocks,
  Brain,
  Camera,
  Clock,
  Download,
  Droplets,
  Eye,
  FileText,
  Globe2,
  Layers,
  Mail,
  MapPin,
  MessageSquare,
  Radar,
  Scale,
  ScanLine,
  Sparkles,
  TrendingDown,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import type { PlatformStats, WaterQuality } from "@/types";
import { GRADES } from "@/lib/ai/scoring";
import { cn, compactNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { fmt } from "@/lib/i18n/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/misc";
import { Field, Input, Textarea } from "@/components/ui/field";
import {
  AnimatedCounter,
  Logo,
  Reveal,
  SectionHeading,
} from "@/components/shared/primitives";
import {
  AbyssBackdrop,
  Caustics,
  EditionMark,
  FadeRule,
} from "@/components/shared/abyss";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

/* =================================================================== *
 * How it works — the numbered strip
 * =================================================================== */

const STEP_ICONS = [Camera, ScanLine, Brain, Globe2];

export function HowItWorks() {
  const t = useT();

  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <EditionMark
          left={t.how.eyebrow}
          right={`01 — 0${t.how.steps.length}`}
          className="mb-12"
        />

        <SectionHeading title={t.how.title} description={t.how.description} />

        {/* A single submerged pane, numbered across. The ghost panes below are
            the same device the reference uses to suggest depth. */}
        <div className="relative mt-16">
          <div
            className="absolute inset-x-8 -bottom-3 h-16 rounded-[2rem] border border-white/6 bg-white/[0.015]"
            aria-hidden
          />
          <div
            className="absolute inset-x-16 -bottom-6 h-16 rounded-[2rem] border border-white/4 bg-white/[0.01]"
            aria-hidden
          />

          <Reveal>
            <div className="relative overflow-hidden rounded-[2rem] abyss-panel">
              <Caustics intensity={0.5} />

              <div className="relative grid divide-y divide-white/8 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 [&>*]:border-white/8 sm:[&>*:nth-child(2)]:border-l lg:[&>*:not(:first-child)]:border-l sm:[&>*:nth-child(n+3)]:border-t lg:[&>*:nth-child(n+3)]:border-t-0">
                {t.how.steps.map((step, i) => {
                  const Icon = STEP_ICONS[i] ?? Camera;
                  return (
                    <div key={step.title} className="flex flex-col gap-4 p-6 sm:p-7">
                      <div className="flex items-start justify-between gap-3">
                        {/* Outlined numeral — the hollow "01 02 03" device */}
                        <span
                          className="text-[38px] font-semibold leading-none tracking-[-0.06em]"
                          style={{
                            color: "transparent",
                            WebkitTextStroke:
                              "1px oklch(0.86 0.11 202 / 0.55)",
                          }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <Icon className="size-[18px] text-lume-300" aria-hidden />
                      </div>

                      <div>
                        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-50">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
                          {step.body}
                        </p>
                      </div>

                      <p className="mt-auto border-t border-white/8 pt-3 font-mono text-[10.5px] leading-relaxed text-ink-600">
                        {step.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* =================================================================== *
 * AI features
 * =================================================================== */

const FEATURE_ICONS = [Eye, Activity, TrendingDown, Radar, FileText, MessageSquare];
const FEATURE_SPANS = ["lg:col-span-2", "", "", "lg:col-span-2", "", ""];

export function Features() {
  const t = useT();

  return (
    <section id="features" className="relative isolate py-24 sm:py-32">
      <AbyssBackdrop depth={0.6} photo="/photos/depth.jpg" photoDim={0.78} />

      <div className="relative mx-auto max-w-6xl px-5">
        <EditionMark left={t.features.eyebrow} right="02" className="mb-12" />

        <SectionHeading
          title={t.features.title}
          description={t.features.description}
        />

        <div className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {t.features.items.map((feature, i) => {
            const Icon = FEATURE_ICONS[i] ?? Eye;
            const warm = i % 2 === 0;
            return (
              <Reveal key={feature.title} delay={i * 0.06} className={FEATURE_SPANS[i]}>
                <Card glow className="group relative h-full overflow-hidden p-6">
                  <div
                    className={cn(
                      "pointer-events-none absolute -right-16 -top-16 size-44 rounded-full blur-3xl transition-opacity duration-500 opacity-45 group-hover:opacity-80",
                      warm ? "bg-lume-400/22" : "bg-flux-500/22",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "relative grid size-11 place-items-center rounded-xl border",
                      warm
                        ? "border-lume-400/25 bg-lume-400/12 text-lume-200"
                        : "border-flux-400/25 bg-flux-400/12 text-flux-300",
                    )}
                  >
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="relative mt-4 text-[16px] font-semibold tracking-[-0.015em] text-ink-50">
                    {feature.title}
                  </h3>
                  <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-ink-400">
                    {feature.body}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>

        {/* Grade ramp */}
        <Reveal delay={0.1} className="mt-6">
          <Card className="overflow-hidden p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-[16px] font-semibold tracking-[-0.015em] text-ink-50">
                  {t.features.scale.title}
                </h3>
                <p className="mt-1.5 max-w-xl text-[13.5px] text-ink-400">
                  {t.features.scale.body}
                </p>
              </div>
              <span className="font-mono text-[11px] text-ink-600">
                {t.features.scale.legend}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-5">
              {GRADES.map((grade, i) => (
                <motion.div
                  key={grade.quality}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.5 }}
                  className="rounded-xl border p-3.5"
                  style={{
                    borderColor: `${grade.hex}33`,
                    background: `${grade.hex}0e`,
                  }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: grade.hex }}
                    >
                      {t.grades[grade.quality].label}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-500">
                      {grade.min}–{grade.max}
                    </span>
                  </div>
                  <div
                    className="mt-2.5 h-1 rounded-full"
                    style={{ background: grade.hex }}
                    aria-hidden
                  />
                  <p className="mt-2.5 text-[11.5px] leading-snug text-ink-500">
                    {t.grades[grade.quality].blurb}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

/* =================================================================== *
 * Statistics / impact
 * =================================================================== */

const QUALITY_ORDER: WaterQuality[] = [
  "Excellent",
  "Good",
  "Moderate",
  "Poor",
  "Critical",
];

export function Statistics({ stats }: { stats: PlatformStats }) {
  const t = useT();
  const totalGraded =
    QUALITY_ORDER.reduce((sum, q) => sum + stats.qualityBreakdown[q], 0) || 1;

  return (
    <section id="impact" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <EditionMark left={t.stats.eyebrow} right="04" className="mb-12" />

        <SectionHeading title={t.stats.title} description={t.stats.description} />

        <div className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <Card className="h-full p-6 sm:p-7">
              <h3 className="text-[15px] font-semibold text-ink-50">
                {t.stats.distributionTitle}
              </h3>
              <p className="mt-1.5 text-[13px] text-ink-400">
                {fmt(t.stats.distributionBody, {
                  total: compactNumber(totalGraded),
                })}
              </p>

              {/* Stacked ratio bar */}
              <div
                className="mt-6 flex h-3 overflow-hidden rounded-full bg-white/6"
                role="img"
                aria-label={t.stats.distributionAria}
              >
                {QUALITY_ORDER.map((quality, i) => {
                  const grade = GRADES.find((g) => g.quality === quality)!;
                  const share =
                    (stats.qualityBreakdown[quality] / totalGraded) * 100;
                  return (
                    <motion.div
                      key={quality}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${share}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.9,
                        delay: 0.15 + i * 0.09,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      style={{ background: grade.hex }}
                      title={`${t.grades[quality].label}: ${stats.qualityBreakdown[quality]}`}
                    />
                  );
                })}
              </div>

              <ul className="mt-6 space-y-3">
                {QUALITY_ORDER.map((quality) => {
                  const grade = GRADES.find((g) => g.quality === quality)!;
                  const count = stats.qualityBreakdown[quality];
                  const share = Math.round((count / totalGraded) * 100);
                  return (
                    <li
                      key={quality}
                      className="flex items-center justify-between gap-4 text-[13px]"
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className="size-2 rounded-full"
                          style={{ background: grade.hex }}
                          aria-hidden
                        />
                        <span className="text-ink-300">
                          {t.grades[quality].label}
                        </span>
                        <span className="font-mono text-[11px] text-ink-600">
                          {grade.min}–{grade.max}
                        </span>
                      </span>
                      <span className="flex items-baseline gap-2 tabular-nums">
                        <span className="font-semibold text-ink-100">
                          {count}
                        </span>
                        <span className="w-9 text-right text-[12px] text-ink-500">
                          {share}%
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </Reveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                icon: <FileText />,
                label: t.stats.tiles.assessments,
                value: stats.reports,
                hint: t.stats.tiles.assessmentsHint,
              },
              {
                icon: <Waves />,
                label: t.stats.tiles.waterBodies,
                value: stats.locations,
                hint: fmt(t.stats.tiles.waterBodiesHint, {
                  countries: stats.countries,
                }),
              },
              {
                icon: <Users />,
                label: t.stats.tiles.contributors,
                value: stats.contributors,
                hint: t.stats.tiles.contributorsHint,
              },
              {
                icon: <Zap />,
                label: t.stats.tiles.critical,
                value: stats.criticalCount,
                hint: t.stats.tiles.criticalHint,
              },
            ].map((tile, i) => (
              <Reveal key={tile.label} delay={i * 0.07}>
                <Card className="h-full p-5">
                  <span className="grid size-9 place-items-center rounded-lg border border-white/8 bg-white/5 text-ink-300 [&_svg]:size-4">
                    {tile.icon}
                  </span>
                  <p className="mt-4 text-[30px] font-semibold leading-none tracking-[-0.035em] text-ink-50">
                    <AnimatedCounter value={tile.value} />
                  </p>
                  <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
                    {tile.label}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-400">{tile.hint}</p>
                </Card>
              </Reveal>
            ))}

            <Reveal delay={0.28} className="sm:col-span-2">
              <Card className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">
                    {t.stats.meanLabel}
                  </p>
                  <p className="mt-1.5 text-[13px] text-ink-400">
                    {t.stats.meanHint}
                  </p>
                </div>
                <p className="text-[34px] font-semibold leading-none tracking-[-0.04em] text-gradient-aqua">
                  <AnimatedCounter value={stats.averageScore} />
                  <span className="text-lg text-ink-600">/100</span>
                </p>
              </Card>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =================================================================== *
 * Benefits — the stacked card trio
 * =================================================================== */

const AUDIENCE_ICONS = [Users, Scale, Blocks];
const ADVANTAGE_ICONS = [Banknote, Clock, Layers, BadgeCheck];

export function Benefits() {
  const t = useT();

  return (
    <section id="benefits" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <EditionMark left={t.benefits.eyebrow} right="05" className="mb-12" />

        <SectionHeading
          title={t.benefits.title}
          description={t.benefits.description}
        />

        {/* Each card sits on two rotated ghosts, like a stack of prints. */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:gap-4 lg:grid-cols-3">
          {t.benefits.audiences.map((audience, i) => {
            const Icon = AUDIENCE_ICONS[i] ?? Users;
            return (
              <Reveal key={audience.who} delay={i * 0.08}>
                <div className="group relative">
                  <div
                    className="absolute inset-0 -rotate-[2.5deg] rounded-3xl border border-white/8 bg-white/[0.02] transition-transform duration-500 group-hover:-rotate-[4deg]"
                    aria-hidden
                  />
                  <div
                    className="absolute inset-0 rotate-[1.5deg] rounded-3xl border border-white/6 bg-white/[0.015] transition-transform duration-500 group-hover:rotate-[3deg]"
                    aria-hidden
                  />

                  <div className="relative h-full overflow-hidden rounded-3xl abyss-panel p-6">
                    <span className="grid size-11 place-items-center rounded-xl border border-lume-400/22 bg-lume-400/10 text-lume-200">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-ink-50">
                      {audience.who}
                    </h3>
                    <ul className="mt-4 space-y-2.5">
                      {audience.gains.map((gain) => (
                        <li
                          key={gain}
                          className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-400"
                        >
                          <Droplets
                            className="mt-0.5 size-3.5 shrink-0 text-lume-300"
                            aria-hidden
                          />
                          {gain}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-6 font-mono text-[10.5px] text-ink-600">
                      {String(i + 1).padStart(2, "0")}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.benefits.advantages.map((advantage, i) => {
            const Icon = ADVANTAGE_ICONS[i] ?? Banknote;
            return (
              <Reveal key={advantage.title} delay={i * 0.07}>
                <Card className="h-full p-5">
                  <Icon className="size-5 text-flux-300" aria-hidden />
                  <h3 className="mt-3.5 text-[14px] font-semibold text-ink-50">
                    {advantage.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ink-400">
                    {advantage.body}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* =================================================================== *
 * FAQ
 * =================================================================== */

export function Faq() {
  const t = useT();

  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5">
        <EditionMark left={t.faq.eyebrow} right="06" className="mb-12" />

        <SectionHeading title={t.faq.title} description={t.faq.description} />

        <Reveal delay={0.1} className="mt-14">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {t.faq.items.map((faq, i) => (
              <AccordionItem key={faq.q} value={`item-${i}`}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* =================================================================== *
 * Contact
 * =================================================================== */

export function Contact() {
  const t = useT();
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
    } finally {
      setState("sent");
    }
  }

  return (
    <section id="contact" className="relative isolate py-24 sm:py-32">
      <AbyssBackdrop depth={0.5} rays={false} />

      <div className="relative mx-auto max-w-6xl px-5">
        <EditionMark left={t.contact.eyebrow} right="07" className="mb-12" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              title={t.contact.title}
              description={t.contact.description}
            />

            <Reveal delay={0.16} className="mt-8">
              <ul className="space-y-4">
                {[
                  {
                    icon: Mail,
                    label: t.contact.emailLabel,
                    value: "team@aquavision.ai",
                    href: "mailto:team@aquavision.ai",
                  },
                  {
                    icon: MapPin,
                    label: t.contact.locationLabel,
                    value: t.contact.locationValue,
                  },
                  {
                    icon: Sparkles,
                    label: t.contact.onboardingLabel,
                    value: t.contact.onboardingValue,
                  },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-lume-300">
                      <item.icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-500">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-[14.5px] text-ink-100 transition-colors hover:text-lume-300"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-[14.5px] text-ink-100">{item.value}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.12}>
            <Card className="p-6 sm:p-7">
              {state === "sent" ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl border border-grade-excellent/25 bg-grade-excellent/12 text-grade-excellent">
                    <BadgeCheck className="size-6" aria-hidden />
                  </span>
                  <h3 className="text-[16px] font-semibold text-ink-50">
                    {t.contact.sentTitle}
                  </h3>
                  <p className="max-w-xs text-[13.5px] leading-relaxed text-ink-400">
                    {t.contact.sentBody}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState("idle")}
                    className="mt-2"
                  >
                    {t.contact.sendAnother}
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field
                      label={t.contact.nameLabel}
                      htmlFor="contact-name"
                      required
                    >
                      <Input
                        name="name"
                        placeholder={t.contact.namePlaceholder}
                        autoComplete="name"
                        required
                      />
                    </Field>
                    <Field
                      label={t.contact.emailLabel}
                      htmlFor="contact-email"
                      required
                    >
                      <Input
                        name="email"
                        type="email"
                        placeholder={t.contact.emailPlaceholder}
                        autoComplete="email"
                        required
                      />
                    </Field>
                  </div>

                  <Field
                    label={t.contact.orgLabel}
                    htmlFor="contact-org"
                    hint={t.contact.orgHint}
                  >
                    <Input
                      name="organisation"
                      placeholder={t.contact.orgPlaceholder}
                      autoComplete="organization"
                    />
                  </Field>

                  <Field
                    label={t.contact.messageLabel}
                    htmlFor="contact-message"
                    required
                  >
                    <Textarea
                      name="message"
                      rows={5}
                      required
                      placeholder={t.contact.messagePlaceholder}
                    />
                  </Field>

                  <Button
                    type="submit"
                    size="lg"
                    loading={state === "sending"}
                    className="mt-1"
                  >
                    {state === "sending" ? t.contact.submitting : t.contact.submit}
                    {state !== "sending" && <ArrowRight aria-hidden />}
                  </Button>

                  <p className="text-center text-[11.5px] text-ink-600">
                    {t.contact.privacy}
                  </p>
                </form>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* =================================================================== *
 * CTA + Footer
 * =================================================================== */

export function FinalCta() {
  const t = useT();

  return (
    <section className="relative isolate overflow-hidden py-28 sm:py-40">
      <AbyssBackdrop
        depth={0.9}
        particles
        photo="/photos/hero.jpg"
        photoDim={0.7}
      />

      <div className="relative mx-auto max-w-4xl px-5 text-center">
        <Reveal>
          <p className="text-[11px] font-medium uppercase tracking-[0.36em] text-lume-200/80">
            {t.cta.kicker}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="mt-5 text-lume text-[clamp(2.75rem,9vw,6rem)] font-semibold leading-[0.92] tracking-[-0.05em]">
            {t.cta.title}
          </h2>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mx-auto mt-7 max-w-xl text-pretty text-[15.5px] leading-relaxed text-ink-400">
            {t.cta.body}
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/upload">
                <ScanLine aria-hidden />
                {t.cta.primary}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/reports">
                <Download aria-hidden />
                {t.cta.secondary}
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* Brand marks — lucide dropped its brand icon set, so these are inline. */

function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.02-2.75-.1-.26-.44-1.3.1-2.71 0 0 .83-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.54 1.41.2 2.45.1 2.71.63.72 1.02 1.63 1.02 2.75 0 3.92-2.34 4.78-4.57 5.04.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.06 10.06 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.53 3h3.2l-6.99 7.99L22 21h-6.31l-4.4-5.76L6.2 21H3l7.28-8.32L2.5 3h6.47l4.1 5.42L17.53 3Zm-1.12 16.06h1.77L7.68 4.85H5.79l10.62 14.21Z" />
    </svg>
  );
}

function LinkedInMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6.94 5a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3.2 8.48h3.5V21H3.2V8.48Zm5.9 0h3.35v1.71h.05c.47-.88 1.6-1.81 3.3-1.81 3.53 0 4.18 2.32 4.18 5.35V21h-3.5v-6.36c0-1.52-.03-3.47-2.12-3.47-2.12 0-2.44 1.65-2.44 3.36V21H9.1V8.48Z" />
    </svg>
  );
}

export function SiteFooter() {
  const t = useT();
  const year = new Date().getFullYear();

  const sections = [
    {
      heading: t.footer.product,
      links: [
        { label: t.footer.links.liveMap, href: "/map" },
        { label: t.footer.links.reports, href: "/reports" },
        { label: t.footer.links.newAnalysis, href: "/upload" },
        { label: t.footer.links.leaderboard, href: "/leaderboard" },
      ],
    },
    {
      heading: t.footer.platform,
      links: [
        { label: t.footer.links.how, href: "/#how" },
        { label: t.footer.links.features, href: "/#features" },
        { label: t.footer.links.impact, href: "/#impact" },
        { label: t.footer.links.faq, href: "/#faq" },
      ],
    },
    {
      heading: t.footer.company,
      links: [
        { label: t.footer.links.contact, href: "/#contact" },
        { label: t.footer.links.dashboard, href: "/dashboard" },
        { label: t.footer.links.signIn, href: "/login" },
        { label: t.footer.links.signUp, href: "/signup" },
      ],
    },
  ];

  return (
    <footer className="relative border-t border-white/8 bg-abyss-1000/80">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <FadeRule className="mb-12 opacity-60" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-ink-500">
              {t.footer.tagline}
            </p>
            <div className="mt-5 flex gap-2">
              {[
                { icon: GithubMark, label: "GitHub" },
                { icon: XMark, label: "X" },
                { icon: LinkedInMark, label: "LinkedIn" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="grid size-9 place-items-center rounded-xl border border-white/8 bg-white/4 text-ink-400 transition-colors hover:border-white/16 hover:bg-white/8 hover:text-ink-100"
                >
                  <social.icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>

            <div className="mt-6">
              <p className="mb-2 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink-600">
                {t.language.label}
              </p>
              <LanguageSwitcher />
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                {section.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13.5px] text-ink-400 transition-colors hover:text-ink-100"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/8 pt-7 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <p className="text-[12.5px] text-ink-600">
              {fmt(t.footer.rights, { year })}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-700">
              {t.footer.photoCredits}
            </p>
          </div>
          <p className="flex items-center gap-2 text-[12px] text-ink-600">
            <span
              className="size-1.5 animate-pulse rounded-full bg-grade-excellent"
              aria-hidden
            />
            {t.footer.status}
          </p>
        </div>
      </div>
    </footer>
  );
}
