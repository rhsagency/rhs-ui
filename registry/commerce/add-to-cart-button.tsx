"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Glyph, IconAlertCircle, IconArrowRight, IconBag, IconBell, IconRefresh, IconSpinner } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { formatMoney, type Money } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export type AddToCartStatus = "idle" | "adding" | "added" | "failed";

export interface AddToCartLabels {
  /** The label of a pre-order, before the price. */
  preorder?: string;
  /** On the button while the add runs. */
  adding?: string;
  /** On the button once the item is in the cart. */
  added?: string;
  /** The link beside "Added". */
  viewCart?: string;
  /** The inline error after a failed add. */
  failed?: string;
  /** The word beside the failed error: the whole error is the retry button. */
  retry?: string;
  /** On the button of a sold-out product that has no `onNotify`. */
  soldOut?: string;
  /** The button of a sold-out product when `onNotify` is given. */
  notify?: string;
  /** What the button says once the shopper asked to be notified. */
  notified?: string;
  /** The line under a pre-order. {date} is `preorder.shipsOn`. */
  shipsOn?: string;
}

export interface AddToCartButtonProps extends Omit<ComponentProps<"div">, "children"> {
  /** Adds the item. Return a promise: the button is busy until it settles, says "Added" when it resolves and shows an inline error with Retry when it rejects. */
  onAdd?: () => void | Promise<void>;
  /** Drive the state yourself, for example from a mutation. The button then only shows it, and a press calls `onAdd`. */
  status?: AddToCartStatus;
  /** The verb on the button. */
  label?: string;
  /** The price shown on the button after the label, in minor units with its currency. */
  price?: Money;
  /** The product cannot be bought: the button says "Sold out". */
  soldOut?: boolean;
  /** With a sold-out product, turns the button into "Notify me" and calls this when it is pressed. */
  onNotify?: () => void | Promise<void>;
  /** A choice is still open: the button says what is missing ("Select a size") and a press calls `onFocusOption`, so you can move focus to the variant control. */
  missingOption?: { label: string; onFocusOption?: () => void };
  /** A product that ships later: the button says "Pre-order" and the date shows under it, formatted for your reader ("12 March"). */
  preorder?: { shipsOn: string };
  /** Where "View cart" goes after an add. */
  cartHref?: string;
  /** How long "Added" and "View cart" stay before the button returns to its label, in milliseconds. Hovering or focusing "View cart" pauses it. */
  resetAfter?: number;
  /** "lg", the default, is the tall buy button of a product page. */
  size?: "default" | "lg";
  /** Always pass your application locale, so the server and the browser print the same price. */
  locale?: string;
  /** The words, for another language. */
  labels?: AddToCartLabels;
  /** Extra classes for the main button; `className` styles the wrapper around it. */
  buttonClassName?: string;
}

const WORDS = {
  preorder: "Pre-order",
  adding: "Adding…",
  added: "Added",
  viewCart: "View cart",
  failed: "Couldn't add to cart",
  retry: "Retry",
  soldOut: "Sold out",
  notify: "Notify me",
  notified: "We'll let you know",
  shipsOn: "Ships {date}",
} satisfies Required<AddToCartLabels>;

