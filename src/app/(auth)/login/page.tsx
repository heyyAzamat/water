import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to AquaVision AI to publish and track water assessments.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-ink-50">
        Welcome back
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
        Sign in to publish assessments, follow locations and track trends.
      </p>

      <AuthForm mode="signin" next={params.next} initialError={params.error} />

      <p className="mt-6 text-center text-[13.5px] text-ink-400">
        New to AquaVision?{" "}
        <Link
          href="/signup"
          className="font-medium text-aqua-300 underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
