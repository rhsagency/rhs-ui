"use client";

import { useEffect, useId, useLayoutEffect, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowUpRight, IconCheck, IconClock, IconPhone } from "@rhs-ui/icons";
import { dayWords, hasEnded, isoOf, spelledOut, type PickupMoment, type PickupStore } from "@rhs-ui/commerce/pickup-ready-card/pickup";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

export type { PickupMoment, PickupStore } from "@rhs-ui/commerce/pickup-ready-card/pickup";

export interface PickupReadyCardLabels {
  /** The heading while the order waits. */
  ready?: string;
  /** The heading once the pickup window is over. */
  ended?: string;
  /** Under the heading. `{order}` is the order number. */
  order?: string;
  /** Under the heading once the window is over. `{order}` and `{date}`. */
  endedOn?: string;
  /** The pill with the last day. `{date}`. */
  heldUntil?: string;
  /** The small title over the code. */
  code?: string;
  /** Under the code once it no longer works. */
  codeEnded?: string;
  /** The copy button. */
  copy?: string;
  /** The copy button for a moment after it has copied. */
  copied?: string;
  /** The row with the shop and its address. */
  store?: string;
  /** The row with today's hours. */
  hours?: string;
  /** The link to the route. */
  directions?: string;
  /** The title of the list at the bottom. */
  bring?: string;
  /** The list, when `bring` is not passed. */
  bringItems?: readonly string[];
  /** The contact line once the window is over, for a shop with a number. `{store}` and `{phone}`. */
  contact?: string;
  /** The same for a shop without one. `{store}`. */
  contactNoPhone?: string;
  /** What a screen reader hears while the order waits. `{order}`, `{store}` and `{date}`. */
  statusReady?: string;
  /** What a screen reader hears when the window ends. `{order}`. */
  statusEnded?: string;
}

const WORDS = {
  ready: "Ready to collect",
  ended: "Pickup window ended",
  order: "Order {order}",
  endedOn: "Order {order} was held until {date}.",
  heldUntil: "Held until {date}",
  code: "Pickup code",
  codeEnded: "This code no longer works.",
  copy: "Copy code",
  copied: "Copied",
  store: "Collect from",
  hours: "Hours today",
  directions: "Get directions",
  bring: "What to bring",
  bringItems: ["Photo ID", "Your pickup code"],
  contact: "Call {store} on {phone} to arrange a new pickup.",
  contactNoPhone: "Contact {store} to arrange a new pickup.",
  statusReady: "Order {order} is ready to collect from {store}. Held until {date}.",
  statusEnded: "The pickup window for order {order} has ended.",
} satisfies Required<PickupReadyCardLabels>;

export interface PickupReadyCardProps extends Omit<ComponentProps<"div">, "children" | "onCopy"> {
  /** The order number the customer knows, as the shop shows it: "NW-20418". */
  order: string;
  /** The code the customer gives at the counter: "K7M-4Q2". */
  code: string;
  /** The shop the order waits in. */
  store: PickupStore;
  /** Today's opening hours in words: "09:00 to 18:00", or "Closed today, opens Monday at 09:00". */
  hours?: ReactNode;
  /** The last day the order is held: an ISO date such as "2026-10-30" (held through the end of that day in `timeZone`) or a date-time (held until then). */
  heldUntil: PickupMoment;
  /** What to bring to the counter. Defaults to a photo ID and the code. */
  bring?: readonly string[];
  /** The route to the shop: the link opens in a new tab. */
  directionsHref?: string;
  /** A QR code for shops that scan, drawn in a white box so it reads in the dark theme too. Pass an SVG or an image with its own alt text. */
  qr?: ReactNode;
  /** The moment to measure the pickup window from. Pass it from the server for a first render that matches the browser's; without it the page reads the browser's clock once it has loaded, and again when the tab comes back or a minute passes. */
  now?: PickupMoment;
  /** Always pass your application locale, so the date is written the same on the server and in the browser. */
  locale?: string;
  /** The shop's time zone, whose calendar day ends the pickup window. */
  timeZone?: string;
  /** Called with the code once it is on the clipboard. */
  onCopy?: (code: string) => void;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: PickupReadyCardLabels;
}

/** Each term sits over its value until the card is wide enough to put them side by side. The list's own breakpoint follows the screen; this one follows the card, so it also works in a narrow column on a wide screen. */
const FACTS = "[&>div]:grid-cols-1 [&>div]:gap-1 @sm:[&>div]:grid-cols-[minmax(8rem,1fr)_2fr] @sm:[&>div]:gap-4";

/** Fills the placeholders it has a value for and leaves the others, so a node can still be set into `{date}` afterwards. */
const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** A sentence with a node where `{date}` is. */
function withDate(template: string, date: ReactNode): ReactNode {
  const [before = "", after = ""] = template.split("{date}");
  return (
    <>
      {before}
      {date}
      {after}
    </>
  );
}

