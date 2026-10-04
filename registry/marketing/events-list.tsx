import { IconArrowRight, IconPin, IconVideo } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ListedEvent {
  href: string;
  title: string;
  /** Day and month for the date block: "14", "Apr". */
  day: string;
  month: string;
  dateTime: string;
  /** "18:30 to 21:00". */
  time: string;
  /** "Amsterdam" or "Online". */
  place: string;
  online?: boolean;
  /** "Free", "€25", "Sold out". */
  price?: string;
}

export interface EventsListProps {
  title: string;
  description?: string;
  events: readonly ListedEvent[];
  className?: string;
}

/**
 * Upcoming events as rows with a calendar block: day large, month small,
 * then what, when and where with an icon for online or in person, and the
 * price. Each row links to the event; dates are real time elements.
 */
export function EventsList({ title, description, events, className }: EventsListProps) {
  return (
    <section data-slot="events-list" className={cn("py-16 sm:py-20", className)}>
      <h2 className="text-3xl font-medium tracking-[-.04em]">{title}</h2>
      {description ? <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      <ul className="mt-10 divide-y divide-border border-y border-border">
        {events.map((event) => (
          <li key={`${event.href}-${event.title}`}>
            <a href={event.href} className="group flex items-center gap-5 py-5 outline-none focus-visible:bg-muted/60">
              <time dateTime={event.dateTime} className="flex w-14 shrink-0 flex-col items-center rounded-xl border border-border py-2">
                <span className="text-xl font-medium tabular-nums">{event.day}</span>
                <span className="text-[10px] tracking-[.1em] text-muted-foreground uppercase">{event.month}</span>
              </time>
              <span className="min-w-0 flex-1">
                <span className="block font-medium group-hover:underline group-hover:underline-offset-4">{event.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="tabular-nums">{event.time}</span>
                  <span className="inline-flex items-center gap-1.5 [&_svg]:size-3.5">{event.online ? <IconVideo aria-hidden="true" /> : <IconPin aria-hidden="true" />}{event.place}</span>
                </span>
              </span>
              {event.price ? <span className="hidden text-sm font-medium sm:block">{event.price}</span> : null}
              <IconArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
