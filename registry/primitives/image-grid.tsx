"use client";

import { useState } from "react";

import { IconArrowLeft, IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogTitle } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export interface GridImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

export interface ImageGridProps {
  images: readonly GridImage[];
  /** Columns on wide screens; two on a phone. */
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * A grid of thumbnails that opens each image large in a lightbox, with
 * previous and next (buttons and arrow keys) and the caption underneath.
 * Thumbnails keep one ratio so mixed photos still line up.
 */
export function ImageGrid({ images, columns = 3, className }: ImageGridProps) {
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : images[index];
  const go = (step: number) => setIndex((value) => (value === null ? value : (value + step + images.length) % images.length));
  return (
    <div data-slot="image-grid" className={className}>
      <ul className={cn("grid grid-cols-2 gap-2", columns === 3 && "sm:grid-cols-3", columns === 4 && "sm:grid-cols-4")}>
        {images.map((image, i) => (
          <li key={image.id}>
            <button type="button" onClick={() => setIndex(i)} className="group block w-full overflow-hidden rounded-lg outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50" aria-label={`Open ${image.alt}`}>
              <img src={image.src} alt="" className="aspect-square w-full bg-muted object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
            </button>
          </li>
        ))}
      </ul>
      <Dialog open={current !== null && current !== undefined} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent className="max-w-4xl p-3" onKeyDown={(event) => { if (event.key === "ArrowRight") go(1); if (event.key === "ArrowLeft") go(-1); }}>
          <DialogTitle className="sr-only">{current?.alt}</DialogTitle>
          {current ? (
            <figure>
              <img src={current.src} alt={current.alt} className="max-h-[75vh] w-full rounded-md object-contain" />
              <figcaption className="mt-3 flex items-center justify-between gap-4 px-1 text-sm">
                <span>{current.caption ?? current.alt}</span>
                <span className="flex items-center gap-1">
                  <span className="mr-2 text-xs text-muted-foreground tabular-nums">{(index ?? 0) + 1} / {images.length}</span>
                  <Button size="icon-sm" variant="outline" aria-label="Previous image" onClick={() => go(-1)}><IconArrowLeft /></Button>
                  <Button size="icon-sm" variant="outline" aria-label="Next image" onClick={() => go(1)}><IconArrowRight /></Button>
                </span>
              </figcaption>
            </figure>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
