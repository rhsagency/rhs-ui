"use client";

import { useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconHistory } from "@rhs-ui/icons";
import { RecentItemsPanel } from "@rhs-ui/application/recent-items-popover/panel";
import { DEFAULT_LABELS, type RecentItem, type RecentItemsLabels, type RecentTime } from "@rhs-ui/application/recent-items-popover/recent";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export type { RecentGroup, RecentGroupId, RecentItem, RecentItemsLabels, RecentTime } from "@rhs-ui/application/recent-items-popover/recent";
export { RecentItemsPanel, type RecentItemsPanelProps } from "@rhs-ui/application/recent-items-popover/panel";

export interface RecentItemsPopoverProps extends Omit<ComponentProps<"div">, "children" | "onClear"> {
  /** What was opened: an id, a title, a kind, a link, when it was opened and whether it is pinned. Any order; the panel orders them. */
  items: readonly RecentItem[];
  /** A row was opened, by a click or by Enter. The event comes with it, so a client-side router can call `preventDefault()`. The popover closes. */
  onOpen?: (item: RecentItem, event: MouseEvent<HTMLElement>) => void;
  /** An item was pinned or unpinned, by its pin button or by pressing P on the row. Update `pinned` on the item. Leave it out for no pinning. */
  onPin?: (item: RecentItem, pinned: boolean) => void;
  /**
   * The history was cleared and the few seconds to undo it have passed. It receives the items that went. Clear history never
   * asks first: the items vanish, an Undo button appears, and only when it goes unused is this called, so it is also the moment to
   * delete them on your side. Closing the popover or leaving the page ends the wait and calls it at once. Pinned items are kept.
   * Remove the items from `items` here, or they come back. Leave it out for no Clear button.
   */
  onClear?: (cleared: readonly RecentItem[]) => void;
  /** How many of the unpinned items are listed. Pinned items are always listed. Default 8. */
  max?: number;
  /** How long Undo is on offer after Clear, in milliseconds. Default 6000. */
  undoMs?: number;
  /** The moment the headings and the times are measured against. Leave it out to use the browser's clock once the page is live; pass it for the same headings in server HTML, in tests and in previews. */
  now?: RecentTime;
  /** The language of the words and the dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days decide Today and Yesterday, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** Replaces the button. One element that takes a ref and props, such as a `Button`. */
  trigger?: ReactNode;
  /** Which edge of the button the panel lines up with. Default "start". */
  align?: "start" | "center" | "end";
  /** Whether the panel is open, when you control it. */
  open?: boolean;
  /** Whether the panel is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes: by the button, Escape, a click outside, or opening a row. */
  onOpenChange?: (open: boolean) => void;
  /** The words the button and the panel say, for translation. */
  labels?: RecentItemsLabels;
}

/**
 * A Recent button for apps where people jump between things: it opens what was opened lately, under Pinned, Today, Yesterday
 * and Earlier, each row with a kind icon, a title cut to one line and how long ago. The arrow keys move through the list,
 * Enter opens a row and P pins it. Clear history asks no question: the items go, Undo is on offer for a few seconds, and
 * only then is it final. With nothing opened yet the panel explains that recent items appear after opening something. The
 * days and the times are worked out from the `now` and the `timeZone` you pass, so the server and the browser agree.
 */
export function RecentItemsPopover({
  items,
  onOpen,
  onPin,
  onClear,
  max,
  undoMs,
  now,
  locale = "en-US",
  timeZone = "UTC",
  trigger,
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  labels,
  className,
  ...props
}: RecentItemsPopoverProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const content = useRef<HTMLDivElement>(null);
  const isOpen = open ?? ownOpen;
  // A panel that is open from the start (a preview, a first-run tip) never takes focus from the page: that is only for a panel somebody opened.
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [fresh, setFresh] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setFresh(false);
  }

  function setOpen(next: boolean) {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div data-slot="recent-items-popover" className={cn("inline-flex max-w-full min-w-0", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger {...AS_CHILD}>
          {trigger ?? (
            <Button type="button" variant="outline" className="gap-2">
              <IconHistory aria-hidden="true" />
              {words.trigger}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          ref={content}
          align={align}
          collisionPadding={8}
          aria-label={words.title}
          onOpenAutoFocus={(event) => {
            // Focus goes to the first row, the one the arrow keys start from, and not to the Clear button in the header.
            event.preventDefault();
            if (fresh) return;
            const root = content.current;
            const first = root?.querySelector<HTMLElement>('[data-row][tabindex="0"]') ?? root?.querySelector<HTMLElement>("[data-row]");
            (first ?? root)?.focus({ preventScroll: true });
          }}
          className="flex max-h-[min(30rem,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden p-0"
        >
          <RecentItemsPanel
            items={items}
            onOpen={onOpen}
            onPin={onPin}
            onClear={onClear}
            max={max}
            undoMs={undoMs}
            onNavigate={() => setOpen(false)}
            now={now}
            locale={locale}
            timeZone={timeZone}
            labels={labels}
            className="min-h-0 flex-1"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
