import { useId, type ComponentProps, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Card } from "@rhs-ui/primitives/card";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { cn } from "@/lib/utils";

/** The parts of a booking a person can go back and change. `onEdit` is called with the one they chose. */
export type BookingPart = "service" | "datetime" | "staff" | "location" | "notes";

type Moment = Date | string | number;

export interface BookingService {
  name: string;
  /** What else to know about it, muted under the name: "Deep tissue, one person". */
  detail?: string;
}

export interface BookingStaff {
  name: string;
  /** Muted after the name: "Senior therapist". */
  role?: string;
}

export interface BookingLocation {
  name: string;
  /** One entry per line: the street, then the postcode and city. Set in an `<address>` element. */
  address: readonly string[];
}

export interface BookingPrice {
  /** The total in the currency's minor units: 9500 is 95.00 EUR, and 9500 is 9,500 JPY (yen has none). */
  amount: number;
  /** ISO 4217 code. It also says how many minor digits the amount has. */
  currency: string;
  /** A short note under the total: "VAT included. You pay at the studio." */
  note?: string;
}

export interface BookingSummaryLabels {
  /** The heading while the booking is still being made. */
  title?: string;
  /** The heading once it is confirmed. */
  confirmedTitle?: string;
  /** Under the heading. `{reference}` is the booking reference. */
  reference?: string;
  service?: string;
  datetime?: string;
  staff?: string;
  location?: string;
  notes?: string;
  total?: string;
  /** The visible word on every edit link. */
  edit?: string;
  /** What a screen reader and voice control call the edit link of the service row. Keep the visible word `edit` in each of these, as a person says what they see: "Edit service". */
  editService?: string;
  /** The same for the date and time row: "Edit date and time". */
  editDateTime?: string;
  /** The same for the row of who does it: "Edit staff member". */
  editStaff?: string;
  /** The same for the row of where it takes place: "Edit location". */
  editLocation?: string;
  /** The same for the notes row: "Edit notes". */
  editNotes?: string;
  /** The start and end of the visit. `{start}` and `{end}`. */
  timeRange?: string;
  /** Added after an end time that falls on the next day. */
  nextDay?: string;
}

const WORDS = {
  title: "Your booking",
  confirmedTitle: "Booking confirmed",
  reference: "Reference {reference}",
  service: "Service",
  datetime: "Date and time",
  staff: "With",
  location: "Where",
  notes: "Notes",
  total: "Total",
  edit: "Edit",
  editService: "Edit service",
  editDateTime: "Edit date and time",
  editStaff: "Edit staff member",
  editLocation: "Edit location",
  editNotes: "Edit notes",
  timeRange: "{start} to {end}",
  nextDay: "next day",
} satisfies Required<BookingSummaryLabels>;

/** The label that names the edit link of each part. The row's own term ("With", "Where") is not a name for what the link changes. */
const EDIT_NAME = { service: "editService", datetime: "editDateTime", staff: "editStaff", location: "editLocation", notes: "editNotes" } as const satisfies Record<BookingPart, keyof BookingSummaryLabels>;

export interface BookingSummaryProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** What is booked. A string is the name alone. */
  service: string | BookingService;
  /** When it starts: an ISO date-time such as "2026-11-03T10:00:00+01:00", a Date or a timestamp. Written out in `timeZone`. */
  start: Moment;
  /** How long it lasts, in minutes. It is written in words and gives the end time. */
  duration: number;
  /** Who does it. */
  staff?: string | BookingStaff;
  /** Where it takes place. */
  location?: BookingLocation;
  /** What it costs, set apart at the bottom. */
  price: BookingPrice;
  /** What the customer asked for: "Please use the side entrance." */
  notes?: string;
  /** The cancellation policy, as one plain line under the total. */
  policy?: ReactNode;
  /** The booking reference, once there is one: "HX-20418". */
  reference?: string;
  /** The booking is final: a check mark joins the heading, which says "Booking confirmed". */
  confirmed?: boolean;
  /** Your own heading, instead of "Your booking" or "Booking confirmed". */
  title?: string;
  /** Called with the part to change when its edit link is pressed. Without it, and without `editHrefs`, the summary has no edit links. Pass it from a client component. */
  onEdit?: (part: BookingPart) => void;
  /** Where each edit link goes, for a flow whose steps are pages. A part with an address is a real link that needs no JavaScript. */
  editHrefs?: Partial<Record<BookingPart, string>>;
  /** Always pass your application locale, so the server and the browser write the same date. */
  locale?: string;
  /** The time zone of the place of the booking. Always pass it, so the server and the browser agree. */
  timeZone?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: BookingSummaryLabels;
}

