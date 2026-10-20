"use client";

import Lenis from "lenis";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentPropsWithoutRef } from "react";

import { usePrefersReducedMotion } from "@rhs-ui/motion/use-in-view";
import { cn } from "@/lib/utils";

export type SmoothScrollTarget = number | string | HTMLElement;

export interface SmoothScrollApi {
  /** Scroll to a position in pixels, an element, or a selector such as "#pricing". `offset` moves the landing spot by that many pixels. Without smoothing it jumps instead. */
  scrollTo: (target: SmoothScrollTarget, offset?: number) => void;
  /** True while the eased scrolling is running: false on touch, under reduced motion, when `enabled` is off, and before the first effect. */
  active: boolean;
}

/** Nested scrollers, menus and dialogs keep the browser's own scrolling. */
const PREVENT = '[data-lenis-prevent], [data-radix-popper-content-wrapper], [role="listbox"], [role="menu"], [role="dialog"]';

/** The scroll without smoothing: where the browser would land, honouring the target's own scroll-margin. */
function jump(scroller: HTMLElement | null, target: SmoothScrollTarget, offset: number): void {
  let top: number;
  if (typeof target === "number") top = target;
  else {
    let element: HTMLElement | null = null;
    try {
      element = typeof target === "string" ? (target === "#" ? null : document.querySelector<HTMLElement>(target)) : target;
    } catch {
      // Not a selector: treat it as missing rather than throw inside a click handler.
    }
    if (!element) top = 0;
    else {
      const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0;
      const origin = scroller ? scroller.getBoundingClientRect().top - scroller.scrollTop : -window.scrollY;
      top = element.getBoundingClientRect().top - origin - margin;
    }
  }
  (scroller ?? window).scrollTo({ top: top + offset, behavior: "auto" });
}

/** A jump moves focus too, as a normal anchor would, so a keyboard or screen reader user lands where the page did. */
function focusTarget(element: HTMLElement): void {
  if (!element.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(element.tagName)) {
    element.setAttribute("tabindex", "-1");
    element.addEventListener("blur", () => element.removeAttribute("tabindex"), { once: true });
  }
  element.focus({ preventScroll: true });
}

const SmoothScrollContext = createContext<SmoothScrollApi>({ scrollTo: (target, offset = 0) => jump(null, target, offset), active: false });

/** Jump around the page from your own buttons. Outside a provider it still works, as a plain jump. */
export function useSmoothScroll(): SmoothScrollApi {
  return useContext(SmoothScrollContext);
}

export interface SmoothScrollProps extends ComponentPropsWithoutRef<"div"> {
  /** Seconds a wheel step takes to settle, on an expo-out ease. The default 1.2 is unhurried; 0.8 is brisk. */
  duration?: number;
  /** Instead of a duration: the share of the remaining distance covered each frame, from 0 to 1. 0.1 is gentle, 0.2 is snappy. */
  lerp?: number;
  /** Scales how far one wheel notch travels. */
  wheelMultiplier?: number;
  /** `true` smooths the page. `false` smooths this element's own scrolling: give it a height with `className`. */
  root?: boolean;
  /** Glide to same-page #links with the same ease, update the address and move focus as a normal jump would. */
  anchors?: boolean;
  /** Turn the smoothing off without removing the provider. `scrollTo` still works, as a plain jump. */
  enabled?: boolean;
}

/**
 * Eased, inertial wheel scrolling for the page or for one scrolling box,
 * built on Lenis. It only drives the scroll position the browser already
 * has, so content works if the script fails, and it steps aside for everyone
 * who does not want it: touch screens, reduced motion, nested scrollers, open
 * dialogs. The scrollbar, Page Up and Down, Home and End and anchors keep
 * their native feel, and an ease that is running hands over the moment one of
 * them takes the scroll, so the page never snaps back.
 */
