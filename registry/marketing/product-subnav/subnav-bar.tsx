"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { EdgeFadeScroller } from "@rhs-ui/motion/edge-fade-scroller";
import { subnavLink } from "@rhs-ui/marketing/product-subnav/styles";
import { cn } from "@/lib/utils";

export interface SubnavSection {
  /** The link text: "Specs". */
  label: string;
  /** A fragment link to an element of the page: "#specs". */
  href: string;
}

export interface SubnavBarProps extends Omit<ComponentProps<"nav">, "children"> {
  /** The product's name, shown at the left of the bar once the big one has scrolled away. */
  name: string;
  /** The pixels above the bar that something else covers: the main navbar. */
  offset: number;
  /** The name of the navigation landmark. */
  navLabel: string;
  /** Pages mode: the list items of the product's pages, already rendered by the server half. */
  children?: ReactNode;
  /** Anchors mode: the sections of the page. The bar renders these itself and follows the scroll. */
  sections?: readonly SubnavSection[];
  /** In anchors mode, holds the mark on one section instead of following the scroll. */
  currentHref?: string;
  /** The one action, pinned to the right. */
  action?: ReactNode;
}

/** The width in pixels of the fade at an edge of the row of links: a current link is brought at least this far from it. */
const FADE = 40;

/** The nearest ancestor that scrolls on its own (an app layout, a preview frame), or null when the window does. */
function scrollParent(node: HTMLElement): HTMLElement | null {
  for (let parent = node.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return parent;
  }
  return null;
}

