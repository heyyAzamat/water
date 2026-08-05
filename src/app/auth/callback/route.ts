import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * OAuth / email-confirmation landing route.
 *
 * Supabase redirects here with a one-time `code`; exchanging it sets the
 * session cookie. Any failure lands the user back on /login with a message
 * rather than a blank screen.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Sign-in link is missing its authorisation code.")}`,
    );
  }

  const supabase = await createServerSupabase();
  if (!supabase) return NextResponse.redirect(`${origin}/dashboard`);

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const target = next.startsWith("/") ? next : "/dashboard";
  return NextResponse.redirect(`${origin}${target}`);
}
