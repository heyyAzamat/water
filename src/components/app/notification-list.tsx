"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Award,
  Bell,
  CheckCheck,
  MessageSquare,
  ShieldAlert,
  Siren,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import type { Notification, NotificationKind } from "@/types";
import { cn, timeAgo } from "@/lib/utils";
import { useI18n, useT } from "@/lib/i18n/provider";
import { fmt, intlLocale } from "@/lib/i18n/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Icon and tone only — the label comes from the dictionary by kind. */
const KIND_META: Record<
  NotificationKind,
  { icon: React.ComponentType<{ className?: string }>; tone: string }
> = {
  nearby_report: {
    icon: Bell,
    tone: "text-lume-300 bg-lume-400/10 border-lume-400/22",
  },
  pollution_increase: {
    icon: TrendingUp,
    tone: "text-grade-poor bg-grade-poor/10 border-grade-poor/25",
  },
  critical_trend: {
    icon: Siren,
    tone: "text-grade-critical bg-grade-critical/10 border-grade-critical/25",
  },
  comment: {
    icon: MessageSquare,
    tone: "text-ink-300 bg-white/6 border-white/10",
  },
  achievement: {
    icon: Award,
    tone: "text-grade-moderate bg-grade-moderate/10 border-grade-moderate/25",
  },
  moderation: {
    icon: ShieldAlert,
    tone: "text-flux-300 bg-flux-400/10 border-flux-400/22",
  },
};

export function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);
  const router = useRouter();
  const [items, setItems] = React.useState(notifications);
  const [marking, setMarking] = React.useState(false);

  const unread = items.filter((n) => !n.readAt);

  async function markAllRead() {
    if (unread.length === 0) return;
    setMarking(true);

    const previous = items;
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? now })));

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error(`Failed (${response.status})`);
      router.refresh();
    } catch {
      setItems(previous);
      toast.error(t.ui.markAllError);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-ink-400">
          {unread.length > 0 ? (
            <>
              <span className="font-semibold text-ink-100">
                {unread.length}
              </span>{" "}
              {fmt(t.ui.unreadOf, { total: items.length })}
            </>
          ) : (
            fmt(t.ui.allRead, { count: items.length })
          )}
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          loading={marking}
          disabled={unread.length === 0}
        >
          <CheckCheck />
          {t.ui.markAllRead}
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((notification) => {
          const meta = KIND_META[notification.kind];
          const Icon = meta.icon;
          const href = notification.reportId
            ? `/reports/${notification.reportId}`
            : null;

          const content = (
            <>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl border",
                  meta.tone,
                )}
              >
                <Icon className="size-[17px]" aria-hidden />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[13.5px] font-medium text-ink-50">
                    {notification.title}
                  </span>
                  <Badge variant="outline" size="sm">
                    {t.domain.notificationKinds[notification.kind]}
                  </Badge>
                  {!notification.readAt && (
                    <span
                      className="size-1.5 rounded-full bg-lume-400"
                      role="img"
                      aria-label={t.ui.unread}
                    />
                  )}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-ink-400">
                  {notification.body}
                </span>
                <span className="mt-1.5 block text-[11px] text-ink-600">
                  {timeAgo(notification.createdAt, dateLocale)}
                </span>
              </span>

              {href && (
                <ArrowRight
                  className="mt-1 size-4 shrink-0 text-ink-600 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-300"
                  aria-hidden
                />
              )}
            </>
          );

          const className = cn(
            "group flex gap-3.5 rounded-2xl border p-4 transition-all duration-200",
            notification.readAt
              ? "border-white/8 bg-white/[0.022]"
              : "border-lume-400/22 bg-lume-400/6",
            href && "hover:border-white/18 hover:bg-white/[0.05]",
          );

          return (
            <li key={notification.id}>
              {href ? (
                <Link href={href} className={className}>
                  {content}
                </Link>
              ) : (
                <div className={className}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
