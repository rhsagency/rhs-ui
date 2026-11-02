"use client";

import { useId, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconCheck, IconClock, IconTag } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

export interface LimitedOfferAction {
  /** The button's text: "Claim a founding place". */
  label: string;
  /** Where the button goes. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
}

export interface LimitedOfferWaitlist {
  /** The button's text once nothing is left. "Join the waiting list" by default. */
  label?: string;
  /** Where the waiting list is. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
}

export interface LimitedOfferPanelLabels {
  /** The small tag over the title while the offer runs. */
  eyebrow: string;
  /** The small tag once the offer is over, whether it ended or sold out. */
  closedBadge: string;
  /** When the offer ends. {date} stands for the day. */
  ends: string;
  /** When the offer ended. {date} stands for the day. */
  endedOn: string;
  /** The name of the meter for assistive technology. */
  meter: string;
  /** What the meter says. {claimed} and {total} stand for the numbers. */
  claimed: string;
  /** What the meter says when nothing is left. {total} stands for the number. */
  allClaimed: string;
  /** How many places are left. {left} stands for the number. It is only said while the offer runs: a closed offer has none to sell. */
  left: string;
  /** Said to a screen reader after the price once nothing is left, because the price is no longer on offer. */
  unavailable: string;
  /** The waiting-list button, when the waitlist does not set its own label. */
  waitlist: string;
  /** What the panel says in place of the button once it is closed and there is no waiting list. */
  closedNote: string;
}

const LABELS: LimitedOfferPanelLabels = {
  eyebrow: "Limited offer",
  closedBadge: "Closed",
  ends: "Ends {date}",
  endedOn: "Ended {date}",
  meter: "Places claimed",
  claimed: "{claimed} of {total} claimed",
  allClaimed: "All {total} claimed",
  left: "{left} left",
  unavailable: "No longer available",
  waitlist: "Join the waiting list",
  closedNote: "This offer has closed.",
};

export interface LimitedOfferPanelProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The offer's name: "Founding member". */
  title: string;
  /** One or two lines on who the offer is for. */
  description?: string;
  /** The price as you want it written, with its currency: "€149". */
  price: string;
  /** What goes with the price, smaller: "once, yours for life". */
  priceNote?: string;
  /** How many places are taken. It is a real count: the meter and the sold-out state are worked out from it. */
  claimed: number;
  /** How many places there are in all. */
  total: number;
  /** What the buyer gets, as short lines. Three or four read best. */
  perks: readonly string[];
  /** The rule for when the price changes, said plainly: "The price goes to €249 when all 100 are gone." Write it in the tense that is true now. */
  condition: string;
  /** The button while places are left. */
  action: LimitedOfferAction;
  /**
   * What the button does once nothing is left or the offer has ended: it becomes a waiting-list button that goes
   * here. Without it the panel never sends anyone to the action of a closed offer: the button is replaced by a line
   * saying the offer has closed.
   */
  waitlist?: LimitedOfferWaitlist;
  /**
   * The last moment the offer works: an ISO 8601 time with its offset or a Z ("2026-10-31T22:59:00Z"), or a plain
   * day ("2026-10-31"), which ends with that day on the clocks of `timeZone`.
   */
  endsAt?: string;
  /**
   * The moment the end is judged against. Leave it out on a page that is built once, and the panel corrects itself
   * in the browser. Pass it, the same on the server and in the browser, when you render per request.
   */
  now?: Date | string | number;
  /** The language the numbers and the date are written in. "en-US" by default. */
  locale?: string;
  /** The time zone the end is written in. "UTC" by default. */
  timeZone?: string;
  /** The level of the title: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<LimitedOfferPanelLabels>;
}

const text = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** Fills {name} markers in a sentence with nodes, keeping the rest as text. */
function fill(template: string, values: Record<string, ReactNode>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    return key !== undefined && key in values ? <span key={index}>{values[key]}</span> : part;
  });
}

/** How far a zone is ahead of UTC at a moment, in milliseconds. */
function zoneOffset(moment: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" }).formatToParts(new Date(moment));
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(read("year"), read("month") - 1, read("day"), read("hour"), read("minute"), read("second")) - Math.floor(moment / 1000) * 1000;
}

/** The moment the offer ends. A plain day ends with its last second on the clocks of the zone. */
function endMoment(endsAt: string, timeZone: string): number {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endsAt);
  if (!day) return Date.parse(endsAt);
  const wall = Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]), 23, 59, 59);
  try {
    // The offset can differ between the guess and the answer on the night the clocks change, so it is read twice.
    return wall - zoneOffset(wall - zoneOffset(wall, timeZone), timeZone);
  } catch {
    return wall;
  }
}

/** There is nothing to subscribe to: no timer runs, so the page is judged once, when it is read. */
const noSubscription = (): (() => void) => () => undefined;

/**
 * A launch or founding-member offer with an honest count: the offer's name, the price in large type, a meter of how
 * many places are claimed with its numbers written out, what you get, the rule for when the price changes and one
 * button. The count is yours and the state follows it: while places are left the button takes the buyer in, and
 * when claimed reaches the total the meter reads All claimed and the panel closes: the price is struck and marked as
 * no longer available, and the button turns into the waiting list, so the panel can never sell what is gone. The
 * meter is a progress bar with a name and a value in words, and every figure is tabular. An optional end date is
 * written in a time element in an explicit time zone; once it has passed the panel closes the same way. For
 * lifetime deals, early-bird pricing, pre-orders and crowdfunding with finite stock.
 */