/** A fragment, decoded; one that is not valid percent-encoding is used as it is rather than throwing on a click. */
function idOf(href: string): string {
  const raw = href.startsWith("#") ? href.slice(1) : href;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/** The heading of a section, so focus lands on what the reader came for. */
function focusHeading(section: HTMLElement) {
  const heading = /^H[1-6]$/.test(section.tagName) ? section : (section.querySelector<HTMLElement>("h1, h2, h3, h4, h5, h6") ?? section);
  if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
}

/**
 * The client half of ProductSubnav. It is sticky and, from md up, 56px tall
 * with its hairline. One IntersectionObserver on a probe tells it when it has
 * reached its place under the main navbar (no scroll handler for that): from
 * then on the product's name appears at its left, as the big one has gone. In
 * anchors mode it also follows the scroll to mark the section in view with
 * aria-current="location", scrolls to a section when a link is chosen
 * (smoothly, or at once under reduced motion) with the bar and the navbar above
 * it cleared, and moves focus to that section's heading. The links of pages
 * mode are rendered on the server, so this takes no component as a prop. On a
 * phone the links are a row of their own under the name that scrolls sideways,
 * with fading edges, and the current one is kept in view.
 */
export function SubnavBar({ name, offset, navLabel, children, sections, currentHref, action, className, style, onClick, ...props }: SubnavBarProps) {
  const bar = useRef<HTMLElement>(null);
  const probe = useRef<HTMLSpanElement>(null);
  /** Until this time (ms) the scroll is ours, so the mark does not flicker through every section on the way. */
  const lockUntil = useRef(0);
  const settled = useRef<Element | null>(null);
  const [stuck, setStuck] = useState(false);
  const [spy, setSpy] = useState("");
  const anchors = Boolean(sections?.length);
  const active = currentHref !== undefined ? idOf(currentHref) : spy;
  const ids = (sections ?? []).map((section) => idOf(section.href)).join("\n");

  // Stuck: the probe sits offset + 1 pixels above the bar, so it crosses the top edge of the scroll area exactly when the bar reaches its place.
  // The observed area is everything above that edge, so "intersecting" simply means "stuck", and it still flips when the scroll position jumps.
  useEffect(() => {
    const node = bar.current;
    const mark = probe.current;
    if (!node || !mark || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (entry) setStuck(entry.isIntersecting);
      },
      { root: scrollParent(node), rootMargin: "100000px 0px -100% 0px", threshold: 0 },
    );
    observer.observe(mark);
    return () => observer.disconnect();
  }, []);

  // Anchors mode: the section in view is the last one whose top has passed the line just under the bar.
  useEffect(() => {
    const node = bar.current;
    if (!node || !anchors || currentHref !== undefined) return;
    const scroller = scrollParent(node);
    const source: HTMLElement | Window = scroller ?? window;
    const known = ids.split("\n").filter(Boolean);
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (performance.now() < lockUntil.current) return;
      const nodes = known.map((id) => document.getElementById(id)).filter((section): section is HTMLElement => section !== null);
      const line = (scroller?.getBoundingClientRect().top ?? 0) + offset + node.offsetHeight + 24;
      let found = "";
      for (const section of nodes) if (section.getBoundingClientRect().top <= line) found = section.id;
      const last = nodes[nodes.length - 1];
      const room = scroller ? scroller.scrollHeight - scroller.clientHeight : document.documentElement.scrollHeight - window.innerHeight;
      const at = scroller ? scroller.scrollTop : window.scrollY;
      // A last section too short to reach the line still counts once the page can scroll no further.
      if (last && room > 2 && at >= room - 2) found = last.id;
      setSpy(found);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const release = () => {
      lockUntil.current = 0;
      schedule();
    };
    measure();
    source.addEventListener("scroll", schedule, { passive: true });
    source.addEventListener("scrollend", release);
    window.addEventListener("resize", schedule);
    return () => {
      source.removeEventListener("scroll", schedule);
      source.removeEventListener("scrollend", release);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [ids, offset, anchors, currentHref]);

  // After every render: when the current link changes and is not fully in view, the row is scrolled (the row only, never the page)
  // just far enough to bring it clear of the fading edge. A link that is already in view leaves the row where it is.
  useEffect(() => {
    const row = bar.current?.querySelector<HTMLElement>('[data-slot="edge-fade-scroller"]');
    const current = row?.querySelector<HTMLElement>("[aria-current]") ?? null;
    if (!row || !current || current === settled.current) return;
    settled.current = current;
    const view = row.getBoundingClientRect();
    const link = current.getBoundingClientRect();
    if (link.left < view.left + FADE) row.scrollLeft += link.left - view.left - FADE;
    else if (link.right > view.right - FADE) row.scrollLeft += link.right - view.right + FADE;
  });

  const go = (target: HTMLElement) => {
    const node = bar.current;
    if (!node) return;
    const scroller = scrollParent(node);
    const base = scroller?.getBoundingClientRect().top ?? 0;
    const top = (scroller ? scroller.scrollTop : window.scrollY) + target.getBoundingClientRect().top - base - (offset + node.offsetHeight);
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    lockUntil.current = performance.now() + 900;
    (scroller ?? window).scrollTo({ top: Math.max(0, top), behavior });
    if (window.location.hash !== `#${target.id}`) window.history.replaceState(null, "", `#${target.id}`);
    setSpy(target.id);
    focusHeading(target);
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    onClick?.(event);
    if (!anchors || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest<HTMLAnchorElement>("a[href^='#']");
    const target = anchor ? document.getElementById(idOf(anchor.getAttribute("href") ?? "")) : null;
    if (!target) return;
    event.preventDefault();
    go(target);
  };

  return (
    // One click handler for the links inside, which are real anchors: delegation, not a control of its own.
    <nav
      ref={bar}
      data-slot="product-subnav"
      data-stuck={stuck}
      aria-label={navLabel}
      onClick={handleClick}
      className={cn("group/subnav sticky z-30 border-b border-border bg-background", className)}
      style={{ top: offset, ...style }}
      {...props}
    >
      <span ref={probe} aria-hidden="true" className="pointer-events-none absolute inset-x-0 h-px" style={{ top: -(Math.max(0, offset) + 1) }} />
      {/* The bar sits close to its edges so the name, the links and the action, each with padding of its own, line up with the page margin; the padding is the same on both sides, so the links are centred on the page. */}
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] gap-x-4 pr-4 pl-1 sm:px-3 md:grid-cols-[minmax(auto,1fr)_minmax(0,auto)_minmax(auto,1fr)]">
        {/* The name waits for the big one to scroll away and then takes its place at the left. Its row is kept, on a phone, so nothing moves when it arrives. */}
        <p
          className={cn(
            "col-start-1 row-start-1 flex h-11 min-w-0 items-center pl-3 text-sm font-semibold tracking-[-0.02em] md:h-[55px]",
            "invisible opacity-0 transition-[opacity,translate,visibility] duration-200 motion-reduce:transition-none motion-safe:-translate-x-1",
            "group-data-[stuck=true]/subnav:visible group-data-[stuck=true]/subnav:translate-x-0 group-data-[stuck=true]/subnav:opacity-100",
          )}
        >
          <span className="truncate">{name}</span>
        </p>

        <div className="col-start-1 row-start-2 min-w-0 md:col-start-2 md:row-start-1">
          <EdgeFadeScroller>
            <ul className="flex w-max min-w-full items-center gap-0.5 md:justify-center">
              {anchors
                ? sections?.map((section) => (
                    <li key={`${section.label}-${section.href}`}>
                      <a href={section.href} aria-current={idOf(section.href) === active ? "location" : undefined} className={subnavLink}>
                        {section.label}
                      </a>
                    </li>
                  ))
                : children}
            </ul>
          </EdgeFadeScroller>
        </div>

        {/* On a phone the action stands on the row of the links, stuck or not: the row above is kept for the name, and is empty until the name arrives. */}
        {action ? <div className="col-start-2 row-start-2 flex items-center self-center sm:pr-3 md:col-start-3 md:row-start-1 md:justify-end">{action}</div> : null}
      </div>
    </nav>
  );
}
