import type { ReactNode } from "react";

import { IconCalendar, IconPin, IconUsers } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface EventHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  /** "Conference", "Workshop", "Meetup". */
  kind?: string;
  title: string;
  description?: string;
  /** Already formatted: "12 to 13 June 2026". */
  date: string;
  /** Machine-readable start for the time element: "2026-06-12". */
  dateTime: string;
  venue: string;
  /** "600 seats", "Online and in Utrecht". */
  capacity?: string;
  actions?: ReactNode;
  /** A countdown, a speaker strip or a photo of last year. */
  aside?: ReactNode;
  className?: string;
}

/**
 * The opening of an event page: what, when and where as facts with icons,
 * the ticket action, and room for a countdown or the speakers. The date is
 * a real time element so calendars and search read it.
 */
export function EventHero({ titleAs: Title = "h2", kind, title, description, date, dateTime, venue, capacity, actions, aside, className }: EventHeroProps) {
  const facts = [
    { icon: <IconCalendar />, text: <time dateTime={dateTime}>{date}</time> },
    { icon: <IconPin />, text: venue },
    ...(capacity ? [{ icon: <IconUsers />, text: capacity }] : []),
  ];
  return (
    <section data-slot="event-hero" className={cn("grid gap-10 py-16 sm:py-20 lg:grid-cols-[1.3fr_1fr] lg:items-end", className)}>
      <div>
        {kind ? <p className="inline-flex rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">{kind}</p> : null}
        <Title className="mt-5 text-5xl font-medium leading-[1.02] tracking-[-.055em] text-balance sm:text-6xl lg:text-7xl">{title}</Title>
        {description ? <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        <ul className="mt-8 flex flex-col gap-3 text-sm sm:flex-row sm:flex-wrap sm:gap-x-8">
          {facts.map((fact, index) => (
            <li key={index} className="flex items-center gap-2.5 [&_svg]:size-4.5 [&_svg]:text-muted-foreground">{fact.icon}{fact.text}</li>
          ))}
        </ul>
        {actions ? <div className="mt-9 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {aside ? <div className="rounded-3xl border border-border p-6">{aside}</div> : null}
    </section>
  );
}
