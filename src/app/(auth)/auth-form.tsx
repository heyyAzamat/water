"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, ArrowRight, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Separator } from "@/components/ui/misc";
import { useT } from "@/lib/i18n/provider";
import {
  type AuthState,
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
} from "./actions";

export function AuthForm({
  mode,
  next,
  initialError,
}: {
  mode: "signin" | "signup";
  next?: string;
  initialError?: string;
}) {
  const t = useT();
  const action = mode === "signin" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    { error: initialError },
  );

  if (state.notice) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-lume-400/22 bg-lume-400/8 p-6 text-center">
        <span className="grid size-11 place-items-center rounded-xl border border-lume-400/25 bg-lume-400/12 text-lume-200">
          <MailCheck className="size-5" aria-hidden />
        </span>
        <p className="text-[14px] leading-relaxed text-ink-200">{state.notice}</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {/* OAuth first — it is what most people actually use. */}
      <form action={signInWithGoogle}>
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          <GoogleMark />
          {t.auth.google}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] uppercase tracking-[0.14em] text-ink-600">
          {t.auth.orEmail}
        </span>
        <Separator className="flex-1" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        {next && <input type="hidden" name="next" value={next} />}

        {mode === "signup" && (
          <Field label={t.auth.fullName} htmlFor="fullName" required>
            <Input
              name="fullName"
              autoComplete="name"
              placeholder={t.contact.namePlaceholder}
              required
              minLength={2}
            />
          </Field>
        )}

        <Field label={t.auth.email} htmlFor="email" required>
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t.contact.emailPlaceholder}
            required
          />
        </Field>

        <Field
          label={t.auth.password}
          htmlFor="password"
          required
          hint={mode === "signup" ? t.auth.passwordHint : undefined}
        >
          <Input
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="••••••••"
            required
            minLength={8}
          />
        </Field>

        {state.error && (
          <div
            role="alert"
            className="flex gap-2.5 rounded-xl border border-grade-critical/25 bg-grade-critical/8 p-3"
          >
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-grade-critical"
              aria-hidden
            />
            <p className="text-[12.5px] leading-relaxed text-ink-200">
              {state.error}
            </p>
          </div>
        )}

        <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
          {mode === "signin" ? t.auth.submitSignIn : t.auth.submitSignUp}
          {!pending && <ArrowRight aria-hidden />}
        </Button>
      </form>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z"
      />
    </svg>
  );
}
