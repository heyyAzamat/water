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
  AmbientBackdrop,
  AnimatedCounter,
  Logo,
  Reveal,
  SectionHeading,
} from "@/components/shared/primitives";

/* =================================================================== *
 * How it works
 * =================================================================== */

const STEPS = [
  {
    icon: Camera,
    title: "Photograph the water",
    body: "Any phone camera works. Shoot the surface from the bank, a bridge or a boat — PNG, JPEG or WEBP.",
    detail: "Drag & drop · client-side compression · EXIF capture time",
  },
  {
    icon: ScanLine,
    title: "Computer vision analyses it",
    body: "The model measures clarity, plastics, foam, oil film, algae and unnatural colour, then rates each one 0–100.",
    detail: "13 indicators · structured JSON · confidence-scored",
  },
  {
    icon: Brain,
    title: "Scoring engine composes the verdict",
    body: "A weighted matrix recomputes the overall severity so the number is reproducible — not just whatever the model felt like saying.",
    detail: "Peak-biased weighting · divergence penalty · 5 grade bands",
  },
  {
    icon: Globe2,
    title: "It lands on the map and the timeline",
    body: "Every assessment is stored, pinned, clustered and compared against the location's history to detect the trend.",
    detail: "Heatmap · clusters · 30-day projection · PDF export",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="How it works"
          title="From photograph to defensible assessment in under a minute"
          description="Four stages, fully automated. The only manual step is pointing a camera at the water."
        />

        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08}>
              <Card glow className="group h-full p-5">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-xl border border-aqua-400/20 bg-gradient-to-br from-aqua-400/18 to-flux-500/12 text-aqua-200 transition-transform duration-300 group-hover:scale-105">
                    <step.icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] font-medium text-ink-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-4 text-[15px] font-semibold tracking-[-0.01em] text-ink-50">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-ink-400">
                  {step.body}
                </p>
                <p className="mt-4 border-t border-white/6 pt-3 font-mono text-[11px] leading-relaxed text-ink-600">
                  {step.detail}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================================================================== *
 * AI features
 * =================================================================== */

const FEATURES = [
  {
    icon: Eye,
    title: "Multi-indicator vision analysis",
    body: "Thirteen independent pollution signals — plastics, floating garbage, oil film, foam, algal bloom, unnatural colour, sediment, sewage, industrial discharge, dead fauna and more — each with its own severity and pixel-level evidence note.",
    span: "lg:col-span-2",
    accent: "aqua",
  },
  {
    icon: Activity,
    title: "Reproducible 0–100 scoring",
    body: "A weighted matrix blends every indicator, biased toward the worst single signal so one oil slick in a clean frame still registers. Model disagreement docks the confidence rather than being hidden.",
    accent: "flux",
  },
  {
    icon: TrendingDown,
    title: "Trend detection & projection",
    body: "Confidence-weighted least squares across a location's history, with an explicit noise floor so seasonal light variation never gets reported as a crisis. Projects 30 days ahead.",
    accent: "aqua",
  },
  {
    icon: Radar,
    title: "Live heatmap & clustering",
    body: "Every report pinned and colour-coded by severity, aggregated into density clusters, filterable by date, region, water body type and grade.",
    span: "lg:col-span-2",
    accent: "flux",
  },
  {
    icon: FileText,
    title: "Automatic environmental reports",
    body: "Coordinates, imagery, findings, indicator table, AI reasoning, recommendations and trend summary — exportable to PDF, printable, shareable by link.",
    accent: "aqua",
  },
  {
    icon: MessageSquare,
    title: "Crowdsourced corroboration",
    body: "Field observers add smell, dead fish, foam, illegal dumping and nearby industry. Human notes corroborate the vision result — capped so they can never manufacture a critical score alone.",
    accent: "flux",
  },
];

