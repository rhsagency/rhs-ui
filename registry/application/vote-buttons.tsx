"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import { AnimatedNumber } from "@rhs-ui/application/animated-number";
import { IconAlertCircle, IconArrowDown, IconArrowUp } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverAnchor, PopoverContent } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

/** What the signed-in person has voted: nothing, up or down. */
export type Vote = "none" | "up" | "down";

export interface VoteButtonsProps extends Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue"> {
  /** The signed-in person's vote. Controlled: update it, and `score`, in `onVote` before it resolves. */
  value?: Vote;
  /** Where an uncontrolled control starts. Default "none". */
  defaultValue?: Vote;
  /** The score, with this person's vote already in it when `value` is set. It moves by the right amount while a vote is on its way. */
  score: number;
  /**
   * Called with the next vote. Pressing the arrow that is already chosen clears the vote ("none"). The score moves
   * at once; if this rejects, the vote and the score are restored and a short line says so.
   */
  onVote?: (next: Vote) => void | Promise<void>;
  /** Arrows stacked around the score, or in a row. Default "vertical". */
  orientation?: "vertical" | "horizontal";
  /** Show the down arrow. Off, it is a single arrow with a count. Default true. */
  allowDownvote?: boolean;
  /** What is being voted on, for the names: "answer" gives "Upvote this answer". Default "post". */
  subject?: string;
  /** 28, 32 or 40px arrows. A touch screen gets a 44px target at every size. Default "default". */
  size?: "sm" | "default" | "lg";
  /** Disables both arrows. */
  disabled?: boolean;
  /** Language of the score. Default "en-US". */
  locale?: string;
}

const WEIGHT: Record<Vote, number> = { none: 0, up: 1, down: -1 };
const WHOLE = { maximumFractionDigits: 0 } as const;
const SHORT = { notation: "compact", maximumFractionDigits: 1 } as const;

const SIZES = {
  sm: { arrow: "size-7 [&_svg:not([class*='size-'])]:size-3.5", score: "text-[0.8125rem]", single: "min-w-6" },
  default: { arrow: "size-8 [&_svg:not([class*='size-'])]:size-4", score: "text-sm", single: "min-w-7" },
  lg: { arrow: "size-10 [&_svg:not([class*='size-'])]:size-5", score: "text-base", single: "min-w-8" },
} as const;

// On a touch screen the target grows to 44px without changing the drawing.
const TOUCH =
  "relative [@media(pointer:coarse)]:after:absolute [@media(pointer:coarse)]:after:top-1/2 [@media(pointer:coarse)]:after:left-1/2 [@media(pointer:coarse)]:after:size-11 [@media(pointer:coarse)]:after:-translate-x-1/2 [@media(pointer:coarse)]:after:-translate-y-1/2 [@media(pointer:coarse)]:after:content-['']";

/** Under a thousand the score rolls; above it the abbreviation just arrives. */
function Score({ value, locale }: { value: number; locale: string }) {
  if (Math.abs(value) < 1000) return <AnimatedNumber value={value} locale={locale} format={WHOLE} duration={0.4} />;
  const text = new Intl.NumberFormat(locale, SHORT).format(value);
  return (
    <span key={text} className="inline-block tabular-nums transition-[opacity,translate] duration-200 starting:translate-y-1 starting:opacity-0 motion-reduce:transition-none">
      {text}
    </span>
  );
}

/**
 * Up and down arrows around a score, for answers, comments and feature
 * requests: one vote each, changeable, never colour only. The chosen arrow
 * fills in solid and is `aria-pressed`; pressing it again clears the vote, and
 * moving from down to up changes the score by two. It answers at once and
 * settles afterwards: if the request fails the score and the vote are put back
 * and a short message appears beside the control (to the right of a vertical
 * one, to the left of a row, whichever side has room), so it never lands on the
 * line between two answers. Each arrow is named for what is voted on ("Upvote
 * this answer") and a polite region says "Score 41" whenever the score moves.
 * With `allowDownvote` off it is a single arrow with a count.
 */
