import type { Metadata } from "next";
import Link from "next/link";
import { BellRing } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { listNotifications } from "@/lib/data/repository";
import { getT } from "@/lib/i18n/server";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/primitives";
import { NotificationList } from "@/components/app/notification-list";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t.pages.notifications.metaTitle,
    description: t.pages.notifications.metaDescription,
  };
}

export default async function NotificationsPage() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  if (!user) return null;

  const notifications = await listNotifications(user.id, 60);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
          {t.pages.notifications.title}
        </h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-400">
          {t.pages.notifications.description}
        </p>
      </div>

      <div className="mt-6">
        {notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BellRing />}
              title={t.pages.notifications.emptyTitle}
              description={t.pages.notifications.emptyDescription}
              action={
                <Button asChild size="sm" variant="secondary">
                  <Link href="/profile#preferences">
                    {t.pages.notifications.emptyAction}
                  </Link>
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
