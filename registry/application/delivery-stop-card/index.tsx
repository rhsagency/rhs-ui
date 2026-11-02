"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { countText, fill, timeIn, type DateInput } from "@rhs-ui/application/delivery-stop-card/format";
import { IconAlertCircle, IconCheck, IconClock, IconClose, IconInfo, IconMinus, IconMoreHorizontal, IconNavigation, IconPackage, IconPhone, IconSkipForward, IconUndo } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { cn } from "@/lib/utils";

/** Where the stop stands: still to come, the one to drive to now, delivered, not delivered, or skipped. */
export type DeliveryStopStatus = "upcoming" | "next" | "delivered" | "failed" | "skipped";

/** The outcomes the driver can report from the card. `upcoming` puts a finished stop back in the queue. */
export type DeliveryStopOutcome = "delivered" | "failed" | "skipped" | "upcoming";

/** Who gets the parcels and where. */
export interface DeliveryAddress {
  /** The recipient: "Sana Haddad". */
  recipient: string;
  /** The address, one line each: ["Kerkstraat 14", "1017 GR Amsterdam"]. */
  lines: readonly string[];
  /** What the driver needs to know: "Leave with the neighbours at 16 if nobody opens". */
  notes?: string;
}

/** The slot the recipient was promised. */
export interface DeliveryWindow {
  /** When the window opens: a Date, a timestamp or an ISO string with its offset. */
  from: DateInput;
  /** When it closes, in the same forms. */
  to: DateInput;
}

/** The words the card uses, for translation. `{sequence}`, `{recipient}`, `{address}`, `{time}`, `{count}`, `{stop}` and `{outcome}` are filled in. */
export interface DeliveryStopCardLabels {
  /** Said to screen readers before the recipient. Default "Stop {sequence}". */
  stop?: string;
  /** The word of the badge on the next stop. */
  statuses?: Partial<Record<Exclude<DeliveryStopStatus, "upcoming">, string>>;
  /** Said to screen readers before the time window. Default "Delivery window". */
  window?: string;
  /** The word between the two times of the window, said to screen readers. Default "to". */
  to?: string;
  /** One parcel. Default "{count} parcel". */
  parcelOne?: string;
  /** Several parcels. Default "{count} parcels". */
  parcelOther?: string;
  /** What a delivered stop says, with the time. It is the label of its badge. Default "Delivered at {time}". */
  deliveredAt?: string;
  /** The same without a time. Default "Delivered". */
  delivered?: string;
  /** What a stop that could not be delivered says, with the time. Default "Not delivered at {time}". */
  failedAt?: string;
  /** The same without a time. Default "Not delivered". */
  failed?: string;
  /** What a skipped stop says, with the time. Default "Skipped at {time}". */
  skippedAt?: string;
  /** The same without a time. Default "Skipped". */
  skipped?: string;
  /** The call button. Default "Call". */
  call?: string;
  /** The name of that button. Default "Call {recipient}". */
  callFor?: string;
  /** The navigate button. Default "Navigate". */
  navigate?: string;
  /** The name of that button. Default "Navigate to {address}". */
  navigateFor?: string;
  /** The button that reports the parcels delivered. Default "Delivered". */
  markDelivered?: string;
  /** The name of that button. Default "Mark stop {sequence} as delivered". */
  markDeliveredFor?: string;
  /** The name of the menu button that holds the other outcomes. Default "Other outcomes for stop {sequence}". */
  more?: string;
  /** The menu entry for a stop that could not be delivered. Default "Could not deliver". */
  couldNot?: string;
  /** The menu entry that skips the stop. Default "Skip this stop". */
  skip?: string;
  /** The button that puts a finished stop back in the queue. Default "Undo". */
  undo?: string;
  /** The name of that button. Default "Undo stop {sequence}". */
  undoFor?: string;
  /** Said politely when the status of the stop changes, so a change that is seen is also heard. Default "{stop}, {recipient}: {outcome}." */
  said?: string;
  /** The outcome said for a finished stop that was put back in the queue. Default "Back in the queue". */
  queued?: string;
}

