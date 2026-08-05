"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const controlStyles =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-ink-100 outline-none transition-all duration-200 placeholder:text-ink-500 hover:border-white/16 focus:border-aqua-400/50 focus:bg-white/[0.06] focus:ring-4 focus:ring-aqua-400/10 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-grade-critical/50 aria-[invalid=true]:ring-grade-critical/10";

export function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-[13px] font-medium text-ink-300 peer-disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn(controlStyles, "h-11", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(controlStyles, "min-h-24 resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(
          controlStyles,
          "h-11 cursor-pointer appearance-none pr-9 [&>option]:bg-ink-900 [&>option]:text-ink-100",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400"
      >
        <path
          d="M6 8l4 4 4-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** Label + control + description/error, wired up for screen readers. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const describedBy = [hint ? `${htmlFor}-hint` : null, error ? `${htmlFor}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="ml-1 text-grade-critical" aria-hidden>
              *
            </span>
          )}
        </Label>
        {hint && !error && (
          <span id={`${htmlFor}-hint`} className="text-[11px] text-ink-500">
            {hint}
          </span>
        )}
      </div>

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
            id: htmlFor,
            "aria-invalid": error ? true : undefined,
            "aria-describedby": describedBy || undefined,
            "aria-required": required || undefined,
          })
        : children}

      {error && (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="text-[12px] text-grade-critical"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export { controlStyles };
