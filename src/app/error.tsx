"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/primitives";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();

  React.useEffect(() => {
    // In production this is where an error reporter would receive the digest.
    console.error("[aquavision] unhandled error", error);
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="flex max-w-md flex-col items-center text-center">
        <Logo />

        <span className="mt-10 grid size-16 place-items-center rounded-2xl border border-grade-critical/25 bg-grade-critical/10 text-grade-critical">
          <AlertTriangle className="size-7" aria-hidden />
        </span>

        <h1 className="mt-6 text-[1.6rem] font-semibold tracking-[-0.035em] text-ink-50">
          {t.errors.errorTitle}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-400">
          {t.errors.errorBody}
        </p>

        {error.digest && (
          <code className="mt-4 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-ink-500">
            digest {error.digest}
          </code>
        )}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw aria-hidden />
            {t.errors.retry}
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">
              <Home aria-hidden />
              {t.errors.notFoundHome}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
