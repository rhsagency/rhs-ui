"use client";

import { useId, useState, type ComponentProps } from "react";

import { IconBell, IconCheck, IconChevronDown, IconChevronUp } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

/** How an invitee answered. `none` has not answered yet. */
export type RsvpResponse = "accepted" | "declined" | "tentative" | "none";

/** What you can answer for yourself. */
export type RsvpChoice = Exclude<RsvpResponse, "none">;

/** One person on the invitation. */
export interface Attendee {
  /** A stable identity: `organizer` and `you` name an attendee by it. */
  id: string;
  /** Their name. */
  name: string;
  /** Their address, shown under the name and in its tooltip. */
  email?: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
  /** Their answer. */
  response: RsvpResponse;
  /** Not required: the row says so. */
  optional?: boolean;
}

/** The words the list uses, for translation. `{count}` and `{name}` are filled in. */
export interface AttendeeListLabels {
  /** The heading. Default "Attendees". */
  heading?: string;
  /** The number of people next to the heading. Default "{count} invited". */
  invited?: string;
  /** In the count line. Default "{count} yes". */
  yes?: string;
  /** Default "{count} maybe". */
  maybe?: string;
  /** Default "{count} no". */
  no?: string;
  /** Default "{count} waiting". */
  waiting?: string;
  /** The word for someone who is coming. Default "Accepted". */
  accepted?: string;
  /** The word for someone who is not coming. Default "Declined". */
  declined?: string;
  /** The word for someone who might come. Default "Tentative". */
  tentative?: string;
  /** The word for someone who has not answered. Default "No response". */
  none?: string;
  /** The tag on the organizer's row. Default "Organizer". */
  organizer?: string;
  /** The tag on your own row. Default "You". */
  you?: string;
  /** The tag on someone who is not required. Default "Optional". */
  optional?: string;
  /** The name of your three buttons as a group. Default "Your response". */
  yourResponse?: string;
  /** Default "Yes". */
  yesButton?: string;
  /** Default "Maybe". */
  maybeButton?: string;
  /** Default "No". */
  noButton?: string;
  /** Said when your answer was saved. `{response}` is the answer in words. Default "Your response is now {response}." */
  responded?: string;
  /** Shown and said when saving your answer failed. Default "Could not save your response. Nothing was changed." */
  respondFailed?: string;
  /** The reminder button. Default "Remind". */
  remind?: string;
  /** The reminder button's name. Default "Remind {name}". */
  remindName?: string;
  /** What the button says after a reminder went out. Default "Reminded". */
  reminded?: string;
  /** Said when a reminder went out. Default "Reminder sent to {name}." */
  remindedSaid?: string;
  /** Shown and said when a reminder failed. Default "Could not remind {name}. Try again." */
  remindFailed?: string;
  /** The button that unfolds the rest. Default "Show {count} more". */
  showMore?: string;
  /** The button that folds them again. Default "Show fewer". */
  showFewer?: string;
}

export interface AttendeeListProps extends Omit<ComponentProps<"section">, "children" | "onSelect"> {
  /** Everyone on the invitation. */
  attendees: readonly Attendee[];
  /** The `id` of the organizer. They come first and carry a tag, and only they can remind people who have not answered. */
  organizer?: string;
  /** The `id` of the person looking, who comes next and gets three buttons to answer. */
  you?: string;
  /** One of your three buttons was pressed. Save the answer and update your attendee's `response`. Return a promise and the button shows it is working; a rejection says so and changes nothing. */
  onRespond?: (response: RsvpChoice) => void | Promise<void>;
  /** The organizer asked to remind someone who has not answered. Return a promise and the button shows it is working. Leave it out for no reminder buttons. */
  onRemind?: (attendee: Attendee) => void | Promise<void>;
  /** How many rows show before the rest fold behind "Show 12 more". The organizer and you always lead, so they are never folded away. Default 5. */
  maxVisible?: number;
  /** The heading's level, 2 to 4. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the list uses, for translation. */
  labels?: AttendeeListLabels;
}

