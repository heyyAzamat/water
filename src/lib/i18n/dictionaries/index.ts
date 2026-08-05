import { DEFAULT_LOCALE, type Locale } from "../config";
import { en, type Dictionary } from "./en";
import { ru } from "./ru";
import { kk } from "./kk";

const DICTIONARIES: Record<Locale, Dictionary> = { en, ru, kk };

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
}

export type { Dictionary };
