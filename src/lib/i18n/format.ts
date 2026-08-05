import type { Locale } from "./config";

/**
 * Replaces `{token}` placeholders in a dictionary string.
 *
 *   fmt(t.footer.rights, { year: 2026 })
 *
 * Dictionaries stay serialisable data (they cross the server → client
 * boundary), so interpolation has to live outside them.
 */
export function fmt(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match,
  );
}

/** BCP 47 tag for `Intl` formatting. */
export function intlLocale(locale: Locale): string {
  return locale === "kk" ? "kk-KZ" : locale === "ru" ? "ru-RU" : "en-GB";
}
