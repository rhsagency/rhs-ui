"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCreditCard, IconPause } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the banner uses, for translation. `{card}` and `{date}` are filled in. */
export interface PaymentFailedBannerLabels {
  /** The first line while the plan still works. Default "We could not charge your {card}." */
  graceTitle?: string;
  /** The line under it; `{date}` becomes the time element. Default "Update it by {date} to keep your plan." */
  graceBody?: string;
  /** The same when `graceEndsAt` is not a date. Default "Update it to keep your plan." */
  graceBodyUndated?: string;
  /** The first line once access is paused. Default "Your access is paused." */
  overdueTitle?: string;
  /** The line under it. Default "We could not charge your {card} and the grace period ended on {date}. Update your payment method to restore access." */
  overdueBody?: string;
  /** The same when `graceEndsAt` is not a date. Default "We could not charge your {card}. Update your payment method to restore access." */
  overdueBodyUndated?: string;
  /** What `{card}` stands for when you pass no `cardLabel`. Default "card". */
  card?: string;
  /** The main button. Default "Update payment method". */
  update?: string;
  /** The quiet link, when you pass `invoiceHref`. Default "View invoice". */
  invoice?: string;
  /** The name of the banner for a screen reader. Default "Payment problem". */
  region?: string;
}

export interface PaymentFailedBannerProps extends Omit<ComponentProps<"div">, "children"> {
  /** What was charged, as it reads after "your": "card ending 4242", "Visa ending 4242". Leave it out and the banner says "your card". */
  cardLabel?: string;
  /** When the plan stops working if nothing changes: the end of the grace period, as a Date or an ISO moment. After it, access is paused. */
  graceEndsAt?: Date | string | number;
  /** `grace` while the plan still works, `overdue` once access is paused. Overdue turns the banner destructive. Default `grace`. */
  status?: "grace" | "overdue";
  /** Called when "Update payment method" is pressed: open your billing portal or the card form here. Return a promise (a request for a portal link, say) and the button shows a spinner until it settles, and then takes the focus back. */
  onUpdate?: () => unknown;
  /** Where the failed invoice is. Adds a quiet "View invoice" link; leave it out for none. */
  invoiceHref?: string;
  /** The time zone the date is written in, so the server and the browser agree. Pass the zone the account's billing runs in. Default "UTC". */
  timeZone?: string;
  /** The language of the date. Default "en-US". */
  locale?: string;
  /** The words the banner uses, for translation. */
  labels?: PaymentFailedBannerLabels;
}

const DEFAULT_LABELS = {
  graceTitle: "We could not charge your {card}.",
  graceBody: "Update it by {date} to keep your plan.",
  graceBodyUndated: "Update it to keep your plan.",
  overdueTitle: "Your access is paused.",
  overdueBody: "We could not charge your {card} and the grace period ended on {date}. Update your payment method to restore access.",
  overdueBodyUndated: "We could not charge your {card}. Update your payment method to restore access.",
  card: "card",
  update: "Update payment method",
  invoice: "View invoice",
  region: "Payment problem",
} satisfies Required<PaymentFailedBannerLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

