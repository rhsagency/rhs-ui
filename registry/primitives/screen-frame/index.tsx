import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { ScreenFrameShell, type ScreenFrameProps, type ScreenFrameScroll } from "./shell";

export type { ScreenFrameProps, ScreenFrameScroll };

/**
 * A frame that fills the visible screen, for tools and mobile web apps where
 * the page itself must not scroll: a header and a footer that stay put, and
 * a middle that scrolls. It is as tall as the dynamic viewport, so the
 * browser bar never covers the footer; it keeps clear of the safe area
 * around a notch and a home indicator (set `viewport-fit=cover` on the
 * viewport meta tag for the browser to report them); and with `keyboardAware`
 * it follows the on-screen keyboard through the visual viewport, so a
 * composer in the footer stays above it. The body is the one scroll
 * container, with the overscroll contained so it never drags the page, and
 * the trap of nested flex boxes (a child that will not shrink, so nothing
 * scrolls and the footer is pushed away) is solved inside. With
 * `scroll="none"` the body becomes a row of `ScreenFrame.Pane`, each of which
 * scrolls on its own: a list beside an editor. Header and footer are
 * landmarks; `main` is left to you. To fill a box instead of the screen, give
 * the frame a height of its own.
 */
export function ScreenFrame(props: ScreenFrameProps) {
  return <ScreenFrameShell {...props} />;
}

export interface ScreenFramePaneProps extends ComponentProps<"div"> {
  /** The element to render: a `section` for a region, an `aside` for a side column, a `nav` for a list of places. Default `div`. */
  as?: "div" | "section" | "aside" | "nav";
}

/**
 * One column of a `scroll="none"` frame. It fills the height of the frame and
 * scrolls on its own, so a long list on one side never moves the editor on
 * the other. It takes focus, so the keyboard can scroll it, and gives a visible
 * ring when it has it. Give it a width (`w-72 flex-none`) or let the panes share
 * the room.
 */
function ScreenFramePane({ as = "div", className, ...props }: ScreenFramePaneProps) {
  const Tag = as as "div";
  // A scroll container takes focus so the keyboard can scroll it; once it has a name, a plain div is a region too.
  const named = Boolean(props["aria-label"] ?? props["aria-labelledby"]);
  return (
    <Tag
      data-slot="screen-frame-pane"
      tabIndex={0}
      role={as === "div" && named ? "region" : undefined}
      className={cn("relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset", className)}
      {...props}
    />
  );
}

ScreenFrame.Pane = ScreenFramePane;
