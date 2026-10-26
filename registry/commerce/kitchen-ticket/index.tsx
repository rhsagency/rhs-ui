"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconBag, IconBike, IconCheck, IconCheckCircle, IconClock, IconNote, IconUndo, IconUtensils, IconWarning } from "@rhs-ui/icons";
import { durationOf, formatElapsed, levelOf, secondsBetween, toMillis, type TicketLevel, type TicketMoment, type TicketThresholds } from "@rhs-ui/commerce/kitchen-ticket/ticket";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { TicketLevel, TicketMoment, TicketThresholds } from "@rhs-ui/commerce/kitchen-ticket/ticket";

/** How the order reaches the guest. It picks the icon and the word on the ticket. */
export type KitchenOrderType = "dine-in" | "pickup" | "delivery";

/** Whether the ticket is still being cooked or has been bumped off the screen. */
export type KitchenTicketStatus = "open" | "bumped";

export interface KitchenTicketItem {
  /** Identity of the line, for your list's key. */
  id: string;
  /** How many of it. */
  quantity: number;
  /** The dish as the kitchen knows it: "Margherita pizza". */
  name: string;
  /** What changes on this dish, one per line: "No basil", "Extra mozzarella". Written as the cook should read them. */
  modifiers?: readonly string[];
  /** A note for this dish alone. It is set in bold. */
  note?: string;
}

export interface KitchenTicketOrder {
  /** Identity of the order. */
  id: string;
  /** The number the kitchen calls: "142" or "A-142". */
  number: string;
  /** Dine in, pickup or delivery. */
  type: KitchenOrderType;
  /** Where it goes: "Table 12", the guest's first name, "Courier at 12:40". */
  place?: string;
  /** When the order arrived. The timer counts from here. */
  receivedAt: TicketMoment;
  /** When it was bumped, for a ticket that is already done. Without it the timer stops at the moment of the bump. */
  bumpedAt?: TicketMoment;
  /** The dishes, in the order the kitchen should read them. */
  items: readonly KitchenTicketItem[];
  /** Allergies, each as a word: "Peanuts", "Shellfish". They are set apart at the top of the ticket and read first. */
  allergies?: readonly string[];
  /** A note for the whole order. It is set in bold. */
  notes?: string;
}

export interface KitchenTicketLabels {
  /** The names of the three kinds of order. */
  types?: Partial<Record<KitchenOrderType, string>>;
  /** Before the number, for a screen reader: "Order 142". */
  order?: string;
  /** In front of the clock time the order arrived: "Received 12:31". `{time}`. */
  received?: string;
  /** For a screen reader, before the timer. */
  timer?: string;
  /** Under the timer while there is time. */
  calm?: string;
  /** Under the timer once the first limit has passed. */
  slow?: string;
  /** Under the timer once the second limit has passed. */
  late?: string;
  /** Under the timer on a ticket that is done. */
  done?: string;
  /** The label of the allergy block. */
  allergy?: string;
  /** For a screen reader, before the order note. */
  note?: string;
  /** For a screen reader, before a quantity. */
  quantity?: string;
  /** The Bump button. */
  bump?: string;
  /** The Recall button on a bumped ticket. */
  recall?: string;
  /** The name of the buttons for a screen reader. `{number}`. */
  bumpName?: string;
  /** The name of the Recall button for a screen reader. `{number}`. */
  recallName?: string;
  /** The confirmation on a bumped ticket. `{time}` is how long it took: "Bumped after 9:42". */
  bumped?: string;
  /** What a screen reader hears when the ticket slows down or is late, bumped or recalled. `{number}` and `{time}`. */
  announceSlow?: string;
  /** Said when the ticket is late. `{number}` and `{time}`. */
  announceLate?: string;
  /** Said when the ticket is bumped. `{number}` and `{time}`. */
  announceBumped?: string;
  /** Said when the ticket is recalled. `{number}`. */
  announceRecalled?: string;
}