/** A tick that draws itself in when its face becomes the active one. */
function Tick({ active }: { active: boolean }) {
  return (
    <Glyph size={16} className="shrink-0">
      <path d="M5 12.5l4.5 4.5L19 7" pathLength={1} strokeDasharray={1} className={cn("transition-[stroke-dashoffset] delay-100 duration-300 ease-out motion-reduce:transition-none", active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
    </Glyph>
  );
}

/**
 * The buy button with the states only a shop needs: it shows the label and the
 * price, says what is missing ("Select a size") and hands focus to your
 * variant control, goes busy while the add runs, then says "Added" beside a
 * "View cart" link, or shows an inline error with Retry. Sold out turns into
 * "Notify me" and a pre-order says when it ships. Every state lives in the
 * same footprint, so nothing shifts, and each result is announced politely.
 * Presses while an add is pending are ignored.
 */
export function AddToCartButton({
  onAdd,
  status: controlled,
  label = "Add to cart",
  price,
  soldOut = false,
  onNotify,
  missingOption,
  preorder,
  cartHref = "/cart",
  resetAfter = 4500,
  size = "lg",
  locale = "en-US",
  labels,
  buttonClassName,
  className,
  ...props
}: AddToCartButtonProps) {
  const words = { ...WORDS, ...labels };
  const captionId = useId();
  const [own, setOwn] = useState<AddToCartStatus>("idle");
  const [asked, setAsked] = useState<"idle" | "pending" | "done">("idle");
  const [paused, setPaused] = useState(false);
  const pending = useRef(false);

  const mode = soldOut ? "sold-out" : missingOption ? "missing" : preorder ? "preorder" : "buy";
  const purchasable = mode === "buy" || mode === "preorder";
  const status: AddToCartStatus = purchasable ? (controlled ?? own) : "idle";
  const split = purchasable && status === "added";
  // 0 the label, 1 adding, 2 added, 3 failed, 4 asked to be notified.
  const active = mode === "sold-out" ? (asked === "done" ? 4 : 0) : status === "adding" ? 1 : status === "added" ? 2 : status === "failed" ? 3 : 0;
  const blocked = mode === "sold-out" ? !onNotify || asked !== "idle" : status === "adding" || status === "added";
  // A product that cannot be bought is a quiet button: "Notify me" is still an action, so it keeps a fill that shows in both themes.
  const variant = active === 3 || (mode === "sold-out" && !onNotify) ? "outline" : active === 2 || active === 4 || mode === "sold-out" ? "secondary" : "default";

  useEffect(() => {
    if (controlled !== undefined || own !== "added" || paused) return;
    const timeout = window.setTimeout(() => setOwn("idle"), resetAfter);
    return () => window.clearTimeout(timeout);
  }, [controlled, own, paused, resetAfter]);

  async function press() {
    if (mode === "missing") {
      missingOption?.onFocusOption?.();
      return;
    }
    if (blocked || pending.current) return;
    pending.current = true;
    try {
      if (mode === "sold-out") {
        setAsked("pending");
        try {
          await onNotify?.();
          setAsked("done");
        } catch {
          setAsked("idle");
        }
        return;
      }
      if (controlled === undefined) setOwn("adding");
      try {
        await onAdd?.();
        if (controlled === undefined) setOwn("added");
      } catch {
        if (controlled === undefined) setOwn("failed");
      }
    } finally {
      pending.current = false;
    }
  }

  const amount = price ? formatMoney(price, locale) : null;
  const face = "col-start-1 row-start-1 flex min-w-0 items-center justify-center gap-2 whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none";
  const faces: ReactNode[] = [
    mode === "sold-out" ? (
      <>
        {onNotify ? asked === "pending" ? <IconSpinner /> : <IconBell /> : null}
        {onNotify ? words.notify : words.soldOut}
      </>
    ) : mode === "missing" ? (
      missingOption?.label
    ) : (
      <>
        <IconBag />
        <span className="min-w-0 truncate">{mode === "preorder" ? words.preorder : label}</span>
        {amount ? (
          <>
            <span aria-hidden="true" className="opacity-50">
              ·
            </span>
            <span className="shrink-0 tabular-nums">{amount}</span>
          </>
        ) : null}
      </>
    ),
    <>
      <IconSpinner />
      {words.adding}
    </>,
    <>
      <Tick active={active === 2} />
      {words.added}
    </>,
    <>
      <span className="flex min-w-0 items-center gap-2">
        <IconAlertCircle />
        <span className="truncate">{words.failed}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 font-semibold underline underline-offset-4">
        {words.retry}
        <IconRefresh />
      </span>
    </>,
    <>
      <Tick active={active === 4} />
      {words.notified}
    </>,
  ];

  const spoken = active === 1 ? words.adding : active === 2 ? words.added : active === 3 ? words.failed : active === 4 ? words.notified : "";

  return (
    <div data-slot="add-to-cart-button" data-status={status} className={cn("grid w-full gap-2", className)} {...props}>
      <div className="grid transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none" style={{ gridTemplateColumns: split ? "1fr 1fr" : "1fr 0fr" }}>
        <div className="min-w-0">
          <Button
            type="button"
            size={size === "lg" ? "lg" : "default"}
            variant={variant}
            aria-busy={active === 1 || undefined}
            aria-disabled={blocked || undefined}
            aria-describedby={preorder && mode === "preorder" ? captionId : undefined}
            onClick={() => void press()}
            className={cn("w-full", (split || active === 3) && "px-3", blocked && "pointer-events-none", active === 3 && "border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/8 hover:text-destructive", mode === "sold-out" && !onNotify && "text-muted-foreground", buttonClassName)}
          >
            <span className="grid w-full grid-cols-[minmax(0,1fr)]">
              {faces.map((content, index) => (
                <span key={index} aria-hidden={index === active ? undefined : true} className={cn(face, index === 3 && "justify-between", index === active ? "opacity-100" : "pointer-events-none opacity-0")}>
                  {content}
                </span>
              ))}
            </span>
          </Button>
        </div>
        <div className="min-w-0 overflow-hidden" inert={!split} onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <div className="pl-2">
            <Button asChild variant="outline" size={size === "lg" ? "lg" : "default"} className="w-full px-3 focus-visible:ring-inset">
              <a href={cartHref}>
                {words.viewCart}
                <IconArrowRight />
              </a>
            </Button>
          </div>
        </div>
      </div>
      {mode === "preorder" && preorder ? (
        <p id={captionId} className="text-center text-xs text-muted-foreground">
          {words.shipsOn.replace("{date}", preorder.shipsOn)}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {spoken}
      </span>
    </div>
  );
}
