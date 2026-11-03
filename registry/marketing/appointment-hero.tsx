import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconCalendar, IconPhone } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface AppointmentChip {
  /** One reassurance in a few words: "Most insurers accepted". */
  label: string;
  /** An icon from @rhs-ui/icons, as an element: <IconShieldCheck />. It decorates; the label says it. */
  icon?: ReactNode;
}

export interface AppointmentPractitioner {
  /** Who the visitor will see: "Dr. Priya Nair". */
  name: string;
  /** What they do: "General practitioner". */
  role?: string;
  /** Their portrait as an image address. The initials show until it loads, or when it is left out. */
  image?: string;
}

export interface AppointmentSlot {
  /** The day as the visitor would say it: "Today", "Tomorrow", "Thu 5 Nov". */
  label: string;
  /** The time, as it should read: "14:30". */
  time: string;
  /** A machine-readable moment for the time element: "2026-11-03T14:30". Leave it out for plain text. */
  dateTime?: string;
  /** Who the time is with. */
  practitioner: AppointmentPractitioner;
  /** Your booking page for exactly this time. The row is a plain link, so the hero holds no half-finished flow. */
  href: string;
}

export interface AppointmentUrgent {
  /** What the line is for: "Urgent, same-day help". */
  label: string;
  /** The number as people read it: "020 555 0142". The tel: link is made from it. */
  phone: string;
  /** When someone answers: "Every day, 07:00 to 22:00". */
  hours: string;
}

export interface AppointmentHeroLabels {
  /** The primary action. */
  book: string;
  /** The heading of the card of times. */
  nextAvailable: string;
  /** The link in the card's header that opens every time. */
  viewAll: string;
  /** What the card says when no time is free. */
  noSlots: string;
  /** Read between the time and the practitioner, for screen readers: "14:30, with Dr. Nair". */
  with: string;
}

export interface AppointmentHeroProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The title's element: "h1" by default, because a clinic's opening is the heading of its page; "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2";
  /** The promise, in a line or two: "Care that fits your week". */
  title: string;
  /** One or two sentences that say who it is for and how quickly they are seen. */
  description: string;
  /** What puts the visitor at ease, with an icon each: insurance accepted, languages spoken, same-day. Three read best. */
  chips?: readonly AppointmentChip[];
  /** The next free times, soonest first. Three fit the card. An empty list shows `nextOpening` instead. */
  slots: readonly AppointmentSlot[];
  /** When there is no free time: when the next ones open, as a sentence: "New times open on Monday at 08:00." */
  nextOpening?: string;
  /** The line for urgent cases, under the card: a phone number and its hours. */
  urgent?: AppointmentUrgent;
  /** The page with every time. The primary button and the card's header link lead there. */
  bookHref: string;
  /** A second, quieter action: "Meet the team". */
  secondary?: { label: string; href: string };
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<AppointmentHeroLabels>;
}

const LABELS: AppointmentHeroLabels = {
  book: "Book an appointment",
  nextAvailable: "Next available",
  viewAll: "See all times",
  noSlots: "No online times are free right now.",
  with: "with",
};

/** "+31 (0)20 555 0142" -> "+31205550142": what a tel: link wants. */
const telOf = (phone: string) => phone.replace(/\(0\)/g, "").replace(/[^\d+]/g, "");

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/**
 * The opening of a clinic, practice or wellbeing studio: a calm promise and
 * the things that put a visitor at ease (insurance, languages, same-day) on
 * the left, and on the right a card with the next three free times, each a
 * plain link into your booking page with the practitioner's face beside it.
 * Under the card sits a line for urgent cases with the number as a tel: link
 * and its hours. There is no half-finished booking flow inside the hero: it
 * shows times and sends people to the page that books them. When no time is
 * free, the card says when the next ones open instead of standing empty.
 */
