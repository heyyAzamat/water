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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const KIND_META: Record<
  NotificationKind,
  { icon: React.ComponentType<{ className?: string }>; tone: string; label: string }
> = {
  nearby_report: { icon: Bell, tone: "text-aqua-300 bg-aqua-400/10 border-aqua-400/22", label: "Nearby" },
  pollution_increase: {
    icon: TrendingUp,
    tone: "text-grade-poor bg-grade-poor/10 border-grade-poor/25",
    label: "Rising",
  },
  critical_trend: {
    icon: Siren,
    tone: "text-grade-critical bg-grade-critical/10 border-grade-critical/25",
    label: "Critical",
  },
  comment: { icon: MessageSquare, tone: "text-ink-300 bg-white/6 border-white/10", label: "Comment" },
  achievement: {
    icon: Award,
    tone: "text-grade-moderate bg-grade-moderate/10 border-grade-moderate/25",
    label: "Achievement",
  },
  moderation: {
    icon: ShieldAlert,
    tone: "text-flux-300 bg-flux-400/10 border-flux-400/22",
    label: "Moderation",
  },
};

export function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
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
      toast.error("Could not mark notifications as read");
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
              <span className="font-semibold text-ink-100">{unread.length}</span>{" "}
              unread of {items.length}
            </>
          ) : (
            `${items.length} notification${items.length === 1 ? "" : "s"} · all read`
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
          Mark all read
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
                    {meta.label}
                  </Badge>
                  {!notification.readAt && (
                    <span
                      className="size-1.5 rounded-full bg-aqua-400"
                      role="img"
                      aria-label="Unread"
                    />
                  )}
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-ink-400">
                  {notification.body}
                </span>
                <span className="mt-1.5 block text-[11px] text-ink-600">
                  {timeAgo(notification.createdAt)}
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
              : "border-aqua-400/22 bg-aqua-400/6",
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
