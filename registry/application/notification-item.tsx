"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconBell, IconCheck } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { IconButton } from "@rhs-ui/primitives/icon-button";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** The person behind a notification. */
export interface NotificationActor {
  /** The person's name. It leads the sentence in a heavier weight. */
  name: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
}

/** The thing a notification is about, and where it leads. */
export interface NotificationTarget {
  /** The thing it happened to: a document, a task, an order. Long labels clamp to two lines (three in a narrow row, so the target is not cut away), and the whole sentence is in the row's title. */
  label: string;
  /** Where the row goes. Without it, `onOpen` makes the row a button instead. */
  href?: string;
}

export interface NotificationItemLabels {
  /** Read before an unread notification, next to the dot. Default "Unread". */
  unread?: string;
  /** The name of the mark-as-read button. Default "Mark as read". */
  markRead?: string;
}

export interface NotificationItemProps extends Omit<ComponentProps<"li">, "children"> {
  /** Who did it. Leave it out for a system notification and pass `icon`. */
  actor?: NotificationActor;
  /** What they did, as it reads after the name: "commented on", "assigned you to". */
  verb: string;
  /** The thing it happened to. With `href` or `onOpen` the whole row opens it. */
  target?: NotificationTarget;
  /** When it happened: a Date, a timestamp or an ISO string. */
  time: DateInput;
  /** Marks the row as new: a dot, the word "Unread" for screen readers and a heavier title. Never colour alone. */
  unread?: boolean;
  /** An icon element, drawn at 16px. With an actor it sits on the corner of the avatar and says what kind of notification it is; without one it stands in for the avatar. */
  icon?: ReactNode;
  /** A line of context under the sentence: the comment itself, the board it is on. Clamped to two lines. */
  children?: ReactNode;
  /** The row was opened. The event is passed so a client-side router can call `preventDefault()`. Opening an unread notification usually marks it read: do that here. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Shows a check button on unread rows that runs this. It stays out of the way of the row's own link. */
  onMarkRead?: () => void;
  /** Buttons for what can be done right here: Accept and Decline, Reply. Each is its own tab stop, apart from the row's link. */
  actions?: ReactNode;
  /** The moment the age is measured against. Leave it out to use the browser's clock, which is read once the page is live; pass it to get relative text in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The time zone the dates are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the row uses, for translation. */
  labels?: NotificationItemLabels;
}

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

const cache = new Map<string, Intl.DateTimeFormat>();
/** A formatter per locale and options. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function dateFormat(locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`;
  let format = cache.get(key);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat(locale, { ...options, timeZone });
    } catch {
      format = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
    }
    cache.set(key, format);
  }
  return format;
}

/** The calendar day a moment falls on in the zone, as a number of days, so "yesterday" is a day and not 24 hours. */
function calendarDay(at: number, timeZone: string): { day: number; year: number } {
  const parts = dateFormat("en-US", timeZone, { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(at);
  const part = (type: string) => Number(parts.find((entry) => entry.type === type)?.value);
  return { day: Date.UTC(part("year"), part("month") - 1, part("day")) / DAY, year: part("year") };
}

interface Stamp {
  /** What the row shows. */
  text: string;
  /** For the time element. */
  iso: string;
  /** The exact moment, for the tooltip. */
  full: string;
}

/**
 * "now", "4 min. ago", "3 hr. ago", "yesterday", "3 days ago", then the date.
 * Before the browser's clock is known (the server, the first paint) it writes
 * the date and clock time instead, which reads the same everywhere.
 */
function describe(input: DateInput, now: number | null, locale: string, timeZone: string): Stamp | null {
  const at = new Date(input).getTime();
  if (Number.isNaN(at)) return null;
  const full = dateFormat(locale, timeZone, { dateStyle: "medium", timeStyle: "short" }).format(at);
  const iso = new Date(at).toISOString();
  if (now === null) return { text: dateFormat(locale, timeZone, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(at), iso, full };
  const diff = at - now;
  const age = Math.abs(diff);
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style: "short" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style: "short" });
  }
  if (age < MINUTE) return { text: words.format(0, "second"), iso, full };
  if (age < HOUR) return { text: words.format(Math.round(diff / MINUTE), "minute"), iso, full };
  if (age < DAY) return { text: words.format(Math.round(diff / HOUR), "hour"), iso, full };
  const then = calendarDay(at, timeZone);
  const today = calendarDay(now, timeZone);
  const days = then.day - today.day;
  if (Math.abs(days) <= 6) return { text: words.format(days, "day"), iso, full };
  return { text: dateFormat(locale, timeZone, { day: "numeric", month: "short", ...(then.year === today.year ? {} : { year: "numeric" }) }).format(at), iso, full };
}

/** The browser's clock, once the page is live and every half minute while the text can still change. Null on the server and before hydration. */
function useNow(fixed: DateInput | undefined, at: DateInput): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined;
  const moment = new Date(at).getTime();
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    // Past a day the text changes at midnight, not by the minute, and the next render catches it.
    const young = Math.abs(Date.now() - moment) < DAY;
    const timer = young ? window.setInterval(read, Math.abs(Date.now() - moment) < HOUR ? 20_000 : 5 * MINUTE) : undefined;
    const visible = () => {
      if (document.visibilityState === "visible") read();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [pinned, moment]);
  if (fixed === undefined) return tick;
  const value = new Date(fixed).getTime();
  return Number.isNaN(value) ? tick : value;
}

const OVERLAY =
  "absolute inset-0 z-0 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50";

