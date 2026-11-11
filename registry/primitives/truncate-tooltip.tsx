"use client";

import { useCallback, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/** The elements the text can be: a heading level, a paragraph, or inline text. */
export type TruncateTooltipTag = "span" | "div" | "p" | "strong" | "code" | "h2" | "h3" | "h4";

export interface TruncateTooltipProps extends Omit<ComponentProps<"span">, "children" | "title"> {
  /** The text. It stays whole in the page, only the painting is cut, so a screen reader and a copy get all of it. */
  children: ReactNode;
  /** How many lines the text may take before it ends in an ellipsis. Default 1. */
  lines?: number;
  /** The side of the text the tooltip opens on. Default "top". */
  side?: "top" | "right" | "bottom" | "left";
  /** The element to render: `span` (default), `div`, `p`, `strong`, `code` or a heading level. */
  as?: TruncateTooltipTag;
}

/** More than a pixel of overflow: text that exactly fits can report one pixel too many when the box has a fractional width. */
const SLACK = 1;

/**
 * Text that ends in an ellipsis, with the whole text in a tooltip, but only
 * when it really is cut off. It measures the element after layout and again
 * whenever the box or the font changes, and only a cut-off text gets the tooltip
 * and a tab stop, so text that fits carries no extra behaviour and a table of
 * names does not add a tab stop to every row. The tooltip opens on hover and on
 * keyboard focus, and on a touch screen a tap toggles it (Radix closes a tooltip
 * on every press). The text is never shortened in the DOM, only painted that way,
 * so a screen reader reads all of it and copying the selection gives all of it.
 * Give it a width to work in: a table cell with a fixed layout, a flex child with
 * `min-w-0`, or a box with a maximum width.
 */
export function TruncateTooltip({ children, lines = 1, side = "top", as: tag = "span", className, style, ref: forwardedRef, ...props }: TruncateTooltipProps) {
  const Tag = tag as "span";
  const clamp = Math.max(1, Math.floor(lines));
  const node = useRef<HTMLSpanElement | null>(null);
  const [cut, setCut] = useState(false);
  const [open, setOpen] = useState(false);
  /** Whether the tooltip was open when the press began: Radix closes it on pointer down, and the click then has to know. */
  const wasOpen = useRef(false);
  const pressing = useRef(false);

  const setNode = useCallback(
    (element: HTMLSpanElement | null) => {
      node.current = element;
      if (typeof forwardedRef === "function") forwardedRef(element);
      else if (forwardedRef) forwardedRef.current = element;
    },
    [forwardedRef],
  );

  const measure = useCallback(() => {
    const element = node.current;
    if (!element) return;
    setCut(clamp > 1 ? element.scrollHeight - element.clientHeight > SLACK : element.scrollWidth - element.clientWidth > SLACK);
  }, [clamp]);

  // Plain text is measured again when it changes; other content is caught by the observer when its box moves.
  const text = typeof children === "string" || typeof children === "number" ? children : null;
  useEffect(() => {
    const element = node.current;
    if (!element) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    // A web font arriving changes the width of the text without changing the box.
    const fonts = document.fonts;
    let alive = true;
    void fonts?.ready.then(() => {
      if (alive) measure();
    });
    fonts?.addEventListener("loadingdone", measure);
    return () => {
      alive = false;
      observer.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
    };
  }, [measure, text]);

  // Text that stops being cut off takes its tooltip with it.
  useEffect(() => {
    if (!cut) setOpen(false);
  }, [cut]);

  const clampStyle: CSSProperties | undefined = clamp > 1 ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: clamp } : undefined;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip
        open={cut && open}
        onOpenChange={(next) => {
          // The trigger closes its own tooltip on every press; while a press is toggling it, that close is not wanted.
          if (!next && pressing.current) return;
          setOpen(next && cut);
        }}
      >
        <TooltipTrigger
          asChild
          // The text is already what a screen reader reads; the tooltip repeating it as a description would be read twice.
          aria-describedby={undefined}
          onPointerDown={() => {
            wasOpen.current = open;
          }}
          onClick={() => {
            if (!cut) return;
            pressing.current = true;
            setOpen(!wasOpen.current);
            queueMicrotask(() => {
              pressing.current = false;
            });
          }}
        >
          <Tag
            ref={setNode}
            data-slot="truncate-tooltip"
            data-truncated={cut || undefined}
            tabIndex={cut ? 0 : undefined}
            style={{ ...clampStyle, ...style }}
            className={cn(
              "block max-w-full min-w-0",
              clamp > 1 ? "overflow-hidden [overflow-wrap:anywhere]" : "truncate",
              "rounded-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
              className,
            )}
            {...props}
          >
            {children}
          </Tag>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm leading-snug [overflow-wrap:anywhere]">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
