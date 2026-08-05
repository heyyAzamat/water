import type { Metadata } from "next";
import Link from "next/link";
import { Award, Cpu, Database, Gauge, ScanLine, Waves } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { capabilities } from "@/lib/env";
import { listUserReports, userStats } from "@/lib/data/repository";
import { getT } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmptyState, StatTile } from "@/components/shared/primitives";
import { ReportRow } from "@/components/reports/report-card";
import { ProfileSettings } from "@/components/app/profile-settings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.pages.profile.metaTitle,
    description: t.pages.profile.metaDescription,
  };
}

export default async function ProfilePage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (!user) return null;

  const [stats, reports] = await Promise.all([
    userStats(user.id),
    listUserReports(user.id, 8),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Identity */}
      <Card className="overflow-hidden">
        <div
          className="h-28 bg-gradient-to-br from-lume-500/24 via-abyss-900/50 to-flux-600/22"
          aria-hidden
        />
        <div className="-mt-12 flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
          <Avatar
            name={user.name}
            src={user.avatarUrl}
            size={88}
            className="ring-4 ring-abyss-1000"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.4rem] font-semibold tracking-[-0.03em] text-ink-50">
                {user.name}
              </h1>
              {user.role !== "user" && (
                <Badge variant="brand" size="md">
                  {t.roles[user.role]}
                </Badge>
              )}
              {user.isDemo && (
                <Badge variant="neutral" size="md">
                  {t.pages.profile.demoAccount}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-[13.5px] text-ink-500">{user.email}</p>
            {user.bio && (
              <p className="mt-2.5 max-w-xl text-[13.5px] leading-relaxed text-ink-400">
                {user.bio}
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <Button asChild size="sm">
              <Link href="/upload">
                <ScanLine aria-hidden />
                {t.pages.profile.newAnalysis}
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile
          label={t.pages.profile.tileAssessments}
          value={stats.reports}
          hint={fmt(t.pages.profile.tileAssessmentsHint, {
            count: stats.criticalFindings,
          })}
          icon={<ScanLine />}
        />
        <StatTile
          label={t.pages.profile.tileWaterBodies}
          value={stats.locations}
          hint={t.pages.profile.tileWaterBodiesHint}
          icon={<Waves />}
          accent="flux"
          delay={0.06}
        />
        <StatTile
          label={t.pages.profile.tilePoints}
          value={stats.points}
          hint={
            stats.rank
              ? fmt(t.pages.profile.tilePointsHint, { rank: stats.rank })
              : t.pages.profile.tilePointsHintEmpty
          }
          icon={<Award />}
          delay={0.12}
        />
        <StatTile
          label={t.pages.profile.tileSeverity}
          value={stats.reports ? `${stats.averageScore}/100` : "—"}
          hint={
            stats.bestScore !== null
              ? fmt(t.pages.profile.tileSeverityHint, {
                  best: stats.bestScore,
                  worst: stats.worstScore ?? "—",
                })
              : t.pages.profile.tileSeverityHintEmpty
          }
          icon={<Gauge />}
          accent="flux"
          delay={0.18}
        />
      </div>

      {/* Settings */}
      <div id="preferences" className="mt-4 scroll-mt-24">
        <ProfileSettings
          user={{
            id: user.id,
            name: user.name,
            bio: user.bio,
            region: user.region,
            isDemo: user.isDemo,
          }}
        />
      </div>

      {/* Contributions */}
      <Card className="mt-4">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle as="h2">{t.pages.profile.contributionsTitle}</CardTitle>
            <CardDescription>
              {t.pages.profile.contributionsDescription}
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/reports">{t.pages.profile.browseAll}</Link>
          </Button>
        </CardHeader>
        <div className="px-5 pb-5 sm:px-6">
          {reports.length === 0 ? (
            <EmptyState
              icon={<ScanLine />}
              title={t.pages.profile.emptyTitle}
              description={t.pages.profile.emptyDescription}
              action={
                <Button asChild size="sm">
                  <Link href="/upload">{t.pages.profile.emptyAction}</Link>
                </Button>
              }
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

      {/* Deployment info — useful when reviewing or handing the project over */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle as="h2">{t.pages.profile.deploymentTitle}</CardTitle>
          <CardDescription>
            {t.pages.profile.deploymentDescription}
          </CardDescription>
        </CardHeader>
        <dl className="grid grid-cols-1 gap-3 px-5 pb-5 sm:grid-cols-3 sm:px-6">
          <Subsystem
            icon={<Database />}
            label={t.pages.profile.subsystemDatabase}
            value={
              capabilities.database === "supabase"
                ? t.pages.profile.valueSupabase
                : t.pages.profile.valueDemoDataset
            }
            live={capabilities.database === "supabase"}
          />
          <Subsystem
            icon={<Cpu />}
            label={t.pages.profile.subsystemVision}
            value={
              capabilities.vision === "gemini"
                ? t.pages.profile.valueGemini
                : t.pages.profile.valueHeuristic
            }
            live={capabilities.vision === "gemini"}
          />
          <Subsystem
            icon={<Waves />}
            label={t.pages.profile.subsystemStorage}
            value={
              capabilities.storage === "supabase-storage"
                ? t.pages.profile.valueSupabaseStorage
                : t.pages.profile.valueInMemory
            }
            live={capabilities.storage === "supabase-storage"}
          />
        </dl>
        <p className="px-5 pb-5 text-[11.5px] text-ink-600 sm:px-6">
          {t.pages.profile.deploymentNote}
        </p>
      </Card>
    </div>
  );
}

function Subsystem({
  icon,
  label,
  value,
  live,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  live: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3.5">
      <dt className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-600">
        <span className="[&_svg]:size-3.5">{icon}</span>
        {label}
      </dt>
      <dd className="mt-2 flex items-center gap-2">
        <span
          className={
            live
              ? "size-1.5 rounded-full bg-grade-excellent"
              : "size-1.5 rounded-full bg-ink-600"
          }
          aria-hidden
        />
        <span className="text-[12.5px] text-ink-200">{value}</span>
      </dd>
    </div>
  );
}
