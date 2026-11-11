"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconBan, IconClock, IconExternal, IconPin, IconUsers, IconVideo } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  agoText,
  fill,
  momentOf,
  numberText,
  peopleLine,
  phaseOf,
  safeLink,
  viewerLine,
  whenOf,
  zoneText,
  type EventDetailsLabels,
  type EventInfo,
  type EventMoment,
} from "@rhs-ui/application/event-details-popover/event";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface EventDetailsPanelProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  /** The event: title, start, end, time zone, place, link, people, description and status. */
  event: EventInfo;
  /** The reader's own IANA time zone. When it shows a different clock than the event's zone, the panel writes both. Default "UTC". */
  viewerTimeZone?: string;
  /** The language of the dates, times and names of zones. Default "en-US". */
  locale?: string;
  /** The buttons at the foot: Join, Edit, Cancel. Put them on `Button`s; the panel lays them out in a row that wraps. */
  actions?: ReactNode;
  /** What "now" is, for "Happening now" and "Ended 3 days ago". Pass it for output that does not change between server and browser. Default: the current time. */
  now?: EventMoment;
  /** The words the panel says, for translation. */
  labels?: EventDetailsLabels;
  /** The element that closes the panel, drawn at the top end of the title. The popover puts its close button here. */
  close?: ReactNode;
  /** The id of the title, so a dialog can be named by it. */
  titleId?: string;
}

