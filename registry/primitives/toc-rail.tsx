"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties } from "react";

import { IconList } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface TocRailItem {
  /** The id of the heading on the page. */
  id: string;
  /** The heading's text, shown when the rail opens. */
  title: string;
  /** 1 for a chapter, 2 for a section, 3 for a subsection: it sets the length of the mark and the indent of the title. Default 2. */
  level?: 1 | 2 | 3;
}

/** The words of the button for touch screens, for another language or your own wording. */
export interface TocRailLabels {
  /** Default "Show contents". */
  show: string;
  /** Default "Hide contents". */
  hide: string;
}

export interface TocRailProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The headings, in the order they appear on the page. */
  items: readonly TocRailItem[];
  /** The heading to mark as current, when you track it yourself. Leave it out and the rail follows the scroll. */
  activeId?: string;
  /** The room, in px, taken by a fixed header: the rail sticks this far from the top, and a heading counts as reached when it passes this line. Default 96. */
  offset?: number;
  /** The edge of the page it belongs to: marks sit against it and the titles open towards the article. Default "right". */
  side?: "left" | "right";
  /** The name of the navigation landmark. Default "Contents". */
  title?: string;
  /** Whether the rail is held open, when you control it. The button for touch toggles it. */
  open?: boolean;
  /** Whether it starts held open, when you do not control it. */
  defaultOpen?: boolean;
  /** Called when the button, or choosing a heading, opens or closes it. */
  onOpenChange?: (open: boolean) => void;
  /** The words of the button for touch screens. */
  labels?: Partial<TocRailLabels>;
}

const WORDS: TocRailLabels = { show: "Show contents", hide: "Hide contents" };

/** The length of a mark by level: the higher the heading, the longer the line. */
const MARK = { 1: "w-6", 2: "w-4", 3: "w-3" } as const;

/** Waiting this long after the pointer leaves keeps the rail from closing on a slip. */
const LEAVE_MS = 160;

/**
 * A quiet table of contents for long articles. At rest it is a rail of short horizontal marks in the gutter
 * at the edge of the page, one per heading, longer for the higher levels, with the current section dark. Hover
 * the rail, or Tab into it, and it opens into the headings, with the current one marked. It is a nav with a
 * list of links, so it works with Tab and keeps `aria-current="location"`; for touch screens a small button
 * (shown only where the pointer is a finger) holds it open. The width grows over the gutter, never over the
 * article, so the gutter needs about 16rem free beside the text; below the `lg` breakpoint the rail is
 * hidden, because a contents control at the top of the article does that job on a phone. It follows the
 * scroll by itself, or takes `activeId`. Give the headings `scroll-margin-top` equal to `offset` so a
 * chosen heading lands in view below your fixed header.
 */
