"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { env, hasSupabase } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  notice?: string;
}

const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const signUpSchema = credentialsSchema.extend({
  fullName: z
    .string()
    .trim()
    .min(2, "Tell us your name so your reports have an author.")
    .max(80),
});

/** Absolute origin for OAuth redirects — respects the deployment host. */
async function origin() {
  const store = await headers();
  const host = store.get("x-forwarded-host") ?? store.get("host");
  const proto = store.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : env.SITE_URL;
}

const DEMO_NOTICE =
  "This deployment is running in demo mode — no auth provider is configured. Add your Supabase keys to .env.local to enable real accounts. Meanwhile the whole platform is explorable as the demo user.";

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!hasSupabase()) redirect("/dashboard");

  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: DEMO_NOTICE };

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Don't leak whether the address exists.
    return {
      error:
        error.message === "Invalid login credentials"
          ? "That email and password combination doesn't match an account."
          : error.message,
    };
  }

  revalidatePath("/", "layout");
  const next = String(formData.get("next") ?? "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!hasSupabase()) redirect("/dashboard");

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { error: DEMO_NOTICE };

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${await origin()}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // With email confirmation enabled there is no session yet.
  if (!data.session) {
    return {
      notice: `We've sent a confirmation link to ${parsed.data.email}. Open it to activate your account.`,
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithGoogle() {
  if (!hasSupabase()) redirect("/dashboard");

  const supabase = await createServerSupabase();
  if (!supabase) redirect("/dashboard");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${await origin()}/auth/callback`,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "OAuth failed")}`);
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/");
}

export async function sendPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  if (!z.string().email().safeParse(email).success) {
    return { error: "Enter a valid email address." };
  }

  const supabase = await createServerSupabase();
  if (!supabase) return { notice: DEMO_NOTICE };

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/callback?next=/profile`,
  });

  // Always report success — otherwise this endpoint enumerates accounts.
  return {
    notice: `If an account exists for ${email}, a reset link is on its way.`,
  };
}
