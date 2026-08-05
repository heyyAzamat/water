/**
 * Locale configuration.
 *
 * The active locale lives in a cookie rather than the URL: every route stays
 * exactly where it is, server components read it from `cookies()`, and the
 * switch is a server action away. No route duplication, no middleware rewrite.
 */

export const LOCALES = ["en", "ru", "kk"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_COOKIE = "aqv_locale";

/** One year — the choice should outlive the session. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_META: Record<
  Locale,
  { label: string; short: string; htmlLang: string }
> = {
  en: { label: "English", short: "EN", htmlLang: "en" },
  ru: { label: "Русский", short: "RU", htmlLang: "ru" },
  kk: { label: "Қазақша", short: "KK", htmlLang: "kk" },
};

export function isLocale(value: string | undefined | null): value is Locale {
  return Boolean(value) && LOCALES.includes(value as Locale);
}

/**
 * Best-effort match of an `Accept-Language` header, used only the first time a
 * visitor arrives without a cookie.
 */
export function localeFromAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const tags = header
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean) as string[];

  for (const tag of tags) {
    const base = tag.split("-")[0];
    if (base === "kk") return "kk";
    if (base === "ru") return "ru";
    if (base === "en") return "en";
  }
  return DEFAULT_LOCALE;
}
