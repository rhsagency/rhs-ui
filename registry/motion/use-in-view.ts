"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element has entered the viewport (or immediately when the
 * browser has no IntersectionObserver). With `once`, it never turns false
 * again, so an entrance plays one time.
 */
export function useInView(ref: RefObject<Element | null>, { once = true, margin = "0px 0px -10% 0px" }: { once?: boolean; margin?: string } = {}): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) setInView(false);
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, once, margin]);
  return inView;
}

/** True when the reader asked for less motion. False on the server. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const change = () => setReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  return reduced;
}
