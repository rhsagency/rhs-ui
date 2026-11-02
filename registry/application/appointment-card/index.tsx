"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { AddToCalendarButton } from "@rhs-ui/application/add-to-calendar-button";
import { dateIn, dayNumber, durationText, fill, sameWallClock, zoneName, type DateInput } from "@rhs-ui/application/appointment-card/format";
import { IconCheck, IconClock, IconClose, IconExternal, IconMoreHorizontal, IconPin, IconVideo } from "@rhs-ui/icons";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@rhs-ui/primitives/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { cn } from "@/lib/utils";

/** Where an appointment stands. An appointment that has already happened reads "Completed" whatever it was. */
export type AppointmentStatus = "confirmed" | "pending" | "cancelled";

/** Who the appointment is with. */
export interface AppointmentPerson {
  /** Their name: "Dr. Mara Okafor". */
  name: string;
  /** What they are: "Cardiologist". */
  role?: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  image?: string;
}

/** Where it takes place. A `url` makes it an online appointment, an `address` an appointment on site. */
export interface AppointmentLocation {
  /** A street address: "Prinsengracht 212, 1016 HD Amsterdam". The part before the first comma is the line that stands out. */
  address?: string;
  /** A video link. It is a link while the appointment is still to come. */
  url?: string;
}

/** The actions a person can take. An action you leave out has no button. */
export interface AppointmentActions {
  /** Reschedule was pressed. */
  onReschedule?: () => void;
  /**
   * Cancel was confirmed in the dialog. While the promise runs the dialog shows a busy state; if it rejects the dialog stays open and says that nothing was
   * changed. Once it resolves the card shows itself cancelled, whatever `status` says, until `status` changes.
   */
  onCancel?: () => void | Promise<void>;
  /** Offer "Add to calendar" (Google, Outlook, Apple and an .ics file), built from the appointment itself. Default true. */
  calendar?: boolean;
}

/** The words the card uses, for translation. `{title}`, `{person}`, `{date}` and `{count}` are filled in. */
export interface AppointmentCardLabels {
  /** The words of the status badge. */
  statuses?: Partial<Record<AppointmentStatus | "completed" | "expired", string>>;
  /** The mark of an appointment with a video link. Default "Online". */
  online?: string;
  /** The mark of an appointment at an address. Default "On site". */
  onSite?: string;
  /** The video link. Default "Join video call". */
  joinCall?: string;
  /** The line above a video link that is not a link yet. Default "Video call". */
  videoCall?: string;
  /** Read after the link, so nobody is surprised by a new tab. Default "opens in a new tab". */
  newTab?: string;
  /** Said to screen readers before the person. Default "With". */
  with?: string;
  /** Said to screen readers before the place. Default "Where". */
  where?: string;
  /** Hours in the length of the appointment. Default "{count} h". */
  hours?: string;
  /** Minutes in the length of the appointment. Default "{count} min". */
  minutes?: string;
  /** The button. Default "Reschedule". */
  reschedule?: string;
  /** The name of the menu button, followed by the title. Default "More actions for {title}". */
  more?: string;
  /** The menu entry that starts cancelling. Default "Cancel appointment". */
  cancel?: string;
  /** The question in the dialog. Default "Cancel this appointment?". */
  confirmTitle?: string;
  /** Under it. Default "{title} with {person} on {date} will be cancelled. You can book a new time whenever you like.". */
  confirmBody?: string;
  /** Under it, when there is nobody to name. Default "{title} on {date} will be cancelled. You can book a new time whenever you like.". */
  confirmBodyAlone?: string;
  /** The safe answer. Default "Keep appointment". */
  keep?: string;
  /** The confirming answer. Default "Cancel appointment". */
  confirm?: string;
  /** While it runs. Default "Cancelling…". */
  cancelling?: string;
  /** When `onCancel` rejected. Default "Could not cancel the appointment. Nothing was changed.". */
  failed?: string;
  /** Said once it is cancelled. Default "Appointment cancelled.". */
  cancelled?: string;
}

export interface AppointmentCardProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** What the appointment is: "Quarterly check-up". */
  title: string;
  /** When it starts: a Date, a timestamp or an ISO string with its offset ("2026-11-05T10:00:00+01:00"). */
  start: DateInput;
  /** When it ends, in the same forms. */
  end: DateInput;
  /** Who it is with. */
  person?: AppointmentPerson;
  /** Where it takes place. */
  location?: AppointmentLocation;
  /** Where it stands. Default "confirmed". */
  status?: AppointmentStatus;
  /** What the person can do: reschedule, cancel (after a confirmation) and add to a calendar. */
  actions?: AppointmentActions;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment that decides whether it is over. Leave it out to use the browser's clock, read once the page is live; pass it to get the same card in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone the appointment takes place in, "Europe/Amsterdam": every time on the card is written in it. Default "UTC". */
  timeZone?: string;
  /** The time zone of the person looking at the card. When it tells another time than `timeZone` does, the card names the zone ("10:00 – 10:45 GMT-5"). Leave it out to read it from the browser once the page is live. */
  readerTimeZone?: string;
  /** The words the card uses, for translation. */
  labels?: AppointmentCardLabels;
}

