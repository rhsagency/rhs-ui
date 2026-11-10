"use client";

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { Slot } from "radix-ui";

import type { LocaleOption, LocaleSuggestion } from "@rhs-ui/marketing/locale-suggestion-bar/types";
import { cn } from "@/lib/utils";

type Choice = "switch" | "stay" | "dismiss";

const ChoiceContext = createContext<((choice: Choice) => void) | null>(null);

export interface LocaleBarRootProps extends Omit<ComponentProps<"div">, "onChange"> {
  /** What the visitor is on now. */
  current: LocaleOption;
  /** What is on offer. Its code becomes the lang of the bar. */
  suggested: LocaleSuggestion;
  /** The id of the element holding the question, which names the region. */
  labelledBy: string;
  /** Called when the visitor takes the offer. */
  onSwitch?: (suggested: LocaleSuggestion) => void;
  /** Called when the visitor keeps the version they are on. */
  onStay?: (current: LocaleOption) => void;
  /** Called when the visitor closes the bar without choosing. */
  onDismiss?: () => void;
}

/**
 * The bar around the question: a region in the suggested language that slides
 * in once and is gone for good as soon as the visitor makes any choice, Switch,
 * Stay or the close. Nothing here redirects or remembers: it only reports the
 * choice, and storing it is yours.
 */
export function LocaleBarRoot({ current, suggested, labelledBy, onSwitch, onStay, onDismiss, className, children, ...props }: LocaleBarRootProps) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const choose = (choice: Choice) => {
    setOpen(false);
    if (choice === "switch") onSwitch?.(suggested);
    else if (choice === "stay") onStay?.(current);
    else onDismiss?.();
  };

  return (
    <ChoiceContext.Provider value={choose}>
      <div
        data-slot="locale-suggestion-bar"
        role="region"
        lang={suggested.code}
        aria-labelledby={labelledBy}
        className={cn("grid grid-rows-[1fr] border-b border-border bg-muted/60 motion-safe:animate-rhs-locale-bar-in", className)}
        {...props}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </ChoiceContext.Provider>
  );
}

/** Wraps one button or link of the bar and reports which choice it is: the bar hides itself and hands the choice back to you. */
export function LocaleBarAction({ choice, children }: { choice: Choice; children: ReactNode }) {
  const choose = useContext(ChoiceContext);
  return <Slot.Root onClick={() => choose?.(choice)}>{children}</Slot.Root>;
}
