import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Cpu,
  Eye,
  Gauge,
  MapPin,
  MessageSquare,
  Ruler,
  Sparkles,
  TrendingUp,
  Waves,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getLocationTrend,
  getReport,
  listComments,
  nearbyReports,
} from "@/lib/data/repository";
import { env } from "@/lib/env";
import { gradeForScore } from "@/lib/ai/scoring";
import { TREND_META } from "@/lib/ai/trend";
import { cn, formatCoords, formatDate } from "@/lib/utils";
import { getI18n, getT } from "@/lib/i18n/server";
import { fmt, intlLocale } from "@/lib/i18n/format";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, Separator } from "@/components/ui/misc";
import { QualityBadge, TrendPill } from "@/components/shared/primitives";
import { ScoreRing } from "@/components/shared/score-ring";
import { IndicatorBars, TrendChart } from "@/components/charts/score-charts";
import { ReportActions, ShareLinkBox } from "@/components/reports/report-actions";
import { CommentThread } from "@/components/reports/comment-thread";
import { ReportRow } from "@/components/reports/report-card";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);

  if (!report) return { title: (await getT()).ui.report.notFound };

  const place = report.location?.name ?? (await getT()).ui.unmappedLocation;

  return {
    title: report.title,
    description: `${place} — pollution severity ${report.analysis.pollutionScore}/100 (${report.analysis.waterQuality}). ${report.analysis.explanation.slice(0, 150)}`,
    openGraph: {
      title: `${report.title} · ${report.analysis.pollutionScore}/100`,
      description: report.analysis.explanation.slice(0, 200),
      images: report.imageUrl.startsWith("http") ? [report.imageUrl] : undefined,
    },
  };
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [report, user, { locale, t }] = await Promise.all([
    getReport(id),
    getCurrentUser(),
    getI18n(),
  ]);
  const dateLocale = intlLocale(locale);

  if (!report) notFound();

  const isOwner = user?.id === report.author.id;
  const isStaff = user?.role === "admin" || user?.role === "moderator";

  // Non-public or unapproved reports are only visible to the author and staff.
  if ((report.status !== "approved" || !report.isPublic) && !isOwner && !isStaff) {
    notFound();
  }

  const [comments, trend, nearby] = await Promise.all([
    listComments(report.id),
    report.location
      ? getLocationTrend(report.location.id)
      : Promise.resolve(null),
    nearbyReports(
      { lat: report.lat, lng: report.lng },
      env.NEARBY_RADIUS_KM,
      report.id,
    ),
  ]);

  const grade = gradeForScore(report.analysis.pollutionScore);
  const captured = report.capturedAt ?? report.createdAt;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="no-print">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 transition-colors hover:text-ink-200"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          {t.ui.report.allReports}
        </Link>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <QualityBadge
              quality={report.analysis.waterQuality}
              score={report.analysis.pollutionScore}
            />
            {report.status !== "approved" && (
              <Badge
                variant={report.status === "flagged" ? "critical" : "neutral"}
                size="md"
              >
                {fmt(t.ui.report.moderationSuffix, {
                  status: t.domain.status[report.status],
                })}
              </Badge>
            )}
            {trend && trend.direction !== "unknown" && (
              <TrendPill direction={trend.direction} delta={trend.delta} />
            )}
          </div>

          <h1 className="mt-3 text-balance text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.035em] text-ink-50">
            {report.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px] text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden />
              {report.location?.name ?? t.ui.unmappedLocation}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden />
              {formatDate(captured, true, dateLocale)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-3.5" aria-hidden />
              {fmt(t.ui.report.views, { count: report.viewCount })}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="size-3.5" aria-hidden />
              {fmt(t.ui.report.comments, { count: comments.length })}
            </span>
          </div>
        </div>

        <ReportActions
          reportId={report.id}
          shareToken={report.shareToken}
          title={report.title}
          canModerate={Boolean(isStaff)}
          canDelete={Boolean(isOwner || isStaff)}
          status={report.status}
        />
      </div>

      {/* Printable document */}
      <div id="report-document" className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr] [&>*]:min-w-0">
          {/* Photograph */}
          <Card className="overflow-hidden print-surface print-break">
            <div className="relative aspect-[4/3] bg-abyss-1000">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.imageUrl}
                alt={fmt(t.ui.report.photoAlt, {
                  place: report.location?.name ?? t.ui.report.unmappedPlace,
                  date: formatDate(captured, false, dateLocale),
                })}
                className="size-full object-cover"
              />
              <div
                className="absolute inset-x-0 bottom-0 h-1"
                style={{ background: grade.hex }}
                aria-hidden
              />
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 sm:grid-cols-4">
              <Fact
                icon={<MapPin />}
                label={t.ui.report.factCoordinates}
                value={formatCoords(report.lat, report.lng)}
                mono
              />
              <Fact
                icon={<Waves />}
                label={t.ui.report.factWaterBody}
                value={
                  report.location
                    ? t.domain.waterBody[report.location.type]
                    : t.ui.report.factUnknown
                }
              />
              <Fact
                icon={<Gauge />}
                label={t.ui.report.factConfidence}
                value={`${report.analysis.confidence}%`}
              />
              <Fact
                icon={<Ruler />}
                label={t.ui.report.factClarity}
                value={`${report.analysis.clarityScore}/100`}
              />
            </dl>
          </Card>

          {/* Score */}
          <Card className="print-surface print-break">
            <div className="flex flex-col items-center gap-4 p-6">
              <ScoreRing score={report.analysis.pollutionScore} size={182} />

              <p className="text-center text-[13.5px] leading-relaxed text-ink-400">
                {t.grades[grade.quality].blurb}
              </p>

              <Separator />

              <div className="grid w-full grid-cols-2 gap-4">
                <MiniStat
                  label={t.ui.report.statModel}
                  value={report.analysis.model}
                  icon={<Cpu />}
                />
                <MiniStat
                  label={t.ui.report.statAnalysed}
                  value={formatDate(report.analysis.createdAt, false, dateLocale)}
                  icon={<Sparkles />}
                />
              </div>

              <div className="flex w-full items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <Avatar
                  name={report.author.name}
                  src={report.author.avatarUrl}
                  size={34}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink-100">
                    {report.author.name}
                  </p>
                  <p className="text-[11.5px] text-ink-500">
                    {report.author.points} contribution points
                  </p>
                </div>
                {report.author.role !== "user" && (
                  <Badge variant="brand" size="sm">
                    {report.author.role}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Findings */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
          <div className="flex flex-col gap-4">
            <Card className="print-surface print-break">
              <CardHeader>
                <CardTitle as="h2">{t.ui.report.findingsTitle}</CardTitle>
                <CardDescription>{t.ui.report.findingsBody}</CardDescription>
              </CardHeader>
              <div className="px-5 pb-5 sm:px-6">
                <p className="text-[14px] leading-relaxed text-ink-200">
                  {report.analysis.explanation}
                </p>

                {report.analysis.detectedObjects.length > 0 && (
                  <>
                    <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-600">
                      {t.ui.report.detectedObjects}
                    </h3>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {report.analysis.detectedObjects.map((object) => (
                        <Badge key={object} variant="outline" size="md">
                          {object}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}

                {report.analysis.pollutionTags.length > 0 && (
                  <>
                    <h3 className="mt-5 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-600">
                      {t.ui.report.pollutionTypes}
                    </h3>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {report.analysis.pollutionTags.map((tag) => (
                        <Badge key={tag} variant="flux" size="md">
                          {t.domain.indicators[tag].label}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Card>

            <Card className="print-surface print-break">
              <CardHeader>
                <CardTitle as="h2">{t.ui.report.indicatorsTitle}</CardTitle>
                <CardDescription>{t.ui.report.indicatorsBody}</CardDescription>
              </CardHeader>
              <div className="px-5 pb-5 sm:px-6">
                <IndicatorBars indicators={report.analysis.indicators} />
              </div>
            </Card>

            {report.description && (
              <Card className="print-surface print-break">
                <CardHeader>
                  <CardTitle as="h2">{t.ui.report.fieldNoteTitle}</CardTitle>
                  <CardDescription>{t.ui.report.fieldNoteBody}</CardDescription>
                </CardHeader>
                <div className="px-5 pb-5 sm:px-6">
                  <blockquote className="border-l-2 border-lume-400/40 pl-4 text-[14px] italic leading-relaxed text-ink-300">
                    {report.description}
                  </blockquote>
                </div>
              </Card>
            )}

            {report.observations.length > 0 && (
              <Card className="print-surface print-break">
                <CardHeader>
                  <CardTitle as="h2">{t.ui.report.observationsTitle}</CardTitle>
                  <CardDescription>
                    {t.ui.report.observationsBody}
                  </CardDescription>
                </CardHeader>
                <div className="px-5 pb-5 sm:px-6">
                  <div className="flex flex-wrap gap-2">
                    {report.observations.map((observation) => (
                      <Badge key={observation} variant="moderate" size="lg">
                        {t.domain.observations[observation]}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Card className="print-surface print-break">
              <CardHeader>
                <CardTitle as="h2">
                  {t.ui.report.recommendationsTitle}
                </CardTitle>
                <CardDescription>
                  {t.ui.report.recommendationsBody}
                </CardDescription>
              </CardHeader>
              <div className="px-5 pb-5 sm:px-6">
                <ol className="flex flex-col gap-3">
                  {report.analysis.recommendations.map((recommendation, i) => (
                    <li key={recommendation} className="flex gap-3">
                      <span className="grid size-5 shrink-0 place-items-center rounded-md bg-lume-400/16 font-mono text-[10.5px] font-semibold text-lume-200">
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

            {trend && (
              <Card className="print-surface print-break">
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <CardTitle as="h2">{t.ui.report.trendTitle}</CardTitle>
                    <CardDescription>
                      {fmt(t.ui.report.trendBody, { count: trend.sampleSize })}
                    </CardDescription>
                  </div>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1 text-[11.5px] font-medium",
                      TREND_META[trend.direction].bg,
                      TREND_META[trend.direction].text,
                    )}
                  >
                    <TrendingUp className="size-3.5" aria-hidden />
                    {t.trend[trend.direction]}
                  </span>
                </CardHeader>

                <div className="px-3 pb-2 sm:px-4">
                  <TrendChart trend={trend} height={220} />
                </div>

                <div className="px-5 pb-5 sm:px-6">
                  <p className="text-[13px] leading-relaxed text-ink-400">
                    {trend.summary}
                  </p>

                  {trend.sampleSize >= 2 && (
                    <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/8 pt-4">
                      <MiniStat
                        label={t.ui.report.trendFirst}
                        value={`${trend.firstScore}/100`}
                      />
                      <MiniStat
                        label={t.ui.report.trendLatest}
                        value={`${trend.latestScore}/100`}
                      />
                      <MiniStat
                        label={t.ui.report.trendProjected}
                        value={
                          trend.projectedScore !== null
                            ? `${trend.projectedScore}/100`
                            : "—"
                        }
                      />
                    </dl>
                  )}

                  {trend.sampleSize >= 3 && (
                    <p className="mt-3 font-mono text-[11px] text-ink-600">
                      slope {trend.slopePerDay > 0 ? "+" : ""}
                      {trend.slopePerDay}/day · fit r² {trend.reliability} · span{" "}
                      {trend.spanDays}d
                    </p>
                  )}
                </div>
              </Card>
            )}

            <Card className="no-print">
              <CardHeader>
                <CardTitle as="h2">{t.ui.report.shareTitle}</CardTitle>
                <CardDescription>{t.ui.report.shareBody}</CardDescription>
              </CardHeader>
              <div className="px-5 pb-5 sm:px-6">
                <ShareLinkBox shareToken={report.shareToken} />
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Nearby */}
      {nearby.length > 0 && (
        <Card className="mt-4 no-print">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle as="h2">{t.ui.report.nearbyTitle}</CardTitle>
              <CardDescription>
                {fmt(t.ui.report.nearbyBody, { km: env.NEARBY_RADIUS_KM })}
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/map">
                {t.ui.report.openMap}
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <div className="px-5 pb-5 sm:px-6">
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {nearby.slice(0, 6).map((entry) => (
                // `min-w-0` or the row's flex content sets a min-content
                // width wider than the grid track and pushes the page sideways.
                <li key={entry.id} className="relative min-w-0">
                  <ReportRow report={entry} />
                  <span className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 font-mono text-[10.5px] text-ink-600">
                    {entry.distanceKm.toFixed(1)} km
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Discussion */}
      <Card className="mt-4 no-print">
        <CardHeader>
          <CardTitle as="h2">{t.ui.report.discussionTitle}</CardTitle>
          <CardDescription>{t.ui.report.discussionBody}</CardDescription>
        </CardHeader>
        <div className="px-5 pb-6 sm:px-6">
          <CommentThread
            reportId={report.id}
            initialComments={comments}
            currentUser={
              user
                ? {
                    id: user.id,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                    role: user.role,
                    points: user.points,
                  }
                : null
            }
          />
        </div>
      </Card>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-600">
        <span className="[&_svg]:size-3">{icon}</span>
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-[12.5px] text-ink-200",
          mono && "font-mono text-[11.5px]",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-600">
        {icon && <span className="[&_svg]:size-3">{icon}</span>}
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-[12.5px] font-medium text-ink-200">
        {value}
      </dd>
    </div>
  );
}
