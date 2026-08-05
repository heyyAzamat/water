"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Globe } from "lucide-react";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/config";
import { setLocale } from "@/lib/i18n/actions";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown";

/**
 * Segmented three-way switch — the whole set of languages is short enough that
 * a menu would only add a click. Collapses to a globe menu on narrow layouts.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const choose = React.useCallback(
    (next: Locale) => {
      if (next === locale) return;
      startTransition(async () => {
        await setLocale(next);
        router.refresh();
      });
    },
    [locale, router],
  );

  return (
    <>
      <div
        role="group"
        aria-label={t.language.label}
        className={cn(
          "hidden items-center gap-0.5 rounded-full border border-white/12 bg-white/[0.04] p-0.5 backdrop-blur-xl sm:inline-flex",
          pending && "opacity-60",
          className,
        )}
      >
        {LOCALES.map((code) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              onClick={() => choose(code)}
              aria-pressed={active}
              aria-label={LOCALE_META[code].label}
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors duration-200",
                active
                  ? "bg-lume-400/90 text-abyss-950"
                  : "text-ink-400 hover:bg-white/8 hover:text-ink-100",
              )}
            >
              {LOCALE_META[code].short}
            </button>
          );
        })}
      </div>

      {/* Compact fallback */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={t.language.change}
            className={cn(
              "grid size-8 place-items-center rounded-full border border-white/12 bg-white/[0.04] text-ink-300 backdrop-blur-xl transition-colors hover:text-ink-50 sm:hidden",
              className,
            )}
          >
            <Globe className="size-4" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {LOCALES.map((code) => (
            <DropdownMenuItem key={code} onSelect={() => choose(code)}>
              <span className="flex-1">{LOCALE_META[code].label}</span>
              {code === locale && <Check className="size-3.5" aria-hidden />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
