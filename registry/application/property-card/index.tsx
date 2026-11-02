"use client";

import { useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode, type Ref } from "react";

import { countText, fill, priceText } from "@rhs-ui/application/property-card/format";
import { IconChevronLeft, IconChevronRight, IconHeart, IconImage } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** Where the sale stands, in one word. */
export type PropertyStatus = "for-sale" | "under-offer" | "sold" | "new";

/** One photo of the property. */
export interface PropertyImage {
  /** The picture, as an image address. */
  src: string;
  /** What it shows: "Living room with a bay window". Every photo needs one, the gallery reads it out. */
  alt: string;
}

/** The numbers every listing carries. Leave out what you do not know. */
export interface PropertyFacts {
  /** Bedrooms. */
  beds?: number;
  /** Bathrooms. */
  baths?: number;
  /** Living area, in the unit of `labels.area` (square metres by default). */
  area?: number;
  /** The plot, in the same unit. Left out for a flat. */
  plot?: number;
}

/** The words the card uses, for translation. `{address}` and `{count}` are filled in. */
export interface PropertyCardLabels {
  /** The save button's name; it keeps this name whether it is on or off, and `aria-pressed` says which. Default "Save {address}". */
  save?: string;
  /** The name of the gallery. Default "Photos of {address}". */
  photos?: string;
  /** Previous photo. Default "Previous photo". */
  previous?: string;
  /** Next photo. Default "Next photo". */
  next?: string;
  /** Read to screen readers about each photo; `{index}` and `{count}` are filled in. Default "Photo {index} of {count}". */
  photo?: string;
  /** The name of the list of facts. Default "Key facts". */
  facts?: string;
  /** One bedroom. Default "{count} bed". */
  bedOne?: string;
  /** Several bedrooms. Default "{count} beds". */
  bedOther?: string;
  /** One bathroom. Default "{count} bath". */
  bathOne?: string;
  /** Several bathrooms. Default "{count} baths". */
  bathOther?: string;
  /** The living area, with its unit. Default "{count} m²". Write "{count} sq ft" for square feet. */
  area?: string;
  /** The plot, with its unit. Default "{count} m² plot". */
  plot?: string;
  /** The status words. */
  statuses?: Partial<Record<PropertyStatus, string>>;
  /** Said when there is no photo. Default "No photos yet". */
  noPhotos?: string;
}

export interface PropertyCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The photos, the first one on show. One photo has no arrows; none shows a quiet placeholder. */
  images: readonly PropertyImage[];
  /** The asking price: a number, written in the currency and locale you name, in tabular numerals, or your own words ("€2,150 / month", "Price on request"). */
  price: number | string;
  /** The ISO 4217 code of the currency of a numeric price. Default "EUR". */
  currency?: string;
  /** The address. It is the one link of the card. */
  address: string;
  /** The numbers: bedrooms, bathrooms, area and plot, each written with its unit. */
  facts?: PropertyFacts;
  /** Where the sale stands: a badge that says so in a word. A sold listing is muted. */
  status?: PropertyStatus;
  /** The listing's page. The address becomes a link and the whole card opens it, the photos included. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the address becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Whether the listing is saved, controlled. The save button is a toggle with `aria-pressed`. */
  saved?: boolean;
  /** Whether the listing starts saved, when you do not control `saved`. */
  defaultSaved?: boolean;
  /** The save button was pressed, with the state it asks for. Leave it out, and leave `saved` out, and there is no save button. */
  onSave?: (saved: boolean) => void;
  /** Heading level of the address. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words the card uses, for translation. */
  labels?: PropertyCardLabels;
}

const DEFAULT_LABELS = {
  save: "Save {address}",
  photos: "Photos of {address}",
  previous: "Previous photo",
  next: "Next photo",
  photo: "Photo {index} of {count}",
  facts: "Key facts",
  bedOne: "{count} bed",
  bedOther: "{count} beds",
  bathOne: "{count} bath",
  bathOther: "{count} baths",
  area: "{count} m²",
  plot: "{count} m² plot",
  noPhotos: "No photos yet",
};

const DEFAULT_STATUSES: Record<PropertyStatus, string> = { "for-sale": "For sale", "under-offer": "Under offer", sold: "Sold", new: "New" };

