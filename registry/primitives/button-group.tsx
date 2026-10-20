import { Children, cloneElement, isValidElement, type ComponentProps, type ReactNode } from "react";

import type { ButtonProps } from "@rhs-ui/primitives/button";
import { Separator } from "@rhs-ui/primitives/separator";
import { cn } from "@/lib/utils";

export type ButtonGroupSize = "sm" | "default" | "lg";

export interface ButtonGroupProps extends ComponentProps<"div"> {
  /** Lay the buttons out in a row (the default) or a column. */
  orientation?: "horizontal" | "vertical";
  /** Applied to every button in the group that sets no size of its own: a Button, or a Copy, Async, Download or Upload button. A child with `size="icon"` becomes the square button of this size. */
  size?: ButtonGroupSize;
  /** Applied to every button in the group that sets no variant of its own. */
  variant?: ButtonProps["variant"];
  /** Join the buttons into one bar. Off, they sit apart with a gap and keep their own radius. */
  attached?: boolean;
  /** Stack a row into a column below this breakpoint, so a long group never overflows a phone. */
  stackBelow?: "sm" | "md" | "lg";
}

/*
 * Joining is plain CSS on the direct children: the outer corners keep the radius, the inner edges
 * share one hairline (a 1px overlap), and the hovered or focused child lifts above its neighbours so
 * its border and ring are never covered. Flex items take a z-index without being positioned.
 *
 * Buttons that keep a live region or a hidden input beside them (Copy, Async, Download and Upload
 * button) render those first and mark them `sr-only`. The last child is therefore always a button,
 * and the first visible child is the first one with no visible sibling before it.
 *
 * The classes are written out whole, because Tailwind reads class names from the source text.
 */
const joined = {
  horizontal: [
    "[&>*]:rounded-none",
    "[&>*:not(.sr-only):not(:not(.sr-only)~*)]:rounded-s-md",
    "[&>*:last-child]:rounded-e-md",
    "[&>*:not(.sr-only):is(:not(.sr-only)~*)]:-ms-px",
  ].join(" "),
  vertical: [
    "flex-col",
    "[&>*]:w-full",
    "[&>*]:rounded-none",
    "[&>*:not(.sr-only):not(:not(.sr-only)~*)]:rounded-t-md",
    "[&>*:last-child]:rounded-b-md",
    "[&>*:not(.sr-only):is(:not(.sr-only)~*)]:-mt-px",
  ].join(" "),
};

// A button nudges 1px down while pressed; in a joined bar that would break the shared line.
const lift = "[&>*:hover]:z-[1] [&>*:focus-visible]:z-10 [&>*:active]:translate-y-0!";

const stackJoined = {
  sm: [
    "max-sm:flex",
    "max-sm:w-full",
    "max-sm:flex-col",
    "max-sm:[&>*]:w-full",
    "max-sm:[&>*:not(.sr-only):not(:not(.sr-only)~*)]:rounded-se-md",
    "max-sm:[&>*:not(.sr-only):not(:not(.sr-only)~*)]:rounded-es-none",
    "max-sm:[&>*:last-child]:rounded-es-md",
    "max-sm:[&>*:last-child]:rounded-se-none",
    "max-sm:[&>*:not(.sr-only):is(:not(.sr-only)~*)]:ms-0",
    "max-sm:[&>*:not(.sr-only):is(:not(.sr-only)~*)]:-mt-px",
  ].join(" "),
  md: [
    "max-md:flex",
    "max-md:w-full",
    "max-md:flex-col",
    "max-md:[&>*]:w-full",
    "max-md:[&>*:not(.sr-only):not(:not(.sr-only)~*)]:rounded-se-md",
    "max-md:[&>*:not(.sr-only):not(:not(.sr-only)~*)]:rounded-es-none",
    "max-md:[&>*:last-child]:rounded-es-md",
    "max-md:[&>*:last-child]:rounded-se-none",
    "max-md:[&>*:not(.sr-only):is(:not(.sr-only)~*)]:ms-0",
    "max-md:[&>*:not(.sr-only):is(:not(.sr-only)~*)]:-mt-px",
  ].join(" "),
  lg: [
    "max-lg:flex",
    "max-lg:w-full",
    "max-lg:flex-col",
    "max-lg:[&>*]:w-full",
    "max-lg:[&>*:not(.sr-only):not(:not(.sr-only)~*)]:rounded-se-md",
    "max-lg:[&>*:not(.sr-only):not(:not(.sr-only)~*)]:rounded-es-none",
    "max-lg:[&>*:last-child]:rounded-es-md",
    "max-lg:[&>*:last-child]:rounded-se-none",
    "max-lg:[&>*:not(.sr-only):is(:not(.sr-only)~*)]:ms-0",
    "max-lg:[&>*:not(.sr-only):is(:not(.sr-only)~*)]:-mt-px",
  ].join(" "),
};
const stackApart = {
  sm: "max-sm:flex max-sm:w-full max-sm:flex-col",
  md: "max-md:flex max-md:w-full max-md:flex-col",
  lg: "max-lg:flex max-lg:w-full max-lg:flex-col",
};

