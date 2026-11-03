import { ChromeOffsetsBar, ChromeOffsetsRoot, useChromeOffsets, type ChromeEdge, type ChromeOffsetsBarProps, type ChromeOffsetsRootProps, type ChromeSizes } from "./client";

export { useChromeOffsets };
export type { ChromeEdge, ChromeOffsetsBarProps, ChromeOffsetsRootProps, ChromeSizes };

/**
 * Measures your fixed header and bottom bar and publishes their sizes as CSS
 * variables for everything that sticks below them. Fixed bars change height
 * when a banner appears or a navigation wraps, and every sticky sidebar,
 * scroll margin and bottom sheet that used a hard-coded number is then wrong.
 * Wrap the page in `ChromeOffsets` and wrap each fixed bar in a
 * `ChromeOffsets.Top`, `.Bottom`, `.Start` or `.End` (or give the part the
 * classes that fix it and let it be the bar): the provider writes `--chrome-top`, `--chrome-bottom`,
 * `--chrome-start` and `--chrome-end` on its element, plain lengths in
 * pixels, so `calc(var(--chrome-top) + 1rem)` just works for a sticky
 * sidebar, a `scroll-margin-top`, an anchored heading or the padding of the
 * page. They are kept current with a ResizeObserver on each bar and never
 * with a scroll handler. Bars on one edge add up, so a banner and a header
 * above one another count as one. Without JavaScript the variables are the
 * `defaults` you set, which the server writes, so the first paint is already
 * right when the bars are at rest. The `useChromeOffsets` hook gives the same
 * sizes as numbers.
 */
export function ChromeOffsets(props: ChromeOffsetsRootProps) {
  return <ChromeOffsetsRoot {...props} />;
}

/** A bar fixed to the top of the screen. Its height is `--chrome-top`. */
function ChromeOffsetsTop(props: Omit<ChromeOffsetsBarProps, "edge">) {
  return <ChromeOffsetsBar edge="top" {...props} />;
}

/** A bar fixed to the bottom of the screen. Its height is `--chrome-bottom`. */
function ChromeOffsetsBottom(props: Omit<ChromeOffsetsBarProps, "edge">) {
  return <ChromeOffsetsBar edge="bottom" {...props} />;
}

/** A bar fixed to the start side, the left in left-to-right text: a rail or a drawer. Its width is `--chrome-start`. */
function ChromeOffsetsStart(props: Omit<ChromeOffsetsBarProps, "edge">) {
  return <ChromeOffsetsBar edge="start" {...props} />;
}

/** A bar fixed to the end side, the right in left-to-right text. Its width is `--chrome-end`. */
function ChromeOffsetsEnd(props: Omit<ChromeOffsetsBarProps, "edge">) {
  return <ChromeOffsetsBar edge="end" {...props} />;
}

ChromeOffsets.Top = ChromeOffsetsTop;
ChromeOffsets.Bottom = ChromeOffsetsBottom;
ChromeOffsets.Start = ChromeOffsetsStart;
ChromeOffsets.End = ChromeOffsetsEnd;
