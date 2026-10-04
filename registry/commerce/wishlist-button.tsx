"use client";

import { useState } from "react";

import { IconHeartAnimated } from "@rhs-ui/icons/animated/heart";
import { cn } from "@/lib/utils";

export interface WishlistButtonProps {
  /** The product, for the accessible name: "Save Linen apron". */
  product: string;
  saved: boolean;
  /** Persist the change; reject to undo it. */
  onSavedChange: (saved: boolean) => Promise<void> | void;
  variant?: "icon" | "label";
  className?: string;
}

/**
 * Save for later: a heart that answers the click right away (optimistic),
 * rolls back if saving fails, and reports aria-pressed so the state is
 * read out, not only seen.
 */
export function WishlistButton({ product, saved, onSavedChange, variant = "icon", className }: WishlistButtonProps) {
  const [on, setOn] = useState(saved);
  async function toggle() {
    const next = !on;
    setOn(next);
    try {
      await onSavedChange(next);
    } catch {
      setOn(!next);
    }
  }
  return (
    <button
      type="button"
      data-slot="wishlist-button"
      aria-pressed={on}
      aria-label={variant === "icon" ? `${on ? "Remove" : "Save"} ${product}` : undefined}
      onClick={() => void toggle()}
      className={cn("inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-pressed:[&_svg]:fill-current", variant === "icon" ? "size-10" : "h-10 px-4 text-sm", className)}
    >
      <IconHeartAnimated size={18} />
      {variant === "label" ? <span>{on ? "Saved" : "Save for later"}</span> : null}
    </button>
  );
}
