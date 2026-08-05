import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Calendar, Cpu, MapPin, Sparkles } from "lucide-react";
import { getReportByShareToken } from "@/lib/data/repository";
import { gradeForScore } from "@/lib/ai/scoring";
import { formatCoords, formatDate, titleCase } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Logo, QualityBadge } from "@/components/shared/primitives";
import { ScoreRing } from "@/components/shared/score-ring";
import { IndicatorBars } from "@/components/charts/score-charts";

/**
 * Public share view.
 *
 * Reachable without an account — a report is only useful as evidence if the
 * person who needs to act on it can open the link. Deliberately read-only: no
 * comments, no moderation, no author tooling.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const report = await getReportByShareToken(token);

  if (!report) return { title: "Report not found", robots: { index: false } };

  return {
    title: `${report.title} — ${report.analysis.pollutionScore}/100`,
    description: report.analysis.explanation.slice(0, 200),
    robots: { index: false, follow: false },
  };
}

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const report = await getReportByShareToken(token);

  if (!report || !report.isPublic) notFound();

  const grade = gradeForScore(report.analysis.pollutionScore);
  const captured = report.capturedAt ?? report.createdAt;

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-white/8 bg-ink-950/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
          <Logo />
          <Button asChild size="sm" variant="secondary">
            <Link href="/">
              Explore AquaVision
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-4xl px-5 py-8">
        <Badge variant="outline" size="sm">
          <Sparkles />
          Shared environmental assessment
        </Badge>

        <h1 className="mt-3 text-balance text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.035em] text-ink-50">
          {report.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5" aria-hidden />
            {report.location?.name ?? "Unmapped location"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-3.5" aria-hidden />
            {formatDate(captured, true)}
          </span>
          <span className="font-mono">
            {formatCoords(report.lat, report.lng)}
          </span>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <Card className="overflow-hidden">
            <div className="relative aspect-[4/3] bg-ink-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.imageUrl}
                alt={`Water surface at ${report.location?.name ?? "an unmapped location"}`}
                className="size-full object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-1"
                style={{ background: grade.hex }}
                aria-hidden
              />
            </div>
          </Card>

          <Card>
            <div className="flex flex-col items-center gap-4 p-6">
              <ScoreRing score={report.analysis.pollutionScore} size={168} />
              <QualityBadge
                quality={report.analysis.waterQuality}
                score={report.analysis.pollutionScore}
                size="lg"
              />
              <p className="text-center text-[13px] leading-relaxed text-ink-400">
                {grade.blurb}
              </p>

              <div className="flex w-full items-center justify-around border-t border-white/8 pt-4 text-center">
                <div>
                  <p className="text-[15px] font-semibold text-ink-100">
                    {report.analysis.confidence}%
                  </p>
                  <p className="text-[10.5px] uppercase tracking-[0.08em] text-ink-600">
                    confidence
                  </p>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-ink-100">
                    {report.analysis.clarityScore}
                  </p>
                  <p className="text-[10.5px] uppercase tracking-[0.08em] text-ink-600">
                    clarity
                  </p>
                </div>
              </div>

              <div className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <Avatar
                  name={report.author.name}
                  src={report.author.avatarUrl}
                  size={32}
                />
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-ink-100">
                    {report.author.name}
                  </p>
                  <p className="text-[11px] text-ink-500">Reported by</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle as="h2">AI findings</CardTitle>
            <CardDescription>
              <span className="inline-flex items-center gap-1.5">
                <Cpu className="size-3.5" aria-hidden />
                {report.analysis.model} · analysed{" "}
                {formatDate(report.analysis.createdAt)}
              </span>
            </CardDescription>
          </CardHeader>
          <div className="px-5 pb-5 sm:px-6">
            <p className="text-[14px] leading-relaxed text-ink-200">
              {report.analysis.explanation}
            </p>

            {report.analysis.pollutionTags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {report.analysis.pollutionTags.map((tag) => (
                  <Badge key={tag} variant="flux" size="md">
                    {titleCase(tag)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle as="h2">Indicator matrix</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5 sm:px-6">
              <IndicatorBars indicators={report.analysis.indicators} />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Recommendations</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5 sm:px-6">
              <ol className="flex flex-col gap-3">
                {report.analysis.recommendations.map((recommendation, i) => (
                  <li key={recommendation} className="flex gap-3">
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-aqua-400/14 font-mono text-[10.5px] font-semibold text-aqua-200">
                      {i + 1}
                    </span>
                    <span className="text-[13.5px] leading-relaxed text-ink-300">
                      {recommendation}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Card>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-gradient-to-br from-aqua-500/10 to-flux-600/10 p-6 text-center backdrop-blur-xl">
          <h2 className="text-[17px] font-semibold text-ink-50">
            Assess your own water body
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-ink-400">
            One photograph is enough. No sensors, no hardware — the analysis is
            free.
          </p>
          <Button asChild size="lg" className="mt-5">
            <Link href="/signup">Start monitoring</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
