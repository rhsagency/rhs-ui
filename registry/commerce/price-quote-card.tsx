"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconCheckCircle, IconClock, IconClose, IconDownload, IconEye, IconSend, IconXCircle } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

/** Where a quote stands. `sent` and `viewed` are open: the customer can still decide. */
export type QuoteStatus = "sent" | "viewed" | "accepted" | "declined" | "expired";

type Moment = Date | string | number;

export interface QuoteSupplier {
  name: string;
  /** Who to ask about it, in a few words: "Marta Visser, estimator". */
  contact?: string;
}

export interface PriceQuoteCardLabels {
  /** The heading. `{number}`. */
  quote?: string;
  /** Next to the supplier. `{date}`. */
  issued?: string;
  /** The small title over the total. */
  total?: string;
  /** Under the total. `{rate}` is the percentage, `{tax}` its name. */
  taxIncluded?: string;
  /** The name of the tax, as the person knows it: "VAT", "GST", "BTW". */
  taxName?: string;
  /** While the browser's clock is not known yet. `{date}`. */
  validUntil?: string;
  /** `{date}` and `{count}`. */
  validDaysLeft?: string;
  /** The day before it ends. `{date}`. */
  validOneDay?: string;
  /** On the last day. `{date}`. */
  validLastDay?: string;
  /** `{date}`. */
  expiredOn?: string;
  sent?: string;
  viewed?: string;
  accepted?: string;
  declined?: string;
  expired?: string;
  accept?: string;
  decline?: string;
  download?: string;
  /** The button on an expired quote. */
  askNew?: string;
  /** The question over the accept button. `{number}`. */
  acceptTitle?: string;
  /** Under it. `{total}` and `{supplier}`. */
  acceptText?: string;
  acceptConfirm?: string;
  declineTitle?: string;
  /** `{supplier}`. */
  declineText?: string;
  declineConfirm?: string;
  /** The button in both questions that closes them without deciding. */
  cancel?: string;
  /** The outcome. `{date}`. */
  acceptedOn?: string;
  /** The outcome when the moment is not known. */
  acceptedNoDate?: string;
  declinedOn?: string;
  declinedNoDate?: string;
  /** When accepting or declining did not go through. */
  failed?: string;
}

const WORDS = {
  quote: "Quote {number}",
  issued: "Issued {date}",
  total: "Total",
  taxIncluded: "{rate}% {tax} included",
  taxName: "VAT",
  validUntil: "Valid until {date}",
  validDaysLeft: "Valid until {date}, {count} days left",
  validOneDay: "Valid until {date}, 1 day left",
  validLastDay: "Valid until {date}, last day",
  expiredOn: "Expired on {date}",
  sent: "Sent",
  viewed: "Viewed",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
  accept: "Accept quote",
  decline: "Decline",
  download: "Download PDF",
  askNew: "Ask for a new quote",
  acceptTitle: "Accept quote {number}?",
  acceptText: "You agree to {total}. {supplier} is told straight away.",
  acceptConfirm: "Accept quote",
  declineTitle: "Decline quote {number}?",
  declineText: "{supplier} is told straight away. You can ask for a new quote afterwards.",
  declineConfirm: "Decline quote",
  cancel: "Cancel",
  acceptedOn: "You accepted this quote on {date}",
  acceptedNoDate: "You accepted this quote",
  declinedOn: "You declined this quote on {date}",
  declinedNoDate: "You declined this quote",
  failed: "That did not go through and nothing was changed. Try again in a moment.",
} satisfies Required<PriceQuoteCardLabels>;

