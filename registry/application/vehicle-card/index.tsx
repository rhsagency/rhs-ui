"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode, type Ref } from "react";

import { fill, mileageText, priceText } from "@rhs-ui/application/vehicle-card/format";
import { IconCar, IconChevronLeft, IconChevronRight, IconClock, IconHeart } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** Where the sale stands: for sale, held for a buyer, or gone. */
export type VehicleStatus = "available" | "reserved" | "sold";

/** One photo of the vehicle. */
export interface VehicleImage {
  /** The picture, as an image address. */
  src: string;
  /** What it shows: "Front three-quarter view in grey". Every photo needs one, the gallery reads it out. */
  alt: string;
}

/** The words the card uses, for translation. `{title}`, `{amount}`, `{index}` and `{count}` are filled in. */
export interface VehicleCardLabels {
  /** The save button's name; it keeps this name whether it is on or off, and `aria-pressed` says which. Default "Save {title}". */
  save?: string;
  /** The name of the gallery. Default "Photos of {title}". */
  photos?: string;
  /** Previous photo. Default "Previous photo". */
  previous?: string;
  /** Next photo. Default "Next photo". */
  next?: string;
  /** Read to screen readers about each photo; `{index}` and `{count}` are filled in. Default "Photo {index} of {count}". */
  photo?: string;
  /** Said when there is no photo. Default "No photos yet". */
  noPhotos?: string;
  /** Said on a photo that did not load. Default "Photo unavailable". */
  photoFailed?: string;
  /** Said to screen readers before the price. Default "Price". */
  price?: string;
  /** The monthly figure. Default "or {amount} / month". */
  monthly?: string;
  /** The names of the key specs. */
  year?: string;
  mileage?: string;
  fuel?: string;
  transmission?: string;
  power?: string;
  /** The status words. Available has none: a vehicle for sale needs no badge. */
  statuses?: Partial<Record<Exclude<VehicleStatus, "available">, string>>;
}

export interface VehicleCardProps extends Omit<ComponentProps<"article">, "children" | "title"> {
  /** The photos, the first one on show. One photo has no arrows; none shows a quiet placeholder, and so does a photo that does not load. */
  images: readonly VehicleImage[];
  /** Fetch the first photo at once. Leave it out for a card in a long list, where photos load as they come near the screen; set it on the card above the fold. */
  priority?: boolean;
  /** Make and model: "Volkswagen ID.4". It is the one link of the card. */
  title: string;
  /** The trim or version, under the title: "Pro Business 77 kWh". */
  variant?: string;
  /** The asking price: a number, written in the currency and locale you name, large and in tabular numerals, or your own words ("Price on request"). */
  price: number | string;
  /** The ISO 4217 code of the currency of a numeric price. Default "EUR". */
  currency?: string;
  /** What a month of financing costs, in the same currency. Written small beside the price: "or €459 / month". */
  monthlyPrice?: number;
  /** The year it was built. */
  year?: number;
  /** How far it has driven, in `mileageUnit`. Written with its unit: "12,400 km". */
  mileage?: number;
  /** The unit of the mileage. Default "km". */
  mileageUnit?: "km" | "mi";
  /** What it runs on: "Electric", "Petrol", "Hybrid". */
  fuel?: string;
  /** The gearbox: "Automatic", "Manual". */
  transmission?: string;
  /** How strong it is, in your units: "150 kW (204 hp)". */
  power?: string;
  /** Where the sale stands. A reserved or sold vehicle is marked in words on the first photo and muted; a sold one loses its colour. Default "available". */
  status?: VehicleStatus;
  /** The listing's page. The title becomes a link and the whole card opens it, the photos included. */
  href?: string;
  /** The card was opened. With `href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an `href` the title becomes a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** Whether the vehicle is saved, controlled. The save button is a toggle with `aria-pressed`. */
  saved?: boolean;
  /** Whether the vehicle starts saved, when you do not control `saved`. */
  defaultSaved?: boolean;
  /** The save button was pressed, with the state it asks for. Leave it out, and leave `saved` out, and there is no save button. */
  onSave?: (saved: boolean) => void;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words the card uses, for translation. */
  labels?: VehicleCardLabels;
}

const DEFAULT_LABELS = {
  save: "Save {title}",
  photos: "Photos of {title}",
  previous: "Previous photo",
  next: "Next photo",
  photo: "Photo {index} of {count}",
  noPhotos: "No photos yet",
  photoFailed: "Photo unavailable",
  price: "Price",
  monthly: "or {amount} / month",
  year: "Year",
  mileage: "Mileage",
  fuel: "Fuel",
  transmission: "Transmission",
  power: "Power",
};

