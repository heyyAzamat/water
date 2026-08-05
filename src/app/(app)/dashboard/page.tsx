import type { Metadata } from "next";
import Link from "next/link";
import {
  Award,
  Droplet,
  Flame,
  Gauge,
  Map as MapIcon,
  ScanLine,
  Shield,
  Siren,
  Trophy,
  TrendingUp,
  Waves,
} from "lucide-react";
import type { Achievement } from "@/types";
import { getCurrentUser } from "@/lib/auth";
import {
  buildAchievements,
  leaderboardEntries,
  listUserReports,
  platformStats,
  userStats,
  worstLocations,
} from "@/lib/data/repository";
import { gradeForScore } from "@/lib/ai/scoring";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import {
  EmptyState,
  QualityBadge,
  ScoreChip,
  StatTile,
  TrendPill,
} from "@/components/shared/primitives";
import { ScoreRing } from "@/components/shared/score-ring";
import { ReportRow } from "@/components/reports/report-card";
import {
  QualityDistributionChart,
  ScoreHistoryChart,
} from "@/components/charts/score-charts";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your assessments, statistics, score history and achievements.",
};

const ACHIEVEMENT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  droplet: Droplet,
  scan: ScanLine,
  shield: Shield,
  map: MapIcon,
  siren: Siren,
  flame: Flame,
  award: Award,
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [reports, stats, platform, leaderboard, hotspots] = await Promise.all([
    listUserReports(user.id, 6),
    userStats(user.id),
    platformStats(),
    leaderboardEntries(5),
    worstLocations(4),
  ]);

  const achievements = buildAchievements(stats);
  const unlocked = achievements.filter((a) => a.unlocked).length;

  const history = [...reports]
    .sort(
      (a, b) =>
        new Date(a.capturedAt ?? a.createdAt).getTime() -
        new Date(b.capturedAt ?? b.createdAt).getTime(),
    )
    .map((report) => ({
      date: report.capturedAt ?? report.createdAt,
      score: report.analysis.pollutionScore,
    }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Greeting */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[12.5px] font-medium uppercase tracking-[0.1em] text-ink-500">
            {formatDate(new Date())}
          </p>
          <h1 className="mt-1.5 text-[1.75rem] font-semibold tracking-[-0.035em] text-ink-50">
            Welcome back, {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1.5 text-[14px] text-ink-400">
            {stats.reports === 0
              ? "You haven't published an assessment yet — your first one becomes a location's baseline."
              : `You've published ${stats.reports} assessment${stats.reports === 1 ? "" : "s"} across ${stats.locations} water bod${stats.locations === 1 ? "y" : "ies"}.`}
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild>
            <Link href="/upload">
              <ScanLine aria-hidden />
              New analysis
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/map">
              <MapIcon aria-hidden />
              Map
            </Link>
          </Button>
        </div>
      </div>

      {/* Personal statistics */}
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Assessments"
          value={stats.reports}
          hint={`${stats.criticalFindings} critical finding${stats.criticalFindings === 1 ? "" : "s"}`}
          icon={<ScanLine />}
          delay={0}
        />
        <StatTile
          label="Water bodies"
          value={stats.locations}
          hint="distinct locations documented"
          icon={<Waves />}
          accent="flux"
          delay={0.06}
        />
        <StatTile
          label="Contribution points"
          value={stats.points}
          hint={stats.rank ? `Rank #${stats.rank} network-wide` : "Publish to enter the ranking"}
          icon={<Trophy />}
          delay={0.12}
        />
        <StatTile
          label="Mean severity"
          value={
            stats.reports > 0 ? (
              <span className="flex items-baseline gap-2">
                {stats.averageScore}
                <span className="text-sm font-normal text-ink-600">/100</span>
              </span>
            ) : (
              "—"
            )
          }
          hint={
            stats.bestScore !== null
              ? `best ${stats.bestScore} · worst ${stats.worstScore}`
              : "across your uploads"
          }
          icon={<Gauge />}
          accent="flux"
          delay={0.18}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Score history */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div>
              <CardTitle as="h2">Your pollution score history</CardTitle>
              <CardDescription>
                Severity of every assessment you have published, oldest first.
              </CardDescription>
            </div>
            {history.length >= 2 && (
              <TrendPill
                direction={
                  history[history.length - 1].score < history[0].score
                    ? "improving"
                    : history[history.length - 1].score > history[0].score
                      ? "worsening"
                      : "stable"
                }
                delta={history[history.length - 1].score - history[0].score}
                size="sm"
              />
            )}
          </CardHeader>
          <div className="px-3 pb-5 sm:px-4">
            <ScoreHistoryChart points={history} height={228} />
          </div>
        </Card>

        {/* Latest assessment */}
        <Card>
          <CardHeader>
            <CardTitle as="h2">Latest assessment</CardTitle>
            <CardDescription>Most recent AI verdict on your uploads.</CardDescription>
          </CardHeader>
          <div className="flex flex-col items-center px-5 pb-6">
            {reports[0] ? (
              <>
                <ScoreRing score={reports[0].analysis.pollutionScore} size={152} />
                <p className="mt-4 text-center text-[13.5px] font-medium text-ink-100">
                  {reports[0].location?.name ?? reports[0].title}
                </p>
                <p className="mt-1 text-center text-[12px] text-ink-500">
                  Confidence {reports[0].analysis.confidence}% ·{" "}
                  {formatDate(reports[0].capturedAt ?? reports[0].createdAt)}
                </p>
                <Button asChild variant="secondary" size="sm" className="mt-4">
                  <Link href={`/reports/${reports[0].id}`}>Open full report</Link>
                </Button>
              </>
            ) : (
              <EmptyState
                icon={<ScanLine />}
                title="No assessments yet"
                description="Upload a photograph of any water body to get your first score."
                action={
                  <Button asChild size="sm">
                    <Link href="/upload">Analyse a photograph</Link>
                  </Button>
                }
                className="border-0 bg-transparent py-6"
              />
            )}
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Recent uploads */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle as="h2">Recent uploads</CardTitle>
              <CardDescription>Your last six published assessments.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/reports">View all</Link>
            </Button>
          </CardHeader>
          <div className="px-5 pb-5 sm:px-6">
            {reports.length === 0 ? (
              <EmptyState
                icon={<ScanLine />}
                title="Nothing uploaded yet"
                description="Your uploads will appear here with their AI score the moment they are analysed."
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {reports.map((report) => (
                  <li key={report.id}>
                    <ReportRow report={report} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle as="h2">Leaderboard</CardTitle>
              <CardDescription>Top contributors this cycle.</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/leaderboard">All</Link>
            </Button>
          </CardHeader>
          <div className="px-5 pb-5 sm:px-6">
            <ol className="flex flex-col gap-2.5">
              {leaderboard.map((entry) => {
                const isMe = entry.user.id === user.id;
                return (
                  <li
                    key={entry.user.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
                      isMe
                        ? "border-aqua-400/30 bg-aqua-400/8"
                        : "border-white/8 bg-white/[0.025]",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-lg text-[11px] font-bold",
                        entry.rank === 1
                          ? "bg-grade-moderate/22 text-grade-moderate"
                          : entry.rank === 2
                            ? "bg-white/12 text-ink-200"
                            : entry.rank === 3
                              ? "bg-grade-poor/18 text-grade-poor"
                              : "bg-white/6 text-ink-500",
                      )}
                    >
                      {entry.rank}
                    </span>
                    <Avatar
                      name={entry.user.name}
                      src={entry.user.avatarUrl}
                      size={26}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-ink-100">
                        {entry.user.name}
                        {isMe && (
                          <span className="ml-1.5 text-[10.5px] text-aqua-300">
                            you
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-ink-500">
                        {entry.reports} reports
                      </span>
                    </span>
                    <span className="shrink-0 text-[12.5px] font-semibold tabular-nums text-ink-200">
                      {entry.points}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Achievements */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle as="h2">Achievements</CardTitle>
              <CardDescription>
                {unlocked} of {achievements.length} unlocked.
              </CardDescription>
            </div>
            <Badge variant="brand" size="sm">
              <Trophy />
              {stats.points} pts
            </Badge>
          </CardHeader>
          <div className="grid gap-3 px-5 pb-5 sm:grid-cols-2 sm:px-6">
            {achievements.map((achievement) => (
              <AchievementTile key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </Card>

        {/* Network hotspots */}
        <Card>
          <CardHeader>
            <CardTitle as="h2">Network hotspots</CardTitle>
            <CardDescription>
              Highest-severity locations right now.
            </CardDescription>
          </CardHeader>
          <div className="px-5 pb-5 sm:px-6">
            <ul className="flex flex-col gap-3">
              {hotspots.map((hotspot) => (
                <li key={hotspot.location.id}>
                  <Link
                    href={`/reports?locationId=${hotspot.location.id}`}
                    className="block rounded-xl border border-white/8 bg-white/[0.025] p-3 transition-colors hover:border-white/16 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12.5px] font-medium leading-snug text-ink-100">
                        {hotspot.location.name}
                      </span>
                      <ScoreChip score={hotspot.latestScore} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <TrendPill
                        direction={hotspot.trend.direction}
                        delta={hotspot.trend.delta}
                        size="sm"
                      />
                      <span className="text-[11px] text-ink-600">
                        {hotspot.reportCount} reports
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      {/* Network distribution */}
      <Card className="mt-4">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle as="h2">Network grade distribution</CardTitle>
            <CardDescription>
              How all {platform.reports} published assessments fall across the
              severity bands.
            </CardDescription>
          </div>
          <QualityBadge quality={gradeForScore(platform.averageScore).quality} score={platform.averageScore} />
        </CardHeader>
        <div className="px-3 pb-5 sm:px-4">
          <QualityDistributionChart breakdown={platform.qualityBreakdown} height={220} />
        </div>
      </Card>
    </div>
  );
}

function AchievementTile({ achievement }: { achievement: Achievement }) {
  const Icon = ACHIEVEMENT_ICONS[achievement.icon] ?? Award;
  const pct = Math.round((achievement.progress / achievement.target) * 100);

  const tierColor = {
    bronze: "#d08a5a",
    silver: "#c8d0dc",
    gold: "#f0c05a",
    platinum: "#8fd4e0",
  }[achievement.tier];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-3.5 transition-colors",
        achievement.unlocked
          ? "border-white/14 bg-white/[0.055]"
          : "border-white/8 bg-white/[0.02]",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-lg border"
          style={{
            borderColor: achievement.unlocked ? `${tierColor}55` : "oklch(1 0 0 / .08)",
            background: achievement.unlocked ? `${tierColor}1f` : "oklch(1 0 0 / .04)",
            color: achievement.unlocked ? tierColor : "oklch(0.42 0.02 258)",
          }}
        >
          <Icon className="size-[17px]" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-[13px] font-semibold",
              achievement.unlocked ? "text-ink-50" : "text-ink-300",
            )}
          >
            {achievement.name}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-ink-500">
            {achievement.description}
          </p>

          <div className="mt-2.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: achievement.unlocked ? tierColor : "oklch(0.42 0.02 258)",
                }}
              />
            </div>
            <span className="shrink-0 font-mono text-[10.5px] text-ink-600">
              {achievement.progress}/{achievement.target}
            </span>
          </div>
        </div>
      </div>

      {achievement.unlocked && (
        <TrendingUp
          className="absolute -right-3 -top-3 size-14 opacity-[0.06]"
          style={{ color: tierColor }}
          aria-hidden
        />
      )}
    </div>
  );
}
