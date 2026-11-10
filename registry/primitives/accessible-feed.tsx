"use client";

import { useEffect, useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { InfiniteScrollStatus, type InfiniteScrollStatusProps } from "@rhs-ui/primitives/infinite-scroll-status";
import { cn } from "@/lib/utils";

export interface AccessibleFeedProps<T> extends Omit<ComponentProps<"div">, "children" | "ref"> {
  /** What the feed holds, in the order it reads. */
  items: readonly T[];
  /** Draws what is inside one article. The article itself (its focus ring, its position, its name) is the feed's. */
  renderItem: (item: T, index: number) => ReactNode;
  /** The name of an article for assistive technology: the title of the post, or its first words. */
  labelFor: (item: T, index: number) => string;
  /** A stable key for an item. Default: its `id`, or its position. */
  getKey?: (item: T, index: number) => string | number;
  /** Whether there are more items to load. */
  hasMore: boolean;
  /** True while a page is being fetched: the feed is marked aria-busy, and the footer shows it. */
  loading?: boolean;
  /** True when the last request failed, or a string saying why. The footer then shows Retry. */
  error?: boolean | string;
  /** Fetch the next page and add it after the last item. Called when the footer nears the view, when its Load more button is pressed, and by Page Down on the last article. */
  onLoadMore: () => void;
  /** Called when Retry is pressed. Default: `onLoadMore`. */
  onRetry?: () => void;
  /** How many items there are in all, if you know. While it is unknown, each article says there are "-1" (an open set) until the last page has come. */
  total?: number;
  /** The name of the feed for assistive technology. Default "Feed". */
  label?: string;
  /** Classes for each article, for its card look. The focus ring is already there. */
  articleClassName?: string;
  /** Options of the footer under the feed (words, noun, margin, scroll root): see InfiniteScrollStatus. */
  status?: Partial<Omit<InfiniteScrollStatusProps, "hasMore" | "loading" | "error" | "onLoadMore" | "onRetry" | "count" | "total">>;
}

const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex='-1'])";

/** True where a key is for the text being typed, and not for moving through the feed. */
const isField = (element: Element): boolean => Boolean(element.closest("input, textarea, select, [contenteditable='true']"));

/**
 * A stream of posts, items or events built to the WAI-ARIA feed pattern, so keyboard and screen reader users stay
 * oriented in something that never ends. The container is a feed that is aria-busy while a page loads; every item is an
 * article, a tab stop, with its position and the size of the set (-1 while the end is unknown) and a name you give it.
 * Page Down and Page Up move focus to the next and the previous article (Page Down on the last one asks for more and
 * moves on when it arrives), Ctrl+End and Ctrl+Home leave the feed to the next or the previous focusable thing on the
 * page. New items arrive without moving focus, and the footer keeps a visible Load more button as the fallback for
 * the automatic loading. It adds the semantics and the keys; the look of each article is yours.
 */
export function AccessibleFeed<T>({ items, renderItem, labelFor, getKey, hasMore, loading = false, error = false, onLoadMore, onRetry, total, label = "Feed", articleClassName, status, className, ...props }: AccessibleFeedProps<T>) {
  const feed = useRef<HTMLDivElement>(null);
  /** Set by Page Down on the last article: focus goes to the first new article once it exists. */
  const wanted = useRef<number | null>(null);
  const size = total ?? (hasMore ? -1 : items.length);

  useEffect(() => {
    if (wanted.current === null || items.length <= wanted.current) return;
    const next = feed.current?.querySelectorAll<HTMLElement>(":scope > article")[wanted.current];
    wanted.current = null;
    next?.focus();
  }, [items.length]);

  /** The first focusable element after the feed, or the last one before it. */
  function leave(direction: 1 | -1) {
    const box = feed.current;
    if (!box) return;
    const all = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => !box.contains(element) && element.getClientRects().length > 0);
    const side = direction === 1 ? all.filter((element) => box.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING) : all.filter((element) => box.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING);
    (direction === 1 ? side[0] : side[side.length - 1])?.focus();
  }

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.altKey || event.metaKey || event.shiftKey) return;
    const articles = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(":scope > article"));
    const target = event.target as HTMLElement;
    const at = articles.findIndex((article) => article === target || article.contains(target));
    if (at === -1) return;
    if (event.ctrlKey) {
      if (event.key !== "End" && event.key !== "Home") return;
      event.preventDefault();
      leave(event.key === "End" ? 1 : -1);
      return;
    }
    // In a field inside an article, Page Down and Page Up are the field's.
    if (isField(target)) return;
    if (event.key === "PageDown") {
      const next = articles[at + 1];
      if (next) {
        event.preventDefault();
        next.focus();
      } else if (hasMore && !error) {
        // The last one: more is asked for (unless it is already coming), and focus follows to the first of it.
        event.preventDefault();
        wanted.current = articles.length;
        if (!loading) onLoadMore();
      }
    } else if (event.key === "PageUp") {
      const previous = articles[at - 1];
      if (previous) {
        event.preventDefault();
        previous.focus();
      }
    }
  }

  return (
    <div data-slot="accessible-feed" className={className} {...props}>
      <div ref={feed} role="feed" aria-label={label} aria-busy={loading || undefined} onKeyDown={keys} className="grid gap-4">
        {items.map((item, index) => (
          <article
            key={getKey ? getKey(item, index) : ((item as { id?: string | number }).id ?? index)}
            aria-posinset={index + 1}
            aria-setsize={size}
            aria-label={labelFor(item, index)}
            tabIndex={0}
            className={cn("scroll-mt-24 rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40", articleClassName)}
          >
            {renderItem(item, index)}
          </article>
        ))}
      </div>
      {/* After the feed, never inside it: a feed holds only articles. It watches itself, shows the states and keeps the Load more button. */}
      <InfiniteScrollStatus {...status} hasMore={hasMore} loading={loading} error={error} onLoadMore={onLoadMore} onRetry={onRetry} count={items.length} total={total} />
    </div>
  );
}
