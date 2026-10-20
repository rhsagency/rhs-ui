"use client";

import { useEffect, useRef, useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { flushSync } from "react-dom";

import { useInView } from "@rhs-ui/motion/use-in-view";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export interface RenderOnViewProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** The expensive part: a map, a chart, an embed. Nothing of it renders until the placeholder is near the screen. */
  children: ReactNode;
  /** What stands in until then. Defaults to a quiet skeleton that fills the reserved space. */
  fallback?: ReactNode;
  /** Height to hold, in pixels or any CSS length. Match what the content will measure and nothing shifts when it arrives. */
  minHeight?: number | string;
  /** Hold the height by proportion instead, as width / height (16 / 9). Wins over `minHeight`. */
  ratio?: number;
  /** How early to start, as a CSS `rootMargin`. The default is one screen above and below, so it is ready on arrival. */
  rootMargin?: string;
  /** Keep the content once it has rendered. Turn it off to unmount it again when it is far away; the space is kept. */
  once?: boolean;
  /** Called each time the content mounts, for analytics or to start a clock. */
  onVisible?: () => void;
  /** Render now, for print, crawlers and tests. Printing renders everything on its own as well. */
  forceRender?: boolean;
}

/**
 * Holds back heavy content (a map, a chart, an embed) until it is about to be
 * seen. The placeholder reserves the final height, so the page never jumps,
 * and the content mounts a screen early, so it is ready when the reader gets
 * there. A browser without IntersectionObserver renders at once. Keep headings
 * and landmarks outside it: only the expensive part waits, and the outline of
 * the page is always complete.
 */
export function RenderOnView({ children, fallback, minHeight = 192, ratio, rootMargin = "100% 0px", once = true, onVisible, forceRender = false, className, style, ...props }: RenderOnViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once, margin: rootMargin });
  const [printing, setPrinting] = useState(false);
  const [held, setHeld] = useState<number>();
  const mounted = forceRender || printing || near;
  const notify = useRef(onVisible);

  useEffect(() => {
    notify.current = onVisible;
  });
  useEffect(() => {
    if (mounted) notify.current?.();
  }, [mounted]);

  // Print preview happens before the next scroll event: mount everything first.
  useEffect(() => {
    const show = () => flushSync(() => setPrinting(true));
    window.addEventListener("beforeprint", show);
    return () => window.removeEventListener("beforeprint", show);
  }, []);

  // When the content can unmount, remember how tall it was so the space stays.
  useEffect(() => {
    const node = ref.current;
    if (!node || !mounted || once || ratio || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setHeld(node.offsetHeight));
    observer.observe(node);
    return () => observer.disconnect();
  }, [mounted, once, ratio]);

  return (
    <div
      ref={ref}
      data-slot="render-on-view"
      data-state={mounted ? "ready" : "waiting"}
      aria-busy={mounted ? undefined : true}
      className={cn("relative rounded-lg", className)}
      // While the content is there its own height decides, so the measure can fall as well as rise; the last measure only holds the space once it has gone.
      style={ratio ? { aspectRatio: ratio, ...style } : { minHeight: mounted ? minHeight : (held ?? minHeight), ...style }}
      {...props}
    >
      {mounted ? children : (fallback ?? <Skeleton className="absolute inset-0 rounded-[inherit]" />)}
    </div>
  );
}