/** Each term sits over its value until the card is wide enough to put them side by side. The list's own breakpoint follows the screen; this one follows the card. */
const FACTS = "[&>div]:grid-cols-1 [&>div]:gap-1 @sm:[&>div]:grid-cols-[minmax(6rem,0.8fr)_2fr] @sm:[&>div]:gap-4";

const asDate = (value: Moment): Date => (value instanceof Date ? value : new Date(value));

/** The hour written the way the locale counts it: "08:25" where the day has 24 hours, "8:25 AM" where it has 12. */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  const cycle = new Intl.DateTimeFormat(locale, { timeZone: "UTC", hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** Money in minor units, written for the locale. The currency says how many minor digits it has: 2 for euros, 0 for yen, 3 for Kuwaiti dinars. */
function writeMoney(minor: number, currency: string, locale: string): string {
  const format = new Intl.NumberFormat(locale, { style: "currency", currency });
  const digits = format.resolvedOptions().maximumFractionDigits ?? 2;
  return format.format(minor / 10 ** digits);
}

/** The calendar day a moment falls on in a zone, as "2026-11-03". "en-CA" writes it that way in every browser. */
function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** "1 hour 30 minutes", "45 minutes". */
function durationWords(minutes: number, locale: string): string {
  const total = Math.max(0, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  const unit = (value: number, name: "hour" | "minute") => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: "long" }).format(value);
  return [hours ? unit(hours, "hour") : "", rest || !hours ? unit(rest, "minute") : ""].filter(Boolean).join(" ");
}

function When({ start, duration, locale, timeZone, words }: { start: Moment; duration: number; locale: string; timeZone: string; words: Required<BookingSummaryLabels> }) {
  const first = asDate(start);
  if (Number.isNaN(first.getTime())) return <>{String(start)}</>;
  const end = new Date(first.getTime() + duration * 60_000);
  const day = new Intl.DateTimeFormat(locale, { timeZone, weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(first);
  const clock = new Intl.DateTimeFormat(locale, { timeZone, ...clockOptions(locale) });
  const range = fill(words.timeRange, { start: clock.format(first), end: clock.format(end) });
  const overnight = dayKey(first, timeZone) !== dayKey(end, timeZone);
  return (
    <>
      <time dateTime={first.toISOString()}>{day}</time>
      <span className="mt-0.5 block font-normal text-muted-foreground tabular-nums">
        {range}
        {overnight ? ` (${words.nextDay})` : ""}
        {" · "}
        {durationWords(duration, locale)}
      </span>
    </>
  );
}

function EditLink({ part, label, href, onEdit, word }: { part: BookingPart; label: string; href?: string; onEdit?: (part: BookingPart) => void; word: string }) {
  if (!href && !onEdit) return null;
  const style =
    "-my-0.5 shrink-0 rounded-sm px-0.5 py-0.5 text-sm font-medium text-foreground underline decoration-border underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";
  if (href) {
    return (
      <a href={href} aria-label={label} className={style}>
        {word}
      </a>
    );
  }
  return (
    <button type="button" aria-label={label} onClick={() => onEdit?.(part)} className={style}>
      {word}
    </button>
  );
}

/**
 * What you are about to book, at the end of a booking flow and again on the confirmation page: the service, the day
 * in words with the start and end and how long it lasts, who does it, where (in an `<address>`), anything the
 * customer asked for, and the total set apart at the bottom with the cancellation policy as one plain line under it.
 * Every row has its own edit link whose name says which row it changes ("Edit date and time"), as a button for
 * `onEdit` or a real link for `editHrefs`; leave both out and the summary is read-only, as on a confirmation page.
 * It keeps no state and renders on the server.
 */
export function BookingSummary({
  service,
  start,
  duration,
  staff,
  location,
  price,
  notes,
  policy,
  reference,
  confirmed = false,
  title,
  onEdit,
  editHrefs,
  locale = "en-US",
  timeZone = "UTC",
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: BookingSummaryProps) {
  const words: Required<BookingSummaryLabels> = { ...WORDS, ...labels };
  const id = useId();
  const named: BookingService = typeof service === "string" ? { name: service } : service;
  const person: BookingStaff | undefined = typeof staff === "string" ? { name: staff } : staff;

  const row = (part: BookingPart, term: string, content: ReactNode): DescriptionItem => ({
    term,
    value: (
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">{content}</div>
        <EditLink part={part} label={words[EDIT_NAME[part]]} href={editHrefs?.[part]} onEdit={onEdit} word={words.edit} />
      </div>
    ),
  });

  const muted = "block font-normal text-muted-foreground";
  const items: DescriptionItem[] = [
    row(
      "service",
      words.service,
      <>
        <span className="block">{named.name}</span>
        {named.detail ? <span className={cn(muted, "mt-0.5")}>{named.detail}</span> : null}
      </>,
    ),
    row("datetime", words.datetime, <When start={start} duration={duration} locale={locale} timeZone={timeZone} words={words} />),
    ...(person
      ? [
          row(
            "staff",
            words.staff,
            <>
              <span className="block">{person.name}</span>
              {person.role ? <span className={cn(muted, "mt-0.5")}>{person.role}</span> : null}
            </>,
          ),
        ]
      : []),
    ...(location
      ? [
          row(
            "location",
            words.location,
            <address className="not-italic">
              <span className="block">{location.name}</span>
              {location.address.map((line, index) => (
                <span key={`${index}-${line}`} className={cn(muted, "mt-0.5")}>
                  {line}
                </span>
              ))}
            </address>,
          ),
        ]
      : []),
    ...(notes ? [row("notes", words.notes, <span className="block font-normal text-pretty">{notes}</span>)] : []),
  ];

  return (
    <Card data-slot="booking-summary" data-confirmed={confirmed || undefined} role="group" aria-labelledby={`${id}-title`} className={cn("@container gap-0 overflow-hidden py-0", className)} {...props}>
      <div className="flex items-center gap-3.5 border-b border-border px-5 py-5 @sm:px-6">
        {confirmed ? (
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background">
            <IconCheck className="size-[1.125rem]" strokeWidth={2.25} />
          </span>
        ) : null}
        <div className="min-w-0">
          <Heading id={`${id}-title`} className="text-lg leading-snug font-semibold tracking-[-0.02em] text-balance">
            {title ?? (confirmed ? words.confirmedTitle : words.title)}
          </Heading>
          {reference ? <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">{fill(words.reference, { reference })}</p> : null}
        </div>
      </div>

      <div className="px-5 py-5 @sm:px-6">
        <DescriptionList items={items} className={FACTS} />
      </div>

      <div className="border-t border-border bg-muted/40 px-5 py-5 @sm:px-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm font-medium">{words.total}</p>
          <p className="text-2xl leading-none font-semibold tracking-[-0.03em] tabular-nums">{writeMoney(price.amount, price.currency, locale)}</p>
        </div>
        {price.note ? <p className="mt-1.5 text-right text-xs text-muted-foreground">{price.note}</p> : null}
        {policy ? <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-pretty text-muted-foreground">{policy}</p> : null}
      </div>
    </Card>
  );
}
