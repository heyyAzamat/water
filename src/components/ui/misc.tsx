"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { ChevronDown } from "lucide-react";
import { cn, initials } from "@/lib/utils";

/* ------------------------------- Avatar ------------------------------- */

export function Avatar({
  name,
  src,
  size = 36,
  className,
  ring = true,
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
  className?: string;
  ring?: boolean;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        ring && "ring-1 ring-white/12",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt=""
          className="size-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        delayMs={src ? 300 : 0}
        className="flex size-full items-center justify-center bg-gradient-to-br from-aqua-600/50 to-flux-600/50 font-semibold text-ink-50"
        style={{ fontSize: Math.max(10, size * 0.36) }}
      >
        {initials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

/* -------------------------------- Tabs -------------------------------- */

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center gap-1 rounded-xl border border-white/8 bg-white/[0.035] p-1 backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-[13px] font-medium text-ink-400 transition-all duration-200",
        "hover:text-ink-100",
        "data-[state=active]:bg-white/10 data-[state=active]:text-white data-[state=active]:shadow-sm",
        "[&_svg]:size-3.5",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-5 outline-none", className)}
      {...props}
    />
  );
}

/* ------------------------------ Tooltip ------------------------------ */

export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({
  content,
  children,
  side = "top",
  delay = 220,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  delay?: number;
}) {
  return (
    <TooltipPrimitive.Root delayDuration={delay}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={8}
          className={cn(
            "z-50 max-w-64 rounded-lg border border-white/12 bg-ink-850/95 px-2.5 py-1.5 text-[12px] leading-snug text-ink-200 shadow-xl backdrop-blur-xl",
            "data-[state=delayed-open]:animate-pop-in",
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-ink-850" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ----------------------------- Accordion ----------------------------- */

export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-xl transition-colors data-[state=open]:border-white/14 data-[state=open]:bg-white/[0.05]",
        className,
      )}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex flex-1 items-center justify-between gap-4 px-5 py-4 text-left text-[15px] font-medium text-ink-100 transition-colors hover:text-white sm:px-6",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          className="size-4 shrink-0 text-ink-400 transition-transform duration-300 group-data-[state=open]:rotate-180 group-data-[state=open]:text-aqua-300"
          aria-hidden
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden text-[14px] leading-relaxed text-ink-400",
        "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        className,
      )}
      {...props}
    >
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
    </AccordionPrimitive.Content>
  );
}

/* ------------------------------- Switch ------------------------------- */

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-white/10 transition-colors",
        "data-[state=unchecked]:bg-white/8 data-[state=checked]:bg-aqua-500/70 data-[state=checked]:border-aqua-400/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-4.5 rounded-full bg-white shadow-lg transition-transform",
          "data-[state=unchecked]:translate-x-1 data-[state=checked]:translate-x-[1.375rem]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

/* ------------------------------ Skeleton ------------------------------ */

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("shimmer-bg rounded-xl", className)}
      aria-hidden
      {...props}
    />
  );
}

/* ----------------------------- Separator ----------------------------- */

export function Separator({
  className,
  orientation = "horizontal",
  ...props
}: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        "shrink-0 bg-white/8",
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        className,
      )}
      {...props}
    />
  );
}
