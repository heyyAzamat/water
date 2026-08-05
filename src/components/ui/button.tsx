"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0 select-none active:scale-[0.985]",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-br from-aqua-400 to-flux-500 text-ink-950 font-semibold shadow-[0_8px_28px_-10px_oklch(0.7_0.14_192/0.7)] hover:shadow-[0_12px_36px_-10px_oklch(0.7_0.14_192/0.85)] hover:brightness-110",
        secondary:
          "glass text-ink-100 hover:bg-white/10 hover:border-white/20",
        outline:
          "border border-white/12 bg-transparent text-ink-200 hover:bg-white/6 hover:text-white hover:border-white/25",
        ghost: "text-ink-300 hover:bg-white/6 hover:text-white",
        danger:
          "bg-grade-critical/15 text-grade-critical border border-grade-critical/30 hover:bg-grade-critical/25",
        link: "text-aqua-300 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 rounded-lg px-3 text-[13px] [&_svg]:size-3.5",
        md: "h-10 rounded-xl px-4 text-sm [&_svg]:size-4",
        lg: "h-12 rounded-xl px-6 text-[15px] [&_svg]:size-[18px]",
        icon: "size-10 rounded-xl [&_svg]:size-[18px]",
        "icon-sm": "size-8 rounded-lg [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { buttonVariants };
