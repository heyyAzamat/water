import type { Metadata } from "next";
import { Award, Medal, Trophy } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { leaderboardEntries, platformStats } from "@/lib/data/repository";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { ScoreChip, StatTile } from "@/components/shared/primitives";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top contributors monitoring water bodies across the network.",
};

export default async function LeaderboardPage() {
  const [entries, stats, user] = await Promise.all([
    leaderboardEntries(50),
    platformStats(),
    getCurrentUser(),
  ]);

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3);
  const me = entries.find((e) => e.user.id === user?.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
          Contributor leaderboard
        </h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-ink-400">
          Points reward finding what matters: a base award per published
          assessment plus a bonus scaled to the severity discovered. Documenting
          a critical site is worth more than a clean one.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Contributors"
          value={stats.contributors}
          hint="publishing assessments"
          icon={<Trophy />}
        />
        <StatTile
          label="Assessments"
          value={stats.reports}
          hint={`${stats.locations} water bodies covered`}
          icon={<Award />}
          accent="flux"
          delay={0.06}
        />
        <StatTile
          label="Your rank"
          value={me ? `#${me.rank}` : "—"}
          hint={me ? `${me.points} points` : "Publish to enter the ranking"}
          icon={<Medal />}
          delay={0.12}
        />
      </div>

      {/* Podium */}
      {podium.length === 3 && (
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[podium[1], podium[0], podium[2]].map((entry) => {
            const isFirst = entry.rank === 1;
            const tint =
              entry.rank === 1
                ? "#f0c05a"
                : entry.rank === 2
                  ? "#c8d0dc"
                  : "#d08a5a";

            return (
              <Card
                key={entry.user.id}
                className={cn(
                  "relative overflow-hidden",
                  isFirst && "sm:-mt-3 sm:mb-3",
                )}
                style={{ borderColor: `${tint}33` }}
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full blur-3xl"
                  style={{ background: `${tint}22` }}
                  aria-hidden
                />
                <div className="relative flex flex-col items-center p-6">
                  <span
                    className="grid size-8 place-items-center rounded-xl border text-[13px] font-bold"
                    style={{
                      borderColor: `${tint}55`,
                      background: `${tint}1f`,
                      color: tint,
                    }}
                  >
                    {entry.rank}
                  </span>

                  <Avatar
                    name={entry.user.name}
                    src={entry.user.avatarUrl}
                    size={isFirst ? 66 : 56}
                    className="mt-3"
                  />

                  <p className="mt-3 text-center text-[14px] font-semibold text-ink-50">
                    {entry.user.name}
                  </p>
                  {entry.user.id === user?.id && (
                    <Badge variant="brand" size="sm" className="mt-1.5">
                      you
                    </Badge>
                  )}

                  <p
                    className="mt-2.5 text-[26px] font-semibold leading-none tracking-[-0.03em]"
                    style={{ color: tint }}
                  >
                    {entry.points}
                  </p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-ink-600">
                    points
                  </p>

                  <dl className="mt-4 flex w-full items-center justify-around border-t border-white/8 pt-3.5 text-center">
                    <div>
                      <dd className="text-[14px] font-semibold text-ink-100">
                        {entry.reports}
                      </dd>
                      <dt className="text-[10.5px] text-ink-600">reports</dt>
                    </div>
                    <div>
                      <dd className="text-[14px] font-semibold text-ink-100">
                        {entry.regions}
                      </dd>
                      <dt className="text-[10.5px] text-ink-600">regions</dt>
                    </div>
                    <div>
                      <dd className="text-[14px] font-semibold text-ink-100">
                        {entry.averageScore}
                      </dd>
                      <dt className="text-[10.5px] text-ink-600">avg severity</dt>
                    </div>
                  </dl>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle as="h2">Full ranking</CardTitle>
          <CardDescription>
            Ordered by contribution points, then by number of assessments.
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto px-2 pb-4 sm:px-4">
          <table className="w-full min-w-140 border-collapse">
            <caption className="sr-only">
              Contributor leaderboard ranked by points
            </caption>
            <thead>
              <tr className="border-b border-white/8 text-left">
                <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">
                  #
                </th>
                <th scope="col" className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">
                  Contributor
                </th>
                <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">
                  Reports
                </th>
                <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">
                  Regions
                </th>
                <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">
                  Avg severity
                </th>
                <th scope="col" className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-600">
                  Points
                </th>
              </tr>
            </thead>
            <tbody>
              {(rest.length ? rest : entries).map((entry) => {
                const isMe = entry.user.id === user?.id;
                return (
                  <tr
                    key={entry.user.id}
                    className={cn(
                      "border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]",
                      isMe && "bg-aqua-400/6",
                    )}
                  >
                    <td className="px-3 py-3 text-[13px] font-medium tabular-nums text-ink-400">
                      {entry.rank}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={entry.user.name}
                          src={entry.user.avatarUrl}
                          size={28}
                        />
                        <span className="text-[13px] font-medium text-ink-100">
                          {entry.user.name}
                        </span>
                        {isMe && (
                          <Badge variant="brand" size="sm">
                            you
                          </Badge>
                        )}
                        {entry.user.role !== "user" && (
                          <Badge variant="outline" size="sm">
                            {entry.user.role}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] tabular-nums text-ink-300">
                      {entry.reports}
                    </td>
                    <td className="px-3 py-3 text-right text-[13px] tabular-nums text-ink-300">
                      {entry.regions}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {entry.reports > 0 ? (
                        <ScoreChip score={entry.averageScore} />
                      ) : (
                        <span className="text-[13px] text-ink-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-[13.5px] font-semibold tabular-nums text-ink-50">
                      {entry.points}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
