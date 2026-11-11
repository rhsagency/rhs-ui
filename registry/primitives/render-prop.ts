import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

/*
 * RHS UI's primitives are Radix parts, and the shadcn CLI installs into Radix and Base UI projects alike. In a Base UI
 * project (a `base-` style in components.json, the default since shadcn 4) the CLI rewrites every asChild attribute in
 * the files it installs: onto Base UI's `render` prop when the child is an element, and away altogether when it is not,
 * which leaves a button around a button. So the primitives take `render` too, and asChild without an element child is
 * written as a spread, which the CLI leaves alone.
 */

/**
 * asChild as a spread, for a part whose child is not an element: `<TooltipTrigger {...AS_CHILD}>{children}</TooltipTrigger>`.
 * The CLI rewrites an attribute, never a spread, so this reaches the part as written in every project.
 */
export const AS_CHILD = { asChild: true } as const;

/** Base UI's way of saying asChild, which the shadcn CLI writes into a Base UI project in its place. */
export type RenderProp = {
  /** The element to render as, with this part's children inside it: asChild, with that element as the child. */
  render?: ReactElement;
  /** Base UI's flag for a button rendered as another element. The element itself tells the browser here, so it is ignored. */
  nativeButton?: boolean;
};

/**
 * Turns `render` into asChild for a part: the render element becomes the child, holding the part's children (or its
 * own, when the part has none). Without `render` the props pass through unchanged.
 */
export function renderAs<P extends { asChild?: boolean; children?: ReactNode }>({ render, nativeButton: _nativeButton, ...props }: P & RenderProp): Omit<P, keyof RenderProp> {
  if (!isValidElement<{ children?: ReactNode }>(render)) return props;
  const children = props.children === undefined ? render.props.children : props.children;
  return { ...props, asChild: true, children: cloneElement(render, { children }) };
}
