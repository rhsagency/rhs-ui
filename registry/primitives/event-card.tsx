import type { ReactNode } from "react";

import { IconClock, IconPin, IconVideo } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface EventCardProps {
  title: string;
  /** Day and month for the date block: "14", "Apr". */
  day: string;
  month: string;
  dateTime: string;
  /** "18:30 to 21:00". */
  time: string;
  place: string;
  online?: boolean;
  /** People going, as a small avatar row or a count. */
  attendees?: ReactNode;
  /** RSVP or add to calendar. */
  action?: ReactNode;
  href?: string;
  className?: string;
}

/**
 * One event as a card: a calendar block with the day, the title (a link when
 * there is a page), time and place with icons, who is going and the RSVP.
 * The date is a real time element for calendars and search.
 */
export function EventCard({ title, day, month, dateTime, time, place, online = false, attendees, action, href, className }: EventCardProps) {
  return (
    <article data-slot="event-card" className={cn("flex gap-4 rounded-2xl border border-border p-4", className)}>
      <time dateTime={dateTime} className="flex w-14 shrink-0 flex-col items-center self-start overflow-clip rounded-xl border border-border">
        <span className="w-full bg-foreground py-0.5 text-center text-[10px] font-medium tracking-[.12em] text-background uppercase">{month}</span>
        <span className="py-1.5 text-2xl font-medium tabular-nums">{day}</span>
      </time>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium text-balance">{href ? <a href={href} className="underline-offset-4 hover:underline">{title}</a> : title}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground [&_svg]:size-3.5">
          <span className="inline-flex items-center gap-1.5 tabular-nums"><IconClock aria-hidden="true" />{time}</span>
          <span className="inline-flex items-center gap-1.5">{online ? <IconVideo aria-hidden="true" /> : <IconPin aria-hidden="true" />}{place}</span>
        </p>
        {attendees || action ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            {attendees ? <div className="text-xs text-muted-foreground">{attendees}</div> : <span />}
            {action}
          </div>
        ) : null}
      </div>
    </article>
  );
}