const DEFAULT_LABELS = {
  online: "Online",
  onSite: "On site",
  joinCall: "Join video call",
  videoCall: "Video call",
  newTab: "opens in a new tab",
  with: "With",
  where: "Where",
  hours: "{count} h",
  minutes: "{count} min",
  reschedule: "Reschedule",
  more: "More actions for {title}",
  cancel: "Cancel appointment",
  confirmTitle: "Cancel this appointment?",
  confirmBody: "{title} with {person} on {date} will be cancelled. You can book a new time whenever you like.",
  confirmBodyAlone: "{title} on {date} will be cancelled. You can book a new time whenever you like.",
  keep: "Keep appointment",
  confirm: "Cancel appointment",
  cancelling: "Cancelling…",
  failed: "Could not cancel the appointment. Nothing was changed.",
  cancelled: "Appointment cancelled.",
};

const DEFAULT_STATUSES = { confirmed: "Confirmed", pending: "Awaiting confirmation", cancelled: "Cancelled", completed: "Completed", expired: "Expired" };

type Shown = keyof typeof DEFAULT_STATUSES;

/** Each status has its own glyph, fill and weight, so none depends on colour. */
function definitions(words: Record<Shown, string>): Record<Shown, StatusDefinition> {
  return {
    confirmed: { label: words.confirmed, glyph: <IconCheck />, emphasis: "soft" },
    pending: { label: words.pending, glyph: <IconClock />, emphasis: "outline", className: "border-dashed" },
    cancelled: { label: words.cancelled, glyph: <IconClose />, emphasis: "quiet" },
    completed: { label: words.completed, glyph: <IconCheck />, emphasis: "quiet" },
    expired: { label: words.expired, glyph: <IconClock />, emphasis: "quiet" },
  };
}

/** The browser's clock, once the page is live and then every minute while it is needed. Null on the server and before hydration, so both write the same card. */
function useNow(fixed: DateInput | undefined): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined && !Number.isNaN(new Date(fixed).getTime());
  useEffect(() => {
    if (pinned) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned]);
  return pinned ? new Date(fixed as DateInput).getTime() : tick;
}

/** The time zone of the browser, read once the page is live. Null on the server and before hydration. */
function useBrowserZone(fixed: string | undefined): string | null {
  const [zone, setZone] = useState<string | null>(null);
  useEffect(() => {
    if (fixed === undefined) setZone(new Intl.DateTimeFormat("en-US").resolvedOptions().timeZone);
  }, [fixed]);
  return fixed ?? zone;
}

