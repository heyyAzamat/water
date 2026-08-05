import type { Metadata } from "next";
import Link from "next/link";
import { Award, Cpu, Database, Gauge, ScanLine, Waves } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { capabilities } from "@/lib/env";
import { listUserReports, userStats } from "@/lib/data/repository";
import { formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmptyState, StatTile } from "@/components/shared/primitives";
import { ReportRow } from "@/components/reports/report-card";
import { ProfileSettings } from "@/components/app/profile-settings";

export const metadata: Metadata = {
  title: "Profile & settings",
  description: "Your contributor profile, statistics and notification settings.",
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
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
          className="h-28 bg-gradient-to-br from-aqua-500/22 via-ink-900/40 to-flux-600/22"
          aria-hidden
        />
        <div className="-mt-12 flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
          <Avatar
            name={user.name}
            src={user.avatarUrl}
            size={88}
            className="ring-4 ring-ink-950"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.4rem] font-semibold tracking-[-0.03em] text-ink-50">
                {user.name}
              </h1>
              {user.role !== "user" && (
                <Badge variant="brand" size="md">
                  {user.role}
                </Badge>
              )}
              {user.isDemo && (
                <Badge variant="neutral" size="md">
                  demo account
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
                New analysis
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Assessments"
          value={stats.reports}
          hint={`${stats.criticalFindings} critical`}
          icon={<ScanLine />}
        />
        <StatTile
          label="Water bodies"
          value={stats.locations}
          hint="documented"
          icon={<Waves />}
          accent="flux"
          delay={0.06}
        />
        <StatTile
          label="Points"
          value={stats.points}
          hint={stats.rank ? `rank #${stats.rank}` : "unranked"}
          icon={<Award />}
          delay={0.12}
        />
        <StatTile
          label="Mean severity"
          value={stats.reports ? `${stats.averageScore}/100` : "—"}
          hint={
            stats.bestScore !== null
              ? `best ${stats.bestScore} · worst ${stats.worstScore}`
              : "no data yet"
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
            <CardTitle as="h2">Your assessments</CardTitle>
            <CardDescription>
              Everything you have published, most recent first.
            </CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/reports">Browse all</Link>
          </Button>
        </CardHeader>
        <div className="px-5 pb-5 sm:px-6">
          {reports.length === 0 ? (
            <EmptyState
              icon={<ScanLine />}
              title="No assessments yet"
              description="Upload a photograph of any river, lake or reservoir to publish your first one."
              action={
                <Button asChild size="sm">
                  <Link href="/upload">Start an analysis</Link>
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
          <CardTitle as="h2">Deployment</CardTitle>
          <CardDescription>
            Which subsystems this instance is currently running.
          </CardDescription>
        </CardHeader>
        <dl className="grid gap-3 px-5 pb-5 sm:grid-cols-3 sm:px-6">
          <Subsystem
            icon={<Database />}
            label="Database"
            value={capabilities.database === "supabase" ? "Supabase Postgres" : "Bundled demo dataset"}
            live={capabilities.database === "supabase"}
          />
          <Subsystem
            icon={<Cpu />}
            label="Vision"
            value={capabilities.vision === "gemini" ? "Gemini Vision" : "Colourimetric heuristic"}
            live={capabilities.vision === "gemini"}
          />
          <Subsystem
            icon={<Waves />}
            label="Storage"
            value={
              capabilities.storage === "supabase-storage"
                ? "Supabase Storage"
                : "In-memory (session only)"
            }
            live={capabilities.storage === "supabase-storage"}
          />
        </dl>
        <p className="px-5 pb-5 text-[11.5px] text-ink-600 sm:px-6">
          Member since {formatDate(new Date())} · configure keys in{" "}
          <code className="font-mono text-[11px] text-ink-500">.env.local</code> to
          switch any subsystem to production mode.
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
