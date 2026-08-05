import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { AuthForm } from "../auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.auth.signUpTitle, description: t.auth.signUpBody };
}

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, t] = await Promise.all([searchParams, getT()]);

  return (
    <div>
      <h1 className="text-lume-soft text-[1.75rem] font-semibold tracking-[-0.035em] text-ink-50">
        {t.auth.signUpTitle}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
        {t.auth.signUpBody}
      </p>

      <AuthForm mode="signup" initialError={params.error} />

      <p className="mt-6 text-center text-[13.5px] text-ink-400">
        {t.auth.signUpSwitch}{" "}
        <Link
          href="/login"
          className="font-medium text-lume-300 underline-offset-4 hover:underline"
        >
          {t.auth.signUpSwitchLink}
        </Link>
      </p>
    </div>
  );
}
