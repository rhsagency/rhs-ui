"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface CarouselProps {
  children: ReactNode;
  /** Names the carousel for screen readers: "Customer stories". */
  label: string;
  /** How many slides fit side by side from the md breakpoint. */
  perView?: 1 | 2 | 3;
  className?: string;
}

/**
 * Slides in a row that scroll with native snapping: swipe on touch, the
 * trackpad on a laptop, arrow buttons and dots for everyone. Every slide
 * stays in the page and in the tab order, and says "3 of 8"; nothing moves
 * by itself. Under reduced motion the buttons jump instead of glide.
 */
export function Carousel({ children, label, perView = 1, className }: CarouselProps) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting && entry.intersectionRatio > 0.6) setCurrent(Number((entry.target as HTMLElement).dataset.index));
      },
      { root: element, threshold: [0.6] },
    );
    element.querySelectorAll("[data-index]").forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [slides.length]);
  const go = (index: number) => {
    const slide = track.current?.querySelector(`[data-index="${Math.max(0, Math.min(slides.length - 1, index))}"]`) as HTMLElement | null;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    slide?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest", inline: "start" });
  };
  const button = "grid size-9 place-items-center rounded-full border border-border bg-background shadow-xs outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-40";
  return (
    <section data-slot="carousel" aria-roledescription="carousel" aria-label={label} className={cn("grid gap-4", className)}>
      <div
        ref={track}
        className={cn(
          "relative grid snap-x snap-mandatory auto-cols-[85%] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden",
          perView === 2 && "md:auto-cols-[calc((100%-1rem)/2)]",
          perView === 3 && "md:auto-cols-[calc((100%-2rem)/3)]",
          perView === 1 && "md:auto-cols-[100%]",
        )}
      >
        {slides.map((slide, index) => (
          <div key={index} data-index={index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`} className="snap-start">
            {slide}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === current ? "true" : undefined}
              onClick={() => go(index)}
              className={cn("h-1.5 rounded-full transition-[width,background-color] duration-200 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", index === current ? "w-6 bg-foreground" : "w-1.5 bg-border hover:bg-muted-foreground")}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous slide" disabled={current === 0} onClick={() => go(current - 1)} className={button}>
            <IconChevronLeft size={16} />
          </button>
          <button type="button" aria-label="Next slide" disabled={current >= slides.length - 1} onClick={() => go(current + 1)} className={button}>
            <IconChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
