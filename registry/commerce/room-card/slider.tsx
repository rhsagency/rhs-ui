"use client";

import { useEffect, useRef, useState } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface RoomImage {
  src: string;
  /** What the picture shows: "King bed facing the canal windows". Use "" for a picture that only decorates. */
  alt: string;
}

export interface PhotoSliderProps {
  /** The pictures, in order. One picture is shown without arrows or dots. */
  images: readonly RoomImage[];
  /** Names the slider for a screen reader: "Photos of Canal view double room". */
  label: string;
  /** Greys the pictures out, for a room that cannot be booked. */
  muted?: boolean;
  /** The name of the left arrow. */
  previousLabel?: string;
  /** The name of the right arrow. */
  nextLabel?: string;
  /** `{current}` and `{count}`. Announced when the picture changes. */
  positionLabel?: string;
  /** Sizes and places the slider: the room card fills its picture area with it. */
  className?: string;
}

const ARROW =
  "absolute top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-background/95 text-foreground shadow-sm outline-none transition-[opacity,background-color] duration-150 hover:bg-background focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none opacity-0 group-hover/photos:opacity-100 group-focus-within/photos:opacity-100 [@media(hover:none)]:opacity-100";

/**
 * The pictures of a room, one at a time: they scroll with native snapping (a swipe on a phone, the trackpad on a
 * laptop), the arrows show on hover and focus and always on a touch screen, and they loop. The dots are a quiet
 * position marker; a screen reader hears "Photo 2 of 5" whenever the picture changes. With one picture it is just
 * the picture. Under reduced motion the arrows jump instead of glide.
 */
export function PhotoSlider({ images, label, muted = false, previousLabel = "Previous photo", nextLabel = "Next photo", positionLabel = "Photo {current} of {count}", className }: PhotoSliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const shown = useRef(0);
  const count = images.length;

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const width = element.clientWidth || 1;
        setIndex(Math.max(0, Math.min(count - 1, Math.round(element.scrollLeft / width))));
      });
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener("scroll", onScroll);
    };
  }, [count]);

  // A new width (a rotated phone, a resized window) must keep the picture that is on show, not the nearest scroll position.
  useEffect(() => {
    shown.current = index;
  }, [index]);
  useEffect(() => {
    const element = track.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (element.clientWidth > 0) element.scrollTo({ left: shown.current * element.clientWidth, behavior: "instant" });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function go(next: number) {
    const element = track.current;
    if (!element) return;
    const target = (next + count) % count;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A jump from the last picture to the first would scroll through all of them, so it does not glide.
    element.scrollTo({ left: target * element.clientWidth, behavior: reduce || Math.abs(target - index) > 1 ? "auto" : "smooth" });
  }

  const at = (position: number) => positionLabel.replace("{current}", String(position + 1)).replace("{count}", String(count));
  const many = count > 1;
  return (
    <div data-slot="room-card-photos" role="group" aria-roledescription="carousel" aria-label={label} className={cn("group/photos relative overflow-hidden bg-muted", className)}>
      <div
        ref={track}
        tabIndex={many ? 0 : undefined}
        className={cn(
          "relative flex size-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden",
          muted && "opacity-60 grayscale",
        )}
      >
        {images.map((image, position) => (
          <div key={position} role="group" aria-roledescription="slide" aria-label={at(position)} className="size-full min-w-full shrink-0 snap-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the card is plain markup */}
            <img src={image.src} alt={image.alt} loading={position === 0 ? "eager" : "lazy"} decoding="async" draggable={false} className="size-full object-cover" />
          </div>
        ))}
      </div>

      {many ? (
        <>
          <button type="button" aria-label={previousLabel} onClick={() => go(index - 1)} className={cn(ARROW, "left-2.5")}>
            <IconChevronLeft className="size-4" />
          </button>
          <button type="button" aria-label={nextLabel} onClick={() => go(index + 1)} className={cn(ARROW, "right-2.5")}>
            <IconChevronRight className="size-4" />
          </button>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
            {count <= 6 ? (
              <div className="flex items-center gap-1.5 rounded-full bg-background/90 px-2 py-1.5 shadow-xs">
                {images.map((_, position) => (
                  <span key={position} className={cn("size-1.5 rounded-full transition-colors duration-150 motion-reduce:transition-none", position === index ? "bg-foreground" : "bg-foreground/25")} />
                ))}
              </div>
            ) : (
              <span className="rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium tabular-nums shadow-xs">
                {index + 1} / {count}
              </span>
            )}
          </div>
          <p role="status" className="sr-only">
            {at(index)}
          </p>
        </>
      ) : null}
    </div>
  );
}
