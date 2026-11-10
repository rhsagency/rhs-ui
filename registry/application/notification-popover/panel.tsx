"use client";

import { useEffect, useId, useState, type ComponentProps, type KeyboardEvent, type MouseEvent } from "react";

import { IconArrowRight, IconBell, IconCheck, IconCheckDouble } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  exactText,
  stampText,
  timeText,
  toTimestamp,
  type NotificationEntry,
  type NotificationLabels,
  type NotificationTime,
} from "@rhs-ui/application/notification-popover/notifications";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button, buttonVariants } from "@rhs-ui/primitives/button";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export interface NotificationPanelProps extends Omit<ComponentProps<"div">, "children"> {
  /** The notifications, newest first. Only the first `max` are drawn. */
  items: readonly NotificationEntry[];
  /** How many are unread in all, when that is more than what is loaded here. Default: the unread ones in `items`. */
  unreadCount?: number;
  /** Show skeleton rows in place of the list while the notifications load. */
  loading?: boolean;
  /** The most rows to draw. The rest are behind the link at the foot. Default 8. */
  max?: number;
  /** Where the link at the foot goes: the page with every notification. Leave it out for no link. */
  viewAllHref?: string;
  /** A row was opened. The event comes with it, so a client-side router can call `preventDefault()`. An unread row is marked read by `onMarkRead` straight after. */
  onOpenItem?: (item: NotificationEntry, event: MouseEvent<HTMLElement>) => void;
  /** An unread row was opened: mark it read. */
  onMarkRead?: (id: string) => void;
  /** Shows "Mark all as read" and runs this when it is pressed. */
  onMarkAllRead?: () => void;
  /** Called after a row or the link at the foot was used, so a popover around the panel can close. */
  onNavigate?: () => void;
  /** The moment the times are measured against. Leave it out to use the browser's clock once the page is live; pass it for relative text in server HTML, in tests and in previews. */
  now?: NotificationTime;
  /** The language of the words and the dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days and clock the times use, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the panel says, for translation. */
  labels?: NotificationLabels;
}

/** The clock the times are read against: `now` when it is given, otherwise null until the browser has one, so the server and the first paint never disagree. */
function useClock(now: NotificationTime | undefined): number | null {
  const [tick, setTick] = useState<number | null>(null);
  const pinned = now !== undefined;
  useEffect(() => {
    if (!pinned) setTick(Date.now());
  }, [pinned]);
  if (pinned) {
    const at = toTimestamp(now);
    return Number.isNaN(at) ? tick : at;
  }
  return tick;
}

interface RowProps {
  item: NotificationEntry;
  index: number;
  active: boolean;
  clock: number | null;
  locale: string;
  timeZone: string;
  unreadWord: string;
  onActive: (index: number) => void;
  onOpen: (item: NotificationEntry, event: MouseEvent<HTMLElement>) => void;
}

function Row({ item, index, active, clock, locale, timeZone, unreadWord, onActive, onOpen }: RowProps) {
  const at = toTimestamp(item.time);
  const unread = item.unread === true;
  const shown = clock === null ? stampText(at, locale, timeZone) : timeText(at, clock, locale, timeZone);
  const shared = {
    "data-row": "",
    tabIndex: active ? 0 : -1,
    onFocus: () => onActive(index),
    onClick: (event: MouseEvent<HTMLElement>) => onOpen(item, event),
    className:
      "flex w-full items-start gap-3 py-3 pr-4 pl-5 text-left outline-none transition-colors duration-150 hover:bg-muted/70 focus-visible:bg-muted/70 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 motion-reduce:transition-none",
  } as const;
  const content = (
    <>
      {item.actor ? (
        <Avatar aria-hidden="true" className="ring-1 ring-border">
          {item.actor.image ? <AvatarImage src={item.actor.image} alt="" /> : null}
          <AvatarFallback>{initialsOf(item.actor.name)}</AvatarFallback>
        </Avatar>
      ) : (
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground ring-1 ring-border [&_svg]:size-4">
          {item.icon ?? <IconBell />}
        </span>
      )}
      <span className="grid min-w-0 flex-1 gap-0.5">
        {/* The row is named by what it shows: the word Unread, what happened, the line under it, and when. What is read out is what is seen, and what a voice control can say. */}
        <span className={cn("line-clamp-2 text-sm leading-snug [overflow-wrap:anywhere]", unread ? "font-semibold text-foreground" : "font-medium text-muted-foreground")}>
          {unread ? <span className="sr-only">{unreadWord}. </span> : null}
          {item.title}
        </span>
        <span className="grid gap-1">
          {item.body ? <span className="line-clamp-2 text-[0.8125rem] leading-snug text-muted-foreground [overflow-wrap:anywhere]">{item.body}</span> : null}
          <time dateTime={Number.isNaN(at) ? undefined : new Date(at).toISOString()} title={exactText(at, locale, timeZone)} className="text-xs text-muted-foreground tabular-nums">
            {shown}
          </time>
        </span>
      </span>
    </>
  );
  return (
    <li data-unread={unread || undefined} className={cn("relative", unread && "bg-muted/40")}>
      {/* In the gutter left of the avatar, centred on it, with air on both sides: the dot belongs to the row, not to the picture. */}
      {unread ? <span aria-hidden="true" className="pointer-events-none absolute top-[1.6875rem] left-2 z-10 size-1.5 rounded-full bg-foreground" /> : null}
      {item.href ? (
        <a href={item.href} {...shared}>
          {content}
        </a>
      ) : (
        <button type="button" {...shared}>
          {content}
        </button>
      )}
    </li>
  );
}

