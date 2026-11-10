import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface FooterCurtainProps extends Omit<ComponentProps<"div">, "children"> {
  /** The page: everything above the footer. It becomes an opaque layer that slides up over the footer, so give it content that fills the width. */
  children: ReactNode;
  /** The footer that waits underneath. Its height must stay below the height of the window, or the top of it is cut off; where the window is shorter than `minViewportHeight` it is an ordinary footer. */
  footer: ReactNode;
  /** The shortest window height, in pixels, in which the footer is uncovered. In a shorter one, where a revealed footer would not fit, the page and the footer simply follow each other. Default 640. */
  minViewportHeight?: number;
}

/**
 * A footer that stays put while the page slides up over it, uncovering the
 * footer like a curtain at the end of the scroll. The page sits on an opaque,
 * raised layer and the footer is sticky to the bottom edge of the window beneath
 * it, so scrolling to the end lifts the page off it. It is pure CSS (sticky
 * positioning and stacking): no scroll listener, and it works with native scroll
 * and with smooth-scroll libraries alike. Nothing moves except the page, so
 * reduced motion needs no special case. A height media query switches the effect
 * off in windows shorter than `minViewportHeight`, where a revealed footer would
 * be cut off, and in print; the footer then follows the page as usual. Keyboard
 * focus inside the footer lifts the curtain at once, so a focused link is never
 * hidden under the page. No state of its own, so it renders on the server.
 */
export function FooterCurtain({ children, footer, minViewportHeight = 640, className, ...props }: FooterCurtainProps) {
  const min = Math.max(0, Math.round(minViewportHeight));
  // The rules are scoped to the height this instance was given, so two curtains with different heights do not touch each other.
  const rules = `@media (min-height:${min}px){[data-curtain="${min}"]>[data-slot="footer-curtain-footer"]{position:sticky;bottom:0}[data-curtain="${min}"]:has([data-slot="footer-curtain-footer"] :focus-visible)>[data-slot="footer-curtain-footer"]{position:relative}}@media print{[data-slot="footer-curtain-footer"]{position:static!important}}`;

  return (
    <div data-slot="footer-curtain" data-curtain={min} className={cn("relative isolate", className)} {...props}>
      <style dangerouslySetInnerHTML={{ __html: rules }} />
      <div data-slot="footer-curtain-page" className="relative z-10 border-b border-border bg-background shadow-sm">
        {children}
      </div>
      <div data-slot="footer-curtain-footer" className="relative z-0">
        {footer}
      </div>
    </div>
  );
}
