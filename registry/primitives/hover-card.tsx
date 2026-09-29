"use client";

import type { ComponentProps } from "react";
import { HoverCard as HoverCardPrimitive } from "radix-ui";

import { panelSurface } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

/**
 * A preview that appears when a pointer rests on a link: a profile, a
 * repository, a product. It is a bonus for pointer users, never the only way
 * to reach the information, because touch and keyboard users may not see it.
 */
export function HoverCard({ openDelay = 250, closeDelay = 120, ...props }: ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" openDelay={openDelay} closeDelay={closeDelay} {...props} />;
}

export function HoverCardTrigger(props: ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />;
}

export function HoverCardContent({ className, align = "center", sideOffset = 8, ...props }: ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(panelSurface, "w-72 origin-(--radix-hover-card-content-transform-origin) p-4 outline-none", className)}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}