const DEFAULT_LABELS = {
  heading: "Attendees",
  invited: "{count} invited",
  yes: "{count} yes",
  maybe: "{count} maybe",
  no: "{count} no",
  waiting: "{count} waiting",
  accepted: "Accepted",
  declined: "Declined",
  tentative: "Tentative",
  none: "No response",
  organizer: "Organizer",
  you: "You",
  optional: "Optional",
  yourResponse: "Your response",
  yesButton: "Yes",
  maybeButton: "Maybe",
  noButton: "No",
  responded: "Your response is now {response}.",
  respondFailed: "Could not save your response. Nothing was changed.",
  remind: "Remind",
  remindName: "Remind {name}",
  reminded: "Reminded",
  remindedSaid: "Reminder sent to {name}.",
  remindFailed: "Could not remind {name}. Try again.",
  showMore: "Show {count} more",
  showFewer: "Show fewer",
} satisfies Required<AttendeeListLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const ORDER: readonly RsvpResponse[] = ["accepted", "tentative", "declined", "none"];

/** The failure text, darkened toward the foreground so the small red words reach 4.5:1 on a card. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** A drawn answer: a solid disc with a tick, a ring with a question mark, a ring with a cross, a dashed ring. Different shapes, so no answer depends on colour. */
function ResponseMark({ response, className }: { response: RsvpResponse; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" data-response={response} className={cn("size-4 shrink-0", className)}>
      {response === "accepted" ? (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M4.9 8.3l2.2 2.2 4-4.4" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="stroke-[var(--mark-cut,var(--background))]" />
        </>
      ) : response === "tentative" ? (
        <>
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.2 6.3a1.9 1.9 0 1 1 2.6 1.8c-.5.3-.8.6-.8 1.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11.2" r=".9" fill="currentColor" />
        </>
      ) : response === "declined" ? (
        <>
          <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5.9 5.9l4.2 4.2M10.1 5.9l-4.2 4.2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.4 2.2" />
      )}
    </svg>
  );
}

/**
 * Who is coming: the invitees with the answer of each, written out as
 * Accepted, Tentative, Declined or No response and drawn as four different
 * shapes, under a line of counts ("4 yes, 1 maybe, 2 waiting") that is a
 * polite status, so it is read out when an answer comes in. The organizer
 * leads the list and carries a tag, you come next and get three buttons to
 * answer, and the organizer can nudge anyone who has not replied with a
 * Remind button that says when it has gone out. A long list folds behind
 * "Show 12 more" without ever hiding the organizer or you. It reads its own
 * width: on a phone the answer moves under the name.
 */
