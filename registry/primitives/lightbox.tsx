"use client";

import { useEffect, useState } from "react";

import { IconChevronLeft, IconChevronRight, IconClose } from "@rhs-ui/icons";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { cn } from "@/lib/utils";

export interface LightboxImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface LightboxProps {
  images: readonly LightboxImage[];
  /** Index of the open image, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
  className?: string;
}

/**
 * A full-screen viewer for any set of images: dark backdrop, the picture as
 * large as fits, caption and "3 of 12" underneath, previous and next as
 * buttons and with the arrow keys, and a modal dialog so focus stays in and
 * Escape closes. Bring your own thumbnails and open it at an index.
 */
export function Lightbox({ images, index, onIndexChange, className }: LightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const image = index !== null ? images[index] : undefined;
  const go = (delta: number) => index !== null && onIndexChange((index + delta + images.length) % images.length);
  useEffect(() => {
    setLoaded(false);
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (delta) onIndexChange((index + delta + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, images.length, onIndexChange]);
  const nav = "absolute top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white outline-none backdrop-blur hover:bg-white/20 focus-visible:ring-[3px] focus-visible:ring-white/60 [&_svg]:size-5";
  return (
    <Dialog open={index !== null} onOpenChange={(open) => !open && onIndexChange(null)}>
      <DialogContent showCloseButton={false} className={cn("top-0 left-0 grid h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 place-items-center gap-0 rounded-none border-0 bg-black/90 p-4 text-white sm:max-w-none sm:p-12", className)}>
        <DialogTitle className="sr-only">{image?.alt ?? "Image"}</DialogTitle>
        <DialogDescription className="sr-only">{index !== null ? `Image ${index + 1} of ${images.length}. Use the arrow keys to move.` : ""}</DialogDescription>
        {image ? (
          <figure className="grid max-h-full max-w-full justify-items-center gap-3">
            <img src={image.src} alt={image.alt} onLoad={() => setLoaded(true)} className={cn("max-h-[calc(100dvh-8rem)] max-w-full rounded-lg object-contain", !loaded && "min-h-40 min-w-40 bg-white/5")} />
            <figcaption className="text-center text-sm text-white/80">{image.caption ? `${image.caption} · ` : ""}<span className="tabular-nums">{(index ?? 0) + 1} of {images.length}</span></figcaption>
          </figure>
        ) : null}
        {images.length > 1 ? (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous image" className={cn(nav, "left-3 sm:left-6")}><IconChevronLeft /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next image" className={cn(nav, "right-3 sm:right-6")}><IconChevronRight /></button>
          </>
        ) : null}
        <button type="button" onClick={() => onIndexChange(null)} aria-label="Close" className={cn(nav, "top-8 right-3 translate-y-0 sm:right-6")}><IconClose /></button>
      </DialogContent>
    </Dialog>
  );
}
