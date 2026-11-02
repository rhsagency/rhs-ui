"use client";

import { useEffect, useId, useState, type ComponentProps, type MouseEvent } from "react";

import { countText, dateIn, fill, scoreText, slotText, withoutTitles, type DateInput } from "@rhs-ui/application/specialist-card/format";
import { RatingInline } from "@rhs-ui/commerce/rating-inline";
import { IconCalendar } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the card uses, for translation. `{name}`, `{day}`, `{time}`, `{rating}` and `{count}` are filled in. */
export interface SpecialistCardLabels {
  /** The label of the specialties. Default "Specialties". */
  specialties?: string;
  /** The label of the languages. Default "Speaks". */
  languages?: string;
  /** The label over the next free slot. Default "Next available". */
  nextAvailable?: string;
  /** What a person with no free slot says. Default "No slots this week". */
  noSlots?: string;
  /** The word for today in the next slot. Default "Today". */
  today?: string;
  /** The word for tomorrow in the next slot. Default "Tomorrow". */
  tomorrow?: string;
  /** How the day and the time are put together. Default "{day}, {time}". */
  slot?: string;
  /** The button. Default "Book". */
  book?: string;
  /** The name of the button, so a list of them is not a list of "Book". Default "Book {name}". */
  bookFor?: string;
  /** What a screen reader hears for the stars when there is no count. Default "Rated {rating} out of 5". */
  rated?: string;
  /** What a screen reader hears for the stars, with the count. Default "Rated {rating} out of 5 from {count} reviews". */
  ratedCount?: string;
  /** The same for exactly one review. Default "Rated {rating} out of 5 from 1 review". */
  ratedOne?: string;
  /** What the rating says when nobody has reviewed yet. Default "No reviews yet". */
  noReviews?: string;
}

export interface SpecialistCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** Their name: "Dr. Mara Okafor". It is the one link of the card. */
  name: string;
  /** What they are: "Cardiologist". */
  role?: string;
  /** Their picture, as an image address. Without one, or while it loads, the avatar shows their initials. */
  image?: string;
  /** The letters in the avatar until the picture shows. Leave it out to take them from the name without the titles in front of it ("Dr. Ines Kowalski" is IK). */
  initials?: string;
  /** What they focus on, as word chips. */
  specialties?: readonly string[];
  /** The languages they speak, as word chips: "English", "Dutch". */
  languages?: readonly string[];
  /** The average rating, 0 to 5, drawn as stars with the score and the count; a screen reader hears it as a sentence. */
  rating?: number;
  /** How many reviews the score rests on. Zero says "No reviews yet" in place of the stars. */
  ratingCount?: number;
  /** When they are free next: a Date, a timestamp or an ISO string with its offset. It is written the way a person says it ("Tomorrow, 10:30") in a `time` element. `null` says "No slots this week" and disables the button, with that as its reason. Leave it out to show no slot at all. */
  nextAvailable?: DateInput | null;
  /** The Book button was pressed. Leave it out and there is no button. */
  onBook?: () => void;
  /** Their profile. The name becomes a link and the whole card opens it; the Book button stays its own target. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the name becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The moment "today" and "tomorrow" are measured from. Leave it out to use the browser's clock, read once the page is live (until then the slot is written as a date); pass it to get the same words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates and numbers. Default "en-US". */
  locale?: string;
  /** The time zone the slot is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: SpecialistCardLabels;
}

const DEFAULT_LABELS = {
  specialties: "Specialties",
  languages: "Speaks",
  nextAvailable: "Next available",
  noSlots: "No slots this week",
  today: "Today",
  tomorrow: "Tomorrow",
  slot: "{day}, {time}",
  book: "Book",
  bookFor: "Book {name}",
  rated: "Rated {rating} out of 5",
  ratedCount: "Rated {rating} out of 5 from {count} reviews",
  ratedOne: "Rated {rating} out of 5 from 1 review",
  noReviews: "No reviews yet",
};

/** The browser's clock, once the page is live and then every minute while it is needed. Null on the server and before hydration, so both write the same text. */
function useNow(fixed: DateInput | undefined, needed: boolean): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = fixed !== undefined && !Number.isNaN(new Date(fixed).getTime());
  useEffect(() => {
    if (pinned || !needed) return;
    const read = () => setTick(Date.now());
    read();
    const timer = window.setInterval(read, 60_000);
    return () => window.clearInterval(timer);
  }, [pinned, needed]);
  return pinned ? new Date(fixed as DateInput).getTime() : tick;
}

/**
 * The rating line: stars drawn to the exact average and the score, then the
 * count written in full ("1,284"), not shortened ("1.3k"). A shortened number
 * is written differently by Node and by the browser in some languages, and
 * the server and the browser have to agree. A screen reader hears `label`
 * for all of it, so the count is hidden from it.
 */
function Score({ value, count, label, locale, size, emptyText, className }: { value: number; count?: number; label?: string; locale: string; size: "sm" | "md"; emptyText?: string; className?: string }) {
  return (
    <span className={cn("inline-flex max-w-full flex-wrap items-center gap-y-0.5", size === "sm" ? "gap-x-1 text-xs" : "gap-x-1.5 text-sm", className)}>
      <RatingInline value={value} count={count} hideCount size={size} label={label} locale={locale} emptyText={emptyText} />
      {count !== undefined && count > 0 ? (
        <span aria-hidden="true" className="leading-none text-muted-foreground tabular-nums">
          ({countText(count, locale)})
        </span>
      ) : null}
    </span>
  );
}

