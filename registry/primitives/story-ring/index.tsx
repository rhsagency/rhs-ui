"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight, IconPlus } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { DEFAULT_STORY_LABELS, RING_SIZES, storyLabel, type StoryRingLabels, type StoryRingSize, type StoryState } from "@rhs-ui/primitives/story-ring/states";
import { cn } from "@/lib/utils";

export type { StoryRingLabels, StoryRingSize, StoryState } from "@rhs-ui/primitives/story-ring/states";

export interface StoryRingProps extends Omit<ComponentProps<"button">, "children" | "name"> {
  /** The picture. Without it, or when it cannot load, the initials of `name` stand in. */
  src?: string;
  /** Who it is. It is part of the button's name, together with where their story stands: "Maya, new story". */
  name: string;
  /** `unseen` is a bold solid ring, `seen` a thin muted one, `live` a dashed ring with a "Live" tag, and `none` no ring at all. The picture is the same size in all four, so a row stays level. Default "unseen". */
  state?: StoryState;
  /** 48, 64 or 80px across. Default "md". */
  size?: StoryRingSize;
  /** Called when the ring is pressed, to open the story. */
  onOpen?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Write a name under the ring, inside the button, so the two are one target. */
  showName?: boolean;
  /** What is written under the ring with `showName`. Default the name. */
  caption?: string;
  /** A small mark on the bottom right of the picture, such as the plus of "add to your story". Decoration: the name says what it is for. */
  badge?: ReactNode;
  /** What a screen reader hears, when that should not be built from `name` and `state`: "Add to your story". */
  label?: string;
  /** The words of the ring, for another language. */
  labels?: Partial<StoryRingLabels>;
}

/**
 * A picture with a ring that says whether there is something new: solid and
 * bold when a story is unseen, thin and muted once it was seen, dashed with a
 * small "Live" tag while the person is live, and none when there is no story.
 * The state is never colour alone: weight, dashes and a word carry it, and a
 * screen reader hears it in the button's name ("Maya, new story"). The ring
 * sits apart from the picture by a gap, and the picture is the house Avatar,
 * so a missing image falls back to initials. The whole ring is one button
 * that opens the story with `onOpen`.
 */
export function StoryRing({ src, name, state = "unseen", size = "md", onOpen, onClick, showName = false, caption, badge, label, labels: labelOverrides, className, ...props }: StoryRingProps) {
  const labels: StoryRingLabels = { ...DEFAULT_STORY_LABELS, ...labelOverrides };
  const { outer, stroke, gap } = RING_SIZES[size];
  const thickness = state === "seen" ? 1.5 : stroke;
  const radius = (outer - thickness) / 2;

  return (
    <button
      type="button"
      data-slot="story-ring"
      data-state={state}
      data-size={size}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) onOpen?.(event);
      }}
      className={cn(
        "group/story relative inline-flex shrink-0 flex-col items-center gap-1.5 rounded-xl p-1 outline-none select-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="relative block shrink-0 transition-transform duration-150 group-hover/story:scale-105 group-active/story:scale-95 motion-reduce:transition-none" style={{ width: outer, height: outer }}>
        {state !== "none" ? (
          <svg aria-hidden="true" focusable="false" width={outer} height={outer} viewBox={`0 0 ${outer} ${outer}`} fill="none" className="absolute inset-0 overflow-visible">
            <circle
              cx={outer / 2}
              cy={outer / 2}
              r={radius}
              strokeWidth={thickness}
              pathLength={100}
              strokeDasharray={state === "live" ? "1.5 3.5" : undefined}
              strokeLinecap={state === "live" ? "round" : undefined}
              transform={`rotate(-90 ${outer / 2} ${outer / 2})`}
              className={state === "seen" ? "stroke-foreground/25" : "stroke-foreground"}
            />
          </svg>
        ) : null}
        <span aria-hidden="true" className="absolute block" style={{ inset: stroke + gap }}>
          <Avatar className="size-full data-[size=default]:size-full">
            {src ? <AvatarImage src={src} alt="" /> : null}
            <AvatarFallback className={size === "sm" ? "text-xs" : "text-base"}>{initialsOf(name)}</AvatarFallback>
          </Avatar>
        </span>
        {state === "live" ? (
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 rounded-full bg-foreground px-1.5 py-[3px] text-[0.625rem] leading-none font-semibold tracking-wider text-background uppercase ring-2 ring-background"
          >
            {labels.liveTag}
          </span>
        ) : null}
        {badge ? (
          <span aria-hidden="true" className="absolute right-0 bottom-0">
            {badge}
          </span>
        ) : null}
      </span>
      {showName ? (
        <span aria-hidden="true" className={cn("block truncate text-center text-xs", state === "unseen" || state === "live" ? "font-medium text-foreground" : "text-muted-foreground")} style={{ width: outer + 8 }}>
          {caption ?? name}
        </span>
      ) : null}
      {/* The name is made of this text and nothing else: the picture, its initials, the Live tag and the caption are decoration. */}
      <span className="sr-only">{label ?? storyLabel(name, state, labels)}</span>
    </button>
  );
}

