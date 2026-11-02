"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { countText, dateIn, durationText, fill, type DateInput } from "@rhs-ui/application/class-session-card/format";
import { IconAlertCircle, IconCheck, IconClose, IconPin, IconSpinner, IconUsers } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Progress } from "@rhs-ui/primitives/progress";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { cn } from "@/lib/utils";

/** Where the session stands for the person looking: open to book, full (with a waitlist), booked by them, or cancelled by the host. */
export type ClassSessionStatus = "open" | "full" | "booked" | "cancelled";

/** Who leads the session. */
export interface ClassSessionCoach {
  /** Their name: "Anna de Vries". */
  name: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  image?: string;
}

/** The words the card uses, for translation. `{title}`, `{date}`, `{count}`, `{capacity}` and `{taken}` are filled in. */
export interface ClassSessionCardLabels {
  /** The words of the status badge for a session that is not open. */
  statuses?: Partial<Record<Exclude<ClassSessionStatus, "open">, string>>;
  /** Said to screen readers before the coach. Default "Coach". */
  coach?: string;
  /** Said to screen readers before the room. Default "Room". */
  room?: string;
  /** Said to screen readers before the level. Default "Level". */
  level?: string;
  /** Hours in the length of the session. Default "{count} h". */
  hours?: string;
  /** Minutes in the length of the session. Default "{count} min". */
  minutes?: string;
  /** One spot left. Default "{count} spot left". */
  spotsOne?: string;
  /** Several spots left. Default "{count} spots left". */
  spotsOther?: string;
  /** The capacity, after the spots. Default "of {capacity}". */
  ofCapacity?: string;
  /** What a full session says in place of the spots when it knows its capacity. Default "All {capacity} spots taken". */
  fullOf?: string;
  /** What a full session says when it does not know its capacity. Default "Class full". */
  full?: string;
  /** The word between the two times, said to screen readers. Default "to". */
  to?: string;
  /** The name of the fill bar. Default "Spots taken". */
  bar?: string;
  /** What the fill bar says in words. Default "{taken} of {capacity} spots taken". */
  barValue?: string;
  /** The button of an open session. Default "Book". */
  book?: string;
  /** The name of that button, so a list of them is not a list of "Book". Default "Book {title}, {date}". */
  bookFor?: string;
  /** The button of a full session. Default "Join waitlist". */
  waitlist?: string;
  /** The name of that button; it starts with the words on the button, so it can be spoken to a voice control. Default "Join waitlist for {title}, {date}". */
  waitlistFor?: string;
  /** The button of a session you have booked. Default "Cancel". */
  cancel?: string;
  /** The name of that button. Default "Cancel your booking for {title}, {date}". */
  cancelFor?: string;
  /** Said while a booking is being made. Default "Booking {title}…". */
  booking?: string;
  /** Said while the waitlist is being joined. Default "Joining the waitlist for {title}…". */
  joining?: string;
  /** Said while a booking is being cancelled. Default "Cancelling your booking for {title}…". */
  cancelling?: string;
  /** Said once the session shows as booked. Default "{title} booked.". */
  doneBooked?: string;
  /** Said once a booking is gone. Default "Your booking for {title} is cancelled.". */
  doneCancelled?: string;
  /** Said when the host cancels the session. Default "{title} was cancelled.". */
  sessionCancelled?: string;
  /** Shown and said when a request failed. Default "Could not update your booking for {title}. Nothing was changed.". */
  failed?: string;
}

export interface ClassSessionCardProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** What the class is: "Vinyasa flow". */
  title: string;
  /** When it starts: a Date, a timestamp or an ISO string with its offset ("2026-11-05T18:30:00+01:00"). */
  start: DateInput;
  /** When it ends, in the same forms. The length is worked out from the two. */
  end: DateInput;
  /** Who leads it: a name, or a name with a picture. */
  coach?: string | ClassSessionCoach;
  /** Where it takes place: "Studio 2". */
  room?: string;
  /** How hard it is, in your words: "Beginner", "All levels". */
  level?: string;
  /** How many spots are left. Written "3 spots left"; none left turns an open session into a full one. */
  spots?: number;
  /** How many spots there are in all. Draws the fill bar and writes "of 14". */
  capacity?: number;
  /** Where it stands for the person looking. Default "open". */
  status?: ClassSessionStatus;
  /** The Book button was pressed. May return a promise: the button shows a busy state until it settles, and if it rejects the card says nothing was changed. */
  onBook?: () => void | Promise<void>;
  /** "Join waitlist" was pressed on a full session. Falls back to `onBook` when you leave it out. May return a promise. */
  onWaitlist?: () => void | Promise<void>;
  /** "Cancel" was pressed on a session you have booked. May return a promise. */
  onCancel?: () => void | Promise<void>;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone the session takes place in: every time on the card is written in it. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: ClassSessionCardLabels;
}

