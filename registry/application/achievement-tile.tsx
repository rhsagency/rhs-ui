"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconLock, IconMedal } from "@rhs-ui/icons";
import { Card } from "@rhs-ui/primitives/card";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** Where an achievement stands: not started, on its way, or earned. */
export type AchievementState = "locked" | "progress" | "unlocked";

/** The words the tile uses, for translation. `{date}`, `{current}`, `{goal}` and `{title}` are filled in. */
export interface AchievementTileLabels {
  /** The footer of a tile that is still locked. Default "Locked". */
  locked?: string;
  /** The footer of an earned tile that has a date. Default "Unlocked {date}". */
  unlocked?: string;
  /** The footer of an earned tile without a date. Default "Unlocked". */
  unlockedNoDate?: string;
  /** The count beside the bar, which is also its spoken value. Default "{current} of {goal}". */
  progress?: string;
  /** The name of the bar for a screen reader. Default "Progress towards {title}". */
  progressName?: string;
  /** Said politely when the tile is unlocked while you watch. Default "Achievement unlocked: {title}". */
  announce?: string;
}

export interface AchievementTileProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  /** The name of the achievement: "First export". It is the heading. */
  title: string;
  /** How to earn it: "Export a project to PDF". It stays visible whatever the state, so a locked tile still says what to do. */
  description: string;
  /** The picture in the medal, drawn at 20px: an icon from `@rhs-ui/icons` or your own SVG. Default a medal. */
  icon?: ReactNode;
  /** "locked" is outlined and dim, "progress" shows a bar with a count, "unlocked" is a filled tile with its date. */
  state: AchievementState;
  /** How far along it is, for the "progress" state: `{ current: 7, goal: 10 }`. Ignored in the other states. */
  progress?: { current: number; goal: number };
  /** When it was earned. A string such as "2026-10-12" is a day on the calendar and never shifts with the time zone. */
  unlockedAt?: Date | string | number;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the date and the numbers. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the tile uses, for translation. */
  labels?: AchievementTileLabels;
}

const DEFAULT_LABELS = {
  locked: "Locked",
  unlocked: "Unlocked {date}",
  unlockedNoDate: "Unlocked",
  progress: "{current} of {goal}",
  progressName: "Progress towards {title}",
  announce: "Achievement unlocked: {title}",
} satisfies Required<AchievementTileLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A date written in the locale, in the zone. A date-only string is a day on the calendar, so it is read and written in UTC and never shifts. Null when the input is not a date. */
function dateIn(input: Date | string | number, locale: string, timeZone: string): string | null {
  const calendar = typeof input === "string" && DATE_ONLY.test(input);
  const at = new Date(calendar ? `${input}T00:00:00Z` : input).getTime();
  if (Number.isNaN(at)) return null;
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const zone = calendar ? "UTC" : timeZone;
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone: zone }).format(at);
  } catch {
    // An unknown locale or zone must not take the page down.
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  // Intl writes some spaces as narrow no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
  return text.replace(/\s/g, " ");
}

function numberIn(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat("en-US").format(value);
  }
}

/** The medal, by state: filled, plain, or a dashed outline. */
const MEDAL: Record<AchievementState, string> = {
  unlocked: "border-background/25 bg-background/12 text-background",
  progress: "border-border bg-muted text-foreground",
  locked: "border-dashed border-border bg-transparent text-muted-foreground",
};

/**
 * An achievement as a tile in a grid: a medal with its icon, the name, how to
 * earn it, and a footer that tells the state in words. Unlocked is a filled
 * tile with the date, in progress is a bar with "7 of 10" in text, and locked
 * is an outline with the word "Locked" while the how-to-earn line stays
 * readable. Every tile has the same height in a row, so they line up. When a
 * tile is unlocked while you watch, a short shine crosses it once (left out
 * under reduced motion) and the unlock is announced politely.
 */
export function AchievementTile({ title, description, icon, state, progress, unlockedAt, headingLevel = 3, locale = "en-US", timeZone = "UTC", labels, className, ...props }: AchievementTileProps) {
  const text: Required<AchievementTileLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  // A tile that turns unlocked after it was drawn is a moment: the shine plays and the tile says so. Worked out while rendering, from the state it saw last.
  const [seen, setSeen] = useState(state);
  const [moment, setMoment] = useState(0);
  const [said, setSaid] = useState("");
  if (state !== seen) {
    setSeen(state);
    if (state === "unlocked") {
      setMoment((count) => count + 1);
      setSaid(fill(text.announce, { title }));
    } else {
      setSaid("");
    }
  }

  const goal = Math.max(1, progress?.goal ?? 1);
  const current = Math.min(goal, Math.max(0, progress?.current ?? 0));
  const counted = fill(text.progress, { current: numberIn(current, locale), goal: numberIn(goal, locale) });
  // The date is written with no-break spaces: in a narrow tile the footer wraps between "Unlocked" and the date, never inside the date.
  const date = unlockedAt === undefined ? null : dateIn(unlockedAt, locale, timeZone)?.replace(/ /g, "\u00a0") ?? null;
  const when = unlockedAt === undefined || date === null ? undefined : new Date(unlockedAt).toISOString();

  return (
    <Card
      data-slot="achievement-tile"
      data-state={state}
      role="group"
      aria-labelledby={`${id}-title`}
      className={cn(
        "relative h-full min-h-44 min-w-0 gap-0 overflow-hidden px-4 py-4",
        state === "unlocked" && "border-foreground bg-foreground text-background shadow-sm",
        state === "locked" && "border-dashed border-muted-foreground/40 bg-transparent shadow-none",
        className,
      )}
      {...props}
    >
      {state === "unlocked" && moment > 0 ? (
        <span key={moment} aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-background/40 opacity-0 blur-md motion-safe:animate-rhs-achievement-shine motion-reduce:hidden" />
      ) : null}

      <span aria-hidden="true" className={cn("grid size-11 shrink-0 place-items-center rounded-xl border [&_svg]:size-5", MEDAL[state])}>
        {icon ?? <IconMedal />}
      </span>

      <div className="mt-4 grid min-w-0 gap-1">
        <Heading id={`${id}-title`} className={cn("text-[0.9375rem] leading-5 font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]", state === "locked" && "text-foreground/80")}>
          {title}
        </Heading>
        <p className={cn("text-[0.8125rem] leading-5 text-pretty", state === "unlocked" ? "text-background/75" : "text-muted-foreground")}>{description}</p>
      </div>

      <div className="mt-auto pt-4">
        {state === "unlocked" ? (
          <p className="flex items-start gap-1.5 text-[0.8125rem] leading-5 font-medium tabular-nums">
            <IconCheck className="mt-0.5 size-4 shrink-0" />
            {date && when ? <time dateTime={when}>{fill(text.unlocked, { date })}</time> : text.unlockedNoDate}
          </p>
        ) : state === "progress" ? (
          <div className="grid gap-1.5">
            <p className="text-[0.8125rem] leading-5 font-medium tabular-nums">{counted}</p>
            <Progress value={(current / goal) * 100} aria-label={fill(text.progressName, { title })} getValueLabel={() => counted} className="h-1.5" />
          </div>
        ) : (
          <p className="flex items-start gap-1.5 text-[0.8125rem] leading-5 text-muted-foreground">
            <IconLock className="mt-0.5 size-4 shrink-0" />
            {text.locked}
          </p>
        )}
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>
    </Card>
  );
}