const WORDS = {
  types: { "dine-in": "Dine in", pickup: "Pickup", delivery: "Delivery" },
  order: "Order",
  received: "Received {time}",
  timer: "Time since the order arrived",
  calm: "On time",
  slow: "Running slow",
  late: "Late",
  done: "Done",
  allergy: "Allergy",
  note: "Note",
  quantity: "Quantity",
  bump: "Bump",
  recall: "Recall",
  bumpName: "Bump order {number}",
  recallName: "Recall order {number}",
  bumped: "Bumped after {time}",
  announceSlow: "Order {number} is running slow, {time}.",
  announceLate: "Order {number} is late, {time}.",
  announceBumped: "Order {number} bumped after {time}.",
  announceRecalled: "Order {number} is back on the screen.",
} satisfies Required<KitchenTicketLabels>;

export interface KitchenTicketProps extends Omit<ComponentProps<"article">, "children"> {
  /** The order: its number, type, dishes with modifiers, allergies and notes, and when it arrived. */
  order: KitchenTicketOrder;
  /** The moment the timer counts to. Pass one clock to every ticket on the screen, so they tick together and the board renders the same on the server. Without it each ticket reads the browser's clock once it has loaded, and shows "--:--" until then. */
  now?: TicketMoment;
  /** When the ticket runs slow and when it is late, in minutes. Defaults to 8 and 12. */
  thresholds?: TicketThresholds;
  /** Whether the ticket is open or bumped. Leave it out and the ticket keeps its own state; pass it to control the ticket from your own list. */
  status?: KitchenTicketStatus;
  /** Called when Bump is pressed. Take the ticket off your screen here, or keep it and pass `status="bumped"`. */
  onBump?: (order: KitchenTicketOrder) => void;
  /** Called when Recall is pressed on a bumped ticket. */
  onRecall?: (order: KitchenTicketOrder) => void;
  /** Always pass your application locale, so the clock time the order arrived is written the same on the server and in the browser. */
  locale?: string;
  /** The time zone the order's clock time is written in. Use the kitchen's. */
  timeZone?: string;
  /** The words, for another language. */
  labels?: KitchenTicketLabels;
}

const TYPE_ICONS = { "dine-in": IconUtensils, pickup: IconBag, delivery: IconBike } as const;

/** What each step of the wait looks like: the frame of the card, the timer, and the word under it. Weight rises with tone, so the step reads without colour. */
const LOOK = {
  calm: { frame: "border-border", pill: "bg-muted font-medium text-foreground", word: "text-muted-foreground" },
  slow: { frame: "border-foreground/45", pill: "bg-muted font-bold text-foreground ring-2 ring-foreground/70 ring-inset", word: "font-semibold text-foreground" },
  late: { frame: "border-destructive/70 ring-1 ring-destructive/30", pill: "bg-destructive font-extrabold text-destructive-foreground", word: "font-bold tracking-[0.12em] text-destructive uppercase" },
} as const satisfies Record<TicketLevel, { frame: string; pill: string; word: string }>;

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The clock the ticket counts to: the one you pass in, or the browser's once the page has loaded, one tick a second while the ticket is open. */
function useNow(given: TicketMoment | undefined, running: boolean): number | undefined {
  const [clock, setClock] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (given !== undefined || !running) return;
    setClock(Date.now());
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [given, running]);
  return given === undefined ? clock : toMillis(given);
}

/**
 * The card a kitchen screen shows for each order: the number and how it goes out, the dishes with their modifiers,
 * the notes in bold, and the time since the order arrived. The timer escalates in three steps and says so in
 * words, weight and tone: "On time", then "Running slow" in bold with a ring, then "Late" in capitals on a solid
 * red timer, so the step still reads on a dim screen or without colour. Allergies sit in an inverted block right
 * under the number, come before the dishes in the reading order and are the description of the ticket, so a screen
 * reader says them as soon as it lands on it. Type is large enough to read from a metre away, and Bump
 * is a 56px button that turns into a short confirmation with a Recall button, announced politely. One clock passed
 * as `now` keeps every ticket on the board in step.
 */