export interface PriceQuoteCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The number the supplier gave it: "Q-2026-0412". */
  number: string;
  /** When it was issued: an ISO date such as "2026-11-18" or a date-time. */
  issuedAt: Moment;
  /** The last moment it can be accepted: a date-only string such as "2026-11-30" (through the end of that day), or a date-time. */
  validUntil: Moment;
  /** The total in the currency's minor units: 1452000 is 14,520.00 EUR, and 1452000 is 1,452,000 JPY (yen has none). */
  total: number;
  /** ISO 4217 code. It also says how many minor digits the total has. Defaults to "EUR". */
  currency?: string;
  /** The tax rate in percent that the total already includes: 21 says "21% VAT included". Leave it out to say nothing about tax. */
  taxIncluded?: number;
  /** Where the quote stands. An open one (`sent`, `viewed`) whose date has passed is shown as expired as soon as the browser's clock says so. */
  status: QuoteStatus;
  /** When it was accepted or declined, for the outcome line. Without it the card remembers the moment of a decision made in it. */
  decidedAt?: Moment;
  /** Who sent it. */
  supplier: string | QuoteSupplier;
  /** What the quote is for, in a line or two. */
  summary?: string;
  /** Called once the customer confirms. Return a promise to show the busy state; if it rejects, nothing is recorded and the card says so. */
  onAccept?: () => void | Promise<void>;
  /** The same for declining. */
  onDecline?: () => void | Promise<void>;
  /** Called by "Download PDF". Without it there is no such button. */
  onDownload?: () => void;
  /** Called by "Ask for a new quote" on an expired quote. Without it the button is not drawn. */
  onRequestNew?: () => void;
  /** Always pass your application locale, so the server and the browser write the same dates. */
  locale?: string;
  /** The time zone whose calendar days are counted and whose clock writes the moment of a decision. */
  timeZone?: string;
  /** The moment to count the days from. Pass it from the server so the first render says "12 days left"; without it the card writes the plain date until the browser's clock is known. With it, the card's clock starts there: a decision made in the card is stamped with `now` plus the time since it was given, so a preview with a fixed `now` reads in its own time. */
  now?: Moment;
  /** The heading's element: "h3" by default, "h2" when the quote is the main content of the page. */
  headingAs?: "h2" | "h3" | "h4";
  /** The words, for another language. */
  labels?: PriceQuoteCardLabels;
}

const STATUS = {
  sent: { icon: IconSend, variant: "outline" },
  viewed: { icon: IconEye, variant: "outline" },
  accepted: { icon: IconCheckCircle, variant: "default" },
  declined: { icon: IconXCircle, variant: "muted" },
  expired: { icon: IconClock, variant: "muted" },
} as const;

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY = 86_400_000;

/** The hour written the way the locale counts it: "08:25" where the day has 24 hours, "8:25 AM" where it has 12. */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  const cycle = new Intl.DateTimeFormat(locale, { timeZone: "UTC", hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

const toDate = (value: Moment): Date => (value instanceof Date ? value : new Date(value));

/** The calendar day a moment falls on in a zone, as days since 1970. A date-only string is a calendar day already and ignores the zone. */
function dayOf(value: Moment, zone: string): number {
  if (typeof value === "string") {
    const match = DATE_ONLY.exec(value);
    if (match) return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) / DAY;
  }
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return Number.NaN;
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / DAY;
}

/** A moment written in a locale and zone. A date-only string is a calendar day, so it is written in UTC and never shifts. */
function written(value: Moment, locale: string, zone: string, options: Intl.DateTimeFormatOptions): string {
  const date = toDate(typeof value === "string" && DATE_ONLY.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: typeof value === "string" && DATE_ONLY.test(value) ? "UTC" : zone }).format(date);
}

interface Validity {
  text: string;
  /** The last day, written short: "30 Nov". */
  date: string;
  /** The date has passed, as far as the clock knows. */
  passed: boolean;
}

