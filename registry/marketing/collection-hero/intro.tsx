"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CollectionIntroProps {
  /** The intro text. */
  text: string;
  /** The toggle's text while the intro is cut short. */
  moreLabel: string;
  /** The toggle's text while the intro is open. */
  lessLabel: string;
  className?: string;
}

/** A text longer than this is taken to be cut until it has been measured, so the server can draw the toggle and nothing moves when the script arrives. */
const LONG = 200;

/**
 * The collection's intro clamped to three lines. The toggle is a real button
 * with aria-expanded and aria-controls, and it appears only when the text is
 * really cut at the current width: a short intro never shows a button that
 * does nothing, and a width that makes a long one fit takes the button away.
 * The text is measured before the first paint and again whenever its box
 * changes, the window is resized or a web font arrives: a clamped box keeps
 * its size when the font swaps and the text reflows onto another line, so the
 * resize observer alone never hears of it.
 */
export function CollectionIntro({ text, moreLabel, lessLabel, className }: CollectionIntroProps) {
  const id = useId();
  const paragraph = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [cut, setCut] = useState(text.length > LONG);

  useLayoutEffect(() => {
    const node = paragraph.current;
    if (!node) return;
    let live = true;
    // An open intro is not cut, so there is nothing to measure; the toggle stays to close it again.
    const measure = () => {
      if (live && !expanded) setCut(node.scrollHeight > node.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    // The first measure may have used the fallback font. Measure again once the real one is in, now and whenever another one finishes loading.
    const fonts = document.fonts;
    void fonts?.ready.then(measure);
    fonts?.addEventListener("loadingdone", measure);
    window.addEventListener("resize", measure);
    return () => {
      live = false;
      observer.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
      window.removeEventListener("resize", measure);
    };
  }, [text, expanded]);

  return (
    <div data-slot="collection-hero-intro" className={className}>
      <p id={id} ref={paragraph} className={cn("max-w-prose text-base leading-relaxed text-pretty text-muted-foreground", !expanded && "line-clamp-3")}>
        {text}
      </p>
      {cut || expanded ? (
        <Button type="button" variant="link" size="sm" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded((open) => !open)} className="mt-1 h-auto gap-1 px-0 py-1 font-medium">
          {expanded ? lessLabel : moreLabel}
          <IconChevronDown className={cn("transition-transform duration-200 motion-reduce:transition-none", expanded && "rotate-180")} />
        </Button>
      ) : null}
    </div>
  );
}