export function KitchenTicket({ order, now, thresholds, status: given, onBump, onRecall, locale = "en-US", timeZone = "UTC", labels, className, ...props }: KitchenTicketProps) {
  const words = { ...WORDS, ...labels, types: { ...WORDS.types, ...labels?.types } };
  const headingId = useId();
  const [own, setOwn] = useState<KitchenTicketStatus>("open");
  const status = given ?? own;
  const open = status === "open";
  const current = useNow(now, open);

  // A ticket that is done stops counting: at the moment it was bumped, as far as the page knows it.
  const [stoppedAt, setStoppedAt] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (open) setStoppedAt(undefined);
    else if (stoppedAt === undefined && current !== undefined) setStoppedAt(current);
  }, [open, current, stoppedAt]);
  const bumpedAt = order.bumpedAt === undefined ? undefined : toMillis(order.bumpedAt);
  const reference = open ? current : (bumpedAt ?? stoppedAt ?? current);
  const seconds = reference === undefined ? undefined : secondsBetween(order.receivedAt, reference);
  const level: TicketLevel = open && seconds !== undefined ? levelOf(seconds, thresholds) : "calm";
  const elapsed = seconds === undefined ? "--:--" : formatElapsed(seconds);
  const look = LOOK[level];

  // Said only when it matters: a step up in the wait, and a bump or a recall. Never every second.
  const [said, setSaid] = useState("");
  const lastLevel = useRef<TicketLevel | undefined>(undefined);
  useEffect(() => {
    if (!open || seconds === undefined) return;
    const before = lastLevel.current;
    lastLevel.current = level;
    if (before !== undefined && before !== level && level !== "calm") setSaid(fill(level === "late" ? words.announceLate : words.announceSlow, { number: order.number, time: elapsed }));
  }, [open, level, seconds, elapsed, order.number, words.announceLate, words.announceSlow]);
  const wasBumped = useRef(!open);
  useEffect(() => {
    if (wasBumped.current === !open) return;
    wasBumped.current = !open;
    setSaid(open ? fill(words.announceRecalled, { number: order.number }) : fill(words.announceBumped, { number: order.number, time: elapsed }));
  }, [open, elapsed, order.number, words.announceBumped, words.announceRecalled]);

  // The button that was pressed leaves the screen, so focus moves to the one that took its place.
  const bumpButton = useRef<HTMLButtonElement>(null);
  const recallButton = useRef<HTMLButtonElement>(null);
  const acted = useRef(0);
  useEffect(() => {
    if (Date.now() - acted.current > 1500) return;
    acted.current = 0;
    (open ? bumpButton.current : recallButton.current)?.focus({ preventScroll: true });
  }, [open]);

  const bump = () => {
    acted.current = Date.now();
    setStoppedAt(current);
    setOwn("bumped");
    onBump?.(order);
  };
  const recall = () => {
    acted.current = Date.now();
    setOwn("open");
    onRecall?.(order);
  };

  const TypeIcon = TYPE_ICONS[order.type];
  const received = Number.isFinite(toMillis(order.receivedAt))
    ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }).format(toMillis(order.receivedAt))
    : undefined;
  const allergies = order.allergies?.filter(Boolean) ?? [];

  return (
    <article
      data-slot="kitchen-ticket"
      data-level={level}
      data-status={status}
      aria-labelledby={headingId}
      aria-describedby={allergies.length ? `${headingId}-allergy` : undefined}
      className={cn("flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none", open ? look.frame : "border-border", className)}
      {...props}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 pb-3.5">
        <div className="min-w-0">
          <h3 id={headingId} className="text-[2.125rem] leading-none font-bold tracking-[-0.04em] [overflow-wrap:anywhere] tabular-nums">
            <span className="sr-only">{words.order} </span>
            {order.number}
          </h3>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[0.9375rem]">
            <Badge variant="secondary" className="h-7 gap-1.5 px-2.5 text-[0.8125rem] font-semibold [&>svg]:size-4">
              <TypeIcon />
              {words.types[order.type]}
            </Badge>
            {order.place ? <span className="font-semibold">{order.place}</span> : null}
          </p>
          {received ? (
            <p className="mt-2 text-xs text-muted-foreground tabular-nums">
              {fill(words.received, { time: received })}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-2xl leading-none tabular-nums transition-colors duration-300 motion-reduce:transition-none", open ? look.pill : "bg-muted font-medium text-muted-foreground")}>
            {!open ? <IconCheck aria-hidden="true" className="size-5" /> : level === "late" ? <IconAlertCircle aria-hidden="true" className="size-5" /> : <IconClock aria-hidden="true" className="size-5" />}
            <span className="sr-only">{words.timer}: </span>
            <time dateTime={seconds === undefined ? undefined : durationOf(seconds)}>{elapsed}</time>
          </p>
          <p className={cn("text-xs", open ? look.word : "text-muted-foreground")}>{open ? words[level] : words.done}</p>
        </div>
      </header>

      {allergies.length ? (
        <div id={`${headingId}-allergy`} data-slot="kitchen-ticket-allergy" className="mx-4 mb-4 flex items-start gap-3 rounded-lg bg-foreground px-3.5 py-3 text-background">
          <IconWarning aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.16em] uppercase">{words.allergy}</p>
            <p className="mt-0.5 text-lg leading-snug font-bold [overflow-wrap:anywhere]">{allergies.join(", ")}</p>
          </div>
        </div>
      ) : null}

      <div className={cn("grid gap-4 px-4 pb-4 transition-opacity duration-300 motion-reduce:transition-none", !open && "opacity-70")}>
        {/* One quantity column for every dish, as wide as its widest quantity (never less than 2.5rem): the names stay in line, and a catering order of 105 pushes them right instead of landing on top of them. */}
        <ul className="grid grid-cols-[minmax(2.5rem,auto)_minmax(0,1fr)] gap-x-1.5 gap-y-4">
          {order.items.map((item) => (
            <li key={item.id} className="col-span-2 grid grid-cols-subgrid">
              <p className="text-2xl leading-[1.15] font-bold tabular-nums">
                <span className="sr-only">{words.quantity} </span>
                {item.quantity}
                <span aria-hidden="true" className="ml-px text-base font-medium text-muted-foreground">
                  ×
                </span>
              </p>
              <div className="min-w-0">
                <p className="text-xl leading-[1.2] font-semibold tracking-[-0.01em] [overflow-wrap:anywhere]">{item.name}</p>
                {item.modifiers?.length ? (
                  <ul className="mt-1.5 grid gap-0.5 border-l-2 border-border pl-3 text-base leading-snug text-foreground/85">
                    {item.modifiers.map((modifier, index) => (
                      <li key={`${index}-${modifier}`}>{modifier}</li>
                    ))}
                  </ul>
                ) : null}
                {item.note ? (
                  <p className="mt-1.5 flex items-start gap-1.5 text-base leading-snug font-bold">
                    <IconNote aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>
                      <span className="sr-only">{words.note}: </span>
                      {item.note}
                    </span>
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {order.notes ? (
          <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-base leading-snug font-bold">
            <IconNote aria-hidden="true" className="mt-0.5 size-[1.125rem] shrink-0" />
            <span>
              <span className="sr-only">{words.note}: </span>
              {order.notes}
            </span>
          </p>
        ) : null}
      </div>

      <footer className="mt-auto border-t border-border p-3">
        {open ? (
          <Button ref={bumpButton} type="button" size="lg" aria-label={fill(words.bumpName, { number: order.number })} onClick={bump} className="h-14 w-full gap-2.5 rounded-lg text-lg font-semibold [&_svg:not([class*='size-'])]:size-5">
            <IconCheck />
            {words.bump}
          </Button>
        ) : (
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 pl-1">
            <p className="flex items-center gap-2 text-[0.9375rem] font-semibold">
              <IconCheckCircle aria-hidden="true" className="size-5 shrink-0" />
              {fill(words.bumped, { time: elapsed })}
            </p>
            <Button ref={recallButton} type="button" variant="outline" size="lg" aria-label={fill(words.recallName, { number: order.number })} onClick={recall} className="h-11 rounded-lg px-3.5">
              <IconUndo />
              {words.recall}
            </Button>
          </div>
        )}
      </footer>

      <p role="status" className="sr-only">
        {said}
      </p>
    </article>
  );
}
