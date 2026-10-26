"use client";

import { useRef, useState, type ReactElement, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";

/** True when the start of the text is wider than its box, or the ending is: something is cut off. */
function isCut(root: HTMLElement | null): boolean {
  if (!root) return false;
  return Array.from(root.querySelectorAll<HTMLElement>("[data-part]")).some((part) => part.scrollWidth > part.clientWidth + 0.5);
}

/**
 * The tooltip half of `MiddleTruncate`: the whole text behind the cut one.
 * Radix opens a tooltip on hover and on keyboard focus only, and closes it on
 * every click, so on a touch screen the text would never show. Here a press
 * toggles it, and hover and focus work as they do in every tooltip. It opens
 * only when the text really is cut off, which it checks when you ask, never
 * while it lays out. Kept in its own client module so the text stays a Server
 * Component.
 */
export function TruncateTip({ content, focusable, children }: { content: ReactNode; focusable: boolean; children: ReactElement }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  const pressing = useRef(false);
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip
        open={open}
        onOpenChange={(next) => {
          // The trigger closes its own tooltip on every click; while a press is toggling it, that close is not wanted.
          if (!next && pressing.current) return;
          setOpen(next && isCut(root.current));
        }}
      >
        <TooltipTrigger
          asChild
          ref={root}
          tabIndex={focusable ? 0 : undefined}
          // The text is already the name; the tooltip repeating it as a description would be read twice.
          aria-describedby={undefined}
          // A press closes an open tooltip before its click arrives, so the click has to know how it started.
          onPointerDown={() => {
            wasOpen.current = open;
          }}
          onClick={() => {
            pressing.current = true;
            setOpen(!wasOpen.current && isCut(root.current));
            queueMicrotask(() => {
              pressing.current = false;
            });
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent className="[overflow-wrap:anywhere]">{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
