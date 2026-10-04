"use client";

import type { ReactNode } from "react";

import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";

export interface TermTooltipProps {
  /** The word in the text. */
  children: ReactNode;
  /** The term as a heading in the popover, if it differs from the text. */
  term?: string;
  definition: ReactNode;
  /** "Read more in the glossary". */
  href?: string;
}

/**
 * Jargon explained in place: the term gets a dotted underline and opens a
 * short definition on click, tap or Enter (not on hover alone, so it works
 * on phones and for keyboards), with a link to the glossary. For pricing
 * pages, docs and legal text.
 */
export function TermTooltip({ children, term, definition, href }: TermTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger className="cursor-help rounded-sm underline decoration-dotted decoration-from-font underline-offset-4 outline-none hover:decoration-solid focus-visible:ring-[3px] focus-visible:ring-ring/40">{children}</PopoverTrigger>
      <PopoverContent side="top" className="w-72 text-sm">
        <p className="font-medium">{term ?? children}</p>
        <div className="mt-1 leading-relaxed text-muted-foreground">{definition}</div>
        {href ? <a href={href} className="mt-2 inline-block text-xs font-medium underline underline-offset-4">Read more in the glossary</a> : null}
      </PopoverContent>
    </Popover>
  );
}
