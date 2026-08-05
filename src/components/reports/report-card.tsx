"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, MapPin, MessageSquare, ShieldAlert } from "lucide-react";
import type { Report } from "@/types";
import { gradeForScore } from "@/lib/ai/scoring";
import { cn, timeAgo } from "@/lib/utils";
import { useI18n, useT } from "@/lib/i18n/provider";
import { fmt, intlLocale } from "@/lib/i18n/format";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { QualityBadge, ScoreChip } from "@/components/shared/primitives";

export function ReportCard({
  report,
  index = 0,
  compact = false,
}: {
  report: Report;
  index?: number;
  compact?: boolean;
}) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);
  const grade = gradeForScore(report.analysis.pollutionScore);

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        // Cap the cascade so page 6 of the list doesn't wait two seconds.
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 hover:border-white/16 hover:bg-white/[0.05]"
    >
      <Link
        href={`/reports/${report.id}`}
        className="block focus-visible:outline-none"
      >
        <div
          className={cn(
            "relative overflow-hidden",
            compact ? "aspect-[16/9]" : "aspect-[4/3]",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={report.imageUrl}
            alt={fmt(t.ui.imageAlt, {
              name: report.location?.name ?? report.title,
            })}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-abyss-1000/92 via-abyss-1000/18 to-transparent"
            aria-hidden
          />

          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <QualityBadge
              quality={report.analysis.waterQuality}
              size="sm"
              className="backdrop-blur-xl"
            />
            {report.status !== "approved" && (
              <Badge
                variant={report.status === "flagged" ? "critical" : "neutral"}
                size="sm"
                className="backdrop-blur-xl"
              >
                <ShieldAlert />
                {t.domain.status[report.status]}
              </Badge>
            )}
          </div>

          {/* Severity meter along the bottom edge */}
          <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/8" aria-hidden>
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${report.analysis.pollutionScore}%`,
                background: grade.hex,
              }}
            />
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 flex-1 text-[14px] font-semibold leading-snug tracking-[-0.01em] text-ink-50">
              {report.title}
            </h3>
            <ScoreChip score={report.analysis.pollutionScore} />
          </div>

          <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-500">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {report.location?.name ?? t.ui.unmappedLocation}
              {report.location?.region ? ` · ${report.location.region}` : ""}
            </span>
          </p>

          {!compact && report.analysis.pollutionTags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {report.analysis.pollutionTags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" size="sm">
                  {t.domain.indicators[tag].label}
                </Badge>
              ))}
              {report.analysis.pollutionTags.length > 3 && (
                <Badge variant="neutral" size="sm">
                  +{report.analysis.pollutionTags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/6 pt-3">
            <div className="flex min-w-0 items-center gap-2">
              <Avatar
                name={report.author.name}
                src={report.author.avatarUrl}
                size={22}
              />
              <span className="truncate text-[11.5px] text-ink-500">
                {report.author.name}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3 text-[11px] text-ink-600">
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3.5" aria-hidden />
                {report.viewCount}
              </span>
              {report.commentCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="size-3.5" aria-hidden />
                  {report.commentCount}
                </span>
              )}
              <span>{timeAgo(report.capturedAt ?? report.createdAt, dateLocale)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

/** Dense one-line variant for dashboard "recent uploads" lists. */
export function ReportRow({ report }: { report: Report }) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);
  const grade = gradeForScore(report.analysis.pollutionScore);

  return (
    <Link
      href={`/reports/${report.id}`}
      className="group flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-2.5 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.05]"
    >
      <span className="relative size-12 shrink-0 overflow-hidden rounded-lg">
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

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink-100">
          {report.title}
        </span>
        <span className="mt-0.5 block truncate text-[11.5px] text-ink-500">
          {report.location?.name ?? t.ui.unmapped} ·{" "}
          {timeAgo(report.capturedAt ?? report.createdAt, dateLocale)}
        </span>
      </span>

      <ScoreChip score={report.analysis.pollutionScore} />
    </Link>
  );
}
