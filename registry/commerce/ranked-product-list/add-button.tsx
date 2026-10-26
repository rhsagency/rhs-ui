"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconCheck, IconPlus, IconRefresh, IconSpinner } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface RankedAddButtonProps {
  /** The button's words at rest. */
  label: string;
  /** The word while it works. */
  busyLabel: string;
  /** The word once the product is in the bag. */
  addedLabel: string;
  /** The word for a moment after an add that failed: the button then tries again when it is pressed. */
  retryLabel: string;
  /** The word on a product that cannot be bought. */
  soldOutLabel: string;
  /** What a screen reader hears at rest. For a product that cannot be bought it says so, with the visible words in it. */
  name: string;
  /** What a screen reader hears once the product is in the bag. */
  addedName: string;
  /** What a screen reader hears, and the polite message, after an add that failed. */
  failedName: string;
  /** True for a product that cannot be bought: the button is off and says so. */
  soldOut?: boolean;
  /** Called when the button is pressed. Return a promise and the button shows it is working; reject and it says "Try again" for a few seconds. */
  onAdd?: () => void | Promise<void>;
  /** Extra classes for the button. */
  className?: string;
}

type AddState = "idle" | "busy" | "added" | "failed";
type Shown = AddState | "soldOut";

/** Every word the button can show. Each one is also drawn, unseen, in the same place, so the button keeps one width whatever it says. */
const SHOWN = ["idle", "busy", "added", "failed", "soldOut"] as const satisfies readonly Shown[];

/**
 * The Add button of one row: it shows when it is working (the label changes and a spinner turns), says Added with a
 * check for a moment and then goes back to rest. When the add fails it says "Try again" for a few seconds and a
 * polite message tells a screen reader. A press while it works is ignored without losing the keyboard's focus, which
 * a disabled button would drop. A product that cannot be bought gets a button that is off and says so. The button is
 * as wide as its longest word, in every state, so the columns of the row never move when it changes.
 */
export function RankedAddButton({ label, busyLabel, addedLabel, retryLabel, soldOutLabel, name, addedName, failedName, soldOut = false, onAdd, className }: RankedAddButtonProps) {
  const [state, setState] = useState<AddState>("idle");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function press() {
    if (state === "busy" || state === "added" || soldOut) return;
    window.clearTimeout(timer.current);
    setState("busy");
    try {
      await onAdd?.();
      setState("added");
      timer.current = window.setTimeout(() => setState("idle"), 1800);
    } catch {
      setState("failed");
      timer.current = window.setTimeout(() => setState("idle"), 3000);
    }
  }

  const busy = state === "busy";
  const added = state === "added";
  const failed = state === "failed";
  const shown: Shown = soldOut ? "soldOut" : state;
  const words: Record<Shown, string> = { idle: label, busy: busyLabel, added: addedLabel, failed: retryLabel, soldOut: soldOutLabel };
  const glyphs: Record<Shown, ReactNode> = { idle: <IconPlus />, busy: <IconSpinner />, added: <IconCheck />, failed: <IconRefresh />, soldOut: null };

  return (
    <>
      <Button
        type="button"
        variant={added ? "secondary" : "outline"}
        size="sm"
        disabled={soldOut}
        aria-busy={busy || undefined}
        aria-disabled={busy || added || undefined}
        aria-label={added ? addedName : failed ? failedName : name}
        data-state={shown}
        onClick={() => void press()}
        className={cn(
          "relative z-10",
          // On a narrow list the button is a square with the icon and the word is left to screen readers, so the name of the product keeps its room. A product that cannot be bought keeps its words.
          !soldOut && "@max-md:w-8 @max-md:px-0",
          (busy || added) && "pointer-events-none",
          failed && "border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/5 hover:text-destructive",
          className,
        )}
      >
        <span className="grid justify-items-center">
          {SHOWN.map((key) => {
            const seen = key === shown;
            return (
              <span key={key} aria-hidden={seen ? undefined : "true"} className={cn("col-start-1 row-start-1 inline-flex items-center gap-2", !seen && "invisible @max-md:hidden")}>
                {key === "soldOut" ? null : seen ? glyphs[key] : <span className="size-3.5 shrink-0" />}
                <span className={cn(seen && key !== "soldOut" && "@max-md:sr-only")}>{words[key]}</span>
              </span>
            );
          })}
        </span>
      </Button>
      <span role="status" className="sr-only">
        {failed ? failedName : null}
      </span>
    </>
  );
}
