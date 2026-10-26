"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";

import { IconArrowRight, IconChevronDown, IconClock, IconMoon, IconPhone } from "@rhs-ui/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";
import { WEEKDAYS, fill, hoursRanges, openingStatus, timeText, weekdayName, zoneName, zonedClock, type OpeningStatus } from "@rhs-ui/marketing/call-us-section/hours";
import type { CallAfterHours, CallAlternative, CallHoursRange, CallUsLabels, Weekday } from "@rhs-ui/marketing/call-us-section/types";

export type { CallAfterHours, CallAlternative, CallHoursRange, CallUsLabels, Weekday } from "@rhs-ui/marketing/call-us-section/types";

export interface CallUsSectionProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The number people ring, shown as written. It becomes a tel link made of its digits and a leading plus. */
  phone: string;
  /** The heading: "Burst pipe? Ring us now". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** When the line is answered. A day with no range is closed. Leave it out and the section says nothing about being open. */
  hours?: readonly CallHoursRange[];
  /** The business's own IANA time zone: "Europe/Amsterdam". Open or closed, and the week, are worked out in it. "UTC" by default. */
  timeZone?: string;
  /** A second number for when the line is closed. It stands out while the line is closed. */
  afterHours?: CallAfterHours;
  /** The other way in for people who would rather be rung: a callback form. */
  alternative?: CallAlternative;
  /** The language times and weekdays are written in. "en-US" by default. */
  locale?: string;
  /**
   * The moment open or closed is worked out for. Leave it out and it follows the reader's clock, which is known
   * only after the page has mounted, so server and browser never disagree. Pass it to pin the line for a test or a screenshot.
   */
  now?: Date | string | number;
  /** Whether the whole week starts open. Closed by default. */
  defaultOpen?: boolean;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<CallUsLabels>;
}

const LABELS: CallUsLabels = {
  open: "Open now",
  closed: "Closed",
  until: "until {time}",
  opensAt: "opens today at {time}",
  opensTomorrow: "opens tomorrow at {time}",
  opensOn: "opens {day} at {time}",
  call: "Call {phone}",
  hours: "See the whole week",
  to: "to",
  weekTitle: "Opening hours",
  closedDay: "Closed",
  today: "today",
  zone: "All times are in {zone}.",
  useNow: "Use this one now",
};

const LINK =
  "rounded-sm underline decoration-foreground/30 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/** The size of the number by how long it is, as a share of the section's width, so a long number still fits on one line on a phone. Written out so Tailwind sees every class. */
const SIZES = ["text-[clamp(1.5rem,9.5cqw,3.75rem)]", "text-[clamp(1.5rem,8cqw,3.5rem)]", "text-[clamp(1.5rem,6.5cqw,3rem)]"];

/** A tel link made of the number's digits and a leading plus. The (0) some countries write inside an international number is not dialled. */
const dial = (phone: string) => `tel:${phone.replace(/\(0\)/g, "").replace(/[^\d+]/g, "")}`;

