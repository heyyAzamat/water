import type { UserRole } from "@/types";

/**
 * Single source of truth for app navigation.
 *
 * The sidebar, mobile drawer, user menu and topbar title all read from here.
 * Items carry a dictionary *key* rather than a label — the copy lives in
 * `@/lib/i18n`, so a link cannot end up translated in one component and
 * English in another.
 */

export type NavKey =
  | "dashboard"
  | "upload"
  | "map"
  | "reports"
  | "leaderboard"
  | "notifications"
  | "moderation"
  | "profile";

export type NavSectionKey = "operations" | "account";

export type MarketingKey = "how" | "features" | "map" | "impact" | "faq";

export interface NavItem {
  href: string;
  /** Key into `dictionary.appNav`; `${key}Desc` holds the description. */
  key: NavKey;
  /** lucide-react icon name, resolved by the consuming component. */
  icon: string;
  /** Minimum role required to see the link. */
  minRole?: UserRole;
  badge?: "notifications";
}

export const APP_NAV: NavItem[] = [
  { href: "/dashboard", key: "dashboard", icon: "LayoutDashboard" },
  { href: "/upload", key: "upload", icon: "ScanLine" },
  { href: "/map", key: "map", icon: "Map" },
  { href: "/reports", key: "reports", icon: "FileText" },
  { href: "/leaderboard", key: "leaderboard", icon: "Trophy" },
  {
    href: "/notifications",
    key: "notifications",
    icon: "Bell",
    badge: "notifications",
  },
];

export const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    key: "moderation",
    icon: "ShieldCheck",
    minRole: "moderator",
  },
];

export const ACCOUNT_NAV: NavItem[] = [
  { href: "/profile", key: "profile", icon: "UserRound" },
];

const ROLE_RANK: Record<UserRole, number> = { user: 0, moderator: 1, admin: 2 };

export function canAccess(item: NavItem, role: UserRole | undefined) {
  if (!item.minRole) return true;
  return ROLE_RANK[role ?? "user"] >= ROLE_RANK[item.minRole];
}

/** Every nav section the given role may see, in render order. */
export function navigationFor(role: UserRole | undefined) {
  return [
    {
      headingKey: null as NavSectionKey | null,
      items: APP_NAV.filter((i) => canAccess(i, role)),
    },
    {
      headingKey: "operations" as NavSectionKey | null,
      items: ADMIN_NAV.filter((i) => canAccess(i, role)),
    },
    {
      headingKey: "account" as NavSectionKey | null,
      items: ACCOUNT_NAV.filter((i) => canAccess(i, role)),
    },
  ].filter((section) => section.items.length > 0);
}

export const MARKETING_NAV: { href: string; key: MarketingKey }[] = [
  { href: "/#how", key: "how" },
  { href: "/#features", key: "features" },
  { href: "/#map", key: "map" },
  { href: "/#impact", key: "impact" },
  { href: "/#faq", key: "faq" },
];
