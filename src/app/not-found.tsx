import Link from "next/link";
import { Home, Map as MapIcon, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmbientBackdrop, Logo } from "@/components/shared/primitives";

export default function NotFound() {
  return (
    <div className="relative isolate grid min-h-dvh place-items-center px-5">
      <AmbientBackdrop intensity={0.55} />

      <div className="relative flex max-w-md flex-col items-center text-center">
        <Logo />

        <span className="mt-10 grid size-16 place-items-center rounded-2xl border border-white/10 bg-white/5 text-ink-400">
          <Waves className="size-7" aria-hidden />
        </span>

        <p className="mt-6 font-mono text-[12px] uppercase tracking-[0.16em] text-ink-600">
          404 · not found
        </p>
        <h1 className="mt-3 text-balance text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-ink-50">
          This water runs somewhere else
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-400">
          The page, report or share link you followed does not exist — it may
          have been deleted by its author or by a moderator.
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <Home aria-hidden />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/map">
              <MapIcon aria-hidden />
              Explore the map
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
