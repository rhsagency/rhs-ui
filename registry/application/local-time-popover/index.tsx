"use client";

import { useRef, useState, type ComponentProps } from "react";

import { IconGlobe } from "@rhs-ui/icons";
import { LocalTimePanel } from "@rhs-ui/application/local-time-popover/panel";
import { DEFAULT_LABELS, toTimestamp, triggerText, type LocalTime, type LocalTimeLabels, type LocalZone } from "@rhs-ui/application/local-time-popover/zones";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { LocalTime, LocalTimeLabels, LocalZone, ZoneRow } from "@rhs-ui/application/local-time-popover/zones";
export { LocalTimePanel, type LocalTimePanelProps } from "@rhs-ui/application/local-time-popover/panel";

export interface LocalTimePopoverProps extends Omit<ComponentProps<"span">, "children" | "title"> {
  /** The moment of the event, as an ISO string with its offset or a "Z": "2026-10-22T16:00:00+02:00". A Date or a timestamp works too. */
  instant: LocalTime;
  /** The zones to show it in, each an IANA name and the name of the place. The viewer's own zone is added at the top if it is not among them. */
  zones: readonly LocalZone[];
  /** The zone the event is in, which the trigger writes the time in and every other zone's day is compared with. Default: the first of `zones`. */
  eventZone?: string;
  /** The viewer's zone. Leave it out to use the browser's own, read once the page is live; nothing here reads the server's zone. */
  viewerZone?: string;
  /** The language of the weekdays, the months and the way a time is written. Default "en-US". */
  locale?: string;
  /** The moment "in 3 days" is measured from. Leave it out to use the browser's clock once the page is live; pass it for the same words in server HTML, in tests and in previews. */
  now?: LocalTime;
  /** The name of the event. It leads the line that Copy as text produces: "Product sync: Thu 22 Oct, 18:00 Amsterdam (UTC+2) / ...". */
  title?: string;
  /** How the trigger writes the time, as `Intl.DateTimeFormat` options. Default: the time and the zone's short name, "18:00 CEST". The zone is always the event's. */
  format?: Intl.DateTimeFormatOptions;
  /** Which edge of the time the list lines up with. Default "start". */
  align?: "start" | "center" | "end";
  /** Whether the list is open, when you control it. */
  open?: boolean;
  /** Whether the list is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the list opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The words the popover says, for translation. */
  labels?: LocalTimeLabels;
}

/**
 * An event time that answers "and when is that for me?". The trigger is the time itself, written in the event's zone as a real
 * `time` element with a dotted line under it; pressing it opens the same moment in each zone you chose, the viewer's own zone
 * first and tagged "You", with the day change marked ("Next day") and the distance from UTC in tabular digits. Daylight saving
 * comes from Intl for the actual date, and nothing depends on the server's zone. "Copy as text" puts one line on the clipboard to
 * paste into a chat.
 */
export function LocalTimePopover({
  instant,
  zones,
  eventZone,
  viewerZone,
  locale = "en-US",
  now,
  title,
  format,
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  labels,
  className,
  ...props
}: LocalTimePopoverProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const content = useRef<HTMLDivElement>(null);
  const isOpen = open ?? ownOpen;
  // A list that is open from the start (a preview, a first-run tip) never takes focus from the page: that is only for a list somebody opened.
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [fresh, setFresh] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setFresh(false);
  }

  const at = toTimestamp(instant);
  if (Number.isNaN(at)) return null;
  const home = eventZone ?? zones[0]?.id ?? "UTC";

  function setOpen(next: boolean) {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <span data-slot="local-time-popover" className={cn("inline-flex", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="-my-0.5 inline-flex items-baseline gap-1.5 rounded-sm py-0.5 font-medium underline decoration-muted-foreground/60 decoration-dotted underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=open]:decoration-foreground motion-reduce:transition-none"
          >
            <time dateTime={new Date(at).toISOString()} suppressHydrationWarning className="tabular-nums">
              {triggerText(at, locale, home, format)}
            </time>
            <IconGlobe aria-hidden="true" className="size-3.5 self-center text-muted-foreground" />
            <span className="sr-only">, {words.hint}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          ref={content}
          align={align}
          collisionPadding={8}
          aria-label={words.title}
          onOpenAutoFocus={(event) => {
            // Focus goes to the copy button, the one thing in the list to press, unless the list was open from the start.
            event.preventDefault();
            if (fresh) return;
            content.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
          }}
          // The list scrolls as a whole, copy button included, so the scrolling box always holds something to focus.
          className="relative max-h-[min(34rem,var(--radix-popover-content-available-height))] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain p-0"
        >
          <LocalTimePanel instant={instant} zones={zones} eventZone={home} viewerZone={viewerZone} locale={locale} now={now} title={title} labels={labels} />
        </PopoverContent>
      </Popover>
    </span>
  );
}