/**
 * The inside of the bell's popover, on its own: a header with "Mark all as read", the newest notifications, and a link to
 * the full list. Each row is one link (or button) with a dot and the word "Unread" for the ones not seen yet, and the
 * arrow keys, Home and End move between rows with only one of them in the tab order. While `loading` it draws skeleton
 * rows, with nothing to read yet it says "You're all caught up", and opening a row marks it read. Use it in a sheet on a
 * phone, or let NotificationPopover put it under the bell.
 */
export function NotificationPanel({
  items,
  unreadCount,
  loading = false,
  max = 8,
  viewAllHref,
  onOpenItem,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: NotificationPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const clock = useClock(now);
  const [active, setActive] = useState(0);
  const rows = items.slice(0, Math.max(0, max));
  const unread = unreadCount ?? items.filter((item) => item.unread).length;
  const current = Math.min(active, Math.max(0, rows.length - 1));

  function open(item: NotificationEntry, event: MouseEvent<HTMLElement>) {
    onOpenItem?.(item, event);
    if (item.unread) onMarkRead?.(item.id);
    onNavigate?.();
  }

  function move(event: KeyboardEvent<HTMLUListElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const list = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-row]")];
    const at = list.findIndex((row) => row === document.activeElement);
    const target = event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : Math.min(list.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)));
    event.preventDefault();
    list[target]?.focus();
  }

  return (
    // A group, not a section: inside a popover (which is already a named dialog) or a sheet, a second landmark would only be noise.
    <div role="group" data-slot="notification-panel" aria-labelledby={`${id}-title`} aria-busy={loading || undefined} className={cn("flex min-h-0 flex-col bg-popover text-popover-foreground", className)} {...props}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
        <h2 id={`${id}-title`} className="text-sm font-semibold tracking-[-0.01em]">
          {words.notifications}
        </h2>
        {onMarkAllRead ? (
          // aria-disabled and not disabled: a button that disables itself under the finger would drop keyboard focus to the page.
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-disabled={unread === 0 || loading}
            className="-mr-1.5 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            onClick={() => {
              if (unread > 0 && !loading) onMarkAllRead();
            }}
          >
            <IconCheckDouble />
            {words.markAll}
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="min-h-0 flex-1">
          <p role="status" className="sr-only">
            {words.loading}
          </p>
          <ul aria-hidden="true" className="divide-y divide-border">
            {[0, 1, 2].map((row) => (
              <li key={row} className="flex items-start gap-3 py-3 pr-4 pl-5">
                <Skeleton delay={row * 120} className="size-9 shrink-0 rounded-full" />
                <div className="grid flex-1 gap-2 pt-1">
                  <Skeleton delay={row * 120 + 60} className="h-3.5 w-4/5" />
                  <Skeleton delay={row * 120 + 120} className="h-3 w-full" />
                  <Skeleton delay={row * 120 + 180} className="h-3 w-12" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center gap-1 px-6 py-12 text-center">
          <span aria-hidden="true" className="mb-3 grid size-10 place-items-center rounded-full border border-border bg-muted text-foreground">
            <IconCheck className="size-[1.125rem]" />
          </span>
          <p className="text-sm font-medium">{words.caughtUp}</p>
          <p className="max-w-[16rem] text-[0.8125rem] leading-relaxed text-muted-foreground">{words.caughtUpBody}</p>
        </div>
      ) : (
        <ul onKeyDown={move} className="relative min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain">
          {rows.map((item, index) => (
            <Row key={item.id} item={item} index={index} active={index === current} clock={clock} locale={locale} timeZone={timeZone} unreadWord={words.unread} onActive={setActive} onOpen={open} />
          ))}
        </ul>
      )}

      {viewAllHref ? (
        <div className="shrink-0 border-t border-border bg-muted/30 p-1.5">
          <a href={viewAllHref} onClick={() => onNavigate?.()} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full justify-center")}>
            {words.viewAll}
            <IconArrowRight />
          </a>
        </div>
      ) : null}
    </div>
  );
}
