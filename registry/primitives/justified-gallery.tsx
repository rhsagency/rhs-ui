"use client";

import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

/** One photo of the gallery. It carries its own size, which is all the layout needs. */
export interface JustifiedPhoto {
  /** The address of the picture. */
  src: string;
  /** What the picture shows. Required. */
  alt: string;
  /** The width of the file, in any unit: only the shape matters. */
  width: number;
  /** The height of the file, in the same unit. */
  height: number;
  /** A line shown over the photo on hover and on keyboard focus: a place, a date, a credit. */
  caption?: string;
}

export interface JustifiedGalleryProps extends Omit<ComponentProps<"ul">, "children" | "onSelect"> {
  /** The photos, in order. */
  items: readonly JustifiedPhoto[];
  /** The height the rows aim for: a number in px, or any CSS length. Rows grow a little to fill the width exactly: by a few percent on a wide container, and by more on a phone, where a very wide photo that does not fit beside the one before it leaves that one alone on its row. A smaller height keeps the rows closer together. The default scales with the window, from 96px on a phone to 200px. */
  rowHeight?: number | string;
  /** The space between photos, in both directions: a number in px, or any CSS length. Default 8. */
  gap?: number | string;
  /** Makes every photo a button and is called with its place, from 0, so any lightbox can open it. Without it a photo is a plain figure. */
  onSelect?: (index: number) => void;
}

const length = (value: number | string) => (typeof value === "number" ? `${value}px` : value);

/**
 * Photos in rows of equal height with no cropping and no gaps, the way a photo
 * library lays them out. Every photo carries its width and height, and each
 * row grows its photos in proportion to their shapes until the row fills the
 * width exactly around the row height you aim for; the last row is not
 * stretched. It is flexbox and nothing else, with no layout script and no
 * resize observer, so the first paint, on the server too, is already right.
 * With `onSelect` each photo is a button, and without it a plain figure. A
 * caption appears on hover and, on a button, on keyboard focus. On a touch
 * screen, where there is neither, it is always visible, but only on the photos
 * wide enough to hold it (9rem), so a phone does not fill with cut-off chips.
 */
export function JustifiedGallery({ items, rowHeight = "clamp(6rem, 3rem + 11vw, 12.5rem)", gap = 8, onSelect, className, style, ...props }: JustifiedGalleryProps) {
  if (!items.length) return null;
  const vars = { "--jg-row": length(rowHeight), "--jg-gap": length(gap) } as CSSProperties;
  return (
    <ul
      role="list"
      data-slot="justified-gallery"
      style={{ ...vars, ...style }}
      // The empty ::after takes all the free space of the last row, so its photos keep the size they aim for instead of growing to fill it.
      className={cn("flex flex-wrap items-start gap-[var(--jg-gap)] after:-mt-[var(--jg-gap)] after:grow-[999999] after:basis-0 after:content-['']", className)}
      {...props}
    >
      {items.map((item, index) => {
        const ratio = item.width > 0 && item.height > 0 ? item.width / item.height : 3 / 2;
        const caption = item.caption ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-x-2 bottom-2 flex translate-y-1 opacity-0 transition-[opacity,transform] duration-200 motion-reduce:transition-none",
              "group-hover/photo:translate-y-0 group-hover/photo:opacity-100 group-focus-visible/photo:translate-y-0 group-focus-visible/photo:opacity-100 pointer-coarse:@min-[9rem]:translate-y-0 pointer-coarse:@min-[9rem]:opacity-100",
            )}
          >
            <span className="max-w-full truncate rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground shadow-xs">{item.caption}</span>
          </span>
        ) : null;
        const picture = (
          <img
            src={item.src}
            alt={onSelect ? "" : item.alt}
            width={item.width}
            height={item.height}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover/photo:scale-[1.03] motion-reduce:transition-none"
          />
        );
        return (
          <li
            key={`${index}-${item.alt}`}
            // A container of its own width, so a touch screen can tell a photo wide enough for its caption from a narrow one.
            className="@container relative min-w-0 overflow-hidden rounded-lg bg-muted"
            style={{ flexGrow: ratio * 100, flexBasis: `calc(var(--jg-row) * ${ratio})`, aspectRatio: `${item.width} / ${item.height}` }}
          >
            {onSelect ? (
              <button
                type="button"
                aria-label={item.caption ? `${item.alt}, ${item.caption}` : item.alt}
                onClick={() => onSelect(index)}
                className="group/photo absolute inset-0 block cursor-pointer outline-none"
              >
                {picture}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/photo:bg-black/15 group-focus-visible/photo:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.95),inset_0_0_0_4px_rgba(0,0,0,0.5)] motion-reduce:transition-none"
                />
                <span aria-hidden="true">{caption}</span>
              </button>
            ) : (
              <figure className="group/photo absolute inset-0 m-0">
                {picture}
                <span aria-hidden="true" className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover/photo:bg-black/15 motion-reduce:transition-none" />
                {item.caption ? (
                  <figcaption className="pointer-events-none absolute inset-x-2 bottom-2 flex translate-y-1 opacity-0 transition-[opacity,transform] duration-200 group-hover/photo:translate-y-0 group-hover/photo:opacity-100 motion-reduce:transition-none pointer-coarse:@min-[9rem]:translate-y-0 pointer-coarse:@min-[9rem]:opacity-100">
                    <span className="max-w-full truncate rounded-md bg-background px-2 py-1 text-xs font-medium text-foreground shadow-xs">{item.caption}</span>
                  </figcaption>
                ) : null}
              </figure>
            )}
          </li>
        );
      })}
    </ul>
  );
}