/** Each status has its own fill and outline as well as its word, so none depends on colour. */
const STATUS_LOOK: Record<PropertyStatus, string> = {
  "for-sale": "border-border bg-background text-foreground",
  "under-offer": "border-foreground bg-background font-semibold text-foreground",
  sold: "border-transparent bg-foreground text-background",
  new: "border-transparent bg-primary text-primary-foreground",
};

/** A fact written from its template, with the number in a heavier weight so a row of them scans: "3 beds" has a bold 3. */
function withCount(template: string, count: string): ReactNode {
  return template.split(/(\{count\})/).map((part, position) =>
    part === "{count}" ? (
      <strong key={position} className="font-semibold text-foreground">
        {count}
      </strong>
    ) : (
      part
    ),
  );
}

/** What stretches the address's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/** The round button that sits on a photo: solid, so it reads on any picture. */
const ON_PHOTO = "size-9 rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground";

/**
 * The gallery arrows are for the pointer and appear on hover and focus. Until
 * then they are invisible and also deaf: an arrow nobody can see must not take
 * a tap, or a touch at the edge of a photo would step the gallery instead of
 * opening the listing (a touch screen never hovers).
 */
const ARROW =
  "pointer-events-none opacity-0 transition-opacity duration-150 group-focus-within/property-card:pointer-events-auto group-focus-within/property-card:opacity-100 group-hover/property-card:pointer-events-auto group-hover/property-card:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 motion-reduce:transition-none";

/**
 * A home listing as a card: a gallery of photos you can swipe or step through
 * with arrows, the asking price in tabular numerals, the address as the one
 * link of the card, the key facts as a labelled list with their units (3
 * beds, 2 baths, 142 m²: words, never icons alone) and the status in a word
 * on the first photo. The save button is a heart toggle with `aria-pressed`
 * whose name carries the address; it and the gallery's arrows are their own
 * targets above the card's link, and a tap or a click on a photo still opens
 * the listing. A sold listing is muted: black and white photos, a quiet price.
 */
