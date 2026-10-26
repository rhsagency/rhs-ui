"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export interface LoadingOverlayProps extends Omit<ComponentProps<"div">, "children"> {
  /** Covers the content while true. */
  loading: boolean;
  /** What is happening, in a few words. It is written on the overlay and announced once to screen readers. Default "Loading". */
  label?: string;
  /** How long loading must last before the overlay appears, in ms, so a quick refresh never flashes. Default 200. */
  delay?: number;
  /** Once it has appeared, the least time it stays, in ms, so it never blinks. Default 400. */
  minDuration?: number;
  /** Blur what is underneath. Off by default: the scrim already marks the content as stale, and a blur costs readability. */
  blur?: boolean;
  /** The region to cover. Give the component the radius of that region (`className="rounded-xl"`) and the overlay follows it. */
  children?: ReactNode;
}

/** The length of the fade, in ms. Matches duration-200 below. */
const FADE = 200;

/**
 * True once `active` has been on for `delay` ms, and false again `minDuration`
 * ms after it turned true at the earliest. A flash shorter than `delay` never
 * shows, and nothing that shows disappears at once.
 */
function useHeldFlag(active: boolean, delay: number, minDuration: number): boolean {
  const [on, setOn] = useState(() => active && delay <= 0);
  const since = useRef(0);
  useEffect(() => {
    if (active) {
      if (on) {
        if (!since.current) since.current = performance.now();
        return;
      }
      const timer = window.setTimeout(() => {
        since.current = performance.now();
        setOn(true);
      }, Math.max(0, delay));
      return () => window.clearTimeout(timer);
    }
    if (!on) return;
    const wait = Math.max(0, minDuration - (performance.now() - since.current));
    const timer = window.setTimeout(() => {
      since.current = 0;
      setOn(false);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [active, on, delay, minDuration]);
  return on;
}

/**
 * Covers a card, a table or a form while it refreshes: a scrim, a spinner and
 * a short label over the content, which stays where it is. What lies underneath
 * is stale, so it is made inert and marked busy: it cannot be clicked, tabbed
 * into or read as current while the overlay is up. The overlay waits `delay`
 * ms before it appears, so a quick load never flashes, and stays `minDuration`
 * ms once it has, so it never blinks. A visually hidden status announces the
 * label once. If focus was inside the content, it is parked on the overlay and
 * handed back afterwards, so a keyboard user keeps their place. Under reduced
 * motion the fade is off and the spinner pulses slowly.
 */
export function LoadingOverlay({ loading, label = "Loading", delay = 200, minDuration = 400, blur = false, className, children, ...props }: LoadingOverlayProps) {
  const shown = useHeldFlag(loading, delay, minDuration);
  // The label stays on the overlay while it fades out, then the spinner is dropped so it does not animate unseen.
  const [present, setPresent] = useState(shown);
  if (shown && !present) setPresent(true);
  useEffect(() => {
    if (shown || !present) return;
    const timer = window.setTimeout(() => setPresent(false), FADE + 20);
    return () => window.clearTimeout(timer);
  }, [shown, present]);

  const content = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const parked = useRef<HTMLElement | null>(null);
  // Making an element inert drops focus to the page. Park it on the overlay instead, and give it back when the overlay goes.
  useLayoutEffect(() => {
    if (shown) {
      const active = document.activeElement;
      if (active instanceof HTMLElement && content.current?.contains(active)) {
        parked.current = active;
        layer.current?.focus({ preventScroll: true });
      }
      return;
    }
    const back = parked.current;
    parked.current = null;
    const focus = document.activeElement;
    if (back?.isConnected && (focus === document.body || (focus !== null && layer.current?.contains(focus)))) back.focus({ preventScroll: true });
  }, [shown]);

  return (
    <>
      <div data-slot="loading-overlay" data-loading={shown ? "true" : undefined} aria-busy={loading || undefined} className={cn("relative", className)} {...props}>
        {/* display: contents keeps the children laid out as if the wrapper was not there; inertness follows the DOM, not the boxes. */}
        <div ref={content} className="contents" inert={shown}>
          {children}
        </div>
        <div
          ref={layer}
          tabIndex={-1}
          data-slot="loading-overlay-layer"
          data-state={shown ? "visible" : "hidden"}
          // Named while it is up, so focus that was parked on it is not a blank spot to a screen reader.
          role={shown ? "group" : undefined}
          aria-label={shown ? label : undefined}
          aria-hidden={shown ? undefined : true}
          className={cn(
            "absolute inset-0 z-10 rounded-[inherit] bg-background/70 outline-none transition-opacity duration-200 motion-reduce:transition-none",
            blur && "backdrop-blur-[2px]",
            shown ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {present ? (
            // Sticky and at most one screen tall, so on a long table the label stays in view instead of sitting in the middle of the page.
            <div className="sticky top-0 grid h-[min(100%,100dvh)] place-items-center p-4">
              <div aria-hidden="true" className="flex max-w-full items-center gap-2.5 rounded-full border border-border bg-popover px-3.5 py-2 text-sm font-medium text-popover-foreground shadow-sm">
                <Spinner size={16} label="" aria-hidden="true" role="presentation" className="text-muted-foreground" />
                <span className="min-w-0 truncate">{label}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {/* Outside the busy region: a live region inside aria-busy is held back by some screen readers until the region is no longer busy. */}
      <span role="status" className="sr-only">
        {shown ? label : ""}
      </span>
    </>
  );
}
