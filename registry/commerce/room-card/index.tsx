import { useId, type ComponentProps } from "react";

import { IconArrowRight, IconBan, IconBed, IconCheck, IconInfo, IconMaximize, IconUsers } from "@rhs-ui/icons";
import { PhotoSlider, type RoomImage } from "@rhs-ui/commerce/room-card/slider";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

export type { RoomImage } from "@rhs-ui/commerce/room-card/slider";

export interface RoomCardLabels {
  /** The button. */
  select?: string;
  /** After the price of one night. */
  perNight?: string;
  /** The stay total when `nights` is not known. `{total}`. */
  total?: string;
  /** The stay total for a number of nights. `{total}` and `{nights}`. */
  totalFor?: string;
  /** `{count}` nights, more than one. */
  nights?: string;
  /** One night. */
  night?: string;
  taxesIncluded?: string;
  taxesExcluded?: string;
  refundable?: string;
  nonRefundable?: string;
  /** The tag over the pictures when only a few rooms are left. `{count}`. */
  onlyLeft?: string;
  /** What a room that cannot be booked says in place of the price. */
  unavailable?: string;
  /** `{count}` people. */
  sleeps?: string;
  /** The link after the short list of amenities. `{count}` is how many there are. */
  seeAll?: string;
  /** The title of the amenities for a screen reader. */
  amenities?: string;
  /** Names the pictures for a screen reader. `{name}`. */
  photos?: string;
}

const WORDS = {
  select: "Select room",
  perNight: "per night",
  total: "{total} total",
  totalFor: "{total} for {nights}",
  nights: "{count} nights",
  night: "{count} night",
  taxesIncluded: "taxes included",
  taxesExcluded: "plus taxes",
  refundable: "Free cancellation",
  nonRefundable: "Non-refundable",
  onlyLeft: "Only {count} left",
  unavailable: "Not available for these dates",
  sleeps: "Sleeps {count}",
  seeAll: "See all {count} amenities",
  amenities: "Amenities",
  photos: "Photos of {name}",
} satisfies Required<RoomCardLabels>;

export interface RoomCardProps extends Omit<ComponentProps<"div">, "children" | "title"> {
  /** The room's name: "Canal view double room". */
  name: string;
  /** Its pictures, the first one on show. Without any, a bed stands in. */
  images?: readonly RoomImage[];
  /** The beds, as a person says it: "1 king bed", "2 single beds". */
  beds?: string;
  /** The floor area, with its unit: "28 m²". */
  size?: string;
  /** How many people it sleeps. */
  sleeps?: number;
  /** What the room has, in a few words each. The first `maxAmenities` are listed. */
  amenities?: readonly string[];
  /** The price of one night, in minor units: 18900 is 189.00. */
  pricePerNight: number;
  /** The price of the whole stay for the dates the guest chose, in minor units. */
  totalPrice?: number;
  /** How many nights that is. It is written next to the total: "€378 for 2 nights". */
  nights?: number;
  /** ISO 4217 code. */
  currency?: string;
  /** The prices include taxes and fees. Defaults to true; set false to say "plus taxes". */
  taxesIncluded?: boolean;
  /** Free cancellation (true) or not (false). Leave it out to say nothing about it. */
  refundable?: boolean;
  /** How many of this room are left for the dates. Zero means it cannot be booked and the card says so. */
  roomsLeft?: number;
  /** "Only N left" is shown at this number or fewer. Defaults to 3. */
  lowStockAt?: number;
  /** How many amenities to list before the "See all" link. Defaults to 4. The link only exists when it has somewhere to go. */
  maxAmenities?: number;
  /** Where "See all amenities" goes, for a room page. A real link, which needs no JavaScript. */
  amenitiesHref?: string;
  /** Called when "See all amenities" is pressed, to open a dialog. Pass it from a client component. */
  onSeeAllAmenities?: () => void;
  /** Called when the guest selects the room. Pass it from a client component. */
  onSelect?: () => void;
  /** Always pass your application locale, so the server and the browser write the same prices. */
  locale?: string;
  /** The heading's element: "h3" by default, "h2" when the rooms are the main content of the page. */
  headingAs?: "h2" | "h3" | "h4";
  /** The words, for another language. */
  labels?: RoomCardLabels;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** A price in minor units. A whole amount drops its cents ("€189"), one with cents keeps them ("€189.50"). */
function price(minor: number, currency: string, locale: string): string {
  const digits = new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  const major = minor / 10 ** digits;
  const fraction = Number.isInteger(major) ? 0 : digits;
  return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: fraction, maximumFractionDigits: fraction }).format(major);
}

const LINK = "inline-flex items-center gap-1 rounded-sm text-sm font-medium underline decoration-border underline-offset-4 outline-none transition-colors hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * A hotel room or a rental in a list of results: its pictures (swipe, or the arrows), the name, size, beds and how
 * many it sleeps, a short list of what is in the room that ends in a "See all" link, then the price of one night, the
 * total for the dates chosen with "taxes included", whether it can be cancelled for free and the select button.
 * "Only 2 left" says so in words. A room that cannot be booked for the dates says "Not available for these dates" in
 * place of the price and disables the button, which points at that reason. The card lays itself out by its own width:
 * pictures on top in a narrow column, beside the details from 48rem.
 */
