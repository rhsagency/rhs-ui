"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconCopy } from "@rhs-ui/icons";
import { breakable, codeChip, codeSize, type InlineCodeSize } from "@rhs-ui/primitives/inline-code/shared";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

type CopyStatus = "idle" | "pending" | "copied" | "manual";

export interface CopyableCodeProps extends Omit<ComponentProps<"button">, "children"> {
  /** What is shown inside the chip. */
  children: ReactNode;
  /** What lands on the clipboard. */
  text: string;
  /** Relative to the surrounding text. */
  size?: InlineCodeSize;
}

const pressCopy = () => `Press ${/mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent) ? "⌘" : "Ctrl"} C`;
const swap = "absolute inset-0 size-full transition-[opacity,scale] duration-150 motion-reduce:transition-none";

/**
 * The button half of `InlineCode copyable`: the chip is one button named
 * "Copy <the code>", a small icon says it can be copied, and a press turns
 * the icon into a check for a moment while the tooltip says "Copied". Where
 * the browser refuses to write to the clipboard the text is selected and the
 * tooltip asks for Ctrl C. Every other prop lands on the button: an id, data-*
 * and aria-* attributes, a title, a style, a ref. Your `onClick` runs first and
 * can cancel the copy with `preventDefault()`; an `aria-label` of yours
 * replaces the default name. Kept in its own client module so plain inline code
 * stays a Server Component.
 */
export function CopyableCode({ children, text, size = "md", className, type = "button", onClick, ...props }: CopyableCodeProps) {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const [hint, setHint] = useState("");
  const [hovered, setHovered] = useState(false);
  const timer = useRef<number>(undefined);
  const code = useRef<HTMLElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const settle = (next: CopyStatus, hold: number) => {
    window.clearTimeout(timer.current);
    setStatus(next);
    timer.current = window.setTimeout(() => setStatus("idle"), hold);
  };

  async function copy() {
    // A press closes a tooltip; being pending keeps it open until it can say how it went.
    window.clearTimeout(timer.current);
    setStatus("pending");
    try {
      await navigator.clipboard.writeText(text);
      settle("copied", 1600);
      return;
    } catch {
      /* Blocked or unavailable: select the text and try the old way before asking for the keys. */
    }
    const node = code.current;
    let copied = false;
    if (node) {
      const range = document.createRange();
      range.selectNodeContents(node);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }
    }
    if (!copied) setHint(pressCopy());
    settle(copied ? "copied" : "manual", copied ? 1600 : 5000);
  }

  const copied = status === "copied";
  const tip = copied ? "Copied" : status === "manual" ? hint : "Copy to clipboard";
  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip open={hovered || status !== "idle"} onOpenChange={setHovered}>
          <TooltipTrigger asChild>
            <button
              data-slot="inline-code"
              data-status={status}
              type={type}
              aria-label={`Copy ${text}`}
              {...props}
              onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) void copy();
              }}
              className={cn(
                codeChip,
                codeSize[size],
                "group/code inline-block max-w-full cursor-pointer text-left align-baseline leading-[1.35] outline-none",
                "transition-[background-color,border-color,box-shadow] duration-150 hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_22%)] hover:bg-secondary",
                "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 active:translate-y-px",
                className,
              )}
            >
              <code ref={code} className="font-[inherit] [font-size:inherit]">
                {breakable(children)}
              </code>
              <span aria-hidden="true" className="relative ml-[0.45em] inline-block size-[0.95em] align-[-0.14em] text-muted-foreground transition-colors duration-150 group-hover/code:text-foreground group-focus-visible/code:text-foreground">
                <IconCopy className={cn(swap, copied ? "scale-75 opacity-0" : "opacity-100")} />
                <IconCheck className={cn(swap, "text-foreground", copied ? "opacity-100" : "scale-75 opacity-0")} />
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent>{tip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <span role="status" className="sr-only">
        {copied ? "Copied" : status === "manual" ? hint : ""}
      </span>
    </>
  );
}
