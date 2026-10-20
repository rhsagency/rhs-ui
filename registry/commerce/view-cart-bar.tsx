"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { IconArrowRight, IconBag } from "@rhs-ui/icons";
import { AnimatedPrice } from "@rhs-ui/commerce/animated-price";
import { formatMoney } from "@rhs-ui/commerce/money";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ViewCartBarProps extends Omit<ComponentProps<"div">, "children" | "hidden"> {
  /** Items in the cart. The bar rises when it goes above zero and goes away at zero. */
  count: number;
  /** The cart total in minor units: 4250 is 42.50. It counts to its new value when it changes. */
  total: number;
  /** Called when the button is pressed. */
  onView?: () => void;
  /** ISO 4217 code for the total. */
  currency?: string;
  /** Locale for the total and the announcement. Always passed, so server and browser agree. */
  locale?: string;
  /** Keeps the bar away whatever the count, for example on the cart page itself. */
  hidden?: boolean;
  /** The button's text. */
  label?: string;
  /** What one and many things are called: `{ one: "article", other: "articles" }`. */
  noun?: { one: string; other: string };
  /** Classes for the row inside the bar, to match the width of your content. Defaults to a centred 48rem with 1rem of padding, like a `max-w-3xl px-4` page column. */
  contentClassName?: string;
}

/**
 * A persistent summary for ordering flows: how many items are in the cart,
 * the total, and a View cart button. It rises from the bottom edge when the
 * first item arrives, counts the total to its new value when it changes, and
 * says what happened politely ("Cart updated, 3 items, 42.50 euros"). At zero
 * it folds away and leaves the tab order. It is `sticky`, not `fixed`: render
 * it as the last child of your page's main content, before the footer, and it
 * stays on the bottom edge of the screen while you scroll, then comes to rest
 * above the footer instead of covering it. On a phone it clears the home
 * indicator.
 */
export function ViewCartBar({ count, total, onView, currency = "EUR", locale = "en-US", hidden = false, label = "View cart", noun = { one: "item", other: "items" }, className, contentClassName, ...props }: ViewCartBarProps) {
  const open = count > 0 && !hidden;
  const name = count === 1 ? noun.one : noun.other;
  const tally = new Intl.NumberFormat(locale).format(count);
  const [announcement, setAnnouncement] = useState("");
  const last = useRef(`${count}|${total}`);

  // Say what changed, once, after it has changed. The first render says nothing.
  useEffect(() => {
    const key = `${count}|${total}`;
    if (last.current === key) return;
    last.current = key;
    if (hidden) return;
    setAnnouncement(count > 0 ? `Cart updated, ${tally} ${name}, ${formatMoney({ amount: total, currency }, locale)}` : "Cart is empty");
  }, [count, total, currency, locale, name, tally, hidden]);

  return (
    <div
      data-slot="view-cart-bar"
      data-open={open || undefined}
      className={cn(
        "pointer-events-none sticky bottom-0 z-40 grid grid-rows-[0fr] transition-[grid-template-rows] duration-300 ease-out data-[open]:grid-rows-[1fr] motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      <span role="status" className="sr-only">
        {announcement}
      </span>
      <div className="min-h-0 overflow-hidden">
        <div
          inert={!open}
          className={cn(
            "pointer-events-auto border-t border-border bg-background pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none",
            open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
          )}
        >
          <div className={cn("mx-auto flex max-w-3xl items-center justify-between gap-4 px-4", contentClassName)}>
            <div className="flex shrink-0 items-center gap-3">
              <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-foreground">
                <IconBag size={20} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {tally} {name}
                </p>
                <p className="text-base leading-tight font-semibold tracking-[-0.01em]">
                  <AnimatedPrice value={total / 100} currency={currency} locale={locale} />
                </p>
              </div>
            </div>
            {/* The total never gives way: a long label is the one that is shortened. */}
            <Button type="button" size="lg" onClick={onView} className="min-w-0 shrink">
              <span className="truncate">{label}</span>
              <IconArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