/** One person in a row of stories. */
export interface StoryRingItem {
  /** A stable identity, never the index. */
  id: string;
  /** Who it is. */
  name: string;
  /** Their picture. */
  src?: string;
  /** Where their story stands. Default "unseen". */
  state?: StoryState;
}

/** The viewer's own slot at the start of a row. */
export interface StoryRingYou {
  /** The viewer's name, for the initials when there is no picture. Default "You". */
  name?: string;
  /** The viewer's picture. */
  src?: string;
  /** Where the viewer's own story stands. Default "none", with a plus to add one. */
  state?: StoryState;
  /** Called when the slot is pressed and the viewer has no story yet: open the camera or the composer. */
  onAdd?: () => void;
  /** Called when the slot is pressed and the viewer has a story: open it. */
  onOpen?: () => void;
}

export interface StoryRingRowProps extends Omit<ComponentProps<"div">, "children"> {
  /** The people to show, in order. */
  items: readonly StoryRingItem[];
  /** Called with the person whose ring was pressed. */
  onOpen?: (item: StoryRingItem) => void;
  /** The viewer's own slot at the start, "Your story" with a plus. Leave it out to hide it. */
  you?: StoryRingYou;
  /** The size of every ring. Default "md". */
  size?: StoryRingSize;
  /** The words of the rings and the row, for another language. */
  labels?: Partial<StoryRingLabels>;
}

/** Scroll smoothly, unless the visitor asked for less motion. */
function scrollBehaviour(): ScrollBehavior {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
}

/**
 * A row of story rings that scrolls sideways and snaps ring by ring, with an
 * optional first slot for the viewer ("Your story", with a plus to add one).
 * Touch, a trackpad and the keyboard scroll it as they are (Tab moves from
 * ring to ring and brings each into view); with a mouse, two small arrows
 * appear at the ends that can still be scrolled. It is a list, named
 * "Stories", and every ring is a button with its state in its name.
 */
export function StoryRingRow({ items, onOpen, you, size = "md", labels: labelOverrides, className, ...props }: StoryRingRowProps) {
  const labels: StoryRingLabels = { ...DEFAULT_STORY_LABELS, ...labelOverrides };
  const scroller = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  const { outer } = RING_SIZES[size];

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => setEdges({ start: element.scrollLeft > 1, end: element.scrollLeft + element.clientWidth < element.scrollWidth - 1 });
    update();
    element.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => {
      element.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [items.length, Boolean(you)]);

  const slide = (direction: 1 | -1) => scroller.current?.scrollBy({ left: direction * scroller.current.clientWidth * 0.8, behavior: scrollBehaviour() });
  // The arrows sit level with the middle of the rings.
  const arrow = cn(
    "absolute z-10 hidden rounded-full border-border bg-background shadow-sm transition-opacity duration-150 motion-reduce:transition-none [@media(pointer:fine)]:inline-flex",
  );
  const middle = 8 + 4 + outer / 2 - 16;
  const own = you?.state ?? "none";

  return (
    <div data-slot="story-ring-row" className={cn("relative w-full min-w-0", className)} {...props}>
      <ul ref={scroller} role="list" aria-label={labels.stories} className="relative flex snap-x snap-mandatory scroll-px-3 gap-3 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {you ? (
          <li className="shrink-0 snap-start">
            <StoryRing
              name={you.name ?? "You"}
              caption={labels.you}
              src={you.src}
              state={own}
              size={size}
              showName
              label={own === "none" ? labels.add : labels.you}
              badge={
                <span className="grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">
                  <IconPlus className="size-3" />
                </span>
              }
              onOpen={() => (own === "none" ? you.onAdd?.() : you.onOpen?.())}
            />
          </li>
        ) : null}
        {items.map((item) => (
          <li key={item.id} className="shrink-0 snap-start">
            <StoryRing name={item.name} src={item.src} state={item.state ?? "unseen"} size={size} showName labels={labels} onOpen={() => onOpen?.(item)} />
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="icon-sm" tabIndex={-1} aria-hidden="true" onClick={() => slide(-1)} className={cn(arrow, "left-1", !edges.start && "pointer-events-none opacity-0")} style={{ top: middle }}>
        <IconChevronLeft />
      </Button>
      <Button type="button" variant="outline" size="icon-sm" tabIndex={-1} aria-hidden="true" onClick={() => slide(1)} className={cn(arrow, "right-1", !edges.end && "pointer-events-none opacity-0")} style={{ top: middle }}>
        <IconChevronRight />
      </Button>
    </div>
  );
}
