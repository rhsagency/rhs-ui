import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[1.25rem_1fr] has-[>svg]:gap-x-3 [&>svg]:mt-0.5 [&>svg]:size-4",
  {
    variants: {
      tone: {
        default: "border-border bg-background text-foreground [&>svg]:text-foreground",
        info: "border-border bg-muted/60 text-foreground [&>svg]:text-muted-foreground",
        success:
          "border-[color-mix(in_oklch,var(--color-success,oklch(0.62_0.15_150))_45%,transparent)] bg-[color-mix(in_oklch,var(--color-success,oklch(0.62_0.15_150))_7%,transparent)] text-foreground [&>svg]:text-[var(--color-success,oklch(0.62_0.15_150))]",
        warning:
          "border-[color-mix(in_oklch,var(--color-warning,oklch(0.72_0.16_75))_55%,transparent)] bg-[color-mix(in_oklch,var(--color-warning,oklch(0.72_0.16_75))_9%,transparent)] text-foreground [&>svg]:text-[var(--color-warning,oklch(0.62_0.16_65))]",
        destructive: "border-destructive/40 bg-destructive/5 text-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export interface AlertProps extends ComponentProps<"div">, VariantProps<typeof alertVariants> {}

/**
 * A message that stays on the page until its cause is gone: a notice, a
 * warning or an error, with an optional icon as the first child. Tone is
 * carried by the words and the icon as well as the colour. Use role="alert"
 * only for something that just happened and needs attention now.
 */
export function Alert({ className, tone, role = "status", ...props }: AlertProps) {
  return <div data-slot="alert" data-tone={tone ?? "default"} role={role} className={cn(alertVariants({ tone }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }: ComponentProps<"p">) {
  return <p data-slot="alert-title" className={cn("col-start-2 font-medium leading-snug", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("col-start-2 grid gap-1 text-sm leading-relaxed text-muted-foreground [&_p]:leading-relaxed", className)} {...props} />;
}

export { alertVariants };
