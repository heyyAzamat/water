"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { UserRole } from "@/types";
import { navigationFor, type NavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/primitives";
import { Badge } from "@/components/ui/badge";

function Icon({ name, className }: { name: string; className?: string }) {
  const Resolved = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    name
  ];
  return Resolved ? <Resolved className={className} aria-hidden /> : null;
}

export function AppSidebar({
  role,
  unreadCount,
  onNavigate,
}: {
  role: UserRole | undefined;
  unreadCount: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const sections = navigationFor(role);

  const isActive = (item: NavItem) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-1.5 pt-1">
        <Logo />
      </div>

      <nav className="flex flex-1 flex-col gap-6" aria-label="Application">
        {sections.map((section) => (
          <div key={section.heading ?? "main"}>
            {section.heading && (
              <p className="mb-2 px-3 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-600">
                {section.heading}
              </p>
            )}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active = isActive(item);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-200",
                        active
                          ? "text-white"
                          : "text-ink-400 hover:bg-white/5 hover:text-ink-100",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="sidebar-active"
                          className="absolute inset-0 rounded-xl border border-aqua-400/22 bg-gradient-to-r from-aqua-400/14 to-flux-500/8"
                          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                          aria-hidden
                        />
                      )}
                      <Icon
                        name={item.icon}
                        className={cn(
                          "relative size-[17px] shrink-0 transition-colors",
                          active
                            ? "text-aqua-300"
                            : "text-ink-500 group-hover:text-ink-300",
                        )}
                      />
                      <span className="relative flex-1 truncate">{item.label}</span>
                      {item.badge === "notifications" && unreadCount > 0 && (
                        <Badge variant="brand" size="sm" className="relative">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Link
        href="/upload"
        onClick={onNavigate}
        className="group relative overflow-hidden rounded-2xl border border-aqua-400/22 bg-gradient-to-br from-aqua-500/14 to-flux-600/12 p-4 transition-colors hover:border-aqua-400/40"
      >
        <div
          className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-aqua-400/22 blur-2xl transition-opacity group-hover:opacity-100 opacity-70"
          aria-hidden
        />
        <Icons.ScanLine className="relative size-5 text-aqua-200" aria-hidden />
        <p className="relative mt-2.5 text-[13.5px] font-semibold text-ink-50">
          Analyse a photograph
        </p>
        <p className="relative mt-1 text-[11.5px] leading-snug text-ink-400">
          Drag in an image and get a scored assessment in seconds.
        </p>
      </Link>
    </div>
  );
}
