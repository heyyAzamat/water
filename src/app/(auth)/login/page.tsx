import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { AuthForm } from "../auth-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t.auth.signInTitle, description: t.auth.signInBody };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const [params, t] = await Promise.all([searchParams, getT()]);

  return (
    <div>
      <h1 className="text-lume-soft text-[1.75rem] font-semibold tracking-[-0.035em] text-ink-50">
        {t.auth.signInTitle}
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
        {t.auth.signInBody}
      </p>

      <AuthForm mode="signin" next={params.next} initialError={params.error} />

      <p className="mt-6 text-center text-[13.5px] text-ink-400">
        {t.auth.signInSwitch}{" "}
        <Link
          href="/signup"
          className="font-medium text-lume-300 underline-offset-4 hover:underline"
        >
          {t.auth.signInSwitchLink}
        </Link>
      </p>
    </div>
  );
}
