"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DotsRailProps extends Omit<ComponentProps<"nav">, "children" | "onClickCapture"> {
  /** The ids of the sections, in the order they appear on the page. */
  ids: readonly string[];
  /** The pixels a fixed header covers at the top: a section counts as current once its top passes this line, and a click scrolls it to rest just below. */
  offset: number;
  /** A CSS selector for the element that scrolls, when it is not the window. */
  scrollContainer?: string;
  /** The dots, already rendered by the rail's server half: a list item with a link each, marked `data-dot` with the section's id. */
  children: ReactNode;
}

/** Where the scroll is measured and applied: the window, or the container the page scrolls in. */
function scrollerOf(selector: string | undefined): HTMLElement | null {
  if (!selector) return null;
  try {
    return document.querySelector<HTMLElement>(selector);
  } catch {
    // A selector the browser cannot parse falls back to the window instead of taking the page down.
    return null;
  }
}

/**
 * The client half of SectionDotsNav: it finds the section in view with an
 * IntersectionObserver (a band from the header down to 40% of the window, with
 * the last section taking over at the very end of the page) and marks that
 * dot with aria-current="location", and it scrolls to a section when its dot is
 * chosen, smoothly or at once under reduced motion. The dots are real links the
 * server rendered, so they work before this script loads, and the mark is written
 * on them directly: this holds no routes and takes no component as a prop.
 */
export function DotsRail({ ids, offset, scrollContainer, className, children, ...props }: DotsRailProps) {
  const nav = useRef<HTMLElement>(null);
  const [active, setActive] = useState(ids[0] ?? "");
  /** Until this time (ms) the scroll is ours, so the rail does not flicker through every section on the way to the one chosen. */
  const lockUntil = useRef(0);
  const repick = useRef<() => void>(() => {});
  const timer = useRef(0);
  const key = ids.join("\n");

  // A click starts a timer that looks again once the scroll has ended; it does not outlive the rail.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // After every render, so a parent that renders the dots again does not lose the mark.
  useEffect(() => {
    for (const link of Array.from(nav.current?.querySelectorAll<HTMLAnchorElement>("a[data-dot]") ?? [])) {
      if (link.dataset.dot === active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  });

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const list = key.split("\n").filter(Boolean);
    const root = scrollerOf(scrollContainer);
    const visible = new Set<string>();
    let atEnd = false;
    const pick = () => {
      if (performance.now() < lockUntil.current) return;
      const last = list[list.length - 1];
      if (atEnd && last) {
        setActive(last);
        return;
      }
      const hit = [...list].reverse().find((id) => visible.has(id));
      if (hit) setActive(hit);
    };
    repick.current = pick;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) visible.add(id);
          else visible.delete(id);
        }
        pick();
      },
      { root, rootMargin: `-${Math.max(0, offset)}px 0px -60% 0px` },
    );
    for (const id of list) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }
    // The last section may be too short to reach the band: at the very end of the page it is the current one.
    const source: Window | HTMLElement = root ?? window;
    const measureEnd = () => {
      const top = root ? root.scrollTop : window.scrollY;
      const height = root ? root.clientHeight : window.innerHeight;
      const full = root ? root.scrollHeight : document.documentElement.scrollHeight;
      const now = full - height > 8 && top + height >= full - 2;
      if (now === atEnd) return;
      atEnd = now;
      pick();
    };
    source.addEventListener("scroll", measureEnd, { passive: true });
    measureEnd();
    return () => {
      observer.disconnect();
      source.removeEventListener("scroll", measureEnd);
    };
  }, [key, offset, scrollContainer]);

  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = (event.target as Element).closest<HTMLAnchorElement>("a[data-dot]")?.dataset.dot;
    const section = id ? document.getElementById(id) : null;
    // Not one of ours, or a section that is not on the page: the browser's own jump is the fallback.
    if (!id || !section) return;
    event.preventDefault();
    // A router's Link would handle the click itself, and jump: this runs first and takes it over.
    event.stopPropagation();
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    const root = scrollerOf(scrollContainer);
    const gap = Math.max(0, offset);
    if (root) root.scrollTo({ top: section.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - gap, behavior });
    else window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - gap, behavior });
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    setActive(id);
    lockUntil.current = performance.now() + 900;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => repick.current(), 950);
    // Focus goes to the section, so a keyboard or screen reader user continues from there. It is not a control, so it shows no ring.
    if (!section.hasAttribute("tabindex")) {
      section.setAttribute("tabindex", "-1");
      section.style.outline = "none";
    }
    section.focus({ preventScroll: true });
  };

  return (
    // One handler for the dots inside, which are real links: delegation, not a control of its own.
    <nav ref={nav} data-slot="section-dots-nav" onClickCapture={onClickCapture} className={cn("fixed top-1/2 z-30 hidden -translate-y-1/2 lg:block print:hidden", className)} {...props}>
      <ul className="flex flex-col items-center">{children}</ul>
    </nav>
  );
}
