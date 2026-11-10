"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";

import { IconImage, IconPlay } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/** One preview in the strip. */
export interface ThumbnailItem {
  /** What `value` and `onChange` speak. */
  id: string;
  /** The address of the small picture. */
  src: string;
  /** What the picture shows. It is the name of the button, so make it say something. */
  alt: string;
  /** A video gets a small play badge and its length. Default "image". */
  kind?: "image" | "video";
  /** The length of a video, as seconds (134) or as text ("2:14"). */
  duration?: number | string;
}

export type ThumbnailSize = "sm" | "md" | "lg";

export interface ThumbnailStripProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The previews, in order. */
  items: readonly ThumbnailItem[];
  /** The id of the selected preview, when you control it. */
  value?: string;
  /** The id to start on, when you do not control it. Default the first. */
  defaultValue?: string;
  /** Called with the preview that was chosen, by a click, a tap or the arrow keys. Show the large picture for it. */
  onChange?: (id: string, item: ThumbnailItem, index: number) => void;
  /** A row (the default) or a column. A column scrolls inside the height you give the strip. */
  orientation?: "horizontal" | "vertical";
  /** How big a preview is: `sm` 72px, `md` 92px or `lg` 120px wide. Default `md`. */
  size?: ThumbnailSize;
  /** The shape of a preview as width divided by height. Default 4 / 3. */
  ratio?: number;
  /** The name of the strip for screen readers. Default "Thumbnails". */
  label?: string;
  /** The word added to the name of a video, before its length. Default "video". */
  videoLabel?: string;
}

const WIDTH: Record<ThumbnailSize, string> = { sm: "w-[4.5rem]", md: "w-[5.75rem]", lg: "w-[7.5rem]" };

/** How wide the fade at an edge gets, in px. It grows with the scroll and is whole once this much of the strip lies beyond the edge. */
const FADE = 32;

/** How much of the strip lies beyond an edge, as the width of its fade: 0 at the edge, growing with the scroll up to the full fade. */
const fadeOf = (beyond: number) => Math.round(Math.min(FADE, Math.max(0, beyond)));

/** 134 becomes "2:14" and 3725 becomes "1:02:05"; text is shown as it comes. */
function clock(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  const total = Math.max(0, Math.round(value));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

/** The small picture, or a quiet icon if it cannot be shown. */
function Picture({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="absolute inset-0 grid place-items-center text-muted-foreground">
        <IconImage aria-hidden="true" className="size-5" />
      </span>
    );
  }
  return <img src={src} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setFailed(true)} className="size-full object-cover" />;
}

/**
 * A row or column of small previews that chooses the big picture. It is one
 * tab stop: the arrow keys move from preview to preview and choose as they go
 * (Home and End jump to the ends), the chosen one is ringed and scrolled into
 * view inside the strip, never the page, and every preview is a real button
 * with aria-current. A video shows a play badge and its length. When there is
 * more than fits the strip scrolls natively, by touch, wheel or keys, and the
 * edge that has more beyond it fades, the fade growing with the scroll instead
 * of switching on. Pair it with any large image, or with the Carousel, through
 * `value` and `onChange`; a preview that cannot load shows an icon instead of a
 * broken picture.
 */
