import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { renderAs, type RenderProp } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

/**
 * A small label with a meaning. Tones carry status (success, warning,
 * destructive) with text as well as colour; `outline` and `muted` are for
 * metadata. `asChild` turns it into a link or a button.
 */
const badgeVariants = cva(
  [
    "inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2 text-xs font-medium",
    "transition-[background-color,border-color,color] duration-150",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
    "[&>svg]:pointer-events-none [&>svg]:size-3",
  ],
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        outline: "border-border text-foreground [a&]:hover:bg-muted",
        muted: "border-transparent bg-muted text-muted-foreground",
        success: "border-transparent bg-[color-mix(in_oklch,var(--color-success,oklch(0.62_0.15_150))_18%,transparent)] text-foreground",
        warning: "border-transparent bg-[color-mix(in_oklch,var(--color-warning,oklch(0.72_0.16_75))_22%,transparent)] text-foreground",
        // The red darkened toward the text colour, so small words on the red tint reach 4.5:1 (plain red was 3.88:1), in both themes.
        destructive: "border-transparent bg-destructive/12 text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

export function Badge(input: BadgeProps & RenderProp) {
  const { className, variant, asChild = false, ...props } = renderAs(input);
  const Comp = asChild ? Slot.Root : "span";
  return <Comp data-slot="badge" data-variant={variant ?? "default"} className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
