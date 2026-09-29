"use client";

import { useState, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

export interface GalleryImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface ProductGalleryProps {
  images: readonly GalleryImage[];
  /** Zooms the main image where the pointer is. Off on touch, where it would hide the picture. */
  zoom?: boolean;
  className?: string;
}

/**
 * The pictures on a product page: a large image and a row of thumbnails.
 * The thumbnails are tabs, so arrow keys move between them; the main image
 * zooms under the pointer on a mouse and fades between pictures.
 */
export function ProductGallery({ images, zoom = true, className }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [origin, setOrigin] = useState<string | null>(null);
  const current = images[index] ?? images[0];
  if (!current) return null;
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (event.key in moves) next = (index + moves[event.key]! + images.length) % images.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = images.length - 1;
    if (next === null) return;
    event.preventDefault();
    setIndex(next);
    event.currentTarget.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  };
  return (
    <div data-slot="product-gallery" className={cn("grid gap-3", className)}>
      <div
        role="tabpanel"
        aria-label={`Image ${index + 1} of ${images.length}`}
        className="relative aspect-[4/5] overflow-hidden rounded-xl border border-border bg-muted"
        onPointerMove={(event) => {
          if (!zoom || event.pointerType !== "mouse") return;
          const box = event.currentTarget.getBoundingClientRect();
          setOrigin(`${((event.clientX - box.left) / box.width) * 100}% ${((event.clientY - box.top) / box.height) * 100}%`);
        }}
        onPointerLeave={() => setOrigin(null)}
      >
        {images.map((image, at) => (
          <img
            key={image.src}
            src={image.src}
            alt={at === index ? image.alt : ""}
            aria-hidden={at === index ? undefined : true}
            width={image.width}
            height={image.height}
            className={cn("absolute inset-0 size-full object-cover transition-[opacity,scale] duration-300 ease-out motion-reduce:transition-none", at === index ? "opacity-100" : "opacity-0")}
            style={at === index && origin ? { transformOrigin: origin, scale: "1.8" } : undefined}
          />
        ))}
      </div>
      {images.length > 1 ? (
        <div role="tablist" aria-label="Product images" onKeyDown={onKeyDown} className="flex gap-2 overflow-x-auto p-0.5">
          {images.map((image, at) => (
            <button
              key={image.src}
              type="button"
              role="tab"
              aria-selected={at === index}
              aria-label={image.alt}
              tabIndex={at === index ? 0 : -1}
              onClick={() => setIndex(at)}
              className={cn("size-16 shrink-0 overflow-hidden rounded-md border bg-muted outline-none transition-[border-color,opacity] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40", at === index ? "border-foreground" : "border-border opacity-70 hover:opacity-100")}
            >
              <img src={image.src} alt="" width={64} height={64} className="size-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
