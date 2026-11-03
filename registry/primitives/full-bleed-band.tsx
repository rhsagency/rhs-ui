import type { ComponentProps } from "react";

import { Container, type ContainerSize } from "@rhs-ui/primitives/container";
import { cn } from "@/lib/utils";

/** How the band looks: the page background, a soft grey, or the page turned inside out (dark on a light page, light on a dark one). */
export type FullBleedBandTone = "default" | "muted" | "inverted";

/** The vertical padding: none, or a step of a scale that is a little tighter on a phone. */
export type FullBleedBandSize = "none" | "sm" | "md" | "lg" | "xl";

/** The elements a band (or the page wrapper) can be. */
export type FullBleedBandElement = "div" | "section" | "aside" | "header" | "footer" | "nav";

export interface FullBleedBandProps extends ComponentProps<"div"> {
  /** `default` is the page background, `muted` a soft grey, `inverted` swaps the semantic tokens for everything inside, so text, borders and buttons stay readable in both themes. Default `default`. */
  tone?: FullBleedBandTone;
  /** The vertical padding. Default `md`. */
  size?: FullBleedBandSize;
  /** A line along the top, the bottom or both (`true` is both) of the band. */
  bordered?: boolean | "top" | "bottom" | "both";
  /** How wide the content is, with the same names, gutters and limits as a Container, so it lines up with the rest of the page. Default `default` (72rem). */
  contentWidth?: ContainerSize;
  /** The element to render, for a landmark: `section`, `aside`, `footer`. Default `div`. */
  as?: FullBleedBandElement;
  /** Classes for the content column inside the band. */
  contentClassName?: string;
}

const PADDING: Record<FullBleedBandSize, string> = {
  none: "py-0",
  sm: "py-6 sm:py-8",
  md: "py-10 sm:py-14",
  lg: "py-14 sm:py-20",
  xl: "py-20 sm:py-28",
};

const TONES: Record<FullBleedBandTone, string> = {
  default: "bg-background text-foreground",
  muted: "bg-muted/50 text-foreground",
  // The page's own colours are kept under other names on the band, and swapped in for everything inside it (see SWAP).
  inverted: "bg-foreground text-background [--band-background:var(--background)] [--band-foreground:var(--foreground)]",
};

/** The tokens of the page turned inside out for the content of an inverted band. Mixed from the two page colours, so any theme works. */
const SWAP = [
  "[--background:var(--band-foreground)]",
  "[--foreground:var(--band-background)]",
  "[--card:color-mix(in_oklab,var(--band-foreground)_94%,var(--band-background))]",
  "[--card-foreground:var(--band-background)]",
  "[--primary:var(--band-background)]",
  "[--primary-foreground:var(--band-foreground)]",
  "[--secondary:color-mix(in_oklab,var(--band-foreground)_86%,var(--band-background))]",
  "[--secondary-foreground:var(--band-background)]",
  "[--muted:color-mix(in_oklab,var(--band-foreground)_86%,var(--band-background))]",
  "[--muted-foreground:color-mix(in_oklab,var(--band-background)_66%,var(--band-foreground))]",
  "[--accent:color-mix(in_oklab,var(--band-foreground)_86%,var(--band-background))]",
  "[--accent-foreground:var(--band-background)]",
  "[--border:color-mix(in_oklab,var(--band-foreground)_80%,var(--band-background))]",
  "[--input:color-mix(in_oklab,var(--band-foreground)_80%,var(--band-background))]",
  "[--ring:var(--band-background)]",
].join(" ");

function borderOf(bordered: FullBleedBandProps["bordered"]): string {
  if (bordered === "top") return "border-t";
  if (bordered === "bottom") return "border-b";
  return bordered ? "border-y" : "";
}

/**
 * A section background that runs edge to edge while its content stays on the
 * page column, with no horizontal scrollbar. Put the page in a
 * `FullBleedBand.Root` once: the band breaks out to the width of that wrapper
 * (a container query unit, `cqw`), not to `100vw`, so a classic vertical
 * scrollbar never adds a stray horizontal one. The band must sit in a column
 * that is centred in the wrapper, such as a Container. The content goes in a
 * Container of its own, so it keeps the page's gutters and width. An inverted
 * band swaps the semantic tokens for its children.
 */
export function FullBleedBand({
  tone = "default",
  size = "md",
  bordered = false,
  contentWidth = "default",
  as = "div",
  contentClassName,
  className,
  children,
  ...props
}: FullBleedBandProps) {
  const Tag = as as "div";
  return (
    <Tag
      data-slot="full-bleed-band"
      data-tone={tone}
      className={cn(
        // The break-out: the band is as wide as the page wrapper and starts at its edge, whatever the width of the column it sits in.
        "w-[100cqw] max-w-none ms-[calc(50%-50cqw)]",
        PADDING[size],
        TONES[tone],
        borderOf(bordered),
        tone === "inverted" ? "border-background/20" : "border-border",
        className,
      )}
      {...props}
    >
      <Container size={contentWidth} className={cn(tone === "inverted" && SWAP, contentClassName)}>
        {children}
      </Container>
    </Tag>
  );
}

export interface FullBleedRootProps extends ComponentProps<"div"> {
  /** The element to render. Default `div`. */
  as?: "div" | "main" | "article" | "section";
}

/**
 * Marks the page wrapper the bands break out to. It is the width a band is
 * as wide as, and it clips the sliver a band could overshoot by, so the page
 * can never scroll sideways. Mark it once, around the page.
 */
function FullBleedRoot({ as = "div", className, ...props }: FullBleedRootProps) {
  const Tag = as as "div";
  return <Tag data-slot="full-bleed-root" className={cn("@container w-full overflow-x-clip", className)} {...props} />;
}

FullBleedBand.Root = FullBleedRoot;
