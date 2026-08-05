import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

import { listNotifications } from "@/lib/data/repository";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";

/**
 * Every page in this group is per-user: dashboards, personal statistics, the
 * moderation queue. With Supabase configured the auth cookie makes them dynamic
 * automatically, but in demo mode nothing touches cookies and Next would
 * happily prerender them at build time — freezing one user's view into static
 * HTML. Opting out explicitly is the safe default for authenticated surfaces.
 */
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  // The middleware already gates these routes; this is the defence in depth
  // that matters if the matcher ever changes.
  if (!user) redirect("/login");

  const notifications = await listNotifications(user.id, 20);
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="flex min-h-dvh">
      <aside
        className="sticky top-0 hidden h-dvh w-68 shrink-0 border-r border-white/8 bg-ink-950/60 backdrop-blur-2xl lg:block"
        data-app-sidebar
      >
        <AppSidebar role={user.role} unreadCount={unread} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            role: user.role,
            points: user.points,
            isDemo: user.isDemo,
          }}
          notifications={notifications}
        />
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
