"use server";

import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
} from "./config";

/**
 * Persists the visitor's language choice.
 *
 * The caller refreshes the router afterwards; every server component re-reads
 * the cookie on the next render, so no route or URL has to change.
 */
export async function setLocale(value: string) {
  const store = await cookies();
  store.set(LOCALE_COOKIE, isLocale(value) ? value : DEFAULT_LOCALE, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}
