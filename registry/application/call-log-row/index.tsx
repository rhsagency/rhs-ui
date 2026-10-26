"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { Glyph, IconArrowDownLeft, IconArrowUpRight, IconNote, IconPhone, IconPlay, IconVoicemail } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

import { capitalise, clockOptions, dateIn, dayNumber, durationWords, formatClock, formatPhone } from "./format";

type DateInput = Date | string | number;

/** How a call went: you picked up (`incoming`), you rang out (`outgoing`), or nobody picked up (`missed`). */
export type CallDirection = "incoming" | "outgoing" | "missed";

/** The call a row shows. */
export interface CallLogEntry {
  /** A stable identity, passed back to your callbacks. */
  id: string;
  /** The contact's name. Leave it out for a caller who is not in your contacts: the row then leads with their number. */
  name?: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
  /** The phone number, bare ("+31612345678") or already written for people. A bare one is grouped for readability. */
  number?: string;
  /** Incoming, outgoing or missed. It is drawn as an arrow and said in a word. */
  direction: CallDirection;
  /** When the call started: a Date, a timestamp or an ISO string. */
  at: DateInput;
  /** How long it lasted, in seconds. Leave it out for a call that was not answered. */
  duration?: number;
  /** A message the caller left, with its length in seconds. It shows beside a play control. */
  voicemail?: { duration: number };
  /** Your own note about the call. It shows under the line when `showNote` is set. */
  note?: string;
}

/** The words the row uses, for translation. `{name}`, `{time}` and `{duration}` are filled in. */
export interface CallLogRowLabels {
  /** The word next to the arrow. Default "Incoming". */
  incoming?: string;
  /** Default "Outgoing". */
  outgoing?: string;
  /** Default "Missed". */
  missed?: string;
  /** The whole row as one sentence, for a screen reader. Default "Incoming call from {name}, {time}". */
  incomingCall?: string;
  /** Default "Outgoing call to {name}, {time}". */
  outgoingCall?: string;
  /** Default "Missed call from {name}, {time}". */
  missedCall?: string;
  /** Added to the sentence of an answered call. Default "lasted {duration}". */
  lasted?: string;
  /** Added to the sentence when there is a voicemail. Default "voicemail, {duration}". */
  voicemailName?: string;
  /** The word on the voicemail tag. Default "Voicemail". */
  voicemail?: string;
  /** The title when there is neither a name nor a number. Default "Unknown caller". */
  unknownCaller?: string;
  /** Under a number that is not in your contacts. Default "Not in contacts". */
  notInContacts?: string;
  /** The call-back button's name. Default "Call back {name}". */
  callBack?: string;
  /** Said while a call back is being placed. Default "Calling {name}." */
  calling?: string;
  /** Shown under the row, and said, when `onCallBack` rejects. Default "Could not call {name}. Try again." */
  callFailed?: string;
  /** The play button's name. Default "Play voicemail from {name}, {duration}". */
  playVoicemail?: string;
  /** The note button's name when there is no note yet. Default "Add a note for {name}". */
  addNote?: string;
  /** The note button's name when there is one. Default "Edit the note for {name}". */
  editNote?: string;
}

export interface CallLogRowProps extends Omit<ComponentProps<"li">, "children"> {
  /** The call to show. */
  call: CallLogEntry;
  /** The call-back button was pressed. Leave it out and there is no button. Return a promise and the button shows a spinner while the call is placed; a rejection is shown under the row and said, and is not thrown again. */
  onCallBack?: (call: CallLogEntry) => void | Promise<void>;
  /** The row was opened: the contact, or the call's details. It makes the row a button, laid under the other controls. */
  onOpen?: (call: CallLogEntry) => void;
  /** The note button was pressed. Leave it out and there is no note button. */
  onNote?: (call: CallLogEntry) => void;
  /** The play button on a voicemail was pressed. Without it, and without `playSlot`, the voicemail shows its length only. */
  onPlayVoicemail?: (call: CallLogEntry) => void;
  /** Your own player for the voicemail, drawn where the play button would be. */
  playSlot?: ReactNode;
  /** Show the call's note under the line. Default false. */
  showNote?: boolean;
  /** The moment "Yesterday" is measured from. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the times and numbers. Default "en-US". */
  locale?: string;
  /** The time zone the times are written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the row uses, for translation. */
  labels?: CallLogRowLabels;
}

const DEFAULT_LABELS = {
  incoming: "Incoming",
  outgoing: "Outgoing",
  missed: "Missed",
  incomingCall: "Incoming call from {name}, {time}",
  outgoingCall: "Outgoing call to {name}, {time}",
  missedCall: "Missed call from {name}, {time}",
  lasted: "lasted {duration}",
  voicemailName: "voicemail, {duration}",
  voicemail: "Voicemail",
  unknownCaller: "Unknown caller",
  notInContacts: "Not in contacts",
  callBack: "Call back {name}",
  calling: "Calling {name}.",
  callFailed: "Could not call {name}. Try again.",
  playVoicemail: "Play voicemail from {name}, {duration}",
  addNote: "Add a note for {name}",
  editNote: "Edit the note for {name}",
} satisfies Required<CallLogRowLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the small red words reach 4.5:1 on the page and on a hovered row. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

