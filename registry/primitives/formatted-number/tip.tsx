"use client";

import { useRef, useState, type ReactElement, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";

/**
 * The tooltip half of `FormattedNumber`: the full figure behind a compact one.
 * Radix opens a tooltip on hover and on keyboard focus only, and closes it on
 * every click, so on a touch screen the full number would never show. Here a
 * press toggles it, and hover and focus work as they do in every tooltip. Kept
 * in its own client module so a plain number stays a Server Component.
 */
export function NumberTip({ content, focusable, children }: { content: ReactNode; focusable: boolean; children: ReactElement }) {
  const [open, setOpen] = useState(false);
  const wasOpen = useRef(false);
  const pressing = useRef(false);
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip
        open={open}
        onOpenChange={(next) => {
          // The trigger closes its own tooltip on every click; while a press is toggling it, that close is not wanted.
          if (!next && pressing.current) return;
          setOpen(next);
        }}
      >
        <TooltipTrigger
          asChild
          tabIndex={focusable ? 0 : undefined}
          // iOS Safari only sends a click to an element it takes for clickable, and a pointer cursor says so. Touch only: a mouse keeps its arrow.
          className="[@media(hover:none)]:cursor-pointer"
          // A press closes an open tooltip before its click arrives, so the click has to know how it started.
          onPointerDown={() => {
            wasOpen.current = open;
          }}
          onClick={() => {
            pressing.current = true;
            setOpen(!wasOpen.current);
            queueMicrotask(() => {
              pressing.current = false;
            });
          }}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent>{content}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
