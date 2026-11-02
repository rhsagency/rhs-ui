"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { countText, durationText, fill, listOf, priceText, scoreText } from "@rhs-ui/application/tour-card/format";
import { RatingInline } from "@rhs-ui/commerce/rating-inline";
import { IconArrowRight, IconCheck, IconClock, IconHeart, IconImage, IconInfo, IconLanguage, IconPin, IconUsers } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button, buttonVariants } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The picture at the top. */
export interface TourImage {
  /** The picture's address. */
  src: string;
  /** What it shows: "A canal boat passing under a stone bridge". Leave it out for a picture that only decorates. */
  alt?: string;
}

/** The words the card uses, for translation. `{name}`, `{count}`, `{rating}` and `{price}` are filled in. */
export interface TourCardLabels {
  /** The save button's name; it keeps this name whether it is on or off, and `aria-pressed` says which. Default "Save {title}". */
  save?: string;
  /** Said when there is no photo. Default "No photo yet". */
  noPhoto?: string;
  /** Said when the photo did not load. Default "Photo unavailable". */
  photoFailed?: string;
  /** Said to screen readers before the place. Default "Location". */
  location?: string;
  /** The names of the facts, said to screen readers. */
  duration?: string;
  groupSize?: string;
  languages?: string;
  /** The size of the group. Default "Up to {count} people". */
  groupUpTo?: string;
  /** The size of a group of one. Default "One person". */
  groupOne?: string;
  /** The word before the price. Default "From". */
  from?: string;
  /** The words after the price. Default "per person". */
  perPerson?: string;
  /** The name of the cancellation fact, said to screen readers. Default "Cancellation". */
  cancellationTerm?: string;
  /** What a free cancellation says when `cancellation` is `true`. Default "Free cancellation". */
  cancellation?: string;
  /** The look of the action on a tour that can be booked. It is a hint: the title is the link. Default "Check availability". */
  cta?: string;
  /** The same on a tour that is sold out. Default "Sold out". */
  soldOut?: string;
  /** What a screen reader hears for the stars when there is no count. Default "Rated {rating} out of 5". */
  rated?: string;
  /** What a screen reader hears for the stars, with the count. Default "Rated {rating} out of 5 from {count} reviews". */
  ratedCount?: string;
  /** The same for exactly one review. Default "Rated {rating} out of 5 from 1 review". */
  ratedOne?: string;
  /** What the rating says when nobody has reviewed yet. Default "No reviews yet". */
  noReviews?: string;
}

export interface TourCardProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** What the tour is called: "Canal cruise with a local skipper". It is the one link of the card. */
  title: string;
  /** Its picture. The box keeps its shape from the first paint; without a picture, or when it does not load, a quiet tile says so. */
  image?: string | TourImage;
  /** Where it takes place: "Amsterdam, Netherlands". */
  location?: string;
  /** How long it takes: a number of minutes (written in words by Intl: "3 hours", "1 hour 30 minutes", "2 days") or your own words. */
  duration?: number | string;
  /** How many people go at most: a number is written "Up to 12 people"; a string is shown as you wrote it. */
  groupSize?: number | string;
  /** The languages it is given in: "English", "Dutch". Written as a short list, "English, Dutch". */
  languages?: readonly string[];
  /** The average rating, 0 to 5, drawn as stars with the score and the count; a screen reader hears it as a sentence. */
  rating?: number;
  /** How many reviews the score rests on. Zero says "No reviews yet" in place of the stars. */
  ratingCount?: number;
  /** The lowest price per person, in whole units of the currency: 45 is "€45". It reads "From €45 per person". */
  priceFrom?: number;
  /** The ISO 4217 code of the currency. Default "EUR". */
  currency?: string;
  /** Whether you can cancel for free: `true` says "Free cancellation", a string says it your way ("Free cancellation up to 24 hours before"). Left out when it is not offered, never written as "no". */
  cancellation?: boolean | string;
  /** A word on the picture: "Bestseller", "New". */
  badge?: string;
  /** The tour has no places left. The action reads "Sold out", the price is muted, and a string says why: "Next departure on 14 Nov". The title stays a link, so people can still find other dates. */
  soldOut?: boolean | string;
  /** The tour's page. The title becomes a link and the whole card opens it, the picture included. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the title becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Whether the tour is saved, controlled. The save button is a toggle with `aria-pressed`. */
  saved?: boolean;
  /** Whether the tour starts saved, when you do not control `saved`. */
  defaultSaved?: boolean;
  /** The save button was pressed, with the state it asks for. Leave it out, and leave `saved` out, and there is no save button. */
  onSave?: (saved: boolean) => void;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers, the units and the price. Default "en-US". */
  locale?: string;
  /** The words the card uses, for translation. */
  labels?: TourCardLabels;
}