export function RoomCard({
  name,
  images = [],
  beds,
  size,
  sleeps,
  amenities = [],
  pricePerNight,
  totalPrice,
  nights,
  currency = "EUR",
  taxesIncluded = true,
  refundable,
  roomsLeft,
  lowStockAt = 3,
  maxAmenities = 4,
  amenitiesHref,
  onSeeAllAmenities,
  onSelect,
  locale = "en-US",
  headingAs: Heading = "h3",
  labels,
  className,
  ...props
}: RoomCardProps) {
  const words: Required<RoomCardLabels> = { ...WORDS, ...labels };
  const id = useId();
  const available = roomsLeft === undefined || roomsLeft > 0;
  const scarce = roomsLeft !== undefined && roomsLeft > 0 && roomsLeft <= lowStockAt;
  const linked = Boolean(amenitiesHref) || Boolean(onSeeAllAmenities);
  // Amenities are only cut short when the "See all" link can show the rest.
  const shown = linked ? amenities.slice(0, maxAmenities) : amenities;
  const facts = [
    size ? { key: "size", icon: <IconMaximize className="size-4" />, text: size } : null,
    beds ? { key: "beds", icon: <IconBed className="size-4" />, text: beds } : null,
    sleeps ? { key: "sleeps", icon: <IconUsers className="size-4" />, text: fill(words.sleeps, { count: String(sleeps) }) } : null,
  ].filter((fact) => fact !== null);
  const stay =
    totalPrice === undefined
      ? null
      : nights
        ? fill(words.totalFor, { total: price(totalPrice, currency, locale), nights: fill(nights === 1 ? words.night : words.nights, { count: String(nights) }) })
        : fill(words.total, { total: price(totalPrice, currency, locale) });

  return (
    <div data-slot="room-card" data-state={available ? "available" : "unavailable"} role="group" aria-labelledby={`${id}-name`} className={cn("@container", className)} {...props}>
      {/* A container cannot query itself, so the card sits inside the element that is the container. */}
      <Card className="h-full gap-0 overflow-hidden py-0 @3xl:grid @3xl:grid-cols-[16rem_minmax(0,1fr)_11.5rem]">
        <div className="relative aspect-[16/10] bg-muted @xl:aspect-[2/1] @3xl:aspect-auto @3xl:min-h-64">
          {images.length ? (
            <PhotoSlider images={images} label={fill(words.photos, { name })} muted={!available} className="absolute inset-0" />
          ) : (
            <div aria-hidden="true" className="absolute inset-0 grid place-items-center text-muted-foreground">
              <IconBed className="size-10" />
            </div>
          )}
          {scarce ? (
            <Badge variant="outline" className="pointer-events-none absolute top-3 left-3 border-border bg-background text-foreground shadow-xs">
              {fill(words.onlyLeft, { count: String(roomsLeft) })}
            </Badge>
          ) : null}
        </div>

        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 p-5 @3xl:contents">
          <div className="grid min-w-0 content-start gap-4 @3xl:p-6">
            <div className="grid gap-2">
              <Heading id={`${id}-name`} className="text-lg leading-snug font-semibold tracking-[-0.02em] text-balance">
                {name}
              </Heading>
              {facts.length ? (
                <ul role="list" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                  {facts.map((fact) => (
                    <li key={fact.key} className="inline-flex items-center gap-1.5">
                      {fact.icon}
                      {fact.text}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {shown.length ? (
              <div className="grid gap-3">
                <h4 className="sr-only">{words.amenities}</h4>
                <ul role="list" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {shown.map((amenity, index) => (
                    <li key={`${index}-${amenity}`} className="inline-flex items-center gap-1.5">
                      <IconCheck className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
                      {amenity}
                    </li>
                  ))}
                </ul>
                {linked && amenities.length > shown.length ? (
                  amenitiesHref ? (
                    <a href={amenitiesHref} className={cn(LINK, "justify-self-start")}>
                      {fill(words.seeAll, { count: String(amenities.length) })}
                      <IconArrowRight className="size-3.5" />
                    </a>
                  ) : (
                    <button type="button" onClick={onSeeAllAmenities} className={cn(LINK, "justify-self-start")}>
                      {fill(words.seeAll, { count: String(amenities.length) })}
                      <IconArrowRight className="size-3.5" />
                    </button>
                  )
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid content-end gap-4 border-t border-border pt-5 @3xl:border-t-0 @3xl:border-l @3xl:p-6">
            {available ? (
              <div className="grid gap-1.5">
                <p className="flex flex-wrap items-baseline gap-x-1.5">
                  <span className="text-2xl leading-none font-semibold tracking-[-0.03em] tabular-nums">{price(pricePerNight, currency, locale)}</span>
                  <span className="text-sm text-muted-foreground">{words.perNight}</span>
                </p>
                {stay ? (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {stay}, {taxesIncluded ? words.taxesIncluded : words.taxesExcluded}
                  </p>
                ) : null}
                {refundable === undefined ? null : (
                  <p className={cn("mt-1 inline-flex items-center gap-1.5 text-xs", refundable ? "font-medium" : "text-muted-foreground")}>
                    {refundable ? <IconCheck className="size-3.5" strokeWidth={2} /> : <IconInfo className="size-3.5" />}
                    {refundable ? words.refundable : words.nonRefundable}
                  </p>
                )}
              </div>
            ) : (
              <p id={`${id}-reason`} className="flex items-start gap-2 text-sm font-medium text-pretty">
                <IconBan className="mt-0.5 size-4 shrink-0" />
                {words.unavailable}
              </p>
            )}
            {/* A room that cannot be booked keeps a quiet button: a solid one would shout over the reason it is off. */}
            <Button type="button" variant={available ? "default" : "outline"} className="w-full" disabled={!available} aria-describedby={available ? undefined : `${id}-reason`} onClick={onSelect}>
              {words.select}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