const DEFAULT_STATUSES = { reserved: "Reserved", sold: "Sold" };

/** What stretches the title's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/** The round button that sits on a photo: solid, so it reads on any picture. */
const ON_PHOTO = "size-9 rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-background hover:text-foreground";

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

/** The quiet tile for a photo that is not there, or did not arrive. */
function NoPhoto({ label }: { label: string }) {
  return (
    <div className="grid size-full place-items-center text-muted-foreground">
      <span className="grid justify-items-center gap-1.5 text-xs">
        <IconCar className="size-6" />
        {label}
      </span>
    </div>
  );
}

/** A key spec: a name over its value, read as a pair by a screen reader and seen as one. No icon stands in for the name. */
function Spec({ term, muted, children }: { term: string; muted: boolean; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs leading-4 text-muted-foreground">{term}</dt>
      <dd className={cn("mt-1 text-sm leading-5 font-medium tabular-nums [overflow-wrap:anywhere]", muted && "text-muted-foreground")}>{children}</dd>
    </div>
  );
}

/**
 * A vehicle listing for a dealer: a gallery of photos you can swipe or step
 * through with arrows, the make and model as the one link of the card, the
 * price large in tabular numerals with the monthly figure small beside it, and
 * the key specs as a labelled list with their units (year, mileage, fuel,
 * transmission, never an icon alone). A reserved or sold vehicle is marked in
 * words on the first photo and muted, and a sold one is drawn without colour.
 * The save button is a heart toggle with `aria-pressed` whose name carries the
 * model; it and the gallery's arrows are their own targets above the card's
 * link, and a tap or a click on a photo still opens the listing.
 */
