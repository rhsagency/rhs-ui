"use client";

import { useId, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";

import { CopyField } from "@rhs-ui/application/copy-field";
import { IconArrowRight, IconClock } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface PromoCodeAction {
  /** The button's text: "Choose annual billing". */
  label: string;
  /** Where the button goes. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
}

export interface PromoCodeCtaLabels {
  /** The small tag over the headline while the offer runs. */
  eyebrow: string;
  /** The small line over the code. */
  code: string;
  /** The name of the copy button, for a screen reader. */
  copy: string;
  /** When the offer ends. {date} stands for the day and time, with the time zone. */
  ends: string;
  /** The link to the terms. */
  terms: string;
  /** The tag over the headline once the offer is over. */
  endedBadge: string;
  /** The headline once the offer is over. */
  endedTitle: string;
  /** The sentence under it. {title} stands for the offer and {date} for when it ended. */
  endedText: string;
}

const LABELS: PromoCodeCtaLabels = {
  eyebrow: "Limited offer",
  code: "Your code",
  copy: "Copy promo code",
  ends: "Ends {date}",
  terms: "Read the terms",
  endedBadge: "Ended",
  endedTitle: "This offer has ended",
  endedText: "{title} ended on {date}.",
};

export interface PromoCodeCtaProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The offer as a headline: "20 percent off annual plans". */
  title: string;
  /** The conditions in one line: "Applies to the Team and Business plans, for your first year." */
  description?: string;
  /** The code to copy. It is not in the page once the offer has ended. */
  code: string;
  /**
   * The last moment the offer works: an ISO 8601 time with its offset or a Z ("2026-12-31T22:59:00Z"), or a plain
   * day ("2026-12-31"), which ends with that day on the clocks of `timeZone`.
   */
  endsAt: string;
  /** Where the terms are. It is required: a promotion is only as believable as its small print. */
  terms: string;
  /** The button that takes the code to the cart or the pricing page. */
  action?: PromoCodeAction;
  /** The language the date is written in. "en-US" by default. */
  locale?: string;
  /** The time zone the end is written in, and the one it names. "UTC" by default. */
  timeZone?: string;
  /**
   * The moment the end is judged against. Leave it out on a page that is built once, and the band corrects
   * itself in the browser: the server cannot know when the page is read. Pass it, the same on the server and in the
   * browser, when you render per request, and the first paint is already right.
   */
  now?: Date | string | number;
  /** The level of the headline: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<PromoCodeCtaLabels>;
}

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

/** The hour as the locale writes it: two digits on a 24-hour clock ("23:59"), one on a 12-hour clock ("11:59 PM"). */
function clockOptions(locale: string): Intl.DateTimeFormatOptions {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
}

/** There is nothing to subscribe to: no timer runs, so the page is judged once, when it is read. */
const noSubscription = (): (() => void) => () => undefined;

const TEXT_LINK =
  "rounded-sm text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A limited offer with its code ready to copy: a bordered band with the headline, one line of conditions, the end
 * date written as a time element in an explicit time zone, a link to the terms and the code in a copy field that
 * says Copied in words. It is the honest version of urgency: a real code, a real date and the small print. No timer
 * runs in the page. Once the end has passed the band says This offer has ended and the code is no longer in the
 * page. On a page built once, the browser makes that call when it reads the page; pass `now` when you render per
 * request and the first paint is right on the server too.
 */
export function PromoCodeCta({
  title,
  description,
  code,
  endsAt,
  terms,
  action,
  locale = "en-US",
  timeZone = "UTC",
  now,
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: PromoCodeCtaProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const end = endMoment(endsAt, timeZone);
  // The server renders the offer as running; the browser then reads its own clock once and, if the end has passed, swaps to the ended band.
  const lateInBrowser = useSyncExternalStore(
    noSubscription,
    () => Date.now() > end,
    () => false,
  );
  const ended = now !== undefined ? new Date(now).getTime() > end : lateInBrowser;

  const date = Number.isNaN(end)
    ? endsAt
    : new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric", ...clockOptions(locale), timeZoneName: "short", timeZone }).format(new Date(end));
  const when = (
    <time dateTime={Number.isNaN(end) ? endsAt : new Date(end).toISOString()} className="tabular-nums">
      {date}
    </time>
  );
  const termsLink = (
    <a href={terms} className={TEXT_LINK}>
      {labels.terms}
    </a>
  );

  if (ended) {
    return (
      <section data-slot="promo-code-cta" data-state="ended" aria-labelledby={`${id}-title`} className={cn("@container w-full rounded-2xl border border-border bg-card break-words", className)} {...props}>
        <div className="flex flex-col gap-5 p-6 @3xl:flex-row @3xl:items-center @3xl:justify-between @3xl:gap-12 @3xl:p-8">
          <div className="min-w-0">
            <Badge variant="muted">{labels.endedBadge}</Badge>
            <Heading id={`${id}-title`} className="mt-4 text-2xl leading-[1.15] font-medium tracking-[-0.035em] text-balance">
              {labels.endedTitle}
            </Heading>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-muted-foreground">{fill(labels.endedText, { title, date: when })}</p>
          </div>
          <p className="text-sm">{termsLink}</p>
        </div>
      </section>
    );
  }

  const label = action?.label ?? "";
  return (
    <section data-slot="promo-code-cta" data-state="live" aria-labelledby={`${id}-title`} className={cn("@container w-full rounded-2xl border border-border bg-card break-words", className)} {...props}>
      <div className="grid gap-7 p-6 @3xl:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] @3xl:items-center @3xl:gap-14 @3xl:p-8">
        <div className="min-w-0">
          <Badge variant="outline">{labels.eyebrow}</Badge>
          <Heading id={`${id}-title`} className="mt-4 text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance">
            {title}
          </Heading>
          {description ? <p className="mt-3 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
          <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <IconClock aria-hidden="true" className="size-4 shrink-0" />
              <span>{fill(labels.ends, { date: when })}</span>
            </span>
            {termsLink}
          </p>
        </div>

        <div role="group" aria-labelledby={`${id}-code`} className="min-w-0">
          <p id={`${id}-code`} className="mb-2 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {labels.code}
          </p>
          {/* The field keeps a line under it for "Copied to clipboard.". With a button after it that line is the gap; without one it would only make the band bottom-heavy, so it is pulled up. */}
          <CopyField value={code} label={labels.copy} className={action ? undefined : "-mb-4"} />
          {action ? (
            action.href ? (
              <Button asChild size="lg" className="mt-1 w-full">
                <a href={action.href} onClick={action.onClick}>
                  {label}
                  <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={action.onClick} className="mt-1 w-full">
                {label}
                <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
              </Button>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}
