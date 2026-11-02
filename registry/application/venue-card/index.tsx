"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { countText, distanceText, fill, scoreText, timeText, type DateInput } from "@rhs-ui/application/venue-card/format";
import { RatingInline } from "@rhs-ui/commerce/rating-inline";
import { IconHeart, IconImage } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** How much a visit costs, from one symbol to four. */
export type VenuePriceLevel = 1 | 2 | 3 | 4;

/** The picture at the top. */
export interface VenueImage {
  /** The picture's address. */
  src: string;
  /** What it shows: "The terrace at Café Halcyon". Leave it out for a picture that only decorates. */
  alt?: string;
}

/** The words the card uses, for translation. `{name}`, `{time}`, `{count}`, `{rating}` and `{price}` are filled in. */
export interface VenueCardLabels {
  /** The save button's name; it keeps this name whether it is on or off, and `aria-pressed` says which. Default "Save {name}". */
  save?: string;
  /** Said when there is no photo. Default "No photo yet". */
  noPhoto?: string;
  /** Said when the photo did not load. Default "Photo unavailable". */
  photoFailed?: string;
  /** Said to screen readers before the price level. Default "Price". */
  price?: string;
  /** The word for each price level, read to screen readers in place of the symbols. */
  priceLevels?: Partial<Record<VenuePriceLevel, string>>;
  /** Said to screen readers after the distance. Default "away". */
  away?: string;
  /** What a venue that is open says without a closing time. Default "Open". */
  open?: string;
  /** What a venue that is open says with one. Default "Open until {time}". */
  openUntil?: string;
  /** What a venue that is closed says. Default "Closed". */
  closed?: string;
  /** What a venue that is closed says when it knows when it opens. Default "Closed, opens at {time}". */
  closedOpens?: string;
  /** The name of the list of tags. Default "Features". */
  tags?: string;
  /** Said to screen readers for the tags that did not fit. Default "{count} more". */
  moreTags?: string;
  /** What a screen reader hears for the stars when there is no count. Default "Rated {rating} out of 5". */
  rated?: string;
  /** What a screen reader hears for the stars, with the count. Default "Rated {rating} out of 5 from {count} reviews". */
  ratedCount?: string;
  /** The same for exactly one review. Default "Rated {rating} out of 5 from 1 review". */
  ratedOne?: string;
  /** What the rating says when nobody has reviewed yet. Default "No reviews yet". */
  noReviews?: string;
}

