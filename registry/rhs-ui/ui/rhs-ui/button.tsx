import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { IconSpinner } from "@/registry/rhs-ui/ui/rhs-ui/icons";
import { cn } from "@/lib/utils";

/**
 * The RHS UI button. Solid fills, a quiet outline, a ghost for toolbars, and
 * a link style; no gradients, no shine. `asChild` renders the styles onto
 * your own element (a Next `Link`, an `<a>`), `loading` swaps the leading
 * icon for a spinner and disables the button while announcing busy.
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent font-medium select-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:border-ring",
    "active:not-disabled:translate-y-px disabled:pointer-events-none disabled:opacity-50",
    "aria-busy:cursor-progress",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        outline: "border-border bg-background text-foreground hover:bg-muted hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_18%)]",
        ghost: "text-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        sm: "h-8 px-3 text-[0.8125rem] [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-[0.9375rem]",
        icon: "size-9",
        "icon-sm": "size-8 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Render the styles onto the child element instead of a <button>. */
  asChild?: boolean;
  /** Busy state: disables the button, shows a spinner, announces aria-busy. */
  loading?: boolean;
}

export function Button({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <IconSpinner data-slot="button-spinner" /> : null}
      {children}
    </Comp>
  );
}

export { buttonVariants };
