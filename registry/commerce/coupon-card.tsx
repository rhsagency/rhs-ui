"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactElement } from "react";

import { IconCheck, IconChevronDown, IconClock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/** Whether the voucher can still be used: `active`, already `used`, or past its date (`expired`). */
export type CouponStatus = "active" | "used" | "expired";

type Moment = Date | string | number;

export interface CouponCardLabels {
  /** The small word over the offer. */
  coupon?: string;
  /** The copy button. */
  copy?: string;
  /** The copy button for a moment after it has copied. */
  copied?: string;
  /** The disclosure that opens the conditions. */
  details?: string;
  /** The tag on a code that has been used. */
  used?: string;
  /** The tag on a code that has expired. */
  expired?: string;
  /** What a screen reader hears where a code can no longer be used. */
  unusable?: string;
  /** The line of a coupon that has been used. */
  usedLine?: string;
  expiresToday?: string;
  expiresTomorrow?: string;
  /** `{count}` is a number of days. */
  expiresIn?: string;
  /** `{date}` is the day, written short. Used when the day is far off, and before the browser's clock is known. */
  expiresOn?: string;
  expiredToday?: string;
  expiredYesterday?: string;
  /** `{count}` is a number of days. */
  expiredAgo?: string;
  expiredOn?: string;
}

const WORDS = {
  coupon: "Coupon",
  copy: "Copy",
  copied: "Copied",
  details: "Details",
  used: "Used",
  expired: "Expired",
  unusable: "This code can no longer be used.",
  usedLine: "You have used this code",
  expiresToday: "Expires today",
  expiresTomorrow: "Expires tomorrow",
  expiresIn: "Expires in {count} days",
  expiresOn: "Expires {date}",
  expiredToday: "Expired today",
  expiredYesterday: "Expired yesterday",
  expiredAgo: "Expired {count} days ago",
  expiredOn: "Expired {date}",
} satisfies Required<CouponCardLabels>;

export interface CouponCardProps extends Omit<ComponentProps<"div">, "children" | "onCopy"> {
  /** The offer in a few words, set large: "20% off", "Free delivery", "€10 off". */
  offer: string;
  /** The code the customer types at checkout. Set in mono type, and copied in one press. */
  code: string;
  /** What the offer applies to, in a line or two. */
  description?: string;
  /** The last moment the code works: a date-only string such as "2026-10-29" (valid through the end of that day), or a date-time, a Date or a timestamp. */
  expiresAt?: Moment;
  /** The small print, one entry per line. It sits behind a "Details" disclosure. */
  conditions?: readonly string[];
  /** Whether the code can still be used. A used or expired coupon is muted and its code does not copy. An active one whose date has passed is shown as expired. */
  status?: CouponStatus;
  /** Called with the code once it is on the clipboard. */
  onCopy?: (code: string) => void;
  /** Always pass your application locale, so the server and the browser write the same date. */
  locale?: string;
  /** The time zone whose calendar days are counted. Defaults to "UTC". */
  timeZone?: string;
  /** The moment to count the days from. Pass it from the server so the first render says "Expires in 3 days"; without it the card writes the plain date until the browser's clock is known. */
  now?: Moment;
  /** The words, for another language. */
  labels?: CouponCardLabels;
}

/**
 * The tear line is two panels that each cut a half circle out of their own corners, so the notch is a real hole
 * (the page shows through, in both themes) and no colour has to match. The two panels meet on the dashed rule.
 * Stacked, the stub is on top and the notches sit at the left and right edge; side by side they sit top and bottom.
 */
const STUB_NOTCH =
  "[mask-composite:intersect] [mask-image:var(--notches)] [--notches:radial-gradient(circle_10px_at_0_100%,transparent_97%,#000),radial-gradient(circle_10px_at_100%_100%,transparent_97%,#000)] @lg:[--notches:radial-gradient(circle_10px_at_100%_0,transparent_97%,#000),radial-gradient(circle_10px_at_100%_100%,transparent_97%,#000)]";
const MAIN_NOTCH =
  "[mask-composite:intersect] [mask-image:var(--notches)] [--notches:radial-gradient(circle_10px_at_0_0,transparent_97%,#000),radial-gradient(circle_10px_at_100%_0,transparent_97%,#000)] @lg:[--notches:radial-gradient(circle_10px_at_0_0,transparent_97%,#000),radial-gradient(circle_10px_at_0_100%,transparent_97%,#000)]";
/** A hairline round the whole shape, notches included: four 1px drop shadows follow the alpha of the masked panels. */
const OUTLINE = "[filter:drop-shadow(0_1px_0_var(--border))_drop-shadow(0_-1px_0_var(--border))_drop-shadow(1px_0_0_var(--border))_drop-shadow(-1px_0_0_var(--border))]";

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

interface Expiry {
  /** The sentence on the card: "Expires in 3 days". */
  text: string;
  /** The full day for the tooltip: "Thursday 29 October 2026". */
  full: string;
  /** What the time element holds. */
  iso: string;
  /** The date has passed, as far as the clock knows. */
  passed: boolean;
}

function describeExpiry(expiresAt: Moment, clock: number | undefined, locale: string, zone: string, words: Required<CouponCardLabels>): Expiry | null {
  const dateOnly = typeof expiresAt === "string" && DATE_ONLY.test(expiresAt);
  const instant = toDate(dateOnly ? `${expiresAt}T00:00:00Z` : expiresAt);
  if (Number.isNaN(instant.getTime())) return null;
  const formatZone = dateOnly ? "UTC" : zone;
  const short = new Intl.DateTimeFormat(locale, { timeZone: formatZone, day: "numeric", month: "short", year: "numeric" }).format(instant);
  const day = new Intl.DateTimeFormat(locale, { timeZone: formatZone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(instant);
  const full = dateOnly ? day : `${day}, ${new Intl.DateTimeFormat(locale, { timeZone: zone, ...clockOptions(locale), timeZoneName: "short" }).format(instant)}`;
  const iso = dateOnly ? String(expiresAt) : instant.toISOString();
  const base = { full, iso };
  // The browser's clock is not known yet (the server, the first paint): the plain date is right.
  if (clock === undefined || Number.isNaN(clock)) return { ...base, text: fill(words.expiresOn, { date: short }), passed: false };
  const diff = dayOf(expiresAt, zone) - dayOf(clock, zone);
  // A date-time that has passed is over even on its own day; a date-only day lasts until it ends.
  const passed = dateOnly ? diff < 0 : clock > instant.getTime();
  if (!passed) {
    if (diff <= 0) return { ...base, text: words.expiresToday, passed };
    if (diff === 1) return { ...base, text: words.expiresTomorrow, passed };
    return { ...base, text: diff <= 30 ? fill(words.expiresIn, { count: String(diff) }) : fill(words.expiresOn, { date: short }), passed };
  }
  const ago = -diff;
  if (ago <= 0) return { ...base, text: words.expiredToday, passed };
  if (ago === 1) return { ...base, text: words.expiredYesterday, passed };
  return { ...base, text: ago <= 30 ? fill(words.expiredAgo, { count: String(ago) }) : fill(words.expiredOn, { date: short }), passed };
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

/**
 * A tooltip that a tap can open. Radix opens one on hover and on keyboard focus only, and closes it on every
 * click, so on a touch screen the full date would never show. Here a press toggles it.
 */
function TapTooltip({ content, children }: { content: string; children: ReactElement }) {
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);
  const pressing = useRef(false);
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip
        open={open}
        onOpenChange={(next) => {
          // The trigger closes its own tooltip on every click; while a press is toggling it, that close is not wanted.
          if (!next && pressing.current) return;
          setOpen(next);
        }}
      >
        <TooltipTrigger
          asChild
          tabIndex={0}
          className="rounded-sm underline decoration-dotted decoration-from-font underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 [@media(hover:none)]:cursor-pointer"
          onPointerDown={() => {
            wasOpen.current = open;
          }}
          onClick={() => {
            pressing.current = true;
            setOpen(!wasOpen.current);
            queueMicrotask(() => {
              pressing.current = false;
            });
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * A voucher you can use: the offer set large on a stub, a perforated tear line with real notches, then the code in
 * mono type with a copy button that confirms politely, the expiry written out ("Expires in 3 days") with the full
 * date in a tooltip a hover, a tap or the keyboard opens, and the small print behind a "Details" disclosure. A used
 * or expired coupon is muted, strikes through its code and does not copy; an active one whose date has passed is
 * shown as expired as soon as the browser's clock says so. The card lays itself out by its own width: stacked in a
 * narrow column, stub and body side by side from 32rem.
 */
export function CouponCard({ offer, code, description, expiresAt, conditions, status = "active", onCopy, locale = "en-US", timeZone = "UTC", now, labels, className, ...props }: CouponCardProps) {
  const words: Required<CouponCardLabels> = { ...WORDS, ...labels };
  const clock = useClock(now);
  const expiry = expiresAt === undefined ? null : describeExpiry(expiresAt, clock, locale, timeZone, words);
  const state: CouponStatus = status === "active" && expiry?.passed ? "expired" : status;
  const live = state === "active";

  return (
    <div data-slot="coupon-card" data-status={state} className={cn("@container", OUTLINE, className)} {...props}>
      <div className="grid grid-cols-[minmax(0,1fr)] @lg:grid-cols-[11rem_minmax(0,1fr)]">
        <div
          className={cn(
            "flex min-w-0 flex-col justify-center gap-1.5 rounded-t-xl border-b-2 border-dashed border-muted-foreground/30 bg-muted px-5 py-5 @lg:rounded-l-xl @lg:rounded-tr-none @lg:border-r-2 @lg:border-b-0 @lg:px-6",
            STUB_NOTCH,
          )}
        >
          <p className="text-[0.6875rem] font-medium tracking-[.18em] text-muted-foreground uppercase">{words.coupon}</p>
          <p className={cn("leading-[1.05] font-semibold tracking-[-0.04em] text-balance", offer.length > 14 ? "text-2xl" : "text-3xl", !live && "text-muted-foreground")}>{offer}</p>
        </div>

        <Collapsible className={cn("flex min-w-0 flex-col justify-center gap-4 rounded-b-xl bg-card p-5 @lg:rounded-r-xl @lg:rounded-bl-none @lg:p-6", MAIN_NOTCH)}>
          {description ? <p className="text-sm leading-snug text-pretty text-card-foreground">{description}</p> : null}

          {/* The code is the focal point, so it is never cut in the middle of a word to make room: the button drops under it first, and only a code longer than the row ever breaks. */}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg border border-dashed border-border bg-background py-1.5 pr-1.5 pl-4">
            <code className={cn("my-0.5 max-w-full font-mono text-lg leading-none font-semibold tracking-[0.08em] [overflow-wrap:anywhere] select-all", !live && "text-muted-foreground line-through decoration-2")}>{code}</code>
            {live ? (
              <CopyButton value={code} size="sm" label={words.copy} copiedLabel={words.copied} onCopy={onCopy} className="ml-auto" />
            ) : (
              <>
                <Badge variant="muted" className="mr-1 ml-auto shrink-0">
                  {state === "used" ? <IconCheck /> : <IconClock />}
                  {state === "used" ? words.used : words.expired}
                </Badge>
                <span className="sr-only">{words.unusable}</span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
            {state === "used" ? (
              <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                <IconCheck aria-hidden="true" className="size-3.5 shrink-0" />
                {words.usedLine}
              </p>
            ) : expiry ? (
              <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                <IconClock aria-hidden="true" className="size-3.5 shrink-0" />
                <TapTooltip content={expiry.full}>
                  <time dateTime={expiry.iso}>
                    {expiry.text}
                    <span className="sr-only">{`, ${expiry.full}`}</span>
                  </time>
                </TapTooltip>
              </p>
            ) : (
              <span />
            )}
            {conditions?.length ? (
              <CollapsibleTrigger className="group/details ml-auto inline-flex items-center gap-1 rounded-sm text-xs font-medium underline decoration-transparent underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none">
                {words.details}
                <IconChevronDown className="size-3.5 transition-transform duration-200 group-data-[state=open]/details:rotate-180 motion-reduce:transition-none" />
              </CollapsibleTrigger>
            ) : null}
          </div>

          {conditions?.length ? (
            <CollapsibleContent>
              <ul role="list" className="grid gap-2 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                {conditions.map((condition, index) => (
                  <li key={`${index}-${condition}`} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                    {condition}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          ) : null}
        </Collapsible>
      </div>
    </div>
  );
}