/** A sentence with the phone number set into `{phone}` as a link, so a phone dials it and the number never breaks across two lines. */
function withPhone(template: string, phone: string): ReactNode {
  const [before = "", after = ""] = template.split("{phone}");
  return (
    <>
      {before}
      <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="rounded-sm font-medium whitespace-nowrap underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
        {phone}
      </a>
      {after}
    </>
  );
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The browser's clock, read once the page has loaded (never on the server), and again when the tab is looked at or a minute has passed. */
function useClock(given: PickupMoment | undefined): PickupMoment | undefined {
  const [clock, setClock] = useState<number | undefined>(undefined);
  useBrowserLayoutEffect(() => {
    if (given !== undefined) return;
    const read = () => setClock(Date.now());
    read();
    const visible = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", visible);
    const interval = window.setInterval(read, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", visible);
      window.clearInterval(interval);
    };
  }, [given]);
  return given ?? clock;
}

/**
 * "Your order is ready to collect", for the counter: a success mark, the order number, the pickup code set large in
 * tabular mono type with a copy button (and a slot for a QR code where the shop scans), the shop and its address
 * with a link to the route, today's hours in words, the last day the order is held as a `<time>` and what to
 * bring. Once the last day has passed the card says "Pickup window ended" instead, takes the code out of use and
 * gives the contact line, announced once. It replaces the email people scroll for at the counter.
 */
export function PickupReadyCard({
  order,
  code,
  store,
  hours,
  heldUntil,
  bring,
  directionsHref,
  qr,
  now,
  locale = "en-US",
  timeZone = "UTC",
  onCopy,
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: PickupReadyCardProps) {
  const words: Required<PickupReadyCardLabels> = { ...WORDS, ...labels };
  const id = useId();
  const clock = useClock(now);
  const ended = clock !== undefined && hasEnded(heldUntil, clock, timeZone);

  const when = dayWords(heldUntil, locale, timeZone);
  const moment = isoOf(heldUntil);
  const date =
    when === null || moment === null ? null : (
      <time dateTime={moment} title={dayWords(heldUntil, locale, timeZone, true) ?? undefined} className="whitespace-nowrap">
        {when}
      </time>
    );
  const list = bring ?? words.bringItems;

  const details: DescriptionItem[] = [
    {
      term: words.store,
      value: (
        <>
          <address className="not-italic">
            <span className="block">{store.name}</span>
            {store.address.map((line, index) => (
              <span key={`${index}-${line}`} className="block font-normal text-muted-foreground">
                {line}
              </span>
            ))}
          </address>
          {directionsHref ? (
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href={directionsHref} target="_blank" rel="noreferrer">
                {words.directions}
                <IconArrowUpRight />
              </a>
            </Button>
          ) : null}
        </>
      ),
    },
    ...(hours ? [{ term: words.hours, value: hours }] : []),
  ];

  const status = ended
    ? fill(words.statusEnded, { order })
    : fill(words.statusReady, { order, store: store.name, date: dayWords(heldUntil, locale, timeZone, true) ?? "" });

  return (
    <Card data-slot="pickup-ready-card" data-state={ended ? "ended" : "ready"} role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 overflow-hidden py-0", className)} {...props}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-5 @md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <span aria-hidden="true" className={cn("grid size-10 shrink-0 place-items-center rounded-full", ended ? "border border-border bg-muted text-muted-foreground" : "bg-foreground text-background")}>
          {ended ? <IconClock className="size-5" /> : <IconCheck className="size-5" strokeWidth={2.25} />}
        </span>
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-lg leading-snug font-semibold tracking-[-0.02em] text-balance">
            {ended ? words.ended : words.ready}
          </Heading>
          <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">{ended && date ? withDate(fill(words.endedOn, { order }), date) : fill(words.order, { order })}</p>
        </div>
        {!ended && date ? (
          <Badge variant="outline" className="col-start-2 justify-self-start @md:col-start-3 @md:row-start-1">
            <IconClock />
            {withDate(words.heldUntil, date)}
          </Badge>
        ) : null}
      </div>

      <div className="border-y border-border bg-muted/40 p-5">
        <div className="grid gap-5 @md:grid-cols-[minmax(0,1fr)_auto] @md:items-center">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[.18em] text-muted-foreground uppercase">{words.code}</p>
            <p className={cn("mt-2.5 font-mono text-4xl leading-none font-semibold tracking-[0.08em] break-all tabular-nums @md:text-5xl", ended && "text-muted-foreground line-through decoration-2")}>
              <span aria-hidden="true" className="select-all">
                {code}
              </span>
              <span className="sr-only">{spelledOut(code)}</span>
            </p>
            {ended ? (
              <p className="mt-4 text-sm text-muted-foreground">{words.codeEnded}</p>
            ) : (
              <div className="mt-4">
                <CopyButton value={code} label={words.copy} copiedLabel={words.copied} variant="outline" onCopy={onCopy} />
              </div>
            )}
          </div>
          {qr && !ended ? <div className="grid size-32 shrink-0 place-items-center justify-self-start rounded-lg bg-white p-2.5 text-black ring-1 ring-black/10 @md:justify-self-end [&_img]:size-full [&_svg]:size-full">{qr}</div> : null}
        </div>
      </div>

      <div className="p-5">
        <DescriptionList items={details} className={FACTS} />
      </div>

      {ended ? (
        <div className="flex items-start gap-3 border-t border-border bg-muted/40 p-5 text-sm leading-relaxed">
          <IconPhone aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p>{store.phone ? withPhone(fill(words.contact, { store: store.name }), store.phone) : fill(words.contactNoPhone, { store: store.name })}</p>
        </div>
      ) : list.length ? (
        <div className="border-t border-border p-5">
          <h3 className="text-sm font-medium">{words.bring}</h3>
          <ul role="list" className="mt-3 grid gap-2.5 text-sm @md:grid-cols-2">
            {list.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full border border-border bg-background">
                  <IconCheck className="size-3" strokeWidth={2.25} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {status}
      </p>
    </Card>
  );
}
