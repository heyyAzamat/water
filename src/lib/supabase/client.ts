"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabase } from "@/lib/env";

/**
 * Browser Supabase client. Returns null in demo mode so call sites must
 * handle the "no backend configured" branch explicitly rather than crashing.
 */
export function createClient() {
  if (!hasSupabase()) return null;
  return createBrowserClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!);
}