export function TocRail({ items, activeId, offset = 96, side = "right", title = "Contents", open, defaultOpen = false, onOpenChange, labels, className, style, ...props }: TocRailProps) {
  const uid = useId();
  const words = { ...WORDS, ...labels };
  const [tracked, setTracked] = useState(items[0]?.id ?? "");
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [hover, setHover] = useState(false);
  const [within, setWithin] = useState(false);
  const leaving = useRef<number | undefined>(undefined);
  const held = open ?? ownOpen;
  const expanded = held || hover || within;
  const current = activeId ?? tracked;
  const ids = items.map((item) => item.id).join("\u0000");

  const setHeld = (next: boolean) => {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  // With no `activeId` the current heading is the last one that has passed the line below the fixed header.
  useEffect(() => {
    if (activeId !== undefined || !ids) return;
    const list = ids.split("\u0000");
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = offset + 24;
      let found = list[0] ?? "";
      for (const id of list) {
        const heading = document.getElementById(id);
        if (!heading) continue;
        if (heading.getBoundingClientRect().top <= line) found = id;
        else break;
      }
      // A last section too short to ever reach the line is current once the page ends.
      if (window.scrollY > 0 && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) found = list[list.length - 1] ?? found;
      setTracked(found);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [activeId, ids, offset]);

  useEffect(() => () => window.clearTimeout(leaving.current), []);

  const right = side === "right";
  return (
    <nav
      data-slot="toc-rail"
      data-side={side}
      data-expanded={expanded ? "" : undefined}
      aria-label={title}
      style={{ top: offset, "--toc-top": `${offset}px`, ...style } as CSSProperties}
      // A finger has no hover: only a mouse opens the rail by pointing at it.
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(leaving.current);
        setHover(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "mouse") return;
        window.clearTimeout(leaving.current);
        leaving.current = window.setTimeout(() => setHover(false), LEAVE_MS);
      }}
      // Only the keyboard counts as being inside: a mouse click leaves focus on a link, and the rail must not stay open for it.
      onFocus={(event) => {
        if (event.target instanceof HTMLElement && event.target.matches(":focus-visible")) setWithin(true);
      }}
      onBlur={(event) => {
        if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) setWithin(false);
      }}
      className={cn("group/toc-rail sticky z-20 flex w-10 shrink-0 self-start max-lg:hidden", right ? "ml-auto justify-end" : "mr-auto justify-start", className)}
      {...props}
    >
      <div
        className={cn(
          "flex w-10 shrink-0 flex-col overflow-hidden rounded-xl border border-transparent py-1.5 transition-[width,background-color,border-color,box-shadow] duration-200 ease-out motion-reduce:transition-none",
          "group-data-[expanded]/toc-rail:w-60 group-data-[expanded]/toc-rail:border-border group-data-[expanded]/toc-rail:bg-popover group-data-[expanded]/toc-rail:shadow-sm",
        )}
      >
        {/* Only where the pointer is a finger is the button drawn; a mouse and a keyboard have the rail itself. It stays reachable, and shows on focus. */}
        <span className={cn("sr-only pointer-coarse:not-sr-only focus-within:not-sr-only", right ? "self-end" : "self-start")}>
          <button
            type="button"
            aria-expanded={held}
            aria-controls={`${uid}-list`}
            onClick={() => setHeld(!held)}
            className="mx-1.5 mb-1 grid size-7 place-items-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
          >
            <IconList size={16} />
            <span className="sr-only">{held ? words.hide : words.show}</span>
          </button>
        </span>
        <ol id={`${uid}-list`} className="relative m-0 flex max-h-[calc(100dvh-var(--toc-top)-1.5rem)] list-none flex-col overflow-y-auto p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const level = item.level ?? 2;
            const here = item.id === current;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={here ? "location" : undefined}
                  onClick={() => {
                    setTracked(item.id);
                    // Choosing a heading ends what a tap on the button started.
                    if (held) setHeld(false);
                  }}
                  className={cn(
                    // At rest the marks are packed against the page edge and the row has no gap, so a mark keeps its whole length inside the rail; the gap and the room on the title's side come with the width. The side the marks sit on keeps the same padding in both states, so they do not move when the rail opens.
                    "group/toc-row flex h-7 items-center justify-end gap-0 rounded-md px-2 text-sm outline-none group-data-[expanded]/toc-rail:gap-3 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
                    right ? "flex-row group-data-[expanded]/toc-rail:pl-3" : "flex-row-reverse group-data-[expanded]/toc-rail:pr-3",
                  )}
                >
                  <span
                    className={cn(
                      // The title takes no room at rest, so an indent on it cannot push a mark out of the rail. The titles wait for the width, so they never show cut off while it grows; they leave at once when it closes.
                      "w-0 min-w-0 flex-none truncate opacity-0 [transition:opacity_90ms,color_150ms] group-data-[expanded]/toc-rail:w-auto group-data-[expanded]/toc-rail:flex-1 group-data-[expanded]/toc-rail:opacity-100 group-data-[expanded]/toc-rail:[transition:opacity_150ms_90ms,color_150ms] motion-reduce:transition-none motion-reduce:group-data-[expanded]/toc-rail:transition-none",
                      right && "text-right",
                      level === 3 && (right ? "group-data-[expanded]/toc-rail:pr-3" : "group-data-[expanded]/toc-rail:pl-3"),
                      here ? "font-medium text-foreground" : "text-muted-foreground group-hover/toc-row:text-foreground group-focus-visible/toc-row:text-foreground",
                    )}
                  >
                    {item.title}
                  </span>
                  <span aria-hidden="true" className={cn("h-0.5 shrink-0 rounded-full transition-colors duration-150 motion-reduce:transition-none", MARK[level], here ? "bg-foreground" : "bg-muted-foreground/60 group-hover/toc-row:bg-foreground/70")} />
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