const DEFAULT_LABELS = {
  coach: "Coach",
  room: "Room",
  level: "Level",
  hours: "{count} h",
  minutes: "{count} min",
  spotsOne: "{count} spot left",
  spotsOther: "{count} spots left",
  ofCapacity: "of {capacity}",
  fullOf: "All {capacity} spots taken",
  full: "Class full",
  to: "to",
  bar: "Spots taken",
  barValue: "{taken} of {capacity} spots taken",
  book: "Book",
  bookFor: "Book {title}, {date}",
  waitlist: "Join waitlist",
  waitlistFor: "Join waitlist for {title}, {date}",
  cancel: "Cancel",
  cancelFor: "Cancel your booking for {title}, {date}",
  booking: "Booking {title}…",
  joining: "Joining the waitlist for {title}…",
  cancelling: "Cancelling your booking for {title}…",
  doneBooked: "{title} booked.",
  doneCancelled: "Your booking for {title} is cancelled.",
  sessionCancelled: "{title} was cancelled.",
  failed: "Could not update your booking for {title}. Nothing was changed.",
};

const DEFAULT_STATUSES = { full: "Full", booked: "Booked", cancelled: "Cancelled" };

type Action = "book" | "waitlist" | "cancel";

/** Each status has its own glyph, fill and weight, so none depends on colour. */
function definitions(words: typeof DEFAULT_STATUSES): Record<string, StatusDefinition> {
  return {
    full: { label: words.full, glyph: <IconUsers />, emphasis: "outline" },
    booked: { label: words.booked, glyph: <IconCheck />, emphasis: "strong" },
    cancelled: { label: words.cancelled, glyph: <IconClose />, emphasis: "quiet" },
  };
}

