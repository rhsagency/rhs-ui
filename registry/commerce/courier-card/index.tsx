"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconCheck, IconClock, IconMessage, IconPhone, IconSearch, IconStar } from "@rhs-ui/icons";
import { durationWords, firstName, worthSaying, type CourierVehicle } from "@rhs-ui/commerce/courier-card/eta";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export type { CourierVehicle } from "@rhs-ui/commerce/courier-card/eta";

/** The person delivering. Only what the customer needs: a first name, a way to recognise the vehicle, a rating. */
export interface Courier {
  /** The courier's first name. If a full name is passed, only the first word is ever shown. */
  name: string;
  /** A photo: a URL or a data URI. Without one, or until it loads, the initial is drawn. */
  photo?: string;
  /** What they are driving. It names the vehicle in words when you give no `vehicleLabel`. */
  vehicle?: CourierVehicle;
  /** Said about the vehicle: "Cargo bike", "Grey van". Defaults to a plain word for the kind. */
  vehicleLabel?: string;
  /** The plate, so the customer can recognise the vehicle at the door: "12-KZB-4". */
  plate?: string;
  /** The average rating, from 0 to 5. */
  rating?: number;
  /** How many deliveries it is based on. */
  deliveries?: number;
}

/** Where the delivery stands. */
export type CourierStatus = "pending" | "on-the-way" | "arrived";

export interface CourierCardLabels {
  /** The first line while nobody has accepted the delivery yet. */
  pending?: string;
  /** Under it, in place of the arrival time. */
  pendingNote?: string;
  /** The arrival time. `{time}` is how long: "6 minutes". */
  arriving?: string;
  /** The arrival time in the last minute. */
  arrivingNow?: string;
  /** The arrival time when none is known. */
  onTheWay?: string;
  arrived?: string;
  /** The small marker while the courier is on the way. */
  live?: string;
  bike?: string;
  car?: string;
  van?: string;
  /** What a screen reader hears for the stars. `{rating}`. */
  rated?: string;
  /** After the rating. `{count}`. */
  deliveriesOne?: string;
  deliveriesOther?: string;
  call?: string;
  message?: string;
  /** The names of the two buttons for a screen reader. `{name}` is the first name. */
  callName?: string;
  messageName?: string;
  /** What a screen reader hears when the arrival time moves, or the delivery changes. `{name}` and `{status}`, which is the arrival sentence. */
  announce?: string;
  /** What a screen reader hears while nobody has accepted it. */
  announcePending?: string;
}

const WORDS = {
  pending: "Looking for a courier",
  pendingNote: "Arrival time appears once someone accepts.",
  arriving: "Arriving in {time}",
  arrivingNow: "Arriving now",
  onTheWay: "On the way",
  arrived: "Your courier has arrived",
  live: "Live",
  bike: "Bike",
  car: "Car",
  van: "Van",
  rated: "Rated {rating} out of 5",
  deliveriesOne: "{count} delivery",
  deliveriesOther: "{count} deliveries",
  call: "Call",
  message: "Message",
  callName: "Call {name}",
  messageName: "Message {name}",
  announce: "{name}. {status}.",
  announcePending: "Looking for a courier.",
} satisfies Required<CourierCardLabels>;

export interface CourierCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** The courier. Leave it out while nobody has accepted the delivery: the card shows the same footprint with "Looking for a courier". */
  courier?: Courier;
  /** Minutes until the courier arrives. Send a new number whenever your tracking has one; the card moves calmly. Leave it out when it is not known. */
  eta?: number;
  /** Where the delivery stands. Defaults to "pending" without a courier and "on-the-way" with one. */
  status?: CourierStatus;
  /** Called when Call is pressed. The card never shows the phone number: use a masked number or a relay on your side. */
  onCall?: () => void;
  /** Called when Message is pressed. */
  onMessage?: () => void;
  /** Where Call goes when that is a link, such as a relay number: `tel:+31201234567`. The number is in the link, never printed. */
  callHref?: string;
  /** Where Message goes when that is a link: `sms:+31201234567`. */
  messageHref?: string;
  /** Always pass your application locale, so the length of time and the rating are written the same on the server and in the browser. */
  locale?: string;
  /** The words, for another language. */
  labels?: CourierCardLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * The delivery driver at a glance, for live tracking: a photo or the first initial, a first name, the vehicle and
 * its plate, a rating, and "Arriving in 6 minutes". Call and Message are real buttons (or links) named for the
 * courier. The arrival time moves on screen every time you send a new one, and is said out loud calmly: only
 * when it has moved by two minutes or more, or is close, so a countdown never talks over a screen reader.
 * Personal data is as small as it can be: a first name even if a full name is passed, and no phone number is
 * ever drawn. While nobody has accepted the delivery the card keeps its footprint and says so.
 */
