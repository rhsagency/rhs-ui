"use client";

import { useEffect, useId, useState, type ComponentProps, type MouseEvent } from "react";

import { IconPaperclip, IconStar } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** The colours a label can have, as steps of the page's own ink. A label always shows its name beside its mark. */
export type InboxTone = "ink" | "graphite" | "stone" | "mist";

/** A label on a message. */
export interface InboxLabel {
  /** Its name: "Billing", "VIP". It is always written out. */
  name: string;
  /** The tone of the mark beside the name. Default "stone". */
  tone?: InboxTone;
}

/** The message a row shows. */
export interface InboxMessage {
  /** A stable identity: the key of the row in its list. */
  id: string;
  /** Who sent it, a person or a company. Cut to one line. */
  sender: string;
  /** The sender's picture. Initials stand in while it loads, or when there is none. */
  image?: string;
  /** The subject. Cut to one line, with room kept for the time. */
  subject: string;
  /** The start of the text. Cut to one line. */
  snippet?: string;
  /** When it arrived: a Date, a timestamp or an ISO string. */
  time: DateInput;
  /** Not opened yet: heavier type, a dot, and the word "Unread" for screen readers. */
  unread?: boolean;
  /** Starred. The star is a toggle with `aria-pressed`. */
  starred?: boolean;
  /** It has files attached: a paperclip, and "Has attachment" for screen readers. */
  attachment?: boolean;
  /** Its labels. The first two are drawn when there is room, and all of them are always named for screen readers. */
  labels?: readonly InboxLabel[];
  /** Its page. The row becomes a link. */
  href?: string;
}

/** The words the row uses, for translation. `{subject}` and `{sender}` are filled in. */
export interface InboxRowLabels {
  /** Read before an unread message, next to the dot. Default "Unread". */
  unread?: string;
  /** Read beside the paperclip. Default "Has attachment". */
  attachment?: string;
  /** The star's name, followed by the subject. Default "Star". */
  star?: string;
  /** The checkbox's name, followed by the sender and subject. Default "Select message". */
  select?: string;
  /** Read before the labels. Default "Labels". */
  labels?: string;
}

export interface InboxRowProps extends Omit<ComponentProps<"li">, "children" | "onSelect"> {
  /** The message to show. */
  message: InboxMessage;
  /** Whether the row is ticked, for bulk actions. A filled surface. */
  selected?: boolean;
  /** The checkbox was pressed, with the state it asks for. It is its own control: it never opens the message. Leave it out for no checkbox. */
  onSelect?: (selected: boolean) => void;
  /** The row was opened. With `message.href` it runs on the link and receives the event, so a client-side router can call `preventDefault()`. Without an href it makes the row a button. */
  onOpen?: (message: InboxMessage, event: MouseEvent<HTMLElement>) => void;
  /** The star was pressed, with the state it asks for. It is its own control, like the checkbox. Leave it out for no star. */
  onStar?: (starred: boolean) => void;
  /** `comfortable` is three lines with a round avatar; `compact` is one line in a wide list and two in a narrow one. Default "comfortable". */
  density?: "comfortable" | "compact";
  /** Draws the sender's avatar. Default true when comfortable and false when compact. */
  showAvatar?: boolean;
  /** The moment the time is measured from, to tell today from earlier. Leave it out to use the browser's clock, read once the page is live; pass it to get the right words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are compared, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the row uses, for translation. */
  labels?: InboxRowLabels;
}

const DOTS: Record<InboxTone, string> = {
  ink: "bg-foreground",
  graphite: "bg-foreground/70",
  stone: "bg-foreground/45",
  mist: "bg-foreground/25",
};

const DAY = 86_400_000;

/** A date in the zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function dateIn(at: number, locale: string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
}

/** The calendar day a moment falls on in the zone, as a number of days and a year, so "today" is a day and not 24 hours. */
function dayOf(at: number, timeZone: string): { day: number; year: number } {
  const [year = 0, month = 1, day = 1] = dateIn(at, "en-CA", timeZone, { year: "numeric", month: "2-digit", day: "2-digit" }).split("-").map(Number);
  return { day: Date.UTC(year, month - 1, day) / DAY, year };
}

/**
 * The time a row shows: a clock time for today, the weekday for the last six
 * days, then the date. Before the browser's clock is known (the server, the
 * first paint) it writes the date, which reads the same everywhere.
 */
