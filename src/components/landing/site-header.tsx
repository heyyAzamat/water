"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Menu, X } from "lucide-react";
import { MARKETING_NAV } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/provider";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/primitives";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

export function SiteHeader({ signedIn }: { signedIn: boolean }) {
  const t = useT();
  const { scrollY } = useScroll();
  const [condensed, setCondensed] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  useMotionValueEvent(scrollY, "change", (y) => setCondensed(y > 24));

  // Lock scroll while the mobile drawer is open.
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4"
      >
        <nav
          aria-label="Main"
          className={cn(
            "flex w-full max-w-6xl items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-400 sm:px-4",
            condensed
              ? "border-white/10 bg-abyss-1000/70 shadow-[0_18px_60px_-32px_oklch(0.71_0.15_213/0.7)] backdrop-blur-2xl"
              : "border-transparent bg-transparent",
          )}
        >
          <Logo />

          <ul className="ml-4 hidden items-center gap-1 lg:flex">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-[13.5px] font-medium text-ink-400 transition-colors hover:bg-white/6 hover:text-ink-100"
                >
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />

            {signedIn ? (
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">{t.common.openDashboard}</Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                >
                  <Link href="/login">{t.common.signIn}</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link href="/signup">{t.common.startFree}</Link>
                </Button>
              </>
            )}

            <Button
              variant="secondary"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? t.common.closeMenu : t.common.openMenu}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile drawer */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 z-40 lg:hidden"
      >
        <button
          className="absolute inset-0 bg-abyss-1000/85 backdrop-blur-md"
          onClick={() => setOpen(false)}
          aria-label={t.common.closeMenu}
          tabIndex={-1}
        />
        <div className="relative mx-4 mt-20 rounded-3xl border border-white/12 bg-abyss-950/95 p-4 backdrop-blur-2xl">
          <ul className="flex flex-col gap-1">
            {MARKETING_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-3 text-[15px] font-medium text-ink-200 transition-colors hover:bg-white/6 hover:text-white"
                >
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-white/8 pt-3">
            {signedIn ? (
              <Button asChild size="lg">
                <Link href="/dashboard">{t.common.openDashboard}</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">{t.common.signIn}</Link>
                </Button>
                <Button asChild size="lg">
                  <Link href="/signup">{t.common.startFree}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
