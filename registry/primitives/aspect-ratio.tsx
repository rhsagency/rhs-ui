"use client";

import type { ComponentProps } from "react";
import { AspectRatio as AspectRatioPrimitive } from "radix-ui";

/**
 * A box that keeps its proportions at any width, for images, video and maps.
 * It reserves the space before the media loads, so nothing jumps.
 */
export function AspectRatio(props: ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}
