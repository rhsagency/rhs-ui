"use client";

import { useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconSearch } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";
import { daysBetween, parseDay, startOfDay } from "@rhs-ui/marketing/booking-bar/dates";
import { LocationField } from "@rhs-ui/marketing/booking-bar/location-field";
import { RangeCalendar } from "@rhs-ui/marketing/booking-bar/range-calendar";
import type { BookingBarLabels, BookingBarValue, BookingLocation, BookingSearch, DraftRange } from "@rhs-ui/marketing/booking-bar/types";

export type { BookingBarLabels, BookingBarValue, BookingLocation, BookingRange, BookingSearch } from "@rhs-ui/marketing/booking-bar/types";

export interface BookingBarProps extends Omit<ComponentProps<"form">, "onSubmit" | "children" | "defaultValue"> {
  /** Called with the stay and the guests when the reader searches and everything is in order. The bar does no search of its own. */
  onSearch: (search: BookingSearch) => void;
  /** Where the reader can go. The location field comes first when this is set, and is left out when it is not. */
  locations?: readonly BookingLocation[];
  /** The fewest nights a stay can be. 1 by default. A shorter stay is refused in words. */
  minNights?: number;
  /** The most guests, adults and children together. 8 by default. */
  maxGuests?: number;
  /** What the bar starts with. Two adults and no dates by default. */
  defaultValue?: BookingBarValue;
  /** The first day that can be booked, as an ISO date or a Date. Today by default. */
  minDate?: Date | string;
  /** 1 is Monday (the default), 0 is Sunday. */
  weekStartsOn?: 0 | 1;
  /** The language dates and numbers are written in. "en-US" by default. */
  locale?: string;
  /** Which panel starts open. None by default: an open panel takes focus when the page loads, so this is for documentation and screenshots. */
  defaultOpen?: "dates" | "guests";
  /** Words for the fixed text, errors included, for a site that is not in English. */
  labels?: Partial<BookingBarLabels>;
}