export function VehicleCard({
  images,
  priority = false,
  title,
  variant,
  price,
  currency = "EUR",
  monthlyPrice,
  year,
  mileage,
  mileageUnit = "km",
  fuel,
  transmission,
  power,
  status = "available",
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
}: VehicleCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const statuses = { ...DEFAULT_STATUSES, ...labels?.statuses };
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const track = useRef<HTMLDivElement>(null);
  const link = useRef<HTMLElement>(null);
  const aim = useRef<{ index: number; at: number } | null>(null);
  const [index, setIndex] = useState(0);
  // The addresses of the photos that did not load: each of them shows the quiet tile in place of the browser's broken-picture icon.
  const [broken, setBroken] = useState<readonly string[]>([]);
  const [own, setOwn] = useState(defaultSaved);
  const saved = controlled ?? own;
  const canSave = onSave !== undefined || controlled !== undefined;
  const many = images.length > 1;
  const sources = images.map((image) => image.src).join("\n");
  useEffect(() => {
    for (const img of track.current?.querySelectorAll("img") ?? []) {
      const src = img.getAttribute("src");
      if (src) askAgain(img, () => setBroken((list) => (list.includes(src) ? list : [...list, src])));
    }
  }, [sources]);
  const sold = status === "sold";
  const gone = status !== "available";

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

  const label = <span className="[overflow-wrap:anywhere]">{title}</span>;

  return (
    <article
      data-slot="vehicle-card"
      data-status={status}
      aria-labelledby={titleId}
      className={cn(
        "group/vehicle-card @container relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=vehicle-card-open]:focus-visible]:border-ring has-[[data-slot=vehicle-card-open]:focus-visible]:ring-[3px] has-[[data-slot=vehicle-card-open]:focus-visible]:ring-ring/40",
        (href || onOpen) && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      {/* The gallery sits above the card's link so a swipe scrolls it; a click on a photo hands over to the link. */}
      <div className="relative z-10 border-b border-border">
        <AspectRatio ratio={3 / 2} className="bg-muted">
          {images.length ? (
            <div
              ref={track}
              role="group"
              aria-roledescription="carousel"
              aria-label={fill(text.photos, { title })}
              // A scroller the keyboard can reach: the arrow keys step through the photos, the same as the buttons do.
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.target !== event.currentTarget || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
                event.preventDefault();
                go(event.key === "ArrowRight" ? 1 : -1);
              }}
              onScroll={(event) => {
                const element = event.currentTarget;
                setIndex(Math.round(Math.abs(element.scrollLeft) / Math.max(1, element.clientWidth)));
              }}
              className="relative flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset [&::-webkit-scrollbar]:hidden"
            >
              {images.map((image, position) => (
                <div
                  key={`${position}-${image.src}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={fill(text.photo, { index: position + 1, count: images.length })}
                  onClick={() => link.current?.click()}
                  className={cn("size-full shrink-0 snap-center", (href || onOpen) && "cursor-pointer")}
                >
                  {broken.includes(image.src) ? (
                    <NoPhoto label={text.photoFailed} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- framework-neutral: it is a plain picture, which any optimiser can replace
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading={priority && position === 0 ? "eager" : "lazy"}
                      fetchPriority={priority && position === 0 ? "high" : undefined}
                      decoding="async"
                      draggable={false}
                      onError={() => setBroken((list) => (list.includes(image.src) ? list : [...list, image.src]))}
                      className={cn("size-full object-cover select-none", sold && "grayscale")}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <NoPhoto label={text.noPhotos} />
          )}
        </AspectRatio>

        {gone ? (
          <Badge
            variant="outline"
            data-status={status}
            className={cn("absolute top-3 left-3 h-6 gap-1.5 px-2.5 text-[0.8125rem] font-medium shadow-xs [&>svg]:size-3.5", sold ? "border-transparent bg-foreground text-background" : "border-dashed border-foreground/60 bg-background text-foreground")}
          >
            {sold ? null : <IconClock />}
            {statuses[status as "reserved" | "sold"]}
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
              onClick={() => go(-1)}
              className={cn(
                "absolute inset-y-0 left-2.5 my-auto opacity-0 transition-opacity duration-150 group-focus-within/vehicle-card:opacity-100 group-hover/vehicle-card:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100",
                ON_PHOTO,
              )}
            >
              <IconChevronLeft />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={text.next}
              onClick={() => go(1)}
              className={cn(
                "absolute inset-y-0 right-2.5 my-auto opacity-0 transition-opacity duration-150 group-focus-within/vehicle-card:opacity-100 group-hover/vehicle-card:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100",
                ON_PHOTO,
              )}
            >
              <IconChevronRight />
            </Button>
            <span aria-hidden="true" className="pointer-events-none absolute right-3 bottom-3 rounded-full bg-background px-2 py-0.5 text-xs font-medium tabular-nums shadow-xs">
              {index + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <Heading id={titleId} className={cn("text-base leading-snug font-semibold tracking-[-0.02em] text-balance", gone && "text-muted-foreground")}>
            {href ? (
              <a ref={link as Ref<HTMLAnchorElement>} data-slot="vehicle-card-open" href={href} onClick={onOpen} className={OPEN}>
                {label}
              </a>
            ) : onOpen ? (
              <button ref={link as Ref<HTMLButtonElement>} data-slot="vehicle-card-open" type="button" onClick={onOpen} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                {label}
              </button>
            ) : (
              label
            )}
          </Heading>
          {variant ? <p className="mt-0.5 text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{variant}</p> : null}
        </div>

        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <span className={cn("text-2xl leading-8 font-semibold tracking-[-0.03em] tabular-nums", gone && "text-muted-foreground")}>
            <span className="sr-only">{text.price}: </span>
            {typeof price === "number" ? priceText(price, currency, locale) : price}
          </span>
          {monthlyPrice !== undefined ? <span className="text-[0.8125rem] leading-5 text-muted-foreground tabular-nums">{fill(text.monthly, { amount: priceText(monthlyPrice, currency, locale) })}</span> : null}
        </p>

        {year !== undefined || mileage !== undefined || fuel || transmission || power ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 border-t border-border pt-4 [&>div:last-child:nth-child(odd)]:col-span-2">
            {year !== undefined ? (
              <Spec term={text.year} muted={gone}>
                {year}
              </Spec>
            ) : null}
            {mileage !== undefined ? (
              <Spec term={text.mileage} muted={gone}>
                {mileageText(mileage, mileageUnit, locale)}
              </Spec>
            ) : null}
            {fuel ? (
              <Spec term={text.fuel} muted={gone}>
                {fuel}
              </Spec>
            ) : null}
            {transmission ? (
              <Spec term={text.transmission} muted={gone}>
                {transmission}
              </Spec>
            ) : null}
            {power ? (
              <Spec term={text.power} muted={gone}>
                {power}
              </Spec>
            ) : null}
          </dl>
        ) : null}
      </div>
    </article>
  );
}
