"use client";

import { useId, useRef, type ReactElement } from "react";

import { IconClose, IconInfo } from "@rhs-ui/icons";
import { RecommendationReasonPanel } from "@rhs-ui/application/recommendation-reason-popover/panel";
import { DEFAULT_LABELS, type RecommendationReason, type RecommendationReasonLabels, type Sponsorship } from "@rhs-ui/application/recommendation-reason-popover/reasons";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { ReasonKind, RecommendationReason, RecommendationReasonLabels, Sponsorship } from "@rhs-ui/application/recommendation-reason-popover/reasons";
export { RecommendationReasonPanel, type RecommendationReasonPanelProps } from "@rhs-ui/application/recommendation-reason-popover/panel";

export interface RecommendationReasonPopoverProps {
  /** The reasons, in plain language, most important first: a sentence, an optional second line and the kind of signal. */
  reasons: readonly RecommendationReason[];
  /** Set for an ad: who paid, and what that means. The panel says so before anything else. */
  sponsored?: Sponsorship;
  /** Asks for less of this kind of thing. Return a promise and the row shows a spinner, then its confirmation in place; if it rejects the row goes back and says why. Leave it out for no such button. */
  onLessLikeThis?: () => void | Promise<void>;
  /** Hides this item. Same as above. Leave it out for no such button. */
  onHide?: () => void | Promise<void>;
  /** Where the settings for personalisation live. Leave it out for no link. */
  settingsHref?: string;
  /** The element that opens the panel, one button. Name it "Why am I seeing this?". Default: a small info button with that name. */
  trigger?: ReactElement;
  /** The heading of the panel, and the name of the default button. Default "Why am I seeing this?" */
  title?: string;
  /** Whether the popover is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The side of the button the panel opens on. It moves to another side when there is no room. Default "bottom". */
  side?: "top" | "right" | "bottom" | "left";
  /** How the panel lines up with the button along that side. Default "end", for a button at the end of a row. */
  align?: "start" | "center" | "end";
  /** The words the popover says, for translation. */
  labels?: RecommendationReasonLabels;
  /** Classes for the panel, for a different width. */
  className?: string;
}

/**
 * The answer to "why am I seeing this?", beside a recommendation, an ad or a ranked entry in a feed. A small info button
 * opens a panel that keeps the explanation out of the page until it is asked for: an ad says that it is one and who paid,
 * then the reasons come as short sentences in plain language with the kind of signal behind each, and real buttons let
 * people see less of it, hide it, or open their settings, with a confirmation in the button's own place. It is a
 * non-modal popover, so it works with a finger, a keyboard and a screen reader; Escape or a click outside closes it and
 * the focus goes back to the button.
 */
export function RecommendationReasonPopover({
  reasons,
  sponsored,
  onLessLikeThis,
  onHide,
  settingsHref,
  trigger,
  title,
  open,
  defaultOpen,
  onOpenChange,
  side = "bottom",
  align = "end",
  labels,
  className,
}: RecommendationReasonPopoverProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const heading = title ?? words.title;
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            data-slot="recommendation-reason-trigger"
            aria-label={heading}
            className={cn(
              "relative inline-flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none",
              "transition-[background-color,color] duration-150 motion-reduce:transition-none",
              "hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
              "focus-visible:ring-[3px] focus-visible:ring-ring/40",
              // A bigger target on a touch screen without moving anything: the button grows by an invisible frame.
              "before:absolute before:-inset-1 before:content-[''] pointer-coarse:before:-inset-2",
            )}
          >
            <IconInfo size={16} />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        ref={panel}
        data-slot="recommendation-reason-popover"
        side={side}
        align={align}
        sideOffset={8}
        collisionPadding={12}
        tabIndex={-1}
        aria-labelledby={titleId}
        // Focus starts on the panel itself, so a screen reader reads its name and the first Tab lands on the first action; not on the close button.
        onOpenAutoFocus={(focus) => {
          focus.preventDefault();
          panel.current?.focus({ preventScroll: true });
        }}
        // The panel is never taller than the room there is: on a small screen it scrolls inside itself instead of running off the edge, and the close button stays in view.
        className={cn(
          "relative w-80 max-w-[min(20rem,var(--radix-popover-content-available-width))] max-h-(--radix-popover-content-available-height) scroll-pt-12 overflow-x-hidden overflow-y-auto overscroll-contain p-0 [scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-width:thin]",
          className,
        )}
      >
        <RecommendationReasonPanel
          reasons={reasons}
          sponsored={sponsored}
          onLessLikeThis={onLessLikeThis}
          onHide={onHide}
          settingsHref={settingsHref}
          title={heading}
          labels={labels}
          titleId={titleId}
          close={
            <PopoverClose asChild>
              <button
                type="button"
                aria-label={words.close}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-popover text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none pointer-coarse:size-10"
              >
                <IconClose size={16} />
              </button>
            </PopoverClose>
          }
        />
      </PopoverContent>
    </Popover>
  );
}
