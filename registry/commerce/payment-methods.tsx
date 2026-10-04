import type { ReactNode } from "react";

import { IconLock } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PaymentMethodsProps {
  /** The methods you accept, by name: "iDEAL", "Visa", "Apple Pay". Shown as text, so no logo licences are needed. */
  methods: readonly string[];
  /** The reassurance line: "Secure checkout, encrypted end to end". */
  note?: ReactNode;
  /** "row" under a buy button, "footer" in a site footer. */
  variant?: "row" | "footer";
  className?: string;
}

/**
 * Which ways to pay, near the buy button or in the footer: each method as a
 * small bordered tag with its name (readable, translatable, no borrowed
 * logos) and an optional lock line. A list, so screen readers can count
 * the options.
 */
export function PaymentMethods({ methods, note, variant = "row", className }: PaymentMethodsProps) {
  return (
    <div data-slot="payment-methods" className={cn("grid gap-2", variant === "footer" && "justify-items-start", className)}>
      {note ? <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><IconLock aria-hidden="true" className="size-3.5" />{note}</p> : null}
      <ul aria-label="Accepted payment methods" className="flex flex-wrap gap-1.5">
        {methods.map((method) => (
          <li key={method} className={cn("rounded-md border border-border px-2 py-1 text-[11px] font-medium tracking-wide", variant === "footer" ? "text-muted-foreground" : "bg-background")}>{method}</li>
        ))}
      </ul>
    </div>
  );
}
