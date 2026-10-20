import type { ComponentProps, ReactNode } from "react";

import { CopyableCode } from "@rhs-ui/primitives/inline-code/copyable";
import { breakable, codeChip, codeSize, type InlineCodeSize } from "@rhs-ui/primitives/inline-code/shared";
import { cn } from "@/lib/utils";

interface InlineCodeBase {
  /** The code. A long string breaks after slashes, dots and underscores instead of overflowing. */
  children: ReactNode;
  /** What to copy when it differs from what is shown, or when the children are not plain text. */
  value?: string;
  /** Relative to the surrounding text: 0.8, 0.875 or 0.95 of it. */
  size?: InlineCodeSize;
}

export type InlineCodeProps = InlineCodeBase &
  (
    | (Omit<ComponentProps<"code">, "children"> & {
        /** A plain chip. The props you pass (id, data-*, aria-*, title, style, a ref) land on the `<code>` element. */
        copyable?: false;
      })
    | (Omit<ComponentProps<"button">, "children" | "value"> & {
        /** Make the chip a button that copies it. Its name is "Copy <the code>", and a check confirms the copy. The props you pass (id, data-*, aria-*, title, style, a ref, a click handler) land on that button, not on a `<code>`. */
        copyable: true;
      })
  );

/**
 * Code inside a sentence: a quiet mono chip with a muted fill and a hairline,
 * a little smaller than the text around it so it sits comfortably in body
 * copy, headings, table cells and callouts. It wraps cleanly (long paths
 * break at slashes, dots and underscores, and every line of a wrapped chip
 * keeps its border), and with `copyable` it becomes a button that copies it.
 * Your other props go to the element you get: the `<code>`, or the button when
 * it is copyable.
 */
export function InlineCode({ children, copyable = false, value, size = "md", className, ...props }: InlineCodeProps) {
  const text = value ?? (typeof children === "string" ? children : undefined);
  if (copyable && text) {
    return (
      <CopyableCode text={text} size={size} className={className} {...(props as Omit<ComponentProps<"button">, "children" | "value">)}>
        {children}
      </CopyableCode>
    );
  }
  return (
    <code data-slot="inline-code" className={cn(codeChip, codeSize[size], className)} {...(props as Omit<ComponentProps<"code">, "children">)}>
      {breakable(children)}
    </code>
  );
}
