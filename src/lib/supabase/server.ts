import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, hasSupabase, hasSupabaseAdmin } from "@/lib/env";

/**
 * Request-scoped Supabase client that reads and refreshes the auth cookie.
 * Returns null in demo mode.
 */
export async function createServerSupabase() {
  if (!hasSupabase()) return null;

  const cookieStore = await cookies();

  return createServerClient(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — the middleware owns cookie
          // refresh in that case, so silently ignoring this is correct.
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS — only ever use it for trusted server
 * work: writing an AI analysis, moderation, and notification fan-out.
 */
export function createAdminSupabase() {
  if (!hasSupabaseAdmin()) return null;

  return createSupabaseClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
