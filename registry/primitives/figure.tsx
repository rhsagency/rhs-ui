import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FigureProps {
  /** The image, video or diagram: always visible, never animated in. */
  children: ReactNode;
  caption?: ReactNode;
  /** Photographer or source, set apart after the caption. */
  credit?: string;
  /** Wider than the text column on large screens. */
  wide?: boolean;
  /** Frame ratio; the media is cropped to fill it. Leave out to keep the media's own shape. */
  ratio?: "16/9" | "4/3" | "1/1" | "3/4";
  className?: string;
}

const RATIO: Record<NonNullable<FigureProps["ratio"]>, string> = { "16/9": "aspect-video", "4/3": "aspect-[4/3]", "1/1": "aspect-square", "3/4": "aspect-[3/4]" };

/**
 * An image in an article with its caption and credit: a figure element so
 * the caption belongs to the picture, rounded media, and an optional wide
 * mode that reaches past the reading column on large screens.
 */
export function Figure({ children, caption, credit, wide = false, ratio, className }: FigureProps) {
  return (
    <figure data-slot="figure" className={cn("my-10", wide && "lg:-mx-24", className)}>
      <div className={cn("overflow-clip rounded-2xl bg-muted [&_img]:w-full [&_video]:w-full", ratio && cn(RATIO[ratio], "[&_img]:h-full [&_img]:object-cover [&_video]:h-full [&_video]:object-cover"))}>{children}</div>
      {caption || credit ? (
        <figcaption className={cn("mt-3 text-sm text-muted-foreground", wide && "lg:px-24")}>
          {caption}
          {credit ? <span className="ml-1.5 text-xs tracking-wide uppercase opacity-80">{credit}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
