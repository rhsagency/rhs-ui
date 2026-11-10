import type { ComponentProps, ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export type ImageTileAlign = "start" | "center";

export interface ImageTileProps extends Omit<ComponentProps<"a">, "title" | "children"> {
  /** The address of the picture. It fills the tile and is cropped to the ratio. */
  src: string;
  /** What the picture shows. The title already names the link, so the picture is decoration unless you say otherwise. Default "". */
  alt?: string;
  /** The name of the tile, and the text of its one link. Up to two lines. */
  title: string;
  /** A line under the title: a count ("128 products"), a place, a date. Kept on one line. */
  meta?: ReactNode;
  /** Where the tile goes. The whole tile is this one link. */
  href: string;
  /** The shape of the tile as width divided by height. Give every tile of a grid the same one and the rows stay level. Default 4 / 3. */
  ratio?: number;
  /** `start` puts the text at the bottom left with the arrow at the right; `center` centres it over a dim that is deepest behind the text, for a poster-like tile. Default "start". */
  align?: ImageTileAlign;
  /** Load the picture now, with a high fetch priority: for a tile above the fold. The others load as they near the screen. */
  priority?: boolean;
}

/**
 * A picture with its title on it, for a category, a destination or a
 * collection. The whole tile is one link, so there is one tab stop and one
 * target for a finger. The text is white on a scrim made for it (a soft fade
 * from the bottom, or a dim that is deepest at the centre when centred), so it reads on any photo and
 * in light and dark alike: the contrast comes from the scrim and not from the
 * picture. Hover pulls the picture in a little and nudges the arrow, and both
 * stay put under reduced motion. The focus ring is drawn inside the tile, so
 * a grid or a scroller never clips it. Long titles clamp to two lines and the
 * tile keeps its ratio, so a grid stays level.
 */
export function ImageTile({ src, alt = "", title, meta, href, ratio = 4 / 3, align = "start", priority = false, className, style, ...props }: ImageTileProps) {
  const centred = align === "center";
  return (
    <a
      data-slot="image-tile"
      data-align={align}
      href={href}
      style={{ aspectRatio: ratio, ...style }}
      className={cn("group/tile @container relative isolate block min-w-0 overflow-hidden rounded-xl bg-muted text-white outline-none", className)}
      {...props}
    >
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        draggable={false}
        className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover/tile:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover/tile:scale-100"
      />
      <span
        aria-hidden="true"
        className={cn("absolute inset-0", centred ? "bg-[radial-gradient(ellipse_at_center,rgb(0_0_0/0.68)_0%,rgb(0_0_0/0.52)_55%,rgb(0_0_0/0.3)_100%)]" : "bg-[linear-gradient(to_top,rgb(0_0_0/0.74)_0%,rgb(0_0_0/0.48)_34%,rgb(0_0_0/0.12)_64%,rgb(0_0_0/0)_100%)]")}
      />
      <span className={cn("absolute inset-0 flex gap-3 p-4 sm:p-5", centred ? "flex-col items-center justify-center text-center" : "items-end justify-between")}>
        <span className="min-w-0">
          <span className="line-clamp-2 text-lg leading-snug font-semibold tracking-[-0.02em] text-balance [text-shadow:0_1px_14px_rgb(0_0_0/0.3)]">{title}</span>
          {meta ? <span className={cn("mt-1 block truncate text-sm tabular-nums", centred ? "text-white/95" : "text-white/80")}>{meta}</span> : null}
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full bg-white/90 text-black shadow-xs transition-colors duration-200 group-hover/tile:bg-white motion-reduce:transition-none",
            // A narrow tile gives the whole width to the text and tucks the arrow into the corner.
            "@max-[13rem]:absolute @max-[13rem]:top-3 @max-[13rem]:right-3 @max-[13rem]:size-7",
            centred && "mt-1",
          )}
        >
          <IconArrowRight className="size-4 transition-transform duration-300 ease-out group-hover/tile:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover/tile:translate-x-0" />
        </span>
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-black/10 transition-shadow duration-150 ring-inset group-focus-visible/tile:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.95),inset_0_0_0_5px_rgba(0,0,0,0.6)] motion-reduce:transition-none"
      />
    </a>
  );
}
