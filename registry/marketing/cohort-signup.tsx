"use client";

import { useCallback, useId, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconClock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

export interface Cohort {
  /** What the cohort is called, which is the heading: "Product design, winter cohort". */
  name: string;
  /** When the first session starts, as an ISO 8601 time with its offset or a Z: "2027-01-12T17:00:00Z". It is written as a day in the section's time zone. */
  startsAt: string;
  /** How many weeks it runs: 8. */
  weeks: number;
  /** When the live sessions are, in words with their time zone: "Live on Tuesdays at 18:00 CET". */
  schedule: string;
  /** What it costs, in whole units of the section's currency: 1490. */
  price: number;
  /** What the price is for, said beside it: "per participant, VAT included". Leave it out and the price stands alone. */
  priceNote?: string;
  /** How many seats there are: 30. */
  seatsTotal: number;
  /** How many of them are taken: 16. */
  seatsTaken: number;
  /** The last moment to apply, as an ISO 8601 time with its offset or a Z: "2027-01-05T22:59:00Z". */
  deadline: string;
}

/** What the button does: reserve a seat while there are some, join the waiting list once there are none. */
export type CohortIntent = "reserve" | "waitlist";

export interface CohortAction {
  /** Where the button goes: a checkout or a form. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed, with what it was for. A function needs a client component around the block. */
  onClick?: (intent: CohortIntent) => void;
}

export interface CohortSignupLabels {
  /** The small line above the name. */
  eyebrow: string;
  /** The term for the start date. */
  starts: string;
  /** The term for the length. */
  length: string;
  /** The term for when the live sessions are. */
  schedule: string;
  /** The term for the price. */
  price: string;
  /** The length of one week. */
  weekOne: string;
  /** The length of several weeks. {count} stands for the number. */
  weekOther: string;
  /** The name of the seats meter. */
  seats: string;
  /** The seats that are left. {left} and {total} stand for the numbers. */
  seatsLeft: string;
  /** The seats that are left, once there are only a few. */
  seatsLow: string;
  /** Said once every seat is taken. {total} stands for the number. */
  seatsFull: string;
  /** The deadline. {date} stands for the day and time. */
  apply: string;
  /** The deadline once it has passed. {date} stands for the day and time. */
  closedOn: string;
  /** The badge by the name once every seat is taken. */
  full: string;
  /** The badge by the name once applications are closed. */
  closed: string;
  /** The button while there are seats. */
  reserve: string;
  /** The button once every seat is taken. */
  waitlist: string;
  /** The button once applications are closed. */
  closedAction: string;
  /** Said under the button on the waiting list. */
  waitlistNote: string;
  /** The link to the syllabus. */
  syllabus: string;
}

const LABELS: CohortSignupLabels = {
  eyebrow: "Next cohort",
  starts: "Starts",
  length: "Length",
  schedule: "Schedule",
  price: "Price",
  weekOne: "{count} week",
  weekOther: "{count} weeks",
  seats: "Seats",
  seatsLeft: "{left} of {total} left",
  seatsLow: "Only {left} of {total} left",
  seatsFull: "All {total} seats are taken",
  apply: "Apply by {date}",
  closedOn: "Applications closed on {date}",
  full: "Full",
  closed: "Closed",
  reserve: "Reserve my seat",
  waitlist: "Join the waiting list",
  closedAction: "Applications closed",
  waitlistNote: "We will email you the moment a seat opens.",
  syllabus: "Read the syllabus",
};

export interface CohortSignupProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The intake: its name, dates, price and seats. */
  cohort: Cohort;
  /** The button. It reserves a seat while there are some and joins the waiting list when there are none. */
  action: CohortAction;
  /** One or two sentences on what the cohort is for, under the name. */
  description?: string;
  /** The syllabus. A quiet link appears under the button when this is set. */
  syllabusHref?: string;
  /** The ISO 4217 currency of the price. "USD" by default. */
  currency?: string;
  /** The language dates and numbers are written in. "en-US" by default. */
  locale?: string;
  /** The time zone the dates are written in, and the one the deadline names. "UTC" by default. */
  timeZone?: string;
  /**
   * The moment the deadline is judged against. Leave it out and the block follows the reader's own clock, which is known
   * only in the browser: the server never claims that applications have closed, so a page built ahead of time cannot
   * keep a live button next to a deadline that has passed. Pass it, the same on the server and in the browser, to pin
   * the moment for a test or a screenshot.
   */
  now?: Date | string | number;
  /** At or below this many seats left, the count is set in the heavy style and says "Only". 5 by default. */
  lowSeats?: number;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CohortSignupLabels>;
}

