"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from "react";

import { IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface StickyCtaBarProps extends Omit<ComponentProps<"aside">, "children"> {
  /** The ask in a few words: the product and the offer, "Halcyon Pro, free for 14 days". It also names the bar. On a phone it may take up to three lines beside the button, so keep the button's text short too. */
  label: string;
  /** One short line of support under the label: a price, a promise. Hidden on a phone, where the label and the button are enough. */
  description?: string;
  /** The one action: a Button, or a link styled as one. Give it size="sm". */
  action: ReactNode;
  /** When the bar appears. A number is a distance in pixels from the top; a string is the id of an element, usually the hero, and the bar appears once that element has scrolled out of view above the screen. 480 by default. */
  showAfter?: number | string;
  /** The id of an element, a sign-up form or the footer, that hides the bar for as long as any part of it is on screen: the bar never covers the thing it points at. */
  hideWhen?: string;
  /** Shows a close button. Without it the bar stays for as long as its conditions hold. */
  dismissible?: boolean;
  /** Called when the reader closes the bar. */
  onDismiss?: () => void;
  /** Remembers a dismissal for the rest of the browser session under this key, so a closed bar stays closed on the next page. */
  storageKey?: string;
  /** The accessible name of the close button. */
  dismissLabel?: string;
  /**
   * The element that scrolls, when it is not the window: a preview frame, a dialog, an app pane. The bar is then
   * positioned inside the nearest positioned ancestor instead of fixed to the screen, and the room it needs at the
   * end of the page is added to this element. Leave it out for a page that scrolls normally.
   */
  scrollRoot?: RefObject<HTMLElement | null>;
}

/**
 * A bar at the bottom of the screen that makes one ask once the reader has
 * seen enough of the page: the hero has scrolled away, and the product, an
 * offer and a single action stay in reach. It watches with IntersectionObserver
 * rather than scroll handlers, slides in with a short transform that becomes a
 * fade when the reader prefers less motion, hides itself while the footer or a
 * form is on screen, and adds room at the bottom of the page while it shows, so
 * it never covers the last lines or a focused field. It respects the safe area
 * of a phone, can be dismissed for the session (from the keyboard, focus goes
 * back to where it came from), and is out of the tab order and the
 * accessibility tree whenever it is hidden. A sticky ask lifts mobile
 * conversion without a popup.
 */
export function StickyCtaBar({
  label,
  description,
  action,
  showAfter = 480,
  hideWhen,
  dismissible = false,
  onDismiss,
  storageKey,
  dismissLabel = "Dismiss",
  scrollRoot,
  className,
  onFocus,
  ...props
}: StickyCtaBarProps) {
  const bar = useRef<HTMLElement>(null);
  /** Where focus came from when it entered the bar, so that closing the bar can give it back. */
  const cameFrom = useRef<HTMLElement | null>(null);
  const [past, setPast] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const visible = past && !blocked && !dismissed;

  // A dismissal remembered for this session. The bar starts hidden, so nothing flashes while this is read.
  useEffect(() => {
    if (!storageKey) return;
    try {
      if (window.sessionStorage.getItem(storageKey) === "1") setDismissed(true);
    } catch {
      /* Storage can be blocked; the bar then simply comes back on the next page. */
    }
  }, [storageKey]);

  // Where the reader is: past the line (a stretch of page or an element), and whether the thing to avoid is on screen.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      setPast(true);
      return;
    }
    const root = scrollRoot?.current ?? null;
    const undo: Array<() => void> = [];
    let line: Element | null = null;

    if (typeof showAfter === "number") {
      // A stretch of page showAfter pixels tall at the very top. Once it has scrolled out above, the reader is past it.
      const host = root ?? document.body;
      const sentinel = document.createElement("div");
      sentinel.setAttribute("aria-hidden", "true");
      Object.assign(sentinel.style, { position: "absolute", top: "0", left: "0", width: "1px", height: `${Math.max(1, showAfter)}px`, opacity: "0", pointerEvents: "none" });
      // An absolutely positioned child only scrolls with a scroller that is itself positioned.
      if (root && getComputedStyle(root).position === "static") {
        root.style.position = "relative";
        undo.push(() => {
          root.style.position = "";
        });
      }
      host.prepend(sentinel);
      undo.push(() => sentinel.remove());
      line = sentinel;
    } else {
      line = document.getElementById(showAfter);
    }

    if (line) {
      const watch = new IntersectionObserver(
        (entries) => {
          // Entries arrive oldest first; only the latest says where the reader is.
          const entry = entries[entries.length - 1];
          if (!entry) return;
          const top = entry.rootBounds?.top ?? root?.getBoundingClientRect().top ?? 0;
          setPast(!entry.isIntersecting && entry.boundingClientRect.bottom <= top);
        },
        { root },
      );
      watch.observe(line);
      undo.push(() => watch.disconnect());
    }

    const avoid = hideWhen ? document.getElementById(hideWhen) : null;
    if (avoid) {
      const watch = new IntersectionObserver((entries) => setBlocked(entries[entries.length - 1]?.isIntersecting ?? false), { root });
      watch.observe(avoid);
      undo.push(() => watch.disconnect());
    }
    return () => {
      for (const step of undo) step();
      setBlocked(false);
    };
  }, [showAfter, hideWhen, scrollRoot]);

  // Room for the bar at the end of the page while it shows, and for a focused field that the browser scrolls into view.
  useEffect(() => {
    const node = bar.current;
    if (!visible || !node) return;
    const root = scrollRoot?.current ?? null;
    const host = root ?? document.body;
    const scroller = root ?? document.documentElement;
    const hostBefore = host.style.paddingBottom;
    const scrollBefore = scroller.style.scrollPaddingBottom;
    const base = Number.parseFloat(getComputedStyle(host).paddingBottom) || 0;
    const room = () => {
      host.style.paddingBottom = `${base + node.offsetHeight}px`;
      scroller.style.scrollPaddingBottom = `${node.offsetHeight + 16}px`;
    };
    room();
    const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(room);
    resize?.observe(node);
    return () => {
      resize?.disconnect();
      host.style.paddingBottom = hostBefore;
      scroller.style.scrollPaddingBottom = scrollBefore;
    };
  }, [visible, scrollRoot]);

  /** Focus is inside the bar and shows its ring: the reader is on the keyboard, not on a pointer or a touch screen. */
  function focusIsKeyboard(): boolean {
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || !bar.current?.contains(active)) return false;
    try {
      return active.matches(":focus-visible");
    } catch {
      return false;
    }
  }

  function dismiss() {
    // Closing takes the bar out of reach, which would drop a keyboard reader's focus on the page. Hand it back to where it came from;
    // a pointer is left alone, so a touch screen never gets its on-screen keyboard back.
    const from = cameFrom.current;
    if (from?.isConnected && focusIsKeyboard()) from.focus();
    setDismissed(true);
    if (storageKey) {
      try {
        window.sessionStorage.setItem(storageKey, "1");
      } catch {
        /* See above. */
      }
    }
    onDismiss?.();
  }

  return (
    <aside
      ref={bar}
      data-slot="sticky-cta-bar"
      data-state={visible ? "visible" : "hidden"}
      aria-label={label}
      inert={!visible}
      className={cn(
        // On a phone the bar is a full-width strip that also fills the safe area under it; from 640px it floats as a card.
        "inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom,0px)] text-card-foreground",
        "sm:pointer-events-none sm:border-t-0 sm:bg-transparent sm:px-4 sm:pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        scrollRoot ? "absolute" : "fixed",
        "transition-[translate,opacity,visibility] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:duration-200",
        "data-[state=hidden]:invisible data-[state=hidden]:opacity-0 motion-safe:data-[state=hidden]:translate-y-full",
        className,
      )}
      onFocus={(event) => {
        const from = event.relatedTarget;
        if (from instanceof HTMLElement && !event.currentTarget.contains(from)) cameFrom.current = from;
        onFocus?.(event);
      }}
      {...props}
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 sm:pointer-events-auto sm:gap-4 sm:rounded-xl sm:border sm:border-border sm:bg-card sm:py-2.5 sm:pr-2.5 sm:pl-5 sm:shadow-sm">
        <div className="min-w-0 flex-1">
          {/* Up to three balanced lines on a phone, where the button takes its share of the strip; one line from 640px, where balancing would only cut it short. */}
          <p className="line-clamp-3 text-sm leading-snug font-medium text-balance sm:line-clamp-1 sm:text-[0.9375rem] sm:text-wrap">{label}</p>
          {description ? <p className="mt-0.5 hidden truncate text-[0.8125rem] text-muted-foreground sm:block">{description}</p> : null}
        </div>
        <div className="shrink-0">{action}</div>
        {dismissible ? (
          <Button type="button" variant="ghost" size="icon-sm" aria-label={dismissLabel} onClick={dismiss} className="-mr-1.5 shrink-0 text-muted-foreground hover:text-foreground sm:mr-0">
            <IconClose />
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
