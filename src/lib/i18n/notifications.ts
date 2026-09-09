import type { Notification } from "@/types";
import type { Dictionary } from "./dictionaries/en";
import { fmt } from "./format";

/**
 * Renders a notification's title and body in the active locale.
 *
 * Copy is templated per `kind` in the dictionaries, with the variable parts
 * (author, location, score) carried on the row as `params`. Rows without
 * `params` — written before localisation, or by anything outside this app —
 * keep their stored English text rather than rendering raw `{placeholder}`
 * tokens.
 */
export function localiseNotification(
  notification: Notification,
  kinds: Dictionary["pages"]["notifications"]["kinds"],
  grades: Dictionary["grades"],
): { title: string; body: string } {
  const template = kinds[notification.kind];
  if (!template || !notification.params) {
    return { title: notification.title, body: notification.body };
  }

  const { grade, ...rest } = notification.params;
  const vars: Record<string, string | number> = { ...rest };
  // `grade` is stored as the canonical English band name — render its label.
  if (grade) vars.grade = grades[grade as keyof Dictionary["grades"]]?.label ?? grade;

  return {
    title: fmt(template.title, vars),
    body: fmt(template.body, vars),
  };
}
