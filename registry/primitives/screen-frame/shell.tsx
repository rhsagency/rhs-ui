"use client";

import { useEffect, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** What the body of the frame does with content that is taller than it: scrolls (`body`), or leaves the scrolling to the panes inside (`none`). */
export type ScreenFrameScroll = "body" | "none";

export interface ScreenFrameProps extends Omit<ComponentProps<"div">, "children"> {
  /** The middle of the frame: the one part that scrolls. Put your `main` here. */
  children: ReactNode;
  /** The top bar, in a `header` landmark. It stays put. */
  header?: ReactNode;
  /** The bottom bar, in a `footer` landmark: a tab bar, a composer, a row of actions. It stays put. */
  footer?: ReactNode;
  /** `body` makes the middle one scrolling area. `none` makes it a row of panes, each of which scrolls on its own: fill it with `ScreenFrame.Pane`. Default `body`. */
  scroll?: ScreenFrameScroll;
  /** Follow the on-screen keyboard through the visual viewport, so a footer with an input in it stays above the keyboard. Default `true`. */
  keyboardAware?: boolean;
  /** The height of the keyboard in pixels, when you know it and do not want it measured: a native shell that reports it, or a demo. It replaces the measured value. */
  keyboardInset?: number;
  /** Classes for the middle of the frame. */
  bodyClassName?: string;
  /** Classes for the `header`. */
  headerClassName?: string;
  /** Classes for the `footer`. */
  footerClassName?: string;
}

/**
 * The part of ScreenFrame that needs the browser: it reads the on-screen
 * keyboard. Use `ScreenFrame` from the folder's index, which adds `Pane`.
 */
export function ScreenFrameShell({
  children,
  header,
  footer,
  scroll = "body",
  keyboardAware = true,
  keyboardInset,
  bodyClassName,
  headerClassName,
  footerClassName,
  className,
  style,
  ...props
}: ScreenFrameProps) {
  const [measured, setMeasured] = useState(0);

  // The on-screen keyboard shrinks the visual viewport and nothing else: the layout viewport, and with it 100dvh, stays as it was.
  // So what the keyboard covers is the gap between the bottom of the two. A pinch zoom shrinks the visual viewport too, which is not a keyboard.
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!keyboardAware || !viewport) return;
    const read = () => {
      const covered = window.innerHeight - viewport.height - viewport.offsetTop;
      setMeasured(viewport.scale > 1.05 || covered < 100 ? 0 : Math.round(covered));
    };
    read();
    viewport.addEventListener("resize", read);
    viewport.addEventListener("scroll", read);
    return () => {
      viewport.removeEventListener("resize", read);
      viewport.removeEventListener("scroll", read);
      setMeasured(0);
    };
  }, [keyboardAware]);

  const keyboard = Math.max(0, keyboardInset ?? (keyboardAware ? measured : 0));
  return (
    <div
      data-slot="screen-frame"
      data-scroll={scroll}
      data-keyboard={keyboard > 0 || undefined}
      style={
        {
          // The keyboard covers the home indicator, so the bottom needs the keyboard or the safe area, not both.
          "--sf-bottom": keyboard > 0 ? `${keyboard}px` : "env(safe-area-inset-bottom, 0px)",
          ...style,
        } as CSSProperties
      }
      className={cn(
        // Sized to the dynamic viewport, so the browser bar never hides the footer. The padding keeps clear of the notch and the rounded corners, and of the keyboard.
        "flex h-dvh min-h-0 w-full flex-col overflow-hidden overscroll-none bg-background pt-[env(safe-area-inset-top,0px)] pr-[env(safe-area-inset-right,0px)] pb-(--sf-bottom) pl-[env(safe-area-inset-left,0px)] text-foreground",
        "transition-[padding] duration-200 ease-out motion-reduce:transition-none",
        className,
      )}
      {...props}
    >
      {header ? (
        <header data-slot="screen-frame-header" className={cn("shrink-0 border-b border-border bg-background", headerClassName)}>
          {header}
        </header>
      ) : null}
      <div
        data-slot="screen-frame-body"
        // The keyboard can scroll it: a scroll container with nothing to focus in it is out of reach for a keyboard in some browsers, so it takes focus itself.
        tabIndex={scroll === "body" ? 0 : undefined}
        // The single scroll container. min-h-0 is the line that makes a flex child able to shrink below its content, which is what lets it scroll instead of pushing the footer off the screen.
        className={cn(
          "min-h-0 min-w-0 flex-1 outline-none",
          scroll === "body" ? "relative overflow-y-auto overscroll-contain focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset" : "flex overflow-hidden",
          bodyClassName,
        )}
      >
        {children}
      </div>
      {footer ? (
        <footer data-slot="screen-frame-footer" className={cn("shrink-0 border-t border-border bg-background", footerClassName)}>
          {footer}
        </footer>
      ) : null}
    </div>
  );
}