const DEFAULT_LABELS = {
  save: "Save {title}",
  noPhoto: "No photo yet",
  photoFailed: "Photo unavailable",
  location: "Location",
  duration: "Duration",
  groupSize: "Group size",
  languages: "Languages",
  cancellationTerm: "Cancellation",
  groupUpTo: "Up to {count} people",
  groupOne: "One person",
  from: "From",
  perPerson: "per person",
  cancellation: "Free cancellation",
  cta: "Check availability",
  soldOut: "Sold out",
  rated: "Rated {rating} out of 5",
  ratedCount: "Rated {rating} out of 5 from {count} reviews",
  ratedOne: "Rated {rating} out of 5 from 1 review",
  noReviews: "No reviews yet",
};

/** A fact of the tour: a glyph, a name for screen readers and the value. The glyph is decorative, so a fact is never an icon alone. */
function Fact({ glyph, term, strong = false, children }: { glyph: ReactNode; term: string; strong?: boolean; children: ReactNode }) {
  return (
    <div>
      <dt className="sr-only">{term}</dt>
      <dd className={cn("flex min-w-0 items-start gap-2.5 [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", strong ? "font-medium" : "[&>svg]:text-muted-foreground")}>
        {glyph}
        <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
      </dd>
    </div>
  );
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

/** What stretches the title's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * A picture that failed before the page was interactive left no error for React
 * to hear, and the browser does not say it twice. One that looks lost (finished,
 * with no width) is asked for once more: that answer is heard.
 */
function askAgain(img: HTMLImageElement | null, lost: () => void) {
  if (!img || !img.complete || img.naturalWidth > 0 || !img.currentSrc) return;
  const probe = new Image();
  probe.onerror = lost;
  probe.src = img.currentSrc;
}

/**
 * A guided tour or activity as a card in a listing: a picture with an
 * optional word on it, the place, the title as the one link of the card, the
 * rating drawn to the exact average and read as a sentence, and the facts as
 * a real description list with their units in words ("3 hours", "Up to 12
 * people", "English, Dutch"), never an icon alone. "Free cancellation" is
 * written out and simply not there when it is not offered. At the foot the
 * price reads "From €45 per person", formatted by Intl, beside a hint of the
 * action. A sold-out tour keeps its link, mutes the price, says "Sold out"
 * and, when you give a reason, why. The save button is a heart toggle with
 * `aria-pressed` whose name carries the tour; it is its own target above the
 * card's link.
 */
export function TourCard({
  title,
  image,
  location,
  duration,
  groupSize,
  languages,
  rating,
  ratingCount,
  priceFrom,
  currency = "EUR",
  cancellation,
  badge,
  soldOut,
  href,
  onOpen,
  saved: controlled,
  defaultSaved = false,
  onSave,
  headingLevel = 3,
  locale = "en-US",
  labels,
  className,
  ...props
}: TourCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const [own, setOwn] = useState(defaultSaved);
  // The address of a picture that did not load: the quiet tile takes its place, not the browser's broken-picture icon.
  const [broken, setBroken] = useState<string | null>(null);
  const photo = useRef<HTMLImageElement>(null);
  const saved = controlled ?? own;
  const canSave = onSave !== undefined || controlled !== undefined;
  const picture = typeof image === "string" ? { src: image } : image;
  const source = picture?.src;
  useEffect(() => {
    if (source) askAgain(photo.current, () => setBroken(source));
  }, [source]);
  const out = Boolean(soldOut);
  const reason = typeof soldOut === "string" ? soldOut : null;
  const length = typeof duration === "number" ? durationText(duration, locale) : duration;
  const group = typeof groupSize === "number" ? (groupSize === 1 ? text.groupOne : fill(text.groupUpTo, { count: countText(groupSize, locale) })) : groupSize;
  const spoken = languages?.length ? listOf(languages, locale) : null;
  const free = cancellation === true ? text.cancellation : typeof cancellation === "string" && cancellation ? cancellation : null;
  const stars =
    rating === undefined
      ? undefined
      : ratingCount === undefined
        ? fill(text.rated, { rating: scoreText(rating, locale) })
        : fill(ratingCount === 1 ? text.ratedOne : text.ratedCount, { rating: scoreText(rating, locale), count: countText(ratingCount, locale) });
  const hasFacts = Boolean(length || group || spoken || free);
  const label = <span className="line-clamp-2 [overflow-wrap:anywhere]">{title}</span>;

  return (
    <article
      data-slot="tour-card"
      data-sold-out={out ? "" : undefined}
      aria-labelledby={titleId}
      className={cn(
        "group/tour-card relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=tour-card-open]:focus-visible]:border-ring has-[[data-slot=tour-card-open]:focus-visible]:ring-[3px] has-[[data-slot=tour-card-open]:focus-visible]:ring-ring/40",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="relative border-b border-border">
        <AspectRatio ratio={3 / 2} className="bg-muted">
          {picture && broken !== picture.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- framework-neutral: a plain picture, which any optimiser can replace
            <img ref={photo} src={picture.src} alt={picture.alt ?? ""} loading="lazy" decoding="async" onError={() => setBroken(picture.src)} className="size-full object-cover transition-transform duration-500 ease-out group-hover/tour-card:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover/tour-card:scale-100" />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <span className="grid justify-items-center gap-1.5 text-xs">
                <IconImage className="size-6" />
                {picture ? text.photoFailed : text.noPhoto}
              </span>
            </div>
          )}
        </AspectRatio>
        {badge ? (
          <Badge variant="default" className="absolute top-3 left-3 h-6 px-2.5 text-[0.8125rem] shadow-xs">
            {badge}
          </Badge>
        ) : null}
        {canSave ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-pressed={saved}
            aria-label={fill(text.save, { title })}
            onClick={() => {
              if (controlled === undefined) setOwn(!saved);
              onSave?.(!saved);
            }}
            className="absolute top-3 right-3 z-10 size-9 rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground"
          >
            <IconHeart className={cn("size-[1.125rem] transition-transform duration-200 motion-reduce:transition-none", saved && "scale-110 fill-current")} />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-4">
        <div className="grid grid-cols-1 gap-1.5">
          {location ? (
            <p className="flex items-center gap-1.5 text-[0.8125rem] leading-5 text-muted-foreground">
              <IconPin className="size-3.5 shrink-0" />
              <span className="sr-only">{text.location}: </span>
              <span className="min-w-0 truncate">{location}</span>
            </p>
          ) : null}
          <Heading id={titleId} className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
            {href ? (
              <a data-slot="tour-card-open" href={href} onClick={onOpen} className={OPEN}>
                {label}
              </a>
            ) : onOpen ? (
              <button data-slot="tour-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                {label}
              </button>
            ) : (
              label
            )}
          </Heading>
        </div>

        {rating !== undefined ? <Score value={rating} count={ratingCount} size="md" label={stars} locale={locale} emptyText={text.noReviews} /> : null}

        {hasFacts ? (
          <dl className="grid grid-cols-1 gap-2 text-sm leading-5">
            {length ? (
              <Fact glyph={<IconClock />} term={text.duration}>
                {length}
              </Fact>
            ) : null}
            {group ? (
              <Fact glyph={<IconUsers />} term={text.groupSize}>
                {group}
              </Fact>
            ) : null}
            {spoken ? (
              <Fact glyph={<IconLanguage />} term={text.languages}>
                {spoken}
              </Fact>
            ) : null}
            {free ? (
              <Fact glyph={<IconCheck strokeWidth={2.25} />} term={text.cancellationTerm} strong>
                {free}
              </Fact>
            ) : null}
          </dl>
        ) : null}

        <div className="mt-auto grid grid-cols-1 gap-3 pt-1">
          {reason ? (
            <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-[0.8125rem] leading-5">
              <IconInfo className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{reason}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border pt-3.5">
            {priceFrom !== undefined ? (
              <p className="flex flex-wrap items-baseline gap-x-1.5 text-[0.8125rem] leading-5 text-muted-foreground tabular-nums">
                <span>{text.from}</span>
                <span className={cn("text-lg leading-6 font-semibold tracking-[-0.02em]", out ? "text-muted-foreground" : "text-foreground")}>{priceText(priceFrom, currency, locale)}</span>
                <span>{text.perPerson}</span>
              </p>
            ) : null}
            {/* A hint of the action. The title is the link and the whole card opens it, so this is not a second link, and a screen reader skips it. Sold out it is a state, so it is read. */}
            <span
              aria-hidden={out ? undefined : true}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "pointer-events-none ml-auto transition-colors duration-150 motion-reduce:transition-none",
                out ? "border-dashed text-muted-foreground" : "group-hover/tour-card:bg-muted",
              )}
            >
              {out ? text.soldOut : text.cta}
              {out ? null : <IconArrowRight />}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
