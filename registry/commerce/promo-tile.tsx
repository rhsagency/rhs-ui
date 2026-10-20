import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { buttonVariants } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface PromoTileImage {
  /** Picture source: a URL or a data URI. */
  src: string;
  /** Leave it out when the words already say it (the usual case): the picture is then decorative. */
  alt?: string;
  /** Where the picture is anchored when it is cropped to the tile, as CSS `object-position`: "30% 50%", "center top". Keeps the subject in view. */
  position?: string;
}

export interface PromoTileProps extends Omit<ComponentProps<"a">, "children" | "title" | "href"> {
  /** The headline: short, a few words. */
  title: string;
  /** One line under the headline. */
  description?: string;
  /** The picture, full bleed behind the words. */
  image: PromoTileImage;
  /** Where the whole tile goes. */
  href: string;
  /** The one call to action: "Shop the edit". It is drawn as a button but is part of the link, not a second control. */
  cta: string;
  /** How many grid columns the tile takes from the `sm` breakpoint up. On a phone it is always one. */
  span?: 1 | 2;
  /** The plate the words sit on: `default` is the page's own colours, `inverted` the opposite. Both are solid, so contrast does not depend on the picture. */
  tone?: "default" | "inverted";
  /** A short label on the picture: "New", "Limited". */
  badge?: string;
  /** Plug in next/image or any optimiser. Defaults to a plain <img>. */
  renderImage?: (image: PromoTileImage, className: string) => ReactNode;
}

function DefaultImage(image: PromoTileImage, className: string) {
  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass renderImage to use next/image
  return <img src={image.src} alt={image.alt ?? ""} loading="lazy" decoding="async" style={image.position ? { objectPosition: image.position } : undefined} className={className} />;
}

/**
 * The merchandising tile that sits between products in a grid: a full-bleed
 * picture, a short headline, an optional line and one call to action. The
 * whole tile is one link with a visible focus ring. The words sit on a solid
 * plate, so contrast holds on any picture; a screen reader hears "Promotion"
 * first, so it is not taken for a product. It stretches to the height of the
 * cards in its row, takes one or two columns from `sm` up, and is one column on
 * a phone, whether the grid has one column there or two: the tile always fits
 * its own track. Give the grid `grid-flow-dense` so a wide tile never leaves a gap.
 */
export function PromoTile({ title, description, image, href, cta, span = 1, tone = "default", badge, renderImage = DefaultImage, className, ...props }: PromoTileProps) {
  const inverted = tone === "inverted";
  return (
    <a
      data-slot="promo-tile"
      data-tone={tone}
      href={href}
      className={cn(
        // A phone gives the tile the 4:5 of a product picture; from sm up the row decides the height. The width is always the grid
        // column's (w-full, min-w-0): without it the aspect ratio and min-h-72 would work out a width of their own and push into the next column.
        // The tile is a container, so the plate can tighten up when the column is narrow (two products across on a phone).
        "group/promo @container/promo relative isolate flex [overflow-wrap:anywhere] aspect-[4/5] h-full min-h-72 w-full min-w-0 flex-col justify-end overflow-hidden rounded-xl border border-border bg-muted outline-none sm:aspect-auto",
        "focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        span === 2 && "sm:col-span-2",
        className,
      )}
      {...props}
    >
      <span className="sr-only">Promotion: </span>
      {renderImage(image, "absolute inset-0 -z-10 size-full object-cover transition-transform duration-700 ease-out group-hover/promo:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/promo:scale-100")}
      {badge ? (
        <Badge variant="secondary" className="absolute top-3 left-3 shadow-xs">
          {badge}
        </Badge>
      ) : null}
      <span
        className={cn(
          "relative m-3 block w-fit max-w-[calc(100%-1.5rem)] rounded-lg p-4 sm:max-w-[24rem]",
          "@max-[11rem]/promo:m-2 @max-[11rem]/promo:max-w-[calc(100%-1rem)] @max-[11rem]/promo:p-3",
          inverted ? "bg-foreground text-background" : "bg-background text-foreground",
        )}
      >
        <span className="block text-lg leading-tight font-semibold tracking-[-0.03em] text-balance">{title}</span>
        {description ? <span className={cn("mt-1.5 block text-sm leading-snug", inverted ? "text-background/75" : "text-muted-foreground")}>{description}</span> : null}
        <span
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            // In a narrow column (two products across on a phone) the button tightens up, and a label that is still too long wraps inside the plate instead of running out of it.
            "mt-4 pointer-events-none h-auto min-h-8 max-w-full py-1.5 leading-snug whitespace-normal",
            "@max-[11rem]/promo:gap-1.5 @max-[11rem]/promo:px-2.5",
            inverted ? "bg-background text-foreground group-hover/promo:bg-background/90" : "group-hover/promo:bg-primary/90",
          )}
        >
          {cta}
          <IconArrowRight />
        </span>
      </span>
    </a>
  );
}
