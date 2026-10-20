"use client";

import { useEffect, useState, type ComponentProps, type RefObject } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ReadingTimeState {
  /** Whole minutes still ahead of the reader. At the top, the whole text. */
  minutes: number;
  /** Whole minutes for the whole text. */
  total: number;
  /** How far through the text the reader has scrolled, 0 to 1. */
  progress: number;
  phase: "start" | "reading" | "done";
}

export interface ReadingTimeLabels {
  /** At the top: "{minutes} min read". */
  total?: string;
  /** While reading: "{minutes} min left". */
  left?: string;
  /** At the end. */
  done?: string;
}

export interface ReadingTimeLeftProps extends Omit<ComponentProps<"span">, "ref" | "children"> {
  /** The article: a ref to its element, or a CSS selector. Its words and its scroll position drive the readout. */
  target: RefObject<HTMLElement | null> | string;
  /** Words per minute. Adults read prose at about 230. */
  wpm?: number;
  /** The words, for another language. `{minutes}` stands for the number. */
  labels?: ReadingTimeLabels;
  /** Takes over the text completely. */
  format?: (state: ReadingTimeState) => string;
  /** Locale for the number of minutes. */
  locale?: string;
}

function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return parent;
  }
  return null;
}

/**
 * How long an article will still take, counted down as you read: "6 min
 * read" at the top, "4 min left" a little later, a quiet "Done" at the end.
 * It counts the real words of the target and follows the reader's position
 * through it, redrawing at most once a second and never announcing the
 * change, so a screen reader hears the total once and is left alone. It
 * pairs with a progress bar rather than replacing one, and it renders no
 * text on the server.
 */
export function ReadingTimeLeft({ target, wpm = 230, labels, format, locale = "en-US", className, ...props }: ReadingTimeLeftProps) {
  const [state, setState] = useState<ReadingTimeState | null>(null);

  useEffect(() => {
    const article = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target.current;
    if (!article) return;
    const scroller = scrollParent(article);
    const source: HTMLElement | Window = scroller ?? window;
    const rate = wpm > 0 ? wpm : 230;
    let words = 0;
    let total = 1;
    let progress = 0;
    let shownAt = -Infinity;
    let timer = 0;
    let frame = 0;
    const count = (): void => {
      words = (article.textContent ?? "").trim().split(/\s+/).filter(Boolean).length;
      total = Math.max(1, Math.ceil(words / rate));
    };
    // How far the top of the scroll area has travelled through the article, from its start to its last screenful.
    const measure = (): number => {
      const box = article.getBoundingClientRect();
      const top = scroller ? scroller.getBoundingClientRect().top : 0;
      const view = scroller ? scroller.clientHeight : window.innerHeight;
      const range = box.height - view;
      return range > 0 ? Math.min(1, Math.max(0, (top - box.top) / range)) : 0;
    };
    const show = (): void => {
      timer = 0;
      shownAt = performance.now();
      const phase = progress >= 0.98 ? "done" : progress < 0.01 ? "start" : "reading";
      const minutes = phase === "start" ? total : Math.max(1, Math.ceil((words * (1 - progress)) / rate));
      setState((now) => (now && now.minutes === minutes && now.total === total && now.phase === phase ? now : { minutes, total, progress, phase }));
    };
    const update = (): void => {
      frame = 0;
      progress = measure();
      const wait = 1000 - (performance.now() - shownAt);
      if (wait <= 0) show();
      else if (!timer) timer = window.setTimeout(show, wait);
    };
    const schedule = (): void => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    count();
    update();
    source.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Late content (images, fetched text) changes both the words and the length.
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      count();
      schedule();
    });
    observer?.observe(article);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      source.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [target, wpm]);

  const number = new Intl.NumberFormat(locale);
  const fill = (template: string, minutes: number): string => template.replace("{minutes}", number.format(minutes));
  const write = (now: ReadingTimeState): string =>
    format
      ? format(now)
      : now.phase === "done"
        ? (labels?.done ?? "Done")
        : fill(now.phase === "start" ? (labels?.total ?? "{minutes} min read") : (labels?.left ?? "{minutes} min left"), now.minutes);

  return (
    <span data-slot="reading-time-left" data-phase={state?.phase} className={cn("inline-flex h-5 items-center text-xs text-muted-foreground tabular-nums", className)} {...props}>
      {state ? (
        <>
          <span className="sr-only">{write({ ...state, minutes: state.total, phase: "start" })}</span>
          <span aria-hidden="true" className="inline-flex items-center gap-1">
            {state.phase === "done" ? <IconCheck className="size-3.5" /> : null}
            {write(state)}
          </span>
        </>
      ) : null}
    </span>
  );
}
