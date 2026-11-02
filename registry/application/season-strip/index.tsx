"use client";

import { useId, useRef, useState, useSyncExternalStore, type ComponentProps, type CSSProperties } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

import { joinNames, monthAt, monthName, resolveMonths, type ResolvedMonth, type SeasonMonth, type SeasonState } from "./months";

export type { SeasonMonth, SeasonState } from "./months";

/** The words the strip uses, for translation. `{months}` is filled in. */
export interface SeasonStripLabels {
  /** The state of a month, in the legend and in what a screen reader hears. Default "Best". */
  best?: string;
  /** Default "Good". */
  good?: string;
  /** Default "Off season". */
  off?: string;
  /** Default "Closed". */
  closed?: string;
  /** The word under the current month. Default "Now". */
  now?: string;
  /** The strip's name when you give no `label`. Default "Season by month". */
  group?: string;
  /** The summary sentence a screen reader hears first. Default "Best in {months}". */
  summaryBest?: string;
  /** The same when no month is best but some are good. Default "Good in {months}". */
  summaryGood?: string;
  /** The same when no month is marked either way. Default "No best season marked". */
  summaryNone?: string;
  /** In the legend, next to the dot that marks a month with a note. Default "Has a note". */
  hasNote?: string;
}

export interface SeasonStripProps extends Omit<ComponentProps<"div">, "children"> {
  /** Twelve entries from January to December, in calendar order whatever `firstMonth` is. Each is "best", "good", "off" or "closed", or `{ state, note }` with a note that opens in a tooltip. A short array leaves the rest off season. */
  months: readonly SeasonMonth[];
  /** The strip's name, written above it: "Best time to visit Lisbon". It also names the group for a screen reader. */
  label?: string;
  /** The month the strip starts with, 1 for January (the default) up to 12. A harvest year that starts in September passes 9; the data stays in calendar order. */
  firstMonth?: number;
  /** Pins the moment that decides the current month, for previews and tests. Leave it out to use the browser's clock, read once the page is live: the ring waits for it, so nothing mismatches. */
  now?: Date | string | number;
  /** The language of the month names and of the summary sentence. Default "en-US". */
  locale?: string;
  /** The time zone that decides which month it is now, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** Draws the legend under the strip, for the states in use. Default true. */
  legend?: boolean;
  /** The words the strip uses, for translation. */
  labels?: SeasonStripLabels;
}

const DEFAULT_LABELS = {
  best: "Best",
  good: "Good",
  off: "Off season",
  closed: "Closed",
  now: "Now",
  group: "Season by month",
  summaryBest: "Best in {months}",
  summaryGood: "Good in {months}",
  summaryNone: "No best season marked",
  hasNote: "Has a note",
} satisfies Required<SeasonStripLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * Each state has a fill of its own, so none depends on colour: the best months
 * are solid and bold, the good ones a lighter fill in medium weight, the months
 * out of season an empty outline, and the closed ones hatched. The outline is
 * the foreground at 45%, which reaches 3:1 on the card in both themes: the
 * border token is a hairline for dividers, and an empty tile drawn with it
 * all but disappears in the dark theme.
 */
const FILL: Record<SeasonState, string> = {
  best: "border-transparent bg-foreground font-semibold text-background",
  good: "border-transparent bg-foreground/15 font-medium text-foreground",
  off: "border-foreground/45 bg-transparent font-normal text-muted-foreground",
  closed: "border-foreground/45 bg-transparent font-normal text-muted-foreground",
};

const HATCH: CSSProperties = { backgroundImage: "repeating-linear-gradient(135deg, color-mix(in oklch, var(--foreground) 22%, transparent) 0 1.25px, transparent 1.25px 6px)" };

const STATE_ORDER: readonly SeasonState[] = ["best", "good", "off", "closed"];

const subscribeNever = (): (() => void) => () => undefined;

/** One month: its short name on a tile, and a tooltip when it has a note. */
function Tile({ month, locale, stateWord, current, nowWord }: { month: ResolvedMonth; locale: string; stateWord: string; current: boolean; nowWord: string }) {
  const [open, setOpen] = useState(false);
  // A fingertip has no hover and no focus ring to open the tooltip: a tap opens it, a second tap or a tap elsewhere closes it. Mouse, pen and keyboard keep the tooltip's own hover and focus.
  const press = useRef({ touch: false, wasOpen: false });
  const long = monthName(month.index, locale, "long");
  const body = (
    <>
      <span aria-hidden="true">{monthName(month.index, locale, "short")}</span>
      <span className="sr-only">{`${long}, ${stateWord}${current ? `, ${nowWord}` : ""}`}</span>
      {month.note ? <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1 rounded-full bg-current opacity-60" /> : null}
    </>
  );
  const tile = cn(
    "relative grid h-11 w-full place-items-center rounded-lg border text-[0.8125rem] leading-none select-none",
    "transition-[background-color,border-color,color] duration-150 motion-reduce:transition-none",
    FILL[month.state],
  );
  const style = month.state === "closed" ? HATCH : undefined;
  if (!month.note) {
    return (
      <span className={tile} style={style}>
        {body}
      </span>
    );
  }
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        asChild
        onPointerDown={(event) => {
          press.current = { touch: event.pointerType === "touch", wasOpen: open };
        }}
        onClick={(event) => {
          if (!press.current.touch) return;
          press.current.touch = false;
          // The tooltip would close on this click: the tap decides instead.
          event.preventDefault();
          setOpen(!press.current.wasOpen);
        }}
      >
        <span tabIndex={0} className={cn(tile, "cursor-default outline-none hover:ring-2 hover:ring-foreground/15 focus-visible:ring-[3px] focus-visible:ring-ring/40")} style={style}>
          {body}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="grid gap-0.5">
        <span className="font-medium">{`${long}, ${stateWord}`}</span>
        <span>{month.note}</span>
      </TooltipContent>
    </Tooltip>
  );
}

