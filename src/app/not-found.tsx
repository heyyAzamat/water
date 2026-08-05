import Link from "next/link";
import { Home, Map as MapIcon, Waves } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/primitives";
import { AbyssBackdrop } from "@/components/shared/abyss";

export default async function NotFound() {
  const t = await getT();

  return (
    <div className="relative isolate grid min-h-dvh place-items-center px-5">
      <AbyssBackdrop depth={0.7} particles />

      <div className="relative flex max-w-md flex-col items-center text-center">
        <Logo />

        <span className="mt-10 grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/5 text-ink-400">
          <Waves className="size-7" aria-hidden />
        </span>

        <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.18em] text-ink-600">
          404
        </p>
        <h1 className="text-lume-soft mt-3 text-balance text-[1.85rem] font-semibold leading-tight tracking-[-0.04em] text-ink-50">
          {t.errors.notFoundTitle}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-400">
          {t.errors.notFoundBody}
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <Home aria-hidden />
              {t.errors.notFoundHome}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/map">
              <MapIcon aria-hidden />
              {t.errors.notFoundMap}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