export interface DeliveryStopCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The stop's place on the route: 3 is the third stop. It sits in a marker. */
  sequence: number;
  /** The recipient and where they are. */
  address: DeliveryAddress;
  /** When the recipient expects the parcels. */
  window?: DeliveryWindow;
  /** How many parcels go to this stop. */
  parcels?: number;
  /** Where the stop stands. The next stop is emphasised, marked "Next stop" and given `aria-current="step"`; finished stops are muted and say what happened. Default "upcoming". */
  status?: DeliveryStopStatus;
  /** When a finished stop was finished, for "Delivered at 14:12". */
  completedAt?: DateInput;
  /** Why a stop could not be delivered or was skipped: "Nobody home, card left". */
  reason?: string;
  /** The Call button was pressed. Leave it out and there is no button. */
  onCall?: () => void;
  /** The Navigate button was pressed. Leave it out and there is no button. */
  onNavigate?: () => void;
  /** An outcome was reported from the card: "delivered" from the big button, "failed" or "skipped" from the menu next to it, "upcoming" from Undo on a finished stop. Leave it out and there are no outcome buttons. */
  onStatusChange?: (status: DeliveryStopOutcome) => void;
  /** Heading level of the recipient. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the times and numbers. Default "en-US". */
  locale?: string;
  /** The time zone the window and the times are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: DeliveryStopCardLabels;
}

const DEFAULT_LABELS = {
  stop: "Stop {sequence}",
  window: "Delivery window",
  parcelOne: "{count} parcel",
  parcelOther: "{count} parcels",
  deliveredAt: "Delivered at {time}",
  delivered: "Delivered",
  failedAt: "Not delivered at {time}",
  failed: "Not delivered",
  skippedAt: "Skipped at {time}",
  skipped: "Skipped",
  call: "Call",
  callFor: "Call {recipient}",
  navigate: "Navigate",
  navigateFor: "Navigate to {address}",
  markDelivered: "Delivered",
  markDeliveredFor: "Mark stop {sequence} as delivered",
  more: "Other outcomes for stop {sequence}",
  couldNot: "Could not deliver",
  skip: "Skip this stop",
  undo: "Undo",
  undoFor: "Undo stop {sequence}",
  to: "to",
  said: "{stop}, {recipient}: {outcome}.",
  queued: "Back in the queue",
};

const DEFAULT_STATUSES = { next: "Next stop", delivered: "Delivered", failed: "Not delivered", skipped: "Skipped" };

/** Each status has its own glyph, fill and weight, so none depends on colour. */
function definitions(words: typeof DEFAULT_STATUSES): Record<string, StatusDefinition> {
  return {
    next: { label: words.next, glyph: <IconNavigation />, emphasis: "strong" },
    delivered: { label: words.delivered, glyph: <IconCheck />, emphasis: "soft" },
    failed: { label: words.failed, glyph: <IconAlertCircle />, emphasis: "critical" },
    skipped: { label: words.skipped, glyph: <IconMinus />, emphasis: "quiet" },
  };
}

/** The number on the route, in a circle. The next stop's is larger and solid, a finished one is quiet, a failed one is drawn in the error colour and a skipped one is dashed. */
const MARKER: Record<DeliveryStopStatus, string> = {
  upcoming: "size-10 border border-border bg-background text-foreground",
  next: "size-12 border border-primary bg-primary text-primary-foreground",
  delivered: "size-10 border border-transparent bg-muted text-muted-foreground",
  failed: "size-10 border border-destructive bg-background text-destructive",
  skipped: "size-10 border border-dashed border-border bg-background text-muted-foreground",
};

/**
 * One stop on a delivery route, written to be read at a glance on a phone in
 * a van: the stop's number in a marker, who and where in large type, the time
 * window the recipient was promised, the parcels and the driver's notes. The
 * next stop is emphasised, marked "Next stop" and given `aria-current`, and
 * carries large call and navigate buttons and a big "Delivered", with the
 * other outcomes (could not deliver, skip) one tap away in a menu. A stop that
 * is done says what happened in its badge, in words and with the time
 * ("Delivered at 14:12"), gives the reason when there is one, mutes, and
 * offers Undo. Every change of status is also said politely in a status line,
 * and focus that sat on a control that has just left the card stays inside it
 * (on Undo after an outcome, on the first action after Undo), so a driver
 * using a keyboard or a screen reader never loses their place. It pairs with
 * a sortable list for route planning: the card is one stop and keeps no order
 * of its own.
 */
