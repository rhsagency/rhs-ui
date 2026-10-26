"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/**
 * The colours an event can have, as steps of the page's own ink. They are the
 * small token set: change the table below to use your brand's hues, and the
 * chip, the all-day fill and the bar follow. Colour is never the only signal,
 * since the calendar's name is read out and shown in the tooltip.
 */
export type EventTone = "ink" | "graphite" | "stone" | "mist";

/** How the chip is drawn: a bar and a start time, a filled all-day chip, or the same fill for an event that spans days. */
export type EventChipVariant = "timed" | "all-day" | "multi-day";

/** The event a chip shows. */
export interface CalendarEvent {
  /** A stable identity. */
  id: string;
  /** What it is: "Design review". One line, cut with an ellipsis. */
  title: string;
  /** When it starts: a Date, a timestamp or an ISO string. */
  start: DateInput;
  /** When it ends. A timed chip then reads "10:00 to 11:00" to screen readers. */
  end?: DateInput;
  /** An all-day event: the chip is filled and carries no time. It sets the default `variant`. */
  allDay?: boolean;
  /** The calendar it belongs to: "Studio", "Personal". Read out and shown in the tooltip, so its colour is never the only signal. */
  calendar?: string;
  /** Its colour. Default "ink". */
  tone?: EventTone;
  /** Not accepted yet: drawn hollow with a dashed edge, and said as "tentative". */
  tentative?: boolean;
}

/** The words the chip uses, for translation. `{start}` and `{end}` are filled in. */
export interface EventChipLabels {
  /** What an all-day event is called to screen readers and in the tooltip. Default "All day". */
  allDay?: string;
  /** A span: "10:00 to 11:00". Default "{start} to {end}". */
  range?: string;
  /** Said after the title of an event that is not accepted. Default "Tentative". */
  tentative?: string;
}

export interface EventChipProps extends Omit<ComponentProps<"button">, "children" | "title" | "onSelect"> {
  /** The event to show. */
  event: CalendarEvent;
  /** `timed` has a bar and the start time, `all-day` and `multi-day` are filled. Default `all-day` when `event.allDay` is set, else `timed`. */
  variant?: EventChipVariant;
  /** The chip was pressed or opened with Enter or Space. */
  onSelect?: (event: CalendarEvent) => void;
  /** A shorter chip for a month grid: 20px high instead of 24px, with smaller type. It keeps that height whatever sits around it. */
  dense?: boolean;
  /** The event started before this cell: the left edge is square and an arrow points back. For the later cells of a `multi-day` event. */
  continuesBefore?: boolean;
  /** The event goes on after this cell: the right edge is square and an arrow points forward. */
  continuesAfter?: boolean;
  /** The event whose details are open elsewhere: a ring and `aria-current`. */
  selected?: boolean;
  /** The language of the times. Default "en-US". */
  locale?: string;
  /** The time zone the times are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the chip uses, for translation. */
  labels?: EventChipLabels;
}

const TONES: Record<EventTone, { bar: string; fill: string }> = {
  ink: { bar: "bg-foreground", fill: "bg-foreground text-background hover:bg-foreground/90" },
  graphite: { bar: "bg-foreground/75", fill: "bg-foreground/80 text-background hover:bg-foreground/90" },
  stone: { bar: "bg-foreground/50", fill: "bg-foreground/60 text-background hover:bg-foreground/70" },
  mist: { bar: "bg-foreground/25", fill: "bg-foreground/15 text-foreground hover:bg-foreground/25" },
};

const DEFAULT_LABELS = { allDay: "All day", range: "{start} to {end}", tentative: "Tentative" } satisfies Required<EventChipLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** A date or a time in the zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function format(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

const DAY: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };

/** The way times are written: "09:00" on a 24-hour clock, so a column of them lines up, and "9:00 AM" on a 12-hour one. */
function timeOptions(locale: string): Intl.DateTimeFormatOptions {
  try {
    const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
    return { hour: cycle === "h23" || cycle === "h24" ? "2-digit" : "numeric", minute: "2-digit" };
  } catch {
    return { hour: "numeric", minute: "2-digit" };
  }
}

/**
 * An event as it lives inside a calendar cell or a day column: a bar in the
 * calendar's colour, the start time and a title cut to one line, or a filled
 * chip for an all-day or multi-day event with arrows where it carries on.
 * It is one button. Its name reads like "Design review, 10:00 to 11:30,
 * Studio" so the colour is never the only signal, a tooltip shows the whole
 * title when it is cut, and it keeps its height in a crowded month grid.
 * Place a multi-day chip with a grid column span, one bar per week row.
 */
