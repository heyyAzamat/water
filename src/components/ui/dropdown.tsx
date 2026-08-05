"use client";

import * as React from "react";
import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

const surface =
  "z-50 min-w-48 overflow-hidden rounded-xl border border-white/12 bg-ink-850/95 p-1.5 shadow-2xl backdrop-blur-2xl data-[state=open]:animate-pop-in";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({
  className,
  sideOffset = 8,
  align = "end",
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(surface, "bg-ink-850/95", className)}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  destructive = false,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Item> & {
  destructive?: boolean;
}) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-ink-200 outline-none transition-colors",
        "focus:bg-white/8 focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
        "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-ink-400 focus:[&_svg]:text-ink-200",
        destructive &&
          "text-grade-critical focus:bg-grade-critical/12 focus:text-grade-critical [&_svg]:text-grade-critical focus:[&_svg]:text-grade-critical",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Label>) {
  return (
    <DropdownPrimitive.Label
      className={cn(
        "px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500",
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownPrimitive.Separator>) {
  return (
    <DropdownPrimitive.Separator
      className={cn("-mx-1.5 my-1.5 h-px bg-white/8", className)}
      {...props}
    />
  );
}

/* ------------------------------- Popover ------------------------------- */

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;
export const PopoverClose = PopoverPrimitive.Close;

export function PopoverContent({
  className,
  sideOffset = 8,
  align = "end",
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(surface, "bg-ink-850/95 p-0", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