export function AppointmentHero({
  titleAs: Title = "h1",
  title,
  description,
  chips = [],
  slots,
  nextOpening,
  urgent,
  bookHref,
  secondary,
  labels,
  className,
  ...props
}: AppointmentHeroProps) {
  const words = { ...LABELS, ...labels };
  const id = useId();
  // The card's heading sits one level under the title.
  const Sub = Title === "h1" ? "h2" : "h3";

  return (
    <section data-slot="appointment-hero" className={cn("grid grid-cols-1 items-center gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16", className)} {...props}>
      <div className="min-w-0">
        <Title className="max-w-xl text-4xl leading-[1.04] font-medium tracking-[-0.04em] text-balance sm:text-5xl lg:text-6xl">{title}</Title>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">{description}</p>

        {chips.length ? (
          <ul className="mt-7 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.label}>
                <Badge variant="outline" className="h-8 gap-2 px-3 text-[0.8125rem] font-normal text-foreground [&>svg]:size-4 [&>svg]:text-muted-foreground">
                  {chip.icon}
                  {chip.label}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        <div className={cn("flex flex-wrap items-center gap-3", chips.length ? "mt-8" : "mt-9")}>
          <Button asChild size="lg" className="max-sm:grow">
            <a href={bookHref}>
              <IconCalendar />
              {words.book}
            </a>
          </Button>
          {secondary ? (
            <Button asChild size="lg" variant="outline" className="max-sm:grow">
              <a href={secondary.href}>{secondary.label}</a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-w-0 space-y-3">
        <div data-slot="appointment-hero-card" className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-5">
            <Sub id={`${id}-next`} className="text-sm font-medium">
              {words.nextAvailable}
            </Sub>
            <a href={bookHref} className={cn("rounded-sm text-sm text-muted-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 hover:text-foreground hover:decoration-foreground motion-reduce:transition-none", FOCUS)}>
              {words.viewAll}
            </a>
          </div>

          {slots.length ? (
            <ul aria-labelledby={`${id}-next`} className="divide-y divide-border">
              {slots.map((slot) => {
                const moment = (
                  <>
                    <span className="block text-xs leading-4 text-muted-foreground">{slot.label}</span>
                    <span className="mt-0.5 block text-xl leading-6 font-medium tracking-[-0.02em] text-foreground tabular-nums">{slot.time}</span>
                  </>
                );
                const { practitioner } = slot;
                return (
                  <li key={`${slot.label}-${slot.time}-${practitioner.name}`}>
                    <a
                      href={slot.href}
                      className={cn("group/slot flex items-center gap-3 px-4 py-4 transition-colors duration-150 hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:ring-inset motion-reduce:transition-none sm:gap-4 sm:px-5", FOCUS)}
                    >
                      {/* The day and time take what they need, between a floor that keeps the rows level and a ceiling: a longer day ("Wednesday 18 November") wraps instead of squeezing the name. */}
                      {slot.dateTime ? (
                        <time dateTime={slot.dateTime} className="max-w-24 min-w-16 shrink-0">
                          {moment}
                        </time>
                      ) : (
                        <span className="max-w-24 min-w-16 shrink-0">{moment}</span>
                      )}
                      <Avatar aria-hidden="true" className="data-[size=default]:size-10">
                        {practitioner.image ? <AvatarImage src={practitioner.image} alt="" /> : null}
                        <AvatarFallback>{initialsOf(practitioner.name)}</AvatarFallback>
                      </Avatar>
                      {/* Who the time is with is the one fact the row exists to show, so the name and the role wrap rather than being cut short. */}
                      <span className="min-w-0 flex-1">
                        <span className="sr-only">, {words.with} </span>
                        <span className="block text-[0.9375rem] leading-5 font-medium text-pretty break-words text-foreground">{practitioner.name}</span>
                        {practitioner.role ? <span className="block text-sm leading-5 text-pretty break-words text-muted-foreground">{practitioner.role}</span> : null}
                      </span>
                      <IconArrowRight className="size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-150 group-hover/slot:translate-x-0.5 group-hover/slot:text-foreground max-[22rem]:hidden motion-reduce:transition-none" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="px-5 py-10 text-center">
              <span aria-hidden="true" className="mx-auto grid size-10 place-items-center rounded-full border border-border text-muted-foreground">
                <IconCalendar className="size-5" />
              </span>
              <p className="mt-4 text-base font-medium">{words.noSlots}</p>
              {nextOpening ? <p className="mt-1 text-sm text-muted-foreground">{nextOpening}</p> : null}
            </div>
          )}
        </div>

        {urgent ? (
          <a
            data-slot="appointment-hero-urgent"
            href={`tel:${telOf(urgent.phone)}`}
            className={cn("group/urgent flex items-center gap-4 rounded-xl border border-border bg-muted/50 px-5 py-4 transition-colors duration-150 hover:bg-muted motion-reduce:transition-none", FOCUS)}
          >
            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
              <IconPhone className="size-[18px]" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm leading-5 text-muted-foreground">{urgent.label}</span>
              <span className="block text-lg leading-6 font-medium tracking-[-0.01em] text-foreground tabular-nums">{urgent.phone}</span>
              <span className="block text-sm leading-5 text-muted-foreground">{urgent.hours}</span>
            </span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