function momentOf(input: Date | string | number | undefined): Date | null {
  if (input === undefined) return null;
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function written(date: Date, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
  } catch {
    // An unknown locale or zone must not take the page down.
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return text.replace(/\s/g, " ");
}

/** A sentence with the date set in a time element wherever `{date}` stands, and the card filled in. */
function Sentence({ template, card, moment }: { template: string; card: string; moment: ReactNode }) {
  const [before = "", ...rest] = template.split("{date}");
  if (!rest.length) return <>{fill(before, { card })}</>;
  return (
    <>
      {fill(before, { card })}
      {moment}
      {fill(rest.join("{date}"), { card })}
    </>
  );
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

/**
 * The banner for a subscription payment that failed: what happened, the
 * date it becomes a problem and one button to fix it. While the plan still
 * works it reads "We could not charge your card ending 4242. Update it by
 * 14 November to keep your plan." in a calm bordered card; once the grace
 * period is over it turns destructive and says that access is paused. The
 * date sits in a time element, written in the time zone you pass, with the
 * full day, time and zone in its title. "Update payment method" runs
 * `onUpdate`, and if that returns a promise (a request for a billing portal
 * link) the button shows a spinner meanwhile and gets the focus back after
 * it, which a disabled button loses. There is no close button on
 * purpose: the problem is real until your app says the payment went through,
 * and then you stop rendering the banner. It is a labelled region, not a live
 * one, so it does not interrupt a screen reader on every page.
 */
export function PaymentFailedBanner({ cardLabel, graceEndsAt, status = "grace", onUpdate, invoiceHref, timeZone = "UTC", locale = "en-US", labels, className, ...props }: PaymentFailedBannerProps) {
  const text: Required<PaymentFailedBannerLabels> = { ...DEFAULT_LABELS, ...labels };
  const [busy, setBusy] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const refocus = useRef(false);
  const overdue = status === "overdue";

  // A disabled button cannot keep the focus, so the browser lets go of it while the request runs. When the button is back the focus returns to it, unless the person has moved on by then.
  useEffect(() => {
    if (busy || !refocus.current) return;
    refocus.current = false;
    if (!document.activeElement || document.activeElement === document.body) button.current?.focus({ preventScroll: true });
  }, [busy]);
  const card = cardLabel ?? text.card;

  const end = momentOf(graceEndsAt);
  const moment = end ? (
    // The words of a date can differ a little between the engines that render the server's HTML and the browser's; the server's stay, and the tree is kept.
    <time
      dateTime={end.toISOString()}
      title={written(end, locale, timeZone, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
      suppressHydrationWarning
      className="font-medium whitespace-nowrap text-foreground decoration-muted-foreground/60 decoration-dotted underline-offset-4 hover:underline"
    >
      {written(end, locale, timeZone, { day: "numeric", month: "long" })}
    </time>
  ) : null;
  const dated = moment !== null;

  async function update() {
    if (busy) return;
    const result = onUpdate?.();
    if (!isThenable(result)) return;
    refocus.current = document.activeElement === button.current;
    setBusy(true);
    try {
      await result;
    } catch {
      // Your app shows its own error for a portal that would not open; the button just comes back.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-slot="payment-failed-banner" data-status={status} className={cn("@container w-full", className)} {...props}>
      <section
        aria-label={text.region}
        className={cn(
          "grid gap-4 rounded-xl border p-4 @2xl:grid-cols-[minmax(0,1fr)_auto] @2xl:items-center @2xl:gap-6 @2xl:px-5",
          overdue ? "border-destructive/40 bg-destructive/5 text-foreground" : "border-border bg-card text-card-foreground shadow-xs",
        )}
      >
        <div className="flex min-w-0 items-start gap-3.5">
          <span
            aria-hidden="true"
            className={cn("grid size-10 shrink-0 place-items-center rounded-lg [&_svg]:size-5", overdue ? "bg-destructive text-destructive-foreground" : "bg-foreground text-background")}
          >
            {overdue ? <IconPause /> : <IconCreditCard />}
          </span>
          <div className="min-w-0 pt-px">
            <p className={cn("text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] text-balance", overdue && "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]")}>
              <Sentence template={overdue ? text.overdueTitle : text.graceTitle} card={card} moment={moment} />
            </p>
            <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">
              <Sentence template={overdue ? (dated ? text.overdueBody : text.overdueBodyUndated) : dated ? text.graceBody : text.graceBodyUndated} card={card} moment={moment} />
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 @md:flex-row @md:items-center">
          <Button ref={button} type="button" loading={busy} onClick={() => void update()} className="@max-md:w-full">
            {text.update}
          </Button>
          {invoiceHref ? (
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground @max-md:w-full">
              <a href={invoiceHref}>{text.invoice}</a>
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
