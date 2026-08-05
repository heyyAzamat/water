import type { UserRole } from "@/types";

/**
 * Single source of truth for app navigation.
 *
 * The sidebar, mobile drawer, user menu and command palette all read from
 * here. Role-aware links live in one place so a role change can't leave a
 * stale path behind in one component and not another.
 */

export interface NavItem {
  href: string;
  label: string;
  /** lucide-react icon name, resolved by the consuming component. */
  icon: string;
  description: string;
  /** Minimum role required to see the link. */
  minRole?: UserRole;
  badge?: "notifications";
}

export const APP_NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "LayoutDashboard",
    description: "Your activity, scores and achievements",
  },
  {
    href: "/upload",
    label: "New analysis",
    icon: "ScanLine",
    description: "Upload a photograph for AI assessment",
  },
  {
    href: "/map",
    label: "Live map",
    icon: "Map",
    description: "Every report, clustered and heat-mapped",
  },
  {
    href: "/reports",
    label: "Reports",
    icon: "FileText",
    description: "Browse, filter and search all assessments",
  },
  {
    href: "/leaderboard",
    label: "Leaderboard",
    icon: "Trophy",
    description: "Top contributors across the network",
  },
  {
    href: "/notifications",
    label: "Notifications",
    icon: "Bell",
    description: "Nearby reports and trend alerts",
    badge: "notifications",
  },
];

export const ADMIN_NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Moderation",
    icon: "ShieldCheck",
    description: "Review the queue and manage users",
    minRole: "moderator",
  },
];

export const ACCOUNT_NAV: NavItem[] = [
  {
    href: "/profile",
    label: "Profile & settings",
    icon: "UserRound",
    description: "Your details and notification radius",
  },
];

const ROLE_RANK: Record<UserRole, number> = { user: 0, moderator: 1, admin: 2 };

export function canAccess(item: NavItem, role: UserRole | undefined) {
  if (!item.minRole) return true;
  return ROLE_RANK[role ?? "user"] >= ROLE_RANK[item.minRole];
}

/** Every nav section the given role may see, in render order. */
export function navigationFor(role: UserRole | undefined) {
  return [
    { heading: null, items: APP_NAV.filter((i) => canAccess(i, role)) },
    { heading: "Operations", items: ADMIN_NAV.filter((i) => canAccess(i, role)) },
    { heading: "Account", items: ACCOUNT_NAV.filter((i) => canAccess(i, role)) },
  ].filter((section) => section.items.length > 0);
}

export const MARKETING_NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#features", label: "AI features" },
  { href: "/#map", label: "Live map" },
  { href: "/#impact", label: "Impact" },
  { href: "/#faq", label: "FAQ" },
];
