"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconMinus, IconPlus, IconSpinner, IconTrash } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface AddStepperProps extends Omit<ComponentProps<"div">, "onChange" | "defaultValue" | "children"> {
  /** The quantity in the cart. Zero shows the Add button. Controlled: pair it with `onChange`. */
  value?: number;
  /** The quantity to start with when uncontrolled. */
  defaultValue?: number;
  /** Called with the new quantity. Zero means the item was removed. */
  onChange?: (value: number) => void;
  /** The smallest quantity that can be in the cart, and what Add starts from. Minus at the minimum removes the item. Defaults to 1. */
  min?: number;
  /** The most one order may hold. Plus is disabled there, with the reason shown. */
  max?: number;
  /** How many are in stock. Plus is disabled at this number, with the reason shown; zero means sold out. */
  stockLimit?: number;
  /** The cart is updating: the count becomes a spinner and presses are ignored, while the width and the focus stay where they are. */
  busy?: boolean;
  /** The product's name, used in every accessible name: "Linen shirt". */
  label: string;
  /** The footprint: 5.75rem by 2rem, 6.5rem by 2.25rem or 8rem by 2.75rem. */
  size?: "sm" | "md" | "lg";
  /** The visible text of the Add button. */
  addLabel?: string;
}

/*
 * The footprint is fixed per size, so Add and the stepper take the same room
 * and nothing around them moves. The three columns are all lengths, which is
 * what lets the grid animate between them. The 1px border sits inside --full,
 * so the columns add up to the inner box (--full minus 2px), and the button on
 * the right reaches the edge instead of running 2px under it: its focus ring
 * would lose its right side there.
 */
const SIZES = {
  sm: { vars: "[--full:5.75rem] [--seg:2rem] [--mid:1.75rem]", box: "h-8 text-[0.8125rem]", icon: 14 },
  md: { vars: "[--full:6.5rem] [--seg:2.25rem] [--mid:2rem]", box: "h-9 text-sm", icon: 16 },
  lg: { vars: "[--full:8rem] [--seg:2.75rem] [--mid:2.5rem]", box: "h-11 text-[0.9375rem]", icon: 18 },
} as const;

/**
 * The signature control of grocery and food ordering: one Add button that,
 * once the item is in the cart, becomes a minus, a count and a plus in the
 * same footprint, and goes back to Add at zero. The button on the right is the
 * same element in both states, so focus stays on what was pressed when the
 * control changes shape; at zero the focus moves to it from the minus. Its name
 * tracks the state ("Add Linen shirt", then a group named "Quantity of Linen
 * shirt, 2"), every change is announced politely, and the stock or order cap
 * disables plus with the reason shown under it. The reason hangs below the
 * control without taking room, so nothing moves when the cap is reached or
 * left: leave a line of space under the control for it. Busy keeps everything
 * in place.
 */