/** What stretches the name's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * A person you can book, for a clinic, a salon, a coach, a tutor or an
 * adviser: their picture (initials until it loads), the name as the one link of
 * the card, what they are, the rating drawn to the exact average and read as
 * a sentence, their specialties and languages as word chips, and the next free
 * slot written the way a person says it ("Tomorrow, 10:30") in a `time`
 * element. The Book button is its own target above the card's link. A person
 * with no slot says "No slots this week" and the button is disabled with that
 * as its reason, so it stays findable by keyboard.
 */
export function SpecialistCard({
  name,
  role,
  image,
  initials,
  specialties,
  languages,
  rating,
  ratingCount,
  nextAvailable,
  onBook,
  href,
  onOpen,
  headingLevel = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: SpecialistCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const nameId = useId();
  const slotId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const slotAt = nextAvailable === undefined || nextAvailable === null ? Number.NaN : new Date(nextAvailable).getTime();
  const free = !Number.isNaN(slotAt);
  const none = nextAvailable === null;
  const clock = useNow(now, free);
  const stars =
    rating === undefined
      ? undefined
      : ratingCount === undefined
        ? fill(text.rated, { rating: scoreText(rating, locale) })
        : fill(ratingCount === 1 ? text.ratedOne : text.ratedCount, { rating: scoreText(rating, locale), count: countText(ratingCount, locale) });

  const label = <span className="[overflow-wrap:anywhere]">{name}</span>;
  const chips = (heading: string, items: readonly string[] | undefined, variant: "secondary" | "outline") =>
    items?.length ? (
      <>
        <dt className="pt-0.5 text-muted-foreground">{heading}</dt>
        <dd>
          <ul className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <li key={item} className="max-w-full min-w-0">
                {/* A chip that is longer than the card wraps its words instead of pushing the card wider. */}
                <Badge variant={variant} className="h-auto min-h-6 max-w-full px-2.5 py-0.5 text-left text-[0.8125rem] leading-snug whitespace-normal [overflow-wrap:anywhere]">
                  {item}
                </Badge>
              </li>
            ))}
          </ul>
        </dd>
      </>
    ) : null;

  return (
    <article
      data-slot="specialist-card"
      data-slots={free ? "some" : none ? "none" : undefined}
      aria-labelledby={nameId}
      className={cn(
        "group/specialist-card @container relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=specialist-card-open]:focus-visible]:border-ring has-[[data-slot=specialist-card-open]:focus-visible]:ring-[3px] has-[[data-slot=specialist-card-open]:focus-visible]:ring-ring/40",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border border-border data-[size=default]:size-16">
            {image ? <AvatarImage src={image} alt="" /> : null}
            <AvatarFallback className="text-lg">{initials?.trim() || initialsOf(withoutTitles(name)) || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <Heading id={nameId} className="text-[1.0625rem] leading-snug font-semibold tracking-[-0.02em] text-balance">
              {href ? (
                <a data-slot="specialist-card-open" href={href} onClick={onOpen} className={OPEN}>
                  {label}
                </a>
              ) : onOpen ? (
                <button data-slot="specialist-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                  {label}
                </button>
              ) : (
                label
              )}
            </Heading>
            {role ? <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{role}</p> : null}
            {rating !== undefined ? <Score value={rating} count={ratingCount} size="md" label={stars} locale={locale} emptyText={text.noReviews} className="mt-1.5" /> : null}
          </div>
        </div>

        {specialties?.length || languages?.length ? (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-[0.8125rem] leading-5 @max-[22rem]:grid-cols-1 @max-[22rem]:gap-y-1 @max-[22rem]:[&>dt:not(:first-child)]:mt-2">
            {chips(text.specialties, specialties, "secondary")}
            {chips(text.languages, languages, "outline")}
          </dl>
        ) : null}
      </div>

      {free || none || onBook ? (
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-border bg-muted/30 px-5 py-3.5">
          {free || none ? (
            <div id={slotId} className="min-w-0">
              <p className="text-xs leading-4 text-muted-foreground">{text.nextAvailable}</p>
              {free ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm leading-5 font-medium">
                  <IconCalendar className="size-4 shrink-0 text-muted-foreground" />
                  <time dateTime={new Date(slotAt).toISOString()}>
                    {slotText(slotAt, clock, locale, timeZone, { today: text.today, tomorrow: text.tomorrow, pattern: text.slot })}
                    <span className="sr-only">{` (${dateIn(slotAt, locale, timeZone, { weekday: "long", day: "numeric", month: "long" })})`}</span>
                  </time>
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-sm leading-5 text-muted-foreground">
                  <IconCalendar className="size-4 shrink-0" />
                  {text.noSlots}
                </p>
              )}
            </div>
          ) : null}
          {onBook ? (
            <Button
              type="button"
              size="sm"
              aria-label={fill(text.bookFor, { name })}
              aria-describedby={free || none ? slotId : undefined}
              aria-disabled={none || undefined}
              onClick={() => {
                if (!none) onBook();
              }}
              // Not `pointer-events-none` when it is disabled: a click on it must be swallowed here, not fall through to the profile link under it.
              className="relative z-10 ml-auto shrink-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:hover:bg-primary aria-disabled:active:not-disabled:translate-none"
            >
              {text.book}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