const LABELS: BookingBarLabels = {
  search: "Search availability",
  where: "Where to",
  wherePlaceholder: "Choose a destination",
  whereSearch: "Search destinations",
  whereEmpty: "No destination matches that.",
  suggestions: "Destinations",
  selected: "selected",
  dates: "Dates",
  addDates: "Add dates",
  to: "to",
  addCheckOut: "Add check-out",
  checkIn: "Check-in",
  checkOut: "Check-out",
  guests: "Guests",
  adults: "Adults",
  adultsHint: "Ages 13 or above",
  children: "Children",
  childrenHint: "Ages 0 to 12",
  maxGuests: "Up to {max} guests in total.",
  maxReached: "That is the most: {max} guests in total.",
  adultOne: "{count} adult",
  adultOther: "{count} adults",
  childOne: "{count} child",
  childOther: "{count} children",
  nightOne: "{count} night",
  nightOther: "{count} nights",
  submit: "Check availability",
  pickIn: "Choose your check-in date.",
  pickOut: "Now choose your check-out date.",
  minStay: "Minimum stay is {count} nights.",
  chooseDates: "Choose your check-in and check-out dates.",
  stay: "{nights}: {from} to {to}",
  clear: "Clear dates",
  previousMonth: "Previous month",
  nextMonth: "Next month",
};

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** One part of the bar: a small label over the control, and a soft surface that answers hover, an open panel and the keyboard. */
function Segment({ label, labelId, invalid, className, children }: { label: string; labelId: string; invalid?: boolean; className?: string; children: ReactNode }) {
  return (
    <div className={cn("p-1.5", className)}>
      <div
        role="group"
        aria-labelledby={labelId}
        data-invalid={invalid || undefined}
        className="relative rounded-xl transition-colors duration-150 hover:bg-muted/60 has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40 has-[[data-state=open]]:bg-muted/60 data-[invalid]:ring-1 data-[invalid]:ring-destructive/70 motion-reduce:transition-none"
      >
        <span id={labelId} className="block px-3.5 pt-2.5 text-xs leading-snug font-medium text-muted-foreground">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

const TRIGGER = "block w-full min-w-0 rounded-xl px-3.5 pt-0.5 pb-2.5 text-left outline-none";

/**
 * A search bar for anything sold by the night or the day: hotels, holiday homes, venues, car hire. One raised bar
 * with an optional location first, the dates in one picker (check-in and check-out in a two-month calendar with the
 * stay as a band), the guests as two counters in a panel and one button. Once a stay exists the number of nights is
 * said in words, a stay shorter than the minimum is refused in words, in the calendar and under the bar, and a
 * search without dates says so and puts focus on the dates. Every control has a label and works by keyboard. From
 * 768px the parts sit in one row; below it they stack as a form, and the calendar shows one month at a time.
 */
export function BookingBar({ onSearch, locations, minNights = 1, maxGuests = 8, defaultValue, minDate, weekStartsOn = 1, locale = "en-US", defaultOpen, labels: custom, className, ...props }: BookingBarProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const adultsId = useId();
  const childrenId = useId();
  const problemId = useId();
  const datesRef = useRef<HTMLButtonElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  const limit = Math.max(1, maxGuests);
  const [draft, setDraft] = useState<DraftRange>(() => ({ from: defaultValue?.range ? parseDay(defaultValue.range.from) : null, to: defaultValue?.range ? parseDay(defaultValue.range.to) : null }));
  const startAdults = Math.min(Math.max(1, defaultValue?.adults ?? 2), limit);
  const [adults, setAdults] = useState(startAdults);
  const [kids, setKids] = useState(Math.min(Math.max(0, defaultValue?.children ?? 0), limit - startAdults));
  const [location, setLocation] = useState<string | null>(defaultValue?.location ?? null);
  const [datesOpen, setDatesOpen] = useState(defaultOpen === "dates");
  const [problem, setProblem] = useState<string | null>(null);

  const { from, to } = draft;
  const plural = new Intl.PluralRules(locale);
  const words = (count: number, one: string, other: string) => text(plural.select(count) === "one" ? one : other, { count });
  const nights = from && to ? daysBetween(from, to) : 0;
  // The year is written only when the stay crosses into another one, so an ordinary stay stays short.
  const crosses = from !== null && to !== null && from.getFullYear() !== to.getFullYear();
  const day = new Intl.DateTimeFormat(locale, crosses ? { day: "numeric", month: "short", year: "numeric" } : { day: "numeric", month: "short" });
  const guestText = new Intl.ListFormat(locale, { style: "long", type: "unit" }).format([words(adults, labels.adultOne, labels.adultOther), ...(kids > 0 ? [words(kids, labels.childOne, labels.childOther)] : [])]);
  const reached = adults + kids >= limit;

  function change(next: DraftRange) {
    setDraft(next);
    setProblem(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!from || !to) {
      setProblem(labels.chooseDates);
      datesRef.current?.focus();
      return;
    }
    if (nights < minNights) {
      setProblem(text(labels.minStay, { count: minNights }));
      datesRef.current?.focus();
      return;
    }
    setProblem(null);
    onSearch({ range: { from, to }, nights, adults, children: kids, location: locations ? location : null });
  }

  return (
    <form data-slot="booking-bar" role="search" aria-label={labels.search} noValidate onSubmit={submit} className={cn("@container w-full", className)} {...props}>
      <div
        className={cn(
          "grid divide-y divide-border rounded-2xl border border-border bg-card shadow-sm @3xl:divide-x @3xl:divide-y-0",
          locations ? "@3xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.45fr)_minmax(0,1fr)_auto]" : "@3xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_auto]",
        )}
      >
        {locations ? (
          <Segment label={labels.where} labelId={`${id}-where`}>
            <LocationField locations={locations} value={location} onValueChange={setLocation} labels={labels} />
          </Segment>
        ) : null}

        <Segment label={labels.dates} labelId={`${id}-dates`} invalid={problem !== null}>
          <Popover open={datesOpen} onOpenChange={setDatesOpen}>
            <PopoverTrigger ref={datesRef} aria-describedby={problem ? problemId : undefined} className={TRIGGER}>
              <span className="block truncate text-sm leading-snug font-medium">
                {from ? (
                  <>
                    {day.format(from)}
                    {to ? (
                      <>
                        <span className="font-normal text-muted-foreground"> {labels.to} </span>
                        {day.format(to)}
                        <span className="font-normal text-muted-foreground"> · {words(nights, labels.nightOne, labels.nightOther)}</span>
                      </>
                    ) : (
                      <span className="font-normal text-muted-foreground"> · {labels.addCheckOut}</span>
                    )}
                  </>
                ) : (
                  <span className="font-normal text-muted-foreground">{labels.addDates}</span>
                )}
              </span>
            </PopoverTrigger>
            <PopoverContent align="start" collisionPadding={8} aria-label={labels.dates} onOpenAutoFocus={(event) => event.preventDefault()} className="w-auto max-w-[calc(100vw-1rem)] p-0">
              <RangeCalendar
                autoFocus
                value={draft}
                onValueChange={change}
                onComplete={() => setDatesOpen(false)}
                minDate={minDate !== undefined ? parseDay(minDate) : startOfDay(new Date())}
                minNights={minNights}
                locale={locale}
                weekStartsOn={weekStartsOn}
                labels={labels}
              />
            </PopoverContent>
          </Popover>
        </Segment>

        <Segment label={labels.guests} labelId={`${id}-guests`} className="@3xl:border-e-0">
          <Popover defaultOpen={defaultOpen === "guests"}>
            <PopoverTrigger className={TRIGGER}>
              <span className="block truncate text-sm leading-snug font-medium">{guestText}</span>
            </PopoverTrigger>
            {/* Focus goes to the panel, not into a counter: opening it does not select a number the reader did not choose. */}
            <PopoverContent
              ref={guestsRef}
              tabIndex={-1}
              align="start"
              collisionPadding={8}
              aria-label={labels.guests}
              onOpenAutoFocus={(event) => {
                event.preventDefault();
                guestsRef.current?.focus({ preventScroll: true });
              }}
              className="w-[min(21rem,calc(100vw-1rem))] p-5"
            >
              <div className="grid gap-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Label htmlFor={adultsId}>{labels.adults}</Label>
                    <p className="mt-1.5 text-xs text-muted-foreground">{labels.adultsHint}</p>
                  </div>
                  <NumberInput id={adultsId} value={adults} onValueChange={setAdults} min={1} max={limit - kids} locale={locale} className="w-32 shrink-0" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <Label htmlFor={childrenId}>{labels.children}</Label>
                    <p className="mt-1.5 text-xs text-muted-foreground">{labels.childrenHint}</p>
                  </div>
                  <NumberInput id={childrenId} value={kids} onValueChange={setKids} min={0} max={limit - adults} locale={locale} className="w-32 shrink-0" />
                </div>
                <p aria-live="polite" className={cn("border-t border-border pt-4 text-xs leading-snug", reached ? "font-medium text-foreground" : "text-muted-foreground")}>
                  {text(reached ? labels.maxReached : labels.maxGuests, { max: limit })}
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </Segment>

        <div className="p-3 @3xl:flex @3xl:items-center @3xl:p-2.5">
          <Button type="submit" size="lg" className="h-12 w-full px-6 text-[0.9375rem] @3xl:w-auto">
            <IconSearch />
            {labels.submit}
          </Button>
        </div>
      </div>

      {problem ? (
        <p id={problemId} role="alert" className="mt-3 flex items-start gap-2 px-1 text-sm leading-snug font-medium text-destructive">
          <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {problem}
        </p>
      ) : null}
    </form>
  );
}
