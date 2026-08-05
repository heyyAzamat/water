import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, FileText, ShieldCheck, Users, Waves } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  listProfiles,
  moderationQueue,
  platformStats,
} from "@/lib/data/repository";
import { getT } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { StatTile } from "@/components/shared/primitives";
import { QualityDistributionChart } from "@/components/charts/score-charts";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.pages.admin.metaTitle,
    description: t.pages.admin.metaDescription,
  };
}

export default async function AdminPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (!user) redirect("/login");

  // Route-level authorisation. The API routes check this independently, so a
  // crafted request cannot bypass it by skipping the page.
  if (user.role !== "admin" && user.role !== "moderator") {
    redirect("/dashboard");
  }

  const [queue, stats, profiles] = await Promise.all([
    moderationQueue(60),
    platformStats(),
    listProfiles(40),
  ]);

  const pending = queue.filter((r) => r.status === "pending");
  const flagged = queue.filter((r) => r.status === "flagged");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-lume-300" aria-hidden />
            <h1 className="text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
              {t.pages.admin.title}
            </h1>
          </div>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-400">
            {t.pages.admin.description}
          </p>
        </div>
        <Badge variant="brand" size="lg" className="shrink-0">
          {t.roles[user.role]}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label={t.pages.admin.tilePending}
          value={pending.length}
          hint={t.pages.admin.tilePendingHint}
          icon={<AlertTriangle />}
        />
        <StatTile
          label={t.pages.admin.tileFlagged}
          value={flagged.length}
          hint={t.pages.admin.tileFlaggedHint}
          icon={<ShieldCheck />}
          accent="flux"
          delay={0.06}
        />
        <StatTile
          label={t.pages.admin.tilePublished}
          value={stats.reports}
          hint={fmt(t.pages.admin.tilePublishedHint, {
            count: stats.criticalCount,
          })}
          icon={<FileText />}
          delay={0.12}
        />
        <StatTile
          label={t.pages.admin.tileContributors}
          value={stats.contributors}
          hint={fmt(t.pages.admin.tileContributorsHint, {
            count: stats.locations,
          })}
          icon={<Users />}
          accent="flux"
          delay={0.18}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <ModerationQueue reports={queue} />

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle as="h2">{t.pages.admin.distributionTitle}</CardTitle>
              <CardDescription>
                {t.pages.admin.distributionDescription}
              </CardDescription>
            </CardHeader>
            <div className="px-3 pb-5 sm:px-4">
              <QualityDistributionChart
                breakdown={stats.qualityBreakdown}
                height={200}
              />
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">{t.pages.admin.contributorsTitle}</CardTitle>
              <CardDescription>
                {fmt(t.pages.admin.contributorsDescription, {
                  count: profiles.length,
                })}
              </CardDescription>
            </CardHeader>
            <div className="max-h-100 overflow-y-auto px-5 pb-5 sm:px-6">
              <ul className="flex flex-col gap-2">
                {profiles.map((profile) => (
                  <li
                    key={profile.id}
                    className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-2.5"
                  >
                    <Avatar
                      name={profile.name}
                      src={profile.avatarUrl}
                      size={30}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink-100">
                        {profile.name}
                      </span>
                      <span className="block text-[11px] text-ink-500">
                        {fmt(t.pages.admin.contributorPoints, {
                          count: profile.points,
                        })}
                      </span>
                    </span>
                    {profile.role !== "user" ? (
                      <Badge variant="brand" size="sm">
                        {t.roles[profile.role]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        {t.roles.user}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">{t.pages.admin.coverageTitle}</CardTitle>
            </CardHeader>
            <dl className="grid grid-cols-2 gap-3 px-5 pb-5 sm:px-6">
              <Metric
                icon={<Waves />}
                label={t.pages.admin.coverageWaterBodies}
                value={stats.locations}
              />
              <Metric
                icon={<FileText />}
                label={t.pages.admin.coverageCountries}
                value={stats.countries}
              />
              <Metric
                icon={<AlertTriangle />}
                label={t.pages.admin.coverageSeverity}
                value={`${stats.averageScore}/100`}
              />
              <Metric
                icon={<FileText />}
                label={t.pages.admin.coverageImages}
                value={stats.analysedImages}
              />
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3">
      <dt className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink-600">
        <span className="[&_svg]:size-3">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1.5 text-[17px] font-semibold tabular-nums text-ink-50">
        {value}
      </dd>
    </div>
  );
}
