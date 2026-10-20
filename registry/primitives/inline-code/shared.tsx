import { Fragment, type ReactNode } from "react";

export type InlineCodeSize = "sm" | "md" | "lg";

/** Sizes are relative to the surrounding text, so the chip fits a heading, a table cell and a callout alike. */
export const codeSize: Record<InlineCodeSize, string> = {
  sm: "text-[0.8em]",
  md: "text-[0.875em]",
  lg: "text-[0.95em]",
};

/** The look of the chip: a muted fill, a hairline, and padding in em so it scales with the text. */
export const codeChip = "rounded-[0.35em] border border-border bg-muted px-[0.4em] py-[0.1em] font-mono font-normal text-foreground [overflow-wrap:anywhere] box-decoration-clone";

/**
 * Lets a long string break after a slash, a dot or an underscore, so a path or
 * an identifier wraps at a sensible place instead of running out of its box.
 * `<wbr>` adds no character, so copying the text still gives the original.
 */
export function breakable(children: ReactNode): ReactNode {
  if (typeof children !== "string") return children;
  return children.split(/(?<=[/._])/).map((part, index) => (
    <Fragment key={`${index}-${part}`}>
      {index > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}
