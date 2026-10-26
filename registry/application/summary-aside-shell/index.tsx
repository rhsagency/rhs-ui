"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconChevronUp } from "@rhs-ui/icons";
import { Separator } from "@rhs-ui/primitives/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export interface SummaryAsideShellLabels {
  /** The bar's button that opens the summary on a phone. Default "Show summary". */
  showSummary?: string;
  /** What the sheet says it holds, for screen readers. Default "What you are about to pay for, and the total." */
  description?: string;
}

export interface SummaryAsideShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The steps or the form. Give each step its own heading; the shell adds the room the bottom bar needs. */
  children: ReactNode;
  /** The summary: the line items, a promo code field, a delivery date. It sits in a card from lg and in a sheet below. */
  summary: ReactNode;
  /** The summary's heading. Default "Order summary". */
  summaryTitle?: string;
  /** The total, already formatted for your currency and language: "€1,284.00". The shell shows it, announces it politely when it changes, and does no arithmetic. */
  total: string;
  /** What the total is called. Default "Total". */
  totalLabel?: string;
  /** A line under the total: "Includes €223.00 VAT". */
  totalNote?: ReactNode;
  /** The primary button: "Pay €1,284.00". It is shown in the card, in the bottom bar and in the sheet, so never give it an id. */
  action: ReactNode;
  /** The bar at the top of the page, sticky: your mark, a back link, a note about secure payment. The card sticks right under it. */
  header?: ReactNode;
  /** The words the shell uses, for translation. */
  labels?: SummaryAsideShellLabels;
  /** The id of the main landmark, which holds the steps. Default "main"; change it when the page already uses id=main. */
  mainId?: string;
}

/**
 * The layout for checkout, booking and quote flows: the steps in the main
 * column and a summary card at its right that sticks under the header while
 * the steps scroll. On a phone the card is replaced by a bar fixed to the
 * bottom with the total, the primary action and a "Show summary" button that
 * opens the whole summary in a sheet; the bar clears the home indicator, and
 * the steps get matching bottom padding so it never covers the last field.
 * The total is announced politely when it changes. The page scrolls like a
 * normal page: the shell only sets the frame.
 */
export function SummaryAsideShell({
  children,
  summary,
  summaryTitle = "Order summary",
  total,
  totalLabel = "Total",
  totalNote,
  action,
  header,
  labels,
  mainId = "main",
  className,
  style,
  ...props
}: SummaryAsideShellProps) {
  const text = { showSummary: "Show summary", description: "What you are about to pay for, and the total.", ...labels };
  const titleId = useId();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetTitle = useRef<HTMLHeadingElement>(null);

  // The sheet is for narrow screens: it closes by itself when the card takes over.
  useEffect(() => {
    const wide = window.matchMedia?.("(min-width: 64rem)");
    if (!wide) return;
    const close = () => {
      if (wide.matches) setSheetOpen(false);
    };
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);

  const totals = (
    <div>
      <p className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium">{totalLabel}</span>
        <span className="text-xl font-semibold tracking-[-0.02em] tabular-nums">{total}</span>
      </p>
      {totalNote ? <p className="mt-1 text-xs text-muted-foreground">{totalNote}</p> : null}
    </div>
  );

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <div
        data-slot="summary-aside-shell"
        style={{ ...style, "--summary-top": header ? "5rem" : "1.5rem" } as CSSProperties}
        className={cn("relative min-h-dvh bg-background text-foreground", className)}
        {...props}
      >
        {header ? (
          <header data-slot="summary-aside-shell-header" className="sticky top-0 z-30 border-b border-border bg-background">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">{header}</div>
          </header>
        ) : null}

        <div className="mx-auto grid w-full max-w-6xl gap-x-14 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <main id={mainId} data-slot="summary-aside-shell-main" className="min-w-0 py-8 pb-[calc(7rem_+_env(safe-area-inset-bottom))] lg:py-12 lg:pb-16">
            {children}
          </main>

          {sheetOpen ? null : (
            <div className="hidden lg:block lg:py-12">
              <aside
                aria-labelledby={titleId}
                data-slot="summary-aside-shell-card"
                className="sticky top-[var(--summary-top)] flex max-h-[calc(100dvh_-_var(--summary-top)_-_1.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs"
              >
                <h2 id={titleId} className="shrink-0 px-5 pt-5 text-sm font-semibold">
                  {summaryTitle}
                </h2>
                <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pt-5 pb-4">{summary}</div>
                <Separator />
                <div className="shrink-0 px-5 pt-4 pb-5">
                  {totals}
                  <div className="mt-4 *:w-full">{action}</div>
                </div>
              </aside>
            </div>
          )}
        </div>

        <div data-slot="summary-aside-shell-bar" className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
          {/* The page's own container: the total sits on the content's left edge and the action on its right edge at every width. */}
          <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <SheetTrigger asChild>
              <button
                type="button"
                className="group flex min-w-0 flex-1 flex-col items-start rounded-md py-0.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground">{totalLabel}</span>
                  <span className="text-base font-semibold tracking-[-0.01em] tabular-nums">{total}</span>
                </span>
                <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors duration-150 group-hover:text-foreground motion-reduce:transition-none">
                  {text.showSummary}
                  <IconChevronUp className="size-3.5" />
                </span>
              </button>
            </SheetTrigger>
            <div className="shrink-0">{action}</div>
          </div>
        </div>

        <SheetContent
          side="bottom"
          className="gap-0 p-0 motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"
          onOpenAutoFocus={(event) => {
            // The heading, not the scrolling summary: whoever opens the sheet hears what it is first.
            event.preventDefault();
            sheetTitle.current?.focus({ preventScroll: true });
          }}
        >
          <SheetHeader className="shrink-0 pb-3">
            <SheetTitle ref={sheetTitle} tabIndex={-1} className="outline-none">
              {summaryTitle}
            </SheetTitle>
            <SheetDescription className="sr-only">{text.description}</SheetDescription>
          </SheetHeader>
          {/* A native scroller, like the card: the sheet's height is content-sized up to 85dvh, and only a plain overflow box shrinks to fit it. */}
          <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-3 pb-4">{summary}</div>
          <Separator />
          <div className="shrink-0 px-5 pt-4 pb-[calc(1.25rem_+_env(safe-area-inset-bottom))]">
            {totals}
            <div className="mt-4 *:w-full">{action}</div>
          </div>
        </SheetContent>

        <p role="status" className="sr-only">
          {totalLabel} {total}
        </p>
      </div>
    </Sheet>
  );
}
