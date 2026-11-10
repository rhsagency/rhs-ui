import { useId, type ComponentProps, type ElementType } from "react";

import { IconArrowRight, IconClose, IconGlobe } from "@rhs-ui/icons";
import { LocaleBarAction, LocaleBarRoot } from "@rhs-ui/marketing/locale-suggestion-bar/bar";
import type { LocaleOption, LocaleSuggestion } from "@rhs-ui/marketing/locale-suggestion-bar/types";
import { Button } from "@rhs-ui/primitives/button";

export type { LocaleOption, LocaleSuggestion } from "@rhs-ui/marketing/locale-suggestion-bar/types";

export interface LocaleSuggestionBarProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The version the visitor is on now. It is handed back to onStay so you can store it. */
  current: LocaleOption;
  /** The version you offer, and the question and button words in its own language. */
  suggested: LocaleSuggestion;
  /** Called when the visitor takes the offer, as the link is followed. Store the choice here. */
  onSwitch?: (suggested: LocaleSuggestion) => void;
  /** Called when the visitor keeps the version they are on. Store the choice here, and do not show the bar again. */
  onStay?: (current: LocaleOption) => void;
  /** Called when the visitor closes the bar without choosing. */
  onDismiss?: () => void;
  /** Renders the Switch link. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
}

/**
 * A polite bar that offers the version of the site in the visitor's language,
 * once: a short question in that language, a primary Switch button, a quiet
 * Stay button and a close. It never redirects by itself and never guesses from
 * an IP address: you decide when to show it, for instance when Accept-Language
 * differs from the page, and you store the answer. It is a region whose lang is
 * the suggested language, so a screen reader pronounces the question right,
 * and the type asks for every word of the bar (the question and the names of
 * the three buttons), so none is left in English by accident. Translations run
 * long: when the buttons do not fit side by side, Stay drops under Switch. It
 * slides in once, instantly under reduced motion, and any choice removes it
 * for good. The callbacks are functions, so use the bar from a Client
 * Component, or pass Server Actions.
 */
export function LocaleSuggestionBar({ current, suggested, onSwitch, onStay, onDismiss, linkAs: Link = "a", className, ...props }: LocaleSuggestionBarProps) {
  const id = useId();

  return (
    <LocaleBarRoot current={current} suggested={suggested} labelledBy={id} onSwitch={onSwitch} onStay={onStay} onDismiss={onDismiss} className={className} {...props}>
      <div className="relative mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 pr-14 sm:flex-row sm:items-center sm:justify-center sm:gap-5 sm:px-14 sm:py-2.5">
        <p id={id} className="flex items-start gap-2.5 text-sm sm:items-center">
          <IconGlobe aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground sm:mt-0" />
          <span className="text-pretty">{suggested.question}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <LocaleBarAction choice="switch">
            <Button asChild size="sm" className="h-10 px-4 sm:h-8 sm:px-3">
              <Link href={suggested.href} hrefLang={suggested.code}>
                {suggested.switchLabel}
                <IconArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </LocaleBarAction>
          <LocaleBarAction choice="stay">
            <Button type="button" variant="ghost" size="sm" className="h-10 px-4 sm:h-8 sm:px-3">
              {suggested.stayLabel}
            </Button>
          </LocaleBarAction>
        </div>
        <div className="absolute inset-y-0 right-2 flex items-start pt-2 sm:items-center sm:pt-0">
          <LocaleBarAction choice="dismiss">
            <Button type="button" variant="ghost" size="icon-sm" aria-label={suggested.closeLabel}>
              <IconClose />
            </Button>
          </LocaleBarAction>
        </div>
      </div>
    </LocaleBarRoot>
  );
}