/** The reader's clock, known only after mount; a fixed moment is used as it is. */
function useNow(fixed: CallUsSectionProps["now"]): Date | null {
  const [current, setCurrent] = useState<Date | null>(null);
  useEffect(() => {
    if (fixed !== undefined) return undefined;
    const tick = () => setCurrent(new Date());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [fixed]);
  return fixed !== undefined ? new Date(fixed) : current;
}

function statusDetail(status: OpeningStatus, labels: CallUsLabels, locale: string): string {
  if (status.open) return fill(labels.until, { time: timeText(status.until ?? "", locale) });
  const next = status.next;
  if (!next) return "";
  const time = timeText(next.time, locale);
  if (next.day === "today") return fill(labels.opensAt, { time });
  if (next.day === "tomorrow") return fill(labels.opensTomorrow, { time });
  return fill(labels.opensOn, { day: weekdayName(next.day, locale), time });
}

/**
 * A phone-first contact block for businesses people ring: plumbers, clinics, garages, solicitors. The number is the
 * biggest thing on it, a tap-to-call link sized for a thumb, with whether the line is answered right now in words and a
 * dot beside it ("Open now, until 17:30", "Closed, opens Monday at 08:00"), worked out from the hours in the
 * business's own time zone on the reader's clock. An after-hours number stands out the moment the line closes, a
 * callback link is there for people who would rather be rung, and the whole week sits in a disclosure, with today
 * marked. Until the clock is known the status is an empty line of the same height, so nothing jumps and the server
 * never claims the line is open or closed.
 */
export function CallUsSection({ phone, title, description, hours, timeZone = "UTC", afterHours, alternative, locale = "en-US", now: fixed, defaultOpen = false, headingLevel = 2, labels: custom, className, ...props }: CallUsSectionProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const now = useNow(fixed);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  // The week panel's own heading sits one level below the section's, so the outline reads title, then hours.
  const WeekHeading = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const status = hours && now ? openingStatus(hours, now, timeZone) : null;
  const closed = status !== null && !status.open;
  const today = now ? zonedClock(now, timeZone)?.day : undefined;
  const detail = status ? statusDetail(status, labels, locale) : "";

  const week = hours
    ? WEEKDAYS.map((day: Weekday) => {
        const ranges = hoursRanges(hours, day, labels.to, locale);
        return { day: weekdayName(day, locale), hours: ranges.length ? ranges.join(", ") : null };
      })
    : [];

  return (
    <section data-slot="call-us-section" data-state={status ? (status.open ? "open" : "closed") : undefined} aria-labelledby={`${id}-title`} className={cn("@container mx-auto w-full max-w-3xl rounded-2xl border border-border bg-card px-6 py-10 text-center break-words shadow-xs @2xl:px-12 @2xl:py-14", className)} {...props}>
      {/* The status keeps its height while the clock is unknown, so the heading below never moves. On a narrow section it reserves two lines, because the sentence may wrap. */}
      {hours && hours.length > 0 ? (
        <div className="mb-5 flex min-h-[3.375rem] items-center justify-center @sm:min-h-9">
          {status ? (
            <p className="inline-flex items-center gap-2.5 rounded-3xl border border-border bg-background px-4 py-1.5 text-left text-sm text-balance transition-opacity duration-300 motion-reduce:transition-none starting:opacity-0">
              <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", status.open ? "bg-foreground ring-4 ring-foreground/15" : "border border-muted-foreground")} />
              <span>
                <span className="font-medium">{status.open ? labels.open : labels.closed}</span>
                {detail ? <span className="text-muted-foreground">, {detail}</span> : null}
              </span>
            </p>
          ) : null}
        </div>
      ) : null}

      <Heading id={`${id}-title`} className="mx-auto max-w-xl text-2xl leading-[1.15] font-medium tracking-[-0.035em] text-balance @2xl:text-3xl">
        {title}
      </Heading>
      {description ? <p className="mx-auto mt-3 max-w-lg text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}

      <a
        href={dial(phone)}
        aria-label={fill(labels.call, { phone })}
        className={cn("group mt-8 inline-flex max-w-full items-center justify-center gap-[0.35em] rounded-2xl px-3 py-2 leading-none font-medium tracking-[-0.045em] whitespace-nowrap tabular-nums outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none", SIZES[phone.length <= 16 ? 0 : phone.length <= 19 ? 1 : 2])}
      >
        <IconPhone aria-hidden="true" size="0.8em" strokeWidth={1.5} className="shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground motion-reduce:transition-none" />
        {phone}
      </a>

      {/* The visible tag is part of the link's name, so what a voice user reads on the screen is what they can say. */}
      {afterHours ? (
        <a
          href={dial(afterHours.phone)}
          aria-label={[fill(labels.call, { phone: afterHours.phone }), closed ? labels.useNow : null, afterHours.label].filter(Boolean).join(", ")}
          data-priority={closed || undefined}
          className={cn(
            "mx-auto mt-8 flex max-w-lg items-center gap-4 rounded-xl border px-4 py-4 text-left outline-none @sm:px-5 transition-colors duration-300 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
            closed ? "border-foreground bg-muted/50" : "border-border",
          )}
        >
          <span aria-hidden="true" className="hidden size-10 shrink-0 place-items-center rounded-full border border-border bg-background @xs:grid">
            <IconMoon className="size-[1.125rem]" />
          </span>
          <span className="min-w-0 flex-1">
            {closed ? <span className="mb-1.5 inline-block rounded-full bg-foreground px-2 py-0.5 text-xs leading-snug font-medium text-background">{labels.useNow}</span> : null}
            <span className="block text-sm leading-snug font-medium">{afterHours.label}</span>
            <span className="mt-0.5 block text-xl leading-snug font-medium tracking-[-0.02em] whitespace-nowrap tabular-nums">{afterHours.phone}</span>
          </span>
        </a>
      ) : null}

      {alternative ? (
        <p className="mt-8 text-sm text-muted-foreground">
          {alternative.prompt ? <>{alternative.prompt} </> : null}
          <a href={alternative.href} className={cn(LINK, "group/alt inline-flex items-center gap-1.5 font-medium text-foreground")}>
            {alternative.label}
            <IconArrowRight aria-hidden="true" size={15} className="transition-transform duration-150 group-hover/alt:translate-x-0.5 motion-reduce:transition-none" />
          </a>
        </p>
      ) : null}

      {hours && hours.length > 0 ? (
        <Collapsible defaultOpen={defaultOpen} className="mx-auto mt-8 max-w-sm border-t border-border pt-5">
          <CollapsibleTrigger className="group/hours mx-auto inline-flex min-h-9 items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground outline-none transition-colors duration-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none">
            {labels.hours}
            <IconChevronDown aria-hidden="true" size={15} className="transition-transform duration-200 group-data-[state=open]/hours:rotate-180 motion-reduce:transition-none" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 text-left">
              {/* The week is written here, not by a shared primitive, so every word of it (the heading, Closed, today) comes from labels. */}
              <div data-slot="call-us-week" role="group" aria-labelledby={`${id}-week`} className="relative rounded-xl bg-muted/40 p-5">
                <WeekHeading id={`${id}-week`} className="flex items-center gap-2 text-sm font-medium">
                  <IconClock aria-hidden="true" className="size-4" />
                  {labels.weekTitle}
                </WeekHeading>
                <dl className="mt-4 grid gap-1.5 text-sm">
                  {week.map((entry, index) => {
                    const isToday = today !== undefined && index === WEEKDAYS.indexOf(today);
                    return (
                      <div key={entry.day} className={cn("flex justify-between gap-4 rounded-md px-2 py-1", isToday && "bg-muted font-medium")}>
                        <dt>
                          {entry.day}
                          {isToday ? <span className="sr-only"> ({labels.today})</span> : null}
                        </dt>
                        <dd className={cn("tabular-nums", !entry.hours && "text-muted-foreground")}>{entry.hours ?? labels.closedDay}</dd>
                      </div>
                    );
                  })}
                </dl>
                <p className="mt-3 text-xs text-muted-foreground">{fill(labels.zone, { zone: zoneName(timeZone, locale) })}</p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : null}
    </section>
  );
}
