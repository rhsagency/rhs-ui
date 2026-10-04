"use client";

import { useEffect, useState, type ReactNode } from "react";

import { usePrefersReducedMotion } from "@rhs-ui/motion/use-in-view";
import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PromoBarProps {
  /** One to four short messages: "Free delivery over €50", "New: the linen collection". */
  messages: readonly ReactNode[];
  /** Seconds per message when there are several. */
  interval?: number;
  className?: string;
}

/**
 * The thin band above a shop's header: one message, or a few that rotate
 * slowly with arrows to step through them. Rotation pauses on hover and
 * focus and never runs under reduced motion; screen readers get every
 * message in a list rather than a moving target.
 */
export function PromoBar({ messages, interval = 5, className }: PromoBarProps) {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const many = messages.length > 1;
  useEffect(() => {
    if (!many || paused || reduced) return;
    const timer = setTimeout(() => setIndex((value) => (value + 1) % messages.length), interval * 1000);
    return () => clearTimeout(timer);
  }, [index, many, paused, reduced, interval, messages.length]);
  const step = (delta: number) => setIndex((value) => (value + delta + messages.length) % messages.length);
  const arrow = "inline-flex size-7 items-center justify-center rounded-full outline-none hover:bg-background/15 focus-visible:ring-2 focus-visible:ring-background/60 [&_svg]:size-4";
  return (
    <aside data-slot="promo-bar" aria-label="Offers" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)} className={cn("relative flex items-center justify-center gap-2 bg-foreground px-3 py-2 text-center text-xs text-background [&_a]:underline [&_a]:underline-offset-2", className)}>
      {many ? <button type="button" onClick={() => step(-1)} aria-label="Previous offer" className={arrow}><IconChevronLeft /></button> : null}
      <ul className="sr-only">{messages.map((message, i) => <li key={i}>{message}</li>)}</ul>
      <p aria-hidden="true" key={index} className="min-w-0 flex-1 truncate motion-safe:animate-rhs-fade-in sm:flex-none">{messages[index]}</p>
      {many ? <button type="button" onClick={() => step(1)} aria-label="Next offer" className={arrow}><IconChevronRight /></button> : null}
    </aside>
  );
}