export function AddStepper({ value, defaultValue = 0, onChange, min = 1, max, stockLimit, busy = false, label, size = "md", addLabel = "Add", className, ...props }: AddStepperProps) {
  const reasonId = useId();
  const root = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLButtonElement>(null);
  const [own, setOwn] = useState(defaultValue);
  const [announcement, setAnnouncement] = useState("");
  const current = value ?? own;
  const before = useRef(current);
  // While the control folds back into Add, the count keeps showing the last number instead of flashing "0".
  const [shown, setShown] = useState(current);
  if (current > 0 && current !== shown) setShown(current);

  const inCart = current > 0;
  const cap = Math.min(max ?? Number.POSITIVE_INFINITY, stockLimit ?? Number.POSITIVE_INFINITY);
  const soldOut = stockLimit !== undefined && stockLimit <= 0;
  const atCap = Number.isFinite(cap) && current >= cap;
  const cannotStart = !inCart && cap < min;
  const stockBinds = stockLimit !== undefined && stockLimit <= (max ?? Number.POSITIVE_INFINITY);
  const capReason = stockBinds ? `Only ${stockLimit} in stock` : max !== undefined ? `Max ${max} per order` : "";
  const reason = !soldOut && (inCart ? atCap : cannotStart) ? capReason : null;
  const mainDisabled = soldOut || cannotStart || (inCart && atCap);
  const removing = current <= min;
  const spec = SIZES[size];

  // Say what changed, once, after it has changed. The first render says nothing.
  useEffect(() => {
    const previous = before.current;
    if (previous === current) return;
    before.current = current;
    const text = current === 0 ? `${label} removed from your cart.` : previous === 0 ? `${label} added. Quantity ${current}.` : `Quantity of ${label}, ${current}.`;
    setAnnouncement(current > 0 && Number.isFinite(cap) && current >= cap ? `${text} ${capReason}.` : text);
    // The minus that was pressed has just gone: keep the focus where the control still is.
    if (previous > 0 && current === 0) {
      const active = document.activeElement;
      if (!active || active === document.body || root.current?.contains(active)) main.current?.focus();
    }
  }, [current, cap, capReason, label]);

  function commit(next: number) {
    if (busy) return;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  }

  const segment = cn(
    "grid h-full min-w-0 place-items-center overflow-hidden outline-none transition-[background-color,opacity] duration-150 motion-reduce:transition-none",
    "focus-visible:ring-2 focus-visible:ring-inset",
    inCart ? "hover:bg-primary-foreground/15 active:bg-primary-foreground/25 focus-visible:ring-primary-foreground" : "hover:bg-muted active:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_7%)] focus-visible:ring-ring",
  );

  return (
    <div ref={root} data-slot="add-stepper" data-in-cart={inCart || undefined} className={cn("relative inline-flex flex-col", spec.vars, className)} {...props}>
      <div
        role={inCart ? "group" : undefined}
        aria-label={inCart ? `Quantity of ${label}, ${current}` : undefined}
        aria-busy={busy || undefined}
        className={cn(
          "relative inline-grid w-(--full) items-stretch overflow-hidden rounded-md border font-medium select-none",
          "transition-[grid-template-columns,background-color,border-color,color] duration-200 ease-out motion-reduce:transition-none",
          spec.box,
          inCart
            ? "grid-cols-[calc(var(--seg)_-_1px)_var(--mid)_calc(var(--seg)_-_1px)] border-primary bg-primary text-primary-foreground"
            : "grid-cols-[0px_0px_calc(var(--full)_-_2px)] border-border bg-background text-foreground shadow-xs",
        )}
      >
        <button
          type="button"
          inert={!inCart}
          // inert already does this; the attributes cover a browser that does not know it yet.
          aria-hidden={!inCart || undefined}
          tabIndex={inCart ? undefined : -1}
          aria-label={removing ? `Remove ${label}` : `Remove one ${label}`}
          onClick={() => commit(removing ? 0 : current - 1)}
          className={cn(segment, "transition-opacity", inCart ? "opacity-100" : "opacity-0")}
        >
          {removing ? <IconTrash size={spec.icon} /> : <IconMinus size={spec.icon} />}
        </button>

        <span aria-hidden="true" className={cn("grid min-w-0 place-items-center overflow-hidden tabular-nums transition-opacity duration-150 motion-reduce:transition-none", inCart ? "opacity-100" : "opacity-0")}>
          {busy ? <IconSpinner size={spec.icon - 2} /> : shown}
        </span>

        <button
          ref={main}
          type="button"
          aria-label={inCart ? `Add one more ${label}` : soldOut ? `${label} is sold out` : `Add ${label}`}
          aria-disabled={mainDisabled || undefined}
          aria-describedby={reason ? reasonId : undefined}
          onClick={() => {
            if (busy || mainDisabled) return;
            commit(inCart ? current + 1 : min);
          }}
          className={cn(
            segment,
            "relative aria-disabled:cursor-not-allowed",
            // Sold out is the only word that says why the button does nothing, so it stays at full strength on a quiet plate; the plus that
            // reached the cap is just an icon, and fades.
            soldOut ? "bg-muted/50 text-muted-foreground aria-disabled:hover:bg-muted/50 aria-disabled:active:bg-muted/50" : "aria-disabled:opacity-45 aria-disabled:hover:bg-transparent aria-disabled:active:bg-transparent",
          )}
        >
          <span className={cn("col-start-1 row-start-1 inline-flex items-center justify-center gap-1.5 whitespace-nowrap transition-[opacity,scale] duration-200 motion-reduce:transition-none", inCart ? "scale-75 opacity-0" : "scale-100 opacity-100")}>
            {soldOut ? null : busy && !inCart ? <IconSpinner size={spec.icon} /> : <IconPlus size={spec.icon} />}
            {soldOut ? "Sold out" : addLabel}
          </span>
          <span aria-hidden="true" className={cn("col-start-1 row-start-1 transition-[opacity,scale] duration-200 motion-reduce:transition-none", inCart ? "scale-100 opacity-100" : "scale-75 opacity-0")}>
            <IconPlus size={spec.icon} />
          </span>
        </button>
      </div>

      {reason ? (
        // Out of the flow: the control keeps its place, and nothing around it moves, whether the reason is showing or not.
        <p id={reasonId} className="pointer-events-none absolute top-full left-0 mt-1.5 w-(--full) text-center text-xs leading-snug text-balance text-muted-foreground">
          {reason}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