const text = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/** The hour as the locale writes it: two digits on a 24-hour clock ("08:00"), one on a 12-hour clock ("8:00 AM"). */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

/** The most a timer can wait: a longer one fires at once. A deadline further away than this is not waited for. */
const LONGEST_WAIT = 2_147_000_000;

/**
 * Whether the deadline has passed. A moment you pass is judged as it is, on the server and in the browser alike.
 * Without one the answer is the reader's clock: the server snapshot is false, so a page built ahead of time never
 * claims applications are closed, and the browser corrects it once it has mounted and again at the moment the
 * deadline passes while the page is open.
 */
function useDeadlinePassed(deadline: string, fixed: CohortSignupProps["now"]): boolean {
  const at = Date.parse(deadline);
  const pinned = fixed !== undefined;
  const subscribe = useCallback(
    (notify: () => void) => {
      const wait = at - Date.now();
      if (pinned || !(wait > 0) || wait > LONGEST_WAIT) return () => undefined;
      const timer = window.setTimeout(notify, wait + 50);
      return () => window.clearTimeout(timer);
    },
    [at, pinned],
  );
  const live = useSyncExternalStore(
    subscribe,
    () => at < Date.now(),
    () => false,
  );
  return pinned ? at < new Date(fixed).getTime() : live;
}

/**
 * The next intake of a course, bootcamp, workshop or accelerator, as a card that answers the questions before they
 * are asked: when it starts, how long it runs, when the live sessions are and how many seats are left, with a meter,
 * the application deadline as a time element, the price as the biggest number and one button. Every date is written
 * in the time zone you pass, and the deadline names it. When the seats run out the card says Full in words, the
 * button becomes Join the waiting list and the meter stays full. Once the deadline has passed on the reader's clock
 * (or on the moment you pass as now) the button closes; the server never claims that, so a page built ahead of time
 * cannot go stale. On a wide section the facts sit beside the enrolment panel; on a narrow one they stack. The only
 * client JavaScript is that clock; a function passed to it must come from a client component.
 */
