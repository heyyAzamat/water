import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border font-medium whitespace-nowrap transition-colors [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        neutral: "border-white/10 bg-white/6 text-ink-300",
        brand: "border-aqua-400/25 bg-aqua-400/10 text-aqua-200",
        flux: "border-flux-400/25 bg-flux-400/12 text-flux-300",
        outline: "border-white/14 bg-transparent text-ink-300",
        excellent:
          "border-grade-excellent/28 bg-grade-excellent/12 text-grade-excellent",
        good: "border-grade-good/28 bg-grade-good/12 text-grade-good",
        moderate:
          "border-grade-moderate/28 bg-grade-moderate/12 text-grade-moderate",
        poor: "border-grade-poor/28 bg-grade-poor/12 text-grade-poor",
        critical:
          "border-grade-critical/30 bg-grade-critical/12 text-grade-critical",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px] [&_svg]:size-3",
        md: "px-2.5 py-1 text-xs [&_svg]:size-3.5",
        lg: "px-3 py-1.5 text-[13px] [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { badgeVariants };
