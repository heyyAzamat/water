"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  Flag,
  Inbox,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n, useT } from "@/lib/i18n/provider";
import { intlLocale } from "@/lib/i18n/format";
import type { ModerationStatus, Report } from "@/types";
import { gradeForScore } from "@/lib/ai/scoring";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/misc";
import { EmptyState, ScoreChip } from "@/components/shared/primitives";

type Filter = "queue" | "pending" | "flagged" | "approved";

export function ModerationQueue({ reports }: { reports: Report[] }) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);
  const router = useRouter();
  const [filter, setFilter] = React.useState<Filter>("queue");
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [removed, setRemoved] = React.useState<Set<string>>(new Set());

  const visible = React.useMemo(() => {
    const live = reports.filter((r) => !removed.has(r.id));
    switch (filter) {
      case "pending":
        return live.filter((r) => r.status === "pending");
      case "flagged":
        return live.filter((r) => r.status === "flagged");
      case "approved":
        return live.filter((r) => r.status === "approved");
      default:
        // The queue is what actually needs a decision.
        return live.filter(
          (r) => r.status === "pending" || r.status === "flagged",
        );
    }
  }, [reports, filter, removed]);

  const counts = React.useMemo(() => {
    const live = reports.filter((r) => !removed.has(r.id));
    return {
      queue: live.filter((r) => r.status === "pending" || r.status === "flagged")
        .length,
      pending: live.filter((r) => r.status === "pending").length,
      flagged: live.filter((r) => r.status === "flagged").length,
      approved: live.filter((r) => r.status === "approved").length,
    };
  }, [reports, removed]);

  async function moderate(report: Report, status: ModerationStatus) {
    setBusyId(report.id);
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(`Failed (${response.status})`);

      toast.success(`Marked ${status}`, { description: report.title });
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t.ui.moderation.failed);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(report: Report) {
    setBusyId(report.id);
    try {
      const response = await fetch(`/api/reports/${report.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(`Failed (${response.status})`);

      setRemoved((prev) => new Set(prev).add(report.id));
      toast.success(t.ui.moderation.deleted, { description: report.title });
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(t.ui.moderation.deleteFailed);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle as="h2">{t.ui.moderation.queueTitle}</CardTitle>
        <CardDescription>{t.ui.moderation.queueBody}</CardDescription>
      </CardHeader>

      <div className="px-5 sm:px-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList className="w-full justify-start overflow-x-auto scrollbar-none">
            <TabsTrigger value="queue">
              <Inbox />
              {t.ui.moderation.tabNeedsReview}
              {counts.queue > 0 && (
                <Badge variant="brand" size="sm">
                  {counts.queue}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              {t.ui.moderation.tabPending} ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="flagged">
              {t.ui.moderation.tabFlagged} ({counts.flagged})
            </TabsTrigger>
            <TabsTrigger value="approved">
              {t.ui.moderation.tabLive} ({counts.approved})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="px-5 pb-5 pt-4 sm:px-6">
        {visible.length === 0 ? (
          <EmptyState
            icon={<Check />}
            title={
              filter === "queue"
                ? t.ui.moderation.queueClear
                : t.ui.moderation.nothingHere
            }
            description={
              filter === "queue"
                ? t.ui.moderation.queueClearBody
                : t.ui.moderation.nothingHereBody
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((report) => {
              const grade = gradeForScore(report.analysis.pollutionScore);
              const busy = busyId === report.id;

              return (
                <li
                  key={report.id}
                  className="rounded-2xl border border-white/8 bg-white/[0.025] p-3.5"
                >
                  <div className="flex gap-3.5">
                    <span className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={report.imageUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                      />
                      <span
                        className="absolute inset-x-0 bottom-0 h-1"
                        style={{ background: grade.hex }}
                        aria-hidden
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-[13.5px] font-medium leading-snug text-ink-50">
                          {report.title}
                        </h3>
                        <ScoreChip score={report.analysis.pollutionScore} />
                      </div>

                      <p className="mt-1 truncate text-[11.5px] text-ink-500">
                        {report.location?.name ?? t.ui.unmapped} ·{" "}
                        {report.author.name} ·{" "}
                        {timeAgo(report.capturedAt ?? report.createdAt, dateLocale)}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            report.status === "pending"
                              ? "moderate"
                              : report.status === "flagged"
                                ? "critical"
                                : report.status === "approved"
                                  ? "excellent"
                                  : "neutral"
                          }
                          size="sm"
                        >
                          {t.domain.status[report.status]}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {report.analysis.confidence}% confidence
                        </Badge>
                        {report.analysis.pollutionTags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="neutral" size="sm">
                            {t.domain.indicators[tag].label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-ink-400">
                    {report.analysis.explanation}
                  </p>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-white/6 pt-3">
                    {busy ? (
                      <span className="inline-flex items-center gap-2 text-[12.5px] text-ink-400">
                        <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        Working…
                      </span>
                    ) : (
                      <>
                        {report.status !== "approved" && (
                          <Button
                            size="sm"
                            onClick={() => moderate(report, "approved")}
                          >
                            <Check />
                            {t.ui.actions.approve}
                          </Button>
                        )}
                        {report.status !== "flagged" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderate(report, "flagged")}
                          >
                            <Flag />
                            {t.ui.moderation.flagShort}
                          </Button>
                        )}
                        {report.status !== "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => moderate(report, "rejected")}
                          >
                            <X />
                            {t.ui.actions.reject}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn("ml-auto")}
                          asChild
                        >
                          <Link href={`/reports/${report.id}`}>
                            <ExternalLink />
                            {t.ui.moderation.open}
                          </Link>
                        </Button>

                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => remove(report)}
                        >
                          <Trash2 />
                          {t.ui.moderation.delete}
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
