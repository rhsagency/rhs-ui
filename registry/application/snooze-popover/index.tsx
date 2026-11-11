"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconClock } from "@rhs-ui/icons";
import { SnoozePanel } from "@rhs-ui/application/snooze-popover/panel";
import { DEFAULT_LABELS, type SnoozeLabels, type SnoozePreset, type SnoozeTime } from "@rhs-ui/application/snooze-popover/snooze";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export type { CivilDay, SnoozeLabels, SnoozePreset, SnoozeTime } from "@rhs-ui/application/snooze-popover/snooze";
export { SnoozePanel, type SnoozePanelProps } from "@rhs-ui/application/snooze-popover/panel";

export interface SnoozePopoverProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /**
   * The moment the person chose. It may return a promise: the row shows progress while it runs, and when it rejects the panel stays
   * open with a message so the choice can be made again. A choice that was saved closes the popover and is announced.
   */
  onSnooze: (date: Date) => void | Promise<void>;
  /** The moment every choice is worked out from, and the moment the past starts. Leave it out to use the browser's clock once the page is live; pass it for the same times in server HTML, in tests and in previews. */
  now?: SnoozeTime;
  /** The time zone the choices, the calendar and the time are read in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The language of the weekdays, the months and the way a time is written. Default "en-US". */
  locale?: string;
  /** Your own choices instead of the four defaults (later today, tomorrow morning, this weekend, next week). */
  presets?: readonly SnoozePreset[];
  /** Which part is showing to begin with: the list of choices, or the calendar with a time. Default "presets". */
  defaultView?: "presets" | "custom";
  /** Replaces the button. One element that takes a ref and props, such as a `Button`. */
  trigger?: ReactNode;
  /** Which edge of the button the panel lines up with. Default "start". */
  align?: "start" | "center" | "end";
  /** Whether the panel is open, when you control it. */
  open?: boolean;
  /** Whether the panel is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes: by the button, Escape, a click outside, or a choice. */
  onOpenChange?: (open: boolean) => void;
  /** The words the button and the panel say, for translation. */
  labels?: SnoozeLabels;
}

/**
 * Snooze until later, for email, tasks and notifications: four choices worked out from now (later today, tomorrow morning,
 * this weekend, next week) with the day and the time at the right of each, in the locale and the time zone you give. A choice
 * that would land in the past is left out. "Pick date and time" opens a calendar and a time field and writes the choice out in
 * words before it is made, and the zone is said in words at the foot. A choice snoozes at once, the result is announced ("Snoozed
 * until Thu 23 Oct, 08:00"), and every day is read in the zone against the `now` you pass, so the server and the browser agree.
 */
export function SnoozePopover({
  onSnooze,
  now,
  timeZone = "UTC",
  locale = "en-US",
  presets,
  defaultView,
  trigger,
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  labels,
  className,
  ...props
}: SnoozePopoverProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [said, setSaid] = useState("");
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
    // Cleared on the way in, so the same words are read out again after the next choice.
    if (next) setSaid("");
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div data-slot="snooze-popover" className={cn("inline-flex max-w-full min-w-0", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger {...AS_CHILD}>
          {trigger ?? (
            <Button type="button" variant="outline" className="gap-2">
              <IconClock aria-hidden="true" />
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
            // Focus goes to the first choice, the one the arrow keys start from.
            event.preventDefault();
            if (fresh) return;
            const first = content.current?.querySelector<HTMLElement>('[data-row][tabindex="0"]') ?? content.current?.querySelector<HTMLElement>("[data-row]");
            (first ?? content.current)?.focus({ preventScroll: true });
          }}
          className="flex max-h-[min(38rem,var(--radix-popover-content-available-height))] w-[min(20rem,calc(100vw-1rem))] flex-col overflow-hidden p-0"
        >
          <SnoozePanel
            onSnooze={onSnooze}
            now={now}
            timeZone={timeZone}
            locale={locale}
            presets={presets}
            defaultView={defaultView}
            labels={labels}
            onDone={({ text }) => {
              setSaid(text);
              setOpen(false);
            }}
            className="min-h-0 flex-1"
          />
        </PopoverContent>
      </Popover>
      {/* The panel is gone when the words are said, so they are said from here, where the button is. */}
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
