"use client";

import type { ComponentProps } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";

import { IconCheck, IconMinus } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/**
 * A checkbox you can see at rest: the box has text contrast before anyone
 * hovers it. A check when on, a dash when `checked="indeterminate"` (the
 * parent of a partly chosen list). Space toggles. Pair it with
 * <Label htmlFor>; with a `name` it submits like a native checkbox.
 */
export function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group/checkbox peer inline-flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border border-muted-foreground bg-background text-primary-foreground shadow-xs",
        "transition-[background-color,border-color,box-shadow] duration-150 outline-none hover:border-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="flex items-center justify-center text-current">
        <IconCheck size={12} strokeWidth={2.5} className="group-data-[state=indeterminate]/checkbox:hidden" />
        <IconMinus size={12} strokeWidth={2.5} className="hidden group-data-[state=indeterminate]/checkbox:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
