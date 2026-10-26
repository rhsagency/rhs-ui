"use client";

import { useRef, useState, type ReactNode } from "react";

import { IconInfo } from "@rhs-ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

/**
 * What changes on a card with a solid fill. The card is `bg-primary`, so a ring
 * in the ring colour and a bubble in the foreground colour are the colour of
 * the card itself: nothing shows on focus and the bubble melts into it. Here
 * the ring is the card's own text colour and the bubble is the opposite of the
 * card, with a hairline so its edge still reads where it leaves the card.
 */
const INVERTED = {
  button: "focus-visible:ring-primary-foreground/60",
  bubble: "bg-background text-foreground ring-1 ring-border [&_svg]:bg-background [&_svg]:fill-background",
} as const;

/**
 * The tooltip half of `CheckList`: a small info button after a line that says
 * more when you ask. Radix opens a tooltip on hover and on keyboard focus only,
 * and closes it on every click, so on a touch screen the words would never
 * show. Here a press toggles it, and hover and focus work as they do in every
 * tooltip. On an inverted list the focus ring and the bubble swap colours, so
 * both still show on a solid card. Kept in its own client module so a plain
 * list stays a Server Component.
 */
export function InfoTip({ label, tone = "default", className, children }: { label: string; tone?: "default" | "muted" | "inverted"; className?: string; children: ReactNode }) {
  const inverted = tone === "inverted";
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
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
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
            className={cn(
              "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors duration-150",
              "hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
              inverted && INVERTED.button,
              className,
            )}
          >
            <IconInfo className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className={inverted ? INVERTED.bubble : undefined}>{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