export function LimitedOfferPanel({
  title,
  description,
  price,
  priceNote,
  claimed,
  total,
  perks,
  condition,
  action,
  waitlist,
  endsAt,
  now,
  locale = "en-US",
  timeZone = "UTC",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: LimitedOfferPanelProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const cap = Math.max(0, Math.floor(total));
  const taken = Math.min(Math.max(0, Math.floor(claimed)), cap);
  const left = cap - taken;
  const soldOut = cap > 0 && left === 0;
  // The last tenth of the places is said with weight, so the scarcity is read and not only seen.
  const low = !soldOut && left <= Math.max(1, Math.ceil(cap / 10));

  const end = endsAt ? endMoment(endsAt, timeZone) : Number.NaN;
  // The server renders the offer as running; the browser then reads its own clock once and, if the end has passed, closes it.
  const lateInBrowser = useSyncExternalStore(
    noSubscription,
    () => Date.now() > end,
    () => false,
  );
  const ended = endsAt ? (now !== undefined ? new Date(now).getTime() > end : lateInBrowser) : false;
  const closed = soldOut || ended;

  const number = new Intl.NumberFormat(locale);
  const figures = { claimed: number.format(taken), total: number.format(cap), left: number.format(left) };
  const meterText = soldOut ? text(labels.allClaimed, figures) : text(labels.claimed, figures);

  let when: ReactNode = null;
  if (endsAt && !Number.isNaN(end)) {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(endsAt);
    const written = new Intl.DateTimeFormat(locale, day ? { day: "numeric", month: "short", year: "numeric", timeZone } : { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short", timeZone }).format(new Date(end));
    when = <time dateTime={day ? endsAt : new Date(end).toISOString()}>{written}</time>;
  }

  // A closed offer never sends anyone to the action: the button goes to the waiting list, or there is no button.
  const target = closed ? (waitlist ? { label: waitlist.label ?? labels.waitlist, href: waitlist.href, onClick: waitlist.onClick } : null) : action;
  const arrow = <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />;

  return (
    <section data-slot="limited-offer-panel" data-state={ended ? "ended" : soldOut ? "sold-out" : "live"} aria-labelledby={`${id}-title`} className={cn("flex w-full max-w-md flex-col rounded-2xl border border-border bg-card p-6 break-words shadow-xs sm:p-8", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Badge variant={closed ? "muted" : "outline"}>{closed ? labels.closedBadge : labels.eyebrow}</Badge>
        {when ? (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
            <IconClock aria-hidden="true" className="size-3.5 shrink-0" />
            <span>{fill(ended ? labels.endedOn : labels.ends, { date: when })}</span>
          </p>
        ) : null}
      </div>

      <Heading id={`${id}-title`} className="mt-6 text-2xl leading-[1.15] font-medium tracking-[-0.035em] text-balance">
        {title}
      </Heading>
      {description ? <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}

      <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {closed ? (
          <>
            <s className="text-5xl leading-none font-medium tracking-[-0.06em] text-muted-foreground tabular-nums">{price}</s>
            <span className="sr-only">{labels.unavailable}</span>
          </>
        ) : (
          <>
            <span className="text-5xl leading-none font-medium tracking-[-0.06em] tabular-nums">{price}</span>
            {priceNote ? <span className="text-sm text-muted-foreground">{priceNote}</span> : null}
          </>
        )}
      </p>

      {/* The meter says its number in words next to the bar, so it is never read from the bar's length alone. */}
      <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="text-sm leading-snug font-medium tabular-nums">{meterText}</p>
          {/* A closed offer, sold out or ended, does not say how many places are left: it has none to sell. */}
          {closed ? null : <p className={cn("text-sm leading-snug tabular-nums", low ? "font-medium text-foreground" : "text-muted-foreground")}>{text(labels.left, figures)}</p>}
        </div>
        <Progress value={taken} max={Math.max(cap, 1)} aria-label={labels.meter} getValueLabel={() => meterText} className="mt-3 h-2 bg-foreground/10" />
      </div>

      <ul role="list" className="mt-6 grid gap-3">
        {perks.map((perk, index) => (
          <li key={`${index}-${perk}`} className="flex items-start gap-3 text-sm leading-snug">
            <IconCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span className={cn(closed && "text-muted-foreground")}>{perk}</span>
          </li>
        ))}
      </ul>

      <p className="mt-6 flex items-start gap-3 border-t border-border pt-5 text-sm leading-snug text-pretty text-muted-foreground">
        <IconTag aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{condition}</span>
      </p>

      {/* The button sits at the bottom of the panel, so panels of different lengths side by side keep their buttons on one line. */}
      <div className="mt-auto pt-6">
        {!target ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground">{labels.closedNote}</p>
        ) : target.href ? (
          <Button asChild size="lg" className="w-full">
            <a href={target.href} onClick={target.onClick}>
              {target.label}
              {arrow}
            </a>
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={target.onClick} className="w-full">
            {target.label}
            {arrow}
          </Button>
        )}
      </div>
    </section>
  );
}
