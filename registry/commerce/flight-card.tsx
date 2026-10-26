"use client";

import { useId, useRef, useState, type ComponentProps, type ReactElement } from "react";

import { IconCheck, IconChevronDown, IconClock, IconPlane, IconSuitcase } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface FlightAirport {
  /** The three-letter IATA code: "AMS". */
  code: string;
  /** The city, for the words around the code: "Amsterdam". */
  city?: string;
  /** The airport's IANA time zone: "Europe/Amsterdam". The times at this airport are written in it. */
  timeZone: string;
}

export interface FlightSegment {
  /** The airport it leaves from. */
  from: FlightAirport;
  /** The airport it lands at. */
  to: FlightAirport;
  /** The moment the plane leaves, as an ISO date-time with an offset or in UTC: "2026-11-14T07:25:00Z". Written in the zone of `from`. */
  departure: string;
  /** The moment it lands, in the same form. Written in the zone of `to`. */
  arrival: string;
  /** The airline: "Northwind Air". */
  carrier: string;
  /** The flight number: "NW 441". */
  flightNumber: string;
}

export interface FlightCardLabels {
  /** The route when it has no stops. */
  direct?: string;
  /** One stop. `{place}` and `{layover}`. */
  oneStop?: string;
  /** More stops. `{count}` and `{places}`. */
  stops?: string;
  /** After the arrival time when it lands on a later day. `{count}`. */
  nextDay?: string;
  nextDays?: string;
  /** What a screen reader hears after such a time. */
  nextDayHeard?: string;
  /** The disclosure that opens every flight of the trip. */
  details?: string;
  /** Between two flights. `{layover}` and `{place}`. */
  layover?: string;
  /** The button. */
  select?: string;
  /** The button on the flight that is chosen. */
  selected?: string;
  /** The heading nobody sees but a screen reader, which also names the card and describes its button. `{from}`, `{to}`, `{carrier}` and `{time}` (the departure, in the departure airport's zone). */
  title?: string;
  /** In the tooltip of a time. `{place}`. */
  localTime?: string;
}

const WORDS = {
  direct: "Direct",
  oneStop: "1 stop in {place}, {layover}",
  stops: "{count} stops in {places}",
  nextDay: "+{count} day",
  nextDays: "+{count} days",
  nextDayHeard: "next day",
  details: "Flight details",
  layover: "{layover} layover in {place}",
  select: "Select",
  selected: "Selected",
  title: "{from} to {to}, departs {time}, {carrier}",
  localTime: "{place} time",
} satisfies Required<FlightCardLabels>;

export interface FlightCardProps extends Omit<ComponentProps<"div">, "children" | "title" | "onSelect"> {
  /** The flights of the trip in order: one for a direct flight, more with a stop between. */
  segments: readonly FlightSegment[];
  /** The price in minor units: 18900 is 189.00. */
  price: number;
  /** ISO 4217 code. */
  currency?: string;
  /** What the price covers, under it: "per person, return". */
  priceNote?: string;
  /** The cabin: "Economy". */
  cabin?: string;
  /** The baggage that comes with it: "1 checked bag included". */
  baggage?: string;
  /** A word in the corner of the card: "Cheapest", "Fastest". */
  badge?: string;
  /** This is the flight that is chosen: a heavier border and a button that says "Selected". */
  selected?: boolean;
  /** Called when the button is pressed. Pass it from a client component. */
  onSelect?: () => void;
  /** Always pass your application locale, so the server and the browser write the same times. */
  locale?: string;
  /** The heading's element: "h3" by default. The heading is for screen readers; the card shows the route. */
  headingAs?: "h2" | "h3" | "h4";
  /** The words, for another language. */
  labels?: FlightCardLabels;
}

const DAY = 86_400_000;

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** The calendar day a moment falls on in a zone, as days since 1970. */
function dayOf(ms: number, zone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(ms);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / DAY;
}