export function AttendeeList({ attendees, organizer, you, onRespond, onRemind, maxVisible = 5, headingLevel = 3, labels, className, ...props }: AttendeeListProps) {
  const text: Required<AttendeeListLabels> = { ...DEFAULT_LABELS, ...labels };
  const headingId = useId();
  const listId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<RsvpChoice | null>(null);
  const [failed, setFailed] = useState(false);
  const [saying, setSaying] = useState("");
  const [reminding, setReminding] = useState<string | null>(null);
  const [reminded, setReminded] = useState<ReadonlySet<string>>(() => new Set());
  const [remindFailed, setRemindFailed] = useState<string | null>(null);

  // The organizer and you lead, then everyone else in the order they came.
  const ordered = [...attendees].sort((a, b) => Number(b.id === organizer) * 2 + Number(b.id === you) - (Number(a.id === organizer) * 2 + Number(a.id === you)));
  const limit = Math.max(2, Math.floor(maxVisible));
  const folded = ordered.length > limit + 1;
  const shown = folded && !open ? ordered.slice(0, limit) : ordered;
  const hidden = ordered.length - shown.length;

  const counts = ORDER.map((response) => ({ response, count: attendees.filter((attendee) => attendee.response === response).length }));
  const countText = (response: RsvpResponse, count: number) => fill({ accepted: text.yes, tentative: text.maybe, declined: text.no, none: text.waiting }[response], { count: String(count) });
  const summary = counts.filter(({ count }) => count > 0).map(({ response, count }) => countText(response, count)).join(", ");
  const total = attendees.length;

  const isOrganizer = you !== undefined && you === organizer;
  // Only the organizer reminds, so only then does every row keep room for the button and the answers line up.
  const remindable = Boolean(onRemind) && isOrganizer;

  async function respond(choice: RsvpChoice) {
    if (pending !== null || !onRespond) return;
    setFailed(false);
    setPending(choice);
    try {
      await onRespond(choice);
      setSaying(fill(text.responded, { response: text[choice].toLowerCase() }));
    } catch {
      setFailed(true);
    } finally {
      setPending(null);
    }
  }

  async function remind(attendee: Attendee) {
    if (reminding !== null || !onRemind) return;
    setRemindFailed(null);
    setReminding(attendee.id);
    try {
      await onRemind(attendee);
      setReminded((current) => new Set(current).add(attendee.id));
      setSaying(fill(text.remindedSaid, { name: attendee.name }));
    } catch {
      setRemindFailed(attendee.id);
      setSaying(fill(text.remindFailed, { name: attendee.name }));
    } finally {
      setReminding(null);
    }
  }

  const choices: readonly { choice: RsvpChoice; label: string }[] = [
    { choice: "accepted", label: text.yesButton },
    { choice: "tentative", label: text.maybeButton },
    { choice: "declined", label: text.noButton },
  ];

  return (
    <section data-slot="attendee-list" aria-labelledby={headingId} className={cn("@container text-foreground", className)} {...props}>
      <div className="grid gap-3 px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <Heading id={headingId} className="text-sm font-semibold tracking-[-0.01em]">
            {text.heading}
          </Heading>
          <span className="text-xs text-muted-foreground tabular-nums">{fill(text.invited, { count: String(total) })}</span>
        </div>
        <span aria-hidden="true" className="flex h-1.5 gap-px overflow-hidden rounded-full bg-muted">
          {counts.map(({ response, count }) =>
            count ? (
              <span key={response} data-response={response} className={cn("h-full", response === "accepted" && "bg-foreground", response === "tentative" && "bg-foreground/55", response === "declined" && "bg-foreground/25", response === "none" && "bg-transparent")} style={{ flex: count }} />
            ) : null,
          )}
        </span>
        <ul aria-hidden="true" className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.8125rem] text-muted-foreground">
          {counts.map(({ response, count }) =>
            count ? (
              <li key={response} className="inline-flex items-center gap-1.5 tabular-nums">
                <ResponseMark response={response} className="size-3.5" />
                {countText(response, count)}
              </li>
            ) : null,
          )}
        </ul>
        <p role="status" className="sr-only">
          {summary}
        </p>
      </div>

      <ul id={listId} className="divide-y divide-border border-t border-border">
        {shown.map((attendee) => {
          const isYou = attendee.id === you;
          const isHost = attendee.id === organizer;
          const waiting = attendee.response === "none";
          const canRemind = remindable && !isYou && waiting;
          const sent = reminded.has(attendee.id) && waiting;
          return (
            <li key={attendee.id} data-response={attendee.response} className="px-4 py-3">
              <div className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2.5", remindable ? "@md:grid-cols-[auto_minmax(0,1fr)_8.5rem_6.5rem]" : "@md:grid-cols-[auto_minmax(0,1fr)_8.5rem]")}>
                <Avatar className="data-[size=default]:size-9">
                  {attendee.image ? <AvatarImage src={attendee.image} alt="" /> : null}
                  <AvatarFallback>{initialsOf(attendee.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-medium tracking-[-0.01em]" title={attendee.email}>
                      {attendee.name}
                    </span>
                    {isHost ? (
                      <Badge variant="outline" className="h-[1.125rem] shrink-0 px-1.5 text-[0.6875rem]">
                        {text.organizer}
                      </Badge>
                    ) : null}
                    {isYou ? (
                      <Badge variant="secondary" className="h-[1.125rem] shrink-0 px-1.5 text-[0.6875rem]">
                        {text.you}
                      </Badge>
                    ) : null}
                  </p>
                  <p className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] leading-5 text-muted-foreground">
                    <span className="inline-flex shrink-0 items-center gap-1.5 @md:hidden">
                      <ResponseMark response={attendee.response} className="size-3.5" />
                      <span className={cn(attendee.response === "accepted" && "font-medium text-foreground")}>{text[attendee.response]}</span>
                    </span>
                    {attendee.email ? <span className="truncate @max-md:hidden">{attendee.email}</span> : null}
                    {attendee.optional ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="shrink-0">{text.optional}</span>
                      </>
                    ) : null}
                  </p>
                </div>

                <p className={cn("hidden items-center gap-1.5 text-sm @md:flex", attendee.response === "accepted" || attendee.response === "tentative" ? "text-foreground" : "text-muted-foreground")}>
                  <ResponseMark response={attendee.response} />
                  <span className={cn(attendee.response === "accepted" && "font-medium")}>{text[attendee.response]}</span>
                </p>

                {canRemind ? (
                  <div className="col-start-3 row-start-1 @md:col-start-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={fill(text.remindName, { name: attendee.name })}
                      aria-disabled={sent || reminding === attendee.id || undefined}
                      onClick={() => {
                        if (!sent) void remind(attendee);
                      }}
                      className={cn("-me-2 text-muted-foreground hover:text-foreground aria-disabled:cursor-default aria-disabled:hover:bg-transparent", sent && "text-foreground")}
                    >
                      {reminding === attendee.id ? <Spinner size={14} label="" role="presentation" aria-hidden="true" /> : sent ? <IconCheck /> : <IconBell />}
                      {sent ? text.reminded : text.remind}
                    </Button>
                  </div>
                ) : remindable ? (
                  <span aria-hidden="true" className="col-start-3 row-start-1 @md:col-start-4" />
                ) : null}

                {isYou && onRespond ? (
                  <div className="col-start-2 -col-end-1 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span id={`${listId}-${attendee.id}-mine`} className="text-xs text-muted-foreground">
                      {text.yourResponse}
                    </span>
                    <div role="group" aria-labelledby={`${listId}-${attendee.id}-mine`} className="flex flex-wrap gap-1.5">
                      {choices.map(({ choice, label }) => {
                        const current = attendee.response === choice;
                        return (
                          <Button
                            key={choice}
                            type="button"
                            size="sm"
                            variant={current ? "default" : "outline"}
                            aria-pressed={current}
                            aria-disabled={pending !== null || undefined}
                            onClick={() => void respond(choice)}
                            className="min-w-[4.25rem] aria-disabled:cursor-progress aria-pressed:[--mark-cut:var(--primary)]"
                          >
                            {pending === choice ? <Spinner size={14} label="" role="presentation" aria-hidden="true" /> : <ResponseMark response={choice} className="size-3.5" />}
                            {label}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {failed && isYou ? (
                  <p role="alert" className={cn("col-start-2 -col-end-1 flex items-start gap-1.5 text-xs font-medium", DANGER_TEXT)}>
                    {text.respondFailed}
                  </p>
                ) : null}
                {remindFailed === attendee.id ? (
                  <p role="alert" className={cn("col-start-2 -col-end-1 flex items-start gap-1.5 text-xs font-medium", DANGER_TEXT)}>
                    {fill(text.remindFailed, { name: attendee.name })}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {folded ? (
        <div className="border-t border-border px-2 py-1.5">
          <Button type="button" variant="ghost" size="sm" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((value) => !value)} className="w-full justify-center text-muted-foreground hover:text-foreground">
            {open ? <IconChevronUp /> : <IconChevronDown />}
            {open ? text.showFewer : fill(text.showMore, { count: String(hidden) })}
          </Button>
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {saying}
      </p>
    </section>
  );
}