function describe(at: number, now: number | null, locale: string, timeZone: string): string {
  if (now === null) return dateIn(at, locale, timeZone, { day: "numeric", month: "short" });
  const then = dayOf(at, timeZone);
  const today = dayOf(now, timeZone);
  const gap = today.day - then.day;
  if (gap === 0) return dateIn(at, locale, timeZone, { hour: "numeric", minute: "2-digit" });
  if (gap > 0 && gap < 7) return dateIn(at, locale, timeZone, { weekday: "short" });
  return dateIn(at, locale, timeZone, then.year === today.year ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}

/** The browser's clock, once the page is live and then every minute, so "today" turns into a weekday at midnight. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined;
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned]);
  if (fixed === undefined) return tick;
  const value = new Date(fixed).getTime();
  return Number.isNaN(value) ? tick : value;
}

// One step above the row's content (avatar, text, time, labels), so a press anywhere on them lands on the link. The checkbox and the star sit at z-10: they are separate controls above it.
const OVERLAY = "absolute inset-0 z-[1] outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50";

/**
 * One row of an inbox, a support queue or a message archive: a checkbox to
 * select it, a star, the sender, a bold subject, a one-line snippet, labels, a
 * paperclip and the time. An unread message is set in heavier type with a dot
 * and the word "Unread" for screen readers; a long subject is cut and keeps
 * room for the time. The whole row opens the message, laid under the checkbox
 * and the star, which are separate tab stops, so a press on them never opens
 * it. The row reads its own width: comfortable is three lines with an avatar,
 * compact is one line in a wide list and two in a narrow one. Put the rows in a
 * `ul`.
 */
export function InboxRow({
  message,
  selected = false,
  onSelect,
  onOpen,
  onStar,
  density = "comfortable",
  showAvatar,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: InboxRowProps) {
  const text: Required<InboxRowLabels> = { unread: "Unread", attachment: "Has attachment", star: "Star", select: "Select message", labels: "Labels", ...labels };
  const uid = useId();
  const unreadId = `${uid}-unread`;
  const senderId = `${uid}-sender`;
  const subjectId = `${uid}-subject`;
  const compact = density === "compact";
  const avatar = showAvatar ?? !compact;
  const clock = useNow(now);
  const at = new Date(message.time).getTime();
  const valid = !Number.isNaN(at);
  const unread = Boolean(message.unread);
  const starred = Boolean(message.starred);
  const messageLabels = message.labels ?? [];
  const shown = messageLabels.slice(0, 2);
  const rest = messageLabels.length - shown.length;

  // The grid is laid out by named areas, so each element says where it goes and the template says how many lines there are.
  const grid = compact
    ? avatar
      ? "grid-cols-[1.5rem_1.5rem_minmax(0,1fr)_auto] [grid-template-areas:'check_avatar_sender_time'_'star_avatar_text_text'] @2xl:grid-cols-[1.5rem_1.5rem_1.5rem_12rem_minmax(0,1fr)_auto_1.25rem_4.5rem] @2xl:[grid-template-areas:'check_star_avatar_sender_text_labels_clip_time']"
      : "grid-cols-[1.5rem_minmax(0,1fr)_auto] [grid-template-areas:'check_sender_time'_'star_text_text'] @2xl:grid-cols-[1.5rem_1.5rem_12rem_minmax(0,1fr)_auto_1.25rem_4.5rem] @2xl:[grid-template-areas:'check_star_sender_text_labels_clip_time']"
    : avatar
      ? "grid-cols-[1.5rem_2.25rem_minmax(0,1fr)_auto] [grid-template-areas:'check_avatar_sender_time'_'star_avatar_subject_subject'_'._avatar_snippet_snippet']"
      : "grid-cols-[1.5rem_minmax(0,1fr)_auto] [grid-template-areas:'check_sender_time'_'star_subject_subject'_'._snippet_snippet']";

  const sender = (
    <span id={senderId} className={cn("min-w-0 truncate text-sm leading-5 [grid-area:sender]", unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
      {message.sender}
    </span>
  );

  // Where there is no room the list is not drawn but stays in the accessibility tree (sr-only, not display:none), so the labels are always named.
  const labelList = messageLabels.length ? (
    <ul aria-label={text.labels} className={cn("flex min-w-0 items-center gap-1 overflow-hidden", compact ? "[grid-area:labels] @max-2xl:sr-only" : "shrink-0 @max-md:sr-only")}>
      {shown.map((label) => (
        <li key={label.name} className="shrink-0">
          <Badge variant="outline" className="h-[1.125rem] gap-1.5 px-1.5 text-[0.6875rem] text-foreground">
            <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", DOTS[label.tone ?? "stone"])} />
            {label.name}
          </Badge>
        </li>
      ))}
      {rest > 0 ? (
        <li className="shrink-0">
          <Badge variant="muted" className="h-[1.125rem] px-1.5 text-[0.6875rem]" title={messageLabels.slice(2).map((label) => label.name).join(", ")}>
            +{rest}
            <span className="sr-only">: {messageLabels.slice(2).map((label) => label.name).join(", ")}</span>
          </Badge>
        </li>
      ) : null}
    </ul>
  ) : null;

  // Hidden from the tree on purpose: the row's link carries the word in its name, and a second "Unread" beside it would be said twice.
  const unreadMark = unread ? (
    <span id={unreadId} aria-hidden="true" className="sr-only">
      {text.unread}.{" "}
    </span>
  ) : null;
  const name = [unread ? unreadId : null, senderId, subjectId].filter(Boolean).join(" ");
  const overlay = message.href ? (
    <a href={message.href} aria-labelledby={name} onClick={(event) => onOpen?.(message, event)} className={OVERLAY} />
  ) : onOpen ? (
    <button type="button" aria-labelledby={name} onClick={(event) => onOpen(message, event)} className={cn(OVERLAY, "block size-full cursor-pointer")} />
  ) : null;

  return (
    <li
      data-slot="inbox-row"
      data-density={density}
      data-unread={unread ? "" : undefined}
      data-selected={selected ? "" : undefined}
      className={cn(
        "@container group/inbox-row relative transition-colors duration-150 motion-reduce:transition-none",
        selected ? "bg-muted" : unread ? "bg-card hover:bg-muted/60" : "bg-muted/35 hover:bg-muted/60",
        className,
      )}
      {...props}
    >
      {overlay}
      {unread ? <span aria-hidden="true" className={cn("pointer-events-none absolute start-1.5 size-2 rounded-full bg-foreground", compact ? "top-4 @2xl:top-[1.125rem]" : "top-5")} /> : null}
      {unreadMark}
      <div className={cn("relative grid items-start gap-x-3 px-4", grid, compact ? "gap-y-0 py-2.5 @2xl:items-center @2xl:py-0 @2xl:min-h-11" : "gap-y-0.5 py-3.5")}>
        {onSelect ? (
          <div className="relative z-10 flex h-5 items-center justify-center [grid-area:check]">
            <Checkbox
              checked={selected}
              onCheckedChange={(value) => onSelect(value === true)}
              aria-label={`${text.select}: ${message.sender}, ${message.subject}`}
              className="relative after:absolute after:-inset-1.5 after:content-['']"
            />
          </div>
        ) : null}
        {onStar ? (
          <div className="relative z-10 flex h-5 items-center justify-center [grid-area:star]">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-pressed={starred}
              aria-label={`${text.star}: ${message.subject}`}
              onClick={() => onStar(!starred)}
              className={cn("size-6 text-muted-foreground/80 hover:text-foreground", starred && "text-foreground")}
            >
              <IconStar className={cn("size-4", starred && "fill-current")} />
            </Button>
          </div>
        ) : null}

        {/* On a selected row the surface is the avatar's own grey, so the circle is drawn in the page colour to stay a circle. */}
        {avatar ? (
          <Avatar aria-hidden="true" className={cn("[grid-area:avatar]", compact ? "size-6 self-center data-[size=default]:size-6" : "data-[size=default]:size-9", selected && "bg-background")}>
            {message.image ? <AvatarImage src={message.image} alt="" /> : null}
            <AvatarFallback className={cn(compact && "text-[0.625rem]", selected && "bg-background")}>{initialsOf(message.sender)}</AvatarFallback>
          </Avatar>
        ) : null}

        {compact ? (
          <>
            {sender}
            <p className="min-w-0 truncate text-sm leading-5 [grid-area:text]">
              <span id={subjectId} className={cn("text-foreground", unread ? "font-semibold" : "font-normal")}>
                {message.subject}
              </span>
              {message.snippet ? (
                <>
                  {" "}
                  <span className="ms-1 text-muted-foreground">{message.snippet}</span>
                </>
              ) : null}
            </p>
            {labelList}
          </>
        ) : (
          <>
            <div className="flex min-w-0 items-center gap-2 [grid-area:sender]">
              <span id={senderId} className={cn("min-w-0 truncate text-sm leading-5", unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                {message.sender}
              </span>
              {labelList}
            </div>
            <p id={subjectId} className={cn("min-w-0 truncate text-sm leading-5 [grid-area:subject]", unread ? "font-semibold text-foreground" : "text-foreground")}>
              {message.subject}
            </p>
            {message.snippet ? <p className="min-w-0 truncate text-sm leading-5 text-muted-foreground [grid-area:snippet]">{message.snippet}</p> : null}
          </>
        )}

        {message.attachment || valid ? (
          // The paperclip and the time share the top right corner; in a wide compact row they split into two columns.
          <div className={cn("flex h-5 items-center justify-end gap-2 [grid-area:time]", compact && "@2xl:contents")}>
            {message.attachment ? (
              <span className={cn("flex items-center justify-end text-muted-foreground", compact && "@2xl:[grid-area:clip]")}>
                <IconPaperclip aria-hidden="true" className="size-3.5" />
                <span className="sr-only">{text.attachment}</span>
              </span>
            ) : null}
            {valid ? (
              <time
                dateTime={new Date(at).toISOString()}
                title={dateIn(at, locale, timeZone, { dateStyle: "medium", timeStyle: "short" })}
                suppressHydrationWarning
                className={cn("justify-self-end text-xs leading-5 whitespace-nowrap tabular-nums", compact && "@2xl:[grid-area:time]", unread ? "font-semibold text-foreground" : "text-muted-foreground")}
              >
                {describe(at, clock, locale, timeZone)}
              </time>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}