export function SmoothScroll({ duration, lerp, wheelMultiplier = 1, root = true, anchors = true, enabled = true, className, children, ...props }: SmoothScrollProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const wake = useRef<() => void>(() => {});
  const reduced = usePrefersReducedMotion();
  const [coarse, setCoarse] = useState<boolean | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  // Touch keeps its native momentum. Null until measured, so no instance is built and torn down on a phone.
  useEffect(() => {
    const query = window.matchMedia("(pointer: coarse)");
    const sync = (): void => setCoarse(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const run = enabled && !reduced && coarse === false;

  useEffect(() => {
    if (!run) return;
    const scroller = root ? null : wrapper.current;
    if (!root && (!scroller || !content.current)) return;
    const instance = new Lenis({
      ...(scroller && content.current ? { wrapper: scroller, content: content.current } : {}),
      ...(duration === undefined && lerp !== undefined ? { lerp } : { duration: duration ?? 1.2 }),
      wheelMultiplier,
      smoothWheel: true,
      syncTouch: false,
      allowNestedScroll: true,
      prevent: (node) => node.matches(PREVENT),
      // A scrolling box at its end hands the wheel to the page, as the browser would.
      virtualScroll: scroller
        ? ({ deltaY }) => !((deltaY < 0 && scroller.scrollTop <= 0) || (deltaY > 0 && scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 1))
        : undefined,
    });

    // One frame loop, only while something moves. A long task (hydration, say) must not eat an ease in a single frame.
    let frame = 0;
    let last = 0;
    let clock = 1;
    let still = 0;
    const tick = (now: number): void => {
      const step = now - last;
      last = now;
      clock += step > 150 ? 16 : step;
      instance.raf(clock);
      still = instance.isScrolling ? 0 : still + 1;
      frame = still > 10 ? 0 : requestAnimationFrame(tick);
    };
    const start = (): void => {
      still = 0;
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    wake.current = start;
    const stopListening = instance.on("virtual-scroll", start);

    // A native scroll that arrives mid-ease (scrollbar drag, Page Down, an anchor) would be overwritten by the ease
    // and the page would snap back. Lenis only adopts native scrolls while idle, so adopt them here.
    const source: Window | HTMLElement = scroller ?? window;
    const adopt = (): void => {
      if (instance.isScrolling === "smooth" && Math.abs(instance.actualScroll - instance.animatedScroll) > 3) instance.scrollTo(instance.actualScroll, { immediate: true, force: true });
    };
    source.addEventListener("scroll", adopt, { passive: true });

    // Dialogs and drawers lock the body; Lenis would still scroll the page behind them.
    let lock: MutationObserver | undefined;
    if (!scroller) {
      const sync = (): void => {
        const body = getComputedStyle(document.body);
        if (document.body.hasAttribute("data-scroll-locked") || body.overflow === "hidden" || body.position === "fixed") instance.stop();
        else instance.start();
      };
      lock = new MutationObserver(sync);
      lock.observe(document.body, { attributes: true, attributeFilter: ["style", "data-scroll-locked"] });
      sync();
    }

    // Same-page links: ease there, keep the address bar and the focus honest.
    const area: Document | HTMLElement = scroller ?? document;
    const onClick = (event: Event): void => {
      if (!(event instanceof MouseEvent) || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const url = new URL(link.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      const hash = link.getAttribute("href") === "#" ? "#" : url.hash;
      if (!hash) return;
      let element: HTMLElement | null = null;
      try {
        const id = decodeURIComponent(hash.slice(1));
        element = id ? document.getElementById(id) : null;
        // Not on this page, or outside this box: the browser deals with it.
        if (id && (!element || (scroller && !scroller.contains(element)))) return;
      } catch {
        return;
      }
      event.preventDefault();
      // A frame later, so a menu that closes on this same click has let go of the page first.
      requestAnimationFrame(() => {
        instance.resize();
        instance.scrollTo(element ?? 0, { force: true });
        start();
      });
      if (!scroller) {
        // A bare "#" goes to the top and, as in the browser, clears the fragment, so a reload does not jump back to the last section.
        const top = hash === "#";
        if (top ? location.hash !== "" : location.hash !== hash) history.pushState(history.state, "", top ? location.pathname + location.search : hash);
      }
      if (element) focusTarget(element);
    };
    if (anchors) area.addEventListener("click", onClick, true);

    setLenis(instance);
    return () => {
      cancelAnimationFrame(frame);
      wake.current = () => {};
      stopListening();
      source.removeEventListener("scroll", adopt);
      area.removeEventListener("click", onClick, true);
      lock?.disconnect();
      instance.destroy();
      setLenis(null);
    };
  }, [run, root, duration, lerp, wheelMultiplier, anchors]);

  const scrollTo = useCallback<SmoothScrollApi["scrollTo"]>(
    (target, offset = 0) => {
      if (!lenis) {
        jump(root ? null : wrapper.current, target, offset);
        return;
      }
      // Lenis stops at the page height it last measured, which may be a layout behind.
      lenis.resize();
      lenis.scrollTo(target, { offset, force: true });
      wake.current();
    },
    [lenis, root],
  );
  const api = useMemo<SmoothScrollApi>(() => ({ scrollTo, active: lenis !== null }), [scrollTo, lenis]);

  return (
    <SmoothScrollContext.Provider value={api}>
      {root ? (
        <div data-slot="smooth-scroll" data-active={api.active || undefined} className={cn("contents", className)} {...props}>
          {children}
        </div>
      ) : (
        <div ref={wrapper} data-slot="smooth-scroll" data-active={api.active || undefined} className={cn("relative overflow-y-auto", className)} {...props}>
          <div ref={content}>{children}</div>
        </div>
      )}
    </SmoothScrollContext.Provider>
  );
}
