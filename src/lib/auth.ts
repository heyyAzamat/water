import "server-only";

import { cache } from "react";
import type { Author } from "@/types";
import { hasSupabase } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { mapProfile } from "@/lib/data/mappers";
import { demoData } from "@/lib/data/demo-store";

export interface SessionUser extends Author {
  email: string;
  region: string | null;
  bio: string | null;
  isDemo: boolean;
}

/**
 * Resolve the signed-in user.
 *
 * `cache()` dedupes this across a single render pass — the sidebar, topbar and
 * page body all ask for the user, and this way that is one auth round-trip.
 *
 * In demo mode a synthetic admin is returned so the whole product, including
 * the moderation panel, is explorable without credentials.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  if (!hasSupabase()) {
    const demo = demoData().currentUser;
    return {
      ...demo,
      email: "demo@aquavision.ai",
      region: "Almaty",
      bio: "Exploring AquaVision in demo mode. Connect Supabase to enable real accounts.",
      isDemo: true,
    };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

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
    };
  }

  return {
    ...mapProfile(profile),
    email: String(profile.email ?? user.email ?? ""),
    region: (profile.region as string) ?? null,
    bio: (profile.bio as string) ?? null,
    isDemo: false,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function isStaff() {
  const user = await getCurrentUser();
  return user?.role === "admin" || user?.role === "moderator";
}
