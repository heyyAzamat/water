import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AlertTriangle, FileText, ShieldCheck, Users, Waves } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  listProfiles,
  moderationQueue,
  platformStats,
} from "@/lib/data/repository";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { StatTile } from "@/components/shared/primitives";
import { QualityDistributionChart } from "@/components/charts/score-charts";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export const metadata: Metadata = {
  title: "Moderation",
  description: "Review the queue, moderate uploads and manage contributors.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();
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
            <ShieldCheck className="size-5 text-aqua-300" aria-hidden />
            <h1 className="text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
              Moderation panel
            </h1>
          </div>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-400">
            Assessments scoring 90 or above are held for human review before they
            reach the public map — a false critical alert costs more credibility
            than a slow one.
          </p>
        </div>
        <Badge variant="brand" size="lg" className="shrink-0">
          {user.role}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Awaiting review"
          value={pending.length}
          hint="critical-severity holds"
          icon={<AlertTriangle />}
        />
        <StatTile
          label="Flagged"
          value={flagged.length}
          hint="marked by a moderator"
          icon={<ShieldCheck />}
          accent="flux"
          delay={0.06}
        />
        <StatTile
          label="Published"
          value={stats.reports}
          hint={`${stats.criticalCount} critical on the map`}
          icon={<FileText />}
          delay={0.12}
        />
        <StatTile
          label="Contributors"
          value={stats.contributors}
          hint={`${stats.locations} water bodies`}
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
              <CardTitle as="h2">Network distribution</CardTitle>
              <CardDescription>
                Grade spread across all analysed images.
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
              <CardTitle as="h2">Contributors</CardTitle>
              <CardDescription>
                {profiles.length} accounts, ranked by contribution points.
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
                        {profile.points} points
                      </span>
                    </span>
                    {profile.role !== "user" ? (
                      <Badge variant="brand" size="sm">
                        {profile.role}
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        user
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Coverage</CardTitle>
            </CardHeader>
            <dl className="grid grid-cols-2 gap-3 px-5 pb-5 sm:px-6">
              <Metric icon={<Waves />} label="Water bodies" value={stats.locations} />
              <Metric icon={<FileText />} label="Countries" value={stats.countries} />
              <Metric
                icon={<AlertTriangle />}
                label="Mean severity"
                value={`${stats.averageScore}/100`}
              />
              <Metric
                icon={<FileText />}
                label="Images analysed"
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
