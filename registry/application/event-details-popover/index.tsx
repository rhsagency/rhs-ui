"use client";

import { useId, useRef, type ReactElement, type ReactNode } from "react";

import { IconClose } from "@rhs-ui/icons";
import { DEFAULT_LABELS, type EventDetailsLabels, type EventInfo, type EventMoment } from "@rhs-ui/application/event-details-popover/event";
import { EventDetailsPanel } from "@rhs-ui/application/event-details-popover/panel";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export type { EventDetailsLabels, EventInfo, EventMoment, EventPerson, EventStatus } from "@rhs-ui/application/event-details-popover/event";
export { EventDetailsPanel, type EventDetailsPanelProps } from "@rhs-ui/application/event-details-popover/panel";

export interface EventDetailsPopoverProps {
  /** The event: title, start, end, time zone, place, link, people, description and status. */
  event: EventInfo;
  /** The reader's own IANA time zone. When it shows a different clock than the event's zone, the panel writes both. Default "UTC". */
  viewerTimeZone?: string;
  /** The language of the dates, times and names of zones. Default "en-US". */
  locale?: string;
  /** The buttons at the foot of the panel: Join, Edit, Cancel. Put them on `Button`s; a button that closes the popover goes in a `PopoverClose`. */
  actions?: ReactNode;
  /** The event chip, or any one element that is a button: it opens the panel and gets the focus back when it closes. */
  children: ReactElement;
  /** What "now" is, for "Happening now" and "Ended 3 days ago". Pass it for output that does not change between server and browser. Default: the current time. */
  now?: EventMoment;
  /** Whether the popover is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when it opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The side of the chip the panel opens on. It moves to another side when there is no room. Default "bottom". */
  side?: "top" | "right" | "bottom" | "left";
  /** How the panel lines up with the chip along that side. Default "start". */
  align?: "start" | "center" | "end";
  /** The words the panel says, for translation. */
  labels?: EventDetailsLabels;
  /** Classes for the panel, for a different width. */
  className?: string;
}

/**
 * Click an event on a calendar or a schedule and read it without leaving the page: the title with its status in
 * words, the day and the time, the reader's own time when their zone differs, the place or a link to join, who is
 * invited and a description cut to four lines, with your actions at the foot. A cancelled event has its title struck
 * through and says Cancelled; an event that is over says how long ago. The panel is anchored to the chip you pass as
 * `children`, does not trap focus or dim the page, closes on Escape or a click outside, and gives the focus back to the
 * chip. It never leaves the screen: on a phone it takes the width that is there.
 */
export function EventDetailsPopover({
  event,
  viewerTimeZone,
  locale,
  actions,
  children,
  now,
  open,
  defaultOpen,
  onOpenChange,
  side = "bottom",
  align = "start",
  labels,
  className,
}: EventDetailsPopoverProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger {...AS_CHILD}>{children}</PopoverTrigger>
      <PopoverContent
        ref={panel}
        data-slot="event-details-popover"
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
          "relative w-84 max-w-[min(21rem,var(--radix-popover-content-available-width))] max-h-(--radix-popover-content-available-height) scroll-pt-12 overflow-x-hidden overflow-y-auto overscroll-contain p-0 [scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-width:thin]",
          className,
        )}
      >
        <EventDetailsPanel
          event={event}
          viewerTimeZone={viewerTimeZone}
          locale={locale}
          actions={actions}
          now={now}
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