/** The little calendar page: the month in a band, the day large, the weekday under it. Decorative: the date is written out for screen readers. */
function Leaf({ month, day, weekday, quiet }: { month: string; day: string; weekday: string; quiet: boolean }) {
  return (
    <span aria-hidden="true" className="flex w-14 shrink-0 flex-col self-start overflow-hidden rounded-lg border border-border bg-background text-center shadow-xs">
      <span className={cn("py-0.5 text-[0.6875rem] leading-4 font-medium tracking-[0.08em] uppercase", quiet ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>{month}</span>
      <span className={cn("pt-1.5 text-2xl leading-7 font-semibold tracking-[-0.04em] tabular-nums", quiet && "text-muted-foreground")}>{day}</span>
      <span className="pt-0.5 pb-1.5 text-[0.6875rem] leading-4 font-medium tracking-[0.08em] text-muted-foreground uppercase">{weekday}</span>
    </span>
  );
}

/**
 * A class or session you can book, for a gym, a studio, a school or a
 * workshop: a calendar leaf with the day, the title, the time with the length
 * worked out from start and end, who leads it, where, and how hard it is.
 * Under it, the spots left are written ("3 spots left of 14") beside a fill
 * bar that is a real progress bar, and the action follows the state: Book for
 * an open session, Join waitlist for a full one, Cancel for one you have
 * booked, with "Booked" as a badge with its own glyph. A cancelled session is
 * muted and struck through and loses its action. The actions may return a
 * promise: the button shows a busy state, a failure says that nothing was
 * changed, and each result is announced politely.
 */
export function ClassSessionCard({
  title,
  start,
  end,
  coach,
  room,
  level,
  spots,
  capacity,
  status = "open",
  onBook,
  onWaitlist,
  onCancel,
  headingLevel = 3,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: ClassSessionCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const statuses = definitions({ ...DEFAULT_STATUSES, ...labels?.statuses });
  const titleId = useId();
  const left = spots === undefined ? undefined : Math.max(0, Math.round(spots));
  const shown: ClassSessionStatus = status === "open" && left === 0 ? "full" : status;
  const previous = useRef(shown);
  const [pending, setPending] = useState<Action | null>(null);
  const [failed, setFailed] = useState(false);
  const [said, setSaid] = useState("");

  // A change of state that came from outside (the booking went through, the host cancelled) is said once, politely.
  useEffect(() => {
    const was = previous.current;
    previous.current = shown;
    if (was === shown) return;
    if (shown === "booked") setSaid(fill(text.doneBooked, { title }));
    else if (shown === "cancelled") setSaid(fill(text.sessionCancelled, { title }));
    else if (was === "booked") setSaid(fill(text.doneCancelled, { title }));
    setFailed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only a change of state is announced, not a change of words
  }, [shown]);

  const startAt = new Date(start).getTime();
  const rawEnd = new Date(end).getTime();
  if (Number.isNaN(startAt) || Number.isNaN(rawEnd)) return null;
  const endAt = Math.max(startAt, rawEnd);

  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const lead = typeof coach === "string" ? { name: coach } : coach;
  const cancelled = shown === "cancelled";
  const clock = { hour: "numeric", minute: "2-digit" } as const;
  const startText = dateIn(startAt, locale, timeZone, clock);
  const endText = dateIn(endAt, locale, timeZone, clock);
  const length = durationText(Math.max(1, Math.round((endAt - startAt) / 60_000)), text.hours, text.minutes);
  // Some languages abbreviate with a full stop ("nov."); on a leaf that is noise.
  const month = dateIn(startAt, locale, timeZone, { month: "short" }).replace(/\.$/, "");
  const when = `${dateIn(startAt, locale, timeZone, { weekday: "short", day: "numeric", month: "short" })}, ${startText}`;

  const action: Action | null = shown === "open" && onBook ? "book" : shown === "full" && (onWaitlist ?? onBook) ? "waitlist" : shown === "booked" && onCancel ? "cancel" : null;
  const handler = action === "book" ? onBook : action === "waitlist" ? (onWaitlist ?? onBook) : action === "cancel" ? onCancel : undefined;

  const taken = capacity === undefined ? undefined : Math.min(capacity, Math.max(0, shown === "full" && left === undefined ? capacity : capacity - (left ?? 0)));
  const showSpots = !cancelled && (left !== undefined || shown === "full");
  const showFooter = showSpots || action !== null;
  // No place left, whether the session is full or the last one is yours: said in words of its own, not as "full of 16".
  const none = shown === "full" || left === 0;

  async function run() {
    if (!action || !handler || pending) return;
    setFailed(false);
    setPending(action);
    setSaid(fill(action === "book" ? text.booking : action === "waitlist" ? text.joining : text.cancelling, { title }));
    try {
      await handler();
      setSaid("");
    } catch {
      setFailed(true);
      setSaid("");
    } finally {
      setPending(null);
    }
  }

  const struck = "line-through decoration-muted-foreground/60";

  return (
    <article
      data-slot="class-session-card"
      data-status={shown}
      aria-labelledby={titleId}
      aria-busy={pending ? true : undefined}
      className={cn("@container flex min-w-0 flex-col overflow-hidden rounded-xl border border-border text-card-foreground shadow-xs", cancelled ? "bg-muted/40" : "bg-card", className)}
      {...props}
    >
      <div className="flex gap-4 p-5">
        <Leaf month={month} day={dateIn(startAt, locale, timeZone, { day: "numeric" })} weekday={dateIn(startAt, locale, timeZone, { weekday: "short" }).replace(/\.$/, "")} quiet={cancelled} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1.5">
            <Heading id={titleId} className={cn("min-w-0 flex-1 basis-36 text-[0.9375rem] leading-6 font-semibold tracking-[-0.01em] [overflow-wrap:anywhere]", cancelled && cn("text-muted-foreground", struck))}>
              {title}
            </Heading>
            {shown !== "open" ? <StatusBadge status={shown} statuses={statuses} size="md" /> : null}
          </div>

          <p className={cn("mt-0.5 text-sm leading-5 tabular-nums", cancelled ? cn("text-muted-foreground", struck) : "font-medium")}>
            <span className="sr-only">{dateIn(startAt, locale, timeZone, { weekday: "long", day: "numeric", month: "long" })}, </span>
            {/* Each time is one unbreakable piece, so on a narrow card the line folds between them and never inside "6:30 PM". */}
            <time dateTime={new Date(startAt).toISOString()} className="whitespace-nowrap">
              {startText}
            </time>
            <span aria-hidden="true" className="mx-1">–</span>
            <span className="sr-only"> {text.to} </span>
            <time dateTime={new Date(endAt).toISOString()} className="whitespace-nowrap">
              {endText}
            </time>
            <span className={cn("font-normal", !cancelled && "text-muted-foreground")}>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span className="sr-only">, </span>
              <span className="whitespace-nowrap">{length}</span>
            </span>
          </p>

          {lead || room || level ? (
            <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.8125rem] leading-5">
              {lead ? (
                <div className="flex min-w-0 items-center gap-2">
                  <dt className="sr-only">{text.coach}</dt>
                  <dd className="flex min-w-0 items-center gap-2">
                    <Avatar size="sm" className="size-6 data-[size=sm]:size-6">
                      {lead.image ? <AvatarImage src={lead.image} alt="" /> : null}
                      <AvatarFallback className="text-[0.625rem]">{initialsOf(lead.name)}</AvatarFallback>
                    </Avatar>
                    <span className={cn("min-w-0 truncate", cancelled && "text-muted-foreground")}>{lead.name}</span>
                  </dd>
                </div>
              ) : null}
              {room ? (
                <div className="flex min-w-0 items-center">
                  <dt className="sr-only">{text.room}</dt>
                  <dd className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                    <IconPin className="size-4 shrink-0" />
                    <span className="min-w-0 truncate">{room}</span>
                  </dd>
                </div>
              ) : null}
              {level ? (
                <div className="min-w-0 max-w-full">
                  <dt className="sr-only">{text.level}</dt>
                  <dd className="min-w-0">
                    <Badge variant="outline" className={cn("max-w-full", cancelled && "text-muted-foreground")}>
                      <span className="min-w-0 truncate">{level}</span>
                    </Badge>
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
      </div>

      {failed ? (
        <div role="alert" className="mx-5 mb-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-[0.8125rem] leading-5">
          <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p className="min-w-0 flex-1 font-medium [overflow-wrap:anywhere]">{fill(text.failed, { title })}</p>
        </div>
      ) : null}

      {showFooter ? (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border bg-muted/30 px-5 py-3.5">
          {showSpots ? (
            <div className="min-w-0 flex-1 basis-40">
              <p className="flex flex-wrap items-baseline gap-x-1.5 text-sm leading-5 tabular-nums">
                {none ? (
                  <span className="font-semibold">{capacity !== undefined ? fill(text.fullOf, { capacity: countText(capacity, locale) }) : text.full}</span>
                ) : (
                  <>
                    <span className="font-semibold">{fill(left === 1 ? text.spotsOne : text.spotsOther, { count: countText(left ?? 0, locale) })}</span>
                    {capacity !== undefined ? <span className="text-muted-foreground">{fill(text.ofCapacity, { capacity: countText(capacity, locale) })}</span> : null}
                  </>
                )}
              </p>
              {capacity !== undefined && taken !== undefined ? (
                <Progress value={taken} max={capacity} aria-label={text.bar} getValueLabel={() => fill(text.barValue, { taken: countText(taken, locale), capacity: countText(capacity, locale) })} className="mt-2 h-1.5 max-w-56" />
              ) : null}
            </div>
          ) : null}
          {action ? (
            <Button
              type="button"
              size="sm"
              variant={action === "book" ? "default" : "outline"}
              aria-busy={pending ? true : undefined}
              aria-label={fill(action === "book" ? text.bookFor : action === "waitlist" ? text.waitlistFor : text.cancelFor, { title, date: when })}
              onClick={() => void run()}
              className={cn("ml-auto shrink-0", pending && "pointer-events-none")}
            >
              {pending ? <IconSpinner /> : null}
              {action === "book" ? text.book : action === "waitlist" ? text.waitlist : text.cancel}
            </Button>
          ) : null}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {said}
      </p>
    </article>
  );
}
