"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { ScrollArea as ScrollAreaPrimitive } from "radix-ui";

import { IconArrowDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ScrollBar } from "@rhs-ui/primitives/scroll-area";
import { cn } from "@/lib/utils";

/** Within this many pixels of the end the reader counts as being at the end. */
const NEAR_END = 16;
/** Further than this from the end, the jump button shows even when nothing new has arrived. */
const FAR_FROM_END = 96;

export interface StickToBottomProps extends Omit<ComponentProps<typeof ScrollAreaPrimitive.Root>, "children"> {
  /** The items, oldest first: messages, log lines, events. */
  children: ReactNode;
  /** Accessible name of the log, read when it is focused: "Conversation with Mara". */
  label: string;
  /** Called with true when the reader reaches the end and the area starts following again, with false when they scroll away. */
  onAtBottomChange?: (atBottom: boolean) => void;
  /** Items that arrived while the reader was away, shown on the button. Leave it out and the items added to your list since they left the end are counted. */
  newCount?: number;
  /** How the area follows new content and how the button scrolls. Reduced motion is always instant. */
  behavior?: "smooth" | "instant";
  /** The button's words. The default reads "3 new messages", or "Jump to latest" when nothing new has arrived. */
  jumpLabel?: (count: number) => string;
}

function defaultJumpLabel(count: number): string {
  return count > 0 ? `${count} new ${count === 1 ? "message" : "messages"}` : "Jump to latest";
}

/** How many items the list holds: the children of the first element that has more than one, however deep your wrapper goes. */
function countItems(list: Element): number {
  let node = list;
  while (node.children.length === 1 && node.firstElementChild) node = node.firstElementChild;
  return node.children.length;
}

/**
 * A scroll area for chats, logs and activity feeds that follows new content
 * for as long as the reader is at the end. Scroll up to read and it stops
 * following, and a button offers the way back with a count of what arrived.
 * A bottom sentinel and a ResizeObserver keep it pinned when content grows
 * after the fact (an image loads, a line wraps). New items are announced
 * politely, but only while it follows; while the reader is away, the count of
 * what arrived is announced instead.
 */
export function StickToBottom({ children, label, onAtBottomChange, newCount, behavior = "smooth", jumpLabel = defaultJumpLabel, className, ...props }: StickToBottomProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const pinnedNow = useRef(true);
  const lastTop = useRef(0);
  const reported = useRef(true);
  const notify = useRef(onAtBottomChange);
  const [pinned, setPinned] = useState(true);
  const [far, setFar] = useState(false);

  const [total, setTotal] = useState(0);
  const [seen, setSeen] = useState(0);
  const unseen = pinned ? 0 : (newCount ?? Math.max(0, total - seen));
  const showJump = !pinned && (far || unseen > 0);
  const [heard, setHeard] = useState("");
  const latest = useRef({ unseen, jumpLabel });

  const pin = useCallback((next: boolean) => {
    pinnedNow.current = next;
    setPinned(next);
  }, []);

  const toEnd = useCallback((how: "smooth" | "instant") => {
    const node = viewport.current;
    if (!node) return;
    const calm = how === "smooth" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({ top: node.scrollHeight, behavior: calm ? "smooth" : "instant" });
  }, []);

  // The reader opens it at the latest item, before the first paint.
  useLayoutEffect(() => {
    toEnd("instant");
    lastTop.current = viewport.current?.scrollTop ?? 0;
  }, [toEnd]);

  useEffect(() => {
    notify.current = onAtBottomChange;
  });
  useEffect(() => {
    if (reported.current === pinned) return;
    reported.current = pinned;
    notify.current?.(pinned);
  }, [pinned]);
  useEffect(() => {
    if (pinned) setSeen(total);
  }, [pinned, total]);

  // While the reader is away the log stays quiet, so the count is also a status: a screen reader hears that something arrived.
  // The latest count is said at most every few seconds, so a fast stream does not chatter.
  useEffect(() => {
    latest.current = { unseen, jumpLabel };
  });
  const arrived = unseen > 0;
  useEffect(() => {
    if (!arrived) {
      setHeard("");
      return;
    }
    const say = (): void => setHeard(latest.current.jumpLabel(latest.current.unseen));
    const first = window.setTimeout(say, 500);
    const repeat = window.setInterval(say, 3000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(repeat);
    };
  }, [arrived]);

  useEffect(() => {
    const box = viewport.current;
    const list = content.current;
    const end = sentinel.current;
    if (!box || !list || !end) return;
    // Growth never fires a scroll event, so the size observers follow it.
    const resize = new ResizeObserver((entries) => {
      if (pinnedNow.current) toEnd(entries.some((entry) => entry.target === box) ? "instant" : behavior);
    });
    resize.observe(list);
    resize.observe(box);
    // New items are counted from what is rendered, so a list inside your own wrapper counts too.
    const count = (): void => setTotal(countItems(list));
    const mutations = new MutationObserver(count);
    mutations.observe(list, { childList: true, subtree: true });
    count();
    // The sentinel says the end is in view again, however the reader got there.
    const reach = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) pin(true);
    }, { root: box, rootMargin: `0px 0px ${NEAR_END}px 0px` });
    reach.observe(end);
    return () => {
      resize.disconnect();
      mutations.disconnect();
      reach.disconnect();
    };
  }, [behavior, pin, toEnd]);

  function onScroll(): void {
    const node = viewport.current;
    if (!node) return;
    const top = node.scrollTop;
    const away = node.scrollHeight - node.clientHeight - top;
    const wentUp = top < lastTop.current - 1;
    lastTop.current = top;
    // Only the reader moving up lets go: content growing under them must not.
    if (away <= NEAR_END) pin(true);
    else if (wentUp) pin(false);
    setFar(away > FAR_FROM_END);
  }

  function jump(): void {
    pin(true);
    toEnd(behavior);
    viewport.current?.focus({ preventScroll: true });
  }

  return (
    <ScrollAreaPrimitive.Root data-slot="stick-to-bottom" data-state={pinned ? "following" : "away"} className={cn("relative overflow-hidden", className)} {...props}>
      <ScrollAreaPrimitive.Viewport
        ref={viewport}
        role="log"
        tabIndex={0}
        aria-label={label}
        aria-live={pinned ? "polite" : "off"}
        aria-relevant="additions"
        onScroll={onScroll}
        className="size-full rounded-[inherit] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset [&>div]:block!"
      >
        <div ref={content}>{children}</div>
        <div ref={sentinel} aria-hidden="true" className="h-px" />
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <span role="status" className="sr-only">
        {heard}
      </span>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          inert={!showJump}
          onClick={jump}
          className={cn(
            "pointer-events-auto rounded-full bg-background shadow-sm tabular-nums motion-safe:transition-[opacity,translate,background-color,border-color] motion-safe:duration-200 motion-reduce:transition-none",
            showJump ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          <IconArrowDown />
          {jumpLabel(unseen)}
        </Button>
      </div>
    </ScrollAreaPrimitive.Root>
  );
}
