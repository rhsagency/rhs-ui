"use client";

import type { ComponentProps } from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

/**
 * One section that opens and closes: "Show 12 more", advanced settings, a
 * long description. For a list of sections use accordion. The content
 * animates its height, and under reduced motion it simply appears.
 */
export function Collapsible(props: ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

export function CollapsibleTrigger(props: ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />;
}

export function CollapsibleContent({ className, ...props }: ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return (
    <CollapsiblePrimitive.Content
      data-slot="collapsible-content"
      className={cn("overflow-hidden motion-safe:data-[state=closed]:animate-rhs-collapse-up motion-safe:data-[state=open]:animate-rhs-collapse-down", className)}
      {...props}
    />
  );
}
