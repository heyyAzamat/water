import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Glass surface primitive.
 *
 * `glow` adds a soft brand halo on hover — reserved for cards that are
 * genuinely interactive, so the halo stays a meaningful affordance.
 */
export function Card({
  className,
  glow = false,
  ...props
}: React.ComponentProps<"div"> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/8 bg-white/[0.035] backdrop-blur-xl transition-all duration-300",
        glow &&
          "hover:border-aqua-400/25 hover:bg-white/[0.055] hover:shadow-[0_0_0_1px_oklch(0.755_0.135_192/0.12),0_18px_50px_-24px_oklch(0.7_0.14_192/0.45)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-5 sm:p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  as: Comp = "h3",
  ...props
}: React.ComponentProps<"h3"> & { as?: React.ElementType }) {
  return (
    <Comp
      className={cn(
        "text-[15px] font-semibold tracking-[-0.01em] text-ink-50",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("text-[13px] leading-relaxed text-ink-400", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-5 pt-0 sm:p-6 sm:pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-white/6 px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}