/**
 * The atom of every inbox, bell panel and activity page: who did what to which
 * thing, and when. The sentence puts the actor and the target in a heavier
 * weight and the verb in between; an unread row adds a dot, the word "Unread"
 * for screen readers and a heavier title, so it never depends on colour. The
 * whole row is one link (or button) to the target, laid under the inline
 * actions, which are separate tab stops and never nested inside it. A long
 * target clamps to two lines (three in a narrow row) with the whole sentence in the row's title, the
 * time reads "4 min. ago" and keeps its exact moment in a tooltip, and the
 * actions sit beside the text on a wide row and drop under it on a narrow one.
 * Put the rows in a `ul`.
 */
export function NotificationItem({
  actor,
  verb,
  target,
  time,
  unread = false,
  icon,
  children,
  onOpen,
  onMarkRead,
  actions,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ref,
  ...props
}: NotificationItemProps) {
  const text = { unread: "Unread", markRead: "Mark as read", ...labels };
  const sentenceId = useId();
  const detailId = useId();
  const row = useRef<HTMLLIElement | null>(null);
  const link = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  const markButton = useRef<HTMLButtonElement>(null);
  const keepFocus = useRef(false);
  const clock = useNow(now, time);
  const stamp = describe(time, clock, locale, timeZone);
  const open = Boolean(target && (target.href || onOpen));
  const markable = unread && onMarkRead !== undefined;
  const sentence = [actor?.name, verb, target?.label].filter(Boolean).join(" ");

  // The row keeps the ref you pass, and uses its own to find where focus can go.
  const attach = useCallback(
    (element: HTMLLIElement | null) => {
      row.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );

  // The check button leaves with the unread state. Whoever pressed it with the keyboard is not sent back to the top of the page: focus goes to the row's own link, or to the row.
  useEffect(() => {
    if (!keepFocus.current || markButton.current) return;
    keepFocus.current = false;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    (link.current ?? row.current)?.focus({ preventScroll: true });
  });

  const lead = actor ? (
    <div className="relative col-start-1 row-start-1 me-3 size-9">
      <Avatar aria-hidden="true">
        {actor.image ? <AvatarImage src={actor.image} alt="" /> : null}
        <AvatarFallback>{initialsOf(actor.name)}</AvatarFallback>
      </Avatar>
      {icon ? (
        <span aria-hidden="true" className="absolute -end-1.5 -bottom-1.5 grid size-[1.375rem] place-items-center rounded-full border border-border bg-background text-foreground [&_svg]:size-3.5">
          {icon}
        </span>
      ) : null}
    </div>
  ) : (
    <span aria-hidden="true" className="col-start-1 row-start-1 me-3 grid size-9 place-items-center rounded-full bg-muted text-foreground [&_svg]:size-4">
      {icon ?? <IconBell />}
    </span>
  );

  return (
    <li
      ref={attach}
      data-slot="notification-item"
      data-unread={unread ? "" : undefined}
      tabIndex={open ? undefined : -1}
      className={cn("@container group/notification relative outline-none transition-colors duration-150 motion-reduce:transition-none", unread ? "bg-muted/40" : "bg-transparent", open && "hover:bg-muted/70", className)}
      {...props}
    >
      {open && target ? (
        target.href ? (
          <a ref={link} href={target.href} title={sentence} aria-labelledby={sentenceId} aria-describedby={detailId} onClick={onOpen} className={OVERLAY} />
        ) : (
          <button ref={link} type="button" title={sentence} aria-labelledby={sentenceId} aria-describedby={detailId} onClick={onOpen} className={cn(OVERLAY, "block size-full cursor-pointer")} />
        )
      ) : null}
      {unread ? <span aria-hidden="true" className="absolute start-1.5 top-[1.625rem] size-2 rounded-full bg-foreground" /> : null}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] px-4 py-3 @md:grid-cols-[auto_minmax(0,1fr)_auto_auto]">
        {lead}
        <div className="col-start-2 row-start-1 min-w-0">
          <p id={sentenceId} title={open ? undefined : sentence} className={cn("line-clamp-2 text-sm leading-snug [overflow-wrap:anywhere] @max-sm:line-clamp-3", unread ? "text-foreground" : "text-muted-foreground")}>
            {unread ? <span className="sr-only">{text.unread}. </span> : null}
            {actor ? <span className={cn("text-foreground", unread ? "font-semibold" : "font-medium")}>{actor.name} </span> : null}
            {verb}
            {target ? (
              <>
                {" "}
                <span className={cn("text-foreground", unread ? "font-semibold" : "font-medium", open && "underline decoration-transparent underline-offset-2 transition-colors duration-150 group-hover/notification:decoration-foreground/50 motion-reduce:transition-none")}>{target.label}</span>
              </>
            ) : null}
          </p>
          <div id={detailId}>
            {children ? <div className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground [overflow-wrap:anywhere]">{children}</div> : null}
            {stamp ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                <time dateTime={stamp.iso} title={stamp.full} suppressHydrationWarning className="tabular-nums">
                  {stamp.text}
                </time>
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="relative z-10 col-span-2 col-start-2 row-start-2 mt-2.5 flex flex-wrap items-center gap-2 @md:col-span-1 @md:col-start-3 @md:row-start-1 @md:mt-0.5 @md:ms-3 @md:self-start">{actions}</div> : null}
        {markable ? (
          <div className="relative z-10 col-start-3 row-start-1 mt-1 ms-3 self-start @md:col-start-4">
            <IconButton
              ref={markButton}
              icon={<IconCheck />}
              label={text.markRead}
              size="sm"
              variant="outline"
              onClick={() => {
                keepFocus.current = true;
                onMarkRead?.();
              }}
            />
          </div>
        ) : null}
      </div>
    </li>
  );
}
