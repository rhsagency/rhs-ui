"use client";

import type { ComponentProps } from "react";

import { IconGrid } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** One photo of the mosaic. */
export interface MosaicPhoto {
  /** The address of the picture. */
  src: string;
  /** What the picture shows. Used as the name when there is no `label`. */
  alt: string;
  /** A short name such as "Kitchen", which ends up in the name of the button: "Photo 3 of 24: Kitchen". */
  label?: string;
}

export interface PhotoMosaicLabels {
  /** The name of a photo's button; `{n}` is its place, `{total}` the number of photos and `{label}` its name. Default "Photo {n} of {total}: {label}". */
  photo?: string;
  /** The Show all button, and its name; `{total}` is the number of photos. Default "Show all {total} photos". */
  showAll?: string;
}

export interface PhotoMosaicProps extends Omit<ComponentProps<"div">, "children"> {
  /** The photos, best first. The first five are shown; the rest are the gallery's business. */
  photos: readonly MosaicPhoto[];
  /** How many photos there are in all, when the gallery holds more than you pass here. Default `photos.length`. */
  total?: number;
  /** Called with the place of the photo that was pressed, from 0. Open your own lightbox or sheet here. */
  onOpen?: (index: number) => void;
  /** Adds a Show all button on the last cell. Open your gallery here. */
  onShowAll?: () => void;
  /** The language of the number in "Show all 1,248 photos". Default "en-US". */
  locale?: string;
  /** The words used for names and the Show all button. */
  labels?: PhotoMosaicLabels;
}

// Each cell of the 4 by 2 grid, written whole for Tailwind. The first is the large one on the left.
const LAYOUTS: Record<number, readonly string[]> = {
  1: ["@lg:col-span-4 @lg:row-span-2"],
  2: ["@lg:col-span-2 @lg:row-span-2", "@lg:col-span-2 @lg:row-span-2"],
  3: ["@lg:col-span-2 @lg:row-span-2", "@lg:col-span-2", "@lg:col-span-2"],
  4: ["@lg:col-span-2 @lg:row-span-2", "@lg:col-span-2", "@lg:col-span-1", "@lg:col-span-1"],
  5: ["@lg:col-span-2 @lg:row-span-2", "@lg:col-span-1", "@lg:col-span-1", "@lg:col-span-1", "@lg:col-span-1"],
};

/**
 * The header gallery of a listing: one large photo on the left and four small
 * ones in a 2 by 2 on the right, with a "Show all 24 photos" button on the
 * last. With fewer than five photos it falls back to a layout of one, two,
 * three or four, and on a phone (it answers to its own width, not the
 * window's) it collapses to the first photo with a "1 / 24" counter. In a
 * narrow column, under 48rem of its own width, the Show all button shrinks to
 * its icon and the count so it never outgrows its cell. Every cell is a real
 * button named "Photo 3 of 24: Kitchen". Hovering darkens that one cell, and
 * keyboard focus draws a ring that shows on any picture. It opens nothing
 * itself: `onOpen` gets the place of the photo, `onShowAll` the click on the
 * button, and what appears is your lightbox or sheet.
 */
export function PhotoMosaic({ photos, total, onOpen, onShowAll, locale = "en-US", labels, className, ...props }: PhotoMosaicProps) {
  const visible = photos.slice(0, 5);
  if (!visible.length) return null;
  const count = Math.max(total ?? photos.length, photos.length);
  const shown = new Intl.NumberFormat(locale).format(count);
  const template = labels?.photo ?? "Photo {n} of {total}: {label}";
  const showAll = (labels?.showAll ?? "Show all {total} photos").replace("{total}", shown);
  const layout = LAYOUTS[visible.length] ?? LAYOUTS[5] ?? [];
  return (
    <div data-slot="photo-mosaic" data-count={visible.length} className={cn("@container w-full", className)} {...props}>
      <div className="grid aspect-[4/3] grid-cols-1 gap-2 overflow-hidden rounded-xl @lg:aspect-[2/1] @lg:grid-cols-4 @lg:grid-rows-2 @4xl:aspect-[5/2]">
        {visible.map((photo, index) => (
          <div key={`${photo.src}-${index}`} className={cn("relative min-h-0 min-w-0 overflow-hidden bg-muted", index > 0 && "hidden @lg:block", layout[index])}>
            <button
              type="button"
              aria-label={template.replace("{n}", String(index + 1)).replace("{total}", shown).replace("{label}", photo.label ?? photo.alt)}
              onClick={() => onOpen?.(index)}
              className="group/photo absolute inset-0 block outline-none"
            >
              <img
                src={photo.src}
                alt=""
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
                className="size-full object-cover transition-transform duration-500 ease-out group-hover/photo:scale-[1.03] motion-reduce:transition-none"
              />
              {/* Hover darkens this cell only; focus is a white ring with a dark one inside it, so it reads on a pale picture and a dark one. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/photo:bg-black/20 group-focus-visible/photo:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.95),inset_0_0_0_4px_rgba(0,0,0,0.5)] motion-reduce:transition-none"
              />
            </button>
            {/* On a phone the counter says there is more; a lone photo has nothing more to say, so it shows none. The name carries the words as well as the visible "1 / 24", so voice control can say what it sees; not in brackets, which axe (and a voice matcher) leave out. */}
            {index === 0 && count > 1 ? (
              onShowAll ? (
                <Button type="button" variant="outline" size="sm" aria-label={`${showAll}, 1 / ${shown}`} onClick={onShowAll} className="absolute right-3 bottom-3 tabular-nums shadow-xs @lg:hidden">
                  <IconGrid aria-hidden="true" />
                  {`1 / ${shown}`}
                </Button>
              ) : (
                <span aria-hidden="true" className="pointer-events-none absolute right-3 bottom-3 inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-[0.8125rem] font-medium tabular-nums shadow-xs @lg:hidden">
                  {`1 / ${shown}`}
                </span>
              )
            ) : null}
            {/* The last cell is a quarter of the width, so under 48rem it is narrower than the words need: the button keeps its icon and the count, and its name stays whole. The max-width and the ellipsis are a net for long translations. */}
            {index === visible.length - 1 && onShowAll ? (
              <Button type="button" variant="outline" size="sm" aria-label={`${showAll}, ${shown}`} onClick={onShowAll} className="absolute right-3 bottom-3 hidden max-w-[calc(100%-1.5rem)] shadow-xs @lg:inline-flex">
                <IconGrid aria-hidden="true" />
                <span className="min-w-0 truncate @max-3xl:hidden">{showAll}</span>
                <span className="hidden tabular-nums @max-3xl:inline">{shown}</span>
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