function describeValidity(validUntil: Moment, issuedAt: Moment, clock: number | undefined, locale: string, zone: string, words: Required<PriceQuoteCardLabels>): Validity {
  const dateOnly = typeof validUntil === "string" && DATE_ONLY.test(validUntil);
  const end = toDate(dateOnly ? `${validUntil}T00:00:00Z` : validUntil);
  // The year is only written when the quote ends in another year than it was issued.
  const sameYear = written(validUntil, "en-US", zone, { year: "numeric" }) === written(issuedAt, "en-US", zone, { year: "numeric" });
  const date = written(validUntil, locale, zone, { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
  if (clock === undefined || Number.isNaN(clock) || Number.isNaN(end.getTime())) return { text: fill(words.validUntil, { date }), date, passed: false };
  const diff = dayOf(validUntil, zone) - dayOf(clock, zone);
  const passed = dateOnly ? diff < 0 : clock > end.getTime();
  if (passed) return { text: fill(words.expiredOn, { date }), date, passed };
  if (diff <= 0) return { text: fill(words.validLastDay, { date }), date, passed };
  if (diff === 1) return { text: fill(words.validOneDay, { date }), date, passed };
  return { text: fill(words.validDaysLeft, { date, count: String(diff) }), date, passed };
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The moment to count from: the one you pass, or the browser's clock once the page has loaded (never on the server, so nothing mismatches). */
function useClock(given: Moment | undefined): number | undefined {
  const [clock, setClock] = useState<number | undefined>(undefined);
  useBrowserLayoutEffect(() => {
    if (given !== undefined) return;
    const read = () => setClock(Date.now());
    read();
    const visible = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", visible);
    return () => document.removeEventListener("visibilitychange", visible);
  }, [given]);
  return given === undefined ? clock : toDate(given).getTime();
}

/** Money in minor units, written for the locale. The currency says how many minor digits it has: 2 for euros, 0 for yen, 3 for Kuwaiti dinars. */
function writeMoney(minor: number, currency: string, locale: string): string {
  const format = new Intl.NumberFormat(locale, { style: "currency", currency });
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(minor / 10 ** digits);
}

interface DecisionProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => Promise<void>;
  /** The button that asks. */
  children: ReactNode;
}

/**
 * The question behind accept and decline: a small panel by the button with the question, cancel and confirm. It is a
 * confirm popover with two things a quote card needs on top: cancel is a label like every other word (the card can be
 * in any language), and the panel keeps a gutter from the screen's edge on a phone. Focus starts on cancel, the safe choice.
 */
function Decision({ title, description, confirmLabel, cancelLabel, onConfirm, children }: DecisionProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent data-slot="price-quote-confirm" role="alertdialog" aria-label={title} aria-describedby={`${id}-text`} collisionPadding={16}>
        <p className="text-sm font-medium">{title}</p>
        <p id={`${id}-text`} className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" size="sm" variant="outline" autoFocus onClick={() => setOpen(false)}>
            {cancelLabel}
          </Button>
          <Button type="button" size="sm" loading={busy} onClick={() => void confirm()}>
            {confirmLabel}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * A price quote you received, the one a contractor, an installer, an agency or a wholesaler sends: its number and
 * who sent it, the total large in tabular figures with the tax stated ("21% VAT included"), how long it is valid
 * ("Valid until 30 Nov, 12 days left") and where it stands as a word with a glyph. Accept and decline carry equal
 * weight, side by side; each asks for one confirmation, so neither is a slip of the thumb. Once decided, the card
 * shows the outcome and when, and the keyboard focus moves to that line because the buttons that held it are gone.
 * An expired quote disables both and offers "Ask for a new quote". A quote that is still open but past its date is
 * treated as expired as soon as the browser's clock says so.
 */
export function PriceQuoteCard({
  number,
  issuedAt,
  validUntil,
  total,
  currency = "EUR",
  taxIncluded,
  status,
  decidedAt,
  supplier,
  summary,
  onAccept,
  onDecline,
  onDownload,
  onRequestNew,
  locale = "en-US",
  timeZone = "UTC",
  now,
  headingAs: Heading = "h3",
  labels,
  className,
  ...props
}: PriceQuoteCardProps) {
  const words: Required<PriceQuoteCardLabels> = { ...WORDS, ...labels };
  const id = useId();
  const clock = useClock(now);
  const [decision, setDecision] = useState<{ status: "accepted" | "declined"; at: number } | null>(null);
  const [seen, setSeen] = useState(status);
  const [failed, setFailed] = useState(false);
  // When the page moves the quote on, its own say wins; a local decision that agrees with it only lends its moment.
  if (seen !== status) {
    setSeen(status);
    if (decision && decision.status !== status) setDecision(null);
  }

  // Deciding removes the buttons that held the focus, so the outcome line takes it over and the keyboard stays in place.
  // Only a decision made in this card moves the focus: a status that arrives from the page does not.
  const outcomeLine = useRef<HTMLParagraphElement>(null);
  const takeFocus = useRef(false);
  useEffect(() => {
    const wanted = takeFocus.current;
    takeFocus.current = false;
    if (decision && wanted) outcomeLine.current?.focus({ preventScroll: true });
  }, [decision]);

  // With `now` the card's clock starts at that moment, and runs on from there while the card is on the page.
  const given = now === undefined ? undefined : toDate(now).getTime();
  const anchor = useRef<{ given: number; seen: number } | null>(null);
  useEffect(() => {
    anchor.current = given === undefined || Number.isNaN(given) ? null : { given, seen: Date.now() };
  }, [given]);

  const validity = describeValidity(validUntil, issuedAt, clock, locale, timeZone, words);
  let state: QuoteStatus = decision?.status ?? status;
  if ((state === "sent" || state === "viewed") && validity.passed) state = "expired";
  const open = state === "sent" || state === "viewed";
  const decided = state === "accepted" || state === "declined";
  const moment = decision?.status === state ? decision.at : decidedAt;
  const look = STATUS[state];
  const Glyph = look.icon;
  // The number stays in one piece, so a narrow card breaks before it and never inside it.
  const [titleBefore = "", titleAfter = ""] = words.quote.split("{number}");
  const maker: QuoteSupplier = typeof supplier === "string" ? { name: supplier } : supplier;
  const money = writeMoney(total, currency, locale);

  async function decide(next: "accepted" | "declined", action: (() => void | Promise<void>) | undefined) {
    setFailed(false);
    try {
      await action?.();
      const at = anchor.current ? anchor.current.given + (Date.now() - anchor.current.seen) : Date.now();
      takeFocus.current = true;
      setDecision({ status: next, at });
    } catch {
      setFailed(true);
    }
  }

  const when = decided && moment !== undefined ? written(moment, locale, timeZone, { day: "numeric", month: "short", year: "numeric", ...clockOptions(locale) }) : null;
  const outcome =
    state === "accepted" ? (when ? fill(words.acceptedOn, { date: when }) : words.acceptedNoDate) : state === "declined" ? (when ? fill(words.declinedOn, { date: when }) : words.declinedNoDate) : "";

  return (
    <Card data-slot="price-quote-card" data-status={state} role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 overflow-hidden py-0", className)} {...props}>
      <div className="px-5 pt-5 @md:px-6 @md:pt-6">
        <div className="flex items-start justify-between gap-3">
          <Heading id={`${id}-title`} className="min-w-0 text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
            {titleBefore}
            <span className="whitespace-nowrap">{number}</span>
            {titleAfter}
          </Heading>
          <Badge variant={look.variant} className="shrink-0">
            <Glyph />
            {words[state]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-pretty text-muted-foreground">
          {maker.name}
          {maker.contact ? `, ${maker.contact}` : ""}
        </p>
        <p className="text-xs text-muted-foreground tabular-nums">{fill(words.issued, { date: written(issuedAt, locale, timeZone, { day: "numeric", month: "short", year: "numeric" }) })}</p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 px-5 py-5 @md:px-6 @md:py-6">
        {summary ? <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{summary}</p> : null}

        <div>
          <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{words.total}</p>
          <p className="mt-2 text-4xl leading-none font-semibold tracking-[-0.04em] tabular-nums">{money}</p>
          {taxIncluded !== undefined ? <p className="mt-2 text-sm text-muted-foreground tabular-nums">{fill(words.taxIncluded, { rate: new Intl.NumberFormat(locale).format(taxIncluded), tax: words.taxName })}</p> : null}
        </div>

        {decided ? (
          <p ref={outcomeLine} tabIndex={-1} role="status" className="flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-4 text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
            {state === "accepted" ? <IconCheckCircle className="mt-0.5 size-5 shrink-0" /> : <IconXCircle className="mt-0.5 size-5 shrink-0" />}
            <span className="text-pretty">{outcome}</span>
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm tabular-nums">
            {state === "expired" ? <IconAlertCircle className="size-4 shrink-0" /> : <IconClock className="size-4 shrink-0 text-muted-foreground" />}
            <span className={cn(state === "expired" ? "font-medium" : "text-muted-foreground")}>{state === "expired" ? fill(words.expiredOn, { date: validity.date }) : validity.text}</span>
          </p>
        )}
      </div>

      {open || state === "expired" || onDownload ? (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-3 border-t border-border bg-muted/30 p-5 @md:p-6">
          {open ? (
            <div className="grid grid-cols-1 gap-3 @xs:grid-cols-2">
              <Decision
                title={fill(words.acceptTitle, { number })}
                description={fill(words.acceptText, { total: money, supplier: maker.name })}
                confirmLabel={words.acceptConfirm}
                cancelLabel={words.cancel}
                onConfirm={() => decide("accepted", onAccept)}
              >
                <Button type="button" variant="outline" size="lg" className="w-full">
                  <IconCheck />
                  {words.accept}
                </Button>
              </Decision>
              <Decision
                title={fill(words.declineTitle, { number })}
                description={fill(words.declineText, { supplier: maker.name })}
                confirmLabel={words.declineConfirm}
                cancelLabel={words.cancel}
                onConfirm={() => decide("declined", onDecline)}
              >
                <Button type="button" variant="outline" size="lg" className="w-full">
                  <IconClose />
                  {words.decline}
                </Button>
              </Decision>
            </div>
          ) : null}
          {state === "expired" ? (
            <>
              <div className="grid grid-cols-1 gap-3 @xs:grid-cols-2">
                <Button type="button" variant="outline" size="lg" disabled className="w-full">
                  <IconCheck />
                  {words.accept}
                </Button>
                <Button type="button" variant="outline" size="lg" disabled className="w-full">
                  <IconClose />
                  {words.decline}
                </Button>
              </div>
              {onRequestNew ? (
                <Button type="button" size="lg" className="w-full" onClick={onRequestNew}>
                  {words.askNew}
                </Button>
              ) : null}
            </>
          ) : null}
          {failed ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
              <IconAlertCircle className="mt-0.5 size-4 shrink-0" />
              {words.failed}
            </p>
          ) : null}
          {onDownload ? (
            <Button type="button" variant="ghost" size="sm" className="justify-self-center" onClick={onDownload}>
              <IconDownload />
              {words.download}
            </Button>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