/** "2h 05m", "45m", "3h". */
function durationText(minutes: number, locale: string): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  const hour = new Intl.NumberFormat(locale, { style: "unit", unit: "hour", unitDisplay: "narrow" });
  const minute = new Intl.NumberFormat(locale, { style: "unit", unit: "minute", unitDisplay: "narrow", minimumIntegerDigits: hours ? 2 : 1 });
  return [hours ? hour.format(hours) : "", rest || !hours ? minute.format(rest) : ""].filter(Boolean).join(" ");
}

/** A price in minor units. A whole amount drops its cents ("€189"), one with cents keeps them ("€189.50"). */
function money(minor: number, currency: string, locale: string): string {
  const digits = new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const major = minor / 10 ** digits;
  const fraction = Number.isInteger(major) ? 0 : digits;
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(major);
}

/** The hour written the way the locale counts it: "08:25" where the day has 24 hours, "8:25 AM" where it has 12. */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  const cycle = new Intl.DateTimeFormat(locale, { timeZone: "UTC", hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

const placeOf = (airport: FlightAirport): string => airport.city ?? airport.code;

/** "Sat 14 Nov", the day it is at the airport. */
const dayIn = (value: string, timeZone: string, locale: string): string => new Intl.DateTimeFormat(locale, { timeZone, weekday: "short", day: "numeric", month: "short" }).format(new Date(value));

/**
 * A tooltip that a tap can open. Radix opens one on hover and on keyboard focus only, and closes it on every
 * click, so on a touch screen the zone would never show. Here a press toggles it.
 */
function TapTooltip({ content, focusable, children }: { content: string; focusable: boolean; children: ReactElement }) {
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
          tabIndex={focusable ? 0 : undefined}
          className="-mx-1 rounded-sm px-1 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 [@media(hover:none)]:cursor-pointer"
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

/** A time at an airport, in that airport's own zone, with the zone's abbreviation and the date in a tooltip. */
function ZoneTime({ at, airport, locale, words, focusable }: { at: string; airport: FlightAirport; locale: string; words: Required<FlightCardLabels>; focusable: boolean }) {
  const date = new Date(at);
  const time = new Intl.DateTimeFormat(locale, { timeZone: airport.timeZone, ...clockOptions(locale) }).format(date);
  const abbreviation = new Intl.DateTimeFormat(locale, { timeZone: airport.timeZone, timeZoneName: "short" }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value ?? airport.timeZone;
  const day = new Intl.DateTimeFormat(locale, { timeZone: airport.timeZone, weekday: "long", day: "numeric", month: "long" }).format(date);
  return (
    <TapTooltip content={`${day}, ${time} ${abbreviation}. ${fill(words.localTime, { place: placeOf(airport) })}`} focusable={focusable}>
      <time dateTime={date.toISOString()}>
        {time}
        <span className="sr-only"> {abbreviation}</span>
      </time>
    </TapTooltip>
  );
}

/** The line between the airports: a dot at each end and a smaller one for every stop. */
function RouteLine({ stops }: { stops: number }) {
  return (
    <span aria-hidden="true" className="relative block h-2.5">
      <span className="absolute inset-x-1 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
      <span className="absolute top-1/2 left-0 size-2.5 -translate-y-1/2 rounded-full border-2 border-foreground bg-card" />
      <span className="absolute top-1/2 right-0 size-2.5 -translate-y-1/2 rounded-full bg-foreground" />
      {Array.from({ length: stops }, (_, index) => (
        <span key={index} className="absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-foreground bg-card" style={{ left: `${((index + 1) / (stops + 1)) * 100}%` }} />
      ))}
    </span>
  );
}

function Place({ at, airport, locale, words, align, later }: { at: string; airport: FlightAirport; locale: string; words: Required<FlightCardLabels>; align: "start" | "end"; later?: string }) {
  return (
    <div className={cn("grid min-w-0 gap-0.5", align === "end" && "text-right")}>
      <p className="text-xl leading-tight font-semibold tracking-[-0.02em] whitespace-nowrap tabular-nums">
        <ZoneTime at={at} airport={airport} locale={locale} words={words} focusable />
        {later ? (
          <>
            <span aria-hidden="true" className="ml-1 align-super text-[0.6875rem] font-medium tracking-normal text-muted-foreground">
              {later}
            </span>
            <span className="sr-only">, {words.nextDayHeard}</span>
          </>
        ) : null}
      </p>
      <p className="text-sm font-semibold tracking-wide">{airport.code}</p>
      {airport.city ? <p className="truncate text-xs text-muted-foreground">{airport.city}</p> : null}
    </div>
  );
}

/**
 * A flight in a list of results: when it leaves and lands and from which airports, how long it takes and how many
 * stops it has in words ("Direct", "1 stop in Zurich, 1h 20m"), the airline, the price and a select button. Times are
 * written in each airport's own zone, with the abbreviation and the date in a tooltip that a hover, a tap or the
 * keyboard opens, and a landing on a later day says "+1 day". The price and the button sit on the right, below on a
 * narrow card. "Flight details" opens every flight of the trip with the layovers between them.
 */
export function FlightCard({ segments, price, currency = "EUR", priceNote, cabin, baggage, badge, selected = false, onSelect, locale = "en-US", headingAs: Heading = "h3", labels, className, ...props }: FlightCardProps) {
  const words: Required<FlightCardLabels> = { ...WORDS, ...labels };
  const id = useId();
  const first = segments[0];
  const last = segments[segments.length - 1];
  const at = (value: string) => new Date(value).getTime();
  // A trip without flights, or with a moment that is not a date, cannot be drawn: nothing is better than a broken time.
  if (!first || !last || segments.some((segment) => Number.isNaN(at(segment.departure)) || Number.isNaN(at(segment.arrival)))) return null;

  const stops = segments.length - 1;
  const layovers = segments.slice(1).map((segment, index) => ({ airport: segments[index]?.to ?? segment.from, minutes: (at(segment.departure) - at(segments[index]?.arrival ?? segment.departure)) / 60_000 }));
  const total = (at(last.arrival) - at(first.departure)) / 60_000;
  const later = dayOf(at(last.arrival), last.to.timeZone) - dayOf(at(first.departure), first.from.timeZone);
  const laterText = later > 0 ? fill(later === 1 ? words.nextDay : words.nextDays, { count: String(later) }) : undefined;
  const list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" });
  const route =
    stops === 0
      ? words.direct
      : stops === 1 && layovers[0]
        ? fill(words.oneStop, { place: placeOf(layovers[0].airport), layover: durationText(layovers[0].minutes, locale) })
        : fill(words.stops, { count: String(stops), places: list.format(layovers.map((layover) => placeOf(layover.airport))) });
  const carriers = [...new Set(segments.map((segment) => segment.carrier))];
  const duration = durationText(total, locale);
  // What the card is called: enough to tell it from the card above and below it, which share the route.
  const title = fill(words.title, {
    from: placeOf(first.from),
    to: placeOf(last.to),
    carrier: carriers.join(" + "),
    time: new Intl.DateTimeFormat(locale, { timeZone: first.from.timeZone, ...clockOptions(locale) }).format(new Date(first.departure)),
  });

  return (
    <Card
      data-slot="flight-card"
      data-selected={selected || undefined}
      role="group"
      aria-labelledby={`${id}-title`}
      className={cn("@container gap-0 overflow-hidden py-0 transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none", selected && "border-foreground shadow-sm ring-1 ring-foreground", className)}
      {...props}
    >
      <Collapsible>
        <Heading id={`${id}-title`} className="sr-only">
          {title}
        </Heading>
        <div className="grid @xl:grid-cols-[minmax(0,1fr)_13rem]">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 p-5 @md:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 flex-1 items-start gap-2 text-sm">
                <IconPlane className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="font-medium">{carriers.join(" + ")}</span>
                  {stops === 0 ? <span className="whitespace-nowrap text-muted-foreground"> {first.flightNumber}</span> : null}
                </span>
              </p>
              {badge ? (
                <Badge variant="outline" className="shrink-0">
                  {badge}
                </Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 @md:gap-x-6">
              <Place at={first.departure} airport={first.from} locale={locale} words={words} align="start" />
              <div className="grid min-w-0 gap-1.5 text-center">
                <p className="hidden text-xs whitespace-nowrap text-muted-foreground tabular-nums @md:block">{duration}</p>
                <RouteLine stops={stops} />
                <p className="hidden text-xs text-balance text-muted-foreground @md:block">{route}</p>
              </div>
              <Place at={last.arrival} airport={last.to} locale={locale} words={words} align="end" later={laterText} />
              {/* On a narrow card the middle column is only wide enough for the line, so the duration and the words move under it, together. */}
              <p className="col-span-3 -mt-1 text-center text-xs text-muted-foreground tabular-nums @md:hidden">
                {duration} · {route}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <ul role="list" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {cabin ? <li>{cabin}</li> : null}
                {baggage ? (
                  <li className="inline-flex items-center gap-1.5">
                    <IconSuitcase className="size-3.5" />
                    {baggage}
                  </li>
                ) : null}
              </ul>
              <CollapsibleTrigger className="group/trip inline-flex items-center gap-1 rounded-sm text-sm font-medium underline decoration-transparent underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none">
                {words.details}
                <IconChevronDown className="size-4 transition-transform duration-200 group-data-[state=open]/trip:rotate-180 motion-reduce:transition-none" />
              </CollapsibleTrigger>
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-border bg-muted/30 p-5 @md:p-6 @xl:grid-cols-1 @xl:content-between @xl:border-t-0 @xl:border-l">
            <div className="grid gap-1 @xl:text-right">
              <p className="text-2xl leading-none font-semibold tracking-[-0.03em] tabular-nums">{money(price, currency, locale)}</p>
              {priceNote ? <p className="text-xs text-muted-foreground">{priceNote}</p> : null}
            </div>
            <Button type="button" variant={selected ? "default" : "outline"} aria-describedby={`${id}-title`} onClick={onSelect} className="@xl:w-full">
              {selected ? <IconCheck strokeWidth={2.25} /> : null}
              {selected ? words.selected : words.select}
            </Button>
          </div>
        </div>

        <CollapsibleContent>
          <ol role="list" className="grid border-t border-border px-5 py-5 @md:px-6">
            {segments.map((segment, index) => {
              const previous = layovers[index - 1];
              return (
                <li key={`${index}-${segment.flightNumber}`}>
                  {previous ? (
                    <p className="my-4 flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground tabular-nums">
                      <IconClock className="size-3.5 shrink-0" />
                      {fill(words.layover, { layover: durationText(previous.minutes, locale), place: `${placeOf(previous.airport)} (${previous.airport.code})` })}
                    </p>
                  ) : null}
                  <div className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5">
                    <span aria-hidden="true" className="absolute top-3 bottom-3 left-[3.5px] w-px bg-border" />
                    <span aria-hidden="true" className="relative mt-1.5 size-2 rounded-full border-2 border-foreground bg-card" />
                    <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
                      <span>
                        <span className="font-medium tabular-nums">
                          <ZoneTime at={segment.departure} airport={segment.from} locale={locale} words={words} focusable={false} />
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          {placeOf(segment.from)} ({segment.from.code})
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">{dayIn(segment.departure, segment.from.timeZone, locale)}</span>
                    </p>
                    <span aria-hidden="true" />
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {segment.carrier} {segment.flightNumber}
                      {" · "}
                      {durationText((at(segment.arrival) - at(segment.departure)) / 60_000, locale)}
                      {cabin ? ` · ${cabin}` : ""}
                    </p>
                    <span aria-hidden="true" className="relative mt-1.5 size-2 rounded-full bg-foreground" />
                    <p className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
                      <span>
                        <span className="font-medium tabular-nums">
                          <ZoneTime at={segment.arrival} airport={segment.to} locale={locale} words={words} focusable={false} />
                        </span>
                        <span className="text-muted-foreground">
                          {" "}
                          {placeOf(segment.to)} ({segment.to.code})
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">{dayIn(segment.arrival, segment.to.timeZone, locale)}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