export function CohortSignup({
  cohort,
  action,
  description,
  syllabusHref,
  currency = "USD",
  locale = "en-US",
  timeZone = "UTC",
  now,
  lowSeats = 5,
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: CohortSignupProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const total = Math.max(0, cohort.seatsTotal);
  const taken = Math.min(total, Math.max(0, cohort.seatsTaken));
  const left = total - taken;
  const full = left === 0;
  const low = !full && left <= lowSeats;
  const closed = useDeadlinePassed(cohort.deadline, now);

  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", timeZone });
  // A moment carries its time zone in words, so a reader in another one knows which is meant.
  const moment = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", ...clockOptions(locale), timeZoneName: "short", timeZone });
  const clock = new Intl.DateTimeFormat(locale, { ...clockOptions(locale), timeZoneName: "short", timeZone });
  const money = new Intl.NumberFormat(locale, { style: "currency", currency, ...(Number.isInteger(cohort.price) ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}) });
  const count = new Intl.NumberFormat(locale);
  const one = new Intl.PluralRules(locale).select(cohort.weeks) === "one";

  const seatsText = full ? text(labels.seatsFull, { total: count.format(total) }) : text(low ? labels.seatsLow : labels.seatsLeft, { left: count.format(left), total: count.format(total) });
  const deadline = <time dateTime={cohort.deadline}>{moment.format(new Date(cohort.deadline))}</time>;
  const intent: CohortIntent = full ? "waitlist" : "reserve";
  const label = closed ? labels.closedAction : full ? labels.waitlist : labels.reserve;

  const facts = [
    {
      term: labels.starts,
      value: (
        <time dateTime={cohort.startsAt}>
          {day.format(new Date(cohort.startsAt))}
          <span className="mt-0.5 block text-[0.8125rem] leading-snug font-normal text-muted-foreground tabular-nums">{clock.format(new Date(cohort.startsAt))}</span>
        </time>
      ),
    },
    { term: labels.length, value: text(one ? labels.weekOne : labels.weekOther, { count: count.format(cohort.weeks) }) },
    { term: labels.schedule, value: cohort.schedule },
  ];

  return (
    <section
      data-slot="cohort-signup"
      data-state={closed ? "closed" : full ? "full" : "open"}
      aria-labelledby={`${id}-title`}
      className={cn("@container mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card break-words shadow-xs", className)}
      {...props}
    >
      <div className="grid @3xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="p-6 @2xl:p-8">
          <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">{labels.eyebrow}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <Heading id={`${id}-title`} className="text-2xl leading-[1.15] font-medium tracking-[-0.035em] text-balance @2xl:text-3xl">
              {cohort.name}
            </Heading>
            {closed || full ? <Badge variant="outline">{closed ? labels.closed : labels.full}</Badge> : null}
          </div>
          {description ? <p className="mt-3 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          {/* Three facts in two columns: the last one, the schedule, is the longest and takes the whole row. */}
          <DescriptionList
            layout="grid"
            items={facts}
            className="mt-8 border-t border-border pt-7 sm:grid-cols-2 [&>div]:content-start [&>div:last-child:nth-child(odd)]:col-span-2 [&_dd]:text-[1.0625rem] [&_dd]:leading-snug [&_dd]:text-pretty [&_dt]:text-[0.8125rem]"
          />
        </div>

        <div className="flex flex-col gap-6 border-t border-border bg-muted/30 p-6 @2xl:p-8 @3xl:border-t-0 @3xl:border-l">
          {/* The price is the number that decides the purchase, so it is the biggest thing in the panel. */}
          <div>
            <p className="text-sm font-medium">{labels.price}</p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-4xl leading-none font-medium tracking-[-0.04em] tabular-nums">{money.format(cohort.price)}</span>
              {cohort.priceNote ? <span className="text-sm text-muted-foreground">{cohort.priceNote}</span> : null}
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p id={`${id}-seats`} className="text-sm font-medium">
                {labels.seats}
              </p>
              <p className={cn("text-sm tabular-nums", low || full ? "font-semibold text-foreground" : "text-muted-foreground")}>{seatsText}</p>
            </div>
            <Progress value={taken} max={total || 1} aria-labelledby={`${id}-seats`} aria-valuetext={seatsText} className="mt-3 h-1.5" />
          </div>

          <p className="flex items-start gap-2.5 text-sm leading-snug text-muted-foreground">
            <IconClock aria-hidden="true" className="mt-px size-4 shrink-0" />
            <span>{fill(closed ? labels.closedOn : labels.apply, { date: deadline })}</span>
          </p>

          <div className="mt-auto grid gap-3">
            {closed ? (
              <Button type="button" size="lg" disabled className="w-full">
                {label}
              </Button>
            ) : action.href ? (
              <Button asChild size="lg" className="w-full">
                <a href={action.href} onClick={action.onClick ? () => action.onClick?.(intent) : undefined}>
                  {label}
                </a>
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={() => action.onClick?.(intent)} className="w-full">
                {label}
              </Button>
            )}
            {full && !closed ? <p className="text-center text-sm leading-snug text-muted-foreground">{labels.waitlistNote}</p> : null}
            {syllabusHref ? (
              <a
                href={syllabusHref}
                className="group mx-auto inline-flex min-h-9 items-center gap-1.5 rounded-sm text-sm font-medium underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
              >
                {labels.syllabus}
                <IconArrowRight aria-hidden="true" size={15} className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