export function EventChip({
  event,
  variant,
  onSelect,
  dense = false,
  continuesBefore = false,
  continuesAfter = false,
  selected = false,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  onClick,
  ...props
}: EventChipProps) {
  const text: Required<EventChipLabels> = { ...DEFAULT_LABELS, ...labels };
  const kind: EventChipVariant = variant ?? (event.allDay ? "all-day" : "timed");
  const tone = TONES[event.tone ?? "ink"];
  const title = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  const [tip, setTip] = useState(false);

  // The tooltip adds something only when the title is cut, by the edge of the cell.
  useEffect(() => {
    const element = title.current;
    if (!element) return;
    const measure = () => setCut(element.scrollWidth > element.clientWidth + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [event.title, kind, dense]);

  const start = new Date(event.start).getTime();
  const end = event.end === undefined ? Number.NaN : new Date(event.end).getTime();
  const valid = !Number.isNaN(start);
  const clock = timeOptions(locale);
  const time = valid && kind === "timed" ? format(start, locale, timeZone, clock) : null;

  // When it happens, in words: "10:00 to 11:30", "All day", "Wed 28 Oct to Fri 30 Oct".
  let when = "";
  if (valid) {
    if (kind === "timed") when = Number.isNaN(end) ? (time ?? "") : fill(text.range, { start: time ?? "", end: format(end, locale, timeZone, clock) });
    else if (kind === "multi-day" && !Number.isNaN(end)) when = fill(text.range, { start: format(start, locale, timeZone, DAY), end: format(end, locale, timeZone, DAY) });
    else when = `${format(start, locale, timeZone, DAY)}, ${text.allDay.toLowerCase()}`;
  }
  const name = [event.title, when, event.calendar, event.tentative ? text.tentative.toLowerCase() : null].filter(Boolean).join(", ");
  const details = [when, event.calendar].filter(Boolean).join(" · ");

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={cut && tip} onOpenChange={setTip}>
        <TooltipTrigger asChild>
          <button
            type="button"
            data-slot="event-chip"
            data-variant={kind}
            data-tone={event.tone ?? "ink"}
            data-dense={dense ? "" : undefined}
            data-tentative={event.tentative ? "" : undefined}
            aria-label={name}
            aria-current={selected ? "true" : undefined}
            className={cn(
              "group/event-chip relative flex w-full min-w-0 shrink-0 items-center overflow-hidden text-start font-medium select-none",
              "outline-none transition-[background-color,box-shadow,color] duration-150 motion-reduce:transition-none",
              "focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=true]:ring-2 aria-[current=true]:ring-foreground",
              dense ? "h-5 min-h-5 gap-1 rounded-[5px] text-[0.6875rem] leading-none" : "h-6 min-h-6 gap-1.5 rounded-md text-xs leading-none",
              kind === "timed" ? (dense ? "ps-1 pe-1.5" : "ps-1.5 pe-2") : dense ? "px-1.5" : "px-2",
              event.tentative
                ? "border border-dashed border-foreground/40 bg-transparent text-foreground hover:bg-muted/70"
                : kind === "timed"
                  ? "bg-muted/70 text-foreground hover:bg-muted"
                  : tone.fill,
              continuesBefore && "rounded-s-none",
              continuesAfter && "rounded-e-none",
              className,
            )}
            onClick={(clicked) => {
              onClick?.(clicked);
              if (!clicked.defaultPrevented) onSelect?.(event);
            }}
            {...props}
          >
            {kind === "timed" ? <span aria-hidden="true" className={cn("w-[3px] shrink-0 self-center rounded-full", dense ? "h-3" : "h-3.5", tone.bar)} /> : null}
            {continuesBefore ? <IconChevronLeft aria-hidden="true" className="-ms-0.5 size-3 shrink-0 opacity-80 rtl:rotate-180" /> : null}
            {time ? (
              <span aria-hidden="true" className="shrink-0 font-normal text-muted-foreground tabular-nums">
                {time}
              </span>
            ) : null}
            <span ref={title} aria-hidden="true" className="min-w-0 flex-1 truncate">
              {event.title}
            </span>
            {continuesAfter ? <IconChevronRight aria-hidden="true" className="-me-0.5 size-3 shrink-0 opacity-80 rtl:rotate-180" /> : null}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start" className="max-w-72 text-pretty">
          <span className="block font-medium">{event.title}</span>
          {details ? <span className="mt-0.5 block opacity-80">{details}</span> : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface OverflowChipProps extends Omit<ComponentProps<"button">, "children"> {
  /** How many events are not shown. */
  count: number;
  /** A shorter chip, to sit under dense `EventChip`s. */
  dense?: boolean;
  /** The words on the chip, with `{count}` filled in. Default "+{count} more". */
  label?: string;
}

/**
 * The "+3 more" at the foot of a crowded cell. It is a quiet text button the
 * size of an event chip, so a column of them keeps its rhythm, and it tells
 * screen readers what it opens ("Show 3 more events"). Pass your own
 * `aria-label` for another language.
 */
export function OverflowChip({ count, dense = false, label = "+{count} more", className, ...props }: OverflowChipProps) {
  return (
    <button
      type="button"
      data-slot="event-overflow-chip"
      aria-label={`Show ${count} more ${count === 1 ? "event" : "events"}`}
      className={cn(
        "flex w-full min-w-0 shrink-0 items-center rounded-md px-1.5 font-medium text-muted-foreground outline-none select-none",
        "transition-colors duration-150 hover:bg-muted hover:text-foreground motion-reduce:transition-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/40",
        dense ? "h-5 min-h-5 text-[0.6875rem] leading-none" : "h-6 min-h-6 text-xs leading-none",
        className,
      )}
      {...props}
    >
      <span className="truncate">{fill(label, { count: String(count) })}</span>
    </button>
  );
}
