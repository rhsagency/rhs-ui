"use client";

import type { ComponentProps } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * The surface every floating panel shares: Popover, Select, Dropdown menu and
 * Combobox. Same border, radius, shadow and entrance, so a page never shows
 * two kinds of panel.
 */
export const panelSurface = cn(
  "z-50 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg outline-none",
  "data-[state=open]:animate-rhs-in data-[state=closed]:animate-rhs-out",
);

/**
 * A panel anchored to its trigger for content that is more than a tooltip and
 * less than a dialog: a small form, filters, a colour picker. Focus moves in
 * on open and back to the trigger on close; Escape and a click outside close
 * it.
 */
export function Popover(props: ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export function PopoverTrigger(props: ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

export function PopoverAnchor(props: ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export function PopoverClose(props: ComponentProps<typeof PopoverPrimitive.Close>) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

export function PopoverContent({ className, align = "center", sideOffset = 6, ...props }: ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(panelSurface, "w-72 origin-(--radix-popover-content-transform-origin) p-4", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