/** A small tile in the fill of one state, for the legend. */
function Swatch({ state }: { state: SeasonState }) {
  return <span aria-hidden="true" className={cn("size-4 shrink-0 rounded-[5px] border", FILL[state])} style={state === "closed" ? HATCH : undefined} />;
}

/**
 * Twelve months in a strip that show when something is at its best: a visit,
 * a harvest, a bloom, a high season. Every month is a tile with its short name
 * and a state you can read without colour (solid and bold for the best, a
 * lighter fill for the good, an empty outline out of season, a hatch when
 * closed), explained by a legend in words. A screen reader first hears one
 * sentence, "Best in April, May and September", then the months. The current
 * month is ringed and marked "Now" in words, and a month with a note opens it
 * in a tooltip on hover, on focus and on a tap. Twelve tiles in a row where
 * there is room, two rows of six on a phone.
 */
export function SeasonStrip({ months, label, firstMonth = 1, now, locale = "en-US", timeZone = "UTC", legend = true, labels, className, ...props }: SeasonStripProps) {
  const text: Required<SeasonStripLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const resolved = resolveMonths(months, firstMonth);
  const stateWords: Record<SeasonState, string> = { best: text.best, good: text.good, off: text.off, closed: text.closed };

  // The month it is now is known only in the browser: the server draws no ring, so the ring cannot mismatch. A pinned moment is known everywhere.
  const pinned = now === undefined ? Number.NaN : new Date(now).getTime();
  const current = useSyncExternalStore(
    subscribeNever,
    () => monthAt(Number.isNaN(pinned) ? Date.now() : pinned, timeZone),
    () => (Number.isNaN(pinned) ? null : monthAt(pinned, timeZone)),
  );

  const names = (state: SeasonState) => resolved.filter((month) => month.state === state).map((month) => monthName(month.index, locale, "long"));
  const best = names("best");
  const good = names("good");
  const summary = best.length ? fill(text.summaryBest, { months: joinNames(best, locale) }) : good.length ? fill(text.summaryGood, { months: joinNames(good, locale) }) : text.summaryNone;

  const used = STATE_ORDER.filter((state) => resolved.some((month) => month.state === state));
  const noted = resolved.some((month) => month.note);

  return (
    <div
      data-slot="season-strip"
      role="group"
      aria-labelledby={label ? `${id}-label` : undefined}
      aria-label={label ? undefined : text.group}
      aria-describedby={`${id}-summary`}
      className={cn("@container grid gap-3", className)}
      {...props}
    >
      {label ? (
        <p id={`${id}-label`} className="text-sm leading-5 font-medium tracking-[-0.01em]">
          {label}
        </p>
      ) : null}
      <p id={`${id}-summary`} className="sr-only">
        {summary}
      </p>
      <TooltipProvider>
        <ol role="list" className="grid grid-cols-6 gap-x-2 gap-y-2 @xl:grid-cols-12">
          {resolved.map((month) => {
            const isCurrent = current === month.index;
            return (
              <li key={month.index} className="grid gap-1.5">
                <div className="relative">
                  {isCurrent ? <span aria-hidden="true" className="pointer-events-none absolute -inset-[3px] rounded-[11px] ring-2 ring-foreground" /> : null}
                  <Tile month={month} locale={locale} stateWord={stateWords[month.state]} current={isCurrent} nowWord={text.now} />
                </div>
                <span aria-hidden="true" className="h-3 text-center text-[0.6875rem] leading-3 font-semibold tracking-[0.06em] text-foreground uppercase">
                  {isCurrent ? text.now : ""}
                </span>
              </li>
            );
          })}
        </ol>
      </TooltipProvider>
      {legend ? (
        <ul role="list" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          {used.map((state) => (
            <li key={state} className="flex items-center gap-1.5">
              <Swatch state={state} />
              {stateWords[state]}
            </li>
          ))}
          {noted ? (
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="grid size-4 place-items-center">
                <span className="size-1 rounded-full bg-foreground/60" />
              </span>
              {text.hasNote}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