export function DeliveryStopCard({
  sequence,
  address,
  window: slot,
  parcels,
  status = "upcoming",
  completedAt,
  reason,
  onCall,
  onNavigate,
  onStatusChange,
  headingLevel = 3,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: DeliveryStopCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const words = { ...DEFAULT_STATUSES, ...labels?.statuses };
  const statuses = definitions(words);
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const undo = useRef<HTMLButtonElement>(null);
  const previous = useRef(status);
  const refocus = useRef<"outcome" | "queue" | null>(null);
  const [said, setSaid] = useState("");
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const next = status === "next";
  const done = status === "delivered" || status === "failed" || status === "skipped";
  const opens = slot ? new Date(slot.from) : null;
  const closes = slot ? new Date(slot.to) : null;
  const from = slot ? timeIn(slot.from, locale, timeZone) : null;
  const to = slot ? timeIn(slot.to, locale, timeZone) : null;
  const finished = completedAt === undefined ? null : timeIn(completedAt, locale, timeZone);
  const first = address.lines[0] ?? address.recipient;
  // What a finished stop says, with the time in it. It is the label of the badge, so the outcome is written once.
  const outcome =
    status === "delivered"
      ? finished
        ? fill(text.deliveredAt, { time: finished })
        : text.delivered
      : status === "failed"
        ? finished
          ? fill(text.failedAt, { time: finished })
          : text.failed
        : status === "skipped"
          ? finished
            ? fill(text.skippedAt, { time: finished })
            : text.skipped
          : undefined;
  const actions = !done && (onCall !== undefined || onNavigate !== undefined || (next && onStatusChange !== undefined));
  const sequenceText = countText(sequence, locale);
  const hasWindow = Boolean(from && to && opens && closes);
  // The first row holds the badge and the window; a stop with neither (an upcoming one without a window) has no such row.
  const showRow = status !== "upcoming" || hasWindow;

  // A change of status is said once, politely. Focus that sat on a control that has now left the card (the buttons of the action
  // bar, or Undo) is put back inside the card, unless it went somewhere else on purpose, such as the next stop.
  useEffect(() => {
    const was = previous.current;
    previous.current = status;
    if (was === status) return;
    const wasDone = was === "delivered" || was === "failed" || was === "skipped";
    const result = done ? outcome : wasDone ? text.queued : next ? words.next : undefined;
    // A stop that falls back from next to upcoming says nothing, and what it said before is no longer true.
    setSaid(result ? fill(text.said, { stop: fill(text.stop, { sequence: sequenceText }), recipient: address.recipient, outcome: result }) : "");

    const wanted = refocus.current;
    refocus.current = null;
    if (!wanted) return;
    const active = document.activeElement;
    if (active && active !== document.body && active.isConnected) return;
    const target = wanted === "outcome" ? undo.current : bar.current?.querySelector<HTMLElement>("button");
    (target ?? heading.current?.closest<HTMLElement>("article"))?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a change of status is announced, not a change of words
  }, [status]);

  // What was said does not stay in the card to be read a second time by someone browsing it: the status line empties after a while.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 8000);
    return () => window.clearTimeout(timer);
  }, [said]);

  /** Reports an outcome, and notes where focus should land once the status has changed and the control it sat on is gone. */
  function report(result: DeliveryStopOutcome) {
    refocus.current = result === "upcoming" ? "queue" : "outcome";
    onStatusChange?.(result);
  }

  return (
    <article
      data-slot="delivery-stop-card"
      data-status={status}
      aria-current={next ? "step" : undefined}
      aria-labelledby={titleId}
      // Where focus falls back to when the control it was on has gone and nothing in the card can take it.
      tabIndex={-1}
      className={cn(
        "@container flex min-w-0 flex-col overflow-hidden rounded-xl border text-card-foreground outline-none transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
        next ? "border-foreground bg-card shadow-sm ring-1 ring-foreground" : "border-border shadow-xs",
        done ? "bg-muted/40" : !next && "bg-card",
        className,
      )}
      {...props}
    >
      <div className="flex gap-3 p-4 @sm:p-5">
        {/* The marker has a slot of its own, as wide as the next stop's, so the text starts in the same place on every stop whatever its status. */}
        <span aria-hidden="true" className="grid w-12 shrink-0 place-items-center self-start">
          <span className={cn("grid shrink-0 place-items-center rounded-full text-base font-semibold tabular-nums", MARKER[status], next && "text-lg")}>{sequence}</span>
        </span>

        <div className="min-w-0 flex-1">
          {showRow ? (
            <div className="flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1.5">
              {/* A badge that is longer than the room it has wraps its words, so it never pushes the card wider. */}
              {status !== "upcoming" ? <StatusBadge status={status} label={outcome} statuses={statuses} size="md" className="h-auto min-h-6 max-w-full py-0.5 leading-snug whitespace-normal" /> : null}
              {/* One rule for the window on every stop: under the badge on a narrow card, at the right edge of the row on a card wide enough for the longest badge and the window side by side. */}
              {from && to && opens && closes ? (
                <p className="flex basis-full items-center gap-1.5 text-sm leading-5 font-medium tabular-nums @[26rem]:ml-auto @[26rem]:basis-auto">
                  <IconClock className="size-4 shrink-0 text-muted-foreground" />
                  <span className="sr-only">{text.window}: </span>
                  <span>
                    <time dateTime={opens.toISOString()} className="whitespace-nowrap">
                      {from}
                    </time>
                    <span aria-hidden="true" className="mx-1">
                      –
                    </span>
                    <span className="sr-only"> {text.to} </span>
                    <time dateTime={closes.toISOString()} className="whitespace-nowrap">
                      {to}
                    </time>
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}

          <Heading ref={heading} id={titleId} className={cn("text-[1.0625rem] leading-snug font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]", showRow && "mt-2", done && "text-muted-foreground")}>
            <span className="sr-only">{fill(text.stop, { sequence: sequenceText })}: </span>
            {address.recipient}
          </Heading>
          <p className={cn("mt-1 text-[0.9375rem] leading-6 [overflow-wrap:anywhere]", done ? "text-muted-foreground" : "text-foreground")}>
            {address.lines.map((line, position) => (
              <span key={`${position}-${line}`} className="block">
                {line}
              </span>
            ))}
          </p>

          {address.notes ? (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-[0.8125rem] leading-5">
              <IconInfo className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{address.notes}</span>
            </p>
          ) : null}

          {done && reason ? (
            <p className={cn("mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-[0.8125rem] leading-5", status === "failed" ? "border-destructive/40 bg-destructive/5" : "border-border bg-background")}>
              {status === "failed" ? <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" /> : <IconInfo className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
              <span className="min-w-0 [overflow-wrap:anywhere]">{reason}</span>
            </p>
          ) : null}

          {parcels !== undefined || (done && onStatusChange) ? (
            <div className="mt-3 flex min-h-8 items-center justify-between gap-3">
              {parcels !== undefined ? (
                <p className="flex items-center gap-2 text-sm leading-5 text-muted-foreground tabular-nums">
                  <IconPackage className="size-4 shrink-0" />
                  {fill(parcels === 1 ? text.parcelOne : text.parcelOther, { count: countText(parcels, locale) })}
                </p>
              ) : (
                <span />
              )}
              {done && onStatusChange ? (
                <Button ref={undo} type="button" variant="ghost" size="sm" aria-label={fill(text.undoFor, { sequence: sequenceText })} onClick={() => report("upcoming")} className="-my-1 -mr-2 text-muted-foreground hover:text-foreground">
                  <IconUndo />
                  {text.undo}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {actions ? (
        <div ref={bar} className="grid grid-cols-1 gap-2 border-t border-border bg-muted/30 p-3 @sm:px-5 @sm:py-3.5">
          {onCall || onNavigate ? (
            <div className="grid grid-cols-2 gap-2">
              {onCall ? (
                <Button type="button" variant="outline" size={next ? "lg" : "default"} aria-label={fill(text.callFor, { recipient: address.recipient })} onClick={onCall} className={cn(!onNavigate && "col-span-2")}>
                  <IconPhone />
                  {text.call}
                </Button>
              ) : null}
              {onNavigate ? (
                <Button type="button" variant="outline" size={next ? "lg" : "default"} aria-label={fill(text.navigateFor, { address: first })} onClick={onNavigate} className={cn(!onCall && "col-span-2")}>
                  <IconNavigation />
                  {text.navigate}
                </Button>
              ) : null}
            </div>
          ) : null}

          {next && onStatusChange ? (
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Button type="button" size="lg" aria-label={fill(text.markDeliveredFor, { sequence: sequenceText })} onClick={() => report("delivered")}>
                <IconCheck strokeWidth={2.25} />
                {text.markDelivered}
              </Button>
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="lg" aria-label={fill(text.more, { sequence: sequenceText })} className="w-11 px-0">
                    <IconMoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuItem onSelect={() => report("failed")} className="py-2.5">
                    <IconClose />
                    {text.couldNot}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => report("skipped")} className="py-2.5">
                    <IconSkipForward />
                    {text.skip}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : null}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {said}
      </p>
    </article>
  );
}
