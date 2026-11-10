import type { ComponentProps, ElementType, MouseEvent } from "react";

import { fill, monthName } from "@rhs-ui/primitives/archive-nav/months";
import { ArchiveEarlier, ArchiveYear } from "@rhs-ui/primitives/archive-nav/years";
import { cn } from "@/lib/utils";

export interface ArchiveMonth {
  /** The month, 1 for January to 12 for December. */
  month: number;
  /** How many posts it holds. With none it is written but is not a link. */
  count: number;
  /** Where the month's posts are. Without one the month is a button that calls `onNavigate`. */
  href?: string;
}

export interface ArchivePeriod {
  /** The year, as a number: 2026. */
  year: number;
  /** The months that have, or could have, posts, in any order: they are shown newest first. */
  months: readonly ArchiveMonth[];
}

/** A place in the archive: a year, or a month of a year. */
export interface ArchivePlace {
  year: number;
  month?: number;
}

/** The words of the archive, for another language or your own wording. */
export interface ArchiveNavLabels {
  /** What a screen reader hears after a count of one; `{count}` is the number. Default "{count} post". */
  one: string;
  /** The same for any other count. Default "{count} posts". */
  other: string;
  /** After the name of a month with nothing in it. Default "no posts". */
  none: string;
  /** The button that shows the older years; `{count}` is how many there are. Default "Show {count} earlier years". */
  more: string;
  /** The same button while they are shown. Default "Show fewer years". */
  fewer: string;
}

export interface ArchiveNavProps extends Omit<ComponentProps<"nav">, "children" | "ref"> {
  /** The years of the archive and their months, in any order: they are shown newest first. */
  periods: readonly ArchivePeriod[];
  /** The page being shown: its year is open and its month is marked aria-current="page". Without it the newest year is open. */
  current?: ArchivePlace;
  /** Called with the year and month chosen. On a link, a plain click calls it and the browser's own navigation is skipped, so route yourself; a function, so use it from a Client Component. */
  onNavigate?: (place: Required<ArchivePlace>) => void;
  /** The language of the month names and the numbers. Always pass your application locale. Default "en-US". */
  locale?: string;
  /** The time zone the month names are worked out in. They never depend on it, but it is passed on so server and browser agree. Default "UTC". */
  timeZone?: string;
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** How many of the newest years show before the rest fold behind a button. Default 5. */
  collapsedCount?: number;
  /** The name of the navigation landmark. Default "Archive". */
  label?: string;
  /** The words of the archive. */
  labels?: Partial<ArchiveNavLabels>;
}

const WORDS: ArchiveNavLabels = { one: "{count} post", other: "{count} posts", none: "no posts", more: "Show {count} earlier years", fewer: "Show fewer years" };

const ROW =
  "flex h-8 w-full items-center justify-between gap-3 rounded-md px-2 text-left text-sm outline-none transition-colors duration-150 motion-reduce:transition-none focus-visible:ring-[3px] focus-visible:ring-ring/40";
const LIVE = "text-foreground/90 hover:bg-muted hover:text-foreground aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground";

/**
 * A blog or changelog archive by year and month. The year you are in is open and the others are disclosure buttons
 * (aria-expanded) with their months folded under them; a month shows how many posts it holds, is a link only if it
 * has some, and the current one is marked aria-current. Month names come from your locale. A long history shows the
 * newest years and a "Show earlier years" button that stays where it is, so keyboard focus is not lost when the
 * older years appear. The whole list is one navigation landmark named Archive. With `linkAs` it is drawn by a
 * Server Component; only the folding parts run in the browser.
 */
export function ArchiveNav({ periods, current, onNavigate, locale = "en-US", timeZone = "UTC", linkAs: Link = "a", collapsedCount = 5, label = "Archive", labels, className, ...props }: ArchiveNavProps) {
  const words = { ...WORDS, ...labels };
  const numbers = new Intl.NumberFormat(locale);
  const years = [...periods].sort((a, b) => b.year - a.year);
  const open = current?.year ?? years[0]?.year;
  const visible = Math.max(1, Math.floor(collapsedCount));
  const counted = (count: number): string => fill(count === 1 ? words.one : words.other, { count: numbers.format(count) });

  const yearItem = (period: ArchivePeriod) => {
    const total = period.months.reduce((sum, month) => sum + month.count, 0);
    const months = [...period.months].sort((a, b) => b.month - a.month);
    return (
      <ArchiveYear key={period.year} year={String(period.year)} count={numbers.format(total)} spoken={counted(total)} defaultOpen={period.year === open} current={current?.year === period.year}>
        <ul className="my-0.5 ml-[1.1875rem] grid gap-px border-l border-border pl-2">
          {months.map((month) => {
            const name = monthName(month.month, locale, timeZone);
            const here = current?.year === period.year && current.month === month.month;
            const count = numbers.format(month.count);
            const press = onNavigate
              ? (event: MouseEvent<HTMLElement>) => {
                  // A modified click opens the address the way the browser does; only a plain one is yours.
                  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                  event.preventDefault();
                  onNavigate({ year: period.year, month: month.month });
                }
              : undefined;
            const inside = (
              <>
                <span className="min-w-0 truncate">{name}</span>
                <span className="sr-only">, {month.count === 0 ? words.none : counted(month.count)}</span>
                <span aria-hidden="true" className="shrink-0 text-xs tabular-nums opacity-80">
                  {count}
                </span>
              </>
            );
            return (
              <li key={month.month}>
                {month.count === 0 || (!month.href && !onNavigate) ? (
                  <span className={cn(ROW, "cursor-default text-muted-foreground")}>{inside}</span>
                ) : month.href ? (
                  <Link href={month.href} aria-current={here ? "page" : undefined} onClick={press} className={cn(ROW, LIVE)}>
                    {inside}
                  </Link>
                ) : (
                  <button type="button" aria-current={here ? "page" : undefined} onClick={press} className={cn(ROW, LIVE)}>
                    {inside}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </ArchiveYear>
    );
  };

  const newest = years.slice(0, visible);
  const older = years.slice(visible);
  // The page being shown may be in an older year: those are then shown from the start, or it would be hidden.
  const olderHoldsCurrent = older.some((period) => period.year === current?.year);

  return (
    <nav data-slot="archive-nav" aria-label={label} className={cn("min-w-0", className)} {...props}>
      <ul className="grid gap-0.5">
        {newest.map(yearItem)}
        {older.length ? (
          <ArchiveEarlier more={fill(words.more, { count: numbers.format(older.length) })} fewer={words.fewer} holdsCurrent={olderHoldsCurrent}>
            {older.map(yearItem)}
          </ArchiveEarlier>
        ) : null}
      </ul>
    </nav>
  );
}
