import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/** How wide a Container may get: narrow 40rem, prose 46rem, default 72rem, wide 88rem, or full for no limit. */
export type ContainerSize = "narrow" | "prose" | "default" | "wide" | "full";

/** The elements a Container can be, so a page gets its landmarks without a wrapper around them. */
export type ContainerElement = "div" | "main" | "section" | "header" | "footer" | "nav" | "article" | "aside";

export interface ContainerProps extends ComponentProps<"div"> {
  /** The widest the container gets, gutters included: narrow 40rem, prose 46rem, default 72rem, wide 88rem, or full for no limit. */
  size?: ContainerSize;
  /** Side gutters that grow from 16px on a phone to 32px on a desktop, plus the safe-area inset. Turn them off on a Container inside another one, so the padding never doubles and only the width is capped. Default true. */
  padded?: boolean;
  /** The element to render. `main`, `section`, `header` and the rest give a page its landmarks with no extra wrapper. Default `div`. */
  as?: ContainerElement;
}

const SIZES: Record<ContainerSize, string> = {
  narrow: "max-w-[40rem]",
  prose: "max-w-[46rem]",
  default: "max-w-[72rem]",
  wide: "max-w-[88rem]",
  full: "max-w-none",
};

/**
 * The page-width wrapper: a centred column with a maximum width and gutters
 * that grow smoothly from 16px on a phone to 32px on a desktop, so content
 * never touches the edge of the screen. The gutters also add the safe-area
 * inset (the larger of the left and the right, so the column stays centred),
 * which keeps text clear of a notch in landscape. Pick one of five named
 * widths. `as` renders any landmark element, and a Container inside another
 * one with `padded={false}` only caps the width, so nesting never doubles the
 * padding. The gutter is also exposed as `--container-gutter` for anything
 * inside that has to line up with it.
 */
export function Container({ size = "default", padded = true, as = "div", className, ...props }: ContainerProps) {
  const Tag = as as "div";
  return (
    <Tag
      data-slot="container"
      data-size={size}
      data-padded={padded || undefined}
      className={cn(
        "mx-auto w-full [--container-gutter:clamp(1rem,0.385rem_+_2.525vw,2rem)] [--container-inset:max(env(safe-area-inset-left,0px),env(safe-area-inset-right,0px))]",
        SIZES[size],
        padded && "px-[calc(var(--container-gutter)+var(--container-inset))]",
        className,
      )}
      {...props}
    />
  );
}
