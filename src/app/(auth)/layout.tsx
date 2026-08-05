import Link from "next/link";
import { ArrowLeft, Droplets, ScanLine, TrendingDown } from "lucide-react";
import { Logo } from "@/components/shared/primitives";
import { AbyssBackdrop, EditionMark } from "@/components/shared/abyss";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { platformStats } from "@/lib/data/repository";
import { compactNumber } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { fmt } from "@/lib/i18n/format";

const ASIDE_ICONS = [ScanLine, TrendingDown, Droplets];

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stats, t] = await Promise.all([platformStats(), getT()]);

  return (
    <div className="relative isolate grid min-h-dvh lg:grid-cols-2">
      <AbyssBackdrop depth={0.8} particles />

      {/* Form column */}
      <div className="relative flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] text-ink-400 transition-colors hover:bg-white/6 hover:text-ink-100"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              {t.auth.backToSite}
            </Link>
          </div>
        </div>

        <main
          id="main"
          className="flex flex-1 items-center justify-center py-10"
        >
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <p className="text-center text-[11.5px] leading-relaxed text-ink-600">
          {t.auth.consent}
        </p>
      </div>

      {/* Marketing column */}
      <aside className="relative hidden overflow-hidden border-l border-white/8 bg-abyss-950/50 lg:flex lg:flex-col lg:justify-center">
        <div
          className="pointer-events-none absolute inset-0 grid-noise opacity-40"
          aria-hidden
        />
        <div className="relative px-14 py-16">
          <EditionMark
            left="AquaVision AI"
            right={String(new Date().getFullYear())}
            className="mb-14"
          />

          <h2 className="text-lume-soft max-w-md text-balance text-[2.35rem] font-semibold leading-[1.06] tracking-[-0.045em] text-ink-50">
            {t.auth.asideTitle}{" "}
            <span className="text-gradient-aqua">{t.auth.asideTitleAccent}</span>
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-ink-400">
            {fmt(t.auth.asideBody, {
              contributors: compactNumber(stats.contributors),
              reports: compactNumber(stats.reports),
              locations: stats.locations,
              countries: stats.countries,
            })}
          </p>

          <ul className="mt-10 flex flex-col gap-5">
            {t.auth.asideItems.map((item, i) => {
              const Icon = ASIDE_ICONS[i] ?? ScanLine;
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-lume-400/22 bg-lume-400/10 text-lume-200">
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[14.5px] font-medium text-ink-100">
                      {item.title}
                    </p>
                    <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-500">
                      {item.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
