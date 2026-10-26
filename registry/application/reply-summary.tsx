"use client";

import { useEffect, useState, type ComponentProps, type MouseEvent } from "react";

import { IconChevronRight } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** One person who replied in the thread. */
export interface Replier {
  /** Their name: the initials stand in for a picture, and a screen reader never needs it because the line names only the count. */
  name: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
}

/** The words the line uses, for translation. `{count}`, `{time}` are filled in. */
export interface ReplySummaryLabels {
  /** The first words of the link's name, and what the line says on hover and keyboard focus in a column wide enough to swap it in. Default "View thread". */
  view?: string;
  /** The count for exactly one reply. Default "{count} reply". */
  one?: string;
  /** The count for any other number. Default "{count} replies". */
  other?: string;
  /** The marker when `unread` is `true`. Default "New". */
  new?: string;
  /** The marker when `unread` is a number. Default "{count} new". */
  newCount?: string;
  /** The time of the latest reply. Default "Last reply {time}". */
  lastReply?: string;
  /** The same words inside the link's name, where they follow a comma. Default "last reply {time}". */
  lastReplyName?: string;
  /** What a reply under a minute old is called. Default "just now". */
  justNow?: string;
}

export interface ReplySummaryProps extends Omit<ComponentProps<"div">, "children" | "onClick"> {
  /** How many replies the thread has. Fewer than one draws nothing. */
  replies: number;
  /** The people who replied, most recent first. The first three are drawn as small avatars. */
  repliers?: readonly Replier[];
  /** When the latest reply came in: a Date, a timestamp or an ISO string. It is written as a relative time that is read once and does not tick. */
  lastReplyAt?: DateInput;
  /** Replies you have not read: `true` for a plain "New", or how many for "2 new". The marker is text, not just a dot. */
  unread?: boolean | number;
  /** The thread's own page. The line becomes a link. Without it the line is a button and `onOpen` does the work. */
  href?: string;
  /** The line was activated. With `href` it receives the click, so a client-side router can call `preventDefault()` and navigate itself. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** The moment "2 hours ago" is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the count and the time. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in before the clock is known, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the line uses, for translation. */
  labels?: ReplySummaryLabels;
}

const DEFAULT_LABELS = {
  view: "View thread",
  one: "{count} reply",
  other: "{count} replies",
  new: "New",
  newCount: "{count} new",
  lastReply: "Last reply {time}",
  lastReplyName: "last reply {time}",
  justNow: "just now",
} satisfies Required<ReplySummaryLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["year", 31_557_600_000],
  ["month", 2_629_800_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** "2 hours ago", "yesterday", "3 weeks ago". A reply from the future (a clock a little behind) and one under a minute old both read `justNow`. */
function ageIn(at: number, now: number, locale: string, justNow: string, style: "long" | "narrow"): string {
  const diff = at - now;
  const unit = UNITS.find(([, size]) => Math.abs(diff) >= size);
  if (!unit || diff >= 0) return justNow;
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto", style });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto", style });
  }
  return words.format(Math.trunc(diff / unit[1]), unit[0]);
}

/** A date in the zone, for the server render and the tooltip. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

function numberIn(value: number, locale: string, options?: Intl.NumberFormatOptions): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return new Intl.NumberFormat("en-US", options).format(value);
  }
}

function pluralIn(count: number, locale: string): Intl.LDMLPluralRule {
  try {
    return new Intl.PluralRules(locale).select(count);
  } catch {
    return new Intl.PluralRules("en-US").select(count);
  }
}

/** The browser's clock, read once the page is live and again only when the reply it measures changes. It never ticks. Null on the server and before hydration, so both write the same text. */
function useClock(fixed: DateInput | undefined, measured: number): number | null {
  const [read, setRead] = useState<number | null>(null);
  useEffect(() => {
    if (fixed === undefined) setRead(Date.now());
  }, [fixed, measured]);
  if (fixed !== undefined) {
    const value = new Date(fixed).getTime();
    if (!Number.isNaN(value)) return value;
  }
  return read;
}

/**
 * The line under a message or comment that points to its thread: up to three
 * small avatars, "5 replies", when the latest one came in, and a chevron. The
 * whole line is one link (with `href`) or one button, and its name says it all
 * in a breath, "View thread, 5 replies, last reply 2 hours ago", so a screen
 * reader never has to piece it together. Unread replies add a "New" marker
 * written in text, and a large count compacts to "1.3k replies". The relative
 * time is read once and does not tick, so the line never shifts under the
 * reader; on hover and focus it makes way for "View thread" without changing
 * its width. The line reads its own column: when it is narrow the time is
 * written short ("2h ago") and the hover swap goes; narrower still the third
 * avatar, the second and the chevron step aside, and when even that is too
 * much the time drops to a second line. The time is never cut off.
 */