const OVERLAY = "absolute inset-0 z-0 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50";

/** The browser's clock, read once the page is live and again only when the call it measures changes. Null on the server and before hydration, so both write the same text. */
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

/** "Yesterday", "Mon", "12 Oct": which day a call was on, or null for today. */
function dayName(at: number, now: number, locale: string, timeZone: string): string | null {
  const apart = dayNumber(now, timeZone) - dayNumber(at, timeZone);
  if (apart <= 0) return null;
  if (apart === 1) {
    try {
      return capitalise(new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-1, "day"), locale);
    } catch {
      return "Yesterday";
    }
  }
  if (apart < 7) return dateIn(at, locale, timeZone, { weekday: "short" });
  const sameYear = dateIn(at, "en-US", timeZone, { year: "numeric" }) === dateIn(now, "en-US", timeZone, { year: "numeric" });
  return dateIn(at, locale, timeZone, sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" });
}

/** The arrow of each direction. A missed call is a broken arrow, so it differs by shape and not only by colour. */
function DirectionMark({ direction }: { direction: CallDirection }) {
  if (direction === "incoming") return <IconArrowDownLeft className="size-3.5 shrink-0" />;
  if (direction === "outgoing") return <IconArrowUpRight className="size-3.5 shrink-0" />;
  return <Glyph className="size-3.5 shrink-0" strokeWidth={2} d="M17 7l-3.5 3.5M10.5 13.5L7 17M7 10.5V17h6.5" />;
}

/**
 * One call in a call history or a CRM dialer: who it was (an avatar, a name,
 * or a number written for the locale when they are not a contact), which way
 * it went as a drawn arrow and a word, when it happened and how long it
 * lasted. A missed call is marked by its word and a heavier name as well as
 * its colour, a voicemail shows its length beside a play control (or your own
 * player), and an optional note sits under the line. The row reads as one
 * sentence, "Missed call from Anna de Vries, 14:32", and "Call back Anna de
 * Vries" is a button of its own; when the call cannot be placed the row says
 * so under the line, in a short alert, and the button is ready to try again.
 * With `onOpen` the whole row opens the contact, under the buttons, so a
 * keyboard user tabs to the row and then to each button. It reads its own
 * width: wide, the time and length sit in a column at the end; narrow, the
 * time moves up beside the name, the length joins the arrow and the number
 * gives way. Put the rows in a `ul`.
 */
