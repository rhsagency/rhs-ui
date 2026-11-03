import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The space between sidebar and content: a named step, or any CSS length such as `2.5rem`. */
export type SidebarLayoutGap = "none" | "sm" | "md" | "lg" | (string & {});

export interface SidebarLayoutProps extends Omit<ComponentProps<"div">, "children"> {
  /** The sidebar: a nav, filters, a table of contents. */
  sidebar: ReactNode;
  /** The main content, which takes all the room the sidebar leaves. */
  children: ReactNode;
  /** Which side the sidebar sits on in the wide layout. The DOM follows it, so keyboard and reading order always match what people see: a start sidebar comes first, an end sidebar last. Default `start`. */
  side?: "start" | "end";
  /** The width the sidebar prefers, any CSS length. It fills its own line once it wraps. Default `18rem`. */
  sidebarWidth?: string;
  /** The least share of the row the content may have, as a percentage. Below it the sidebar wraps onto its own line. Default `60%`. */
  contentMin?: string;
  /** The space between the two, and between the lines once they wrap. Default `md` (2rem). */
  gap?: SidebarLayoutGap;
  /** Pin the sidebar while the content scrolls. `true` pins it 1rem from the top; pass a length such as `5rem` (or `var(--header-height)`) to clear a sticky header. It only pins while the two sit side by side, and it scrolls inside itself when it is taller than the screen. Pinning makes the layout a size container, so it fills its parent instead of shrinking to its content. */
  sticky?: boolean | string;
  /** Classes for the sidebar's own wrapper, for a border or a background. */
  sidebarClassName?: string;
  /** Classes for the content's own wrapper. */
  contentClassName?: string;
}

const GAPS: Record<string, string> = { none: "0px", sm: "1rem", md: "2rem", lg: "3rem" };

/** "60%" becomes 0.6. Anything that is not a percentage between 0 and 100 falls back to the default share. */
function shareOf(contentMin: string): number {
  const percent = /^\s*(\d+(?:\.\d+)?)%\s*$/.exec(contentMin)?.[1];
  const share = percent === undefined ? Number.NaN : Number(percent) / 100;
  return share > 0 && share < 1 ? share : 0.6;
}

/**
 * A sidebar beside its content that wraps by itself, with no breakpoints. The
 * sidebar keeps the width it prefers and the content takes the rest, until the
 * content would fall below its minimum share of the row: then the sidebar
 * wraps onto its own line and fills it. The switch reads the space the layout
 * has, not the viewport, so the same markup works in a page, a dialog or a
 * narrow card. The DOM order is the order of the wide layout (a start sidebar
 * first, an end sidebar last), so keyboard order and reading order agree. With
 * `sticky` the sidebar stays under a header offset while the content scrolls.
 */
export function SidebarLayout({
  sidebar,
  children,
  side = "start",
  sidebarWidth = "18rem",
  contentMin = "60%",
  gap = "md",
  sticky = false,
  sidebarClassName,
  contentClassName,
  className,
  style,
  ...props
}: SidebarLayoutProps) {
  const pinned = sticky !== false;
  const sidebarNode = (
    <div
      data-slot="sidebar-layout-sidebar"
      className={cn(
        "min-w-0 grow basis-(--sl-sidebar)",
        // Pinned only while the row is wide: the arithmetic of the wrap, done in CSS. Once the sidebar wraps, `top` falls out of reach and the height limit lifts.
        // The 4px of padding (taken back by the margin) keep the focus rings of its links from being clipped by its own scrolling.
        pinned &&
          "sticky -m-1 basis-[calc(var(--sl-sidebar)+0.5rem)] overflow-y-auto overscroll-contain p-1 top-[clamp(-9999px,calc(var(--sl-room)*1000),var(--sl-top))] max-h-[clamp(calc(100dvh-var(--sl-top)-1rem),calc(var(--sl-room)*-1000),99999px)]",
        sidebarClassName,
      )}
    >
      {sidebar}
    </div>
  );
  const contentNode = (
    <div data-slot="sidebar-layout-content" className={cn("min-w-(--sl-min) grow-[999] basis-0", contentClassName)}>
      {children}
    </div>
  );
  return (
    <div
      data-slot="sidebar-layout"
      data-side={side}
      data-sticky={pinned || undefined}
      style={
        {
          "--sl-sidebar": sidebarWidth,
          "--sl-min": contentMin,
          "--sl-gap": GAPS[gap] ?? gap,
          "--sl-top": typeof sticky === "string" ? sticky : "1rem",
          "--sl-share": shareOf(contentMin),
          // How much wider the row is than the width where the sidebar wraps: (sidebar + gap) / (1 - share). Negative while it is wrapped.
          "--sl-room": "calc(100cqw - (var(--sl-sidebar) + var(--sl-gap)) / (1 - var(--sl-share)))",
          ...style,
        } as CSSProperties
      }
      className={cn("flex flex-wrap gap-(--sl-gap)", pinned ? "@container w-full items-start" : "items-stretch", className)}
      {...props}
    >
      {side === "start" ? sidebarNode : contentNode}
      {side === "start" ? contentNode : sidebarNode}
    </div>
  );
}
