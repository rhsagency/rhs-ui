import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as TogglePrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-foreground data-[state=on]:text-background [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent text-muted-foreground",
        outline: "border border-border bg-background text-muted-foreground shadow-xs data-[state=on]:border-foreground",
      },
      size: {
        sm: "h-8 min-w-8 px-2",
        default: "h-9 min-w-9 px-2.5",
        lg: "h-10 min-w-10 px-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ToggleProps extends ComponentProps<typeof TogglePrimitive.Root>, VariantProps<typeof toggleVariants> {}

/**
 * A button that stays pressed: bold, pin, mute. It announces its state as
 * pressed or not. An icon-only toggle needs an aria-label that names the
 * action, not the state ("Bold", not "Bold on").
 */
export function Toggle({ className, variant, size, ...props }: ToggleProps) {
  return <TogglePrimitive.Root data-slot="toggle" className={cn(toggleVariants({ variant, size }), className)} {...props} />;
}

export { toggleVariants };