export function PropertyCard({
  images,
  price,
  currency = "EUR",
  address,
  facts,
  status,
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
}: PropertyCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const statuses = { ...DEFAULT_STATUSES, ...labels?.statuses };
  const addressId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const track = useRef<HTMLDivElement>(null);
  const link = useRef<HTMLElement>(null);
  const aim = useRef<{ index: number; at: number } | null>(null);
  const [index, setIndex] = useState(0);
  const [own, setOwn] = useState(defaultSaved);
  const saved = controlled ?? own;
  const sold = status === "sold";
  const canSave = onSave !== undefined || controlled !== undefined;
  const many = images.length > 1;

  /** Steps the gallery by one photo. Steps pressed while it is still gliding add up, so a quick double press moves two photos, not one. */
  function go(delta: number) {
    const element = track.current;
    if (!element) return;
    const from = aim.current && Date.now() - aim.current.at < 700 ? aim.current.index : index;
    // Past the last photo comes the first, so neither arrow ever goes dead under the finger or the focus.
    const next = (from + delta + images.length) % images.length;
    aim.current = { index: next, at: Date.now() };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollTo({ left: next * element.clientWidth, behavior: reduce ? "auto" : "smooth" });
  }

  // A number that is not one (NaN) is left out rather than written; a price in your own words is written as it is.
  const priceLine = typeof price === "number" ? (Number.isFinite(price) ? priceText(price, currency, locale) : "") : price;
  const factList: ReactNode[] = [];
  if (facts?.beds !== undefined) factList.push(withCount(facts.beds === 1 ? text.bedOne : text.bedOther, countText(facts.beds, locale)));
  if (facts?.baths !== undefined) factList.push(withCount(facts.baths === 1 ? text.bathOne : text.bathOther, countText(facts.baths, locale)));
  if (facts?.area !== undefined) factList.push(withCount(text.area, countText(facts.area, locale)));
  if (facts?.plot !== undefined) factList.push(withCount(text.plot, countText(facts.plot, locale)));

  const label = <span className="[overflow-wrap:anywhere]">{address}</span>;

  return (
    <article
      data-slot="property-card"
      data-status={status}
      aria-labelledby={addressId}
      className={cn(
        "group/property-card relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=property-card-open]:focus-visible]:border-ring has-[[data-slot=property-card-open]:focus-visible]:ring-[3px] has-[[data-slot=property-card-open]:focus-visible]:ring-ring/40",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      {/* The gallery sits above the card's link so a swipe scrolls it; a click or a tap on a photo hands over to the link. The gallery as a whole listens, not each photo: a touch screen may deliver the tap to the gallery instead of the picture under the finger. Its buttons (the heart, the arrows) keep their own click. */}
      <div
        className="relative z-10"
        onClick={(event) => {
          if (!(event.target instanceof Element) || event.target.closest("button, a")) return;
          link.current?.click();
        }}
      >
        <AspectRatio ratio={4 / 3} className="bg-muted">
          {images.length ? (
            <div
              ref={track}
              // A region that scrolls has to be reachable from the keyboard: the arrow keys step through the photos.
              role="group"
              aria-roledescription="carousel"
              aria-label={fill(text.photos, { address })}
              tabIndex={many ? 0 : undefined}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                go(event.key === "ArrowRight" ? 1 : -1);
              }}
              onScroll={(event) => {
                const element = event.currentTarget;
                setIndex(Math.round(Math.abs(element.scrollLeft) / Math.max(1, element.clientWidth)));
              }}
              className="relative flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-ring [&::-webkit-scrollbar]:hidden"
            >
              {images.map((image, position) => (
                <div
                  key={`${position}-${image.src}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={fill(text.photo, { index: position + 1, count: images.length })}
                  className={cn("size-full shrink-0 snap-center", (href || onOpen) && "cursor-pointer")}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral: it is a plain picture, which any optimiser can replace */}
                  <img src={image.src} alt={image.alt} loading={position === 0 ? "eager" : "lazy"} decoding="async" draggable={false} className={cn("size-full object-cover select-none", sold && "grayscale")} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid size-full place-items-center gap-1 text-muted-foreground">
              <span className="grid justify-items-center gap-1.5 text-xs">
                <IconImage className="size-6" />
                {text.noPhotos}
              </span>
            </div>
          )}
        </AspectRatio>

        {status ? (
          <Badge variant="outline" data-status={status} className={cn("absolute top-3 left-3 h-6 px-2.5 text-[0.8125rem] font-medium shadow-xs", STATUS_LOOK[status])}>
            {statuses[status]}
          </Badge>
        ) : null}

        {canSave ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-pressed={saved}
            aria-label={fill(text.save, { address })}
            onClick={() => {
              if (controlled === undefined) setOwn(!saved);
              onSave?.(!saved);
            }}
            className={cn("absolute top-3 right-3", ON_PHOTO)}
          >
            <IconHeart className={cn("size-[1.125rem] transition-transform duration-200 motion-reduce:transition-none", saved && "scale-110 fill-current")} />
          </Button>
        ) : null}

        {many ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={text.previous}
              tabIndex={-1}
              onClick={() => go(-1)}
              className={cn("absolute inset-y-0 left-2.5 my-auto", ARROW, ON_PHOTO)}
            >
              <IconChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={text.next}
              tabIndex={-1}
              onClick={() => go(1)}
              className={cn("absolute inset-y-0 right-2.5 my-auto", ARROW, ON_PHOTO)}
            >
              <IconChevronRight />
            </Button>
            <span aria-hidden="true" className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-background px-2 py-0.5 text-xs font-medium tabular-nums shadow-xs">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {priceLine ? <p className={cn("text-xl leading-7 font-semibold tracking-[-0.02em] tabular-nums", sold && "text-muted-foreground")}>{priceLine}</p> : null}
        <Heading id={addressId} className={cn("text-sm leading-5 font-medium", sold && "text-muted-foreground")}>
          {href ? (
            <a ref={link as Ref<HTMLAnchorElement>} data-slot="property-card-open" href={href} onClick={onOpen} className={OPEN}>
              {label}
            </a>
          ) : onOpen ? (
            <button ref={link as Ref<HTMLButtonElement>} data-slot="property-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
              {label}
            </button>
          ) : (
            label
          )}
        </Heading>
        {factList.length ? (
          <ul aria-label={text.facts} className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm leading-5 text-muted-foreground tabular-nums">
            {factList.map((fact, position) => (
              <li key={position}>{fact}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
