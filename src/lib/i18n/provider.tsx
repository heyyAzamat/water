"use client";

import * as React from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { getDictionary } from "./dictionaries";
import type { Dictionary } from "./dictionaries/en";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
}

const I18nContext = React.createContext<I18nValue | null>(null);

/**
 * The dictionary is resolved on the client from the locale alone, so only a
 * two-character string crosses the RSC boundary instead of the whole object.
 * The bundle already contains every locale (three small data modules), and
 * this keeps the payload of every page that renders a client component flat.
 */
export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const value = React.useMemo<I18nValue>(
    () => ({ locale, t: getDictionary(locale) }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** Dictionary for the active locale. */
export function useT(): Dictionary {
  return useI18n().t;
}

export function useI18n(): I18nValue {
  const value = React.useContext(I18nContext);
  // Falling back keeps isolated client components (Storybook, tests, a stray
  // portal) rendering real copy instead of throwing.
  if (!value) {
    return { locale: DEFAULT_LOCALE, t: getDictionary(DEFAULT_LOCALE) };
  }
  return value;
}