/** The square icon button that has the same height as a text button of the group's size. */
export const iconSizeOf: Record<ButtonGroupSize, "icon-sm" | "icon"> = { sm: "icon-sm", default: "icon", lg: "icon" };

/** A component in the row that is a button of some kind. Dividers and text segments are not, so they take no variant or size. */
function isButtonLike(type: unknown): boolean {
  return typeof type === "function" && type !== Separator && type !== ButtonGroupSeparator && type !== ButtonGroupText;
}

function withDefaults(child: ReactNode, size: ButtonGroupSize | undefined, variant: ButtonProps["variant"]): ReactNode {
  if (!isValidElement<ButtonProps>(child) || !isButtonLike(child.type)) return child;
  const own = child.props;
  const next: Partial<ButtonProps> = {};
  if (variant && own.variant === undefined) next.variant = variant;
  if (size) {
    if (own.size === undefined) next.size = size;
    else if (own.size === "icon" && size !== "default") {
      next.size = iconSizeOf[size];
      if (size === "lg") next.className = cn("size-11", own.className);
    }
  }
  return Object.keys(next).length ? cloneElement(child, next) : child;
}

/**
 * Related actions joined into one control: the outer corners round, the inner
 * edges share a single hairline, and the focused button lifts so its ring is
 * never clipped. It is for actions, so every button stays a tab stop; use
 * Toggle Group or Segmented Control when the buttons choose a value. Give the
 * group an `aria-label`. Children should be direct buttons: a `Button` (a Radix
 * trigger with `asChild` works too) or a Copy, Async, Download or Upload button,
 * and all of them take the group's `variant` and `size` unless they set their
 * own. A `ButtonGroupText` can sit in the row.
 */
export function ButtonGroup({ className, orientation = "horizontal", size, variant, attached = true, stackBelow, children, ...props }: ButtonGroupProps) {
  const vertical = orientation === "vertical";
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      data-size={size}
      data-variant={variant ?? undefined}
      data-stack={stackBelow && !vertical ? stackBelow : undefined}
      className={cn(
        "group/button-group inline-flex max-w-full items-stretch",
        vertical && "flex-col",
        attached ? [vertical ? joined.vertical : joined.horizontal, lift] : "gap-2",
        stackBelow && !vertical && (attached ? stackJoined[stackBelow] : stackApart[stackBelow]),
        className,
      )}
      {...props}
    >
      {Children.map(children, (child) => withDefaults(child, size, variant))}
    </div>
  );
}

/**
 * The divider between two solid buttons, where there is no border to share.
 * It runs across the group's direction and takes its tone from the group's
 * `variant`. Between outline buttons the shared border already does the job.
 */
export function ButtonGroupSeparator({ className, orientation = "vertical", ...props }: ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "relative z-[2] h-auto shrink-0 self-stretch bg-border",
        "group-data-[orientation=vertical]/button-group:h-px group-data-[orientation=vertical]/button-group:w-auto",
        // A row that stacks below a breakpoint turns its dividers around with it.
        "group-data-[stack=sm]/button-group:max-sm:h-px group-data-[stack=sm]/button-group:max-sm:w-auto",
        "group-data-[stack=md]/button-group:max-md:h-px group-data-[stack=md]/button-group:max-md:w-auto",
        "group-data-[stack=lg]/button-group:max-lg:h-px group-data-[stack=lg]/button-group:max-lg:w-auto",
        "group-data-[variant=default]/button-group:bg-primary-foreground/30 group-data-[variant=destructive]/button-group:bg-destructive-foreground/30 group-data-[variant=secondary]/button-group:bg-foreground/15",
        className,
      )}
      {...props}
    />
  );
}

/** A quiet, non-interactive segment for a figure or a short label next to the buttons: the count beside a Star button. */
export function ButtonGroupText({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="button-group-text"
      className={cn(
        // The radius is for a segment that stands alone or in a group that is not attached; an attached group squares it (and rounds the ends) itself.
        "inline-flex items-center justify-center gap-2 rounded-md border border-border bg-muted/60 px-3 text-sm font-medium whitespace-nowrap text-foreground tabular-nums",
        "group-data-[size=sm]/button-group:px-2.5 group-data-[size=sm]/button-group:text-[0.8125rem] group-data-[size=lg]/button-group:px-4 group-data-[size=lg]/button-group:text-[0.9375rem]",
        "[&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
