import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create a free AquaVision AI account and start assessing water bodies with computer vision.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div>
      <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em] text-ink-50">
        Create your account
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
        Free forever for citizen monitoring. Your first assessment takes about a
        minute.
      </p>

      <AuthForm mode="signup" initialError={params.error} />

      <p className="mt-6 text-center text-[13.5px] text-ink-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-aqua-300 underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
