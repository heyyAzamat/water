import "server-only";

import { cache } from "react";
import type { Author } from "@/types";
import { hasSupabase } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { mapProfile } from "@/lib/data/mappers";
import { getT } from "@/lib/i18n/server";

export interface SessionUser extends Author {
  email: string;
  region: string | null;
  bio: string | null;
  isDemo: boolean;
  /** Nobody is signed in — the platform is being used anonymously. */
  isGuest: boolean;
}

export const GUEST_ID = "guest";

/**
 * Identity for a visitor who has not signed in.
 *
 * The platform is usable without an account, so anonymous visitors get a real
 * (empty) identity rather than a redirect to a login wall. It is deliberately
 * *not* one of the seeded contributors: showing someone else's name and points
 * as "you" reads as a mock-up, not a product.
 *
 * Without a database there is nothing to protect, so the guest is given staff
 * rights and the whole product — moderation included — stays explorable.
 */
async function guestUser(): Promise<SessionUser> {
  const t = await getT();
  return {
    id: GUEST_ID,
    name: t.topbar.guest,
    avatarUrl: null,
    role: hasSupabase() ? "user" : "admin",
    points: 0,
    email: "",
    region: null,
    bio: null,
    isDemo: !hasSupabase(),
    isGuest: true,
  };
}

/**
 * Resolve the current user, falling back to a guest identity.
 *
 * `cache()` dedupes this across a single render pass — the sidebar, topbar and
 * page body all ask for the user, and this way that is one auth round-trip.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser> => {
  if (!hasSupabase()) return guestUser();

  const supabase = await createServerSupabase();
  if (!supabase) return guestUser();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return guestUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // The trigger normally creates this row; fall back to auth metadata so a
    // brand-new OAuth user never hits a blank dashboard.
    return {
      id: user.id,
      name:
        (user.user_metadata?.full_name as string) ??
        user.email?.split("@")[0] ??
        "New contributor",
      avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
      role: "user",
      points: 0,
      email: user.email ?? "",
      region: null,
      bio: null,
      isDemo: false,
      isGuest: false,
    };
  }

  return {
    ...mapProfile(profile),
    email: String(profile.email ?? user.email ?? ""),
    region: (profile.region as string) ?? null,
    bio: (profile.bio as string) ?? null,
    isDemo: false,
    isGuest: false,
  };
});

/** Throws unless a real, signed-in account is behind the request. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (user.isGuest) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function isStaff() {
  const user = await getCurrentUser();
  return user.role === "admin" || user.role === "moderator";
}
