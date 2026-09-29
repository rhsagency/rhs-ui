"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string;
  title: ReactNode;
  /** "3 h ago", computed where you know "now" (on the server, or after mount). */
  time: string;
  unread?: boolean;
  /** A glyph or avatar at the start. */
  icon?: ReactNode;
  /** Where the notification leads. */
  href?: string;
  /** Groups the list: "Today", "Earlier". */
  group?: string;
}

export interface NotificationListProps {
  items: readonly NotificationItem[];
  /** Called with the ids that were just marked read. */
  onRead?: (ids: string[]) => void;
  empty?: ReactNode;
  className?: string;
}

/**
 * An inbox of what happened: grouped by time, unread items marked with a
 * dot and in words, a "Mark all as read" that updates the list at once, and
 * each item a link when it leads somewhere. Unread counts are announced.
 */
export function NotificationList({ items, onRead, empty = "You are all caught up.", className }: NotificationListProps) {
  const [read, setRead] = useState<ReadonlySet<string>>(new Set());
  const isUnread = (item: NotificationItem) => Boolean(item.unread) && !read.has(item.id);
  const unread = items.filter(isUnread);
  const groups = [...new Set(items.map((item) => item.group ?? ""))];
  const markAll = () => {
    const ids = unread.map((item) => item.id);
    setRead((current) => new Set([...current, ...ids]));
    onRead?.(ids);
  };
  return (
    <div data-slot="notification-list" className={cn("grid gap-3", className)}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium" aria-live="polite">
          {unread.length ? `${unread.length} unread` : "No unread notifications"}
        </p>
        <button type="button" onClick={markAll} disabled={!unread.length} className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-40">
          Mark all as read
        </button>
      </div>
      {items.length ? (
        groups.map((group) => (
          <section key={group} aria-label={group || "Notifications"} className="grid gap-1">
            {group ? <h3 className="px-2 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">{group}</h3> : null}
            <ul className="grid">
              {items
                .filter((item) => (item.group ?? "") === group)
                .map((item) => {
                  const fresh = isUnread(item);
                  const body = (
                    <>
                      {item.icon ? <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4">{item.icon}</span> : null}
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className={cn("text-sm leading-snug", fresh ? "text-foreground" : "text-muted-foreground")}>{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                      </span>
                      <span aria-hidden="true" className={cn("mt-1.5 size-2 shrink-0 rounded-full", fresh ? "bg-foreground" : "bg-transparent")} />
                      {fresh ? <span className="sr-only">, unread</span> : null}
                    </>
                  );
                  const row = "flex items-start gap-3 rounded-lg px-2 py-2.5 outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40";
                  return (
                    <li key={item.id}>
                      {item.href ? (
                        <a href={item.href} className={row} onClick={() => setRead((current) => new Set([...current, item.id]))}>
                          {body}
                        </a>
                      ) : (
                        <div className={row}>{body}</div>
                      )}
                    </li>
                  );
                })}
            </ul>
          </section>
        ))
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>
      )}
    </div>
  );
}