export interface VenueCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The venue's name: "Café Halcyon". It is the one link of the card. */
  name: string;
  /** Its picture. The box keeps its shape from the first paint; without a picture, or when it does not load, a quiet tile says so. */
  image?: string | VenueImage;
  /** What kind of place it is: "Coffee shop". */
  category?: string;
  /** The average rating, 0 to 5, drawn as stars with the score and the count; a screen reader hears it as a sentence. */
  rating?: number;
  /** How many reviews the score rests on. Zero says "No reviews yet" in place of the stars. */
  ratingCount?: number;
  /** How much a visit costs, 1 to 4. It is drawn as symbols, with the word ("Moderate") said to screen readers in their place. */
  priceLevel?: VenuePriceLevel;
  /** The symbol of the price level: "€", "$". Default "$". */
  priceSymbol?: string;
  /** How far away it is: a number of metres (written "450 m", "1.2 km") or your own words. */
  distance?: number | string;
  /** Metric or imperial, for a distance in metres. Default "metric". */
  units?: "metric" | "imperial";
  /** Whether it is open right now. You work it out on your side, from the venue's own clock: the card only says it, as a word with a glyph. Leave it out and there is no line. */
  openNow?: boolean;
  /** When it closes today, for "Open until 22:00": a wall-clock string ("22:00"), which is written as it says, or a Date, a timestamp or an ISO string, written in `timeZone`. */
  closesAt?: DateInput;
  /** When it opens next, for "Closed, opens at 09:00". Same forms as `closesAt`. */
  opensAt?: DateInput;
  /** What else is worth knowing, as chips. The first three show; the rest are counted. */
  tags?: readonly string[];
  /** The venue's page. The name becomes a link and the whole card opens it, the picture included. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the name becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Whether the venue is saved, controlled. The save button is a toggle with `aria-pressed`. */
  saved?: boolean;
  /** Whether the venue starts saved, when you do not control `saved`. */
  defaultSaved?: boolean;
  /** The save button was pressed, with the state it asks for. Leave it out, and leave `saved` out, and there is no save button. */
  onSave?: (saved: boolean) => void;
  /** Heading level of the name. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers and times. Default "en-US". */
  locale?: string;
  /** The time zone the opening times are written in, when they are moments rather than wall-clock strings, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: VenueCardLabels;
}

const DEFAULT_LABELS = {
  save: "Save {name}",
  noPhoto: "No photo yet",
  photoFailed: "Photo unavailable",
  price: "Price",
  away: "away",
  open: "Open",
  openUntil: "Open until {time}",
  closed: "Closed",
  closedOpens: "Closed, opens at {time}",
  tags: "Features",
  moreTags: "{count} more",
  rated: "Rated {rating} out of 5",
  ratedCount: "Rated {rating} out of 5 from {count} reviews",
  ratedOne: "Rated {rating} out of 5 from 1 review",
  noReviews: "No reviews yet",
};

const DEFAULT_PRICE_LEVELS: Record<VenuePriceLevel, string> = { 1: "Inexpensive", 2: "Moderate", 3: "Expensive", 4: "Very expensive" };

/** The most tags that show before the rest are counted. */
const SHOWN_TAGS = 3;

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
 * A local business as a card in a directory or on a listing page: a picture,
 * the name as the one link of the card, then what it is, what a visit costs
 * and how far it is on one line. The price level is drawn as symbols with the
 * word said to screen readers in their place ("Moderate"), the distance has its
 * unit, and the rating is drawn to the exact average and read as a sentence.
 * Whether it is open is a word with a glyph, never colour: a filled dot and
 * "Open until 22:00", a hollow one and "Closed". Features are chips. The save
 * button is a heart toggle with `aria-pressed` whose name carries the venue;
 * it is its own target above the card's link.
 */
