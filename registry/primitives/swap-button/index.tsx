"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconArrowLeftRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

type Value = string | number | null | undefined;

export interface SwapButtonProps extends Omit<ComponentProps<"button">, "children" | "onClick" | "title" | "aria-label" | "disabled"> {
  /** Called when the button is pressed. Exchange your two values here; `swapValues` does it for a state object. */
  onSwap: () => void;
  /** The name of the first field ("From"), for the button's name and the message after a press. */
  labelA?: string;
  /** The name of the second field ("To"). */
  labelB?: string;
  /** The first field's value now, so the message can say what it became. Leave both values out and the message only says the fields were swapped. */
  valueA?: Value;
  /** The second field's value now. */
  valueB?: Value;
  /** `horizontal` sits between side-by-side fields; `vertical` sits between stacked ones and turns the arrows to point up and down. */
  orientation?: "horizontal" | "vertical";
  /** Always disabled. With both values empty the button disables itself and says why. */
  disabled?: boolean;
  /** 32, 36 or 44px. */
  size?: "sm" | "default" | "lg";
  /**
   * Centre the button on its parent, which must be `relative`, so it sits on the seam between two fields.
   * It reaches (size minus gap) / 2 into each field, so keep that at least 8px less than the field's padding on that axis:
   * with 16px of padding a 20px gap suits the default 36px button (`gap-5`), 16px suits `sm` and 28px suits `lg`;
   * stacked fields padded 12px need 28px for the default size. Then it never touches their text, and its focus ring has room.
   */
  seam?: boolean;
}

const SIZES = { sm: "size-8", default: "size-9", lg: "size-11" } as const;
const empty = (value: Value) => value === null || value === undefined || (typeof value === "string" && value.trim() === "");
const say = (value: Value) => (empty(value) ? "empty" : String(value));

/**
 * The small round button between two related fields: from and to, origin and
 * destination, you send and they receive. The arrows make a half turn when it
 * is pressed (instantly under reduced motion), both values trade places in
 * your state, and a polite message says what changed ("Swapped: From is now
 * Paris, To is now Berlin"). Its name is built from the fields ("Swap From and
 * To"). With both fields empty it disables itself and tells you why, on hover
 * and focus and to a screen reader. With `seam` it centres on the line between
 * two fields; give them a gap wide enough (see `seam`) and it covers neither
 * one's text.
 */
export function SwapButton({ onSwap, labelA, labelB, valueA, valueB, orientation = "horizontal", disabled = false, size = "default", seam = false, className, ...props }: SwapButtonProps) {
  const [turns, setTurns] = useState(0);
  const [message, setMessage] = useState("");
  const timer = useRef<number>(undefined);
  const reasonId = useId();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const vertical = orientation === "vertical";
  const bothEmpty = valueA !== undefined && valueB !== undefined && empty(valueA) && empty(valueB);
  const blocked = disabled || bothEmpty;
  const name = labelA && labelB ? `Swap ${labelA} and ${labelB}` : "Swap values";
  const reason = bothEmpty ? "Nothing to swap yet: both fields are empty." : undefined;

  function press() {
    if (blocked) return;
    onSwap();
    setTurns((count) => count + 1);
    const first = labelA ?? "first";
    const second = labelB ?? "second";
    setMessage(valueA !== undefined && valueB !== undefined ? `Swapped: ${first} is now ${say(valueB)}, ${second} is now ${say(valueA)}` : `Swapped ${labelA && labelB ? `${labelA} and ${labelB}` : "the two values"}`);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(""), 6000);
  }

  // The messages come first and are sr-only, so the button is the last child: a Button Group can then join it.
  return (
    <>
      <span role="status" className="sr-only">
        {message}
      </span>
      {reason ? (
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      ) : null}
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              data-slot="swap-button"
              data-orientation={orientation}
              type="button"
              variant="outline"
              size="icon"
              aria-label={name}
              aria-disabled={bothEmpty || undefined}
              aria-describedby={reason ? reasonId : undefined}
              disabled={disabled}
              onClick={press}
              className={cn(
                "rounded-full bg-background shadow-xs",
                SIZES[size],
                seam && "absolute inset-0 z-10 m-auto",
                bothEmpty && "cursor-not-allowed opacity-50 hover:border-border hover:bg-background active:translate-y-0",
                className,
              )}
              {...props}
            >
              <IconArrowLeftRight
                className="size-4 transition-[rotate] duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none"
                style={{ rotate: `${(vertical ? 90 : 0) + turns * 180}deg` }}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={vertical ? "right" : "top"}>{reason ?? name}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </>
  );
}