export function Features() {
  return (
    <section id="features" className="relative isolate py-24 sm:py-32">
      <AmbientBackdrop intensity={0.5} />

      <div className="relative mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="AI capabilities"
          title="Not a classifier bolted onto an upload form"
          description="AquaVision is an assessment pipeline: measure, recompute, explain, compare against history, and stay honest about uncertainty."
        />

        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <Reveal
              key={feature.title}
              delay={i * 0.06}
              className={feature.span}
            >
              <Card glow className="group relative h-full overflow-hidden p-6">
                <div
                  className={cn(
                    "pointer-events-none absolute -right-16 -top-16 size-44 rounded-full blur-3xl transition-opacity duration-500 opacity-40 group-hover:opacity-70",
                    feature.accent === "aqua"
                      ? "bg-aqua-400/20"
                      : "bg-flux-500/20",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "relative grid size-11 place-items-center rounded-xl border",
                    feature.accent === "aqua"
                      ? "border-aqua-400/22 bg-aqua-400/12 text-aqua-200"
                      : "border-flux-400/22 bg-flux-400/12 text-flux-300",
                  )}
                >
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="relative mt-4 text-[16px] font-semibold tracking-[-0.015em] text-ink-50">
                  {feature.title}
                </h3>
                <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-ink-400">
                  {feature.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>

        {/* Grade ramp */}
        <Reveal delay={0.1} className="mt-6">
          <Card className="overflow-hidden p-6 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h3 className="text-[16px] font-semibold tracking-[-0.015em] text-ink-50">
                  The severity scale
                </h3>
                <p className="mt-1.5 text-[13.5px] text-ink-400">
                  One scale, five bands, used identically by the score ring, the
                  map markers, the alert thresholds and the PDF.
                </p>
              </div>
              <span className="font-mono text-[11px] text-ink-600">
                0 = pristine · 100 = ecological emergency
              </span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-5">
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
                      {grade.label}
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
                    {grade.blurb}
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
  const totalGraded =
    QUALITY_ORDER.reduce((sum, q) => sum + stats.qualityBreakdown[q], 0) || 1;

  return (
    <section id="impact" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Network impact"
          title="What the network has measured so far"
          description="Every number below is computed live from the assessment database — no marketing figures."
        />

        <div className="mt-16 grid gap-4 lg:grid-cols-[1.25fr_1fr]">
          <Reveal>
            <Card className="h-full p-6 sm:p-7">
              <h3 className="text-[15px] font-semibold text-ink-50">
                Grade distribution
              </h3>
              <p className="mt-1.5 text-[13px] text-ink-400">
                How the {compactNumber(totalGraded)} assessed images fall across
                the severity bands.
              </p>

              {/* Stacked ratio bar */}
              <div
                className="mt-6 flex h-3 overflow-hidden rounded-full bg-white/6"
                role="img"
                aria-label="Distribution of assessments across the five severity grades"
              >
                {QUALITY_ORDER.map((quality, i) => {
                  const grade = GRADES.find((g) => g.quality === quality)!;
                  const share = (stats.qualityBreakdown[quality] / totalGraded) * 100;
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
                      title={`${quality}: ${stats.qualityBreakdown[quality]}`}
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
                        <span className="text-ink-300">{quality}</span>
                        <span className="font-mono text-[11px] text-ink-600">
                          {grade.min}–{grade.max}
                        </span>
                      </span>
                      <span className="flex items-baseline gap-2 tabular-nums">
                        <span className="font-semibold text-ink-100">{count}</span>
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

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: <FileText />,
                label: "Assessments",
                value: stats.reports,
                hint: "AI-analysed and published",
              },
              {
                icon: <Waves />,
                label: "Water bodies",
                value: stats.locations,
                hint: `across ${stats.countries} countries`,
              },
              {
                icon: <Users />,
                label: "Contributors",
                value: stats.contributors,
                hint: "citizen observers",
              },
              {
                icon: <Zap />,
                label: "Critical findings",
                value: stats.criticalCount,
                hint: "scored 81+ — escalated",
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
                  <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-500">
                    {tile.label}
                  </p>
                  <p className="mt-1 text-[12.5px] text-ink-400">{tile.hint}</p>
                </Card>
              </Reveal>
            ))}

            <Reveal delay={0.28} className="sm:col-span-2">
              <Card className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink-500">
                    Mean network severity
                  </p>
                  <p className="mt-1.5 text-[13px] text-ink-400">
                    Average across every assessment on record
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
 * Benefits
 * =================================================================== */

const AUDIENCES = [
  {
    icon: Users,
    who: "Citizens & volunteers",
    gains: [
      "Turn a phone photo into evidence a regulator will read",
      "See whether your local river is actually getting better",
      "Earn recognition on the contributor leaderboard",
    ],
  },
  {
    icon: Scale,
    who: "Municipalities & regulators",
    gains: [
      "Continuous coverage without deploying a single sensor",
      "Prioritise inspections by severity, not by complaint volume",
      "Export a dated, coordinate-stamped PDF per incident",
    ],
  },
  {
    icon: Blocks,
    who: "NGOs & researchers",
    gains: [
      "Longitudinal time series per water body, free to export",
      "Consistent scoring methodology across every contributor",
      "Open API surface for integrating into existing pipelines",
    ],
  },
];

const ADVANTAGES = [
  {
    icon: Banknote,
    title: "No capital expenditure",
    body: "A sensor buoy costs thousands and covers one point. A photograph costs nothing and covers anywhere someone can stand.",
  },
  {
    icon: Clock,
    title: "Deployable today",
    body: "No procurement, no installation, no calibration schedule, no batteries to replace in February.",
  },
  {
    icon: Layers,
    title: "Scales with people, not budget",
    body: "Coverage grows every time somebody joins. Marginal cost per additional monitoring site is effectively zero.",
  },
  {
    icon: BadgeCheck,
    title: "Auditable by design",
    body: "Every score decomposes into the indicators that produced it, with the model, confidence and timestamp recorded.",
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5">
        <SectionHeading
          eyebrow="Why it works"
          title="Sensor-grade coverage without a single sensor"
          description="Hardware monitoring is accurate and expensive, which is why most water bodies have none at all. AquaVision trades a little precision for orders of magnitude more coverage."
        />

        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {AUDIENCES.map((audience, i) => (
            <Reveal key={audience.who} delay={i * 0.08}>
              <Card glow className="h-full p-6">
                <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/6 text-aqua-200">
                  <audience.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.015em] text-ink-50">
                  {audience.who}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {audience.gains.map((gain) => (
                    <li key={gain} className="flex gap-2.5 text-[13.5px] leading-relaxed text-ink-400">
                      <Droplets
                        className="mt-0.5 size-3.5 shrink-0 text-aqua-400"
                        aria-hidden
                      />
                      {gain}
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((advantage, i) => (
            <Reveal key={advantage.title} delay={i * 0.07}>
              <Card className="h-full p-5">
                <advantage.icon className="size-5 text-flux-300" aria-hidden />
                <h3 className="mt-3.5 text-[14px] font-semibold text-ink-50">
                  {advantage.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-400">
                  {advantage.body}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* =================================================================== *
 * FAQ
 * =================================================================== */

const FAQS = [
  {
    q: "How accurate is a score derived from one photograph?",
    a: "It is a visual assessment, and we are explicit about that. AquaVision measures what is visible — clarity, plastics, foam, oil film, algal biomass, unnatural colour — and reports a confidence that drops for poor light, motion blur, heavy compression or a distant crop. It cannot detect dissolved chemistry, heavy metals or bacteria, and the report says so. Its value is coverage and trend: a site photographed monthly by five people yields a signal no single lab sample can.",
  },
  {
    q: "Why recompute the score instead of trusting the model's number?",
    a: "Because a single opaque number is not auditable. The model rates each indicator separately with an evidence note; a weighted matrix then composes the overall severity, biased toward the worst signal so one serious finding in an otherwise clean frame is not averaged away. If the model's own overall guess diverges from its indicator matrix, that divergence is subtracted from the confidence rather than quietly discarded.",
  },
  {
    q: "How does trend detection avoid crying wolf over seasonal change?",
    a: "Two guards. First, the fit is confidence-weighted least squares, so a blurry 41%-confidence photo cannot swing the verdict as hard as a crisp 92% one. Second, there is an explicit ±6-point noise floor: movement smaller than that is reported as stable, because water photographs genuinely vary with light, season and framing. A direction is only declared when the window-mean comparison and the regression slope agree in sign.",
  },
  {
    q: "Do I need to install anything or buy hardware?",
    a: "No. The entire platform is digital — a camera and a browser. There are no buoys, probes, dataloggers or gateways, nothing to calibrate and nothing to maintain in the field.",
  },
  {
    q: "Who owns the data I contribute?",
    a: "Your uploads stay attributed to you and you can delete a report at any time. Approved public assessments are readable by everyone, because environmental condition data is a public good — that openness is what makes the map useful to the people who can act on it.",
  },
  {
    q: "Can this integrate with our existing monitoring programme?",
    a: "Yes. Every assessment is available through a REST surface, each location exposes its full score time series, and reports export as PDF with coordinates and timestamps intact. Teams typically use AquaVision as a wide-area triage layer that tells them where to send a sampling crew.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-5">
        <SectionHeading
          eyebrow="FAQ"
          title="The questions that actually matter"
          description="Straight answers on accuracy, methodology and limits."
        />

        <Reveal delay={0.1} className="mt-14">
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
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
      <AmbientBackdrop intensity={0.45} />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Get in touch"
              title="Bring AquaVision to your basin"
              description="Municipalities, NGOs, universities and volunteer river groups — tell us which water bodies you need covered and we will help you get a monitoring programme running."
            />

            <Reveal delay={0.16} className="mt-8">
              <ul className="space-y-4">
                {[
                  {
                    icon: Mail,
                    label: "Email",
                    value: "team@aquavision.ai",
                    href: "mailto:team@aquavision.ai",
                  },
                  {
                    icon: MapPin,
                    label: "Based in",
                    value: "Astana, Kazakhstan · remote-first",
                  },
                  {
                    icon: Sparkles,
                    label: "Programme onboarding",
                    value: "Typically under two weeks",
                  },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/5 text-aqua-300">
                      <item.icon className="size-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink-500">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a
                          href={item.href}
                          className="text-[14.5px] text-ink-100 transition-colors hover:text-aqua-300"
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
                    Message received
                  </h3>
                  <p className="max-w-xs text-[13.5px] leading-relaxed text-ink-400">
                    Thanks — we read every enquiry and usually reply within two
                    working days.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setState("idle")}
                    className="mt-2"
                  >
                    Send another
                  </Button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Name" htmlFor="contact-name" required>
                      <Input
                        name="name"
                        placeholder="Aigerim Nurlanova"
                        autoComplete="name"
                        required
                      />
                    </Field>
                    <Field label="Email" htmlFor="contact-email" required>
                      <Input
                        name="email"
                        type="email"
                        placeholder="you@organisation.org"
                        autoComplete="email"
                        required
                      />
                    </Field>
                  </div>

                  <Field
                    label="Organisation"
                    htmlFor="contact-org"
                    hint="Optional"
                  >
                    <Input
                      name="organisation"
                      placeholder="City water authority"
                      autoComplete="organization"
                    />
                  </Field>

                  <Field
                    label="What would you like to monitor?"
                    htmlFor="contact-message"
                    required
                  >
                    <Textarea
                      name="message"
                      rows={5}
                      required
                      placeholder="We manage 40 km of the Ishim and need to prioritise inspections…"
                    />
                  </Field>

                  <Button
                    type="submit"
                    size="lg"
                    loading={state === "sending"}
                    className="mt-1"
                  >
                    {state === "sending" ? "Sending" : "Send enquiry"}
                    {state !== "sending" && <ArrowRight aria-hidden />}
                  </Button>

                  <p className="text-center text-[11.5px] text-ink-600">
                    We never share your details. No newsletter, no tracking
                    pixels.
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
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-aqua-500/12 via-ink-900/60 to-flux-600/14 p-8 backdrop-blur-2xl sm:p-14">
            <div
              className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-aqua-400/20 blur-[100px]"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-28 -left-16 size-80 rounded-full bg-flux-500/18 blur-[100px]"
              aria-hidden
            />

            <div className="relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-balance text-[clamp(1.6rem,3.6vw,2.4rem)] font-semibold leading-[1.1] tracking-[-0.035em] text-ink-50">
                  Your nearest river has never been assessed.
                </h2>
                <p className="mt-3.5 text-[15px] leading-relaxed text-ink-300">
                  It takes one photograph to change that. Analysis is free, and
                  the first report you publish becomes the baseline everyone
                  else measures against.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/upload">
                    <ScanLine aria-hidden />
                    Start an analysis
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link href="/reports">
                    <Download aria-hidden />
                    Browse reports
                  </Link>
                </Button>
              </div>
            </div>
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

const FOOTER_SECTIONS = [
  {
    heading: "Product",
    links: [
      { label: "Live map", href: "/map" },
      { label: "Reports", href: "/reports" },
      { label: "New analysis", href: "/upload" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "AI capabilities", href: "/#features" },
      { label: "Network impact", href: "/#impact" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Contact", href: "/#contact" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/signup" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-white/8 bg-ink-950/60">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-ink-500">
              Intelligent monitoring of water bodies using computer vision.
              Crowdsourced, hardware-free, open by default.
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
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-ink-500">
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
          <p className="text-[12.5px] text-ink-600">
            © {new Date().getFullYear()} AquaVision AI. Built for the water
            bodies nobody is watching.
          </p>
          <p className="flex items-center gap-2 text-[12px] text-ink-600">
            <span className="size-1.5 animate-pulse rounded-full bg-grade-excellent" aria-hidden />
            All systems operational
          </p>
        </div>
      </div>
    </footer>
  );
}