export function CourierCard({ courier, eta, status, onCall, onMessage, callHref, messageHref, locale = "en-US", labels, className, ...props }: CourierCardProps) {
  const words = { ...WORDS, ...labels };
  const id = useId();
  const state: CourierStatus = status ?? (courier ? "on-the-way" : "pending");
  const pending = state === "pending" || !courier;
  const name = courier ? firstName(courier.name) : "";

  const arrival =
    state === "arrived" ? words.arrived : eta === undefined ? words.onTheWay : eta < 1 ? words.arrivingNow : fill(words.arriving, { time: durationWords(Math.round(eta), locale) });
  const sentence = pending ? words.announcePending : fill(words.announce, { name, status: arrival });

  // Said once things settle, and only when it matters: a new state, an arrival time two minutes away from the last one said, or one that is now close.
  const [said, setSaid] = useState("");
  const last = useRef<{ state: CourierStatus; eta: number | undefined }>({ state, eta });
  useEffect(() => {
    const changed = last.current.state !== state;
    if (!changed && !worthSaying(last.current.eta, eta)) return;
    const timeout = window.setTimeout(() => {
      last.current = { state, eta };
      setSaid(sentence);
    }, 1200);
    return () => window.clearTimeout(timeout);
  }, [state, eta, sentence]);

  // The vehicle is written out ("Cargo bike") beside its plate. A glyph drawn that small on the photo read as a smudge and said nothing the words do not.
  const vehicleText = courier?.vehicleLabel ?? (courier?.vehicle ? words[courier.vehicle] : undefined);
  const count = courier?.deliveries;
  const rating = courier?.rating === undefined ? "" : new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(courier.rating);
  const plural = new Intl.PluralRules(locale);

  const actionProps = (href: string | undefined, handler: (() => void) | undefined, label: string, accessible: string, Icon: typeof IconPhone) => {
    if (!href && !handler) return null;
    const content = (
      <>
        <Icon />
        {label}
      </>
    );
    return href && !pending ? (
      <Button asChild variant="outline" className="w-full">
        <a href={href} aria-label={accessible} onClick={handler}>
          {content}
        </a>
      </Button>
    ) : (
      <Button type="button" variant="outline" disabled={pending} aria-label={pending ? undefined : accessible} onClick={handler} className="w-full">
        {content}
      </Button>
    );
  };
  const call = actionProps(callHref, onCall, words.call, fill(words.callName, { name }), IconPhone);
  const write = actionProps(messageHref, onMessage, words.message, fill(words.messageName, { name }), IconMessage);

  return (
    <div data-slot="courier-card" data-status={state} role="group" aria-labelledby={`${id}-name`} aria-busy={pending || undefined} className={cn("rounded-xl border border-border bg-card p-4 shadow-xs", className)} {...props}>
      <div className="flex items-start gap-3.5">
        <div className="shrink-0">
          {pending ? (
            <span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <IconSearch className="size-5 motion-safe:animate-pulse" />
            </span>
          ) : (
            <Avatar size="lg" aria-hidden="true">
              {courier?.photo ? <AvatarImage src={courier.photo} alt="" /> : null}
              <AvatarFallback>{initialsOf(name).slice(0, 1)}</AvatarFallback>
            </Avatar>
          )}
        </div>

        <div className="min-h-[3.9rem] min-w-0 flex-1">
          <p id={`${id}-name`} className="truncate text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em]">
            {pending ? words.pending : name}
          </p>
          {pending ? (
            <>
              <div aria-hidden="true" className="mt-0.5 flex h-5 items-center">
                <Skeleton className="h-3 w-36 max-w-full" />
              </div>
              <div aria-hidden="true" className="mt-1 flex h-4 items-center">
                <Skeleton className="h-3 w-24 max-w-full" delay={160} />
              </div>
            </>
          ) : (
            <>
              <p className="mt-0.5 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                {vehicleText ? <span>{vehicleText}</span> : null}
                {courier?.plate ? <span className="rounded border border-border px-1.5 font-mono text-[0.6875rem] leading-[1.125rem] tracking-wide text-foreground">{courier.plate}</span> : null}
              </p>
              {courier?.rating !== undefined ? (
                <p className="mt-1 flex min-h-4 items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <IconStar aria-hidden="true" className="size-3.5 fill-current text-foreground" />
                  <span aria-hidden="true" className="font-medium text-foreground">
                    {rating}
                  </span>
                  <span className="sr-only">{fill(words.rated, { rating })}</span>
                  {count !== undefined ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{fill(plural.select(count) === "one" ? words.deliveriesOne : words.deliveriesOther, { count: new Intl.NumberFormat(locale).format(count) })}</span>
                    </>
                  ) : null}
                </p>
              ) : null}
            </>
          )}
        </div>

        {state === "on-the-way" ? (
          <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-foreground motion-safe:animate-pulse" />
            {words.live}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex min-h-12 items-center gap-3 rounded-lg bg-muted/60 px-3.5 py-3">
        {state === "arrived" ? <IconCheck aria-hidden="true" className="size-4 shrink-0" /> : <IconClock aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />}
        {/* Both sentences share one cell, so the card is as tall waiting as it is on its way, at every width. While nobody has accepted, a typical arrival stands in invisibly for the one that is not known yet. */}
        <div className="grid min-w-0 flex-1">
          <p aria-hidden={!pending || undefined} className={cn("col-start-1 row-start-1 self-center text-[0.8125rem] text-pretty text-muted-foreground", !pending && "invisible")}>
            {words.pendingNote}
          </p>
          <p aria-hidden={pending || undefined} className={cn("col-start-1 row-start-1 self-center text-[0.9375rem] font-semibold tracking-[-0.01em] tabular-nums", pending && "invisible")}>
            {pending ? fill(words.arriving, { time: durationWords(10, locale) }) : arrival}
          </p>
        </div>
      </div>

      {call || write ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {call}
          {write}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
