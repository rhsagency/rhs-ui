import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** How the two halves share the width: `1:1`, or `3:2` which gives the task three parts and the picture two. */
export type SplitScreenRatio = "1:1" | "3:2";

/** What the media half becomes on a phone: gone, a short banner above the task, or a taller block above it. */
export type SplitScreenMobile = "hidden" | "banner" | "top";

export interface SplitScreenProps extends Omit<ComponentProps<"div">, "children"> {
  /** The task half: a sign-in form, an onboarding step, a waitlist form. It is the `main` landmark of the page, unless you set `mainAs`. */
  children: ReactNode;
  /** The media half: a picture, a brand panel, a quote. Leave it out and the task takes the whole width. */
  media?: ReactNode;
  /** Which side the media half sits on in the wide layout. Default `end`. */
  mediaSide?: "start" | "end";
  /** How the two halves share the width. Default `1:1`. */
  ratio?: SplitScreenRatio;
  /** What the media half does on a phone. `banner` is a short strip above the task and `top` a taller block, both above it, so the form is never pushed below the fold. Default `hidden`. */
  mediaOnMobile?: SplitScreenMobile;
  /** Keep the media half pinned to the screen while a task taller than the screen scrolls past it. Turn it off and the media half grows as tall as the task. Default `true`. */
  stickyMedia?: boolean;
  /** A name for the media half. Without it the half is decorative and hidden from assistive technology; with it, it is a labelled complementary region and keeps its content readable. */
  mediaLabel?: string;
  /** The element of the task half: `main`, the landmark of the page, or `div` for a second layout on one page (a preview, a dialog), because a page has one `main`. Default `main`. */
  mainAs?: "main" | "div";
  /** The height of one screen, any CSS length. Each half is at least this tall. Default `100dvh`, the visible screen; give it a length when the layout lives in a box and not in the page. */
  height?: string;
  /** Classes for the media half, for its background, its padding and what it does with its content. */
  mediaClassName?: string;
  /** Classes for the column the task sits in, which is centred and `26rem` wide: use them to change its width or its padding. */
  taskClassName?: string;
}

/**
 * Written out whole, because Tailwind reads class names from the source. The
 * wide layout starts where the container is 48rem across.
 */
const COLUMNS: Record<SplitScreenRatio, Record<"start" | "end", string>> = {
  "1:1": { start: "@3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]", end: "@3xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" },
  "3:2": { start: "@3xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]", end: "@3xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]" },
};

const MOBILE: Record<SplitScreenMobile, string> = {
  hidden: "hidden @3xl:block",
  banner: "h-32 shrink-0 @3xl:h-auto @3xl:shrink",
  top: "h-56 shrink-0 @3xl:h-auto @3xl:shrink",
};

/**
 * The edge-to-edge layout of sign-in, onboarding and waitlist pages: a half
 * for the task and a half for a picture or a brand panel, each with its own
 * background and at least a screen tall, so there is no gutter and no card.
 * The media half stays pinned while a long task scrolls past it, or grows as
 * tall as the task. The layout reads the width of its own box, not the
 * window's (it is a size container), so it works in a page, a dialog or a
 * preview alike. On a phone the media half hides or becomes a banner above the
 * task, so the form is never pushed below the fold. The task half is the
 * `main` landmark and comes first in the document, whichever side the picture
 * sits on; the media half is decorative and `aria-hidden` unless you give it a
 * label.
 */
export function SplitScreen({ children, media, mediaSide = "end", ratio = "1:1", mediaOnMobile = "hidden", stickyMedia = true, mediaLabel, mainAs = "main", height = "100dvh", mediaClassName, taskClassName, className, style, ...props }: SplitScreenProps) {
  const Task = mainAs as "main";
  const mediaClasses = cn(
    "relative min-w-0 overflow-hidden bg-muted text-foreground",
    MOBILE[mediaOnMobile],
    // On a phone it sits above the task whichever side it is on; the document order stays task first.
    "order-first",
    mediaSide === "end" && "@3xl:order-none",
    stickyMedia ? "@3xl:sticky @3xl:top-0 @3xl:h-(--ss-height) @3xl:self-start" : "@3xl:min-h-(--ss-height)",
    mediaClassName,
  );
  return (
    <div data-slot="split-screen" data-media-side={mediaSide} data-ratio={ratio} data-media-on-mobile={mediaOnMobile} style={{ "--ss-height": height, ...style } as CSSProperties} className={cn("@container w-full bg-background text-foreground", className)} {...props}>
      {/* On a phone one column of flex: the picture, then the task taking the rest of the screen. From 48rem a grid of two. */}
      <div className={cn("flex min-h-(--ss-height) flex-col", media ? cn("@3xl:grid @3xl:min-h-0", COLUMNS[ratio][mediaSide]) : undefined)}>
        <Task data-slot="split-screen-task" className="flex min-w-0 flex-1 flex-col justify-center px-6 py-10 @lg:px-10 @3xl:min-h-(--ss-height) @3xl:px-14">
          <div className={cn("mx-auto w-full max-w-[26rem]", taskClassName)}>{children}</div>
        </Task>
        {media ? (
          mediaLabel ? (
            <aside data-slot="split-screen-media" aria-label={mediaLabel} className={mediaClasses}>
              {media}
            </aside>
          ) : (
            <div data-slot="split-screen-media" aria-hidden="true" inert className={mediaClasses}>
              {media}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
