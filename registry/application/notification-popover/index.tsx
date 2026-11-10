"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent } from "react";

import { IconBell } from "@rhs-ui/icons";
import {
  countText,
  DEFAULT_LABELS,
  fill,
  unreadSummary,
  type NotificationEntry,
  type NotificationLabels,
  type NotificationTime,
} from "@rhs-ui/application/notification-popover/notifications";
import { NotificationPanel } from "@rhs-ui/application/notification-popover/panel";
import { Button } from "@rhs-ui/primitives/button";
import { NotificationBadge } from "@rhs-ui/primitives/notification-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { NotificationActor, NotificationEntry, NotificationLabels, NotificationTime } from "@rhs-ui/application/notification-popover/notifications";
export { NotificationPanel, type NotificationPanelProps } from "@rhs-ui/application/notification-popover/panel";

export interface NotificationPopoverProps extends Omit<ComponentProps<"div">, "children"> {
  /** The notifications, newest first: an id, a title, an optional body, a time, a link, whether it is unread, and who it came from. */
  items: readonly NotificationEntry[];
  /** How many are unread in all, when that is more than the list holds. It is the number on the bell. Default: the unread ones in `items`. */
  unreadCount?: number;
  /** Show skeleton rows in the panel while the notifications load. */
  loading?: boolean;
  /** The most rows the panel draws; the rest are behind "View all notifications". Default 8. */
  max?: number;
  /** Where "View all notifications" goes. Leave it out for no link. */
  viewAllHref?: string;
  /** A row was opened. The event comes with it, so a client-side router can call `preventDefault()`. The panel closes. */
  onOpenItem?: (item: NotificationEntry, event: MouseEvent<HTMLElement>) => void;
  /** An unread row was opened: mark it read. */
  onMarkRead?: (id: string) => void;
  /** Shows "Mark all as read" and runs this when it is pressed. */
  onMarkAllRead?: () => void;
  /** The moment the times are measured against. Pass it for relative text in server HTML, in tests and in previews; leave it out to use the browser's clock once the page is live. */
  now?: NotificationTime;
  /** The language of the words, the numbers and the dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days and clock the times use, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** Whether the panel is open, when you control it. */
  open?: boolean;
  /** Whether the panel is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes: by the bell, Escape, a click outside, or opening a row. */
  onOpenChange?: (open: boolean) => void;
  /** Which edge of the bell the panel lines up with. Default "end". */
  align?: "start" | "center" | "end";
  /** The words the bell and the panel say, for translation. */
  labels?: NotificationLabels;
}

/**
 * The bell in a header. A count sits on it (capped at 99+, and spoken as "Notifications, 3 unread"), and it opens a compact
 * panel of the newest notifications: unread ones marked with a dot and the word "Unread", "Mark all as read", and a link to
 * the full list. Opening a row marks it read and closes the panel, the arrow keys move between rows, and the panel says
 * "3 unread notifications" as it opens. While `loading` it draws skeleton rows; with nothing to show it says "You're all
 * caught up". Times are written from the `now` you pass, so the server and the browser agree.
 */
export function NotificationPopover({
  items,
  unreadCount,
  loading = false,
  max = 8,
  viewAllHref,
  onOpenItem,
  onMarkRead,
  onMarkAllRead,
  now,
  locale = "en-US",
  timeZone = "UTC",
  open,
  defaultOpen = false,
  onOpenChange,
  align = "end",
  labels,
  className,
  ...props
}: NotificationPopoverProps) {
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
  const unread = unreadCount ?? items.filter((item) => item.unread).length;
  const name = unread > 0 ? `${words.notifications}, ${fill(words.bellUnread, { count: countText(unread, locale) })}` : words.notifications;

  function setOpen(next: boolean) {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  // The live region lives on the bell, which is always there; the panel is not, and words that arrive together with their region are often not read.
  useEffect(() => {
    setSaid(isOpen ? (loading ? words.loading : unreadSummary(unread, locale, words)) : "");
  }, [isOpen, loading]);

  return (
    <div data-slot="notification-popover" className={cn("inline-flex", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="icon" aria-label={name} className="text-muted-foreground hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground">
            {/* The badge sits on the corner of the button, not on the bell, so the bell stays whole. */}
            <NotificationBadge label={words.notifications} count={unread} className="size-9 items-center justify-center">
              <IconBell className="size-[1.125rem]" />
            </NotificationBadge>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          ref={content}
          align={align}
          collisionPadding={8}
          aria-label={words.notifications}
          onOpenAutoFocus={(event) => {
            // Focus goes to the first row, the one the arrow keys start from, and not to the header's button.
            event.preventDefault();
            if (fresh) return;
            const root = content.current;
            const first = root?.querySelector<HTMLElement>('[data-row][tabindex="0"]') ?? root?.querySelector<HTMLElement>("a[href], button:not([aria-disabled='true'])");
            (first ?? root)?.focus({ preventScroll: true });
          }}
          className="flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden p-0"
        >
          <NotificationPanel
            items={items}
            unreadCount={unreadCount}
            loading={loading}
            max={max}
            viewAllHref={viewAllHref}
            onOpenItem={onOpenItem}
            onMarkRead={onMarkRead}
            onMarkAllRead={
              onMarkAllRead
                ? () => {
                    onMarkAllRead();
                    setSaid(words.allMarked);
                  }
                : undefined
            }
            onNavigate={() => setOpen(false)}
            now={now}
            locale={locale}
            timeZone={timeZone}
            labels={labels}
            className="min-h-0 flex-1"
          />
        </PopoverContent>
      </Popover>
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