export function ReplySummary({ replies, repliers = [], lastReplyAt, unread, href, onOpen, now, locale = "en-US", timeZone = "UTC", labels, className, ...props }: ReplySummaryProps) {
  const text: Required<ReplySummaryLabels> = { ...DEFAULT_LABELS, ...labels };
  const at = lastReplyAt === undefined ? Number.NaN : new Date(lastReplyAt).getTime();
  const known = !Number.isNaN(at);
  const clock = useClock(now, known ? at : 0);

  if (!(replies >= 1)) return null;

  const count = Math.floor(replies);
  const template = pluralIn(count, locale) === "one" ? text.one : text.other;
  // 1,284 is "1.3k" on the line and "1,284" in the name: a screen reader says the number, not a letter.
  const compact = count >= 1000;
  const short = compact ? numberIn(count, locale, { notation: "compact", maximumFractionDigits: 1 }) : numberIn(count, locale);
  const shown = compact && /^en\b/i.test(locale) ? short.replace(/(\d)K$/, "$1k") : short;
  const countText = fill(template, { count: shown });
  const countName = fill(template, { count: numberIn(count, locale) });

  const unreadText = unread === true ? text.new : typeof unread === "number" && unread > 0 ? fill(text.newCount, { count: numberIn(Math.floor(unread), locale) }) : "";
  const timeText = known ? (clock === null ? dateIn(at, locale, timeZone, { day: "numeric", month: "short" }) : ageIn(at, clock, locale, text.justNow, "long")) : "";
  // In a narrow column the same time is written short ("2h ago"), so it still fits whole.
  const timeShort = known && clock !== null ? ageIn(at, clock, locale, text.justNow, "narrow") : timeText;
  const [before = "", after = ""] = text.lastReply.split("{time}");
  const name = [text.view, countName, unreadText, known ? fill(text.lastReplyName, { time: timeText }) : ""].filter(Boolean).join(", ");

  const content = (
    <>
      {repliers.length ? (
        // The overlap is a margin on each avatar after the first, not `space-x`: an avatar that steps aside in a narrow column then takes its overlap with it.
        // Each step is the width the fullest line needs (three avatars, "1.3k replies", a New marker, a short time, the chevron): the third avatar goes below 17.5rem, the second below 16rem, the chevron below 14.5rem.
        <AvatarGroup aria-hidden="true" className="space-x-0 group-hover/reply:*:data-[slot=avatar]:ring-muted group-focus-visible/reply:*:data-[slot=avatar]:ring-muted">
          {repliers.slice(0, 3).map((replier, index) => (
            <Avatar key={`${index}-${replier.name}`} className={cn("data-[size=default]:size-6", index > 0 && "-ms-1", index === 1 && "@max-[16rem]:hidden", index === 2 && "@max-[17.5rem]:hidden")}>
              {replier.image ? <AvatarImage src={replier.image} alt="" /> : null}
              {/* Not the muted tone of the avatar and of the hovered line, or the disc melts into the line under the pointer. */}
              <AvatarFallback className="bg-foreground/10 text-[0.6875rem] font-semibold">{initialsOf(replier.name).slice(0, 1)}</AvatarFallback>
            </Avatar>
          ))}
        </AvatarGroup>
      ) : null}
      <span aria-hidden="true" className="shrink-0 font-medium tracking-[-0.01em] tabular-nums">
        {countText}
      </span>
      {unreadText ? (
        <span aria-hidden="true" className="inline-flex h-[1.125rem] shrink-0 items-center rounded-full bg-foreground px-1.5 text-[0.6875rem] font-semibold text-background">
          {unreadText}
        </span>
      ) : null}
      {known ? (
        // The time is never cut: it keeps its size, and a column too narrow for everything sheds the avatars, then the chevron, and last of all lets the time drop to a second line.
        // "View thread" shares the time's cell only where the column is wide enough to swap it in; narrower, it would only reserve a gap before the chevron.
        <span aria-hidden="true" className="grid shrink-0 text-muted-foreground">
          <span className="col-start-1 row-start-1 whitespace-nowrap transition-opacity duration-150 @min-[24rem]:group-hover/reply:opacity-0 @min-[24rem]:group-focus-visible/reply:opacity-0 motion-reduce:transition-none">
            <span className="@max-[24rem]:hidden">{before}</span>
            <time dateTime={new Date(at).toISOString()} title={dateIn(at, locale, timeZone, { dateStyle: "medium", timeStyle: "short" })} suppressHydrationWarning>
              <span className="@max-[24rem]:hidden">{timeText}</span>
              <span className="hidden @max-[24rem]:inline">{timeShort}</span>
            </time>
            <span className="@max-[24rem]:hidden">{after}</span>
          </span>
          <span className="col-start-1 row-start-1 hidden whitespace-nowrap text-foreground opacity-0 transition-opacity duration-150 group-hover/reply:opacity-100 group-focus-visible/reply:opacity-100 motion-reduce:transition-none @min-[24rem]:block">{text.view}</span>
        </span>
      ) : null}
      <IconChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-150 group-hover/reply:translate-x-0.5 group-hover/reply:text-foreground group-focus-visible/reply:text-foreground motion-reduce:transition-none @max-[14.5rem]:hidden" />
    </>
  );

  const look = cn(
    "group/reply -ms-2 inline-flex max-w-[calc(100%+0.5rem)] min-w-0 flex-wrap items-center gap-x-2 rounded-lg px-2 py-1 text-start text-[0.8125rem] leading-6 text-foreground outline-none",
    "transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
  );

  return (
    <div data-slot="reply-summary" data-unread={unreadText ? "" : undefined} className={cn("@container flex min-w-0", className)} {...props}>
      {href ? (
        <a href={href} aria-label={name} onClick={onOpen} className={look}>
          {content}
        </a>
      ) : (
        <button type="button" aria-label={name} onClick={onOpen} className={look}>
          {content}
        </button>
      )}
    </div>
  );
}
