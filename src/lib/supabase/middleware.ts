import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env, hasSupabase } from "@/lib/env";

/** Routes that require a signed-in user. */
const PROTECTED = [
  "/dashboard",
  "/upload",
  "/reports",
  "/profile",
  "/notifications",
  "/leaderboard",
  "/admin",
];

/**
 * Refreshes the Supabase session on every request and gates protected routes.
 *
 * In demo mode there is no auth provider, so the middleware becomes a no-op
 * and a synthetic demo user is used instead — the platform stays fully
 * explorable without credentials.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!hasSupabase()) return response;

  const supabase = createServerClient(
    env.SUPABASE_URL!,
    env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Must be getUser(), not getSession(): only getUser() revalidates the JWT
  // against the auth server, which is what makes the gate below trustworthy.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!user && needsAuth) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
