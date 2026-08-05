"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Check,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import type { Notification, UserRole } from "@/types";
import { APP_NAV, ADMIN_NAV } from "@/lib/navigation";
import { cn, initials, timeAgo } from "@/lib/utils";
import { useI18n, useT } from "@/lib/i18n/provider";
import { fmt, intlLocale } from "@/lib/i18n/format";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/field";
import { Avatar } from "@/components/ui/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/dropdown";
import { AppSidebar } from "./app-sidebar";
import { signOut } from "@/app/(auth)/actions";

interface TopbarUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  points: number;
  isDemo: boolean;
}

export function AppTopbar({
  user,
  notifications,
}: {
  user: TopbarUser;
  notifications: Notification[];
}) {
  const t = useT();
  const dateLocale = intlLocale(useI18n().locale);
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const unread = notifications.filter((n) => !n.readAt);

  const title = React.useMemo(() => {
    const match = [...APP_NAV, ...ADMIN_NAV].find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    if (match) return t.appNav[match.key];
    if (pathname.startsWith("/profile")) return t.appNav.profile;
    return "AquaVision";
  }, [pathname, t]);

  React.useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // ⌘K / Ctrl-K focuses search — the shortcut people try first.
  const searchRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/reports?q=${encodeURIComponent(term)}` : "/reports");
  }

  return (
    <>
      <header
        className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/8 bg-abyss-1000/75 px-4 backdrop-blur-2xl sm:px-6"
        data-app-nav
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label={t.common.openNavigation}
        >
          <Menu />
        </Button>

        <h1 className="text-[15px] font-semibold tracking-[-0.01em] text-ink-50 lg:text-base">
          {title}
        </h1>

        <form
          onSubmit={submitSearch}
          className="relative ml-auto hidden w-full max-w-xs md:block"
          role="search"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-500"
            aria-hidden
          />
          <Input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.topbar.searchPlaceholder}
            aria-label={t.topbar.searchLabel}
            className="h-9 pl-9 pr-12 text-[13px]"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/12 bg-white/6 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
            ⌘K
          </kbd>
        </form>

        <div className={cn("flex items-center gap-1.5", "md:ml-0 ml-auto")}>
          <LanguageSwitcher className="mr-1" />

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="relative"
                aria-label={`${t.topbar.notifications}${
                  unread.length
                    ? `, ${fmt(t.topbar.notificationsUnread, {
                        count: unread.length,
                      })}`
                    : ""
                }`}
              >
                <Bell />
                {unread.length > 0 && (
                  <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-lume-400 text-[9px] font-bold text-abyss-1000">
                    {unread.length > 9 ? "9" : unread.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-88 max-w-[calc(100vw-2rem)]">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <p className="text-[13.5px] font-semibold text-ink-50">
                  {t.topbar.notifications}
                </p>
                {unread.length > 0 && (
                  <Badge variant="brand" size="sm">
                    {fmt(t.topbar.notificationsUnread, { count: unread.length })}
                  </Badge>
                )}
              </div>

              <ul className="max-h-88 overflow-y-auto p-1.5">
                {notifications.length === 0 ? (
                  <li className="px-3 py-8 text-center text-[13px] text-ink-500">
                    {t.topbar.notificationsEmpty}
                  </li>
                ) : (
                  notifications.slice(0, 8).map((notification) => (
                    <li key={notification.id}>
                      <Link
                        href={
                          notification.reportId
                            ? `/reports/${notification.reportId}`
                            : "/notifications"
                        }
                        className={cn(
                          "flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/6",
                          !notification.readAt && "bg-lume-400/6",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1 size-1.5 shrink-0 rounded-full",
                            notification.readAt ? "bg-ink-600" : "bg-lume-400",
                          )}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium leading-snug text-ink-100">
                            {notification.title}
                          </span>
                          <span className="mt-0.5 block line-clamp-2 text-[12px] leading-relaxed text-ink-500">
                            {notification.body}
                          </span>
                          <span className="mt-1 block text-[11px] text-ink-600">
                            {timeAgo(notification.createdAt, dateLocale)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>

              <div className="border-t border-white/8 p-2">
                <Button asChild variant="ghost" size="sm" className="w-full">
                  <Link href="/notifications">
                    {t.topbar.viewAllNotifications}
                  </Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-1 flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-white/6"
                aria-label={t.topbar.accountMenu}
              >
                <Avatar name={user.name} src={user.avatarUrl} size={30} />
                <span className="hidden text-left sm:block">
                  <span className="block max-w-32 truncate text-[12.5px] font-medium leading-tight text-ink-100">
                    {user.name}
                  </span>
                  <span className="block text-[10.5px] leading-tight text-ink-500">
                    {fmt(t.topbar.points, { count: user.points })}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-60">
              <div className="flex items-center gap-3 px-2.5 py-2.5">
                <Avatar name={user.name} src={user.avatarUrl} size={38} />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-ink-50">
                    {user.name}
                  </p>
                  <p className="truncate text-[11.5px] text-ink-500">
                    {user.email}
                  </p>
                </div>
              </div>

              {user.isDemo && (
                <div className="mx-1.5 mb-1.5 rounded-lg border border-lume-400/22 bg-lume-400/8 px-2.5 py-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-medium text-lume-200">
                    <Sparkles className="size-3" aria-hidden />
                    {t.topbar.demoTitle}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-ink-400">
                    {t.topbar.demoBody}
                  </p>
                </div>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuLabel>
                {user.role === "admin"
                  ? t.topbar.roleAdmin
                  : user.role === "moderator"
                    ? t.topbar.roleModerator
                    : t.topbar.roleUser}
              </DropdownMenuLabel>

              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserRound />
                  {t.topbar.profile}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile#preferences">
                  <Settings />
                  {t.topbar.notificationSettings}
                </Link>
              </DropdownMenuItem>

              {(user.role === "admin" || user.role === "moderator") && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <ShieldCheck />
                    {t.topbar.moderationPanel}
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem
                  destructive
                  onSelect={(event) => {
                    // Let the form submit instead of Radix closing first.
                    event.preventDefault();
                    (event.currentTarget as HTMLElement)
                      .closest("form")
                      ?.requestSubmit();
                  }}
                >
                  <LogOut />
                  {t.topbar.signOut}
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-abyss-1000/85 backdrop-blur-md"
            onClick={() => setDrawerOpen(false)}
            aria-label={t.common.closeNavigation}
            tabIndex={-1}
          />
          <div className="relative h-full w-72 max-w-[85vw] animate-slide-in-left border-r border-white/10 bg-abyss-1000/96 backdrop-blur-2xl">
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute right-3 top-4 z-10"
              onClick={() => setDrawerOpen(false)}
              aria-label={t.common.closeNavigation}
            >
              <X />
            </Button>
            <AppSidebar
              role={user.role}
              unreadCount={unread.length}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export { type TopbarUser };

/** Small inline confirmation used by the notifications page. */
export function ReadTick({ read }: { read: boolean }) {
  const t = useT();
  return read ? (
    <Check className="size-3.5 text-ink-600" aria-label={t.topbar.read} />
  ) : (
    <span
      className="size-1.5 rounded-full bg-lume-400"
      aria-label={t.topbar.unread}
      role="img"
    />
  );
}

export function initialsOf(name: string) {
  return initials(name);
}