/** The little calendar page: the month in a band, the day large underneath. Decorative: the date is written out beside it. */
function Leaf({ at, locale, timeZone, quiet }: { at: number; locale: string; timeZone: string; quiet: boolean }) {
  // Some languages abbreviate with a full stop ("nov."); on a tile that is noise.
  const month = dateIn(at, locale, timeZone, { month: "short" }).replace(/\.$/, "");
  return (
    <span aria-hidden="true" className="flex w-14 shrink-0 flex-col self-start overflow-hidden rounded-lg border border-border bg-background text-center shadow-xs">
      <span className={cn("py-0.5 text-[0.6875rem] leading-4 font-medium tracking-[0.08em] uppercase", quiet ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>{month}</span>
      <span className={cn("py-1.5 text-2xl leading-7 font-semibold tracking-[-0.04em] tabular-nums", quiet && "text-muted-foreground")}>{dateIn(at, locale, timeZone, { day: "numeric" })}</span>
    </span>
  );
}

/** A button that is busy stays focusable: aria-disabled, never disabled, which would drop the keyboard's focus to the page. */
const INERT = "aria-disabled:pointer-events-none aria-disabled:opacity-50";

/** The 36px square that leads a row: the person's avatar, or a tile with the glyph of the place. */
const TILE = "grid size-9 shrink-0 place-items-center rounded-full border border-border bg-muted text-muted-foreground [&_svg]:size-4";

/**
 * An appointment to come, as one card: a calendar leaf with the month and
 * the day, the title, the date, the time range with its length and, when the
 * reader is in another zone, the name of the zone it is written in. Under it
 * come the status as a badge with its own glyph and the mark "Online" or "On
 * site", who it is with and where, and the actions: Reschedule, Add to
 * calendar (an .ics file and links for Google and Outlook, built from the
 * appointment) and, in a menu, Cancel, which asks first in a dialog whose
 * safe answer has the focus and which keeps the card as it was if it fails.
 * An appointment that is over mutes and says "Completed"; a cancelled one
 * mutes and strikes its time. Both lose their actions.
 */
export function AppointmentCard({
  title,
  start,
  end,
  person,
  location,
  status = "confirmed",
  actions,
  headingLevel = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  readerTimeZone,
  labels,
  className,
  ...props
}: AppointmentCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const statuses = definitions({ ...DEFAULT_STATUSES, ...labels?.statuses });
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const menu = useRef<HTMLButtonElement>(null);
  const clock = useNow(now);
  const browserZone = useBrowserZone(readerTimeZone);
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  // A cancel that went through stands until the status you pass changes to something other than cancelled. A parent that flips `status` to "cancelled"
  // inside onCancel must not wipe the announcement it is about to get: the words are written a moment after the status changes.
  useEffect(() => {
    if (status !== "cancelled") setDone(false);
  }, [status]);

  const startAt = new Date(start).getTime();
  const rawEnd = new Date(end).getTime();
  if (Number.isNaN(startAt) || Number.isNaN(rawEnd)) return null;
  const endAt = Math.max(startAt, rawEnd);

  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const cancelled = done || status === "cancelled";
  const over = clock !== null && endAt < clock;
  const shown: Shown = cancelled ? "cancelled" : over ? (status === "pending" ? "expired" : "completed") : status;
  const quiet = cancelled || over;
  const online = Boolean(location?.url);
  const foreign = browserZone !== null && !sameWallClock(startAt, timeZone, browserZone);

  const clockFormat = { hour: "numeric", minute: "2-digit" } as const;
  const startText = dateIn(startAt, locale, timeZone, clockFormat);
  const sameDay = dayNumber(startAt, timeZone) === dayNumber(endAt, timeZone);
  const endText = dateIn(endAt, locale, timeZone, sameDay ? clockFormat : { weekday: "short", day: "numeric", month: "short", ...clockFormat });
  const dateText = dateIn(startAt, locale, timeZone, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const length = durationText(Math.max(1, Math.round((endAt - startAt) / 60_000)), text.hours, text.minutes);

  const [street, ...rest] = (location?.address ?? "").split(",");
  const upcoming = !quiet;
  const canReschedule = upcoming && actions?.onReschedule !== undefined;
  const canCancel = upcoming && actions?.onCancel !== undefined;
  const canCalendar = upcoming && actions?.calendar !== false;
  const hasActions = canReschedule || canCalendar;

  async function cancel() {
    setBusy(true);
    setFailed(false);
    try {
      await actions?.onCancel?.();
      setDone(true);
      setAsking(false);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const row = (label: string, children: ReactNode) => (
    <div className="flex items-center gap-3">
      <dt className="sr-only">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-3">{children}</dd>
    </div>
  );

  return (
    <article
      data-slot="appointment-card"
      data-status={shown}
      aria-labelledby={titleId}
      className={cn("flex flex-col overflow-hidden rounded-xl border border-border text-card-foreground shadow-xs", quiet ? "bg-muted/40" : "bg-card", className)}
      {...props}
    >
      <div className="flex gap-4 p-5 pb-4">
        <Leaf at={startAt} locale={locale} timeZone={timeZone} quiet={quiet} />
        <div className="min-w-0 flex-1">
          <Heading ref={heading} id={titleId} tabIndex={-1} className={cn("text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em] outline-none [overflow-wrap:anywhere]", quiet && "text-muted-foreground")}>
            {title}
          </Heading>
          <p className={cn("mt-1 text-sm leading-5", cancelled ? "text-muted-foreground line-through decoration-muted-foreground/60" : "text-muted-foreground")}>
            <time dateTime={new Date(startAt).toISOString()}>{dateText}</time>
          </p>
          <p className={cn("text-sm leading-5 tabular-nums", cancelled ? "text-muted-foreground line-through decoration-muted-foreground/60" : quiet ? "text-muted-foreground" : "font-medium text-foreground")}>
            {/* Each time is one unbreakable piece, so on a narrow card the line folds between them and never inside "10:45 AM". */}
            <time dateTime={new Date(startAt).toISOString()} className="whitespace-nowrap">
              {startText}
            </time>
            <span aria-hidden="true">&nbsp;– </span>
            <span className="sr-only"> to </span>
            <time dateTime={new Date(endAt).toISOString()} className="whitespace-nowrap">
              {endText}
            </time>
            {foreign ? <span className="font-normal whitespace-nowrap text-muted-foreground"> {zoneName(startAt, locale, timeZone)}</span> : null}
            {/* The dot belongs to the length and folds with it: a line ends on the time, never on a dot. */}
            <span className="font-normal text-muted-foreground">
              <span aria-hidden="true"> </span>
              <span className="sr-only">, </span>
              <span className="whitespace-nowrap">
                <span aria-hidden="true">· </span>
                {length}
              </span>
            </span>
          </p>
        </div>
        {canCancel ? (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button ref={menu} type="button" variant="ghost" size="icon-sm" aria-label={fill(text.more, { title })} className="-mt-2 -mr-2.5 shrink-0 self-start text-muted-foreground hover:text-foreground">
                <IconMoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem variant="destructive" onSelect={() => setAsking(true)}>
                <IconClose />
                {text.cancel}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-5">
        <StatusBadge status={shown} statuses={statuses} size="md" />
        {location?.url || location?.address ? (
          <Badge variant="outline" className="h-6 gap-1.5 px-2.5 text-[0.8125rem] [&>svg]:size-3.5">
            {online ? <IconVideo /> : <IconPin />}
            {online ? text.online : text.onSite}
          </Badge>
        ) : null}
      </div>

      {person || location?.url || location?.address ? (
        // One column that may shrink below its text, so a long name or street ends in an ellipsis instead of pushing past the card.
        <dl className="grid flex-1 grid-cols-[minmax(0,1fr)] content-start gap-3 border-t border-border px-5 py-4">
          {person
            ? row(
                text.with,
                <>
                  <Avatar className="size-9">
                    {person.image ? <AvatarImage src={person.image} alt="" /> : null}
                    <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className={cn("block truncate text-sm leading-5 font-medium", quiet && "text-muted-foreground")}>{person.name}</span>
                    {person.role ? <span className="block truncate text-[0.8125rem] leading-5 text-muted-foreground">{person.role}</span> : null}
                  </span>
                </>,
              )
            : null}
          {location?.url || location?.address
            ? row(
                text.where,
                <>
                  <span aria-hidden="true" className={TILE}>
                    {online ? <IconVideo /> : <IconPin />}
                  </span>
                  <span className="min-w-0">
                    {online ? (
                      <>
                        <span className={cn("block truncate text-sm leading-5 font-medium", quiet && "text-muted-foreground")}>{text.videoCall}</span>
                        {upcoming ? (
                          <a
                            href={location.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex max-w-full items-center gap-1 rounded-sm text-[0.8125rem] leading-5 text-muted-foreground underline decoration-border underline-offset-4 outline-none hover:text-foreground hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                          >
                            <span className="truncate">{text.joinCall}</span>
                            <IconExternal className="size-3.5 shrink-0" />
                            <span className="sr-only">({text.newTab})</span>
                          </a>
                        ) : null}
                      </>
                    ) : (
                      <>
                        <span className={cn("block truncate text-sm leading-5 font-medium", quiet && "text-muted-foreground")}>{street}</span>
                        {rest.length ? <span className="block truncate text-[0.8125rem] leading-5 text-muted-foreground">{rest.join(",").trim()}</span> : null}
                      </>
                    )}
                  </span>
                </>,
              )
            : null}
        </dl>
      ) : null}

      {hasActions ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/30 px-5 py-3">
          {canReschedule ? (
            <Button type="button" variant="outline" size="sm" onClick={actions?.onReschedule}>
              {text.reschedule}
            </Button>
          ) : null}
          {canCalendar ? <AddToCalendarButton event={{ title, start: new Date(startAt), end: new Date(endAt), timeZone, location: location?.url ?? location?.address }} locale={locale} size="sm" /> : null}
        </div>
      ) : null}

      <AlertDialog
        open={asking}
        onOpenChange={(open) => {
          if (busy) return;
          setAsking(open);
          if (!open) setFailed(false);
        }}
      >
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            // Focus goes back to the menu button, or to the title when the card no longer has one because the appointment is cancelled.
            event.preventDefault();
            (menu.current ?? heading.current)?.focus();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{text.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{fill(person ? text.confirmBody : text.confirmBodyAlone, { title, person: person?.name ?? "", date: `${dateText}, ${startText}` })}</AlertDialogDescription>
          </AlertDialogHeader>
          {failed ? (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-foreground">
              {text.failed}
            </p>
          ) : null}
          <AlertDialogFooter>
            {/* Never `disabled` while the request runs: a disabled button drops the keyboard's focus to the page, and after a failure there would be nothing to press again. aria-disabled keeps the focus on the button that was pressed; onOpenChange and cancel() ignore the press. */}
            <AlertDialogCancel aria-disabled={busy || undefined} className={INERT}>
              {text.keep}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              aria-disabled={busy || undefined}
              aria-busy={busy || undefined}
              className={INERT}
              onClick={(event) => {
                // The dialog stays open while the request runs, and when it fails.
                event.preventDefault();
                if (!busy) void cancel();
              }}
            >
              {busy ? text.cancelling : text.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p role="status" className="sr-only">
        {done ? text.cancelled : ""}
      </p>
    </article>
  );
}