export function ThumbnailStrip({ items, value, defaultValue, onChange, orientation = "horizontal", size = "md", ratio = 4 / 3, label = "Thumbnails", videoLabel = "video", className, style, onKeyDown, onScroll, ...props }: ThumbnailStripProps) {
  const vertical = orientation === "vertical";
  const scroller = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [own, setOwn] = useState(defaultValue ?? items[0]?.id);
  const current = value ?? own;
  const selected = items.findIndex((item) => item.id === current);
  const tabStop = selected >= 0 ? selected : 0;
  // The width of the fade at each edge in px: the top or left one first, and the bottom or right one second.
  const [edges, setEdges] = useState({ before: 0, after: 0 });

  const measure = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    // How much of the strip lies beyond each edge. The fade grows with it, so it never pops in or out.
    let beforeScroll: number;
    let afterScroll: number;
    if (vertical) {
      beforeScroll = element.scrollTop;
      afterScroll = element.scrollHeight - element.clientHeight - element.scrollTop;
    } else {
      // In a right-to-left page scrollLeft counts down from 0 at the right edge.
      const rtl = getComputedStyle(element).direction === "rtl";
      const room = element.scrollWidth - element.clientWidth;
      beforeScroll = rtl ? room + element.scrollLeft : element.scrollLeft;
      afterScroll = rtl ? -element.scrollLeft : room - element.scrollLeft;
    }
    const before = fadeOf(beforeScroll);
    const after = fadeOf(afterScroll);
    setEdges((previous) => (previous.before === before && previous.after === after ? previous : { before, after }));
  }, [vertical]);

  useEffect(() => {
    measure();
    const element = scroller.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [measure, items.length]);

  // Bring the chosen preview to the middle of the strip: scrollBy on the strip only, so the page never moves.
  const firstRun = useRef(true);
  useEffect(() => {
    const element = scroller.current;
    const button = selected >= 0 ? buttons.current[selected] : null;
    if (!element || !button) return;
    const box = element.getBoundingClientRect();
    const target = button.getBoundingClientRect();
    const delta = vertical ? target.top + target.height / 2 - (box.top + box.height / 2) : target.left + target.width / 2 - (box.left + box.width / 2);
    const calm = firstRun.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = calm ? "auto" : "smooth";
    element.scrollBy(vertical ? { top: delta, behavior } : { left: delta, behavior });
    firstRun.current = false;
  }, [selected, vertical]);

  const choose = (index: number) => {
    const item = items[index];
    if (!item) return;
    if (value === undefined) setOwn(item.id);
    if (item.id !== current) onChange?.(item.id, item, index);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const rtl = !vertical && getComputedStyle(event.currentTarget).direction === "rtl";
    const keys = vertical ? { back: "ArrowUp", forward: "ArrowDown" } : rtl ? { back: "ArrowRight", forward: "ArrowLeft" } : { back: "ArrowLeft", forward: "ArrowRight" };
    const from = Number((event.target as HTMLElement).closest("[data-index]")?.getAttribute("data-index") ?? tabStop);
    const last = items.length - 1;
    let to: number;
    if (event.key === keys.forward) to = Math.min(last, from + 1);
    else if (event.key === keys.back) to = Math.max(0, from - 1);
    else if (event.key === "Home") to = 0;
    else if (event.key === "End") to = last;
    else return;
    event.preventDefault();
    choose(to);
    buttons.current[to]?.focus({ preventScroll: true });
  };

  if (!items.length) return null;
  const fade = { "--fade-a": `${edges.before}px`, "--fade-b": `${edges.after}px` } as CSSProperties;
  return (
    <div
      ref={scroller}
      data-slot="thumbnail-strip"
      data-orientation={orientation}
      role="group"
      aria-label={label}
      onScroll={(event) => {
        measure();
        onScroll?.(event);
      }}
      onKeyDown={handleKeyDown}
      style={{ ...fade, ...style }}
      className={cn(
        "flex gap-2 overscroll-contain p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        vertical
          ? "relative w-fit flex-col overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,#000_var(--fade-a),#000_calc(100%-var(--fade-b)),transparent)]"
          : "relative overflow-x-auto [mask-image:linear-gradient(to_right,transparent,#000_var(--fade-a),#000_calc(100%-var(--fade-b)),transparent)]",
        className,
      )}
      {...props}
    >
      {items.map((item, index) => {
        const isSelected = index === selected;
        const video = item.kind === "video";
        const length = video ? clock(item.duration) : undefined;
        return (
          <button
            key={item.id}
            ref={(node) => {
              buttons.current[index] = node;
            }}
            type="button"
            data-index={index}
            aria-label={video ? `${item.alt}, ${videoLabel}${length ? ` ${length}` : ""}` : item.alt}
            aria-current={isSelected ? "true" : undefined}
            tabIndex={index === tabStop ? 0 : -1}
            onClick={() => choose(index)}
            className={cn(
              "relative block shrink-0 rounded-md outline-none transition-[opacity,box-shadow] duration-150 motion-reduce:transition-none",
              // The chosen one is ringed by an outline with a gap, so the gap is whatever is behind the strip: a page, a card or a dark panel. Keyboard focus adds a soft halo outside that ring.
              "focus-visible:shadow-[0_0_0_7px_color-mix(in_oklch,var(--ring)_32%,transparent)]",
              WIDTH[size],
              isSelected ? "opacity-100 outline-2 outline-offset-2 outline-solid outline-foreground" : "opacity-65 hover:opacity-100",
            )}
          >
            <span className="relative block overflow-hidden rounded-md bg-muted" style={{ aspectRatio: ratio }}>
              <Picture src={item.src} />
              {video ? (
                <>
                  <span aria-hidden="true" className="absolute bottom-1 left-1 grid size-5 place-items-center rounded-full bg-background text-foreground shadow-xs">
                    <IconPlay className="size-2.5 translate-x-px fill-current" />
                  </span>
                  {length && size !== "sm" ? (
                    <span aria-hidden="true" className="absolute right-1 bottom-1 rounded bg-foreground px-1 text-[0.6875rem] leading-4 font-medium text-background tabular-nums">
                      {length}
                    </span>
                  ) : null}
                </>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
