import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromAcceptLanguage,
  type Locale,
} from "./config";
import { getDictionary } from "./dictionaries";
import type { Dictionary } from "./dictionaries/en";

/**
 * Active locale for the current request.
 *
 * Cookie first (an explicit choice always wins), `Accept-Language` as the
 * first-visit guess, then the default.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const fromCookie = store.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  try {
    const headerList = await headers();
    return localeFromAcceptLanguage(headerList.get("accept-language"));
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Locale + dictionary in one await, which is what most pages actually need. */
export async function getI18n(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}

/** Dictionary only. */
export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}