export function VenueCard({
  name,
  image,
  category,
  rating,
  ratingCount,
  priceLevel,
  priceSymbol = "$",
  distance,
  units = "metric",
  openNow,
  closesAt,
  opensAt,
  tags,
  href,
  onOpen,
  saved: controlled,
  defaultSaved = false,
  onSave,
  headingLevel = 3,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: VenueCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const levels = { ...DEFAULT_PRICE_LEVELS, ...labels?.priceLevels };
  const nameId = useId();
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
  // A level from an API may stray from 1 to 4; the symbols never do.
  const level = priceLevel ? (Math.min(4, Math.max(1, Math.round(priceLevel))) as VenuePriceLevel) : null;
  const away = typeof distance === "number" ? distanceText(distance, units, locale) : distance;
  const closing = openNow && closesAt !== undefined ? timeText(closesAt, locale, timeZone) : null;
  const opening = openNow === false && opensAt !== undefined ? timeText(opensAt, locale, timeZone) : null;
  const stars =
    rating === undefined
      ? undefined
      : ratingCount === undefined
        ? fill(text.rated, { rating: scoreText(rating, locale) })
        : fill(ratingCount === 1 ? text.ratedOne : text.ratedCount, { rating: scoreText(rating, locale), count: countText(ratingCount, locale) });

  // What the venue is, what it costs and how far it is: one line, a dot between the parts for the eye and a comma for the ear.
  const facts: ReactNode[] = [];
  if (category) facts.push(<span key="category">{category}</span>);
  if (level) {
    facts.push(
      <span key="price">
        <span aria-hidden="true" className="tracking-[0.04em]">
          <span className="font-medium text-foreground">{priceSymbol.repeat(level)}</span>
          <span className="text-muted-foreground/45">{priceSymbol.repeat(4 - level)}</span>
        </span>
        <span className="sr-only">
          {text.price}: {levels[level]}
        </span>
      </span>,
    );
  }
  if (away) {
    facts.push(
      <span key="distance" className="tabular-nums">
        {away}
        <span className="sr-only"> {text.away}</span>
      </span>,
    );
  }

  const label = <span className="[overflow-wrap:anywhere]">{name}</span>;
  const shown = tags?.slice(0, SHOWN_TAGS) ?? [];
  const hidden = (tags?.length ?? 0) - shown.length;

  return (
    <article
      data-slot="venue-card"
      data-open={openNow === undefined ? undefined : openNow ? "" : "closed"}
      aria-labelledby={nameId}
      className={cn(
        "group/venue-card relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=venue-card-open]:focus-visible]:border-ring has-[[data-slot=venue-card-open]:focus-visible]:ring-[3px] has-[[data-slot=venue-card-open]:focus-visible]:ring-ring/40",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="relative border-b border-border">
        <AspectRatio ratio={16 / 10} className="bg-muted">
          {picture && broken !== picture.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- framework-neutral: a plain picture, which any optimiser can replace
            <img ref={photo} src={picture.src} alt={picture.alt ?? ""} loading="lazy" decoding="async" onError={() => setBroken(picture.src)} className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">
              <span className="grid justify-items-center gap-1.5 text-xs">
                <IconImage className="size-6" />
                {picture ? text.photoFailed : text.noPhoto}
              </span>
            </div>
          )}
        </AspectRatio>
        {canSave ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-pressed={saved}
            aria-label={fill(text.save, { name })}
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

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Heading id={nameId} className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
            {href ? (
              <a data-slot="venue-card-open" href={href} onClick={onOpen} className={OPEN}>
                {label}
              </a>
            ) : onOpen ? (
              <button data-slot="venue-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                {label}
              </button>
            ) : (
              label
            )}
          </Heading>
          {facts.length ? (
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              {facts.map((fact, index) => (
                <Fragment key={index}>
                  {index > 0 ? (
                    <>
                      <span aria-hidden="true" className="mx-1.5">·</span>
                      <span className="sr-only">, </span>
                    </>
                  ) : null}
                  {fact}
                </Fragment>
              ))}
            </p>
          ) : null}
        </div>

        {rating !== undefined ? <Score value={rating} count={ratingCount} size="md" label={stars} locale={locale} emptyText={text.noReviews} /> : null}

        {openNow !== undefined ? (
          <p className="flex items-center gap-2 text-sm leading-5">
            <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", openNow ? "bg-foreground" : "border border-muted-foreground")} />
            <span className={cn(openNow ? "font-medium" : "text-muted-foreground")}>
              {openNow ? (closing ? fill(text.openUntil, { time: closing }) : text.open) : opening ? fill(text.closedOpens, { time: opening }) : text.closed}
            </span>
          </p>
        ) : null}

        {shown.length ? (
          <ul aria-label={text.tags} className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {shown.map((tag) => (
              <li key={tag} className="max-w-full min-w-0">
                {/* A chip that is longer than the card wraps its words instead of pushing the card wider. */}
                <Badge variant="outline" className="h-auto min-h-5 max-w-full py-0.5 text-left leading-snug whitespace-normal [overflow-wrap:anywhere]">
                  {tag}
                </Badge>
              </li>
            ))}
            {hidden > 0 ? (
              <li>
                <Badge variant="muted" className="tabular-nums">
                  <span aria-hidden="true">+{hidden}</span>
                  <span className="sr-only">{fill(text.moreTags, { count: countText(hidden, locale) })}</span>
                </Badge>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
