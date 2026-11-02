"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface ExpandableTextProps extends Omit<ComponentProps<"div">, "children"> {
  /** The text: plain words, with links and emphasis if you like. It is one paragraph, so keep block elements out of it. */
  children: ReactNode;
  /** How many lines show while it is folded. Default 3. */
  lines?: number;
  /** Whether it is open, when you control it. */
  expanded?: boolean;
  /** Whether it starts open, when you do not control it. */
  defaultExpanded?: boolean;
  /** Called with the new state when the toggle is pressed. */
  onExpandedChange?: (expanded: boolean) => void;
  /** The toggle while the text is folded. Default "Show more". */
  moreLabel?: string;
  /** The toggle while the text is open. Default "Show less". */
  lessLabel?: string;
  /** Classes for the paragraph itself, for its size, colour and spacing of lines. The root takes `className`. Its line height must be a real height ("leading-relaxed", not "normal"), or the folded height is a guess. */
  textClassName?: string;
}

/** How long the height takes to move, and a little longer, for the moment the fold has to wait for it. */
const MOVE_MS = 200;
const SETTLE_MS = MOVE_MS + 40;

/**
 * Long text folded to a few lines, with a toggle that is there only when
 * something is actually hidden. The text is measured, not guessed: a resize
 * observer compares its full height with the height of `lines` lines, again
 * whenever the width changes, the text changes or a web font arrives, so a
 * short text never shows a pointless "Show more" and a wide screen never keeps
 * one it does not need. The whole text is always in the page, folded only by
 * CSS, so search, translation and screen readers have all of it; the toggle
 * says `aria-expanded` and points at the text with `aria-controls`. Opening
 * and closing move the height rather than snapping it (the ellipsis waits for
 * the fold to finish), and under reduced motion they snap. Until it has been
 * measured (on the server) the text is already folded by CSS, so the text
 * itself never jumps. In a browser render the first measure runs before the
 * first paint, so the toggle is there from the start; in server-rendered HTML
 * it appears once the page is live, and what is below it moves down by the
 * height of the toggle then.
 */
export function ExpandableText({ children, lines = 3, expanded, defaultExpanded = false, onExpandedChange, moreLabel = "Show more", lessLabel = "Show less", textClassName, className, style, ...props }: ExpandableTextProps) {
  const id = useId();
  const text = useRef<HTMLParagraphElement>(null);
  const [own, setOwn] = useState(defaultExpanded);
  const open = expanded ?? own;
  // The height of the whole text and of `lines` lines, measured in the browser; null until then.
  const [size, setSize] = useState<{ full: number; folded: number } | null>(null);
  // True while the height is moving: the ellipsis (a line clamp) is switched off for that time, since a clamp cannot be animated.
  const [moving, setMoving] = useState(false);
  const [seen, setSeen] = useState(open);

  // The state changed, by the toggle or from outside: the height moves, unless the reader asked for less motion.
  if (open !== seen) {
    setSeen(open);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setMoving(true);
  }
  useEffect(() => {
    if (!moving) return;
    const timer = window.setTimeout(() => setMoving(false), SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [moving]);

  const measure = useCallback(() => {
    const element = text.current;
    if (!element) return;
    const computed = getComputedStyle(element);
    // "normal" is not a length: a line is then about 1.2 times the font size.
    const lineHeight = Number.parseFloat(computed.lineHeight) || Number.parseFloat(computed.fontSize) * 1.2;
    if (Number.isNaN(lineHeight)) return;
    const folded = Math.round(lineHeight * lines * 100) / 100;
    const full = element.scrollHeight;
    setSize((previous) => (previous && previous.full === full && previous.folded === folded ? previous : { full, folded }));
  }, [lines]);

  // The text itself may have changed; the observer below only hears about a change in its box. This first measure runs before the browser paints,
  // so a client render never shows the text without the toggle and then pushes what is below it down by a line.
  useLayoutEffect(measure, [measure, children]);
  useEffect(() => {
    const element = text.current;
    if (!element) return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    const fonts = document.fonts;
    void fonts?.ready.then(measure);
    fonts?.addEventListener("loadingdone", measure);
    return () => {
      observer.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
    };
  }, [measure]);

  const cut = size !== null && size.full > size.folded + 1;
  const height = size && cut ? (open ? size.full : size.folded) : undefined;

  function toggle() {
    if (expanded === undefined) setOwn(!open);
    onExpandedChange?.(!open);
  }

  return (
    <div data-slot="expandable-text" data-state={open ? "expanded" : "folded"} className={cn("grid justify-items-start gap-1.5", className)} style={style} {...props}>
      <p
        ref={text}
        id={id}
        style={{ "--lines": lines, maxHeight: height } as CSSProperties}
        // The clamp draws the ellipsis, and only while the text sits folded and still; while it moves, the max-height does the folding.
        className={cn("w-full overflow-hidden text-sm leading-relaxed text-pretty transition-[max-height] duration-200 ease-out motion-reduce:transition-none", !open && !moving && "line-clamp-(--lines)", textClassName)}
      >
        {children}
      </p>
      {cut ? (
        <Button type="button" variant="link" size="sm" aria-expanded={open} aria-controls={id} onClick={toggle} className="h-auto gap-1 rounded-sm px-0 py-0.5 text-[0.8125rem] font-medium text-foreground">
          {open ? lessLabel : moreLabel}
          <IconChevronDown aria-hidden="true" className={cn("size-3.5 transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} />
        </Button>
      ) : null}
    </div>
  );
}