export function VoteButtons({
  value,
  defaultValue = "none",
  score,
  onVote,
  orientation = "vertical",
  allowDownvote = true,
  subject = "post",
  size = "default",
  disabled = false,
  locale = "en-US",
  className,
  ...props
}: VoteButtonsProps) {
  const [own, setOwn] = useState<Vote>(defaultValue);
  const [optimistic, setOptimistic] = useState<Vote | null>(null);
  const [error, setError] = useState<string | null>(null);
  // The words in the bubble stay while it fades out, after `error` has already cleared.
  const [bubble, setBubble] = useState("");
  // What a screen reader was told about a failure. It stays until the next vote, so the bubble going away does not read the score out again.
  const [spoken, setSpoken] = useState("");
  const pending = useRef(false);

  const settled = value ?? own;
  const shown = optimistic ?? settled;
  const busy = optimistic !== null;
  const vertical = orientation === "vertical";
  const look = SIZES[size];

  // The score was written for the vote the control starts in; every other vote moves it by the difference.
  const reference = value !== undefined ? settled : defaultValue;
  const scoreFor = (vote: Vote) => score + WEIGHT[vote] - WEIGHT[reference];
  const shownScore = scoreFor(shown);
  const numbers = new Intl.NumberFormat(locale);

  // The bubble goes away by itself; the polite region has already said it.
  useEffect(() => {
    if (!error) return;
    const timer = window.setTimeout(() => setError(null), 6000);
    return () => window.clearTimeout(timer);
  }, [error]);

  async function press(direction: "up" | "down"): Promise<void> {
    if (pending.current || disabled) return;
    const from = shown;
    const next: Vote = from === direction ? "none" : direction;
    pending.current = true;
    setError(null);
    setSpoken("");
    setOptimistic(next);
    try {
      await onVote?.(next);
      if (value === undefined) setOwn(next);
    } catch {
      const message = next === "none" ? "Could not remove your vote. Try again." : "Could not save your vote. Try again.";
      setError(message);
      setBubble(message);
      setSpoken(message);
    } finally {
      pending.current = false;
      setOptimistic(null);
    }
  }

  function arrow(direction: "up" | "down") {
    const chosen = shown === direction;
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`${direction === "up" ? "Upvote" : "Downvote"} this ${subject}`}
        aria-pressed={chosen}
        aria-busy={busy || undefined}
        disabled={disabled}
        data-chosen={chosen}
        onClick={() => void press(direction)}
        className={cn(
          TOUCH,
          look.arrow,
          "rounded-lg text-muted-foreground hover:text-foreground",
          "data-[chosen=true]:bg-primary data-[chosen=true]:text-primary-foreground data-[chosen=true]:hover:bg-primary/90 data-[chosen=true]:hover:text-primary-foreground data-[chosen=true]:[&_svg]:stroke-[2.25]",
        )}
      >
        {direction === "up" ? <IconArrowUp /> : <IconArrowDown />}
      </Button>
    );
  }

  return (
    <div data-slot="vote-buttons" role="group" aria-label={`Vote on this ${subject}`} data-orientation={orientation} className={cn("relative inline-flex max-w-full", className)} {...props}>
      <Popover
        open={error !== null}
        onOpenChange={(open) => {
          if (!open) setError(null);
        }}
      >
        <PopoverAnchor asChild>
          <div
            className={cn(
              "inline-flex items-center rounded-xl border border-border bg-card p-0.5 shadow-xs",
              vertical ? "flex-col gap-0.5" : "gap-0.5",
              !allowDownvote && (vertical ? "pb-1" : "pr-2.5"),
            )}
          >
            {arrow("up")}
            <span aria-hidden="true" className={cn("text-center font-semibold tabular-nums", look.score, allowDownvote ? "min-w-8 px-1" : look.single)}>
              <Score value={shownScore} locale={locale} />
            </span>
            {allowDownvote ? arrow("down") : null}
          </div>
        </PopoverAnchor>
        {/* A failed vote says so beside the control, on the side that has room (above and below are other rows), so it never lands on a divider or on the next vote. It is for the eyes: the polite region below has said it. */}
        <PopoverContent
          side={vertical ? "right" : "left"}
          align="center"
          sideOffset={8}
          collisionPadding={{ top: 8, right: 40, bottom: 8, left: 40 }}
          aria-hidden="true"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          className="pointer-events-none flex w-max max-w-[min(16rem,var(--radix-popover-content-available-width))] items-start gap-1.5 rounded-md border-destructive/30 px-2.5 py-1.5 text-xs leading-snug text-destructive shadow-sm motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none"
        >
          <IconAlertCircle className="mt-px size-3.5 shrink-0" />
          <span className="text-balance">{bubble}</span>
        </PopoverContent>
      </Popover>
      {/* One polite region for a screen reader: "Score 42" whenever the score moves, and when a vote did not save, why and what the score is again. */}
      <span role="status" className="sr-only">
        Score {numbers.format(shownScore)}
        {spoken ? `. ${spoken}` : null}
      </span>
    </div>
  );
}
