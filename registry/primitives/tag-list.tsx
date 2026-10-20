"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface TagItem {
  /** A stable identity, never the index. */
  id: string;
  /** The text of the tag, also used in the group's accessible name ("Design, Research and 3 more"). */
  label: string;
  /** Makes the tag a link, in the row and in the overflow list. */
  href?: string;
}

export interface TagListProps extends Omit<ComponentProps<"div">, "children"> {
  /** The tags to show, in order. Each needs a stable `id`. Tags past `max`, or past what fits with `fit`, move into the "+N" popover. */
  tags: readonly TagItem[];
  /** Show at most this many tags, then a "+N" button for the rest. */
  max?: number;
  /** Measure the width the list has and show as many tags as fit on one line, then "+N". Give the list a width to fit into (a table column, `max-w-60`). Ignored with `wrap`. */
  fit?: boolean;
  /** 20px (default) or 24px tall tags. */
  size?: "sm" | "md";
  /** Let the tags wrap onto more lines, as in a card. Without it the list stays on one line, as in a table cell. */
  wrap?: boolean;
  /** Tags without an href become buttons that call this, in the row and in the overflow list. */
  onTagSelect?: (tag: TagItem) => void;
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// `pending` is the height of one row plus the 4px of padding that keeps the focus rings of the tags from being clipped.
const SIZES = {
  sm: { tag: "", more: "", height: "min-h-5", pending: "h-7" },
  md: { tag: "h-6 px-2.5 text-[0.8125rem]", more: "h-6 px-2.5 text-[0.8125rem]", height: "min-h-6", pending: "h-8" },
} as const;

const ITEM = "flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-sm outline-none transition-colors duration-150 hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40";
const MORE =
  "cursor-pointer tabular-nums transition-colors duration-150 hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_10%)] hover:text-foreground aria-expanded:bg-foreground aria-expanded:text-background";

/** "Design, Research and 3 more": what a screen reader hears for the whole group, so an overflow is never silent. */
function describe(labels: readonly string[], hidden: number): string {
  const parts = hidden > 0 ? [...labels, `${hidden} more`] : [...labels];
  return parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : (parts[0] ?? "");
}

/**
 * A row of tags that never breaks the layout. It shows what fits (measured
 * with a ResizeObserver, or capped with `max`) and then a "+3" button that
 * opens the rest in a popover, where they are still links or buttons you can
 * reach with the keyboard. The whole group is named "Design, Research and 3
 * more", so an overflow is never silent. In a table cell it stays on one
 * line, in a card it can wrap, and it re-measures when its box or the font
 * changes without moving anything vertically. Before the first measurement
 * (the server HTML, a slow hydration) it shows only the whole tags that fit
 * on one line, so a table never flashes half a tag.
 */
export function TagList({ tags, max, fit = false, size = "sm", wrap = false, onTagSelect, className, "aria-label": ariaLabel, ref, ...props }: TagListProps) {
  const sz = SIZES[size];
  const moreId = useId();
  const root = useRef<HTMLDivElement>(null);
  const probe = useRef<HTMLDivElement>(null);
  const [fitCount, setFitCount] = useState<number | null>(null);
  const fitting = fit && !wrap;
  // One stable ref for both the measuring and yours, so the callback is not called again on every render.
  const setRoot = useCallback(
    (node: HTMLDivElement | null) => {
      root.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const signature = tags.map((tag) => tag.label).join("\n");

  useBrowserLayoutEffect(() => {
    const list = root.current;
    const row = probe.current?.firstElementChild;
    if (!fitting || !list || !row) {
      setFitCount(null);
      return;
    }
    const measure = () => {
      const chips = Array.from(row.children);
      const more = chips.pop();
      const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
      const moreWidth = more?.getBoundingClientRect().width ?? 0;
      const available = list.clientWidth;
      let used = 0;
      let count = 0;
      for (const [index, chip] of chips.entries()) {
        const next = used + (index > 0 ? gap : 0) + chip.getBoundingClientRect().width;
        const reserve = index < chips.length - 1 ? gap + moreWidth : 0;
        if (next + reserve > available + 0.5) break;
        used = next;
        count = index + 1;
      }
      // At least one tag stays, and truncates, so the list is never only a "+N".
      setFitCount(Math.max(count, 1));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    observer.observe(row);
    void document.fonts?.ready.then(measure);
    return () => observer.disconnect();
  }, [fitting, signature, size]);

  // Until the first measurement (the server HTML, and any paint before hydration) there is no count to cut at.
  // The row then wraps inside a one-row box that hides the overflow, so only whole tags that fit show, never a sliver or a half tag.
  const pending = fitting && fitCount === null && tags.length > 0;
  const limit = Math.min(max ?? Number.POSITIVE_INFINITY, fitting && fitCount !== null ? fitCount : Number.POSITIVE_INFINITY);
  const visible = tags.slice(0, limit);
  const hidden = tags.slice(limit);
  const name = describe(
    visible.map((tag) => tag.label),
    hidden.length,
  );

  function arrows(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href], button"));
    const down = event.key === "ArrowDown";
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next = items[at === -1 ? (down ? 0 : items.length - 1) : (at + (down ? 1 : -1) + items.length) % items.length];
    if (!next) return;
    event.preventDefault();
    next.focus();
  }

  const label = (tag: TagItem) => <span className="truncate">{tag.label}</span>;

  return (
    <div
      data-slot="tag-list"
      data-fit={fitting ? (pending ? "pending" : "measured") : undefined}
      ref={setRoot}
      className={cn("relative min-w-0", className)}
      {...props}
    >
      <ul
        aria-label={ariaLabel ?? (name || undefined)}
        className={cn("flex min-w-0 items-center gap-1.5", sz.height, wrap || pending ? "flex-wrap" : "flex-nowrap", fitting && "-m-1 overflow-hidden p-1", pending && cn("content-start", sz.pending))}
      >
        {visible.map((tag, index) => {
          const chip = tag.href ? (
            <Badge asChild variant="outline" className={cn("max-w-full min-w-0 shrink", sz.tag)}>
              <a href={tag.href}>{label(tag)}</a>
            </Badge>
          ) : onTagSelect ? (
            <Badge asChild variant="outline" className={cn("max-w-full min-w-0 shrink cursor-pointer hover:bg-muted", sz.tag)}>
              <button type="button" onClick={() => onTagSelect(tag)}>
                {label(tag)}
              </button>
            </Badge>
          ) : (
            <Badge variant="outline" className={cn("max-w-full min-w-0 shrink", sz.tag)}>
              {label(tag)}
            </Badge>
          );
          return (
            <li key={tag.id} className={cn("flex min-w-0", pending ? "max-w-full shrink-0" : index === 0 || wrap ? "shrink" : "shrink-0")}>
              {chip}
            </li>
          );
        })}
        {hidden.length > 0 ? (
          // A flex item like the tags, so the button adds no line-height strut and a row with "+N" is as tall as one without.
          <li className="flex shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Badge asChild variant="muted" className={cn(MORE, sz.more)}>
                  <button type="button" aria-label={`Show ${hidden.length} more ${hidden.length === 1 ? "tag" : "tags"}`}>
                    +{hidden.length}
                  </button>
                </Badge>
              </PopoverTrigger>
              <PopoverContent align="start" sideOffset={6} aria-labelledby={moreId} className="w-auto max-w-72 min-w-44 p-1.5" onKeyDown={arrows}>
                <p id={moreId} className="px-2.5 pt-1 pb-1.5 text-xs text-muted-foreground">
                  {hidden.length} more {hidden.length === 1 ? "tag" : "tags"}
                </p>
                <ul className="grid gap-0.5">
                  {hidden.map((tag) => (
                    <li key={tag.id}>
                      {tag.href ? (
                        <PopoverClose asChild>
                          <a href={tag.href} className={ITEM}>
                            {tag.label}
                          </a>
                        </PopoverClose>
                      ) : onTagSelect ? (
                        <PopoverClose asChild>
                          <button type="button" onClick={() => onTagSelect(tag)} className={cn(ITEM, "cursor-pointer")}>
                            {tag.label}
                          </button>
                        </PopoverClose>
                      ) : (
                        <span className={cn(ITEM, "hover:bg-transparent")}>{tag.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>
          </li>
        ) : null}
      </ul>
      {fitting ? (
        // Measures every tag and the "+N" button at their natural width. Zero-sized and clipped, so it never takes room or scrolls the page.
        <div ref={probe} aria-hidden="true" inert className="pointer-events-none invisible absolute top-0 left-0 h-0 w-0 overflow-hidden">
          <div className="flex w-max items-center gap-1.5 whitespace-nowrap">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className={sz.tag}>
                {tag.label}
              </Badge>
            ))}
            <Badge variant="muted" className={cn("tabular-nums", sz.more)}>
              +{"8".repeat(String(Math.max(tags.length - 1, 1)).length)}
            </Badge>
          </div>
        </div>
      ) : null}
    </div>
  );
}