/** The failure text, darkened toward the foreground so small red words reach 4.5:1 on the panel. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[1rem_minmax(0,1fr)] items-start gap-x-3">
      <span aria-hidden="true" className="mt-0.5 text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}

/** Four lines of the description, and a button to read the rest, shown only when four lines really hide something. */
function Description({ text, more, less }: { text: string; more: string; less: string }) {
  const body = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [cut, setCut] = useState(false);
  const id = useId();

  useEffect(() => {
    const element = body.current;
    if (!element || expanded) return;
    const measure = () => setCut(element.scrollHeight > element.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text, expanded]);

  return (
    <div className="border-t border-border px-4 py-3">
      <p
        id={id}
        ref={body}
        className={cn("text-sm leading-relaxed text-pretty whitespace-pre-line text-muted-foreground [overflow-wrap:anywhere]", !expanded && "line-clamp-4")}
      >
        {text}
      </p>
      {cut || expanded ? (
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={id}
          onClick={() => setExpanded((value) => !value)}
          className="mt-1.5 -ml-1 rounded-sm px-1 text-xs font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {expanded ? less : more}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Everything about one event, as the content of a card: the title with its status in words, the day and the time, the
 * time in the reader's own zone when it differs, the place or the link to join, who is invited, a description cut to
 * four lines and the actions. It is what EventDetailsPopover shows, usable by itself in a side panel, a sheet on a
 * phone or a page of its own.
 */
export function EventDetailsPanel({ event, viewerTimeZone = "UTC", locale = "en-US", actions, now, labels, close, titleId, className, ...props }: EventDetailsPanelProps) {
  const words: Required<EventDetailsLabels> = { ...DEFAULT_LABELS, ...labels };
  const ownTitleId = useId();
  const zone = event.timeZone ?? "UTC";
  const startAt = momentOf(event.start);
  const endAt = momentOf(event.end);
  const nowAt = momentOf(now) ?? Date.now();
  const cancelled = event.status === "cancelled";
  const phase = startAt === null ? "upcoming" : phaseOf(startAt, endAt, nowAt);

  const own = startAt === null ? null : whenOf(startAt, endAt, event.allDay === true, zone, locale, words);
  const theirs = startAt !== null && !event.allDay && viewerTimeZone !== zone ? whenOf(startAt, endAt, false, viewerTimeZone, locale, words) : null;
  // The reader's line appears only when their clock reads differently: two zones with the same offset say nothing new.
  const viewer = own && theirs ? viewerLine(own, theirs) : null;

  const link = event.link ? safeLink(event.link) : null;
  const people = event.attendees ?? [];
  const names = people.map((person) => person.name);
  const faces = people.slice(0, 4);
  const more = people.length - faces.length;

  return (
    <div
      data-slot="event-details-panel"
      data-status={event.status ?? "confirmed"}
      data-phase={phase}
      className={cn("relative flex min-w-0 flex-col text-sm text-popover-foreground", className)}
      {...props}
    >
      <div className={cn("px-4 pt-4", close ? "pr-12" : undefined)}>
        <div className="min-w-0">
          <h3
            id={titleId ?? ownTitleId}
            className={cn(
              "text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] text-pretty [overflow-wrap:anywhere]",
              cancelled && "text-muted-foreground line-through decoration-muted-foreground/70 decoration-[1.5px]",
            )}
          >
            {cancelled ? <span className="sr-only">{words.cancelled}: </span> : null}
            {event.title}
          </h3>
          {cancelled || event.status === "tentative" || phase !== "upcoming" ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {cancelled ? (
                <Badge variant="destructive" aria-hidden="true" className={DANGER_TEXT}>
                  <IconBan />
                  {words.cancelled}
                </Badge>
              ) : null}
              {!cancelled && event.status === "tentative" ? <Badge variant="outline">{words.tentative}</Badge> : null}
              {!cancelled && phase === "live" ? (
                <Badge>
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-primary-foreground" />
                  {words.now}
                </Badge>
              ) : null}
              {!cancelled && phase === "past" && startAt !== null ? <Badge variant="muted">{fill(words.ended, { when: agoText(nowAt, endAt ?? startAt, locale) })}</Badge> : null}
            </div>
          ) : null}
        </div>
      </div>

      <ul className="grid gap-3.5 px-4 pt-3.5 pb-4">
        {own && startAt !== null ? (
          <Row icon={<IconClock />}>
            <p className="font-medium text-balance">{own.day}</p>
            <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 tabular-nums">
              <span>{own.time}</span>
              {viewer ? <span className="text-xs text-muted-foreground">{zoneText(startAt, zone, locale)}</span> : null}
            </p>
            {viewer ? (
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
                <span>{viewer}</span>
                <span className="text-xs text-muted-foreground">
                  {words.yourTime}, {zoneText(startAt, viewerTimeZone, locale)}
                </span>
              </p>
            ) : null}
          </Row>
        ) : null}

        {event.location ? (
          <Row icon={<IconPin />}>
            <p className="text-pretty [overflow-wrap:anywhere]">{event.location}</p>
          </Row>
        ) : null}

        {event.link ? (
          <Row icon={<IconVideo />}>
            {link ? (
              <>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link inline-flex items-center gap-1.5 rounded-sm font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {words.join}
                  <IconExternal aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="sr-only">{words.newTab}</span>
                </a>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{link.text}</p>
              </>
            ) : (
              <p className="text-pretty [overflow-wrap:anywhere]">{event.link}</p>
            )}
          </Row>
        ) : null}

        {people.length ? (
          <Row icon={<IconUsers />}>
            <div className="flex items-center gap-2.5">
              <AvatarGroup aria-hidden="true" className="-space-x-1 *:data-[slot=avatar]:ring-popover">
                {faces.map((person) => (
                  <Avatar key={person.id} size="sm">
                    {person.image ? <AvatarImage src={person.image} alt="" /> : null}
                    <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
                  </Avatar>
                ))}
                {more > 0 ? <AvatarGroupCount className="size-7 text-xs ring-popover">+{numberText(more, locale)}</AvatarGroupCount> : null}
              </AvatarGroup>
              <p className="font-medium tabular-nums">{fill(people.length === 1 ? words.attendeesOne : words.attendeesOther, { count: numberText(people.length, locale) })}</p>
            </div>
            <p className="mt-1.5 text-[0.8125rem] leading-snug text-pretty text-muted-foreground">{peopleLine(names, locale, words.andMore)}</p>
            {people.length > 3 ? (
              <ul aria-label={words.attendees} className="sr-only">
                {people.map((person) => (
                  <li key={person.id}>{person.name}</li>
                ))}
              </ul>
            ) : null}
          </Row>
        ) : null}
      </ul>

      {event.description ? <Description text={event.description} more={words.showMore} less={words.showLess} /> : null}

      {actions ? <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-4 py-3">{actions}</div> : null}
      {/* Last in the DOM, like the close button of a Dialog: the first Tab lands on the first action. Drawn first, in a frame with no height that sticks to the top of whatever scrolls, so a panel taller than the screen keeps its way out in view. */}
      {close ? (
        <div className="sticky top-0 z-10 order-first h-0">
          {/* The bigger button of a touch screen keeps the centre of the small one, so it never reaches down over what is under the title. */}
          <div className="absolute top-2.5 right-2.5 pointer-coarse:top-1.5 pointer-coarse:right-1.5">{close}</div>
        </div>
      ) : null}
    </div>
  );
}