export function CallLogRow({
  call,
  onCallBack,
  onOpen,
  onNote,
  onPlayVoicemail,
  playSlot,
  showNote = false,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: CallLogRowProps) {
  const text: Required<CallLogRowLabels> = { ...DEFAULT_LABELS, ...labels };
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  // The counter is the key of the spoken line, so pressing Call back again on the same person is read out again instead of being the same text in the same node.
  const [said, setSaid] = useState({ id: 0, text: "" });

  const at = new Date(call.at).getTime();
  const valid = !Number.isNaN(at);
  const clock = useClock(now, valid ? at : 0);

  const named = Boolean(call.name?.trim());
  const number = call.number ? formatPhone(call.number, locale) : "";
  const who = named ? (call.name as string).trim() : number || text.unknownCaller;
  const missed = call.direction === "missed";

  // "14:32" today; "Yesterday, 17:45" or "12 Oct, 09:10" after. Before the clock is known the date is written plainly.
  const clockTime = valid ? dateIn(at, locale, timeZone, clockOptions(locale)) : "";
  const day = valid ? (clock === null ? dateIn(at, locale, timeZone, { day: "numeric", month: "short" }) : dayName(at, clock, locale, timeZone)) : null;
  const when = day ? `${day}, ${clockTime}` : clockTime;
  const full = valid ? dateIn(at, locale, timeZone, { dateStyle: "medium", timeStyle: "short" }) : "";

  const length = call.duration !== undefined && call.direction !== "missed" ? formatClock(call.duration) : "";
  const voicemail = call.voicemail ? { clock: formatClock(call.voicemail.duration), words: durationWords(call.voicemail.duration, locale) } : null;
  const word = text[call.direction];

  const sentence = [
    // A call without a readable time loses the comma that would have led to it.
    fill(text[`${call.direction}Call` as "incomingCall" | "outgoingCall" | "missedCall"], { name: who, time: when }).replace(/[,\s]+$/, ""),
    call.duration !== undefined && !missed ? fill(text.lasted, { duration: durationWords(call.duration, locale) }) : "",
    voicemail ? fill(text.voicemailName, { duration: voicemail.words }) : "",
  ]
    .filter(Boolean)
    .join(", ");

  async function callBack() {
    if (busy || !onCallBack) return;
    setBusy(true);
    setFailed(false);
    setSaid((previous) => ({ id: previous.id + 1, text: fill(text.calling, { name: who }) }));
    try {
      await onCallBack(call);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  const playControl = playSlot ?? (voicemail && onPlayVoicemail ? (
    <Button type="button" variant="outline" size="sm" aria-label={fill(text.playVoicemail, { name: who, duration: voicemail.words })} onClick={() => onPlayVoicemail(call)} className="h-7 gap-1.5 rounded-full px-2.5 text-xs tabular-nums">
      <IconPlay className="size-3" />
      {text.voicemail}
      <span aria-hidden="true" className="text-muted-foreground">
        {voicemail.clock}
      </span>
    </Button>
  ) : null);

  return (
    <li
      data-slot="call-log-row"
      data-direction={call.direction}
      data-interactive={onOpen ? "" : undefined}
      className={cn("group/row @container relative transition-colors duration-150 data-[interactive]:hover:bg-muted/50 motion-reduce:transition-none", className)}
      {...props}
    >
      {onOpen ? <button type="button" aria-label={sentence} onClick={() => onOpen(call)} className={OVERLAY} /> : <p className="sr-only">{sentence}</p>}

      <div className="pointer-events-none relative z-10 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-3 @md:grid-cols-[auto_minmax(0,1fr)_auto_auto] @md:gap-x-4">
        <Avatar aria-hidden="true" className="data-[size=default]:size-10">
          {call.image ? <AvatarImage src={call.image} alt="" /> : null}
          <AvatarFallback className={cn(!named && "border border-dashed border-muted-foreground/50 bg-background")}>{named ? initialsOf(who) : <IconPhone className="size-4 text-muted-foreground" />}</AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <div aria-hidden="true" className="flex min-w-0 items-baseline justify-between gap-3">
            <p className={cn("truncate text-sm tracking-[-0.01em]", missed ? "font-semibold text-foreground" : "font-medium", !named && "tabular-nums")} dir={named ? undefined : "ltr"}>
              {who}
            </p>
            <span title={full} className="shrink-0 text-xs whitespace-nowrap text-muted-foreground tabular-nums @md:hidden">
              {when}
            </span>
          </div>
          <p aria-hidden="true" className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] leading-5 text-muted-foreground">
            <span className={cn("inline-flex shrink-0 items-center gap-1", missed && cn("font-semibold", DANGER_TEXT))}>
              <DirectionMark direction={call.direction} />
              {word}
            </span>
            {named ? (
              <>
                <span className="@max-md:hidden">·</span>
                <span className="truncate tabular-nums @max-md:hidden" dir="ltr">
                  {number}
                </span>
              </>
            ) : (
              <>
                <span className={cn(length && "@max-md:hidden")}>·</span>
                <span className={cn("truncate", length && "@max-md:hidden")}>{text.notInContacts}</span>
              </>
            )}
            {length ? (
              <>
                <span className="@md:hidden">·</span>
                <span className="shrink-0 tabular-nums @md:hidden">{length}</span>
              </>
            ) : null}
          </p>
          {playControl ? (
            <div className="pointer-events-auto mt-1.5 flex">{playControl}</div>
          ) : voicemail ? (
            <p aria-hidden="true" className="mt-1.5 inline-flex h-7 items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 text-xs text-muted-foreground">
              <IconVoicemail className="size-3.5" />
              {text.voicemail}
              <span className="tabular-nums">{voicemail.clock}</span>
            </p>
          ) : null}
          {showNote && call.note ? (
            <p className="mt-1.5 flex items-start gap-1.5 text-[0.8125rem] leading-snug text-foreground/80">
              <IconNote aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              <span className="line-clamp-2">{call.note}</span>
            </p>
          ) : null}
        </div>

        <div aria-hidden="true" title={full} className="hidden text-right text-sm tabular-nums @md:block">
          <p className="font-medium whitespace-nowrap">{when}</p>
          <p className="min-h-5 text-[0.8125rem] leading-5 text-muted-foreground">{length}</p>
        </div>

        {onCallBack || onNote ? (
          <div className="pointer-events-auto flex items-center gap-1">
            {onNote ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={fill(call.note ? text.editNote : text.addNote, { name: who })}
                onClick={() => onNote(call)}
                className={cn(
                  "text-muted-foreground transition-opacity hover:text-foreground motion-reduce:transition-none",
                  // In a wide row on a screen with a pointer, an empty note button waits for the row to be reached; a row with a note keeps it, and so does a touch screen.
                  !call.note && "focus-visible:opacity-100 @md:[@media(hover:hover)]:opacity-0 @md:[@media(hover:hover)]:group-focus-within/row:opacity-100 @md:[@media(hover:hover)]:group-hover/row:opacity-100",
                  // On a narrow row the row itself is the way to a note (through onOpen); the button stays only when there is no onOpen.
                  onOpen && "@max-md:hidden",
                )}
              >
                <IconNote />
              </Button>
            ) : null}
            {onCallBack ? (
              <Button type="button" variant="outline" size="icon" aria-label={fill(text.callBack, { name: who })} aria-busy={busy || undefined} onClick={() => void callBack()} className="rounded-full">
                {busy ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : <IconPhone />}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {failed ? (
        <p role="alert" className={cn("pointer-events-none relative z-10 -mt-1 pe-4 pb-3 ps-[4.25rem] text-xs font-medium @md:ps-[4.5rem]", DANGER_TEXT)}>
          {fill(text.callFailed, { name: who })}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </li>
  );
}
