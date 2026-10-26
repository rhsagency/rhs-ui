"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconBot } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** Who did it. */
export interface ActivityActor {
  /** Their name, or the name of the system: "Anna Lindqvist", "Deploy bot". It leads the sentence. */
  name: string;
  /** A picture. Initials stand in while it loads, or when there is none. Ignored for a system actor. */
  image?: string;
  /** A bot, a job or the platform itself: drawn as a square tile with the entry's `icon` (a bot by default) instead of a round avatar. */
  system?: boolean;
}

/** The thing it happened to. */
export interface ActivityObject {
  /** Its name: "Checkout redesign". Long names are cut to one line, and the whole name is in the title. */
  label: string;
  /** Where it lives. The name becomes a link. */
  href?: string;
}

/** A value that changed, drawn as two quiet chips with an arrow between them. */
export interface ActivityChange {
  /** What it was. Leave it out for a value that was set for the first time. */
  from?: string;
  /** What it is now. Leave it out for a value that was cleared. */
  to?: string;
}

/** The words the entry uses, for translation. */
export interface ActivityEntryLabels {
  /** Read before the old value. Default "from". */
  from?: string;
  /** Read before the new value. Default "to". */
  to?: string;
  /** What an entry under a minute old is called. Default "just now". */
  justNow?: string;
}

export interface ActivityEntryProps extends Omit<ComponentProps<"li">, "children"> {
  /** Who did it. */
  actor: ActivityActor;
  /** What they did, as it reads after the name: "moved", "commented on", "deployed". */
  verb: string;
  /** The thing it happened to. */
  object?: ActivityObject;
  /** What changed: the old and the new value. */
  change?: ActivityChange;
  /** When it happened: a Date, a timestamp or an ISO string. */
  time: DateInput;
  /** An icon element, drawn at 12px. With a person it sits on the corner of the avatar and says what kind of entry it is; with a system actor it fills the tile. */
  icon?: ReactNode;
  /** The moment the age is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get relative text in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The time zone the dates are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the entry uses, for translation. */
  labels?: ActivityEntryLabels;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** A date in the zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/**
 * "just now", "12 minutes ago", "yesterday", "3 days ago", then the date.
 * Before the browser's clock is known (the server, the first paint) it writes
 * the date and clock time instead, which reads the same everywhere.
 */
function describe(at: number, now: number | null, locale: string, timeZone: string, justNow: string): string {
  if (now === null) return dateIn(at, locale, timeZone, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const diff = at - now;
  const age = Math.abs(diff);
  if (age < MINUTE) return justNow;
  if (age >= 7 * DAY) return dateIn(at, locale, timeZone, new Date(at).getUTCFullYear() === new Date(now).getUTCFullYear() ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  }
  if (age < HOUR) return words.format(Math.trunc(diff / MINUTE), "minute");
  if (age < DAY) return words.format(Math.trunc(diff / HOUR), "hour");
  // Days are rounded: 47 hours is "2 days ago", not "yesterday".
  return words.format(Math.round(diff / DAY), "day");
}

/** The browser's clock, once the page is live and then every minute while the text can still change. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, at: number): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined;
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    // Past a week the text is a date and never changes again.
    const timer = Math.abs(Date.now() - at) < 7 * DAY ? window.setInterval(read, MINUTE) : undefined;
    return () => window.clearInterval(timer);
  }, [pinned, at]);
  if (fixed === undefined) return tick;
  const value = new Date(fixed).getTime();
  return Number.isNaN(value) ? tick : value;
}

/**
 * One thing that happened, as a sentence for a feed or a history view: who did
 * it, what, to which object, and when. "Anna Lindqvist moved Checkout redesign
 * from In review to Done", with the two values as quiet chips around an arrow
 * and the time to the side (under the sentence on a narrow row). The row is
 * one readable string for screen readers, with "from" and "to" where the
 * arrow is. A system actor, a bot or a job, has a square tile instead of an
 * avatar, and a long object name is cut to one line with the whole name in its
 * title. Put the entries in a `ul`.
 */
export function ActivityEntry({ actor, verb, object, change, time, icon, now, locale = "en-US", timeZone = "UTC", labels, className, ...props }: ActivityEntryProps) {
  const text = { from: "from", to: "to", justNow: "just now", ...labels };
  const at = new Date(time).getTime();
  const valid = !Number.isNaN(at);
  const clock = useNow(now, valid ? at : 0);

  const objectClass = "inline-block max-w-full truncate align-bottom font-medium text-foreground";
  const showFrom = change?.from !== undefined && change.from !== "";
  const showTo = change?.to !== undefined && change.to !== "";

  return (
    <li data-slot="activity-entry" data-actor={actor.system ? "system" : "person"} className={cn("@container", className)} {...props}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 px-4 py-3 @md:grid-cols-[auto_minmax(0,1fr)_auto]">
        {actor.system ? (
          <span aria-hidden="true" className="col-start-1 row-span-2 row-start-1 grid size-9 place-items-center rounded-lg border border-border bg-muted text-foreground [&_svg]:size-4">
            {icon ?? <IconBot />}
          </span>
        ) : (
          <span className="relative col-start-1 row-span-2 row-start-1 size-9">
            <Avatar aria-hidden="true">
              {actor.image ? <AvatarImage src={actor.image} alt="" /> : null}
              <AvatarFallback>{initialsOf(actor.name)}</AvatarFallback>
            </Avatar>
            {icon ? (
              <span aria-hidden="true" className="absolute -end-1.5 -bottom-1.5 grid size-5 place-items-center rounded-full border border-border bg-background text-foreground [&_svg]:size-3">
                {icon}
              </span>
            ) : null}
          </span>
        )}

        <p className="col-start-2 row-start-1 min-w-0 text-sm leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">{actor.name}</span> {verb}
          {object ? (
            <>
              {" "}
              {object.href ? (
                <a href={object.href} title={object.label} className={cn(objectClass, "rounded-sm underline decoration-border underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none")}>
                  {object.label}
                </a>
              ) : (
                <span title={object.label} className={objectClass}>
                  {object.label}
                </span>
              )}
            </>
          ) : null}
          {showFrom || showTo ? (
            <>
              {" "}
              <span className="inline-flex max-w-full items-center gap-1.5 align-middle">
                {showFrom ? (
                  <>
                    <span className="sr-only">{text.from} </span>
                    <Badge variant="outline" title={change?.from} className="max-w-40 min-w-0 justify-start text-muted-foreground">
                      <span className="truncate">{change?.from}</span>
                    </Badge>
                  </>
                ) : null}
                {showFrom && showTo ? <IconArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100" /> : null}
                {showTo ? (
                  <>
                    <span className="sr-only">{text.to} </span>
                    <Badge variant="muted" title={change?.to} className="max-w-40 min-w-0 justify-start text-foreground">
                      <span className="truncate">{change?.to}</span>
                    </Badge>
                  </>
                ) : null}
              </span>
            </>
          ) : null}
        </p>

        {valid ? (
          <p className="col-start-2 row-start-2 mt-0.5 text-xs text-muted-foreground @md:col-start-3 @md:row-start-1 @md:mt-0 @md:ms-4 @md:pt-1 @md:whitespace-nowrap">
            <time dateTime={new Date(at).toISOString()} title={dateIn(at, locale, timeZone, { dateStyle: "medium", timeStyle: "short" })} suppressHydrationWarning className="tabular-nums">
              {describe(at, clock, locale, timeZone, text.justNow)}
            </time>
          </p>
        ) : null}
      </div>
    </li>
  );
}
