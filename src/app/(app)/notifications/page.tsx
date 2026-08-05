import type { Metadata } from "next";
import Link from "next/link";
import { BellRing } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/lib/data/repository";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/primitives";
import { NotificationList } from "@/components/app/notification-list";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Nearby reports, rising pollution and critical trend alerts.",
};

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const notifications = await listNotifications(user.id, 60);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
          Notifications
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-400">
          You are alerted when a report is published near your monitoring area,
          when a followed location&apos;s severity rises, and when a trend turns
          critical.
        </p>
      </div>

      <div className="mt-6">
        {notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BellRing />}
              title="No notifications yet"
              description="Set a monitoring area in your profile and we will alert you when something changes nearby."
              action={
                <Button asChild size="sm" variant="secondary">
                  <Link href="/profile#preferences">Set monitoring area</Link>
                </Button>
              }
              className="border-0 bg-transparent"
            />
          </Card>
        ) : (
          <NotificationList notifications={notifications} />
        )}
      </div>
    </div>
  );
}
